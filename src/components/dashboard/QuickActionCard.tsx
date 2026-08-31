import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
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
import { QuickAction } from "../../types/dashboard";

interface Props {
    action: QuickAction;
    onPress?: () => void;
}

export default function QuickActionCard({
    action,
    onPress,
}: Props) {
    const { colors } = useAppTheme();

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.container, { backgroundColor: colors.surface }]}
            onPress={onPress}
        >
            <View
                style={[
                    styles.iconContainer,
                    {
                        backgroundColor: action.color + "20",
                    },
                ]}
            >
                <Ionicons
                    name={action.icon as any}
                    size={28}
                    color={action.color}
                />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
                {action.title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 18,
        margin: Spacing.xs,
        borderRadius: Radius.lg,
        ...Shadows.sm,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    title: {
        ...Typography.body,
        fontWeight: "600",
    },
});