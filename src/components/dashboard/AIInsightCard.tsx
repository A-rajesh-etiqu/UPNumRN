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
import { AIInsight } from "../../types/dashboard";

interface Props {
    insight: AIInsight;
}

export default function AIInsightCard({
    insight,
}: Props) {
    const { colors, isDark } = useAppTheme();

    const getColor = () => {
        switch (insight.type) {
            case "success":
                return colors.success;
            case "warning":
                return colors.warning;
            default:
                return colors.info;
        }
    };

    const color = getColor();

    return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View
                style={[
                    styles.iconContainer,
                    {
                        backgroundColor: color + "20",
                    },
                ]}
            >
                <Ionicons
                    name="sparkles"
                    size={24}
                    color={color}
                />
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {insight.title}
                </Text>

                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {insight.description}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginTop: Spacing.md,
        ...Shadows.md,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: "center",
        alignItems: "center",
        marginRight: Spacing.md,
    },
    content: {
        flex: 1,
    },
    title: {
        ...Typography.body,
        fontWeight: "700",
    },
    description: {
        ...Typography.bodySmall,
        marginTop: 6,
        lineHeight: 20,
    },
});