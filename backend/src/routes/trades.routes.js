const express = require("express");

const {
  getTrades,
} = require("../controllers/trades.controller");

const router = express.Router();

router.get("/", getTrades);

module.exports = router;