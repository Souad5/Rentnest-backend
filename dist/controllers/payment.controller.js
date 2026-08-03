import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// 1. Create Stripe Payment Intent for APPROVED Rental Request
export const createPaymentIntent = async (req, res, next) => {
    try {
        const { rentalRequestId } = req.body;
        const userId = req.user.id;
        // Fetch the rental request and property details
        const rental = await prisma.rentalRequest.findUnique({
            where: { id: rentalRequestId },
            include: { property: true },
        });
        if (!rental || rental.tenantId !== userId) {
            throw new AppError(404, "Rental request not found or unauthorized");
        }
        if (rental.status !== "APPROVED") {
            throw new AppError(400, "Payments can only be generated for APPROVED rental requests");
        }
        // Amount in cents (e.g., $500.00 = 50000 cents)
        const amountInCents = Math.round(rental.property.price * 100);
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
        res.status(200).json({
            success: true,
            message: "Payment intent created successfully",
            data: {
                clientSecret: paymentIntent.client_secret,
                transactionId: paymentIntent.id,
                amount: rental.property.price,
                currency: "usd",
            },
        });
    }
    catch (error) {
        next(error);
    }
};
// 2. Confirm Payment and Update Rental Status to ACTIVE
export const confirmPayment = async (req, res, next) => {
    try {
        const { paymentIntentId } = req.body;
        let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        // 🛠️ Auto-confirm in non-production environments if payment method hasn't been attached yet
        if (paymentIntent.status === "requires_payment_method" &&
            process.env.NODE_ENV !== "production") {
            paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: "pm_card_visa",
            });
        }
        if (paymentIntent.status !== "succeeded") {
            throw new AppError(400, `Payment not completed. Status: ${paymentIntent.status}`);
        }
        // Update payment status in database
        const payment = await prisma.payment.update({
            where: { transactionId: paymentIntentId },
            data: {
                status: "COMPLETED",
                paidAt: new Date(),
            },
        });
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
    }
    catch (error) {
        next(error);
    }
};
// 3. Get User Payment History
export const getUserPayments = async (req, res, next) => {
    try {
        const userId = req.user.id;
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
    }
    catch (error) {
        next(error);
    }
};
// 4. Get Payment Details by ID
export const getPaymentById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;
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
            throw new AppError(403, "You do not have permission to view this payment record");
        }
        res.status(200).json({
            success: true,
            message: "Payment details retrieved successfully",
            data: payment,
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=payment.controller.js.map