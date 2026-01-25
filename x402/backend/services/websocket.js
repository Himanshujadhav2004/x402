const { Server } = require("socket.io");

let io = null;

const walletSockets = new Map();

function initWebSocket(httpServer) {
  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ["http://localhost:3000", "http://localhost:3001"];
  
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
    path: "/ws",
  });

  io.on("connection", (socket) => {
    console.log("[WebSocket] Client connected:", socket.id);

    socket.on("subscribe", (walletAddress) => {
      if (!walletAddress) return;

      const normalizedAddress = walletAddress.toLowerCase();
      socket.walletAddress = normalizedAddress;

      if (!walletSockets.has(normalizedAddress)) {
        walletSockets.set(normalizedAddress, new Set());
      }
      walletSockets.get(normalizedAddress).add(socket.id);

      socket.join(`wallet:${normalizedAddress}`);
      console.log(`[WebSocket] ${socket.id} subscribed to wallet:${normalizedAddress}`);

      socket.emit("subscribed", { walletAddress: normalizedAddress });
    });

    socket.on("unsubscribe", () => {
      if (socket.walletAddress) {
        socket.leave(`wallet:${socket.walletAddress}`);
        const sockets = walletSockets.get(socket.walletAddress);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            walletSockets.delete(socket.walletAddress);
          }
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Client disconnected:", socket.id);
      if (socket.walletAddress) {
        const sockets = walletSockets.get(socket.walletAddress);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            walletSockets.delete(socket.walletAddress);
          }
        }
      }
    });
  });

  console.log("[WebSocket] Server initialized on /ws");
  return io;
}

function emitPaymentReceived(merchantWallet, data) {
  if (!io) return;

  const normalizedAddress = merchantWallet.toLowerCase();
  io.to(`wallet:${normalizedAddress}`).emit("payment:received", {
    type: "payment:received",
    timestamp: new Date().toISOString(),
    data: {
      endpointId: data.endpointId,
      service: data.service,
      route: data.route,
      revenue: data.revenue,
      formattedRevenue: data.formattedRevenue,
      txHash: data.txHash,
      paymentId: data.paymentId,
      callerAddress: data.callerAddress,
      latencyMs: data.latencyMs,
    },
  });
}

function emitRequestEvent(merchantWallet, data) {
  if (!io) return;

  const normalizedAddress = merchantWallet.toLowerCase();
  io.to(`wallet:${normalizedAddress}`).emit("request:logged", {
    type: "request:logged",
    timestamp: new Date().toISOString(),
    data: {
      endpointId: data.endpointId,
      service: data.service,
      route: data.route,
      status: data.status,
      latencyMs: data.latencyMs,
    },
  });
}

function emitEndpointUpdated(merchantWallet, data) {
  if (!io) return;

  const normalizedAddress = merchantWallet.toLowerCase();
  io.to(`wallet:${normalizedAddress}`).emit("endpoint:updated", {
    type: "endpoint:updated",
    timestamp: new Date().toISOString(),
    data,
  });
}

function emitStatsUpdate(merchantWallet, stats) {
  if (!io) return;

  const normalizedAddress = merchantWallet.toLowerCase();
  io.to(`wallet:${normalizedAddress}`).emit("stats:updated", {
    type: "stats:updated",
    timestamp: new Date().toISOString(),
    data: stats,
  });
}

function broadcast(event, data) {
  if (!io) return;
  io.emit(event, {
    type: event,
    timestamp: new Date().toISOString(),
    data,
  });
}

function getStats() {
  return {
    totalConnections: io ? io.engine.clientsCount : 0,
    subscribedWallets: walletSockets.size,
    socketsByWallet: Object.fromEntries(
      Array.from(walletSockets.entries()).map(([wallet, sockets]) => [
        wallet,
        sockets.size,
      ])
    ),
  };
}

module.exports = {
  initWebSocket,
  emitPaymentReceived,
  emitRequestEvent,
  emitEndpointUpdated,
  emitStatsUpdate,
  broadcast,
  getStats,
};
