import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
export const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return next(new AppError(401, "Access denied. No token provided."));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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