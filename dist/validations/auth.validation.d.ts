import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        role: z.ZodEnum<{
            LANDLORD: "LANDLORD";
            TENANT: "TENANT";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const googleAuthSchema: z.ZodObject<{
    body: z.ZodObject<{
        credential: z.ZodString;
        role: z.ZodOptional<z.ZodEnum<{
            LANDLORD: "LANDLORD";
            TENANT: "TENANT";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateProfileSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        avatarUrl: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"">, z.ZodString]>>;
        bio: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const changePasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        currentPassword: z.ZodOptional<z.ZodString>;
        newPassword: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
//# sourceMappingURL=auth.validation.d.ts.map