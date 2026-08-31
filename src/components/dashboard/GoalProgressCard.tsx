import React from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    useAppTheme,
    Radius,
    Shadows,
    Spacing,
    Typography,
} from "../../theme";

import { GoalProgress } from "../../types/dashboard";

interface Props {
    goal?: GoalProgress;
}

export default function GoalProgressCard({
    goal,
}: Props) {
    const { colors, isDark } = useAppTheme();

    if (!goal) {
        return null;
    }

    const progress = Math.min(
        (goal.current / goal.target) * 100,
        100
    );

    return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                    Monthly Income Goal
                </Text>

                <Text style={[styles.percent, { color: colors.primary }]}>
                    {progress.toFixed(0)}%
                </Text>
            </View>

            <View style={[styles.progressBackground, { backgroundColor: isDark ? colors.border : "#E5E7EB" }]}>
                <View
                    style={[
                        styles.progressFill,
                        {
                            width: `${progress}%`,
                            backgroundColor: colors.primary,
                        },
                    ]}
                />
            </View>

            <View style={styles.footer}>
                <Text style={[styles.amount, { color: colors.text }]}>
                    ₹{goal.current.toLocaleString()}
                </Text>

                <Text style={[styles.target, { color: colors.textSecondary }]}>
                    Target ₹{goal.target.toLocaleString()}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginTop: Spacing.md,
        ...Shadows.md,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        ...Typography.title,
    },
    percent: {
        fontSize: 22,
        fontWeight: "700",
    },
    progressBackground: {
        height: 12,
        borderRadius: 8,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 8,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
    },
    amount: {
        ...Typography.body,
        fontWeight: "700",
    },
    target: {
        ...Typography.bodySmall,
    },
});