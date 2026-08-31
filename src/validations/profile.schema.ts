import { z } from "zod";

const today = new Date();

export const profileSchema = z.object({

    firstName: z
        .string()
        .trim()
        .min(2, "First name must contain at least 2 characters")
        .max(30, "First name cannot exceed 30 characters"),

    lastName: z
        .string()
        .trim()
        .min(1, "Last name is required")
        .max(30, "Last name cannot exceed 30 characters"),

    dateOfBirth: z
        .string()
        .min(1, "Please select your date of birth")
        .refine((value) => {
            const dob = new Date(value);
            return dob <= today;
        }, {
            message: "Date of birth cannot be in the future",
        }),

    gender: z.enum([
        "MALE",
        "FEMALE",
        "OTHER",
    ], {
        message: "Please select your gender",
    }),

    country: z
        .string()
        .trim()
        .min(2, "Please select your country"),

    state: z
        .string()
        .trim()
        .min(2, "Please select your state"),

    city: z
        .string()
        .trim()
        .min(2, "Please select your city"),

    language: z
        .string()
        .trim()
        .min(2, "Please select your preferred language"),

});

export type ProfileFormData =
    z.infer<typeof profileSchema>;