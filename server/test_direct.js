require('dotenv').config();
const { createConsent } = require('./services/setu.service');

(async () => {
    try {
        const res = await createConsent({
            vua: "9999999999@finvu",
        });
        console.log("SUCCESS:", JSON.stringify(res, null, 2));
    } catch (e) {
        if (e.response) {
            console.error("FAILED API RESPONSE:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error("FAILED:", e.message);
        }
    }
})();
