import express, { Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/", (req: Request, res: Response) => {
  res.json({ success: true, message: "RentNest API is running live 🚀" });
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
