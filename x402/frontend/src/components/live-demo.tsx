"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface PaymentRequirements {
  scheme: string;
  network: string;
  payTo: string;
  asset: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
}

interface DemoResponse {
  success: boolean;
  error?: string;
  x402Version?: number;
  paymentId?: string;
  paymentRequirements?: PaymentRequirements;
  expiresAt?: string;
  endpoint?: {
    service: string;
    route: string;
    description: string;
  };
}

export function LiveDemo() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DemoResponse | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const handleTryIt = async () => {
    setLoading(true);
    setResponse(null);
    setStatusCode(null);

    try {
      const res = await fetch(
        `${API_URL}/proxy/crypto-data/price?ids=bitcoin,ethereum&vs_currencies=usd`
      );
      setStatusCode(res.status);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        success: false,
        error: "Failed to connect to gateway. Make sure the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 px-4 bg-black text-white">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            See it <span className="text-green-500">Live</span>
          </h2>
          <p className="text-white/60 text-lg">
            Try the x402 payment flow right now
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Badge variant="secondary">1</Badge>
                Request (No Payment)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-black rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <p className="text-green-400">$ curl -X GET \</p>
                <p className="text-white/80 pl-4">
                  &quot;{API_URL}/proxy/crypto-data/price?ids=bitcoin&quot;
                </p>
              </div>

              <p className="text-white/60 text-sm">
                Call an API endpoint without payment headers. The gateway returns
                HTTP 402 with payment requirements.
              </p>

              <Button
                onClick={handleTryIt}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {loading ? "Calling..." : "Try It Live"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Badge variant="outline" className="text-orange-400 border-orange-400">
                  {statusCode || "???"}
                </Badge>
                Response
                {statusCode === 402 && (
                  <span className="text-orange-400 text-sm font-normal ml-2">
                    Payment Required
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg p-4 font-mono text-sm h-[300px] overflow-auto">
                {!response && !loading && (
                  <p className="text-white/40">
                    Click &quot;Try It Live&quot; to see the response
                  </p>
                )}
                {loading && (
                  <p className="text-white/60 animate-pulse">Loading...</p>
                )}
                {response && (
                  <pre className="text-green-400 whitespace-pre-wrap">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {response && statusCode === 402 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Payment ID</h4>
              <p className="text-white/60 text-sm font-mono truncate">
                {response.paymentId}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Amount Required</h4>
              <p className="text-white/60 text-sm">
                {response.paymentRequirements
                  ? `${Number(response.paymentRequirements.maxAmountRequired) / 1e6} USDC`
                  : "-"}
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Network</h4>
              <p className="text-white/60 text-sm">
                {response.paymentRequirements?.network || "-"}
              </p>
            </div>
          </div>
        )}

        {response && statusCode === 402 && (
          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">What Happens Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <Badge className="shrink-0">2</Badge>
                <div>
                  <p className="font-semibold text-white">Agent Signs Payment</p>
                  <p className="text-white/60 text-sm">
                    Uses EIP-3009 to sign a transferWithAuthorization
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="shrink-0">3</Badge>
                <div>
                  <p className="font-semibold text-white">Retry with X-PAYMENT</p>
                  <p className="text-white/60 text-sm">
                    Agent sends signed authorization in header
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="shrink-0">4</Badge>
                <div>
                  <p className="font-semibold text-white">Get API Response</p>
                  <p className="text-white/60 text-sm">
                    Payment settles on-chain, agent receives data
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
