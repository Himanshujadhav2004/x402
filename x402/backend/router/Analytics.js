const express = require("express");
const { extractWallet } = require("../middleware/middleware");
const { getAnalytics, getEndpointAnalytics, exportPaymentHistory } = require("../controller/Analytics");

const router = express.Router();

router.use(extractWallet);

router.get("/", getAnalytics);

router.get("/export", exportPaymentHistory);

router.get("/endpoint/:id", getEndpointAnalytics);

module.exports = router;
