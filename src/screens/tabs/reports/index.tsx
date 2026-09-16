import React, { useState, useMemo, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform
} from "react-native";
import { useAuthStore } from "../../../store/auth.store";
import { useTransactionStore } from "../../../store/transaction.store";
import { useAppTheme } from "../../../theme";
import Ionicons from "react-native-vector-icons/Ionicons";
import DatePickerField from "../../../components/common/DatePickerField";

export default function ReportsScreen() {
    const { user } = useAuthStore();
    const { transactions, loading, loadTransactions } = useTransactionStore();
    const { colors, isDark } = useAppTheme();

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [activeFilter, setActiveFilter] = useState("This Month");

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

    // On mount set default filter
    useEffect(() => {
        setPresetFilter("This Month");
    }, []);

    // Helper for web native date picker
    const renderWebDatePicker = (label: string, val: string, setVal: (v: string) => void) => {
        return (
            <View style={{ flex: 1, marginBottom: 16 }}>
                <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
                <div style={{
                    width: '100%',
                    height: 56,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    padding: '0 16px',
                    backgroundColor: isDark ? colors.inputBackground : '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <input 
                        type="date"
                        value={val}
                        onChange={(e) => {
                            setVal(e.target.value);
                            setActiveFilter("Custom");
                        }}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: colors.text,
                            fontFamily: 'inherit',
                            fontSize: 16
                        }}
                    />
                </div>
            </View>
        );
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            if (!startDate && !endDate) return true;
            
            // Assume tx.date is e.g., "30 May, 2024" or standard format
            // In our system tx.date might be parsed from date_time or already formatted.
            // Let's try to parse tx.date_time if it exists, otherwise parse tx.date
            const txDate = new Date((tx as any).date_time || tx.date);
            
            if (startDate) {
                const sDate = new Date(startDate);
                if (txDate < sDate) return false;
            }
            if (endDate) {
                const eDate = new Date(endDate);
                // end of day
                eDate.setHours(23, 59, 59, 999);
                if (txDate > eDate) return false;
            }
            return true;
        });
    }, [transactions, startDate, endDate]);

    const { totalIncome, totalExpense } = useMemo(() => {
        let inc = 0;
        let exp = 0;
        filteredTransactions.forEach(tx => {
            if (tx.type === "income") {
                inc += tx.amount;
            } else if (tx.type === "expense") {
                exp += tx.amount;
            } else {
                // Fallback logic
                inc += tx.amount;
            }
        });
        return { totalIncome: inc, totalExpense: exp };
    }, [filteredTransactions]);

    const netBalance = totalIncome - totalExpense;
    
    // Progress Bar Calculation
    const totalVolume = totalIncome + totalExpense;
    const incomePercent = totalVolume === 0 ? 0 : (totalIncome / totalVolume) * 100;
    const expensePercent = totalVolume === 0 ? 0 : (totalExpense / totalVolume) * 100;

    return (
        <ScrollView style={[styles.container, { backgroundColor: isDark ? colors.background : "#FCFDFE" }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Transaction Reports</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                    Analyze your income and expenses over time.
                </Text>
            </View>

            {/* Filters */}
            <View style={styles.filtersSection}>
                <View style={styles.presetFilters}>
                    {["Last 7 Days", "This Month", "All Time", "Custom"].map(f => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => f !== "Custom" ? setPresetFilter(f) : setActiveFilter("Custom")}
                            style={[
                                styles.filterPill,
                                { backgroundColor: activeFilter === f ? colors.primary : colors.surface, borderColor: activeFilter === f ? colors.primary : colors.border }
                            ]}
                        >
                            <Text style={{ color: activeFilter === f ? "#FFF" : colors.textSecondary, fontWeight: "600", fontSize: 13 }}>
                                {f}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {activeFilter === "Custom" && (
                    <View style={styles.customDateRow}>
                        {Platform.OS === 'web' ? (
                            <>
                                {renderWebDatePicker("Start Date", startDate, setStartDate)}
                                <View style={{ width: 16 }} />
                                {renderWebDatePicker("End Date", endDate, setEndDate)}
                            </>
                        ) : (
                            <>
                                <View style={{ flex: 1 }}>
                                    <DatePickerField 
                                        label="Start Date" 
                                        value={startDate} 
                                        onChange={(v) => { setStartDate(v); setActiveFilter("Custom"); }} 
                                    />
                                </View>
                                <View style={{ width: 16 }} />
                                <View style={{ flex: 1 }}>
                                    <DatePickerField 
                                        label="End Date" 
                                        value={endDate} 
                                        onChange={(v) => { setEndDate(v); setActiveFilter("Custom"); }} 
                                    />
                                </View>
                            </>
                        )}
                    </View>
                )}
            </View>

            {/* Metrics */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ margin: 40 }} />
            ) : (
                <View style={styles.content}>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.metricsRow}>
                            <View style={styles.metricBox}>
                                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Income</Text>
                                <Text style={[styles.metricValue, { color: colors.success }]}>₹{totalIncome.toLocaleString()}</Text>
                            </View>
                            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.metricBox}>
                                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
                                <Text style={[styles.metricValue, { color: colors.danger }]}>₹{totalExpense.toLocaleString()}</Text>
                            </View>
                            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.metricBox}>
                                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Net Balance</Text>
                                <Text style={[styles.metricValue, { color: colors.text }]}>₹{netBalance.toLocaleString()}</Text>
                            </View>
                        </View>

                        {/* Visual Chart (Progress Bar) */}
                        <View style={styles.chartSection}>
                            <View style={styles.chartLabels}>
                                <Text style={{ color: colors.success, fontWeight: "600" }}>Income ({incomePercent.toFixed(1)}%)</Text>
                                <Text style={{ color: colors.danger, fontWeight: "600" }}>Expense ({expensePercent.toFixed(1)}%)</Text>
                            </View>
                            <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                                <View style={[styles.progressFill, { backgroundColor: colors.success, width: `${incomePercent}%` }]} />
                                <View style={[styles.progressFill, { backgroundColor: colors.danger, width: `${expensePercent}%` }]} />
                            </View>
                        </View>
                    </View>

                    {/* Transactions List */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Transactions ({filteredTransactions.length})</Text>
                    
                    <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {filteredTransactions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="receipt-outline" size={48} color={colors.border} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions found for this date range.</Text>
                            </View>
                        ) : (
                            filteredTransactions.map(tx => (
                                <View key={tx.id} style={[styles.txRow, { borderBottomColor: colors.border }]}>
                                    <View style={styles.txLeft}>
                                        <View style={[styles.txIcon, { backgroundColor: tx.type === "income" ? colors.success + "15" : colors.danger + "15" }]}>
                                            <Ionicons 
                                                name={tx.type === "income" ? "arrow-down-outline" : "arrow-up-outline"} 
                                                size={18} 
                                                color={tx.type === "income" ? colors.success : colors.danger} 
                                            />
                                        </View>
                                        <View>
                                            <Text style={[styles.txTitle, { color: colors.text }]}>{tx.title || "Transaction"}</Text>
                                            <Text style={[styles.txDate, { color: colors.textSecondary }]}>{tx.date}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.txRight}>
                                        <Text style={[
                                            styles.txAmount, 
                                            { color: tx.type === "income" ? colors.success : colors.text }
                                        ]}>
                                            {tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                                        </Text>
                                        <Text style={[styles.txCategory, { color: colors.textSecondary }]}>{tx.category}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
    },
    filtersSection: {
        marginBottom: 24,
    },
    presetFilters: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 16,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    customDateRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    content: {
        paddingBottom: 40,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 24,
        marginBottom: 24,
    },
    metricsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    metricBox: {
        flex: 1,
        alignItems: "center",
    },
    metricDivider: {
        width: 1,
        height: 40,
        marginHorizontal: 16,
    },
    metricLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: "700",
    },
    chartSection: {
        marginTop: 32,
    },
    chartLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    progressBarContainer: {
        height: 12,
        borderRadius: 6,
        flexDirection: "row",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 16,
    },
    listCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
    },
    emptyState: {
        padding: 48,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        marginTop: 16,
        fontSize: 15,
    },
    txRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
    },
    txLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    txTitle: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 4,
    },
    txDate: {
        fontSize: 13,
    },
    txRight: {
        alignItems: "flex-end",
    },
    txAmount: {
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 4,
    },
    txCategory: {
        fontSize: 13,
    },
});
