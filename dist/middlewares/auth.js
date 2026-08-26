import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { AppError } from "./errorHandler";
const prisma = new PrismaClient();
export const authenticate = async (req, res, next) => {
    const [scheme, token] = (req.headers.authorization ?? "").split(" ");
    if (scheme !== "Bearer" || !token) {
        return next(new AppError(401, "Access denied. No token provided."));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Check if user is banned
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { isBanned: true },
        });
        if (!user || user.isBanned) {
            return next(new AppError(403, "Your account has been suspended"));
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        next(new AppError(401, "Invalid or expired token."));
    }
};
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError(403, "Forbidden: You do not have permission to access this resource"));
        }
        next();
    };
};
//# sourceMappingURL=auth.js.map