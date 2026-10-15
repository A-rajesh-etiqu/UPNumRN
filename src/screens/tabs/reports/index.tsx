import React, { useState, useMemo, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    useWindowDimensions,
    Modal,
} from "react-native";
import { useAuthStore } from "../../../store/auth.store";
import { useTransactionStore } from "../../../store/transaction.store";
import { useAppTheme } from "../../../theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LineChart, PieChart, BarChart } from "react-native-gifted-charts";
import dayjs from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "../../../navigation/RootNavigation";
import DashboardHeader from "../../../components/layout/DashboardHeader";

// Universal date parser that handles ISO, YYYY-MM-DD, and localized strings ("2 Oct, 2026", "13/08/2026", "31 May, 2024")
const parseTransactionDate = (tx: any): dayjs.Dayjs | null => {
    if (!tx) return null;

    const rawDateTime = tx.date_time || tx.dateTime || tx.created_at;
    if (rawDateTime) {
        const isoNormalized = typeof rawDateTime === "string" ? rawDateTime.replace(" ", "T") : rawDateTime;
        const d = dayjs(isoNormalized);
        if (d.isValid()) return d;
    }

    const rawDate = tx.date;
    if (!rawDate) return null;

    const direct = dayjs(rawDate);
    if (direct.isValid()) return direct;

    if (typeof rawDate === "string") {
        const cleaned = rawDate.replace(",", "").trim();
        const parts = cleaned.split(/[\s/-]+/);
        if (parts.length === 3) {
            const months: Record<string, string> = {
                jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
                jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
                january: "01", february: "02", march: "03", april: "04", june: "06",
                july: "07", august: "08", september: "09", october: "10", november: "11", december: "12"
            };
            const p0Lower = parts[0].toLowerCase();
            const p1Lower = parts[1].toLowerCase();

            if (months[p1Lower]) {
                const day = parts[0].padStart(2, "0");
                const month = months[p1Lower];
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                const d = dayjs(`${year}-${month}-${day}`);
                if (d.isValid()) return d;
            }
            if (months[p0Lower]) {
                const day = parts[1].padStart(2, "0");
                const month = months[p0Lower];
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                const d = dayjs(`${year}-${month}-${day}`);
                if (d.isValid()) return d;
            }
            if (/^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1]) && /^\d{4}$/.test(parts[2])) {
                const day = parts[0].padStart(2, "0");
                const month = parts[1].padStart(2, "0");
                const year = parts[2];
                const d = dayjs(`${year}-${month}-${day}`);
                if (d.isValid()) return d;
            }
        }
    }

    return null;
};

// Safe local date parser for datepicker without UTC offset shifts
const toLocalDateObj = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
};

export default function ReportsScreen() {
    const { user } = useAuthStore();
    const { transactions, loading, loadTransactions } = useTransactionStore();
    const { colors, isDark } = useAppTheme();
    const { width } = useWindowDimensions();

    const isDesktop = width >= 1024;

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [activeFilter, setActiveFilter] = useState("All Time");
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [tempStartDate, setTempStartDate] = useState<Date>(new Date());
    const [tempEndDate, setTempEndDate] = useState<Date>(new Date());

    const openStartPicker = () => {
        setTempStartDate(toLocalDateObj(startDate));
        setShowStartPicker(true);
    };

    const openEndPicker = () => {
        setTempEndDate(toLocalDateObj(endDate));
        setShowEndPicker(true);
    };

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
        const today = dayjs();

        if (filter === "Last 7 Days") {
            setStartDate(today.subtract(7, 'day').format("YYYY-MM-DD"));
            setEndDate(today.format("YYYY-MM-DD"));
        } else if (filter === "This Month") {
            setStartDate(today.startOf('month').format("YYYY-MM-DD"));
            setEndDate(today.endOf('month').format("YYYY-MM-DD"));
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
            const txDate = parseTransactionDate(tx);
            if (!txDate) return false;
            if (startDate && txDate.isBefore(dayjs(startDate).startOf('day'))) return false;
            if (endDate && txDate.isAfter(dayjs(endDate).endOf('day'))) return false;
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

        let minDate: Date | null = startDate ? toLocalDateObj(startDate) : null;
        let maxDate: Date | null = endDate ? toLocalDateObj(endDate) : null;

        filteredTransactions.forEach(tx => {
            const parsed = parseTransactionDate(tx);
            if (!parsed) return;
            const dateStr = parsed.format("YYYY-MM-DD");
            if (!grouped[dateStr]) grouped[dateStr] = { inc: 0, exp: 0 };
            if (tx.type === "income") grouped[dateStr].inc += Math.abs(tx.amount);
            else grouped[dateStr].exp += Math.abs(tx.amount);

            const txDate = toLocalDateObj(dateStr);
            if (!minDate || txDate < minDate) minDate = txDate;
            if (!maxDate || txDate > maxDate) maxDate = txDate;
        });

        const sortedDates: string[] = [];
        const mMinDate = minDate as Date | null;
        const mMaxDate = maxDate as Date | null;
        if (mMinDate && mMaxDate && mMinDate <= mMaxDate) {
            let current = new Date(mMinDate);
            let loopGuard = 0;
            while (current.getTime() <= mMaxDate.getTime() && loopGuard < 365) {
                sortedDates.push(dayjs(current).format("YYYY-MM-DD"));
                current.setDate(current.getDate() + 1);
                loopGuard++;
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
    }, [filteredTransactions, startDate, endDate, colors]);

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

        if (sorted.length === 0) {
            return {
                pieChartData: [{ value: 1, color: isDark ? "#334155" : "#E2E8F0", text: "No Spending", percent: 100 }],
                topCategories: []
            };
        }

        const pieData = sorted.map((item, index) => ({
            value: item.value,
            color: categoryColors[index % categoryColors.length],
            text: item.name,
            percent: totalSpending > 0 ? (item.value / totalSpending) * 100 : 0
        }));

        return { pieChartData: pieData, topCategories: pieData };
    }, [filteredTransactions, totalSpending, isDark]);

    // Monthly Comparison Data (Bar Chart)
    const { barChartData, maxBarValue } = useMemo(() => {
        const groupedByMonth: Record<string, { inc: number; exp: number; sortKey: number }> = {};
        
        filteredTransactions.forEach(tx => {
            const parsed = parseTransactionDate(tx);
            if (!parsed) return;
            const monthStr = parsed.format("MMM");
            const sortKey = parsed.year() * 12 + parsed.month();
            if (!groupedByMonth[monthStr]) groupedByMonth[monthStr] = { inc: 0, exp: 0, sortKey };
            if (tx.type === "income") groupedByMonth[monthStr].inc += Math.abs(tx.amount);
            else groupedByMonth[monthStr].exp += Math.abs(tx.amount);
        });

        const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => groupedByMonth[a].sortKey - groupedByMonth[b].sortKey);

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

        if (bData.length === 0) {
            bData.push({ value: 0, label: "No Data", frontColor: colorIncome, spacing: 4 });
            bData.push({ value: 0, frontColor: colorSpending });
        }

        return { barChartData: bData, maxBarValue: maxVal };
    }, [filteredTransactions, colors]);

    const stepBar = Math.max(Math.ceil(maxBarValue / 4 / 1000) * 1000, 100);
    const maxBarRounded = stepBar * 4;

    // Top Recent Transactions
    const recentTx = useMemo(() => {
        return [...filteredTransactions].sort((a, b) => {
            const da = parseTransactionDate(a);
            const db = parseTransactionDate(b);
            const va = da ? da.valueOf() : 0;
            const vb = db ? db.valueOf() : 0;
            return vb - va;
        }).slice(0, 5);
    }, [filteredTransactions]);

    // --- Render Helpers ---

    const renderStatCard = (title: string, value: string, icon: any, color: string, change: string, isUp: boolean) => (
        <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: colors.border, width: isDesktop ? '23%' : '48%', marginBottom: isDesktop ? 0 : 16, padding: isDesktop ? 20 : 12 }]}>
            <View style={styles.statHeader}>
                <View style={[styles.statIconWrap, { backgroundColor: color + "15" }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.statTitle, { color: colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
                    <Text style={[styles.statValue, { color: colors.text, fontSize: isDesktop ? 22 : 18 }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
                </View>
            </View>
            <View style={styles.statFooter}>
                <Ionicons name={isUp ? "caret-up" : "caret-down"} size={12} color={isUp ? colorIncome : colors.danger} />
                <Text style={[styles.statChange, { color: isUp ? colorIncome : colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                    {change} <Text style={{ color: colors.textSecondary, fontSize: isDesktop ? 12 : 10 }}>vs. month</Text>
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
                        setVal((e.target as any).value);
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
        <View style={{ flex: 1, backgroundColor: bgColor }}>
            <DashboardHeader
                title="Reports"
                subtitle="Get detailed insights about your spendings."
            />
            <ScrollView style={styles.container}>

                <View style={[styles.headerRow, { flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'stretch', gap: 12, paddingTop: 16 }]}>

                    <View style={[styles.headerActions, { flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'stretch', gap: 12, width: isDesktop ? 'auto' : '100%' }]}>
                        {Platform.OS === 'web' ? (
                            <View style={[styles.datePickerRow, { flexWrap: 'wrap', gap: 8 }]}>
                                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                {renderWebDatePicker("", startDate, (v) => { setStartDate(v); setActiveFilter("Custom"); })}
                                <Text style={{ marginHorizontal: 4, color: colors.textSecondary, alignSelf: 'center' }}>-</Text>
                                {renderWebDatePicker("", endDate, (v) => { setEndDate(v); setActiveFilter("Custom"); })}
                                {(startDate || endDate) && (
                                    <TouchableOpacity 
                                        onPress={() => { setStartDate(""); setEndDate(""); setActiveFilter("All Time"); }}
                                        style={{ padding: 6, justifyContent: 'center' }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View style={[styles.datePickerRow, { flexWrap: 'wrap', gap: 8, width: isDesktop ? 'auto' : '100%' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: isDesktop ? undefined : 1 }}>
                                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                    <TouchableOpacity 
                                        style={[styles.dateBtn, { borderColor: colors.border, backgroundColor: isDark ? colors.inputBackground : '#FFF', flex: isDesktop ? undefined : 1 }]}
                                        onPress={openStartPicker}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{ color: startDate ? colors.text : colors.textSecondary, fontSize: 13, fontWeight: startDate ? "600" : "400" }}>
                                            {startDate ? dayjs(startDate).format("DD MMM YYYY") : 'Start Date'}
                                        </Text>
                                    </TouchableOpacity>
                                    <Text style={{ marginHorizontal: 6, color: colors.textSecondary }}>-</Text>
                                    <TouchableOpacity 
                                        style={[styles.dateBtn, { borderColor: colors.border, backgroundColor: isDark ? colors.inputBackground : '#FFF', flex: isDesktop ? undefined : 1 }]}
                                        onPress={openEndPicker}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{ color: endDate ? colors.text : colors.textSecondary, fontSize: 13, fontWeight: endDate ? "600" : "400" }}>
                                            {endDate ? dayjs(endDate).format("DD MMM YYYY") : 'End Date'}
                                        </Text>
                                    </TouchableOpacity>

                                    {(startDate || endDate) && (
                                        <TouchableOpacity 
                                            onPress={() => { setStartDate(""); setEndDate(""); setActiveFilter("All Time"); }}
                                            style={{ padding: 6, marginLeft: 4, justifyContent: 'center' }}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {Platform.OS === 'android' && showStartPicker && (
                                    <DateTimePicker
                                        value={toLocalDateObj(startDate)}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowStartPicker(false);
                                            if (event.type === "set" && selectedDate) {
                                                setStartDate(dayjs(selectedDate).format("YYYY-MM-DD"));
                                                setActiveFilter("Custom");
                                            }
                                        }}
                                    />
                                )}
                                {Platform.OS === 'android' && showEndPicker && (
                                    <DateTimePicker
                                        value={toLocalDateObj(endDate)}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowEndPicker(false);
                                            if (event.type === "set" && selectedDate) {
                                                setEndDate(dayjs(selectedDate).format("YYYY-MM-DD"));
                                                setActiveFilter("Custom");
                                            }
                                        }}
                                    />
                                )}

                                {Platform.OS === 'ios' && (
                                    <>
                                        <Modal
                                            visible={showStartPicker}
                                            transparent={true}
                                            animationType="slide"
                                            onRequestClose={() => setShowStartPicker(false)}
                                        >
                                            <View style={styles.modalOverlay}>
                                                <View style={[styles.modalContent, { backgroundColor: isDark ? colors.surface : "#FFF" }]}>
                                                    <View style={styles.modalHeader}>
                                                        <TouchableOpacity onPress={() => setShowStartPicker(false)} style={{ padding: 6 }}>
                                                            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
                                                        </TouchableOpacity>
                                                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Start Date</Text>
                                                        <TouchableOpacity onPress={() => {
                                                            setStartDate(dayjs(tempStartDate).format("YYYY-MM-DD"));
                                                            setActiveFilter("Custom");
                                                            setShowStartPicker(false);
                                                        }} style={{ padding: 6 }}>
                                                            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>Done</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    <DateTimePicker
                                                        value={tempStartDate}
                                                        mode="date"
                                                        display="spinner"
                                                        onChange={(_, date) => {
                                                            if (date) setTempStartDate(date);
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                        </Modal>

                                        <Modal
                                            visible={showEndPicker}
                                            transparent={true}
                                            animationType="slide"
                                            onRequestClose={() => setShowEndPicker(false)}
                                        >
                                            <View style={styles.modalOverlay}>
                                                <View style={[styles.modalContent, { backgroundColor: isDark ? colors.surface : "#FFF" }]}>
                                                    <View style={styles.modalHeader}>
                                                        <TouchableOpacity onPress={() => setShowEndPicker(false)} style={{ padding: 6 }}>
                                                            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
                                                        </TouchableOpacity>
                                                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select End Date</Text>
                                                        <TouchableOpacity onPress={() => {
                                                            setEndDate(dayjs(tempEndDate).format("YYYY-MM-DD"));
                                                            setActiveFilter("Custom");
                                                            setShowEndPicker(false);
                                                        }} style={{ padding: 6 }}>
                                                            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>Done</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    <DateTimePicker
                                                        value={tempEndDate}
                                                        mode="date"
                                                        display="spinner"
                                                        onChange={(_, date) => {
                                                            if (date) setTempEndDate(date);
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                        </Modal>
                                    </>
                                )}
                            </View>
                        )}

                        {/* Preset Filters Row */}
                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            {["All Time", "This Month", "Last 7 Days"].map(preset => (
                                <TouchableOpacity
                                    key={preset}
                                    onPress={() => setPresetFilter(preset)}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 16,
                                        backgroundColor: activeFilter === preset ? colors.primary : (isDark ? colors.surface : "#F1F5F9"),
                                        borderWidth: 1,
                                        borderColor: activeFilter === preset ? colors.primary : colors.border
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '600',
                                        color: activeFilter === preset ? "#FFF" : colors.textSecondary
                                    }}>
                                        {preset}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
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
                        <View style={[styles.cardHeader, { flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'flex-start', gap: 8 }]}>
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
                                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                            <Text style={{ fontSize: isDesktop ? 16 : 20, color: colors.text, fontWeight: '700' }}>
                                                ₹{(totalSpending / 1000).toFixed(1)}k
                                            </Text>
                                            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Total Spending</Text>
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
                        {recentTx.length === 0 ? (
                            <View style={{ paddingVertical: 24, alignItems: "center" }}>
                                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No transactions found for selected date range</Text>
                            </View>
                        ) : (
                            recentTx.map((tx, index) => {
                                const parsed = parseTransactionDate(tx);
                                const displayDate = parsed ? parsed.format("DD MMM YYYY") : (tx.date || "");
                                return (
                                    <View key={tx.id || index.toString()} style={[styles.tr, { borderBottomColor: colors.border, borderBottomWidth: index === recentTx.length - 1 ? 0 : 1 }]}>
                                        <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', paddingRight: 4 }}>
                                            <View style={[styles.txTinyIcon, { backgroundColor: tx.type === 'income' ? colorIncome + "15" : colors.danger + "15" }]}>
                                                <Ionicons name={tx.type === 'income' ? "arrow-down" : "arrow-up"} size={12} color={tx.type === 'income' ? colorIncome : colors.danger} />
                                            </View>
                                            <Text style={[styles.td, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>{displayDate}</Text>
                                        </View>
                                        <Text style={[styles.td, { color: colors.text, flex: 2, fontWeight: '500', paddingRight: 4 }]} numberOfLines={1}>{tx.title || tx.category || "Transaction"}</Text>
                                        <Text style={[styles.td, { color: colors.textSecondary, flex: 1.5, paddingRight: 4 }]} numberOfLines={1}>{tx.category || "General"}</Text>
                                        <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: '600', color: tx.type === 'income' ? colorIncome : colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                                            {tx.type === 'income' ? "+" : "-"}₹{Math.abs(tx.amount || 0).toLocaleString()}
                                        </Text>
                                    </View>
                                );
                            })
                        )}
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
                                    yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
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
        </View>
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
    dateBtn: {
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderWidth: 1,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#CBD5E1',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
});
