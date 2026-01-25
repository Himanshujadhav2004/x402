"use client";

import { useState, useEffect, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWebSocket, type PaymentReceivedEvent } from "@/hooks/useWebSocket";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Loader2,
  DollarSign,
  Activity,
  Clock,
  TrendingUp,
  ExternalLink,
  Zap,
  AlertTriangle,
  Gauge,
  Wifi,
  WifiOff,
  Bell,
  Download,
  Eye,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/analytics`;

const DEMO_MERCHANT_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f5BB0a";

interface AnalyticsData {
  summary: {
    totalRequests: number;
    successfulRequests: number;
    totalRevenue: string;
    avgLatency: number;
    totalEndpoints: number;
    activeEndpoints: number;
    errorRate?: string;
    successRate?: string;
  };
  latencyPercentiles?: {
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
  errorBreakdown?: Array<{
    status: string;
    count: number;
    label: string;
  }>;
  recentTransactions: Array<{
    _id: string;
    endpointId: {
      service: string;
      route: string;
      chainId: number;
    };
    invoiceId: {
      txHash: string;
      paymentId: string;
    };
    revenue: string;
    latencyMs: number;
    createdAt: string;
    explorerUrl: string;
  }>;
  dailyRevenue: Array<{
    _id: string;
    revenue: number;
    requests: number;
  }>;
  endpointStats: Array<{
    _id: string;
    service: string;
    route: string;
    totalRequests: number;
    successfulRequests: number;
    revenue: number;
    avgLatency: number;
    enabled: boolean;
  }>;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  requests: {
    label: "Requests",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function AnalyticsDashboard() {
  const account = useActiveAccount();
  const walletAddress = account?.address;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [livePayment, setLivePayment] = useState<PaymentReceivedEvent["data"] | null>(null);
  const [demoMode, setDemoMode] = useState(true);

  const effectiveWallet = demoMode ? DEMO_MERCHANT_WALLET : walletAddress;

  const handlePaymentReceived = useCallback((event: PaymentReceivedEvent) => {
    setLivePayment(event.data);

    setTimeout(() => setLivePayment(null), 5000);

    if (effectiveWallet) {
      fetchAnalyticsData(effectiveWallet);
    }
  }, [effectiveWallet]);

  const { isConnected } = useWebSocket({
    walletAddress: effectiveWallet,
    onPaymentReceived: handlePaymentReceived,
  });

  useEffect(() => {
    if (effectiveWallet) {
      fetchAnalyticsData(effectiveWallet);
    } else {
      setLoading(false);
    }
  }, [effectiveWallet]);

  const fetchAnalyticsData = async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_BASE_URL, {
        headers: {
          "x-wallet-address": address.toLowerCase(),
        },
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Failed to fetch analytics");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = () => {
    if (effectiveWallet) {
      fetchAnalyticsData(effectiveWallet);
    }
  };

  const handleExportCSV = async () => {
    if (!effectiveWallet) return;

    try {
      const response = await fetch(`${API_BASE_URL}/export`, {
        headers: {
          "x-wallet-address": effectiveWallet.toLowerCase(),
        },
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : "atomx-payments.csv";

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const formatUSDC = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `$${(num / 1_000_000).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!walletAddress && !demoMode) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Activity className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Connect your wallet to view analytics</p>
        <Button variant="outline" onClick={() => setDemoMode(true)}>
          <Eye className="h-4 w-4 mr-2" />
          View Demo Analytics
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const successRate = data?.summary.successRate
    ? parseFloat(data.summary.successRate)
    : data?.summary.totalRequests
      ? ((data.summary.successfulRequests / data.summary.totalRequests) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {livePayment && (
        <div className="animate-in slide-in-from-top-2 duration-300 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-green-500 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-green-600">New Payment Received!</p>
            <p className="text-sm text-muted-foreground">
              {livePayment.formattedRevenue} for {livePayment.service}/{livePayment.route}
            </p>
          </div>
          <a
            href={`https://explorer.cronos.org/testnet/tx/${livePayment.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-600 hover:underline flex items-center gap-1"
          >
            View TX <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {demoMode && (
        <div className="bg-[#10E46C]/10 border border-[#10E46C]/30 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#10E46C]" />
            <span className="text-sm font-medium">Demo Mode</span>
            <span className="text-sm text-muted-foreground">
              Viewing analytics for demo endpoints
            </span>
          </div>
          {walletAddress && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDemoMode(false)}
              className="text-xs"
            >
              <User className="h-3 w-3 mr-1" />
              View My Analytics
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            {demoMode
              ? "Viewing demo endpoints performance and revenue"
              : "Monitor your API endpoint performance and revenue"
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={demoMode ? "default" : "outline"}
            size="sm"
            onClick={() => setDemoMode(!demoMode)}
            className={demoMode ? "bg-[#10E46C] hover:bg-[#10E46C]/90 text-black" : ""}
          >
            <Eye className="h-4 w-4 mr-1" />
            {demoMode ? "Demo" : "Demo Off"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUSDC(data?.summary.totalRevenue || "0")}
            </div>
            <p className="text-xs text-muted-foreground">USDC on Cronos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.totalRequests || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.summary.successfulRequests || 0} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Payment conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.avgLatency || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Latency Percentiles (24h)
            </CardTitle>
            <CardDescription>Response time distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.latencyPercentiles && data.latencyPercentiles.p50 > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {data.latencyPercentiles.p50}ms
                    </div>
                    <div className="text-xs text-muted-foreground">P50 (Median)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {data.latencyPercentiles.p95}ms
                    </div>
                    <div className="text-xs text-muted-foreground">P95</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {data.latencyPercentiles.p99}ms
                    </div>
                    <div className="text-xs text-muted-foreground">P99</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground border-t pt-3">
                  <span>Min: {data.latencyPercentiles.min}ms</span>
                  <span>Max: {data.latencyPercentiles.max}ms</span>
                </div>
              </div>
            ) : (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                No latency data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Request Status Breakdown
            </CardTitle>
            <CardDescription>Distribution by status type</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.errorBreakdown && data.errorBreakdown.length > 0 ? (
              <div className="space-y-3">
                {data.errorBreakdown.map((item) => {
                  const totalErrors = data.errorBreakdown!.reduce((sum, e) => sum + e.count, 0);
                  const percentage = totalErrors > 0 ? (item.count / totalErrors) * 100 : 0;
                  const isError = item.status !== "402_RETURNED";
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={isError ? "text-red-600" : "text-muted-foreground"}>
                          {item.label}
                        </span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isError ? "bg-red-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                No error data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Last 7 Days)</CardTitle>
            <CardDescription>Daily revenue in USDC</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.dailyRevenue && data.dailyRevenue.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px]">
                <AreaChart data={data.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="_id"
                    tickFormatter={formatShortDate}
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}`}
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    fillOpacity={0.3}
                    stroke="var(--color-revenue)"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No revenue data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests (Last 7 Days)</CardTitle>
            <CardDescription>Daily request volume</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.dailyRevenue && data.dailyRevenue.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px]">
                <BarChart data={data.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="_id"
                    tickFormatter={formatShortDate}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="requests"
                    fill="var(--color-requests)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No request data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Endpoint Performance</CardTitle>
          <CardDescription>Stats per registered endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.endpointStats && data.endpointStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Avg Latency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.endpointStats.map((stat) => (
                  <TableRow key={stat._id}>
                    <TableCell>
                      <div className="font-medium">{stat.service}</div>
                      <div className="text-sm text-muted-foreground">
                        /{stat.route}
                      </div>
                    </TableCell>
                    <TableCell>{stat.totalRequests}</TableCell>
                    <TableCell>{stat.successfulRequests}</TableCell>
                    <TableCell>{formatUSDC(stat.revenue)}</TableCell>
                    <TableCell>{Math.round(stat.avgLatency || 0)}ms</TableCell>
                    <TableCell>
                      <Badge variant={stat.enabled ? "default" : "secondary"}>
                        {stat.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No endpoints registered yet
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest paid API calls</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentTransactions && data.recentTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>TX Hash</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell>
                      <div className="font-medium">
                        {tx.endpointId?.service || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        /{tx.endpointId?.route || ""}
                      </div>
                    </TableCell>
                    <TableCell>{formatUSDC(tx.revenue || "0")}</TableCell>
                    <TableCell>{tx.latencyMs}ms</TableCell>
                    <TableCell>
                      {tx.explorerUrl ? (
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline font-mono text-xs"
                        >
                          {tx.invoiceId?.txHash?.slice(0, 10)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No paid transactions yet</p>
              <p className="text-sm">
                Transactions will appear here once agents start paying for API calls
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
