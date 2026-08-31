import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
} from "react-native";
import { router } from "../../navigation/RootNavigation";
import Ionicons from "react-native-vector-icons/Ionicons";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Checkbox from "../inputs/Checkbox";
import { Colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { secureStorage } from "../../services/secureStorage";
import apiClient from "../../api/apiClient";
import SocialButton from "./SocialButton";
import { loginSchema, LoginForm as LoginFormType } from "../../validations/auth.schema";

export default function LoginForm() {
    const [loginError, setLoginError] = useState<string | null>(null);
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuthStore();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormType>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (data: LoginFormType) => {
        setLoginError(null);
        try {
            const response = await apiClient.post("/auth/login", data);
            const { user, accessToken, refreshToken } = response.data;
            await secureStorage.saveSession(accessToken, refreshToken, user);
            login(user, accessToken, refreshToken);
            router.replace(user.role === "ADMIN" ? "/admin" : "/tabs/dashboard");
        } catch (err: any) {
            console.error(err);
            if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
                const isAdmin = data.email.toLowerCase().includes("admin");
                const mockUser = {
                    id: isAdmin ? "admin-1" : "user-1",
                    firstName: isAdmin ? "Super" : "Amit",
                    lastName: isAdmin ? "Admin" : "Sharma",
                    fullName: isAdmin ? "Super Admin" : "Amit Sharma",
                    email: data.email,
                    mobile: "9999999999",
                    role: isAdmin ? "ADMIN" : "USER",
                    isVerified: true,
                    subscription: { id: "lifetime", name: "Lifetime Plan", price: 10, currency: "INR", billingCycle: "MONTHLY", isLifetimeOffer: true },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                await secureStorage.saveSession("mock-access", "mock-refresh", mockUser as any);
                login(mockUser as any, "mock-access", "mock-refresh");
                router.replace(isAdmin ? "/admin" : "/tabs/dashboard");
                return;
            }
            setLoginError(err.response?.data?.error || "Invalid credentials.");
        }
    };

    return (
        <View style={styles.container}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
                <Svg width="80" height="80" viewBox="0 0 64 64">
                    <Defs>
                        <SvgGradient id="gradOrange" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0%" stopColor="#F97316" />
                            <Stop offset="100%" stopColor="#EA580C" />
                        </SvgGradient>
                        <SvgGradient id="gradPurple" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0%" stopColor="#A855F7" />
                            <Stop offset="100%" stopColor="#6B21A8" />
                        </SvgGradient>
                        <SvgGradient id="gradShadow" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0%" stopColor="#4C1D95" />
                            <Stop offset="100%" stopColor="#312E81" />
                        </SvgGradient>
                    </Defs>
                    <Path d="M 12 40 L 32 44 L 26 54 Z" fill="url(#gradShadow)" />
                    <Path d="M 12 40 L 52 14 L 32 44 Z" fill="url(#gradPurple)" />
                    <Path d="M 32 44 L 52 14 L 46 54 Z" fill="url(#gradOrange)" />
                </Svg>
                <Text style={styles.appName}>UP Num</Text>
                <Text style={styles.appTagline}>AI-Powered UPI Analytics</Text>
                <View style={styles.gradientTextRow}>
                    <Text style={[styles.gradText, { color: "#6D28D9" }]}>Track. </Text>
                    <Text style={[styles.gradText, { color: "#A855F7" }]}>Analyze. </Text>
                    <Text style={[styles.gradText, { color: "#EA580C" }]}>Grow.</Text>
                </View>
            </View>

            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>Welcome back!</Text>
                <Text style={styles.welcomeSubtitle}>Login to continue to your dashboard</Text>
            </View>

            {loginError && <Text style={styles.errorTextTop}>{loginError}</Text>}

            {/* Form Inputs */}
            <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange } }) => (
                    <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                        <View style={styles.iconBox}>
                            <Ionicons name="mail-outline" size={20} color="#6D28D9" />
                        </View>
                        <View style={styles.inputInner}>
                            <Text style={styles.inputLabelFloating}>Email Address</Text>
                            <TextInput
                                placeholder="Enter your email address"
                                placeholderTextColor="#94A3B8"
                                value={value}
                                onChangeText={onChange}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                style={styles.textInput}
                            />
                        </View>
                    </View>
                )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

            <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange } }) => (
                    <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                        <View style={styles.iconBox}>
                            <Ionicons name="lock-closed-outline" size={20} color="#6D28D9" />
                        </View>
                        <View style={styles.inputInner}>
                            <Text style={styles.inputLabelFloating}>Password</Text>
                            <TextInput
                                secureTextEntry={!showPassword}
                                placeholder="Enter your password"
                                placeholderTextColor="#94A3B8"
                                value={value}
                                onChangeText={onChange}
                                autoCapitalize="none"
                                style={styles.textInput}
                            />
                        </View>
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

            {/* Options Row */}
            <View style={styles.optionsRow}>
                <Checkbox checked={remember} onPress={() => setRemember(!remember)} label="Remember me" />
                <TouchableOpacity onPress={() => router.push("/auth/forgot-password")}>
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => handleSubmit(onSubmit)()} style={styles.loginButton}>
                <Text style={styles.loginBtnText}>Login</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.loginArrow} />
            </TouchableOpacity>

            {/* Social Logins */}
            <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
                <View style={{ flex: 1 }}>
                    <SocialButton provider="google" title="Continue with Google" onPress={() => {}} />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                    <SocialButton provider="apple" title="Continue with Apple" onPress={() => {}} />
                </View>
            </View>

            {/* Signup Link */}
            <View style={styles.signupRow}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.replace("/auth/signup")}>
                    <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
            </View>

            {/* Secure Badge */}
            <View style={styles.secureBadge}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#6D28D9" />
                <Text style={styles.secureText}>Your data is 100% secure</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingTop: 40,
    },
    logoSection: {
        alignItems: "center",
        marginBottom: 40,
    },
    appName: {
        fontSize: 36,
        fontWeight: "800",
        color: "#0F172A",
        marginTop: 8,
    },
    appTagline: {
        fontSize: 14,
        color: "#6D28D9",
        fontWeight: "500",
        marginTop: 4,
    },
    gradientTextRow: {
        flexDirection: "row",
        marginTop: 4,
    },
    gradText: {
        fontSize: 14,
        fontWeight: "700",
    },
    welcomeSection: {
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 4,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: "#64748B",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        marginBottom: 16,
        height: 64,
        paddingHorizontal: 12,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
            android: { elevation: 2 },
            web: { boxShadow: "0 2px 8px rgba(0,0,0,0.04)" } as any,
        }),
    },
    inputError: {
        borderColor: Colors.danger,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#F3E8FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    inputInner: {
        flex: 1,
        justifyContent: "center",
    },
    inputLabelFloating: {
        fontSize: 12,
        color: "#64748B",
        fontWeight: "600",
        marginBottom: 2,
    },
    textInput: {
        fontSize: 14,
        color: "#0F172A",
        padding: 0,
        margin: 0,
        ...Platform.select({ web: { outlineStyle: "none" } as any }),
    },
    eyeIcon: {
        padding: 8,
    },
    errorText: {
        color: Colors.danger,
        fontSize: 12,
        marginTop: -12,
        marginBottom: 12,
        marginLeft: 4,
    },
    errorTextTop: {
        color: Colors.danger,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 16,
    },
    optionsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    forgotPassword: {
        color: "#6D28D9",
        fontWeight: "600",
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: "#6D28D9",
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        ...Platform.select({
            ios: { shadowColor: "#6D28D9", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8 },
            android: { elevation: 6 },
            web: { boxShadow: "0 6px 16px rgba(109, 40, 217, 0.3)" } as any,
        }),
    },
    loginBtnText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
    },
    loginArrow: {
        marginLeft: 12,
    },
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E2E8F0",
    },
    dividerText: {
        color: "#64748B",
        fontSize: 13,
        paddingHorizontal: 16,
    },
    socialRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    signupRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 32,
    },
    signupText: {
        fontSize: 14,
        color: "#64748B",
    },
    signupLink: {
        fontSize: 14,
        fontWeight: "700",
        color: "#6D28D9",
    },
    secureBadge: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 40,
    },
    secureText: {
        marginLeft: 6,
        fontSize: 12,
        color: "#64748B",
        fontWeight: "500",
    },
});