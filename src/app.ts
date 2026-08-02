import express, { type Request, type Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import propertyRoutes from "./routes/property.routes";
import paymentRoutes from "./routes/payment.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/payments", paymentRoutes);

// Health Check
app.get("/", (req: Request, res: Response) => {
  res.json({ success: true, message: "RentNest API is running live 🚀" });
});

// Global Error Handler
app.use(errorHandler);

export default app;
