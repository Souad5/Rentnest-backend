import express, { type Request, type Response } from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import { env, allowedOrigins } from "./config/env";
import authRoutes from "./routes/auth.routes";
import propertyRoutes from "./routes/property.routes";
import rentalRoutes from "./routes/rental.routes";
import landlordRoutes from "./routes/landlord.routes";
import paymentRoutes from "./routes/payment.routes";
import adminRoutes from "./routes/admin.routes";
import reviewRoutes from "./routes/review.routes";
import miscRoutes from "./routes/misc.routes";
import aiRoutes from "./routes/ai.routes";
import { AppError, errorHandler } from "./middlewares/errorHandler";

const app = express();

// Behind Vercel / a reverse proxy: trust the first hop so rate limiting keys
// on the real client IP.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());

// CORS: restrict to CLIENT_URL origins when configured; allow all otherwise
// (local development).
const corsOptions: CorsOptions =
  allowedOrigins.length > 0
    ? {
        origin: (origin, callback) => {
          // Non-browser clients (curl, Stripe webhooks) send no Origin header.
          if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ""))) {
            return callback(null, true);
          }
          return callback(null, false);
        },
        credentials: true,
      }
    : { origin: true };
app.use(cors(corsOptions));

app.use(
  express.json({
    limit: "1mb",
    // rawBody is required for Stripe webhook signature verification.
    verify: (req, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/landlord", landlordRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", miscRoutes);

// Health Check
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "RentNest API is running",
    data: { environment: env.NODE_ENV },
  });
});

// Unknown API routes -> JSON 404 in the standard envelope
app.use((req: Request, _res: Response, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.path}`));
});

// Global Error Handler
app.use(errorHandler);

export default app;
