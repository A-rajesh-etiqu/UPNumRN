import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    ActivityIndicator,
    Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Path, Circle, Rect, Line, Text as SvgText } from "react-native-svg";
import { useAppTheme, Radius, Spacing, Shadows, Typography } from "../../../theme";
import { useAuthStore } from "../../../store/auth.store";
import { useDashboardStore } from "../../../store/dashboard.store";
import apiClient from "../../../api/apiClient";

const DEFAULT_RECOMMENDATIONS = [
    "Run special offers between 7 PM - 9 PM to boost sales.",
    "Launch weekend deals to leverage high traffic on Saturdays.",
    "Consider upselling in Electronics category.",
    "Bring back inactive customers with personalized offers.",
];

const NEW_RECOMMENDATIONS = [
    "Offer multiple payment options to reduce cart abandonment.",
    "Promote your premium services during peak transaction hours.",
    "Analyze recent transaction data to identify top-selling items and restock them.",
    "Send payment reminders for overdue invoices to improve cash flow.",
];

export default function AiInsightsBusiness() {
    const [selectedTab, setSelectedTab] = useState("Month");
    const [recommendations, setRecommendations] = useState(DEFAULT_RECOMMENDATIONS);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const { colors, isDark } = useAppTheme();
    const { user } = useAuthStore();
    const { data, loading, loadDashboard } = useDashboardStore();

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            const res = await apiClient.post("/dashboard/regenerate-insights", { userId: user?.id });
            if (res.data && res.data.recommendations) {
                // Map object format to string for business UI
                const mapped = res.data.recommendations.map((r: any) => `${r.title}: ${r.desc}`);
                setRecommendations(mapped);
            }
        } catch (error: any) {
            console.error("Failed to regenerate insights", error);
            Alert.alert("Error", error.response?.data?.error || error.message || "Failed to generate insights");
        } finally {
            setIsRegenerating(false);
        }
    };

    useEffect(() => {
        if (!data) {
            loadDashboard(user?.id, selectedTab);
        }
    }, [user?.id, data, selectedTab]);

    if (loading || !data) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const sales = data.income || 0;
    const salesChange = data.incomeChange || 0;
    const txCount = data.transactionsCount || 0;
    const aov = txCount > 0 ? (sales / txCount) : 0;

    const STATS = [
        { title: "Total Sales", value: `₹ ${sales.toLocaleString('en-IN')}`, change: `${salesChange >= 0 ? '+' : ''}${salesChange}%`, period: "vs previous period", color: "#8B5CF6", bg: "#F5F3FF", icon: "wallet" as const },
        { title: "Total Transactions", value: `${txCount}`, change: "+12.4%", period: "vs previous period", color: "#F59E0B", bg: "#FFFBEB", icon: "swap-horizontal" as const },
        { title: "New Customers", value: "312", change: "+15.7%", period: "vs previous period", color: "#3B82F6", bg: "#EFF6FF", icon: "people" as const },
        { title: "Average Order Value", value: `₹ ${aov.toFixed(2)}`, change: "+8.2%", period: "vs previous period", color: "#10B981", bg: "#ECFDF5", icon: "cart" as const },
        { title: "Refunds", value: "₹ 3,240", change: "-3.1%", period: "vs previous period", color: "#EF4444", bg: "#FEE2E2", icon: "refresh" as const },
    ];

    // Heatmap data - 7 days of week, 12 time slots (12AM - 10PM)
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const TIMES = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"];
    
    // Hardcoded opacity matrix to match mockup heatmap density
    const HEATMAP_OPACITY = [
        [0.1, 0.1, 0.2, 0.4, 0.6, 0.8], // Mon
        [0.1, 0.1, 0.3, 0.5, 0.7, 0.6], // Tue
        [0.1, 0.2, 0.4, 0.6, 0.8, 0.7], // Wed
        [0.1, 0.1, 0.3, 0.5, 0.6, 0.8], // Thu
        [0.2, 0.2, 0.5, 0.7, 0.9, 0.9], // Fri
        [0.3, 0.4, 0.7, 0.9, 0.95, 0.95], // Sat
        [0.2, 0.3, 0.6, 0.8, 0.9, 0.7], // Sun
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            {/* Header section with Filter controls */}
            <View style={[styles.headerRow, { borderBottomColor: colors.border }, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                <View>
                    <Text style={[styles.title, { color: colors.text }]}>AI Insights</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Smart insights and recommendations to grow your business.
                    </Text>
                </View>

                {/* Filter Widgets */}
                <View style={styles.filterWidgetRow}>
                    {/* Calendar Range Selector */}
                    <TouchableOpacity style={[styles.rangeSelectorBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.rangeSelectorText, { color: colors.text }]}>This {selectedTab}</Text>
                        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Compare Selector */}
                    <TouchableOpacity style={[styles.compareBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                        <Text style={[styles.compareBtnText, { color: colors.text }]}>Compare: Previous Period</Text>
                        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sub Tabs and Filter Toggle Button */}
            <View style={styles.subHeaderTabsRow}>
                <View style={[styles.tabList, { backgroundColor: isDark ? colors.border : "#E2E8F0" }]}>
                    {["Overview", "Day", "Week", "Month", "Quarter", "Year"].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setSelectedTab(tab)}
                            style={[styles.tabBtn, selectedTab === tab && { backgroundColor: colors.surface }]}
                        >
                            <Text style={[styles.tabBtnText, { color: colors.textSecondary }, selectedTab === tab && { color: colors.text }]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={[styles.filtersToggleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                    <Ionicons name="filter-outline" size={16} color={colors.text} />
                    <Text style={[styles.filtersToggleText, { color: colors.text }]}>Filters</Text>
                </TouchableOpacity>
            </View>

            {/* Stat Cards Grid */}
            <View style={[styles.statsGrid, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                {STATS.map((stat, idx) => (
                    <View key={idx} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.statCardHeader}>
                            <View style={[styles.statIconCircle, { backgroundColor: isDark ? colors.border : stat.bg }]}>
                                <Ionicons name={stat.icon} size={18} color={stat.color} />
                            </View>
                            <View style={[
                                styles.trendBadge,
                                { backgroundColor: stat.change.startsWith("+") 
                                    ? (isDark ? "#064e3b" : "#ECFDF5") 
                                    : (isDark ? "#7f1d1d" : "#FEE2E2") 
                                }
                            ]}>
                                <Ionicons
                                    name={stat.change.startsWith("+") ? "trending-up" : "trending-down"}
                                    size={10}
                                    color={stat.change.startsWith("+") ? colors.success : colors.danger}
                                />
                                <Text style={[styles.trendText, { color: stat.change.startsWith("+") ? colors.success : colors.danger }]}>
                                    {stat.change}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.statCardValue, { color: colors.text }]} adjustsFontSizeToFit numberOfLines={1}>{stat.value}</Text>
                        <Text style={[styles.statCardTitle, { color: colors.textSecondary }]}>{stat.title}</Text>
                        <Text style={[styles.statCardSub, { color: colors.textSecondary }]}>{stat.period}</Text>
                    </View>
                ))}
            </View>

            {/* First Charts row: Sales vs Amount & Sales by Day */}
            <View style={[styles.chartsSectionGrid, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                {/* Sales vs Amount Line Chart */}
                <View style={[styles.chartCard, { flex: 1.6, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.chartHeader}>
                        <Text style={[styles.chartTitle, { color: colors.text }]}>Sales vs Amount</Text>
                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Amount (₹)</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
                                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Transactions</Text>
                            </View>
                        </View>
                    </View>

                    {/* SVG Line Graph */}
                    <View style={styles.lineChartWrapper}>
                        <Svg height="100%" width="100%" viewBox="0 0 450 160">
                            {/* Gridlines */}
                            <Line x1="0" y1="30" x2="450" y2="30" stroke={colors.border} strokeWidth="1" />
                            <Line x1="0" y1="70" x2="450" y2="70" stroke={colors.border} strokeWidth="1" />
                            <Line x1="0" y1="110" x2="450" y2="110" stroke={colors.border} strokeWidth="1" />
                            <Line x1="0" y1="150" x2="450" y2="150" stroke={colors.border} strokeWidth="1.5" />

                            {/* X-axis labels */}
                            <SvgText x="10" y="170" fill={colors.textSecondary} fontSize="10">01 May</SvgText>
                            <SvgText x="85" y="170" fill={colors.textSecondary} fontSize="10">06 May</SvgText>
                            <SvgText x="160" y="170" fill={colors.textSecondary} fontSize="10">11 May</SvgText>
                            <SvgText x="235" y="170" fill={colors.textSecondary} fontSize="10">16 May</SvgText>
                            <SvgText x="310" y="170" fill={colors.textSecondary} fontSize="10">21 May</SvgText>
                            <SvgText x="385" y="170" fill={colors.textSecondary} fontSize="10">26 May</SvgText>
                            <SvgText x="430" y="170" fill={colors.textSecondary} fontSize="10">31 May</SvgText>

                            {/* Line 1 - Amount (Purple/Primary) */}
                            <Path
                                d="M 0,110 C 40,90 60,110 100,75 C 140,50 170,120 210,80 C 250,50 280,30 320,55 C 360,80 400,20 450,15"
                                fill="none"
                                stroke={colors.primary}
                                strokeWidth="3"
                            />
                            {/* Line 2 - Transactions (Orange/Secondary) */}
                            <Path
                                d="M 0,140 C 40,115 60,125 100,100 C 140,85 170,135 210,110 C 250,80 280,60 320,85 C 360,105 400,60 450,45"
                                fill="none"
                                stroke={colors.secondary}
                                strokeWidth="2.5"
                                strokeDasharray="4 4"
                            />

                            {/* Intersect Dots */}
                            <Circle cx="210" cy="80" r="5" fill={colors.primary} stroke={colors.surface} strokeWidth="1.5" />
                            <Circle cx="320" cy="55" r="5" fill={colors.primary} stroke={colors.surface} strokeWidth="1.5" />
                            <Circle cx="320" cy="85" r="4.5" fill={colors.secondary} stroke={colors.surface} strokeWidth="1.5" />
                        </Svg>
                    </View>
                </View>

                {/* Sales by Day of Week Bar Chart */}
                <View style={[styles.chartCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.chartHeader}>
                        <Text style={[styles.chartTitle, { color: colors.text }]}>Sales by Day of Week</Text>
                    </View>

                    {/* Styled View Bar Graph */}
                    <View style={styles.barChartWrapper}>
                        {/* Bars Row */}
                        <View style={styles.barsContainer}>
                            {[
                                { day: "Mon", height: "55%", value: "28.7K" },
                                { day: "Tue", height: "65%", value: "31.2K" },
                                { day: "Wed", height: "52%", value: "27.9K" },
                                { day: "Thu", height: "70%", value: "33.6K" },
                                { day: "Fri", height: "82%", value: "38.9K" },
                                { day: "Sat", height: "98%", value: "45.6K" },
                                { day: "Sun", height: "85%", value: "39.0K" },
                            ].map((bar, idx) => (
                                <View key={idx} style={styles.barItemColumn}>
                                    <Text style={[styles.barHoverValue, { color: colors.text }]}>{bar.value}</Text>
                                    <View style={[styles.barBackground, { backgroundColor: isDark ? colors.border : "#F1F5F9" }]}>
                                        <View style={[styles.barFill, { height: bar.height as any, backgroundColor: colors.primary }]} />
                                    </View>
                                    <Text style={[styles.barLabelText, { color: colors.textSecondary }]}>{bar.day}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Bottom Dashboard details: Heatmap, AI Recommendations & Performance */}
            <View style={[styles.bottomDetailsRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                {/* AI Insights & Actions */}
                <View style={[styles.infoCard, { flex: 1.2, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.insightCardHeader}>
                        <Ionicons name="sparkles" size={20} color={colors.primary} />
                        <Text style={[styles.insightCardTitle, { color: colors.text }]}>AI Insights</Text>
                        <TouchableOpacity 
                            style={[styles.regenerateBtn, { backgroundColor: isDark ? colors.border : "#F5F3FF", borderColor: isDark ? colors.border : "#E9E3FF", opacity: isRegenerating ? 0.7 : 1 }]}
                            onPress={handleRegenerate}
                            disabled={isRegenerating}
                        >
                            {isRegenerating ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Ionicons name="refresh-outline" size={14} color={colors.primary} />
                            )}
                            <Text style={[styles.regenerateText, { color: colors.primary }]}>
                                {isRegenerating ? "Generating..." : "Regenerate Insights"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.recommendationList}>
                        {recommendations.map((rec, idx) => (
                            <View key={idx} style={styles.recItem}>
                                <View style={[styles.checkIconWrapper, { backgroundColor: isDark ? colors.border : "#F5F3FF" }]}>
                                    <Ionicons name="checkmark" size={12} color={colors.primary} />
                                </View>
                                <Text style={[styles.recText, { color: colors.text }]}>{rec}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Confidence & Performance Metrics */}
                <View style={[styles.infoCard, { flex: 0.8, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.insightCardTitle, { color: colors.text }]}>Confidence Score</Text>
                    
                    {/* Circle Gauge */}
                    <View style={styles.gaugeWrapper}>
                        <Svg height="100" width="100%" viewBox="0 0 36 36">
                            <Circle cx="18" cy="18" r="15.915" fill="none" stroke={isDark ? colors.border : "#F1F5F9"} strokeWidth="3" />
                            <Circle
                                cx="18"
                                cy="18"
                                r="15.915"
                                fill="none"
                                stroke={colors.primary}
                                strokeWidth="3"
                                strokeDasharray="100"
                                strokeDashoffset="14"
                                strokeLinecap="round"
                                transform="rotate(-90 18 18)"
                            />
                        </Svg>
                        <View style={styles.gaugeLabels}>
                            <Text style={[styles.gaugePercent, { color: colors.text }]}>86%</Text>
                            <Text style={[styles.gaugeStatus, { color: colors.success }]}>High</Text>
                        </View>
                    </View>

                    <View style={[styles.perfDetails, { borderTopColor: colors.border }]}>
                        <Text style={[styles.perfLabel, { color: colors.text }]}>Peak Performance</Text>
                        <Text style={[styles.perfDesc, { color: colors.textSecondary }]}>Your peak sales hour is 7 PM - 9 PM. You generate 32% more sales.</Text>
                    </View>
                </View>

                {/* Peak Hours Heatmap */}
                <View style={[styles.infoCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.insightCardTitle, { color: colors.text }]}>Peak Hours</Text>
                    
                    {/* Heatmap Grid */}
                    <View style={styles.heatmapWrapper}>
                        {/* Header columns */}
                        <View style={styles.heatmapHeaders}>
                            <View style={styles.heatmapEmptyCorner} />
                            {TIMES.map((time, idx) => (
                                <Text key={idx} style={[styles.heatmapTimeLabel, { color: colors.textSecondary }]}>{time}</Text>
                            ))}
                        </View>
                        
                        {/* Rows */}
                        <View style={styles.heatmapRows}>
                            {DAYS.map((day, dIdx) => (
                                <View key={dIdx} style={styles.heatmapRowItem}>
                                    <Text style={[styles.heatmapDayLabel, { color: colors.textSecondary }]}>{day}</Text>
                                    <View style={styles.heatmapCells}>
                                        {TIMES.map((_, tIdx) => {
                                            const opacity = HEATMAP_OPACITY[dIdx][tIdx];
                                            return (
                                                <View
                                                    key={tIdx}
                                                    style={[
                                                        styles.heatmapCell,
                                                        { backgroundColor: `rgba(108, 44, 244, ${opacity})` } // Uses Primary color dynamically scaled
                                                    ]}
                                                />
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
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
        padding: Spacing.lg,
        paddingBottom: 80,
    },
    headerRow: {
        justifyContent: "space-between",
        borderBottomWidth: 1,
        paddingBottom: 16,
        marginBottom: 20,
        gap: 16,
    },
    title: {
        ...Typography.h2,
    },
    subtitle: {
        ...Typography.bodySmall,
        marginTop: 4,
    },
    filterWidgetRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
    },
    rangeSelectorBtn: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        ...Shadows.sm,
    },
    rangeSelectorText: {
        fontSize: 12,
        fontWeight: "600",
    },
    compareBtn: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        ...Shadows.sm,
    },
    compareBtnText: {
        fontSize: 12,
        fontWeight: "600",
    },
    subHeaderTabsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    tabList: {
        flexDirection: "row",
        borderRadius: 12,
        padding: 4,
    },
    tabBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tabBtnText: {
        fontSize: 12,
        fontWeight: "600",
    },
    filtersToggleBtn: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 6,
        ...Shadows.sm,
    },
    filtersToggleText: {
        fontSize: 12,
        fontWeight: "600",
    },
    statsGrid: {
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        ...Shadows.sm,
    },
    statCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    statIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    trendBadge: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 3,
        gap: 4,
    },
    trendText: {
        fontSize: 10,
        fontWeight: "700",
    },
    statCardValue: {
        fontSize: 22,
        fontWeight: "800",
    },
    statCardTitle: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 6,
    },
    statCardSub: {
        fontSize: 9,
        marginTop: 2,
    },
    chartsSectionGrid: {
        gap: 20,
        marginBottom: 24,
    },
    chartCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        ...Shadows.md,
    },
    chartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: "800",
    },
    chartLegend: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 10,
        fontWeight: "600",
    },
    lineChartWrapper: {
        height: 180,
    },
    barChartWrapper: {
        height: 180,
        justifyContent: "flex-end",
    },
    barsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        height: 150,
        paddingHorizontal: 6,
    },
    barItemColumn: {
        alignItems: "center",
        flex: 1,
        gap: 6,
    },
    barHoverValue: {
        fontSize: 9,
        fontWeight: "700",
    },
    barBackground: {
        height: 110,
        width: 14,
        borderRadius: 8,
        overflow: "hidden",
        justifyContent: "flex-end",
    },
    barFill: {
        width: "100%",
        borderRadius: 8,
    },
    barLabelText: {
        fontSize: 10,
        fontWeight: "600",
    },
    bottomDetailsRow: {
        gap: 20,
    },
    rowLayout: {
        flexDirection: "row",
    },
    columnLayout: {
        flexDirection: "column",
    },
    infoCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        position: "relative",
        overflow: "hidden",
        ...Shadows.md,
    },
    insightCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    },
    insightCardTitle: {
        fontSize: 14,
        fontWeight: "800",
        flex: 1,
    },
    regenerateBtn: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 6,
    },
    regenerateText: {
        fontSize: 10,
        fontWeight: "700",
    },
    recommendationList: {
        gap: 12,
    },
    recItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    checkIconWrapper: {
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2,
    },
    recText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: "500",
    },
    gaugeWrapper: {
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        height: 110,
    },
    gaugeLabels: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    gaugePercent: {
        fontSize: 20,
        fontWeight: "800",
    },
    gaugeStatus: {
        fontSize: 10,
        fontWeight: "700",
        marginTop: 2,
    },
    perfDetails: {
        borderTopWidth: 1,
        paddingTop: 12,
        marginTop: 10,
        gap: 4,
    },
    perfLabel: {
        fontSize: 12,
        fontWeight: "700",
    },
    perfDesc: {
        fontSize: 10,
        lineHeight: 15,
    },
    heatmapWrapper: {
        marginTop: 10,
    },
    heatmapHeaders: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    heatmapEmptyCorner: {
        width: 32,
    },
    heatmapTimeLabel: {
        flex: 1,
        fontSize: 8,
        textAlign: "center",
        fontWeight: "600",
    },
    heatmapRows: {
        gap: 6,
    },
    heatmapRowItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    heatmapDayLabel: {
        width: 32,
        fontSize: 9,
        fontWeight: "600",
    },
    heatmapCells: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 6,
    },
    heatmapCell: {
        flex: 1,
        height: 16,
        borderRadius: 4,
    },
});
export const Platform = { OS: "web" };
