import React from "react";
import {
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    View,
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";

import {
    Colors,
    Radius,
    Spacing,
    Typography,
} from "../../theme";

type Provider =
    | "google"
    | "apple"
    | "microsoft"
    | "linkedin";

interface Props {
    provider: Provider;

    title: string;

    onPress: () => void;

    loading?: boolean;

    disabled?: boolean;
}

const providerIcons: Record<Provider, string> = {
    google: "logo-google",
    apple: "logo-apple",
    microsoft: "logo-microsoft",
    linkedin: "logo-linkedin",
};

export default function SocialButton({
    provider,
    title,
    onPress,
    loading = false,
    disabled = false,
}: Props) {

    return (
        <Pressable
            disabled={loading || disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,

                pressed &&
                !loading &&
                styles.pressed,

                disabled &&
                styles.disabled,
            ]}
        >

            {loading ? (
                <ActivityIndicator />
            ) : (
                <View style={styles.row}>

                    <Ionicons
                        name={providerIcons[provider] as any}
                        size={22}
                        color={Colors.text}
                    />

                    <Text style={styles.title}>
                        {title}
                    </Text>

                </View>
            )}

        </Pressable>
    );
}

const styles = StyleSheet.create({

    button: {

        height: 52,

        borderRadius: Radius.md,

        borderWidth: 1,

        borderColor: Colors.border,

        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    title: {

        ...Typography.body,

        marginLeft: 12,

        color: Colors.text,

        fontWeight: "600",
    },

    pressed: {
        opacity: 0.8,
    },

    disabled: {
        opacity: 0.5,
    },

});