import React from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";

import PrimaryButton from "../buttons/PrimaryButton";

import {
    Colors,
    Spacing,
} from "../../theme";

interface Props {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;

    buttonTitle?: string;
    onPress?: () => void;
}

export default function EmptyState({
    icon = "document-text-outline",
    title,
    description,
    buttonTitle,
    onPress,
}: Props) {

    return (

        <View style={styles.container}>

            <Ionicons
                name={icon}
                size={72}
                color={Colors.primary}
            />

            <Text style={styles.title}>
                {title}
            </Text>

            <Text style={styles.description}>
                {description}
            </Text>

            {buttonTitle && onPress && (
                <PrimaryButton
                    title={buttonTitle}
                    onPress={onPress}
                />
            )}

        </View>

    );
}

const styles = StyleSheet.create({

    container: {

        flex: 1,

        justifyContent: "center",

        alignItems: "center",

        padding: Spacing.xl,
    },

    title: {

        marginTop: Spacing.lg,

        fontSize: 22,

        fontWeight: "700",

        color: Colors.text,
    },

    description: {

        marginTop: Spacing.md,

        textAlign: "center",

        color: Colors.textSecondary,

        lineHeight: 24,

        marginBottom: Spacing.xl,
    },

});