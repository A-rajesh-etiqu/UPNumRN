import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface FeatureItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
}

export default function FeatureItem({
    icon,
    title,
    description,
}: FeatureItemProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={18} color="#FFFFFF" />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },

    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    content: {
        flex: 1,
    },

    title: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
    },

    description: {
        color: "rgba(255,255,255,0.82)",
        marginTop: 2,
        lineHeight: 16,
        fontSize: 12,
    },
});