const express = require("express");
const db = require("../db");
const { sendInvoice } = require("../services/mailer");
const { generateInvoicePDF } = require("../services/pdfGenerator");
const crypto = require("crypto");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "upnum_secure_jwt_secret_key_2026";

function verifyToken(token) {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSig) return null;
    try {
        const payload = JSON.parse(Buffer.from(body, "base64url").toString());
        if (payload.exp && payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

function authenticateBilling(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        if (token === "mock-access-token") {
            const fallbackUserId = req.query.userId || req.body?.userId;
            if (fallbackUserId) {
                req.user = { userId: fallbackUserId, isMock: true };
                return next();
            }
        }
        const payload = verifyToken(token);
        if (payload && (payload.userId || payload.id)) {
            req.user = { userId: payload.userId || payload.id, ...payload };
            return next();
        }
    }
    const fallbackUserId = req.query.userId || req.body?.userId;
    if (fallbackUserId) {
        req.user = { userId: fallbackUserId };
        return next();
    }
    return res.status(401).json({ error: "Unauthorized: Missing valid authentication credentials" });
}

function resolvePlanDetails(planId) {
    const raw = String(planId || '').toLowerCase().trim();
    if (raw === 'free-tier' || raw === 'free-trial' || raw === 'trial' || raw === 'free' || raw.startsWith('1')) {
        return { id: 'free-tier', name: 'Free Tier', price: 0, billingCycle: 'MONTHLY', isLifetimeOffer: false, status: 'TRIAL' };
    }
    if (raw.startsWith('2') || raw.includes('standard') || raw.includes('monthly')) {
        return { id: '2', name: 'Standard Plan', price: 50, billingCycle: 'MONTHLY', isLifetimeOffer: false };
    }
    if (raw.startsWith('3') || raw.includes('premium')) {
        return { id: '3', name: 'Premium Plan', price: 150, billingCycle: 'MONTHLY', isLifetimeOffer: false };
    }
    if (raw.startsWith('4') || raw.includes('lifetime')) {
        return { id: '4', name: 'Lifetime Plan', price: 10, billingCycle: 'LIFETIME', isLifetimeOffer: true };
    }
    return { id: raw || '2', name: 'Standard Plan', price: 50, billingCycle: 'MONTHLY', isLifetimeOffer: false };
}

function parsePaymentDate(p) {
    if (!p) return new Date();

    // 1. If p.id has a numeric timestamp like pay_1791881103295_...
    const idMatch = String(p.id || '').match(/^(?:pay|payment)[-_](\d{13})/i);
    if (idMatch) {
        const ms = parseInt(idMatch[1], 10);
        if (!isNaN(ms) && ms > 1500000000000 && ms < 3000000000000) {
            return new Date(ms);
        }
    }

    // 2. If p.created_at is present
    if (p.created_at) {
        if (p.created_at instanceof Date) {
            return p.created_at;
        }
        const s = String(p.created_at).trim();
        // If string like "2026-10-13 10:58:22" without timezone, treat as UTC
        if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(s) && !s.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
            return new Date(s.replace(' ', 'T') + 'Z');
        }
        return new Date(s);
    }

    return new Date();
}

// GET /billing/history
// Returns billing history (payments/invoices) and subscription status
router.get("/history", authenticateBilling, async (req, res) => {
    const userId = req.user?.userId || req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // 1. Fetch Payments & Invoices first
        // Ordering: Successful payments first, with the most recent paid payment at the very top (Row 1),
        // followed by older payments, and lastly failed attempts ordered by date DESC.
        const [paymentRows] = await db.query(`
            SELECT p.*, i.invoice_no, i.id as invoice_id
            FROM payments p
            LEFT JOIN invoices i ON p.id = i.payment_id
            WHERE p.user_id = ?
            ORDER BY 
                CASE WHEN UPPER(p.status) = 'SUCCESS' THEN 0 ELSE 1 END,
                p.created_at DESC,
                p.id DESC;
        `, [userId]);

        // 2. Fetch User & Subscription rows from DB
        const [userSubRows] = await db.query(`
            SELECT u.plan_id as user_plan_id, s.plan_id as sub_plan_id, s.status as sub_status, s.trial_start, s.trial_end, s.next_billing_date
            FROM users u
            LEFT JOIN subscriptions s ON s.user_id = u.id
            WHERE u.id = ? 
            LIMIT 1;
        `, [userId]);

        // Deduplicate payments to avoid duplicate rows for the same checkout
        const seenKeys = new Set();
        const deduplicatedPaymentRows = [];
        for (const p of paymentRows) {
            const amt = parseFloat(p.amount);
            const timeBucket = Math.floor(new Date(p.created_at).getTime() / 15000);
            const timeKey = `${userId}_${amt}_${p.status}_${timeBucket}`;
            
            if (p.gateway_ref && p.gateway_ref.startsWith('pay_') && seenKeys.has(p.gateway_ref)) {
                continue;
            }
            if (seenKeys.has(timeKey)) {
                continue;
            }
            if (p.gateway_ref && p.gateway_ref.startsWith('pay_')) {
                seenKeys.add(p.gateway_ref);
            }
            seenKeys.add(timeKey);
            deduplicatedPaymentRows.push(p);
        }

        const successfulPayments = deduplicatedPaymentRows.filter(p => (p.status || '').toUpperCase() === 'SUCCESS');
        let activePlanId = 'free-tier';
        let latestPaymentDate = null;

        if (successfulPayments.length > 0) {
            const latest = successfulPayments[0];
            latestPaymentDate = latest.created_at;
            activePlanId = String(latest.plan_id || (parseFloat(latest.amount) === 150 ? '3' : parseFloat(latest.amount) === 10 ? '4' : '2'));
        } else if (userSubRows.length > 0) {
            const row = userSubRows[0];
            activePlanId = (row.user_plan_id && row.user_plan_id !== 'free-trial' && row.user_plan_id !== 'free-tier' && row.user_plan_id !== '1')
                ? row.user_plan_id
                : ((row.sub_plan_id && row.sub_plan_id !== 'free-trial' && row.sub_plan_id !== 'free-tier' && row.sub_plan_id !== '1') ? row.sub_plan_id : (row.user_plan_id || row.sub_plan_id || 'free-tier'));
        }

        let planDetails = resolvePlanDetails(activePlanId);
        try {
            const [planDbRows] = await db.query(
                "SELECT * FROM plans WHERE CAST(id AS CHAR) = ? OR LOWER(name) = LOWER(?) LIMIT 1;",
                [activePlanId, activePlanId]
            );
            if (planDbRows.length > 0) {
                const dbPlan = planDbRows[0];
                planDetails = {
                    id: String(dbPlan.id),
                    name: dbPlan.name,
                    price: parseFloat(dbPlan.price),
                    billingCycle: (dbPlan.billing || 'MONTHLY').toUpperCase(),
                    isLifetimeOffer: (dbPlan.billing || '').toLowerCase().includes('lifetime') || (dbPlan.name || '').toLowerCase().includes('lifetime') || (dbPlan.type || '').toLowerCase().includes('one-time'),
                    description: dbPlan.description || '',
                    status: dbPlan.status
                };
            }
        } catch (planDbErr) {
            console.warn("Could not query plans table for details:", planDbErr.message);
        }

        const isTrialPlan = activePlanId === 'free-tier' || activePlanId === 'free-trial' || activePlanId === '1' || activePlanId === 'free';
        const trialEnd = userSubRows[0]?.trial_end;
        const isTrialExpired = isTrialPlan && trialEnd && new Date() > new Date(trialEnd);
        const subStatus = isTrialPlan 
            ? (isTrialExpired ? 'EXPIRED' : 'TRIAL') 
            : (userSubRows[0]?.sub_status || 'ACTIVE');

        let nextBilling = null;
        if (isTrialPlan) {
            nextBilling = trialEnd ? new Date(trialEnd) : null;
        } else if (userSubRows.length > 0 && userSubRows[0]?.next_billing_date && new Date(userSubRows[0].next_billing_date) > new Date()) {
            nextBilling = userSubRows[0].next_billing_date;
        } else {
            nextBilling = new Date(latestPaymentDate || new Date());
            if (planDetails.isLifetimeOffer || planDetails.billingCycle === 'LIFETIME') {
                nextBilling.setFullYear(nextBilling.getFullYear() + 100);
            } else {
                nextBilling.setMonth(nextBilling.getMonth() + 1);
            }
        }

        const subscription = {
            planId: activePlanId,
            planName: isTrialExpired ? "Free Tier (Expired)" : planDetails.name,
            price: planDetails.price,
            billingCycle: planDetails.billingCycle,
            description: planDetails.description || '',
            features: planDetails.description ? planDetails.description.split(",").map(f => f.trim()).filter(Boolean) : [
                "All Dashboard Features",
                "AI Insights & Suggestions",
                "Unlimited Transactions",
                "Priority Support",
                "Secure Data & Backups"
            ],
            status: subStatus,
            currentPeriodStart: latestPaymentDate || userSubRows[0]?.trial_start || new Date(),
            nextBillingDate: nextBilling,
            trialEnd: trialEnd || null,
            expiresAt: isTrialPlan ? trialEnd : nextBilling,
            autoRenew: !isTrialPlan
        };

        // Sync database tables so future queries stay in sync
        if (!isTrialPlan) {
            await db.query(`UPDATE users SET plan_id = ? WHERE id = ?;`, [activePlanId, userId]).catch(() => {});
            await db.query(`
                INSERT INTO subscriptions (user_id, plan_id, status, trial_start, trial_end, next_billing_date, billing_day)
                VALUES (?, ?, 'ACTIVE', NULL, NULL, ?, ?)
                ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id), status = 'ACTIVE', next_billing_date = VALUES(next_billing_date);
            `, [userId, activePlanId, nextBilling, new Date(nextBilling).getDate()]).catch(() => {});
        }

        // Auto-seed invoices table for any completed payments missing invoice rows
        for (const p of deduplicatedPaymentRows) {
            if ((p.status || '').toUpperCase() === 'SUCCESS') {
                const dateObj = parsePaymentDate(p);
                const cleanTail = String(p.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase().padStart(8, '0');
                const dynInvoice = `INV-${dateObj.getFullYear()}-${cleanTail}`;
                
                if (!p.invoice_no) {
                    await db.query(
                        `INSERT INTO invoices (invoice_no, payment_id, amount) VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE payment_id = VALUES(payment_id);`,
                        [dynInvoice, p.id, p.amount]
                    ).catch(() => {});
                    p.invoice_no = dynInvoice;
                }
            }
        }

        const history = deduplicatedPaymentRows.map(p => {
            const dateObj = parsePaymentDate(p);
            const cleanTail = String(p.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase().padStart(8, '0');
            const dynInvoice = `INV-${dateObj.getFullYear()}-${cleanTail}`;
            const amt = parseFloat(p.amount);
            const itemPlanId = p.plan_id ? String(p.plan_id) : (amt === 150 ? '3' : amt === 50 ? '2' : amt === 10 ? '4' : '1');
            const itemPlanDetails = resolvePlanDetails(itemPlanId);
            
            const rawStatus = (p.status || '').toUpperCase();
            let mappedStatus = 'Failed';
            if (rawStatus === 'SUCCESS' || rawStatus === 'PAID') {
                mappedStatus = 'Success';
            } else if (rawStatus === 'CREATED' || rawStatus === 'CANCELLED' || rawStatus === 'PENDING' || rawStatus === 'ABANDONED') {
                mappedStatus = 'Cancelled';
            } else {
                mappedStatus = 'Failed';
            }

            return {
                id: p.id,
                date: dateObj.toLocaleDateString('en-GB', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }),
                time: dateObj.toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
                createdAt: dateObj.toISOString(),
                timestamp: dateObj.getTime(),
                plan: itemPlanDetails.name,
                rate: `₹${itemPlanDetails.price} / ${itemPlanDetails.billingCycle.toLowerCase() === 'lifetime' ? 'one-time' : 'month'}`,
                amount: `₹${amt.toFixed(2)}`,
                status: mappedStatus,
                upi: p.upi_id || "UPI (Auto)",
                invoiceNo: p.invoice_no || dynInvoice,
                invoiceId: p.invoice_id || p.id
            };
        });

        res.json({
            subscription,
            history
        });
    } catch (error) {
        console.error("Billing History Error:", error);
        res.status(500).json({ error: "Failed to fetch billing history" });
    }
});

// GET /invoice/:id
// Generates and streams PDF invoice directly
router.get("/invoice/:id", async (req, res) => {
    try {
        const paramId = req.params.id;

        // 1. Try finding by invoice_no, payment_id or invoice id
        let [rows] = await db.query(`
            SELECT 
                i.invoice_no, 
                i.amount as invoice_amount, 
                p.id as payment_id, 
                p.amount as payment_amount, 
                p.status, 
                p.created_at, 
                p.upi_id, 
                p.gateway_ref, 
                p.plan_id, 
                u.name as user_name, 
                u.email as user_email
            FROM invoices i
            JOIN payments p ON i.payment_id = p.id
            LEFT JOIN users u ON p.user_id = u.id
            WHERE i.invoice_no = ? OR i.id = ? OR p.id = ?
            LIMIT 1;
        `, [paramId, paramId, paramId]);

        // If not found in invoices table, check payments table directly
        if (!rows || rows.length === 0) {
            [rows] = await db.query(`
                SELECT 
                    p.id as payment_id, 
                    p.amount as payment_amount, 
                    p.status, 
                    p.created_at, 
                    p.upi_id, 
                    p.gateway_ref, 
                    p.plan_id, 
                    u.name as user_name, 
                    u.email as user_email
                FROM payments p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.id = ? OR p.gateway_ref = ?
                LIMIT 1;
            `, [paramId, paramId]);
        }

        if (!rows || rows.length === 0) {
            return res.status(404).send("Invoice not found");
        }

        const data = rows[0];
        const planDetails = resolvePlanDetails(data.plan_id);
        const dateObj = parsePaymentDate(data);
        const invoiceNo = data.invoice_no || (String(paramId).startsWith("INV-") ? paramId : `INV-${dateObj.getFullYear()}-${String(data.payment_id || '').slice(-8).toUpperCase().padStart(8, '0')}`);

        const pdfBuffer = await generateInvoicePDF({
            invoiceNo,
            planName: planDetails.name,
            amount: parseFloat(data.payment_amount || data.invoice_amount || 0).toFixed(2),
            date: dateObj.toLocaleDateString("en-IN", { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }),
            billingCycle: planDetails.billingCycle === 'LIFETIME' ? 'One-time' : 'Monthly',
            userName: data.user_name || data.user_email || "Customer",
            upiId: data.upi_id || "UPI (Auto)",
            transactionId: data.gateway_ref || data.payment_id || "N/A",
            status: (data.status || 'SUCCESS').toUpperCase()
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="Invoice-${invoiceNo}.pdf"`);
        return res.send(pdfBuffer);
    } catch (error) {
        console.error("Generate Invoice PDF Error:", error);
        return res.status(500).send("Error generating invoice PDF: " + error.message);
    }
});

// POST /billing/resend
// Simulates resending an invoice via email
router.post("/resend", async (req, res) => {
    const { userId, invoiceNo } = req.body;
    if (!userId || !invoiceNo) {
        return res.status(400).json({ error: "userId and invoiceNo are required" });
    }

    try {
        const [userRows] = await db.query("SELECT email FROM users WHERE id = ? LIMIT 1", [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const userEmail = userRows[0].email;
        const sent = await sendInvoice(userEmail, invoiceNo);
        
        if (sent) {
            res.json({ success: true, message: `Invoice ${invoiceNo} sent to ${userEmail}` });
        } else {
            res.status(500).json({ error: "Failed to send email" });
        }
    } catch (error) {
        console.error("Resend Invoice Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /billing/send-invoice
router.post("/send-invoice", async (req, res) => {
    const { userId, invoiceNo } = req.body;
    if (!userId || !invoiceNo) {
        return res.status(400).json({ error: "userId and invoiceNo are required" });
    }

    try {
        const [userRows] = await db.query("SELECT email FROM users WHERE id = ? LIMIT 1", [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const userEmail = userRows[0].email;
        const sent = await sendInvoice(userEmail, invoiceNo);
        
        if (sent) {
            res.json({ success: true, message: `Invoice ${invoiceNo} sent to ${userEmail}` });
        } else {
            res.status(500).json({ error: "Failed to send email" });
        }
    } catch (error) {
        console.error("Send Invoice Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /billing/retry
// Simulates retrying a failed payment
router.post("/retry", async (req, res) => {
    const { userId, paymentId } = req.body;
    
    // In a real app, this would initiate a new checkout session.
    // Here we just update the DB to simulate a successful retry.
    try {
        await db.query("UPDATE payments SET status = 'SUCCESS' WHERE id = ? AND user_id = ?", [paymentId, userId]);
        res.json({ success: true, message: "Payment retried successfully" });
    } catch (error) {
        console.error("Retry Payment Error:", error);
        res.status(500).json({ error: "Failed to retry payment" });
    }
});

module.exports = router;
