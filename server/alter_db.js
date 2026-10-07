const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function alterTable() {
    const hostEnv = process.env.DB_HOST || "localhost";
    const [host, portStr] = hostEnv.split(":");
    const port = portStr ? parseInt(portStr, 10) : 3306;

    const connection = await mysql.createConnection({
        host: host,
        port: port,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "upnum",
    });

    try {
        console.log("Adding missing columns to payments and users tables...");
        
        await connection.query(`ALTER TABLE payments ADD COLUMN provider VARCHAR(50);`).catch(e => console.log(e.message));
        await connection.query(`ALTER TABLE payments ADD COLUMN provider_bill_id VARCHAR(100);`).catch(e => console.log(e.message));
        await connection.query(`ALTER TABLE payments ADD COLUMN upi_id VARCHAR(100);`).catch(e => console.log(e.message));
        await connection.query(`ALTER TABLE payments ADD COLUMN payment_link TEXT;`).catch(e => console.log(e.message));
        await connection.query(`ALTER TABLE payments ADD COLUMN raw_response TEXT;`).catch(e => console.log(e.message));
        await connection.query(`ALTER TABLE users ADD COLUMN plan_id VARCHAR(50) DEFAULT 'free-trial';`).catch(e => console.log(e.message));
        
        console.log("Done.");
    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

alterTable();
