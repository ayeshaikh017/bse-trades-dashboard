const {
  startTradePull,
  getPullStatus,
} = require("../services/pull.service");

const startPull = async (req, res) => {
  try {
    const io = req.app.get("io");

    const result = await startTradePull(io);

    if (!result.started) {
      return res.status(409).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(202).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Start pull error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start trade pull",
    });
  }
};

const pullStatus = (req, res) => {
  return res.status(200).json({
    success: true,
    data: getPullStatus(),
  });
};

module.exports = {
  startPull,
  pullStatus,
};