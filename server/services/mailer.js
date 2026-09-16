const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendOTP = async (to, otp) => {
    try {
        const info = await transporter.sendMail({
            from: `"UpNum" <${process.env.SMTP_USER}>`,
            to,
            subject: "Your OTP for UpNum Password Reset",
            text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
            html: `<b>Your OTP is ${otp}</b><br/>It is valid for 10 minutes.`,
        });
        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        return false;
    }
};

const sendInvoice = async (to, invoiceNo) => {
    try {
        const info = await transporter.sendMail({
            from: `"UpNum" <${process.env.SMTP_USER}>`,
            to,
            subject: `Your UpNum Invoice: ${invoiceNo}`,
            text: `Please find attached your invoice ${invoiceNo}. (Simulated attachment)`,
            html: `<b>Your Invoice: ${invoiceNo}</b><br/>Please find attached your invoice. (Simulated attachment)`,
        });
        console.log("Invoice email sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending invoice email:", error);
        return false;
    }
};

module.exports = {
    sendOTP,
    sendInvoice,
};
