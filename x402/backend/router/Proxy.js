const express = require("express");
const { handleProxyRequest } = require("../controller/Proxy");
const { proxyRateLimiter, invoiceRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.use(proxyRateLimiter);
router.use(invoiceRateLimiter);

router.all("/:service{/*route}", handleProxyRequest);

router.all("/:service", (req, res, next) => {
  req.params.route = "";
  handleProxyRequest(req, res, next);
});

module.exports = router;
