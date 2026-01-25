"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface PaymentReceivedEvent {
  type: "payment:received";
  timestamp: string;
  data: {
    endpointId: string;
    service: string;
    route: string;
    revenue: string;
    formattedRevenue: string;
    txHash: string;
    paymentId: string;
    callerAddress: string | null;
    latencyMs: number;
  };
}

interface RequestLoggedEvent {
  type: "request:logged";
  timestamp: string;
  data: {
    endpointId: string;
    service: string;
    route: string;
    status: string;
    latencyMs: number;
  };
}

interface StatsUpdatedEvent {
  type: "stats:updated";
  timestamp: string;
  data: Record<string, unknown>;
}

type WebSocketEvent = PaymentReceivedEvent | RequestLoggedEvent | StatsUpdatedEvent;

interface UseWebSocketOptions {
  walletAddress: string | undefined;
  onPaymentReceived?: (event: PaymentReceivedEvent) => void;
  onRequestLogged?: (event: RequestLoggedEvent) => void;
  onStatsUpdated?: (event: StatsUpdatedEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastEvent: WebSocketEvent | null;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket({
  walletAddress,
  onPaymentReceived,
  onRequestLogged,
  onStatsUpdated,
  onConnect,
  onDisconnect,
}: UseWebSocketOptions): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    socketRef.current = io(WS_URL, {
      path: "/ws",
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      setIsConnected(true);
      onConnect?.();

      if (walletAddress) {
        socketRef.current?.emit("subscribe", walletAddress.toLowerCase());
      }
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
      onDisconnect?.();
    });

    socketRef.current.on("subscribed", (data: { walletAddress: string }) => {
      console.log("[WebSocket] Subscribed to wallet:", data.walletAddress);
    });

    socketRef.current.on("payment:received", (event: PaymentReceivedEvent) => {
      setLastEvent(event);
      onPaymentReceived?.(event);
    });

    socketRef.current.on("request:logged", (event: RequestLoggedEvent) => {
      setLastEvent(event);
      onRequestLogged?.(event);
    });

    socketRef.current.on("stats:updated", (event: StatsUpdatedEvent) => {
      setLastEvent(event);
      onStatsUpdated?.(event);
    });
  }, [walletAddress, onPaymentReceived, onRequestLogged, onStatsUpdated, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (walletAddress) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [walletAddress, connect, disconnect]);

  useEffect(() => {
    if (socketRef.current?.connected && walletAddress) {
      socketRef.current.emit("subscribe", walletAddress.toLowerCase());
    }
  }, [walletAddress]);

  return {
    isConnected,
    lastEvent,
    connect,
    disconnect,
  };
}

export type { PaymentReceivedEvent, RequestLoggedEvent, StatsUpdatedEvent, WebSocketEvent };
