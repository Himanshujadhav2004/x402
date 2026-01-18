import { type Hex, toHex } from "viem";

export function generateNonce(): Hex {
  const randomBytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 32; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return toHex(randomBytes);
}

export function encodePaymentHeader(payload: unknown): string {
  const json = JSON.stringify(payload);
  if (typeof btoa !== "undefined") {
    return btoa(json);
  }
  return Buffer.from(json).toString("base64");
}

export function decodePaymentHeader<T = unknown>(encoded: string): T {
  let json: string;
  if (typeof atob !== "undefined") {
    json = atob(encoded);
  } else {
    json = Buffer.from(encoded, "base64").toString("utf-8");
  }
  return JSON.parse(json);
}

export function formatTokenAmount(
  amount: string | bigint,
  decimals: number = 6
): string {
  const value = typeof amount === "string" ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  if (fractionalPart === 0n) {
    return integerPart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const trimmed = fractionalStr.replace(/0+$/, "");
  return `${integerPart}.${trimmed}`;
}

export function parseTokenAmount(
  amount: string,
  decimals: number = 6
): string {
  const [integerPart, fractionalPart = ""] = amount.split(".");
  const paddedFractional = fractionalPart.padEnd(decimals, "0").slice(0, decimals);
  const combined = integerPart + paddedFractional;
  return BigInt(combined).toString();
}

export function is402Response(response: Response): boolean {
  return response.status === 402;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export function createLogger(debug: boolean) {
  return {
    log: (...args: unknown[]) => {
      if (debug) console.log("[x402-sdk]", ...args);
    },
    error: (...args: unknown[]) => {
      console.error("[x402-sdk]", ...args);
    },
    warn: (...args: unknown[]) => {
      if (debug) console.warn("[x402-sdk]", ...args);
    },
  };
}
