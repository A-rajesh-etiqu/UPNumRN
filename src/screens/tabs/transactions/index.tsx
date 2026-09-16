import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    useWindowDimensions,
    Platform,
    ActivityIndicator,
    Image,
    Modal,
    Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import Svg, { Path } from "react-native-svg";
import { useAppTheme } from "../../../theme";
import { useTransactionStore } from "../../../store/transaction.store";
import { useAuthStore } from "../../../store/auth.store";
import { router } from "../../../navigation/RootNavigation";

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
    const { user, logout } = useAuthStore();
    const { transactions, loading, loadTransactions, addTransaction } = useTransactionStore();
    const [activeTab, setActiveTab] = useState<TabType>("All");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
    
    // Import Transaction State
    const [isImportMenuVisible, setIsImportMenuVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importForm, setImportForm] = useState({ title: '', category: '', amount: '', type: 'expense' as 'expense' | 'income' });
    const { uploadBulkTransactions } = useTransactionStore();
    
    const ITEMS_PER_PAGE = 10;
    
    const handleImportSubmit = async () => {
        if (!importForm.title || !importForm.amount || !importForm.category) return;
        setIsImporting(true);
        const success = await addTransaction({
            userId: user?.id,
            title: importForm.title,
            category: importForm.category,
            amount: parseFloat(importForm.amount),
            type: importForm.type,
            date_time: new Date().toISOString()
        });
        setIsImporting(false);
        if (success) {
            setIsImportModalVisible(false);
            setImportForm({ title: '', category: '', amount: '', type: 'expense' });
        }
    };

    const handleFileUpload = async () => {
        setIsImportMenuVisible(false);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const file = result.assets[0];
            
            setIsImporting(true);
            const formData = new FormData();
            formData.append("userId", user?.id || "user-1");
            formData.append("file", {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || "application/octet-stream",
            } as any);

            const success = await uploadBulkTransactions(formData, user?.id);
            setIsImporting(false);
            if (success) {
                Alert.alert("Success", "Transactions imported successfully!");
            } else {
                Alert.alert("Error", "Failed to upload file");
            }
        } catch (error) {
            console.error("File upload error:", error);
            setIsImporting(false);
            Alert.alert("Error", "An unexpected error occurred during upload");
        }
    };

    useEffect(() => {
        loadTransactions(user?.id);
    }, [user?.id]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, search]);

    // Background should match screenshot perfectly
    const bgColor = isDark ? colors.background : "#FCFDFE"; 

    // Helper to get initials
    const getInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : "T";
    };

    // KPI Stats computations
    const totalTxCount = transactions.length;
    const successCount = transactions.filter(tx => !tx.status || tx.status.toLowerCase() === "success" || tx.status.toLowerCase() === "successful").length;
    const failedCount = transactions.filter(tx => tx.status?.toLowerCase() === "failed").length;
    const pendingCount = transactions.filter(tx => tx.status?.toLowerCase() === "pending").length;

    // Filter transactions
    const filteredTransactions = transactions.filter(tx => {
        const normalizedTab = activeTab.toLowerCase() === "successful" ? "success" : activeTab.toLowerCase();
        const matchTab = activeTab === "All" || (tx.status && tx.status.toLowerCase() === normalizedTab);
        const matchSearch = (tx.title || "").toLowerCase().includes(search.toLowerCase()) || 
                            (tx.category || "").toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: bgColor }]} contentContainerStyle={styles.scrollContent}>
            
            {/* Page Header */}
            <View style={styles.pageHeaderRow}>
                <View style={styles.pageHeaderLeft}>
                    <Text style={[styles.pageTitle, { color: colors.text }]}>Transactions</Text>
                    <Text style={styles.pageSubtitle}>Track and manage all your transactions</Text>
                </View>
                <View style={styles.avatarWrapper}>
                    <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)} style={styles.avatarCircle}>
                        <Image 
                            source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }} 
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                    <View style={styles.activeDot} />

                    {/* Profile Dropdown */}
                    <Modal visible={isProfileMenuVisible} transparent={true} animationType="fade">
                        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setIsProfileMenuVisible(false)}>
                            <View style={[styles.profileDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setIsProfileMenuVisible(false); router.replace("/tabs/profile"); }}>
                                    <Ionicons name="person-outline" size={16} color={colors.text} />
                                    <Text style={[styles.dropdownText, { color: colors.text }]}>Edit Profile</Text>
                                </TouchableOpacity>
                                <View style={[styles.dropdownDivider, { backgroundColor: colors.border }]} />
                                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setIsProfileMenuVisible(false); logout(); router.replace("/auth"); }}>
                                    <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                                    <Text style={[styles.dropdownText, { color: "#EF4444" }]}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </View>
            </View>

            {/* Top Filters Row */}
            <View style={styles.topFiltersRow}>
                <View style={styles.leftFilters}>
                    <TouchableOpacity style={[styles.filterBox, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]} activeOpacity={0.8}>
                        <Ionicons name="calendar-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
                        <Text style={[styles.filterText, { color: isDark ? colors.text : "#1E293B" }]}>01 May, 2024 - 31 May, 2024</Text>
                        <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.filterBox, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]} activeOpacity={0.8}>
                        <Ionicons name="funnel-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
                        <Text style={[styles.filterText, { color: isDark ? colors.text : "#1E293B" }]}>Filter</Text>
                        <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity 
                        style={[styles.downloadBtn, { backgroundColor: colors.primary, borderColor: colors.primary, paddingHorizontal: 12 }]} 
                        activeOpacity={0.8}
                        onPress={() => setIsImportMenuVisible(true)}
                    >
                        <Ionicons name="add-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]} activeOpacity={0.8}>
                        <Ionicons name="download-outline" size={18} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* KPIs Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow} style={{ flexGrow: 0, marginBottom: 20 }}>
                {/* Total Transactions */}
                <View style={[styles.kpiCard, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                    <View style={[styles.iconCircle, { backgroundColor: "#F5F3FF" }]}>
                        <Ionicons name="swap-horizontal" size={18} color="#8B5CF6" />
                    </View>
                    <Text style={styles.kpiTitle}>Total Transactions</Text>
                    <Text style={[styles.kpiValue, { color: colors.text }]}>{totalTxCount}</Text>
                    <View style={styles.kpiTrendRow}>
                        <Ionicons name="arrow-up" size={12} color="#22C55E" />
                        <Text style={styles.kpiTrendGreen}>12.4%</Text>
                        <Text style={styles.kpiTrendSub}> vs Apr 01 - Apr 30</Text>
                    </View>
                </View>

                {/* Successful */}
                <View style={[styles.kpiCard, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                    <View style={[styles.iconCircle, { backgroundColor: "#DCFCE7" }]}>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#22C55E" />
                    </View>
                    <Text style={styles.kpiTitle}>Successful</Text>
                    <Text style={[styles.kpiValue, { color: colors.text }]}>{successCount}</Text>
                    <View style={styles.kpiTrendRow}>
                        <Ionicons name="arrow-up" size={12} color="#22C55E" />
                        <Text style={styles.kpiTrendGreen}>94.6%</Text>
                    </View>
                </View>

                {/* Failed */}
                <View style={[styles.kpiCard, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                    <View style={[styles.iconCircle, { backgroundColor: "#FEF2F2", position: 'relative' }]}>
                        <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                        <View style={{position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#FEF2F2'}} />
                    </View>
                    <Text style={styles.kpiTitle}>Failed</Text>
                    <Text style={[styles.kpiValue, { color: colors.text }]}>{failedCount}</Text>
                    <View style={styles.kpiTrendRow}>
                        <Ionicons name="arrow-down" size={12} color="#EF4444" />
                        <Text style={styles.kpiTrendRed}>3.8%</Text>
                    </View>
                </View>

                {/* Pending */}
                <View style={[styles.kpiCard, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                    <View style={[styles.iconCircle, { backgroundColor: "#F0F9FF" }]}>
                        <Ionicons name="time-outline" size={18} color="#3B82F6" />
                    </View>
                    <Text style={styles.kpiTitle}>Pending</Text>
                    <Text style={[styles.kpiValue, { color: colors.text }]}>{pendingCount}</Text>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: "100%" }} contentContainerStyle={{ flexGrow: 1 }}>
                <View style={[styles.tableContainer, { flex: 1, backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                    
                    {/* Table Header */}
                    <View style={[styles.tableHeader, { backgroundColor: isDark ? colors.background : "#F8FAFC", borderBottomColor: isDark ? colors.border : "#F1F5F9" }]}>
                        <Text style={[styles.thText, { flex: 2, minWidth: 200 }]}>Transaction</Text>
                        <Text style={[styles.thText, { flex: 1.2, minWidth: 100 }]}>Type</Text>
                        <Text style={[styles.thText, { flex: 1.5, minWidth: 140 }]}>Amount</Text>
                        <Text style={[styles.thText, { width: 100 }]}>Status</Text>
                    </View>

                    {/* Table Rows */}
                    {paginatedTransactions.map((tx, index) => (
                        <View key={tx.id || index} style={[styles.tableRow, index !== paginatedTransactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? colors.border : "#F1F5F9" }]}>
                            
                            {/* Transaction Column */}
                            <View style={[styles.tdCol, { flex: 2, minWidth: 200, flexDirection: "row", alignItems: "center" }]}>
                                <View style={[styles.merchantIcon, { backgroundColor: isDark ? colors.border : "#E0E7FF" }]}>
                                    <Text style={{ color: "#6366F1", fontWeight: "800", fontSize: 16 }}>{getInitials(tx.title || tx.category)}</Text>
                                </View>
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                    <Text style={[styles.tdMainText, { color: colors.text }]} numberOfLines={1}>{tx.title || tx.category}</Text>
                                    <Text style={styles.tdSubText} numberOfLines={1}>{tx.upi || tx.category}</Text>
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
                                <Text style={[styles.tdMainText, { color: colors.text }]}>₹ {Math.abs(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
                                <Text style={styles.tdSubText}>{tx.date} • {tx.time || "12:00 PM"}</Text>
                            </View>

                            {/* Status Column */}
                            <View style={[styles.tdCol, { width: 100, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                                <View style={[
                                    styles.statusPill,
                                    (!tx.status || tx.status.toLowerCase() === "success" || tx.status.toLowerCase() === "successful") && { backgroundColor: isDark ? "#064e3b" : "#DCFCE7" },
                                    tx.status?.toLowerCase() === "pending" && { backgroundColor: isDark ? "#1e3a8a" : "#E0F2FE" },
                                    tx.status?.toLowerCase() === "failed" && { backgroundColor: isDark ? "#7f1d1d" : "#FEE2E2" },
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        (!tx.status || tx.status.toLowerCase() === "success" || tx.status.toLowerCase() === "successful") && { color: "#16A34A" },
                                        tx.status?.toLowerCase() === "pending" && { color: "#0284C7" },
                                        tx.status?.toLowerCase() === "failed" && { color: "#DC2626" },
                                    ]}>{tx.status || "Successful"}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Pagination Footer */}
            <View style={styles.paginationRow}>
                <Text style={styles.paginationText}>Showing {totalItems > 0 ? startIndex + 1 : 0} to {endIndex} of {totalItems} transactions</Text>
                
                <View style={styles.pageControls}>
                    <TouchableOpacity 
                        style={[styles.pageBtn, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9", opacity: currentPage === 1 ? 0.5 : 1 }]}
                        disabled={currentPage === 1}
                        onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                        <Ionicons name="chevron-back" size={14} color="#94A3B8" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.pageBtn, styles.pageBtnActive]}>
                        <Text style={styles.pageTextActive}>{currentPage}</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.pageDots}>
                        <Text style={[styles.pageText, { color: isDark ? colors.text : "#0F172A" }]}>of</Text>
                    </View>
                    
                    <TouchableOpacity style={[styles.pageBtn, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9" }]}>
                        <Text style={[styles.pageText, { color: isDark ? colors.text : "#0F172A" }]}>{totalPages}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.pageBtn, { backgroundColor: isDark ? colors.surface : "#FFFFFF", borderColor: isDark ? colors.border : "#F1F5F9", opacity: currentPage === totalPages ? 0.5 : 1 }]}
                        disabled={currentPage === totalPages}
                        onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    >
                        <Ionicons name="chevron-forward" size={14} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Import Menu Modal */}
            <Modal
                visible={isImportMenuVisible}
                transparent={true}
                animationType="fade"
            >
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setIsImportMenuVisible(false)}>
                    <View style={{ width: 280, backgroundColor: isDark ? colors.surface : "#FFF", borderRadius: 16, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 8 }, web: { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } as any }) }}>
                        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Import Transactions</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>Choose an import method</Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
                            onPress={() => { setIsImportMenuVisible(false); setIsImportModalVisible(true); }}
                        >
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#1e3a8a' : '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                <Ionicons name="create-outline" size={18} color="#0284C7" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Add Manually</Text>
                                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Enter one transaction at a time</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
                            onPress={handleFileUpload}
                        >
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#064e3b' : '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                <Ionicons name="document-text-outline" size={18} color="#16A34A" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Upload File</Text>
                                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>CSV or Excel (.xls, .xlsx)</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Import Transaction Modal */}
            <Modal
                visible={isImportModalVisible}
                transparent={true}
                animationType="fade"
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: 340, backgroundColor: isDark ? colors.surface : "#FFF", borderRadius: 12, padding: 20, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Import Transaction</Text>
                        
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Title</Text>
                            <TextInput 
                                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }}
                                placeholder="e.g. Amazon Purchase"
                                placeholderTextColor={colors.textSecondary}
                                value={importForm.title}
                                onChangeText={t => setImportForm({...importForm, title: t})}
                            />
                        </View>
                        
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Amount (₹)</Text>
                            <TextInput 
                                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }}
                                placeholder="0.00"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                value={importForm.amount}
                                onChangeText={t => setImportForm({...importForm, amount: t})}
                            />
                        </View>
                        
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Category</Text>
                            <TextInput 
                                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text }}
                                placeholder="e.g. Shopping"
                                placeholderTextColor={colors.textSecondary}
                                value={importForm.category}
                                onChangeText={t => setImportForm({...importForm, category: t})}
                            />
                        </View>
                        
                        <View style={{ marginBottom: 20, flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity 
                                style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: importForm.type === 'expense' ? '#EF4444' : colors.border, backgroundColor: importForm.type === 'expense' ? (isDark ? '#451a1a' : '#FEE2E2') : 'transparent', alignItems: 'center' }}
                                onPress={() => setImportForm({...importForm, type: 'expense'})}
                            >
                                <Text style={{ color: importForm.type === 'expense' ? '#EF4444' : colors.text }}>Expense</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: importForm.type === 'income' ? '#22C55E' : colors.border, backgroundColor: importForm.type === 'income' ? (isDark ? '#1a3320' : '#DCFCE7') : 'transparent', alignItems: 'center' }}
                                onPress={() => setImportForm({...importForm, type: 'income'})}
                            >
                                <Text style={{ color: importForm.type === 'income' ? '#22C55E' : colors.text }}>Income</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity 
                                style={{ flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: colors.border }}
                                onPress={() => setIsImportModalVisible(false)}
                            >
                                <Text style={{ color: colors.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={{ flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: colors.primary }}
                                onPress={handleImportSubmit}
                                disabled={isImporting || !importForm.title || !importForm.amount || !importForm.category}
                            >
                                {isImporting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: "#FFF", fontWeight: '600' }}>Add</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    pageHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    pageHeaderLeft: {
        flex: 1,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#6D28D9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    dropdownOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.1)",
        alignItems: "flex-end",
        paddingTop: Platform.OS === 'ios' ? 100 : 70,
        paddingRight: 16,
    },
    profileDropdown: {
        width: 160,
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden",
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
            android: { elevation: 8 },
            web: { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } as any,
        })
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 8,
    },
    dropdownText: {
        fontSize: 14,
        fontWeight: "500",
    },
    dropdownDivider: {
        height: 1,
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
