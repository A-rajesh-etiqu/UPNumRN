const nodemailer = require("nodemailer");

(async () => {
    console.log("Generating Ethereal Test Account...");
    const testAccount = await nodemailer.createTestAccount();
    console.log("Test Account Generated:", testAccount.user);

    // Override env variables for nodemailer before requiring mailer
    process.env.SMTP_HOST = "smtp.ethereal.email";
    process.env.SMTP_PORT = 587;
    process.env.SMTP_USER = testAccount.user;
    process.env.SMTP_PASS = testAccount.pass;

    // Clear require cache just in case mailer.js was already loaded
    delete require.cache[require.resolve("./services/mailer")];
    const { sendOTP, sendInvoice } = require("./services/mailer");

    console.log("\n--- Testing sendOTP ---");
    await sendOTP("test@example.com", "123456");

    console.log("\n--- Testing sendInvoice ---");
    await sendInvoice("test@example.com", {
        invoiceNo: "INV-1001",
        planName: "UpNum Premium",
        amount: "₹999.00",
        date: new Date().toLocaleDateString("en-IN"),
        billingCycle: "Yearly",
        userName: "Test User",
        upiId: "test@upi",
        transactionId: "TXN123456789",
        status: "SUCCESS"
    });
    
    console.log("\nDone! Log in to https://ethereal.email/login to view emails.");
    console.log(`User: ${testAccount.user}`);
    console.log(`Pass: ${testAccount.pass}`);
})();
