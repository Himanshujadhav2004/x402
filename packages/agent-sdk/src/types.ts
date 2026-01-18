export interface X402ClientConfig {
  privateKey: `0x${string}`;
  gatewayUrl?: string;
  chainId?: 338 | 25;
  rpcUrl?: string;
  debug?: boolean;
}

export interface PaymentRequirements {
  scheme: "exact";
  network: "cronos-testnet" | "cronos";
  payTo: `0x${string}`;
  asset: `0x${string}`;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
  resource?: string;
  description?: string;
  mimeType?: string;
  outputSchema?: unknown;
}

export interface Invoice402Response {
  error: string;
  x402Version: number;
  paymentId: string;
  paymentRequirements: PaymentRequirements;
  tokenInfo?: {
    symbol: string;
    name: string;
    decimals: number;
    formatted: string;
  };
  acceptedTokens?: string[];
}

export interface PaymentPayload {
  x402Version: number;
  scheme: "exact";
  network: string;
  payload: {
    signature: `0x${string}`;
    authorization: {
      from: `0x${string}`;
      to: `0x${string}`;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: `0x${string}`;
    };
  };
}

export interface FetchOptions extends RequestInit {
  skipPayment?: boolean;
  paymentTimeout?: number;
  maxRetries?: number;
}

export interface X402Response<T = unknown> {
  data: T;
  paid: boolean;
  txHash?: string;
  paymentId?: string;
  headers: Headers;
}

export interface DiscoverEndpoint {
  id: string;
  service: string;
  route: string;
  fullPath: string;
  description?: string;
  pricing: {
    amount: string;
    formatted: string;
    token: string;
    tokenAddress: string;
    acceptedTokens: string[];
  };
  network: {
    chainId: number;
    name: string;
  };
  merchant: string;
}

export interface DiscoverResponse {
  success: boolean;
  count: number;
  endpoints: DiscoverEndpoint[];
  byService: Record<string, DiscoverEndpoint[]>;
}
