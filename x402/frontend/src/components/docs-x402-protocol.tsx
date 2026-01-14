"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DocsX402Protocol() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">x402 Protocol</h1>
        <p className="text-muted-foreground mt-2">
          HTTP-native micropayments for the agentic web
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What is x402?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            x402 is a protocol that brings HTTP 402 &quot;Payment Required&quot; to life.
            It enables AI agents to autonomously pay for API access using
            cryptocurrency, without human intervention.
          </p>
          <p>
            Built on top of EIP-3009 (transferWithAuthorization), x402 allows
            gasless token transfers that are verified and settled by a trusted
            facilitator.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Badge className="mt-1 shrink-0">1</Badge>
              <div>
                <p className="font-semibold">Agent requests resource</p>
                <p className="text-sm text-muted-foreground">
                  GET /proxy/service/route (no payment header)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Badge className="mt-1 shrink-0">2</Badge>
              <div>
                <p className="font-semibold">Gateway returns 402</p>
                <p className="text-sm text-muted-foreground">
                  Response includes paymentRequirements with amount, recipient, and asset
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Badge className="mt-1 shrink-0">3</Badge>
              <div>
                <p className="font-semibold">Agent signs EIP-3009 authorization</p>
                <p className="text-sm text-muted-foreground">
                  Creates transferWithAuthorization signature (gasless)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Badge className="mt-1 shrink-0">4</Badge>
              <div>
                <p className="font-semibold">Agent retries with X-PAYMENT header</p>
                <p className="text-sm text-muted-foreground">
                  Base64-encoded payload with signature and authorization details
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Badge className="mt-1 shrink-0">5</Badge>
              <div>
                <p className="font-semibold">Gateway verifies payment</p>
                <p className="text-sm text-muted-foreground">
                  Calls Cronos Facilitator /verify endpoint
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Badge className="mt-1 shrink-0">6</Badge>
              <div>
                <p className="font-semibold">Gateway settles on-chain</p>
                <p className="text-sm text-muted-foreground">
                  Calls Cronos Facilitator /settle - USDC transferred to merchant
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Badge className="mt-1 shrink-0">7</Badge>
              <div>
                <p className="font-semibold">Gateway proxies request</p>
                <p className="text-sm text-muted-foreground">
                  Forwards to upstream API and returns response with TX hash
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>X-PAYMENT Header Format</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`// Decoded from Base64
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "cronos-testnet",
  "payload": {
    "signature": "0x...",
    "authorization": {
      "from": "0x...",     // Agent wallet
      "to": "0x...",       // Merchant wallet
      "value": "1000000",  // Amount in smallest unit
      "validAfter": "0",
      "validBefore": "...",// Expiration timestamp
      "nonce": "0x..."     // Unique nonce (bytes32)
    }
  }
}`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>EIP-712 Typed Data</CardTitle>
          <CardDescription>Used for signing the authorization</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`// Domain
{
  name: "USD Coin",
  version: "2",
  chainId: 338,  // Cronos Testnet
  verifyingContract: "0x..." // USDC address
}

// Types
{
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" }
  ]
}`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cronos Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Testnet</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Chain ID</td>
                    <td className="py-2">338</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">RPC</td>
                    <td className="py-2"><code>https://evm-t3.cronos.org</code></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">USDC.e</td>
                    <td className="py-2"><code className="text-xs">0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0</code></td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Explorer</td>
                    <td className="py-2"><code>https://explorer.cronos.org/testnet</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Mainnet</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Chain ID</td>
                    <td className="py-2">25</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">RPC</td>
                    <td className="py-2"><code>https://evm.cronos.org</code></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">USDC.e</td>
                    <td className="py-2"><code className="text-xs">0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C</code></td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Explorer</td>
                    <td className="py-2"><code>https://explorer.cronos.org</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>
              <a
                href="https://github.com/coinbase/x402"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                x402 Protocol Specification (Coinbase)
              </a>
            </li>
            <li>
              <a
                href="https://docs.cronos.org/cronos-x402-facilitator/introduction"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Cronos X402 Facilitator Documentation
              </a>
            </li>
            <li>
              <a
                href="https://github.com/cronos-labs/x402-examples"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Cronos x402 Examples
              </a>
            </li>
            <li>
              <a
                href="https://eips.ethereum.org/EIPS/eip-3009"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                EIP-3009: Transfer With Authorization
              </a>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
