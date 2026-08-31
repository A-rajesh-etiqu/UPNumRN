import React from "react";
import {
    View,
    Text,
    StyleSheet,
    StyleProp,
    ViewStyle,
} from "react-native";

import { Colors, Spacing } from "../../theme";

interface Props {
    text?: string;
    style?: StyleProp<ViewStyle>;
}

export default function Divider({
    text = "OR",
    style,
}: Props) {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.line} />

            <Text style={styles.text}>
                {text}
            </Text>

            <View style={styles.line} />
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: Spacing.xl,
    },

    line: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },

    text: {
        marginHorizontal: Spacing.md,
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: "600",
    },

});