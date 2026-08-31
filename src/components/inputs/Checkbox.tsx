import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Colors, Radius, Spacing } from "../../theme";

interface Props {
    checked: boolean;

    onPress: () => void;

    label?: string;

    error?: string;

    disabled?: boolean;

    required?: boolean;

    linkText?: string;

    onLinkPress?: () => void;
}

export default function Checkbox({
    checked,
    onPress,
    label,
    error,
    disabled = false,
    required = false,
    linkText,
    onLinkPress,
}: Props) {

    return (
        <View style={styles.container}>

            <TouchableOpacity
                activeOpacity={0.8}
                disabled={disabled}
                style={styles.row}
                onPress={onPress}
                accessibilityRole="checkbox"
                accessibilityState={{
                    checked,
                    disabled,
                }}
            >

                <View
                    style={[
                        styles.checkbox,

                        checked && styles.checked,

                        error && styles.errorBorder,

                        disabled && styles.disabled,
                    ]}
                >

                    {checked && (
                        <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFF"
                        />
                    )}

                </View>

                <View style={styles.textContainer}>

                    {label && (
                        <Text style={styles.label}>
                            {label}
                            {required && (
                                <Text style={styles.required}>
                                    {" "}*
                                </Text>
                            )}
                        </Text>
                    )}

                    {linkText && (

                        <TouchableOpacity
                            onPress={onLinkPress}
                        >
                            <Text style={styles.link}>
                                {linkText}
                            </Text>
                        </TouchableOpacity>

                    )}

                </View>

            </TouchableOpacity>

            {!!error && (

                <Text style={styles.error}>
                    {error}
                </Text>

            )}

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
    },

    row: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    checkbox: {
        width: 24,
        height: 24,
        borderRadius: Radius.sm,
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2,
    },

    checked: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },

    disabled: {
        opacity: 0.5,
    },

    errorBorder: {
        borderColor: "#EF4444",
    },

    textContainer: {
        flex: 1,
        marginLeft: 12,
    },

    label: {
        color: Colors.text,
        fontSize: 15,
        lineHeight: 22,
    },

    required: {
        color: "#EF4444",
    },

    link: {
        marginTop: 4,
        color: Colors.primary,
        fontWeight: "600",
    },

    error: {
        marginTop: 6,
        marginLeft: 36,
        color: "#EF4444",
        fontSize: 13,
    },

});