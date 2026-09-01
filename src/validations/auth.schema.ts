import { z } from "zod";

export const loginSchema = z.object({
    mobile: z
        .string()
        .regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters"),
});

export type LoginForm = z.infer<typeof loginSchema>;