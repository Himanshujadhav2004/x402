import { type Chain } from "viem";

export const cronosTestnet: Chain = {
  id: 338,
  name: "Cronos Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Test CRO",
    symbol: "TCRO",
  },
  rpcUrls: {
    default: {
      http: ["https://evm-t3.cronos.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Cronos Testnet Explorer",
      url: "https://explorer.cronos.org/testnet",
    },
  },
  testnet: true,
};

export const cronosMainnet: Chain = {
  id: 25,
  name: "Cronos Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Cronos",
    symbol: "CRO",
  },
  rpcUrls: {
    default: {
      http: ["https://evm.cronos.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Cronos Explorer",
      url: "https://explorer.cronos.org",
    },
  },
};

export const USDC_ADDRESS: Record<number, `0x${string}`> = {
  338: "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0",
  25: "0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C",
};

export const USDC_DOMAIN = {
  name: "USD Coin",
  version: "2",
};

export const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export const DEFAULT_GATEWAY_URL = "http://localhost:8080";

export const X402_VERSION = 1;

export const NETWORK_NAMES: Record<number, string> = {
  338: "cronos-testnet",
  25: "cronos",
};

export function getChain(chainId: number): Chain {
  switch (chainId) {
    case 338:
      return cronosTestnet;
    case 25:
      return cronosMainnet;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}
