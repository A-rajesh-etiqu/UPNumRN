import { Platform } from "react-native";
import { ENV } from "../config/env";

/**
 * Razorpay Keys directly encoded in the code
 */
export const RAZORPAY_CONFIG = {
    KEY_ID: "rzp_test_TXBKZAMQy09pqs",
    KEY_SECRET: "Cd0Ue22JwQeslMtEjhtYSUro",
};

/**
 * Dynamically loads Razorpay checkout.js script for web environments.
 */
export function loadRazorpayCheckoutScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (Platform.OS !== "web") {
            resolve(false);
            return;
        }

        const g = globalThis as any;
        if (typeof g.window !== "undefined" && (g.window.Razorpay || g.Razorpay)) {
            resolve(true);
            return;
        }

        if (typeof g.document === "undefined") {
            resolve(false);
            return;
        }

        const existingScript = g.document.getElementById("razorpay-checkout-script");
        if (existingScript) {
            if (g.window?.Razorpay || g.Razorpay) {
                resolve(true);
            } else {
                existingScript.addEventListener("load", () => resolve(true));
                existingScript.addEventListener("error", () => resolve(false));
            }
            return;
        }

        const script = g.document.createElement("script");
        script.id = "razorpay-checkout-script";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => {
            console.error("Failed to load Razorpay checkout script");
            resolve(false);
        };
        g.document.body.appendChild(script);
    });
}

/**
 * Direct Razorpay checkout options interface
 */
export interface DirectCheckoutOptions {
    amount: number; // in Rupees (e.g. 50)
    planName: string;
    user: {
        id?: string;
        name?: string;
        email?: string;
        mobile?: string;
    };
    onSuccess: (paymentId: string) => void;
    onError?: (err: any) => void;
    onClose?: () => void;
}

/**
 * Launch Razorpay checkout directly in the browser using encoded keys
 */
export async function launchDirectRazorpayCheckout(options: DirectCheckoutOptions): Promise<void> {
    const g = globalThis as any;

    if (Platform.OS === "web") {
        const loaded = await loadRazorpayCheckoutScript();
        const RazorpayConstructor = g.window?.Razorpay || g.Razorpay;

        if (!loaded && !RazorpayConstructor) {
            throw new Error("Razorpay Checkout SDK is not available. Please check your internet connection.");
        }

        const amountInPaise = Math.round(options.amount * 100);

        const rzpOptions = {
            key: RAZORPAY_CONFIG.KEY_ID,
            amount: amountInPaise,
            currency: "INR",
            name: "UpNum",
            description: `${options.planName} Subscription`,
            image: "https://upnum.etiquetteai.in/favicon.ico",
            handler: function (response: any) {
                const paymentId = response?.razorpay_payment_id || `pay_${Date.now()}`;
                options.onSuccess(paymentId);
            },
            prefill: {
                name: options.user.name || "",
                email: options.user.email || "",
                contact: options.user.mobile || "",
            },
            theme: {
                color: "#4F46E5",
            },
            modal: {
                ondismiss: function () {
                    if (options.onClose) options.onClose();
                },
            },
        };

        const rzp = new RazorpayConstructor(rzpOptions);
        rzp.on("payment.failed", function (response: any) {
            if (options.onError) {
                options.onError(response.error);
            }
        });
        rzp.open();
    } else {
        throw new Error("Razorpay Web Checkout is currently only available on web browsers.");
    }
}
