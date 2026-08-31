import React, { useState, useMemo, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    useWindowDimensions,
    Alert,
    Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAppTheme, Radius, Spacing, Shadows, Typography } from "../../../theme";
import apiClient from "../../../api/apiClient";
import { useAuthStore } from "../../../store/auth.store";

// Standard mock transaction list for the transactions tab manager
const INITIAL_TRANSACTIONS = [
    { id: "1", title: "Amazon India", category: "Shopping", amount: -2499, date: "07 May, 2024", time: "02:14 PM", type: "expense", status: "Success", upi: "you@upi" },
    { id: "2", title: "Salary Credited", category: "Income", amount: 50000, date: "06 May, 2024", time: "10:00 AM", type: "income", status: "Success", upi: "employer@upi" },
    { id: "3", title: "Swiggy Delivery", category: "Food", amount: -420, date: "05 May, 2024", time: "08:30 PM", type: "expense", status: "Success", upi: "swiggy@upi" },
    { id: "4", title: "Electric Bill Payment", category: "Utilities", amount: -1250, date: "04 May, 2024", time: "11:15 AM", type: "expense", status: "Success", upi: "statepower@upi" },
    { id: "5", title: "Netflix Subscription", category: "Entertainment", amount: -649, date: "03 May, 2024", time: "09:00 AM", type: "expense", status: "Success", upi: "netflix@upi" },
    { id: "6", title: "Zomato Dineout", category: "Food", amount: -1850, date: "02 May, 2024", time: "10:45 PM", type: "expense", status: "Success", upi: "zomato@upi" },
    { id: "7", title: "Refund from Flipkart", category: "Shopping", amount: 899, date: "01 May, 2024", time: "04:20 PM", type: "income", status: "Success", upi: "flipkart@upi" },
    { id: "8", title: "Local Grocery Shop", category: "Groceries", amount: -350, date: "30 Apr, 2024", time: "12:30 PM", type: "expense", status: "Success", upi: "grocer@upi" },
    { id: "9", title: "P2P Transfer to Amit", category: "Transfer", amount: -500, date: "29 Apr, 2024", time: "06:15 PM", type: "expense", status: "Pending", upi: "amit@upi" },
    { id: "10", title: "Uber Cab Ride", category: "Travel", amount: -280, date: "28 Apr, 2024", time: "08:00 AM", type: "expense", status: "Failed", upi: "uber@upi" },
];

const CATEGORIES = ["All", "Shopping", "Income", "Food", "Utilities", "Groceries", "Transfer", "Travel"];
const STATUSES = ["All", "Success", "Pending", "Failed"];

export default function TransactionsScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const { colors, isDark } = useAppTheme();

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");

    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await apiClient.get("/transactions", {
                    params: { userId: user?.id }
                });
                setTransactions(response.data);
            } catch (err: any) {
                console.warn("Failed to load transactions, falling back to mock:", err.message);
                setTransactions(INITIAL_TRANSACTIONS);
            } finally {
                setLoading(false);
            }
        };
        if (user?.id) {
            fetchTransactions();
        }
    }, [user?.id]);

    // Dynamic filtering
    const filteredTransactions = useMemo(() => {
        return transactions.filter((tx) => {
            const matchesSearch =
                tx.title.toLowerCase().includes(search.toLowerCase()) ||
                tx.upi.toLowerCase().includes(search.toLowerCase()) ||
                tx.category.toLowerCase().includes(search.toLowerCase());

            const matchesCategory =
                selectedCategory === "All" || tx.category === selectedCategory;

            const matchesStatus =
                selectedStatus === "All" || tx.status === selectedStatus;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [transactions, search, selectedCategory, selectedStatus]);

    const handleExport = (type: string) => {
        if (Platform.OS === "web") {
            alert(`Exporting transactions as ${type}...`);
        } else {
            Alert.alert("Exporting", `Exporting transactions as ${type}...`);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            {/* KPI Cards Row */}
            <View style={[
                styles.kpiGrid, 
                isDesktop ? { flexDirection: "row", gap: 16 } : { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }
            ]}>
                <View style={[styles.kpiCard, isDesktop ? { flex: 1 } : { width: "48%", marginBottom: 16, padding: 12 }, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]} numberOfLines={1}>Total Volume</Text>
                    <Text style={[styles.kpiValue, { color: colors.text }]} numberOfLines={1}>₹ 2,45,980</Text>
                    <Text style={[styles.kpiSub, { color: colors.textSecondary }]} numberOfLines={1}>1,248 transactions</Text>
                </View>
                <View style={[styles.kpiCard, isDesktop ? { flex: 1 } : { width: "48%", marginBottom: 16, padding: 12 }, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]} numberOfLines={1}>Completed</Text>
                    <Text style={[styles.kpiValue, { color: colors.success }]} numberOfLines={1}>1,231</Text>
                    <Text style={[styles.kpiSub, { color: colors.textSecondary }]} numberOfLines={1}>₹ 2,44,850 completed</Text>
                </View>
                <View style={[styles.kpiCard, isDesktop ? { flex: 1 } : { width: "48%", marginBottom: 16, padding: 12 }, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]} numberOfLines={1}>Pending</Text>
                    <Text style={[styles.kpiValue, { color: colors.warning }]} numberOfLines={1}>12</Text>
                    <Text style={[styles.kpiSub, { color: colors.textSecondary }]} numberOfLines={1}>₹ 850 in escrow</Text>
                </View>
                <View style={[styles.kpiCard, isDesktop ? { flex: 1 } : { width: "48%", marginBottom: 16, padding: 12 }, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary }]} numberOfLines={1}>Failed</Text>
                    <Text style={[styles.kpiValue, { color: colors.danger }]} numberOfLines={1}>5</Text>
                    <Text style={[styles.kpiSub, { color: colors.textSecondary }]} numberOfLines={1}>₹ 280 failed attempts</Text>
                </View>
            </View>

            {/* Main Content Area */}
            <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                
                {/* Search & Export Row */}
                <View style={[styles.searchExportRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                    <View style={[styles.searchWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search by UPI ID, category or description..."
                            placeholderTextColor={colors.placeholder}
                            value={search}
                            onChangeText={setSearch}
                            style={[styles.searchInput, { color: colors.text }]}
                        />
                    </View>
                    
                    <View style={styles.exportBtnsContainer}>
                        <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => handleExport("PDF")} activeOpacity={0.8}>
                            <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.exportBtnText, { color: colors.text }]}>PDF</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => handleExport("CSV")} activeOpacity={0.8}>
                            <Ionicons name="download-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.exportBtnText, { color: colors.text }]}>CSV</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Categories & Status Filters Row */}
                <View style={styles.filtersBlock}>
                    <Text style={[styles.filterTitle, { color: colors.textSecondary }]}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        <View style={styles.filterPillsRow}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setSelectedCategory(cat)}
                                    style={[
                                        styles.pillBtn,
                                        { backgroundColor: isDark ? colors.border : "#F1F5F9" },
                                        selectedCategory === cat && { backgroundColor: colors.primary }
                                    ]}
                                >
                                    <Text style={[
                                        styles.pillBtnText,
                                        { color: colors.textSecondary },
                                        selectedCategory === cat && { color: "#FFFFFF", fontWeight: "700" }
                                    ]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    <Text style={[styles.filterTitle, { marginTop: 12, color: colors.textSecondary }]}>Status</Text>
                    <View style={styles.filterPillsRow}>
                        {STATUSES.map((st) => (
                            <TouchableOpacity
                                key={st}
                                onPress={() => setSelectedStatus(st)}
                                style={[
                                    styles.pillBtn,
                                    { backgroundColor: isDark ? colors.border : "#F1F5F9" },
                                    selectedStatus === st && { backgroundColor: colors.primary }
                                ]}
                            >
                                <Text style={[
                                    styles.pillBtnText,
                                    { color: colors.textSecondary },
                                    selectedStatus === st && { color: "#FFFFFF", fontWeight: "700" }
                                ]}>
                                    {st}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Transactions Table / List */}
                {isDesktop ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
                        <View style={styles.tableInner}>
                            {/* Header Row */}
                            <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.tableHeaderCell, { width: 140, color: colors.textSecondary }]}>Date & Time</Text>
                                <Text style={[styles.tableHeaderCell, { width: 160, color: colors.textSecondary }]}>UPI ID</Text>
                                <Text style={[styles.tableHeaderCell, { width: 120, color: colors.textSecondary }]}>Description</Text>
                                <Text style={[styles.tableHeaderCell, { width: 110, color: colors.textSecondary }]}>Category</Text>
                                <Text style={[styles.tableHeaderCell, { width: 90, color: colors.textSecondary }]}>Status</Text>
                                <Text style={[styles.tableHeaderCell, { width: 100, textAlign: "right", color: colors.textSecondary }]}>Amount</Text>
                            </View>

                            {/* Data Rows */}
                            {filteredTransactions.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions match your search/filters.</Text>
                                </View>
                            ) : (
                                filteredTransactions.map((tx) => {
                                    const isIncome = tx.type === "income";
                                    return (
                                        <View key={tx.id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                                            {/* Date */}
                                            <View style={{ width: 140 }}>
                                                <Text style={[styles.cellMainText, { color: colors.text }]}>{tx.date}</Text>
                                                <Text style={[styles.cellSubText, { color: colors.textSecondary }]}>{tx.time}</Text>
                                            </View>

                                            {/* UPI ID */}
                                            <Text style={[styles.cellMainText, { width: 160, color: colors.textSecondary }]} numberOfLines={1}>
                                                {tx.upi}
                                            </Text>

                                            {/* Description */}
                                            <Text style={[styles.cellMainText, { width: 120, color: colors.text }]} numberOfLines={1}>
                                                {tx.title}
                                            </Text>

                                            {/* Category Badge */}
                                            <View style={{ width: 110 }}>
                                                <View style={[styles.catBadge, { backgroundColor: isDark ? colors.border : "#F5F3FF" }]}>
                                                    <Text style={[styles.catBadgeText, { color: colors.primary }]}>{tx.category}</Text>
                                                </View>
                                            </View>

                                            {/* Status Pill */}
                                            <View style={{ width: 90 }}>
                                                <View style={[
                                                    styles.statusPill,
                                                    tx.status === "Success" && { backgroundColor: isDark ? "#064e3b" : "#ECFDF5" },
                                                    tx.status === "Pending" && { backgroundColor: isDark ? "#78350f" : "#FFF9E6" },
                                                    tx.status === "Failed" && { backgroundColor: isDark ? "#7f1d1d" : "#FFF5F5" },
                                                ]}>
                                                    <View style={[
                                                        styles.statusDot,
                                                        tx.status === "Success" && { backgroundColor: colors.success },
                                                        tx.status === "Pending" && { backgroundColor: colors.warning },
                                                        tx.status === "Failed" && { backgroundColor: colors.danger },
                                                    ]} />
                                                    <Text style={[
                                                        styles.statusText,
                                                        tx.status === "Success" && { color: colors.success },
                                                        tx.status === "Pending" && { color: colors.warning },
                                                        tx.status === "Failed" && { color: colors.danger },
                                                    ]}>{tx.status}</Text>
                                                </View>
                                            </View>

                                            {/* Amount */}
                                            <Text style={[
                                                styles.amountText,
                                                { width: 100, textAlign: "right" },
                                                { color: isIncome ? colors.success : colors.danger }
                                            ]}>
                                                {isIncome ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString()}
                                            </Text>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </ScrollView>
                ) : (
                    // Mobile List View
                    <View style={styles.mobileListWrapper}>
                        {filteredTransactions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions match your search/filters.</Text>
                            </View>
                        ) : (
                            filteredTransactions.map((tx) => {
                                const isIncome = tx.type === "income";
                                return (
                                    <View key={tx.id} style={[styles.mobileCard, { backgroundColor: isDark ? colors.border : "#F8FAFC", borderColor: colors.border }]}>
                                        <View style={styles.mobileCardTopRow}>
                                            <View style={styles.mobileIconWrapper}>
                                                <View style={[styles.mobileIcon, { backgroundColor: isIncome ? "#ECFDF5" : "#FEF2F2" }]}>
                                                    <Ionicons name={isIncome ? "arrow-down" : "arrow-up"} size={16} color={isIncome ? colors.success : colors.danger} />
                                                </View>
                                                <View style={{ flex: 1, paddingRight: 8 }}>
                                                    <Text style={[styles.mobileCardTitle, { color: colors.text }]} numberOfLines={1}>{tx.title}</Text>
                                                    <Text style={[styles.mobileCardUpi, { color: colors.textSecondary }]} numberOfLines={1}>{tx.upi}</Text>
                                                </View>
                                            </View>
                                            <Text style={[
                                                styles.mobileAmountText,
                                                { color: isIncome ? colors.success : colors.text }
                                            ]}>
                                                {isIncome ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString()}
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.mobileCardBottomRow}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                <Text style={[styles.mobileDateText, { color: colors.textSecondary }]}>{tx.date} • {tx.time}</Text>
                                            </View>
                                            
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                <View style={[styles.catBadge, { backgroundColor: isDark ? colors.background : "#F5F3FF" }]}>
                                                    <Text style={[styles.catBadgeText, { color: colors.primary }]}>{tx.category}</Text>
                                                </View>
                                                <View style={[
                                                    styles.statusPill,
                                                    tx.status === "Success" && { backgroundColor: isDark ? "#064e3b" : "#ECFDF5" },
                                                    tx.status === "Pending" && { backgroundColor: isDark ? "#78350f" : "#FFF9E6" },
                                                    tx.status === "Failed" && { backgroundColor: isDark ? "#7f1d1d" : "#FFF5F5" },
                                                ]}>
                                                    <View style={[
                                                        styles.statusDot,
                                                        tx.status === "Success" && { backgroundColor: colors.success },
                                                        tx.status === "Pending" && { backgroundColor: colors.warning },
                                                        tx.status === "Failed" && { backgroundColor: colors.danger },
                                                    ]} />
                                                    <Text style={[
                                                        styles.statusText,
                                                        tx.status === "Success" && { color: colors.success },
                                                        tx.status === "Pending" && { color: colors.warning },
                                                        tx.status === "Failed" && { color: colors.danger },
                                                    ]}>{tx.status}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}

                {/* Pagination footer */}
                <View style={styles.paginationRow}>
                    <Text style={[styles.paginationLabel, { color: colors.textSecondary }]}>
                        Showing 1 to {filteredTransactions.length} of {filteredTransactions.length} records
                    </Text>
                    <View style={styles.paginationControls}>
                        <TouchableOpacity style={[styles.pageArrow, { backgroundColor: colors.surface, borderColor: colors.border }]} disabled>
                            <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <View style={[styles.pageActivePill, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                            <Text style={[styles.pageActiveText, { color: "#FFFFFF" }]}>1</Text>
                        </View>
                        <TouchableOpacity style={[styles.pageArrow, { backgroundColor: colors.surface, borderColor: colors.border }]} disabled>
                            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
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
    kpiGrid: {
        marginBottom: 24,
    },
    kpiCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 18,
        ...Shadows.sm,
    },
    kpiLabel: {
        fontSize: 11,
        fontWeight: "600",
    },
    kpiValue: {
        fontSize: 22,
        fontWeight: "800",
        marginTop: 6,
    },
    kpiSub: {
        fontSize: 10,
        marginTop: 2,
    },
    mainCard: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        ...Shadows.md,
    },
    searchExportRow: {
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        marginBottom: 20,
    },
    searchWrapper: {
        flex: 1,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        borderWidth: 0,
        padding: 0,
        ...Platform.select({
            web: {
                outlineStyle: "none",
            } as any,
        }),
    },
    exportBtnsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    exportBtn: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        height: 38,
        gap: 6,
    },
    exportBtnText: {
        fontSize: 12,
        fontWeight: "600",
    },
    filtersBlock: {
        marginBottom: 16,
    },
    filterTitle: {
        fontSize: 11,
        fontWeight: "700",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    horizontalScroll: {
        width: "100%",
    },
    filterPillsRow: {
        flexDirection: "row",
        gap: 8,
        paddingBottom: 2,
    },
    pillBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
    },
    pillBtnText: {
        fontSize: 12,
        fontWeight: "600",
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    tableScroll: {
        width: "100%",
    },
    tableInner: {
        minWidth: 720,
    },
    tableHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1.5,
        paddingBottom: 10,
        marginBottom: 6,
    },
    tableHeaderCell: {
        fontSize: 11,
        fontWeight: "700",
    },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        paddingVertical: 12,
    },
    cellMainText: {
        fontSize: 13,
        fontWeight: "600",
    },
    cellSubText: {
        fontSize: 10,
        marginTop: 2,
    },
    catBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    catBadgeText: {
        fontSize: 10,
        fontWeight: "700",
    },
    statusPill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: "flex-start",
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "700",
    },
    amountText: {
        fontSize: 13,
        fontWeight: "700",
    },
    emptyState: {
        paddingVertical: 32,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 13,
    },
    paginationRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 18,
    },
    paginationLabel: {
        fontSize: 12,
    },
    paginationControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    pageArrow: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    pageActivePill: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    pageActiveText: {
        fontSize: 12,
        fontWeight: "700",
    },
    rowLayout: {
        flexDirection: "row",
    },
    columnLayout: {
        flexDirection: "column",
    },
    mobileListWrapper: {
        width: "100%",
        gap: 12,
    },
    mobileCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        ...Shadows.sm,
    },
    mobileCardTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    mobileIconWrapper: {
        flexDirection: "row",
        flex: 1,
        alignItems: "center",
        gap: 12,
    },
    mobileIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    mobileCardTitle: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 2,
    },
    mobileCardUpi: {
        fontSize: 11,
    },
    mobileAmountText: {
        fontSize: 15,
        fontWeight: "800",
        paddingLeft: 8,
    },
    mobileCardBottomRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
        paddingTop: 12,
    },
    mobileDateText: {
        fontSize: 11,
        fontWeight: "500",
    },
});
