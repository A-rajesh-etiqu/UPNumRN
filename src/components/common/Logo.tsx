import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../theme";

export default function Logo() {
    return (
        <View>
            <Text style={styles.title}>UP Num</Text>
            <Text style={styles.tagline}>Track. Analyze. Grow.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 34,
        fontWeight: "700",
        color: Colors.white,
    },

    tagline: {
        fontSize: 16,
        color: Colors.secondary,
        marginTop: 4,
    },
});