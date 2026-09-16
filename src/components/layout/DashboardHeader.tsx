import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
    Image,
    ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

import apiClient from "../../api/apiClient";

import {
    useAppTheme,
    Shadows,
    Spacing,
    ZIndex,
} from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { router, usePathname } from "../../navigation/RootNavigation";

interface Props {
    title: string;
    subtitle: string;
    onProfilePress?: () => void;
}

export default function DashboardHeader({
    title,
    subtitle,
    onProfilePress,
}: Props) {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const { user, logout } = useAuthStore();
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [notifDropdownOpen, setNotifDropdownOpen] = React.useState(false);
    const [notifications, setNotifications] = React.useState<any[]>([]);
    
    const pathname = usePathname();
    const isHistoryPage = pathname.includes("/subscription/history");
    const { colors, isDark } = useAppTheme();

    React.useEffect(() => {
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

    // Get dynamic display name and UPI address
    const fullName = user?.fullName || "Amit Sharma";
    const upiId = user?.email || "you@upi";

    // Extract initials from first name and last name
    const getInitials = () => {
        let first = "";
        let last = "";
        if (user?.firstName) {
            first = user.firstName.trim().charAt(0).toUpperCase();
        }
        if (user?.lastName) {
            last = user.lastName.trim().charAt(0).toUpperCase();
        }
        if (!first && !last && fullName) {
            const parts = fullName.trim().split(/\s+/);
            if (parts.length > 0) {
                first = parts[0].charAt(0).toUpperCase();
                if (parts.length > 1) {
                    last = parts[parts.length - 1].charAt(0).toUpperCase();
                }
            }
        }
        return `${first}${last}` || "US";
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingHorizontal: isDesktop ? Spacing.xl : Spacing.md }]}>
            {/* Left Section: Title & Subtitle or Mobile Logo */}
            <View style={styles.leftSection}>
                {!isDesktop ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Image source={require("../../../assets/images/logo.png")} style={{ width: 28, height: 28 }} resizeMode="contain" />
                        <View>
                            <Text style={[styles.titleText, { color: colors.text, fontSize: 16 }]}>UP Num</Text>
                            <Text style={[styles.subtitleText, { color: colors.textSecondary, fontSize: 10, marginTop: 0 }]}>AI-Powered UPI Analytics</Text>
                        </View>
                    </View>
                ) : (
                    <>
                        <Text style={[styles.titleText, { color: colors.text }]}>{title}</Text>
                        <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>{subtitle}</Text>
                    </>
                )}
            </View>

            {/* Right Section: Secure Payments Badge, Filters & Profile Card */}
            <View style={styles.rightSection}>
                {/* 100% Secure Payments Badge (Only on desktop, and not on billing history) */}
                {isDesktop && !isHistoryPage && (
                    <View style={[styles.secureBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[styles.shieldCircle, { backgroundColor: isDark ? "#1E1B4B" : "#F5F3FF" }]}>
                            <Ionicons
                                name="shield-checkmark"
                                size={18}
                                color={colors.primary}
                            />
                        </View>
                        <View style={styles.secureTextCol}>
                            <Text style={[styles.secureTitle, { color: colors.text }]}>100% Secure Payments</Text>
                            <Text style={[styles.secureSub, { color: colors.textSecondary }]}>Safe • Encrypted • Trusted</Text>
                        </View>
                    </View>
                )}

                {/* Date range filter and general filter for Billing History (Desktop only) */}
                {isDesktop && isHistoryPage && (
                    <View style={styles.headerFilters}>
                        <TouchableOpacity style={[styles.datePickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                            <Text style={[styles.filterBtnText, { color: colors.text }]}>01 May, 2024 - 31 May, 2024</Text>
                            <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                            <Ionicons name="funnel-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                            <Text style={[styles.filterBtnText, { color: colors.text }]}>Filter</Text>
                            <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Notification Bell */}
                <View style={{ position: "relative", zIndex: 20 }}>
                    <TouchableOpacity 
                        style={[styles.bellBtn, { 
                            backgroundColor: isDesktop ? colors.surface : "transparent", 
                            borderColor: isDesktop ? colors.border : "transparent",
                            borderWidth: isDesktop ? 1 : 0,
                            marginRight: isDesktop ? 16 : 8,
                        }]} 
                        activeOpacity={0.8}
                        onPress={() => {
                            setNotifDropdownOpen(!notifDropdownOpen);
                            setDropdownOpen(false);
                        }}
                    >
                        <Ionicons name="notifications-outline" size={20} color={colors.text} />
                        {unreadCount > 0 && (
                            <View style={[styles.bellBadge, !isDesktop && { right: 2, top: 0 }]}>
                                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {notifDropdownOpen && (
                        <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border, width: 300, right: isDesktop ? 16 : 8 }]}>
                            <Text style={{ padding: 12, fontWeight: "700", color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border }}>Notifications</Text>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {notifications.length === 0 ? (
                                    <Text style={{ padding: 16, color: colors.textSecondary, textAlign: 'center' }}>No notifications</Text>
                                ) : (
                                    notifications.map((n, idx) => (
                                        <TouchableOpacity 
                                            key={idx} 
                                            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: n.is_read ? 'transparent' : colors.primary + '10' }}
                                            onPress={() => !n.is_read && handleReadNotification(n.id)}
                                        >
                                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                                <Text style={{ fontWeight: n.is_read ? "500" : "700", color: colors.text, flex: 1 }} numberOfLines={1}>{n.title}</Text>
                                                {!n.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 }} />}
                                            </View>
                                            <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={2}>{n.message}</Text>
                                            <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                        isDesktop ? styles.profileBox : styles.mobileAvatarWrapper, 
                        isDesktop && { backgroundColor: colors.surface, borderColor: colors.border }
                    ]}
                    onPress={() => {
                        setDropdownOpen(!dropdownOpen);
                        setNotifDropdownOpen(false);
                        if (onProfilePress) {
                            onProfilePress();
                        }
                    }}
                >
                    <View style={[styles.avatar, { backgroundColor: colors.primary, marginRight: isDesktop ? 8 : 0 }]}>
                        {user?.profileImage ? (
                            <Image
                                source={{ uri: user.profileImage }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={styles.initialsText}>{getInitials()}</Text>
                        )}
                    </View>
                    {isDesktop && (
                        <View style={styles.profileTextCol}>
                            <Text style={[styles.profileName, { color: colors.text }]}>{fullName}</Text>
                            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{upiId}</Text>
                        </View>
                    )}
                    {isDesktop && (
                        <Ionicons
                            name={dropdownOpen ? "chevron-up" : "chevron-down"}
                            size={14}
                            color={colors.textSecondary}
                            style={styles.chevron}
                        />
                    )}
                </TouchableOpacity>

                {/* Dropdown Menu overlay */}
                {dropdownOpen && (
                    <>
                        <TouchableOpacity
                            style={styles.overlay}
                            activeOpacity={1}
                            onPress={() => setDropdownOpen(false)}
                        />
                        <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setDropdownOpen(false);
                                    router.push("/tabs/profile");
                                }}
                            >
                                <Ionicons
                                    name="person-outline"
                                    size={16}
                                    color={colors.textSecondary}
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={[styles.dropdownItemText, { color: colors.text }]}>Edit Profile</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setDropdownOpen(false);
                                    router.push("/tabs/settings");
                                }}
                            >
                                <Ionicons
                                    name="settings-outline"
                                    size={16}
                                    color={colors.textSecondary}
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={[styles.dropdownItemText, { color: colors.text }]}>Settings</Text>
                            </TouchableOpacity>

                            <View style={[styles.dropdownDivider, { backgroundColor: colors.border }]} />

                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setDropdownOpen(false);
                                    logout();
                                    router.replace("/auth/login");
                                }}
                            >
                                <Ionicons
                                    name="log-out-outline"
                                    size={16}
                                    color="#EF4444"
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={[styles.dropdownItemText, styles.logoutText]}>
                                    Logout
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    leftSection: {
        flexDirection: "column",
        justifyContent: "center",
    },
    titleText: {
        fontSize: 20,
        fontWeight: "700",
    },
    subtitleText: {
        fontSize: 12,
        marginTop: 4,
    },
    rightSection: {
        flexDirection: "row",
        alignItems: "center",
        position: "relative",
    },
    secureBadge: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: Spacing.lg,
        ...Shadows.sm,
    },
    shieldCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    secureTextCol: {
        flexDirection: "column",
    },
    secureTitle: {
        fontSize: 11,
        fontWeight: "700",
    },
    secureSub: {
        fontSize: 9,
        marginTop: 1,
    },
    profileBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        paddingLeft: 8,
        paddingRight: 12,
        paddingVertical: 6,
        borderRadius: 12,
        ...Shadows.sm,
    },
    mobileAvatarWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: "hidden",
        marginRight: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    initialsText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
    },
    profileTextCol: {
        flexDirection: "column",
        marginRight: 12,
    },
    profileName: {
        fontSize: 12,
        fontWeight: "700",
    },
    profileEmail: {
        fontSize: 10,
        marginTop: 1,
    },
    chevron: {
        marginLeft: 2,
    },
    overlay: {
        position: "absolute",
        top: -1000,
        bottom: -1000,
        left: -1000,
        right: -1000,
        backgroundColor: "transparent",
        zIndex: ZIndex.dropdown - 1,
    },
    dropdownMenu: {
        position: "absolute",
        top: 54,
        right: 0,
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: Spacing.sm,
        minWidth: 160,
        zIndex: ZIndex.dropdown,
        ...Shadows.md,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
    },
    dropdownItemText: {
        fontSize: 13,
        fontWeight: "600",
    },
    dropdownDivider: {
        height: 1,
        marginVertical: Spacing.xs,
    },
    logoutText: {
        color: "#EF4444",
        fontWeight: "700",
    },
    headerFilters: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginRight: 16,
    },
    datePickerBtn: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        ...Shadows.sm,
    },
    filterBtn: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        ...Shadows.sm,
    },
    filterBtnText: {
        fontSize: 12,
        fontWeight: "600",
    },
    bellBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        marginRight: 16,
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
        alignItems: "center",
    },
});