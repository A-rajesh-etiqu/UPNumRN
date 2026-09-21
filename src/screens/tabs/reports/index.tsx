import React, { useState, useMemo, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    useWindowDimensions
} from "react-native";
import { useAuthStore } from "../../../store/auth.store";
import { useTransactionStore } from "../../../store/transaction.store";
import { useAppTheme } from "../../../theme";
import Ionicons from "react-native-vector-icons/Ionicons";
import DatePickerField from "../../../components/common/DatePickerField";
import { LineChart, PieChart, BarChart } from "react-native-gifted-charts";
import dayjs from "dayjs";
import { router } from "../../../navigation/RootNavigation";

export default function ReportsScreen() {
    const { user } = useAuthStore();
    const { transactions, loading, loadTransactions } = useTransactionStore();
    const { colors, isDark } = useAppTheme();
    const { width } = useWindowDimensions();

    const isDesktop = width >= 1024;

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [activeFilter, setActiveFilter] = useState("This Month");

    // Brand Colors from Design
    const colorIncome = "#10B981";
    const colorSpending = "#8B5CF6";
    const colorSavings = "#3B82F6";
    const colorTransactions = "#F59E0B";
    const bgColor = isDark ? colors.background : "#F8FAFC";
    const cardBg = isDark ? colors.surface : "#FFFFFF";

    useEffect(() => {
        loadTransactions(user?.id);
    }, [user?.id]);

    const setPresetFilter = (filter: string) => {
        setActiveFilter(filter);
        const today = new Date();
        const yyyyMmDd = (d: Date) => d.toISOString().split("T")[0];
        
        setEndDate(yyyyMmDd(today));

        if (filter === "Last 7 Days") {
            const last7 = new Date(today);
            last7.setDate(today.getDate() - 7);
            setStartDate(yyyyMmDd(last7));
        } else if (filter === "This Month") {
            const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(yyyyMmDd(thisMonth));
        } else if (filter === "All Time") {
            setStartDate("");
            setEndDate("");
        }
    };

    useEffect(() => {
        setPresetFilter("All Time");
    }, []);

    // Filter transactions by date
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            if (!startDate && !endDate) return true;
            const txDate = new Date((tx as any).date_time || tx.date);
            if (startDate && txDate < new Date(startDate)) return false;
            if (endDate) {
                const eDate = new Date(endDate);
                eDate.setHours(23, 59, 59, 999);
                if (txDate > eDate) return false;
            }
            return true;
        });
    }, [transactions, startDate, endDate]);

    // Top Stats
    const { totalIncome, totalSpending, transactionsCount } = useMemo(() => {
        let inc = 0;
        let exp = 0;
        filteredTransactions.forEach(tx => {
            if (tx.type === "income") inc += Math.abs(tx.amount);
            else exp += Math.abs(tx.amount);
        });
        return { totalIncome: inc, totalSpending: exp, transactionsCount: filteredTransactions.length };
    }, [filteredTransactions]);

    const totalSavings = totalIncome - totalSpending;

    // Line Chart Data (Trend)
    const { incomeChartData, expenseChartData, maxLineValue } = useMemo(() => {
        const grouped: Record<string, { inc: number; exp: number }> = {};
        
        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        filteredTransactions.forEach(tx => {
            const dateStr = dayjs((tx as any).date_time || tx.date).format("YYYY-MM-DD");
            if (!grouped[dateStr]) grouped[dateStr] = { inc: 0, exp: 0 };
            if (tx.type === "income") grouped[dateStr].inc += Math.abs(tx.amount);
            else grouped[dateStr].exp += Math.abs(tx.amount);

            const txDate = new Date(dateStr);
            if (!minDate || txDate < minDate) minDate = txDate;
            if (!maxDate || txDate > maxDate) maxDate = txDate;
        });

        const sortedDates: string[] = [];
        if (minDate && maxDate) {
            let current = new Date(minDate);
            while (current <= maxDate) {
                sortedDates.push(dayjs(current).format("YYYY-MM-DD"));
                current.setDate(current.getDate() + 1);
            }
        }

        const incData: any[] = [];
        const expData: any[] = [];
        let maxVal = 0;
        
        const step = Math.max(1, Math.ceil(sortedDates.length / 7));
        
        sortedDates.forEach((fullDate, index) => {
            const displayDate = dayjs(fullDate).format("D MMM");
            const data = grouped[fullDate] || { inc: 0, exp: 0 };
            maxVal = Math.max(maxVal, data.inc, data.exp);
            
            const showLabel = index % step === 0 || index === sortedDates.length - 1;
            incData.push({ 
                value: data.inc, 
                label: showLabel ? displayDate : "", 
                labelTextStyle: { color: colors.textSecondary, fontSize: 10 } 
            });
            expData.push({ value: data.exp });
        });

        if (incData.length === 0) {
            incData.push({ value: 0, label: "No Data" });
            expData.push({ value: 0 });
        }

        return { incomeChartData: incData, expenseChartData: expData, maxLineValue: maxVal };
    }, [filteredTransactions, colors]);

    const stepLine = Math.max(Math.ceil(maxLineValue / 4 / 1000) * 1000, 100);
    const maxLineRounded = stepLine * 4;

    // Donut Chart Data (Categories)
    const categoryColors = ["#8B5CF6", "#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#64748B"];
    const { pieChartData, topCategories } = useMemo(() => {
        const expensesByCategory: Record<string, number> = {};
        filteredTransactions.forEach(tx => {
            if (tx.type === "expense") {
                const cat = tx.category || "Others";
                expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Math.abs(tx.amount);
            }
        });

        const sorted = Object.keys(expensesByCategory).map(key => ({
            name: key,
            value: expensesByCategory[key],
        })).sort((a, b) => b.value - a.value);

        const pieData = sorted.map((item, index) => ({
            value: item.value,
            color: categoryColors[index % categoryColors.length],
            text: item.name,
            percent: totalSpending > 0 ? (item.value / totalSpending) * 100 : 0
        }));

        return { pieChartData: pieData, topCategories: pieData };
    }, [filteredTransactions, totalSpending]);

    // Monthly Comparison Data (Bar Chart)
    const { barChartData, maxBarValue } = useMemo(() => {
        const groupedByMonth: Record<string, { inc: number; exp: number }> = {};
        // Use all transactions for monthly to show history, not just filtered
        transactions.forEach(tx => {
            const monthStr = dayjs((tx as any).date_time || tx.date).format("MMM");
            if (!groupedByMonth[monthStr]) groupedByMonth[monthStr] = { inc: 0, exp: 0 };
            if (tx.type === "income") groupedByMonth[monthStr].inc += Math.abs(tx.amount);
            else groupedByMonth[monthStr].exp += Math.abs(tx.amount);
        });

        const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => dayjs(a, "MMM").month() - dayjs(b, "MMM").month());
        
        const bData: any[] = [];
        let maxVal = 0;
        sortedMonths.forEach(month => {
            maxVal = Math.max(maxVal, groupedByMonth[month].inc, groupedByMonth[month].exp);
            bData.push({
                value: groupedByMonth[month].inc,
                label: month,
                spacing: 4,
                labelWidth: 30,
                labelTextStyle: { color: colors.textSecondary, fontSize: 10 },
                frontColor: colorIncome,
            });
            bData.push({
                value: groupedByMonth[month].exp,
                frontColor: colorSpending,
            });
        });

        if(bData.length === 0) {
            bData.push({ value: 0, label: "No Data", frontColor: colorIncome, spacing: 4 });
            bData.push({ value: 0, frontColor: colorSpending });
        }

        return { barChartData: bData, maxBarValue: maxVal };
    }, [transactions, colors]);

    const stepBar = Math.max(Math.ceil(maxBarValue / 4 / 1000) * 1000, 100);
    const maxBarRounded = stepBar * 4;

    // Top Recent Transactions
    const recentTx = useMemo(() => {
        return [...filteredTransactions].sort((a, b) => {
            return dayjs((b as any).date_time || b.date).valueOf() - dayjs((a as any).date_time || a.date).valueOf();
        }).slice(0, 5);
    }, [filteredTransactions]);

    // --- Render Helpers ---

    const renderStatCard = (title: string, value: string, icon: string, color: string, change: string, isUp: boolean) => (
        <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: colors.border, width: isDesktop ? '23%' : '48%', marginBottom: isDesktop ? 0 : 16 }]}>
            <View style={styles.statHeader}>
                <View style={[styles.statIconWrap, { backgroundColor: color + "15" }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <View>
                    <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
                </View>
            </View>
            <View style={styles.statFooter}>
                <Ionicons name={isUp ? "caret-up" : "caret-down"} size={12} color={isUp ? colorIncome : colors.danger} />
                <Text style={[styles.statChange, { color: isUp ? colorIncome : colors.danger }]}>
                    {change} <Text style={{ color: colors.textSecondary }}>vs. last month</Text>
                </Text>
            </View>
        </View>
    );

    const renderWebDatePicker = (label: string, val: string, setVal: (v: string) => void) => {
        return (
            <div style={{
                height: 40,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '0 12px',
                backgroundColor: isDark ? colors.inputBackground : '#FFF',
                display: 'flex',
                alignItems: 'center',
            }}>
                <input 
                    type="date"
                    value={val}
                    onChange={(e) => {
                        setVal(e.target.value);
                        setActiveFilter("Custom");
                    }}
                    style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: colors.text,
                        fontFamily: 'inherit',
                        fontSize: 14
                    }}
                />
            </div>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.headerRow, { flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'flex-start' }]}>
                <View style={{ marginBottom: isDesktop ? 0 : 16 }}>
                    <Text style={[styles.pageTitle, { color: colors.text }]}>Reports</Text>
                    <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 14 }}>
                        Get detailed insights about your spending, savings and financial habits
                    </Text>
                </View>
                
                <View style={styles.headerActions}>
                    {Platform.OS === 'web' && (
                        <View style={styles.datePickerRow}>
                            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            {renderWebDatePicker("", startDate, setStartDate)}
                            <Text style={{ marginHorizontal: 8, color: colors.textSecondary }}>-</Text>
                            {renderWebDatePicker("", endDate, setEndDate)}
                        </View>
                    )}
                    <TouchableOpacity style={[styles.downloadBtn, { borderColor: colorSpending }]}>
                        <Ionicons name="download-outline" size={16} color={colorSpending} style={{ marginRight: 8 }} />
                        <Text style={{ color: colorSpending, fontWeight: '600', fontSize: 13 }}>Download Report</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Top Stats Row */}
            <View style={[styles.statsRow, { flexDirection: isDesktop ? 'row' : 'row', flexWrap: isDesktop ? 'nowrap' : 'wrap', justifyContent: 'space-between' }]}>
                {renderStatCard("Total Income", `₹${totalIncome.toLocaleString()}`, "trending-up", colorIncome, "12%", true)}
                {renderStatCard("Total Spending", `₹${totalSpending.toLocaleString()}`, "swap-vertical", colors.danger, "8%", false)}
                {renderStatCard("Savings", `₹${totalSavings.toLocaleString()}`, "wallet-outline", colorSavings, "25%", true)}
                {renderStatCard("Transactions", transactionsCount.toString(), "calendar-outline", colorTransactions, "10%", true)}
            </View>

            {/* Middle Row: Trend Line Chart & Donut Chart */}
            <View style={[styles.flexRow, { flexDirection: isDesktop ? 'row' : 'column', gap: 20 }]}>
                {/* Trend Chart */}
                <View style={[styles.card, { flex: isDesktop ? 2 : 1, backgroundColor: cardBg, borderColor: colors.border, overflow: 'hidden' }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Income vs Spending Trend</Text>
                        <View style={styles.legendWrap}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: colorIncome }]} />
                                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Income</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: colorSpending }]} />
                                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Spending</Text>
                            </View>
                        </View>
                    </View>
                    <View style={{ marginTop: 20 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <LineChart
                                data={incomeChartData}
                                data2={expenseChartData}
                                maxValue={maxLineRounded}
                                stepValue={stepLine}
                                noOfSections={4}
                                color1={colorIncome}
                                color2={colorSpending}
                                dataPointsColor1={colorIncome}
                                dataPointsColor2={colorSpending}
                                startFillColor1={colorIncome}
                                startFillColor2={colorSpending}
                                startOpacity={0.2}
                                endOpacity={0.05}
                                thickness={3}
                                initialSpacing={20}
                                spacing={40}
                                yAxisColor={"transparent"}
                                yAxisThickness={0}
                                xAxisColor={colors.border}
                                xAxisThickness={1}
                                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                                rulesColor={colors.border}
                                rulesType="solid"
                                areaChart
                                curved
                                isAnimated
                                hideDataPoints
                            />
                        </ScrollView>
                    </View>
                </View>

                {/* Donut Chart */}
                <View style={[styles.card, { flex: isDesktop ? 1 : 1, backgroundColor: cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 20 }]}>Spending by Category</Text>
                    <View style={[styles.donutContainer, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                        <View style={{ alignItems: 'center' }}>
                            <PieChart
                                data={pieChartData}
                                donut
                                radius={isDesktop ? 80 : 100}
                                innerRadius={isDesktop ? 50 : 65}
                                innerCircleColor={cardBg}
                                centerLabelComponent={() => (
                                    <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                        <Text style={{fontSize: isDesktop ? 16 : 20, color: colors.text, fontWeight: '700'}}>
                                            ₹{(totalSpending / 1000).toFixed(1)}k
                                        </Text>
                                        <Text style={{fontSize: 10, color: colors.textSecondary}}>Total Spending</Text>
                                    </View>
                                )}
                            />
                        </View>
                        <View style={[styles.donutLegend, { marginTop: isDesktop ? 0 : 20, marginLeft: isDesktop ? 20 : 0 }]}>
                            {topCategories.map((item, index) => (
                                <View key={index} style={styles.donutLegendItem}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 2 }}>
                                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                        <Text style={[styles.legendText, { color: colors.textSecondary }]} numberOfLines={1}>{item.text}</Text>
                                    </View>
                                    <Text style={[styles.legendText, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>{item.percent.toFixed(0)}%</Text>
                                    <Text style={[styles.legendText, { color: colors.text, flex: 1, textAlign: 'right', fontWeight: '500' }]}>₹{item.value.toLocaleString()}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Bottom Row: Top Categories, Recent Tx, Monthly Comparison */}
            <View style={[styles.flexRow, { flexDirection: isDesktop ? 'row' : 'column', gap: 20 }]}>
                
                {/* Top Categories Progress */}
                <View style={[styles.card, { flex: 1, backgroundColor: cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 20 }]}>Top Spending Categories</Text>
                    {topCategories.slice(0, 5).map((item, index) => (
                        <View key={index} style={styles.topCatRow}>
                            <View style={styles.topCatHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.catIcon, { backgroundColor: item.color + "15" }]}>
                                        <Ionicons name="basket-outline" size={16} color={item.color} />
                                    </View>
                                    <Text style={[styles.catName, { color: colors.text }]}>{item.text}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.catAmount, { color: colors.text }]}>₹{item.value.toLocaleString()}</Text>
                                    <Text style={[styles.catPercent, { color: colors.textSecondary }]}>{item.percent.toFixed(0)}%</Text>
                                </View>
                            </View>
                            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                                <View style={[styles.progressBarFill, { backgroundColor: item.color, width: `${item.percent}%` }]} />
                            </View>
                        </View>
                    ))}
                </View>

                {/* Recent Transactions */}
                <View style={[styles.card, { flex: 1.5, backgroundColor: cardBg, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Transactions</Text>
                        <TouchableOpacity onPress={() => router.push("/tabs/transactions")}>
                            <Text style={{ color: colorSpending, fontSize: 13, fontWeight: '600' }}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, { color: colors.textSecondary, flex: 1.5 }]}>Date</Text>
                        <Text style={[styles.th, { color: colors.textSecondary, flex: 2 }]}>Description</Text>
                        <Text style={[styles.th, { color: colors.textSecondary, flex: 1.5 }]}>Category</Text>
                        <Text style={[styles.th, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>Amount</Text>
                    </View>
                    {recentTx.map((tx, index) => (
                        <View key={tx.id} style={[styles.tr, { borderBottomColor: colors.border, borderBottomWidth: index === recentTx.length - 1 ? 0 : 1 }]}>
                            <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.txTinyIcon, { backgroundColor: tx.type === 'income' ? colorIncome + "15" : colors.danger + "15" }]}>
                                    <Ionicons name={tx.type === 'income' ? "arrow-down" : "arrow-up"} size={12} color={tx.type === 'income' ? colorIncome : colors.danger} />
                                </View>
                                <Text style={[styles.td, { color: colors.textSecondary }]}>{dayjs((tx as any).date_time || tx.date).format("DD MMM YYYY")}</Text>
                            </View>
                            <Text style={[styles.td, { color: colors.text, flex: 2, fontWeight: '500' }]} numberOfLines={1}>{tx.title || "Transaction"}</Text>
                            <Text style={[styles.td, { color: colors.textSecondary, flex: 1.5 }]} numberOfLines={1}>{tx.category || "General"}</Text>
                            <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: '600', color: tx.type === 'income' ? colorIncome : colors.danger }]}>
                                {tx.type === 'income' ? "+" : "-"}₹{tx.amount.toLocaleString()}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Monthly Comparison */}
                <View style={[styles.card, { flex: 1, backgroundColor: cardBg, borderColor: colors.border, overflow: 'hidden' }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Monthly Comparison</Text>
                        <View style={styles.legendWrap}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: colorIncome }]} />
                                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Income</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: colorSpending }]} />
                                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Spending</Text>
                            </View>
                        </View>
                    </View>
                    <View style={{ marginTop: 10 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart
                                data={barChartData}
                                maxValue={maxBarRounded}
                                stepValue={stepBar}
                                noOfSections={4}
                                barWidth={16}
                                spacing={24}
                                roundedTop
                                roundedBottom
                                xAxisThickness={1}
                                yAxisThickness={0}
                                yAxisTextStyle={{color: colors.textSecondary, fontSize: 10}}
                                yAxisColor={"transparent"}
                                xAxisColor={colors.border}
                                rulesColor={colors.border}
                            />
                        </ScrollView>
                    </View>
                </View>

            </View>

            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    headerRow: {
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: "800",
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    datePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
    },
    statsRow: {
        marginBottom: 24,
    },
    statCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    statIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    statTitle: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 4,
    },
    statValue: {
        fontSize: 22,
        fontWeight: "700",
    },
    statFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statChange: {
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 4,
    },
    flexRow: {
        marginBottom: 24,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    legendWrap: {
        flexDirection: "row",
        gap: 12,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        fontWeight: "500",
    },
    donutContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    donutLegend: {
        flex: 1,
        width: '100%',
    },
    donutLegendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    topCatRow: {
        marginBottom: 16,
    },
    topCatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    catIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    catName: {
        fontSize: 14,
        fontWeight: '600',
    },
    catAmount: {
        fontSize: 14,
        fontWeight: '600',
    },
    catPercent: {
        fontSize: 11,
        textAlign: 'right',
        marginTop: 2,
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        marginTop: 12,
    },
    th: {
        fontSize: 12,
        fontWeight: '600',
    },
    tr: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    td: {
        fontSize: 13,
    },
    txTinyIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
});
