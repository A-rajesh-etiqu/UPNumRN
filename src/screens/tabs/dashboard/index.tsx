import React, { useEffect } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
    Modal,
    TextInput,
    TouchableOpacity,
    Alert,
    Platform,
    useWindowDimensions,
    ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { openBrowserAuth, openBrowser } from "../../../utils/browser";
import { Linking } from "react-native";
import { setuService } from "../../../services/setu.service";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { LineChart } from "react-native-gifted-charts";

import DashboardLayout from "../../../components/layout/DashboardLayout";
import { useDashboardStore } from "../../../store/dashboard.store";
import { useAppTheme, Spacing } from "../../../theme";
import { useAuthStore } from "../../../store/auth.store";
import apiClient from "../../../api/apiClient";
import { useLocalSearchParams, router } from "../../../navigation/RootNavigation";

export default function DashboardScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const { user, updateUser, logout } = useAuthStore();
    const { colors } = useAppTheme();

    const [isSyncModalVisible, setIsSyncModalVisible] = React.useState(false);
    const [isProfileMenuVisible, setIsProfileMenuVisible] = React.useState(false);
    const [phoneNumber, setPhoneNumber] = React.useState("");
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState("Overview");

    const handleSyncSubmit = async () => {
        console.log("Sync submit clicked with phone:", phoneNumber);
        if (!phoneNumber) {
            Alert.alert("Error", "Please enter your phone number");
            return;
        }

        setIsSyncing(true);
        try {
            console.log("Current user:", user);
            const requestUserId = user?.id || "user-1";

            const redirectUrl = Platform.OS === 'web' 
                ? ((globalThis as any).window?.location?.origin || '') + '/tabs/dashboard'
                : 'upnumrn://tabs/dashboard';

            console.log("Calling createConsent API with redirectUrl:", redirectUrl);
            const response = await setuService.createConsent({
                userId: requestUserId,
                vua: `${phoneNumber}@setu`,
                consentDetail: {},
                redirectUrl: redirectUrl
            });
            console.log("createConsent Response:", response);

            if (response.data?.url) {
                // Hide modal and open browser
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
            console.error("Setu Sync Error: ", error);
            Alert.alert("Error", error.message || "Failed to start sync");
        } finally {
            setIsSyncing(false);
        }
    };


    const { data, loading, loadDashboard } = useDashboardStore();
    const params = useLocalSearchParams();

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
        loadDashboard(user?.id);
    }, [user?.id]);

    useEffect(() => {
        const syncProfile = async () => {
            try {
                const response = await apiClient.get(`/profile?userId=${user?.id}`);
                if (response.data && response.data.profile) {
                    updateUser(response.data.profile);
                }
            } catch (err) {
                console.warn("Failed to sync profile status:", err);
            }
        };
        if (user?.id) {
            syncProfile();
        }
    }, [user?.id]);

    if (loading) {
        return (
            <DashboardLayout>
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 80 }} />
            </DashboardLayout>
        );
    }

    const chartData1 = [
        { value: 15000, label: '01 May' },
        { value: 20000, label: '' },
        { value: 30000, label: '06 May' },
        { value: 28000, label: '' },
        { value: 30000, label: '' },
        { value: 22000, label: '11 May' },
        { value: 38000, label: '' },
        { value: 22000, label: '16 May' },
        { value: 38000, label: '' },
        { value: 40000, label: '21 May' },
        { value: 30000, label: '' },
        { value: 40000, label: '26 May' },
        { value: 45000, label: '' },
        { value: 32000, label: '31 May' },
    ];
    
    const chartData2 = [
        { value: 7500, label: '01 May' },
        { value: 12500, label: '' },
        { value: 17500, label: '06 May' },
        { value: 20000, label: '' },
        { value: 15000, label: '' },
        { value: 17500, label: '11 May' },
        { value: 22500, label: '' },
        { value: 15000, label: '16 May' },
        { value: 22500, label: '' },
        { value: 25000, label: '21 May' },
        { value: 22500, label: '' },
        { value: 32500, label: '26 May' },
        { value: 35000, label: '' },
        { value: 25000, label: '31 May' },
    ];

    return (
        <DashboardLayout>
            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={{ flex: 1 }}>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.pageTitle}>AI Insights</Text>
                        <Ionicons name="sparkles" size={24} color="#6C2CF4" style={{ marginLeft: 6 }} />
                    </View>
                    <Text style={styles.pageSubtitle}>Smart insights and recommendations{"\n"}to grow your business</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.syncBtn} onPress={() => setIsSyncModalVisible(true)}>
                        <Text style={styles.syncBtnText}>Sync Data</Text>
                        <Ionicons name="refresh-outline" size={14} color="#FFF" />
                    </TouchableOpacity>
                    {/* User Avatar */}
                    <View style={{ position: "relative" }}>
                        <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)} style={styles.avatarCircle}>
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

            {/* Filters */}
            <View style={styles.filtersRow}>
                <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.filterText}>01 May, 2024 - 31 May, 2024</Text>
                    <Ionicons name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
                    <Ionicons name="bar-chart-outline" size={14} color="#64748B" />
                    <Text style={styles.filterText}>Compare</Text>
                    <Ionicons name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* Time Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={styles.tabsRow}>
                    {["Overview", "Day", "Week", "Month", "Quarter", "Year"].map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
                {/* Total Sales */}
                <View style={[styles.kpiCard, { backgroundColor: "#F9F5FF" }]}>
                    <View style={styles.kpiCardTop}>
                        <View style={styles.kpiContent}>
                            <View style={[styles.kpiIconBox, { backgroundColor: "#F0E7FF" }]}>
                                <Ionicons name="cash-outline" size={16} color="#6C2CF4" />
                            </View>
                            <Text style={styles.kpiTitle}>Total Sales</Text>
                            <Text style={styles.kpiValue}>₹ 2,45,980</Text>
                            <Text style={styles.kpiTrendUp}>↑ 18.6%</Text>
                            <Text style={styles.kpiDesc}>vs Apr 01 - Apr 30</Text>
                        </View>
                        <View style={styles.kpiGraphic}>
                            <Svg width="100%" height="80" viewBox="0 0 100 80">
                                <Defs>
                                    <SvgGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                                        <Stop offset="0%" stopColor="#6C2CF4" stopOpacity="0.2" />
                                        <Stop offset="100%" stopColor="#6C2CF4" stopOpacity="0" />
                                    </SvgGradient>
                                </Defs>
                                <Path d="M0,60 L20,40 L40,50 L60,30 L80,40 L100,10 L100,80 L0,80 Z" fill="url(#gradPurple)" />
                                <Path d="M0,60 L20,40 L40,50 L60,30 L80,40 L100,10" fill="none" stroke="#6C2CF4" strokeWidth="2" />
                            </Svg>
                        </View>
                    </View>
                    <View style={styles.kpiFooter}>
                        <Text style={[styles.viewDetailsText, { color: "#6C2CF4" }]}>View Details</Text>
                        <Ionicons name="chevron-forward" size={14} color="#6C2CF4" />
                    </View>
                </View>

                {/* Total Transactions */}
                <View style={[styles.kpiCard, { backgroundColor: "#FFF7ED" }]}>
                    <View style={styles.kpiCardTop}>
                        <View style={styles.kpiContent}>
                            <View style={[styles.kpiIconBox, { backgroundColor: "#FFEDD5" }]}>
                                <Ionicons name="swap-horizontal" size={16} color="#F97316" />
                            </View>
                            <Text style={styles.kpiTitle}>Total Transactions</Text>
                            <Text style={styles.kpiValue}>1,248</Text>
                            <Text style={styles.kpiTrendUp}>↑ 12.4%</Text>
                            <Text style={styles.kpiDesc}>vs Apr 01 - Apr 30</Text>
                        </View>
                        <View style={styles.kpiGraphic}>
                            <Svg width="100%" height="80" viewBox="0 0 100 80">
                                <Defs>
                                    <SvgGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                                        <Stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
                                        <Stop offset="100%" stopColor="#F97316" stopOpacity="0" />
                                    </SvgGradient>
                                </Defs>
                                <Path d="M0,70 L25,50 L50,60 L75,30 L100,20 L100,80 L0,80 Z" fill="url(#gradOrange)" />
                                <Path d="M0,70 L25,50 L50,60 L75,30 L100,20" fill="none" stroke="#F97316" strokeWidth="2" />
                            </Svg>
                        </View>
                    </View>
                    <View style={styles.kpiFooter}>
                        <Text style={[styles.viewDetailsText, { color: "#F97316" }]}>View Details</Text>
                        <Ionicons name="chevron-forward" size={14} color="#F97316" />
                    </View>
                </View>

                {/* New Customers */}
                <View style={[styles.kpiCard, { backgroundColor: "#F0F9FF" }]}>
                    <View style={styles.kpiCardTop}>
                        <View style={styles.kpiContent}>
                            <View style={[styles.kpiIconBox, { backgroundColor: "#E0F2FE" }]}>
                                <Ionicons name="person-outline" size={16} color="#0EA5E9" />
                            </View>
                            <Text style={styles.kpiTitle}>New Customers</Text>
                            <Text style={styles.kpiValue}>312</Text>
                            <Text style={styles.kpiTrendUp}>↑ 15.7%</Text>
                            <Text style={styles.kpiDesc}>vs Apr 01 - Apr 30</Text>
                        </View>
                        <View style={[styles.kpiGraphic, { justifyContent: "center", alignItems: "center" }]}>
                            <View style={styles.glowBlue} />
                            <Ionicons name="people" size={48} color="#38BDF8" style={{ position: 'absolute' }} />
                        </View>
                    </View>
                    <View style={styles.kpiFooter}>
                        <Text style={[styles.viewDetailsText, { color: "#0EA5E9" }]}>View Details</Text>
                        <Ionicons name="chevron-forward" size={14} color="#0EA5E9" />
                    </View>
                </View>

                {/* Avg. Order Value */}
                <View style={[styles.kpiCard, { backgroundColor: "#F0FDF4" }]}>
                    <View style={styles.kpiCardTop}>
                        <View style={styles.kpiContent}>
                            <View style={[styles.kpiIconBox, { backgroundColor: "#DCFCE7" }]}>
                                <Ionicons name="stats-chart" size={16} color="#22C55E" />
                            </View>
                            <Text style={styles.kpiTitle}>Avg. Order Value</Text>
                            <Text style={styles.kpiValue}>₹ 197.10</Text>
                            <Text style={styles.kpiTrendUp}>↑ 8.2%</Text>
                            <Text style={styles.kpiDesc}>vs Apr 01 - Apr 30</Text>
                        </View>
                        <View style={[styles.kpiGraphic, { justifyContent: "center", alignItems: "center" }]}>
                            <View style={styles.glowGreen} />
                            <Ionicons name="cart" size={48} color="#4ADE80" style={{ position: 'absolute' }} />
                        </View>
                    </View>
                    <View style={styles.kpiFooter}>
                        <Text style={[styles.viewDetailsText, { color: "#22C55E" }]}>View Details</Text>
                        <Ionicons name="chevron-forward" size={14} color="#22C55E" />
                    </View>
                </View>

                {/* Refunds (Half Width just like others) */}
                <View style={[styles.kpiCard, { backgroundColor: "#FEF2F2" }]}>
                    <View style={styles.kpiCardTop}>
                        <View style={styles.kpiContent}>
                            <View style={[styles.kpiIconBox, { backgroundColor: "#FEE2E2" }]}>
                                <Ionicons name="refresh" size={16} color="#EF4444" />
                            </View>
                            <Text style={styles.kpiTitle}>Refunds</Text>
                            <Text style={styles.kpiValue}>₹ 3,240</Text>
                            <Text style={styles.kpiTrendDown}>↓ 3.1%</Text>
                            <Text style={styles.kpiDesc}>vs Apr 01 - Apr 30</Text>
                        </View>
                        <View style={[styles.kpiGraphic, { justifyContent: "center", alignItems: "center" }]}>
                            <View style={styles.glowRed} />
                            <Ionicons name="wallet" size={40} color="#F87171" style={{ position: 'absolute' }} />
                        </View>
                    </View>
                    <View style={styles.kpiFooter}>
                        <Text style={[styles.viewDetailsText, { color: "#EF4444" }]}>View Details</Text>
                        <Ionicons name="chevron-forward" size={14} color="#EF4444" />
                    </View>
                </View>
            </View>

            {/* AI Insight for You */}
            <View style={styles.aiBanner}>
                <View style={styles.aiIconBox}>
                    <Ionicons name="hardware-chip" size={24} color="#FFF" />
                    <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                </View>
                <View style={styles.aiBannerContent}>
                    <Text style={styles.aiBannerTitle}>AI Insight for You</Text>
                    <Text style={styles.aiBannerText}>Sales are up 18.6% this month! 🎉{"\n"}Weekend sales show the highest growth.</Text>
                </View>
                <TouchableOpacity style={styles.aiBtn}>
                    <Text style={styles.aiBtnText}>View Insights</Text>
                    <Ionicons name="chevron-forward" size={12} color="#6C2CF4" />
                </TouchableOpacity>
            </View>

            {/* Chart Section */}
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.chartTitle}>Sales vs Amount</Text>
                        <Ionicons name="information-circle-outline" size={16} color="#94A3B8" />
                    </View>
                    <TouchableOpacity style={styles.chartDropdown}>
                        <Text style={styles.chartDropdownText}>Daily</Text>
                        <Ionicons name="chevron-down" size={12} color="#334155" />
                    </TouchableOpacity>
                </View>

                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: "#6C2CF4" }]} />
                        <Text style={styles.legendText}>Amount (₹)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: "#F97316" }]} />
                        <Text style={styles.legendText}>Transactions</Text>
                    </View>
                </View>

                <View style={[styles.chartWrapper, { overflow: 'hidden' }]}>
                    <LineChart
                        data={chartData1}
                        data2={chartData2}
                        height={200}
                        width={width - 80}
                        adjustToWidth={true}
                        showVerticalLines={false}
                        color1="#6C2CF4"
                        color2="#F97316"
                        dataPointsColor1="#6C2CF4"
                        dataPointsColor2="#F97316"
                        dataPointsRadius1={4}
                        dataPointsRadius2={4}
                        thickness1={2}
                        thickness2={2}
                        yAxisColor="#E2E8F0"
                        xAxisColor="#E2E8F0"
                        yAxisTextStyle={{ color: "#64748B", fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: "#64748B", fontSize: 10 }}
                        areaChart
                        areaChart2={false}
                        startFillColor1="#6C2CF4"
                        endFillColor1="#6C2CF4"
                        startOpacity1={0.3}
                        endOpacity1={0.0}
                        hideRules={false}
                        rulesColor="#F1F5F9"
                        yAxisLabelTexts={['0', '10K', '20K', '30K', '40K', '50K']}
                        maxValue={50000}
                        noOfSections={5}
                    />
                </View>
            </View>

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

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginTop: 20,
        marginBottom: 20,
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: "900",
        color: "#0F172A",
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 4,
        lineHeight: 18,
    },
    headerActions: {
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
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#94A3B8",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    filtersRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    filterBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 8,
    },
    filterText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#334155",
    },
    tabsRow: {
        flexDirection: "row",
        gap: 8,
        paddingBottom: 4,
    },
    tabBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tabBtnActive: {
        backgroundColor: "#6C2CF4",
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748B",
    },
    tabTextActive: {
        color: "#FFF",
    },
    kpiGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    kpiCard: {
        width: "48%",
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    kpiCardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    kpiContent: {
        flex: 1,
    },
    kpiGraphic: {
        width: 60,
        height: 80,
        marginLeft: 10,
    },
    kpiIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    kpiTitle: {
        fontSize: 11,
        fontWeight: "600",
        color: "#64748B",
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0F172A",
        marginBottom: 4,
    },
    kpiTrendUp: {
        fontSize: 10,
        fontWeight: "700",
        color: "#16A34A",
    },
    kpiTrendDown: {
        fontSize: 10,
        fontWeight: "700",
        color: "#DC2626",
    },
    kpiDesc: {
        fontSize: 9,
        color: "#94A3B8",
        marginTop: 2,
        marginBottom: 12,
    },
    kpiFooter: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
        paddingTop: 10,
    },
    viewDetailsText: {
        fontSize: 11,
        fontWeight: "700",
        marginRight: 4,
    },
    glowBlue: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#38BDF8",
        opacity: 0.2,
        transform: [{ scale: 1.5 }],
    },
    glowGreen: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#4ADE80",
        opacity: 0.2,
        transform: [{ scale: 1.5 }],
    },
    glowRed: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#F87171",
        opacity: 0.2,
        transform: [{ scale: 1.5 }],
    },
    aiBanner: {
        backgroundColor: "#F3E8FF",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    aiIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#6C2CF4",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    aiBadge: {
        position: "absolute",
        bottom: -4,
        right: -4,
        backgroundColor: "#FFF",
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    aiBadgeText: {
        fontSize: 8,
        fontWeight: "800",
        color: "#6C2CF4",
    },
    aiBannerContent: {
        flex: 1,
        marginLeft: 16,
    },
    aiBannerTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#6C2CF4",
        marginBottom: 4,
    },
    aiBannerText: {
        fontSize: 12,
        color: "#475569",
        lineHeight: 18,
    },
    aiBtn: {
        backgroundColor: "#FFF",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    aiBtnText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#6C2CF4",
        marginRight: 4,
    },
    chartCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    chartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0F172A",
    },
    chartDropdown: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    chartDropdownText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#334155",
    },
    legendRow: {
        flexDirection: "row",
        marginBottom: 16,
        gap: 16,
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
        fontSize: 11,
        fontWeight: "600",
        color: "#64748B",
    },
    chartWrapper: {
        marginTop: 10,
        marginLeft: -10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        width: "100%",
        maxWidth: 400,
        borderRadius: 12,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
    },
    modalBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    dropdownOverlay: {
        flex: 1,
    },
    profileDropdown: {
        position: "absolute",
        top: Platform.OS === 'web' ? 70 : 80,
        right: 20,
        width: 160,
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 10,
    },
    dropdownText: {
        fontSize: 14,
        fontWeight: "600",
    },
    dropdownDivider: {
        height: 1,
        width: "100%",
        marginVertical: 4,
    },
});