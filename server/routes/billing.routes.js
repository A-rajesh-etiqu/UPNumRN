const express = require("express");
const db = require("../db");
const { sendInvoice } = require("../services/mailer");

const router = express.Router();

// GET /billing/history
// Returns billing history (payments/invoices) and subscription status
router.get("/history", async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // 1. Fetch Subscription Status
        const [subRows] = await db.query(`
            SELECT s.*, p.name as plan_name, p.price as plan_price, p.billing as plan_billing 
            FROM subscriptions s
            LEFT JOIN plans p ON CAST(p.id AS CHAR) = CAST(s.plan_id AS CHAR)
            WHERE s.user_id = ? 
            LIMIT 1;
        `, [userId]);

        let subscription = null;
        if (subRows.length > 0) {
            const s = subRows[0];
            const isTrial = s.plan_id === 'free-trial' || s.status === 'TRIAL';
            const isExpired = isTrial && s.trial_end && new Date() > new Date(s.trial_end);

            if (isTrial) {
                subscription = {
                    planId: 'free-trial',
                    planName: isExpired ? "Free Trial (Expired)" : "Free Trial (1 Month)",
                    price: 0,
                    status: isExpired ? "EXPIRED" : "TRIAL",
                    currentPeriodStart: s.trial_start,
                    nextBillingDate: s.trial_end,
                    autoRenew: false
                };
            } else {
                const fallbackPrice = s.plan_id === '3' || s.plan_id === 'premium' ? 150 : (s.plan_id === '2' || s.plan_id === 'standard' ? 50 : 0);
                const fallbackName = s.plan_id === '3' || s.plan_id === 'premium' ? "Premium Plan" : (s.plan_id === '2' || s.plan_id === 'standard' ? "Standard Plan" : "Free Tier");
                subscription = {
                    planId: s.plan_id,
                    planName: s.plan_name || fallbackName,
                    price: s.plan_price !== null && s.plan_price !== undefined ? parseFloat(s.plan_price) : fallbackPrice,
                    status: s.status,
                    currentPeriodStart: s.trial_start || s.next_billing_date,
                    nextBillingDate: s.next_billing_date,
                    autoRenew: s.status === 'ACTIVE'
                };
            }
        }

        // 2. Fetch Payments & Invoices
        const [paymentRows] = await db.query(`
            SELECT p.*, i.invoice_no, i.id as invoice_id
            FROM payments p
            LEFT JOIN invoices i ON p.id = i.payment_id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC;
        `, [userId]);

        const history = paymentRows.map(p => {
            const dateObj = new Date(p.created_at);
            // Generate invoice dynamically if missing in DB
            const dynInvoice = `INV-${dateObj.getFullYear()}-${p.id.replace('pay-', '').substring(0, 5).toUpperCase()}`;
            
            return {
                id: p.id,
                date: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                plan: subscription ? subscription.planName : "Standard Plan",
                rate: `₹${subscription ? subscription.price : 50} / month`,
                amount: `₹${p.amount}`,
                status: p.status === 'SUCCESS' ? 'Success' : 'Failed',
                upi: "UPI (Auto)",
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
