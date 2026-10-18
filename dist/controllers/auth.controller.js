import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { AppError } from "../middlewares/errorHandler";
// Public user shape — never includes password or googleId.
export const publicUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    isBanned: true,
    phone: true,
    avatarUrl: true,
    bio: true,
    authProvider: true,
    createdAt: true,
    updatedAt: true,
};
// Emails are normalised to lowercase by the validators, but accounts created
// before that normalisation may be stored mixed-case. Match those too.
const emailEquals = (email) => ({
    email: { equals: email, mode: "insensitive" },
});
const signToken = (user) => jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "7d" });
let googleClient = null;
const getGoogleClient = () => {
    if (!env.GOOGLE_CLIENT_ID)
        return null;
    googleClient ??= new OAuth2Client(env.GOOGLE_CLIENT_ID);
    return googleClient;
};
// 1. Register User (Tenant / Landlord)
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await prisma.user.findFirst({
            where: emailEquals(email),
            select: { id: true },
        });
        if (existingUser) {
            throw new AppError(409, "User with this email already exists");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                authProvider: "LOCAL",
            },
            select: publicUserSelect,
        });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: { user, token: signToken(user) },
        });
    }
    catch (error) {
        next(error);
    }
};
// 2. Login User
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const loginSelect = { ...publicUserSelect, password: true };
        const user = (await prisma.user.findUnique({ where: { email }, select: loginSelect })) ??
            (await prisma.user.findFirst({ where: emailEquals(email), select: loginSelect }));
        if (!user) {
            throw new AppError(401, "Invalid email or password");
        }
        if (!user.password) {
            throw new AppError(400, "This account uses Google sign-in");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError(401, "Invalid email or password");
        }
        if (user.isBanned) {
            throw new AppError(403, "Your account has been banned by an administrator");
        }
        const { password: _password, ...publicUser } = user;
        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            data: { user: publicUser, token: signToken(publicUser) },
        });
    }
    catch (error) {
        next(error);
    }
};
// 3. Google Sign-In (ID token from Google Identity Services)
export const googleAuth = async (req, res, next) => {
    try {
        const client = getGoogleClient();
        if (!client || !env.GOOGLE_CLIENT_ID) {
            throw new AppError(503, "Google sign-in is not configured");
        }
        const { credential, role } = req.body;
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        }
        catch {
            throw new AppError(401, "Invalid Google credential");
        }
        if (!payload?.sub || !payload.email) {
            throw new AppError(401, "Invalid Google credential");
        }
        if (payload.email_verified === false) {
            throw new AppError(401, "Your Google email address is not verified");
        }
        const email = payload.email.toLowerCase();
        const googleId = payload.sub;
        let user = await prisma.user.findUnique({
            where: { googleId },
            select: publicUserSelect,
        });
        if (!user) {
            const existing = (await prisma.user.findUnique({
                where: { email },
                select: { id: true, avatarUrl: true },
            })) ??
                (await prisma.user.findFirst({
                    where: emailEquals(email),
                    select: { id: true, avatarUrl: true },
                }));
            if (existing) {
                // Link Google to the existing account (same verified email).
                user = await prisma.user.update({
                    where: { id: existing.id },
                    data: {
                        googleId,
                        ...(!existing.avatarUrl && payload.picture ? { avatarUrl: payload.picture } : {}),
                    },
                    select: publicUserSelect,
                });
            }
            else {
                user = await prisma.user.create({
                    data: {
                        name: payload.name?.trim() || email.split("@")[0] || "RentNest user",
                        email,
                        password: null,
                        googleId,
                        authProvider: "GOOGLE",
                        role: role ?? "TENANT",
                        ...(payload.picture ? { avatarUrl: payload.picture } : {}),
                    },
                    select: publicUserSelect,
                });
            }
        }
        if (user.isBanned) {
            throw new AppError(403, "Your account has been banned by an administrator");
        }
        res.status(200).json({
            success: true,
            message: "Signed in with Google successfully",
            data: { user, token: signToken(user) },
        });
    }
    catch (error) {
        next(error);
    }
};
// 4. Get Currently Authenticated Profile (/api/auth/me)
export const getMe = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: publicUserSelect,
        });
        if (!user) {
            throw new AppError(404, "User not found");
        }
        res.status(200).json({
            success: true,
            message: "Current user profile fetched successfully",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
// 5. Update own profile ('' clears optional fields)
export const updateMe = async (req, res, next) => {
    try {
        const body = req.body;
        const clear = (v) => (v === "" ? null : v);
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(body.name !== undefined && { name: body.name }),
                ...(body.phone !== undefined && { phone: clear(body.phone) }),
                ...(body.avatarUrl !== undefined && { avatarUrl: clear(body.avatarUrl) }),
                ...(body.bio !== undefined && { bio: clear(body.bio) }),
            },
            select: publicUserSelect,
        });
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
// 6. Change password (Google-only accounts may set one without currentPassword)
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, password: true },
        });
        if (!user) {
            throw new AppError(404, "User not found");
        }
        if (user.password) {
            if (!currentPassword) {
                throw new AppError(400, "Current password is required", [
                    { field: "body.currentPassword", message: "Current password is required" },
                ]);
            }
            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) {
                // 400 (not 401) so clients don't treat it as an expired session.
                throw new AppError(400, "Current password is incorrect", [
                    { field: "body.currentPassword", message: "Current password is incorrect" },
                ]);
            }
            if (await bcrypt.compare(newPassword, user.password)) {
                throw new AppError(400, "New password must be different from the current password");
            }
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { password: await bcrypt.hash(newPassword, 10) },
        });
        res.status(200).json({
            success: true,
            message: user.password ? "Password changed successfully" : "Password set successfully",
            data: null,
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=auth.controller.js.map