import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { router, navigationRef } from "../../navigation/RootNavigation";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { useAppTheme } from "../../theme";
import { useAuthStore } from "../../store/auth.store";

const SIDEBAR_ITEMS = [
    { title: "Dashboard", route: "/tabs/dashboard", icon: "grid-outline" as const },
    { title: "Transactions", route: "/tabs/transactions", icon: "swap-horizontal-outline" as const },
    { title: "Customers", route: "/tabs/customers", icon: "people-outline" as const },
    { title: "Reports", route: "/tabs/dashboard", icon: "bar-chart-outline" as const },
    { title: "Insights (AI)", route: "/tabs/dashboard/ai-insights", icon: "sparkles-outline" as const, badge: "New" },
    { title: "Subscriptions", route: "/tabs/subscription", icon: "card-outline" as const },
    { title: "Billing History", route: "/tabs/subscription/history", icon: "time-outline" as const },
    { title: "Settings", route: "/tabs/settings", icon: "settings-outline" as const },
    { title: "Help & Support", route: "/tabs/settings", icon: "help-circle-outline" as const },
];

export default function Sidebar() {
    const [pathname, setPathname] = useState(navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name || "" : "");
    const [showPromo, setShowPromo] = useState(true);
    const [activeTab, setActiveTab] = useState("Dashboard");
    const { user } = useAuthStore();
    const { colors, isDark } = useAppTheme();

    React.useEffect(() => {
        if (!navigationRef.isReady()) return;

        const updatePath = () => {
            const currentRoute = navigationRef.getCurrentRoute();
            if (currentRoute) {
                setPathname(currentRoute.name);
            }
        };

        // Initial set
        updatePath();

        const unsubscribe = navigationRef.addListener('state', updatePath);
        return () => {
            unsubscribe();
        };
    }, []);

    React.useEffect(() => {
        if (!pathname) return;

        if (pathname === "/payment") {
            setActiveTab("Subscriptions");
            return;
        }
        const match = SIDEBAR_ITEMS.find(item => item.route === pathname);
        if (match) {
            const activeItem = SIDEBAR_ITEMS.find(item => item.title === activeTab);
            if (!activeItem || activeItem.route !== pathname) {
                setActiveTab(match.title);
            }
        } else {
            const prefixMatch = [...SIDEBAR_ITEMS].reverse().find(item => pathname.startsWith(item.route));
            if (prefixMatch) {
                setActiveTab(prefixMatch.title);
            }
        }
    }, [pathname]);

    const handleNavigate = (title: string, route: string) => {
        setActiveTab(title);
        router.replace(route as any);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.sidebarDark, borderRightColor: colors.border }]}>
            {/* Logo and Tagline */}
            <View style={styles.logoRow}>
                {/* 3D Arrowhead Brand Logo */}
                <Svg width="36" height="36" viewBox="0 0 32 32" style={styles.logoSvg}>
                    <Defs>
                        <SvgGradient id="orangeGrad" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0%" stopColor="#FB923C" />
                            <Stop offset="100%" stopColor="#EA580C" />
                        </SvgGradient>
                        <SvgGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0%" stopColor="#C084FC" />
                            <Stop offset="100%" stopColor="#6B21A8" />
                        </SvgGradient>
                    </Defs>
                    {/* Shadow facet */}
                    <Path d="M 4 20 L 16 22 L 12 28 Z" fill="#4C1D95" />
                    {/* Left facet */}
                    <Path d="M 4 20 L 28 6 L 16 22 Z" fill="url(#orangeGrad)" />
                    {/* Right facet */}
                    <Path d="M 16 22 L 28 6 L 22 28 Z" fill="url(#purpleGrad)" />

                    {/* Sparkles */}
                    <Path d="M 26 2 Q 26 4 24 4 Q 26 4 26 6 Q 26 4 28 4 Q 26 4 26 2 Z" fill="#FB923C" />
                    <Path d="M 30 6 Q 30 7.5 28.5 7.5 Q 30 7.5 30 9 Q 30 7.5 31.5 7.5 Q 30 7.5 30 6 Z" fill="#FDBA74" />
                </Svg>
                <View style={styles.logoTextContainer}>
                    <Text style={styles.logoText}>UP Num</Text>
                    <Text style={styles.logoSub}>Track. Analyze. Grow.</Text>
                </View>
            </View>

            {/* Menu Items */}
            <ScrollView
                style={styles.menuContainer}
                contentContainerStyle={styles.menuScrollContent}
                showsVerticalScrollIndicator={false}
            >
                {SIDEBAR_ITEMS.filter(item => {
                    if (item.title === "Customers" && user?.userType !== "BUSINESS") return false;
                    return true;
                }).map((item, index) => {
                    const isActive = item.title === activeTab;

                    const content = (
                        <View style={styles.menuItemInner}>
                            <Ionicons
                                name={isActive ? (item.icon.replace("-outline", "") as any) : item.icon}
                                size={20}
                                color={isActive ? "#FFFFFF" : colors.textSecondary}
                                style={styles.menuIcon}
                            />
                            <Text style={[styles.menuText, { color: isActive ? "#FFFFFF" : colors.textSecondary }, isActive && styles.menuTextActive]}>
                                {item.title}
                            </Text>
                            {item.badge && (
                                <View style={styles.menuBadge}>
                                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                                </View>
                            )}
                        </View>
                    );

                    return (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.8}
                            onPress={() => handleNavigate(item.title, item.route)}
                            style={styles.menuItemWrapper}
                        >
                            {isActive ? (
                                <LinearGradient
                                    colors={["#EA580C", "#D97706"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.activeGradient}
                                >
                                    {content}
                                </LinearGradient>
                            ) : (
                                <View style={styles.inactiveItem}>
                                    {content}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Promo Card at Bottom */}
            {showPromo && (
                <View style={[styles.promoCard, { backgroundColor: isDark ? colors.surface : "#1E1B4B", borderColor: isDark ? colors.border : "rgba(255, 255, 255, 0.05)" }]}>
                    <TouchableOpacity
                        style={styles.promoCloseBtn}
                        onPress={() => setShowPromo(false)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Crown Row */}
                    <View style={styles.crownRow}>
                        <Svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                            <Path d="M2 21h20v-2H2v2zM22 7l-4 5-4-8-4 8-4-5-2 10h20L22 7z" fill="#F59E0B" />
                        </Svg>
                        <Text style={styles.crownTitle}>You're on Lifetime Plan</Text>
                    </View>

                    <Text style={styles.promoTitle}>Limited Time Offer 🚀</Text>
                    <Text style={[styles.promoText, { color: colors.textSecondary }]}>
                        Lifetime access for first 1000 users at ₹10/month
                    </Text>

                    {/* Progress bar */}
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: isDark ? colors.border : "#334155" }]}>
                            <LinearGradient
                                colors={["#8B5CF6", "#EC4899"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressFill, { width: "62.7%" }]}
                            />
                        </View>
                        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>627 / 1000 users left</Text>
                    </View>

                    <TouchableOpacity activeOpacity={0.9} onPress={() => handleNavigate("Referral", "/tabs/settings")}>
                        <LinearGradient
                            colors={["#EA580C", "#EC4899"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.promoButton}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={styles.promoButtonText}>Refer & Earn</Text>
                                <Ionicons name="chevron-forward-outline" size={12} color="#FFFFFF" style={{ marginLeft: 6 }} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 250,
        height: "100%",
        paddingVertical: 16,
        paddingHorizontal: 16,
        justifyContent: "space-between",
        borderRightWidth: 1,
    },
    logoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    logoSvg: {
        width: 36,
        height: 36,
        marginRight: 12,
    },
    logoTextContainer: {
        justifyContent: "center",
    },
    logoText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    logoSub: {
        color: "#F59E0B",
        fontSize: 10,
        marginTop: 1,
    },
    menuContainer: {
        flex: 1,
        marginVertical: 8,
    },
    menuScrollContent: {
        paddingBottom: 4,
    },
    menuItemWrapper: {
        height: 44,
        borderRadius: 12,
        marginBottom: 4,
        overflow: "hidden",
    },
    activeGradient: {
        flex: 1,
        paddingHorizontal: 12,
        justifyContent: "center",
    },
    inactiveItem: {
        flex: 1,
        paddingHorizontal: 12,
        justifyContent: "center",
    },
    menuItemInner: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    menuIcon: {
        marginRight: 12,
        width: 20,
        textAlign: "center",
    },
    menuText: {
        fontSize: 14,
        fontWeight: "500",
    },
    menuTextActive: {
        fontWeight: "700",
    },
    promoCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        position: "relative",
    },
    promoCloseBtn: {
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 10,
    },
    promoTitle: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
        marginBottom: 6,
    },
    promoText: {
        fontSize: 11,
        lineHeight: 16,
        marginBottom: 12,
    },
    progressContainer: {
        marginBottom: 14,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 6,
    },
    progressFill: {
        height: "100%",
        borderRadius: 3,
    },
    progressLabel: {
        fontSize: 10,
        fontWeight: "500",
    },
    promoButton: {
        height: 38,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    promoButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
    },
    menuBadge: {
        backgroundColor: "#EA580C",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: "auto",
    },
    menuBadgeText: {
        color: "#FFFFFF",
        fontSize: 9,
        fontWeight: "700",
    },
    crownRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    crownTitle: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
});
