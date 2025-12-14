const crypto = require("crypto");
const Endpoint = require("../model/Endpoint");
const Invoice = require("../model/Invoice");
const Request = require("../model/Request");
const facilitator = require("../services/facilitator");
const cache = require("../services/cache");
const { emitPaymentReceived, emitRequestEvent } = require("../services/websocket");
const {
  USDC_ADDRESS,
  NETWORK_NAME,
  X402_VERSION,
  DEFAULT_TIMEOUT_SECONDS,
  EXPLORER_URL,
  SUPPORTED_TOKENS,
  getTokenAddress,
  checksumAddress,
} = require("../utils/constants");

const CACHE_TTL = {
  "crypto-com": 10 * 1000,
  "coingecko": 30 * 1000,
  default: 60 * 1000,
};

exports.handleProxyRequest = async (req, res) => {
  const startTime = Date.now();
  const { service } = req.params;

  const routeParam = req.params.route;
  const route = Array.isArray(routeParam) ? routeParam.join("/") : (routeParam || "");

  try {
    const endpoint = await Endpoint.findOne({
      service: service.toLowerCase(),
      route: route.toLowerCase(),
      enabled: true,
    });

    if (!endpoint) {
      await logRequest(null, null, "NOT_FOUND", null, null, req, null);

      return res.status(404).json({
        success: false,
        error: "Endpoint not found or disabled",
        service,
        route,
      });
    }

    const paymentHeader = req.headers["x-payment"];
    const paymentId = req.headers["x-payment-id"];

    if (!paymentHeader) {
      return await handleUnpaidRequest(req, res, endpoint, startTime);
    }

    return await handlePaidRequest(req, res, endpoint, paymentHeader, paymentId, startTime);
  } catch (error) {
    console.error("[Proxy] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal gateway error",
      message: error.message,
    });
  }
};

async function handleUnpaidRequest(req, res, endpoint, startTime) {
  const paymentId = crypto.randomUUID();

  const expiresAt = new Date(Date.now() + DEFAULT_TIMEOUT_SECONDS * 1000);

  const tokenSymbol = endpoint.tokenSymbol || "USDC";
  const tokenInfo = SUPPORTED_TOKENS[tokenSymbol] || SUPPORTED_TOKENS.USDC;
  const assetAddress = tokenInfo.address[endpoint.chainId] || getTokenAddress(tokenSymbol, endpoint.chainId);

  const paymentRequirements = {
    scheme: "exact",
    network: NETWORK_NAME[endpoint.chainId] || "cronos-testnet",
    payTo: checksumAddress(endpoint.merchantWallet),
    asset: checksumAddress(assetAddress),
    maxAmountRequired: endpoint.priceAmount,
    maxTimeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
    description: endpoint.description || `Payment for ${endpoint.service}/${endpoint.route}`,
    mimeType: "application/json",
  };

  const acceptedTokens = (endpoint.acceptedTokens || [tokenSymbol]).map((symbol) => {
    const info = SUPPORTED_TOKENS[symbol];
    return info ? {
      symbol,
      name: info.name,
      address: info.address[endpoint.chainId],
      decimals: info.decimals,
    } : null;
  }).filter(Boolean);

  const invoice = await Invoice.create({
    endpointId: endpoint._id,
    paymentId,
    paymentRequirements,
    status: "PENDING",
    expiresAt,
  });

  await logRequest(endpoint._id, invoice._id, "402_RETURNED", Date.now() - startTime, null, req, null, endpoint);

  return res.status(402).json({
    success: false,
    error: "Payment Required",
    x402Version: X402_VERSION,
    paymentId,
    paymentRequirements,
    // Additional token info for better UX
    tokenInfo: {
      symbol: tokenSymbol,
      name: tokenInfo.name,
      decimals: tokenInfo.decimals,
      priceFormatted: `${Number(endpoint.priceAmount) / Math.pow(10, tokenInfo.decimals)} ${tokenSymbol}`,
    },
    acceptedTokens,
    expiresAt: expiresAt.toISOString(),
    endpoint: {
      service: endpoint.service,
      route: endpoint.route,
      description: endpoint.description,
    },
  });
}

async function handlePaidRequest(req, res, endpoint, paymentHeader, paymentId, startTime) {
  const invoice = await Invoice.findOne({ paymentId, status: "PENDING" });

  if (!invoice) {
    await logRequest(endpoint._id, null, "VERIFY_FAILED", Date.now() - startTime, null, req, "Invoice not found or already used", endpoint);
    return res.status(402).json({
      success: false,
      error: "Invalid or expired payment session",
      message: "Invoice not found or already used",
    });
  }

  if (new Date() > invoice.expiresAt) {
    await Invoice.findByIdAndUpdate(invoice._id, { status: "EXPIRED" });
    await logRequest(endpoint._id, invoice._id, "VERIFY_FAILED", Date.now() - startTime, null, req, "Invoice expired", endpoint);
    return res.status(402).json({
      success: false,
      error: "Payment session expired",
      message: "Please request a new invoice",
    });
  }

  const verifyPayload = {
    x402Version: X402_VERSION,
    paymentHeader,
    paymentRequirements: invoice.paymentRequirements,
  };

  const verifyResult = await facilitator.verify(verifyPayload);

  if (!verifyResult.isValid) {
    await logRequest(endpoint._id, invoice._id, "VERIFY_FAILED", Date.now() - startTime, null, req, verifyResult.invalidReason, endpoint);
    return res.status(402).json({
      success: false,
      error: "Payment verification failed",
      reason: verifyResult.invalidReason,
    });
  }

  const settlePayload = {
    x402Version: X402_VERSION,
    paymentHeader,
    paymentRequirements: invoice.paymentRequirements,
  };

  const settleResult = await facilitator.settle(settlePayload);

  if (settleResult.error) {
    await Invoice.findByIdAndUpdate(invoice._id, { status: "FAILED" });
    await logRequest(endpoint._id, invoice._id, "SETTLE_FAILED", Date.now() - startTime, null, req, settleResult.error, endpoint);
    return res.status(402).json({
      success: false,
      error: "Payment settlement failed",
      reason: settleResult.error,
    });
  }

  await Invoice.findByIdAndUpdate(invoice._id, {
    status: "SETTLED",
    txHash: settleResult.txHash,
    blockNumber: settleResult.blockNumber,
    settledAt: new Date(),
  });

  const tokenInfo = SUPPORTED_TOKENS[endpoint.tokenSymbol] || SUPPORTED_TOKENS.USDC;
  emitPaymentReceived(endpoint.merchantWallet, {
    endpointId: endpoint._id,
    service: endpoint.service,
    route: endpoint.route,
    revenue: endpoint.priceAmount,
    formattedRevenue: `${Number(endpoint.priceAmount) / Math.pow(10, tokenInfo.decimals)} ${tokenInfo.symbol}`,
    txHash: settleResult.txHash,
    paymentId,
    callerAddress: req.headers["x-caller-address"] || null,
    latencyMs: Date.now() - startTime,
  });

  const upstreamResult = await proxyToUpstream(req, endpoint);

  await logRequest(
    endpoint._id,
    invoice._id,
    upstreamResult.success ? "SUCCESS" : "UPSTREAM_ERROR",
    Date.now() - startTime,
    endpoint.priceAmount,
    req,
    upstreamResult.error,
    endpoint
  );

  res.set("X-Payment-TxHash", settleResult.txHash);
  res.set("X-Payment-BlockNumber", String(settleResult.blockNumber));
  res.set("X-Payment-Explorer", `${EXPLORER_URL[endpoint.chainId]}/tx/${settleResult.txHash}`);

  if (upstreamResult.cached) {
    res.set("X-Cache", "HIT");
  } else {
    res.set("X-Cache", "MISS");
  }

  return res.status(upstreamResult.status).json(upstreamResult.data);
}

async function proxyToUpstream(req, endpoint) {
  try {
    const upstreamUrl = new URL(endpoint.upstreamUrl);

    Object.entries(req.query).forEach(([key, value]) => {
      upstreamUrl.searchParams.set(key, value);
    });

    if (req.method === "GET") {
      const cacheKey = cache.generateKey(endpoint.service, endpoint.route, req.query);
      const cached = cache.get(cacheKey);

      if (cached) {
        return {
          success: true,
          status: 200,
          data: cached,
          error: null,
          cached: true,
        };
      }
    }

    const headers = {};
    const excludeHeaders = ["x-payment", "x-payment-id", "host", "content-length"];

    Object.entries(req.headers).forEach(([key, value]) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    if (endpoint.secretHeaders && endpoint.secretHeaders.size > 0) {
      endpoint.secretHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(upstreamUrl.toString(), fetchOptions);

    let data;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (req.method === "GET" && response.ok) {
      const cacheKey = cache.generateKey(endpoint.service, endpoint.route, req.query);
      const ttl = CACHE_TTL[endpoint.service] || CACHE_TTL.default;
      cache.set(cacheKey, data, ttl);
    }

    return {
      success: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : `Upstream returned ${response.status}`,
      cached: false,
    };
  } catch (error) {
    console.error("[Proxy] Upstream error:", error);
    return {
      success: false,
      status: 502,
      data: { error: "Upstream service unavailable", message: error.message },
      error: error.message,
    };
  }
}

async function logRequest(endpointId, invoiceId, status, latencyMs, revenue, req, errorMessage, endpoint = null) {
  try {
    await Request.create({
      endpointId,
      invoiceId,
      status,
      latencyMs,
      revenue,
      method: req.method,
      path: req.originalUrl,
      errorMessage,
    });

    if (endpoint && endpoint.merchantWallet && status !== "SUCCESS") {
      emitRequestEvent(endpoint.merchantWallet, {
        endpointId,
        service: endpoint.service,
        route: endpoint.route,
        status,
        latencyMs,
      });
    }
  } catch (error) {
    console.error("[Proxy] Failed to log request:", error);
  }
}
