import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

import { SubscriptionPlan } from "../../types/subscription";
import {
    Colors,
    Radius,
    Shadows,
    Spacing,
    Typography,
} from "../../theme";

interface Props {
    plan: SubscriptionPlan;
    selected: boolean;
    onPress: () => void;
}

export default function PlanCard({
    plan,
    selected,
    onPress,
}: Props) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={[
                styles.card,
                selected && styles.selectedCard,
            ]}
            onPress={onPress}
        >
            {plan.isPopular && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {plan.badge ?? "POPULAR"}
                    </Text>
                </View>
            )}

            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>
                        {plan.name}
                    </Text>

                    <Text style={styles.description}>
                        {plan.description}
                    </Text>
                </View>

                <Ionicons
                    name={
                        selected
                            ? "radio-button-on"
                            : "radio-button-off"
                    }
                    size={24}
                    color={Colors.primary}
                />
            </View>

            <View style={styles.priceRow}>
                <Text style={styles.price}>
                    ₹{plan.price}
                </Text>

                {plan.originalPrice && (
                    <Text style={styles.originalPrice}>
                        ₹{plan.originalPrice}
                    </Text>
                )}
            </View>

            {plan.durationMonths && (
                <Text style={styles.duration}>
                    {plan.durationMonths} Month
                </Text>
            )}

            <View style={styles.features}>
                {plan.features.map((feature) => (
                    <View
                        key={feature.id}
                        style={styles.feature}
                    >
                        <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color={Colors.success}
                        />

                        <Text
                            style={styles.featureText}
                        >
                            {feature.title}
                        </Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,

        borderRadius: Radius.lg,

        padding: Spacing.lg,

        borderWidth: 2,

        borderColor: Colors.border,

        marginBottom: Spacing.lg,

        ...Shadows.md,
    },

    selectedCard: {
        borderColor: Colors.primary,
    },

    badge: {
        position: "absolute",

        right: 15,

        top: -10,

        backgroundColor: Colors.secondary,

        paddingHorizontal: 12,

        paddingVertical: 5,

        borderRadius: 20,
    },

    badgeText: {
        color: Colors.white,

        fontSize: 12,

        fontWeight: "700",
    },

    header: {
        flexDirection: "row",

        alignItems: "center",

        marginBottom: 15,
    },

    title: {
        ...Typography.title,

        color: Colors.text,
    },

    description: {
        ...Typography.bodySmall,

        color: Colors.textSecondary,

        marginTop: 3,
    },

    priceRow: {
        flexDirection: "row",

        alignItems: "center",

        marginBottom: 5,
    },

    price: {
        fontSize: 32,

        fontWeight: "700",

        color: Colors.primary,
    },

    originalPrice: {
        marginLeft: 10,

        textDecorationLine: "line-through",

        color: Colors.textSecondary,

        fontSize: 16,
    },

    duration: {
        ...Typography.bodySmall,

        color: Colors.textSecondary,

        marginBottom: 15,
    },

    features: {
        marginTop: 10,
    },

    feature: {
        flexDirection: "row",

        alignItems: "center",

        marginBottom: 10,
    },

    featureText: {
        marginLeft: 10,

        ...Typography.body,

        color: Colors.text,
    },
});