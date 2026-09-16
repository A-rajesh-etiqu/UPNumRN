const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./db");
const { sendOTP } = require("./services/mailer");
const multer = require("multer");
const xlsx = require("xlsx");
const upload = multer({ storage: multer.memoryStorage() });

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
                businessName: businessName || null,
                category: category || null,
                city: city || null,
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

        const [profileRows] = await db.query("SELECT * FROM profiles WHERE user_id = ? LIMIT 1;", [userRow.id]);
        const profileRow = profileRows[0] || {};

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
                businessName: profileRow.business_name || null,
                category: profileRow.category || null,
                city: profileRow.city || null,
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
        const [rows] = await db.query("SELECT id, email FROM users WHERE mobile = ? LIMIT 1;", [mobile]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Mobile number not registered" });
        }
        
        const userEmail = rows[0].email;
        if (!userEmail) {
            return res.status(400).json({ error: "No email associated with this account" });
        }
        
        const maskedEmail = userEmail.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + gp3.replace(/./g, '*'));
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(mobile, otp);
        
        console.log(`Sending real OTP to ${userEmail}...`);
        const emailSent = await sendOTP(userEmail, otp);
        
        if (!emailSent) {
            return res.status(500).json({ error: "Failed to send OTP to email. Please check server configuration." });
        }
        
        res.json({ message: "OTP sent successfully to email", email: maskedEmail });
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
// User APIs
// ==========================================

app.put("/api/users/profile", async (req, res) => {
    const { userId, firstName, lastName, email, mobile, businessName, category, city } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const fullName = `${firstName} ${lastName}`;
        
        await db.query(`
            UPDATE users 
            SET name = ?, email = ?, mobile = ?
            WHERE id = ?;
        `, [fullName, email, mobile, userId]);

        await db.query(`
            UPDATE profiles 
            SET business_name = ?, category = ?, city = ?
            WHERE user_id = ?;
        `, [businessName || null, category || null, city || null, userId]);

        // Fetch the updated user
        const [userRows] = await db.query("SELECT * FROM users WHERE id = ? LIMIT 1;", [userId]);
        const userRow = userRows[0];
        
        const [profileRows] = await db.query("SELECT * FROM profiles WHERE user_id = ? LIMIT 1;", [userId]);
        const profileRow = profileRows[0] || {};
        
        const [upiRows] = await db.query("SELECT verified FROM upi_accounts WHERE user_id = ? AND primary_flag = TRUE LIMIT 1;", [userId]);
        const isUpiVerified = upiRows.length > 0 ? !!upiRows[0].verified : false;

        const [subRows] = await db.query("SELECT * FROM subscriptions WHERE user_id = ? AND status = 'ACTIVE' LIMIT 1;", [userId]);
        let subscription = { id: "free", name: "Free Plan", price: 0, currency: "INR", billingCycle: "MONTHLY", isLifetimeOffer: false, status: "INACTIVE" };
        if (subRows.length > 0) {
            subscription = { id: subRows[0].plan_id, name: subRows[0].plan_id === 'standard' ? 'Standard Plan' : subRows[0].plan_id, price: 50, currency: "INR", billingCycle: "MONTHLY", isLifetimeOffer: false, status: subRows[0].status };
        }

        const names = userRow.name.split(" ");
        const updatedUser = {
            id: userRow.id,
            firstName: names[0] || "",
            lastName: names.slice(1).join(" ") || "",
            fullName: userRow.name,
            email: userRow.email,
            mobile: userRow.mobile,
            businessName: profileRow.business_name || null,
            category: profileRow.category || null,
            city: profileRow.city || null,
            role: userRow.role,
            userType: userRow.user_type,
            isVerified: true,
            isUpiVerified,
            subscription
        };

        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

app.get("/api/users/bank-accounts", async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const [upiRows] = await db.query("SELECT * FROM upi_accounts WHERE user_id = ? ORDER BY primary_flag DESC", [userId]);
        const [consentRows] = await db.query("SELECT * FROM consents WHERE user_id = ? ORDER BY created_at DESC", [userId]);

        res.json({
            upiAccounts: upiRows.map(row => ({
                id: row.id,
                upiId: row.upi_id,
                isVerified: !!row.verified,
                isPrimary: !!row.primary_flag
            })),
            bankAccounts: consentRows.map(row => ({
                id: row.id,
                vua: row.vua,
                status: row.status,
                sessionId: row.session_id,
                createdAt: row.created_at
            }))
        });
    } catch (err) {
        console.error("Fetch Bank Accounts Error:", err);
        res.status(500).json({ error: "Failed to fetch bank accounts" });
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

app.post("/api/transactions", async (req, res) => {
    const { userId, title, category, amount, type, date_time } = req.body;
    try {
        const uid = userId || "user-1";
        const txId = `tx-${Date.now()}`;
        // If type is expense, make sure amount is negative in the db. Wait, the GET endpoint checks `parseFloat(r.amount) >= 0 ? "income" : "expense"`.
        // So income is positive, expense is negative.
        let finalAmount = parseFloat(amount);
        if (type === "expense" && finalAmount > 0) {
            finalAmount = -finalAmount;
        } else if (type === "income" && finalAmount < 0) {
            finalAmount = Math.abs(finalAmount);
        }

        const txDate = date_time ? new Date(date_time) : new Date();

        await db.query(`
            INSERT INTO transactions (id, user_id, title, category, amount, date_time, status, payment_method)
            VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', 'MANUAL');
        `, [txId, uid, title, category, finalAmount, txDate]);

        res.status(201).json({ success: true, message: "Transaction added successfully", id: txId });
    } catch (err) {
        console.error("Add Transaction Error:", err);
        res.status(500).json({ error: "Failed to add transaction" });
    }
});

app.post("/api/transactions/bulk", upload.single("file"), async (req, res) => {
    try {
        const { userId } = req.body;
        const uid = userId || "user-1";
        
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!rows || rows.length === 0) {
            return res.status(400).json({ error: "Empty or invalid file" });
        }

        let insertedCount = 0;

        for (const row of rows) {
            // Map row data (flexible matching)
            const title = row.Title || row.title || row.Description || row.description || "Imported Tx";
            const category = row.Category || row.category || "General";
            let amountRaw = row.Amount || row.amount || row.Value || row.value || 0;
            let finalAmount = parseFloat(amountRaw) || 0;
            
            const typeStr = (row.Type || row.type || "").toLowerCase();
            if (typeStr === "expense" && finalAmount > 0) {
                finalAmount = -finalAmount;
            } else if (typeStr === "income" && finalAmount < 0) {
                finalAmount = Math.abs(finalAmount);
            }
            
            const dateStr = row.Date || row.date || row.Date_Time || row.date_time;
            let txDate = dateStr ? new Date(dateStr) : new Date();
            if (isNaN(txDate.getTime())) txDate = new Date(); // fallback to current date if invalid

            const txId = `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            await db.query(`
                INSERT INTO transactions (id, user_id, title, category, amount, date_time, status, payment_method)
                VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', 'MANUAL');
            `, [txId, uid, String(title).slice(0, 100), String(category).slice(0, 50), finalAmount, txDate]);

            insertedCount++;
        }

        res.status(201).json({ success: true, message: `Imported ${insertedCount} transactions successfully` });
    } catch (err) {
        console.error("Bulk Import Error:", err);
        res.status(500).json({ error: "Failed to process bulk import" });
    }
});

// ==========================================
// Dashboard summary APIs
// ==========================================

const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/api/dashboard", dashboardRoutes);

const billingRoutes = require("./routes/billing.routes");
app.use("/api/billing", billingRoutes);

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
            SELECT u.id, u.name, u.email, u.mobile, u.role, u.status as user_status, u.user_type, 
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
            user_type: r.user_type,
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
    const { name, email, mobile, status, plan, planStatus, user_type } = req.body;
    try {
        await db.query(`
            UPDATE users 
            SET name = ?, email = ?, mobile = ?, status = ?, user_type = COALESCE(?, user_type)
            WHERE id = ?;
        `, [name, email, mobile, status, user_type, id]);

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

app.delete("/api/admin/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM users WHERE id = ?;", [id]);
        res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        console.error("Admin Delete User Error:", err);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

// ==========================================
// Admin Plans APIs
// ==========================================
app.get("/api/admin/plans", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM plans ORDER BY id ASC");
        res.json(rows);
    } catch (err) {
        console.error("Fetch plans error:", err);
        res.status(500).json({ error: "Failed to fetch plans" });
    }
});

app.get("/api/plans", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM plans WHERE status = 'Active' ORDER BY id ASC");
        res.json(rows);
    } catch (err) {
        console.error("Fetch active plans error:", err);
        res.status(500).json({ error: "Failed to fetch active plans" });
    }
});

app.post("/api/admin/plans", async (req, res) => {
    const { name, type, price, billing, status, description } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO plans (name, type, price, billing, status, description) VALUES (?, ?, ?, ?, ?, ?)",
            [name, type, price || 0, billing, status || 'Active', description || '']
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error("Create plan error:", err);
        res.status(500).json({ error: "Failed to create plan" });
    }
});

app.put("/api/admin/plans/:id", async (req, res) => {
    const { id } = req.params;
    const { name, type, price, billing, status, description } = req.body;
    try {
        await db.query(
            "UPDATE plans SET name=?, type=?, price=?, billing=?, status=?, description=? WHERE id=?",
            [name, type, price, billing, status, description, id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Update plan error:", err);
        res.status(500).json({ error: "Failed to update plan" });
    }
});

app.delete("/api/admin/plans/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM plans WHERE id=?", [id]);
        res.json({ success: true });
    } catch (err) {
        console.error("Delete plan error:", err);
        res.status(500).json({ error: "Failed to delete plan" });
    }
});

// ==========================================
// Admin Offers APIs
// ==========================================
app.get("/api/admin/offers", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM offers ORDER BY id ASC");
        res.json(rows);
    } catch (err) {
        console.error("Fetch offers error:", err);
        res.status(500).json({ error: "Failed to fetch offers" });
    }
});

app.post("/api/admin/offers", async (req, res) => {
    const { name, type, discount, valid_from, valid_to, status } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO offers (name, type, discount, valid_from, valid_to, status) VALUES (?, ?, ?, ?, ?, ?)",
            [name, type, discount, valid_from, valid_to, status || 'Active']
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error("Create offer error:", err);
        res.status(500).json({ error: "Failed to create offer" });
    }
});

app.put("/api/admin/offers/:id", async (req, res) => {
    const { id } = req.params;
    const { name, type, discount, valid_from, valid_to, status } = req.body;
    try {
        await db.query(
            "UPDATE offers SET name=?, type=?, discount=?, valid_from=?, valid_to=?, status=? WHERE id=?",
            [name, type, discount, valid_from, valid_to, status, id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Update offer error:", err);
        res.status(500).json({ error: "Failed to update offer" });
    }
});

app.delete("/api/admin/offers/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM offers WHERE id=?", [id]);
        res.json({ success: true });
    } catch (err) {
        console.error("Delete offer error:", err);
        res.status(500).json({ error: "Failed to delete offer" });
    }
});

// ==========================================
// Notifications APIs
// ==========================================

app.get("/api/admin/notifications", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM notifications ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        console.error("Fetch notifications error:", err);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

app.post("/api/admin/notifications", async (req, res) => {
    const { title, message, target_type, target_users } = req.body;
    try {
        const targetUsersJson = target_type === 'ALL' ? null : JSON.stringify(target_users);
        await db.query(`
            INSERT INTO notifications (title, message, target_type, target_users)
            VALUES (?, ?, ?, ?);
        `, [title, message, target_type, targetUsersJson]);
        res.status(201).json({ message: "Notification created successfully" });
    } catch (err) {
        console.error("Create notification error:", err);
        res.status(500).json({ error: "Failed to create notification" });
    }
});

app.get("/api/users/:userId/notifications", async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT n.*, (unr.user_id IS NOT NULL) as is_read
            FROM notifications n
            LEFT JOIN user_notifications_read unr ON n.id = unr.notification_id AND unr.user_id = ?
            WHERE n.target_type = 'ALL' 
               OR (n.target_type IN ('SINGLE', 'MULTIPLE') AND JSON_CONTAINS(n.target_users, JSON_QUOTE(?)))
            ORDER BY n.created_at DESC
        `;
        const [rows] = await db.query(query, [userId, userId]);
        res.json(rows);
    } catch (err) {
        console.error("Fetch user notifications error:", err);
        res.status(500).json({ error: "Failed to fetch user notifications" });
    }
});

app.put("/api/users/:userId/notifications/:notificationId/read", async (req, res) => {
    const { userId, notificationId } = req.params;
    try {
        await db.query(`
            INSERT IGNORE INTO user_notifications_read (user_id, notification_id)
            VALUES (?, ?);
        `, [userId, notificationId]);
        res.status(200).json({ message: "Notification marked as read" });
    } catch (err) {
        console.error("Mark notification read error:", err);
        res.status(500).json({ error: "Failed to mark notification as read" });
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

app.use(
    "/api/setu-flow",
    setuRoutes
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

// ==========================================
// Admin APIs
// ==========================================

app.get("/api/admin/dashboard", async (req, res) => {
    try {
        const [usersRows] = await db.query("SELECT COUNT(*) as totalUsers FROM users WHERE role = 'USER'");
        const [businessesRows] = await db.query("SELECT COUNT(*) as activeBusinesses FROM users WHERE user_type = 'BUSINESS' AND status = 'ACTIVE'");
        const [mrrRows] = await db.query("SELECT SUM(amount) as mrr FROM payments WHERE status = 'SUCCESS' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        const [paymentsRows] = await db.query("SELECT COUNT(*) as successfulPayments FROM payments WHERE status = 'SUCCESS'");
        const disputes = 0; // Mocked as table does not exist
        
        const [subs] = await db.query("SELECT plan_id, COUNT(*) as count FROM subscriptions GROUP BY plan_id");
        const [revenueTrend] = await db.query("SELECT DATE(created_at) as date, SUM(amount) as amount FROM payments WHERE status = 'SUCCESS' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date ASC");
        const [newUsersTrend] = await db.query("SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE role = 'USER' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date ASC");
        
        const [recentUsers] = await db.query("SELECT id, name, created_at FROM users ORDER BY created_at DESC LIMIT 5");
        const [recentPayments] = await db.query("SELECT p.id, p.amount, p.created_at, u.name as user_name FROM payments p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 5");
        
        const [paymentMethods] = await db.query("SELECT payment_method, COUNT(*) as count FROM transactions GROUP BY payment_method");

        const [totalPaymentsRows] = await db.query("SELECT COUNT(*) as totalPayments FROM payments");
        const totalPayments = totalPaymentsRows[0]?.totalPayments || 0;
        const paymentSuccessRate = totalPayments > 0 ? (paymentsRows[0]?.successfulPayments / totalPayments) * 100 : 0;
        
        const [paidUsersRows] = await db.query("SELECT COUNT(DISTINCT user_id) as paidUsers FROM subscriptions");
        const conversionRate = usersRows[0]?.totalUsers > 0 ? (paidUsersRows[0]?.paidUsers / usersRows[0]?.totalUsers) * 100 : 0;

        const disputeStatus = [
            { status: 'Open', count: 62 },
            { status: 'Resolved', count: 85 },
            { status: 'Rejected', count: 21 },
        ];

        const recentActivities = [];
        recentUsers.forEach(u => {
            recentActivities.push({ type: 'user', title: 'New user registered', subtitle: u.name, timestamp: u.created_at });
        });
        recentPayments.forEach(p => {
            recentActivities.push({ type: 'payment', title: 'Payment received', subtitle: `₹${p.amount} from ${p.user_name || 'Unknown'}`, timestamp: p.created_at });
        });
        recentActivities.push({ type: 'business', title: 'New business created', subtitle: 'XYZ Retail Pvt Ltd', timestamp: new Date(Date.now() - 15 * 60000).toISOString() });
        recentActivities.push({ type: 'dispute', title: 'Dispute raised', subtitle: 'TXN#2053 by rahul@okicici', timestamp: new Date(Date.now() - 28 * 60000).toISOString() });
        recentActivities.push({ type: 'plan', title: 'Plan upgraded', subtitle: 'Business Pro by TechSoft', timestamp: new Date(Date.now() - 45 * 60000).toISOString() });
        recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            totalUsers: usersRows[0]?.totalUsers || 0,
            activeBusinesses: businessesRows[0]?.activeBusinesses || 0,
            mrr: parseFloat(mrrRows[0]?.mrr) || 0,
            successfulPayments: paymentsRows[0]?.successfulPayments || 0,
            disputes,
            conversionRate,
            paymentSuccessRate,
            subscriptions: subs,
            revenueTrend,
            newUsersTrend,
            recentActivities,
            paymentMethods,
            disputeStatus
        });
    } catch (err) {
        console.error("Admin Dashboard Error:", err);
        res.status(500).json({ error: "Failed to fetch admin dashboard data" });
    }
});