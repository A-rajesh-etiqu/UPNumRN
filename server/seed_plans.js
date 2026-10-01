const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
    const hostEnv = process.env.DB_HOST || "localhost";
    const [host, portStr] = hostEnv.split(":");
    const port = portStr ? parseInt(portStr, 10) : 3306;

    const conn = await mysql.createConnection({
        host: host,
        port: port,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "upnum"
    });

    await conn.query('DELETE FROM plans');
    await conn.query(`
        INSERT INTO plans (id, name, type, price, billing, status, subscribers, description) VALUES
        (1, 'Free Tier', 'Basic Features', 0.00, 'Monthly', 'Active', 12543, 'Basic Dashboard Features,100 Transactions/mo,Community Support,Standard Data Backups'),
        (2, 'Standard Plan', 'Advanced Features', 50.00, 'Monthly', 'Active', 5234, 'All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,Priority Support,Secure Data & Backups'),
        (3, 'Premium Plan', 'All Features', 150.00, 'Monthly', 'Active', 1845, 'All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,24/7 Dedicated Support,Secure Data & Backups,API Access'),
        (4, 'Standard Yearly', 'Advanced Features', 500.00, 'Yearly', 'Active', 2100, 'All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,Priority Support,Secure Data & Backups'),
        (5, 'Premium Yearly', 'All Features', 1400.00, 'Yearly', 'Active', 890, 'All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,24/7 Dedicated Support,Secure Data & Backups,API Access'),
        (6, 'Enterprise Plan', 'Enterprise Features', 999.00, 'Yearly', 'Active', 495, 'All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,Priority Support,Secure Data & Backups');
    `);

    console.log('Successfully seeded database with Monthly and Yearly plans.');
    await conn.end();
}

run().catch(console.error);
