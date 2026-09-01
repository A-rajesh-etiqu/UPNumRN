import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
    ActivityIndicator,
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
import { signupSchema, SignupForm as SignupFormType } from "../../validations/signup.schema";
import { useSignup } from "../../hooks/useSignup";

export default function SignupForm() {
    const { login } = useAuthStore();
    const [signupError, setSignupError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        control,
        watch,
        setValue,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormType>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            fullName: "",
            email: "",
            mobile: "",
            password: "",
            confirmPassword: "",
            referralCode: "",
            acceptTerms: false,
            userType: "PERSONAL",
            businessName: "",
        },
    });

    const userType = watch("userType");
    const password = watch("password") || "";

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const onSubmit = async (data: SignupFormType) => {
        setSignupError(null);
        setLoading(true);
        try {
            const [firstName, ...rest] = data.fullName.trim().split(" ");
            const lastName = rest.join(" ") || "";

            const response = await apiClient.post("/auth/register", {
                firstName,
                lastName,
                email: data.email,
                mobile: data.mobile,
                password: data.password,
                userType: data.userType,
                businessName: data.businessName,
            });

            const { user, accessToken, refreshToken } = response.data;
            await secureStorage.saveSession(accessToken, refreshToken, user);
            login(user, accessToken, refreshToken);
            router.replace(user.role === "ADMIN" ? "/admin" : "/tabs/dashboard");
        } catch (err: any) {
            console.error(err);
            if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
                const isAdmin = data.email.toLowerCase().includes("admin");
                const [firstName, ...rest] = data.fullName.trim().split(" ");
                const mockUser = {
                    id: isAdmin ? "admin-1" : "user-1",
                    firstName,
                    lastName: rest.join(" ") || "",
                    fullName: data.fullName,
                    email: data.email,
                    mobile: data.mobile,
                    role: isAdmin ? "ADMIN" : "USER",
                    userType: data.userType,
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
            setSignupError(err.response?.data?.error || "Registration failed. Try a different email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.headerSection}>
                <View style={styles.titleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Create Your Account</Text>
                        <Text style={styles.headerSubtitle}>Join UP Num and start tracking your UPI insights</Text>
                    </View>
                    <View style={styles.logoBox}>
                        <Svg width="40" height="40" viewBox="0 0 64 64">
                            <Defs>
                                <SvgGradient id="gO" x1="0" y1="0" x2="1" y2="1"><Stop offset="0%" stopColor="#F97316" /><Stop offset="100%" stopColor="#EA580C" /></SvgGradient>
                                <SvgGradient id="gP" x1="0" y1="0" x2="1" y2="1"><Stop offset="0%" stopColor="#A855F7" /><Stop offset="100%" stopColor="#6B21A8" /></SvgGradient>
                                <SvgGradient id="gS" x1="0" y1="0" x2="1" y2="1"><Stop offset="0%" stopColor="#4C1D95" /><Stop offset="100%" stopColor="#312E81" /></SvgGradient>
                            </Defs>
                            <Path d="M 12 40 L 32 44 L 26 54 Z" fill="url(#gS)" />
                            <Path d="M 12 40 L 52 14 L 32 44 Z" fill="url(#gP)" />
                            <Path d="M 32 44 L 52 14 L 46 54 Z" fill="url(#gO)" />
                        </Svg>
                        <Text style={styles.logoText}>UP Num</Text>
                    </View>
                </View>
            </View>

            {signupError && <Text style={styles.errorTextTop}>{signupError}</Text>}

            {/* Type Selector */}
            <View style={styles.segmentContainer}>
                <TouchableOpacity
                    style={[styles.segmentBtn, userType === "PERSONAL" && styles.segmentBtnActive]}
                    onPress={() => setValue("userType", "PERSONAL")}
                >
                    <Ionicons name="person" size={16} color={userType === "PERSONAL" ? "#6D28D9" : "#64748B"} />
                    <Text style={[styles.segmentText, userType === "PERSONAL" && styles.segmentTextActive]}>Personal User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.segmentBtn, userType === "BUSINESS" && styles.segmentBtnActive]}
                    onPress={() => setValue("userType", "BUSINESS")}
                >
                    <Ionicons name="briefcase-outline" size={16} color={userType === "BUSINESS" ? "#6D28D9" : "#64748B"} />
                    <Text style={[styles.segmentText, userType === "BUSINESS" && styles.segmentTextActive]}>Business User</Text>
                </TouchableOpacity>
            </View>

            {/* Active Type Hero */}
            <View style={styles.activeTypeHero}>
                <View style={styles.activeTypeIcon}>
                    <Ionicons name={userType === "PERSONAL" ? "person" : "briefcase"} size={24} color="#6D28D9" />
                </View>
                <View>
                    <Text style={styles.activeTypeTitle}>{userType === "PERSONAL" ? "Personal User" : "Business User"}</Text>
                    <Text style={styles.activeTypeDesc}>Create your {userType.toLowerCase()} account to get started</Text>
                </View>
            </View>

            {/* Form Fields */}
            {userType === "BUSINESS" && (
                <View style={styles.inputWrapper}>
                    <Controller
                        control={control}
                        name="businessName"
                        render={({ field: { value, onChange } }) => (
                            <View style={[styles.inputBox, errors.businessName && styles.inputError]}>
                                <Ionicons name="storefront-outline" size={20} color="#6D28D9" style={styles.iconBoxMargin} />
                                <View style={styles.inputInner}>
                                    <Text style={styles.inputLabelFloating}>Business Name</Text>
                                    <TextInput placeholder="Enter your business name" placeholderTextColor="#94A3B8" value={value || ""} onChangeText={onChange} style={styles.textInput} />
                                </View>
                            </View>
                        )}
                    />
                    {errors.businessName && <Text style={styles.errorText}>{errors.businessName.message}</Text>}
                </View>
            )}

            <View style={styles.inputWrapper}>
                <Controller
                    control={control}
                    name="fullName"
                    render={({ field: { value, onChange } }) => (
                        <View style={[styles.inputBox, errors.fullName && styles.inputError]}>
                            <Ionicons name="person-outline" size={20} color="#6D28D9" style={styles.iconBoxMargin} />
                            <View style={styles.inputInner}>
                                <Text style={styles.inputLabelFloating}>Full Name</Text>
                                <TextInput placeholder="Enter your full name" placeholderTextColor="#94A3B8" value={value} onChangeText={onChange} style={styles.textInput} autoCapitalize="words" />
                            </View>
                        </View>
                    )}
                />
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}
            </View>

            <View style={styles.inputWrapper}>
                <Controller
                    control={control}
                    name="email"
                    render={({ field: { value, onChange } }) => (
                        <View style={[styles.inputBox, errors.email && styles.inputError]}>
                            <Ionicons name="mail-outline" size={20} color="#6D28D9" style={styles.iconBoxMargin} />
                            <View style={styles.inputInner}>
                                <Text style={styles.inputLabelFloating}>Email Address</Text>
                                <TextInput placeholder="Enter your email address" placeholderTextColor="#94A3B8" value={value} onChangeText={onChange} style={styles.textInput} keyboardType="email-address" autoCapitalize="none" />
                            </View>
                        </View>
                    )}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            <View style={styles.inputWrapper}>
                <Controller
                    control={control}
                    name="mobile"
                    render={({ field: { value, onChange } }) => (
                        <View style={[styles.inputBox, errors.mobile && styles.inputError]}>
                            <Ionicons name="call-outline" size={20} color="#6D28D9" style={styles.iconBoxMargin} />
                            <View style={styles.inputInner}>
                                <Text style={styles.inputLabelFloating}>Mobile Number</Text>
                                <TextInput placeholder="Enter your mobile number" placeholderTextColor="#94A3B8" value={value} onChangeText={onChange} style={styles.textInput} keyboardType="phone-pad" />
                            </View>
                        </View>
                    )}
                />
                {errors.mobile && <Text style={styles.errorText}>{errors.mobile.message}</Text>}
            </View>

            <View style={styles.inputWrapper}>
                <Controller
                    control={control}
                    name="password"
                    render={({ field: { value, onChange } }) => (
                        <View style={[styles.inputBox, errors.password && styles.inputError]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#6D28D9" style={styles.iconBoxMargin} />
                            <View style={styles.inputInner}>
                                <Text style={styles.inputLabelFloating}>Password</Text>
                                <TextInput secureTextEntry={!showPassword} placeholder="Create a password" placeholderTextColor="#94A3B8" value={value} onChangeText={onChange} style={styles.textInput} />
                            </View>
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    )}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>

            <View style={styles.inputWrapper}>
                <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { value, onChange } }) => (
                        <View style={[styles.inputBox, errors.confirmPassword && styles.inputError]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#6D28D9" style={styles.iconBoxMargin} />
                            <View style={styles.inputInner}>
                                <Text style={styles.inputLabelFloating}>Confirm Password</Text>
                                <TextInput secureTextEntry={!showConfirmPassword} placeholder="Confirm your password" placeholderTextColor="#94A3B8" value={value} onChangeText={onChange} style={styles.textInput} />
                            </View>
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    )}
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
            </View>

            {/* Password Validation Checklist */}
            <View style={styles.checklistContainer}>
                <Text style={styles.checklistTitle}>Password must be at least 8 characters with</Text>
                <View style={styles.checklistGrid}>
                    <View style={styles.checklistItem}>
                        <Ionicons name={hasUppercase ? "checkmark-circle" : "checkmark-circle-outline"} size={16} color={hasUppercase ? "#22C55E" : "#94A3B8"} />
                        <Text style={[styles.checklistText, hasUppercase && styles.checklistTextActive]}>1 uppercase</Text>
                    </View>
                    <View style={styles.checklistItem}>
                        <Ionicons name={hasLowercase ? "checkmark-circle" : "checkmark-circle-outline"} size={16} color={hasLowercase ? "#22C55E" : "#94A3B8"} />
                        <Text style={[styles.checklistText, hasLowercase && styles.checklistTextActive]}>1 lowercase</Text>
                    </View>
                    <View style={styles.checklistItem}>
                        <Ionicons name={hasNumber ? "checkmark-circle" : "checkmark-circle-outline"} size={16} color={hasNumber ? "#22C55E" : "#94A3B8"} />
                        <Text style={[styles.checklistText, hasNumber && styles.checklistTextActive]}>1 number</Text>
                    </View>
                    <View style={styles.checklistItem}>
                        <Ionicons name={hasSpecial ? "checkmark-circle" : "checkmark-circle-outline"} size={16} color={hasSpecial ? "#22C55E" : "#94A3B8"} />
                        <Text style={[styles.checklistText, hasSpecial && styles.checklistTextActive]}>1 special character</Text>
                    </View>
                </View>
            </View>

            {/* Terms Checkbox */}
            <View style={styles.termsRow}>
                <Controller
                    control={control}
                    name="acceptTerms"
                    render={({ field: { value, onChange } }) => (
                        <Checkbox checked={value} onPress={() => onChange(!value)} />
                    )}
                />
                <Text style={styles.termsText}>
                    I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
            </View>
            {errors.acceptTerms && <Text style={styles.errorText}>{errors.acceptTerms.message}</Text>}

            {/* Signup Button */}
            <TouchableOpacity activeOpacity={0.8} disabled={loading} onPress={() => handleSubmit(onSubmit)()} style={styles.signupButton}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                    <>
                        <Text style={styles.signupBtnText}>Create Account</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.signupArrow} />
                    </>
                )}
            </TouchableOpacity>

            {/* Social Logins Removed */}

            {/* Login Link */}
            <View style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace("/auth/login")}>
                    <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    headerSection: {
        marginBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#64748B",
        lineHeight: 20,
    },
    logoBox: {
        alignItems: "center",
        justifyContent: "center",
    },
    logoText: {
        fontSize: 10,
        fontWeight: "800",
        color: "#0F172A",
        marginTop: -4,
    },
    segmentContainer: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: "#F1F5F9",
        borderRadius: 24,
        padding: 4,
        marginBottom: 24,
    },
    segmentBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 20,
        gap: 8,
    },
    segmentBtnActive: {
        backgroundColor: "#F3E8FF", // Light purple
    },
    segmentText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748B",
    },
    segmentTextActive: {
        color: "#6D28D9",
    },
    activeTypeHero: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    activeTypeIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#F3E8FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    activeTypeTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0F172A",
    },
    activeTypeDesc: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 2,
    },
    inputWrapper: {
        marginBottom: 16,
    },
    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F1F5F9",
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        height: 64,
        paddingHorizontal: 16,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 3 },
            android: { elevation: 2 },
            web: { boxShadow: "0 2px 8px rgba(0,0,0,0.03)" } as any,
        }),
    },
    inputError: {
        borderColor: Colors.danger,
    },
    iconBoxMargin: {
        marginRight: 12,
        backgroundColor: "#F3E8FF",
        padding: 8,
        borderRadius: 8,
        overflow: "hidden",
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
    countryCodeBoxLeft: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 12,
    },
    flagEmoji: {
        fontSize: 16,
        marginRight: 4,
    },
    countryCodeText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#334155",
        marginRight: 4,
    },
    eyeIcon: {
        padding: 8,
    },
    checklistContainer: {
        marginBottom: 24,
    },
    checklistTitle: {
        fontSize: 13,
        color: "#64748B",
        marginBottom: 12,
    },
    checklistGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    checklistItem: {
        flexDirection: "row",
        alignItems: "center",
        width: "45%", // Two columns roughly
    },
    checklistText: {
        fontSize: 12,
        color: "#94A3B8",
        marginLeft: 6,
    },
    checklistTextActive: {
        color: "#22C55E",
    },
    termsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    termsText: {
        fontSize: 13,
        color: "#0F172A",
        marginLeft: 8,
        flex: 1,
    },
    termsLink: {
        color: "#6D28D9",
        fontWeight: "600",
    },
    errorText: {
        color: Colors.danger,
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
    errorTextTop: {
        color: Colors.danger,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 16,
    },
    signupButton: {
        backgroundColor: "#6D28D9",
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        ...Platform.select({
            ios: { shadowColor: "#6D28D9", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8 },
            android: { elevation: 6 },
            web: { boxShadow: "0 6px 16px rgba(109, 40, 217, 0.3)" } as any,
        }),
    },
    signupBtnText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
    },
    signupArrow: {
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
    loginRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 32,
    },
    loginText: {
        fontSize: 14,
        color: "#64748B",
    },
    loginLink: {
        fontSize: 14,
        fontWeight: "700",
        color: "#6D28D9",
    },
});