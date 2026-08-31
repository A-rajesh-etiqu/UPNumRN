import React, { useState } from "react";
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

const SETTINGS_TABS = [
    { title: "General", badge: null },
    { title: "Profile Information", badge: null },
    { title: "UPI & Bank Accounts", badge: null },
    { title: "Notifications", badge: null },
    { title: "Privacy & Security", badge: null },
    { title: "Data & Sync", badge: null },
    { title: "Preferences", badge: null },
    { title: "Billing & Subscription", badge: null },
    { title: "Users & Access", badge: "Business" },
    { title: "API & Integrations", badge: "Business" },
];

export default function SettingsScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const { themeMode, resolvedTheme, colors, isDark, setThemeMode } = useAppTheme();

    const [activeTab, setActiveTab] = useState("General");
    const [defaultDashboard, setDefaultDashboard] = useState<"overview" | "ai-insights">("overview");

    // Other Settings Switches
    const [showBalance, setShowBalance] = useState(true);
    const [emailReports, setEmailReports] = useState(true);
    const [autoCategorization, setAutoCategorization] = useState(true);
    const [whatsappReports, setWhatsappReports] = useState(false);
    const [marketingComms, setMarketingComms] = useState(false);
    const [betaFeatures, setBetaFeatures] = useState(true);

    const handleSave = () => {
        if (Platform.OS === "web") {
            alert("Settings saved successfully!");
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
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalNavScroll}>
                        <View style={styles.horizontalNavInner}>
                            {SETTINGS_TABS.map((tab, idx) => {
                                const isTabActive = activeTab === tab.title;
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => setActiveTab(tab.title)}
                                        style={[styles.horizNavBtn, { backgroundColor: colors.surface, borderColor: colors.border }, isTabActive && { backgroundColor: isDark ? "#1E1B4B" : "#EDE9FE", borderColor: colors.primary }]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.horizNavBtnText, { color: colors.textSecondary }, isTabActive && { color: colors.primary, fontWeight: "700" }]}>
                                            {tab.title}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                )}

                {/* Right Side Settings Sheet */}
                <View style={styles.mainSettingsCol}>
                    
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

                    {/* Bottom Action buttons */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity onPress={handleReset} style={[styles.resetBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                            <Text style={[styles.resetBtnText, { color: colors.text }]}>Reset to Default</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
                            <Text style={styles.saveBtnText}>Save Changes</Text>
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
        marginBottom: 8,
    },
    horizontalNavInner: {
        flexDirection: "row",
        gap: 8,
    },
    sideNavBtn: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 40,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    sideNavBtnActive: {
        backgroundColor: "#EDE9FE",
    },
    sideNavBtnText: {
        fontSize: 13,
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
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    horizNavBtnActive: {
        backgroundColor: "#EDE9FE",
        borderColor: "#E9E3FF",
    },
    horizNavBtnText: {
        fontSize: 12,
        fontWeight: "500",
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
        marginTop: 8,
    },
    resetBtn: {
        borderWidth: 1,
        borderRadius: 12,
        height: 44,
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "center",
        ...Shadows.sm,
    },
    resetBtnText: {
        fontSize: 13,
        fontWeight: "600",
    },
    saveBtn: {
        borderRadius: 12,
        height: 44,
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "center",
        ...Shadows.button,
    },
    saveBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    appVersionText: {
        fontSize: 11,
        textAlign: "center",
        marginTop: 12,
    },
});
