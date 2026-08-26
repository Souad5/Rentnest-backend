import type { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";
import type { AuthRequest } from "../middlewares/auth";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

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
    const existingPayment = await prisma.payment.findUnique({
      where: { rentalRequestId },
    });

    if (existingPayment && existingPayment.status === "PENDING") {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          existingPayment.transactionId,
        );

        if (existingIntent.status === "succeeded") {
          // Already paid per Stripe: settle through the same verified,
          // idempotent path used by the webhook, and tell the client.
          await applySucceededPayment(existingIntent.id, undefined, undefined);
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

    // Save or update pending transaction record in Postgres
    const payment = await prisma.payment.upsert({
      where: { rentalRequestId },
      update: {
        transactionId: paymentIntent.id,
        status: "PENDING",
        amount: rental.property.price,
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
    const { paymentIntentId } = req.body;
    const userId = req.user!.id;

    // Retrieve live Payment Intent status directly from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new AppError(
        400,
        `Payment not completed. Status: ${paymentIntent.status}`,
      );
    }

    const rentalRequestId = paymentIntent.metadata?.rentalRequestId;

    if (!rentalRequestId) {
      throw new AppError(400, "Missing rentalRequestId in payment metadata");
    }

    // Upsert ensures record creation if it was missing from the DB
    const payment = await prisma.payment.upsert({
      where: { transactionId: paymentIntentId },
      update: {
        status: "COMPLETED",
        paidAt: new Date(),
      },
      create: {
        rentalRequestId,
        userId,
        amount: paymentIntent.amount / 100,
        transactionId: paymentIntentId,
        provider: "STRIPE",
        status: "COMPLETED",
        paidAt: new Date(),
      },
    });

    // Ownership check: only the tenant who initiated payment or an admin can confirm
    if (payment.userId !== userId && req.user!.role !== "ADMIN") {
      throw new AppError(
        403,
        "You do not have permission to confirm this payment",
      );
    }

    // Update rental status from APPROVED to ACTIVE
    await prisma.rentalRequest.update({
      where: { id: payment.rentalRequestId },
      data: { status: "ACTIVE" },
    });

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
// driven entirely by a verified Stripe event. Idempotent.
async function applySucceededPayment(
  intentId: string,
  rentalRequestId: string | undefined,
  userId: string | undefined,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    let payment = await tx.payment.findUnique({
      where: { transactionId: intentId },
    });

    if (!payment) {
      // Payment row may not exist yet (e.g. created outside the app flow).
      // Only create one when Stripe metadata identifies the rental + user.
      if (!rentalRequestId || !userId) return;
      const rental = await tx.rentalRequest.findUnique({
        where: { id: rentalRequestId },
        include: { property: true },
      });
      if (!rental) return;
      payment = await tx.payment.create({
        data: {
          rentalRequestId,
          userId,
          amount: rental.property ? rental.property.price : 0,
          transactionId: intentId,
          provider: "STRIPE",
          status: "COMPLETED",
          paidAt: new Date(),
        },
      });
    } else if (payment.status === "COMPLETED") {
      return; // already handled — safe against Stripe retries
    }

    if (payment.status !== "COMPLETED") {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "COMPLETED", paidAt: new Date() },
      });
    }

    const rental = await tx.rentalRequest.findUnique({
      where: { id: payment.rentalRequestId },
    });
    if (rental && rental.status !== "ACTIVE") {
      await tx.rentalRequest.update({
        where: { id: rental.id },
        data: { status: "ACTIVE" },
      });
    }
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
      process.env.STRIPE_WEBHOOK_SECRET as string,
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
        await applySucceededPayment(
          intent.id,
          intent.metadata?.rentalRequestId,
          intent.metadata?.userId,
        );
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
        if (charge.payment_intent) {
          const intentId =
            typeof charge.payment_intent === "string"
              ? charge.payment_intent
              : charge.payment_intent.id;
          await prisma.payment.updateMany({
            where: { transactionId: intentId, status: "COMPLETED" },
            data: { status: "FAILED" },
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // Acknowledge with 2xx so Stripe does not endlessly retry a bad payload,
    // but surface the error for monitoring.
    console.error("Stripe webhook processing error:", err);
    return res.status(200).json({ received: true, error: true });
  }

  res.status(200).json({ received: true });
};
