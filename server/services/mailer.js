const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// ─────────────────────────────────────────────────
// OTP Email — Forgot Password
// ─────────────────────────────────────────────────
const sendOTP = async (to, otp) => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>UpNum Password Reset</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7C3AED,#4F46E5);padding:36px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 20px;">
                <span style="color:#FFFFFF;font-size:22px;font-weight:800;letter-spacing:1px;">✦ UpNum</span>
              </div>
              <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:10px 0 0;">Smart Finance Management</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <h1 style="font-size:22px;font-weight:800;color:#0F172A;margin:0 0 10px;">Password Reset Request</h1>
              <p style="color:#64748B;font-size:14px;line-height:22px;margin:0 0 28px;">
                We received a request to reset your UpNum password. Use the one-time password below. 
                It is valid for <strong>10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#F5F3FF;border:2px dashed #8B5CF6;border-radius:14px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="color:#7C3AED;font-size:12px;font-weight:700;letter-spacing:2px;margin:0 0 12px;text-transform:uppercase;">Your One-Time Password</p>
                <div style="font-size:42px;font-weight:900;letter-spacing:10px;color:#4F46E5;">${otp}</div>
                <p style="color:#94A3B8;font-size:12px;margin:12px 0 0;">Do not share this code with anyone.</p>
              </div>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 12px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                      <span style="background:#EFF6FF;color:#2563EB;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:700;">1</span>
                      <span style="color:#475569;font-size:13px;">Open the UpNum app and go to "Forgot Password"</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 12px;">
                    <span style="background:#EFF6FF;color:#2563EB;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:700;">2</span>
                    <span style="color:#475569;font-size:13px;margin-left:12px;">Enter the OTP code above</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="background:#EFF6FF;color:#2563EB;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:700;">3</span>
                    <span style="color:#475569;font-size:13px;margin-left:12px;">Set your new password</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td style="padding:0 40px 24px;">
              <div style="background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:8px;padding:14px 16px;">
                <p style="color:#92400E;font-size:12px;margin:0;line-height:20px;">
                  ⚠️ <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email. 
                  Your account is safe. Never share your OTP with anyone including UpNum support.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:24px 40px;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="color:#94A3B8;font-size:12px;margin:0 0 4px;">© 2024 UpNum. All rights reserved.</p>
              <p style="color:#CBD5E1;font-size:11px;margin:0;">This is an automated email. Please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    try {
        const info = await transporter.sendMail({
            from: `"UpNum" <${process.env.SMTP_USER}>`,
            to,
            subject: "🔐 Your UpNum Password Reset OTP",
            text: `Your UpNum OTP is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.`,
            html,
        });
        console.log("OTP email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        return false;
    }
};

// ─────────────────────────────────────────────────
// Invoice Email — Subscription Payment
// ─────────────────────────────────────────────────
const sendInvoice = async (to, invoiceData = {}, pdfBuffer = null) => {
    const {
        invoiceNo = "INV-000000",
        planName = "UpNum Plan",
        amount = "₹0.00",
        date = new Date().toLocaleDateString("en-IN"),
        billingCycle = "Monthly",
        userName = "Customer",
        upiId = "N/A",
        transactionId = "N/A",
        status = "SUCCESS",
    } = invoiceData;

    const statusColor = status === "SUCCESS" || status === "Success" ? "#10B981" : "#EF4444";
    const statusBg    = status === "SUCCESS" || status === "Success" ? "#ECFDF5" : "#FEE2E2";
    const statusLabel = status === "SUCCESS" || status === "Success" ? "✓ Payment Successful" : "✗ Payment Failed";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>UpNum Invoice ${invoiceNo}</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7C3AED,#4F46E5);padding:36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="color:#FFFFFF;font-size:24px;font-weight:900;letter-spacing:1px;">✦ UpNum</div>
                    <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:4px;">Smart Finance Management</div>
                  </td>
                  <td align="right">
                    <div style="color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Invoice</div>
                    <div style="color:#FFFFFF;font-size:16px;font-weight:800;margin-top:4px;">${invoiceNo}</div>
                    <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px;">${date}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="background:${statusBg};border-radius:10px;padding:12px 20px;display:inline-block;">
                <span style="color:${statusColor};font-size:14px;font-weight:700;">${statusLabel}</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:24px 40px 0;">
              <h2 style="font-size:18px;font-weight:800;color:#0F172A;margin:0 0 6px;">Hello, ${userName}!</h2>
              <p style="color:#64748B;font-size:13px;line-height:22px;margin:0;">
                Thank you for your payment. Here is the receipt for your UpNum subscription.
              </p>
            </td>
          </tr>

          <!-- Invoice Table -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
                <tr style="background:#F8FAFC;">
                  <td style="padding:14px 20px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;">Description</td>
                  <td style="padding:14px 20px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;text-align:right;">Amount</td>
                </tr>
                <tr style="border-top:1px solid #E2E8F0;">
                  <td style="padding:16px 20px;">
                    <div style="font-size:14px;font-weight:700;color:#0F172A;">${planName}</div>
                    <div style="font-size:12px;color:#64748B;margin-top:2px;">Billing cycle: ${billingCycle}</div>
                  </td>
                  <td style="padding:16px 20px;text-align:right;font-size:14px;font-weight:700;color:#0F172A;">${amount}</td>
                </tr>
                <tr style="border-top:1px solid #E2E8F0;background:#F8FAFC;">
                  <td style="padding:14px 20px;font-size:14px;font-weight:800;color:#0F172A;">Total</td>
                  <td style="padding:14px 20px;text-align:right;font-size:18px;font-weight:900;color:#7C3AED;">${amount}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding:0 40px 24px;">
              <div style="background:#F5F3FF;border-radius:12px;padding:20px;">
                <p style="color:#7C3AED;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;">Payment Details</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#64748B;font-size:13px;padding-bottom:8px;">UPI ID</td>
                    <td style="color:#0F172A;font-size:13px;font-weight:600;text-align:right;padding-bottom:8px;">${upiId}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748B;font-size:13px;padding-bottom:8px;">Transaction ID</td>
                    <td style="color:#0F172A;font-size:13px;font-weight:600;text-align:right;padding-bottom:8px;">${transactionId}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748B;font-size:13px;">Invoice No.</td>
                    <td style="color:#0F172A;font-size:13px;font-weight:600;text-align:right;">${invoiceNo}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <p style="color:#64748B;font-size:13px;margin:0 0 16px;">
                Need help? Contact us at <a href="mailto:support@upnum.in" style="color:#7C3AED;text-decoration:none;">support@upnum.in</a>
              </p>
              <div style="background:#F1F5F9;border-radius:8px;padding:12px;display:inline-block;">
                <p style="color:#94A3B8;font-size:11px;margin:0;">🔒 This is a secure automated invoice from UpNum. Please keep it for your records.</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="color:#94A3B8;font-size:12px;margin:0 0 4px;">© 2024 UpNum. All rights reserved.</p>
              <p style="color:#CBD5E1;font-size:11px;margin:0;">This is an automated invoice. Please do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    try {
        const mailOptions = {
            from: `"UpNum" <${process.env.SMTP_USER}>`,
            to,
            subject: `🧾 Your UpNum Invoice: ${invoiceNo}`,
            text: `Dear ${userName},\n\nThank you for your payment.\n\nInvoice No: ${invoiceNo}\nPlan: ${planName}\nAmount: ${amount}\nDate: ${date}\nTransaction ID: ${transactionId}\n\nThank you for using UpNum!`,
            html,
        };

        if (pdfBuffer) {
            mailOptions.attachments = [
                {
                    filename: `${invoiceNo}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ];
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("Invoice email sent:", info.messageId);
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
