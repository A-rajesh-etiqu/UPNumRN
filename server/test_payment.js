require('dotenv').config();
const mysql = require('mysql2/promise');
const { generateInvoicePDF } = require('./services/pdfGenerator');
const { sendInvoice } = require('./services/mailer');

async function testFullFlow() {
    const hostEnv = process.env.DB_HOST || "localhost";
    const [host, portStr] = hostEnv.split(":");
    const port = portStr ? parseInt(portStr, 10) : 3306;

    const conn = await mysql.createConnection({
        host, port,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "upnum",
    });

    try {
        // 1. Check payments table columns
        const [cols] = await conn.query("SHOW COLUMNS FROM payments;");
        console.log("Payments columns:", cols.map(c => c.Field));

        // 2. Check user-1 exists
        const [users] = await conn.query("SELECT id, name, email FROM users WHERE id = 'user-1';");
        console.log("User:", users[0]);

        // 3. Simulate dummy INSERT
        const paymentId = `test-payment-${Date.now()}`;
        const billerBillID = `UPNUM-${paymentId}`;
        await conn.query(
            "INSERT INTO payments (id, user_id, amount, status, provider, provider_bill_id, upi_id) VALUES (?, 'user-1', 50, 'SUCCESS', 'SETU', ?, ?);",
            [paymentId, billerBillID, 'dummy@upi']
        );
        console.log("Payment inserted:", paymentId);

        // 4. Generate PDF
        const invoiceData = {
            invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
            planName: "UP Num Subscription - standard",
            amount: "50.00",
            date: new Date().toLocaleDateString("en-IN"),
            billingCycle: "Monthly",
            userName: users[0]?.name || "Customer",
            upiId: 'dummy@upi',
            transactionId: paymentId,
            status: "SUCCESS"
        };

        console.log("Generating PDF...");
        const pdfBuffer = await generateInvoicePDF(invoiceData);
        console.log("PDF generated, size:", pdfBuffer.length, "bytes");

        // 5. Send email
        if (users[0]?.email) {
            console.log("Sending invoice to:", users[0].email);
            await sendInvoice(users[0].email, invoiceData, pdfBuffer);
            console.log("Email sent successfully!");
        } else {
            console.log("No email found for user-1");
        }

    } catch (e) {
        console.error("TEST ERROR:", e.message);
        console.error(e.stack);
    } finally {
        await conn.end();
    }
}

testFullFlow();
