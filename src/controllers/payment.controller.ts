import type { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { AppError } from "../middlewares/errorHandler";
import type { AuthRequest } from "../middlewares/auth";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// 1. Create Stripe Payment Intent for APPROVED Rental Request
export const createPaymentIntent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { rentalRequestId } = req.body;
    const userId = req.user!.id;

    // Fetch the rental request and property details
    const rental = await prisma.rentalRequest.findUnique({
      where: { id: rentalRequestId },
      include: { property: true },
    });

    if (!rental || rental.tenantId !== userId) {
      throw new AppError(404, "Rental request not found or unauthorized");
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { rentalRequestId },
    });

    // Never overwrite a settled payment (that would orphan the completed
    // PaymentIntent and charge the tenant twice).
    if (existingPayment?.status === "COMPLETED") {
      throw new AppError(400, "This rental has already been paid");
    }

    if (rental.status !== "APPROVED") {
      throw new AppError(
        400,
        "Payments can only be generated for APPROVED rental requests",
      );
    }

    // Amount in cents (e.g., $500.00 = 50000 cents)
    const amountInCents = Math.round(rental.property.price * 100);

    // Idempotent session handling: never mint a second PaymentIntent while a
    // usable one exists for this rental. Re-issuing a new secret here orphans
    // the previous one and makes the DB row point away from a form that is
    // still open (symptoms: confirm -> 404 "Payment record not found" or
    // payment_intent_unexpected_state on re-submit).
    if (existingPayment && existingPayment.status === "PENDING") {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          existingPayment.transactionId,
        );

        if (existingIntent.status === "succeeded") {
          // Already paid per Stripe: settle through the same verified,
          // idempotent path used by the webhook, and tell the client.
          await applySucceededPayment(existingIntent.id, {
            rentalRequestId,
            userId,
            amount: existingIntent.amount / 100,
          });
          return res.status(200).json({
            success: true,
            message: "Payment already completed for this rental request.",
            data: {
              transactionId: existingIntent.id,
              amount: rental.property.price,
              currency: "usd",
              alreadyPaid: true,
            },
          });
        }

        if (
          [
            "requires_payment_method",
            "requires_confirmation",
            "requires_action",
            "processing",
          ].includes(existingIntent.status ?? "")
        ) {
          // Resume the existing session instead of creating a duplicate.
          return res.status(200).json({
            success: true,
            message: "Existing payment session resumed",
            data: {
              clientSecret: existingIntent.client_secret as string,
              transactionId: existingIntent.id,
              amount: rental.property.price,
              currency: "usd",
            },
          });
        }
        // canceled or any other terminal state -> fall through and create fresh.
      } catch {
        // Could not retrieve the stored intent (deleted/invalid) -> create fresh.
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // 👈 Add this line to prevent redirect requirements
      },
      metadata: {
        rentalRequestId,
        userId,
      },
    });

    // Save or update the pending transaction record (never a COMPLETED one —
    // guarded above).
    await prisma.payment.upsert({
      where: { rentalRequestId },
      update: {
        transactionId: paymentIntent.id,
        status: "PENDING",
        amount: rental.property.price,
        paidAt: null,
      },
      create: {
        rentalRequestId,
        userId,
        amount: rental.property.price,
        transactionId: paymentIntent.id,
        provider: "STRIPE",
        status: "PENDING",
      },
    });

    res.status(201).json({
      success: true,
      message: "Payment intent created successfully",
      data: {
        clientSecret: paymentIntent.client_secret,
        transactionId: paymentIntent.id,
        amount: rental.property.price,
        currency: "usd",
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Confirm Payment and Update Rental Status to ACTIVE
export const confirmPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { paymentIntentId } = req.body as { paymentIntentId: string };
    const userId = req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch {
      throw new AppError(404, "Payment not found");
    }

    const rentalRequestId = paymentIntent.metadata?.["rentalRequestId"];
    const intentUserId = paymentIntent.metadata?.["userId"];

    if (!rentalRequestId || !intentUserId) {
      throw new AppError(400, "This payment is not linked to a RentNest rental");
    }

    // Authorisation BEFORE any DB write: the caller must be the tenant who
    // created the intent (or an admin), and the rental must belong to them.
    const rental = await prisma.rentalRequest.findUnique({
      where: { id: rentalRequestId },
      select: { id: true, tenantId: true, status: true },
    });

    if (!rental) {
      throw new AppError(404, "Rental request not found");
    }
    if (!isAdmin && (intentUserId !== userId || rental.tenantId !== userId)) {
      throw new AppError(403, "You do not have permission to confirm this payment");
    }
    if (rental.tenantId !== intentUserId) {
      throw new AppError(400, "Payment does not match this rental request");
    }
    if (rental.status !== "APPROVED" && rental.status !== "ACTIVE") {
      throw new AppError(
        400,
        `Payments can only be confirmed for approved rentals (current status: ${rental.status})`,
      );
    }

    if (paymentIntent.status !== "succeeded") {
      throw new AppError(400, `Payment not completed. Status: ${paymentIntent.status}`);
    }

    // Settle through the same idempotent transaction the webhook uses.
    await applySucceededPayment(paymentIntent.id, {
      rentalRequestId,
      userId: rental.tenantId,
      amount: paymentIntent.amount / 100,
    });

    const payment = await prisma.payment.findUnique({
      where: { transactionId: paymentIntent.id },
    });

    if (!payment) {
      // Another payment already settled this rental under a different intent.
      throw new AppError(409, "This rental has already been paid with a different payment");
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully. Rental status is now ACTIVE!",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get User Payment History
export const getUserPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id;
    const payments = await prisma.payment.findMany({
      where: { userId },
      include: {
        rentalRequest: {
          include: { property: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Payment history retrieved successfully",
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Payment Details by ID
export const getPaymentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        rentalRequest: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true,
                landlordId: true,
              },
            },
            tenant: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError(404, "Payment record not found");
    }

    // Access check: Only the tenant who paid, the landlord receiving rent, or an Admin
    const isPayer = payment.userId === userId;
    const isLandlord = payment.rentalRequest?.property?.landlordId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isPayer && !isLandlord && !isAdmin) {
      throw new AppError(
        403,
        "You do not have permission to view this payment record",
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment details retrieved successfully",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// STRIPE WEBHOOK (source of truth for status)
// ==========================================

// Mark an APPROVED rental's payment as COMPLETED and the rental ACTIVE,
// driven by a verified Stripe PaymentIntent. Idempotent (safe on retries).
async function applySucceededPayment(
  intentId: string,
  fallback: { rentalRequestId?: string | undefined; userId?: string | undefined; amount?: number | undefined },
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    let payment = await tx.payment.findUnique({
      where: { transactionId: intentId },
    });

    if (!payment) {
      // Payment row may not exist yet (e.g. intent re-issued, or created
      // outside the app flow). Only create one when Stripe metadata
      // identifies the rental + user.
      const { rentalRequestId, userId } = fallback;
      if (!rentalRequestId || !userId) return;
      const rental = await tx.rentalRequest.findUnique({
        where: { id: rentalRequestId },
        include: { property: { select: { price: true } }, payment: true },
      });
      if (!rental) return;
      if (rental.payment?.status === "COMPLETED") return; // already settled by another intent

      const amount = fallback.amount ?? rental.property.price;
      payment = rental.payment
        ? await tx.payment.update({
            where: { id: rental.payment.id },
            data: { transactionId: intentId, amount, status: "COMPLETED", paidAt: new Date() },
          })
        : await tx.payment.create({
            data: {
              rentalRequestId,
              userId,
              amount,
              transactionId: intentId,
              provider: "STRIPE",
              status: "COMPLETED",
              paidAt: new Date(),
            },
          });
    } else if (payment.status === "COMPLETED") {
      return; // already handled — safe against Stripe retries
    } else {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "COMPLETED", paidAt: new Date() },
      });
    }

    // Only an APPROVED rental becomes ACTIVE (never resurrect REJECTED/COMPLETED).
    await tx.rentalRequest.updateMany({
      where: { id: payment.rentalRequestId, status: "APPROVED" },
      data: { status: "ACTIVE" },
    });
  });
}

// Mark a payment as FAILED when Stripe reports the intent failed/canceled.
async function applyFailedPayment(intentId: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { transactionId: intentId, status: "PENDING" },
    data: { status: "FAILED" },
  });
}

export const stripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const signature = req.headers["stripe-signature"] as string | undefined;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!signature || !rawBody) {
    return res.status(400).send("Missing Stripe signature or body");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res
      .status(400)
      .send("Webhook signature verification failed");
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await applySucceededPayment(intent.id, {
          rentalRequestId: intent.metadata?.["rentalRequestId"],
          userId: intent.metadata?.["userId"],
          amount: intent.amount / 100,
        });
        break;
      }
      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await applyFailedPayment(intent.id);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        // `charge.refunded` also fires for partial refunds; only a full refund
        // (charge.refunded === true) voids the payment.
        if (!charge.refunded) {
          console.warn(
            `Stripe partial refund (${charge.amount_refunded}/${charge.amount}) for charge ${charge.id} — payment left COMPLETED`,
          );
        } else if (charge.payment_intent) {
          const intentId =
            typeof charge.payment_intent === "string"
              ? charge.payment_intent
              : charge.payment_intent.id;
          const result = await prisma.payment.updateMany({
            where: { transactionId: intentId, status: "COMPLETED" },
            data: { status: "FAILED" },
          });
          // Refunds need human follow-up (the rental stays ACTIVE until the
          // landlord/admin decides), so make them visible in the logs.
          console.warn(
            `Stripe refund received for PaymentIntent ${intentId}` +
              (result.count ? " — payment marked FAILED" : " — no matching completed payment"),
          );
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // Handlers are idempotent, so let Stripe retry with backoff instead of
    // silently dropping the event.
    console.error("Stripe webhook processing error:", err);
    return res.status(500).json({ received: false });
  }

  res.status(200).json({ received: true });
};
