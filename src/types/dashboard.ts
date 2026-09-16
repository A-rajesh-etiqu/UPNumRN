export interface DashboardStat {

    id: string;

    title: string;

    value: string;

    change: number;

    icon: string;

    color: string;

}

export interface QuickAction {

    id: string;

    title: string;

    icon: string;

    color: string;

    route: string;

}

export interface RecentTransaction {

    id: string;

    title: string;

    category: string;

    amount: number;

    date: string;

    type: "income" | "expense";

}

export interface SalesChartItem {

    month: string;

    value: number;

}

export interface AIInsight {

    id: string;

    title: string;

    description: string;

    type: "success" | "warning" | "info";

}

export interface GoalProgress {

    current: number;

    target: number;

}

export interface DashboardData {

    stats: DashboardStat[];

    quickActions: QuickAction[];

    salesChart: SalesChartItem[];

    recentTransactions: RecentTransaction[];

    aiInsights: AIInsight[];

    goal: GoalProgress;

    income?: number;

    incomeChange?: number;

    expenses?: number;

    expenseChange?: number;

    savings?: number;

    savingsChange?: number;

    transactionsCount?: number;

    chartDataIncome?: SalesChartItem[];

    chartDataExpense?: SalesChartItem[];

    pieData?: { value: number; color: string }[];

    topCategories?: { label: string; percent: number; amount: number; color: string }[];

}