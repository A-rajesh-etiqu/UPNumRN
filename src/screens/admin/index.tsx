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
    Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Path, Circle, Rect, Line, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from "react-native-svg";
import { useAppTheme, Radius, Spacing, Shadows, Typography } from "../../theme";
import { router } from "../../navigation/RootNavigation";
import { useAuthStore } from "../../store/auth.store";
import apiClient from "../../api/apiClient";

declare var window: any;

const ADMIN_MENU_MAIN = [
    { title: "Overview", icon: "home-outline" as const },
    { title: "Users", icon: "person-outline" as const },
    { title: "Businesses", icon: "business-outline" as const },
    { title: "Plans", icon: "card-outline" as const },
    { title: "Payments", icon: "cash-outline" as const },
    { title: "Disputes", icon: "scale-outline" as const },
    { title: "Offers", icon: "gift-outline" as const },
    { title: "Reports", icon: "bar-chart-outline" as const },
    { title: "Notifications", icon: "notifications-outline" as const },
];

const ADMIN_MENU_SYSTEM = [
    { title: "System Health", icon: "desktop-outline" as const },
];

const ADMIN_MENU_SETTINGS = [
    { title: "Settings", icon: "settings-outline" as const },
];

export default function PlatformAdminDashboard() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const { user, logout } = useAuthStore();
    const { colors, isDark } = useAppTheme();

    const [activeTab, setActiveTab] = useState("Overview");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Edit user form fields state
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editMobile, setEditMobile] = useState("");
    const [editPlan, setEditPlan] = useState("");
    const [editStatus, setEditStatus] = useState("");
    const [editUserType, setEditUserType] = useState("PERSONAL");

    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [stats, setStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const [plans, setPlans] = useState<any[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);

    const [offers, setOffers] = useState<any[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(false);

    // Plan Edit Modal state
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [editPlanName, setEditPlanName] = useState("");
    const [editPlanType, setEditPlanType] = useState("Paid");
    const [editPlanPrice, setEditPlanPrice] = useState("0");
    const [editPlanBilling, setEditPlanBilling] = useState("Monthly");
    const [editPlanStatus, setEditPlanStatus] = useState("Active");
    const [editPlanDescription, setEditPlanDescription] = useState("");

    // Offer Edit Modal state
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [editOfferName, setEditOfferName] = useState("");
    const [editOfferType, setEditOfferType] = useState("Coupon");
    const [editOfferDiscount, setEditOfferDiscount] = useState("");
    const [editOfferValidFrom, setEditOfferValidFrom] = useState("");
    const [editOfferValidTo, setEditOfferValidTo] = useState("");
    const [editOfferStatus, setEditOfferStatus] = useState("Active");

    // Notifications state
    const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
    const [notifTitle, setNotifTitle] = useState("");
    const [notifMessage, setNotifMessage] = useState("");
    const [notifTargetType, setNotifTargetType] = useState("ALL");
    const [notifTargetUsers, setNotifTargetUsers] = useState(""); // Comma separated user IDs

    const fetchDashboardStats = async () => {
        setLoadingStats(true);
        try {
            const response = await apiClient.get("/admin/dashboard");
            setStats(response.data);
        } catch (err: any) {
            console.warn("Failed to fetch admin dashboard stats:", err.message);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchAdminNotifications = async () => {
        try {
            const res = await apiClient.get("/admin/notifications");
            setAdminNotifications(res.data);
        } catch (err: any) {
            console.warn("Failed to fetch notifications:", err.message);
        }
    };

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

    const fetchPlans = async () => {
        setLoadingPlans(true);
        try {
            const response = await apiClient.get("/admin/plans");
            setPlans(response.data);
        } catch (err: any) {
            console.warn("Failed to fetch plans:", err.message);
        } finally {
            setLoadingPlans(false);
        }
    };

    const fetchOffers = async () => {
        setLoadingOffers(true);
        try {
            const response = await apiClient.get("/admin/offers");
            setOffers(response.data);
        } catch (err: any) {
            console.warn("Failed to fetch offers:", err.message);
        } finally {
            setLoadingOffers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchDashboardStats();
        fetchPlans();
        fetchOffers();
        fetchAdminNotifications();
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
        setEditUserType(user.user_type || "PERSONAL");
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
                planStatus: u.planStatus,
                user_type: u.user_type
            });
            fetchUsers();
        } catch (err: any) {
            console.error("Toggle User Status Error:", err);
            Alert.alert("Failed to toggle status: " + err.message);
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
                planStatus: editPlan === "free-trial" ? "TRIAL" : "ACTIVE",
                user_type: editUserType
            });

            await fetchUsers();
            setSelectedUser(null);
            Alert.alert("Success", "User profile and subscription modified successfully!");
        } catch (err: any) {
            console.error("Save Changes Error:", err);
            Alert.alert("Failed to save changes: " + err.message);
        }
    };
    const handleDeleteUser = async (id: string) => {
        if (Platform.OS === 'web') {
            const confirmed = (window as any).confirm("Are you sure you want to delete this user?");
            if (!confirmed) return;
            try {
                await apiClient.delete(`/admin/users/${id}`);
                setUsers(users.filter((u: any) => u.id !== id));
                (window as any).alert("User deleted successfully");
            } catch (err: any) {
                console.error("Delete user error:", err);
                (window as any).alert("Failed to delete user. Make sure your server is restarted.");
            }
        } else {
            Alert.alert("Confirm Delete", "Are you sure you want to delete this user?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        try {
                            await apiClient.delete(`/admin/users/${id}`);
                            setUsers(users.filter((u: any) => u.id !== id));
                            Alert.alert("Success", "User deleted successfully");
                        } catch (err: any) {
                            console.error("Delete user error:", err);
                            Alert.alert("Error", "Failed to delete user");
                        }
                    }
                }
            ]);
        }
    };

    const handleOpenPlanModal = (plan?: any) => {
        if (plan) {
            setEditingPlan(plan);
            setEditPlanName(plan.name);
            setEditPlanType(plan.type);
            setEditPlanPrice(String(plan.price));
            setEditPlanBilling(plan.billing);
            setEditPlanStatus(plan.status);
            setEditPlanDescription(plan.description || "");
        } else {
            setEditingPlan(null);
            setEditPlanName("");
            setEditPlanType("Paid");
            setEditPlanPrice("0");
            setEditPlanBilling("Monthly");
            setEditPlanStatus("Active");
            setEditPlanDescription("");
        }
        setShowPlanModal(true);
    };

    const handleSavePlan = async () => {
        try {
            const payload = {
                name: editPlanName,
                type: editPlanType,
                price: parseFloat(editPlanPrice),
                billing: editPlanBilling,
                status: editPlanStatus,
                description: editPlanDescription
            };
            if (editingPlan) {
                await apiClient.put(`/admin/plans/${editingPlan.id}`, payload);
            } else {
                await apiClient.post(`/admin/plans`, payload);
            }
            setShowPlanModal(false);
            fetchPlans();
        } catch (err: any) {
            console.error("Save plan error", err);
            if (Platform.OS === 'web') (window as any).alert("Failed to save plan");
            else Alert.alert("Error", "Failed to save plan");
        }
    };

    const handleDeletePlan = async (id: number) => {
        if (Platform.OS === 'web') {
            if (!(window as any).confirm("Are you sure you want to delete this plan?")) return;
            try {
                await apiClient.delete(`/admin/plans/${id}`);
                fetchPlans();
            } catch (err: any) {
                (window as any).alert("Failed to delete plan");
            }
        } else {
            Alert.alert("Confirm", "Delete this plan?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        try {
                            await apiClient.delete(`/admin/plans/${id}`);
                            fetchPlans();
                        } catch (err: any) {
                            Alert.alert("Error", "Failed to delete plan");
                        }
                    }
                }
            ]);
        }
    };

    const handleOpenOfferModal = (offer?: any) => {
        if (offer) {
            setEditingOffer(offer);
            setEditOfferName(offer.name);
            setEditOfferType(offer.type);
            setEditOfferDiscount(offer.discount);
            setEditOfferValidFrom(offer.valid_from);
            setEditOfferValidTo(offer.valid_to);
            setEditOfferStatus(offer.status);
        } else {
            setEditingOffer(null);
            setEditOfferName("");
            setEditOfferType("Coupon");
            setEditOfferDiscount("");
            setEditOfferValidFrom("");
            setEditOfferValidTo("");
            setEditOfferStatus("Active");
        }
        setShowOfferModal(true);
    };

    const handleSaveOffer = async () => {
        try {
            const payload = {
                name: editOfferName,
                type: editOfferType,
                discount: editOfferDiscount,
                valid_from: editOfferValidFrom,
                valid_to: editOfferValidTo,
                status: editOfferStatus
            };
            if (editingOffer) {
                await apiClient.put(`/admin/offers/${editingOffer.id}`, payload);
            } else {
                await apiClient.post(`/admin/offers`, payload);
            }
            setShowOfferModal(false);
            fetchOffers();
        } catch (err: any) {
            console.error("Save offer error", err);
            if (Platform.OS === 'web') (window as any).alert("Failed to save offer");
            else Alert.alert("Error", "Failed to save offer");
        }
    };

    const handleDeleteOffer = async (id: number) => {
        if (Platform.OS === 'web') {
            if (!(window as any).confirm("Are you sure you want to delete this offer?")) return;
            try {
                await apiClient.delete(`/admin/offers/${id}`);
                fetchOffers();
            } catch (err: any) {
                (window as any).alert("Failed to delete offer");
            }
        } else {
            Alert.alert("Confirm", "Delete this offer?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        try {
                            await apiClient.delete(`/admin/offers/${id}`);
                            fetchOffers();
                        } catch (err: any) {
                            Alert.alert("Error", "Failed to delete offer");
                        }
                    }
                }
            ]);
        }
    };

    const handleCreateNotification = async () => {
        if (!notifTitle || !notifMessage) {
            Alert.alert("Error", "Title and Message are required");
            return;
        }
        try {
            let targetUsersArray: string[] = [];
            if (notifTargetType !== 'ALL' && notifTargetUsers.trim() !== '') {
                targetUsersArray = notifTargetUsers.split(",").map(u => u.trim()).filter(u => u);
            }
            await apiClient.post("/admin/notifications", {
                title: notifTitle,
                message: notifMessage,
                target_type: notifTargetType,
                target_users: targetUsersArray
            });
            Alert.alert("Success", "Notification sent successfully!");
            setNotifTitle("");
            setNotifMessage("");
            setNotifTargetUsers("");
            fetchAdminNotifications();
        } catch (err: any) {
            console.error("Create notification err:", err);
            Alert.alert("Error", "Failed to create notification");
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

                {/* Logout Button Removed */}
            </View>
        </View>
    );

    // Main dashboard view content
    const renderDashboardTab = () => {
        const svgW = 450;
        const svgH = 160;

        let revPath = "M 0,140 L 450,140";
        let revPoints: { x: number, y: number }[] = [];
        let revLabels: { x: number, label: string }[] = [];
        if (stats?.revenueTrend?.length > 0) {
            const data = stats.revenueTrend;
            const maxAmt = Math.max(...data.map((d: any) => parseFloat(d.amount)), 1);
            const spacing = svgW / Math.max(data.length - 1, 1);
            revPath = "M ";
            data.forEach((d: any, i: number) => {
                const x = i * spacing;
                const h = (parseFloat(d.amount) / maxAmt) * (svgH - 40);
                const y = 140 - h;
                revPath += `${i === 0 ? "" : " L "}${x},${y}`;
                revPoints.push({ x, y });
            });
            const numLabels = Math.min(5, data.length);
            for (let i = 0; i < numLabels; i++) {
                const idx = Math.floor(i * (data.length - 1) / Math.max(numLabels - 1, 1));
                const dt = new Date(data[idx].date);
                revLabels.push({ x: idx * spacing, label: `${dt.getDate().toString().padStart(2, '0')} ${dt.toLocaleString('en-US', { month: 'short' })}` });
            }
        }

        let newUsersBars: { x: number, y: number, h: number }[] = [];
        let nuLabels: { x: number, label: string }[] = [];
        if (stats?.newUsersTrend?.length > 0) {
            const data = stats.newUsersTrend;
            const maxCount = Math.max(...data.map((d: any) => parseInt(d.count)), 1);
            const spacing = svgW / data.length;
            const barW = 6;
            data.forEach((d: any, i: number) => {
                const x = (i * spacing) + (spacing / 2) - (barW / 2);
                const h = (parseInt(d.count) / maxCount) * (svgH - 40);
                newUsersBars.push({ x, y: 140 - h, h });
            });
            const numLabels = Math.min(5, data.length);
            for (let i = 0; i < numLabels; i++) {
                const idx = Math.floor(i * (data.length - 1) / Math.max(numLabels - 1, 1));
                const dt = new Date(data[idx].date);
                nuLabels.push({ x: (idx * spacing) + (spacing / 2), label: `${dt.getDate().toString().padStart(2, '0')} ${dt.toLocaleString('en-US', { month: 'short' })}` });
            }
        }

        const subCounts = stats?.subscriptions || { free: 0, standard: 0, lifetime: 0 };
        const totalSubs = Math.max((subCounts.free || 0) + (subCounts.standard || 0) + (subCounts.lifetime || 0), 1);
        const freePct = ((subCounts.free || 0) / totalSubs) * 100;
        const stdPct = ((subCounts.standard || 0) / totalSubs) * 100;
        const lifePct = ((subCounts.lifetime || 0) / totalSubs) * 100;

        const dispCounts = stats?.disputeStatus || { OPEN: 0, RESOLVED: 0, REJECTED: 0 };
        const totalDisp = Math.max((dispCounts.OPEN || 0) + (dispCounts.RESOLVED || 0) + (dispCounts.REJECTED || 0), 1);
        const openPct = ((dispCounts.OPEN || 0) / totalDisp) * 100;
        const resPct = ((dispCounts.RESOLVED || 0) / totalDisp) * 100;
        const rejPct = ((dispCounts.REJECTED || 0) / totalDisp) * 100;

        return (
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
                        { title: "Total Users", value: stats?.totalUsers?.toLocaleString() || "0", change: "+12.5%", desc: "vs Apr 2024", color: "#6C2CF4", bg: "#F5F3FF", icon: "people-outline" as const, positive: true },
                        { title: "Active Businesses", value: stats?.activeBusinesses?.toLocaleString() || "0", change: "+9.4%", desc: "vs Apr 2024", color: "#3B82F6", bg: "#EFF6FF", icon: "briefcase-outline" as const, positive: true },
                        { title: "Total Revenue", value: `₹${stats?.mrr?.toLocaleString("en-IN") || "0"}`, change: "+18.7%", desc: "vs Apr 2024", color: "#00C853", bg: "#ECFDF5", icon: "cash-outline" as const, positive: true },
                        { title: "Successful Payments", value: stats?.successfulPayments?.toLocaleString() || "0", change: "+14.2%", desc: "vs Apr 2024", color: "#FF7A00", bg: "#FFF7ED", icon: "card-outline" as const, positive: true },
                        { title: "Disputes", value: stats?.disputes?.toLocaleString() || "0", change: "+6.3%", desc: "vs Apr 2024", color: "#EF4444", bg: "#FEF2F2", icon: "shield-half-outline" as const, positive: false },
                        { title: "Conversion Rate", value: `${stats?.conversionRate?.toFixed(2) || "0"}%`, change: "+3.1%", desc: "vs Apr 2024", color: "#8B5CF6", bg: "#F5F3FF", icon: "trending-up-outline" as const, positive: true },
                    ].map((kpi, idx) => (
                        <View key={idx} style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border, flex: isDesktop ? 1 : 0, minWidth: isDesktop ? 0 : "48%", maxWidth: isDesktop ? "16%" : "48%" }]}>
                            <View style={styles.kpiCardHeader}>
                                <View style={[styles.kpiIconCircle, { backgroundColor: kpi.bg }]}>
                                    <Ionicons name={kpi.icon} size={20} color={kpi.color} />
                                </View>
                                <View style={styles.kpiTrendBadge}>
                                    <Ionicons name={kpi.positive ? "arrow-up" : "arrow-down"} size={10} color={kpi.positive ? "#00C853" : "#EF4444"} />
                                    <Text style={[styles.kpiTrendText, { color: kpi.positive ? "#00C853" : "#EF4444" }]}>{kpi.change}</Text>
                                </View>
                            </View>
                            <Text style={[styles.kpiCardValue, { color: colors.text }]}>{kpi.value}</Text>
                            <Text style={[styles.kpiCardTitle, { color: colors.textSecondary }]}>{kpi.title}</Text>
                            <Text style={styles.kpiCardDesc}>{kpi.desc}</Text>
                        </View>
                    ))}
                </View>

                {/* Charts & Activity Row */}
                <View style={[styles.gridRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                    {/* 1. Revenue Over Time (Line Chart) */}
                    <View style={[styles.gridCard, { flex: 1.5, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Revenue Over Time</Text>
                            <TouchableOpacity style={[styles.timeDropdownBtn, { borderColor: colors.border }]} activeOpacity={0.8}>
                                <Text style={[styles.timeDropdownText, { color: colors.textSecondary }]}>Daily</Text>
                                <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.revenueAmt, { color: colors.text, marginTop: 10, fontSize: 22 }]}>
                            ₹{stats?.mrr?.toLocaleString("en-IN") || "0"}
                        </Text>
                        <Text style={styles.kpiTrendText}>
                            <Text style={{ color: "#00C853" }}>↑ 18.7%</Text> <Text style={{ color: colors.textSecondary }}>vs Apr 2024</Text>
                        </Text>
                        <View style={[styles.chartWrapper, { height: 160, marginTop: 20 }]}>
                            <Svg height="100%" width="100%" viewBox="0 0 450 160">
                                <Line x1="0" y1="20" x2="450" y2="20" stroke={colors.border} strokeWidth="1" />
                                <Line x1="0" y1="60" x2="450" y2="60" stroke={colors.border} strokeWidth="1" />
                                <Line x1="0" y1="100" x2="450" y2="100" stroke={colors.border} strokeWidth="1" />
                                <Line x1="0" y1="140" x2="450" y2="140" stroke={colors.border} strokeWidth="1" />

                                {revLabels.map((l, i) => (
                                    <SvgText key={i} x={l.x} y="155" fill={colors.textSecondary} fontSize="9" textAnchor="middle">{l.label}</SvgText>
                                ))}

                                <Path d={revPath} fill="none" stroke="#6C2CF4" strokeWidth="3" />
                                {revPoints.map((p, i) => (
                                    <Circle key={i} cx={p.x} cy={p.y} r="4" fill="#6C2CF4" stroke={colors.surface} strokeWidth="2" />
                                ))}
                            </Svg>
                        </View>
                    </View>

                    {/* 2. New Users (Bar Chart) */}
                    <View style={[styles.gridCard, { flex: 1.5, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>New Users</Text>
                            <TouchableOpacity style={[styles.timeDropdownBtn, { borderColor: colors.border }]} activeOpacity={0.8}>
                                <Text style={[styles.timeDropdownText, { color: colors.textSecondary }]}>Daily</Text>
                                <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.revenueAmt, { color: colors.text, marginTop: 10, fontSize: 22 }]}>
                            {stats?.totalUsers?.toLocaleString() || "0"}
                        </Text>
                        <Text style={styles.kpiTrendText}>
                            <Text style={{ color: "#00C853" }}>↑ 12.5%</Text> <Text style={{ color: colors.textSecondary }}>vs Apr 2024</Text>
                        </Text>
                        <View style={[styles.chartWrapper, { height: 160, marginTop: 20 }]}>
                            <Svg height="100%" width="100%" viewBox="0 0 450 160">
                                {newUsersBars.map((bar, i) => (
                                    <Rect key={i} x={bar.x} y={bar.y} width="6" height={bar.h} fill="#6C2CF4" rx="3" />
                                ))}

                                {nuLabels.map((l, i) => (
                                    <SvgText key={i} x={l.x} y="155" fill={colors.textSecondary} fontSize="9" textAnchor="middle">{l.label}</SvgText>
                                ))}
                            </Svg>
                        </View>
                    </View>

                    {/* 3. Recent Activities */}
                    <View style={[styles.gridCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Activities</Text>
                            <TouchableOpacity activeOpacity={0.8}>
                                <Text style={styles.blueLinkText}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginTop: 10, gap: 16 }}>
                            {stats?.recentActivities?.slice(0, 5).map((act: any, idx: number) => {
                                let icon = "information"; let bg = "#F5F3FF"; let c = "#6C2CF4";
                                if (act.type === 'user') { icon = "person-outline"; bg = "#F5F3FF"; c = "#6C2CF4"; }
                                if (act.type === 'payment') { icon = "cash-outline"; bg = "#ECFDF5"; c = "#00C853"; }
                                if (act.type === 'business') { icon = "business-outline"; bg = "#EFF6FF"; c = "#3B82F6"; }
                                if (act.type === 'dispute') { icon = "shield-half-outline"; bg = "#FFF7ED"; c = "#FF7A00"; }
                                if (act.type === 'plan') { icon = "star-outline"; bg = "#F5F3FF"; c = "#8B5CF6"; }

                                const diffMins = Math.floor((new Date().getTime() - new Date(act.timestamp).getTime()) / 60000);
                                const timeStr = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`;

                                return (
                                    <View key={idx} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
                                                <Ionicons name={icon} size={18} color={c} />
                                            </View>
                                            <View>
                                                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{act.title}</Text>
                                                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{act.subtitle}</Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{timeStr}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Bottom Widgets Row */}
                <View style={[styles.gridRow, isDesktop ? styles.rowLayout : styles.columnLayout]}>
                    {/* 1. Subscription Overview */}
                    <View style={[styles.gridCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Subscription Overview</Text>
                        <View style={[styles.donutWrapper, { height: 120 }]}>
                            <Svg width="120" height="120" viewBox="0 0 36 36">
                                <Circle cx="18" cy="18" r="15.915" fill="none" stroke={colors.border} strokeWidth="4" />
                                <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#6C2CF4" strokeWidth="4" strokeDasharray={`${freePct} ${100 - freePct}`} strokeDashoffset="25" />
                                <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="4" strokeDasharray={`${stdPct} ${100 - stdPct}`} strokeDashoffset={`${100 - freePct + 25}`} />
                                <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#FF7A00" strokeWidth="4" strokeDasharray={`${lifePct} ${100 - lifePct}`} strokeDashoffset={`${100 - freePct - stdPct + 25}`} />
                            </Svg>
                        </View>
                        <View style={styles.donutLegends}>
                            <View style={styles.donutLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#6C2CF4" }]} />
                                <Text style={[styles.donutLegendLabel, { color: colors.textSecondary }]}>Free</Text>
                                <Text style={[styles.donutLegendVal, { color: colors.text }]}>{freePct.toFixed(1)}%</Text>
                            </View>
                            <View style={styles.donutLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#3B82F6" }]} />
                                <Text style={[styles.donutLegendLabel, { color: colors.textSecondary }]}>Standard</Text>
                                <Text style={[styles.donutLegendVal, { color: colors.text }]}>{stdPct.toFixed(1)}%</Text>
                            </View>
                            <View style={styles.donutLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#FF7A00" }]} />
                                <Text style={[styles.donutLegendLabel, { color: colors.textSecondary }]}>Premium</Text>
                                <Text style={[styles.donutLegendVal, { color: colors.text }]}>{lifePct.toFixed(1)}%</Text>
                            </View>
                        </View>
                    </View>

                    {/* 2. Payment Success Rate */}
                    <View style={[styles.gridCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Success Rate</Text>
                        <View style={{ alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: 20 }}>
                            <Text style={{ fontSize: 42, fontWeight: "800", color: colors.text }}>
                                {stats?.paymentSuccessRate?.toFixed(1) || "98.2"}%
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>Overall success rate</Text>
                        </View>
                    </View>

                    {/* 3. Top Payment Methods */}
                    <View style={[styles.gridCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Top Payment Methods</Text>
                        <View style={{ marginTop: 20, gap: 16 }}>
                            {stats?.paymentMethods?.length > 0 ? stats.paymentMethods.map((pm: any, idx: number) => (
                                <View key={idx} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                        <View style={[styles.appColorCircle, { backgroundColor: "#FF7A00" }]} />
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{pm.payment_method}</Text>
                                    </View>
                                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                                        {((pm.count / stats.successfulPayments) * 100).toFixed(1)}%
                                    </Text>
                                </View>
                            )) : (
                                <>
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                            <View style={[styles.appColorCircle, { backgroundColor: "#FF7A00" }]} />
                                            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>UPI</Text>
                                        </View>
                                        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>76.5%</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                            <View style={[styles.appColorCircle, { backgroundColor: "#6C2CF4" }]} />
                                            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Cards</Text>
                                        </View>
                                        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>14.2%</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                            <View style={[styles.appColorCircle, { backgroundColor: "#3B82F6" }]} />
                                            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Net Banking</Text>
                                        </View>
                                        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>9.3%</Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>

                    {/* 4. Dispute Status */}
                    <View style={[styles.gridCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Dispute Status</Text>
                        <View style={[styles.donutWrapper, { height: 120 }]}>
                            <Svg width="120" height="120" viewBox="0 0 36 36">
                                <Circle cx="18" cy="18" r="15.915" fill="none" stroke={colors.border} strokeWidth="4" />
                                <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#FF7A00" strokeWidth="4" strokeDasharray={`${openPct} ${100 - openPct}`} strokeDashoffset="25" />
                                <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#6C2CF4" strokeWidth="4" strokeDasharray={`${resPct} ${100 - resPct}`} strokeDashoffset={`${100 - openPct + 25}`} />
                                <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#EF4444" strokeWidth="4" strokeDasharray={`${rejPct} ${100 - rejPct}`} strokeDashoffset={`${100 - openPct - resPct + 25}`} />
                            </Svg>
                        </View>
                        <View style={styles.donutLegends}>
                            <View style={styles.donutLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#FF7A00" }]} />
                                <Text style={[styles.donutLegendLabel, { color: colors.textSecondary }]}>Open</Text>
                                <Text style={[styles.donutLegendVal, { color: colors.text }]}>{dispCounts.OPEN || 0} ({openPct.toFixed(1)}%)</Text>
                            </View>
                            <View style={styles.donutLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#6C2CF4" }]} />
                                <Text style={[styles.donutLegendLabel, { color: colors.textSecondary }]}>Resolved</Text>
                                <Text style={[styles.donutLegendVal, { color: colors.text }]}>{dispCounts.RESOLVED || 0} ({resPct.toFixed(1)}%)</Text>
                            </View>
                            <View style={styles.donutLegendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
                                <Text style={[styles.donutLegendLabel, { color: colors.textSecondary }]}>Rejected</Text>
                                <Text style={[styles.donutLegendVal, { color: colors.text }]}>{dispCounts.REJECTED || 0} ({rejPct.toFixed(1)}%)</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ minWidth: 900, flex: 1 }}>
                        {/* Header row */}
                        <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border, paddingHorizontal: 16 }]}>
                            <Text style={[styles.tableHeadCell, { flex: 1.5, color: colors.textSecondary }]}>User</Text>
                            <Text style={[styles.tableHeadCell, { flex: 2, color: colors.textSecondary }]}>Email</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Type</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Plan</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Total Volume</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Status</Text>
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
                                    <View style={{ flex: 1.5, flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 10 }}>
                                        <View style={[styles.avatarCircle, { backgroundColor: colors.primary + "15" }]}>
                                            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
                                                {user.name ? user.name[0] : "U"}
                                            </Text>
                                        </View>
                                        <Text style={[styles.tableNameText, { color: colors.text }]} numberOfLines={1}>{user.name}</Text>
                                    </View>

                                    {/* Email */}
                                    <Text style={[styles.tableCellText, { flex: 2, color: colors.textSecondary, paddingRight: 10 }]} numberOfLines={1}>{user.email}</Text>

                                    {/* Type */}
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.text, paddingRight: 10 }]} numberOfLines={1}>{(user.user_type === "BUSINESS") ? "Business" : "Personal"}</Text>

                                    {/* Plan */}
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.text, paddingRight: 10 }]} numberOfLines={1}>{user.plan}</Text>

                                    {/* Volume */}
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.text, fontWeight: "700", paddingRight: 10 }]} numberOfLines={1}>{user.volume}</Text>

                                    {/* Status */}
                                    <View style={{ flex: 1, paddingRight: 10, justifyContent: 'center' }}>
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

                                        <TouchableOpacity
                                            onPress={() => handleDeleteUser(user.id)}
                                            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name="trash-outline" size={14} color={colors.danger} />
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

    const MOCK_PLANS = [
        { name: "Free", type: "Free", price: "₹0", billing: "Monthly", status: "Active", subscribers: "5,864" },
        { name: "Standard", type: "Paid", price: "₹50", billing: "Monthly", status: "Active", subscribers: "4,530" },
        { name: "Pro", type: "Paid", price: "₹199", billing: "Monthly", status: "Active", subscribers: "1,967" },
        { name: "Enterprise", type: "Paid", price: "₹999", billing: "Monthly", status: "Active", subscribers: "495" }
    ];

    const MOCK_OFFERS = [
        { name: "WELCOME10", type: "Coupon", discount: "10% OFF", usage: "845", validFrom: "01 May 2024", validTo: "31 May 2024", status: "Active" },
        { name: "FREEMONTH", type: "Coupon", discount: "1 Month Free", usage: "1,245", validFrom: "01 May 2024", validTo: "30 Jun 2024", status: "Active" },
        { name: "REFER50", type: "Coupon", discount: "₹50 Cashback", usage: "623", validFrom: "01 Apr 2024", validTo: "30 Jun 2024", status: "Active" },
        { name: "FOUNDER10", type: "Special", discount: "₹10 / month", usage: "978", validFrom: "01 May 2024", validTo: "-", status: "Active" },
        { name: "SUMMER20", type: "Coupon", discount: "20% OFF", usage: "290", validFrom: "01 May 2024", validTo: "31 May 2024", status: "Inactive" }
    ];

    const renderPlansTab = () => (
        <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <View>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>Plans</Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>Manage subscription plans and features</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, height: 40, borderRadius: 8 }}>
                        <Ionicons name="repeat-outline" size={16} color={colors.text} style={{ marginRight: 6 }} />
                        <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>Reorder</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleOpenPlanModal()} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingHorizontal: 16, height: 40, borderRadius: 8 }}>
                        <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 13 }}>Add Plan</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.gridCard, { flex: 1, padding: 0, overflow: "hidden", backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ minWidth: 800, flex: 1 }}>
                        <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border, paddingHorizontal: 24, height: 50 }]}>
                            <Text style={[styles.tableHeadCell, { flex: 1.5, color: colors.textSecondary }]}>Plan Name</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Type</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Price</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Billing</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Status</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Subscribers</Text>
                            <Text style={[styles.tableHeadCell, { width: 80, color: colors.textSecondary, textAlign: "right" }]}>Actions</Text>
                        </View>
                        <ScrollView style={{ flex: 1 }}>
                            {plans.map((plan, idx) => (
                                <View key={idx} style={[styles.tableRow, { borderBottomColor: colors.border, paddingHorizontal: 24, height: 64 }]}>
                                    <Text style={[styles.tableCellText, { flex: 1.5, color: colors.text, fontWeight: "600", paddingRight: 10 }]} numberOfLines={1}>{plan.name}</Text>
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.textSecondary, paddingRight: 10 }]} numberOfLines={1}>{plan.type}</Text>
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.text, paddingRight: 10 }]} numberOfLines={1}>₹{plan.price}</Text>
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.textSecondary, paddingRight: 10 }]} numberOfLines={1}>{plan.billing}</Text>
                                    <View style={{ flex: 1, paddingRight: 10, justifyContent: 'center' }}>
                                        <View style={[styles.miniStatusBadge, plan.status === "Active" ? styles.bgSuccess : { backgroundColor: colors.danger + "15" }]}>
                                            <Text style={[styles.miniStatusText, plan.status === "Active" ? styles.txtSuccess : { color: colors.danger }]}>{plan.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.text, paddingRight: 10 }]} numberOfLines={1}>{plan.subscribers || 0}</Text>
                                    <View style={{ width: 80, flexDirection: 'row', alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                                        <TouchableOpacity onPress={() => handleOpenPlanModal(plan)}>
                                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeletePlan(plan.id)}>
                                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </ScrollView>
            </View>
        </View>
    );

    const renderOffersTab = () => (
        <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <View>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>Offers & Coupons</Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>Manage offers, coupons and promotions</Text>
                </View>
                <TouchableOpacity onPress={() => handleOpenOfferModal()} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingHorizontal: 16, height: 40, borderRadius: 8 }}>
                    <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 13 }}>Create Offer</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.gridCard, { flex: 1, padding: 0, overflow: "hidden", backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ minWidth: 900, flex: 1 }}>
                        <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border, paddingHorizontal: 24, height: 50 }]}>
                            <Text style={[styles.tableHeadCell, { flex: 1.5, color: colors.textSecondary }]}>Offer Name</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Type</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Discount</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Usage</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Valid From</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Valid To</Text>
                            <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Status</Text>
                            <Text style={[styles.tableHeadCell, { width: 80, color: colors.textSecondary, textAlign: "right" }]}>Actions</Text>
                        </View>
                        <ScrollView style={{ flex: 1 }}>
                            {offers.map((offer, idx) => (
                                <View key={idx} style={[styles.tableRow, { borderBottomColor: colors.border, paddingHorizontal: 24, height: 64 }]}>
                                    <Text style={[styles.tableCellText, { flex: 1.5, color: colors.text, fontWeight: "600", paddingRight: 10 }]} numberOfLines={1}>{offer.name}</Text>
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.textSecondary, paddingRight: 10 }]} numberOfLines={1}>{offer.type}</Text>
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.text, paddingRight: 10 }]} numberOfLines={1}>{offer.discount}</Text>
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.textSecondary, paddingRight: 10 }]} numberOfLines={1}>{offer.usage_count || offer.usage || 0}</Text>
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.textSecondary, paddingRight: 10 }]} numberOfLines={1}>{offer.valid_from}</Text>
                                    <Text style={[styles.tableCellText, { flex: 1, color: colors.textSecondary, paddingRight: 10 }]} numberOfLines={1}>{offer.valid_to}</Text>
                                    <View style={{ flex: 1, paddingRight: 10, justifyContent: 'center' }}>
                                        <View style={[styles.miniStatusBadge, offer.status === "Active" ? styles.bgSuccess : { backgroundColor: colors.danger + "15" }]}>
                                            <Text style={[styles.miniStatusText, offer.status === "Active" ? styles.txtSuccess : { color: colors.danger }]}>{offer.status}</Text>
                                        </View>
                                    </View>
                                    <View style={{ width: 80, flexDirection: 'row', alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                                        <TouchableOpacity onPress={() => handleOpenOfferModal(offer)}>
                                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteOffer(offer.id)}>
                                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
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
            <TouchableOpacity onPress={() => setActiveTab("Overview")} style={[styles.exportReportBtn, { marginTop: 20 }]}>
                <Text style={styles.exportReportText}>Return to Overview</Text>
            </TouchableOpacity>
        </View>
    );

    const renderNotificationsTab = () => (
        <View style={{ flex: 1 }}>
            <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>Notifications</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>Create and manage alerts sent to users' dashboards</Text>
            </View>

            <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border, padding: 24, marginBottom: 24 }]}>
                <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 16 }]}>Send New Notification</Text>
                
                <View style={{ gap: 16 }}>
                    <View>
                        <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Notification Title</Text>
                        <TextInput
                            value={notifTitle}
                            onChangeText={setNotifTitle}
                            placeholder="e.g. System Maintenance"
                            placeholderTextColor={colors.textSecondary}
                            style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                        />
                    </View>
                    <View>
                        <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Message Content</Text>
                        <TextInput
                            value={notifMessage}
                            onChangeText={setNotifMessage}
                            placeholder="Write your message here..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground, height: 80, textAlignVertical: "top" }]}
                        />
                    </View>
                    <View>
                        <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Target Audience</Text>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            {["ALL", "SINGLE", "MULTIPLE"].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setNotifTargetType(type)}
                                    style={[styles.modalPlanPill, { borderColor: colors.border }, notifTargetType === type && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                >
                                    <Text style={[styles.modalPlanText, { color: colors.textSecondary }, notifTargetType === type && { color: "#FFF" }]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    
                    {notifTargetType !== "ALL" && (
                        <View>
                            <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Target User IDs (comma separated)</Text>
                            <TextInput
                                value={notifTargetUsers}
                                onChangeText={setNotifTargetUsers}
                                placeholder="user-1, user-2"
                                placeholderTextColor={colors.textSecondary}
                                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                            />
                        </View>
                    )}

                    <TouchableOpacity onPress={handleCreateNotification} style={[styles.exportReportBtn, { alignSelf: 'flex-start', marginTop: 8 }]}>
                        <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.exportReportText}>Send Notification</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.gridCard, { flex: 1, padding: 0, overflow: "hidden", backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border, paddingHorizontal: 24, height: 50 }]}>
                    <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Date</Text>
                    <Text style={[styles.tableHeadCell, { flex: 2, color: colors.textSecondary }]}>Title</Text>
                    <Text style={[styles.tableHeadCell, { flex: 1, color: colors.textSecondary }]}>Target</Text>
                </View>
                <ScrollView style={{ flex: 1, minHeight: 200 }}>
                    {adminNotifications.length === 0 ? (
                        <View style={{ padding: 24, alignItems: "center" }}>
                            <Text style={{ color: colors.textSecondary }}>No notifications sent yet.</Text>
                        </View>
                    ) : (
                        adminNotifications.map((notif, idx) => (
                            <View key={idx} style={[styles.tableRow, { borderBottomColor: colors.border, paddingHorizontal: 24, height: 64 }]}>
                                <Text style={[styles.tableCellText, { flex: 1, color: colors.textSecondary }]} numberOfLines={1}>
                                    {new Date(notif.created_at).toLocaleString()}
                                </Text>
                                <Text style={[styles.tableCellText, { flex: 2, color: colors.text, fontWeight: "600" }]} numberOfLines={1}>
                                    {notif.title}
                                </Text>
                                <Text style={[styles.tableCellText, { flex: 1, color: colors.textSecondary }]} numberOfLines={1}>
                                    {notif.target_type}
                                </Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );

    // Main layout renderer
    const renderAdminDashboardContent = () => {
        if (activeTab === "Overview") return renderDashboardTab();
        if (activeTab === "Users") return renderUsersTab();
        if (activeTab === "Plans") return renderPlansTab();
        if (activeTab === "Offers") return renderOffersTab();
        if (activeTab === "Notifications") return renderNotificationsTab();
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

                            {/* User Type Selector Pills */}
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>User Type</Text>
                                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                                    {["PERSONAL", "BUSINESS"].map((typeOption) => {
                                        const isSelected = editUserType === typeOption;
                                        return (
                                            <TouchableOpacity
                                                key={typeOption}
                                                onPress={() => setEditUserType(typeOption)}
                                                style={[
                                                    styles.statusSelectionPill,
                                                    { borderColor: colors.border, backgroundColor: colors.surface },
                                                    isSelected && {
                                                        backgroundColor: colors.primary,
                                                        borderColor: colors.primary
                                                    }
                                                ]}
                                            >
                                                <Text style={{ color: isSelected ? "#FFFFFF" : colors.textSecondary, fontSize: 11, fontWeight: "700" }}>
                                                    {typeOption}
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

    const renderPlanModal = () => {
        if (!showPlanModal) return null;
        return (
            <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{editingPlan ? "Edit Plan" : "Add Plan"}</Text>
                        <TouchableOpacity onPress={() => setShowPlanModal(false)} style={styles.modalCloseBtn}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalBody}>
                        <View style={{ gap: 12 }}>
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Plan Name</Text>
                                <TextInput value={editPlanName} onChangeText={setEditPlanName} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]} />
                            </View>
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Type</Text>
                                <TextInput value={editPlanType} onChangeText={setEditPlanType} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]} />
                            </View>
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Price</Text>
                                <TextInput value={editPlanPrice} onChangeText={setEditPlanPrice} keyboardType="numeric" style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]} />
                            </View>
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Billing</Text>
                                <TextInput value={editPlanBilling} onChangeText={setEditPlanBilling} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]} />
                            </View>
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Status</Text>
                                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                                    {["Active", "Inactive"].map((s) => (
                                        <TouchableOpacity key={s} onPress={() => setEditPlanStatus(s)} style={[styles.modalPlanPill, { borderColor: colors.border }, editPlanStatus === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                                            <Text style={[styles.modalPlanText, { color: colors.textSecondary }, editPlanStatus === s && { color: "#FFF" }]}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Description (comma-separated features)</Text>
                                <TextInput value={editPlanDescription} onChangeText={setEditPlanDescription} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground, height: 80 }]} multiline />
                            </View>
                        </View>
                    </View>
                    <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setShowPlanModal(false)} style={[styles.modalActionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                            <Text style={[styles.modalActionText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSavePlan} style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}>
                            <Text style={styles.modalActionTextPrimary}>Save Plan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderOfferModal = () => {
        if (!showOfferModal) return null;
        return (
            <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{editingOffer ? "Edit Offer" : "Create Offer"}</Text>
                        <TouchableOpacity onPress={() => setShowOfferModal(false)} style={styles.modalCloseBtn}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalBody}>
                        <View style={{ gap: 12 }}>
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Offer Name</Text>
                                <TextInput value={editOfferName} onChangeText={setEditOfferName} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]} />
                            </View>
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Type</Text>
                                <TextInput value={editOfferType} onChangeText={setEditOfferType} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]} />
                            </View>
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Discount</Text>
                                <TextInput value={editOfferDiscount} onChangeText={setEditOfferDiscount} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]} />
                            </View>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Valid From</Text>
                                    <TextInput value={editOfferValidFrom} onChangeText={setEditOfferValidFrom} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Valid To</Text>
                                    <TextInput value={editOfferValidTo} onChangeText={setEditOfferValidTo} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]} />
                                </View>
                            </View>
                            <View>
                                <Text style={[styles.modalGridLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Status</Text>
                                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                                    {["Active", "Inactive"].map((s) => (
                                        <TouchableOpacity key={s} onPress={() => setEditOfferStatus(s)} style={[styles.modalPlanPill, { borderColor: colors.border }, editOfferStatus === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                                            <Text style={[styles.modalPlanText, { color: colors.textSecondary }, editOfferStatus === s && { color: "#FFF" }]}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setShowOfferModal(false)} style={[styles.modalActionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                            <Text style={[styles.modalActionText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSaveOffer} style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}>
                            <Text style={styles.modalActionTextPrimary}>Save Offer</Text>
                        </TouchableOpacity>
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
                <View style={{ flex: 1, zIndex: 10 }}>
                    {/* Admin Header Panel */}
                    {isDesktop ? (
                        <View style={[styles.headerRow, { borderBottomColor: colors.border, zIndex: 50 }]}>
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
                                <View style={{ position: "relative", zIndex: 10 }}>
                                    <TouchableOpacity
                                        style={[styles.profileBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                        activeOpacity={0.8}
                                        onPress={() => setShowProfileMenu(!showProfileMenu)}
                                    >
                                        <View style={[styles.avatar, { backgroundColor: colors.primary + "15" }]}>
                                            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700" }}>
                                                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={[styles.profileName, { color: colors.text }]}>{user?.fullName || "Platform Admin"}</Text>
                                            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || "admin@upnum.com"}</Text>
                                        </View>
                                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>

                                    {showProfileMenu && (
                                        <View style={[styles.profileDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                            <TouchableOpacity
                                                style={styles.profileDropdownItem}
                                                onPress={() => {
                                                    setShowProfileMenu(false);
                                                    logout();
                                                }}
                                            >
                                                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                                                <Text style={[styles.profileDropdownText, { color: colors.danger }]}>Logout</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
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
            {renderPlanModal()}
            {renderOfferModal()}
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
        fontSize: 13,
        fontWeight: "600",
    },
    profileDropdown: {
        position: 'absolute',
        top: 60,
        right: 0,
        width: 160,
        borderRadius: 8,
        borderWidth: 1,
        padding: 8,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    profileDropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    profileDropdownText: {
        fontSize: 14,
        fontWeight: "600"
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
    modalPlanPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    modalPlanText: {
        fontSize: 13,
        fontWeight: "600",
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        padding: 24,
        borderTopWidth: 1,
    },
    modalActionText: {
        fontSize: 14,
        fontWeight: "600",
    },
    modalActionTextPrimary: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "600",
    },
});
