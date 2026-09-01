import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    TextInput,
    SafeAreaView,
    Platform,
    ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Path, Circle, Rect, Line, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from "react-native-svg";
import { useAppTheme, Radius, Spacing, Shadows, Typography } from "../../theme";
import { router } from "../../navigation/RootNavigation";
import { useAuthStore } from "../../store/auth.store";
import apiClient from "../../api/apiClient";

const ADMIN_MENU_MAIN = [
    { title: "Dashboard", icon: "grid-outline" as const },
    { title: "Users", icon: "people-outline" as const },
    { title: "Businesses", icon: "briefcase-outline" as const },
    { title: "Transactions", icon: "swap-horizontal-outline" as const },
    { title: "Subscriptions", icon: "card-outline" as const },
    { title: "Payments", icon: "wallet-outline" as const },
    { title: "Reports", icon: "bar-chart-outline" as const },
    { title: "Disputes & Refunds", icon: "alert-circle-outline" as const },
    { title: "Announcements", icon: "megaphone-outline" as const },
];

const ADMIN_MENU_SYSTEM = [
    { title: "Plans & Pricing", icon: "cash-outline" as const },
    { title: "Features", icon: "list-outline" as const },
    { title: "Coupons & Offers", icon: "pricetag-outline" as const },
    { title: "Taxes & Fees", icon: "receipt-outline" as const },
    { title: "Integrations", icon: "git-branch-outline" as const },
    { title: "System Logs", icon: "terminal-outline" as const },
];

const ADMIN_MENU_SETTINGS = [
    { title: "Admins & Roles", icon: "shield-outline" as const },
    { title: "General Settings", icon: "settings-outline" as const },
];

export default function PlatformAdminDashboard() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const { logout } = useAuthStore();
    const { colors, isDark } = useAppTheme();

    const [activeTab, setActiveTab] = useState("Dashboard");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Edit user form fields state
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editMobile, setEditMobile] = useState("");
    const [editPlan, setEditPlan] = useState("");
    const [editStatus, setEditStatus] = useState("");

    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await apiClient.get("/admin/users");
            setUsers(response.data);
        } catch (err: any) {
            console.warn("Failed to fetch users from database, falling back to mock:", err.message);
            // fallback mock data
            setUsers([
                { id: "user-1", name: "Amit Sharma", type: "Individual", email: "amit@example.com", mobile: "8888888888", joined: "31 May 2024", status: "Active", volume: "₹12.4 Lakhs", plan: "lifetime", planStatus: "ACTIVE", transactions: "342" },
                { id: "user-2", name: "Neha Patel", type: "Individual", email: "neha.patel@example.com", mobile: "7777777777", joined: "31 May 2024", status: "Active", volume: "₹8.2 Lakhs", plan: "lifetime", planStatus: "ACTIVE", transactions: "219" },
                { id: "user-3", name: "Bright Retailers", type: "Business", email: "contact@brightretailers.in", mobile: "6666666666", joined: "30 May 2024", status: "Active", volume: "₹45.6 Lakhs", plan: "lifetime", planStatus: "ACTIVE", transactions: "1,245" },
                { id: "user-4", name: "Tech Consultants", type: "Business", email: "info@techconsultants.in", mobile: "5555555555", joined: "30 May 2024", status: "Blocked", volume: "₹18.9 Lakhs", plan: "lifetime", planStatus: "ACTIVE", transactions: "560" },
                { id: "user-5", name: "Rahul Verma", type: "Individual", email: "rahul.verma@example.com", mobile: "4444444444", joined: "29 May 2024", status: "Trial", volume: "₹1.2 Lakhs", plan: "free-trial", planStatus: "TRIAL", transactions: "45" },
            ]);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleLogout = () => {
        logout();
        router.replace("/auth/login");
    };


    const handleOpenModal = (user: any) => {
        setSelectedUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditMobile(user.mobile);
        setEditPlan(user.plan);
        setEditStatus(user.status);
    };

    const toggleUserStatus = async (userId: string) => {
        const u = users.find(x => x.id === userId);
        if (!u) return;
        const nextStatus = u.status === "Blocked" ? "Active" : "Blocked";
        try {
            await apiClient.put(`/admin/users/${userId}`, {
                name: u.name,
                email: u.email,
                mobile: u.mobile,
                status: nextStatus,
                plan: u.plan,
                planStatus: u.planStatus
            });
            fetchUsers();
        } catch (err: any) {
            console.error("Toggle User Status Error:", err);
            alert("Failed to toggle status: " + err.message);
        }
    };

    const handleSaveChanges = async () => {
        if (!selectedUser) return;
        try {
            await apiClient.put(`/admin/users/${selectedUser.id}`, {
                name: editName,
                email: editEmail,
                mobile: editMobile,
                status: editStatus,
                plan: editPlan,
                planStatus: editPlan === "free-trial" ? "TRIAL" : "ACTIVE"
            });

            await fetchUsers();
            setSelectedUser(null);
            alert("User profile and subscription modified successfully!");
        } catch (err: any) {
            console.error("Save Changes Error:", err);
            alert("Failed to save changes: " + err.message);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.plan.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === "All" || u.status.toLowerCase() === selectedStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    // Render Admin Left Sidebar
    const renderAdminSidebar = () => (
        <View style={[styles.sidebar, { backgroundColor: isDark ? colors.surface : "#111827", borderRightColor: colors.border }]}>
            <View>
                {/* Logo and Tagline */}
                <View style={styles.logoRow}>
                    <Svg width="36" height="36" viewBox="0 0 32 32">
                        <Defs>
                            <SvgGradient id="orangeGradAdmin" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0%" stopColor="#FB923C" />
                                <Stop offset="100%" stopColor="#EA580C" />
                            </SvgGradient>
                            <SvgGradient id="purpleGradAdmin" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0%" stopColor="#C084FC" />
                                <Stop offset="100%" stopColor="#6B21A8" />
                            </SvgGradient>
                        </Defs>
                        <Path d="M 4 20 L 16 22 L 12 28 Z" fill="#4C1D95" />
                        <Path d="M 4 20 L 28 6 L 16 22 Z" fill="url(#orangeGradAdmin)" />
                        <Path d="M 16 22 L 28 6 L 22 28 Z" fill="url(#purpleGradAdmin)" />
                        <Path d="M 26 2 Q 26 4 24 4 Q 26 4 26 6 Q 26 4 28 4 Q 26 4 26 2 Z" fill="#FB923C" />
                        <Path d="M 30 6 Q 30 7.5 28.5 7.5 Q 30 7.5 30 9 Q 30 7.5 31.5 7.5 Q 30 7.5 30 6 Z" fill="#FDBA74" />
                    </Svg>
                    <View style={styles.logoTextContainer}>
                        <Text style={styles.logoText}>UP Num</Text>
                        <Text style={styles.logoSub}>Track. Analyze. Grow.</Text>
                    </View>
                </View>

                {/* Section MAIN */}
                <Text style={styles.sidebarSectionHeader}>MAIN</Text>
                <View style={styles.sidebarMenuBlock}>
                    {ADMIN_MENU_MAIN.map((item, idx) => {
                        const isActive = activeTab === item.title;
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.sidebarBtn, isActive && { backgroundColor: colors.primary }]}
                                onPress={() => setActiveTab(item.title)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.sidebarBtnInner}>
                                    <Ionicons name={item.icon} size={18} color={isActive ? "#FFFFFF" : "#94A3B8"} />
                                    <Text style={[styles.sidebarBtnText, isActive && styles.sidebarBtnTextActive]}>
                                        {item.title}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Section SYSTEM */}
                <Text style={styles.sidebarSectionHeader}>SYSTEM</Text>
                <View style={styles.sidebarMenuBlock}>
                    {ADMIN_MENU_SYSTEM.map((item, idx) => {
                        const isActive = activeTab === item.title;
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.sidebarBtn, isActive && { backgroundColor: colors.primary }]}
                                onPress={() => setActiveTab(item.title)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.sidebarBtnInner}>
                                    <Ionicons name={item.icon} size={18} color={isActive ? "#FFFFFF" : "#94A3B8"} />
                                    <Text style={[styles.sidebarBtnText, isActive && styles.sidebarBtnTextActive]}>{item.title}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Section SETTINGS */}
                <Text style={styles.sidebarSectionHeader}>SETTINGS</Text>
                <View style={styles.sidebarMenuBlock}>
                    {ADMIN_MENU_SETTINGS.map((item, idx) => {
                        const isActive = activeTab === item.title;
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.sidebarBtn, isActive && { backgroundColor: colors.primary }]}
                                onPress={() => setActiveTab(item.title)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.sidebarBtnInner}>
                                    <Ionicons name={item.icon} size={18} color={isActive ? "#FFFFFF" : "#94A3B8"} />
                                    <Text style={[styles.sidebarBtnText, isActive && styles.sidebarBtnTextActive]}>{item.title}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Bottom Status Box */}
            <View>
                <View style={styles.statusBox}>
                    <View style={styles.statusDotRow}>
                        <View style={styles.greenDot} />
                        <Text style={styles.statusBoxTitle}>Platform Status</Text>
                    </View>
                    <Text style={styles.statusBoxText}>All Systems Operational</Text>
                    <Text style={styles.statusBoxTime}>Last checked: 2 mins ago</Text>
                </View>

                {/* Logout Button */}
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
                    <Ionicons name="log-out-outline" size={16} color="#FF5252" />
                    <Text style={styles.logoutBtnText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Main dashboard view content
    const renderDashboardTab = () => (
        <View style={{ flex: 1 }}>
            {/* Mobile Welcome Text (Hidden on desktop as it's in the main header) */}
            {!isDesktop && (
                <View style={{ marginBottom: 20 }}>
                    <Text style={[styles.headerTitle, { color: colors.text, fontSize: 22 }]}>Welcome back, Admin!</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary, marginTop: 4 }]}>Here's what's happening on UP Num.</Text>
                </View>
            )}

            {/* Filters & Export Row */}
            <View style={[styles.filtersExportRow, isDesktop ? styles.rowLayout : { flexDirection: "column", gap: 12 }]}>
                <View style={{ flexDirection: isDesktop ? "row" : "row", gap: 10, flexWrap: "wrap" }}>
                    <TouchableOpacity style={[styles.filterDropdownBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.filterDropdownText, { color: colors.text }]}>01 May, 2024 - 31 May, 2024</Text>
                        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterDropdownBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                        <Text style={[styles.filterDropdownText, { color: colors.text }]}>Compare: Previous Period</Text>
                        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.exportReportBtn, { width: isDesktop ? "auto" : "100%" }]} activeOpacity={0.8}>
                    <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.exportReportText}>Export Report</Text>
                </TouchableOpacity>
            </View>

            {/* Top KPIs Row */}
            <View style={[styles.kpisRow, isDesktop ? styles.rowLayout : { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }]}>
                {[
                    { title: "Total Users", value: "24,568", change: "+12.4%", desc: "vs Apr 01 - Apr 30", color: "#6C2CF4", bg: "#F5F3FF", icon: "people-outline" as const },
                    { title: "Total Businesses", value: "3,245", change: "+15.7%", desc: "vs Apr 01 - Apr 30", color: "#3B82F6", bg: "#EFF6FF", icon: "briefcase-outline" as const },
                    { title: "Total Transactions", value: "1,24,86,312", change: "+18.6%", desc: "vs Apr 01 - Apr 30", color: "#00C853", bg: "#ECFDF5", icon: "shield-checkmark-outline" as const },
                    { title: "Total Volume (₹)", value: "₹ 320.45 Cr", change: "+21.3%", desc: "vs Apr 01 - Apr 30", color: "#FF7A00", bg: "#FFF7ED", icon: "cash-outline" as const },
                    { title: "Total Revenue (₹)", value: "₹ 48.75 Lakh", change: "+16.2%", desc: "vs Apr 01 - Apr 30", color: "#EF4444", bg: "#FEF2F2", icon: "card-outline" as const },
                ].map((kpi, idx) => (
                    <View key={idx} style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border, width: isDesktop ? 190 : "48%" }]}>
                        <View style={styles.kpiCardHeader}>
                            <View style={[styles.kpiIconCircle, { backgroundColor: kpi.bg }]}>
                                <Ionicons name={kpi.icon} size={20} color={kpi.color} />
                            </View>
                            <View style={styles.kpiTrendBadge}>
                                <Ionicons name="trending-up" size={10} color="#00C853" />
                                <Text style={styles.kpiTrendText}>{kpi.change}</Text>
                            </View>
                        </View>
                        <Text style={[styles.kpiCardValue, { color: colors.text }]}>{kpi.value}</Text>
                        <Text style={[styles.kpiCardTitle, { color: colors.textSecondary }]}>{kpi.title}</Text>
                        <Text style={styles.kpiCardDesc}>{kpi.desc}</Text>
                    </View>
                ))}
            </View>

            {/* Charts & Status Section */}
            <View style={[styles.gridRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                {/* Left: Transactions Overview Line Chart */}
                <View style={[styles.gridCard, { flex: 1.6, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Transactions Overview</Text>
                        <TouchableOpacity style={[styles.timeDropdownBtn, { borderColor: colors.border }]} activeOpacity={0.8}>
                            <Text style={[styles.timeDropdownText, { color: colors.textSecondary }]}>Daily</Text>
                            <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: "#6C2CF4" }]} />
                            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Volume (₹)</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: "#FF7A00" }]} />
                            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Transactions</Text>
                        </View>
                    </View>
                    <View style={styles.chartWrapper}>
                        <Svg height="100%" width="100%" viewBox="0 0 450 160">
                            <Line x1="0" y1="20" x2="450" y2="20" stroke={colors.border} strokeWidth="1" />
                            <Line x1="0" y1="50" x2="450" y2="50" stroke={colors.border} strokeWidth="1" />
                            <Line x1="0" y1="85" x2="450" y2="85" stroke={colors.border} strokeWidth="1" />
                            <Line x1="0" y1="120" x2="450" y2="120" stroke={colors.border} strokeWidth="1" />
                            <Line x1="0" y1="150" x2="450" y2="150" stroke={colors.border} strokeWidth="1.5" />

                            <SvgText x="10" y="170" fill={colors.textSecondary} fontSize="9">01 May</SvgText>
                            <SvgText x="85" y="170" fill={colors.textSecondary} fontSize="9">06 May</SvgText>
                            <SvgText x="160" y="170" fill={colors.textSecondary} fontSize="9">11 May</SvgText>
                            <SvgText x="235" y="170" fill={colors.textSecondary} fontSize="9">16 May</SvgText>
                            <SvgText x="310" y="170" fill={colors.textSecondary} fontSize="9">21 May</SvgText>
                            <SvgText x="385" y="170" fill={colors.textSecondary} fontSize="9">26 May</SvgText>
                            <SvgText x="430" y="170" fill={colors.textSecondary} fontSize="9">31 May</SvgText>

                            <Path d="M 0,110 C 40,80 60,95 100,60 C 140,40 170,110 210,65 C 250,30 280,15 320,40 C 360,70 400,10 450,5" fill="none" stroke="#6C2CF4" strokeWidth="3" />
                            <Path d="M 0,135 C 40,105 60,115 100,90 C 140,75 170,125 210,95 C 250,65 280,45 320,70 C 360,95 400,50 450,35" fill="none" stroke="#FF7A00" strokeWidth="2.5" strokeDasharray="3 3" />
                        </Svg>
                    </View>
                </View>

                {/* Center: Donut Chart - User by Type */}
                <View style={[styles.gridCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>User By Type</Text>
                    <View style={styles.donutWrapper}>
                        <Svg width="110" height="110" viewBox="0 0 36 36">
                            <Circle cx="18" cy="18" r="15.915" fill="none" stroke={colors.border} strokeWidth="3.5" />
                            <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#6C2CF4" strokeWidth="3.5" strokeDasharray="74.3 25.7" strokeDashoffset="100" />
                            <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="3.5" strokeDasharray="24.4 75.6" strokeDashoffset="25.7" />
                            <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#FF7A00" strokeWidth="3.5" strokeDasharray="1.3 98.7" strokeDashoffset="1.3" />
                        </Svg>
                        <View style={styles.donutLabels}>
                            <Text style={[styles.donutVal, { color: colors.text }]}>24,568</Text>
                            <Text style={[styles.donutSub, { color: colors.textSecondary }]}>Total Users</Text>
                        </View>
                    </View>
                    <View style={styles.donutLegends}>
                        <View style={styles.donutLegendItem}>
                            <View style={[styles.legendDot, { backgroundColor: "#6C2CF4" }]} />
                            <Text style={[styles.donutLegendLabel, { color: colors.textSecondary }]}>Individual</Text>
                            <Text style={[styles.donutLegendVal, { color: colors.text }]}>18,245 (74.3%)</Text>
                        </View>
                        <View style={styles.donutLegendItem}>
                            <View style={[styles.legendDot, { backgroundColor: "#3B82F6" }]} />
                            <Text style={[styles.donutLegendLabel, { color: colors.textSecondary }]}>Business</Text>
                            <Text style={[styles.donutLegendVal, { color: colors.text }]}>5,987 (24.4%)</Text>
                        </View>
                        <View style={styles.donutLegendItem}>
                            <View style={[styles.legendDot, { backgroundColor: "#FF7A00" }]} />
                            <Text style={[styles.donutLegendLabel, { color: colors.textSecondary }]}>Admin</Text>
                            <Text style={[styles.donutLegendVal, { color: colors.text }]}>336 (1.3%)</Text>
                        </View>
                    </View>
                </View>

                {/* Right: Subscription Status */}
                <View style={[styles.gridCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Subscription Status</Text>
                    <View style={styles.subStatusList}>
                        {[
                            { label: "Active", count: "21,452", pct: "87.3%", color: "#00C853" },
                            { label: "Trial", count: "2,156", pct: "8.8%", color: "#6C2CF4" },
                            { label: "Expired", count: "568", pct: "2.3%", color: "#FFC107" },
                            { label: "Cancelled", count: "392", pct: "1.6%", color: "#FF5252" },
                        ].map((item, idx) => (
                            <View key={idx} style={styles.subStatusRow}>
                                <View style={styles.subStatusDotRow}>
                                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                    <Text style={[styles.subStatusLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                                </View>
                                <Text style={[styles.subStatusVal, { color: colors.text }]}>{item.count} <Text style={{ color: "#94A3B8" }}>({item.pct})</Text></Text>
                            </View>
                        ))}
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab("Subscriptions")} style={[styles.viewAllBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                        <Text style={[styles.viewAllBtnText, { color: colors.text }]}>View All</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Users table & revenue segment */}
            <View style={[styles.gridRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                {/* Left: Recent Users */}
                <View style={[styles.gridCard, { flex: 1.6, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Users</Text>
                        <TouchableOpacity onPress={() => setActiveTab("Users")} activeOpacity={0.8}>
                            <Text style={styles.blueLinkText}>View All Users</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: "100%" }}>
                        <View style={styles.adminTable}>
                            <View style={[styles.adminTableHeader, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.tableHeadCell, { width: 120 }]}>User</Text>
                                <Text style={[styles.tableHeadCell, { width: 90 }]}>Type</Text>
                                <Text style={[styles.tableHeadCell, { width: 150 }]}>Email</Text>
                                <Text style={[styles.tableHeadCell, { width: 100 }]}>Joined On</Text>
                                <Text style={[styles.tableHeadCell, { width: 70, textAlign: "right" }]}>Status</Text>
                            </View>
                            {loadingUsers ? (
                                <ActivityIndicator size="small" color={colors.primary} style={{ margin: 20 }} />
                            ) : (
                                users.slice(0, 5).map((row, idx) => (
                                    <View key={idx} style={[styles.adminTableRow, { borderBottomColor: colors.border }]}>
                                        <View style={[styles.avatarNameCell, { width: 120 }]}>
                                            <View style={[styles.smallAvatar, { backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center" }]}>
                                                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "700" }}>{row.name[0]}</Text>
                                            </View>
                                            <Text style={[styles.tableNameText, { color: colors.text }]}>{row.name}</Text>
                                        </View>
                                        <Text style={[styles.tableCellText, { width: 90, color: colors.text }]}>{row.type}</Text>
                                        <Text style={[styles.tableCellText, { width: 150, color: colors.textSecondary }]}>{row.email}</Text>
                                        <Text style={[styles.tableCellText, { width: 100, color: colors.text }]}>{row.joined}</Text>
                                        <View style={{ width: 70, alignItems: "flex-end" }}>
                                            <View style={[styles.miniStatusBadge, row.status === "Blocked" ? styles.bgWarning : styles.bgSuccess]}>
                                                <Text style={[styles.miniStatusText, row.status === "Blocked" ? styles.txtWarning : styles.txtSuccess]}>
                                                    {row.status}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>
                </View>

                {/* Center: Revenue Overview */}
                <View style={[styles.gridCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Revenue Overview</Text>
                        <TouchableOpacity onPress={() => setActiveTab("Reports")} activeOpacity={0.8}>
                            <Text style={styles.blueLinkText}>View Report</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ gap: 14 }}>
                        <View>
                            <Text style={[styles.revenueTitle, { color: colors.textSecondary }]}>Total Revenue</Text>
                            <View style={styles.revValRow}>
                                <Text style={[styles.revenueAmt, { color: colors.text }]}>₹ 48.75 Lakh</Text>
                                <View style={styles.revTrendBadge}>
                                    <Ionicons name="trending-up" size={10} color="#00C853" />
                                    <Text style={styles.revTrendText}>16.2%</Text>
                                </View>
                            </View>
                            <Text style={styles.revenueSub}>vs Apr 01 - Apr 30</Text>
                        </View>
                        <View style={{ height: 40 }}>
                            <Svg width="100%" height="40" viewBox="0 0 200 40">
                                <Path d="M 0,35 C 30,25 50,30 80,15 C 110,8 140,25 170,12 L 200,5" fill="none" stroke="#6C2CF4" strokeWidth="2.5" />
                            </Svg>
                        </View>
                        <View style={[styles.revSplitRow, { borderTopColor: colors.border }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.splitLabel, { color: colors.textSecondary }]}>From Subscriptions</Text>
                                <Text style={[styles.splitValue, { color: colors.text }]}>₹ 42.10 Lakh</Text>
                                <Text style={styles.splitTrend}>↑ 14.8%</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.splitLabel, { color: colors.textSecondary }]}>From Other Sources</Text>
                                <Text style={[styles.splitValue, { color: colors.text }]}>₹ 6.65 Lakh</Text>
                                <Text style={[styles.splitTrend, { color: "#00C853" }]}>↑ 22.1%</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Right: Top UPI Apps */}
                <View style={[styles.gridCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Top UPI Apps <Text style={{ fontSize: 10, color: "#94A3B8" }}>(By Volume)</Text></Text>
                    <View style={styles.topAppsList}>
                        {[
                            { name: "Google Pay", vol: "₹ 125.40 Cr", share: "39.1%", color: "#6C2CF4" },
                            { name: "PhonePe", vol: "₹ 110.32 Cr", share: "34.4%", color: "#3B82F6" },
                            { name: "Paytm", vol: "₹ 52.18 Cr", share: "16.3%", color: "#00C853" },
                            { name: "BHIM", vol: "₹ 20.31 Cr", share: "6.3%", color: "#FF7A00" },
                            { name: "Amazon Pay", vol: "₹ 12.24 Cr", share: "3.9%", color: "#FF4D6D" },
                        ].map((app, idx) => (
                            <View key={idx} style={styles.appVolumeRow}>
                                <View style={styles.appVolumeLeft}>
                                    <View style={[styles.appColorCircle, { backgroundColor: app.color }]} />
                                    <Text style={[styles.appNameLabel, { color: colors.text }]}>{app.name}</Text>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={[styles.appVolumeAmt, { color: colors.text }]}>{app.vol}</Text>
                                    <Text style={[styles.appVolumeShare, { color: colors.textSecondary }]}>{app.share}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab("Payments")} style={[styles.viewAllBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                        <Text style={[styles.viewAllBtnText, { color: colors.text }]}>View All</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* System Overview Footer Block */}
            <View style={[styles.systemOverviewCard, { backgroundColor: colors.surface, borderColor: colors.border, paddingHorizontal: isDesktop ? 20 : 0, paddingVertical: 20, borderWidth: isDesktop ? 1 : 0, borderRadius: isDesktop ? 16 : 0 }]}>
                <Text style={[styles.cardTitle, { color: colors.text, paddingHorizontal: isDesktop ? 0 : 16 }]}>System Overview</Text>
                {isDesktop ? (
                    <View style={styles.systemOverviewGrid}>
                        {[
                            { label: "Total Admins", val: "12", sub: "View All", icon: "shield-outline" as const, tab: "Admins & Roles" },
                            { label: "Active Admins", val: "9", sub: "View All", icon: "pulse-outline" as const, tab: "Admins & Roles" },
                            { label: "System Uptime", val: "99.98%", sub: "View Logs", icon: "hardware-chip-outline" as const, tab: "System Logs" },
                            { label: "Failed Transactions", val: "2,345", sub: "View Details", icon: "alert-circle-outline" as const, tab: "Transactions" },
                            { label: "Disputes Raised", val: "1,234", sub: "View Details", icon: "chatbubble-ellipses-outline" as const, tab: "Disputes & Refunds" },
                            { label: "Refunds Processed", val: "₹ 8.65 Lakh", sub: "View Details", icon: "refresh-outline" as const, tab: "Disputes & Refunds" },
                        ].map((sys, idx) => (
                            <View key={idx} style={[styles.systemCell, { width: "30%", minWidth: 140 }]}>
                                <View style={[styles.systemIconCircle, { backgroundColor: isDark ? colors.border : "#F5F3FF" }]}>
                                    <Ionicons name={sys.icon} size={18} color="#6C2CF4" />
                                </View>
                                <View>
                                    <Text style={[styles.systemCellLabel, { color: colors.textSecondary }]}>{sys.label}</Text>
                                    <Text style={[styles.systemCellVal, { color: colors.text }]}>{sys.val}</Text>
                                    <TouchableOpacity onPress={() => setActiveTab(sys.tab)} activeOpacity={0.8}>
                                        <Text style={styles.systemCellSub}>{sys.sub}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                        {[
                            { label: "Total Admins", val: "12", sub: "View All", icon: "shield-outline" as const, tab: "Admins & Roles", color: "#3B82F6", bg: "#EFF6FF" },
                            { label: "Active Admins", val: "9", sub: "View All", icon: "pulse-outline" as const, tab: "Admins & Roles", color: "#00C853", bg: "#ECFDF5" },
                            { label: "System Uptime", val: "99.98%", sub: "View Logs", icon: "hardware-chip-outline" as const, tab: "System Logs", color: "#00C853", bg: "#ECFDF5" },
                            { label: "Failed Transactions", val: "2,345", sub: "View Details", icon: "alert-circle-outline" as const, tab: "Transactions", color: "#EF4444", bg: "#FEF2F2" },
                            { label: "Disputes Raised", val: "1,234", sub: "View Details", icon: "chatbubble-ellipses-outline" as const, tab: "Disputes & Refunds", color: "#FF7A00", bg: "#FFF7ED" },
                            { label: "Refunds Processed", val: "₹ 8.65 Lakh", sub: "View Details", icon: "refresh-outline" as const, tab: "Disputes & Refunds", color: "#6C2CF4", bg: "#F5F3FF" },
                        ].map((sys, idx) => (
                            <View key={idx} style={[styles.systemCell, { width: 150, padding: 16, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, ...Shadows.sm }]}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                    <View style={[styles.systemIconCircle, { backgroundColor: isDark ? colors.border : sys.bg }]}>
                                        <Ionicons name={sys.icon} size={18} color={sys.color} />
                                    </View>
                                </View>
                                <View>
                                    <Text style={[styles.systemCellLabel, { color: colors.textSecondary }]}>{sys.label}</Text>
                                    <Text style={[styles.systemCellVal, { color: colors.text }]}>{sys.val}</Text>
                                    <TouchableOpacity onPress={() => setActiveTab(sys.tab)} activeOpacity={0.8} style={{ marginTop: 8 }}>
                                        <Text style={[styles.systemCellSub, { color: "#6C2CF4" }]}>{sys.sub}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    );

    // Users access management tab
    const renderUsersTab = () => (
        <View style={{ flex: 1 }}>
            {/* Search and filters */}
            <View style={[styles.filtersBar, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder="Search users by name, email or plan..."
                        placeholderTextColor={colors.placeholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[styles.searchBarInput, { color: colors.text }]}
                    />
                </View>

                <View style={styles.filtersLeft}>
                    {["All", "Active", "Trial", "Blocked"].map((status) => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setSelectedStatus(status)}
                            style={[
                                styles.filterPill,
                                { borderColor: colors.border, backgroundColor: colors.surface },
                                selectedStatus === status && { backgroundColor: colors.primary, borderColor: colors.primary }
                            ]}
                        >
                            <Text style={[
                                styles.filterPillText,
                                { color: selectedStatus === status ? "#FFFFFF" : colors.textSecondary }
                            ]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Users grid card list */}
            <View style={[styles.gridCard, { flex: 1, padding: 0, overflow: "hidden", backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: 900 }}>
                        {/* Header row */}
                        <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border, paddingHorizontal: 16 }]}>
                            <Text style={[styles.tableHeadCell, { width: 180, color: colors.textSecondary }]}>User</Text>
                            <Text style={[styles.tableHeadCell, { width: 220, color: colors.textSecondary }]}>Email</Text>
                            <Text style={[styles.tableHeadCell, { width: 120, color: colors.textSecondary }]}>Type</Text>
                            <Text style={[styles.tableHeadCell, { width: 140, color: colors.textSecondary }]}>Plan</Text>
                            <Text style={[styles.tableHeadCell, { width: 120, color: colors.textSecondary }]}>Total Volume</Text>
                            <Text style={[styles.tableHeadCell, { width: 100, color: colors.textSecondary }]}>Status</Text>
                            <Text style={[styles.tableHeadCell, { width: 120, color: colors.textSecondary, textAlign: "right" }]}>Actions</Text>
                        </View>

                        {/* Rows */}
                        {loadingUsers ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ margin: 40 }} />
                        ) : filteredUsers.length === 0 ? (
                            <View style={{ padding: 40, alignItems: "center" }}>
                                <Text style={{ color: colors.textSecondary }}>No users found matching your filters.</Text>
                            </View>
                        ) : (
                            filteredUsers.map((user) => (
                                <View key={user.id} style={[styles.tableRow, { borderBottomColor: colors.border, paddingHorizontal: 16 }]}>
                                    {/* Name + Avatar */}
                                    <View style={{ width: 180, flexDirection: "row", alignItems: "center", gap: 10 }}>
                                        <View style={[styles.avatarCircle, { backgroundColor: colors.primary + "15" }]}>
                                            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
                                                {user.name ? user.name[0] : "U"}
                                            </Text>
                                        </View>
                                        <Text style={[styles.tableNameText, { color: colors.text }]}>{user.name}</Text>
                                    </View>

                                    {/* Email */}
                                    <Text style={[styles.tableCellText, { width: 220, color: colors.textSecondary }]}>{user.email}</Text>

                                    {/* Type */}
                                    <Text style={[styles.tableCellText, { width: 120, color: colors.text }]}>{user.type}</Text>

                                    {/* Plan */}
                                    <Text style={[styles.tableCellText, { width: 140, color: colors.text }]}>{user.plan}</Text>

                                    {/* Volume */}
                                    <Text style={[styles.tableCellText, { width: 120, color: colors.text, fontWeight: "700" }]}>{user.volume}</Text>

                                    {/* Status */}
                                    <View style={{ width: 100 }}>
                                        <View style={[
                                            styles.miniStatusBadge,
                                            user.status === "Blocked" ? styles.bgWarning : styles.bgSuccess
                                        ]}>
                                            <Text style={[
                                                styles.miniStatusText,
                                                user.status === "Blocked" ? styles.txtWarning : styles.txtSuccess
                                            ]}>
                                                {user.status}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Actions */}
                                    <View style={{ width: 120, flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                                        <TouchableOpacity
                                            onPress={() => handleOpenModal(user)}
                                            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name="create-outline" size={14} color={colors.text} />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => toggleUserStatus(user.id)}
                                            style={[
                                                styles.actionBtn,
                                                {
                                                    backgroundColor: user.status === "Blocked" ? colors.success + "15" : colors.danger + "15",
                                                    borderColor: "transparent"
                                                }
                                            ]}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={user.status === "Blocked" ? "checkmark-circle-outline" : "ban-outline"}
                                                size={14}
                                                color={user.status === "Blocked" ? colors.success : colors.danger}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            </View>
        </View>
    );

    // Placeholder view for other tabs
    const renderPlaceholderTab = () => (
        <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: "center", padding: 40 }]}>
            <Ionicons name="construct-outline" size={48} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text, marginTop: 16 }]}>{activeTab} Management Panel</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 8, textAlign: "center", maxWidth: 400 }}>
                This section is fully mapped under super admin dashboard permissions. Complete module implementation is coming in the next build.
            </Text>
            <TouchableOpacity onPress={() => setActiveTab("Dashboard")} style={[styles.exportReportBtn, { marginTop: 20 }]}>
                <Text style={styles.exportReportText}>Return to Dashboard</Text>
            </TouchableOpacity>
        </View>
    );

    // Main layout renderer
    const renderAdminDashboardContent = () => {
        if (activeTab === "Dashboard") return renderDashboardTab();
        if (activeTab === "Users") return renderUsersTab();
        return renderPlaceholderTab();
    };

    // User Details Modal (Editable Form)
    const renderDetailModal = () => {
        if (!selectedUser) return null;
        return (
            <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Modify User & Subscription</Text>
                        <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.modalCloseBtn}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalBody}>
                        {/* Profile avatar row */}
                        <View style={styles.modalAvatarRow}>
                            <View style={[styles.modalAvatar, { backgroundColor: colors.primary + "15" }]}>
                                <Text style={[styles.modalAvatarText, { color: colors.primary }]}>{editName ? editName[0] : "U"}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.modalName, { color: colors.text }]}>{editName || "Unnamed User"}</Text>
                                <Text style={[styles.modalEmail, { color: colors.textSecondary }]}>{editEmail || "No Email"}</Text>
                            </View>
                        </View>
                        <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

                        {/* Editable Form Fields */}
                        <View style={{ gap: 12 }}>
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Full Name</Text>
                                <TextInput
                                    value={editName}
                                    onChangeText={setEditName}
                                    style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                                />
                            </View>

                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Email Address</Text>
                                <TextInput
                                    value={editEmail}
                                    onChangeText={setEditEmail}
                                    style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                                />
                            </View>

                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Mobile Number</Text>
                                <TextInput
                                    value={editMobile}
                                    onChangeText={setEditMobile}
                                    style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                                />
                            </View>

                            {/* Plan Selector Pills */}
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Subscription Plan</Text>
                                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                                    {["lifetime", "monthly", "free-trial"].map((planId) => {
                                        const label = planId === "lifetime" ? "Lifetime" : planId === "monthly" ? "Monthly" : "Trial";
                                        const isSelected = editPlan === planId;
                                        return (
                                            <TouchableOpacity
                                                key={planId}
                                                onPress={() => setEditPlan(planId)}
                                                style={[
                                                    styles.planSelectionPill,
                                                    { borderColor: colors.border, backgroundColor: colors.surface },
                                                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                                                ]}
                                            >
                                                <Text style={{ color: isSelected ? "#FFFFFF" : colors.textSecondary, fontSize: 11, fontWeight: "700" }}>
                                                    {label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Status Selector Pills */}
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Access Status</Text>
                                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                                    {["Active", "Blocked"].map((statusOption) => {
                                        const isSelected = editStatus === statusOption;
                                        return (
                                            <TouchableOpacity
                                                key={statusOption}
                                                onPress={() => setEditStatus(statusOption)}
                                                style={[
                                                    styles.statusSelectionPill,
                                                    { borderColor: colors.border, backgroundColor: colors.surface },
                                                    isSelected && {
                                                        backgroundColor: statusOption === "Blocked" ? colors.danger : colors.success,
                                                        borderColor: statusOption === "Blocked" ? colors.danger : colors.success
                                                    }
                                                ]}
                                            >
                                                <Text style={{ color: isSelected ? "#FFFFFF" : colors.textSecondary, fontSize: 11, fontWeight: "700" }}>
                                                    {statusOption}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>

                        <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

                        {/* Actions */}
                        <View style={styles.modalActionsRow}>
                            <TouchableOpacity
                                onPress={() => setSelectedUser(null)}
                                style={[styles.modalActionBtn, { backgroundColor: isDark ? colors.border : "#E2E8F0" }]}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.modalActionBtnText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveChanges}
                                style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalActionBtnText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={{ flex: 1, flexDirection: isDesktop ? "row" : "column" }}>
                {isDesktop && renderAdminSidebar()}

                {/* Main Content Pane */}
                <View style={{ flex: 1 }}>
                    {/* Admin Header Panel */}
                    {isDesktop ? (
                        <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                <View>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Text style={[styles.headerTitle, { color: colors.text }]}>Platform Admin</Text>
                                        <View style={styles.badgeAdmin}><Text style={styles.badgeAdminText}>Superuser</Text></View>
                                    </View>
                                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                                        Manage platform access, users permissions, transactions and configurations.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.headerRightWidgets}>
                                <TouchableOpacity onPress={() => router.back()} style={styles.linkBackApp}>
                                    <Ionicons name="arrow-back-circle-outline" size={16} color={colors.primary} />
                                    <Text style={[styles.linkBackAppText, { color: colors.primary }]}>User Portal</Text>
                                </TouchableOpacity>
                                {/* Notification Badge */}
                                <TouchableOpacity style={[styles.bellBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                                    <Ionicons name="notifications-outline" size={20} color={colors.text} />
                                    <View style={styles.bellBadge}>
                                        <Text style={styles.bellBadgeText}>3</Text>
                                    </View>
                                </TouchableOpacity>
                                {/* Profile Box */}
                                <View style={[styles.profileBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={[styles.avatar, { backgroundColor: colors.primary + "15" }]}>
                                        <Ionicons name="person" size={16} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={[styles.profileName, { color: colors.text }]}>Amit Sharma</Text>
                                        <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>you@upi</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.mobileHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
                                    <Ionicons name="menu-outline" size={28} color={colors.text} />
                                </TouchableOpacity>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <Svg width="22" height="22" viewBox="0 0 32 32">
                                        <Path d="M 4 20 L 16 22 L 12 28 Z" fill="#4C1D95" />
                                        <Path d="M 4 20 L 28 6 L 16 22 Z" fill="#EA580C" />
                                        <Path d="M 16 22 L 28 6 L 22 28 Z" fill="#6B21A8" />
                                    </Svg>
                                    <Text style={[styles.mobileLogoText, { color: colors.text }]}>UP Num</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                                <TouchableOpacity style={styles.mobileBellBtn} activeOpacity={0.8}>
                                    <Ionicons name="notifications-outline" size={22} color={colors.text} />
                                    <View style={styles.mobileBellBadge}>
                                        <Text style={styles.bellBadgeText}>3</Text>
                                    </View>
                                </TouchableOpacity>
                                <View style={[styles.mobileAvatar, { backgroundColor: colors.primary + "15" }]}>
                                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>A</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Scrollable area */}
                    <ScrollView style={styles.mainContentScroll} contentContainerStyle={isDesktop ? styles.mainContentInner : styles.mobileContentInner}>
                        {renderAdminDashboardContent()}
                    </ScrollView>

                    {/* Mobile Bottom Navigation */}
                    {!isDesktop && (
                        <View style={[styles.bottomNavBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                            {[
                                { title: "Dashboard", icon: "grid" as const },
                                { title: "Users", icon: "people" as const },
                                { title: "Transactions", icon: "swap-horizontal" as const },
                                { title: "Reports", icon: "document-text" as const },
                                { title: "More", icon: "ellipsis-horizontal" as const },
                            ].map((tab, idx) => {
                                const isActive = activeTab === tab.title || (tab.title === "More" && !["Dashboard", "Users", "Transactions", "Reports"].includes(activeTab));
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.bottomNavBtn}
                                        onPress={() => setActiveTab(tab.title === "More" ? "Settings" : tab.title)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name={isActive ? tab.icon : `${tab.icon}-outline`}
                                            size={22}
                                            color={isActive ? colors.primary : colors.textSecondary}
                                        />
                                        <Text style={[styles.bottomNavText, { color: isActive ? colors.primary : colors.textSecondary }]}>
                                            {tab.title}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>
            {renderDetailModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    rowLayout: {
        flexDirection: "row",
    },
    columnLayout: {
        flexDirection: "column",
    },
    sidebar: {
        width: 250,
        height: "100%",
        paddingVertical: 24,
        paddingHorizontal: 16,
        justifyContent: "space-between",
        borderRightWidth: 1,
    },
    logoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 28,
        paddingHorizontal: 8,
    },
    logoTextContainer: {
        justifyContent: "center",
        marginLeft: 12,
    },
    logoText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
    },
    logoSub: {
        color: "#FF7A00",
        fontSize: 10,
        marginTop: 1,
    },
    sidebarSectionHeader: {
        fontSize: 10,
        fontWeight: "700",
        color: "#64748B",
        letterSpacing: 1,
        marginTop: 20,
        marginBottom: 8,
        paddingHorizontal: 10,
    },
    sidebarMenuBlock: {
        gap: 4,
    },
    sidebarBtn: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 38,
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    sidebarBtnInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    sidebarBtnText: {
        fontSize: 13,
        color: "#94A3B8",
        fontWeight: "500",
    },
    sidebarBtnTextActive: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    statusBox: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    statusDotRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    greenDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#00C853",
    },
    statusBoxTitle: {
        color: "#94A3B8",
        fontSize: 10,
        fontWeight: "700",
    },
    statusBoxText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "600",
        marginTop: 4,
    },
    statusBoxTime: {
        color: "#64748B",
        fontSize: 9,
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 10,
        height: 38,
    },
    logoutBtnText: {
        fontSize: 13,
        color: "#FF5252",
        fontWeight: "700",
    },
    mainContentScroll: {
        flex: 1,
    },
    mainContentInner: {
        padding: Spacing.lg,
        paddingBottom: 120,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        padding: Spacing.lg,
        gap: 16,
    },
    headerTitle: {
        ...Typography.h3,
    },
    headerSubtitle: {
        ...Typography.bodySmall,
        marginTop: 2,
    },
    badgeAdmin: {
        backgroundColor: "#FF7A0015",
        borderWidth: 1,
        borderColor: "#FF7A0030",
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 1.5,
    },
    badgeAdminText: {
        color: "#FF7A00",
        fontSize: 9,
        fontWeight: "700",
    },
    linkBackApp: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginRight: 8,
    },
    linkBackAppText: {
        fontSize: 12,
        fontWeight: "700",
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        ...Shadows.sm,
    },
    filtersExportRow: {
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    filterDropdownBtn: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 6,
    },
    filterDropdownText: {
        fontSize: 12,
        fontWeight: "600",
    },
    exportReportBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#6C2CF4",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    exportReportText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
    headerRightWidgets: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    bellBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    bellBadge: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#FF5252",
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    bellBadgeText: {
        color: "#FFFFFF",
        fontSize: 9,
        fontWeight: "700",
    },
    profileBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 8,
        ...Shadows.sm,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    profileName: {
        fontSize: 12,
        fontWeight: "700",
    },
    profileEmail: {
        fontSize: 10,
    },
    filtersBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        gap: 12,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 38,
        width: 280,
    },
    searchBarInput: {
        flex: 1,
        fontSize: 12,
        ...Platform.select({
            web: {
                outlineStyle: "none",
            } as any,
        }),
    },
    filtersLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    filterPill: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        ...Shadows.sm,
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: "600",
    },
    kpisRow: {
        gap: 16,
        marginBottom: 24,
    },
    kpiCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        ...Shadows.sm,
    },
    kpiCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    kpiIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    kpiTrendBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ECFDF5",
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        gap: 4,
    },
    kpiTrendText: {
        fontSize: 10,
        color: "#00C853",
        fontWeight: "700",
    },
    kpiCardValue: {
        fontSize: 22,
        fontWeight: "800",
    },
    kpiCardTitle: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 6,
    },
    kpiCardDesc: {
        fontSize: 9,
        color: "#94A3B8",
        marginTop: 2,
    },
    gridRow: {
        gap: 20,
        marginBottom: 24,
    },
    gridCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        ...Shadows.md,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "800",
    },
    timeDropdownBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    timeDropdownText: {
        fontSize: 11,
        fontWeight: "600",
    },
    legendRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
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
    legendLabel: {
        fontSize: 10,
        fontWeight: "600",
    },
    chartWrapper: {
        height: 180,
    },
    donutWrapper: {
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        height: 120,
        marginTop: 10,
    },
    donutLabels: {
        position: "absolute",
        alignItems: "center",
    },
    donutVal: {
        fontSize: 18,
        fontWeight: "800",
    },
    donutSub: {
        fontSize: 9,
        marginTop: 1,
    },
    donutLegends: {
        marginTop: 16,
        gap: 10,
    },
    donutLegendItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    donutLegendLabel: {
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 8,
        flex: 1,
    },
    donutLegendVal: {
        fontSize: 11,
        fontWeight: "700",
    },
    subStatusList: {
        gap: 14,
        marginTop: 10,
        marginBottom: 16,
    },
    subStatusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    subStatusDotRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    subStatusLabel: {
        fontSize: 12,
        fontWeight: "500",
    },
    subStatusVal: {
        fontSize: 12,
        fontWeight: "700",
    },
    viewAllBtn: {
        borderWidth: 1,
        borderRadius: 10,
        height: 38,
        justifyContent: "center",
        alignItems: "center",
        marginTop: "auto",
    },
    viewAllBtnText: {
        fontSize: 12,
        fontWeight: "700",
    },
    blueLinkText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#6C2CF4",
    },
    adminTable: {
        minWidth: 530,
    },
    adminTableHeader: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1.5,
        paddingBottom: 8,
        marginBottom: 6,
    },
    tableHeadCell: {
        fontSize: 11,
        fontWeight: "700",
        color: "#94A3B8",
    },
    adminTableRow: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        paddingVertical: 10,
    },
    avatarNameCell: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    smallAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    tableNameText: {
        fontSize: 12,
        fontWeight: "700",
    },
    tableCellText: {
        fontSize: 12,
        fontWeight: "500",
    },
    miniStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    miniStatusText: {
        fontSize: 9,
        fontWeight: "700",
    },
    bgSuccess: { backgroundColor: "#ECFDF5" },
    txtSuccess: { color: "#00C853" },
    bgWarning: { backgroundColor: "#FFFBEB" },
    txtWarning: { color: "#D97706" },

    revenueTitle: {
        fontSize: 11,
        fontWeight: "600",
    },
    revValRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 2,
    },
    revenueAmt: {
        fontSize: 22,
        fontWeight: "800",
    },
    revTrendBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ECFDF5",
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        gap: 4,
    },
    revTrendText: {
        fontSize: 10,
        color: "#00C853",
        fontWeight: "700",
    },
    revenueSub: {
        fontSize: 10,
        color: "#94A3B8",
        marginTop: 2,
        marginBottom: 10,
    },
    revSplitRow: {
        flexDirection: "row",
        borderTopWidth: 1,
        paddingTop: 12,
    },
    splitLabel: {
        fontSize: 10,
    },
    splitValue: {
        fontSize: 13,
        fontWeight: "800",
        marginTop: 2,
    },
    splitTrend: {
        fontSize: 10,
        color: "#00C853",
        fontWeight: "700",
        marginTop: 2,
    },
    topAppsList: {
        gap: 12,
        marginTop: 10,
        marginBottom: 16,
    },
    appVolumeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    appVolumeLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    appColorCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    appNameLabel: {
        fontSize: 12,
        fontWeight: "600",
    },
    appVolumeAmt: {
        fontSize: 11,
        fontWeight: "700",
    },
    appVolumeShare: {
        fontSize: 9,
    },
    systemOverviewCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        ...Shadows.md,
    },
    systemOverviewGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 20,
        marginTop: 16,
    },
    systemCell: {
        width: "30%",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
    },
    systemIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    systemCellLabel: {
        fontSize: 10,
        fontWeight: "600",
    },
    systemCellVal: {
        fontSize: 14,
        fontWeight: "800",
        marginTop: 2,
    },
    systemCellSub: {
        fontSize: 10,
        fontWeight: "700",
        color: "#6C2CF4",
        marginTop: 2,
    },

    // User Tab custom styles
    avatarCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    tableHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1.5,
        paddingVertical: 12,
    },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        paddingVertical: 14,
    },
    actionBtn: {
        width: 28,
        height: 28,
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    // Modal Overrides styles
    modalOverlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: Spacing.md,
    },
    modalCard: {
        width: "95%",
        maxWidth: 500,
        borderRadius: 20,
        borderWidth: 1,
        padding: Spacing.lg,
        ...Shadows.lg,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "800",
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalBody: {
        gap: 16,
    },
    modalAvatarRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    modalAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    modalAvatarText: {
        fontSize: 18,
        fontWeight: "800",
    },
    modalName: {
        fontSize: 15,
        fontWeight: "800",
    },
    modalEmail: {
        fontSize: 12,
    },
    modalDivider: {
        height: 1,
    },
    modalInput: {
        height: 40,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 13,
        ...Platform.select({
            web: {
                outlineStyle: "none",
            } as any,
        }),
    },
    modalDetailsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },
    modalGridItem: {
        width: "45%",
        gap: 4,
    },
    modalGridLabel: {
        fontSize: 10,
        fontWeight: "600",
    },
    modalGridValue: {
        fontSize: 13,
        fontWeight: "700",
    },
    modalActionsRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 8,
    },
    modalActionBtn: {
        flex: 1,
        height: 38,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    modalActionBtnText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
    planSelectionPill: {
        flex: 1,
        height: 32,
        borderWidth: 1,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    statusSelectionPill: {
        flex: 1,
        height: 32,
        borderWidth: 1,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    mobileHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    mobileLogoText: {
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    mobileBellBtn: {
        position: "relative",
    },
    mobileBellBadge: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#EF4444",
        width: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#FFFFFF",
    },
    mobileAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    mobileContentInner: {
        padding: 16,
        paddingBottom: 100,
    },
    bottomNavBar: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        height: 60,
        borderTopWidth: 1,
        paddingBottom: Platform.OS === "ios" ? 20 : 0,
    },
    bottomNavBtn: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 8,
        flex: 1,
    },
    bottomNavText: {
        fontSize: 10,
        fontWeight: "600",
        marginTop: 4,
    },
});
