import React, { useEffect, useRef } from "react";
import {
    View,
    TextInput,
    StyleSheet,
    Platform,
} from "react-native";

import {
    Colors,
    Radius,
    Spacing,
} from "../../theme";

interface Props {
    value: string;
    onChange: (otp: string) => void;
    length?: number;
}

export default function OTPInput({
    value,
    onChange,
    length = 6,
}: Props) {

    const inputs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {

        if (value.length === length) {
            inputs.current[length - 1]?.blur();
        }

    }, [value]);

    const handleChange = (
        text: string,
        index: number
    ) => {

        // Handle full OTP paste
        if (text.length > 1) {

            const otp = text
                .replace(/\D/g, "")
                .slice(0, length);

            onChange(otp);

            otp.split("").forEach((_, i) => {
                inputs.current[i]?.setNativeProps({
                    text: otp[i] || "",
                });
            });

            if (otp.length === length) {
                inputs.current[length - 1]?.blur();
            }

            return;
        }

        const digits = value
            .split("")
            .concat(Array(length).fill(""));

        digits[index] = text;

        const otp = digits
            .slice(0, length)
            .join("");

        onChange(otp);

        if (text && index < length - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (
        key: string,
        index: number
    ) => {

        if (
            key === "Backspace" &&
            !value[index] &&
            index > 0
        ) {

            inputs.current[index - 1]?.focus();

        }

    };

    return (

        <View style={styles.container}>

            {Array.from({ length }).map((_, index) => (

                <TextInput
                    key={index}
                    ref={(ref) => {
                        inputs.current[index] = ref;
                    }}
                    style={styles.input}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={value[index] ?? ""}
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    onChangeText={(text) =>
                        handleChange(text, index)
                    }
                    onKeyPress={({ nativeEvent }) =>
                        handleKeyPress(
                            nativeEvent.key,
                            index
                        )
                    }
                />

            ))}

        </View>

    );
}

const styles = StyleSheet.create({

    container: {

        flexDirection: "row",

        justifyContent: "space-between",

        marginVertical: Spacing.xl,
    },

    input: {

        width: 52,

        height: 58,

        borderRadius: Radius.md,

        borderWidth: 1,

        borderColor: Colors.border,

        backgroundColor: "#FFF",

        textAlign: "center",

        fontSize: 22,

        fontWeight: "700",

        color: Colors.text,
        ...Platform.select({
            web: {
                outlineStyle: "none",
            } as any,
        }),
    },

});