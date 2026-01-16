"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Zap,
  Shield,
  Code,
  ArrowRight,
  CheckCircle2,
  Wallet,
  Globe,
  Clock
} from "lucide-react";

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="mb-4">
            <Bot className="w-3 h-3 mr-1" />
            For AI Agents
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Pay-per-API for <span className="text-[#10E46C]">AI Agents</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enable your AI agents to autonomously access premium APIs using the x402 HTTP payment protocol.
            No API keys. No subscriptions. Just pay-per-request with USDC on Cronos.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <a href="/dashboard">
                Try API Playground
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com/anthropics/claude-code" target="_blank">
                View SDK
              </a>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">How It Works</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                step: 1,
                title: "Request API",
                description: "Agent sends GET request to protected endpoint",
                icon: Globe,
              },
              {
                step: 2,
                title: "Receive 402",
                description: "Gateway returns HTTP 402 with payment requirements",
                icon: Wallet,
              },
              {
                step: 3,
                title: "Sign Payment",
                description: "Agent signs EIP-3009 USDC authorization (gasless)",
                icon: Shield,
              },
              {
                step: 4,
                title: "Get Data",
                description: "Payment settles on-chain, agent receives response",
                icon: Zap,
              },
            ].map((item) => (
              <Card key={item.step} className="relative">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#10E46C] text-black flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <CardHeader className="pt-6">
                  <item.icon className="w-8 h-8 text-[#10E46C] mb-2" />
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Integration Example
            </CardTitle>
            <CardDescription>
              Simple JavaScript code to integrate x402 payments into your agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`// 1. Request the API (get 402 response)
const response = await fetch('https://gateway.atomx.xyz/proxy/binance/ticker/btc');

if (response.status === 402) {
  const { paymentRequirements, paymentId } = await response.json();

  // 2. Sign EIP-3009 authorization (gasless USDC transfer)
  const signature = await wallet.signTypedData({
    domain: { name: "USDC", version: "1", chainId: 338 },
    types: { TransferWithAuthorization: [...] },
    message: {
      from: wallet.address,
      to: paymentRequirements.payTo,
      value: paymentRequirements.maxAmountRequired,
      validBefore: Math.floor(Date.now() / 1000) + 300,
      nonce: crypto.randomBytes(32),
    },
  });

  // 3. Retry with payment header
  const paymentPayload = btoa(JSON.stringify({
    x402Version: 1,
    scheme: "exact",
    network: "cronos-testnet",
    payload: { ...signedData, signature },
  }));

  const data = await fetch(url, {
    headers: {
      "X-PAYMENT": paymentPayload,
      "X-PAYMENT-ID": paymentId,
    },
  }).then(r => r.json());

  console.log("BTC Price:", data);
}`}</code>
            </pre>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Why x402 for Agents?</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "No API Keys",
                description: "No registration, no rate limits, no account management. Just pay and access.",
                icon: Shield,
              },
              {
                title: "Gasless Payments",
                description: "EIP-3009 signatures mean agents don't need native gas tokens to pay.",
                icon: Zap,
              },
              {
                title: "Instant Settlement",
                description: "Cronos Facilitator settles payments in seconds, not minutes.",
                icon: Clock,
              },
              {
                title: "Autonomous Operation",
                description: "Agents can independently discover and pay for APIs without human intervention.",
                icon: Bot,
              },
              {
                title: "Transparent Pricing",
                description: "Every endpoint publishes its price. No hidden fees or overage charges.",
                icon: CheckCircle2,
              },
              {
                title: "Universal Standard",
                description: "x402 is an open protocol. Works with any wallet, any chain supporting EIP-3009.",
                icon: Globe,
              },
            ].map((item, i) => (
              <Card key={i}>
                <CardHeader>
                  <item.icon className="w-6 h-6 text-[#10E46C] mb-2" />
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available API Endpoints</CardTitle>
            <CardDescription>
              Premium data APIs your agents can access right now
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Endpoint</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-right py-3 px-4">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { endpoint: "/proxy/binance/ticker/btc", desc: "Bitcoin price", price: "0.001" },
                    { endpoint: "/proxy/binance/ticker/eth", desc: "Ethereum price", price: "0.001" },
                    { endpoint: "/proxy/binance/ticker/all", desc: "All crypto prices", price: "0.005" },
                    { endpoint: "/proxy/crypto-com/instruments", desc: "Trading instruments", price: "0.0005" },
                    { endpoint: "/proxy/premium/market-depth", desc: "Order book (100 levels)", price: "0.05" },
                    { endpoint: "/proxy/premium/recent-trades", desc: "500 recent trades", price: "0.03" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{row.endpoint}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.desc}</td>
                      <td className="py-3 px-4 text-right font-mono">{row.price} USDC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4 py-8">
          <h2 className="text-2xl font-bold">Ready to Build?</h2>
          <p className="text-muted-foreground">
            Test the payment flow in our interactive playground or start integrating today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <a href="/dashboard">Open Dashboard</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/market">View Market Data</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
