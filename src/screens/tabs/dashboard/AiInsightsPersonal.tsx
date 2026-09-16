import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    TextInput,
    ActivityIndicator,
    Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Svg, { Path, Circle } from "react-native-svg";
import { PieChart } from "react-native-gifted-charts";
import { useAppTheme, Spacing, Shadows, Typography } from "../../../theme";
import { useAuthStore } from "../../../store/auth.store";
import { useDashboardStore } from "../../../store/dashboard.store";
import apiClient from "../../../api/apiClient";

const DEFAULT_RECOMMENDATIONS = [
    { title: "Set Shopping Budget", desc: "Create a monthly shopping budget of ₹7,500 to stay in control.", icon: "bag-outline", color: "#8B5CF6", bg: "#F5F3FF", btnText: "Set Budget" },
    { title: "Try 50/30/20 Rule", desc: "Allocate 50% for needs, 30% for wants, 20% for savings.", icon: "pie-chart-outline", color: "#3B82F6", bg: "#EFF6FF", btnText: "Learn More" },
    { title: "Automate Savings", desc: "Automatically save ₹1,500 every month on payday.", icon: "sync-outline", color: "#10B981", bg: "#ECFDF5", btnText: "Setup Now" },
    { title: "Track Subscriptions", desc: "Review and optimize your active subscriptions to save more.", icon: "card-outline", color: "#F59E0B", bg: "#FFFBEB", btnText: "Review" },
];

const NEW_RECOMMENDATIONS = [
    { title: "Review Recent Transactions", desc: "You have 3 unusual transactions this week. Review them now.", icon: "list-outline", color: "#EF4444", bg: "#FEE2E2", btnText: "Review" },
    { title: "Optimize Payment Methods", desc: "Use UPI for small payments to track expenses better.", icon: "card-outline", color: "#3B82F6", bg: "#EFF6FF", btnText: "Learn More" },
    { title: "Save on Groceries", desc: "Your grocery transactions are up by 15%. Consider buying in bulk.", icon: "cart-outline", color: "#10B981", bg: "#ECFDF5", btnText: "View Deals" },
    { title: "Manage Utility Bills", desc: "Set up auto-pay for your electricity and water bills to avoid late fees.", icon: "flash-outline", color: "#F59E0B", bg: "#FFFBEB", btnText: "Setup Now" },
];

export default function AiInsightsPersonal() {
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
                setRecommendations(res.data.recommendations);
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
            loadDashboard(user?.id, "This Month");
        }
    }, [user?.id, data]);

    if (loading || !data) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const userName = user?.firstName || "User";
    const expenses = data.expenses || 0;
    const expenseChange = data.expenseChange || 0;
    const savings = data.savings || 0;
    const savingsChange = data.savingsChange || 0;
    const topCat = data.topCategories?.[0] || { label: "N/A", percent: 0, amount: 0, color: "#6C2CF4" };
    const goalProgress = data.goal ? ((data.goal.current / data.goal.target) * 100).toFixed(0) : 0;
    const income = data.income || 1;
    const savingsRate = ((savings / income) * 100).toFixed(0);

    const STATS = [
        { 
            title: "Spending Trend", 
            value: `₹${expenses.toLocaleString('en-IN')}`, 
            change: `Your expenses ${expenseChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(expenseChange)}%`, 
            isUp: expenseChange >= 0, 
            color: expenseChange >= 0 ? "#EF4444" : "#10B981", 
            bg: expenseChange >= 0 ? "#FEE2E2" : "#ECFDF5", 
            icon: expenseChange >= 0 ? "trending-up" : "trending-down" 
        },
        { 
            title: "Savings Rate", 
            value: `${savingsRate}%`, 
            change: `Savings rate ${savingsChange >= 0 ? 'improved' : 'dropped'}`, 
            isUp: savingsChange >= 0, 
            color: savingsChange >= 0 ? "#3B82F6" : "#EF4444", 
            bg: savingsChange >= 0 ? "#EFF6FF" : "#FEE2E2", 
            icon: "pie-chart-outline" 
        },
        { 
            title: "Top Spending Category", 
            value: `${topCat.label} (${topCat.percent}%)`, 
            change: `₹${topCat.amount.toLocaleString('en-IN')} spent this month`, 
            isUp: null, 
            color: "#F59E0B", 
            bg: "#FFFBEB", 
            icon: "pricetag-outline" 
        },
        { 
            title: "Goal Progress", 
            value: `${goalProgress}%`, 
            change: "You're on track to reach your goal", 
            isUp: null, 
            color: "#8B5CF6", 
            bg: "#F5F3FF", 
            icon: "target" 
        },
    ];

    const pieData = data.pieData?.length ? data.pieData : [{ value: 100, color: '#E2E8F0' }];
    
    const getInsightConfig = (type: string) => {
        switch (type) {
            case 'warning': return { icon: 'warning-outline', color: '#EF4444', bg: '#FEE2E2' };
            case 'success': return { icon: 'leaf-outline', color: '#10B981', bg: '#ECFDF5' };
            default: return { icon: 'information-circle-outline', color: '#3B82F6', bg: '#EFF6FF' };
        }
    };

    const aiInsights = data.aiInsights?.length ? data.aiInsights : [
        { id: "1", title: "No Insights Yet", description: "Keep tracking your expenses to get personalized AI insights.", type: "info" }
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            {/* Header section with Filter controls */}
            <View style={[styles.headerRow, { borderBottomColor: colors.border }, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                <View>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <Text style={[styles.title, { color: colors.text }]}>AI Insights</Text>
                        <Ionicons name="sparkles" size={24} color="#8B5CF6" />
                    </View>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Smart analysis of your money habits and personalized recommendations
                    </Text>
                </View>

                {/* Filter Widgets */}
                <View style={styles.filterWidgetRow}>
                    <TouchableOpacity style={[styles.rangeSelectorBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.rangeSelectorText, { color: colors.text }]}>This Month</Text>
                        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.compareBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                        <Ionicons name="filter-outline" size={14} color={colors.text} />
                        <Text style={[styles.compareBtnText, { color: colors.text }]}>Filters</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.compareBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                        <Ionicons name="download-outline" size={14} color={colors.text} />
                        <Text style={[styles.compareBtnText, { color: colors.text }]}>Download Report</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Greeting Card */}
            <View style={[styles.greetingCard, { backgroundColor: isDark ? colors.surface : "#F9FAFB", borderColor: colors.border }]}>
                <View style={styles.greetingLeft}>
                    <View style={[styles.aiIconCircle, { backgroundColor: "#8B5CF6" }]}>
                        <Ionicons name="sparkles" size={12} color="#FFF" style={styles.aiSparkleIcon} />
                        <Text style={styles.aiIconText}>Ai</Text>
                    </View>
                    <View>
                        <Text style={[styles.greetingTitle, { color: colors.text }]}>Hi {userName}! 👋</Text>
                        <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
                            I've analyzed your finances. Your expenses changed by {Math.abs(expenseChange)}% and your savings rate is {savingsRate}%.
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={[styles.howAiWorksBtn, { borderColor: "#8B5CF6" }]}>
                    <Ionicons name="help-circle-outline" size={16} color="#8B5CF6" />
                    <Text style={[styles.howAiWorksText, { color: "#8B5CF6" }]}>How AI Works</Text>
                </TouchableOpacity>
            </View>

            {/* Stat Cards Grid */}
            <View style={[styles.statsGrid, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                {STATS.map((stat, idx) => (
                    <View key={idx} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.statCardHeader}>
                            <Text style={[styles.statCardTitle, { color: colors.textSecondary }]}>{stat.title}</Text>
                            <View style={[styles.statIconCircle, { backgroundColor: isDark ? colors.border : stat.bg }]}>
                                <Ionicons name={stat.icon as any} size={16} color={stat.color} />
                            </View>
                        </View>
                        <View style={styles.statValueRow}>
                            <Text style={[styles.statCardValue, { color: colors.text }]} adjustsFontSizeToFit numberOfLines={1}>{stat.value}</Text>
                            {stat.isUp !== null && (
                                <Ionicons name={stat.isUp ? "arrow-up" : "arrow-down"} size={16} color={stat.color} />
                            )}
                        </View>
                        <Text style={[styles.statCardSub, { color: colors.textSecondary }]}>{stat.change}</Text>
                        
                        <TouchableOpacity style={styles.viewDetailsBtn}>
                            <Text style={styles.viewDetailsText}>View details</Text>
                            <Ionicons name="arrow-forward" size={12} color="#6C2CF4" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* Middle 3 Columns */}
            <View style={[styles.middleGrid, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                
                {/* 1. Spending Behavior Analysis */}
                <View style={[styles.infoCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.insightCardTitle, { color: colors.text }]}>Spending Behavior Analysis</Text>
                    <Text style={[styles.insightCardSub, { color: colors.textSecondary, marginBottom: 20 }]}>Here's how your spending looks</Text>
                    
                    <View style={styles.pieChartContainer}>
                        <View style={{ alignItems: "center", justifyContent: "center", width: 140 }}>
                            <PieChart
                                data={pieData}
                                donut
                                radius={55}
                                innerRadius={35}
                                innerCircleColor={colors.surface}
                            />
                        </View>

                        <View style={styles.legendContainer}>
                            {(data.topCategories || []).map((item, idx) => (
                                <View key={idx} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                    <Text style={[styles.legendText, { color: colors.textSecondary }]} numberOfLines={1}>{item.label}</Text>
                                    <View style={styles.legendValues}>
                                        <Text style={[styles.legendValueText, { color: colors.textSecondary }]}>₹{item.amount.toLocaleString('en-IN')}</Text>
                                        <Text style={[styles.legendPercentText, { color: colors.textSecondary }]}>{item.percent}%</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.infoBox, { backgroundColor: isDark ? "#2d1b69" : "#F5F3FF" }]}>
                        <Ionicons name="information-circle-outline" size={16} color="#6C2CF4" />
                        <Text style={[styles.infoBoxText, { color: isDark ? "#E9D5FF" : "#4C1D95" }]}>
                            {topCat.label} makes up {topCat.percent}% of your total expenses.
                        </Text>
                    </View>
                </View>

                {/* 2. Smart Insights */}
                <View style={[styles.infoCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.insightCardTitle, { color: colors.text, marginBottom: 20 }]}>Smart Insights for You</Text>
                    
                    <View style={styles.insightsList}>
                        {aiInsights.map((item, idx) => {
                            const config = getInsightConfig(item.type);
                            return (
                                <View key={item.id || idx} style={[styles.insightListItem, { borderBottomColor: colors.border, borderBottomWidth: idx === aiInsights.length - 1 ? 0 : 1 }]}>
                                    <View style={[styles.itemIconCircle, { backgroundColor: isDark ? colors.border : config.bg }]}>
                                        <Ionicons name={config.icon as any} size={18} color={config.color} />
                                    </View>
                                    <View style={styles.itemContent}>
                                        <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                                        <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* 3. Personalized Recommendations */}
                <View style={[styles.infoCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.insightCardHeader}>
                        <Text style={[styles.insightCardTitle, { color: colors.text }]}>Personalized Recommendations</Text>
                        <TouchableOpacity 
                            style={[styles.regenerateBtn, { backgroundColor: isDark ? colors.border : "#F5F3FF", borderColor: isDark ? colors.border : "#E9E3FF", opacity: isRegenerating ? 0.7 : 1 }]}
                            onPress={handleRegenerate}
                            disabled={isRegenerating}
                        >
                            {isRegenerating ? (
                                <ActivityIndicator size="small" color="#8B5CF6" />
                            ) : (
                                <Ionicons name="refresh-outline" size={14} color="#8B5CF6" />
                            )}
                            <Text style={[styles.regenerateText, { color: "#8B5CF6" }]}>
                                {isRegenerating ? "Generating..." : "Regenerate Insights"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.insightsList}>
                        {recommendations.map((item, idx) => (
                            <View key={idx} style={[styles.insightListItem, { borderBottomColor: colors.border, borderBottomWidth: idx === recommendations.length - 1 ? 0 : 1 }]}>
                                <View style={[styles.itemIconCircle, { backgroundColor: isDark ? colors.border : item.bg }]}>
                                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                                </View>
                                <TouchableOpacity style={[styles.actionBtn, { borderColor: "#8B5CF6" }]}>
                                    <Text style={[styles.actionBtnText, { color: "#8B5CF6" }]}>{item.btnText}</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Bottom Section */}
            <View style={[styles.bottomGrid, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                
                {/* Future Projection */}
                <View style={[styles.infoCard, { flex: 1.5, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.insightCardTitle, { color: colors.text }]}>Future Projection</Text>
                    <Text style={[styles.insightCardSub, { color: colors.textSecondary, marginBottom: 20 }]}>Based on your current spending</Text>
                    
                    <View style={[styles.projectionRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                        {/* Continue */}
                        <View style={[styles.projCard, { backgroundColor: isDark ? colors.border : "#FAFAFA", borderColor: colors.border }]}>
                            <Text style={[styles.projTitle, { color: colors.textSecondary }]}>If You Continue</Text>
                            <Text style={[styles.projSub, { color: colors.textSecondary }]}>You may spend</Text>
                            <Text style={[styles.projValue, { color: "#EF4444" }]}>₹{(expenses * 1.1).toLocaleString('en-IN', {maximumFractionDigits: 0})}</Text>
                            <Text style={[styles.projDate, { color: colors.textSecondary }]}>next month</Text>
                            <View style={styles.miniChart}>
                                <Svg height="40" width="100%" viewBox="0 0 100 40">
                                    <Path d="M 0,35 L 20,30 L 40,32 L 60,20 L 80,15 L 100,5" fill="none" stroke="#EF4444" strokeWidth="2" />
                                    <Circle cx="100" cy="5" r="3" fill="#EF4444" />
                                </Svg>
                            </View>
                        </View>
                        
                        {/* Suggestions */}
                        <View style={[styles.projCard, { backgroundColor: isDark ? colors.border : "#FAFAFA", borderColor: colors.border }]}>
                            <Text style={[styles.projTitle, { color: "#10B981" }]}>If You Follow Suggestions</Text>
                            <Text style={[styles.projSub, { color: colors.textSecondary }]}>You can save up to</Text>
                            <Text style={[styles.projValue, { color: "#10B981" }]}>₹{(expenses * 0.1).toLocaleString('en-IN', {maximumFractionDigits: 0})}</Text>
                            <Text style={[styles.projDate, { color: colors.textSecondary }]}>next month</Text>
                            <View style={styles.miniChart}>
                                <Svg height="40" width="100%" viewBox="0 0 100 40">
                                    <Path d="M 0,35 L 20,35 L 40,30 L 60,32 L 80,20 L 100,15" fill="none" stroke="#10B981" strokeWidth="2" />
                                    <Circle cx="100" cy="15" r="3" fill="#10B981" />
                                </Svg>
                            </View>
                        </View>
                        
                        {/* Potential Impact */}
                        <View style={[styles.projCard, { backgroundColor: isDark ? "#2d1b69" : "#F5F3FF", borderColor: "transparent" }]}>
                            <Text style={[styles.projTitle, { color: "#6C2CF4" }]}>Potential Impact (Next 6 Months)</Text>
                            <View style={styles.impactGrid}>
                                <View style={styles.impactItem}>
                                    <View style={[styles.impactIcon, { backgroundColor: "#FFF" }]}>
                                        <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                                    </View>
                                    <Text style={[styles.impactLabel, { color: colors.textSecondary }]}>Extra Savings</Text>
                                    <Text style={[styles.impactValue, { color: colors.text }]}>₹{(expenses * 0.1 * 6).toLocaleString('en-IN', {maximumFractionDigits: 0})}</Text>
                                </View>
                                <View style={styles.impactItem}>
                                    <View style={[styles.impactIcon, { backgroundColor: "#FFF" }]}>
                                        <Ionicons name="card" size={14} color="#8B5CF6" />
                                    </View>
                                    <Text style={[styles.impactLabel, { color: colors.textSecondary }]}>Debt Reduction</Text>
                                    <Text style={[styles.impactValue, { color: colors.text }]}>₹0</Text>
                                </View>
                                <View style={styles.impactItem}>
                                    <View style={[styles.impactIcon, { backgroundColor: "#FFF" }]}>
                                        <Ionicons name="target" size={14} color="#8B5CF6" />
                                    </View>
                                    <Text style={[styles.impactLabel, { color: colors.textSecondary }]}>Goal Progress Boost</Text>
                                    <Text style={[styles.impactValue, { color: colors.text }]}>+22%</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Ask AI Assistant */}
                <View style={[styles.infoCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.insightCardTitle, { color: colors.text }]}>Ask AI Assistant</Text>
                    <Text style={[styles.insightCardSub, { color: colors.textSecondary, marginBottom: 20 }]}>Get answers about your finances</Text>
                    
                    <View style={[styles.chatInputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.background : "#FAFAFA" }]}>
                        <TextInput 
                            style={[styles.chatInput, { color: colors.text }]}
                            placeholder="Ask me anything about your money..."
                            placeholderTextColor={colors.textSecondary}
                        />
                        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: isDark ? colors.border : "#F5F3FF" }]}>
                            <Ionicons name="send" size={16} color="#8B5CF6" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.suggestionChips}>
                        {["Why did I spend more on shopping?", "How can I save more?", "Analyze my bills"].map((chip, idx) => (
                            <TouchableOpacity key={idx} style={[styles.chip, { backgroundColor: isDark ? colors.border : "#F1F5F9" }]}>
                                <Text style={[styles.chipText, { color: colors.textSecondary }]}>{chip}</Text>
                            </TouchableOpacity>
                        ))}
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
        borderRadius: 8,
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
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        ...Shadows.sm,
    },
    compareBtnText: {
        fontSize: 12,
        fontWeight: "600",
    },
    greetingCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 16,
    },
    greetingLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        flex: 1,
        minWidth: 250,
    },
    aiIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    aiIconText: {
        color: "#FFF",
        fontSize: 20,
        fontWeight: "bold",
    },
    aiSparkleIcon: {
        position: "absolute",
        top: 6,
        right: 6,
    },
    greetingTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    greetingSub: {
        fontSize: 13,
        lineHeight: 20,
    },
    howAiWorksBtn: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    howAiWorksText: {
        fontSize: 14,
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
        marginBottom: 12,
    },
    statIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    statCardTitle: {
        fontSize: 12,
        fontWeight: "600",
    },
    statValueRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    statCardValue: {
        fontSize: 22,
        fontWeight: "800",
    },
    statCardSub: {
        fontSize: 11,
        marginBottom: 16,
    },
    viewDetailsBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    viewDetailsText: {
        color: "#6C2CF4",
        fontSize: 12,
        fontWeight: "600",
    },
    middleGrid: {
        gap: 20,
        marginBottom: 24,
    },
    infoCard: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        ...Shadows.md,
    },
    insightCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 20,
    },
    insightCardTitle: {
        fontSize: 16,
        fontWeight: "700",
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
    insightCardSub: {
        fontSize: 12,
        marginTop: 4,
    },
    pieChartContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        flexWrap: "wrap",
    },
    legendContainer: {
        flex: 1,
        marginLeft: 16,
        minWidth: 150,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    legendText: {
        fontSize: 11,
        flex: 1,
    },
    legendValues: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    legendValueText: {
        fontSize: 11,
        fontWeight: "600",
    },
    legendPercentText: {
        fontSize: 11,
        width: 30,
        textAlign: "right",
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    infoBoxText: {
        fontSize: 12,
        flex: 1,
    },
    insightsList: {
        gap: 0,
    },
    insightListItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        gap: 12,
    },
    itemIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 4,
    },
    itemDesc: {
        fontSize: 11,
        lineHeight: 16,
    },
    actionBtn: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    actionBtnText: {
        fontSize: 11,
        fontWeight: "600",
    },
    bottomGrid: {
        gap: 20,
    },
    rowLayout: {
        flexDirection: "row",
    },
    columnLayout: {
        flexDirection: "column",
    },
    projectionRow: {
        gap: 12,
    },
    projCard: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
    },
    projTitle: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 16,
    },
    projSub: {
        fontSize: 10,
        marginBottom: 2,
    },
    projValue: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 2,
    },
    projDate: {
        fontSize: 10,
    },
    miniChart: {
        marginTop: 10,
        height: 40,
    },
    impactGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
    },
    impactItem: {
        alignItems: "center",
    },
    impactIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    impactLabel: {
        fontSize: 9,
        marginBottom: 4,
    },
    impactValue: {
        fontSize: 14,
        fontWeight: "700",
    },
    chatInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 16,
    },
    chatInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
        height: 40,
    },
    sendBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    suggestionChips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    chipText: {
        fontSize: 11,
        fontWeight: "500",
    },
});
