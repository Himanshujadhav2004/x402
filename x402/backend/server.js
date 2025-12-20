const express = require("express");
const cors = require("cors");
const http = require("http");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

require("./model/db");

const endpointRoutes = require("./router/Endpoint");
const proxyRoutes = require("./router/Proxy");
const analyticsRoutes = require("./router/Analytics");
const marketDataRoutes = require("./router/MarketData");
const discoveryRoutes = require("./router/Discovery");
const healthRoutes = require("./router/Health");

const { initWebSocket, getStats: getWsStats } = require("./services/websocket");
const { startHealthMonitoring } = require("./services/health");

const app = express();
const server = http.createServer(app);

initWebSocket(server);

app.use(express.json());
app.use(cors());

const cache = require("./services/cache");

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "x402-gateway" });
});

app.get("/api/cache/stats", (req, res) => {
  res.json({ success: true, data: cache.getStats() });
});

app.get("/api/ws/stats", (req, res) => {
  res.json({ success: true, data: getWsStats() });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "ATOMX API Documentation",
}));

app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api/endpoints", endpointRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use("/api/discover", discoveryRoutes);

app.use("/api/health", healthRoutes);

app.use("/internal/market", marketDataRoutes);

app.use("/proxy", proxyRoutes);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`x402 Gateway running on port ${PORT}`);
  console.log(`- Dashboard API: http://localhost:${PORT}/api/endpoints`);
  console.log(`- Proxy Gateway: http://localhost:${PORT}/proxy/:service/:route`);
  console.log(`- API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`- Health Status: http://localhost:${PORT}/api/health`);
  console.log(`- WebSocket: ws://localhost:${PORT}/ws`);

  startHealthMonitoring();
});
