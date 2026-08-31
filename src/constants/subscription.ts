import { SubscriptionPlan } from "../types/subscription";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: "monthly",

        name: "Monthly",

        description: "Perfect for getting started",

        type: "MONTHLY",

        currency: "INR",

        price: 99,

        durationMonths: 1,

        isPopular: false,

        isLifetimeOffer: false,

        features: [
            {
                id: "1",
                title: "Unlimited Contacts",
            },
            {
                id: "2",
                title: "Smart Search",
            },
            {
                id: "3",
                title: "Cloud Backup",
            },
            {
                id: "4",
                title: "Premium Support",
            },
        ],
    },

    {
        id: "lifetime",

        name: "Lifetime Launch Offer",

        description:
            "One-time payment. Lifetime access.",

        type: "LIFETIME",

        currency: "INR",

        price: 999,

        originalPrice: 4999,

        badge: "80% OFF",

        isPopular: true,

        isLifetimeOffer: true,

        features: [
            {
                id: "1",
                title: "Everything in Monthly",
            },
            {
                id: "2",
                title: "Future Premium Features",
            },
            {
                id: "3",
                title: "Lifetime Updates",
            },
            {
                id: "4",
                title: "Priority Support",
            },
        ],
    },
];