import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    useWindowDimensions,
    TextInput,
    Alert,
    Platform,
} from "react-native";
import { router } from "../../../navigation/RootNavigation";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Rect, Path, Ellipse, Circle } from "react-native-svg";
import { useAppTheme, Radius, Spacing, Shadows, Typography } from "../../../theme";
import { useAuthStore } from "../../../store/auth.store";

const PLAN_FEATURES_FALLBACK = [
    "All Dashboard Features",
    "AI Insights & Suggestions",
    "Unlimited Transactions",
    "Priority Support",
    "Secure Data & Backups",
];

export default function SubscriptionIndexScreen() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const { user } = useAuthStore();
    const { colors, isDark } = useAppTheme();

    const [plans, setPlans] = useState<any[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        fetch("http://localhost:8085/api/plans")
            .then(res => res.json())
            .then(data => {
                setPlans(data);
                setLoadingPlans(false);
            })
            .catch(err => {
                console.error("Fetch plans error:", err);
                setLoadingPlans(false);
            });
    }, []);

    const handleSubscribe = (planId: string) => {
        router.push("/payment", { planId });
    };

    const handleCopy = (text: string) => {
        if (Platform.OS === "web") {
            (globalThis as any).navigator.clipboard.writeText(text);
            (globalThis as any).alert("Copied: " + text);
        } else {
            Alert.alert("Success", "Copied to clipboard!");
        }
    };

    // Render a high-fidelity vector QR code pattern with a central white/black UPI logo badge
    const renderQRCode = () => (
        <View style={[styles.qrCodeBorderBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Svg width="110" height="110" viewBox="0 0 21 21">
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

                {/* Timing / Random QR Noise */}
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

                {/* Central UPI Logo Badge */}
                <Rect x="7.5" y="7.5" width="6" height="6" fill={colors.surface} rx="0.5" ry="0.5" />
                <Rect x="8" y="8" width="5" height="5" fill="#059669" rx="0.5" ry="0.5" />
            </Svg>
            {/* Center UPI logo overlay */}
            <View style={[styles.qrBadgeTextContainer, { backgroundColor: colors.text }]}>
                <Text style={[styles.qrBadgeText, { color: colors.surface }]}>UPI</Text>
            </View>
        </View>
    );

    const acceptedApps = [
        { name: "Google Pay", logo: "GPay", color: "#4F46E5", bg: "#EEF2FF" },
        { name: "PhonePe", logo: "Pe", color: "#6D28D9", bg: "#F5F3FF" },
        { name: "Paytm", logo: "Paytm", color: "#2563EB", bg: "#EFF6FF" },
        { name: "BHIM", logo: "BHIM", color: "#059669", bg: "#ECFDF5" },
        { name: "Amazon Pay", logo: "Pay", color: "#EA580C", bg: "#FFF7ED" },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            {/* Toggle Selector */}
            <View style={styles.toggleRow}>
                <View style={[styles.toggleContainer, { backgroundColor: isDark ? colors.border : "#E2E8F0" }]}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setBillingCycle("monthly")}
                        style={[styles.toggleBtn, billingCycle === "monthly" && { backgroundColor: colors.primary }]}
                    >
                        <Text style={[styles.toggleBtnText, { color: colors.textSecondary }, billingCycle === "monthly" && { color: "#FFFFFF" }]}>
                            Monthly
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setBillingCycle("yearly")}
                        style={[styles.toggleBtn, billingCycle === "yearly" && { backgroundColor: colors.primary }]}
                    >
                        <Text style={[styles.toggleBtnText, { color: colors.textSecondary }, billingCycle === "yearly" && { color: "#FFFFFF" }]}>
                            Yearly (Save 20%)
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Layout Wrapper */}
            <View style={[styles.layoutWrapper, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                {/* Left Side Content (Plans & Benefits) */}
                <View style={styles.mainContent}>
                    {/* Plan Grid */}
                    <View style={[styles.planGrid, isDesktop && styles.rowLayout]}>
                        {loadingPlans ? (
                            <Text style={{ color: colors.textSecondary, padding: 20 }}>Loading active plans...</Text>
                        ) : plans.length === 0 ? (
                            <Text style={{ color: colors.textSecondary, padding: 20 }}>No active plans available.</Text>
                        ) : (
                            plans.map((plan, idx) => {
                                const isOdd = idx % 2 !== 0;
                                const currentBorderClass = isOdd ? styles.planCardOrangeBorder : styles.planCardPurpleBorder;
                                const badgeBg = isOdd ? colors.secondary : colors.primary;
                                const badgeText = isOdd ? "LIMITED TIME OFFER" : "MOST POPULAR";
                                const gradientColors = isOdd 
                                    ? (isDark ? ["#FB923C", "#EA580C"] : ["#F97316", "#EA580C"])
                                    : (isDark ? ["#A78BFA", "#7C3AED"] : ["#8B5CF6", "#6D28D9"]);
                                const iconColor = isOdd ? colors.secondary : colors.primary;
                                const cardBorderColor = isOdd 
                                    ? (isDark ? colors.border : "#FED7AA")
                                    : (isDark ? colors.border : "#E9D5FF");

                                const monthlyPrice = parseFloat(plan.price) || 0;
                                const displayPrice = billingCycle === "monthly" 
                                    ? monthlyPrice 
                                    : Math.floor(monthlyPrice * 0.8); // 20% discount
                                const totalYearlyPrice = Math.floor(monthlyPrice * 12 * 0.8);

                                return (
                                    <View key={plan.id} style={[styles.planCard, currentBorderClass, { backgroundColor: colors.surface, borderColor: cardBorderColor }]}>
                                        <View style={[styles.popularBadge, { backgroundColor: badgeBg }]}>
                                            <Text style={styles.popularBadgeText}>{badgeText}</Text>
                                        </View>
                                        <Text style={[styles.planCardTitle, { color: colors.text }]}>{plan.name}</Text>
                                        <Text style={[styles.planCardDesc, { color: colors.textSecondary }]}>{plan.type || "Perfect for businesses"}</Text>

                                        <View style={styles.priceRow}>
                                            <Text style={[styles.priceSymbol, { color: colors.text }]}>₹</Text>
                                            <Text style={[styles.priceValue, { color: colors.text }]}>{displayPrice}</Text>
                                            <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>/month</Text>
                                        </View>
                                        {isOdd && (
                                            <Text style={styles.pricePromoText}>For 1st 1000 users only</Text>
                                        )}

                                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                                        {/* Features */}
                                        <View style={styles.featuresList}>
                                            {(plan.description ? plan.description.split(',') : PLAN_FEATURES_FALLBACK).map((feat: string, fIdx: number) => (
                                                <View key={fIdx} style={styles.featureItem}>
                                                    <Ionicons name="checkmark-circle" size={16} color={iconColor} />
                                                    <Text style={[styles.featureText, { color: colors.text }]}>{feat.trim()}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            onPress={() => handleSubscribe(plan.id.toString())}
                                            style={styles.subscribeBtnWrapper}
                                        >
                                            <LinearGradient
                                                colors={gradientColors}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.subscribeBtn}
                                            >
                                                <Text style={styles.subscribeBtnText}>
                                                    Subscribe for ₹{billingCycle === "monthly" ? displayPrice : totalYearlyPrice}
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                        <Text style={[styles.cardFooter, { color: colors.textSecondary }]}>
                                            {isOdd ? "One-time offer. Limited seats!" : `Billed ${billingCycle} via UPI`}
                                        </Text>
                                    </View>
                                );
                            })
                        )}
                    </View>

                    {/* Why Upgrade Section */}
                    <View style={[styles.whyUpgradeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Why Upgrade to Premium?</Text>
                        <View style={styles.whyWrapperRow}>
                            {/* Crown graphic */}
                            <View style={styles.crownContainer}>
                                <Svg width="80" height="80" viewBox="0 0 100 100">
                                    {/* Pedestal */}
                                    <Ellipse cx="50" cy="80" rx="35" ry="10" fill={isDark ? "#1F2937" : "#F1F5F9"} />
                                    <Ellipse cx="50" cy="80" rx="28" ry="7" fill={isDark ? "#374151" : "#E2E8F0"} />
                                    <Ellipse cx="50" cy="75" rx="20" ry="5" fill={isDark ? "#4B5563" : "#CBD5E1"} />
                                    
                                    {/* Golden Crown */}
                                    <Path d="M 25 70 L 15 35 L 38 52 L 50 25 L 62 52 L 85 35 L 75 70 Z" fill="#FBBF24" />
                                    <Path d="M 50 70 L 50 25 L 62 52 L 85 35 L 75 70 Z" fill="#F59E0B" opacity="0.8" />
                                    
                                    {/* Pedestal Top Overlay */}
                                    <Path d="M 25 70 Q 50 73 75 70 Q 50 67 25 70 Z" fill="#D97706" />

                                    {/* Jewels */}
                                    <Circle cx="15" cy="35" r="3.5" fill="#EF4444" />
                                    <Circle cx="50" cy="25" r="4.5" fill="#3B82F6" />
                                    <Circle cx="85" cy="35" r="3.5" fill="#EF4444" />
                                    <Circle cx="38" cy="52" r="2.5" fill="#10B981" />
                                    <Circle cx="62" cy="52" r="2.5" fill="#10B981" />
                                </Svg>
                            </View>

                            <View style={styles.whyGrid}>
                                <View style={styles.whyItem}>
                                    <Ionicons name="sparkles" size={20} color={colors.primary} />
                                    <Text style={[styles.whyItemTitle, { color: colors.text }]}>AI Powered Insights</Text>
                                    <Text style={[styles.whyItemDesc, { color: colors.textSecondary }]}>Get smart suggestions to boost sales</Text>
                                </View>
                                <View style={styles.whyItem}>
                                    <Ionicons name="bar-chart" size={20} color={colors.info} />
                                    <Text style={[styles.whyItemTitle, { color: colors.text }]}>Real-time Analytics</Text>
                                    <Text style={[styles.whyItemDesc, { color: colors.textSecondary }]}>Track your business performance in real-time</Text>
                                </View>
                                <View style={styles.whyItem}>
                                    <Ionicons name="infinite" size={20} color={colors.success} />
                                    <Text style={[styles.whyItemTitle, { color: colors.text }]}>Unlimited Growth</Text>
                                    <Text style={[styles.whyItemDesc, { color: colors.textSecondary }]}>No limits on transactions or data history</Text>
                                </View>
                                <View style={styles.whyItem}>
                                    <Ionicons name="people" size={20} color={colors.danger} />
                                    <Text style={[styles.whyItemTitle, { color: colors.text }]}>Priority Support</Text>
                                    <Text style={[styles.whyItemDesc, { color: colors.textSecondary }]}>Get faster support whenever you need</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Free Trial Banner */}
                    <View style={[styles.bannerRow, { backgroundColor: isDark ? colors.surface : "#FFF7ED", borderColor: isDark ? colors.border : "#FDBA74" }]}>
                        <View style={styles.bannerInner}>
                            <Ionicons name="alarm-outline" size={22} color={colors.secondary} />
                            <View style={styles.bannerTextContainer}>
                                <Text style={[styles.bannerTitle, { color: isDark ? colors.secondary : "#C2410C" }]}>1st Month Free for All Users!</Text>
                                <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>Your subscription will start after the free trial period.</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.bannerBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                            <Text style={[styles.bannerBtnText, { color: colors.primary }]}>Learn More</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Right Side Content (Checkout & Pay info) */}
                <View style={styles.sidebarSection}>
                    {/* Plan Details Card */}
                    <View style={[styles.sidebarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Plan Details</Text>
                        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={styles.detailIcon} />
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Current Plan</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{user?.subscription?.name || "Free Tier"}</Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                            <Ionicons name="wallet-outline" size={16} color={colors.textSecondary} style={styles.detailIcon} />
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{user?.subscription?.price ? `₹${user.subscription.price}` : "Free"}</Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                            <Ionicons name="time-outline" size={16} color={colors.textSecondary} style={styles.detailIcon} />
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{user?.subscription?.status || "ACTIVE"}</Text>
                        </View>
                    </View>

                    {/* Pay with UPI Card */}
                    <View style={[styles.sidebarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Pay with UPI</Text>
                        <Text style={[styles.cardHeaderSub, { color: colors.textSecondary }]}>Scan any QR using your UPI app</Text>

                        {/* QR Code Graphic Container */}
                        <View style={styles.qrWrapper}>
                            <View style={styles.qrBox}>
                                {renderQRCode()}
                            </View>
                            <View style={styles.upiIdLabelRow}>
                                <Text style={[styles.upiIdLabel, { color: colors.text }]}>UPI ID: you@upi</Text>
                                <TouchableOpacity onPress={() => handleCopy("you@upi")} style={styles.miniCopyBtn}>
                                    <Ionicons name="copy-outline" size={12} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.horizontalDivider, { backgroundColor: colors.border }]} />

                        <Text style={[styles.payIdTitle, { color: colors.textSecondary }]}>or pay using UPI ID</Text>
                        <View style={styles.idPayRow}>
                            <TextInput
                                value="you@upi"
                                editable={false}
                                style={[styles.payInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                            />
                            <TouchableOpacity onPress={() => handleCopy("you@upi")} style={[styles.copyTextBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.copyTextBtnText, { color: colors.primary }]}>Copy</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Popular Apps List */}
                        <Text style={[styles.acceptedTitle, { color: colors.textSecondary }]}>Accepted on all UPI Apps</Text>
                        <View style={styles.appsRow}>
                            {acceptedApps.map((app, idx) => (
                                <View key={idx} style={styles.appCol}>
                                    <View style={[styles.appIcon, { backgroundColor: isDark ? colors.border : app.bg }]}>
                                        <Text style={[styles.appLabel, { color: isDark ? colors.primary : app.color }]}>{app.logo}</Text>
                                    </View>
                                    <Text style={[styles.appNameUnder, { color: colors.textSecondary }]}>{app.name}</Text>
                                </View>
                            ))}
                            <View style={styles.appCol}>
                                <View style={[styles.moreIcon, { backgroundColor: isDark ? colors.border : "#F1F5F9" }]}>
                                    <Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} />
                                </View>
                                <Text style={[styles.appNameUnder, { color: colors.textSecondary }]}>and more</Text>
                            </View>
                        </View>
                    </View>

                    {/* 100% Secure Payments banner */}
                    <View style={[styles.secureBanner, { backgroundColor: isDark ? colors.surface : "#F0FDF4", borderColor: isDark ? colors.border : "#BBF7D0" }]}>
                        <Ionicons name="shield-checkmark" size={22} color={colors.success} />
                        <View style={styles.secureBannerContent}>
                            <Text style={[styles.secureBannerTitle, { color: isDark ? colors.text : "#166534" }]}>100% Secure Payments</Text>
                            <Text style={[styles.secureBannerSub, { color: isDark ? colors.textSecondary : "#15803D" }]}>Your payments are safe and encrypted</Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.xl,
        paddingBottom: 80,
    },
    toggleRow: {
        alignItems: "center",
        marginBottom: 28,
    },
    toggleContainer: {
        flexDirection: "row",
        borderRadius: 14,
        padding: 4,
    },
    toggleBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 10,
    },
    toggleBtnText: {
        fontWeight: "600",
        fontSize: 14,
    },
    layoutWrapper: {
        gap: 24,
    },
    rowLayout: {
        flexDirection: "row",
    },
    columnLayout: {
        flexDirection: "column",
    },
    mainContent: {
        flex: 1.65,
        gap: 24,
    },
    sidebarSection: {
        flex: 1,
        gap: 24,
    },
    planGrid: {
        gap: 20,
    },
    planCard: {
        flex: 1,
        borderRadius: 20,
        padding: 24,
        position: "relative",
        overflow: "hidden",
        borderWidth: 1,
        ...Shadows.sm,
    },
    planCardPurpleBorder: {},
    planCardOrangeBorder: {},
    popularBadge: {
        position: "absolute",
        top: 0,
        alignSelf: "center",
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    popularBadgeText: {
        color: "#FFFFFF",
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    planCardTitle: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 12,
    },
    planCardDesc: {
        fontSize: 11,
        textAlign: "center",
        marginTop: 4,
    },
    priceRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "baseline",
        marginTop: 20,
    },
    priceSymbol: {
        fontSize: 20,
        fontWeight: "700",
        marginRight: 2,
    },
    priceValue: {
        fontSize: 36,
        fontWeight: "800",
    },
    pricePeriod: {
        fontSize: 12,
        marginLeft: 2,
    },
    pricePromoText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#F97316",
        textAlign: "center",
        marginTop: 4,
    },
    divider: {
        height: 1,
        marginVertical: 20,
    },
    featuresList: {
        gap: 12,
        marginBottom: 24,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    featureText: {
        fontSize: 12,
    },
    subscribeBtnWrapper: {
        borderRadius: 12,
        overflow: "hidden",
    },
    subscribeBtn: {
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    subscribeBtnText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
    },
    cardFooter: {
        fontSize: 10,
        textAlign: "center",
        marginTop: 12,
    },
    whyUpgradeContainer: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        ...Shadows.sm,
    },
    sectionHeader: {
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 20,
    },
    whyWrapperRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
    },
    crownContainer: {
        width: 90,
        height: 90,
        justifyContent: "center",
        alignItems: "center",
    },
    whyGrid: {
        flex: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },
    whyItem: {
        width: "47%",
        minWidth: 140,
        flexGrow: 1,
        gap: 6,
    },
    whyItemTitle: {
        fontSize: 12,
        fontWeight: "700",
        marginTop: 2,
    },
    whyItemDesc: {
        fontSize: 10,
        lineHeight: 14,
    },
    bannerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 14,
        ...Shadows.sm,
    },
    bannerInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    bannerTextContainer: {
        flexDirection: "column",
    },
    bannerTitle: {
        fontSize: 13,
        fontWeight: "700",
    },
    bannerDesc: {
        fontSize: 11,
        marginTop: 2,
    },
    bannerBtn: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    bannerBtnText: {
        fontWeight: "700",
        fontSize: 12,
    },
    sidebarCard: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        ...Shadows.sm,
    },
    cardHeaderTitle: {
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 16,
    },
    cardHeaderSub: {
        fontSize: 11,
        marginTop: -12,
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    detailIcon: {
        marginRight: 10,
    },
    detailLabel: {
        fontSize: 12,
        flex: 1,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: "700",
    },
    qrWrapper: {
        alignItems: "center",
        gap: 10,
    },
    qrBox: {
        padding: 4,
        backgroundColor: "#FFFFFF",
    },
    qrCodeBorderBox: {
        width: 128,
        height: 128,
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    qrBadgeTextContainer: {
        position: "absolute",
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 2,
    },
    qrBadgeText: {
        fontSize: 8,
        fontWeight: "900",
    },
    upiIdLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
    },
    upiIdLabel: {
        fontSize: 12,
        fontWeight: "600",
    },
    miniCopyBtn: {
        padding: 2,
    },
    horizontalDivider: {
        height: 1,
        marginVertical: 16,
    },
    payIdTitle: {
        fontSize: 11,
        fontWeight: "600",
        marginBottom: 8,
    },
    idPayRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },
    payInput: {
        flex: 1,
        height: 38,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 12,
        ...Platform.select({
            web: {
                outlineStyle: "none",
            } as any,
        }),
    },
    copyTextBtn: {
        height: 38,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    copyTextBtnText: {
        fontWeight: "700",
        fontSize: 12,
    },
    acceptedTitle: {
        fontSize: 11,
        fontWeight: "600",
        marginBottom: 12,
    },
    appsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    appCol: {
        alignItems: "center",
        gap: 4,
        width: 50,
    },
    appIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    appLabel: {
        fontSize: 8,
        fontWeight: "800",
    },
    appNameUnder: {
        fontSize: 8,
        textAlign: "center",
        width: "100%",
    },
    moreIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    secureBanner: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        ...Shadows.sm,
    },
    secureBannerContent: {
        flexDirection: "column",
    },
    secureBannerTitle: {
        fontSize: 12,
        fontWeight: "700",
    },
    secureBannerSub: {
        fontSize: 10,
        marginTop: 2,
    },
});
