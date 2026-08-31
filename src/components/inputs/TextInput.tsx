import React from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardTypeOptions,
    TextInputProps,
    Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Colors, Radius, Spacing } from "../../theme";

interface Props extends Omit<TextInputProps, "onChangeText"> {
    label?: string;
    placeholder?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    value: string;
    onChangeText: (text: string) => void;
    containerStyle?: any;
}

export default function AppInput({
    label,
    placeholder,
    icon,
    value,
    onChangeText,
    keyboardType = "default",
    autoCapitalize = "none",
    autoCorrect = false,
    editable = true,
    secureTextEntry = false,
    containerStyle,
    ...rest
}: Props) {
    return (
        <View style={[styles.container, containerStyle]}>

            {label && (
                <Text style={styles.label}>
                    {label}
                </Text>
            )}

            <View style={styles.inputContainer}>

                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={Colors.primary}
                    />
                )}

                <TextInput
                    style={[
                        styles.input,
                        !icon && {
                            marginLeft: 0,
                        },
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
                    editable={editable}
                    secureTextEntry={secureTextEntry}
                    {...rest}
                />

            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },

    label: {
        marginBottom: 8,
        fontWeight: "600",
        color: Colors.text,
    },

    inputContainer: {
        height: 56,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: "#FFF",
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
    },

    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: Colors.text,
        ...Platform.select({
            web: {
                outlineStyle: "none",
            } as any,
        }),
    },
});