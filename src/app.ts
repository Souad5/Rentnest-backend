import express, { type Request, type Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import propertyRoutes from "./routes/property.routes";
import rentalRoutes from "./routes/rental.routes";
import landlordRoutes from "./routes/landlord.routes";
import paymentRoutes from "./routes/payment.routes";
import adminRoutes from "./routes/admin.routes";
import reviewRoutes from "./routes/review.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/landlord", landlordRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);

// Health Check
app.get("/", (req: Request, res: Response) => {
  res.json({ success: true, message: "RentNest API is running live 🚀" });
});

// Global Error Handler
app.use(errorHandler);

export default app;
