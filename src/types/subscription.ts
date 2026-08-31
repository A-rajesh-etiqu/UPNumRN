/**
 * ============================================================
 * UpNum Subscription Types
 * ============================================================
 */

export type PlanType =
    | "MONTHLY"
    | "LIFETIME";

export interface SubscriptionFeature {
    id: string;
    title: string;
}

export interface SubscriptionPlan {
    id: string;

    name: string;

    description: string;

    type: PlanType;

    currency: "INR";

    price: number;

    originalPrice?: number;

    durationMonths?: number;

    isPopular: boolean;

    isLifetimeOffer: boolean;

    badge?: string;

    features: SubscriptionFeature[];
}

export interface SubscribeRequest {
    planId: string;
}

export interface SubscribeResponse {
    success: boolean;

    message: string;

    subscription: SubscriptionPlan;

    expiresAt?: string | null;
}

export interface UserSubscription {
    planId: string;

    planName: string;

    active: boolean;

    expiresAt?: string | null;

    purchasedAt: string;
}