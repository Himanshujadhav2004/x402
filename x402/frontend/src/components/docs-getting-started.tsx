"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DocsGettingStarted() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Getting Started</h1>
        <p className="text-muted-foreground mt-2">
          Set up your first paid API endpoint in minutes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Step 1</Badge>
            Connect Your Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Click the &quot;Connect Wallet&quot; button in the top navigation to connect your
            Cronos-compatible wallet (MetaMask, Rabby, etc.).
          </p>
          <p className="text-sm text-muted-foreground">
            Your wallet address will be used to receive payments from AI agents.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Step 2</Badge>
            Register an API Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Navigate to the Endpoint Registry and click &quot;Add Endpoint&quot;. Fill in:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Service Name:</strong> A unique identifier (e.g., &quot;weather-api&quot;)</li>
            <li><strong>Route:</strong> The API path (e.g., &quot;forecast&quot;)</li>
            <li><strong>Upstream URL:</strong> Your actual API endpoint</li>
            <li><strong>Price:</strong> Amount in USDC per request</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Your endpoint will be available at: <code className="bg-muted px-2 py-1 rounded">
            /proxy/&#123;service&#125;/&#123;route&#125;</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Step 3</Badge>
            Share with AI Agents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            AI agents can now call your endpoint. When they request without payment,
            they receive an HTTP 402 response with payment requirements:
          </p>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "x402Version": 1,
  "paymentRequirements": {
    "scheme": "exact",
    "network": "cronos-testnet",
    "payTo": "0x...",
    "asset": "0x...(USDC)",
    "maxAmountRequired": "1000000"
  }
}`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Step 4</Badge>
            Get Paid in USDC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            When agents pay using EIP-3009 signed authorizations, payments are
            settled on-chain via the Cronos X402 Facilitator. USDC goes directly
            to your wallet.
          </p>
          <p className="text-sm text-muted-foreground">
            View your earnings in the Analytics dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
