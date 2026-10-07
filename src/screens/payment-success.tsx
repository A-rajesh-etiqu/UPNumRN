import React, { useEffect } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { router, useLocalSearchParams } from "../navigation/RootNavigation";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
    useAppTheme,
    Radius,
    Shadows,
    Spacing,
    Typography,
} from "../theme";

import { useAuthStore } from "../store/auth.store";
import { useSubscriptionStore } from "../store/subscription.store";
import apiClient from "../api/apiClient";
import { SUBSCRIPTION_PLANS } from "../constants/subscription";

function resolvePlanDetails(planId?: string) {
    const id = String(planId || '').toLowerCase();

    if (id === '1' || id === 'free') {
        return { id: '1', name: 'Free Tier', price: 0, billingCycle: 'MONTHLY' as const, isLifetimeOffer: false, type: 'Basic Features' };
    }
    if (id === '2' || id === 'standard' || id === 'monthly') {
        return { id: '2', name: 'Standard Plan', price: 50, billingCycle: 'MONTHLY' as const, isLifetimeOffer: false, type: 'Advanced Features' };
    }
    if (id === '3' || id === 'premium') {
        return { id: '3', name: 'Premium Plan', price: 150, billingCycle: 'MONTHLY' as const, isLifetimeOffer: false, type: 'All Features' };
    }
    if (id === '4' || id === 'lifetime') {
        return { id: '4', name: 'Lifetime Plan', price: 10, billingCycle: 'MONTHLY' as const, isLifetimeOffer: true, type: 'One-time Offer' };
    }

    return { id: id || '2', name: 'Standard Plan', price: 50, billingCycle: 'MONTHLY' as const, isLifetimeOffer: false, type: 'Advanced Features' };
}

export default function PaymentSuccessScreen() {
    const { planId, planName: paramPlanName, amount: paramAmount } = useLocalSearchParams<{
        planId: string;
        planName?: string;
        amount?: string;
    }>();

    const { colors } = useAppTheme();
    const fallbackPlan = resolvePlanDetails(planId);
    const finalPlanName = paramPlanName || fallbackPlan.name;
    const finalPrice = paramAmount !== undefined ? parseFloat(paramAmount) : fallbackPlan.price;

    useEffect(() => {
        const activeSub = {
            id: String(planId || fallbackPlan.id),
            name: finalPlanName,
            price: finalPrice,
            currency: "INR" as const,
            billingCycle: fallbackPlan.billingCycle,
            isLifetimeOffer: fallbackPlan.isLifetimeOffer,
            status: "ACTIVE",
        };

        // 1. Automatically Update Auth Store User Subscription
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
            useAuthStore.getState().updateUser({
                ...currentUser,
                subscription: activeSub,
            });
        }

        // 2. Automatically Update Subscription Store
        useSubscriptionStore.getState().setSubscription({
            planId: String(planId || fallbackPlan.id),
            planName: finalPlanName,
            active: true,
            purchasedAt: new Date().toISOString(),
            expiresAt: fallbackPlan.isLifetimeOffer
                ? null
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // 3. Persist Active Subscription to Backend Server Database
        if (currentUser?.id) {
            apiClient.post("/subscriptions/update", {
                userId: currentUser.id,
                planId: String(planId || fallbackPlan.id),
                status: "ACTIVE",
            }).catch(err => console.warn("Backend subscription update failed:", err));
        }
    }, [planId, finalPlanName, finalPrice]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Ionicons
                    name="checkmark-circle"
                    size={110}
                    color={colors.success}
                />

                <Text style={[styles.title, { color: colors.text }]}>
                    Subscription Activated
                </Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Welcome to UpNum Premium 🎉
                </Text>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                        Selected Plan
                    </Text>

                    <Text style={[styles.value, { color: colors.text }]}>
                        {finalPlanName}
                    </Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                        Amount
                    </Text>

                    <Text style={[styles.value, { color: colors.text }]}>
                        ₹{finalPrice}
                    </Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                        Billing
                    </Text>

                    <Text style={[styles.value, { color: colors.text }]}>
                        {fallbackPlan.isLifetimeOffer ? "One-time" : "Monthly"}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={() => {
                        router.replace("/tabs/dashboard");
                    }}
                >
                    <Text style={styles.buttonText}>
                        Continue to Dashboard
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing.xl,
    },
    title: {
        ...Typography.h2,
        marginTop: 24,
    },
    subtitle: {
        ...Typography.body,
        marginTop: 8,
        marginBottom: 30,
    },
    card: {
        width: "100%",
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        ...Shadows.md,
    },
    divider: {
        height: 1,
        marginVertical: 14,
    },
    label: {
        ...Typography.bodySmall,
    },
    value: {
        ...Typography.title,
        marginTop: 4,
    },
    button: {
        marginTop: 32,
        width: "100%",
        paddingVertical: 16,
        borderRadius: Radius.lg,
        alignItems: "center",
        ...Shadows.button,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
    },
});