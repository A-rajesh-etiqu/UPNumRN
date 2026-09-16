import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    TextInput,
    Alert,
    Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAppTheme, Colors, Radius, Spacing, Shadows, Typography } from "../../../theme";
import { useAuthStore } from "../../../store/auth.store";
import apiClient from "../../../api/apiClient";

const SETTINGS_TABS = [
    { title: "General", badge: null },
    { title: "Profile Information", badge: null },
    { title: "UPI & Bank Accounts", badge: null },
    { title: "Privacy & Security", badge: null },
    { title: "Data & Sync", badge: null },
    { title: "Preferences", badge: null },
    { title: "Billing & Subscription", badge: null },
];

export default function SettingsScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const { themeMode, resolvedTheme, colors, isDark, setThemeMode } = useAppTheme();

    const [activeTab, setActiveTab] = useState("General");
    const [defaultDashboard, setDefaultDashboard] = useState<"overview" | "ai-insights">("overview");

    // Privacy & Security State
    const [biometricLogin, setBiometricLogin] = useState(true);

    // Data & Sync State
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
    const [syncFrequency, setSyncFrequency] = useState("Daily");
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);

    // Other Settings Switches
    const [showBalance, setShowBalance] = useState(true);
    const [emailReports, setEmailReports] = useState(true);
    const [autoCategorization, setAutoCategorization] = useState(true);
    const [whatsappReports, setWhatsappReports] = useState(false);
    const [marketingComms, setMarketingComms] = useState(false);
    const [betaFeatures, setBetaFeatures] = useState(true);

    // Profile State
    const { user, updateUser } = useAuthStore();
    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [email, setEmail] = useState(user?.email || "");
    const [mobile, setMobile] = useState(user?.mobile || "");
    const [businessName, setBusinessName] = useState(user?.businessName || "");
    const [category, setCategory] = useState(user?.category || "");
    const [city, setCity] = useState(user?.city || "");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Bank Accounts State
    const [upiAccounts, setUpiAccounts] = useState<any[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

    useEffect(() => {
        if ((activeTab === "UPI & Bank Accounts" || activeTab === "Data & Sync") && user) {
            fetchBankAccounts();
        }
    }, [activeTab, user]);

    const fetchBankAccounts = async () => {
        setIsLoadingAccounts(true);
        try {
            const res = await apiClient.get(`/users/bank-accounts?userId=${user?.id}`);
            if (res.data) {
                setUpiAccounts(res.data.upiAccounts || []);
                setBankAccounts(res.data.bankAccounts || []);
                if (res.data.bankAccounts && res.data.bankAccounts.length > 0) {
                    // Get latest sync date from the first active bank account
                    const latest = res.data.bankAccounts[0].createdAt;
                    if (latest) {
                        setLastSyncDate(new Date(latest));
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch bank accounts:", err);
        } finally {
            setIsLoadingAccounts(false);
        }
    };

    const handleSyncNow = async () => {
        if (bankAccounts.length === 0) {
            Alert.alert("No Bank Accounts", "Please link a bank account via Setu AA in 'UPI & Bank Accounts' tab first.");
            return;
        }

        const activeConsent = bankAccounts.find(a => a.status === "ACTIVE" || a.status === "READY");
        if (!activeConsent) {
            Alert.alert("No Active Consent", "Your linked bank accounts don't have an active consent to sync data.");
            return;
        }

        setIsSyncing(true);
        try {
            const res = await apiClient.post("/setu-flow/sync-consent", {
                consentId: activeConsent.id
            });
            if (res.data && res.data.success) {
                Alert.alert("Sync Successful", "Your transaction data has been synced successfully.");
                setLastSyncDate(new Date());
            } else {
                Alert.alert("Sync Failed", res.data?.message || "Unable to sync data.");
            }
        } catch (err) {
            console.error("Sync Error:", err);
            Alert.alert("Error", "An error occurred while syncing data.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSavingProfile(true);
        try {
            const res = await apiClient.put("/users/profile", {
                userId: user.id,
                firstName,
                lastName,
                email,
                mobile,
                businessName,
                category,
                city
            });
            if (res.data.user) {
                updateUser(res.data.user);
                if (Platform.OS === "web") {
                    (globalThis as any).alert("Profile updated successfully!");
                } else {
                    Alert.alert("Success", "Profile updated successfully!");
                }
            }
        } catch (err) {
            console.error(err);
            if (Platform.OS === "web") {
                (globalThis as any).alert("Failed to update profile");
            } else {
                Alert.alert("Error", "Failed to update profile");
            }
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSave = () => {
        if (Platform.OS === "web") {
            (globalThis as any).alert("Settings saved successfully!");
        } else {
            Alert.alert("Success", "Settings saved successfully!");
        }
    };

    const handleReset = () => {
        setThemeMode("light");
        setDefaultDashboard("overview");
        setShowBalance(true);
        setEmailReports(true);
        setAutoCategorization(true);
        setWhatsappReports(false);
        setMarketingComms(false);
        setBetaFeatures(true);
    };

    // Custom Switch Component
    const RenderSwitch = ({ value, onValueChange }: { value: boolean; onValueChange: () => void }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onValueChange}
            style={[styles.switchTrack, value ? { backgroundColor: colors.primary } : { backgroundColor: isDark ? "#4B5563" : "#CBD5E1" }]}
        >
            <View style={[styles.switchThumb, value ? styles.switchThumbOn : styles.switchThumbOff]} />
        </TouchableOpacity>
    );

    // Dropdown Mock Selector Component
    const RenderSelector = ({ label, value }: { label: string; value: string }) => (
        <View style={styles.selectorWrapper}>
            <Text style={[styles.selectorLabel, { color: colors.text }]}>{label}</Text>
            <TouchableOpacity style={[styles.selectorBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                <Text style={[styles.selectorValueText, { color: colors.text }]}>{value}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
            {/* Responsive grid for sub-menus & configuration sheet */}
            <View style={[styles.layoutWrapper, isDesktop ? styles.rowLayout : styles.columnLayout]}>

                {/* Left Side Sub-Navigation */}
                {isDesktop ? (
                    <View style={styles.sideNavCol}>
                        {SETTINGS_TABS.map((tab, idx) => {
                            const isTabActive = activeTab === tab.title;
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => setActiveTab(tab.title)}
                                    style={[styles.sideNavBtn, isTabActive && { backgroundColor: isDark ? "#1E1B4B" : "#EDE9FE" }]}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.sideNavBtnText, { color: colors.textSecondary }, isTabActive && { color: colors.primary, fontWeight: "700" }]}>
                                        {tab.title}
                                    </Text>
                                    {tab.badge && (
                                        <View style={styles.businessBadge}>
                                            <Text style={styles.businessBadgeText}>{tab.badge}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : (
                    // Horizontal scroll menu for mobile
                    <View style={{ marginBottom: 16 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalNavScroll} contentContainerStyle={styles.horizontalNavInner}>
                            {SETTINGS_TABS.map((tab, idx) => {
                                const isTabActive = activeTab === tab.title;
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => setActiveTab(tab.title)}
                                        style={[
                                            styles.horizNavBtn,
                                            { backgroundColor: isDark ? colors.border : "#F8FAFC", borderColor: isDark ? colors.border : "#E2E8F0" },
                                            isTabActive && { backgroundColor: colors.primary, borderColor: colors.primary, ...Shadows.sm }
                                        ]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[
                                            styles.horizNavBtnText,
                                            { color: isDark ? "#94A3B8" : "#64748B" },
                                            isTabActive && { color: "#FFFFFF", fontWeight: "700" }
                                        ]}>
                                            {tab.title}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Right Side Settings Sheet */}
                <View style={styles.mainSettingsCol}>

                    {activeTab === "General" && (
                        <>
                            {/* 1. General Settings Block */}
                            <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>General Settings</Text>
                                <Text style={[styles.cardHeaderSub, { color: colors.textSecondary }]}>Manage general preferences for your account.</Text>

                                <View style={[styles.selectorsGrid, isDesktop && styles.rowLayout]}>
                                    <View style={{ flex: 1 }}>
                                        <RenderSelector label="Language" value="English (India)" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <RenderSelector label="Currency" value="INR - Indian Rupee (₹)" />
                                    </View>
                                </View>

                                {/* Theme selector pills */}
                                <Text style={[styles.sectionLabel, { color: colors.text }]}>Theme</Text>
                                <Text style={[styles.sectionSubLabel, { color: colors.textSecondary }]}>Choose your preferred theme</Text>
                                <View style={styles.themeSelectorContainer}>
                                    <TouchableOpacity
                                        onPress={() => setThemeMode("light")}
                                        style={[styles.themeBtn, { backgroundColor: colors.surface, borderColor: colors.border }, themeMode === "light" && { borderColor: colors.primary, backgroundColor: isDark ? "#1E1B4B" : "#F5F3FF" }]}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="sunny-outline" size={16} color={themeMode === "light" ? colors.primary : colors.textSecondary} />
                                        <Text style={[styles.themeBtnText, { color: colors.textSecondary }, themeMode === "light" && { color: colors.primary }]}>Light</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setThemeMode("dark")}
                                        style={[styles.themeBtn, { backgroundColor: colors.surface, borderColor: colors.border }, themeMode === "dark" && { borderColor: colors.primary, backgroundColor: isDark ? "#1E1B4B" : "#F5F3FF" }]}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="moon-outline" size={16} color={themeMode === "dark" ? colors.primary : colors.textSecondary} />
                                        <Text style={[styles.themeBtnText, { color: colors.textSecondary }, themeMode === "dark" && { color: colors.primary }]}>Dark</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setThemeMode("system")}
                                        style={[styles.themeBtn, { backgroundColor: colors.surface, borderColor: colors.border }, themeMode === "system" && { borderColor: colors.primary, backgroundColor: isDark ? "#1E1B4B" : "#F5F3FF" }]}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="desktop-outline" size={16} color={themeMode === "system" ? colors.primary : colors.textSecondary} />
                                        <Text style={[styles.themeBtnText, { color: colors.textSecondary }, themeMode === "system" && { color: colors.primary }]}>System</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* 2. Date & Time Preferences */}
                            <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Date & Time Preferences</Text>
                                <Text style={[styles.cardHeaderSub, { color: colors.textSecondary }]}>Customize how dates and time are shown.</Text>

                                <View style={[styles.selectorsGrid, isDesktop && styles.rowLayout]}>
                                    <View style={{ flex: 1 }}>
                                        <RenderSelector label="Date Format" value="31 May, 2024 (DD MMM, YYYY)" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <RenderSelector label="Time Format" value="12 Hour (01:30 PM)" />
                                    </View>
                                </View>
                            </View>

                            {/* 3. Dashboard Preferences */}
                            <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Dashboard Preferences</Text>
                                <Text style={[styles.cardHeaderSub, { color: colors.textSecondary }]}>Customize your dashboard experience.</Text>

                                {/* Default Dashboard pills */}
                                <Text style={[styles.sectionLabel, { color: colors.text }]}>Default Dashboard</Text>
                                <Text style={[styles.sectionSubLabel, { color: colors.textSecondary }]}>Choose what you see after login</Text>
                                <View style={[styles.dashSelectorContainer, { backgroundColor: isDark ? colors.border : "#E2E8F0" }]}>
                                    <TouchableOpacity
                                        onPress={() => setDefaultDashboard("overview")}
                                        style={[styles.dashBtn, defaultDashboard === "overview" && { backgroundColor: colors.surface }]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.dashBtnText, { color: colors.textSecondary }, defaultDashboard === "overview" && { color: colors.text }]}>
                                            Overview
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setDefaultDashboard("ai-insights")}
                                        style={[styles.dashBtn, defaultDashboard === "ai-insights" && { backgroundColor: colors.surface }]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.dashBtnText, { color: colors.textSecondary }, defaultDashboard === "ai-insights" && { color: colors.text }]}>
                                            AI Insights
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.selectorsGrid, isDesktop && styles.rowLayout, { marginTop: 16 }]}>
                                    <View style={{ flex: 1 }}>
                                        <RenderSelector label="Default Date Range" value="This Month" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <RenderSelector label="Number Format" value="1,234.56" />
                                    </View>
                                </View>
                            </View>

                            {/* 4. Other Settings Switches */}
                            <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Other Settings</Text>

                                <View style={styles.switchesContainer}>
                                    {/* Row 1 */}
                                    <View style={[styles.switchGridRow, isDesktop && styles.rowLayout]}>
                                        <View style={[styles.switchGridItem, { backgroundColor: isDark ? colors.surface : "#F8FAFC", borderColor: colors.border }]}>
                                            <View style={styles.switchTextCol}>
                                                <Text style={[styles.switchLabelTitle, { color: colors.text }]}>Show Balance on Dashboard</Text>
                                                <Text style={[styles.switchLabelSub, { color: colors.textSecondary }]}>Display total balance on dashboard</Text>
                                            </View>
                                            <RenderSwitch value={showBalance} onValueChange={() => setShowBalance(!showBalance)} />
                                        </View>
                                        <View style={[styles.switchGridItem, { backgroundColor: isDark ? colors.surface : "#F8FAFC", borderColor: colors.border }]}>
                                            <View style={styles.switchTextCol}>
                                                <Text style={[styles.switchLabelTitle, { color: colors.text }]}>WhatsApp Reports</Text>
                                                <Text style={[styles.switchLabelSub, { color: colors.textSecondary }]}>Receive daily summary on WhatsApp</Text>
                                            </View>
                                            <RenderSwitch value={whatsappReports} onValueChange={() => setWhatsappReports(!whatsappReports)} />
                                        </View>
                                    </View>

                                    {/* Row 2 */}
                                    <View style={[styles.switchGridRow, isDesktop && styles.rowLayout]}>
                                        <View style={[styles.switchGridItem, { backgroundColor: isDark ? colors.surface : "#F8FAFC", borderColor: colors.border }]}>
                                            <View style={styles.switchTextCol}>
                                                <Text style={[styles.switchLabelTitle, { color: colors.text }]}>Email Reports</Text>
                                                <Text style={[styles.switchLabelSub, { color: colors.textSecondary }]}>Receive weekly summary reports via email</Text>
                                            </View>
                                            <RenderSwitch value={emailReports} onValueChange={() => setEmailReports(!emailReports)} />
                                        </View>
                                        <View style={[styles.switchGridItem, { backgroundColor: isDark ? colors.surface : "#F8FAFC", borderColor: colors.border }]}>
                                            <View style={styles.switchTextCol}>
                                                <Text style={[styles.switchLabelTitle, { color: colors.text }]}>Marketing Communications</Text>
                                                <Text style={[styles.switchLabelSub, { color: colors.textSecondary }]}>Receive updates about new features and offers</Text>
                                            </View>
                                            <RenderSwitch value={marketingComms} onValueChange={() => setMarketingComms(!marketingComms)} />
                                        </View>
                                    </View>

                                    {/* Row 3 */}
                                    <View style={[styles.switchGridRow, isDesktop && styles.rowLayout]}>
                                        <View style={[styles.switchGridItem, { backgroundColor: isDark ? colors.surface : "#F8FAFC", borderColor: colors.border }]}>
                                            <View style={styles.switchTextCol}>
                                                <Text style={[styles.switchLabelTitle, { color: colors.text }]}>Auto Categorization</Text>
                                                <Text style={[styles.switchLabelSub, { color: colors.textSecondary }]}>Automatically categorize transactions using AI</Text>
                                            </View>
                                            <RenderSwitch value={autoCategorization} onValueChange={() => setAutoCategorization(!autoCategorization)} />
                                        </View>
                                        <View style={[styles.switchGridItem, { backgroundColor: isDark ? colors.surface : "#F8FAFC", borderColor: colors.border }]}>
                                            <View style={styles.switchTextCol}>
                                                <Text style={[styles.switchLabelTitle, { color: colors.text }]}>Beta Features</Text>
                                                <Text style={[styles.switchLabelSub, { color: colors.textSecondary }]}>Get early access to new features</Text>
                                            </View>
                                            <RenderSwitch value={betaFeatures} onValueChange={() => setBetaFeatures(!betaFeatures)} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </>
                    )}

                    {activeTab === "UPI & Bank Accounts" && (
                        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>UPI & Bank Accounts</Text>
                            <Text style={[styles.cardHeaderSub, { color: colors.textSecondary }]}>Manage your linked UPI IDs and Bank Accounts via Setu AA.</Text>

                            {isLoadingAccounts ? (
                                <Text style={{ color: colors.textSecondary, marginVertical: 20 }}>Loading accounts...</Text>
                            ) : (
                                <>
                                    <View style={{ marginBottom: 24 }}>
                                        <Text style={[styles.sectionLabel, { color: colors.text, marginBottom: 12 }]}>Linked UPI IDs</Text>
                                        {upiAccounts.length === 0 ? (
                                            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No UPI IDs linked yet.</Text>
                                        ) : (
                                            upiAccounts.map((account) => (
                                                <View key={account.id} style={[styles.accountCard, { backgroundColor: isDark ? colors.border : "#F8FAFC", borderColor: colors.border }]}>
                                                    <View style={styles.accountIconBox}>
                                                        <Ionicons name="at-circle-outline" size={24} color={colors.primary} />
                                                    </View>
                                                    <View style={styles.accountInfo}>
                                                        <Text style={[styles.accountTitle, { color: colors.text }]}>{account.upiId}</Text>
                                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                                                            {account.isPrimary && (
                                                                <View style={styles.primaryBadge}>
                                                                    <Text style={styles.primaryBadgeText}>Primary</Text>
                                                                </View>
                                                            )}
                                                            {account.isVerified ? (
                                                                <Text style={{ fontSize: 11, color: "#10B981", fontWeight: "600" }}>✓ Verified</Text>
                                                            ) : (
                                                                <Text style={{ fontSize: 11, color: "#F59E0B", fontWeight: "600" }}>Pending Verification</Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            ))
                                        )}
                                    </View>

                                    <View>
                                        <Text style={[styles.sectionLabel, { color: colors.text, marginBottom: 12 }]}>Linked Bank Accounts (Setu AA)</Text>
                                        {bankAccounts.length === 0 ? (
                                            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No bank accounts synced via Setu AA.</Text>
                                        ) : (
                                            bankAccounts.map((account) => (
                                                <View key={account.id} style={[styles.accountCard, { backgroundColor: isDark ? colors.border : "#F8FAFC", borderColor: colors.border }]}>
                                                    <View style={styles.accountIconBox}>
                                                        <Ionicons name="business-outline" size={24} color={colors.primary} />
                                                    </View>
                                                    <View style={styles.accountInfo}>
                                                        <Text style={[styles.accountTitle, { color: colors.text }]}>{account.vua}</Text>
                                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                                                            <View style={[styles.statusBadge, { backgroundColor: account.status === "ACTIVE" || account.status === "READY" ? "#ECFDF5" : "#FEF2F2" }]}>
                                                                <Text style={[styles.statusBadgeText, { color: account.status === "ACTIVE" || account.status === "READY" ? "#10B981" : "#EF4444" }]}>
                                                                    {account.status}
                                                                </Text>
                                                            </View>
                                                            {account.createdAt && (
                                                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>Synced on {new Date(account.createdAt).toLocaleDateString()}</Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            ))
                                        )}
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {activeTab === "Privacy & Security" && (
                        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Security & Privacy</Text>
                            <Text style={[styles.cardHeaderSub, { color: colors.textSecondary }]}>Keep your account safe and your data private</Text>

                            <View style={[styles.selectorsGrid, isDesktop && styles.rowLayout, { gap: 24 }]}>
                                {/* Left Column: Security */}
                                <View style={{ flex: 1, gap: 4 }}>
                                    <TouchableOpacity style={styles.privacyListItem} activeOpacity={0.7}>
                                        <View style={styles.privacyListIcon}>
                                            <Ionicons name="key-outline" size={18} color="#6D28D9" />
                                        </View>
                                        <Text style={[styles.privacyListText, { color: colors.text }]}>Change Password</Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: "auto" }} />
                                    </TouchableOpacity>

                                    <View style={styles.privacyListItem}>
                                        <View style={styles.privacyListIcon}>
                                            <Ionicons name="finger-print-outline" size={18} color="#6D28D9" />
                                        </View>
                                        <Text style={[styles.privacyListText, { color: colors.text }]}>Enable Biometric Login</Text>
                                        <View style={{ marginLeft: "auto" }}>
                                            <RenderSwitch value={biometricLogin} onValueChange={() => setBiometricLogin(!biometricLogin)} />
                                        </View>
                                    </View>

                                    <TouchableOpacity style={styles.privacyListItem} activeOpacity={0.7}>
                                        <View style={styles.privacyListIcon}>
                                            <Ionicons name="shield-checkmark-outline" size={18} color="#6D28D9" />
                                        </View>
                                        <Text style={[styles.privacyListText, { color: colors.text }]}>Two-Factor Authentication</Text>
                                        <View style={[styles.offBadge, { backgroundColor: isDark ? colors.border : "#F1F5F9" }]}>
                                            <Text style={styles.offBadgeText}>Off</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.privacyListItem} activeOpacity={0.7}>
                                        <View style={styles.privacyListIcon}>
                                            <Ionicons name="phone-portrait-outline" size={18} color="#6D28D9" />
                                        </View>
                                        <Text style={[styles.privacyListText, { color: colors.text }]}>Active Devices</Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: "auto" }} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.privacyListItem} activeOpacity={0.7}>
                                        <View style={styles.privacyListIcon}>
                                            <Ionicons name="time-outline" size={18} color="#6D28D9" />
                                        </View>
                                        <Text style={[styles.privacyListText, { color: colors.text }]}>Login History</Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: "auto" }} />
                                    </TouchableOpacity>
                                </View>

                                {/* Right Column: Privacy */}
                                <View style={{ flex: 1, gap: 4 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8, paddingHorizontal: 12 }}>
                                        <View style={[styles.privacyListIcon, { backgroundColor: "#EDE9FE" }]}>
                                            <Ionicons name="lock-closed" size={18} color="#6D28D9" />
                                        </View>
                                        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>Privacy</Text>
                                    </View>

                                    <TouchableOpacity style={styles.privacyListItem} activeOpacity={0.7}>
                                        <View style={styles.privacyListIcon}>
                                            <Ionicons name="link-outline" size={18} color="#6D28D9" />
                                        </View>
                                        <Text style={[styles.privacyListText, { color: colors.text }]}>Transaction data sharing</Text>
                                        <Text style={{ color: "#10B981", fontSize: 12, fontWeight: "600", marginLeft: "auto", marginRight: 8 }}>On</Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.privacyListItem} activeOpacity={0.7}>
                                        <View style={styles.privacyListIcon}>
                                            <Ionicons name="hardware-chip-outline" size={18} color="#6D28D9" />
                                        </View>
                                        <Text style={[styles.privacyListText, { color: colors.text }]}>AI data analysis permission</Text>
                                        <Text style={{ color: "#10B981", fontSize: 12, fontWeight: "600", marginLeft: "auto", marginRight: 8 }}>On</Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.privacyListItem} activeOpacity={0.7}>
                                        <View style={styles.privacyListIcon}>
                                            <Ionicons name="options-outline" size={18} color="#6D28D9" />
                                        </View>
                                        <Text style={[styles.privacyListText, { color: colors.text }]}>Personalized insights</Text>
                                        <Text style={{ color: "#10B981", fontSize: 12, fontWeight: "600", marginLeft: "auto", marginRight: 8 }}>On</Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.privacyListItem} activeOpacity={0.7}>
                                        <View style={styles.privacyListIcon}>
                                            <Ionicons name="cloud-download-outline" size={18} color="#6D28D9" />
                                        </View>
                                        <Text style={[styles.privacyListText, { color: colors.text }]}>Download my data</Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: "auto" }} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.privacyListItem} activeOpacity={0.7}>
                                        <View style={styles.privacyListIcon}>
                                            <Ionicons name="trash-outline" size={18} color="#6D28D9" />
                                        </View>
                                        <Text style={[styles.privacyListText, { color: colors.text }]}>Delete account</Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: "auto" }} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {activeTab === "Data & Sync" && (
                        <View style={{ gap: 16 }}>
                            {/* Top Row: Transaction Sync & Auto Sync */}
                            <View style={[styles.switchGridRow, isDesktop && styles.rowLayout]}>
                                {/* Transaction Sync */}
                                <View style={[styles.settingsCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 0 }]}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                        <View>
                                            <Text style={[styles.cardHeaderTitle, { color: colors.text, marginBottom: 4 }]}>Transaction Sync</Text>
                                            <Text style={{ color: "#6366F1", fontSize: 13, fontWeight: "600" }}>Setu AA</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: "#ECFDF5" }]}>
                                            <Text style={[styles.statusBadgeText, { color: "#10B981" }]}>Synced</Text>
                                        </View>
                                    </View>
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Last Sync</Text>
                                        <Text style={{ fontSize: 13, color: colors.text, fontWeight: "500" }}>
                                            {lastSyncDate ? lastSyncDate.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Never synced"}
                                        </Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={[styles.saveBtn, { backgroundColor: "#6D28D9", marginTop: 0, opacity: isSyncing ? 0.7 : 1 }]} 
                                        onPress={handleSyncNow}
                                        disabled={isSyncing}
                                    >
                                        <Text style={styles.saveBtnText}>{isSyncing ? "Syncing..." : "Sync Now"}</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Automatic Sync */}
                                <View style={[styles.settingsCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 0 }]}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                        <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Automatic Sync</Text>
                                        <RenderSwitch value={autoSyncEnabled} onValueChange={() => setAutoSyncEnabled(!autoSyncEnabled)} />
                                    </View>
                                    <Text style={[styles.sectionLabel, { color: colors.text, marginBottom: 8 }]}>Sync Frequency</Text>
                                    <TouchableOpacity 
                                        style={[styles.input, { borderColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]} 
                                        disabled={!autoSyncEnabled}
                                    >
                                        <Text style={{ color: autoSyncEnabled ? colors.text : colors.textSecondary }}>{syncFrequency}</Text>
                                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Bottom Row: Data Management & Security Card */}
                            <View style={[styles.switchGridRow, isDesktop && styles.rowLayout]}>
                                {/* Data Management */}
                                <View style={[styles.settingsCard, { flex: 1.5, backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 0 }]}>
                                    <Text style={[styles.cardHeaderTitle, { color: colors.text, marginBottom: 16 }]}>Data Management</Text>
                                    <View style={{ gap: 12 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                                <View style={[styles.privacyListIcon, { backgroundColor: "#F8FAFC" }]}>
                                                    <Ionicons name="document-text-outline" size={18} color="#64748B" />
                                                </View>
                                                <View>
                                                    <Text style={[styles.privacyListText, { color: colors.text }]}>Export Transaction Data</Text>
                                                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>Download your transaction history</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity style={{ borderWidth: 1, borderColor: "#6D28D9", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 }}>
                                                <Text style={{ color: "#6D28D9", fontSize: 12, fontWeight: "600" }}>Export</Text>
                                            </TouchableOpacity>
                                        </View>
                                        
                                        <View style={{ height: 1, backgroundColor: colors.border }} />
                                        
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                                <View style={[styles.privacyListIcon, { backgroundColor: "#F8FAFC" }]}>
                                                    <Ionicons name="bar-chart-outline" size={18} color="#64748B" />
                                                </View>
                                                <View>
                                                    <Text style={[styles.privacyListText, { color: colors.text }]}>Download Financial Report</Text>
                                                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>Get detailed report</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity style={{ borderWidth: 1, borderColor: "#6D28D9", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 }}>
                                                <Text style={{ color: "#6D28D9", fontSize: 12, fontWeight: "600" }}>Download</Text>
                                            </TouchableOpacity>
                                        </View>
                                        
                                        <View style={{ height: 1, backgroundColor: colors.border }} />

                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                                <View style={[styles.privacyListIcon, { backgroundColor: "#FEF2F2" }]}>
                                                    <Ionicons name="trash-bin-outline" size={18} color="#EF4444" />
                                                </View>
                                                <View>
                                                    <Text style={[styles.privacyListText, { color: colors.text }]}>Clear Cached Data</Text>
                                                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>Remove temporary files</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity style={{ borderWidth: 1, borderColor: "#EF4444", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 }}>
                                                <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "600" }}>Clear Cache</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {/* Security Banner */}
                                <View style={[{ flex: 1, backgroundColor: "#F5F3FF", borderRadius: 12, padding: 24, justifyContent: "center" }]}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#EDE9FE", justifyContent: "center", alignItems: "center" }}>
                                            <Ionicons name="shield-checkmark" size={20} color="#6D28D9" />
                                        </View>
                                        <Ionicons name="lock-closed" size={48} color="#8B5CF6" style={{ opacity: 0.2 }} />
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#4C1D95", marginBottom: 8 }}>Your data is secure</Text>
                                    <Text style={{ fontSize: 13, color: "#6D28D9", lineHeight: 20 }}>
                                        We use bank-grade security to keep your data safe and private.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                    {activeTab === "Billing & Subscription" && (
                        <View style={{ gap: 16 }}>
                            {/* Header */}
                            <View style={{ marginBottom: 8, paddingHorizontal: 4 }}>
                                <Text style={[styles.cardHeaderTitle, { color: colors.text, fontSize: 18 }]}>Billing & Subscription</Text>
                                <Text style={[styles.cardHeaderSub, { color: colors.textSecondary }]}>Manage your plan, payment method and billing history</Text>
                            </View>

                            {/* Top Row: Current Plan & Payment Method */}
                            <View style={[styles.switchGridRow, isDesktop && styles.rowLayout]}>
                                {/* Current Plan Card */}
                                <View style={[styles.settingsCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 0 }]}>
                                    <Text style={[styles.cardHeaderTitle, { color: colors.text, fontSize: 14, marginBottom: 16 }]}>Current Plan</Text>
                                    
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <View style={{ flexDirection: "row", gap: 12 }}>
                                            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#FCE7F3", justifyContent: "center", alignItems: "center" }}>
                                                <Ionicons name="sparkles" size={24} color="#DB2777" />
                                            </View>
                                            <View>
                                                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Founder Plan</Text>
                                                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>₹10 / month</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: "#ECFDF5", paddingHorizontal: 8, paddingVertical: 4 }]}>
                                            <Text style={[styles.statusBadgeText, { color: "#10B981" }]}>Active</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={{ marginTop: 24, marginBottom: 24 }}>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Next Billing Date</Text>
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>15 Oct 2026</Text>
                                    </View>
                                    
                                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, width: "100%", alignItems: "center" }]} activeOpacity={0.8}>
                                        <Text style={styles.saveBtnText}>Manage Subscription</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Payment Method Card */}
                                <View style={[styles.settingsCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 0 }]}>
                                    <Text style={[styles.cardHeaderTitle, { color: colors.text, fontSize: 14, marginBottom: 16 }]}>Payment Method</Text>
                                    
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 }}>
                                            <View style={{ backgroundColor: "#F8FAFC", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                <Ionicons name="logo-google" size={14} color="#EA4335" />
                                                <Text style={{ fontSize: 12, fontWeight: "700", color: "#333" }}>UPI</Text>
                                            </View>
                                            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text, flexShrink: 1 }} numberOfLines={1}>rajesh@okaxis</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: "#ECFDF5", paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 }]}>
                                            <Text style={[styles.statusBadgeText, { color: "#10B981" }]}>Active</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 8 }} activeOpacity={0.7}>
                                        <Ionicons name="sync-outline" size={16} color={colors.primary} />
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>Change</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Billing History Card */}
                            <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <Text style={[styles.cardHeaderTitle, { color: colors.text, fontSize: 14, marginBottom: 0 }]}>Billing History</Text>
                                    <TouchableOpacity activeOpacity={0.7}>
                                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>View All</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Table Container with horizontal scroll for small screens */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ minWidth: 500, flex: 1 }}>
                                        {/* Table Header */}
                                        <View style={{ flexDirection: "row", backgroundColor: isDark ? colors.border : "#F8FAFC", padding: 12, borderRadius: 8, marginBottom: 8 }}>
                                            <Text style={{ width: 120, fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Date</Text>
                                            <Text style={{ width: 100, fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Amount</Text>
                                            <Text style={{ width: 100, fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Status</Text>
                                            <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Invoice</Text>
                                        </View>

                                        {/* Table Rows */}
                                        {[
                                            { date: "15 Aug 2026", amount: "₹10", status: "Success" },
                                            { date: "15 Jul 2026", amount: "₹10", status: "Success" },
                                            { date: "15 Jun 2026", amount: "₹10", status: "Success" },
                                            { date: "15 May 2026", amount: "₹10", status: "Success" },
                                        ].map((item, idx) => (
                                            <View key={idx} style={{ flexDirection: "row", padding: 12, borderBottomWidth: idx === 3 ? 0 : 1, borderBottomColor: colors.border, alignItems: "center" }}>
                                                <Text style={{ width: 120, fontSize: 13, fontWeight: "500", color: colors.text }}>{item.date}</Text>
                                                <Text style={{ width: 100, fontSize: 13, color: colors.text }}>{item.amount}</Text>
                                                <View style={{ width: 100, alignItems: "flex-start" }}>
                                                    <View style={[styles.statusBadge, { backgroundColor: "#ECFDF5", paddingHorizontal: 8, paddingVertical: 4 }]}>
                                                        <Text style={[styles.statusBadgeText, { color: "#10B981" }]}>{item.status}</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }} activeOpacity={0.7}>
                                                    <Ionicons name="document-text-outline" size={14} color={colors.primary} />
                                                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>Download</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* Actions Row */}
                            <View style={[styles.switchGridRow, isDesktop && styles.rowLayout]}>
                                {/* Invoice Actions */}
                                <View style={[styles.settingsCard, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 0 }]}>
                                    <Text style={[styles.cardHeaderTitle, { color: colors.text, fontSize: 14, marginBottom: 16 }]}>Invoice Actions</Text>
                                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                                        <TouchableOpacity style={{ flexGrow: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, gap: 6 }} activeOpacity={0.7}>
                                            <Ionicons name="download-outline" size={16} color={colors.primary} />
                                            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>Download Invoice</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={{ flexGrow: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, gap: 6 }} activeOpacity={0.7}>
                                            <Ionicons name="mail-outline" size={16} color={colors.primary} />
                                            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>Resend Invoice</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                
                                {/* Subscription Actions */}
                                <View style={[styles.settingsCard, { flex: 1.5, backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 0 }]}>
                                    <Text style={[styles.cardHeaderTitle, { color: colors.text, fontSize: 14, marginBottom: 16 }]}>Subscription Actions</Text>
                                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                                        <TouchableOpacity style={{ flexGrow: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, gap: 6 }} activeOpacity={0.7}>
                                            <Ionicons name="swap-horizontal-outline" size={16} color={colors.primary} />
                                            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>Change Plan</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={{ flexGrow: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, gap: 6 }} activeOpacity={0.7}>
                                            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>Update Payment</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={{ flexGrow: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FECACA", borderRadius: 10, padding: 10, gap: 6 }} activeOpacity={0.7}>
                                            <Text style={{ fontSize: 12, fontWeight: "600", color: "#EF4444" }}>Cancel Subscription</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {activeTab === "Profile Information" && (
                        <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Profile Information</Text>
                            <Text style={[styles.cardHeaderSub, { color: colors.textSecondary }]}>Update your personal and business details.</Text>

                            <View style={styles.formRow}>
                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
                                    <TextInput style={[styles.input, { backgroundColor: isDark ? colors.inputBackground : "#F8FAFC", color: colors.text, borderColor: colors.border }]} value={firstName} onChangeText={setFirstName} placeholder="First Name" placeholderTextColor={colors.placeholder} />
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
                                    <TextInput style={[styles.input, { backgroundColor: isDark ? colors.inputBackground : "#F8FAFC", color: colors.text, borderColor: colors.border }]} value={lastName} onChangeText={setLastName} placeholder="Last Name" placeholderTextColor={colors.placeholder} />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
                                <TextInput style={[styles.input, { backgroundColor: isDark ? colors.inputBackground : "#F8FAFC", color: colors.text, borderColor: colors.border }]} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="Email Address" placeholderTextColor={colors.placeholder} />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Mobile Number</Text>
                                <TextInput style={[styles.input, { backgroundColor: isDark ? colors.inputBackground : "#F8FAFC", color: colors.text, borderColor: colors.border }]} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholder="Mobile Number" placeholderTextColor={colors.placeholder} />
                            </View>

                            {user?.userType === "BUSINESS" && (
                                <>
                                    <View style={styles.formGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>Business Name</Text>
                                        <TextInput style={[styles.input, { backgroundColor: isDark ? colors.inputBackground : "#F8FAFC", color: colors.text, borderColor: colors.border }]} value={businessName} onChangeText={setBusinessName} placeholder="Business Name" placeholderTextColor={colors.placeholder} />
                                    </View>
                                    <View style={styles.formRow}>
                                        <View style={styles.formGroup}>
                                            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
                                            <TextInput style={[styles.input, { backgroundColor: isDark ? colors.inputBackground : "#F8FAFC", color: colors.text, borderColor: colors.border }]} value={category} onChangeText={setCategory} placeholder="Category" placeholderTextColor={colors.placeholder} />
                                        </View>
                                        <View style={styles.formGroup}>
                                            <Text style={[styles.label, { color: colors.text }]}>City</Text>
                                            <TextInput style={[styles.input, { backgroundColor: isDark ? colors.inputBackground : "#F8FAFC", color: colors.text, borderColor: colors.border }]} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={colors.placeholder} />
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* Bottom Action buttons */}
                    <View style={styles.actionsRow}>
                        {activeTab === "General" && (
                            <TouchableOpacity onPress={handleReset} style={[styles.resetBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                                <Text style={[styles.resetBtnText, { color: colors.text }]}>Reset to Default</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={activeTab === "Profile Information" ? handleSaveProfile : handleSave}
                            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSavingProfile ? 0.7 : 1 }]}
                            activeOpacity={0.8}
                            disabled={isSavingProfile}
                        >
                            <Text style={styles.saveBtnText}>{isSavingProfile ? "Saving..." : "Save Changes"}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.appVersionText, { color: colors.textSecondary }]}>App Version 1.0.0</Text>
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
    headerRow: {
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        paddingBottom: 16,
        marginBottom: 24,
        gap: 16,
    },
    title: {
        ...Typography.h2,
        color: Colors.text,
    },
    subtitle: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    headerWidgets: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    secureBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ECFDF5",
        borderWidth: 1,
        borderColor: "#D1FAE5",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 8,
    },
    secureBadgeTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: "#065F46",
    },
    secureBadgeSub: {
        fontSize: 9,
        color: "#047857",
    },
    profileBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
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
        backgroundColor: "#F5F3FF",
        justifyContent: "center",
        alignItems: "center",
    },
    profileName: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.text,
    },
    profileEmail: {
        fontSize: 10,
        color: Colors.textSecondary,
    },
    layoutWrapper: {
        gap: 24,
    },
    rowLayout: {
        flexDirection: "row",
    },
    columnLayout: {
        flexDirection: "column",
    },
    sideNavCol: {
        flex: 0.8,
        gap: 6,
    },
    horizontalNavScroll: {
        width: "100%",
        flexGrow: 0,
    },
    horizontalNavInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    sideNavBtn: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 44,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    sideNavBtnActive: {
        backgroundColor: "#EDE9FE",
    },
    sideNavBtnText: {
        fontSize: 14,
        fontWeight: "500",
    },
    sideNavBtnTextActive: {
        fontWeight: "700",
    },
    businessBadge: {
        backgroundColor: "#F5F3FF",
        borderWidth: 1,
        borderColor: "#E9E3FF",
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    businessBadgeText: {
        fontSize: 8,
        fontWeight: "700",
        color: "#6D28D9",
    },
    horizNavBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    horizNavBtnActive: {
        backgroundColor: "#EDE9FE",
        borderColor: "#E9E3FF",
    },
    horizNavBtnText: {
        fontSize: 13,
        fontWeight: "600",
    },
    horizNavBtnTextActive: {
        fontWeight: "700",
    },
    mainSettingsCol: {
        flex: 2,
        gap: 24,
    },
    settingsCard: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        ...Shadows.md,
    },
    cardHeaderTitle: {
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 4,
    },
    cardHeaderSub: {
        fontSize: 12,
        marginBottom: 20,
    },
    selectorsGrid: {
        gap: 16,
        marginBottom: 20,
    },
    selectorWrapper: {
        gap: 8,
    },
    selectorLabel: {
        fontSize: 13,
        fontWeight: "700",
    },
    selectorBtn: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 42,
    },
    selectorValueText: {
        fontSize: 13,
        fontWeight: "500",
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: "700",
        marginTop: 10,
    },
    sectionSubLabel: {
        fontSize: 11,
        marginTop: 2,
        marginBottom: 10,
    },
    themeSelectorContainer: {
        flexDirection: "row",
        gap: 12,
    },
    themeBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        height: 40,
    },
    themeBtnActive: {
        borderColor: "#A78BFA",
        backgroundColor: "#F5F3FF",
    },
    themeBtnText: {
        fontSize: 13,
        fontWeight: "600",
    },
    themeBtnTextActive: {},
    dashSelectorContainer: {
        flexDirection: "row",
        borderRadius: 10,
        padding: 3,
        alignSelf: "flex-start",
    },
    dashBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    dashBtnActive: {
        ...Shadows.sm,
    },
    dashBtnText: {
        fontSize: 12,
        fontWeight: "600",
    },
    dashBtnTextActive: {},
    switchesContainer: {
        gap: 16,
    },
    switchGridRow: {
        gap: 20,
    },
    switchGridItem: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
    },
    switchTextCol: {
        flex: 1,
        gap: 2,
    },
    switchLabelTitle: {
        fontSize: 12,
        fontWeight: "700",
    },
    switchLabelSub: {
        fontSize: 10,
    },
    switchTrack: {
        width: 44,
        height: 24,
        borderRadius: 12,
        padding: 2,
    },
    switchTrackOn: {},
    switchTrackOff: {},
    switchThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
            },
            android: {
                elevation: 1,
            },
            web: {
                boxShadow: "0 2px 3px rgba(0,0,0,0.15)",
            } as any,
        }),
    },
    switchThumbOn: {
        alignSelf: "flex-end",
    },
    switchThumbOff: {
        alignSelf: "flex-start",
    },
    actionsRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
    },
    resetBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    resetBtnText: {
        fontWeight: "600",
    },
    saveBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    saveBtnText: {
        color: "#FFFFFF",
    },
    appVersionText: {
        fontSize: 12,
        textAlign: "center",
        marginTop: 16,
    },
    formGroup: {
        marginBottom: 16,
        flex: 1,
    },
    formRow: {
        flexDirection: "row",
        gap: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
    },
    accountCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    accountIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#EDE9FE",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    accountInfo: {
        flex: 1,
    },
    accountTitle: {
        fontSize: 14,
        fontWeight: "600",
    },
    primaryBadge: {
        backgroundColor: "#EDE9FE",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    primaryBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#6D28D9",
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: "700",
    },
    privacyListItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    privacyListIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#F5F3FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    privacyListText: {
        fontSize: 13,
        fontWeight: "500",
    },
    offBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: "auto",
        marginRight: 8,
    },
    offBadgeText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#64748B",
    },
});
