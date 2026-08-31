import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

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
                <Ionicons name={icon} size={22} color="#FFFFFF" />
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
        marginTop: 28,
    },

    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 18,
    },

    content: {
        flex: 1,
    },

    title: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 18,
    },

    description: {
        color: "rgba(255,255,255,0.82)",
        marginTop: 4,
        lineHeight: 22,
        fontSize: 15,
    },
});