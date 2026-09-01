import React from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { router, useLocalSearchParams } from "../navigation/RootNavigation";
import Ionicons from "react-native-vector-icons/Ionicons";

import {
    useAppTheme,
    Radius,
    Shadows,
    Spacing,
    Typography,
} from "../theme";

import { SUBSCRIPTION_PLANS } from "../constants/subscription";

export default function PaymentSuccessScreen() {
    const { planId } = useLocalSearchParams<{
        planId: string;
    }>();

    const { colors } = useAppTheme();

    const plan = SUBSCRIPTION_PLANS.find(
        (item) => item.id === planId
    );

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
                        {plan?.name}
                    </Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                        Amount
                    </Text>

                    <Text style={[styles.value, { color: colors.text }]}>
                        ₹{plan?.price}
                    </Text>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                        Billing
                    </Text>

                    <Text style={[styles.value, { color: colors.text }]}>
                        {plan?.type === "MONTHLY"
                            ? "Monthly"
                            : "Lifetime"}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={() => {
                        const { user, updateUser } = require("../store/auth.store").useAuthStore.getState();
                        if (user && user.subscription) {
                            updateUser({ ...user, subscription: { ...user.subscription, status: "ACTIVE" } });
                        }
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