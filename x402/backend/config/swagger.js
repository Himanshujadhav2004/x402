
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ATOMX x402 Gateway API",
      version: "1.0.0",
      description: `
# ATOMX x402 Payment Gateway

A Cronos-native API gateway that enables AI agents to pay for API calls instantly using the x402 protocol.

## Overview

This gateway provides:
- **Payment-gated API proxying** - Protect any API with blockchain payments
- **Endpoint management** - Register, price, and monitor your API endpoints
- **Discovery API** - Let agents find available paid endpoints
- **Real-time analytics** - Track revenue, requests, and performance

## Authentication

### Merchant Dashboard APIs
Require \`x-wallet-address\` header with the merchant's Ethereum address.

### Proxy APIs (Agent-facing)
- **Without payment**: Returns HTTP 402 with payment requirements
- **With payment**: Include \`X-PAYMENT\` header with signed authorization

## Payment Flow

1. Agent calls \`/proxy/:service/:route\`
2. Gateway returns \`402 Payment Required\` with invoice
3. Agent signs EIP-3009 authorization
4. Agent retries with \`X-PAYMENT\` header
5. Gateway verifies and settles on Cronos
6. Gateway proxies to upstream and returns response
      `,
      contact: {
        name: "ATOMX Team",
        url: "https://github.com/atomx",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Development server",
      },
      {
        url: "https://api.atomx.io",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Proxy",
        description: "Payment-gated API proxy (Agent-facing)",
      },
      {
        name: "Discovery",
        description: "Endpoint discovery for agents",
      },
      {
        name: "Endpoints",
        description: "Endpoint management (Merchant Dashboard)",
      },
      {
        name: "Analytics",
        description: "Usage analytics (Merchant Dashboard)",
      },
      {
        name: "Health",
        description: "System health and monitoring",
      },
    ],
    components: {
      schemas: {
        PaymentRequirements: {
          type: "object",
          properties: {
            scheme: {
              type: "string",
              enum: ["exact"],
              description: "Payment scheme",
            },
            network: {
              type: "string",
              enum: ["cronos-testnet", "cronos"],
              description: "Blockchain network",
            },
            payTo: {
              type: "string",
              description: "Merchant wallet address",
              example: "0x742d35Cc6634C0532925a3b844Bc9E7595f5bB0a",
            },
            asset: {
              type: "string",
              description: "Token contract address",
              example: "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0",
            },
            maxAmountRequired: {
              type: "string",
              description: "Payment amount in token's smallest unit",
              example: "100000",
            },
            maxTimeoutSeconds: {
              type: "integer",
              description: "Invoice expiry in seconds",
              example: 300,
            },
          },
        },
        Invoice402Response: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Payment Required",
            },
            x402Version: {
              type: "integer",
              example: 1,
            },
            paymentId: {
              type: "string",
              format: "uuid",
              description: "Unique invoice ID",
            },
            paymentRequirements: {
              $ref: "#/components/schemas/PaymentRequirements",
            },
            tokenInfo: {
              type: "object",
              properties: {
                symbol: { type: "string", example: "USDC" },
                name: { type: "string", example: "USD Coin" },
                decimals: { type: "integer", example: 6 },
                priceFormatted: { type: "string", example: "0.1 USDC" },
              },
            },
            expiresAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Endpoint: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Endpoint ID",
            },
            service: {
              type: "string",
              description: "Service name",
              example: "crypto-com",
            },
            route: {
              type: "string",
              description: "Route path",
              example: "ticker/btc",
            },
            description: {
              type: "string",
              description: "Endpoint description",
            },
            upstreamUrl: {
              type: "string",
              description: "Upstream API URL",
            },
            priceAmount: {
              type: "string",
              description: "Price in token's smallest unit",
              example: "100000",
            },
            tokenSymbol: {
              type: "string",
              enum: ["USDC", "CRO", "WCRO"],
              example: "USDC",
            },
            chainId: {
              type: "integer",
              enum: [338, 25],
              example: 338,
            },
            enabled: {
              type: "boolean",
              example: true,
            },
          },
        },
        DiscoverEndpoint: {
          type: "object",
          properties: {
            id: { type: "string" },
            service: { type: "string", example: "crypto-com" },
            route: { type: "string", example: "ticker/btc" },
            fullPath: { type: "string", example: "/proxy/crypto-com/ticker/btc" },
            description: { type: "string" },
            pricing: {
              type: "object",
              properties: {
                amount: { type: "string", example: "100000" },
                formatted: { type: "string", example: "0.1 USDC" },
                token: { type: "string", example: "USDC" },
                tokenAddress: { type: "string" },
              },
            },
            network: {
              type: "object",
              properties: {
                chainId: { type: "integer", example: 338 },
                name: { type: "string", example: "cronos-testnet" },
              },
            },
          },
        },
        AnalyticsSummary: {
          type: "object",
          properties: {
            totalRequests: { type: "integer", example: 150 },
            successfulRequests: { type: "integer", example: 120 },
            totalRevenue: { type: "string", example: "12000000" },
            avgLatency: { type: "integer", example: 45 },
            totalEndpoints: { type: "integer", example: 5 },
            activeEndpoints: { type: "integer", example: 4 },
            errorRate: { type: "string", example: "20.00%" },
            successRate: { type: "string", example: "80.00%" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
            },
            message: {
              type: "string",
            },
          },
        },
      },
      securitySchemes: {
        WalletAddress: {
          type: "apiKey",
          in: "header",
          name: "x-wallet-address",
          description: "Ethereum wallet address for merchant authentication",
        },
        X402Payment: {
          type: "apiKey",
          in: "header",
          name: "X-PAYMENT",
          description: "Base64-encoded payment authorization (EIP-3009 signature)",
        },
      },
    },
  },
  apis: ["./router/*.js", "./controller/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
