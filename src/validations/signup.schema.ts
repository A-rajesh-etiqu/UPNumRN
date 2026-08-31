import { z } from "zod";

export const signupSchema = z
    .object({
        fullName: z
            .string()
            .trim()
            .min(2, "Full name must be at least 2 characters")
            .max(100, "Full name cannot exceed 100 characters"),

        email: z
            .string()
            .trim()
            .email("Please enter a valid email address"),

        mobile: z
            .string()
            .regex(/^[6-9]\d{9}$/, "Please enter a valid Indian mobile number"),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[a-z]/, "Must contain a lowercase letter")
            .regex(/[0-9]/, "Must contain a number")
            .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain a special character"),

        confirmPassword: z.string(),

        userType: z.enum(["PERSONAL", "BUSINESS"]),

        businessName: z.string().optional(),

        referralCode: z.string().optional(),

        acceptTerms: z.boolean().refine((v) => v === true, {
            message: "You must accept the Terms & Privacy Policy",
        }),
    })
    .superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "Passwords do not match",
            });
        }
        if (data.userType === "BUSINESS" && (!data.businessName || data.businessName.trim() === "")) {
            ctx.addIssue({
                code: "custom",
                path: ["businessName"],
                message: "Business name is required for business accounts",
            });
        }
    });

export type SignupForm = z.infer<typeof signupSchema>;