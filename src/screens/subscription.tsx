import React, { useMemo, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { router } from "../navigation/RootNavigation";

import PlanList from "../components/subscription/PlanList";
import SubscriptionSummary from "../components/subscription/SubscriptionSummary";

import { SUBSCRIPTION_PLANS } from "../constants/subscription";
import { useSubscription } from "../hooks/useSubscription";

import {
    Colors,
    Spacing,
    Typography,
} from "../theme";

export default function SubscriptionScreen() {
    const { subscribe, loading, error } =
        useSubscription();

    const [selectedPlanId, setSelectedPlanId] =
        useState(SUBSCRIPTION_PLANS[0].id);

    const selectedPlan = useMemo(
        () =>
            SUBSCRIPTION_PLANS.find(
                (item) =>
                    item.id === selectedPlanId
            )!,
        [selectedPlanId]
    );

    async function handleContinue() {
        const response = await subscribe({
            planId: selectedPlan.id,
        });

        if (!response) return;

        router.push({
            pathname: "/payment",
            params: {
                planId: selectedPlan.id,
            },
        });
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                    styles.content
                }
            >
                <Text style={styles.title}>
                    Choose Your Plan
                </Text>

                <Text style={styles.subtitle}>
                    Start free today.
                    Upgrade anytime.
                </Text>

                <PlanList
                    plans={SUBSCRIPTION_PLANS}
                    selectedPlanId={
                        selectedPlanId
                    }
                    onSelect={setSelectedPlanId}
                />

                <SubscriptionSummary
                    price={selectedPlan.price}
                />

                {!!error && (
                    <Text style={styles.error}>
                        {error}
                    </Text>
                )}

                <TouchableOpacity
                    disabled={loading}
                    style={[
                        styles.button,
                        loading &&
                        styles.buttonDisabled,
                    ]}
                    onPress={handleContinue}
                >
                    <Text style={styles.buttonText}>
                        {loading
                            ? "Processing..."
                            : "Continue to Payment"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity>
                    <Text style={styles.restore}>
                        Restore Purchase
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    content: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },

    title: {
        ...Typography.h2,
        color: Colors.text,
    },

    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginTop: 6,
        marginBottom: 24,
    },

    button: {
        marginTop: 10,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
    },

    buttonDisabled: {
        opacity: 0.7,
    },

    buttonText: {
        color: Colors.white,
        fontWeight: "700",
        fontSize: 17,
    },

    restore: {
        textAlign: "center",
        marginTop: 18,
        color: Colors.primary,
        fontWeight: "600",
    },

    error: {
        color: Colors.danger,
        marginBottom: 10,
        textAlign: "center",
    },
});