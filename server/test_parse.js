const { parseAndStoreFITransactions } = require('./services/setu.service');

const mockFiData = {
  Payload: [
    {
      fipId: "FIP-1",
      data: [
        {
          Account: {
            Transactions: {
              Transaction: [
                {
                  txnId: "T1",
                  amount: "100.00",
                  narration: "UPI/123/John Doe/johndoe@okicici",
                  type: "DEBIT",
                  transactionTimestamp: "2023-01-01T10:00:00.000Z",
                  mode: "UPI"
                }
              ]
            }
          }
        }
      ]
    }
  ]
};

async function run() {
  // Mock db.query
  const db = require('./db');
  const origQuery = db.query;
  db.query = async (sql, params) => {
    if (sql.includes("SELECT user_id FROM consents")) {
      return [[{ user_id: "user-123" }]];
    }
    console.log("DB Query:", sql);
    console.log("Params:", params);
    return [];
  };

  // Modified logic to test
  const payload = mockFiData.Payload || [];
  for (const item of payload) {
    const dataArray = Array.isArray(item.data) ? item.data : [item.data];
    for (const dataItem of dataArray) {
      const account = dataItem.Account || dataItem.account;
      if (!account || !account.Transactions || !account.Transactions.Transaction) {
        continue;
      }

      const transactions = Array.isArray(account.Transactions.Transaction)
        ? account.Transactions.Transaction
        : [account.Transactions.Transaction];

      for (const tx of transactions) {
        const narration = tx.narration || "";
        const isUpi = narration.toLowerCase().includes("upi") || tx.mode === "UPI";
        if (isUpi) {
          console.log("FOUND UPI TX:", tx.txnId, tx.amount);
        }
      }
    }
  }

  console.log("Done");
}
run();
