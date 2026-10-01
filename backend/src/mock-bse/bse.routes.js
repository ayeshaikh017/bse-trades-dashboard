const express = require("express");

const router = express.Router();

const symbols = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK",
  "SBIN",
  "ITC",
  "LT",
];

const clients = [
  "Client001",
  "Client002",
  "Client003",
  "Client004",
  "Client005",
  "Client006",
  "Client007",
  "Client008",
];

function generateTrades(count = 3000) {
  const trades = [];

  for (let i = 1; i <= count; i++) {
    trades.push({
      tradeId: `BSE-${Date.now()}-${i}`,
      client: clients[i % clients.length],
      symbol: symbols[i % symbols.length],
      quantity: Math.floor(Math.random() * 500) + 1,
      price: Number((100 + Math.random() * 4000).toFixed(2)),
      timestamp: new Date(
        Date.now() - Math.floor(Math.random() * 86400000)
      ).toISOString(),
    });
  }

  return trades;
};

const fetchTradesFromBSE = async () => {
  const delay = Number(process.env.BSE_DELAY_MS) || 900000;

  console.log(`Mock BSE pull started. Delay: ${delay}ms`);

  await new Promise((resolve) => setTimeout(resolve, delay));

  const trades = generateTrades(3000);

  console.log(
    `Mock BSE pull completed. ${trades.length} trades generated.`
  );

  return trades;
};

router.get("/getTrades", async (req, res) => {
  try {
    const trades = await fetchTradesFromBSE();

    res.json({
      success: true,
      data: trades,
    });
  } catch (error) {
    console.error("Mock BSE API error:", error);

    res.status(500).json({
      success: false,
      message: "Mock BSE API failed",
    });
  }
});

module.exports = router;

module.exports.fetchTradesFromBSE = fetchTradesFromBSE;