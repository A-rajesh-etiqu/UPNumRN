import {
    Ionicons,
} from "react-native-vector-icons/Ionicons";

export interface DashboardMenuItem {
    title: string;
    route: string;
    icon: keyof typeof Ionicons.glyphMap;
}

export const DASHBOARD_MENU: DashboardMenuItem[] = [
    {
        title: "Dashboard",
        route: "/(dashboard)",
        icon: "grid-outline",
    },
    {
        title: "Transactions",
        route: "/(dashboard)/transactions",
        icon: "swap-horizontal-outline",
    },
    {
        title: "Reports",
        route: "/(dashboard)/reports",
        icon: "bar-chart-outline",
    },
    {
        title: "AI Insights",
        route: "/(dashboard)/ai",
        icon: "sparkles-outline",
    },
    {
        title: "Subscription",
        route: "/(dashboard)/subscription",
        icon: "card-outline",
    },
    {
        title: "Settings",
        route: "/(dashboard)/settings",
        icon: "settings-outline",
    },
];