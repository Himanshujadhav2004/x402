const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    endpointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Endpoint",
      required: true,
      index: true,
    },

    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    paymentRequirements: {
      scheme: {
        type: String,
        default: "exact",
      },
      network: {
        type: String,
        required: true,
        enum: ["cronos-testnet", "cronos-mainnet", "cronos"],
      },
      payTo: {
        type: String,
        required: true,
      },
      asset: {
        type: String,
        required: true,
      },
      maxAmountRequired: {
        type: String,
        required: true,
      },
      maxTimeoutSeconds: {
        type: Number,
        default: 300,
      },
      description: {
        type: String,
        required: true,
      },
      mimeType: {
        type: String,
        default: "application/json",
      },
    },

    status: {
      type: String,
      enum: ["PENDING", "SETTLED", "EXPIRED", "FAILED"],
      default: "PENDING",
      index: true,
    },

    txHash: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    blockNumber: {
      type: Number,
      default: null,
    },
    settledAt: {
      type: Date,
      default: null,
    },

    payerAddress: {
      type: String,
      default: null,
      lowercase: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

InvoiceSchema.index({ status: 1, expiresAt: 1 });

InvoiceSchema.index({ endpointId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Invoice", InvoiceSchema);
