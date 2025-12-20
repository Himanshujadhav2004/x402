const express = require("express");
const {
  discoverEndpoints,
  listServices,
  getService,
  listTokens,
} = require("../controller/Discovery");

const router = express.Router();

router.get("/", discoverEndpoints);

router.get("/services", listServices);

router.get("/tokens", listTokens);

router.get("/:service", getService);

module.exports = router;
