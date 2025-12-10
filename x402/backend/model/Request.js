const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    endpointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Endpoint",
      required: true,
      index: true,
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "402_RETURNED",
        "SUCCESS",
        "VERIFY_FAILED",
        "SETTLE_FAILED",
        "UPSTREAM_ERROR",
        "ENDPOINT_DISABLED",
        "NOT_FOUND"
      ],
      required: true,
      index: true,
    },

    latencyMs: {
      type: Number,
      default: null,
    },

    revenue: {
      type: String,
      default: null,
    },

    callerAddress: {
      type: String,
      default: null,
      lowercase: true,
    },

    method: {
      type: String,
      default: "GET",
    },
    path: {
      type: String,
      default: null,
    },

    errorMessage: {
      type: String,
      default: null,
    },

    upstreamStatus: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

RequestSchema.index({ endpointId: 1, createdAt: -1 });
RequestSchema.index({ endpointId: 1, status: 1 });
RequestSchema.index({ endpointId: 1, status: 1, createdAt: -1 });

RequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Request", RequestSchema);
