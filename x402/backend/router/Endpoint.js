const express = require("express");
const { extractWallet } = require("../middleware/middleware");
const {
  createEndpoint,
  getEndpoints,
  getEndpointById,
  updateEndpoint,
  deleteEndpoint,
  toggleEndpoint,
} = require("../controller/Endpoint");

const router = express.Router();

router.use(extractWallet);

router.route("/")
  .post(createEndpoint)
  .get(getEndpoints);

router.route("/:id")
  .get(getEndpointById)
  .put(updateEndpoint)
  .delete(deleteEndpoint);

router.patch("/:id/toggle", toggleEndpoint);

module.exports = router;