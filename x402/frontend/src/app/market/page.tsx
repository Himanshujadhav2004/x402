"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, RefreshCw, Zap, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PriceData {
  symbol: string;
  price: string;
  change24h?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function MarketPage() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT"];
      const responses = await Promise.all(
        symbols.map(s =>
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}`)
            .then(r => r.json())
            .catch(() => null)
        )
      );

      const priceData: PriceData[] = responses
        .filter(r => r !== null)
        .map(r => ({
          symbol: r.symbol.replace("USDT", ""),
          price: parseFloat(r.lastPrice).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: r.lastPrice < 1 ? 6 : 2
          }),
          change24h: parseFloat(r.priceChangePercent),
        }));

      setPrices(priceData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-[#10E46C]">Live</span> Market Data
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time cryptocurrency prices powered by ATOMX x402 Gateway.
            AI agents pay per request to access premium market data.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchPrices} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && prices.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))
          ) : (
            prices.map((coin) => (
              <Card key={coin.symbol} className="hover:border-[#10E46C]/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">{coin.symbol}</CardTitle>
                    {coin.change24h !== undefined && (
                      <Badge
                        variant={coin.change24h >= 0 ? "default" : "destructive"}
                        className={coin.change24h >= 0 ? "bg-green-500/20 text-green-500" : ""}
                      >
                        {coin.change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{coin.symbol}/USDT</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">
                    ${coin.price}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="border-[#10E46C]/30 bg-[#10E46C]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#10E46C]" />
              Access Premium Market Data via x402
            </CardTitle>
            <CardDescription>
              AI agents can access this data programmatically by paying per request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-background border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[#10E46C]" />
                  <span className="font-medium">BTC Price</span>
                </div>
                <code className="text-xs text-muted-foreground">
                  GET /proxy/binance/ticker/btc
                </code>
                <div className="text-sm mt-2">0.001 USDC/request</div>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[#10E46C]" />
                  <span className="font-medium">All Prices</span>
                </div>
                <code className="text-xs text-muted-foreground">
                  GET /proxy/binance/ticker/all
                </code>
                <div className="text-sm mt-2">0.005 USDC/request</div>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[#10E46C]" />
                  <span className="font-medium">Order Book</span>
                </div>
                <code className="text-xs text-muted-foreground">
                  GET /proxy/premium/market-depth
                </code>
                <div className="text-sm mt-2">0.05 USDC/request</div>
              </div>
            </div>
            <div className="flex gap-4">
              <Button asChild>
                <a href="/dashboard">Try API Playground</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/agents">Agent Integration Guide</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
