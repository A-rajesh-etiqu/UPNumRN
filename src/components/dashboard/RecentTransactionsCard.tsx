import React from "react";
import {
    StyleSheet,
    Text,
    View,
    FlatList,
} from "react-native";
import { useAppTheme } from "../../theme";
import { useDashboardStore } from "../../store/dashboard.store";

const EMPTY_TRANSACTIONS: any[] = [];

const RecentTransactionsCard = () => {
    const { colors, isDark } = useAppTheme();
    const rawTransactions = useDashboardStore(
        (state) => state.data?.recentTransactions
    );
    const transactions = rawTransactions ?? EMPTY_TRANSACTIONS;

    const renderTransaction = ({ item }: any) => {
        const isIncome = item.type === "income";

        return (
            <View style={[styles.transactionRow, { borderBottomColor: colors.border }]}>
                <View style={styles.transactionInfo}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {item.title}
                    </Text>

                    <Text style={[styles.category, { color: colors.textSecondary }]}>
                        {item.category}
                    </Text>

                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                        {item.date}
                    </Text>
                </View>

                <Text
                    style={[
                        styles.amount,
                        {
                            color: isIncome
                                ? colors.success
                                : colors.danger
                        }
                    ]}
                >
                    {isIncome ? "+" : "-"}₹
                    {Math.abs(item.amount).toLocaleString()}
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.header, { color: colors.text }]}>
                Recent Transactions
            </Text>

            {transactions.length === 0 ? (
                <Text style={[styles.empty, { color: colors.textSecondary }]}>
                    No transactions available
                </Text>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTransaction}
                    scrollEnabled={false}
                />
            )}
        </View>
    );
};

export default RecentTransactionsCard;

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
    },
    header: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 14,
    },
    transactionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    transactionInfo: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: "600",
    },
    category: {
        fontSize: 13,
        marginTop: 3,
    },
    date: {
        fontSize: 12,
        marginTop: 3,
    },
    amount: {
        fontSize: 15,
        fontWeight: "700",
    },
    empty: {
        textAlign: "center",
        paddingVertical: 20,
    },
});