import React, { useState, useMemo, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    useWindowDimensions,
    Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAppTheme, Spacing, Shadows, Typography } from "../../../theme";
import apiClient from "../../../api/apiClient";
import { useAuthStore } from "../../../store/auth.store";

export default function CustomersScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const { colors, isDark } = useAppTheme();

    const [search, setSearch] = useState("");
    const { user } = useAuthStore();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock UPI ID for the user
    const userUpiId = user?.email ? `${user.email.split('@')[0]}@upi` : "business@upi";

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await apiClient.get("/transactions", {
                    params: { userId: user?.id }
                });
                setTransactions(response.data);
            } catch (err: any) {
                console.warn("Failed to load transactions, falling back to empty.");
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };
        if (user?.id) {
            fetchTransactions();
        }
    }, [user?.id]);

    // Filter for only 'income' transactions (credited)
    const creditedTransactions = useMemo(() => {
        return transactions.filter((tx) => {
            const isCredited = tx.type === "income";
            const matchesSearch =
                tx.title.toLowerCase().includes(search.toLowerCase()) ||
                (tx.upi && tx.upi.toLowerCase().includes(search.toLowerCase()));

            return isCredited && matchesSearch;
        });
    }, [transactions, search]);

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            
            {/* UPI ID Header Card */}
            <View style={[styles.upiCard, { backgroundColor: colors.primary }]}>
                <View style={styles.upiIconContainer}>
                    <Ionicons name="qr-code-outline" size={32} color="#fff" />
                </View>
                <View style={styles.upiInfoContainer}>
                    <Text style={styles.upiTitle}>Your Business UPI ID</Text>
                    <Text style={styles.upiValue}>{userUpiId}</Text>
                    <Text style={styles.upiSubtitle}>Share this UPI ID with your customers to receive payments directly to your business account.</Text>
                </View>
            </View>

            {/* Main Content Area */}
            <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Credited Customer Payments</Text>
                
                {/* Search Row */}
                <View style={styles.searchExportRow}>
                    <View style={[styles.searchWrapper, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search by customer UPI ID or description..."
                            placeholderTextColor={colors.placeholder}
                            value={search}
                            onChangeText={setSearch}
                            style={[styles.searchInput, { color: colors.text }]}
                        />
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
                                <Text style={[styles.tableHeaderCell, { width: 180, color: colors.textSecondary }]}>Customer UPI ID</Text>
                                <Text style={[styles.tableHeaderCell, { width: 180, color: colors.textSecondary }]}>Description</Text>
                                <Text style={[styles.tableHeaderCell, { width: 100, textAlign: "right", color: colors.textSecondary }]}>Amount</Text>
                            </View>

                            {/* Data Rows */}
                            {creditedTransactions.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No credited transactions found.</Text>
                                </View>
                            ) : (
                                creditedTransactions.map((tx) => (
                                    <View key={tx.id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                                        <View style={{ width: 140 }}>
                                            <Text style={[styles.cellMainText, { color: colors.text }]}>{tx.date}</Text>
                                            <Text style={[styles.cellSubText, { color: colors.textSecondary }]}>{tx.time}</Text>
                                        </View>
                                        <Text style={[styles.cellMainText, { width: 180, color: colors.textSecondary }]} numberOfLines={1}>
                                            {tx.upi || "Unknown Customer"}
                                        </Text>
                                        <Text style={[styles.cellMainText, { width: 180, color: colors.text }]} numberOfLines={1}>
                                            {tx.title}
                                        </Text>
                                        <Text style={[
                                            styles.amountText,
                                            { width: 100, textAlign: "right" },
                                            { color: colors.success }
                                        ]}>
                                            +₹{Math.abs(tx.amount).toLocaleString()}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>
                ) : (
                    // Mobile List View
                    <View style={styles.mobileListWrapper}>
                        {creditedTransactions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No credited transactions found.</Text>
                            </View>
                        ) : (
                            creditedTransactions.map((tx) => (
                                <View key={tx.id} style={[styles.mobileCard, { backgroundColor: isDark ? colors.border : "#F8FAFC", borderColor: colors.border }]}>
                                    <View style={styles.mobileCardTopRow}>
                                        <View style={styles.mobileIconWrapper}>
                                            <View style={[styles.mobileIcon, { backgroundColor: "#ECFDF5" }]}>
                                                <Ionicons name="arrow-down" size={16} color={colors.success} />
                                            </View>
                                            <View style={{ flex: 1, paddingRight: 8 }}>
                                                <Text style={[styles.mobileCardTitle, { color: colors.text }]} numberOfLines={1}>{tx.title}</Text>
                                                <Text style={[styles.mobileCardUpi, { color: colors.textSecondary }]} numberOfLines={1}>{tx.upi || "Unknown"}</Text>
                                            </View>
                                        </View>
                                        <Text style={[
                                            styles.mobileAmountText,
                                            { color: colors.success }
                                        ]}>
                                            +₹{Math.abs(tx.amount).toLocaleString()}
                                        </Text>
                                    </View>
                                    
                                    <View style={styles.mobileCardBottomRow}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <Text style={[styles.mobileDateText, { color: colors.textSecondary }]}>{tx.date} • {tx.time}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

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
    upiCard: {
        flexDirection: "row",
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        ...Shadows.md,
        alignItems: "center",
    },
    upiIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 20,
    },
    upiInfoContainer: {
        flex: 1,
    },
    upiTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "rgba(255, 255, 255, 0.8)",
        marginBottom: 4,
    },
    upiValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#fff",
        marginBottom: 6,
    },
    upiSubtitle: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.9)",
        lineHeight: 18,
    },
    mainCard: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        ...Shadows.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 20,
    },
    searchExportRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    searchWrapper: {
        flex: 1,
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
    divider: {
        height: 1,
        marginVertical: 16,
    },
    tableScroll: {
        width: "100%",
    },
    tableInner: {
        minWidth: 600,
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
