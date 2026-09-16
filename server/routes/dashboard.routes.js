const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
    try {
        const { userId, period = 'This Month' } = req.query;

        // If no user is logged in, we can either return an error or empty state
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // 1. Fetch all transactions for this user
        const [transactions] = await db.query(
            `SELECT * FROM transactions WHERE user_id = ? ORDER BY date_time DESC`, 
            [userId]
        );

        let totalIncome = 0;
        let totalExpense = 0;
        let currentMonthIncome = 0;
        let currentMonthExpense = 0;
        let lastMonthIncome = 0;
        let lastMonthExpense = 0;
        let currentMonthTxCount = 0;
        
        // Group by month for sales chart
        const monthTotals = {};
        const incomeByMonth = {};
        const expenseByMonth = {};
        const categories = {};

        const now = new Date();
        let currentStartDate, currentEndDate, lastStartDate, lastEndDate;
        currentEndDate = new Date(now);

        let chartKeys = [];
        let getChartKey = (d) => "";

        if (period === 'This Week') {
            currentStartDate = new Date(now);
            currentStartDate.setDate(now.getDate() - now.getDay());
            currentStartDate.setHours(0,0,0,0);
            lastEndDate = new Date(currentStartDate);
            lastEndDate.setMilliseconds(-1);
            lastStartDate = new Date(lastEndDate);
            lastStartDate.setDate(lastEndDate.getDate() - 7);
            lastStartDate.setHours(0,0,0,0);

            chartKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            getChartKey = (d) => d.toLocaleString('en-US', { weekday: 'short' });
        } else if (period === 'This Year') {
            currentStartDate = new Date(now.getFullYear(), 0, 1);
            lastEndDate = new Date(now.getFullYear(), 0, 0, 23, 59, 59, 999);
            lastStartDate = new Date(now.getFullYear() - 1, 0, 1);

            chartKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            getChartKey = (d) => d.toLocaleString('en-US', { month: 'short' });
        } else if (period === 'Last Month') {
            currentStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            currentEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            lastStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            lastEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);

            chartKeys = ['W1', 'W2', 'W3', 'W4', 'W5'];
            getChartKey = (d) => {
                const date = d.getDate();
                if (date <= 7) return 'W1';
                if (date <= 14) return 'W2';
                if (date <= 21) return 'W3';
                if (date <= 28) return 'W4';
                return 'W5';
            };
        } else if (period === 'All Time') {
            currentStartDate = new Date(0);
            lastStartDate = new Date(0);
            lastEndDate = new Date(0);

            let minYear = now.getFullYear();
            let maxYear = now.getFullYear();
            if (transactions.length > 0) {
                minYear = new Date(transactions[transactions.length - 1].date_time).getFullYear();
                maxYear = new Date(transactions[0].date_time).getFullYear();
            }
            if (minYear === maxYear) {
                chartKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                getChartKey = (d) => d.toLocaleString('en-US', { month: 'short' });
            } else {
                for (let y = minYear; y <= maxYear; y++) {
                    chartKeys.push(y.toString());
                }
                getChartKey = (d) => d.getFullYear().toString();
            }
        } else {
            // "This Month"
            currentStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
            lastStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            lastEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

            chartKeys = ['W1', 'W2', 'W3', 'W4', 'W5'];
            getChartKey = (d) => {
                const date = d.getDate();
                if (date <= 7) return 'W1';
                if (date <= 14) return 'W2';
                if (date <= 21) return 'W3';
                if (date <= 28) return 'W4';
                return 'W5';
            };
        }

        chartKeys.forEach(k => {
            monthTotals[k] = 0;
            incomeByMonth[k] = 0;
            expenseByMonth[k] = 0;
        });

        const recentTransactions = transactions.slice(0, 5).map(tx => {
            const isExpense = tx.amount < 0;
            const absoluteAmount = Math.abs(tx.amount);
            
            return {
                id: tx.id,
                title: tx.title || 'UPI Transaction',
                category: tx.category || 'Transfer',
                amount: absoluteAmount,
                date: new Date(tx.date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                type: isExpense ? 'expense' : 'income'
            };
        });

        transactions.forEach(tx => {
            const amount = parseFloat(tx.amount);
            const absoluteAmount = Math.abs(amount);
            const txDate = new Date(tx.date_time);
            
            if (txDate >= currentStartDate && txDate <= currentEndDate) {
                currentMonthTxCount++;
                if (amount > 0) {
                    currentMonthIncome += amount;
                } else {
                    currentMonthExpense += absoluteAmount;
                    const cat = tx.category || "General";
                    if (!categories[cat]) categories[cat] = 0;
                    categories[cat] += absoluteAmount;
                }

                // Chart aggregation
                const chartKey = getChartKey(txDate);
                if (chartKeys.includes(chartKey)) {
                    if (amount > 0) {
                        monthTotals[chartKey] += amount;
                        incomeByMonth[chartKey] += amount;
                    } else {
                        expenseByMonth[chartKey] += absoluteAmount;
                    }
                }
            } else if (txDate >= lastStartDate && txDate <= lastEndDate) {
                if (amount > 0) {
                    lastMonthIncome += amount;
                } else {
                    lastMonthExpense += absoluteAmount;
                }
            }
            
            if (amount > 0) {
                totalIncome += amount;
            } else {
                totalExpense += absoluteAmount;
            }
        });

        // 2. Build stats
        const stats = [
            {
                id: "total-balance",
                title: "Total Balance",
                value: `₹${(totalIncome - totalExpense).toLocaleString()}`,
                change: 0, // Placeholder
                icon: "wallet",
                color: "#10b981"
            },
            {
                id: "total-income",
                title: "Total Income",
                value: `₹${totalIncome.toLocaleString()}`,
                change: 0,
                icon: "arrow-down-circle",
                color: "#3b82f6"
            },
            {
                id: "total-expense",
                title: "Total Expenses",
                value: `₹${totalExpense.toLocaleString()}`,
                change: 0,
                icon: "arrow-up-circle",
                color: "#ef4444"
            }
        ];

        // 3. Prepare Chart arrays dynamically
        const salesChart = chartKeys.map(key => ({
            month: key,
            value: monthTotals[key] || 0
        }));

        const chartDataIncome = chartKeys.map(key => ({
            month: key,
            value: incomeByMonth[key] || 0
        }));

        const chartDataExpense = chartKeys.map(key => ({
            month: key,
            value: expenseByMonth[key] || 0
        }));

        // Prepare pieData and topCategories
        const sortedCats = Object.keys(categories).map(cat => ({
            label: cat,
            amount: categories[cat]
        })).sort((a, b) => b.amount - a.amount);

        const pieColors = ['#6C2CF4', '#3B82F6', '#10B981', '#F59E0B', '#EAB308'];
        const topCategories = sortedCats.slice(0, 5).map((cat, i) => {
            const percent = totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0;
            return {
                label: cat.label,
                percent,
                amount: cat.amount,
                color: pieColors[i % pieColors.length]
            };
        });

        const pieData = topCategories.map(cat => ({
            value: cat.percent > 0 ? cat.percent : 1, // Minimum 1 for visualization if 0
            color: cat.color
        }));

        // 4. Quick Actions
        const quickActions = [
            { id: "send", title: "Send", icon: "send", color: "#3b82f6", route: "/send" },
            { id: "receive", title: "Receive", icon: "download", color: "#10b981", route: "/receive" },
            { id: "scan", title: "Scan", icon: "qr-code", color: "#8b5cf6", route: "/scan" },
            { id: "history", title: "History", icon: "clock", color: "#6366f1", route: "/history" }
        ];

        // 5. AI Insights based on real data
        const aiInsights = [];
        if (totalExpense > totalIncome && totalIncome > 0) {
            aiInsights.push({
                id: "warning-expense",
                title: "High Expenses",
                description: "Your expenses exceeded your income this period.",
                type: "warning"
            });
        } else if (totalIncome > 0) {
            aiInsights.push({
                id: "success-saving",
                title: "Great Saving",
                description: "You saved money this period!",
                type: "success"
            });
        } else {
            aiInsights.push({
                id: "info-start",
                title: "Welcome",
                description: "Sync your UPI history to see AI insights here.",
                type: "info"
            });
        }

        // 6. Goal Progress
        const goal = {
            current: totalIncome,
            target: 100000 // Mock 1 Lakh goal
        };

        const incomeChange = lastMonthIncome === 0 ? 100 : Math.round(((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100);
        const expenseChange = lastMonthExpense === 0 ? 100 : Math.round(((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100);
        
        const currentSavings = currentMonthIncome - currentMonthExpense;
        const lastMonthSavings = lastMonthIncome - lastMonthExpense;
        const savingsChange = lastMonthSavings === 0 ? 100 : Math.round(((currentSavings - lastMonthSavings) / Math.abs(lastMonthSavings)) * 100);

        const dashboardData = {
            stats,
            quickActions,
            salesChart,
            recentTransactions,
            aiInsights,
            goal,
            income: currentMonthIncome,
            incomeChange,
            expenses: currentMonthExpense,
            expenseChange,
            savings: currentSavings,
            savingsChange,
            transactionsCount: currentMonthTxCount,
            chartDataIncome,
            chartDataExpense,
            pieData,
            topCategories
        };

        res.json(dashboardData);

    } catch (error) {
        console.error("Dashboard API Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});


// POST /api/dashboard/regenerate-insights
router.post('/regenerate-insights', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: "OpenAI API Key is not configured." });
        }

        const [transactions] = await db.query(
            `SELECT title, category, amount, date_time FROM transactions WHERE user_id = ? ORDER BY date_time DESC LIMIT 50`,
            [userId]
        );

        if (!transactions || transactions.length === 0) {
            return res.json({ recommendations: [] });
        }

        const { OpenAI } = require("openai");
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const prompt = `
You are a helpful AI financial assistant. Analyze the following recent transactions for the user.
Generate 4 personalized financial recommendations based on their spending behavior.
You must respond with a JSON object containing exactly one key "recommendations", which is an array of objects.
Each object in the array must have these exact keys:
- "title": A short title (max 4 words).
- "desc": A brief description of the suggestion (1-2 sentences).
- "icon": A valid Ionicons icon name (e.g., "cart-outline", "flash-outline", "card-outline", "pie-chart-outline", "wallet-outline", "trending-down-outline").
- "color": A hex color code for the icon/text (e.g., "#10B981", "#EF4444", "#3B82F6", "#F59E0B", "#8B5CF6").
- "bg": A very light hex background color to match the 'color' (e.g., "#ECFDF5" for green, "#FEE2E2" for red, "#EFF6FF" for blue, "#FFFBEB" for yellow, "#F5F3FF" for purple).
- "btnText": A short action text (e.g., "Review", "Setup Now", "Learn More", "View Deals").

Transactions:
${JSON.stringify(transactions.map(t => ({ title: t.title, cat: t.category, amt: parseFloat(t.amount) })))}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });

        const responseJson = JSON.parse(completion.choices[0].message.content);

        res.json({ recommendations: responseJson.recommendations || [] });

    } catch (error) {
        console.error("Regenerate Insights Error:", error);
        res.status(500).json({ error: "Failed to generate insights from OpenAI" });
    }
});

module.exports = router;
