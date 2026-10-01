const Trade = require("../models/Trade");

const getTrades = async (req, res) => {
  try {
    const trades = await Trade.find()
      .sort({ timestamp: -1 });

    return res.status(200).json({
      success: true,
      message: "Trades fetched successfully",
      data: trades,
    });
  } catch (error) {
    console.error("Get trades error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trades",
    });
  }
};

module.exports = {
  getTrades,
};