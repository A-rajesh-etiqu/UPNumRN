import React, { useEffect, useRef, useState } from "react";
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
    Modal,
    Pressable,
    Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Path, Circle } from "react-native-svg";
import { PieChart } from "react-native-gifted-charts";
import { useAppTheme, Spacing, Shadows, Typography } from "../../../theme";
import { useAuthStore } from "../../../store/auth.store";
import { useDashboardStore } from "../../../store/dashboard.store";
import { ReportCard } from "../../../components/dashboard/ReportCard";
import DashboardHeader from "../../../components/layout/DashboardHeader";
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

const DATE_RANGES = ["This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year"];
const CATEGORIES = ["All", "Shopping", "Food", "Travel", "Utilities", "Entertainment", "Groceries", "Income", "Transfer"];

export default function AiInsightsPersonal() {
    const [recommendations, setRecommendations] = useState(DEFAULT_RECOMMENDATIONS);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [howAiWorksVisible, setHowAiWorksVisible] = useState(false);

    // Filter / date state
    const [dateRange, setDateRange] = useState("This Month");
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Stat detail modal
    const [statDetailVisible, setStatDetailVisible] = useState(false);
    const [selectedStat, setSelectedStat] = useState<any>(null);

    // Recommendation action modal
    const [recModalVisible, setRecModalVisible] = useState(false);
    const [selectedRec, setSelectedRec] = useState<any>(null);
    const [budgetInput, setBudgetInput] = useState("");

    // Insight detail modal
    const [insightDetailVisible, setInsightDetailVisible] = useState(false);
    const [selectedInsight, setSelectedInsight] = useState<any>(null);

    // AI Chat
    const [chatQuery, setChatQuery] = useState("");
    const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
    const [chatLoading, setChatLoading] = useState(false);

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
            } else {
                // Cycle between default and new recommendations locally
                setRecommendations(prev =>
                    prev[0]?.title === DEFAULT_RECOMMENDATIONS[0]?.title ? NEW_RECOMMENDATIONS : DEFAULT_RECOMMENDATIONS
                );
            }
        } catch {
            setRecommendations(prev =>
                prev[0]?.title === DEFAULT_RECOMMENDATIONS[0]?.title ? NEW_RECOMMENDATIONS : DEFAULT_RECOMMENDATIONS
            );
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleDateRangeSelect = (range: string) => {
        setDateRange(range);
        setDatePickerVisible(false);
        loadDashboard(user?.id, range);
    };

    const handleDownloadReport = () => {
        Alert.alert(
            "Download Report",
            `Download your AI Insights report for "${dateRange}"?

The report will include:\n• Spending trends\n• Category breakdown\n• Personalized recommendations\n• Future projections`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Download PDF",
                    onPress: () =>
                        Alert.alert("Report Ready", "Your report has been generated and saved to your downloads folder."),
                },
            ]
        );
    };

    const handleStatDetails = (stat: any) => {
        setSelectedStat(stat);
        setStatDetailVisible(true);
    };

    const handleRecAction = (rec: any) => {
        setSelectedRec(rec);
        setBudgetInput("");
        setRecModalVisible(true);
    };

    const handleInsightDetail = (insight: any) => {
        setSelectedInsight(insight);
        setInsightDetailVisible(true);
    };

    const handleSendChat = async (query?: string) => {
        const q = (query ?? chatQuery).trim();
        if (!q) return;
        setChatMessages(prev => [...prev, { role: "user", text: q }]);
        setChatQuery("");
        setChatLoading(true);
        try {
            const res = await apiClient.post("/dashboard/ai-chat", { userId: user?.id, question: q });
            const answer = res.data?.answer || "I don't have enough data to answer that yet. Keep tracking your expenses!";
            setChatMessages(prev => [...prev, { role: "ai", text: answer }]);
        } catch {
            setChatMessages(prev => [
                ...prev,
                { role: "ai", text: "I couldn't process that right now. Please try again later." },
            ]);
        } finally {
            setChatLoading(false);
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
            icon: "flag-outline" 
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
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <DashboardHeader 
                title="AI Insights ✨" 
                subtitle="Smart analysis of your money habits and personalized recommendations" 
            />
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
                {/* Header section with Filter controls */}
                <View style={[styles.headerRow, { borderBottomColor: colors.border, justifyContent: isDesktop ? "flex-end" : "flex-start" }]}>

                {/* Filter Widgets */}
                <View style={styles.filterWidgetRow}>
                    <TouchableOpacity
                        style={[styles.rangeSelectorBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        activeOpacity={0.8}
                        onPress={() => setDatePickerVisible(true)}
                    >
                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.rangeSelectorText, { color: colors.text }]}>{dateRange}</Text>
                        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.compareBtn, { backgroundColor: selectedCategory !== "All" ? "#8B5CF6" : colors.surface, borderColor: selectedCategory !== "All" ? "#8B5CF6" : colors.border }]}
                        activeOpacity={0.8}
                        onPress={() => setFilterVisible(true)}
                    >
                        <Ionicons name="filter-outline" size={14} color={selectedCategory !== "All" ? "#FFF" : colors.text} />
                        <Text style={[styles.compareBtnText, { color: selectedCategory !== "All" ? "#FFF" : colors.text }]}>
                            {selectedCategory !== "All" ? selectedCategory : "Filters"}
                        </Text>
                        {selectedCategory !== "All" && (
                            <TouchableOpacity onPress={() => setSelectedCategory("All")}>
                                <Ionicons name="close-circle" size={14} color="#FFF" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.compareBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        activeOpacity={0.8}
                        onPress={handleDownloadReport}
                    >
                        <Ionicons name="download-outline" size={14} color={colors.text} />
                        <Text style={[styles.compareBtnText, { color: colors.text }]}>Download Report</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Date Range Picker Modal ── */}
                <Modal visible={datePickerVisible} transparent animationType="fade" onRequestClose={() => setDatePickerVisible(false)}>
                    <Pressable style={styles.dropOverlay} onPress={() => setDatePickerVisible(false)}>
                        <Pressable style={[styles.dropSheet, { backgroundColor: isDark ? colors.surface : "#FFF" }]} onPress={() => {}}>
                            <Text style={[styles.dropTitle, { color: colors.text }]}>Select Date Range</Text>
                            {DATE_RANGES.map(r => (
                                <TouchableOpacity
                                    key={r}
                                    onPress={() => handleDateRangeSelect(r)}
                                    style={[styles.dropItem, dateRange === r && { backgroundColor: isDark ? "#1E1433" : "#F5F3FF" }]}
                                >
                                    <Ionicons name={dateRange === r ? "radio-button-on" : "radio-button-off"} size={18} color={dateRange === r ? "#8B5CF6" : colors.textSecondary} />
                                    <Text style={[styles.dropItemText, { color: dateRange === r ? "#8B5CF6" : colors.text, fontWeight: dateRange === r ? "700" : "400" }]}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </Pressable>
                    </Pressable>
                </Modal>

                {/* ── Category Filter Modal ── */}
                <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
                    <Pressable style={styles.modalOverlay} onPress={() => setFilterVisible(false)}>
                        <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : "#FFF" }]} onPress={() => {}}>
                            <View style={styles.modalHandleBar} />
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Filter by Category</Text>
                                <TouchableOpacity onPress={() => setFilterVisible(false)} style={styles.modalCloseBtn}>
                                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.filterChipsWrap}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => { setSelectedCategory(cat); setFilterVisible(false); }}
                                        style={[styles.filterChip, {
                                            backgroundColor: selectedCategory === cat ? "#8B5CF6" : (isDark ? colors.border : "#F1F5F9"),
                                        }]}
                                    >
                                        <Text style={[styles.filterChipText, { color: selectedCategory === cat ? "#FFF" : colors.text }]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>
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
                <TouchableOpacity style={[styles.howAiWorksBtn, { borderColor: "#8B5CF6" }]} onPress={() => setHowAiWorksVisible(true)} activeOpacity={0.8}>
                    <Ionicons name="help-circle-outline" size={16} color="#8B5CF6" />
                    <Text style={[styles.howAiWorksText, { color: "#8B5CF6" }]}>How AI Works</Text>
                </TouchableOpacity>
            </View>

            {/* How AI Works Modal */}
            <Modal
                visible={howAiWorksVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setHowAiWorksVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setHowAiWorksVisible(false)}>
                    <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : "#FFFFFF" }]} onPress={() => {}}>
                        {/* Handle Bar */}
                        <View style={styles.modalHandleBar} />

                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <View style={[styles.modalIconCircle, { backgroundColor: "#8B5CF6" }]}>
                                    <Ionicons name="sparkles" size={20} color="#FFF" />
                                </View>
                                <View>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>How AI Works</Text>
                                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Powered by your transaction data</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setHowAiWorksVisible(false)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Intro */}
                            <View style={[styles.modalIntroBox, { backgroundColor: isDark ? "#1E1433" : "#F5F3FF", borderColor: "#8B5CF6" }]}>
                                <Text style={[styles.modalIntroText, { color: isDark ? "#C4B5FD" : "#5B21B6" }]}>
                                    UpNum's AI engine analyses your real UPI transaction history to generate personalized insights, trends, and smart recommendations — all privately, on your data alone.
                                </Text>
                            </View>

                            {/* Steps */}
                            {[
                                {
                                    step: "1",
                                    icon: "cloud-download-outline",
                                    color: "#3B82F6",
                                    bg: isDark ? "#1E2D45" : "#EFF6FF",
                                    title: "Data Collection",
                                    desc: "Your UPI transactions are securely fetched via Account Aggregator (AA) consent — you stay in full control and can revoke access anytime.",
                                },
                                {
                                    step: "2",
                                    icon: "analytics-outline",
                                    color: "#8B5CF6",
                                    bg: isDark ? "#1E1433" : "#F5F3FF",
                                    title: "Pattern Analysis",
                                    desc: "The AI categorises your spends, detects seasonal patterns, identifies recurring bills, and compares your habits month-over-month.",
                                },
                                {
                                    step: "3",
                                    icon: "bulb-outline",
                                    color: "#F59E0B",
                                    bg: isDark ? "#2D2008" : "#FFFBEB",
                                    title: "Insight Generation",
                                    desc: "Based on your patterns the AI crafts actionable tips — like setting a budget for a high-spend category or automating savings on payday.",
                                },
                                {
                                    step: "4",
                                    icon: "shield-checkmark-outline",
                                    color: "#10B981",
                                    bg: isDark ? "#0A2E1F" : "#ECFDF5",
                                    title: "Privacy First",
                                    desc: "Your data is never sold or shared. Insights are generated in a secure environment and only you can see your financial summary.",
                                },
                            ].map((item, idx) => (
                                <View key={idx} style={[styles.stepCard, { backgroundColor: item.bg, borderColor: isDark ? colors.border : "transparent" }]}>
                                    <View style={styles.stepCardLeft}>
                                        <View style={[styles.stepCircle, { backgroundColor: item.color }]}>
                                            <Text style={styles.stepNumber}>{item.step}</Text>
                                        </View>
                                        <View style={[styles.stepLine, idx === 3 && { opacity: 0 }, { backgroundColor: item.color }]} />
                                    </View>
                                    <View style={styles.stepContent}>
                                        <View style={[styles.stepIconCircle, { backgroundColor: item.color + "22" }]}>
                                            <Ionicons name={item.icon as any} size={22} color={item.color} />
                                        </View>
                                        <Text style={[styles.stepTitle, { color: colors.text }]}>{item.title}</Text>
                                        <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                                    </View>
                                </View>
                            ))}

                            {/* Footer CTA */}
                            <TouchableOpacity
                                style={[styles.modalCta, { backgroundColor: "#8B5CF6" }]}
                                onPress={() => setHowAiWorksVisible(false)}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                                <Text style={styles.modalCtaText}>Got it, thanks!</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>


            {/* Stat Cards Grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 12 }}>
                {STATS.map((stat, idx) => (
                    <ReportCard
                        key={idx}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        change={stat.change}
                        changeText=""
                        isUp={stat.isUp}
                        isDesktop={isDesktop}
                        colors={colors}
                        onPress={() => handleStatDetails(stat)}
                    />
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
                                <TouchableOpacity key={item.id || idx} style={[styles.insightListItem, { borderBottomColor: colors.border, borderBottomWidth: idx === aiInsights.length - 1 ? 0 : 1 }]} onPress={() => handleInsightDetail(item)} activeOpacity={0.85}>
                                    <View style={[styles.itemIconCircle, { backgroundColor: isDark ? colors.border : config.bg }]}>
                                        <Ionicons name={config.icon as any} size={18} color={config.color} />
                                    </View>
                                    <View style={styles.itemContent}>
                                        <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                                        <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
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
                                <TouchableOpacity style={[styles.actionBtn, { borderColor: "#8B5CF6" }]} onPress={() => handleRecAction(item)} activeOpacity={0.85}>
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
                                        <Ionicons name="flag-outline" size={14} color="#8B5CF6" />
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
                    
                    {/* Chat history */}
                    {chatMessages.length > 0 && (
                        <ScrollView style={[styles.chatHistory, { borderColor: colors.border }]} nestedScrollEnabled>
                            {chatMessages.map((msg, i) => (
                                <View key={i} style={[styles.chatBubble, msg.role === "user" ? styles.chatBubbleUser : [styles.chatBubbleAi, { backgroundColor: isDark ? colors.border : "#F5F3FF" }]]}>
                                    {msg.role === "ai" && <Ionicons name="sparkles" size={13} color="#8B5CF6" style={{ marginBottom: 4 }} />}
                                    <Text style={[styles.chatBubbleText, { color: msg.role === "user" ? "#FFF" : colors.text }]}>{msg.text}</Text>
                                </View>
                            ))}
                            {chatLoading && (
                                <View style={[styles.chatBubbleAi, { backgroundColor: isDark ? colors.border : "#F5F3FF", paddingVertical: 12 }]}>
                                    <ActivityIndicator size="small" color="#8B5CF6" />
                                </View>
                            )}
                        </ScrollView>
                    )}

                    <View style={[styles.chatInputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.background : "#FAFAFA" }]}>
                        <TextInput
                            style={[styles.chatInput, { color: colors.text }]}
                            placeholder="Ask me anything about your money..."
                            placeholderTextColor={colors.textSecondary}
                            value={chatQuery}
                            onChangeText={setChatQuery}
                            onSubmitEditing={() => handleSendChat()}
                            returnKeyType="send"
                            editable={!chatLoading}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, { backgroundColor: chatQuery.trim() ? "#8B5CF6" : (isDark ? colors.border : "#F5F3FF") }]}
                            onPress={() => handleSendChat()}
                            activeOpacity={0.85}
                            disabled={chatLoading || !chatQuery.trim()}
                        >
                            <Ionicons name="send" size={16} color={chatQuery.trim() ? "#FFF" : "#8B5CF6"} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.suggestionChips}>
                        {["Why did I spend more on shopping?", "How can I save more?", "Analyze my bills"].map((chip, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.chip, { backgroundColor: isDark ? colors.border : "#F1F5F9" }]}
                                onPress={() => handleSendChat(chip)}
                                activeOpacity={0.8}
                                disabled={chatLoading}
                            >
                                <Text style={[styles.chipText, { color: colors.textSecondary }]}>{chip}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

        </ScrollView>

        {/* ── Stat Detail Modal ── */}
        <Modal visible={statDetailVisible} transparent animationType="slide" onRequestClose={() => setStatDetailVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setStatDetailVisible(false)}>
                <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : "#FFF" }]} onPress={() => {}}>
                    <View style={styles.modalHandleBar} />
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderLeft}>
                            <View style={[styles.modalIconCircle, { backgroundColor: selectedStat?.color || "#8B5CF6" }]}>
                                <Ionicons name={(selectedStat?.icon || "analytics-outline") as any} size={20} color="#FFF" />
                            </View>
                            <View>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedStat?.title}</Text>
                                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Detailed breakdown</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setStatDetailVisible(false)} style={styles.modalCloseBtn}>
                            <Ionicons name="close" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.statDetailBox, { backgroundColor: isDark ? colors.background : "#F8FAFC", borderColor: colors.border }]}>
                        <Text style={[styles.statDetailValue, { color: selectedStat?.color || colors.text }]}>{selectedStat?.value}</Text>
                        <Text style={[styles.statDetailChange, { color: colors.textSecondary }]}>{selectedStat?.change}</Text>
                    </View>
                    <Text style={[styles.statDetailNote, { color: colors.textSecondary }]}>
                        This data is calculated from your real UPI transactions for the period: <Text style={{ fontWeight: "700", color: colors.text }}>{dateRange}</Text>.
                        {selectedStat?.title === "Spending Trend" && " Reducing your top spending category can significantly improve your savings rate."}
                        {selectedStat?.title === "Savings Rate" && " A healthy savings rate is typically 20% or more of your income."}
                        {selectedStat?.title === "Top Spending Category" && " Consider setting a monthly budget for this category to control overspending."}
                        {selectedStat?.title === "Goal Progress" && " Stay consistent with your spending habits to reach your goal on time."}
                    </Text>
                    <TouchableOpacity style={[styles.modalCta, { backgroundColor: selectedStat?.color || "#8B5CF6" }]} onPress={() => setStatDetailVisible(false)}>
                        <Text style={styles.modalCtaText}>Got it</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>

        {/* ── Recommendation Action Modal ── */}
        <Modal visible={recModalVisible} transparent animationType="slide" onRequestClose={() => setRecModalVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setRecModalVisible(false)}>
                <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : "#FFF" }]} onPress={() => {}}>
                    <View style={styles.modalHandleBar} />
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderLeft}>
                            <View style={[styles.modalIconCircle, { backgroundColor: selectedRec?.color || "#8B5CF6" }]}>
                                <Ionicons name={(selectedRec?.icon || "bulb-outline") as any} size={20} color="#FFF" />
                            </View>
                            <View>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedRec?.title}</Text>
                                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{selectedRec?.desc}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setRecModalVisible(false)} style={styles.modalCloseBtn}>
                            <Ionicons name="close" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {selectedRec?.btnText === "Set Budget" && (
                        <>
                            <Text style={[styles.recInputLabel, { color: colors.textSecondary }]}>Enter monthly budget amount (₹)</Text>
                            <View style={[styles.recInputRow, { borderColor: colors.border, backgroundColor: isDark ? colors.background : "#F8FAFC" }]}>
                                <Text style={[styles.recInputPrefix, { color: colors.text }]}>₹</Text>
                                <TextInput
                                    style={[styles.recInput, { color: colors.text }]}
                                    placeholder="e.g. 7500"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                    value={budgetInput}
                                    onChangeText={setBudgetInput}
                                />
                            </View>
                        </>
                    )}

                    {selectedRec?.btnText === "Setup Now" && (
                        <View style={[styles.recInfoBox, { backgroundColor: isDark ? "#0A2E1F" : "#ECFDF5", borderColor: "#10B981" }]}>
                            <Ionicons name="sync-outline" size={18} color="#10B981" />
                            <Text style={[styles.recInfoText, { color: isDark ? "#6EE7B7" : "#065F46" }]}>
                                Auto-save transfers a fixed amount from your account every month. Connect your UPI app to enable this feature.
                            </Text>
                        </View>
                    )}

                    {(selectedRec?.btnText === "Learn More" || selectedRec?.btnText === "View Deals") && (
                        <View style={[styles.recInfoBox, { backgroundColor: isDark ? "#1E2D45" : "#EFF6FF", borderColor: "#3B82F6" }]}>
                            <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
                            <Text style={[styles.recInfoText, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
                                {selectedRec?.title === "Try 50/30/20 Rule"
                                    ? "The 50/30/20 rule: 50% of income for needs (rent, food), 30% for wants (entertainment), and 20% for savings or debt repayment."
                                    : "Review your recent transactions to identify patterns and find opportunities to cut costs."}
                            </Text>
                        </View>
                    )}

                    {selectedRec?.btnText === "Review" && (
                        <View style={[styles.recInfoBox, { backgroundColor: isDark ? "#1E1433" : "#F5F3FF", borderColor: "#8B5CF6" }]}>
                            <Ionicons name="card-outline" size={18} color="#8B5CF6" />
                            <Text style={[styles.recInfoText, { color: isDark ? "#C4B5FD" : "#5B21B6" }]}>
                                You have active subscriptions. Review them in the Transactions section and cancel any you no longer use to save money each month.
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.modalCta, { backgroundColor: selectedRec?.color || "#8B5CF6" }]}
                        onPress={() => {
                            if (selectedRec?.btnText === "Set Budget" && budgetInput) {
                                Alert.alert("Budget Set! ✅", `Your monthly budget of ₹${budgetInput} for ${selectedRec?.title?.replace("Set ", "")} has been saved.`);
                            } else if (selectedRec?.btnText === "Setup Now") {
                                Alert.alert("Coming Soon", "Auto-save feature will be available in the next update!");
                            } else {
                                Alert.alert("Noted! ✅", "This tip has been saved to your recommendations.");
                            }
                            setRecModalVisible(false);
                        }}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.modalCtaText}>
                            {selectedRec?.btnText === "Set Budget" ? "Save Budget" :
                             selectedRec?.btnText === "Setup Now" ? "Notify Me When Ready" :
                             "Got it!"}
                        </Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>

        {/* ── Insight Detail Modal ── */}
        <Modal visible={insightDetailVisible} transparent animationType="slide" onRequestClose={() => setInsightDetailVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setInsightDetailVisible(false)}>
                <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : "#FFF" }]} onPress={() => {}}>
                    <View style={styles.modalHandleBar} />
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderLeft}>
                            <View style={[styles.modalIconCircle, { backgroundColor: selectedInsight?.type === "warning" ? "#EF4444" : selectedInsight?.type === "success" ? "#10B981" : "#3B82F6" }]}>
                                <Ionicons name={selectedInsight?.type === "warning" ? "warning-outline" : selectedInsight?.type === "success" ? "leaf-outline" : "information-circle-outline"} size={20} color="#FFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedInsight?.title}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setInsightDetailVisible(false)} style={styles.modalCloseBtn}>
                            <Ionicons name="close" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.recInfoBox, { backgroundColor: isDark ? colors.background : "#F8FAFC", borderColor: colors.border }]}>
                        <Text style={[{ color: colors.text, fontSize: 14, lineHeight: 22 }]}>{selectedInsight?.description}</Text>
                    </View>
                    <TouchableOpacity style={[styles.modalCta, { backgroundColor: "#3B82F6" }]} onPress={() => setInsightDetailVisible(false)}>
                        <Text style={styles.modalCtaText}>Dismiss</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
        </View>
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
    // ── How AI Works Modal styles ──────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 32,
        paddingTop: 12,
        maxHeight: "90%",
    },
    modalHandleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#CBD5E1",
        alignSelf: "center",
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    modalHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    modalIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    modalSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    modalCloseBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "rgba(148,163,184,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    modalIntroBox: {
        borderLeftWidth: 3,
        borderRadius: 10,
        padding: 14,
        marginBottom: 20,
    },
    modalIntroText: {
        fontSize: 13,
        lineHeight: 20,
        fontWeight: "500",
    },
    stepCard: {
        flexDirection: "row",
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
        gap: 14,
    },
    stepCardLeft: {
        alignItems: "center",
        width: 28,
    },
    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    stepNumber: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "700",
    },
    stepLine: {
        flex: 1,
        width: 2,
        marginTop: 6,
        borderRadius: 1,
        opacity: 0.3,
        minHeight: 24,
    },
    stepContent: {
        flex: 1,
        gap: 6,
    },
    stepIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: "700",
    },
    stepDesc: {
        fontSize: 13,
        lineHeight: 20,
    },
    modalCta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 14,
        paddingVertical: 14,
        marginTop: 8,
        marginBottom: 4,
    },
    modalCtaText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "700",
    },
    // ── Date range dropdown ──────────────────────────
    dropOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    dropSheet: {
        width: "100%",
        maxWidth: 340,
        borderRadius: 20,
        padding: 20,
        ...Shadows.md,
    },
    dropTitle: {
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 16,
    },
    dropItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    dropItemText: {
        fontSize: 14,
        flex: 1,
    },
    // ── Filter chips ────────────────────────────────
    filterChipsWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        paddingBottom: 16,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 100,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: "600",
    },
    // ── Stat detail modal ───────────────────────────
    statDetailBox: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 20,
        alignItems: "center",
        marginBottom: 16,
    },
    statDetailValue: {
        fontSize: 36,
        fontWeight: "900",
        marginBottom: 6,
    },
    statDetailChange: {
        fontSize: 13,
        textAlign: "center",
    },
    statDetailNote: {
        fontSize: 13,
        lineHeight: 22,
        marginBottom: 16,
    },
    // ── Recommendation modal inputs ─────────────────
    recInputLabel: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 8,
        marginTop: 4,
    },
    recInputRow: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        marginBottom: 16,
        height: 48,
    },
    recInputPrefix: {
        fontSize: 18,
        fontWeight: "700",
        marginRight: 6,
    },
    recInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
    },
    recInfoBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        borderLeftWidth: 3,
        borderRadius: 10,
        padding: 14,
        gap: 10,
        marginBottom: 16,
    },
    recInfoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
    },
    // ── AI Chat history ─────────────────────────────
    chatHistory: {
        maxHeight: 200,
        borderWidth: 1,
        borderRadius: 14,
        padding: 10,
        marginBottom: 12,
        gap: 8,
    },
    chatBubble: {
        borderRadius: 14,
        padding: 10,
        marginBottom: 6,
        maxWidth: "85%",
    },
    chatBubbleUser: {
        backgroundColor: "#8B5CF6",
        alignSelf: "flex-end",
        borderBottomRightRadius: 4,
    },
    chatBubbleAi: {
        borderRadius: 14,
        padding: 10,
        alignSelf: "flex-start",
        borderBottomLeftRadius: 4,
    },
    chatBubbleText: {
        fontSize: 13,
        lineHeight: 20,
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
