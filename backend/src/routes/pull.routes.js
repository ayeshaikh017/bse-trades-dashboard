const express = require("express");

const {
  startPull,
  pullStatus,
} = require("../controllers/pull.controller");

const router = express.Router();

router.post("/start", startPull);

router.get("/status", pullStatus);

module.exports = router;