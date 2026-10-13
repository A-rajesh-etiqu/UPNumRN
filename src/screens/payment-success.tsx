import React, { useEffect, useRef } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Animated,
    Easing,
    useWindowDimensions,
    Platform,
} from "react-native";
import { router, useLocalSearchParams } from "../navigation/RootNavigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

import {
    useAppTheme,
    Radius,
    Shadows,
    Spacing,
    Typography,
} from "../theme";

import { useAuthStore } from "../store/auth.store";
import { useSubscriptionStore } from "../store/subscription.store";
import apiClient from "../api/apiClient";

function resolvePlanDetails(planId?: string) {
    const id = String(planId || '').toLowerCase();

    if (id === '1' || id === 'free') {
        return { id: '1', name: 'Free Tier', price: 0, billingCycle: 'MONTHLY' as const, isLifetimeOffer: false, type: 'Basic Features' };
    }
    if (id === '2' || id === 'standard' || id === 'monthly') {
        return { id: '2', name: 'Standard Plan', price: 50, billingCycle: 'MONTHLY' as const, isLifetimeOffer: false, type: 'Advanced Features' };
    }
    if (id === '3' || id === 'premium') {
        return { id: '3', name: 'Premium Plan', price: 150, billingCycle: 'MONTHLY' as const, isLifetimeOffer: false, type: 'All Features' };
    }
    if (id === '4' || id === 'lifetime') {
        return { id: '4', name: 'Lifetime Plan', price: 10, billingCycle: 'MONTHLY' as const, isLifetimeOffer: true, type: 'One-time Offer' };
    }

    return { id: id || '2', name: 'Standard Plan', price: 50, billingCycle: 'MONTHLY' as const, isLifetimeOffer: false, type: 'Advanced Features' };
}

export default function PaymentSuccessScreen() {
    const { planId, planName: paramPlanName, amount: paramAmount } = useLocalSearchParams<{
        planId: string;
        planName?: string;
        amount?: string;
    }>();

    const { colors, isDark } = useAppTheme();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const fallbackPlan = resolvePlanDetails(planId);
    const finalPlanName = paramPlanName || fallbackPlan.name;
    const finalPrice = paramAmount !== undefined ? parseFloat(paramAmount) : fallbackPlan.price;

    // Animations
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Mock transaction ID and date for receipt aesthetic
    const txnId = useRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`).current;
    const formattedDate = useRef(new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })).current;

    useEffect(() => {
        // Trigger store updates
        const activeSub = {
            id: String(planId || fallbackPlan.id),
            name: finalPlanName,
            price: finalPrice,
            currency: "INR" as const,
            billingCycle: fallbackPlan.billingCycle,
            isLifetimeOffer: fallbackPlan.isLifetimeOffer,
            status: "ACTIVE",
        };

        // 1. Automatically Update Auth Store User Subscription
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
            useAuthStore.getState().updateUser({
                ...currentUser,
                subscription: activeSub,
            });
        }

        // 2. Automatically Update Subscription Store
        useSubscriptionStore.getState().setSubscription({
            planId: String(planId || fallbackPlan.id),
            planName: finalPlanName,
            active: true,
            purchasedAt: new Date().toISOString(),
            expiresAt: fallbackPlan.isLifetimeOffer
                ? null
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // 3. Persist Active Subscription to Backend Server Database
        if (currentUser?.id) {
            apiClient.post("/subscriptions/update", {
                userId: currentUser.id,
                planId: String(planId || fallbackPlan.id),
                status: "ACTIVE",
            }).catch(err => console.warn("Backend subscription update failed:", err));
        }

        // Run animation
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();

        // Continuous subtle pulse on checkmark outer ring
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [planId, finalPlanName, finalPrice]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    isDesktop && styles.desktopScrollContent
                ]}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.cardContainer,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                        isDesktop && styles.desktopCard
                    ]}
                >
                    {/* Top Decorative Gradient Header Bar */}
                    <LinearGradient
                        colors={["#10B981", "#059669"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.topGradientBar}
                    />

                    {/* Animated Checkmark Badge Section */}
                    <View style={styles.badgeWrapper}>
                        <Animated.View
                            style={[
                                styles.pulseRing,
                                {
                                    backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "#E6F4EA",
                                    transform: [{ scale: pulseAnim }],
                                },
                            ]}
                        />
                        <LinearGradient
                            colors={["#10B981", "#059669"]}
                            style={styles.iconCircle}
                        >
                            <Ionicons name="checkmark-sharp" size={44} color="#FFFFFF" />
                        </LinearGradient>
                    </View>

                    {/* Title & Subtitle */}
                    <View style={styles.headerTextCol}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.title, { color: colors.text }]}>
                                Payment Successful!
                            </Text>
                            <Text style={styles.partyEmoji}>🎉</Text>
                        </View>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Your subscription has been activated successfully
                        </Text>
                    </View>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5", borderColor: "#10B98133" }]}>
                        <View style={styles.greenDot} />
                        <Text style={styles.statusBadgeText}>TRANSACTION COMPLETED</Text>
                    </View>

                    {/* Receipt Details Card */}
                    <View style={[styles.receiptBox, { backgroundColor: isDark ? colors.background : "#F9FAFB", borderColor: colors.border }]}>
                        {/* Plan Header inside receipt */}
                        <View style={styles.planHeaderRow}>
                            <View>
                                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                                    PURCHASED PLAN
                                </Text>
                                <Text style={[styles.planTitle, { color: colors.text }]}>
                                    {finalPlanName}
                                </Text>
                            </View>
                            <View style={styles.priceContainer}>
                                <Text style={[styles.currencySymbol, { color: colors.primary }]}>₹</Text>
                                <Text style={[styles.priceValue, { color: colors.text }]}>
                                    {finalPrice}
                                </Text>
                            </View>
                        </View>

                        {/* Dashed Separator */}
                        <View style={[styles.dashedDivider, { borderColor: colors.border }]} />

                        {/* Metadata Rows */}
                        <View style={styles.metaRow}>
                            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Transaction Ref</Text>
                            <Text style={[styles.metaValue, { color: colors.text }]}>{txnId}</Text>
                        </View>

                        <View style={styles.metaRow}>
                            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Billing Cycle</Text>
                            <Text style={[styles.metaValue, { color: colors.text }]}>
                                {fallbackPlan.isLifetimeOffer ? "One-time Lifetime Access" : "Monthly Subscription"}
                            </Text>
                        </View>

                        <View style={styles.metaRow}>
                            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Payment Date</Text>
                            <Text style={[styles.metaValue, { color: colors.text }]}>{formattedDate}</Text>
                        </View>

                        <View style={styles.metaRow}>
                            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Payment Method</Text>
                            <View style={styles.methodBadge}>
                                <Ionicons name="flash-outline" size={12} color="#6C2CF4" style={{ marginRight: 4 }} />
                                <Text style={styles.methodText}>UPI Instant Pay</Text>
                            </View>
                        </View>
                    </View>

                    {/* Unlocked Benefits Banner */}
                    <View style={[styles.benefitsBox, { backgroundColor: isDark ? "rgba(108, 44, 244, 0.1)" : "#F5F3FF", borderColor: isDark ? "rgba(108, 44, 244, 0.2)" : "#DDD6FE" }]}>
                        <Text style={[styles.benefitsTitle, { color: colors.primary }]}>
                            ✨ What's unlocked for you:
                        </Text>

                        <View style={styles.benefitList}>
                            <View style={styles.benefitItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={[styles.benefitText, { color: colors.text }]}>Full access to premium tools & features</Text>
                            </View>

                            <View style={styles.benefitItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={[styles.benefitText, { color: colors.text }]}>Real-time AI insights & report generation</Text>
                            </View>

                            <View style={styles.benefitItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={[styles.benefitText, { color: colors.text }]}>24/7 Priority support & automated sync</Text>
                            </View>
                        </View>
                    </View>

                    {/* Buttons CTA */}
                    <View style={styles.actionButtonsCol}>
                        <TouchableOpacity
                            activeOpacity={0.88}
                            style={styles.primaryButtonTouch}
                            onPress={() => {
                                router.replace("/tabs/dashboard");
                            }}
                        >
                            <LinearGradient
                                colors={["#6C2CF4", "#4C1D95"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.primaryButtonGradient}
                            >
                                <Text style={styles.primaryButtonText}>
                                    Continue to Dashboard
                                </Text>
                                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={[styles.secondaryButton, { borderColor: colors.border }]}
                            onPress={() => {
                                router.replace("/tabs/subscription");
                            }}
                        >
                            <Ionicons name="ribbon-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                                View Subscription Details
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing.md,
    },
    desktopScrollContent: {
        paddingVertical: 40,
    },
    cardContainer: {
        width: "100%",
        borderRadius: 24,
        borderWidth: 1,
        overflow: "hidden",
        padding: Spacing.lg,
        alignItems: "center",
        ...Shadows.md,
        ...Platform.select({
            web: {
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            } as any,
        }),
    },
    desktopCard: {
        maxWidth: 520,
        padding: Spacing.xl,
    },
    topGradientBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 6,
    },
    badgeWrapper: {
        marginTop: 12,
        marginBottom: 16,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    pulseRing: {
        position: "absolute",
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    iconCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        justifyContent: "center",
        alignItems: "center",
        ...Shadows.sm,
    },
    headerTextCol: {
        alignItems: "center",
        marginBottom: 14,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    title: {
        ...Typography.h2,
        fontSize: 22,
        fontWeight: "800",
        textAlign: "center",
    },
    partyEmoji: {
        fontSize: 22,
    },
    subtitle: {
        ...Typography.bodySmall,
        marginTop: 4,
        textAlign: "center",
        fontSize: 13,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
        gap: 6,
    },
    greenDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#10B981",
    },
    statusBadgeText: {
        color: "#10B981",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    receiptBox: {
        width: "100%",
        borderRadius: 16,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: 16,
    },
    planHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    receiptLabel: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    planTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginTop: 2,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "baseline",
    },
    currencySymbol: {
        fontSize: 14,
        fontWeight: "700",
        marginRight: 2,
    },
    priceValue: {
        fontSize: 22,
        fontWeight: "800",
    },
    dashedDivider: {
        height: 1,
        borderWidth: 1,
        borderStyle: "dashed",
        marginVertical: 12,
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 4,
    },
    metaLabel: {
        fontSize: 12,
        fontWeight: "500",
    },
    metaValue: {
        fontSize: 12,
        fontWeight: "600",
    },
    methodBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3E8FF",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    methodText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#6C2CF4",
    },
    benefitsBox: {
        width: "100%",
        borderRadius: 14,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: 24,
    },
    benefitsTitle: {
        fontSize: 13,
        fontWeight: "700",
        marginBottom: 8,
    },
    benefitList: {
        gap: 6,
    },
    benefitItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    benefitText: {
        fontSize: 12,
        fontWeight: "500",
    },
    actionButtonsCol: {
        width: "100%",
        gap: 10,
    },
    primaryButtonTouch: {
        width: "100%",
        borderRadius: Radius.lg,
        overflow: "hidden",
        ...Shadows.button,
    },
    primaryButtonGradient: {
        flexDirection: "row",
        paddingVertical: 14,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    secondaryButton: {
        flexDirection: "row",
        width: "100%",
        paddingVertical: 12,
        borderRadius: Radius.lg,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    secondaryButtonText: {
        fontSize: 13,
        fontWeight: "600",
    },
});