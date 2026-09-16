const express = require("express");

const {
    createConsent,
    getConsent,
    createDataSession,
    getDataSession,
    checkAccountAvailability,
    getConsentStatus,
    getFIData,
    parseAndStoreFITransactions,
} = require("../services/setu.service");

const db = require("../db");

const router =
    express.Router();


/**
 * CREATE CONSENT
 *
 * Mobile app calls this when
 * user taps "Connect Bank".
 */
router.post(
    "/consents",
    async (req, res) => {

        try {

            const {
                userId,
                vua,
                consentDetail,
                additionalParams,
                redirectUrl,
            } = req.body;

            if (!userId) {
                return res.status(400).json({ success: false, message: "userId is required" });
            }


            if (!vua) {

                return res.status(400).json({
                    success: false,
                    message:
                        "VUA is required",
                });
            }


            if (!consentDetail) {

                return res.status(400).json({
                    success: false,
                    message:
                        "consentDetail is required",
                });
            }


            const consent =
                await createConsent({

                    vua,

                    consentDetail,

                    additionalParams,
                    
                    redirectUrl,

                });
            
            await db.query(
                `INSERT INTO consents (id, user_id, vua, status) VALUES (?, ?, ?, 'PENDING')`,
                [consent.id || consent.ConsentHandle || 'mock-id-' + Date.now(), userId, vua]
            );


            return res.status(201).json({

                success: true,

                data: consent,

            });

        } catch (error) {

            console.error(
                "Setu create consent:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to create consent",

            });
        }
    }
);


/**
 * GET CONSENT
 */
router.get(
    "/consents/:consentId",
    async (req, res) => {

        try {

            const {
                consentId,
            } = req.params;


            const consent =
                await getConsent(
                    consentId
                );


            return res.json({

                success: true,

                data: consent,

            });

        } catch (error) {

            console.error(
                "Setu get consent:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to fetch consent",

            });
        }
    }
);


/**
 * CREATE DATA SESSION
 *
 * Must only be called after
 * consent is approved.
 */
router.post(
    "/sessions",
    async (req, res) => {

        try {

            const {
                consentId,
                from,
                to,
                format,
            } = req.body;


            if (!consentId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "consentId is required",
                });
            }


            const session =
                await createDataSession({

                    consentId,

                    from,

                    to,

                    format:
                        format || "json",

                });


            return res.status(201).json({

                success: true,

                data: session,

            });

        } catch (error) {

            console.error(
                "Setu create session:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to create data session",

            });
        }
    }
);


/**
 * GET DATA SESSION
 */
router.get(
    "/sessions/:sessionId",
    async (req, res) => {

        try {

            const {
                sessionId,
            } = req.params;


            const session =
                await getDataSession(
                    sessionId
                );


            return res.json({

                success: true,

                data: session,

            });

        } catch (error) {

            console.error(
                "Setu get session:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to fetch data session",

            });
        }
    }
);

router.post("/account-availability", async (req, res) => {
    try {
        const { mobileNumber } = req.body;
        if (!mobileNumber) {
            return res.status(400).json({ success: false, message: "mobileNumber is required" });
        }
        const data = await checkAccountAvailability(mobileNumber);
        return res.json({ success: true, data });
    } catch (error) {
        console.error("Setu check account availability:", error);
        return res.status(500).json({ success: false, message: "Unable to check account availability" });
    }
});

router.post("/sync-consent", async (req, res) => {
    try {
        const { consentId } = req.body;
        if (!consentId) return res.status(400).json({ success: false, message: "consentId required" });

        const statusData = await getConsentStatus(consentId);
        console.log("Consent Status Data:", statusData);
        const status = statusData.status;

        await db.query(`UPDATE consents SET status = ? WHERE id = ?`, [status, consentId]);

        if (status === "ACTIVE" || status === "READY") {
            let fromDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
            let toDate = new Date().toISOString();
            
            // Attempt to get the exact dataRange from the consent status
            const detail = statusData.detail || statusData.ConsentDetail || statusData.consentDetail;
            const range = detail?.FIDataRange || detail?.fiDataRange || detail?.dataRange || detail?.DataRange || statusData.FIDataRange || statusData.dataRange;
            if (range && range.from && range.to) {
                fromDate = range.from;
                toDate = range.to;
            } else {
                // Fetch the original consent from our database to get its created_at timestamp
                // The generated consent's DataRange 'to' date was set exactly when it was created.
                const [rows] = await db.query("SELECT created_at FROM consents WHERE id = ?", [consentId]);
                if (rows.length > 0 && rows[0].created_at) {
                    const createdAt = new Date(rows[0].created_at);
                    // Subtract 1 second to ensure it is strictly within the original upper bound
                    toDate = new Date(createdAt.getTime() - 1000).toISOString();
                    // Keep fromDate 6 months prior to toDate
                    fromDate = new Date(createdAt.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
                } else {
                    toDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                }
            }

            const sessionResponse = await createDataSession({
                consentId,
                fromDate,
                toDate
            });
            const sessionId = sessionResponse.id || sessionResponse.dataSessionId || sessionResponse.session_id;
            
            if (sessionId) {
                await db.query(`UPDATE consents SET session_id = ? WHERE id = ?`, [sessionId, consentId]);
                // Fetch Data Immediately (in real app, we would wait for FI_DATA_READY webhook or poll)
                // We simulate polling/waiting
                await new Promise(r => setTimeout(r, 2000)); 
                const fiData = await getFIData(sessionId);
                console.log("================= SETU FI DATA FETCHED =================");
                console.log(JSON.stringify(fiData, null, 2));
                console.log("========================================================");
                await parseAndStoreFITransactions(sessionId, fiData);
                return res.json({ success: true, message: "Transactions synced" });
            }
        }
        return res.json({ success: true, message: "Consent status is " + status });
    } catch (error) {
        console.error("Setu sync consent:", error);
        return res.status(500).json({ success: false, message: "Failed to sync consent data" });
    }
});

module.exports = router;