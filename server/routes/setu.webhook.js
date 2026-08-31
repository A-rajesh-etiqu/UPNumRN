const express = require("express");
const db = require("../db");

const router = express.Router();


router.post(
    "/notifications",
    async (req, res) => {

        try {

            console.log(
                "Setu webhook:",
                JSON.stringify(
                    req.body,
                    null,
                    2
                )
            );


            const {
                events = [],
            } = req.body;


            for (const event of events) {

                const data =
                    event.data;


                if (
                    event.type ===
                    "BILL_FULFILMENT_STATUS"
                ) {

                    if (
                        data.status !==
                        "PAYMENT_SUCCESSFUL"
                    ) {
                        continue;
                    }

                    const {
                        billerBillID,
                        platformBillID,
                        amountPaid,
                        transactionId,
                        payerVpa,
                    } = data;

                    console.log(
                        "Payment successful:",
                        {
                            billerBillID,
                            platformBillID,
                            amountPaid,
                            transactionId,
                            payerVpa,
                        }
                    );
                    
                    continue;
                }

                // Setu AA Webhooks
                if (event.type === "CONSENT_STATUS_UPDATE") {
                    const consentId = data.consentId;
                    const status = data.status; // e.g. ACTIVE, REJECTED
                    console.log(`Consent ${consentId} status update: ${status}`);

                    await db.query(`UPDATE consents SET status = ? WHERE id = ?`, [status, consentId]);

                    if (status === "ACTIVE") {
                        const { createDataSession } = require("../services/setu.service");
                        try {
                            const sessionResponse = await createDataSession({
                                consentId,
                                fromDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
                                toDate: new Date().toISOString()
                            });
                            
                            const sessionId = sessionResponse.id || sessionResponse.dataSessionId;
                            if (sessionId) {
                                await db.query(`UPDATE consents SET session_id = ? WHERE id = ?`, [sessionId, consentId]);
                                console.log(`Created data session ${sessionId} for consent ${consentId}`);
                            }
                        } catch (err) {
                            console.error("Failed to create data session automatically", err);
                        }
                    }
                    continue;
                }

                if (event.type === "FI_DATA_READY") {
                    const sessionId = data.sessionId || data.dataSessionId;
                    console.log(`FI Data Ready for session ${sessionId}`);

                    const { getFIData, parseAndStoreFITransactions } = require("../services/setu.service");
                    try {
                        const fiData = await getFIData(sessionId);
                        await parseAndStoreFITransactions(sessionId, fiData);
                        console.log(`Stored transactions for session ${sessionId}`);
                    } catch (err) {
                        console.error("Failed to fetch/store FI Data", err);
                    }
                    continue;
                }
            }


            return res.sendStatus(200);

        } catch (error) {

            console.error(
                "Setu webhook error:",
                error
            );

            return res.sendStatus(500);

        }

    }
);


module.exports = router;