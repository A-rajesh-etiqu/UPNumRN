const express = require("express");
const db = require("../db");
const { sendInvoice } = require("../services/mailer");

const router = express.Router();

function resolvePlanDetails(planId) {
    const raw = String(planId || '').toLowerCase().trim();
    if (raw === 'free-trial' || raw === 'trial') {
        return { id: 'free-trial', name: 'Free Trial (1 Month)', price: 0, billingCycle: 'MONTHLY', isLifetimeOffer: false, status: 'TRIAL' };
    }
    if (raw.startsWith('1') || raw === 'free') {
        return { id: '1', name: 'Free Tier', price: 0, billingCycle: 'MONTHLY', isLifetimeOffer: false };
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

// GET /billing/history
// Returns billing history (payments/invoices) and subscription status
router.get("/history", async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // 1. Fetch Payments & Invoices first
        const [paymentRows] = await db.query(`
            SELECT p.*, i.invoice_no, i.id as invoice_id
            FROM payments p
            LEFT JOIN invoices i ON p.id = i.payment_id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC;
        `, [userId]);

        // 2. Fetch User & Subscription rows from DB
        const [userSubRows] = await db.query(`
            SELECT u.plan_id as user_plan_id, s.plan_id as sub_plan_id, s.status as sub_status, s.trial_start, s.trial_end, s.next_billing_date
            FROM users u
            LEFT JOIN subscriptions s ON s.user_id = u.id
            WHERE u.id = ? 
            LIMIT 1;
        `, [userId]);

        const successfulPayments = paymentRows.filter(p => p.status === 'SUCCESS');
        let activePlanId = '1';
        let latestPaymentDate = null;

        if (successfulPayments.length > 0) {
            const latest = successfulPayments[0];
            latestPaymentDate = latest.created_at;
            activePlanId = String(latest.plan_id || (parseFloat(latest.amount) === 150 ? '3' : parseFloat(latest.amount) === 10 ? '4' : '2'));
        } else if (userSubRows.length > 0) {
            const row = userSubRows[0];
            activePlanId = (row.user_plan_id && row.user_plan_id !== 'free-trial')
                ? row.user_plan_id
                : ((row.sub_plan_id && row.sub_plan_id !== 'free-trial') ? row.sub_plan_id : (row.user_plan_id || row.sub_plan_id || '1'));
        }

        const planDetails = resolvePlanDetails(activePlanId);

        let nextBilling = null;
        if (userSubRows.length > 0 && userSubRows[0]?.next_billing_date && new Date(userSubRows[0].next_billing_date) > new Date()) {
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
            planName: planDetails.name,
            price: planDetails.price,
            billingCycle: planDetails.billingCycle,
            status: activePlanId === 'free-trial' ? 'TRIAL' : 'ACTIVE',
            currentPeriodStart: latestPaymentDate || new Date(),
            nextBillingDate: nextBilling,
            autoRenew: true
        };

        // Sync database tables so future queries stay in sync
        if (activePlanId !== '1') {
            await db.query(`UPDATE users SET plan_id = ? WHERE id = ?;`, [activePlanId, userId]).catch(() => {});
            await db.query(`
                INSERT INTO subscriptions (user_id, plan_id, status, trial_start, trial_end, next_billing_date, billing_day)
                VALUES (?, ?, 'ACTIVE', NULL, NULL, ?, ?)
                ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id), status = 'ACTIVE', next_billing_date = VALUES(next_billing_date);
            `, [userId, activePlanId, nextBilling, new Date(nextBilling).getDate()]).catch(() => {});
        }

        const history = paymentRows.map(p => {
            const dateObj = new Date(p.created_at);
            const dynInvoice = `INV-${dateObj.getFullYear()}-${p.id.replace('pay-', '').substring(0, 5).toUpperCase()}`;
            const amt = parseFloat(p.amount);
            const itemPlanId = amt === 150 ? '3' : amt === 50 ? '2' : amt === 10 ? '4' : (p.plan_id || '1');
            const itemPlanDetails = resolvePlanDetails(itemPlanId);
            
            return {
                id: p.id,
                date: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                plan: itemPlanDetails.name,
                rate: `₹${itemPlanDetails.price} / ${itemPlanDetails.billingCycle.toLowerCase() === 'lifetime' ? 'one-time' : 'month'}`,
                amount: `₹${amt.toFixed(2)}`,
                status: p.status === 'SUCCESS' ? 'Success' : 'Failed',
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
// Simulates invoice download
router.get("/invoice/:id", async (req, res) => {
    // In a real app, this would generate a PDF or redirect to an S3 URL.
    // For now, we return a success status indicating the invoice is available.
    res.json({
        success: true,
        message: "Invoice retrieved",
        downloadUrl: `https://upnum-mock-storage.s3.amazonaws.com/invoices/${req.params.id}.pdf`
    });
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
