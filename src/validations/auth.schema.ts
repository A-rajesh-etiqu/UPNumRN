import { z } from "zod";

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, "Email or Mobile is required"),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters"),
});

export type LoginForm = z.infer<typeof loginSchema>;