import React, { useState } from "react";
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
import Svg, { Path } from "react-native-svg";
import { useAppTheme } from "../../../theme";

// Types
type TabType = "All" | "Successful" | "Failed" | "Pending";

// SVG Components
const UpiLogo = () => (
    <Svg width="40" height="16" viewBox="0 0 64 24">
        {/* Simple UPI text representation for logo */}
        <Path d="M4 4v10c0 3.31 2.69 6 6 6s6-2.69 6-6V4h-4v10c0 1.1-.9 2-2 2s-2-.9-2-2V4H4z" fill="#7A7A7A" />
        <Path d="M22 4v16h4v-5h4c3.31 0 6-2.69 6-6s-2.69-6-6-6h-8zm4 4h4c1.1 0 2 .9 2 2s-.9 2-2 2h-4V8z" fill="#7A7A7A" />
        <Path d="M42 4h4v16h-4z" fill="#7A7A7A" />
        <Path d="M50 4l6 8 6-8v16h-4v-8l-2 3-2-3v8h-4V4z" fill="#7A7A7A" />
        <Path d="M0 24L10 24 16 16 22 24 64 24" stroke="#00A251" strokeWidth="2" fill="none" />
        <Path d="M0 24L5 24 10 18 15 24 64 24" stroke="#F1841E" strokeWidth="2" fill="none" />
    </Svg>
);

const MOCK_DATA = [
    {
        id: "1",
        merchant: "Google Pay",
        vpa: "gpay-123456@okicici",
        iconInitials: "G",
        iconColor: "#22C55E",
        iconBg: "#DCFCE7",
        amount: 2450.0,
        date: "31 May, 2024",
        time: "10:30 AM",
        status: "Successful",
        isUpi: true,
    },
    {
        id: "2",
        merchant: "PhonePe",
        vpa: "phonepe-987654@ybl",
        iconInitials: "P",
        iconColor: "#A855F7",
        iconBg: "#F3E8FF",
        amount: 1850.0,
        date: "31 May, 2024",
        time: "09:15 AM",
        status: "Successful",
        isUpi: true,
    },
    {
        id: "3",
        merchant: "Paytm",
        vpa: "paytm-555666@paytm",
        iconInitials: "P",
        iconColor: "#F59E0B",
        iconBg: "#FEF3C7",
        amount: 980.0,
        date: "30 May, 2024",
        time: "08:45 PM",
        status: "Failed",
        isUpi: true,
    },
    {
        id: "4",
        merchant: "HDFC Bank",
        vpa: "hdfcbank@upi",
        iconInitials: "H",
        iconColor: "#3B82F6",
        iconBg: "#DBEAFE",
        amount: 3200.0,
        date: "30 May, 2024",
        time: "07:20 PM",
        status: "Successful",
        isUpi: true,
    },
    {
        id: "5",
        merchant: "Amazon Pay",
        vpa: "amazonpay@apl",
        iconInitials: "a",
        iconColor: "#F59E0B",
        iconBg: "#FEF3C7",
        amount: 1120.0,
        date: "30 May, 2024",
        time: "06:10 PM",
        status: "Pending",
        isUpi: true,
    },
    {
        id: "6",
        merchant: "Flipkart",
        vpa: "flipkart@axisbank",
        iconInitials: "f",
        iconColor: "#F97316",
        iconBg: "#FFEDD5",
        amount: 2650.0,
        date: "29 May, 2024",
        time: "04:55 PM",
        status: "Successful",
        isUpi: true,
    },
    {
        id: "7",
        merchant: "Neha Patel",
        vpa: "neha.patel@okicici",
        iconInitials: "N",
        iconColor: "#6366F1",
        iconBg: "#E0E7FF",
        amount: 750.0,
        date: "29 May, 2024",
        time: "02:30 PM",
        status: "Successful",
        isUpi: true,
    },
];

export default function TransactionsScreen() {
    const { colors, isDark } = useAppTheme();
    const [activeTab, setActiveTab] = useState<TabType>("All");
    const [search, setSearch] = useState("");

    // Background should match screenshot perfectly
    const bgColor = isDark ? colors.background : "#FCFDFE"; 

    return (
        <ScrollView style={[styles.container, { backgroundColor: bgColor }]} contentContainerStyle={styles.scrollContent}>
            
            {/* Top Filters Row */}
            <View style={styles.topFiltersRow}>
                <View style={styles.leftFilters}>
                    <TouchableOpacity style={styles.filterBox} activeOpacity={0.8}>
                        <Ionicons name="calendar-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
                        <Text style={styles.filterText}>01 May, 2024 - 31 May, 2024</Text>
                        <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.filterBox} activeOpacity={0.8}>
                        <Ionicons name="funnel-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
                        <Text style={styles.filterText}>Filter</Text>
                        <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.8}>
                    <Ionicons name="download-outline" size={18} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* KPIs Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow} style={{ flexGrow: 0, marginBottom: 20 }}>
                {/* Total Transactions */}
                <View style={[styles.kpiCard, { borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                    <View style={[styles.iconCircle, { backgroundColor: "#F5F3FF" }]}>
                        <Ionicons name="swap-horizontal" size={18} color="#8B5CF6" />
                    </View>
                    <Text style={styles.kpiTitle}>Total Transactions</Text>
                    <Text style={[styles.kpiValue, { color: colors.text }]}>1,248</Text>
                    <View style={styles.kpiTrendRow}>
                        <Ionicons name="arrow-up" size={12} color="#22C55E" />
                        <Text style={styles.kpiTrendGreen}>12.4%</Text>
                        <Text style={styles.kpiTrendSub}> vs Apr 01 - Apr 30</Text>
                    </View>
                </View>

                {/* Successful */}
                <View style={[styles.kpiCard, { borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                    <View style={[styles.iconCircle, { backgroundColor: "#DCFCE7" }]}>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#22C55E" />
                    </View>
                    <Text style={styles.kpiTitle}>Successful</Text>
                    <Text style={[styles.kpiValue, { color: colors.text }]}>1,180</Text>
                    <View style={styles.kpiTrendRow}>
                        <Ionicons name="arrow-up" size={12} color="#22C55E" />
                        <Text style={styles.kpiTrendGreen}>94.6%</Text>
                    </View>
                </View>

                {/* Failed */}
                <View style={[styles.kpiCard, { borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                    <View style={[styles.iconCircle, { backgroundColor: "#FEF2F2", position: 'relative' }]}>
                        <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                        <View style={{position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#FEF2F2'}} />
                    </View>
                    <Text style={styles.kpiTitle}>Failed</Text>
                    <Text style={[styles.kpiValue, { color: colors.text }]}>48</Text>
                    <View style={styles.kpiTrendRow}>
                        <Ionicons name="arrow-down" size={12} color="#EF4444" />
                        <Text style={styles.kpiTrendRed}>3.8%</Text>
                    </View>
                </View>

                {/* Pending */}
                <View style={[styles.kpiCard, { borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                    <View style={[styles.iconCircle, { backgroundColor: "#F0F9FF" }]}>
                        <Ionicons name="time-outline" size={18} color="#3B82F6" />
                    </View>
                    <Text style={styles.kpiTitle}>Pending</Text>
                    <Text style={[styles.kpiValue, { color: colors.text }]}>20</Text>
                    <View style={styles.kpiTrendRow}>
                        <Ionicons name="arrow-up" size={12} color="#3B82F6" />
                        <Text style={styles.kpiTrendBlue}>1.6%</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Tabs Row */}
            <View style={styles.tabsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                    {(["All", "Successful", "Failed", "Pending"] as TabType[]).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                            onPress={() => setActiveTab(tab)}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === tab ? "#6D28D9" : "#64748B" },
                                activeTab === tab && styles.tabTextActive
                            ]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Search Row */}
            <View style={styles.searchRow}>
                <View style={[styles.searchBox, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                    <Ionicons name="search-outline" size={18} color="#94A3B8" />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search transactions..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity style={[styles.slidersBtn, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]} activeOpacity={0.8}>
                    <Ionicons name="options-outline" size={20} color="#6D28D9" />
                </TouchableOpacity>
            </View>

            {/* Main Table Content */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[styles.tableContainer, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                    
                    {/* Table Header */}
                    <View style={[styles.tableHeader, { borderBottomColor: isDark ? colors.border : "#F1F5F9" }]}>
                        <Text style={[styles.thText, { flex: 2, minWidth: 200 }]}>Transaction</Text>
                        <Text style={[styles.thText, { flex: 1.2, minWidth: 100 }]}>Type</Text>
                        <Text style={[styles.thText, { flex: 1.5, minWidth: 140 }]}>Amount</Text>
                        <Text style={[styles.thText, { width: 100 }]}>Status</Text>
                    </View>

                    {/* Table Rows */}
                    {MOCK_DATA.map((tx, index) => (
                        <View key={tx.id} style={[styles.tableRow, index !== MOCK_DATA.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? colors.border : "#F1F5F9" }]}>
                            
                            {/* Transaction Column */}
                            <View style={[styles.tdCol, { flex: 2, minWidth: 200, flexDirection: "row", alignItems: "center" }]}>
                                <View style={[styles.merchantIcon, { backgroundColor: tx.iconBg }]}>
                                    {tx.merchant.includes("Google") || tx.merchant.includes("Paytm") || tx.merchant.includes("Amazon") || tx.merchant.includes("Flipkart") ? (
                                        <Text style={{ color: tx.iconColor, fontWeight: "800", fontSize: 16 }}>{tx.iconInitials}</Text>
                                    ) : tx.merchant.includes("PhonePe") ? (
                                        <Text style={{ color: tx.iconColor, fontWeight: "800", fontSize: 16 }}>{tx.iconInitials}</Text>
                                    ) : tx.merchant.includes("Bank") ? (
                                        <Ionicons name="business" size={16} color={tx.iconColor} />
                                    ) : (
                                        <Ionicons name="arrow-up-outline" size={16} color={tx.iconColor} style={{ transform: [{rotate: '45deg'}] }} />
                                    )}
                                </View>
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <Text style={[styles.tdMainText, { color: colors.text }]} numberOfLines={1}>{tx.merchant}</Text>
                                    <Text style={styles.tdSubText} numberOfLines={1}>{tx.vpa}</Text>
                                </View>
                            </View>

                            {/* Type Column */}
                            <View style={[styles.tdCol, { flex: 1.2, minWidth: 100, justifyContent: "center" }]}>
                                <Text style={[styles.tdMainText, { color: colors.text, fontSize: 11 }]}>UPI Payment</Text>
                                <View style={{ marginTop: 2 }}>
                                    <UpiLogo />
                                </View>
                            </View>

                            {/* Amount Column */}
                            <View style={[styles.tdCol, { flex: 1.5, minWidth: 140, justifyContent: "center" }]}>
                                <Text style={[styles.tdMainText, { color: colors.text }]}>₹ {tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
                                <Text style={styles.tdSubText}>{tx.date} • {tx.time}</Text>
                            </View>

                            {/* Status Column */}
                            <View style={[styles.tdCol, { width: 100, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                <View style={[
                                    styles.statusPill,
                                    tx.status === "Successful" && { backgroundColor: isDark ? "#064e3b" : "#DCFCE7" },
                                    tx.status === "Pending" && { backgroundColor: isDark ? "#1e3a8a" : "#E0F2FE" },
                                    tx.status === "Failed" && { backgroundColor: isDark ? "#7f1d1d" : "#FEE2E2" },
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        tx.status === "Successful" && { color: "#16A34A" },
                                        tx.status === "Pending" && { color: "#0284C7" },
                                        tx.status === "Failed" && { color: "#DC2626" },
                                    ]}>{tx.status}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Pagination Footer */}
            <View style={styles.paginationRow}>
                <Text style={styles.paginationText}>Showing 1 to 10 of 1,248 transactions</Text>
                
                <View style={styles.pageControls}>
                    <TouchableOpacity style={[styles.pageBtn, { borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                        <Ionicons name="chevron-back" size={14} color="#94A3B8" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.pageBtn, styles.pageBtnActive]}>
                        <Text style={styles.pageTextActive}>1</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.pageBtn, { borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                        <Text style={styles.pageText}>2</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.pageBtn, { borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                        <Text style={styles.pageText}>3</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.pageDots}>
                        <Text style={styles.pageText}>...</Text>
                    </View>
                    
                    <TouchableOpacity style={[styles.pageBtn, { borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                        <Text style={styles.pageText}>125</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.pageBtn, { borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                        <Ionicons name="chevron-forward" size={14} color="#64748B" />
                    </TouchableOpacity>
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
        padding: 16,
        paddingBottom: 40,
    },
    topFiltersRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    leftFilters: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    filterBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#F1F5F9",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3 },
            android: { elevation: 1 },
            web: { boxShadow: "0 2px 6px rgba(0,0,0,0.02)" } as any,
        })
    },
    filterText: {
        fontSize: 12,
        color: "#1E293B",
        fontWeight: "500",
    },
    downloadBtn: {
        width: 34,
        height: 34,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#F1F5F9",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3 },
            android: { elevation: 1 },
            web: { boxShadow: "0 2px 6px rgba(0,0,0,0.02)" } as any,
        })
    },
    kpiRow: {
        gap: 16,
        paddingBottom: 4,
    },
    kpiCard: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        width: 150,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
            android: { elevation: 2 },
            web: { boxShadow: "0 4px 12px rgba(0,0,0,0.03)" } as any,
        })
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    kpiTitle: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: "600",
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 8,
    },
    kpiTrendRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    kpiTrendGreen: {
        fontSize: 10,
        color: "#16A34A",
        fontWeight: "700",
        marginLeft: 2,
    },
    kpiTrendRed: {
        fontSize: 10,
        color: "#DC2626",
        fontWeight: "700",
        marginLeft: 2,
    },
    kpiTrendBlue: {
        fontSize: 10,
        color: "#0284C7",
        fontWeight: "700",
        marginLeft: 2,
    },
    kpiTrendSub: {
        fontSize: 10,
        color: "#94A3B8",
        marginLeft: 4,
    },
    tabsWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
        marginBottom: 20,
    },
    tabsContainer: {
        flexDirection: "row",
    },
    tabItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 8,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabItemActive: {
        borderBottomColor: "#6D28D9",
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600",
    },
    tabTextActive: {
        fontWeight: "700",
    },
    searchRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    searchBox: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        padding: 0,
        ...Platform.select({ web: { outlineStyle: "none" } as any }),
    },
    slidersBtn: {
        width: 44,
        height: 44,
        borderWidth: 1,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    tableContainer: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
        minWidth: 700, 
    },
    tableHeader: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        backgroundColor: "#F8FAFC",
    },
    thText: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: "700",
    },
    tableRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    tdCol: {
    },
    merchantIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    tdMainText: {
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 2,
    },
    tdSubText: {
        fontSize: 10,
        color: "#94A3B8",
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "700",
    },
    paginationRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 20,
        paddingHorizontal: 4,
        flexWrap: "wrap",
        gap: 12,
    },
    paginationText: {
        fontSize: 12,
        color: "#64748B",
    },
    pageControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    pageBtn: {
        minWidth: 32,
        height: 32,
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 8,
        backgroundColor: "#FFFFFF",
    },
    pageBtnActive: {
        backgroundColor: "#F3E8FF",
        borderColor: "#F3E8FF",
    },
    pageText: {
        fontSize: 12,
        color: "#0F172A",
        fontWeight: "600",
    },
    pageTextActive: {
        fontSize: 12,
        color: "#6D28D9",
        fontWeight: "700",
    },
    pageDots: {
        width: 24,
        justifyContent: "center",
        alignItems: "center",
    }
});
