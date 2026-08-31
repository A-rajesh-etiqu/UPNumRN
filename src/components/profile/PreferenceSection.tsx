import React from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";

import LanguageSelector from "../common/LanguageSelector";

import {
    Colors,
    Typography,
    Spacing,
} from "../../theme";

export default function PreferenceSection() {

    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Preferences
            </Text>

            <LanguageSelector />

        </View>

    );
}

const styles = StyleSheet.create({

    container: {
        marginBottom: Spacing.xl,
    },

    title: {
        ...Typography.title,
        color: Colors.text,
        marginBottom: Spacing.md,
    },

});