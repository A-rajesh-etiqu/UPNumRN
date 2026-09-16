const axios = require("axios");

const SETU_BASE_URL =
    process.env.SETU_ENV === "production"
        ? process.env.SETU_PRODUCTION_BASE_URL
        : process.env.SETU_SANDBOX_BASE_URL;

const SETU_AUTH_URL =
    process.env.SETU_AUTH_URL ||
    "https://accountservice.setu.co/v1/users/login";

let cachedToken = null;
let tokenExpiresAt = 0;

function inspectToken(token) {
    try {
        const parts = token.split(".");

        if (parts.length !== 3) {
            console.log("Setu token is not a JWT");
            return;
        }

        const payload = JSON.parse(
            Buffer.from(
                parts[1],
                "base64url"
            ).toString("utf8")
        );

        console.log(
            "SETU TOKEN PAYLOAD:"
        );

        console.log(
            JSON.stringify(
                {
                    iss: payload.iss,
                    aud: payload.aud,
                    sub: payload.sub,
                    exp: payload.exp,
                    iat: payload.iat,
                },
                null,
                2
            )
        );
    } catch (error) {
        console.error(
            "Unable to inspect Setu token:",
            error.message
        );
    }
}


/*
 * Get Setu access token
 */
async function getAccessToken() {

    if (
        cachedToken &&
        Date.now() < tokenExpiresAt
    ) {
        return cachedToken;
    }

    try {

        console.log(
            "Setu auth URL:",
            SETU_AUTH_URL
        );

        console.log(
            "Setu base URL:",
            SETU_BASE_URL
        );

        console.log(
            "Setu client ID:",
            process.env.SETU_CLIENT_ID
                ? "configured"
                : "MISSING"
        );

        console.log(
            "Setu client secret:",
            process.env.SETU_CLIENT_SECRET
                ? "configured"
                : "MISSING"
        );

        console.log(
            "Setu product instance ID:",
            process.env.SETU_PRODUCT_INSTANCE_ID
                ? "configured"
                : "MISSING"
        );


        const response =
            await axios.post(
                SETU_AUTH_URL,
                {
                    clientID:
                        process.env.SETU_CLIENT_ID,

                    secret:
                        process.env.SETU_CLIENT_SECRET,

                    grant_type:
                        "client_credentials",
                },
                {
                    headers: {
                        client: "bridge",
                        "Content-Type":
                            "application/json",
                    },
                }
            );


        cachedToken =
            response.data.access_token;

        inspectToken(
            cachedToken
        );


        const expiresIn =
            Number(
                response.data.expires_in
            ) || 300;


        tokenExpiresAt =
            Date.now() +
            Math.max(
                expiresIn - 30,
                30
            ) * 1000;


        console.log(
            "Setu authentication successful"
        );


        return cachedToken;

    } catch (error) {

        console.error(
            "Setu authentication failed"
        );

        console.error(
            "Status:",
            error.response?.status
        );

        console.error(
            "Response:",
            JSON.stringify(
                error.response?.data,
                null,
                2
            )
        );

        console.error(
            "Message:",
            error.message
        );

        throw new Error(
            "Unable to authenticate with Setu"
        );
    }
}


/*
 * Common headers for Setu AA APIs
 */
async function getHeaders() {

    const token =
        await getAccessToken();

    return {

        Authorization:
            `Bearer ${token}`,

        "Content-Type":
            "application/json",

        "x-product-instance-id":
            process.env.SETU_PRODUCT_INSTANCE_ID,
    };
}


/*
 * Account Availability
 */
async function checkAccountAvailability(
    mobileNumber
) {

    const headers =
        await getHeaders();

    const response =
        await axios.post(
            `${SETU_BASE_URL}/v2/account-availability`,
            {
                mobileNumber,
            },
            {
                headers,
            }
        );

    return response.data;
}


/*
 * Create Consent
 */
async function createConsent({
    vua,
    fromDate,
    toDate,
    redirectUrl,
}) {
    const headers = await getHeaders();

    // Set default dates to 6 months if not provided
    const to = toDate || new Date().toISOString();
    const from = fromDate || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

    const payload = {
        consentDuration: {
            unit: "MONTH",
            value: 1,
        },

        consentMode: "VIEW",

        fetchType: "PERIODIC",
        frequency: {
            unit: "DAY",
            value: 1
        },

        consentTypes: [
            "TRANSACTIONS",
            "PROFILE",
            "SUMMARY"
        ],

        fiTypes: [
            "DEPOSIT",
        ],

        vua: process.env.SETU_ENV !== "production" ? vua.replace("@setu", "@finvu") : vua,

        purpose: {
            code: "101",
            refUri: "https://api.rebit.org.in/aa/purpose/101.xml",
            text: "Wealth management service",
            category: {
                type: "string",
            },
        },

        dataRange: {
            from: from,
            to: to,
        },

        dataLife: {
            unit: "MONTH",
            value: 0,
        },

        context: [
            {
                key: "accounttype",
                value: "SAVINGS"
            }
        ],

        additionalParams: {
            tags: [],
        },

        redirectUrl:
            redirectUrl || process.env.SETU_REDIRECT_URL,
    };

    console.log(
        "SETU CONSENT PAYLOAD:"
    );

    console.log(
        JSON.stringify(
            payload,
            null,
            2
        )
    );

    const response =
        await axios.post(
            `${SETU_BASE_URL}/v2/consents`,
            payload,
            {
                headers,
            }
        );

    return response.data;
}


/*
 * Get Consent Status
 */
async function getConsentStatus(consentId) {
    const headers = await getHeaders();

    const response = await axios.get(
        `${SETU_BASE_URL}/v2/consents/${consentId}`,
        { headers }
    );

    return response.data;
}


/*
 * Create Data Session
 */
async function createDataSession({ consentId, fromDate, toDate }) {
    const headers = await getHeaders();

    const payload = {
        consentId,
        dataRange: {
            from: fromDate,
            to: toDate,
        },
        format: "json"
    };

    const response = await axios.post(
        `${SETU_BASE_URL}/v2/sessions`,
        payload,
        { headers }
    );

    return response.data;
}


/*
 * Get Financial Information (FI) Data
 */
async function getFIData(dataSessionId) {
    const headers = await getHeaders();

    const response = await axios.get(
        `${SETU_BASE_URL}/v2/sessions/${dataSessionId}`,
        { headers }
    );

    return response.data;
}


async function parseAndStoreFITransactions(sessionId, fiData) {
    const db = require("../db");

    // Get userId associated with this session
    const [consentRows] = await db.query("SELECT user_id FROM consents WHERE session_id = ?", [sessionId]);
    if (consentRows.length === 0) {
        console.warn(`No consent found for session ${sessionId}`);
        return;
    }
    const userId = consentRows[0].user_id;

    const fips = fiData.fips || [];
    for (const fip of fips) {
        const accounts = fip.accounts || [];
        for (const accItem of accounts) {
            const account = accItem.data?.account || accItem.data?.Account;
            if (!account) continue;

            let transactions = [];

            // Check ReBIT FI data format for transactions
            if (account.transactions?.transaction) {
                transactions = Array.isArray(account.transactions.transaction) ? account.transactions.transaction : [account.transactions.transaction];
            } else if (account.Transactions?.Transaction) {
                transactions = Array.isArray(account.Transactions.Transaction) ? account.Transactions.Transaction : [account.Transactions.Transaction];
            }

            // Since Setu Sandbox for 9999999999 often returns no transactions, we'll inject a few mock ones for demonstration
            if (transactions.length === 0) {
                console.log("No transactions found in Sandbox payload, injecting mock UPI transactions for demo purposes...");
                transactions = [
                    { amount: "150.00", type: "DEBIT", mode: "UPI", narration: "UPI/Swiggy/swiggy@hdfc/Food", valueDate: new Date().toISOString(), txnId: `upi-tx-${Date.now()}-1` },
                    { amount: "2000.00", type: "CREDIT", mode: "UPI", narration: "UPI/Anmol/test@oksbi/Rent", valueDate: new Date(Date.now() - 86400000).toISOString(), txnId: `upi-tx-${Date.now()}-2` },
                    { amount: "5000.00", type: "DEBIT", mode: "NEFT", narration: "NEFT/Transfer/SBIN0001", valueDate: new Date(Date.now() - 86400000 * 2).toISOString(), txnId: `neft-tx-${Date.now()}-3` } // Non-UPI
                ];
            }

            for (const tx of transactions) {
                // Find UPI transactions by naration or mode
                const narration = tx.narration || "";
                const mode = tx.mode || tx.type || "";
                const isUpi = narration.toLowerCase().includes("upi") || mode.toUpperCase().includes("UPI");

                if (isUpi) {
                    const amount = parseFloat(tx.amount);
                    // In Setu AA format, tx.type is usually 'DEBIT' or 'CREDIT'
                    const finalAmount = tx.type === "DEBIT" ? -amount : amount;
                    const txId = tx.txnId || `upi-tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                    const date = new Date(tx.transactionTimestamp || tx.valueDate || Date.now());
                    const payerUpiMatch = narration.match(/[\w.-]+@[\w.-]+/);
                    const payerUpi = payerUpiMatch ? payerUpiMatch[0] : null;
                    const title = narration.substring(0, 50);

                    console.log(`Found UPI Tx: [${finalAmount}] ${title}`);

                    await db.query(`
                        INSERT IGNORE INTO transactions (id, user_id, title, category, amount, date_time, status, payer_upi, payment_method)
                        VALUES (?, ?, ?, 'UPI Transfer', ?, ?, 'SUCCESS', ?, 'UPI')
                    `, [txId, userId, title, finalAmount, date, payerUpi]);
                }
            }
        }
    }
}

// Mock implementation for Setu Payment Link
async function createPaymentLink(params) {
    console.log("Mocking Setu Payment Link creation with params:", params);
    return {
        platformBillID: `bill-${Date.now()}`,
        paymentLink: {
            shortURL: `https://mock.setu.co/pay/${Date.now()}`,
            upiID: "mockbiller@setu",
            upiLink: `upi://pay?pa=mockbiller@setu&pn=UPNum&am=${params.amount}&tr=${params.billerBillID}`
        }
    };
}

// Mock implementation for Setu UPI Collect (push notification to VUA)
async function createUPICollectRequest(params) {
    console.log("Mocking Setu UPI Collect Request with params:", params);
    // In a real implementation, this would call Setu's UPI Collect API
    // and Setu would trigger a push notification to the user's UPI app.
    return {
        platformBillID: `collect-${Date.now()}`,
        status: "PAYMENT_PENDING",
        vua: params.vua,
        amount: params.amount
    };
}

// Mock implementation for Setu Payment Status
async function getPaymentStatus(platformBillID) {
    console.log("Mocking Setu Payment Status check for:", platformBillID);
    return {
        platformBillID,
        status: "PAYMENT_SUCCESSFUL", // Simulating a successful payment
        amountPaid: 0,
        receipt: { id: `receipt-${Date.now()}` }
    };
}

module.exports = {
    getAccessToken,
    getHeaders,
    checkAccountAvailability,
    createConsent,
    getConsentStatus,
    createDataSession,
    getFIData,
    parseAndStoreFITransactions,
    createPaymentLink,
    createUPICollectRequest,
    getPaymentStatus
};