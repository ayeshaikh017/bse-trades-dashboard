const Trade = require("../models/Trade");
const { fetchTradesFromBSE } = require("../mock-bse/bse.routes");

let pullStatus = {
  status: "idle",
  startedAt: null,
  completedAt: null,
  tradeCount: 0,
  error: null,
};

const startTradePull = async (io) => {
  if (pullStatus.status === "running") {
    return {
      started: false,
      message: "A trade pull is already in progress",
    };
  }

  pullStatus = {
    status: "running",
    startedAt: new Date(),
    completedAt: null,
    tradeCount: 0,
    error: null,
  };

  // Run the long-running operation in the background.
  setImmediate(async () => {
    try {
      console.log("Starting background trade pull...");

      const trades = await fetchTradesFromBSE();

      console.log(`Received ${trades.length} trades from Mock BSE API`);

      if (trades.length > 0) {
        await Trade.bulkWrite(
          trades.map((trade) => ({
            updateOne: {
              filter: { tradeId: trade.tradeId },
              update: { $set: trade },
              upsert: true,
            },
          }))
        );
      }

      pullStatus = {
        status: "completed",
        startedAt: pullStatus.startedAt,
        completedAt: new Date(),
        tradeCount: trades.length,
        error: null,
      };

      console.log("Trade pull completed successfully");

      io.emit("pullCompleted", {
        success: true,
        message: "New trades have been pulled successfully",
        tradeCount: trades.length,
      });
    } catch (error) {
      console.error("Trade pull failed:", error.message);

      pullStatus = {
        ...pullStatus,
        status: "failed",
        completedAt: new Date(),
        error: error.message,
      };

      io.emit("pullFailed", {
        success: false,
        message: "Trade pull failed",
      });
    }
  });

  return {
    started: true,
    message: "Trade pull started in background",
  };
};

const getPullStatus = () => {
  return pullStatus;
};

module.exports = {
  startTradePull,
  getPullStatus,
};