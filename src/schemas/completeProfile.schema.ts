import { z } from "zod";


export const completeProfileSchema = z.object({

    businessName: z
        .string()
        .trim()
        .min(3, "Business name must be at least 3 characters")
        .max(100, "Business name is too long"),

    businessType: z
        .string()
        .min(1, "Please select a business type"),

    gstNumber: z
        .string()
        .trim()
        .optional()
        .or(z.literal("")),

    panNumber: z
        .string()
        .trim()
        .optional()
        .or(z.literal("")),

    state: z
        .string()
        .min(1, "Please select a state"),

    city: z
        .string()
        .trim()
        .min(2, "City is required"),

    preferredLanguage: z
        .string()
        .min(1, "Please select a language"),

    profileImage: z
        .string()
        .optional(),

    businessLogo: z
        .string()
        .optional(),

});

export type CompleteProfileForm =
    z.infer<typeof completeProfileSchema>;