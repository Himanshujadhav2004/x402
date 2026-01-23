# ATOMX - x402 Pay-per-API Gateway

**Let AI agents pay for the internet.**

ATOMX is a Cronos-native API Gateway that enables AI agents to pay for API calls instantly using the x402 protocol. No accounts, no API keys - agents sign a payment authorization and get instant access.

## Overview

ATOMX transforms any API into a paid, on-chain service using the x402 HTTP Payment Protocol on Cronos. Built for the agentic economy where AI agents need programmatic access to paid services without human intervention.

### Key Features

- **Pay-per-Request**: Agents pay exactly what they use, no subscriptions or prepayments
- **Gasless Payments**: Uses EIP-3009 `transferWithAuthorization` for USDC transfers without gas
- **Instant Settlement**: Payments settle on-chain in real-time via Cronos Facilitator
- **No API Keys**: Payment authorization serves as authentication
- **Secret Header Injection**: Monetize your existing API keys (Gemini, OpenAI, etc.)
- **Real-time Analytics**: Track revenue, latency, and endpoint performance

## How x402 Works

```
Agent                    ATOMX Gateway                 Cronos Facilitator
  |                           |                               |
  |  1. GET /api/data         |                               |
  |-------------------------->|                               |
  |                           |                               |
  |  2. HTTP 402 + Invoice    |                               |
  |<--------------------------|                               |
  |                           |                               |
  |  3. Sign EIP-3009 Auth    |                               |
  |  4. Retry with X-PAYMENT  |                               |
  |-------------------------->|                               |
  |                           |  5. Verify & Settle           |
  |                           |------------------------------>|
  |                           |                               |
  |                           |  6. TX Hash                   |
  |                           |<------------------------------|
  |                           |                               |
  |  7. API Response + TxHash |                               |
  |<--------------------------|                               |
```

1. Agent requests a protected endpoint
2. Gateway returns HTTP 402 with payment requirements (amount, recipient, asset)
3. Agent signs an EIP-3009 `transferWithAuthorization` message
4. Agent retries request with `X-PAYMENT` header containing the signed authorization
5. Gateway forwards payment to Cronos Facilitator for verification and on-chain settlement
6. Facilitator executes the USDC transfer and returns transaction hash
7. Gateway proxies the upstream API response back to the agent

## For API Providers

Turn your APIs into revenue streams:

- **Register Endpoints**: Define service, route, upstream URL, and price
- **Secret Headers**: Inject your API keys into upstream requests (agents never see them)
- **Analytics Dashboard**: Monitor revenue, requests, latency percentiles, and error rates
- **CSV Export**: Download payment history for accounting

## For AI Agents

Access paid APIs programmatically:

- **Agent SDK**: TypeScript SDK for seamless x402 integration
- **No Setup Required**: Just fund your wallet with USDC on Cronos Testnet
- **Automatic Retries**: SDK handles 402 responses and payment signing
- **Multi-Endpoint Support**: Access any registered API through the gateway

## Project Structure

```
x402/
├── backend/                 # Express.js API Gateway
│   ├── controller/          # Route handlers
│   ├── model/               # MongoDB schemas
│   ├── router/              # API routes
│   ├── services/            # Business logic
│   └── middleware/          # Auth & rate limiting
├── frontend/                # Next.js Dashboard
│   └── src/
│       ├── app/             # Pages (dashboard, market, agents)
│       ├── components/      # UI components
│       └── hooks/           # WebSocket & utilities
packages/
└── agent-sdk/               # TypeScript SDK for agents
scripts/                     # Testing & demo scripts
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Blockchain | Cronos Testnet (Chain ID: 338) |
| Payment Token | USDC (0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0) |
| Facilitator | Cronos x402 Facilitator |
| Backend | Node.js, Express.js, MongoDB |
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui |
| Wallet | thirdweb SDK, MetaMask |
| Real-time | WebSocket for live payment notifications |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- MetaMask wallet with Cronos Testnet USDC

### Backend Setup

```bash
cd x402/backend
npm install
# Configure .env with MongoDB URI
npm start
```

### Frontend Setup

```bash
cd x402/frontend
npm install
npm run dev
```

### Seed Demo Endpoints

```bash
cd x402/backend
node scripts/seedDemoEndpoints.js
```

## Agent SDK Usage

```typescript
import { X402Client } from 'atomx-agent-sdk';

const client = new X402Client({
  gatewayUrl: 'http://localhost:8080',
  privateKey: process.env.AGENT_PRIVATE_KEY,
});

const response = await client.request('/proxy/crypto-data/price', {
  params: { ids: 'bitcoin,ethereum', vs_currencies: 'usd' }
});

console.log(response.data);
console.log('Payment TX:', response.txHash);
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/discover` | List all available paid endpoints |
| `GET /api/endpoints` | Manage your registered endpoints |
| `GET /api/analytics` | Revenue and performance metrics |
| `GET /proxy/:service/:route` | Access paid APIs |
| `POST /proxy/:service/:route` | Access paid APIs (POST) |

## Network Configuration

| Parameter | Value |
|-----------|-------|
| Network | Cronos Testnet |
| Chain ID | 338 |
| RPC URL | https://evm-t3.cronos.org |
| USDC Address | 0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0 |
| Facilitator | https://facilitator.cronoslabs.org/v2/x402 |
| Explorer | https://explorer.cronos.org/testnet |

## Dashboard Features

### Endpoint Registry
- Create, edit, and delete API endpoints
- Configure pricing in USDC (6 decimals)
- Add secret headers for API key injection
- Enable/disable endpoints

### API Playground
- Test x402 payment flow interactively
- Watch each step: 402 → Sign → Pay → Response
- Support for GET and POST requests
- View on-chain transaction confirmations

### Analytics Dashboard
- Total revenue and request volume
- Success rate and latency percentiles (P50, P95, P99)
- Revenue and request charts (7-day trends)
- Endpoint performance breakdown
- Recent transactions with explorer links
- Live payment notifications via WebSocket
- CSV export for payment history

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built on [Cronos](https://cronos.org/) EVM
- Powered by the [x402 Protocol](https://www.x402.org/)
- Uses [Cronos Facilitator](https://facilitator.cronoslabs.org/) for payment settlement

---

**ATOMX** - Payments for the Agentic Internet

Built for [Cronos x402 Hackathon](https://cronoslabs.org/)
