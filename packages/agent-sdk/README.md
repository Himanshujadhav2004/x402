# @atomx/agent-sdk

SDK for AI agents to interact with **x402 payment-gated APIs** on Cronos.

## Features

- **Automatic Payment Handling** - Detects 402 responses and handles payment automatically
- **EIP-3009 Signing** - Signs `transferWithAuthorization` for gasless token payments
- **Endpoint Discovery** - Find available paid APIs programmatically
- **TypeScript First** - Full type safety and IDE autocomplete
- **Zero Config** - Works out of the box with sensible defaults

## Installation

```bash
npm install @atomx/agent-sdk viem
```

## Quick Start

```typescript
import { X402Client } from '@atomx/agent-sdk';

// Create client with your agent's private key
const client = new X402Client({
  privateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
  gatewayUrl: 'https://api.atomx.io', // or your gateway URL
  chainId: 338, // Cronos Testnet (use 25 for mainnet)
});

// Fetch a paid API - payment is handled automatically!
const response = await client.fetch('/proxy/crypto-com/ticker/btc');

console.log(response.data);    // { price: 97000, volume: ... }
console.log(response.paid);    // true
console.log(response.txHash);  // '0x...' (on-chain settlement)
```

## API Reference

### `X402Client`

The main client class for interacting with x402 APIs.

#### Constructor

```typescript
new X402Client({
  privateKey: `0x${string}`,     // Required: Agent wallet private key
  gatewayUrl?: string,           // Optional: Gateway URL (default: localhost:8080)
  chainId?: 338 | 25,            // Optional: Chain ID (default: 338 testnet)
  rpcUrl?: string,               // Optional: Custom RPC URL
  debug?: boolean,               // Optional: Enable debug logging
})
```

#### Methods

##### `fetch<T>(path, options?): Promise<X402Response<T>>`

Fetch a resource with automatic payment handling.

```typescript
const response = await client.fetch('/proxy/crypto-com/ticker/btc');

// Response shape:
{
  data: T,              // The API response data
  paid: boolean,        // Whether payment was made
  txHash?: string,      // Transaction hash if paid
  paymentId?: string,   // Payment ID if paid
  headers: Headers,     // Response headers
}
```

Options:
```typescript
{
  skipPayment?: boolean,    // Skip payment even if 402 (default: false)
  paymentTimeout?: number,  // Payment timeout in seconds (default: 300)
  maxRetries?: number,      // Max retries after payment (default: 1)
  ...RequestInit            // Standard fetch options
}
```

##### `discover(filters?): Promise<DiscoverEndpoint[]>`

Discover available endpoints.

```typescript
// Get all endpoints
const endpoints = await client.discover();

// Filter by service
const cryptoEndpoints = await client.discover({ service: 'crypto-com' });

// Filter by max price
const cheapEndpoints = await client.discover({ maxPrice: '100000' }); // 0.1 USDC
```

##### `listServices(): Promise<string[]>`

List all available services.

```typescript
const services = await client.listServices();
// ['crypto-com', 'coingecko', ...]
```

##### `getService(name): Promise<DiscoverEndpoint[]>`

Get all endpoints for a specific service.

```typescript
const endpoints = await client.getService('crypto-com');
```

##### `checkPaymentRequired(path): Promise<Invoice402Response | null>`

Check if an endpoint requires payment without paying.

```typescript
const invoice = await client.checkPaymentRequired('/proxy/crypto-com/ticker/btc');
if (invoice) {
  console.log('Price:', invoice.tokenInfo?.formatted);
}
```

##### `getPrice(path): Promise<{ amount, formatted, token } | null>`

Get the price for an endpoint.

```typescript
const price = await client.getPrice('/proxy/crypto-com/ticker/btc');
console.log(price?.formatted); // "0.1 USDC"
```

### Helper Functions

```typescript
import {
  generateNonce,
  encodePaymentHeader,
  decodePaymentHeader,
  formatTokenAmount,
  parseTokenAmount,
  is402Response,
} from '@atomx/agent-sdk';

// Generate a random nonce for EIP-3009
const nonce = generateNonce();

// Format token amount (6 decimals)
formatTokenAmount('1000000'); // "1"

// Parse token amount
parseTokenAmount('1.5'); // "1500000"
```

## Example: AI Agent Tool

```typescript
import { X402Client } from '@atomx/agent-sdk';

class CryptoPriceTool {
  private client: X402Client;

  constructor(privateKey: `0x${string}`) {
    this.client = new X402Client({
      privateKey,
      gatewayUrl: 'https://api.atomx.io',
    });
  }

  async getBTCPrice(): Promise<number> {
    const response = await this.client.fetch('/proxy/crypto-com/ticker/btc');
    return response.data.result.data.a; // Ask price
  }

  async getETHPrice(): Promise<number> {
    const response = await this.client.fetch('/proxy/crypto-com/ticker/eth');
    return response.data.result.data.a;
  }

  async getMultiplePrices(symbols: string[]): Promise<Record<string, number>> {
    const response = await this.client.fetch('/proxy/crypto-com/tickers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    });
    return response.data;
  }
}

// Usage
const tool = new CryptoPriceTool(process.env.AGENT_KEY as `0x${string}`);
const btcPrice = await tool.getBTCPrice();
console.log(`BTC Price: $${btcPrice}`);
```

## Networks

| Network | Chain ID | USDC Address |
|---------|----------|--------------|
| Cronos Testnet | 338 | `0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0` |
| Cronos Mainnet | 25 | `0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C` |

## How It Works

1. **Request**: Your agent calls `client.fetch('/proxy/service/route')`
2. **402 Response**: Gateway returns HTTP 402 with payment requirements
3. **Sign Authorization**: SDK signs EIP-3009 `transferWithAuthorization`
4. **Retry with Payment**: SDK retries request with `X-PAYMENT` header
5. **Settlement**: Gateway verifies and settles payment on Cronos
6. **Response**: Your agent receives the API response

```
Agent                Gateway              Cronos
  |                     |                    |
  |-- GET /proxy/... -->|                    |
  |<-- 402 + Invoice ---|                    |
  |                     |                    |
  |-- Sign EIP-3009 ----|                    |
  |                     |                    |
  |-- Retry + Payment ->|                    |
  |                     |-- Verify --------->|
  |                     |-- Settle --------->|
  |                     |<-- TX Hash --------|
  |<-- 200 + Data ------|                    |
```

## License

MIT
