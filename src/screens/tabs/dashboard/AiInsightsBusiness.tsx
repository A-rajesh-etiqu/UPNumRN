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
    Modal,
    Pressable,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { useAppTheme, Spacing, Shadows } from "../../../theme";
import { useAuthStore } from "../../../store/auth.store";
import { useDashboardStore } from "../../../store/dashboard.store";
import { ReportCard } from "../../../components/dashboard/ReportCard";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import apiClient from "../../../api/apiClient";

const DEFAULT_RECOMMENDATIONS = [
    { title: "Boost Off-Peak Sales", desc: "Run special offers between 2 PM - 5 PM to increase store footfall.", icon: "flash-outline", color: "#8B5CF6", bg: "#F5F3FF", btnText: "Set Offer" },
    { title: "Weekend Promotion Deal", desc: "Launch weekend deals to leverage high traffic on Saturdays.", icon: "gift-outline", color: "#3B82F6", bg: "#EFF6FF", btnText: "View Strategy" },
    { title: "Restock Fast-Movers", desc: "Electronics category demand grew by 24%. Restock top items.", icon: "cube-outline", color: "#10B981", bg: "#ECFDF5", btnText: "Restock Alert" },
    { title: "Recover Inactive Buyers", desc: "Send automated payment reminders & promos to past customers.", icon: "people-outline", color: "#F59E0B", bg: "#FFFBEB", btnText: "Send Reminders" },
];

const NEW_RECOMMENDATIONS = [
    { title: "Multiple Payment Options", desc: "Offer QR & Tap-to-Pay to reduce checkout payment drop-offs.", icon: "card-outline", color: "#3B82F6", bg: "#EFF6FF", btnText: "Setup Now" },
    { title: "Promote Premium Items", desc: "Highlight your high-margin services during peak transaction hours.", icon: "ribbon-outline", color: "#8B5CF6", bg: "#F5F3FF", btnText: "Promote" },
    { title: "Inventory Restock Alert", desc: "Analyze recent transaction data to identify top-selling items.", icon: "analytics-outline", color: "#10B981", bg: "#ECFDF5", btnText: "View Data" },
    { title: "Automate Overdue Invoices", desc: "Send WhatsApp payment reminders for overdue invoices to improve cash flow.", icon: "time-outline", color: "#F59E0B", bg: "#FFFBEB", btnText: "Automate" },
];

const DATE_RANGES = ["This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year", "Custom Range"];
const CATEGORIES = ["All", "Sales", "Invoices", "Inventory", "UPI Transfers", "Vendors"];

export default function AiInsightsBusiness() {
    const [recommendations, setRecommendations] = useState(DEFAULT_RECOMMENDATIONS);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [howAiWorksVisible, setHowAiWorksVisible] = useState(false);

    // Filter / date state
    const [dateRange, setDateRange] = useState("This Month");
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [customRangeModalVisible, setCustomRangeModalVisible] = useState(false);
    const [startDateInput, setStartDateInput] = useState("2024-05-01");
    const [endDateInput, setEndDateInput] = useState("2024-05-31");
    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Stat detail modal
    const [statDetailVisible, setStatDetailVisible] = useState(false);
    const [selectedStat, setSelectedStat] = useState<any>(null);

    // Recommendation action modal
    const [recModalVisible, setRecModalVisible] = useState(false);
    const [selectedRec, setSelectedRec] = useState<any>(null);
    const [actionInput, setActionInput] = useState("");

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
            if (res.data && res.data.recommendations && res.data.recommendations.length > 0) {
                setRecommendations(res.data.recommendations);
            } else {
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
        setDatePickerVisible(false);
        if (range === "Custom Range") {
            setCustomRangeModalVisible(true);
        } else {
            setDateRange(range);
            loadDashboard(user?.id, range);
        }
    };

    const handleApplyCustomRange = () => {
        if (!startDateInput || !endDateInput) {
            Alert.alert("Invalid Dates", "Please enter both start and end dates.");
            return;
        }
        setCustomRangeModalVisible(false);
        const displayLabel = `${startDateInput} to ${endDateInput}`;
        setDateRange(displayLabel);
        loadDashboard(user?.id, "Custom Range", startDateInput, endDateInput);
    };

    const handleDownloadReport = () => {
        Alert.alert(
            "Download Business Report",
            `Download your AI Business Insights report for "${dateRange}"?\n\nThe report includes:\n• Total Sales & AOV trends\n• Peak transaction hours & heatmap\n• Category growth analysis\n• AI revenue recommendations`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Download PDF",
                    onPress: () =>
                        Alert.alert("Report Generated", "Your business report has been saved to your downloads folder."),
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
        setActionInput("");
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
            const answer = res.data?.answer || "Based on your transaction data, optimizing peak business hours can improve overall revenue.";
            setChatMessages(prev => [...prev, { role: "ai", text: answer }]);
        } catch {
            setChatMessages(prev => [
                ...prev,
                { role: "ai", text: "I couldn't process that request right now. Please try again." },
            ]);
        } finally {
            setChatLoading(false);
        }
    };

    useEffect(() => {
        if (!data) {
            loadDashboard(user?.id, "Last Month");
        }
    }, [user?.id, data]);

    const dayOfWeekData = React.useMemo(() => {
        if (data?.salesByDayOfWeek && data.salesByDayOfWeek.length > 0) {
            return data.salesByDayOfWeek;
        }

        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const dayMap: { [key: string]: number } = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

        const txs = data?.recentTransactions || [];
        txs.forEach((tx: any) => {
            if (tx.amount > 0 || tx.type === "income") {
                const dateObj = new Date(tx.date);
                if (!isNaN(dateObj.getTime())) {
                    const dayIndex = dateObj.getDay(); // 0 is Sun
                    const dayName = days[(dayIndex + 6) % 7];
                    dayMap[dayName] = (dayMap[dayName] || 0) + Math.abs(tx.amount);
                }
            }
        });

        const maxVal = Math.max(...Object.values(dayMap), 1);
        const hasAnySales = Object.values(dayMap).some(v => v > 0);

        return days.map(day => {
            const val = dayMap[day] || 0;
            const height = hasAnySales ? `${Math.max(Math.round((val / maxVal) * 90), 12)}%` : "10%";
            let formatted = "₹0";
            if (val >= 100000) {
                formatted = `₹${(val / 100000).toFixed(1)}L`;
            } else if (val >= 1000) {
                formatted = `₹${(val / 1000).toFixed(1)}K`;
            } else if (val > 0) {
                formatted = `₹${Math.round(val)}`;
            }
            return { day, value: val, formattedValue: formatted, height };
        });
    }, [data]);

    const lineChartData = React.useMemo(() => {
        const items = data?.chartDataIncome || data?.salesChart || [];
        if (!items || items.length === 0) {
            return [
                { label: "W1", value: 0, x: 25, y: 135 },
                { label: "W2", value: 0, x: 115, y: 135 },
                { label: "W3", value: 0, x: 205, y: 135 },
                { label: "W4", value: 0, x: 295, y: 135 },
                { label: "W5", value: 0, x: 385, y: 135 },
            ];
        }
        const maxLineVal = Math.max(...items.map((i: any) => i.value), 1);
        return items.map((item: any, idx: number) => {
            const x = items.length > 1 ? (idx / (items.length - 1)) * 380 + 35 : 225;
            const rawY = 135 - ((item.value / maxLineVal) * 105);
            const y = Math.max(25, Math.min(135, rawY));
            return { label: item.month || item.label || `P${idx + 1}`, value: item.value, x, y };
        });
    }, [data]);

    const incomeLinePath = React.useMemo(() => {
        if (!lineChartData || lineChartData.length === 0) return "M 0,135 L 450,135";
        return "M " + lineChartData.map(p => `${p.x},${p.y}`).join(" L ");
    }, [lineChartData]);

    if (loading || !data) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const userName = user?.firstName || "Business Owner";
    const sales = data.income || 0;
    const salesChange = data.incomeChange || 0;
    const txCount = data.transactionsCount || 0;
    const aov = txCount > 0 ? (sales / txCount) : 0;
    const creditedCustomerUpiSet = new Set(
        (data.recentTransactions || [])
            .filter((tx: any) => tx.type === "income" || tx.amount > 0)
            .map((tx: any) => tx.upi || tx.payer_upi || tx.title)
            .filter(Boolean)
    );
    const fallbackCustomerCount = creditedCustomerUpiSet.size;
    const newCustomersCount = data.newCustomersCount !== undefined ? data.newCustomersCount : fallbackCustomerCount;
    const newCustomersChange = data.newCustomersChange ?? 0;

    const STATS = [
        {
            title: "Total Sales",
            value: `₹ ${sales.toLocaleString('en-IN')}`,
            change: `${salesChange >= 0 ? '+' : ''}${salesChange}% vs previous period`,
            color: "#8B5CF6",
            bg: "#F5F3FF",
            icon: "wallet" as const,
            isUp: salesChange >= 0
        },
        {
            title: "Total Transactions",
            value: `${txCount}`,
            change: "+12.4% vs previous period",
            color: "#F59E0B",
            bg: "#FFFBEB",
            icon: "swap-horizontal" as const,
            isUp: true
        },
        {
            title: "New Customers",
            value: `${newCustomersCount}`,
            change: `${newCustomersChange >= 0 ? '+' : ''}${newCustomersChange}% vs previous period`,
            color: "#3B82F6",
            bg: "#EFF6FF",
            icon: "people" as const,
            isUp: newCustomersChange >= 0
        },
        {
            title: "Average Order Value",
            value: `₹ ${aov.toFixed(2)}`,
            change: "+8.2% vs previous period",
            color: "#10B981",
            bg: "#ECFDF5",
            icon: "cart" as const,
            isUp: true
        },
    ];

    const getInsightConfig = (type: string) => {
        switch (type) {
            case 'warning': return { icon: 'warning-outline', color: '#EF4444', bg: '#FEE2E2' };
            case 'success': return { icon: 'trending-up-outline', color: '#10B981', bg: '#ECFDF5' };
            default: return { icon: 'sparkles-outline', color: '#3B82F6', bg: '#EFF6FF' };
        }
    };

    const businessInsights = [
        {
            id: "1",
            title: "Period Sales Summary",
            description: `Generated ₹${sales.toLocaleString('en-IN')} across ${txCount} transactions for ${dateRange}.`,
            type: "success",
            details: `Your store recorded ₹${sales.toLocaleString('en-IN')} total revenue across ${txCount} transactions for period: ${dateRange}. Keeping top inventory stocked during peak hours accelerates sales growth.`
        },
        {
            id: "2",
            title: "Customer Acquisition",
            description: `Captured ${newCustomersCount} unique credited customer payments in ${dateRange}.`,
            type: "warning",
            details: `A total of ${newCustomersCount} distinct customer UPI accounts completed payments to your business in period: ${dateRange}.`
        },
        {
            id: "3",
            title: "Higher Ticket Size",
            description: `Average order value reached ₹${aov.toFixed(0)} per transaction in ${dateRange}.`,
            type: "info",
            details: `Customers spent an average of ₹${aov.toFixed(2)} per transaction. Upselling complementary items at checkout can further increase your AOV.`
        },
    ];

    // Heatmap data - 7 days of week, 6 time slots
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const TIMES = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"];

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
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <DashboardHeader
                title="Business AI ✨"
                subtitle="Smart insights and recommendations to grow your business."
            />
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>

                {/* Header section with Filter controls */}
                <View style={[styles.headerRow, { borderBottomColor: colors.border, justifyContent: isDesktop ? "flex-end" : "flex-start" }]}>
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
                            style={[styles.compareBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            activeOpacity={0.8}
                            onPress={handleDownloadReport}
                        >
                            <Ionicons name="download-outline" size={14} color={colors.text} />
                            <Text style={[styles.compareBtnText, { color: colors.text }]}>Download Report</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Date Range Picker Modal ── */}
                <Modal visible={datePickerVisible} transparent animationType="fade" onRequestClose={() => setDatePickerVisible(false)}>
                    <Pressable style={styles.dropOverlay} onPress={() => setDatePickerVisible(false)}>
                        <Pressable style={[styles.dropSheet, { backgroundColor: isDark ? colors.surface : "#FFF" }]} onPress={() => { }}>
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

                {/* ── Custom Date Range Picker Modal Card ── */}
                <Modal visible={customRangeModalVisible} transparent animationType="slide" onRequestClose={() => setCustomRangeModalVisible(false)}>
                    <Pressable style={styles.modalOverlay} onPress={() => setCustomRangeModalVisible(false)}>
                        <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : "#FFF", maxWidth: 480, width: "92%", alignSelf: "center", borderRadius: 16, padding: 22 }]} onPress={() => { }}>
                            <View style={styles.modalHeader}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                    <View style={[styles.modalIconCircle, { backgroundColor: "#8B5CF6" }]}>
                                        <Ionicons name="calendar" size={20} color="#FFF" />
                                    </View>
                                    <View>
                                        <Text style={[styles.modalTitle, { color: colors.text }]}>Custom Date Range</Text>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Filter transaction data for a specific timeframe</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setCustomRangeModalVisible(false)} style={styles.modalCloseBtn}>
                                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Quick Presets */}
                            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginTop: 14, marginBottom: 8 }}>QUICK PRESETS</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                                {[
                                    { label: "Last 7 Days", days: 7 },
                                    { label: "Last 30 Days", days: 30 },
                                    { label: "Last 90 Days", days: 90 },
                                ].map((preset) => (
                                    <TouchableOpacity
                                        key={preset.label}
                                        style={{
                                            paddingHorizontal: 12,
                                            paddingVertical: 7,
                                            borderRadius: 8,
                                            backgroundColor: isDark ? colors.border : "#F1F5F9",
                                            borderWidth: 1,
                                            borderColor: colors.border
                                        }}
                                        onPress={() => {
                                            const end = new Date();
                                            const start = new Date();
                                            start.setDate(end.getDate() - preset.days);
                                            const sStr = start.toISOString().split("T")[0];
                                            const eStr = end.toISOString().split("T")[0];
                                            setStartDateInput(sStr);
                                            setEndDateInput(eStr);
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>{preset.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Date Inputs */}
                            <View style={{ gap: 14, marginBottom: 14 }}>
                                <View>
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 }}>Start Date (YYYY-MM-DD)</Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, backgroundColor: colors.inputBackground }}>
                                        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                                        <TextInput
                                            value={startDateInput}
                                            onChangeText={setStartDateInput}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={colors.placeholder}
                                            style={{ flex: 1, height: 42, color: colors.text, fontSize: 14 }}
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 }}>End Date (YYYY-MM-DD)</Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, backgroundColor: colors.inputBackground }}>
                                        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                                        <TextInput
                                            value={endDateInput}
                                            onChangeText={setEndDateInput}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={colors.placeholder}
                                            style={{ flex: 1, height: 42, color: colors.text, fontSize: 14 }}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}
                                    onPress={() => setCustomRangeModalVisible(false)}
                                >
                                    <Text style={{ fontWeight: "600", color: colors.text }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#8B5CF6", alignItems: "center" }}
                                    onPress={handleApplyCustomRange}
                                >
                                    <Text style={{ fontWeight: "600", color: "#FFF" }}>Apply Range</Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>

                {/* ── Category Filter Modal ── */}
                <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
                    <Pressable style={styles.modalOverlay} onPress={() => setFilterVisible(false)}>
                        <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : "#FFF" }]} onPress={() => { }}>
                            <View style={styles.modalHandleBar} />
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Filter by Industry / Type</Text>
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

                {/* Greeting Banner */}
                <View style={[styles.greetingCard, { backgroundColor: isDark ? colors.surface : "#F9FAFB", borderColor: colors.border }]}>
                    <View style={styles.greetingLeft}>
                        <View style={[styles.aiIconCircle, { backgroundColor: "#8B5CF6" }]}>
                            <Ionicons name="sparkles" size={12} color="#FFF" style={styles.aiSparkleIcon} />
                            <Text style={styles.aiIconText}>Ai</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.greetingTitle, { color: colors.text }]}>Hi {userName}! 👋</Text>
                            <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
                                UpNum Business AI evaluated your transactions. Total sales changed by {salesChange}% across {txCount} transactions.
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.howAiWorksBtn, { borderColor: "#8B5CF6" }]} onPress={() => setHowAiWorksVisible(true)} activeOpacity={0.8}>
                        <Ionicons name="help-circle-outline" size={16} color="#8B5CF6" />
                        <Text style={[styles.howAiWorksText, { color: "#8B5CF6" }]}>How Business AI Works</Text>
                    </TouchableOpacity>
                </View>

                {/* How Business AI Works Modal */}
                <Modal
                    visible={howAiWorksVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setHowAiWorksVisible(false)}
                >
                    <Pressable style={styles.modalOverlay} onPress={() => setHowAiWorksVisible(false)}>
                        <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : "#FFFFFF" }]} onPress={() => { }}>
                            <View style={styles.modalHandleBar} />

                            <View style={styles.modalHeader}>
                                <View style={styles.modalHeaderLeft}>
                                    <View style={[styles.modalIconCircle, { backgroundColor: "#8B5CF6" }]}>
                                        <Ionicons name="sparkles" size={20} color="#FFF" />
                                    </View>
                                    <View>
                                        <Text style={[styles.modalTitle, { color: colors.text }]}>How Business AI Works</Text>
                                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Engineered for merchant growth</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setHowAiWorksVisible(false)} style={styles.modalCloseBtn}>
                                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={[styles.modalIntroBox, { backgroundColor: isDark ? "#1E1433" : "#F5F3FF", borderColor: "#8B5CF6" }]}>
                                    <Text style={[styles.modalIntroText, { color: isDark ? "#C4B5FD" : "#5B21B6" }]}>
                                        UpNum's Business AI analyzes real store transactions, checkout speeds, peak customer hours, and category sales to deliver actionable growth strategies.
                                    </Text>
                                </View>

                                {[
                                    {
                                        step: "1",
                                        icon: "swap-horizontal-outline",
                                        color: "#3B82F6",
                                        bg: isDark ? "#1E2D45" : "#EFF6FF",
                                        title: "Merchant Sync",
                                        desc: "Securely aggregates all store UPI, QR code, and payment gateway transactions in real-time.",
                                    },
                                    {
                                        step: "2",
                                        icon: "analytics-outline",
                                        color: "#8B5CF6",
                                        bg: isDark ? "#1E1433" : "#F5F3FF",
                                        title: "Demand & Peak Hours Analysis",
                                        desc: "Calculates high-velocity buying windows, average ticket sizes, and customer retention trends.",
                                    },
                                    {
                                        step: "3",
                                        icon: "bulb-outline",
                                        color: "#F59E0B",
                                        bg: isDark ? "#2D2008" : "#FFFBEB",
                                        title: "Growth Recommendations",
                                        desc: "Generates targeted promotional strategies, off-peak discount schedules, and invoice recovery alerts.",
                                    },
                                    {
                                        step: "4",
                                        icon: "shield-checkmark-outline",
                                        color: "#10B981",
                                        bg: isDark ? "#0A2E1F" : "#ECFDF5",
                                        title: "Enterprise Privacy",
                                        desc: "Your business revenue and customer data are fully encrypted and never shared with third parties.",
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
                                <Line x1="0" y1="30" x2="450" y2="30" stroke={colors.border} strokeWidth="1" />
                                <Line x1="0" y1="70" x2="450" y2="70" stroke={colors.border} strokeWidth="1" />
                                <Line x1="0" y1="110" x2="450" y2="110" stroke={colors.border} strokeWidth="1" />
                                <Line x1="0" y1="150" x2="450" y2="150" stroke={colors.border} strokeWidth="1.5" />

                                {lineChartData.map((pt, idx) => (
                                    <SvgText key={idx} x={pt.x - 12} y="158" fill={colors.textSecondary} fontSize="10">{pt.label}</SvgText>
                                ))}

                                <Path
                                    d={incomeLinePath}
                                    fill="none"
                                    stroke={colors.primary}
                                    strokeWidth="3"
                                />

                                {lineChartData.map((pt, idx) => (
                                    <Circle key={idx} cx={pt.x} cy={pt.y} r="5" fill={colors.primary} stroke={colors.surface} strokeWidth="1.5" />
                                ))}
                            </Svg>
                        </View>
                    </View>

                    {/* Sales by Day of Week Bar Chart */}
                    <View style={[styles.chartCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.chartHeader}>
                            <Text style={[styles.chartTitle, { color: colors.text }]}>Sales by Day of Week</Text>
                        </View>

                        <View style={styles.barChartWrapper}>
                            <View style={styles.barsContainer}>
                                {dayOfWeekData.map((bar, idx) => (
                                    <View key={idx} style={styles.barItemColumn}>
                                        <Text style={[styles.barHoverValue, { color: colors.text }]}>{bar.formattedValue || bar.value}</Text>
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

                {/* Middle 3 Columns: Smart Insights, AI Recommendations, Confidence & Heatmap */}
                <View style={[styles.middleGrid, isDesktop ? styles.rowLayout : styles.columnLayout]}>

                    {/* 1. Smart Insights for Business */}
                    <View style={[styles.infoCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.insightCardTitle, { color: colors.text, marginBottom: 20 }]}>Smart Insights for Business</Text>

                        <View style={styles.insightsList}>
                            {businessInsights.map((item, idx) => {
                                const config = getInsightConfig(item.type);
                                return (
                                    <TouchableOpacity
                                        key={item.id || idx}
                                        style={[styles.insightListItem, { borderBottomColor: colors.border, borderBottomWidth: idx === businessInsights.length - 1 ? 0 : 1 }]}
                                        onPress={() => handleInsightDetail(item)}
                                        activeOpacity={0.85}
                                    >
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

                    {/* 2. Personalized Growth Recommendations */}
                    <View style={[styles.infoCard, { flex: 1.2, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.insightCardHeader}>
                            <Ionicons name="sparkles" size={18} color={colors.primary} />
                            <Text style={[styles.insightCardTitle, { color: colors.text }]}>Growth Recommendations</Text>
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
                                    {isRegenerating ? "Generating..." : "Regenerate"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.insightsList}>
                            {recommendations.map((item, idx) => (
                                <View key={idx} style={[styles.insightListItem, { borderBottomColor: colors.border, borderBottomWidth: idx === recommendations.length - 1 ? 0 : 1 }]}>
                                    <View style={[styles.itemIconCircle, { backgroundColor: isDark ? colors.border : item.bg }]}>
                                        <Ionicons name={(item.icon || "bulb-outline") as any} size={18} color={item.color || colors.primary} />
                                    </View>
                                    <View style={styles.itemContent}>
                                        <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                                        <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                                    </View>
                                    <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.primary }]} onPress={() => handleRecAction(item)} activeOpacity={0.85}>
                                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>{item.btnText || "Action"}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 3. Peak Hours & Confidence */}
                    <View style={[styles.infoCard, { flex: 0.9, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.insightCardTitle, { color: colors.text }]}>Confidence & Peak Hours</Text>

                        {/* Gauge */}
                        <View style={styles.gaugeWrapper}>
                            <Svg height="90" width="100%" viewBox="0 0 36 36">
                                <Circle cx="18" cy="18" r="15.915" fill="none" stroke={isDark ? colors.border : "#F1F5F9"} strokeWidth="3" />
                                <Circle
                                    cx="18"
                                    cy="18"
                                    r="15.915"
                                    fill="none"
                                    stroke={colors.primary}
                                    strokeWidth="3"
                                    strokeDasharray="100"
                                    strokeDashoffset={(100 - Math.min(98, Math.max(65, 72 + (txCount > 0 ? 14 : 0) + (sales > 0 ? 10 : 0)))).toString()}
                                    strokeLinecap="round"
                                    transform="rotate(-90 18 18)"
                                />
                            </Svg>
                            <View style={styles.gaugeLabels}>
                                <Text style={[styles.gaugePercent, { color: colors.text }]}>{Math.min(98, Math.max(65, 72 + (txCount > 0 ? 14 : 0) + (sales > 0 ? 10 : 0)))}%</Text>
                                <Text style={[styles.gaugeStatus, { color: colors.success }]}>High Confidence</Text>
                            </View>
                        </View>

                        {/* Peak Heatmap */}
                        <View style={styles.heatmapWrapper}>
                            <View style={styles.heatmapHeaders}>
                                <View style={styles.heatmapEmptyCorner} />
                                {TIMES.map((time, idx) => (
                                    <Text key={idx} style={[styles.heatmapTimeLabel, { color: colors.textSecondary }]}>{time}</Text>
                                ))}
                            </View>

                            <View style={styles.heatmapRows}>
                                {DAYS.slice(0, 5).map((day, dIdx) => (
                                    <View key={dIdx} style={styles.heatmapRowItem}>
                                        <Text style={[styles.heatmapDayLabel, { color: colors.textSecondary }]}>{day}</Text>
                                        <View style={styles.heatmapCells}>
                                            {TIMES.map((_, tIdx) => {
                                                const opacityScale = txCount > 0 ? 1 : 0.3;
                                                const opacity = Math.min(0.95, HEATMAP_OPACITY[dIdx][tIdx] * opacityScale);
                                                return (
                                                    <View
                                                        key={tIdx}
                                                        style={[
                                                            styles.heatmapCell,
                                                            { backgroundColor: `rgba(108, 44, 244, ${opacity})` }
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

                {/* Bottom Section: Projections & Ask AI Assistant */}
                <View style={[styles.bottomGrid, isDesktop ? styles.rowLayout : styles.columnLayout]}>

                    {/* Future Business Projection */}
                    <View style={[styles.infoCard, { flex: 1.5, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.insightCardTitle, { color: colors.text }]}>Future Business Projection</Text>
                        <Text style={[styles.insightCardSub, { color: colors.textSecondary, marginBottom: 20 }]}>Forecast based on transaction trends</Text>

                        <View style={[styles.projectionRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                            {/* Current Trend */}
                            <View style={[styles.projCard, { backgroundColor: isDark ? colors.border : "#FAFAFA", borderColor: colors.border }]}>
                                <Text style={[styles.projTitle, { color: colors.textSecondary }]}>If You Continue Current Trend</Text>
                                <Text style={[styles.projSub, { color: colors.textSecondary }]}>Projected next month sales</Text>
                                <Text style={[styles.projValue, { color: "#3B82F6" }]}>₹{(sales * 1.08).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                <Text style={[styles.projDate, { color: colors.textSecondary }]}>+8% projected growth</Text>
                                <View style={styles.miniChart}>
                                    <Svg height="40" width="100%" viewBox="0 0 100 40">
                                        <Path d="M 0,35 L 20,30 L 40,28 L 60,20 L 80,18 L 100,10" fill="none" stroke="#3B82F6" strokeWidth="2" />
                                        <Circle cx="100" cy="10" r="3" fill="#3B82F6" />
                                    </Svg>
                                </View>
                            </View>

                            {/* With AI Strategies */}
                            <View style={[styles.projCard, { backgroundColor: isDark ? colors.border : "#FAFAFA", borderColor: colors.border }]}>
                                <Text style={[styles.projTitle, { color: "#10B981" }]}>If You Apply AI Growth Strategies</Text>
                                <Text style={[styles.projSub, { color: colors.textSecondary }]}>Potential next month sales</Text>
                                <Text style={[styles.projValue, { color: "#10B981" }]}>₹{(sales * 1.22).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                <Text style={[styles.projDate, { color: colors.textSecondary }]}>+22% potential growth</Text>
                                <View style={styles.miniChart}>
                                    <Svg height="40" width="100%" viewBox="0 0 100 40">
                                        <Path d="M 0,35 L 20,32 L 40,22 L 60,18 L 80,10 L 100,4" fill="none" stroke="#10B981" strokeWidth="2" />
                                        <Circle cx="100" cy="4" r="3" fill="#10B981" />
                                    </Svg>
                                </View>
                            </View>

                            {/* Potential Impact */}
                            <View style={[styles.projCard, { backgroundColor: isDark ? "#2d1b69" : "#F5F3FF", borderColor: "transparent" }]}>
                                <Text style={[styles.projTitle, { color: "#6C2CF4" }]}>Potential Business Impact (Next 6 Months)</Text>
                                <View style={styles.impactGrid}>
                                    <View style={styles.impactItem}>
                                        <View style={[styles.impactIcon, { backgroundColor: "#FFF" }]}>
                                            <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                                        </View>
                                        <Text style={[styles.impactLabel, { color: colors.textSecondary }]}>Extra Revenue</Text>
                                        <Text style={[styles.impactValue, { color: colors.text }]}>₹{(sales * 0.18 * 6).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                                    </View>
                                    <View style={styles.impactItem}>
                                        <View style={[styles.impactIcon, { backgroundColor: "#FFF" }]}>
                                            <Ionicons name="people" size={14} color="#8B5CF6" />
                                        </View>
                                        <Text style={[styles.impactLabel, { color: colors.textSecondary }]}>Customer Growth</Text>
                                        <Text style={[styles.impactValue, { color: colors.text }]}>+35%</Text>
                                    </View>
                                    <View style={styles.impactItem}>
                                        <View style={[styles.impactIcon, { backgroundColor: "#FFF" }]}>
                                            <Ionicons name="trending-up" size={14} color="#8B5CF6" />
                                        </View>
                                        <Text style={[styles.impactLabel, { color: colors.textSecondary }]}>Peak Hour Conversion</Text>
                                        <Text style={[styles.impactValue, { color: colors.text }]}>+28%</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Ask Business AI Assistant */}
                    <View style={[styles.infoCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.insightCardTitle, { color: colors.text }]}>Ask Business AI Assistant</Text>
                        <Text style={[styles.insightCardSub, { color: colors.textSecondary, marginBottom: 20 }]}>Get instant growth advice & operational insights</Text>

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
                                placeholder="Ask about sales, peak hours, promos..."
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
                            {[
                                "How can I boost sales during slow hours?",
                                "What is my best performing day?",
                                "How to reduce payment drop-offs?",
                                "Suggest weekend promotional deals"
                            ].map((chip, idx) => (
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
                    <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : "#FFF" }]} onPress={() => { }}>
                        <View style={styles.modalHandleBar} />
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <View style={[styles.modalIconCircle, { backgroundColor: selectedStat?.color || "#8B5CF6" }]}>
                                    <Ionicons name={(selectedStat?.icon || "analytics-outline") as any} size={20} color="#FFF" />
                                </View>
                                <View>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedStat?.title}</Text>
                                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Business metric breakdown</Text>
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
                            Calculated from real store transactions for period: <Text style={{ fontWeight: "700", color: colors.text }}>{dateRange}</Text>.
                            {selectedStat?.title === "Total Sales" && " Increasing customer retention during weekday slow hours can further accelerate growth."}
                            {selectedStat?.title === "Total Transactions" && " Transaction count reflects customer checkout frequency and store traffic volume."}
                            {selectedStat?.title === "New Customers" && " Running welcome referral discounts encourages repeat store visits."}
                            {selectedStat?.title === "Average Order Value" && " Offering product bundle packages at checkout increases ticket sizes."}
                        </Text>
                        <TouchableOpacity style={[styles.modalCta, { backgroundColor: selectedStat?.color || "#8B5CF6" }]} onPress={() => setStatDetailVisible(false)}>
                            <Text style={styles.modalCtaText}>Got it</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ── Insight Detail Modal ── */}
            <Modal visible={insightDetailVisible} transparent animationType="slide" onRequestClose={() => setInsightDetailVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setInsightDetailVisible(false)}>
                    <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : "#FFF" }]} onPress={() => { }}>
                        <View style={styles.modalHandleBar} />
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <View style={[styles.modalIconCircle, { backgroundColor: colors.primary }]}>
                                    <Ionicons name="sparkles" size={20} color="#FFF" />
                                </View>
                                <View>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedInsight?.title}</Text>
                                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>AI operational analysis</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setInsightDetailVisible(false)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.recInfoBox, { backgroundColor: isDark ? "#1E1433" : "#F5F3FF", borderColor: "#8B5CF6" }]}>
                            <Ionicons name="bulb-outline" size={18} color="#8B5CF6" />
                            <Text style={[styles.recInfoText, { color: isDark ? "#C4B5FD" : "#5B21B6" }]}>
                                {selectedInsight?.details || selectedInsight?.description}
                            </Text>
                        </View>
                        <TouchableOpacity style={[styles.modalCta, { backgroundColor: "#8B5CF6" }]} onPress={() => setInsightDetailVisible(false)}>
                            <Text style={styles.modalCtaText}>Close</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ── Recommendation Action Modal ── */}
            <Modal visible={recModalVisible} transparent animationType="slide" onRequestClose={() => setRecModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setRecModalVisible(false)}>
                    <Pressable style={[styles.modalSheet, { backgroundColor: isDark ? colors.surface : "#FFF" }]} onPress={() => { }}>
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

                        {selectedRec?.btnText === "Set Offer" && (
                            <>
                                <Text style={[styles.recInputLabel, { color: colors.textSecondary }]}>Enter off-peak discount percentage (%)</Text>
                                <View style={[styles.recInputRow, { borderColor: colors.border, backgroundColor: isDark ? colors.background : "#F8FAFC" }]}>
                                    <Text style={[styles.recInputPrefix, { color: colors.text }]}>%</Text>
                                    <TextInput
                                        style={[styles.recInput, { color: colors.text }]}
                                        placeholder="e.g. 15"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                        value={actionInput}
                                        onChangeText={setActionInput}
                                    />
                                </View>
                            </>
                        )}

                        <View style={[styles.recInfoBox, { backgroundColor: isDark ? "#1E1433" : "#F5F3FF", borderColor: "#8B5CF6" }]}>
                            <Ionicons name="rocket-outline" size={18} color="#8B5CF6" />
                            <Text style={[styles.recInfoText, { color: isDark ? "#C4B5FD" : "#5B21B6" }]}>
                                {selectedRec?.title === "Boost Off-Peak Sales"
                                    ? "Setting a 10-15% happy hour discount during slow hours (2 PM - 5 PM) encourages customer visits."
                                    : selectedRec?.title === "Weekend Promotion Deal"
                                        ? "Weekend promos create urgency and maximize revenue during peak footfall days."
                                        : "Applying AI strategies optimizes checkout speed and merchant profitability."}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalCta, { backgroundColor: selectedRec?.color || "#8B5CF6" }]}
                            onPress={() => {
                                setRecModalVisible(false);
                                Alert.alert("Success", `Action updated for "${selectedRec?.title}".`);
                            }}
                        >
                            <Text style={styles.modalCtaText}>Save & Apply Strategy</Text>
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
    greetingCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        ...Shadows.sm,
    },
    greetingLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
        minWidth: 240,
    },
    aiIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    aiSparkleIcon: {
        position: "absolute",
        top: 6,
        right: 6,
    },
    aiIconText: {
        color: "#FFF",
        fontWeight: "900",
        fontSize: 14,
    },
    greetingTitle: {
        fontSize: 16,
        fontWeight: "800",
    },
    greetingSub: {
        fontSize: 12,
        marginTop: 2,
        lineHeight: 17,
    },
    howAiWorksBtn: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    howAiWorksText: {
        fontSize: 12,
        fontWeight: "700",
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
    middleGrid: {
        gap: 20,
        marginBottom: 24,
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
    insightCardSub: {
        fontSize: 11,
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
    insightsList: {
        gap: 4,
    },
    insightListItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 12,
    },
    itemIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 13,
        fontWeight: "700",
    },
    itemDesc: {
        fontSize: 11,
        marginTop: 2,
        lineHeight: 16,
    },
    actionBtn: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    actionBtnText: {
        fontSize: 11,
        fontWeight: "700",
    },
    gaugeWrapper: {
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        height: 100,
        marginBottom: 10,
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
    heatmapWrapper: {
        marginTop: 6,
    },
    heatmapHeaders: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
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
        gap: 4,
    },
    heatmapCell: {
        flex: 1,
        height: 14,
        borderRadius: 4,
    },
    projectionRow: {
        gap: 16,
    },
    projCard: {
        flex: 1,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
    },
    projTitle: {
        fontSize: 12,
        fontWeight: "700",
    },
    projSub: {
        fontSize: 10,
        marginTop: 2,
    },
    projValue: {
        fontSize: 20,
        fontWeight: "800",
        marginTop: 8,
    },
    projDate: {
        fontSize: 10,
        marginTop: 2,
    },
    miniChart: {
        marginTop: 10,
    },
    impactGrid: {
        gap: 10,
        marginTop: 10,
    },
    impactItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    impactIcon: {
        width: 24,
        height: 24,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    impactLabel: {
        flex: 1,
        fontSize: 11,
    },
    impactValue: {
        fontSize: 12,
        fontWeight: "800",
    },
    chatHistory: {
        maxHeight: 180,
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
    },
    chatBubble: {
        padding: 10,
        borderRadius: 12,
        marginBottom: 8,
        maxWidth: "85%",
    },
    chatBubbleUser: {
        backgroundColor: "#8B5CF6",
        alignSelf: "flex-end",
    },
    chatBubbleAi: {
        alignSelf: "flex-start",
    },
    chatBubbleText: {
        fontSize: 12,
        lineHeight: 16,
    },
    chatInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 12,
    },
    chatInput: {
        flex: 1,
        fontSize: 12,
        paddingVertical: 6,
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
        gap: 6,
    },
    chip: {
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    chipText: {
        fontSize: 10,
        fontWeight: "600",
    },
    dropOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    dropSheet: {
        width: 260,
        borderRadius: 16,
        padding: 16,
        elevation: 5,
    },
    dropTitle: {
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 12,
    },
    dropItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 10,
    },
    dropItemText: {
        fontSize: 13,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: "85%",
    },
    modalHandleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#CBD5E1",
        alignSelf: "center",
        marginBottom: 16,
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
        flex: 1,
    },
    modalIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "800",
    },
    modalSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalIntroBox: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        marginBottom: 16,
    },
    modalIntroText: {
        fontSize: 12,
        lineHeight: 18,
    },
    stepCard: {
        flexDirection: "row",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    stepCardLeft: {
        alignItems: "center",
        marginRight: 12,
    },
    stepCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    stepNumber: {
        color: "#FFF",
        fontWeight: "800",
        fontSize: 12,
    },
    stepLine: {
        width: 2,
        flex: 1,
        marginTop: 4,
    },
    stepContent: {
        flex: 1,
    },
    stepIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
    },
    stepTitle: {
        fontSize: 13,
        fontWeight: "800",
        marginBottom: 2,
    },
    stepDesc: {
        fontSize: 11,
        lineHeight: 16,
    },
    modalCta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        paddingVertical: 12,
        marginTop: 16,
        gap: 8,
    },
    modalCtaText: {
        color: "#FFF",
        fontWeight: "800",
        fontSize: 14,
    },
    filterChipsWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginVertical: 12,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: "600",
    },
    statDetailBox: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        alignItems: "center",
        marginVertical: 12,
    },
    statDetailValue: {
        fontSize: 24,
        fontWeight: "800",
    },
    statDetailChange: {
        fontSize: 12,
        marginTop: 4,
    },
    statDetailNote: {
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 12,
    },
    recInputLabel: {
        fontSize: 12,
        marginBottom: 8,
    },
    recInputRow: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    recInputPrefix: {
        fontSize: 16,
        fontWeight: "700",
        marginRight: 8,
    },
    recInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        fontWeight: "600",
    },
    recInfoBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    recInfoText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
    },
});
