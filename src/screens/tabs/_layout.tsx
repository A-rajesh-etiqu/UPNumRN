import { Tabs, usePathname } from "../../navigation/RootNavigation";
import Ionicons from "react-native-vector-icons/Ionicons";
import { View, useWindowDimensions } from "react-native";
import React, { useMemo } from "react";
import Sidebar from "../../components/layout/Sidebar";
import DashboardHeader from "../../components/layout/DashboardHeader";
import { useAuthStore } from "../../store/auth.store";
import { useAppTheme } from "../../theme";

export default function TabsLayout() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const pathname = usePathname();
    const { colors } = useAppTheme();
    const { user } = useAuthStore();
    const isBusiness = user?.userType === "BUSINESS";

    // Map pathnames to Titles and Subtitles dynamically
    const headerDetails = useMemo(() => {
        if (pathname.includes("/dashboard/ai-insights")) {
            return {
                title: "AI Insights",
                subtitle: "Smart spending patterns, recommendations, and anomaly detection logs."
            };
        }
        if (pathname.includes("/dashboard/filters")) {
            return {
                title: "Filters",
                subtitle: "Advanced search filters for granular spending analysis."
            };
        }
        if (pathname.includes("/dashboard/sales-chart")) {
            return {
                title: "Sales Analytics",
                subtitle: "In-depth sales charts and revenue metrics over time."
            };
        }
        if (pathname.includes("/dashboard")) {
            return {
                title: "Dashboard",
                subtitle: "Welcome back! Here's your UPI transaction analytics overview."
            };
        }
        if (pathname.includes("/transactions")) {
            return {
                title: "Transactions",
                subtitle: "Search, filter, manage and export your UPI transaction data."
            };
        }
        if (pathname.includes("/customers")) {
            return {
                title: "Customers",
                subtitle: "View your business customers and credited UPI transactions."
            };
        }
        if (pathname.includes("/subscription/history")) {
            return {
                title: "Billing History",
                subtitle: "View your subscription payments and invoices."
            };
        }
        if (pathname.includes("/subscription")) {
            return {
                title: "Subscription",
                subtitle: "Choose the best plan to grow your business with AI-powered insights."
            };
        }
        if (pathname.includes("/profile")) {
            return {
                title: "Profile",
                subtitle: "Manage your business profile and UPI configuration details."
            };
        }
        if (pathname.includes("/settings")) {
            return {
                title: "Settings",
                subtitle: "Manage your account, preferences and app settings."
            };
        }
        return {
            title: "UP Num",
            subtitle: "AI-Powered UPI Analytics"
        };
    }, [pathname]);

    return (
        <View style={{ flex: 1, flexDirection: isDesktop ? "row" : "column", backgroundColor: colors.background }}>
            {isDesktop && <Sidebar />}
            <View style={{ flex: 1 }}>
                <DashboardHeader title={headerDetails.title} subtitle={headerDetails.subtitle} />
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarActiveTintColor: colors.primary,
                        tabBarInactiveTintColor: colors.textSecondary,
                        tabBarStyle: {
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                            backgroundColor: colors.surface,
                            height: 60,
                            paddingBottom: 8,
                            paddingTop: 8,
                            display: isDesktop ? "none" : "flex",
                        },
                    }}
                >
            <Tabs.Screen
                name="dashboard/index"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="transactions/index"
                options={{
                    title: "Transactions",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="customers/index"
                options={{
                    title: "Customers",
                    href: isBusiness ? "/tabs/customers" : null,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="subscription/index"
                options={{
                    title: "Subscription",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="card-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile/index"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings/index"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />
            
            {/* Hide auxiliary/sub-routes from the tab bar */}
            <Tabs.Screen
                name="dashboard/ai-insights"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="dashboard/filters"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="dashboard/sales-chart"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="subscription/plans"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="subscription/history"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="transactions/details"
                options={{
                    href: null,
                }}
            />
        </Tabs>
            </View>
        </View>
    );
}
