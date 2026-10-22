/**
 * PDF & Document Bank Statement Parsing Engine
 * Supports HDFC, SBI, ICICI, Axis, Kotak, and generic Indian bank statements.
 * Also parses CSV and Excel files into the unified review format.
 */

const { PDFParse } = require("pdf-parse");
const xlsx = require("xlsx");

// Known Indian Bank Signatures
const BANK_SIGNATURES = [
    { name: "HDFC Bank", match: /HDFC\s*BANK|HDFCBANK|HDFC000/i },
    { name: "State Bank of India (SBI)", match: /STATE\s*BANK\s*OF\s*INDIA|SBIN000|\bSBI\b/i },
    { name: "ICICI Bank", match: /ICICI\s*BANK|ICIC000/i },
    { name: "Axis Bank", match: /AXIS\s*BANK|UTIB000/i },
    { name: "Kotak Mahindra Bank", match: /KOTAK\s*MAHINDRA|KKBK000|\bKOTAK\b/i },
    { name: "Bank of Baroda", match: /BANK\s*OF\s*BARODA|BARB0/i },
    { name: "Punjab National Bank (PNB)", match: /PUNJAB\s*NATIONAL\s*BANK|PUNB0/i },
    { name: "Canara Bank", match: /CANARA\s*BANK|CNRB0/i },
    { name: "IndusInd Bank", match: /INDUSIND\s*BANK|INDB0/i },
    { name: "Yes Bank", match: /YES\s*BANK|YESB0/i },
    { name: "Federal Bank", match: /FEDERAL\s*BANK|FDRL0/i },
    { name: "IDFC FIRST Bank", match: /IDFC\s*FIRST|IDFB0/i },
];

// Categorization Keywords Dictionary
const CATEGORY_RULES = [
    { category: "Food & Dining", keywords: ["swiggy", "zomato", "mcdonald", "starbucks", "domino", "kfc", "burger", "pizza", "restaurant", "cafe", "dining", "bakery", "sweet", "eats", "bar", "tea", "coffee", "dhaba"] },
    { category: "Groceries", keywords: ["blinkit", "zepto", "instamart", "bigbasket", "dmart", "spencer", "supermarket", "grocery", "kirana", "smart bazaar", "milk", "nature basket", "hypermarket", "fresh"] },
    { category: "Shopping", keywords: ["amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "zara", "h&m", "retail", "croma", "reliance digital", "tata cliq", "clothing", "apparel", "footwear", "mall", "decathlon"] },
    { category: "Travel & Fuel", keywords: ["uber", "ola", "rapido", "irctc", "makemytrip", "goibibo", "cleartrip", "indigo", "air india", "petrol", "fuel", "hpcl", "bpcl", "iocl", "shell", "fastag", "toll", "metro", "railway", "flight", "auto"] },
    { category: "Entertainment", keywords: ["netflix", "spotify", "prime video", "hotstar", "disney", "bookmyshow", "pvr", "inox", "cinema", "movie", "youtube", "steam", "gaming", "playstation", "apple music", "audible"] },
    { category: "Utilities & Bills", keywords: ["electricity", "bescom", "tneb", "mseb", "water", "gas", "airtel", "jio", "vodafone", "vi ", "broadband", "act fibernet", "recharge", "billdesk", "dth", "tatasky", "postpaid", "prepaid"] },
    { category: "Healthcare", keywords: ["apollo", "pharmacy", "practo", "hospital", "clinic", "medplus", "1mg", "pharmeasy", "doctor", "diagnostic", "pathology", "dental", "medical", "health"] },
    { category: "Salary & Income", keywords: ["salary", "payroll", "stipend", "wages", "dividend", "interest cr", "interest credited", "bonus", "cashback", "refund", "reimbursement", "incentive"] },
    { category: "Investments", keywords: ["zerodha", "groww", "upstox", "angel one", "mutual fund", "sip ", "nippon", "icici pru", "hdfc mf", "uti mf", "sbi mf", "coin", "shares", "securities", "broker"] },
    { category: "Transfers", keywords: ["upi", "imps", "neft", "rtgs", "fund transfer", "p2p", "sent to", "received from", "self transfer", "tfr"] },
];

/**
 * Detect category based on narration keywords
 */
function detectCategory(narration = "", type = "expense") {
    const text = String(narration).toLowerCase();

    if (type === "income" && (text.includes("salary") || text.includes("payroll") || text.includes("stipend"))) {
        return "Salary & Income";
    }

    for (const rule of CATEGORY_RULES) {
        for (const kw of rule.keywords) {
            if (text.includes(kw)) {
                return rule.category;
            }
        }
    }

    return type === "income" ? "Salary & Income" : "General";
}

/**
 * Clean transaction narration into a concise display title
 */
function cleanTransactionTitle(narration = "") {
    let clean = String(narration).trim();

    // Remove leading date residues if any
    clean = clean.replace(/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\s*/, "");
    clean = clean.replace(/^\d{1,2}[\s\-][A-Za-z]{3}[\s\-]\d{2,4}\s*/, "");

    // 1. UPI Extraction:
    // e.g. TO TRANSFER-UPI/DR/4123456789/ZOMATO/SBIN/Food or UPI/412345678901/SWIGGY/HDFC/... or UPI-SWIGGY-swiggy@icici-12345
    const upiMatch = clean.match(/UPI(?:-|\/)(?:DR|CR)?(?:-|\/)?(?:[0-9]+\/)?([A-Za-z0-9\s._]+?)(?:-|\/|$)/i);
    if (upiMatch && upiMatch[1] && upiMatch[1].trim().length >= 2) {
        const candidate = upiMatch[1].trim();
        if (!/^\d+$/.test(candidate) && candidate.toLowerCase() !== "dr" && candidate.toLowerCase() !== "cr") {
            return formatTitle(candidate);
        }
    }

    // 2. POS or Card purchase: e.g. POS 412345XXXXXX1234 RELIANCE SMART
    const posMatch = clean.match(/POS\s+(?:[0-9X*]+\s+)?([A-Za-z0-9\s._]+?)(?:\s+ON|\s+DT|\s+\d|$)/i);
    if (posMatch && posMatch[1]) {
        return formatTitle(posMatch[1]);
    }

    // 3. ACH / ECS
    const achMatch = clean.match(/ACH\s+(?:DR|CR)?[- ]*([A-Za-z0-9\s._]+)/i);
    if (achMatch && achMatch[1]) {
        return formatTitle(achMatch[1]);
    }

    // 4. NEFT / IMPS / RTGS
    const transferMatch = clean.match(/(?:NEFT|IMPS|RTGS)[\s\-_]+(?:CR|DR)?[\s\-_]+[A-Z0-9]+[\s\-_]+([A-Za-z0-9\s._]+)/i);
    if (transferMatch && transferMatch[1]) {
        return formatTitle(transferMatch[1].split("-")[0]);
    }

    // 5. ATM Withdrawal
    if (/ATM\s+(?:WDL|CASH)/i.test(clean)) {
        return "ATM Cash Withdrawal";
    }

    // 6. Interest
    if (/INTEREST\s*(?:PAID|CR|CREDITED)?/i.test(clean)) {
        return "Bank Interest Received";
    }

    // 7. Bank Charges
    if (/CHG|CHARGE|SMS\s+CHG|ANNUAL\s+FEE/i.test(clean)) {
        return "Bank Service Charges";
    }

    // Fallback: strip transfer prefixes and special garbage
    clean = clean.replace(/^(?:TO|BY)\s+(?:TRANSFER|TFR)?[ -]*/i, "");
    clean = clean.replace(/^[0-9\/\-]+\s+/, "");
    clean = clean.replace(/[\/\\*#_]/g, " ").replace(/\s+/g, " ").trim();
    if (clean.length > 40) clean = clean.slice(0, 40) + "...";

    return formatTitle(clean || "Bank Transaction");
}

function formatTitle(str) {
    if (!str) return "Transaction";
    // Title Case
    return str
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
}

/**
 * Parse date strings from various bank formats into standard YYYY-MM-DD
 */
const MONTH_MAP = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function safeIsoDateTime(dateStr) {
    if (!dateStr) return new Date().toISOString();
    try {
        const d1 = new Date(dateStr + "T12:00:00.000Z");
        if (!isNaN(d1.getTime())) return d1.toISOString();
        const d2 = new Date(dateStr);
        if (!isNaN(d2.getTime())) return d2.toISOString();
    } catch (_) {}
    return new Date().toISOString();
}

function parseBankDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split("T")[0];
    const raw = String(dateStr).trim();

    let candidate = "";

    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    let m = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (m) {
        let [, day, month, year] = m;
        if (year.length === 2) year = (parseInt(year, 10) > 70 ? "19" : "20") + year;
        candidate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // DD Mon YYYY or DD-Mon-YYYY (e.g. 15 Jan 2024, 01-MAY-24)
    if (!candidate) {
        m = raw.match(/^(\d{1,2})[\s\-\.]([A-Za-z]{3,9})[\s\-\.](\d{2,4})$/);
        if (m) {
            let [, day, monStr, year] = m;
            const month = MONTH_MAP[monStr.slice(0, 3).toLowerCase()] || "01";
            if (year.length === 2) year = (parseInt(year, 10) > 70 ? "19" : "20") + year;
            candidate = `${year}-${month}-${day.padStart(2, "0")}`;
        }
    }

    // YYYY-MM-DD
    if (!candidate) {
        m = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
        if (m) {
            let [, year, month, day] = m;
            candidate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
    }

    if (candidate) {
        const testD = new Date(candidate + "T12:00:00.000Z");
        if (!isNaN(testD.getTime())) {
            return candidate;
        }
    }

    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
    }

    return new Date().toISOString().split("T")[0];
}

/**
 * Clean Indian currency number strings (e.g. "1,25,000.50" -> 125000.5)
 */
function parseIndianAmount(amountStr) {
    if (typeof amountStr === "number") return Math.abs(amountStr);
    if (!amountStr) return 0;
    const cleaned = String(amountStr).replace(/[^\d.-]/g, "");
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : Math.abs(val);
}

/**
 * Extract transactions from raw PDF text
 */
function extractTransactionsFromText(fullText = "") {
    const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const transactions = [];

    // Detect Bank
    let detectedBank = "Generic Bank Statement";
    for (const b of BANK_SIGNATURES) {
        if (b.match.test(fullText)) {
            detectedBank = b.name;
            break;
        }
    }

    // Regex for date patterns at start or within row
    // 1. DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
    // 2. DD Mon YYYY or DD-Mon-YYYY
    const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\s\-][A-Za-z]{3}[\s\-]\d{2,4})\b/;
    
    // Currency amount regex: numbers with optional commas and mandatory or optional decimals
    const amountRegex = /\b\d{1,3}(?:,\d{2,3})*(?:\.\d{2})\b/g;

    let currentTx = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip obvious header/footer metadata lines
        if (/^(page\s+\d+|account\s+number|statement\s+period|ifsc|branch|opening\s+balance|closing\s+balance|total\s+withdrawal|total\s+deposit|generated\s+on)/i.test(line)) {
            continue;
        }

        const dateMatch = line.match(dateRegex);

        if (dateMatch) {
            // New transaction line found!
            // First, if previous transaction was being accumulated, push it
            if (currentTx && currentTx.amount > 0) {
                transactions.push(finalizeTx(currentTx));
                currentTx = null;
            }

            const rawDate = dateMatch[1];
            const date = parseBankDate(rawDate);

            // Find all amounts on this line
            const amountsFound = line.match(amountRegex) || [];

            // Determine debit/credit type and amount
            let amount = 0;
            let type = "expense"; // default
            let balance = null;

            // Check Dr/Cr indicators on the line
            const hasCrIndicator = /\b(CR|\(CR\)|CREDIT|\+)\b/i.test(line);
            const hasDrIndicator = /\b(DR|\(DR\)|DEBIT|\-)\b/i.test(line);

            if (amountsFound.length >= 3) {
                // Typical: [Debit, Credit, Balance] or [Amount, ..., Balance]
                const amt1 = parseIndianAmount(amountsFound[0]);
                const amt2 = parseIndianAmount(amountsFound[1]);
                balance = parseIndianAmount(amountsFound[amountsFound.length - 1]);

                if (amt1 > 0 && amt2 === 0) {
                    amount = amt1;
                    type = "expense";
                } else if (amt2 > 0 && amt1 === 0) {
                    amount = amt2;
                    type = "income";
                } else {
                    // Check indicator
                    if (hasCrIndicator) {
                        amount = amt2 > 0 ? amt2 : amt1;
                        type = "income";
                    } else {
                        amount = amt1 > 0 ? amt1 : amt2;
                        type = "expense";
                    }
                }
            } else if (amountsFound.length === 2) {
                // [Amount, Balance]
                amount = parseIndianAmount(amountsFound[0]);
                balance = parseIndianAmount(amountsFound[1]);

                if (hasCrIndicator) type = "income";
                else if (hasDrIndicator) type = "expense";
                else {
                    // Look at line keywords
                    if (/(?:BY\s+TRANSFER|SALARY|INTEREST|REFUND|CREDITED|DEPOSIT)/i.test(line)) {
                        type = "income";
                    } else {
                        type = "expense";
                    }
                }
            } else if (amountsFound.length === 1) {
                amount = parseIndianAmount(amountsFound[0]);
                if (hasCrIndicator) type = "income";
                else if (/(?:SALARY|REFUND|CREDIT|INTEREST)/i.test(line)) type = "income";
                else type = "expense";
            }

            // Extract description / narration from the line by stripping date and amounts
            let narration = line.replace(rawDate, "");
            for (const a of amountsFound) {
                narration = narration.replace(a, "");
            }
            narration = narration.replace(/\b(?:CR|DR|Cr|Dr)\b/g, "").replace(/\s+/g, " ").trim();

            currentTx = {
                rawDate,
                date,
                narration,
                amount,
                type,
                balance,
            };
        } else if (currentTx) {
            // Continuation of narration on subsequent line
            // Only accumulate if this line doesn't look like a total or header
            if (!/total|summary|balance/i.test(line) && line.length > 2 && line.length < 150) {
                // If this line has an amount and currentTx didn't find one yet:
                const amountsOnLine = line.match(amountRegex) || [];
                if (currentTx.amount === 0 && amountsOnLine.length > 0) {
                    currentTx.amount = parseIndianAmount(amountsOnLine[0]);
                    if (/\b(CR|\(CR\)|CREDIT)\b/i.test(line)) currentTx.type = "income";
                } else {
                    currentTx.narration += " " + line;
                }
            }
        }
    }

    if (currentTx && currentTx.amount > 0) {
        transactions.push(finalizeTx(currentTx));
    }

    // Secondary Balance-Delta Pass:
    // If consecutive balances are recorded, verify Dr/Cr mathematically!
    for (let i = 0; i < transactions.length - 1; i++) {
        const cur = transactions[i];
        const next = transactions[i + 1];
        if (cur.balance !== null && next.balance !== null) {
            // If statement is ordered newest to oldest:
            // cur.balance - next.balance > 0 means credit on cur!
            const delta = cur.balance - next.balance;
            if (Math.abs(Math.abs(delta) - cur.amount) < 2) {
                cur.type = delta > 0 ? "income" : "expense";
            }
        }
    }

    return {
        bankDetected: detectedBank,
        totalFound: transactions.length,
        transactions,
    };
}

function finalizeTx(tx) {
    const title = cleanTransactionTitle(tx.narration);
    const category = detectCategory(tx.narration, tx.type);
    const date_time = safeIsoDateTime(tx.date);

    return {
        id: `imp-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        title,
        description: String(tx.narration || "").slice(0, 150),
        category,
        amount: Math.round(tx.amount * 100) / 100,
        type: tx.type,
        date: tx.date || date_time.split("T")[0],
        date_time,
        selected: true, // Selected for review by default
        status: "SUCCESS",
    };
}

/**
 * Parse Excel / CSV buffer into the unified review format
 */
function parseExcelOrCsvBuffer(fileBuffer) {
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rows || rows.length === 0) {
        return { bankDetected: "Spreadsheet", totalFound: 0, transactions: [] };
    }

    const transactions = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rawTitle = row.Title || row.title || row.Description || row.description || row.Particulars || row.Narration || `Tx #${i + 1}`;
        const rawCat = row.Category || row.category;
        
        let amountRaw = row.Amount ?? row.amount ?? row.Value ?? row.value ?? 0;
        let debitRaw = row.Debit ?? row.debit ?? row.Withdrawal ?? row.withdrawal;
        let creditRaw = row.Credit ?? row.credit ?? row.Deposit ?? row.deposit;

        let amount = 0;
        let type = "expense";

        if (creditRaw && parseIndianAmount(creditRaw) > 0) {
            amount = parseIndianAmount(creditRaw);
            type = "income";
        } else if (debitRaw && parseIndianAmount(debitRaw) > 0) {
            amount = parseIndianAmount(debitRaw);
            type = "expense";
        } else {
            const parsed = parseFloat(String(amountRaw).replace(/[^\d.-]/g, "")) || 0;
            amount = Math.abs(parsed);
            const typeStr = String(row.Type || row.type || "").toLowerCase();
            if (typeStr.includes("income") || typeStr.includes("credit") || parsed > 0) {
                type = "income";
            } else {
                type = "expense";
            }
        }

        const rawDate = row.Date || row.date || row.Date_Time || row.date_time || row["Txn Date"];
        const date = parseBankDate(rawDate);
        const title = cleanTransactionTitle(rawTitle);
        const category = rawCat || detectCategory(rawTitle, type);

        transactions.push({
            id: `imp-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
            title,
            description: String(rawTitle).slice(0, 150),
            category,
            amount: Math.round(amount * 100) / 100,
            type,
            date,
            date_time: safeIsoDateTime(date),
            selected: true,
            status: "SUCCESS",
        });
    }

    return {
        bankDetected: "CSV / Excel Statement",
        totalFound: transactions.length,
        transactions,
    };
}

/**
 * Main parse entry point: handles PDF, CSV, Excel buffers
 */
async function parseStatementFile(fileBuffer, originalFilename = "", password = "") {
    const lowerName = originalFilename.toLowerCase();
    const isPdf = lowerName.endsWith(".pdf") || (fileBuffer && fileBuffer.slice(0, 4).toString() === "%PDF");

    if (isPdf) {
        let parser = null;
        try {
            const options = { data: fileBuffer };
            if (password) options.password = password;

            parser = new PDFParse(options);
            const textResult = await parser.getText();
            const fullText = textResult?.text || "";

            if (!fullText.trim()) {
                throw new Error("Unable to extract text from PDF. The document may be a scanned image.");
            }

            const parsed = extractTransactionsFromText(fullText);
            return {
                success: true,
                ...parsed,
            };
        } catch (err) {
            const errStr = String(err.message || err);
            if (/password/i.test(errStr) || err.name === "PasswordException") {
                return {
                    success: false,
                    isPasswordProtected: true,
                    error: "This PDF is password-protected. Please provide the password to unlock.",
                };
            }
            throw err;
        } finally {
            if (parser && typeof parser.destroy === "function") {
                try { await parser.destroy(); } catch (_) {}
            }
        }
    } else {
        // Excel or CSV
        const parsed = parseExcelOrCsvBuffer(fileBuffer);
        return {
            success: true,
            ...parsed,
        };
    }
}

module.exports = {
    parseStatementFile,
    cleanTransactionTitle,
    detectCategory,
    parseBankDate,
    extractTransactionsFromText,
};
