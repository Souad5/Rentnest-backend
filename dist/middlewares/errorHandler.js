import { ZodError } from "zod";
export class AppError extends Error {
    statusCode;
    message;
    errorDetails;
    constructor(statusCode, message, errorDetails = null) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errorDetails = errorDetails;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errorDetails = err.errorDetails || null;
    if (err instanceof ZodError) {
        statusCode = 400;
        message = "Validation Error";
        errorDetails = err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
        1;
    }
    res.status(statusCode).json({
        success: false,
        message,
        errorDetails,
    });
};
//# sourceMappingURL=errorHandler.js.map