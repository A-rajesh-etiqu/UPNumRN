import React from "react";
import {
    View,
    Text,
    StyleSheet
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";

export default function SecureCard() {

    return (

        <View style={styles.card}>

            <Ionicons
                name="shield-checkmark"
                size={34}
                color="#7C3AED"
            />

            <View style={{ marginLeft: 18 }}>

                <Text style={styles.title}>
                    Secure Login
                </Text>

                <Text style={styles.text}>
                    We use bank level encryption to protect your data.
                </Text>

            </View>

        </View>

    );

}

const styles = StyleSheet.create({

    card: {
        marginTop: 30,
        padding: 20,
        borderRadius: 18,
        backgroundColor: "#F8F5FF",
        flexDirection: "row",
        alignItems: "center"
    },

    title: {
        fontWeight: "700",
        fontSize: 18
    },

    text: {
        marginTop: 5,
        color: "#666",
        lineHeight: 22
    }

});