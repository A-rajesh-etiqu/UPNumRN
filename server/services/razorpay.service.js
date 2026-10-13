const Razorpay = require("razorpay");
const crypto = require("crypto");

const getKeyId = () => process.env.RAZORPAY_KEY_ID || "rzp_test_TXBKZAMQy09pqs";
const getKeySecret = () => process.env.RAZORPAY_KEY_SECRET || "Cd0Ue22JwQeslMtEjhtYSUro";

function getRazorpayInstance() {
    return new Razorpay({
        key_id: getKeyId(),
        key_secret: getKeySecret(),
    });
}

async function createRazorpayOrder({ amount, currency = "INR", receipt, notes = {} }) {
    const razorpay = getRazorpayInstance();
    const options = {
        amount: Math.round(Number(amount) * 100), // amount in paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes,
    };
    const order = await razorpay.orders.create(options);
    return order;
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
        .createHmac("sha256", getKeySecret())
        .update(body.toString())
        .digest("hex");
    return expectedSignature === signature;
}

module.exports = {
    createRazorpayOrder,
    verifyRazorpaySignature,
    getKeyId,
    getKeySecret,
};
