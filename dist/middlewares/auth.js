import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { AppError } from "./errorHandler";
export const authenticate = async (req, _res, next) => {
    const [scheme, token] = (req.headers.authorization ?? "").split(" ");
    if (scheme !== "Bearer" || !token) {
        return next(new AppError(401, "Access denied. No token provided."));
    }
    let decoded;
    try {
        decoded = jwt.verify(token, env.JWT_SECRET);
    }
    catch {
        return next(new AppError(401, "Invalid or expired token."));
    }
    try {
        // Re-read the user so bans and role changes take effect immediately.
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true, isBanned: true },
        });
        if (!user) {
            return next(new AppError(401, "Invalid or expired token."));
        }
        if (user.isBanned) {
            return next(new AppError(403, "Your account has been suspended"));
        }
        req.user = { id: user.id, role: user.role };
        next();
    }
    catch (err) {
        next(err);
    }
};
export const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError(403, "Forbidden: You do not have permission to access this resource"));
        }
        next();
    };
};
//# sourceMappingURL=auth.js.map