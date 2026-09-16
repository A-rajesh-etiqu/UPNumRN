const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

async function initDatabase() {
    const hostEnv = process.env.DB_HOST || "localhost";
    const [host, portStr] = hostEnv.split(":");
    const port = portStr ? parseInt(portStr, 10) : 3306;

    // 1. Connect without database name to ensure the database exists
    const tempConnection = await mysql.createConnection({
        host: host,
        port: port,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
    });

    const dbName = process.env.DB_NAME || "upnum";
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await tempConnection.end();

    // 2. Setup connection pool using selected database
    pool = mysql.createPool({
        host: host,
        port: port,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    console.log(`Connected to MySQL database: ${dbName}`);

    // 3. Create tables if they do not exist
    await createTables();

    // 4. Seed mock data
    await seedDatabase();
}

async function createTables() {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                mobile VARCHAR(20) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'USER',
                user_type VARCHAR(20) NOT NULL DEFAULT 'PERSONAL',
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS profiles (
                user_id VARCHAR(50) PRIMARY KEY,
                business_name VARCHAR(100),
                category VARCHAR(50),
                city VARCHAR(50),
                language VARCHAR(50) DEFAULT 'English',
                currency VARCHAR(50) DEFAULT 'INR',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS upi_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                upi_id VARCHAR(100) NOT NULL UNIQUE,
                verified BOOLEAN DEFAULT FALSE,
                primary_flag BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                title VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
                payer_upi VARCHAR(100),
                payment_method VARCHAR(50) DEFAULT 'UPI',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL UNIQUE,
                plan_id VARCHAR(50) NOT NULL,
                trial_start TIMESTAMP NULL,
                trial_end TIMESTAMP NULL,
                billing_day INT NOT NULL,
                next_billing_date TIMESTAMP NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                gateway_ref VARCHAR(100),
                webhook_status VARCHAR(20) DEFAULT 'SUCCESS',
                status VARCHAR(20) DEFAULT 'SUCCESS',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_no VARCHAR(50) UNIQUE NOT NULL,
                payment_id VARCHAR(50) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                invoice_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS consents (
                id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                vua VARCHAR(100) NOT NULL,
                status VARCHAR(20) DEFAULT 'PENDING',
                session_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                billing VARCHAR(50) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'Active',
                subscribers INT DEFAULT 0,
                description TEXT
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS offers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                discount VARCHAR(100) NOT NULL,
                usage_count INT DEFAULT 0,
                valid_from VARCHAR(50),
                valid_to VARCHAR(50),
                status VARCHAR(20) NOT NULL DEFAULT 'Active'
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                target_type VARCHAR(20) NOT NULL DEFAULT 'ALL',
                target_users TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_notifications_read (
                user_id VARCHAR(50) NOT NULL,
                notification_id INT NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, notification_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
            );
        `);

        console.log("Database schema validated successfully (tables exist).");
    } catch (err) {
        console.error("Error migrating tables schema:", err);
        throw err;
    } finally {
        connection.release();
    }
}

async function seedDatabase() {
    const connection = await pool.getConnection();
    try {
        console.log("Validating data seeding list in MySQL database...");

        // 1. Seed Amit Sharma (Standard User)
        await connection.query(`
            INSERT IGNORE INTO users (id, name, email, mobile, role, status, password)
            VALUES ('user-1', 'Amit Sharma', 'amit@example.com', '8888888888', 'USER', 'ACTIVE', 'password123');
        `);
        await connection.query(`
            INSERT IGNORE INTO profiles (user_id, business_name, category, city, language, currency)
            VALUES ('user-1', 'Amit Retailers', 'Shopping', 'Mumbai', 'English (India)', 'INR - Indian Rupee (₹)');
        `);
        await connection.query(`
            INSERT IGNORE INTO upi_accounts (user_id, upi_id, verified, primary_flag)
            VALUES ('user-1', 'you@upi', TRUE, TRUE);
        `);

        // 2. Seed Super Admin Account
        await connection.query(`
            INSERT IGNORE INTO users (id, name, email, mobile, role, status, password)
            VALUES ('admin-1', 'Super Admin', 'admin@upnum.com', '9999999999', 'ADMIN', 'ACTIVE', 'admin');
        `);
        await connection.query(`
            INSERT IGNORE INTO upi_accounts (user_id, upi_id, verified, primary_flag)
            VALUES ('admin-1', 'platform@upi', TRUE, TRUE);
        `);

        // 3. Seed Neha Patel
        await connection.query(`
            INSERT IGNORE INTO users (id, name, email, mobile, role, status, password)
            VALUES ('user-2', 'Neha Patel', 'neha.patel@example.com', '7777777777', 'USER', 'ACTIVE', 'password123');
        `);
        await connection.query(`
            INSERT IGNORE INTO profiles (user_id, business_name, category, city, language, currency)
            VALUES ('user-2', 'Neha Boutique', 'Fashion', 'Delhi', 'English', 'INR');
        `);
        await connection.query(`
            INSERT IGNORE INTO upi_accounts (user_id, upi_id, verified, primary_flag)
            VALUES ('user-2', 'neha@upi', TRUE, TRUE);
        `);

        // 4. Seed Bright Retailers
        await connection.query(`
            INSERT IGNORE INTO users (id, name, email, mobile, role, status, password)
            VALUES ('user-3', 'Bright Retailers', 'contact@brightretailers.in', '6666666666', 'USER', 'ACTIVE', 'password123');
        `);
        await connection.query(`
            INSERT IGNORE INTO profiles (user_id, business_name, category, city, language, currency)
            VALUES ('user-3', 'Bright Retailers Store', 'Shopping', 'Bangalore', 'English', 'INR');
        `);
        await connection.query(`
            INSERT IGNORE INTO upi_accounts (user_id, upi_id, verified, primary_flag)
            VALUES ('user-3', 'bright@upi', TRUE, TRUE);
        `);

        // 5. Seed Tech Consultants
        await connection.query(`
            INSERT IGNORE INTO users (id, name, email, mobile, role, status, password)
            VALUES ('user-4', 'Tech Consultants', 'info@techconsultants.in', '5555555555', 'USER', 'ACTIVE', 'password123');
        `);
        await connection.query(`
            INSERT IGNORE INTO profiles (user_id, business_name, category, city, language, currency)
            VALUES ('user-4', 'Tech Consultants Group', 'Services', 'Pune', 'English', 'INR');
        `);
        await connection.query(`
            INSERT IGNORE INTO upi_accounts (user_id, upi_id, verified, primary_flag)
            VALUES ('user-4', 'tech@upi', TRUE, TRUE);
        `);

        // 6. Seed Rahul Verma (Trial Account)
        await connection.query(`
            INSERT IGNORE INTO users (id, name, email, mobile, role, status, password)
            VALUES ('user-5', 'Rahul Verma', 'rahul.verma@example.com', '4444444444', 'USER', 'ACTIVE', 'password123');
        `);
        await connection.query(`
            INSERT IGNORE INTO profiles (user_id, business_name, category, city, language, currency)
            VALUES ('user-5', 'Rahul Services', 'Consulting', 'Hyderabad', 'English', 'INR');
        `);
        await connection.query(`
            INSERT IGNORE INTO upi_accounts (user_id, upi_id, verified, primary_flag)
            VALUES ('user-5', 'rahul@upi', TRUE, TRUE);
        `);

        // Seed Transactions for Amit
        const txs = [
            { id: "tx-1", title: "Amazon India", category: "Shopping", amount: -2499, date: "2024-05-07 14:14:00", upi: "you@upi" },
            { id: "tx-2", title: "Salary Credited", category: "Income", amount: 50000, date: "2024-05-06 10:00:00", upi: "employer@upi" },
            { id: "tx-3", title: "Swiggy Delivery", category: "Food", amount: -420, date: "2024-05-05 20:30:00", upi: "swiggy@upi" },
            { id: "tx-4", title: "Electric Bill Payment", category: "Utilities", amount: -1250, date: "2024-05-04 11:15:00", upi: "statepower@upi" },
            { id: "tx-5", title: "Netflix Subscription", category: "Entertainment", amount: -649, date: "2024-05-03 09:00:00", upi: "netflix@upi" },
            { id: "tx-6", title: "Zomato Dineout", category: "Food", amount: -1850, date: "2024-05-02 22:45:00", upi: "zomato@upi" },
            { id: "tx-7", title: "Refund from Flipkart", category: "Shopping", amount: 899, date: "2024-05-01 16:20:00", upi: "flipkart@upi" },
            { id: "tx-8", title: "Local Grocery Shop", category: "Groceries", amount: -350, date: "2024-04-30 12:30:00", upi: "grocer@upi" },
            { id: "tx-9", title: "P2P Transfer to Amit", category: "Transfer", amount: -500, date: "2024-04-29 18:15:00", upi: "amit@upi" },
            { id: "tx-10", title: "Uber Cab Ride", category: "Travel", amount: -280, date: "2024-04-28 08:00:00", upi: "uber@upi" },
            { id: "tx-11", title: "Starbucks Coffee", category: "Food", amount: -220, date: "2024-05-08 09:30:00", upi: "starbucks@upi" },
            { id: "tx-12", title: "Electricity Bill Refund", category: "Income", amount: 1250, date: "2024-05-08 11:00:00", upi: "statepower@upi" },
            { id: "tx-13", title: "Spotify Music", category: "Entertainment", amount: -179, date: "2024-05-07 07:15:00", upi: "spotify@upi" },
            { id: "tx-14", title: "Consulting Fee Received", category: "Income", amount: 15000, date: "2024-05-06 16:30:00", upi: "client@upi" },
            { id: "tx-15", title: "Petrol Station Fuel", category: "Travel", amount: -1500, date: "2024-05-05 18:20:00", upi: "fuelcorp@upi" },
            { id: "tx-16", title: "Gym Membership Fee", category: "Utilities", amount: -2500, date: "2024-05-04 06:00:00", upi: "goldgym@upi" },
            { id: "tx-17", title: "Bookstore Purchases", category: "Shopping", amount: -850, date: "2024-05-03 15:40:00", upi: "bookstore@upi" },
            { id: "tx-18", title: "MedPlus Pharmacy", category: "Groceries", amount: -1200, date: "2024-05-02 12:10:00", upi: "medplus@upi" },
            { id: "tx-19", title: "Movie Tickets PVR", category: "Entertainment", amount: -900, date: "2024-05-01 21:00:00", upi: "pvr@upi" },
            { id: "tx-20", title: "Interest Payment Recd", category: "Income", amount: 450, date: "2024-04-30 00:00:00", upi: "bankinterest@upi" },
            { id: "tx-21", title: "Uber Ride Airport", category: "Travel", amount: -750, date: "2024-04-29 04:30:00", upi: "uber@upi" },
            { id: "tx-22", title: "BigBasket Groceries", category: "Groceries", amount: -3200, date: "2024-04-28 11:30:00", upi: "bigbasket@upi" },
            { id: "tx-23", title: "Zomato Dinner Order", category: "Food", amount: -1250, date: "2024-04-27 20:15:00", upi: "zomato@upi" },
            { id: "tx-24", title: "Airtel Fiber Recharge", category: "Utilities", amount: -799, date: "2024-04-26 14:00:00", upi: "airtel@upi" },
            { id: "tx-25", title: "Freelance Project Milestone", category: "Income", amount: 25000, date: "2024-04-25 17:00:00", upi: "client@upi" }
        ];
        for (const t of txs) {
            await connection.query(`
                INSERT IGNORE INTO transactions (id, user_id, title, category, amount, date_time, status, payer_upi)
                VALUES (?, 'user-1', ?, ?, ?, ?, 'SUCCESS', ?);
            `, [t.id, t.title, t.category, t.amount, t.date, t.upi]);
        }

        // Seed Subscription & Payments History for Amit
        await connection.query(`
            INSERT IGNORE INTO subscriptions (user_id, plan_id, trial_start, trial_end, billing_day, next_billing_date, status)
            VALUES ('user-1', 'lifetime', '2024-01-01 10:00:00', '2024-02-01 10:00:00', 1, '2024-06-01 10:00:00', 'ACTIVE');
        `);

        // Seed Subscription & Payments History for user-2, user-3, user-4, user-5
        await connection.query(`
            INSERT IGNORE INTO subscriptions (user_id, plan_id, trial_start, trial_end, billing_day, next_billing_date, status)
            VALUES ('user-2', 'lifetime', '2024-01-01 10:00:00', '2024-02-01 10:00:00', 1, '2024-06-01 10:00:00', 'ACTIVE');
        `);
        await connection.query(`
            INSERT IGNORE INTO subscriptions (user_id, plan_id, trial_start, trial_end, billing_day, next_billing_date, status)
            VALUES ('user-3', 'lifetime', '2024-01-01 10:00:00', '2024-02-01 10:00:00', 1, '2024-06-01 10:00:00', 'ACTIVE');
        `);
        await connection.query(`
            INSERT IGNORE INTO subscriptions (user_id, plan_id, trial_start, trial_end, billing_day, next_billing_date, status)
            VALUES ('user-4', 'lifetime', '2024-01-01 10:00:00', '2024-02-01 10:00:00', 1, '2024-06-01 10:00:00', 'ACTIVE');
        `);
        await connection.query(`
            INSERT IGNORE INTO subscriptions (user_id, plan_id, trial_start, trial_end, billing_day, next_billing_date, status)
            VALUES ('user-5', 'free-trial', '2024-05-29 10:00:00', '2024-06-29 10:00:00', 29, '2024-06-29 10:00:00', 'TRIAL');
        `);

        // Seed past monthly invoices/payments for Amit
        const payments = [
            { id: "pay-1", ref: "UPI837492819", date: "2024-05-01 10:23:00", inv: "INV-2024-005" },
            { id: "pay-2", ref: "UPI837492818", date: "2024-04-01 10:23:00", inv: "INV-2024-004" },
            { id: "pay-3", ref: "UPI837492817", date: "2024-03-01 10:23:00", inv: "INV-2024-003" },
            { id: "pay-4", ref: "UPI837492816", date: "2024-02-01 10:23:00", inv: "INV-2024-002" },
            { id: "pay-5", ref: "UPI837492815", date: "2024-01-01 10:23:00", inv: "INV-2024-001" },
        ];
        for (const p of payments) {
            await connection.query(`
                INSERT IGNORE INTO payments (id, user_id, amount, gateway_ref, status, created_at)
                VALUES (?, 'user-1', 10.00, ?, 'SUCCESS', ?);
            `, [p.id, p.ref, p.date]);
            await connection.query(`
                INSERT IGNORE INTO invoices (invoice_no, payment_id, amount, invoice_url, created_at)
                VALUES (?, ?, 10.00, 'http://example.com/invoice.pdf', ?);
            `, [p.inv, p.id, p.date]);
        }

        // Seed Plans
        const plans = [
            { id: 1, name: "Free Tier", type: "Basic Features", price: 0, billing: "Monthly", status: "Active", subscribers: 12543, description: "Basic Dashboard Features,100 Transactions/mo,Community Support,Standard Data Backups" },
            { id: 2, name: "Standard Plan", type: "Advanced Features", price: 50, billing: "Monthly", status: "Active", subscribers: 5234, description: "All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,Priority Support,Secure Data & Backups" },
            { id: 3, name: "Premium Plan", type: "All Features", price: 150, billing: "Monthly", status: "Active", subscribers: 1845, description: "All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,24/7 Dedicated Support,Secure Data & Backups,API Access" },
            { id: 4, name: "Lifetime Plan", type: "One-time Offer", price: 10, billing: "Monthly", status: "Active", subscribers: 980, description: "All Dashboard Features,AI Insights & Suggestions,Unlimited Transactions,Priority Support,Secure Data & Backups" }
        ];
        for (const p of plans) {
            await connection.query(`
                INSERT IGNORE INTO plans (id, name, type, price, billing, status, subscribers, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            `, [p.id, p.name, p.type, p.price, p.billing, p.status, p.subscribers, p.description]);
        }

        // Seed Offers
        const offers = [
            { id: 1, name: "WELCOME10", type: "Coupon", discount: "10% OFF", usage_count: 845, valid_from: "01 May 2024", valid_to: "31 May 2024", status: "Active" },
            { id: 2, name: "FREEMONTH", type: "Coupon", discount: "1 Month Free", usage_count: 1245, valid_from: "01 May 2024", valid_to: "30 Jun 2024", status: "Active" },
            { id: 3, name: "REFER50", type: "Coupon", discount: "₹50 Cashback", usage_count: 623, valid_from: "01 Apr 2024", valid_to: "30 Jun 2024", status: "Active" },
            { id: 4, name: "FOUNDER10", type: "Special", discount: "₹10 / month", usage_count: 978, valid_from: "01 May 2024", valid_to: "-", status: "Active" },
            { id: 5, name: "SUMMER20", type: "Coupon", discount: "20% OFF", usage_count: 290, valid_from: "01 May 2024", valid_to: "31 May 2024", status: "Inactive" }
        ];
        for (const o of offers) {
            await connection.query(`
                INSERT IGNORE INTO offers (id, name, type, discount, usage_count, valid_from, valid_to, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            `, [o.id, o.name, o.type, o.discount, o.usage_count, o.valid_from, o.valid_to, o.status]);
        }

        console.log("Mock data validated/inserted successfully.");
    } catch (err) {
        console.error("Error seeding mock data:", err);
        throw err;
    } finally {
        connection.release();
    }
}

module.exports = {
    initDatabase,
    query: (text, params) => pool.query(text, params),
};
