import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    ScrollView,
    useWindowDimensions,
    TouchableOpacity,
    TextInput,
    Platform,
    Alert,
} from "react-native";
import { router, useLocalSearchParams } from "../navigation/RootNavigation";

import { createPayment } from '../services/payment.service';
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Rect, Path } from "react-native-svg";
import Sidebar from "../components/layout/Sidebar";
import { useAppTheme, Radius, Spacing, Shadows, Typography } from "../theme";
import { useAuthStore } from "../store/auth.store";

export default function PaymentScreen() {
    const { planId } = useLocalSearchParams<{
        planId: string;
    }>();

    const { user } = useAuthStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const { colors, isDark } = useAppTheme();

    const [upiIdInput, setUpiIdInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<"pending" | "success">("pending");

    const planName = planId === "lifetime" ? "Lifetime Plan" : "Standard Plan";
    const planPrice = planId === "lifetime" ? "10.00" : "50.00";

    const handlePayNow = async () => {
        setIsProcessing(true);
        try {
            const finalUpiId = upiIdInput.includes('@') ? upiIdInput : `${upiIdInput}@okicici`;

            const response = await createPayment({
                userId: user?.id || "unknown-user",
                orderId: `order-${Date.now()}`,
                planId: planId || "standard",
                amount: Number(planPrice),
                vua: finalUpiId,
            });

            if (response.platformBillID) {
                // For UPI Collect, we just show success after a small delay (simulating user accepting the push notification)
                console.log("UPI Collect Request Sent!", response);
                setTimeout(() => {
                    setStatus("success");
                    setTimeout(() => {
                        router.replace("/payment-success", { planId });
                    }, 1200);
                }, 1500); // Wait 1.5s to simulate "processing"
            } else {
                setIsProcessing(false);
                Alert.alert("Error", "Failed to initiate payment");
            }
        } catch (error: any) {
            console.error("Payment Flow Error:", error);
            setIsProcessing(false);
            Alert.alert("Error", "Payment Flow Error: " + error.message);
        }
    };

    const renderQRCode = () => (
        <Svg width="120" height="120" viewBox="0 0 21 21">
            {/* Top-Left Finder Pattern */}
            <Rect x="0" y="0" width="7" height="7" fill={colors.text} />
            <Rect x="1" y="1" width="5" height="5" fill={colors.surface} />
            <Rect x="2" y="2" width="3" height="3" fill={colors.text} />

            {/* Top-Right Finder Pattern */}
            <Rect x="14" y="0" width="7" height="7" fill={colors.text} />
            <Rect x="15" y="1" width="5" height="5" fill={colors.surface} />
            <Rect x="16" y="2" width="3" height="3" fill={colors.text} />

            {/* Bottom-Left Finder Pattern */}
            <Rect x="0" y="14" width="7" height="7" fill={colors.text} />
            <Rect x="1" y="15" width="5" height="5" fill={colors.surface} />
            <Rect x="2" y="16" width="3" height="3" fill={colors.text} />

            {/* Alignment / Timing Patterns & Random QR Noise */}
            <Rect x="8" y="2" width="1" height="1" fill={colors.text} />
            <Rect x="10" y="2" width="2" height="1" fill={colors.text} />
            <Rect x="9" y="4" width="1" height="3" fill={colors.text} />
            <Rect x="12" y="5" width="1" height="1" fill={colors.text} />

            <Rect x="2" y="8" width="3" height="1" fill={colors.text} />
            <Rect x="6" y="9" width="2" height="2" fill={colors.text} />
            <Rect x="10" y="8" width="1" height="3" fill={colors.text} />
            <Rect x="12" y="9" width="3" height="1" fill={colors.text} />

            <Rect x="8" y="13" width="2" height="2" fill={colors.text} />
            <Rect x="11" y="12" width="1" height="3" fill={colors.text} />
            <Rect x="13" y="14" width="3" height="1" fill={colors.text} />
            <Rect x="17" y="11" width="2" height="2" fill={colors.text} />

            <Rect x="9" y="17" width="3" height="1" fill={colors.text} />
            <Rect x="13" y="16" width="2" height="3" fill={colors.text} />
            <Rect x="16" y="18" width="3" height="1" fill={colors.text} />

            <Path d="M 8,0 H 9 V 1 H 8 Z" fill={colors.text} />
            <Path d="M 0,8 H 1 V 9 H 0 Z" fill={colors.text} />
            <Path d="M 20,8 H 21 V 9 H 20 Z" fill={colors.text} />
        </Svg>
    );

    const mainCheckoutContent = (
        <ScrollView style={[styles.scrollContainer, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            {/* Top Responsive Header Bar */}
            <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
                <View style={styles.headerTitleRow}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.title, { color: colors.text }]}>Complete Your Payment</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Secure payment via UPI. Your subscription will be activated instantly.
                        </Text>
                    </View>
                </View>

                {isDesktop && (
                    <View style={styles.headerWidgets}>
                        {/* Secure Badge */}
                        <View style={[styles.secureBadge, { backgroundColor: isDark ? colors.border : "#F5F3FF", borderColor: colors.border }]}>
                            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                            <View>
                                <Text style={[styles.secureBadgeTitle, { color: colors.text }]}>100% Secure Payments</Text>
                                <Text style={[styles.secureBadgeSub, { color: colors.textSecondary }]}>Safe • Encrypted • Trusted</Text>
                            </View>
                        </View>
                        {/* Profile Info */}
                        <View style={[styles.profileBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={[styles.avatar, { backgroundColor: isDark ? colors.border : "#F5F3FF" }]}>
                                <Ionicons name="person" size={16} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.profileName, { color: colors.text }]}>Amit Sharma</Text>
                                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>you@upi</Text>
                            </View>
                            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                        </View>
                    </View>
                )}
            </View>

            {/* Responsive grid for payment */}
            <View style={[styles.gridWrapper, isDesktop ? styles.rowLayout : styles.columnLayout, { marginTop: 20 }]}>
                {/* Left Side: Pay with UPI Option & Steps */}
                <View style={styles.leftCol}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#6C2CF4", backgroundColor: "#F5F3FF", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 12 }}>Selected Plan</Text>
                    {/* Selected Plan Details Row */}
                    <View style={[styles.planBanner, { backgroundColor: isDark ? colors.surface : "#FFF7ED", borderColor: isDark ? colors.border : "#FFEDD5", marginBottom: 20 }]}>
                        <View style={styles.planBannerLeft}>
                            <View style={[styles.planIconCircle, { backgroundColor: isDark ? colors.border : "#FFEDD5" }]}>
                                <Ionicons name="ribbon-outline" size={24} color={colors.secondary} />
                            </View>
                            <View>
                                <Text style={[styles.planBannerTitle, { color: isDark ? colors.text : "#7C2D12" }]}>
                                    {planName} {planId === "lifetime" && <Text style={styles.limitedLabel}>Limited Offer</Text>}
                                </Text>
                                <Text style={[styles.planBannerSub, { color: colors.textSecondary }]}>For 1st 1000 users only</Text>
                            </View>
                        </View>
                        <View style={styles.planBannerRight}>
                            <Text style={[styles.planBannerPrice, { color: isDark ? colors.text : "#7C2D12" }]}>₹{planPrice}</Text>
                            <Text style={[styles.planBannerPeriod, { color: colors.textSecondary }]}>/month</Text>
                            <Text style={{ fontSize: 9, color: colors.textSecondary }}>One-time offer</Text>
                        </View>
                    </View>

                    <View style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Pay with UPI</Text>
                        <Text style={[styles.cardSectionSub, { color: colors.textSecondary }]}>Scan the QR code using any UPI app</Text>

                        {/* Interactive flow of paying */}
                        <View style={styles.payFlowWrapper}>
                            {/* QR Section */}
                            <View style={[styles.qrCol, { alignItems: "center" }]}>
                                <View style={[styles.qrCodeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    {renderQRCode()}
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                                    <Text style={[styles.upiIdLabel, { color: colors.text }]}>UPI ID: you@upi</Text>
                                    <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
                                </View>
                                <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>OR</Text>
                            </View>
                        </View>

                        {/* Pay using UPI ID manually */}
                        <Text style={[styles.payIdTitle, { color: colors.text, marginTop: 24 }]}>Pay using UPI ID</Text>
                        <Text style={[styles.payIdSub, { color: colors.textSecondary }]}>Enter any UPI ID to make the payment</Text>
                        <View style={styles.upiInputRowMobile}>
                            <TextInput
                                placeholder="Enter UPI ID (e.g. name@upi)"
                                placeholderTextColor={colors.placeholder}
                                value={upiIdInput}
                                onChangeText={setUpiIdInput}
                                style={[styles.upiTextInput, { color: colors.text, marginBottom: 12 }]}
                            />
                            <TouchableOpacity
                                onPress={handlePayNow}
                                style={[styles.payNowBtn, { backgroundColor: colors.primary, width: "100%" }]}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.payNowBtnText}>Pay Now</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Popular UPI Apps */}
                        <Text style={[styles.acceptedAppsTitle, { color: colors.textSecondary, marginTop: 20 }]}>Popular UPI Apps</Text>
                        <View style={[styles.appsRow, { justifyContent: "space-between" }]}>
                            <View style={{ alignItems: "center" }}>
                                <View style={[styles.appBoxIcon, { backgroundColor: isDark ? colors.border : "#EEF2FF" }]}><Text style={{ fontSize: 20 }}>G</Text></View>
                                <Text style={[styles.appTextMobile, { color: colors.textSecondary }]}>Google Pay</Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                                <View style={[styles.appBoxIcon, { backgroundColor: isDark ? colors.border : "#F5F3FF" }]}><Text style={{ fontSize: 20, color: "#6D28D9" }}>P</Text></View>
                                <Text style={[styles.appTextMobile, { color: colors.textSecondary }]}>PhonePe</Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                                <View style={[styles.appBoxIcon, { backgroundColor: isDark ? colors.border : "#EFF6FF" }]}><Text style={{ fontSize: 20, color: "#2563EB" }}>P</Text></View>
                                <Text style={[styles.appTextMobile, { color: colors.textSecondary }]}>Paytm</Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                                <View style={[styles.appBoxIcon, { backgroundColor: isDark ? colors.border : "#ECFDF5" }]}><Text style={{ fontSize: 20, color: "#059669" }}>B</Text></View>
                                <Text style={[styles.appTextMobile, { color: colors.textSecondary }]}>BHIM</Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                                <View style={[styles.appBoxIcon, { backgroundColor: isDark ? colors.border : "#FFF7ED" }]}><Text style={{ fontSize: 20, color: "#EA580C" }}>a</Text></View>
                                <Text style={[styles.appTextMobile, { color: colors.textSecondary }]}>Amazon Pay</Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                                <View style={[styles.moreIconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} /></View>
                                <Text style={[styles.appTextMobile, { color: colors.textSecondary }]}>More</Text>
                            </View>
                        </View>
                    </View>

                    {/* Secure payment banner */}
                    <View style={[styles.secureDetailsBadge, { backgroundColor: isDark ? colors.surface : "#ECFDF5", borderColor: isDark ? colors.border : "#D1FAE5", marginTop: 12 }]}>
                        <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                        <View style={styles.secureDetailsTextCol}>
                            <Text style={[styles.secureDetailsTitle, { color: colors.success }]}>Safe & Secure Payment</Text>
                            <Text style={[styles.secureDetailsSub, { color: colors.textSecondary }]}>Your payment details are encrypted and secure.</Text>
                        </View>
                    </View>
                </View>

                {/* Right Side: Order Summary & Trust Indicators */}
                <View style={styles.rightCol}>
                    {/* Order Summary Card */}
                    <View style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Order Summary</Text>

                        <View style={{ marginTop: 20 }}>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Plan</Text>
                                <Text style={[styles.summaryValue, { color: colors.text }]}>{planName}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Billing Cycle</Text>
                                <Text style={[styles.summaryValue, { color: colors.text }]}>Monthly</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Price</Text>
                                <Text style={[styles.summaryValue, { color: colors.text }]}>₹{planPrice}</Text>
                            </View>
                        </View>

                        <View style={[styles.horizontalDivider, { backgroundColor: colors.border }]} />

                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
                            <Text style={[styles.totalValue, { color: colors.secondary }]}>₹{planPrice}</Text>
                        </View>
                    </View>

                    {/* Premium Benefits List Card */}
                    <View style={[styles.paymentCard, { backgroundColor: isDark ? colors.surface : "#FDF2F8", borderColor: "transparent", marginTop: 16 }]}>
                        <Text style={[styles.cardSectionTitle, { color: colors.text }]}>You're just one step away!</Text>
                        <Text style={[styles.cardSectionSub, { color: colors.textSecondary }]}>With UP Num, you get:</Text>

                        <View style={[styles.premiumList, { marginTop: 20 }]}>
                            <View style={styles.premiumListItemMobile}>
                                <Ionicons name="sparkles-outline" size={20} color="#6C2CF4" style={{ marginTop: 2 }} />
                                <View>
                                    <Text style={[styles.premiumListTitleMobile, { color: colors.text }]}>AI Powered Insights</Text>
                                    <Text style={[styles.premiumListDescMobile, { color: colors.textSecondary }]}>Smart suggestions to boost sales</Text>
                                </View>
                            </View>
                            <View style={styles.premiumListItemMobile}>
                                <Ionicons name="bar-chart-outline" size={20} color="#6C2CF4" style={{ marginTop: 2 }} />
                                <View>
                                    <Text style={[styles.premiumListTitleMobile, { color: colors.text }]}>Real-time Analytics</Text>
                                    <Text style={[styles.premiumListDescMobile, { color: colors.textSecondary }]}>Track performance in real-time</Text>
                                </View>
                            </View>
                            <View style={styles.premiumListItemMobile}>
                                <Ionicons name="infinite-outline" size={20} color="#6C2CF4" style={{ marginTop: 2 }} />
                                <View>
                                    <Text style={[styles.premiumListTitleMobile, { color: colors.text }]}>Unlimited Transactions</Text>
                                    <Text style={[styles.premiumListDescMobile, { color: colors.textSecondary }]}>No limits on transactions or</Text>
                                </View>
                            </View>
                            <View style={styles.premiumListItemMobile}>
                                <Ionicons name="chatbubbles-outline" size={20} color="#6C2CF4" style={{ marginTop: 2 }} />
                                <View>
                                    <Text style={[styles.premiumListTitleMobile, { color: colors.text }]}>Priority Support</Text>
                                    <Text style={[styles.premiumListDescMobile, { color: colors.textSecondary }]}>Get faster support</Text>
                                </View>
                            </View>
                            <View style={styles.premiumListItemMobile}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6C2CF4" style={{ marginTop: 2 }} />
                                <View>
                                    <Text style={[styles.premiumListTitleMobile, { color: colors.text }]}>Secure Data & Backups</Text>
                                    <Text style={[styles.premiumListDescMobile, { color: colors.textSecondary }]}>Your data is safe & backed up</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Trial Banner */}
            <View style={[styles.trialBanner, { backgroundColor: isDark ? colors.surface : "#FFFBEB", borderColor: isDark ? colors.border : "#FDE68A" }]}>
                <Ionicons name="time-outline" size={24} color={colors.secondary} />
                <View>
                    <Text style={[styles.trialTitle, { color: isDark ? colors.secondary : "#92400E" }]}>1st Month Free for All Users!</Text>
                    <Text style={[styles.trialDesc, { color: colors.textSecondary }]}>Your subscription will start after the free trial period.</Text>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {isDesktop ? (
                <View style={styles.desktopLayoutRow}>
                    <Sidebar />
                    <View style={styles.desktopContentCol}>
                        {isProcessing || status === "success" ? (
                            <View style={[styles.statusContainer, { backgroundColor: colors.background }]}>
                                {isProcessing ? (
                                    <>
                                        <ActivityIndicator size="large" color={colors.primary} />
                                        <Text style={[styles.statusTitle, { color: colors.text }]}>Processing Payment...</Text>
                                        <Text style={[styles.statusSub, { color: colors.textSecondary }]}>Please wait while we activate your subscription.</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={90} color={colors.success} />
                                        <Text style={[styles.statusTitle, { color: colors.text }]}>Payment Successful</Text>
                                    </>
                                )}
                            </View>
                        ) : (
                            mainCheckoutContent
                        )}
                    </View>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {isProcessing || status === "success" ? (
                        <View style={[styles.statusContainer, { backgroundColor: colors.background }]}>
                            {isProcessing ? (
                                <>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={[styles.statusTitle, { color: colors.text }]}>Processing Payment...</Text>
                                    <Text style={[styles.statusSub, { color: colors.textSecondary }]}>Please wait while we activate your subscription.</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={90} color={colors.success} />
                                    <Text style={[styles.statusTitle, { color: colors.text }]}>Payment Successful</Text>
                                </>
                            )}
                        </View>
                    ) : (
                        mainCheckoutContent
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    desktopLayoutRow: {
        flex: 1,
        flexDirection: "row",
    },
    desktopContentCol: {
        flex: 1,
        height: "100%",
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        paddingBottom: 10,
        marginBottom: 12,
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        ...Shadows.sm,
    },
    title: {
        ...Typography.h3,
    },
    subtitle: {
        ...Typography.bodySmall,
        marginTop: 2,
    },
    headerWidgets: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    secureBadge: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 6,
    },
    secureBadgeTitle: {
        fontSize: 10,
        fontWeight: "700",
    },
    secureBadgeSub: {
        fontSize: 8,
    },
    profileBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 6,
        ...Shadows.sm,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    profileName: {
        fontSize: 11,
        fontWeight: "700",
    },
    profileEmail: {
        fontSize: 9,
    },
    planBanner: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    planBannerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    planIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    planBannerTitle: {
        fontSize: 14,
        fontWeight: "800",
        flexDirection: "row",
        alignItems: "center",
    },
    limitedLabel: {
        backgroundColor: "#F97316",
        color: "#FFFFFF",
        fontSize: 8,
        fontWeight: "800",
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        borderRadius: 5,
        marginLeft: 6,
    },
    planBannerSub: {
        fontSize: 10,
        marginTop: 1,
    },
    planBannerRight: {
        flexDirection: "row",
        alignItems: "baseline",
    },
    planBannerPrice: {
        fontSize: 18,
        fontWeight: "800",
    },
    planBannerPeriod: {
        fontSize: 11,
        marginLeft: 2,
    },
    gridWrapper: {
        gap: 16,
    },
    rowLayout: {
        flexDirection: "row",
    },
    columnLayout: {
        flexDirection: "column",
    },
    leftCol: {
        flex: 1.6,
        gap: 16,
    },
    rightCol: {
        flex: 1,
        gap: 16,
    },
    paymentCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        position: "relative",
        overflow: "hidden",
        ...Shadows.sm,
    },
    cardSectionTitle: {
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 3,
    },
    cardSectionSub: {
        fontSize: 11,
        marginBottom: 14,
    },
    payFlowWrapper: {
        gap: 16,
        alignItems: "center",
    },
    qrCol: {
        alignItems: "center",
        paddingHorizontal: 8,
    },
    qrCodeBox: {
        padding: 6,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 8,
        ...Shadows.sm,
    },
    upiIdLabel: {
        fontSize: 11,
        fontWeight: "700",
    },
    verticalDivider: {
        width: 1,
        height: 140,
    },
    horizontalDivider: {
        height: 1,
        marginVertical: 12,
    },
    stepsCol: {
        flex: 1,
        width: "100%",
        gap: 10,
    },
    stepsTitle: {
        fontSize: 12,
        fontWeight: "800",
        marginBottom: 2,
    },
    stepItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    stepNumber: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    stepNumText: {
        fontSize: 10,
        fontWeight: "700",
    },
    stepText: {
        fontSize: 11,
        fontWeight: "700",
    },
    stepSub: {
        fontSize: 9,
        marginTop: 0.5,
    },
    payIdTitle: {
        fontSize: 12,
        fontWeight: "800",
        marginBottom: 2,
    },
    payIdSub: {
        fontSize: 10,
        marginBottom: 10,
    },
    upiInputRow: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40,
        gap: 10,
    },
    upiTextInput: {
        flex: 1,
        fontSize: 12,
        borderWidth: 0,
        padding: 0,
        ...Platform.select({
            web: {
                outlineStyle: "none",
            } as any,
        }),
    },
    payNowBtn: {
        borderRadius: 8,
        height: 30,
        paddingHorizontal: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    payNowBtnText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 11,
    },
    acceptedAppsTitle: {
        fontSize: 10,
        fontWeight: "700",
        marginTop: 12,
        marginBottom: 6,
    },
    appsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
    },
    appBox: {
        paddingHorizontal: 8,
        height: 22,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: "center",
    },
    appText: {
        fontSize: 8,
        fontWeight: "800",
    },
    moreIcon: {
        width: 28,
        height: 22,
        borderRadius: 5,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    summaryItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 11,
    },
    summaryValue: {
        fontSize: 11,
        fontWeight: "700",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: "800",
    },
    totalValue: {
        fontSize: 15,
        fontWeight: "800",
    },
    secureDetailsBadge: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        gap: 8,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 2,
                shadowOffset: { width: 0, height: 1 },
            },
            android: {
                elevation: 1,
            },
            web: {
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            } as any,
        }),
    },
    secureDetailsTextCol: {
        flex: 1,
    },
    secureDetailsTitle: {
        fontSize: 11,
        fontWeight: "700",
    },
    secureDetailsSub: {
        fontSize: 9,
        marginTop: 1,
    },
    premiumList: {
        gap: 8,
    },
    premiumListItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    premiumListText: {
        fontSize: 11,
        fontWeight: "600",
    },
    crownWatermark: {
        position: "absolute",
        right: 10,
        bottom: -15,
        opacity: 0.8,
    },
    trialBanner: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        gap: 10,
        marginTop: 16,
    },
    trialTitle: {
        fontSize: 12,
        fontWeight: "700",
    },
    trialDesc: {
        fontSize: 10,
        marginTop: 1,
    },
    statusContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing.xl,
    },
    statusTitle: {
        ...Typography.h2,
        marginTop: 30,
    },
    statusSub: {
        ...Typography.body,
        textAlign: "center",
        marginTop: 12,
        lineHeight: 24,
    },
    upiInputRowMobile: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 8,
        padding: 12,
        backgroundColor: "#FFFFFF",
    },
    appBoxIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    appTextMobile: {
        fontSize: 8,
        fontWeight: "600",
    },
    moreIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        marginBottom: 4,
    },
    premiumListItemMobile: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 16,
    },
    premiumListTitleMobile: {
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 2,
    },
    premiumListDescMobile: {
        fontSize: 10,
    },
});