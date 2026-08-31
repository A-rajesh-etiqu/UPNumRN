import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
    StyleProp,
    Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Colors, Radius, Spacing, Typography } from "../../theme";

interface Props {
    title: string;
    onPress: () => void;

    loading?: boolean;
    disabled?: boolean;

    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;

    fullWidth?: boolean;

    style?: StyleProp<ViewStyle>;

    accessibilityLabel?: string;
}

export default function PrimaryButton({
    title,
    onPress,

    loading = false,
    disabled = false,

    leftIcon,
    rightIcon,

    fullWidth = true,

    style,

    accessibilityLabel,
}: Props) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={
                accessibilityLabel ?? title
            }
            disabled={isDisabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                pressed && !isDisabled && styles.pressed,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    color="#FFFFFF"
                />
            ) : (
                <View style={styles.content}>

                    {leftIcon && (
                        <Ionicons
                            name={leftIcon}
                            size={20}
                            color="#FFF"
                            style={styles.leftIcon}
                        />
                    )}

                    <Text style={styles.title}>
                        {title}
                    </Text>

                    {rightIcon && (
                        <Ionicons
                            name={rightIcon}
                            size={20}
                            color="#FFF"
                            style={styles.rightIcon}
                        />
                    )}

                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({

    button: {

        height: 56,

        borderRadius: Radius.md,

        backgroundColor: Colors.primary,

        justifyContent: "center",

        alignItems: "center",

        marginTop: Spacing.md,

        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            } as any,
        }),
    },

    fullWidth: {
        width: "100%",
    },

    disabled: {
        opacity: 0.55,
    },

    pressed: {
        opacity: 0.85,
        transform: [
            {
                scale: 0.98,
            },
        ],
    },

    content: {

        flexDirection: "row",

        alignItems: "center",

        justifyContent: "center",
    },

    title: {
        ...Typography.button,
        color: "#FFF",
        fontWeight: "700",
    },

    leftIcon: {
        marginRight: 10,
    },

    rightIcon: {
        marginLeft: 10,
    },

});