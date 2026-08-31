import {
    DashboardData,
} from "../types/dashboard";

export const dashboardMock: DashboardData = {

    stats: [

        {
            id: "1",
            title: "Total Balance",
            value: "₹1,24,580",
            change: +12,
            icon: "wallet",
            color: "#7C3AED",
        },

        {
            id: "2",
            title: "Income",
            value: "₹85,200",
            change: +8,
            icon: "trending-up",
            color: "#22C55E",
        },

        {
            id: "3",
            title: "Expenses",
            value: "₹42,650",
            change: -3,
            icon: "trending-down",
            color: "#EF4444",
        },

        {
            id: "4",
            title: "Transactions",
            value: "324",
            change: +18,
            icon: "swap-horizontal",
            color: "#3B82F6",
        },

    ],

    quickActions: [

        {
            id: "1",
            title: "Add Transaction",
            icon: "add-circle",
            color: "",
            route: ""
        },

        {
            id: "2",
            title: "Scan QR",
            icon: "qr-code",
            color: "",
            route: ""
        },

        {
            id: "3",
            title: "Reports",
            icon: "document-text",
            color: "",
            route: ""
        },

        {
            id: "4",
            title: "Insights",
            icon: "bulb",
            color: "",
            route: ""
        },

    ],

    salesChart: [

        {
            month: "Jan",
            value: 12000,
        },

        {
            month: "Feb",
            value: 18500,
        },

        {
            month: "Mar",
            value: 14200,
        },

        {
            month: "Apr",
            value: 23600,
        },

        {
            month: "May",
            value: 21200,
        },

        {
            month: "Jun",
            value: 28700,
        },

        {
            month: "Jul",
            value: 32400,
        },

    ],
    aiInsights: [

        {
            id: "1",
            title: "Revenue Increased",
            description: "Your revenue increased by 18% compared to last month.",
            type: "success",
        },

        {
            id: "2",
            title: "High Food Expenses",
            description: "Food spending is 22% higher than your average.",
            type: "warning",
        },

    ], goal: {

        current: 82000,

        target: 100000,

    },

    recentTransactions: [

        {
            id: "1",
            title: "Amazon",
            category: "Shopping",
            amount: -2499,
            date: "Today",
            type: "expense",
        },

        {
            id: "2",
            title: "Salary",
            category: "Income",
            amount: 50000,
            date: "Yesterday",
            type: "income",
        },

        {
            id: "3",
            title: "Swiggy",
            category: "Food",
            amount: -420,
            date: "Yesterday",
            type: "expense",
        },

        {
            id: "4",
            title: "Electric Bill",
            category: "Utilities",
            amount: -1250,
            date: "2 days ago",
            type: "expense",
        },

    ],

};