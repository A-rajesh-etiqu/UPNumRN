import React from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";

import {
    Colors,
    Radius,
    Spacing,
    Typography,
} from "../../theme";

interface Props {
    price: number;
}

export default function SubscriptionSummary({
    price,
}: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Total Amount
            </Text>

            <Text style={styles.price}>
                ₹{price}
            </Text>

            <Text style={styles.note}>
                Secure payment powered by Razorpay
                (Mock for Demo)
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: Radius.lg,

        backgroundColor: Colors.surface,

        padding: Spacing.lg,

        marginVertical: Spacing.lg,

        borderWidth: 1,

        borderColor: Colors.border,
    },

    title: {
        ...Typography.body,

        color: Colors.textSecondary,
    },

    price: {
        fontSize: 34,

        fontWeight: "700",

        color: Colors.primary,

        marginVertical: 8,
    },

    note: {
        ...Typography.bodySmall,

        color: Colors.textSecondary,
    },
});