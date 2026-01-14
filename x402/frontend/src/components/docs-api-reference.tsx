"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DocsApiReference() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Reference</h1>
        <p className="text-muted-foreground mt-2">
          Complete reference for the x402 Gateway API
        </p>
      </div>

      <Tabs defaultValue="proxy" className="w-full">
        <TabsList>
          <TabsTrigger value="proxy">Proxy API</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints API</TabsTrigger>
          <TabsTrigger value="analytics">Analytics API</TabsTrigger>
        </TabsList>

        <TabsContent value="proxy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge>GET</Badge>
                /proxy/:service/:route
              </CardTitle>
              <CardDescription>
                Access a paid API endpoint. Returns 402 if no payment provided.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Request Headers</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Header</th>
                      <th className="text-left py-2">Required</th>
                      <th className="text-left py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2"><code>X-PAYMENT</code></td>
                      <td className="py-2">For paid requests</td>
                      <td className="py-2">Base64-encoded payment payload</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2"><code>X-PAYMENT-ID</code></td>
                      <td className="py-2">For paid requests</td>
                      <td className="py-2">Payment ID from 402 response</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-semibold mb-2">402 Response (No Payment)</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": false,
  "error": "Payment Required",
  "x402Version": 1,
  "paymentId": "uuid-...",
  "paymentRequirements": {
    "scheme": "exact",
    "network": "cronos-testnet",
    "payTo": "0x...",
    "asset": "0x...",
    "maxAmountRequired": "1000000",
    "maxTimeoutSeconds": 300
  },
  "expiresAt": "2024-...",
  "endpoint": {
    "service": "...",
    "route": "...",
    "description": "..."
  }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Success Response Headers</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Header</th>
                      <th className="text-left py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2"><code>X-Payment-TxHash</code></td>
                      <td className="py-2">Settlement transaction hash</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2"><code>X-Payment-BlockNumber</code></td>
                      <td className="py-2">Block number of settlement</td>
                    </tr>
                    <tr>
                      <td className="py-2"><code>X-Payment-Explorer</code></td>
                      <td className="py-2">Link to block explorer</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge>POST</Badge>
                /api/endpoints
              </CardTitle>
              <CardDescription>Create a new paid endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`// Request Body
{
  "service": "my-api",
  "route": "data",
  "upstreamUrl": "https://api.example.com/data",
  "priceAmount": "1000000",
  "description": "My API endpoint",
  "chainId": 338
}

// Response
{
  "success": true,
  "data": { /* endpoint object */ }
}`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">GET</Badge>
                /api/endpoints
              </CardTitle>
              <CardDescription>List all your endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Requires <code>X-Wallet-Address</code> header
              </p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`// Response
{
  "success": true,
  "count": 2,
  "data": [/* endpoint objects */]
}`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="destructive">DELETE</Badge>
                /api/endpoints/:id
              </CardTitle>
              <CardDescription>Delete an endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`// Response
{
  "success": true,
  "message": "Endpoint deleted"
}`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">GET</Badge>
                /api/analytics
              </CardTitle>
              <CardDescription>Get analytics for your endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Requires <code>X-Wallet-Address</code> header
              </p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`// Response
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 150,
      "successfulRequests": 142,
      "totalRevenue": "142000000",
      "avgLatency": 245
    },
    "recentTransactions": [...],
    "dailyRevenue": [...]
  }
}`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
