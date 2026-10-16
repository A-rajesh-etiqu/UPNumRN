import React, { useState, useEffect, useMemo, useRef } from "react";
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
    Pressable,
} from "react-native";
import { router } from "../../../navigation/RootNavigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Rect, Path, Ellipse, Circle, Stop, LinearGradient as SvgLinearGradient, Defs } from "react-native-svg";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import { useAppTheme, Spacing, Shadows } from "../../../theme";
import { useAuthStore } from "../../../store/auth.store";
import { ENV } from "../../../config/env";
import {
    loadRazorpayCheckoutScript,
    launchDirectRazorpayCheckout,
} from "../../../services/razorpay.service";

const DEFAULT_PLANS = [
    { id: 1, name: "Free Tier", type: "Basic Features", price: 0, billing: "Monthly", status: "Active", subscribers: 12543, description: "Basic Dashboard Features,100 Transactions/mo,Community Support,Standard Data Backups" },
    { id: 2, name: "Standard Plan", type: "Advanced Features", price: 50, billing: "Monthly", status: "Active", subscribers: 5234, description: "All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,Priority Support,Secure Data & Backups" },
    { id: 3, name: "Premium Plan", type: "All Features", price: 150, billing: "Monthly", status: "Active", subscribers: 1845, description: "All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,24/7 Dedicated Support,Secure Data & Backups,API Access" },
    { id: 4, name: "Lifetime Plan", type: "One-time Offer", price: 10, billing: "Monthly", status: "Active", subscribers: 980, description: "All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,Priority Support,Secure Data & Backups" },
    { id: 5, name: "Standard Yearly", type: "Advanced Features", price: 500, billing: "Yearly", status: "Active", subscribers: 2100, description: "All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,Priority Support,Secure Data & Backups" },
    { id: 6, name: "Premium Yearly", type: "All Features", price: 1400, billing: "Yearly", status: "Active", subscribers: 890, description: "All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,24/7 Dedicated Support,Secure Data & Backups,API Access" },
];

const Crown3D = () => (
    <Svg width="72" height="72" viewBox="0 0 100 100" fill="none">
        <Ellipse cx="50" cy="86" rx="34" ry="7" fill="#6366F1" fillOpacity="0.2" />
        <Ellipse cx="50" cy="78" rx="28" ry="9" fill="#4F46E5" />
        <Path d="M22 78 C22 85 78 85 78 78 L74 72 C74 77 26 77 26 72 Z" fill="#4338CA" />
        <Path d="M24 70 L18 38 L38 52 L50 28 L62 52 L82 38 L76 70 Z" fill="url(#crown_gold)" />
        <Circle cx="18" cy="36" r="5" fill="#FBBF24" />
        <Circle cx="50" cy="26" r="6" fill="#F59E0B" />
        <Circle cx="82" cy="36" r="5" fill="#FBBF24" />
        <Circle cx="38" cy="52" r="3.5" fill="#EF4444" />
        <Circle cx="62" cy="52" r="3.5" fill="#3B82F6" />
        <Path d="M24 66 C24 70 76 70 76 66 L76 70 C76 74 24 74 24 70 Z" fill="#D97706" />
        <Defs>
            <SvgLinearGradient id="crown_gold" x1="18" y1="26" x2="82" y2="70" gradientUnits="userSpaceOnUse">
                <Stop offset="0%" stopColor="#FDE047" />
                <Stop offset="45%" stopColor="#F59E0B" />
                <Stop offset="100%" stopColor="#D97706" />
            </SvgLinearGradient>
        </Defs>
    </Svg>
);

export default function SubscriptionIndexScreen() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

    const { width } = useWindowDimensions();
    const isDesktop = width >= 960;
    const { user, updateUser } = useAuthStore();
    const { colors, isDark } = useAppTheme();

    const isBusinessUser = user?.userType === "BUSINESS";
    const userEmailOrHandle = user?.email || user?.mobile || "you@upi";

    useEffect(() => {
        loadRazorpayCheckoutScript();
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadPlans = async () => {
            const findDefaultPlanId = (plansList: any[]) => {
                if (user?.subscription?.id) {
                    const subIdStr = user.subscription.id.toString();
                    const match = plansList.find((p: any) => p.id.toString() === subIdStr);
                    if (match) return match.id.toString();
                }
                if (user?.subscription?.name) {
                    const subName = user.subscription.name.toLowerCase();
                    const match = plansList.find((p: any) => (p.name || "").toLowerCase() === subName);
                    if (match) return match.id.toString();
                }
                return plansList[0] ? plansList[0].id.toString() : null;
            };

            try {
                const url = `${ENV.API_BASE_URL}/plans${user?.id ? `?userId=${user.id}` : ""}`;
                const res = await fetch(url);
                if (res.ok) {
                    let data = await res.json();
                    if (isMounted && Array.isArray(data) && data.length > 0) {
                        const activePlans = data.filter((p: any) => (p.status || "Active").toLowerCase() === "active");
                        const listToUse = activePlans.length > 0 ? activePlans : data;
                        setPlans(listToUse);
                        setSelectedPlanId(prev => (prev && listToUse.some((d: any) => d.id.toString() === prev)) ? prev : findDefaultPlanId(listToUse));
                        setLoadingPlans(false);
                        return;
                    }
                }
            } catch (err) {
                console.log("Error loading plans from backend, using default fallback plans:", err);
            }

            if (isMounted) {
                setPlans(DEFAULT_PLANS);
                setSelectedPlanId(prev => (prev && DEFAULT_PLANS.some((f: any) => f.id.toString() === prev)) ? prev : findDefaultPlanId(DEFAULT_PLANS));
                setLoadingPlans(false);
            }
        };

        loadPlans();
        return () => { isMounted = false; };
    }, [user?.id, user?.subscription?.id, user?.subscription?.name]);

    const visiblePlans = useMemo(() => {
        return plans.filter((plan: any) => {
            const b = (plan.billing || "").toLowerCase();
            if (billingCycle === "monthly") {
                return b === "monthly" || b === "month";
            } else {
                return b === "yearly" || b === "annual";
            }
        });
    }, [plans, billingCycle]);

    useEffect(() => {
        if (visiblePlans.length > 0 && !visiblePlans.some((p: any) => p.id.toString() === selectedPlanId)) {
            setSelectedPlanId(visiblePlans[0].id.toString());
        }
    }, [visiblePlans]);

    const selectedPlan = useMemo(() => {
        return plans.find(p => p.id.toString() === selectedPlanId) || visiblePlans[0] || plans[0];
    }, [plans, visiblePlans, selectedPlanId]);

    const isOfferPlan = (plan: any) => {
        if (!plan) return false;
        const name = (plan.name || "").toLowerCase();
        const type = (plan.type || "").toLowerCase();
        const billing = (plan.billing || "").toLowerCase();
        return (
            name.includes("lifetime") ||
            name.includes("welcome") ||
            type.includes("one-time") ||
            billing === "one-time" ||
            plan.id === 4 ||
            plan.id === "4"
        );
    };

    const getNextBillingDateStr = () => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = String(d.getDate()).padStart(2, "0");
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month}, ${year}`;
    };

    const handleSubscribe = async (planIdToSub?: string) => {
        const targetId = planIdToSub || selectedPlanId;
        if (!targetId) {
            Alert.alert("Select a Plan", "Please choose a plan before continuing.");
            return;
        }

        if (!user?.id) {
            Alert.alert(
                "Sign In Required",
                "Please sign in or create an account to activate a subscription.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Sign In", onPress: () => router.push("/auth/login") }
                ]
            );
            return;
        }

        const targetPlan = plans.find(p => p.id.toString() === targetId) || selectedPlan;
        const checkoutAmt = targetPlan ? (parseFloat(targetPlan.price) || 0) : 50;

        setIsProcessingPayment(true);
        setProcessingPlanId(targetId);

        try {
            // 1. If Free Plan (₹0), activate directly
            if (checkoutAmt === 0) {
                const newSubscription = {
                    id: String(targetId),
                    name: targetPlan?.name || "Free Tier",
                    price: 0,
                    currency: "INR" as const,
                    billingCycle: "MONTHLY",
                    isLifetimeOffer: false,
                    status: "ACTIVE",
                };
                updateUser({
                    ...user,
                    subscription: newSubscription,
                    planId: targetId,
                });
                Alert.alert("Success", "Free Tier activated successfully!");
                setSelectedPlanId(targetId);
                setIsProcessingPayment(false);
                setProcessingPlanId(null);
                return;
            }

            const userName = user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "";

            // 2. Launch Razorpay Checkout directly with encoded keys
            await launchDirectRazorpayCheckout({
                amount: checkoutAmt,
                planName: targetPlan?.name || "Selected Plan",
                user: {
                    id: user.id,
                    name: userName,
                    email: user.email || "",
                    mobile: user.mobile || "",
                },
                onSuccess: async (paymentId: string) => {
                    console.log("Razorpay payment completed successfully. Payment ID:", paymentId);

                    const newSubscription = {
                        id: String(targetId),
                        name: targetPlan?.name || "Standard Plan",
                        price: checkoutAmt,
                        currency: "INR" as const,
                        billingCycle: (targetPlan?.billing || "monthly").toUpperCase(),
                        isLifetimeOffer: isOfferPlan(targetPlan),
                        status: "ACTIVE",
                    };

                    updateUser({
                        ...user,
                        subscription: newSubscription,
                        planId: String(targetId),
                    });

                    // Background sync with backend to record payment & update user plan
                    try {
                        const syncRes = await fetch(`${ENV.API_BASE_URL}/subscriptions/update`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                userId: user.id,
                                planId: targetId,
                                paymentId: paymentId,
                                amount: checkoutAmt,
                                provider: "RAZORPAY",
                            }),
                        });
                        const syncData = await syncRes.json();
                        console.log("Subscription update response from backend:", syncData);
                    } catch (syncErr) {
                        console.error("Background sync error:", syncErr);
                    }

                    setIsProcessingPayment(false);
                    setProcessingPlanId(null);

                    router.push("/payment-success", {
                        planId: targetId,
                        planName: targetPlan?.name || "Selected Plan",
                        amount: String(checkoutAmt),
                        paymentId: paymentId,
                    });
                },
                onError: (err: any) => {
                    setIsProcessingPayment(false);
                    setProcessingPlanId(null);
                    Alert.alert("Payment Failed", err?.description || "Payment could not be completed.");
                },
                onClose: () => {
                    setIsProcessingPayment(false);
                    setProcessingPlanId(null);
                },
            });
        } catch (err: any) {
            console.error("Payment initiation error:", err);
            setIsProcessingPayment(false);
            setProcessingPlanId(null);
            Alert.alert("Payment Error", err.message || "Unable to initiate payment.");
        }
    };

    const renderPlanCard = (plan: any) => {
        const isSelected = selectedPlanId === plan.id.toString();
        const isOffer = isOfferPlan(plan);
        const isPopular = plan.name.toLowerCase().includes("standard") || plan.id === 2 || plan.id === "2";
        const priceNum = parseFloat(plan.price) || 0;

        const accentColor = isOffer ? "#F97316" : (isPopular ? "#6366F1" : "#4F46E5");
        const borderColor = isSelected
            ? accentColor
            : (isOffer ? "#FDBA74" : (isPopular ? "#C7D2FE" : (isDark ? colors.border : "#E2E8F0")));

        const defaultFeatures = plan.description ? plan.description.split(",") : [
            "All Dashboard Features",
            "AI Insights & Suggestions",
            "Unlimited Transactions",
            "Priority Support",
            "Secure Data & Backups"
        ];

        let features = defaultFeatures;
        if (isBusinessUser) {
            const pIdStr = plan.id ? plan.id.toString() : "";
            const nameLower = (plan.name || "").toLowerCase();
            if (pIdStr === "1" || nameLower.includes("free")) {
                features = ["Customer Directory & Ledger", "100 Transactions/mo", "Basic GST Reports", "Community Support"];
            } else if (pIdStr === "2" || nameLower.includes("standard")) {
                features = ["Unlimited Customer Ledgers", "Automated Payment Reminders", "AI Sales & Revenue Insights", "Unlimited Transactions", "Priority Business Support"];
            } else if (pIdStr === "3" || nameLower.includes("premium")) {
                features = ["All Standard Features", "Multi-user & Employee Roles", "Advanced GST & Tax Export", "WhatsApp / SMS Links", "24/7 Dedicated Support"];
            } else if (pIdStr === "4" || nameLower.includes("lifetime") || nameLower.includes("offer")) {
                features = ["Introductory Business Suite", "Unlimited Customer Ledgers", "AI Sales Insights", "Priority Support", "Secure Data & Backups"];
            } else if (nameLower.includes("yearly")) {
                features = ["All Standard & Premium Features", "Annual Billing Savings", "Priority Business Support", "Secure Cloud Backups"];
            }
        }

        const periodStr = (plan.billing || "").toLowerCase() === "yearly" ? "/year" : "/month";

        return (
            <Pressable
                key={plan.id}
                onPress={() => setSelectedPlanId(plan.id.toString())}
                style={[
                    styles.planCard,
                    visiblePlans.length === 1 && isDesktop && { maxWidth: 450, alignSelf: "center" },
                    {
                        backgroundColor: isDark ? colors.surface : "#FFF",
                        borderColor: borderColor,
                        borderWidth: isSelected || isPopular || isOffer ? 2 : 1,
                    },
                    isSelected && Shadows.md,
                ]}
            >
                {/* Floating Badge at Top Center */}
                {isPopular && (
                    <View style={[styles.floatingBadge, { backgroundColor: "#6366F1" }]}>
                        <Text style={styles.floatingBadgeText}>MOST POPULAR</Text>
                    </View>
                )}
                {isOffer && (
                    <View style={[styles.floatingBadge, { backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA" }]}>
                        <Text style={[styles.floatingBadgeText, { color: "#EA580C" }]}>🎁 LIMITED TIME OFFER</Text>
                    </View>
                )}

                <View style={styles.planCardHeader}>
                    <Text style={[styles.planCardTitle, { color: colors.text }]}>{plan.name}</Text>
                    <Text style={[styles.planCardSubtitle, { color: colors.textSecondary }]}>
                        {isOffer ? "One-time offer for early users" : (isBusinessUser ? "Perfect for small businesses" : "Full feature personal access")}
                    </Text>

                    <View style={styles.planPriceRow}>
                        <Text style={[styles.planPriceSymbol, { color: accentColor }]}>₹</Text>
                        <Text style={[styles.planPriceAmount, { color: accentColor }]}>{priceNum}</Text>
                        <Text style={[styles.planPricePeriod, { color: colors.textSecondary }]}>{periodStr}</Text>
                    </View>

                    {isOffer && (
                        <Text style={styles.offerSubNote}>For 1st 1000 users only</Text>
                    )}
                </View>

                {/* Feature Checklist */}
                <View style={styles.planFeaturesList}>
                    {features.map((feat: string, fi: number) => (
                        <View key={fi} style={styles.featureItemRow}>
                            <View style={[styles.featureCheckCircle, { borderColor: accentColor }]}>
                                <Ionicons name="checkmark" size={12} color={accentColor} />
                            </View>
                            <Text style={[styles.featureItemText, { color: colors.text }]}>{feat.trim()}</Text>
                        </View>
                    ))}
                </View>

                {/* Subscribe Button */}
                <TouchableOpacity
                    activeOpacity={0.88}
                    disabled={isProcessingPayment}
                    onPress={() => handleSubscribe(plan.id.toString())}
                    style={[
                        styles.planCardBtn,
                        { backgroundColor: accentColor },
                        isProcessingPayment && processingPlanId === plan.id.toString() && { opacity: 0.85 }
                    ]}
                >
                    {isProcessingPayment && processingPlanId === plan.id.toString() ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.planCardBtnText}>
                            {priceNum === 0 ? "Get Started Free" : `Subscribe for ₹${priceNum}`}
                        </Text>
                    )}
                </TouchableOpacity>

                <Text style={[styles.planCardSubtext, { color: colors.textSecondary }]}>
                    {isOffer ? "One-time offer. Limited seats!" : `Billed ${(plan.billing || "monthly").toLowerCase()} via UPI`}
                </Text>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? colors.background : "#F8FAFC" }]}>
            <DashboardHeader
                title="Subscription"
                subtitle={
                    isBusinessUser
                        ? "Choose the best plan to grow your business with AI-powered insights."
                        : "Choose the best plan to manage your personal finances with AI-powered insights."
                }
            />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Monthly / Yearly Pill Toggle ── */}
                <View style={styles.toggleRowWrap}>
                    <View style={[styles.toggleContainer, { backgroundColor: isDark ? colors.surface : "#FFF", borderColor: isDark ? colors.border : "#E2E8F0" }]}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => setBillingCycle("monthly")}
                            style={[styles.togglePill, billingCycle === "monthly" && styles.togglePillActive]}
                        >
                            <Text style={[styles.togglePillText, billingCycle === "monthly" && styles.togglePillTextActive]}>Monthly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => setBillingCycle("yearly")}
                            style={[styles.togglePill, billingCycle === "yearly" && styles.togglePillActive]}
                        >
                            <Text style={[styles.togglePillText, billingCycle === "yearly" && styles.togglePillTextActive]}>Yearly</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── 1. Full-Width Plan Cards Section ── */}
                {loadingPlans ? (
                    <ActivityIndicator size="large" color="#6366F1" style={{ marginVertical: 40 }} />
                ) : (
                    <View style={[styles.planCardsGrid, !isDesktop && styles.planCardsGridMobile]}>
                        {visiblePlans.map(plan => renderPlanCard(plan))}
                    </View>
                )}

                {/* ── 2. Why Upgrade to Premium? & Plan Details Cards Side-by-Side ── */}
                <View style={[styles.bottomCardsRow, !isDesktop && styles.bottomCardsColumn]}>

                    {/* Left: Why Upgrade to Premium? Banner */}
                    <View style={[styles.whyBannerCard, { backgroundColor: isDark ? "#1E1B4B" : "#FAF5FF", borderColor: isDark ? colors.border : "#F3E8FF" }]}>
                        <View style={styles.whyBannerLeft}>
                            <Crown3D />
                        </View>

                        <View style={styles.whyBannerContent}>
                            <Text style={[styles.whyBannerTitle, { color: colors.text }]}>Why Upgrade to Premium?</Text>

                            <View style={styles.whyFeaturesGrid}>
                                <View style={styles.whyFeatureItem}>
                                    <View style={[styles.whyIconCircle, { backgroundColor: "#F3E8FF" }]}>
                                        <Ionicons name="sparkles" size={16} color="#7C3AED" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.whyFeatureTitle, { color: colors.text }]}>AI Powered Insights</Text>
                                        <Text style={[styles.whyFeatureDesc, { color: colors.textSecondary }]}>
                                            {isBusinessUser ? "Get smart suggestions to boost your sales" : "Get smart suggestions to boost your savings"}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.whyFeatureItem}>
                                    <View style={[styles.whyIconCircle, { backgroundColor: "#EFF6FF" }]}>
                                        <Ionicons name="stats-chart" size={16} color="#2563EB" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.whyFeatureTitle, { color: colors.text }]}>Real-time Analytics</Text>
                                        <Text style={[styles.whyFeatureDesc, { color: colors.textSecondary }]}>
                                            {isBusinessUser ? "Track your business performance in real-time" : "Track your personal spending in real-time"}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.whyFeatureItem}>
                                    <View style={[styles.whyIconCircle, { backgroundColor: "#F5F3FF" }]}>
                                        <Ionicons name="trending-up" size={16} color="#6366F1" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.whyFeatureTitle, { color: colors.text }]}>Unlimited Growth</Text>
                                        <Text style={[styles.whyFeatureDesc, { color: colors.textSecondary }]}>
                                            No limits on transactions or data history
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.whyFeatureItem}>
                                    <View style={[styles.whyIconCircle, { backgroundColor: "#ECFDF5" }]}>
                                        <Ionicons name="headset" size={16} color="#059669" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.whyFeatureTitle, { color: colors.text }]}>Priority Support</Text>
                                        <Text style={[styles.whyFeatureDesc, { color: colors.textSecondary }]}>
                                            Get faster support whenever you need
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Right: Plan Details Card */}
                    <View style={[styles.planDetailsCard, { backgroundColor: isDark ? colors.surface : "#FFF", borderColor: isDark ? colors.border : "#E2E8F0" }]}>
                        <View style={styles.planDetailsHeader}>
                            <Text style={[styles.sidebarCardTitle, { color: colors.text }]}>Plan Details</Text>
                            {selectedPlan && (
                                <View style={[styles.selectedPlanBadge, { backgroundColor: isDark ? "#312E81" : "#EEF2FF" }]}>
                                    <Text style={[styles.selectedPlanBadgeText, { color: "#6366F1" }]}>{selectedPlan.name}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.planDetailRow}>
                            <View style={styles.planDetailLeft}>
                                <View style={[styles.planDetailIconBox, { backgroundColor: "#F5F3FF" }]}>
                                    <Ionicons name="calendar-outline" size={16} color="#6366F1" />
                                </View>
                                <Text style={[styles.planDetailLabel, { color: colors.textSecondary }]}>Billing Cycle</Text>
                            </View>
                            <Text style={[styles.planDetailValue, { color: colors.text }]}>
                                {selectedPlan ? (selectedPlan.billing || billingCycle) : "Monthly"}
                            </Text>
                        </View>

                        <View style={styles.planDetailRow}>
                            <View style={styles.planDetailLeft}>
                                <View style={[styles.planDetailIconBox, { backgroundColor: "#F5F3FF" }]}>
                                    <Ionicons name="cash-outline" size={16} color="#6366F1" />
                                </View>
                                <Text style={[styles.planDetailLabel, { color: colors.textSecondary }]}>Amount</Text>
                            </View>
                            <Text style={[styles.planDetailValue, { color: colors.text }]}>
                                ₹{selectedPlan ? parseFloat(selectedPlan.price) || 0 : 50} / {(selectedPlan?.billing || billingCycle).toLowerCase() === "yearly" ? "year" : "month"}
                            </Text>
                        </View>

                        <View style={styles.planDetailRow}>
                            <View style={styles.planDetailLeft}>
                                <View style={[styles.planDetailIconBox, { backgroundColor: "#F5F3FF" }]}>
                                    <Ionicons name="time-outline" size={16} color="#6366F1" />
                                </View>
                                <Text style={[styles.planDetailLabel, { color: colors.textSecondary }]}>Next Billing Date</Text>
                            </View>
                            <Text style={[styles.planDetailValue, { color: colors.text }]}>
                                {getNextBillingDateStr()}
                            </Text>
                        </View>

                        {/* Direct Razorpay Checkout Action */}
                        <TouchableOpacity
                            activeOpacity={0.88}
                            disabled={isProcessingPayment}
                            onPress={() => handleSubscribe(selectedPlanId || undefined)}
                            style={[
                                styles.razorpayPayBtn,
                                { backgroundColor: isOfferPlan(selectedPlan) ? "#F97316" : "#4F46E5" }
                            ]}
                        >
                            {isProcessingPayment && (!processingPlanId || processingPlanId === selectedPlanId) ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <View style={styles.razorpayBtnInner}>
                                    <Ionicons name="lock-closed" size={15} color="#FFF" />
                                    <Text style={styles.razorpayPayBtnText}>
                                        {selectedPlan && (parseFloat(selectedPlan.price) || 0) === 0
                                            ? "Activate Free Tier"
                                            : `Pay ₹${selectedPlan ? parseFloat(selectedPlan.price) || 0 : 50} via Razorpay`}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* 100% Secure Payments Footer */}
                        <View style={[styles.securePaymentsBox, { backgroundColor: isDark ? colors.background : "#F0FDF4", borderColor: isDark ? colors.border : "#DCFCE7", marginTop: 4 }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.securePaymentsTitle, { color: isDark ? "#4ADE80" : "#15803D" }]}>100% Secure Payments</Text>
                                <Text style={[styles.securePaymentsSubtitle, { color: isDark ? "#86EFAC" : "#166534" }]}>Your payments are safe and encrypted via Razorpay</Text>
                            </View>
                        </View>
                    </View>

                </View>

                {/* ── 3. 1st Month Free Banner ── */}
                <View style={[styles.freeTrialBanner, { backgroundColor: isDark ? "#422006" : "#FEFCE8", borderColor: "#FDE68A" }]}>
                    <View style={styles.freeTrialIconBadge}>
                        <Ionicons name="timer-outline" size={20} color="#EA580C" />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.freeTrialTitle, { color: isDark ? "#FEF08A" : "#854D0E" }]}>
                            1st Month Free for All Users!
                        </Text>
                        <Text style={[styles.freeTrialSubtitle, { color: isDark ? "#FDE68A" : "#A16207" }]}>
                            Your subscription will start after the free trial period.
                        </Text>
                    </View>
                    <TouchableOpacity style={[styles.freeTrialBtn, { borderColor: "#6366F1" }]}>
                        <Text style={styles.freeTrialBtnText}>Learn More</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 60, gap: 20 },

    // Toggle
    toggleRowWrap: { alignItems: "center", marginVertical: 8 },
    toggleContainer: { flexDirection: "row", borderRadius: 10, padding: 4, borderWidth: 1 },
    togglePill: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8 },
    togglePillActive: { backgroundColor: "#6366F1" },
    togglePillText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
    togglePillTextActive: { color: "#FFF" },

    // Full-Width Plan Cards Grid
    planCardsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 20,
        width: "100%",
        alignItems: "stretch",
    },
    planCardsGridMobile: {
        flexDirection: "column",
        gap: 16,
    },

    planCard: {
        flex: 1,
        minWidth: 260,
        borderRadius: 20,
        padding: 24,
        paddingTop: 32,
        position: "relative",
        justifyContent: "space-between",
    },
    floatingBadge: {
        position: "absolute",
        top: -12,
        alignSelf: "center",
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 12,
    },
    floatingBadgeText: { fontSize: 11, fontWeight: "800", color: "#FFF" },
    planCardHeader: { gap: 4, marginBottom: 16 },
    planCardTitle: { fontSize: 20, fontWeight: "800" },
    planCardSubtitle: { fontSize: 12, marginBottom: 8 },
    planPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 2, marginTop: 4 },
    planPriceSymbol: { fontSize: 22, fontWeight: "800" },
    planPriceAmount: { fontSize: 38, fontWeight: "900" },
    planPricePeriod: { fontSize: 13, marginLeft: 2 },
    offerSubNote: { fontSize: 12, fontWeight: "700", color: "#EA580C", marginTop: 2 },

    planFeaturesList: { gap: 10, marginVertical: 16 },
    featureItemRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    featureCheckCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
    featureItemText: { fontSize: 13, fontWeight: "500", flex: 1 },

    planCardBtn: { height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 12 },
    planCardBtnText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
    planCardSubtext: { fontSize: 11, textAlign: "center", marginTop: 8 },

    // Bottom Cards Row (Why Upgrade + Plan Details side-by-side)
    bottomCardsRow: {
        flexDirection: "row",
        gap: 20,
        width: "100%",
        alignItems: "stretch",
    },
    bottomCardsColumn: {
        flexDirection: "column",
    },

    // Why Banner Card
    whyBannerCard: {
        flex: 1.3,
        minWidth: 320,
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
        flexDirection: "row",
        gap: 20,
        alignItems: "center",
        justifyContent: "space-between",
    },
    whyBannerLeft: { alignItems: "center", justifyContent: "center" },
    whyBannerContent: { flex: 1, minWidth: 220, gap: 16 },
    whyBannerTitle: { fontSize: 18, fontWeight: "800" },
    whyFeaturesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
    whyFeatureItem: { width: "47%", minWidth: 160, flexDirection: "row", alignItems: "center", gap: 10 },
    whyIconCircle: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    whyFeatureTitle: { fontSize: 13, fontWeight: "700" },
    whyFeatureDesc: { fontSize: 11, lineHeight: 15 },

    // Plan Details Card
    planDetailsCard: {
        flex: 1,
        minWidth: 300,
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
        gap: 14,
        justifyContent: "space-between",
    },
    planDetailsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 2,
    },
    selectedPlanBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    selectedPlanBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    sidebarCardTitle: { fontSize: 16, fontWeight: "800" },

    planDetailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    planDetailLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    planDetailIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    planDetailLabel: { fontSize: 13, fontWeight: "500" },
    planDetailValue: { fontSize: 13, fontWeight: "700" },

    // 1st Month Free Banner
    freeTrialBanner: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" },
    freeTrialIconBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFEDD5", alignItems: "center", justifyContent: "center" },
    freeTrialTitle: { fontSize: 14, fontWeight: "800" },
    freeTrialSubtitle: { fontSize: 12 },
    freeTrialBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, backgroundColor: "#FFF" },
    freeTrialBtnText: { fontSize: 13, fontWeight: "700", color: "#6366F1" },

    securePaymentsBox: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
    securePaymentsTitle: { fontSize: 13, fontWeight: "800" },
    securePaymentsSubtitle: { fontSize: 11 },

    // Razorpay Checkout Button in Sidebar
    razorpayPayBtn: {
        marginTop: 6,
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    razorpayBtnInner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    razorpayPayBtnText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0.2,
    },
});
