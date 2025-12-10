const mongoose = require("mongoose");

const EndpointSchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    service: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    route: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    upstreamUrl: {
      type: String,
      required: true,
    },

    priceAmount: {
      type: String,
      required: true,
    },

    tokenSymbol: {
      type: String,
      default: "USDC",
      uppercase: true,
      enum: ["USDC", "CRO", "WCRO"],
    },

    tokenAddress: {
      type: String,
      required: true,
      lowercase: true,
    },

    acceptedTokens: {
      type: [String],
      default: ["USDC"],
      enum: ["USDC", "CRO", "WCRO"],
    },

    merchantWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    secretHeaders: {
      type: Map,
      of: String,
      default: {},
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    description: {
      type: String,
      default: "",
    },

    chainId: {
      type: Number,
      default: 338,
    },
  },
  { timestamps: true }
);

EndpointSchema.index(
  { merchantId: 1, service: 1, route: 1 },
  { unique: true }
);

module.exports = mongoose.model("Endpoint", EndpointSchema);
