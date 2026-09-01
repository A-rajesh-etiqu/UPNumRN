import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "../../navigation/RootNavigation";
import { useAuthStore } from "../../store/auth.store";
import { useAppTheme } from "../../theme";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function VerifyUPIScreen() {
    const { colors } = useAppTheme();
    const { user, accessToken } = useAuthStore();
    const [upiId, setUpiId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleVerify = async () => {
        if (!upiId || !upiId.includes("@")) {
            setError("Please enter a valid UPI ID");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { authApi } = require("../../api/authApi");
            await authApi.verifyUpi(user?.id, upiId);

            // Verified successfully, move to choose plan
            if (user) {
                const { updateUser } = useAuthStore.getState();
                updateUser({ ...user, isUpiVerified: true });
            }
            router.replace("/tabs/subscription");
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to verify UPI");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Ionicons name="shield-checkmark" size={64} color={colors.primary} style={styles.icon} />
                <Text style={[styles.title, { color: colors.text }]}>Verify UPI ID</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    To activate your free trial, please verify your UPI ID for future billing.
                </Text>

                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="Enter your UPI ID (e.g. user@okhdfcbank)"
                    placeholderTextColor={colors.textSecondary}
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                />

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity 
                    style={[styles.button, { backgroundColor: colors.primary }]} 
                    onPress={handleVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Verify & Start Trial</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center" },
    icon: { marginBottom: 24 },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
    subtitle: { fontSize: 14, textAlign: "center", marginBottom: 32 },
    input: { width: "100%", height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16 },
    button: { width: "100%", height: 50, borderRadius: 8, justifyContent: "center", alignItems: "center", marginTop: 8 },
    buttonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
    errorText: { color: "red", fontSize: 12, marginBottom: 16, alignSelf: "flex-start" }
});
