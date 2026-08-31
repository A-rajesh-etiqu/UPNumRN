import { z } from "zod";

export const subscriptionSchema = z.object({
    planId: z
        .string()
        .min(1, "Please select a subscription plan"),
});

export type SubscriptionFormData =
    z.infer<typeof subscriptionSchema>;