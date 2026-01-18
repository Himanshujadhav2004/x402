import {
  createWalletClient,
  http,
  type WalletClient,
  type Account,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import type {
  X402ClientConfig,
  Invoice402Response,
  PaymentPayload,
  FetchOptions,
  X402Response,
  DiscoverResponse,
  DiscoverEndpoint,
} from "./types";

import {
  DEFAULT_GATEWAY_URL,
  X402_VERSION,
  USDC_ADDRESS,
  USDC_DOMAIN,
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  getChain,
  NETWORK_NAMES,
} from "./constants";

import {
  generateNonce,
  encodePaymentHeader,
  is402Response,
  createLogger,
  sleep,
} from "./utils";

export class X402Client {
  private walletClient: WalletClient;
  private account: Account;
  private gatewayUrl: string;
  private chainId: number;
  private chain: Chain;
  private debug: boolean;
  private logger: ReturnType<typeof createLogger>;

  constructor(config: X402ClientConfig) {
    this.account = privateKeyToAccount(config.privateKey);
    this.gatewayUrl = config.gatewayUrl || DEFAULT_GATEWAY_URL;
    this.chainId = config.chainId || 338;
    this.chain = getChain(this.chainId);
    this.debug = config.debug || false;
    this.logger = createLogger(this.debug);

    this.walletClient = createWalletClient({
      account: this.account,
      chain: this.chain,
      transport: http(config.rpcUrl),
    });

    this.logger.log("Initialized with address:", this.account.address);
  }

  get address(): `0x${string}` {
    return this.account.address;
  }

  async fetch<T = unknown>(
    path: string,
    options: FetchOptions = {}
  ): Promise<X402Response<T>> {
    const { skipPayment = false, paymentTimeout = 300, maxRetries = 1, ...fetchOptions } = options;

    const url = path.startsWith("http") ? path : `${this.gatewayUrl}${path}`;
    this.logger.log("Fetching:", url);

    const initialResponse = await fetch(url, fetchOptions);

    if (!is402Response(initialResponse) || skipPayment) {
      const data = await initialResponse.json() as T;
      return {
        data,
        paid: false,
        headers: initialResponse.headers,
      };
    }

    this.logger.log("Received 402 Payment Required");
    const invoice = await initialResponse.json() as Invoice402Response;

    const paymentHeader = await this.signPayment(invoice, paymentTimeout);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        this.logger.log(`Retry attempt ${attempt}/${maxRetries}`);
        await sleep(1000 * attempt);
      }

      const paidResponse = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          "X-PAYMENT": paymentHeader,
          "X-PAYMENT-ID": invoice.paymentId,
        },
      });

      if (paidResponse.ok) {
        const data = await paidResponse.json() as T;
        return {
          data,
          paid: true,
          txHash: paidResponse.headers.get("X-Payment-TxHash") || undefined,
          paymentId: invoice.paymentId,
          headers: paidResponse.headers,
        };
      }

      if (is402Response(paidResponse)) {
        const errorBody = await paidResponse.json();
        lastError = new Error(
          `Payment verification failed: ${errorBody.error || "Unknown error"}`
        );
        this.logger.error("Payment failed:", errorBody);
      } else {
        lastError = new Error(
          `Request failed with status ${paidResponse.status}`
        );
      }
    }

    throw lastError || new Error("Payment failed after retries");
  }

  async signPayment(
    invoice: Invoice402Response,
    timeoutSeconds: number = 300
  ): Promise<string> {
    const { paymentRequirements } = invoice;
    this.logger.log("Signing payment for:", paymentRequirements.maxAmountRequired);

    const nonce = generateNonce();
    const validAfter = 0n;
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + timeoutSeconds);

    const usdcAddress = USDC_ADDRESS[this.chainId];

    const domain = {
      name: USDC_DOMAIN.name,
      version: USDC_DOMAIN.version,
      chainId: this.chainId,
      verifyingContract: usdcAddress,
    };

    const message = {
      from: this.account.address,
      to: paymentRequirements.payTo,
      value: BigInt(paymentRequirements.maxAmountRequired),
      validAfter,
      validBefore,
      nonce,
    };

    const signature = await this.walletClient.signTypedData({
      account: this.account,
      domain,
      types: TRANSFER_WITH_AUTHORIZATION_TYPES,
      primaryType: "TransferWithAuthorization",
      message,
    });

    this.logger.log("Signed authorization");

    const payload: PaymentPayload = {
      x402Version: X402_VERSION,
      scheme: "exact",
      network: NETWORK_NAMES[this.chainId],
      payload: {
        signature,
        authorization: {
          from: this.account.address,
          to: paymentRequirements.payTo,
          value: paymentRequirements.maxAmountRequired,
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          nonce,
        },
      },
    };

    return encodePaymentHeader(payload);
  }

  async discover(filters?: {
    service?: string;
    token?: string;
    maxPrice?: string;
  }): Promise<DiscoverEndpoint[]> {
    const params = new URLSearchParams();
    if (filters?.service) params.set("service", filters.service);
    if (filters?.token) params.set("token", filters.token);
    if (filters?.maxPrice) params.set("maxPrice", filters.maxPrice);

    const queryString = params.toString();
    const url = `${this.gatewayUrl}/api/discover${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url);
    const data = await response.json() as DiscoverResponse;

    if (!data.success) {
      throw new Error("Failed to discover endpoints");
    }

    return data.endpoints;
  }

  async listServices(): Promise<string[]> {
    const response = await fetch(`${this.gatewayUrl}/api/discover/services`);
    const data = await response.json();
    return data.services || [];
  }

  async getService(serviceName: string): Promise<DiscoverEndpoint[]> {
    const response = await fetch(`${this.gatewayUrl}/api/discover/${serviceName}`);
    const data = await response.json();
    return data.endpoints || [];
  }

  async checkPaymentRequired(path: string): Promise<Invoice402Response | null> {
    const url = path.startsWith("http") ? path : `${this.gatewayUrl}${path}`;
    const response = await fetch(url, { method: "GET" });

    if (is402Response(response)) {
      return await response.json() as Invoice402Response;
    }

    return null;
  }

  async getPrice(path: string): Promise<{
    amount: string;
    formatted: string;
    token: string;
  } | null> {
    const invoice = await this.checkPaymentRequired(path);
    if (!invoice) return null;

    return {
      amount: invoice.paymentRequirements.maxAmountRequired,
      formatted: invoice.tokenInfo?.formatted || "Unknown",
      token: invoice.tokenInfo?.symbol || "USDC",
    };
  }
}

export function createClient(config: X402ClientConfig): X402Client {
  return new X402Client(config);
}
