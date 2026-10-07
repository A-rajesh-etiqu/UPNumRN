import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography } from "../../theme";

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
        ...Typography.logo,
        fontSize: 34,
        color: Colors.white,
    },

    tagline: {
        ...Typography.caption,
        fontSize: 16,
        color: Colors.secondary,
        marginTop: 4,
    },
});