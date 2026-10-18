import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

// POST /newsletter
export const subscribeNewsletter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body as { email: string };

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "You're already subscribed",
        data: existing,
      });
    }

    try {
      const subscriber = await prisma.newsletterSubscriber.create({ data: { email } });
      return res.status(201).json({ success: true, message: "Subscribed", data: subscriber });
    } catch (err) {
      // Concurrent duplicate subscribe — treat as already subscribed.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { email } });
        return res.status(200).json({
          success: true,
          message: "You're already subscribed",
          data: subscriber,
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// POST /contact
export const submitContactMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, subject, message } = req.body as {
      name: string;
      email: string;
      subject: string;
      message: string;
    };

    const saved = await prisma.contactMessage.create({
      data: { name, email, subject, message },
      select: { id: true, createdAt: true },
    });

    res.status(201).json({
      success: true,
      message: "Thanks for reaching out! Our team will get back to you soon.",
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};
