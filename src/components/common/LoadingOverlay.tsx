import React from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { Colors, Radius, Spacing } from "../../theme";

interface Props {
    visible: boolean;
    message?: string;
}

export default function LoadingOverlay({
    visible,
    message = "Please wait...",
}: Props) {
    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={() => {}}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <ActivityIndicator
                        size="large"
                        color={Colors.primary}
                    />

                    <Text style={styles.message}>
                        {message}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    card: {
        width: 220,
        backgroundColor: "#FFF",
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        alignItems: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 5,
            },
            web: {
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            } as any,
        }),
    },

    message: {
        marginTop: Spacing.lg,
        color: Colors.text,
        textAlign: "center",
        fontSize: 16,
        fontWeight: "600",
    },
});