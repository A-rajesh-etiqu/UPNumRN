import React, { useState } from "react";
import {
    View,
    TextInput,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInputProps,
    Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Colors, Radius, Spacing } from "../../theme";

interface Props extends Omit<TextInputProps, "onChangeText"> {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    containerStyle?: any;
}

export default function PasswordInput({
    label = "Password",
    placeholder = "Enter your password",
    value,
    onChangeText,
    autoCapitalize = "none",
    autoCorrect = false,
    containerStyle,
    ...rest
}: Props) {
    const [secure, setSecure] = useState(true);

    return (
        <View style={[styles.container, containerStyle]}>

            <Text style={styles.label}>
                {label}
            </Text>

            <View style={styles.input}>

                <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={Colors.primary}
                />

                <TextInput
                    style={styles.text}
                    secureTextEntry={secure}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
                    {...rest}
                />

                <TouchableOpacity
                    onPress={() => setSecure(!secure)}
                >
                    <Ionicons
                        size={22}
                        color="#777"
                        name={
                            secure
                                ? "eye-outline"
                                : "eye-off-outline"
                        }
                    />
                </TouchableOpacity>

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

    input: {
        height: 56,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        backgroundColor: "#FFF",
    },

    text: {
        flex: 1,
        marginHorizontal: 12,
        color: Colors.text,
        fontSize: 16,
        ...Platform.select({
            web: {
                outlineStyle: "none",
                width: 0,
            } as any,
        }),
    },
});