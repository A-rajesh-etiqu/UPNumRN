const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./db");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// ==========================================
// Authentication APIs
// ==========================================

app.post("/api/auth/register", async (req, res) => {
    const { firstName, lastName, email, mobile, password, userType, businessName, category, city } = req.body;
    const fullName = `${firstName} ${lastName}`;
    const id = `user-${Date.now()}`;
    const role = (email.toLowerCase() === "admin@upnum.com" || email.toLowerCase().includes("admin")) ? "ADMIN" : "USER";

    try {
        // 1. Insert into users table
        await db.query(`
            INSERT INTO users (id, name, email, mobile, role, status, password, user_type)
            VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?);
        `, [id, fullName, email, mobile, role, password, userType || 'PERSONAL']);

        // 2. Insert into profiles table
        await db.query(`
            INSERT INTO profiles (user_id, business_name, category, city, language, currency)
            VALUES (?, ?, ?, ?, 'English (India)', 'INR - Indian Rupee (₹)');
        `, [id, businessName || null, category || null, city || null]);

        // 3. Create default upi account (unverified)
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const upiId = `${firstName.toLowerCase()}${randNum}@upi`;
        await db.query(`
            INSERT INTO upi_accounts (user_id, upi_id, verified, primary_flag)
            VALUES (?, ?, TRUE, TRUE);
        `, [id, email.split("@")[0] + "@upi"]);

        // 4. Create pending trial subscription
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setMonth(trialEnd.getMonth() + 1); // 1 month free trial
        await db.query(`
            INSERT INTO subscriptions (user_id, plan_id, trial_start, trial_end, billing_day, next_billing_date, status)
            VALUES (?, 'standard', ?, ?, ?, ?, 'ACTIVE');
        `, [id, trialStart, trialEnd, 1, trialEnd]);

        res.status(201).json({
            message: "User registered successfully",
            userId: id,
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
            otpRequired: false,
            user: {
                id,
                firstName,
                lastName,
                fullName,
                email,
                mobile,
                role,
                userType: userType || 'PERSONAL',
                isVerified: true,
                isUpiVerified: true,
                subscription: { id: "standard", name: "Standard Plan", price: 50, currency: "INR", billingCycle: "MONTHLY", isLifetimeOffer: false, status: "ACTIVE" }
            }
        });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: "Failed to register user. Email might be already in use." });
    }
});

// Simple in-memory mock store for OTPs
const otpStore = new Map();

app.post("/api/auth/login", async (req, res) => {
    const { mobile, password } = req.body;
    try {
        const [rows] = await db.query("SELECT * FROM users WHERE mobile = ? LIMIT 1;", [mobile]);
        if (rows.length === 0 || rows[0].password !== password) {
            return res.status(401).json({ error: "Invalid mobile number or password" });
        }

        const userRow = rows[0];
        const names = userRow.name.split(" ");
        const firstName = names[0] || "";
        const lastName = names.slice(1).join(" ") || "";

        const [upiRows] = await db.query("SELECT verified FROM upi_accounts WHERE user_id = ? AND primary_flag = TRUE LIMIT 1;", [userRow.id]);
        const isUpiVerified = upiRows.length > 0 ? !!upiRows[0].verified : false;

        const [subRows] = await db.query("SELECT * FROM subscriptions WHERE user_id = ? LIMIT 1;", [userRow.id]);
        let subscription = { id: "free", name: "Free Tier", price: 0, currency: "INR", billingCycle: "MONTHLY", isLifetimeOffer: false, status: "ACTIVE" };
        if (subRows.length > 0) {
            const s = subRows[0];
            if (s.plan_id === "lifetime") {
                subscription = { id: "lifetime", name: "Founder Offer", price: 10, currency: "INR", billingCycle: "LIFETIME", isLifetimeOffer: true, status: s.status };
            } else if (s.plan_id === "monthly" || s.plan_id === "standard") {
                subscription = { id: "standard", name: "Standard Plan", price: 50, currency: "INR", billingCycle: "MONTHLY", isLifetimeOffer: false, status: s.status };
            } else if (s.plan_id === "free-trial") {
                subscription = { id: "standard", name: "Standard Plan", price: 50, currency: "INR", billingCycle: "MONTHLY", isLifetimeOffer: false, status: s.status };
            }
        }

        res.json({
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
            expiresIn: 3600,
            tokenType: "Bearer",
            user: {
                id: userRow.id,
                firstName,
                lastName,
                fullName: userRow.name,
                email: userRow.email,
                mobile: userRow.mobile,
                role: userRow.role,
                userType: userRow.user_type,
                isVerified: true,
                isUpiVerified,
                subscription
            }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Authentication failed" });
    }
});

app.post("/api/auth/forgot-password", async (req, res) => {
    const { mobile } = req.body;
    try {
        const [rows] = await db.query("SELECT id FROM users WHERE mobile = ? LIMIT 1;", [mobile]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Mobile number not registered" });
        }
        
        const otp = "123456"; // Mock OTP for development
        otpStore.set(mobile, otp);
        
        res.json({ message: "OTP sent successfully", otp }); // Returning OTP for easy testing
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ error: "Failed to process request" });
    }
});

app.post("/api/auth/reset-password", async (req, res) => {
    const { mobile, otp, newPassword } = req.body;
    try {
        const storedOtp = otpStore.get(mobile);
        if (!storedOtp || storedOtp !== otp) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        await db.query("UPDATE users SET password = ? WHERE mobile = ?;", [newPassword, mobile]);
        otpStore.delete(mobile);
        
        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ error: "Failed to reset password" });
    }
});

// ==========================================
// Transactions APIs
// ==========================================

app.get("/api/transactions", async (req, res) => {
    const { userId } = req.query;
    try {
        const uid = userId || "user-1";
        const [rows] = await db.query(`
            SELECT * FROM transactions
            WHERE user_id = ?
            ORDER BY date_time DESC;
        `, [uid]);

        res.json(rows.map(r => ({
            id: r.id,
            title: r.title,
            category: r.category,
            amount: parseFloat(r.amount),
            date: new Date(r.date_time).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            time: new Date(r.date_time).toLocaleTimeString("en-IN", { hour: "numeric", minute: "numeric", hour12: true }),
            type: parseFloat(r.amount) >= 0 ? "income" : "expense",
            status: r.status,
            upi: r.payer_upi
        })));
    } catch (err) {
        console.error("Transactions Error:", err);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

app.patch("/api/transactions/:id/category", async (req, res) => {
    const { id } = req.params;
    const { category } = req.body;
    try {
        await db.query("UPDATE transactions SET category = ? WHERE id = ?;", [category, id]);
        res.json({ success: true, message: "Category updated successfully" });
    } catch (err) {
        console.error("Patch Category Error:", err);
        res.status(500).json({ error: "Failed to update category" });
    }
});

// ==========================================
// Dashboard summary APIs
// ==========================================

app.get("/api/dashboard/summary", async (req, res) => {
    const { userId } = req.query;
    const uid = userId || "user-1";

    try {
        // Compute metrics from SQL database
        const [totalTxs] = await db.query("SELECT COUNT(*) as count FROM transactions WHERE user_id = ?;", [uid]);
        const [incomeSum] = await db.query("SELECT SUM(amount) as sum FROM transactions WHERE user_id = ? AND amount > 0;", [uid]);
        const [expenseSum] = await db.query("SELECT SUM(amount) as sum FROM transactions WHERE user_id = ? AND amount < 0;", [uid]);

        const totalIncome = parseFloat(incomeSum[0].sum || 0);
        const totalExpense = parseFloat(expenseSum[0].sum || 0);
        const balance = totalIncome + totalExpense;

        const [recentTxsRows] = await db.query(`
            SELECT * FROM transactions
            WHERE user_id = ?
            ORDER BY date_time DESC
            LIMIT 4;
        `, [uid]);

        const recentTransactions = recentTxsRows.map(r => ({
            id: r.id,
            title: r.title,
            category: r.category,
            amount: parseFloat(r.amount),
            date: new Date(r.date_time).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            type: parseFloat(r.amount) >= 0 ? "income" : "expense"
        }));

        res.json({
            stats: [
                { id: "1", title: "Total Balance", value: `₹${balance.toLocaleString()}`, change: 12, icon: "wallet", color: "#7C3AED" },
                { id: "2", title: "Income", value: `₹${totalIncome.toLocaleString()}`, change: 8, icon: "trending-up", color: "#22C55E" },
                { id: "3", title: "Expenses", value: `₹${Math.abs(totalExpense).toLocaleString()}`, change: -3, icon: "trending-down", color: "#EF4444" },
                { id: "4", title: "Transactions", value: String(totalTxs[0].count), change: 18, icon: "swap-horizontal", color: "#3B82F6" }
            ],
            quickActions: [
                { id: "1", title: "Add Transaction", icon: "add-circle", color: "", route: "" },
                { id: "2", title: "Scan QR", icon: "qr-code", color: "", route: "" },
                { id: "3", title: "Reports", icon: "document-text", color: "", route: "" },
                { id: "4", title: "Insights", icon: "bulb", color: "", route: "" }
            ],
            salesChart: [
                { month: "Jan", value: 12000 },
                { month: "Feb", value: 18500 },
                { month: "Mar", value: 14200 },
                { month: "Apr", value: 23600 },
                { month: "May", value: 21200 },
                { month: "Jun", value: 28700 },
                { month: "Jul", value: 32400 }
            ],
            aiInsights: [
                { id: "1", title: "Revenue Increased", description: "Your revenue increased by 18% compared to last month.", type: "success" },
                { id: "2", title: "High Food Expenses", description: "Food spending is 22% higher than your average.", type: "warning" }
            ],
            goal: {
                current: balance,
                target: 100000
            },
            recentTransactions
        });
    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).json({ error: "Failed to load dashboard metrics" });
    }
});

app.post("/api/auth/verify-upi", async (req, res) => {
    const { userId, upiId } = req.body;
    try {
        await db.query("UPDATE upi_accounts SET upi_id = ?, verified = TRUE WHERE user_id = ?", [upiId, userId]);
        res.json({ success: true, message: "UPI Verified Successfully" });
    } catch (e) {
        console.error("UPI verification error:", e);
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "This UPI ID is already registered." });
        }
        res.status(500).json({ error: "Failed to verify UPI: " + e.message });
    }
});

// ==========================================
// Billing & Invoices APIs
// ==========================================

// app.get("/api/billing/history", async (req, res) => {
//     const { userId } = req.query;
//     const uid = userId || "user-1";
//     try {
//         const [rows] = await db.query(`
//             SELECT p.id as payment_id, p.amount, p.created_at, p.gateway_ref, p.status, i.invoice_no, i.invoice_url
//             FROM payments p
//             LEFT JOIN invoices i ON i.payment_id = p.id
//             WHERE p.user_id = ?
//             ORDER BY p.created_at DESC;
//         `, [uid]);

//         res.json(rows.map(r => ({
//             id: r.payment_id,
//             date: new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
//             time: new Date(r.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
//             plan: "Lifetime Plan",
//             rate: "₹10 / month",
//             amount: `₹${parseFloat(r.amount).toFixed(2)}`,
//             status: r.status,
//             upi: "you@upi",
//             invoiceNo: r.invoice_no,
//             invoiceUrl: r.invoice_url
//         })));
//     } catch (err) {
//         console.error("Billing History Error:", err);
//         res.status(500).json({ error: "Failed to fetch billing history" });
//     }
// });

app.get(
    "/api/billing/history",
    async (req, res) => {

        const {
            userId
        } = req.query;

        const uid =
            userId || "user-1";

        try {

            const [
                rows
            ] = await db.query(
                `
                SELECT
                    p.id,
                    p.amount,
                    p.created_at,
                    p.status,
                    p.provider,
                    p.transaction_reference,
                    p.upi_id,
                    p.payment_link,
                    i.invoice_no,
                    i.invoice_url

                FROM payments p

                LEFT JOIN invoices i
                    ON i.payment_id = p.id

                WHERE p.user_id = ?

                ORDER BY
                    p.created_at DESC;
                `,
                [
                    uid
                ]
            );


            return res.json(
                rows.map(
                    (r) => ({

                        id: r.id,

                        date:
                            new Date(
                                r.created_at
                            ).toLocaleDateString(
                                "en-IN"
                            ),

                        amount:
                            `₹${Number(
                                r.amount
                            ).toFixed(2)}`,

                        status:
                            r.status,

                        paymentMethod:
                            r.provider ||
                            "UPI",

                        upi:
                            r.upi_id,

                        transactionId:
                            r.transaction_reference,

                        invoiceNo:
                            r.invoice_no,

                        invoiceUrl:
                            r.invoice_url,

                    })
                )
            );

        } catch (err) {

            console.error(
                "Billing History Error:",
                err
            );

            return res.status(500).json({
                error:
                    "Failed to fetch billing history",
            });

        }

    }
);

// ==========================================
// Platform Admin APIs
// ==========================================

app.get("/api/admin/dashboard", async (req, res) => {
    try {
        const [usersCount] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'USER';");
        const [adminsCount] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN';");
        const [businessesCount] = await db.query("SELECT COUNT(*) as count FROM profiles WHERE business_name IS NOT NULL;");
        const [txsCount] = await db.query("SELECT COUNT(*) as count FROM transactions;");
        const [txsVol] = await db.query("SELECT SUM(ABS(amount)) as sum FROM transactions;");

        const totalUsers = usersCount[0].count;
        const totalBusinesses = businessesCount[0].count;
        const totalTransactions = txsCount[0].count;
        const totalVolume = parseFloat(txsVol[0].sum || 0);

        res.json({
            summary: {
                totalUsers,
                totalAdmins: adminsCount[0].count,
                totalBusinesses,
                totalTransactions,
                totalVolume
            }
        });
    } catch (err) {
        console.error("Admin Dashboard Error:", err);
        res.status(500).json({ error: "Failed to fetch platform metrics" });
    }
});

// ==========================================
// User Profile API
// ==========================================

app.get("/api/profile", async (req, res) => {
    const { userId } = req.query;
    const uid = userId || "user-1";
    try {
        const [userRows] = await db.query("SELECT * FROM users WHERE id = ? LIMIT 1;", [uid]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        const userRow = userRows[0];

        // Fetch subscription
        const [subRows] = await db.query("SELECT * FROM subscriptions WHERE user_id = ? LIMIT 1;", [uid]);
        let subscription = { id: "free", name: "Free Tier", price: 0, currency: "INR", billingCycle: "MONTHLY", isLifetimeOffer: false };
        if (subRows.length > 0) {
            const s = subRows[0];
            if (s.plan_id === "lifetime") {
                subscription = { id: "lifetime", name: "Lifetime Launch Offer", price: 999, currency: "INR", billingCycle: "LIFETIME", isLifetimeOffer: true, status: s.status };
            } else if (s.plan_id === "monthly") {
                subscription = { id: "monthly", name: "Monthly Plan", price: 99, currency: "INR", billingCycle: "MONTHLY", isLifetimeOffer: false, status: s.status };
            } else if (s.plan_id === "free-trial") {
                subscription = { id: "free-trial", name: "Free Trial", price: 0, currency: "INR", billingCycle: "MONTHLY", isLifetimeOffer: false, status: s.status };
            }
        }

        const names = userRow.name.split(" ");
        const firstName = names[0] || "";
        const lastName = names.slice(1).join(" ") || "";

        res.json({
            profile: {
                id: userRow.id,
                firstName,
                lastName,
                fullName: userRow.name,
                email: userRow.email,
                mobile: userRow.mobile,
                role: userRow.role,
                userType: userRow.user_type,
                isVerified: true,
                subscription
            }
        });
    } catch (err) {
        console.error("Get Profile Error:", err);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// ==========================================
// Admin User Management APIs
// ==========================================

app.get("/api/admin/users", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.name, u.email, u.mobile, u.role, u.status as user_status, 
                   p.business_name, p.category, p.city,
                   s.plan_id, s.status as sub_status, s.next_billing_date, s.trial_end, u.created_at
            FROM users u
            LEFT JOIN profiles p ON p.user_id = u.id
            LEFT JOIN subscriptions s ON s.user_id = u.id
            WHERE u.role = 'USER'
            ORDER BY u.created_at DESC;
        `);

        res.json(rows.map(r => ({
            id: r.id,
            name: r.name,
            email: r.email,
            mobile: r.mobile,
            role: r.role,
            status: r.user_status,
            businessName: r.business_name || "",
            category: r.category || "",
            city: r.city || "",
            plan: r.plan_id || "None",
            planStatus: r.sub_status || "INACTIVE",
            nextBilling: r.next_billing_date ? new Date(r.next_billing_date).toLocaleDateString("en-IN") : "N/A",
            joined: new Date(r.created_at || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            volume: "₹" + (Math.floor(Math.random() * 50) + 1) + "." + Math.floor(Math.random() * 9) + " Lakhs",
            transactions: String(Math.floor(Math.random() * 800) + 10)
        })));
    } catch (err) {
        console.error("Admin Fetch Users Error:", err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.put("/api/admin/users/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, mobile, status, plan, planStatus } = req.body;
    try {
        await db.query(`
            UPDATE users 
            SET name = ?, email = ?, mobile = ?, status = ?
            WHERE id = ?;
        `, [name, email, mobile, status, id]);

        if (plan) {
            const [subExist] = await db.query("SELECT 1 FROM subscriptions WHERE user_id = ? LIMIT 1;", [id]);
            if (subExist.length > 0) {
                await db.query(`
                    UPDATE subscriptions 
                    SET plan_id = ?, status = ?
                    WHERE user_id = ?;
                `, [plan, planStatus || "ACTIVE", id]);
            } else {
                await db.query(`
                    INSERT INTO subscriptions (user_id, plan_id, status, billing_day)
                    VALUES (?, ?, ?, 1);
                `, [id, plan, planStatus || "ACTIVE"]);
            }
        }

        res.json({ success: true, message: "User profile and subscription updated successfully" });
    } catch (err) {
        console.error("Admin Update User Error:", err);
        res.status(500).json({ error: "Failed to update user details" });
    }
});

// ==========================================
// Initialize DB and start server
// ==========================================

db.initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`UP Num Backend Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to initialize database connection. Exiting...", err);
        process.exit(1);
    });


const paymentRoutes =
    require("./routes/payment.routes");

app.use(
    "/api/payments",
    paymentRoutes
);

const setuWebhook =
    require("./routes/setu.webhook");

app.use(
    "/api/setu",
    setuWebhook
);


const {
    createPaymentLink,
    createUPICollectRequest,
    getPaymentStatus,
} = require("./services/setu.service");

app.post("/api/payments/create", async (req, res) => {
    const {
        userId,
        planId,
        amount,
        vua
    } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    if (!planId) {
        return res.status(400).json({ error: "planId is required" });
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({ error: "Invalid payment amount" });
    }

    let paymentId;
    try {
        paymentId = `payment-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const billerBillID = `UPNUM-${paymentId}`;

        /*
         * Create local payment first.
         * IMPORTANT: Subscription is NOT activated here.
         */
        await db.query(
            `INSERT INTO payments (id, user_id, amount, status, provider, provider_bill_id) VALUES (?, ?, ?, 'CREATED', 'SETU', ?);`,
            [paymentId, userId, paymentAmount, billerBillID]
        );

        let setuPayment;
        
        if (vua) {
            // UPI Collect Request (Push Notification)
            setuPayment = await createUPICollectRequest({
                billerBillID,
                amount: paymentAmount,
                vua,
                name: "UP Num",
                transactionNote: `UP Num subscription - ${planId}`,
                additionalInfo: { userId, planId },
            });
        } else {
            // Standard Payment Link
            setuPayment = await createPaymentLink({
                billerBillID,
                amount: paymentAmount,
                name: "UP Num",
                transactionNote: `UP Num subscription - ${planId}`,
                additionalInfo: { userId, planId },
            });
        }

        await db.query(
            `
            UPDATE payments

            SET
                provider_bill_id = ?,
                payment_link = ?,
                upi_id = ?,
                raw_response = ?

            WHERE id = ?;
            `,
            [

                setuPayment.platformBillID,

                setuPayment.paymentLink?.shortURL ||
                setuPayment.shortURL ||
                null,

                setuPayment.paymentLink?.upiID ||
                setuPayment.upiID ||
                setuPayment.vua ||
                null,

                JSON.stringify(
                    setuPayment
                ),

                paymentId,

            ]
        );

        return res.status(201).json({

            success: true,

            data: {

                paymentId,

                platformBillID:
                    setuPayment.platformBillID,

                upiLink:
                    setuPayment.paymentLink?.upiLink ||
                    setuPayment.upiLink,

                upiID:
                    setuPayment.paymentLink?.upiID ||
                    setuPayment.upiID,

                shortURL:
                    setuPayment.paymentLink?.shortURL ||
                    setuPayment.shortURL,

            },

        });

    } catch (error) {

        console.error(
            "Create Setu Payment Error:",
            error
        );


        await db.query(
            `
            UPDATE payments

            SET status = 'PAYMENT_FAILED'

            WHERE id = ?
            AND status = 'CREATED';
            `,
            [
                paymentId,
            ]
        ).catch(() => { });


        return res.status(500).json({

            error:
                "Unable to create payment",

        });

    }

});

app.post(
    "/api/setu/notifications",
    async (req, res) => {

        try {

            console.log(
                "SETU WEBHOOK:",
                JSON.stringify(
                    req.body,
                    null,
                    2
                )
            );


            const events =
                req.body?.events || [];


            for (const event of events) {

                const data =
                    event.data || {};


                const platformBillID =
                    data.platformBillID;


                const billerBillID =
                    data.billerBillID;


                if (!billerBillID) {
                    continue;
                }


                /*
                 * Find our payment.
                 */

                const [
                    paymentRows
                ] = await db.query(
                    `
                    SELECT *
                    FROM payments
                    WHERE
                        provider = 'SETU'
                    AND (
                        provider_bill_id = ?
                        OR gateway_ref = ?
                    )
                    LIMIT 1;
                    `,
                    [
                        platformBillID,
                        billerBillID,
                    ]
                );


                if (
                    paymentRows.length === 0
                ) {

                    console.warn(
                        "Unknown Setu payment:",
                        {
                            platformBillID,
                            billerBillID,
                        }
                    );

                    continue;
                }


                const payment =
                    paymentRows[0];


                /*
                 * Idempotency:
                 *
                 * If already successful,
                 * don't activate again.
                 */

                if (
                    payment.status ===
                    "PAYMENT_SUCCESSFUL"
                    ||
                    payment.status ===
                    "CREDIT_RECEIVED"
                    ||
                    payment.status ===
                    "SETTLEMENT_SUCCESSFUL"
                ) {
                    continue;
                }


                const newStatus =
                    mapSetuStatus(
                        event,
                        data
                    );


                await db.query(
                    `
                    UPDATE payments

                    SET
                        status = ?,
                        transaction_reference = ?,
                        upi_id = ?,
                        raw_response = ?

                    WHERE id = ?;
                    `,
                    [

                        newStatus,

                        data.transactionId ||
                        data.transactionReference ||
                        null,

                        data.payerVpa ||
                        null,

                        JSON.stringify(
                            req.body
                        ),

                        payment.id,

                    ]
                );


                /*
                 * Activate subscription ONLY
                 * after successful payment.
                 */

                if (
                    newStatus ===
                    "PAYMENT_SUCCESSFUL"
                ) {

                    await activateSubscription(
                        payment
                    );

                }

            }


            return res.sendStatus(200);

        } catch (error) {

            console.error(
                "Setu Webhook Error:",
                error
            );

            return res.sendStatus(500);
        }
    }
);


function mapSetuStatus(
    event,
    data
) {

    const status =
        data.status ||
        event.type ||
        "";


    switch (status) {

        case "PAYMENT_SUCCESSFUL":
        case "BILL_FULFILMENT_STATUS":
            return "PAYMENT_SUCCESSFUL";

        case "PAYMENT_FAILED":
            return "PAYMENT_FAILED";

        case "CREDIT_RECEIVED":
            return "CREDIT_RECEIVED";

        case "SETTLEMENT_SUCCESSFUL":
            return "SETTLEMENT_SUCCESSFUL";

        case "SETTLEMENT_FAILED":
            return "SETTLEMENT_FAILED";

        case "BILL_EXPIRED":
            return "BILL_EXPIRED";

        default:
            return "CREATED";
    }
}

async function activateSubscription(
    payment
) {

    const [
        existingRows
    ] = await db.query(
        `
        SELECT *
        FROM subscriptions
        WHERE user_id = ?
        LIMIT 1;
        `,
        [
            payment.user_id,
        ]
    );


    /*
     * Don't accidentally activate
     * an already-active subscription.
     */

    if (
        existingRows.length > 0 &&
        existingRows[0].status === "ACTIVE"
    ) {
        return;
    }


    /*
     * For the lifetime offer,
     * there is no real monthly expiry.
     */

    const nextBillingDate =
        null;


    if (
        existingRows.length > 0
    ) {

        await db.query(
            `
            UPDATE subscriptions

            SET
                plan_id = 'lifetime',
                status = 'ACTIVE',
                trial_end = NULL,
                next_billing_date = ?,
                billing_day = NULL

            WHERE user_id = ?;
            `,
            [
                nextBillingDate,
                payment.user_id,
            ]
        );

    } else {

        await db.query(
            `
            INSERT INTO subscriptions
            (
                user_id,
                plan_id,
                status,
                trial_end,
                next_billing_date,
                billing_day
            )
            VALUES
            (
                ?,
                'lifetime',
                'ACTIVE',
                NULL,
                NULL,
                NULL
            );
            `,
            [
                payment.user_id,
            ]
        );

    }

}

const setuRoutes =
    require("./routes/setu.routes");
const dashboardRoutes =
    require("./routes/dashboard.routes");

app.use(
    "/api/setu-flow",
    setuRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);

app.post(
    "/api/setu/webhook",
    async (req, res) => {

        try {

            console.log(
                "SETU AA WEBHOOK"
            );

            console.log(
                JSON.stringify(
                    req.body,
                    null,
                    2
                )
            );


            const notification =
                req.body;


            /*
             * We are not storing
             * anything in the DB yet.
             *
             * First phase is to verify
             * the complete Setu flow.
             */


            if (
                notification.type ===
                "CONSENT_STATUS"
            ) {

                console.log(
                    "Consent update:",
                    notification
                );
            }


            if (
                notification.type ===
                "FI_DATA_READY"
            ) {

                console.log(
                    "FI data ready:",
                    notification
                );
            }


            return res.sendStatus(200);

        } catch (error) {

            console.error(
                "Setu webhook error:",
                error
            );

            return res.sendStatus(500);
        }
    }
);

const setuService = require("./services/setu.service");

app.get("/api/setu/test-auth", async (req, res) => {

    try {

        const token =
            await setuService.getAccessToken();

        res.json({
            success: true,
            message: "Setu authentication successful",
            tokenReceived: Boolean(token),
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

});

app.get("/api/setu/account-availability/:mobile", async (req, res) => {
    try {
        const { mobile } = req.params;

        if (!/^\d{10}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: "Mobile number must contain exactly 10 digits",
            });
        }

        const result =
            await setuService.checkAccountAvailability(mobile);

        return res.json({
            success: true,
            data: result,
        });

    } catch (error) {
        console.error(
            "Setu account availability failed:",
            error.response?.data || error.message
        );

        return res.status(
            error.response?.status || 500
        ).json({
            success: false,
            message: "Unable to check account availability",
            error: error.response?.data || error.message,
        });
    }
});

app.post("/api/setu/consent", async (req, res) => {
    try {
        const {
            mobileNumber,
            fromDate,
            toDate,
        } = req.body;

        if (!mobileNumber) {
            return res.status(400).json({
                success: false,
                message: "mobileNumber is required",
            });
        }

        const result = await setuService.createConsent({
            mobileNumber,
            fromDate,
            toDate,
        });

        return res.json({
            success: true,
            data: result,
        });

    } catch (error) {
        console.error(
            "Setu consent creation failed:",
            error.response?.data || error.message
        );

        return res.status(
            error.response?.status || 500
        ).json({
            success: false,
            message: "Unable to create Setu consent",
            error:
                error.response?.data ||
                error.message,
        });
    }
});