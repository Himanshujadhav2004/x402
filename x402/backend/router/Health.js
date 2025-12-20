const express = require("express");
const { getHealthStatus, runHealthChecks } = require("../services/health");

const router = express.Router();

router.get("/", (req, res) => {
  const status = getHealthStatus();
  res.json({
    success: true,
    data: status,
  });
});

router.post("/refresh", async (req, res) => {
  await runHealthChecks();
  const status = getHealthStatus();
  res.json({
    success: true,
    message: "Health check completed",
    data: status,
  });
});

router.get("/simple", (req, res) => {
  const status = getHealthStatus();
  if (status.status === "healthy" || status.status === "degraded") {
    res.status(200).json({ status: "ok" });
  } else {
    res.status(503).json({ status: "down" });
  }
});

module.exports = router;
