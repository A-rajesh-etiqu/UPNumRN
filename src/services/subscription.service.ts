import {
    SubscribeRequest,
    SubscribeResponse,
    SubscriptionPlan,
} from "../types/subscription";

import { SUBSCRIPTION_PLANS } from "../constants/subscription";

class SubscriptionService {
    async subscribe(
        request: SubscribeRequest
    ): Promise<SubscribeResponse> {
        // Simulate payment processing
        await new Promise((resolve) =>
            setTimeout(resolve, 2000)
        );
        // const order =
        // createRazorpayOrder();


        // const payment =
        // await openRazorpay(order);


        // await verifyPayment(payment);

        const plan = SUBSCRIPTION_PLANS.find(
            (item) => item.id === request.planId
        );

        if (!plan) {
            throw new Error(
                "Selected subscription plan not found."
            );
        }

        let expiresAt: string | null = null;

        if (
            plan.type === "MONTHLY" &&
            plan.durationMonths
        ) {
            const expiry = new Date();

            expiry.setMonth(
                expiry.getMonth() +
                plan.durationMonths
            );

            expiresAt = expiry.toISOString();
        }

        return {
            success: true,

            message:
                "Subscription activated successfully.",

            subscription: plan,

            expiresAt,
        };
    }
}

export const subscriptionService =
    new SubscriptionService();

function createRazorpayOrder(plan: SubscriptionPlan | undefined) {
    throw new Error("Function not implemented.");
}
function openRazorpay(order: void) {
    throw new Error("Function not implemented.");
}

function verifyPayment(payment: void) {
    throw new Error("Function not implemented.");
}

