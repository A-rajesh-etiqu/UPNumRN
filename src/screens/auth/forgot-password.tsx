import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "../../navigation/RootNavigation";
import Ionicons from "react-native-vector-icons/Ionicons";
import { authApi } from "../../api/authApi";
import AuthLayout from "../../components/auth/AuthLayout";
import { Colors } from "../../theme";

export default function ForgotPasswordScreen() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSendOtp = async () => {
        if (mobile.length !== 10) {
            setError("Please enter a valid 10-digit mobile number");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await authApi.forgotPassword(mobile);
            if (response.email) setEmail(response.email);
            Alert.alert("OTP Sent", `An OTP has been sent to your email address.`);
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = () => {
        if (otp.length < 4) {
            setError("Please enter a valid OTP");
            return;
        }
        setError(null);
        setStep(3);
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await authApi.resetPassword({ mobile, otp, newPassword });
            Alert.alert("Success", "Password updated successfully!");
            router.replace("/auth/login");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <AuthLayout>
                <View style={styles.content}>
                    <TouchableOpacity style={styles.backButton} onPress={() => {
                        if (step > 1) setStep((s) => (s - 1) as any);
                        else router.replace("/auth/login");
                    }}>
                        <Ionicons name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Forgot Password</Text>
                    <Text style={styles.subtitle}>
                        {step === 1 && "Enter your registered mobile number to receive an OTP."}
                        {step === 2 && `Enter the OTP sent to your email ${email || mobile}.`}
                        {step === 3 && "Create a new strong password."}
                    </Text>

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    {step === 1 && (
                        <>
                            <View style={styles.inputContainer}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="call-outline" size={20} color="#6D28D9" />
                                </View>
                                <View style={styles.inputInner}>
                                    <Text style={styles.inputLabelFloating}>Mobile Number</Text>
                                    <TextInput
                                        placeholder="Enter your mobile number"
                                        placeholderTextColor="#94A3B8"
                                        value={mobile}
                                        onChangeText={setMobile}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        style={styles.textInput}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
                                <Text style={styles.buttonText}>{loading ? "Sending..." : "Send OTP"}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <View style={styles.inputContainer}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="keypad-outline" size={20} color="#6D28D9" />
                                </View>
                                <View style={styles.inputInner}>
                                    <Text style={styles.inputLabelFloating}>One-Time Password</Text>
                                    <TextInput
                                        placeholder="Enter OTP"
                                        placeholderTextColor="#94A3B8"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        style={styles.textInput}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
                                <Text style={styles.buttonText}>Verify OTP</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <View style={styles.inputContainer}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#6D28D9" />
                                </View>
                                <View style={styles.inputInner}>
                                    <Text style={styles.inputLabelFloating}>New Password</Text>
                                    <TextInput
                                        secureTextEntry={!showPassword}
                                        placeholder="Enter new password"
                                        placeholderTextColor="#94A3B8"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        style={styles.textInput}
                                    />
                                </View>
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputContainer}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#6D28D9" />
                                </View>
                                <View style={styles.inputInner}>
                                    <Text style={styles.inputLabelFloating}>Confirm Password</Text>
                                    <TextInput
                                        secureTextEntry={!showPassword}
                                        placeholder="Confirm new password"
                                        placeholderTextColor="#94A3B8"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        style={styles.textInput}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
                                <Text style={styles.buttonText}>{loading ? "Saving..." : "Save New Password"}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </AuthLayout>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    content: {
        paddingTop: 20,
    },
    backButton: {
        marginBottom: 20,
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#64748B",
        marginBottom: 32,
    },
    errorText: {
        color: Colors.danger,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        marginBottom: 16,
        height: 60,
        paddingHorizontal: 10,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2 },
            android: { elevation: 1 },
            web: { boxShadow: "0 1px 4px rgba(0,0,0,0.02)" } as any,
        }),
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: "#F3E8FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    inputInner: {
        flex: 1,
        justifyContent: "center",
    },
    inputLabelFloating: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: "600",
        marginBottom: 2,
    },
    textInput: {
        fontSize: 13,
        color: "#0F172A",
        padding: 0,
        margin: 0,
        ...Platform.select({ web: { outlineStyle: "none" } as any }),
    },
    eyeIcon: {
        padding: 8,
    },
    button: {
        backgroundColor: "#5A32FA",
        height: 52,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        ...Platform.select({
            ios: { shadowColor: "#5A32FA", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
            android: { elevation: 4 },
            web: { boxShadow: "0 4px 12px rgba(90, 50, 250, 0.2)" } as any,
        }),
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 15,
    },
});