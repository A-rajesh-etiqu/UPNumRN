const isProduction =
    process.env.SETU_ENV === "production";

module.exports = {
    environment:
        process.env.SETU_ENV || "sandbox",

    baseUrl: isProduction
        ? process.env.SETU_PRODUCTION_BASE_URL
        : process.env.SETU_SANDBOX_BASE_URL,

    clientId:
        process.env.SETU_CLIENT_ID,

    clientSecret:
        process.env.SETU_CLIENT_SECRET,

    productInstanceId:
        process.env.SETU_PRODUCT_INSTANCE_ID,

    webhookSecret:
        process.env.SETU_WEBHOOK_SECRET,

    redirectUrl:
        process.env.SETU_REDIRECT_URL,
};