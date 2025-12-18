const { FACILITATOR_URL, RPC_URL } = require("../utils/constants");
const Endpoint = require("../model/Endpoint");

const healthStatus = {
  facilitator: { status: "unknown", lastCheck: null, latency: null },
  rpc: { 338: { status: "unknown", lastCheck: null, latency: null, blockNumber: null } },
  upstreams: new Map(),
};

const CHECK_INTERVAL_MS = 30 * 1000;

async function checkFacilitator() {
  const startTime = Date.now();
  try {
    const response = await fetch(`${FACILITATOR_URL}/health`, {
      method: "GET",
      headers: { "X402-Version": "1" },
      signal: AbortSignal.timeout(5000),
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      healthStatus.facilitator = {
        status: "healthy",
        lastCheck: new Date().toISOString(),
        latency,
        url: FACILITATOR_URL,
      };
    } else {
      healthStatus.facilitator = {
        status: "unhealthy",
        lastCheck: new Date().toISOString(),
        latency,
        error: `HTTP ${response.status}`,
        url: FACILITATOR_URL,
      };
    }
  } catch (error) {
    healthStatus.facilitator = {
      status: "down",
      lastCheck: new Date().toISOString(),
      latency: Date.now() - startTime,
      error: error.message,
      url: FACILITATOR_URL,
    };
  }
}

async function checkRPC(chainId = 338) {
  const rpcUrl = RPC_URL[chainId];
  if (!rpcUrl) return;

  const startTime = Date.now();
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
      signal: AbortSignal.timeout(5000),
    });

    const latency = Date.now() - startTime;
    const data = await response.json();

    if (data.result) {
      const blockNumber = parseInt(data.result, 16);
      healthStatus.rpc[chainId] = {
        status: "healthy",
        lastCheck: new Date().toISOString(),
        latency,
        blockNumber,
        url: rpcUrl,
      };
    } else {
      healthStatus.rpc[chainId] = {
        status: "unhealthy",
        lastCheck: new Date().toISOString(),
        latency,
        error: data.error?.message || "Unknown error",
        url: rpcUrl,
      };
    }
  } catch (error) {
    healthStatus.rpc[chainId] = {
      status: "down",
      lastCheck: new Date().toISOString(),
      latency: Date.now() - startTime,
      error: error.message,
      url: rpcUrl,
    };
  }
}

async function checkUpstream(endpoint) {
  const startTime = Date.now();
  try {
    const url = new URL(endpoint.upstreamUrl);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "ATOMX-HealthCheck/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    const latency = Date.now() - startTime;
    const status = response.ok ? "healthy" : "unhealthy";

    healthStatus.upstreams.set(endpoint._id.toString(), {
      status,
      lastCheck: new Date().toISOString(),
      latency,
      httpStatus: response.status,
      service: endpoint.service,
      route: endpoint.route,
    });
  } catch (error) {
    healthStatus.upstreams.set(endpoint._id.toString(), {
      status: "down",
      lastCheck: new Date().toISOString(),
      latency: Date.now() - startTime,
      error: error.message,
      service: endpoint.service,
      route: endpoint.route,
    });
  }
}

async function runHealthChecks() {
  console.log("[Health] Running health checks...");

  await Promise.all([
    checkFacilitator(),
    checkRPC(338),
  ]);

  try {
    const endpoints = await Endpoint.find({ enabled: true }).limit(10);
    await Promise.all(endpoints.map((ep) => checkUpstream(ep)));
  } catch (error) {
    console.error("[Health] Failed to check upstreams:", error);
  }

  console.log("[Health] Health checks completed");
}

function getHealthStatus() {
  const facilitatorOk = healthStatus.facilitator.status === "healthy";
  const rpcOk = Object.values(healthStatus.rpc).every((r) => r.status === "healthy");

  const upstreamStatuses = Array.from(healthStatus.upstreams.values());
  const upstreamHealthy = upstreamStatuses.filter((u) => u.status === "healthy").length;
  const upstreamTotal = upstreamStatuses.length;
  const upstreamOk = upstreamTotal === 0 || upstreamHealthy === upstreamTotal;

  let overallStatus = "healthy";
  if (!facilitatorOk || !rpcOk) {
    overallStatus = "degraded";
  }
  if (healthStatus.facilitator.status === "down" || Object.values(healthStatus.rpc).some((r) => r.status === "down")) {
    overallStatus = "down";
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      facilitator: healthStatus.facilitator,
      rpc: healthStatus.rpc,
    },
    upstreams: {
      total: upstreamTotal,
      healthy: upstreamHealthy,
      unhealthy: upstreamTotal - upstreamHealthy,
      details: Object.fromEntries(healthStatus.upstreams),
    },
    summary: {
      facilitator: facilitatorOk ? "OK" : "FAIL",
      rpc: rpcOk ? "OK" : "FAIL",
      upstreams: `${upstreamHealthy}/${upstreamTotal} healthy`,
    },
  };
}

function getEndpointHealth(endpointId) {
  return healthStatus.upstreams.get(endpointId) || { status: "unknown" };
}

function startHealthMonitoring() {
  runHealthChecks();

  setInterval(runHealthChecks, CHECK_INTERVAL_MS);

  console.log(`[Health] Monitoring started (interval: ${CHECK_INTERVAL_MS / 1000}s)`);
}

module.exports = {
  startHealthMonitoring,
  runHealthChecks,
  getHealthStatus,
  getEndpointHealth,
};
