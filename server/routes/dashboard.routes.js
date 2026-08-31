const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
    try {
        const { userId } = req.query;

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
        
        // Group by month for sales chart
        const monthTotals = {};

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
            if (amount > 0) {
                totalIncome += amount;
            } else {
                totalExpense += Math.abs(amount);
            }

            // Sales chart grouping
            const date = new Date(tx.date_time);
            const monthKey = date.toLocaleString('default', { month: 'short' });
            if (!monthTotals[monthKey]) monthTotals[monthKey] = 0;
            
            // Just graph income for 'sales'
            if (amount > 0) {
                monthTotals[monthKey] += amount;
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

        // 3. Prepare Sales Chart array
        const salesChart = Object.keys(monthTotals).map(month => ({
            month,
            value: monthTotals[month]
        }));
        
        // Ensure at least some dummy structure if no data
        if (salesChart.length === 0) {
            salesChart.push({ month: "No Data", value: 0 });
        }

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

        const dashboardData = {
            stats,
            quickActions,
            salesChart,
            recentTransactions,
            aiInsights,
            goal
        };

        res.json(dashboardData);

    } catch (error) {
        console.error("Dashboard API Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});

module.exports = router;
