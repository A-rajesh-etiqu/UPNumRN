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
            SELECT s.*, p.name as plan_name, p.price, p.billing_cycle 
            FROM subscriptions s
            LEFT JOIN (
                SELECT 'free' as id, 'Free Tier' as name, 0 as price, 'MONTHLY' as billing_cycle
                UNION ALL SELECT 'standard', 'Standard Plan', 50, 'MONTHLY'
                UNION ALL SELECT 'lifetime', 'Founder Offer', 10, 'LIFETIME'
            ) p ON s.plan_id = p.id
            WHERE s.user_id = ? 
            LIMIT 1;
        `, [userId]);

        let subscription = null;
        if (subRows.length > 0) {
            const s = subRows[0];
            subscription = {
                planId: s.plan_id,
                planName: s.plan_name || "Standard Plan",
                price: s.price,
                status: s.status,
                currentPeriodStart: s.trial_start || s.next_billing_date, // Simplified
                nextBillingDate: s.next_billing_date,
                autoRenew: s.status === 'ACTIVE'
            };
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
