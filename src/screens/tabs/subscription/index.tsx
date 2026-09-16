import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    useWindowDimensions,
    ActivityIndicator,
    Alert,
    Platform,
    Clipboard,
} from "react-native";
import { router } from "../../../navigation/RootNavigation";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Rect, Path, Ellipse, Circle } from "react-native-svg";
import { useAppTheme, Spacing, Shadows } from "../../../theme";
import { useAuthStore } from "../../../store/auth.store";

const PLAN_FEATURES_FALLBACK = [
    "All Dashboard Features",
    "AI Insights & Suggestions",
    "Unlimited Transactions",
    "Priority Support",
    "Secure Data & Backups",
];

const PLAN_COLORS: Record<number, { gradient: string[]; accent: string; light: string }> = {
    0: { gradient: ["#7C3AED", "#4F46E5"], accent: "#7C3AED", light: "#F5F3FF" },
    1: { gradient: ["#0EA5E9", "#2563EB"], accent: "#2563EB", light: "#EFF6FF" },
    2: { gradient: ["#059669", "#0D9488"], accent: "#059669", light: "#ECFDF5" },
    3: { gradient: ["#F59E0B", "#EF4444"], accent: "#F59E0B", light: "#FFFBEB" },
};

const FAQ_ITEMS = [
    { q: "Can I cancel anytime?", a: "Yes. You can cancel your subscription at any time. Your plan remains active until the end of the billing period." },
    { q: "Is my payment secure?", a: "Absolutely. All payments are processed via UPI — India's most secure payment infrastructure, backed by NPCI." },
    { q: "What happens after the free trial?", a: "After the 30-day free trial, your selected plan will be activated. You'll receive a reminder before any charges." },
    { q: "Do you offer refunds?", a: "Yes, we offer a 7-day money-back guarantee if you're not satisfied with the service." },
];

export default function SubscriptionIndexScreen() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const { user } = useAuthStore();
    const { colors, isDark } = useAppTheme();

    useEffect(() => {
        fetch("http://localhost:8085/api/plans")
            .then(res => res.json())
            .then(data => { setPlans(data); setLoadingPlans(false); })
            .catch(() => setLoadingPlans(false));
    }, []);

    const handleSubscribe = () => {
        if (!selectedPlanId) {
            Alert.alert("Select a Plan", "Please choose a plan before continuing.");
            return;
        }
        router.push("/payment", { planId: selectedPlanId });
    };

    const handleCopy = (text: string) => {
        if (Platform.OS === "web") {
            (globalThis as any).navigator.clipboard?.writeText(text);
        } else {
            Clipboard.setString(text);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getSelectedPlan = () => plans.find(p => p.id.toString() === selectedPlanId);

    const getDisplayPrice = (plan: any) => {
        const monthly = parseFloat(plan.price) || 0;
        return billingCycle === "yearly" ? Math.floor(monthly * 0.8) : monthly;
    };

    const renderQR = () => (
        <View style={[styles.qrBox, { backgroundColor: "#FFF", borderColor: isDark ? colors.border : "#E2E8F0" }]}>
            <Svg width="100" height="100" viewBox="0 0 21 21">
                <Rect x="0" y="0" width="7" height="7" fill="#111827" />
                <Rect x="1" y="1" width="5" height="5" fill="#FFF" />
                <Rect x="2" y="2" width="3" height="3" fill="#111827" />
                <Rect x="14" y="0" width="7" height="7" fill="#111827" />
                <Rect x="15" y="1" width="5" height="5" fill="#FFF" />
                <Rect x="16" y="2" width="3" height="3" fill="#111827" />
                <Rect x="0" y="14" width="7" height="7" fill="#111827" />
                <Rect x="1" y="15" width="5" height="5" fill="#FFF" />
                <Rect x="2" y="16" width="3" height="3" fill="#111827" />
                <Rect x="8" y="2" width="1" height="1" fill="#111827" /><Rect x="10" y="2" width="2" height="1" fill="#111827" />
                <Rect x="9" y="4" width="1" height="3" fill="#111827" /><Rect x="12" y="5" width="1" height="1" fill="#111827" />
                <Rect x="2" y="8" width="3" height="1" fill="#111827" /><Rect x="6" y="9" width="2" height="2" fill="#111827" />
                <Rect x="10" y="8" width="1" height="3" fill="#111827" /><Rect x="12" y="9" width="3" height="1" fill="#111827" />
                <Rect x="8" y="13" width="2" height="2" fill="#111827" /><Rect x="11" y="12" width="1" height="3" fill="#111827" />
                <Rect x="13" y="14" width="3" height="1" fill="#111827" /><Rect x="17" y="11" width="2" height="2" fill="#111827" />
                <Rect x="9" y="17" width="3" height="1" fill="#111827" /><Rect x="13" y="16" width="2" height="3" fill="#111827" />
                <Rect x="7.5" y="7.5" width="6" height="6" fill="#FFF" rx="1" />
                <Rect x="8.5" y="8.5" width="4" height="4" fill="#7C3AED" rx="0.5" />
            </Svg>
        </View>
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Page Header ── */}
            <View style={styles.pageHeader}>
                <View style={[styles.headerBadge, { backgroundColor: isDark ? "#1E1433" : "#F5F3FF" }]}>
                    <Ionicons name="sparkles" size={14} color="#7C3AED" />
                    <Text style={[styles.headerBadgeText, { color: "#7C3AED" }]}>Upgrade your plan</Text>
                </View>
                <Text style={[styles.pageTitle, { color: colors.text }]}>Simple, Transparent{"\n"}Pricing</Text>
                <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
                    Choose the plan that fits your needs. Upgrade or cancel anytime.
                </Text>

                {/* Billing Toggle */}
                <View style={[styles.toggleWrap, { backgroundColor: isDark ? colors.surface : "#F1F5F9" }]}>
                    {(["monthly", "yearly"] as const).map(cycle => (
                        <TouchableOpacity
                            key={cycle}
                            onPress={() => setBillingCycle(cycle)}
                            activeOpacity={0.85}
                            style={[
                                styles.toggleBtn,
                                billingCycle === cycle && { backgroundColor: colors.primary, ...Shadows.sm },
                            ]}
                        >
                            <Text style={[
                                styles.toggleBtnText,
                                { color: billingCycle === cycle ? "#FFF" : colors.textSecondary },
                            ]}>
                                {cycle === "monthly" ? "Monthly" : "Yearly  🎉 −20%"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* ── Plan Cards ── */}
            {loadingPlans ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
            ) : (
                <View style={[styles.plansGrid, isDesktop && styles.plansGridRow]}>
                    {plans.map((plan, idx) => {
                        const palette = PLAN_COLORS[idx % 4];
                        const price = getDisplayPrice(plan);
                        const yearlyTotal = Math.floor(parseFloat(plan.price) * 12 * 0.8);
                        const isSelected = selectedPlanId === plan.id.toString();
                        const features = plan.description ? plan.description.split(",") : PLAN_FEATURES_FALLBACK;

                        return (
                            <TouchableOpacity
                                key={plan.id}
                                activeOpacity={0.92}
                                onPress={() => setSelectedPlanId(plan.id.toString())}
                                style={[
                                    styles.planCard,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: isSelected ? palette.accent : (isDark ? colors.border : "#E2E8F0"),
                                        borderWidth: isSelected ? 2 : 1,
                                    },
                                    isSelected && { ...Shadows.md },
                                ]}
                            >
                                {/* Card top gradient strip */}
                                <LinearGradient
                                    colors={palette.gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.planCardStrip}
                                />

                                {/* Selected check */}
                                {isSelected && (
                                    <View style={[styles.selectedCheck, { backgroundColor: palette.accent }]}>
                                        <Ionicons name="checkmark" size={12} color="#FFF" />
                                    </View>
                                )}

                                <View style={styles.planCardBody}>
                                    <View style={[styles.planIconCircle, { backgroundColor: isDark ? `${palette.accent}30` : palette.light }]}>
                                        <Ionicons name="flash" size={20} color={palette.accent} />
                                    </View>
                                    <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                                    <Text style={[styles.planType, { color: colors.textSecondary }]}>{plan.type}</Text>

                                    <View style={styles.priceRow}>
                                        <Text style={[styles.priceSymbol, { color: colors.text }]}>₹</Text>
                                        <Text style={[styles.priceValue, { color: colors.text }]}>{price}</Text>
                                        <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>/mo</Text>
                                    </View>
                                    {billingCycle === "yearly" && (
                                        <Text style={[styles.yearlyNote, { color: palette.accent }]}>
                                            ₹{yearlyTotal} billed yearly
                                        </Text>
                                    )}

                                    <View style={[styles.planDivider, { backgroundColor: isDark ? colors.border : "#F1F5F9" }]} />

                                    {features.map((feat: string, fi: number) => (
                                        <View key={fi} style={styles.featureRow}>
                                            <View style={[styles.featureCheck, { backgroundColor: isDark ? `${palette.accent}30` : palette.light }]}>
                                                <Ionicons name="checkmark" size={11} color={palette.accent} />
                                            </View>
                                            <Text style={[styles.featureText, { color: colors.text }]}>{feat.trim()}</Text>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => { setSelectedPlanId(plan.id.toString()); }}
                                    style={styles.selectBtnWrap}
                                >
                                    <LinearGradient
                                        colors={isSelected ? palette.gradient : (isDark ? ["#1E293B", "#1E293B"] : ["#F8FAFC", "#F1F5F9"])}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.selectBtn}
                                    >
                                        <Text style={[styles.selectBtnText, { color: isSelected ? "#FFF" : colors.textSecondary }]}>
                                            {isSelected ? "✓  Selected" : "Select Plan"}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* ── Checkout Panel ── */}
            <View style={[
                styles.checkoutPanel,
                isDesktop && styles.checkoutPanelRow,
                { backgroundColor: isDark ? colors.surface : "#FAFAFA", borderColor: isDark ? colors.border : "#E2E8F0" },
            ]}>
                {/* Left — Order Summary */}
                <View style={styles.checkoutLeft}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>

                    <View style={[styles.summaryBox, { backgroundColor: isDark ? colors.background : "#FFF", borderColor: isDark ? colors.border : "#E2E8F0" }]}>
                        {getSelectedPlan() ? (
                            <>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Plan</Text>
                                    <Text style={[styles.summaryValue, { color: colors.text }]}>{getSelectedPlan()?.name}</Text>
                                </View>
                                <View style={[styles.summaryDivider, { backgroundColor: isDark ? colors.border : "#F1F5F9" }]} />
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Billing</Text>
                                    <Text style={[styles.summaryValue, { color: colors.text }]}>{billingCycle === "monthly" ? "Monthly" : "Yearly"}</Text>
                                </View>
                                <View style={[styles.summaryDivider, { backgroundColor: isDark ? colors.border : "#F1F5F9" }]} />
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Free Trial</Text>
                                    <Text style={[styles.summaryValue, { color: "#10B981" }]}>30 days free</Text>
                                </View>
                                <View style={[styles.summaryDivider, { backgroundColor: isDark ? colors.border : "#F1F5F9" }]} />
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>Total Today</Text>
                                    <Text style={[styles.summaryTotalValue, { color: colors.text }]}>₹0.00</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Then</Text>
                                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                                        ₹{getDisplayPrice(getSelectedPlan())}/{billingCycle === "yearly" ? "mo (billed yearly)" : "month"}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.noSelectionBox}>
                                <Ionicons name="receipt-outline" size={28} color={colors.textSecondary} />
                                <Text style={[styles.noSelectionText, { color: colors.textSecondary }]}>Select a plan to see order summary</Text>
                            </View>
                        )}
                    </View>

                    {/* Current plan info */}
                    <View style={[styles.currentPlanChip, { backgroundColor: isDark ? colors.background : "#F0FDF4", borderColor: isDark ? colors.border : "#BBF7D0" }]}>
                        <Ionicons name="shield-checkmark" size={15} color="#10B981" />
                        <Text style={[styles.currentPlanChipText, { color: isDark ? "#10B981" : "#166534" }]}>
                            Current plan: {user?.subscription?.name || "Free Tier"} · {user?.subscription?.status || "ACTIVE"}
                        </Text>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                        onPress={handleSubscribe}
                        activeOpacity={0.88}
                        style={[styles.ctaWrap, !selectedPlanId && { opacity: 0.5 }]}
                    >
                        <LinearGradient
                            colors={["#7C3AED", "#4F46E5"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaBtn}
                        >
                            <Ionicons name="flash" size={18} color="#FFF" />
                            <Text style={styles.ctaBtnText}>
                                {selectedPlanId ? `Continue with ${getSelectedPlan()?.name}` : "Select a plan to continue"}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={[styles.ctaNote, { color: colors.textSecondary }]}>
                        🔒 30-day free trial · Cancel anytime · No hidden fees
                    </Text>

                    {/* Trust badges */}
                    <View style={styles.trustRow}>
                        {[
                            { icon: "shield-checkmark-outline", label: "256-bit SSL" },
                            { icon: "card-outline", label: "UPI Secured" },
                            { icon: "refresh-outline", label: "Easy Cancel" },
                        ].map((t, i) => (
                            <View key={i} style={[styles.trustBadge, { backgroundColor: isDark ? colors.background : "#FFF", borderColor: isDark ? colors.border : "#E2E8F0" }]}>
                                <Ionicons name={t.icon as any} size={14} color={colors.textSecondary} />
                                <Text style={[styles.trustLabel, { color: colors.textSecondary }]}>{t.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Right — Pay with UPI */}
                <View style={styles.checkoutRight}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Pay with UPI</Text>

                    <View style={[styles.upiCard, { backgroundColor: isDark ? colors.background : "#FFF", borderColor: isDark ? colors.border : "#E2E8F0" }]}>
                        {/* QR */}
                        <View style={styles.qrCenter}>
                            {renderQR()}
                            <Text style={[styles.qrLabel, { color: colors.textSecondary }]}>Scan with any UPI app</Text>
                        </View>

                        <View style={styles.upiOrRow}>
                            <View style={[styles.upiOrLine, { backgroundColor: isDark ? colors.border : "#E2E8F0" }]} />
                            <Text style={[styles.upiOrText, { color: colors.textSecondary }]}>or copy UPI ID</Text>
                            <View style={[styles.upiOrLine, { backgroundColor: isDark ? colors.border : "#E2E8F0" }]} />
                        </View>

                        {/* UPI ID Copy */}
                        <TouchableOpacity
                            onPress={() => handleCopy("platform@upnum")}
                            activeOpacity={0.85}
                            style={[styles.upiIdRow, { backgroundColor: isDark ? colors.surface : "#F8FAFC", borderColor: isDark ? colors.border : "#E2E8F0" }]}
                        >
                            <View style={[styles.upiIdIconBox, { backgroundColor: isDark ? "#1E1433" : "#F5F3FF" }]}>
                                <Ionicons name="wallet-outline" size={16} color="#7C3AED" />
                            </View>
                            <Text style={[styles.upiIdText, { color: colors.text }]}>platform@upnum</Text>
                            <View style={[styles.copyBadge, { backgroundColor: copied ? "#10B981" : (isDark ? colors.border : "#E2E8F0") }]}>
                                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={13} color={copied ? "#FFF" : colors.textSecondary} />
                                <Text style={[styles.copyBadgeText, { color: copied ? "#FFF" : colors.textSecondary }]}>
                                    {copied ? "Copied!" : "Copy"}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* UPI Apps */}
                        <Text style={[styles.upiAppsLabel, { color: colors.textSecondary }]}>Accepted on all UPI apps</Text>
                        <View style={styles.upiAppsRow}>
                            {[
                                { label: "G", color: "#4285F4", name: "GPay" },
                                { label: "Pe", color: "#6D28D9", name: "PhonePe" },
                                { label: "P", color: "#00B9F1", name: "Paytm" },
                                { label: "B", color: "#FF6600", name: "BHIM" },
                                { label: "+", color: "#64748B", name: "More" },
                            ].map((app, i) => (
                                <View key={i} style={styles.upiAppItem}>
                                    <View style={[styles.upiAppCircle, { backgroundColor: `${app.color}18` }]}>
                                        <Text style={[styles.upiAppLetter, { color: app.color }]}>{app.label}</Text>
                                    </View>
                                    <Text style={[styles.upiAppName, { color: colors.textSecondary }]}>{app.name}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* ── FAQ ── */}
            <View style={styles.faqSection}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Frequently Asked Questions</Text>
                {FAQ_ITEMS.map((item, idx) => (
                    <TouchableOpacity
                        key={idx}
                        activeOpacity={0.85}
                        onPress={() => setOpenFaq(openFaq === idx ? null : idx)}
                        style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: isDark ? colors.border : "#E2E8F0" }]}
                    >
                        <View style={styles.faqHeader}>
                            <Text style={[styles.faqQ, { color: colors.text }]}>{item.q}</Text>
                            <Ionicons
                                name={openFaq === idx ? "chevron-up" : "chevron-down"}
                                size={16}
                                color={colors.textSecondary}
                            />
                        </View>
                        {openFaq === idx && (
                            <Text style={[styles.faqA, { color: colors.textSecondary }]}>{item.a}</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: Spacing.xl, paddingBottom: 80, gap: 32 },

    // Header
    pageHeader: { alignItems: "center", gap: 12 },
    headerBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100 },
    headerBadgeText: { fontSize: 12, fontWeight: "700" },
    pageTitle: { fontSize: 28, fontWeight: "800", textAlign: "center", lineHeight: 36 },
    pageSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 22 },
    toggleWrap: { flexDirection: "row", borderRadius: 14, padding: 4, gap: 4, marginTop: 4 },
    toggleBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 10 },
    toggleBtnText: { fontSize: 13, fontWeight: "700" },

    // Plan cards
    plansGrid: { gap: 16 },
    plansGridRow: { flexDirection: "row", flexWrap: "wrap" },
    planCard: {
        flex: 1, minWidth: 220, borderRadius: 20, overflow: "hidden",
        ...Shadows.sm,
    },
    planCardStrip: { height: 5 },
    selectedCheck: {
        position: "absolute", top: 16, right: 16,
        width: 22, height: 22, borderRadius: 11,
        alignItems: "center", justifyContent: "center",
    },
    planCardBody: { padding: 20, gap: 6 },
    planIconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 6 },
    planName: { fontSize: 17, fontWeight: "800" },
    planType: { fontSize: 12, marginBottom: 4 },
    priceRow: { flexDirection: "row", alignItems: "baseline", gap: 2, marginVertical: 8 },
    priceSymbol: { fontSize: 18, fontWeight: "700" },
    priceValue: { fontSize: 34, fontWeight: "900" },
    pricePeriod: { fontSize: 13, marginLeft: 2 },
    yearlyNote: { fontSize: 11, fontWeight: "600", marginTop: -6, marginBottom: 4 },
    planDivider: { height: 1, marginVertical: 12 },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
    featureCheck: { width: 20, height: 20, borderRadius: 6, alignItems: "center", justifyContent: "center" },
    featureText: { fontSize: 13, flex: 1 },
    selectBtnWrap: { margin: 16, marginTop: 4, borderRadius: 12, overflow: "hidden" },
    selectBtn: { height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
    selectBtnText: { fontSize: 14, fontWeight: "700" },

    // Checkout Panel
    checkoutPanel: {
        borderRadius: 24, borderWidth: 1, overflow: "hidden",
        ...Shadows.sm,
    },
    checkoutPanelRow: { flexDirection: "row" },
    checkoutLeft: { flex: 1.2, padding: 24, gap: 16 },
    checkoutRight: { flex: 1, padding: 24, gap: 16 },
    sectionTitle: { fontSize: 16, fontWeight: "800" },

    // Summary
    summaryBox: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
    summaryDivider: { height: 1 },
    summaryLabel: { fontSize: 13 },
    summaryValue: { fontSize: 13, fontWeight: "600" },
    summaryTotalLabel: { fontSize: 14, fontWeight: "800" },
    summaryTotalValue: { fontSize: 18, fontWeight: "900" },
    noSelectionBox: { alignItems: "center", gap: 10, paddingVertical: 24 },
    noSelectionText: { fontSize: 13, textAlign: "center" },

    currentPlanChip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 10, borderWidth: 1 },
    currentPlanChipText: { fontSize: 12, fontWeight: "600", flex: 1 },

    ctaWrap: { borderRadius: 16, overflow: "hidden" },
    ctaBtn: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16 },
    ctaBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
    ctaNote: { fontSize: 11, textAlign: "center" },

    trustRow: { flexDirection: "row", gap: 8 },
    trustBadge: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6 },
    trustLabel: { fontSize: 10, fontWeight: "600" },

    // UPI
    upiCard: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 16, alignItems: "stretch" },
    qrCenter: { alignItems: "center", gap: 10 },
    qrBox: { width: 120, height: 120, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: "center", justifyContent: "center" },
    qrLabel: { fontSize: 12 },
    upiOrRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    upiOrLine: { flex: 1, height: 1 },
    upiOrText: { fontSize: 11, fontWeight: "600" },
    upiIdRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 10, gap: 10 },
    upiIdIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    upiIdText: { flex: 1, fontSize: 13, fontWeight: "700" },
    copyBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    copyBadgeText: { fontSize: 11, fontWeight: "700" },
    upiAppsLabel: { fontSize: 11, fontWeight: "600" },
    upiAppsRow: { flexDirection: "row", justifyContent: "space-between" },
    upiAppItem: { alignItems: "center", gap: 4 },
    upiAppCircle: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    upiAppLetter: { fontSize: 14, fontWeight: "900" },
    upiAppName: { fontSize: 9, fontWeight: "600" },

    // FAQ
    faqSection: { gap: 10 },
    faqItem: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
    faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    faqQ: { fontSize: 14, fontWeight: "700", flex: 1, marginRight: 10 },
    faqA: { fontSize: 13, lineHeight: 20 },
});
