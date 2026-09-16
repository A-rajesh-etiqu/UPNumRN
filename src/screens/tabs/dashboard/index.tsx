import React, { useEffect, useState, useMemo } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    useWindowDimensions,
    ScrollView,
    Platform,
    Alert,
    TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { router, useLocalSearchParams } from "../../../navigation/RootNavigation";
import { LineChart, PieChart } from "react-native-gifted-charts";

import DashboardLayout from "../../../components/layout/DashboardLayout";
import { useDashboardStore } from "../../../store/dashboard.store";
import { useAppTheme } from "../../../theme";
import Typography from "../../../theme/typography";
import { useAuthStore } from "../../../store/auth.store";
import { setuService } from "../../../services/setu.service";
import apiClient from "../../../api/apiClient";
import { openBrowserAuth } from "../../../utils/browser";

// Helper to calculate nice chart boundaries
const calculateNiceYAxis = (data: any[], data2?: any[]) => {
    let max = Math.max(...data.map((item: any) => item.value || 0), 100);
    if (data2) {
        const max2 = Math.max(...data2.map((item: any) => item.value || 0), 100);
        max = Math.max(max, max2);
    }
    const rawStep = max / 5;
    const stepExponent = Math.floor(Math.log10(rawStep));
    const stepPower = Math.pow(10, stepExponent);
    const stepFraction = rawStep / stepPower;
    
    let niceStepFraction;
    if (stepFraction <= 1) niceStepFraction = 1;
    else if (stepFraction <= 2) niceStepFraction = 2;
    else if (stepFraction <= 2.5) niceStepFraction = 2.5;
    else if (stepFraction <= 5) niceStepFraction = 5;
    else niceStepFraction = 10;

    const stepValue = niceStepFraction * stepPower;
    const maxValue = stepValue * 5;
    return { maxValue, stepValue, noOfSections: 5 };
};

const formatYAxisLabel = (label: string) => {
    const val = Number(label);
    if (isNaN(val)) return label;
    if (val >= 10000000) return `${(val / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1).replace(/\.0$/, '')}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return val.toString();
};

// Reusable Components
const SectionCard = ({ children, style }: any) => {
    const { colors, isDark } = useAppTheme();
    return (
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
            {children}
        </View>
    );
};

const SectionHeader = ({ title, icon }: any) => {
    const { colors } = useAppTheme();
    return (
        <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text, ...Typography.h3, fontSize: 18 }]}>{title}</Text>
            {icon && <Ionicons name={icon} size={16} color={colors.textSecondary} />}
        </View>
    );
};

export default function DashboardScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const { user, logout } = useAuthStore();
    const { colors, isDark } = useAppTheme();
    const { data, loading, loadDashboard } = useDashboardStore();

    const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
    const [isNotifMenuVisible, setIsNotifMenuVisible] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isFilterMenuVisible, setIsFilterMenuVisible] = useState(false);
    const [filterPeriod, setFilterPeriod] = useState("This Month");
    const [isSyncModalVisible, setIsSyncModalVisible] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const params = useLocalSearchParams();
    
    // Determine user type
    const isBusiness = user?.userType === "BUSINESS";

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
        }
    }, [user?.id]);

    const fetchNotifications = async () => {
        try {
            const res = await apiClient.get(`/users/${user?.id}/notifications`);
            setNotifications(res.data);
        } catch (err: any) {
            console.warn("Failed to fetch user notifications:", err.message);
        }
    };

    const handleReadNotification = async (notifId: number) => {
        try {
            await apiClient.put(`/users/${user?.id}/notifications/${notifId}/read`);
            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: 1 } : n));
        } catch (err: any) {
            console.warn("Failed to mark notification as read:", err.message);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleSyncSubmit = async () => {
        if (!phoneNumber) {
            Alert.alert("Error", "Please enter your phone number");
            return;
        }

        setIsSyncing(true);
        try {
            const requestUserId = user?.id || "user-1";
            const redirectUrl = Platform.OS === 'web' 
                ? ((globalThis as any).window?.location?.origin || '') + '/tabs/dashboard'
                : 'upnumrn://tabs/dashboard';

            const response = await setuService.createConsent({
                userId: requestUserId,
                vua: `${phoneNumber}@setu`,
                consentDetail: {},
                redirectUrl: redirectUrl
            });

            if (response.data?.url) {
                setIsSyncModalVisible(false);
                const browserResult = await openBrowserAuth(
                    response.data.url,
                    redirectUrl
                );

                if (browserResult.type === 'success') {
                    try {
                        const consentId = response.data.id || response.data.ConsentHandle;
                        await apiClient.post('/setu-flow/sync-consent', { consentId });
                        Alert.alert("Success", "UPI History Synced Successfully!");
                        loadDashboard(user?.id);
                    } catch (err) {
                        Alert.alert("Warning", "Consent approved, but failed to sync data immediately.");
                        loadDashboard(user?.id);
                    }
                }
            } else {
                Alert.alert("Error", "Failed to generate Setu Consent link");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to start sync");
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        const checkParamsAndSync = async () => {
            if (params.id) {
                try {
                    Alert.alert("Syncing", "Fetching your latest UPI transactions...");
                    await apiClient.post('/setu-flow/sync-consent', { consentId: params.id });
                    Alert.alert("Success", "UPI History Synced Successfully!");
                    loadDashboard(user?.id);
                    router.replace("/tabs/dashboard");
                } catch (err) {
                    Alert.alert("Warning", "Failed to sync data immediately. Please check later.");
                    loadDashboard(user?.id);
                }
            }
        };
        checkParamsAndSync();
    }, [params.id]);

    useEffect(() => {
        loadDashboard(user?.id, filterPeriod);
    }, [user?.id, filterPeriod]);

    if (loading) {
        return (
            <DashboardLayout>
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 80 }} />
            </DashboardLayout>
        );
    }

    const userName = user?.firstName || "Testuser";

    return (
        <DashboardLayout>
            {/* Header Section */}
            <View style={styles.headerContainer}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.greetingText, { color: colors.text, ...Typography.h2 }]}>Good afternoon, {userName} 👋</Text>
                    <Text style={[styles.subGreetingText, { color: colors.textSecondary, ...Typography.body }]}>
                        Here's your {isBusiness ? "business" : "financial"} overview
                    </Text>
                </View>
                
                <View style={styles.headerRightActions}>
                    <View style={{ position: "relative" }}>
                        <TouchableOpacity style={[styles.iconButton, { borderColor: colors.border }]} onPress={() => { setIsNotifMenuVisible(!isNotifMenuVisible); setIsProfileMenuVisible(false); }}>
                            <Ionicons name="notifications-outline" size={20} color={colors.text} />
                            {unreadCount > 0 && <View style={styles.notificationBadge}><Text style={{ color: '#FFF', fontSize: 8, fontWeight: 'bold' }}>{unreadCount}</Text></View>}
                        </TouchableOpacity>

                        <Modal visible={isNotifMenuVisible} transparent={true} animationType="fade">
                            <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setIsNotifMenuVisible(false)}>
                                <View style={[styles.profileDropdown, { backgroundColor: colors.surface, borderColor: colors.border, width: 300, right: 60, padding: 0 }]}>
                                    <Text style={{ padding: 12, color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border, ...Typography.title, fontSize: 16 }}>Notifications</Text>
                                    <ScrollView style={{ maxHeight: 300 }}>
                                        {notifications.length === 0 ? (
                                            <Text style={{ padding: 16, color: colors.textSecondary, textAlign: 'center', ...Typography.body }}>No notifications</Text>
                                        ) : (
                                            notifications.map((n, idx) => (
                                                <TouchableOpacity 
                                                    key={idx} 
                                                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: n.is_read ? 'transparent' : colors.primary + '10' }}
                                                    onPress={() => !n.is_read && handleReadNotification(n.id)}
                                                >
                                                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                                        <Text style={{ color: colors.text, flex: 1, ...(n.is_read ? Typography.bodyMedium : Typography.bodyBold) }} numberOfLines={1}>{n.title}</Text>
                                                        {!n.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 }} />}
                                                    </View>
                                                    <Text style={{ color: colors.textSecondary, ...Typography.caption }} numberOfLines={2}>{n.message}</Text>
                                                    <Text style={{ color: colors.textSecondary, marginTop: 4, ...Typography.caption, fontSize: 10 }}>{new Date(n.created_at).toLocaleString()}</Text>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    </View>
                    
                    <View style={{ position: "relative" }}>
                        <TouchableOpacity onPress={() => { setIsProfileMenuVisible(true); setIsNotifMenuVisible(false); }} style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                            <Ionicons name="person" size={20} color="#FFF" />
                        </TouchableOpacity>

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
            </View>

            <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 9999, elevation: 10 }}>
                <View style={{ position: "relative", zIndex: 100 }}>
                    <TouchableOpacity 
                        style={[styles.monthFilter, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => setIsFilterMenuVisible(!isFilterMenuVisible)}
                    >
                        <Text style={[styles.monthFilterText, { color: colors.text, ...Typography.bodyBold, fontSize: 13 }]}>{filterPeriod}</Text>
                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Filter Dropdown */}
                    {isFilterMenuVisible && (
                        <View style={{ position: "absolute", top: 40, left: 0, width: 160, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 8, zIndex: 1000, ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } as any, default: { elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } } }) }}>
                            {["This Week", "This Month", "Last Month", "This Year", "All Time"].map((period) => (
                                <TouchableOpacity 
                                    key={period}
                                    style={styles.dropdownItem} 
                                    onPress={() => { 
                                        setFilterPeriod(period); 
                                        setIsFilterMenuVisible(false); 
                                    }}
                                >
                                    <Text style={[styles.dropdownText, { color: filterPeriod === period ? colors.primary : colors.text, ...(filterPeriod === period ? Typography.bodyBold : Typography.bodyMedium) }]}>{period}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <TouchableOpacity style={[styles.syncBtn, { backgroundColor: colors.primary }]} onPress={() => setIsSyncModalVisible(true)}>
                    <Text style={[styles.syncBtnText, { ...Typography.button, fontSize: 13, fontWeight: "600" }]}>Sync Data</Text>
                    <Ionicons name="refresh-outline" size={14} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Conditionally Render Dashboards */}
            {isBusiness ? (
                <BusinessDashboard data={data} recentTransactions={data?.recentTransactions || []} />
            ) : (
                <PersonalDashboard data={data} recentTransactions={data?.recentTransactions || []} />
            )}

            {/* Sync Modal */}
            <Modal
                visible={isSyncModalVisible}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Sync UPI History</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            Enter your phone number registered with your bank to fetch your transaction history via Account Aggregator.
                        </Text>

                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            placeholder="Enter phone number"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: "transparent" }]}
                                onPress={() => setIsSyncModalVisible(false)}
                            >
                                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                                onPress={handleSyncSubmit}
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Continue to OTP</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </DashboardLayout>
    );
}

// -----------------------------------------------------------------------------
// PERSONAL DASHBOARD
// -----------------------------------------------------------------------------
function PersonalDashboard({ data, recentTransactions }: { data: any, recentTransactions: any[] }) {
    const { colors, isDark } = useAppTheme();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const [chartWidth, setChartWidth] = useState(width - 80);

    // Use dynamic data if available
    const income = data?.income ?? 0;
    const expenses = data?.expenses ?? 0;
    const savings = data?.savings ?? 0;
    const txCount = data?.transactionsCount ?? 0;

    const incomeChange = data?.incomeChange ?? 0;
    const expenseChange = data?.expenseChange ?? 0;
    const savingsChange = data?.savingsChange ?? 0;

    const chartDataIncome = (data?.chartDataIncome?.length ? data.chartDataIncome : [{ value: 0 }]).map((item: any) => ({
        ...item,
        label: item.month || ""
    }));
    const chartDataExpense = (data?.chartDataExpense?.length ? data.chartDataExpense : [{ value: 0 }]).map((item: any) => ({
        ...item,
        label: item.month || ""
    }));

    const chartAxisProps = calculateNiceYAxis(chartDataIncome, chartDataExpense);

    const pieData = data?.pieData?.length ? data.pieData : [{ value: 100, color: '#E2E8F0' }];

    const topCategories = data?.topCategories || [];
    
    // Add missing styles inline
    const localStyles = {
        iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center' as const, alignItems: 'center' as const },
        badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
        badgeText: { fontSize: 10, fontWeight: '600' as const, color: colors.textSecondary }
    };

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* KPI Grid */}
            <View style={[styles.kpiGrid, isDesktop && { flexWrap: "nowrap", gap: 16 }]}>
                {/* Income */}
                <View style={[styles.kpiCard, isDesktop && { width: "23%", marginBottom: 0 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={[localStyles.iconCircle, { backgroundColor: "#DCFCE7" }]}>
                            <Ionicons name="arrow-down-outline" size={20} color="#16A34A" />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={[styles.kpiLabel, { color: colors.textSecondary, ...Typography.bodyMedium }]}>Income</Text>
                            <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.kpiValue, { color: colors.text, fontSize: 20 }]}>₹{income.toLocaleString('en-IN')}</Text>
                        </View>
                    </View>
                    <Text style={[styles.kpiTrendUp, { marginTop: 8, color: incomeChange >= 0 ? "#16A34A" : "#EF4444" }]}>
                        {incomeChange >= 0 ? "↑" : "↓"} {Math.abs(incomeChange)}% <Text style={{color: colors.textSecondary, fontWeight: "normal"}}>vs Last Month</Text>
                    </Text>
                </View>
                
                {/* Expenses */}
                <View style={[styles.kpiCard, isDesktop && { width: "23%", marginBottom: 0 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={[localStyles.iconCircle, { backgroundColor: "#FEE2E2" }]}>
                            <Ionicons name="arrow-up-outline" size={20} color="#EF4444" />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={[styles.kpiLabel, { color: colors.textSecondary, ...Typography.bodyMedium }]}>Expenses</Text>
                            <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.kpiValue, { color: colors.text, fontSize: 20 }]}>₹{expenses.toLocaleString('en-IN')}</Text>
                        </View>
                    </View>
                    <Text style={[styles.kpiTrendUp, { marginTop: 8, color: expenseChange >= 0 ? "#EF4444" : "#16A34A" }]}>
                        {expenseChange >= 0 ? "↑" : "↓"} {Math.abs(expenseChange)}% <Text style={{color: colors.textSecondary, fontWeight: "normal"}}>vs Last Month</Text>
                    </Text>
                </View>

                {/* Savings */}
                <View style={[styles.kpiCard, isDesktop && { width: "23%", marginBottom: 0 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={[localStyles.iconCircle, { backgroundColor: "#F3E8FF" }]}>
                            <Ionicons name="wallet-outline" size={20} color="#6C2CF4" />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={[styles.kpiLabel, { color: colors.textSecondary, ...Typography.bodyMedium }]}>Savings</Text>
                            <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.kpiValue, { color: colors.text, fontSize: 20 }]}>₹{savings.toLocaleString('en-IN')}</Text>
                        </View>
                    </View>
                    <Text style={[styles.kpiTrendUp, { marginTop: 8, color: savingsChange >= 0 ? "#16A34A" : "#EF4444" }]}>
                        {savingsChange >= 0 ? "↑" : "↓"} {Math.abs(savingsChange)}% <Text style={{color: colors.textSecondary, fontWeight: "normal"}}>vs Last Month</Text>
                    </Text>
                </View>

                {/* Transactions */}
                <View style={[styles.kpiCard, isDesktop && { width: "23%", marginBottom: 0 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={[localStyles.iconCircle, { backgroundColor: "#E0F2FE" }]}>
                            <Ionicons name="document-text-outline" size={20} color="#0284C7" />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={[styles.kpiLabel, { color: colors.textSecondary, ...Typography.bodyMedium }]}>Transactions</Text>
                            <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.kpiValue, { color: colors.text, fontSize: 20 }]}>{txCount}</Text>
                        </View>
                    </View>
                    <Text style={[styles.kpiTrendUp, { color: "#16A34A", marginTop: 8 }]}>↑ 15.6% <Text style={{color: colors.textSecondary, fontWeight: "normal"}}>vs Last Month</Text></Text>
                </View>
            </View>

            {/* 2 Column Layout */}
            <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 16, marginTop: 16 }}>
                
                {/* LEFT COLUMN */}
                <View style={{ flex: 1, gap: 16 }}>
                    {/* Income vs Expenses Chart */}
                    <SectionCard>
                        <SectionHeader title="Income vs Expenses" />
                        <View 
                            style={{ marginTop: 16, overflow: 'hidden' }}
                            onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
                        >
                            <LineChart
                                data={chartDataIncome}
                                data2={chartDataExpense}
                                height={180}
                                width={chartWidth}
                                showVerticalLines={false}
                                color1="#16A34A"
                                color2="#EF4444"
                                dataPointsColor1="#16A34A"
                                dataPointsColor2="#EF4444"
                                thickness1={2}
                                thickness2={2}
                                maxValue={chartAxisProps.maxValue}
                                stepValue={chartAxisProps.stepValue}
                                noOfSections={chartAxisProps.noOfSections}
                                formatYLabel={formatYAxisLabel}
                                yAxisColor="transparent"
                                xAxisColor="transparent"
                                hideRules={false}
                                rulesColor={isDark ? "#334155" : "#F1F5F9"}
                                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                                areaChart
                                startFillColor1="#16A34A"
                                endFillColor1="#16A34A"
                                startFillColor2="#EF4444"
                                endFillColor2="#EF4444"
                                startOpacity1={0.2}
                                endOpacity1={0.0}
                                startOpacity2={0.2}
                                endOpacity2={0.0}
                            />
                        </View>
                    </SectionCard>

                    {/* Expense Breakdown */}
                    <SectionCard>
                        <SectionHeader title="Expense Breakdown" />
                        <View style={{ flexDirection: isDesktop ? "row" : "column", alignItems: "center", marginTop: 16 }}>
                            <View style={{ alignItems: "center", paddingBottom: 16, width: 160 }}>
                                <PieChart
                                    data={pieData}
                                    donut
                                    radius={60}
                                    innerRadius={30}
                                    innerCircleColor={colors.surface}
                                />
                            </View>
                            <View style={{ flex: 1, paddingLeft: isDesktop ? 20 : 0, width: "100%" }}>
                                {topCategories.map((cat: any, i: number) => (
                                    <View key={i} style={[styles.listItemRow, { borderBottomWidth: 0, paddingVertical: 8 }]}>
                                        <View style={{ flexDirection: "row", alignItems: "center", width: 140 }}>
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: pieData[i].color, marginRight: 8 }} />
                                            <Text style={styles.listLabelText}>{cat.label}</Text>
                                        </View>
                                        <Text style={[styles.listLabelText, { color: colors.textSecondary, width: 40 }]}>{cat.percent}%</Text>
                                        <Text style={[styles.listAmount, { color: colors.text }]}>₹{cat.amount.toLocaleString('en-IN')}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </SectionCard>
                </View>

                {/* RIGHT COLUMN */}
                <View style={{ flex: 1, gap: 16 }}>
                    {/* Recent Transactions */}
                    <SectionCard>
                        <SectionHeader title="Recent Transactions" />
                        <View style={styles.listContainer}>
                            {recentTransactions.length > 0 ? (
                                recentTransactions.slice(0, 5).map((tx, index) => (
                                    <View key={tx.id || index} style={styles.listItemRow}>
                                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                            <View style={[localStyles.iconCircle, { backgroundColor: tx.type === 'expense' ? "#FEE2E2" : "#DCFCE7", width: 32, height: 32, borderRadius: 16 }]}>
                                                <Ionicons name={tx.type === 'expense' ? "cart" : "cash"} size={14} color={tx.type === 'expense' ? "#EF4444" : "#16A34A"} />
                                            </View>
                                            <Text style={[styles.listLabelText, { color: colors.text, marginLeft: 12 }]} numberOfLines={1}>
                                                {tx.title || tx.category || "Transaction"}
                                            </Text>
                                        </View>
                                        <View style={{ width: 100, alignItems: "center" }}>
                                            <View style={localStyles.badge}>
                                                <Text style={localStyles.badgeText}>{tx.category || "General"}</Text>
                                            </View>
                                        </View>
                                        <View style={{ width: 80, alignItems: "flex-end" }}>
                                            <Text style={[
                                                styles.listAmount, 
                                                { color: colors.text }
                                            ]}>
                                                {tx.type === 'expense' ? '-' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 10 }}>No recent transactions</Text>
                            )}
                            <TouchableOpacity style={{ marginTop: 16 }}>
                                <Text style={{ color: "#6C2CF4", fontWeight: "600", fontSize: 13 }}>View All Transactions →</Text>
                            </TouchableOpacity>
                        </View>
                    </SectionCard>

                    {/* Top Categories Bars */}
                    <SectionCard>
                        <SectionHeader title="Top Categories" />
                        <View style={styles.listContainer}>
                            {topCategories.map((cat: any, index: number) => (
                                <View key={index} style={{ marginBottom: 16 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                                        <Text style={[styles.listLabelText, { color: colors.text }]}>{cat.label}</Text>
                                        <View style={{ flexDirection: "row", gap: 20 }}>
                                            <Text style={[styles.listLabelText, { color: colors.textSecondary }]}>{cat.percent}%</Text>
                                            <Text style={[styles.listAmount, { color: colors.text, width: 60, textAlign: "right" }]}>₹{cat.amount.toLocaleString('en-IN')}</Text>
                                        </View>
                                    </View>
                                    <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, width: "100%", overflow: "hidden" }}>
                                        <View style={{ height: "100%", width: `${cat.percent}%`, backgroundColor: "#6C2CF4", borderRadius: 3 }} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </SectionCard>
                </View>

            </View>
        </ScrollView>
    );
}


// -----------------------------------------------------------------------------
// BUSINESS DASHBOARD
// -----------------------------------------------------------------------------
function BusinessDashboard({ data, recentTransactions }: { data: any, recentTransactions: any[] }) {
    const { colors, isDark } = useAppTheme();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const chartDataSales = (data?.salesChart?.length ? data.salesChart : [{ value: 0 }]).map((item: any) => ({
        ...item,
        label: item.month || ""
    }));

    const chartAxisProps = calculateNiceYAxis(chartDataSales);

    const sales = data?.income ?? 0;
    const expenses = data?.expenses ?? 0;
    const cashflow = data?.savings ?? 0;
    const txCount = data?.transactionsCount ?? 0;

    const incomeChange = data?.incomeChange ?? 0;
    const expenseChange = data?.expenseChange ?? 0;
    const savingsChange = data?.savingsChange ?? 0;

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* KPI Grid */}
            <View style={[styles.kpiGrid, isDesktop && { flexWrap: "nowrap", gap: 16 }]}>
                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }, isDesktop && { width: "23%", marginBottom: 0 }]}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary, ...Typography.bodyMedium }]}>Sales</Text>
                    <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.kpiValue, { color: colors.text, ...Typography.h2, fontSize: 20 }]}>₹{sales.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.kpiTrendUp, { color: incomeChange >= 0 ? "#16A34A" : "#EF4444" }]}>{incomeChange >= 0 ? "↑" : "↓"} {Math.abs(incomeChange)}%</Text>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }, isDesktop && { width: "23%", marginBottom: 0 }]}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary, ...Typography.bodyMedium }]}>Expenses</Text>
                    <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.kpiValue, { color: colors.text, ...Typography.h2, fontSize: 20 }]}>₹{expenses.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.kpiTrendUp, { color: expenseChange >= 0 ? "#EF4444" : "#16A34A" }]}>{expenseChange >= 0 ? "↑" : "↓"} {Math.abs(expenseChange)}%</Text>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }, isDesktop && { width: "23%", marginBottom: 0 }]}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary, ...Typography.bodyMedium }]}>Net Cashflow</Text>
                    <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.kpiValue, { color: colors.text, ...Typography.h2, fontSize: 20 }]}>₹{cashflow.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.kpiTrendUp, { color: savingsChange >= 0 ? "#16A34A" : "#EF4444" }]}>{savingsChange >= 0 ? "↑" : "↓"} {Math.abs(savingsChange)}%</Text>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }, isDesktop && { width: "23%", marginBottom: 0 }]}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary, ...Typography.bodyMedium }]}>Transactions</Text>
                    <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.kpiValue, { color: colors.text, ...Typography.h2, fontSize: 20 }]}>{txCount}</Text>
                    <Text style={styles.kpiTrendUp}></Text>
                </View>
            </View>

            {/* Sales Performance */}
            <SectionCard>
                <SectionHeader title="Sales Performance" />
                <View style={{ marginTop: 16, overflow: 'hidden' }}>
                    <LineChart
                        data={chartDataSales}
                        height={180}
                        width={width - 80}
                        showVerticalLines={false}
                        color1="#6C2CF4"
                        dataPointsColor1="#6C2CF4"
                        thickness1={3}
                        maxValue={chartAxisProps.maxValue}
                        stepValue={chartAxisProps.stepValue}
                        noOfSections={chartAxisProps.noOfSections}
                        formatYLabel={formatYAxisLabel}
                        yAxisColor="transparent"
                        xAxisColor="transparent"
                        hideRules={false}
                        rulesColor={isDark ? "#334155" : "#F1F5F9"}
                        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                        areaChart
                        startFillColor1="#6C2CF4"
                        endFillColor1="#6C2CF4"
                        startOpacity1={0.3}
                        endOpacity1={0.0}
                    />
                </View>
            </SectionCard>

            <View style={{ flexDirection: width >= 768 ? "row" : "column", gap: 16 }}>
                {/* Sales by Day (Histogram Text Mock) */}
                <SectionCard style={{ flex: 1 }}>
                    <SectionHeader title="Sales by Day" />
                    <View style={styles.histogramList}>
                        <View style={styles.histogramRow}><Text style={[styles.histLabel, { color: colors.textSecondary }]}>Mon</Text><View style={[styles.histBar, { width: '40%', backgroundColor: '#C4B5FD' }]}></View></View>
                        <View style={styles.histogramRow}><Text style={[styles.histLabel, { color: colors.textSecondary }]}>Tue</Text><View style={[styles.histBar, { width: '60%', backgroundColor: '#A78BFA' }]}></View></View>
                        <View style={styles.histogramRow}><Text style={[styles.histLabel, { color: colors.textSecondary }]}>Wed</Text><View style={[styles.histBar, { width: '30%', backgroundColor: '#DDD6FE' }]}></View></View>
                        <View style={styles.histogramRow}><Text style={[styles.histLabel, { color: colors.textSecondary }]}>Thu</Text><View style={[styles.histBar, { width: '65%', backgroundColor: '#8B5CF6' }]}></View></View>
                        <View style={styles.histogramRow}><Text style={[styles.histLabel, { color: colors.textSecondary }]}>Fri</Text><View style={[styles.histBar, { width: '55%', backgroundColor: '#A78BFA' }]}></View></View>
                        <View style={styles.histogramRow}><Text style={[styles.histLabel, { color: colors.textSecondary }]}>Sat</Text><View style={[styles.histBar, { width: '90%', backgroundColor: '#6D28D9' }]}></View></View>
                        <View style={styles.histogramRow}><Text style={[styles.histLabel, { color: colors.textSecondary }]}>Sun</Text><View style={[styles.histBar, { width: '50%', backgroundColor: '#C4B5FD' }]}></View></View>
                    </View>
                </SectionCard>

                {/* Peak Sales Hours */}
                <SectionCard style={{ flex: 1, justifyContent: "center" }}>
                    <SectionHeader title="Peak Sales Hours" />
                    <View style={{ alignItems: "center", paddingVertical: 32 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={[styles.peakTimeText, { color: colors.text }]}>6 PM</Text>
                            <View style={{ height: 2, backgroundColor: "#6C2CF4", width: 60, marginHorizontal: 12 }} />
                            <Text style={[styles.peakTimeText, { color: colors.text }]}>9 PM</Text>
                        </View>
                        <Text style={{ fontSize: 24, marginTop: 12 }}>🔥</Text>
                    </View>
                </SectionCard>
            </View>

            {/* Income and Expenses Breakdown */}
            <View style={{ flexDirection: width >= 768 ? "row" : "column", gap: 16 }}>
                <SectionCard style={{ flex: 1 }}>
                    <SectionHeader title="Top Income Sources" />
                    <View style={styles.listContainer}>
                        <View style={styles.listItemRow}>
                            <Text style={[styles.listLabelText, { color: colors.text }]}>ABC Store</Text>
                            <Text style={[styles.listAmount, { color: colors.text }]}>₹45,000</Text>
                        </View>
                        <View style={styles.listItemRow}>
                            <Text style={[styles.listLabelText, { color: colors.text }]}>XYZ Customer</Text>
                            <Text style={[styles.listAmount, { color: colors.text }]}>₹31,500</Text>
                        </View>
                        <View style={styles.listItemRow}>
                            <Text style={[styles.listLabelText, { color: colors.text }]}>Online Sales</Text>
                            <Text style={[styles.listAmount, { color: colors.text }]}>₹28,200</Text>
                        </View>
                    </View>
                </SectionCard>

                <SectionCard style={{ flex: 1 }}>
                    <SectionHeader title="Expense Breakdown" />
                    <View style={styles.listContainer}>
                        <View style={styles.listItemRow}>
                            <Text style={[styles.listLabelText, { color: colors.textSecondary }]}>Rent</Text>
                            <Text style={[styles.listAmount, { color: colors.text }]}>₹30,000</Text>
                        </View>
                        <View style={styles.listItemRow}>
                            <Text style={[styles.listLabelText, { color: colors.textSecondary }]}>Inventory</Text>
                            <Text style={[styles.listAmount, { color: colors.text }]}>₹25,500</Text>
                        </View>
                        <View style={styles.listItemRow}>
                            <Text style={[styles.listLabelText, { color: colors.textSecondary }]}>Utilities</Text>
                            <Text style={[styles.listAmount, { color: colors.text }]}>₹12,300</Text>
                        </View>
                        <View style={styles.listItemRow}>
                            <Text style={[styles.listLabelText, { color: colors.textSecondary }]}>Other</Text>
                            <Text style={[styles.listAmount, { color: colors.text }]}>₹18,600</Text>
                        </View>
                    </View>
                </SectionCard>
            </View>

            {/* AI Insight */}
            <View style={[styles.aiInsightCard, { backgroundColor: isDark ? "#172554" : "#DBEAFE" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <Text style={[styles.aiInsightTitle, { color: "#2563EB" }]}>AI Business Insights ✨</Text>
                </View>
                <Text style={[styles.aiInsightText, { color: isDark ? "#BFDBFE" : "#1E3A8A", marginBottom: 12 }]}>
                    "Saturday generates 31% of your weekly sales."
                </Text>
                <Text style={[styles.aiInsightText, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
                    "Your peak sales period is 6 PM–9 PM."
                </Text>
                <TouchableOpacity style={styles.aiInsightBtn}>
                    <Text style={{ color: "#2563EB", fontWeight: "700", fontSize: 13 }}>View Full Analysis</Text>
                </TouchableOpacity>
            </View>

            {/* Recent Transactions */}
            <SectionCard>
                <SectionHeader title="Recent Transactions" />
                <View style={styles.listContainer}>
                    {recentTransactions.length > 0 ? (
                        recentTransactions.map((tx, index) => (
                            <View key={tx.id || index} style={styles.listItemRow}>
                                <Text style={[styles.listLabelText, { color: colors.textSecondary }]}>
                                    {tx.category || tx.title}
                                </Text>
                                <Text style={[
                                    styles.listAmount, 
                                    { color: tx.type === 'expense' ? colors.danger : colors.success }
                                ]}>
                                    {tx.type === 'expense' ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 10 }}>No recent transactions</Text>
                    )}
                </View>
            </SectionCard>
        </ScrollView>
    );
}

// -----------------------------------------------------------------------------
// STYLES
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        marginBottom: 20,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: "800",
        marginBottom: 4,
    },
    subGreetingText: {
        fontSize: 14,
    },
    headerRightActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    syncBtn: {
        backgroundColor: "#6C2CF4",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    syncBtnText: {
        color: "#FFF",
        fontWeight: "600",
        fontSize: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    notificationBadge: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#EF4444",
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    dropdownOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.1)",
        justifyContent: "flex-start",
        alignItems: "flex-end",
    },
    profileDropdown: {
        marginTop: 80,
        marginRight: 20,
        width: 160,
        borderRadius: 12,
        borderWidth: 1,
        padding: 8,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 8,
    },
    dropdownText: {
        fontSize: 14,
        fontWeight: "600",
    },
    dropdownDivider: {
        height: 1,
        marginVertical: 4,
    },
    monthFilter: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    monthFilterText: {
        fontSize: 13,
        fontWeight: "600",
    },
    kpiGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    kpiCard: {
        width: "100%",
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
            android: { elevation: 1 },
            web: { boxShadow: "0 2px 10px rgba(0,0,0,0.02)" } as any,
        })
    },
    kpiLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 8,
    },
    kpiValue: {
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 8,
    },
    kpiTrendUp: {
        fontSize: 12,
        fontWeight: "700",
        color: "#16A34A",
    },
    sectionCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
            android: { elevation: 1 },
            web: { boxShadow: "0 2px 10px rgba(0,0,0,0.02)" } as any,
        })
    },
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
    },
    listContainer: {
        marginTop: 16,
    },
    listItemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    listLabel: {
        fontSize: 14,
    },
    listLabelText: {
        fontSize: 14,
        fontWeight: "500",
    },
    listAmount: {
        fontSize: 14,
        fontWeight: "700",
    },
    aiInsightCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    aiInsightTitle: {
        fontSize: 16,
        fontWeight: "800",
    },
    aiInsightText: {
        fontSize: 14,
        lineHeight: 22,
        fontStyle: "italic",
    },
    aiInsightBtn: {
        marginTop: 16,
        alignSelf: "flex-start",
    },
    histogramList: {
        marginTop: 16,
        gap: 12,
    },
    histogramRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    histLabel: {
        width: 30,
        fontSize: 12,
        fontWeight: "600",
    },
    histBar: {
        height: 12,
        borderRadius: 6,
    },
    peakTimeText: {
        fontSize: 18,
        fontWeight: "800",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 24,
        lineHeight: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    }
});