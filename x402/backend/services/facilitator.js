const { FACILITATOR_URL, X402_VERSION } = require("../utils/constants");

async function verify(payload) {
  try {
    const response = await fetch(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X402-Version": String(X402_VERSION),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Facilitator] Verify request failed:", response.status, errorText);
      return {
        isValid: false,
        invalidReason: `Facilitator error: ${response.status}`,
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Facilitator] Verify error:", error.message);
    return {
      isValid: false,
      invalidReason: `Verification error: ${error.message}`,
    };
  }
}

async function settle(payload) {
  try {
    const response = await fetch(`${FACILITATOR_URL}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X402-Version": String(X402_VERSION),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Facilitator] Settle request failed:", response.status, errorText);
      return {
        error: `Settlement failed: ${response.status}`,
      };
    }

    const result = await response.json();

    console.log("[Facilitator] Payment settled:", {
      txHash: result.txHash,
      blockNumber: result.blockNumber,
    });

    return result;
  } catch (error) {
    console.error("[Facilitator] Settle error:", error.message);
    return {
      error: `Settlement error: ${error.message}`,
    };
  }
}

async function healthcheck() {
  try {
    const response = await fetch(`${FACILITATOR_URL.replace('/v2/x402', '')}/healthcheck`);
    return response.ok;
  } catch (error) {
    console.error("[Facilitator] Health check failed:", error.message);
    return false;
  }
}

async function getSupportedPaymentKinds() {
  try {
    const response = await fetch(`${FACILITATOR_URL}/supported`, {
      headers: {
        "X402-Version": String(X402_VERSION),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("[Facilitator] Get supported failed:", error.message);
    return null;
  }
}

module.exports = {
  verify,
  settle,
  healthcheck,
  getSupportedPaymentKinds,
};
