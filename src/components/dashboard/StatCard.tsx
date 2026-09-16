import React from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

import {
    useAppTheme,
    Radius,
    Shadows,
    Spacing,
    Typography,
} from "../../theme";
import { DashboardStat } from "../../types/dashboard";

interface Props {
    stat: DashboardStat;
}

export default function StatCard({
    stat,
}: Props) {
    const { colors, isDark } = useAppTheme();
    const isPositive = stat.change >= 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
                <View
                    style={[
                        styles.iconContainer,
                        {
                            backgroundColor: stat.color + "20",
                        },
                    ]}
                >
                    <Ionicons
                        name={stat.icon as any}
                        size={22}
                        color={stat.color}
                    />
                </View>

                <View
                    style={[
                        styles.badge,
                        {
                            backgroundColor: isPositive
                                ? (isDark ? "#064e3b" : "#DCFCE7")
                                : (isDark ? "#7f1d1d" : "#FEE2E2"),
                        },
                    ]}
                >
                    <Ionicons
                        name={
                            isPositive
                                ? "trending-up"
                                : "trending-down"
                        }
                        size={14}
                        color={
                            isPositive
                                ? colors.success
                                : colors.danger
                        }
                    />

                    <Text
                        style={[
                            styles.change,
                            {
                                color: isPositive
                                    ? colors.success
                                    : colors.danger,
                            },
                        ]}
                    >
                        {Math.abs(stat.change)}%
                    </Text>
                </View>
            </View>

            <Text style={[styles.value, { color: colors.text, ...Typography.h2, fontSize: 28 }]}>
                {stat.value}
            </Text>

            <Text style={[styles.title, { color: colors.textSecondary, ...Typography.body }]}>
                {stat.title}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 140,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        margin: Spacing.xs,
        ...Shadows.md,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radius.full ?? 999,
    },
    change: {
        marginLeft: 4,
        fontWeight: "700",
        fontSize: 12,
    },
    value: {
        ...Typography.h2,
        marginTop: 20,
    },
    title: {
        ...Typography.body,
        marginTop: 6,
    },
});