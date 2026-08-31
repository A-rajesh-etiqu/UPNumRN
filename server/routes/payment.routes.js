const express = require("express");

const {
    createPaymentLink,
    getPaymentStatus,
    createUPICollectRequest,
} = require("../services/setu.service");

const router = express.Router();


router.get(
    "/:platformBillID/status",
    async (req, res) => {

        try {

            const {
                platformBillID,
            } = req.params;


            const payment =
                await getPaymentStatus(
                    platformBillID
                );


            return res.json({

                success: true,

                data: payment,

            });

        } catch (error) {

            console.error(
                "Setu status error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to fetch payment status",

            });

        }

    }
);


module.exports = router;