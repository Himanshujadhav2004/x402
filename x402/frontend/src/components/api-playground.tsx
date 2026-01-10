"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Wallet,
  ExternalLink,
  Zap,
  DollarSign,
  Clock,
  AlertCircle,
  Send,
  FileJson
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const EIP712_DOMAIN = {
  name: "Bridged USDC (Stargate)",
  version: "1",
  chainId: 338,
  verifyingContract: "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0" as `0x${string}`,
};

const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

interface Endpoint {
  id: string;
  service: string;
  route: string;
  fullPath: string;
  description: string;
  pricing: {
    amount: string;
    formatted: string;
    token: string;
    tokenAddress: string;
  };
  network: {
    chainId: number;
    name: string;
  };
  merchant: string;
}

interface PaymentRequirements {
  scheme: string;
  network: string;
  payTo: string;
  asset: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
  description: string;
  mimeType: string;
}

interface Invoice402Response {
  paymentId: string;
  paymentRequirements: PaymentRequirements;
}

type FlowStep = "idle" | "requesting" | "got402" | "signing" | "paying" | "success" | "error";

export function ApiPlayground() {
  const account = useActiveAccount();
  const walletAddress = account?.address;

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<Invoice402Response | null>(null);
  const [httpMethod, setHttpMethod] = useState<"GET" | "POST">("GET");
  const [requestBody, setRequestBody] = useState<string>("");

  useEffect(() => {
    async function loadEndpoints() {
      try {
        const res = await fetch(`${API_URL}/api/discover`);
        const data = await res.json();
        if (data.success && data.endpoints) {
          setEndpoints(data.endpoints || []);
          if (data.endpoints?.length > 0) {
            setSelectedEndpoint(data.endpoints[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load endpoints:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEndpoints();
  }, []);

  const generateNonce = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const getMetaMaskProvider = (): any => {
    if (typeof window === "undefined" || !window.ethereum) return null;

    if (window.ethereum.providers?.length) {
      const metaMask = window.ethereum.providers.find((p: any) => p.isMetaMask && !p.isPhantom);
      if (metaMask) return metaMask;
    }

    if (window.ethereum.isMetaMask && !window.ethereum.isPhantom) {
      return window.ethereum;
    }

    return null;
  };

  const ensureCronosTestnet = async (provider: any) => {
    if (!provider) return;

    const chainId = await provider.request({ method: "eth_chainId" });
    if (chainId !== "0x152") { // 338 in hex
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x152" }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x152",
              chainName: "Cronos Testnet",
              nativeCurrency: { name: "Test CRO", symbol: "TCRO", decimals: 18 },
              rpcUrls: ["https://evm-t3.cronos.org"],
              blockExplorerUrls: ["https://explorer.cronos.org/testnet"],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }
  };

  const executePaymentFlow = async () => {
    if (!walletAddress || !selectedEndpoint) return;

    const provider = getMetaMaskProvider();
    if (!provider) {
      setError("MetaMask not found. Please install MetaMask to use this feature.");
      return;
    }

    const endpoint = endpoints.find(e => e.id === selectedEndpoint);
    if (!endpoint) return;

    setFlowStep("requesting");
    setError(null);
    setResult(null);
    setTxHash(null);
    setInvoiceData(null);

    try {
      await ensureCronosTestnet(provider);

      const apiUrl = `${API_URL}${endpoint.fullPath}`;
      const fetchOptions1: RequestInit = { method: httpMethod };
      if (httpMethod === "POST" && requestBody.trim()) {
        fetchOptions1.headers = { "Content-Type": "application/json" };
        fetchOptions1.body = requestBody;
      }
      const response1 = await fetch(apiUrl, fetchOptions1);

      if (response1.status !== 402) {
        const data = await response1.json();
        setResult(data);
        setFlowStep("success");
        return;
      }

      setFlowStep("got402");
      const invoice: Invoice402Response = await response1.json();
      setInvoiceData(invoice);

      await new Promise(r => setTimeout(r, 500)); // Visual delay

      setFlowStep("signing");

      const nonce = generateNonce();
      const validAfter = 0n;
      const validBefore = BigInt(Math.floor(Date.now() / 1000) + 300);

      const signature = await provider.request({
        method: "eth_signTypedData_v4",
        params: [
          walletAddress,
          JSON.stringify({
            types: {
              EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" },
              ],
              ...TRANSFER_WITH_AUTHORIZATION_TYPES,
            },
            primaryType: "TransferWithAuthorization",
            domain: EIP712_DOMAIN,
            message: {
              from: walletAddress,
              to: invoice.paymentRequirements.payTo,
              value: invoice.paymentRequirements.maxAmountRequired,
              validAfter: "0",
              validBefore: validBefore.toString(),
              nonce,
            },
          }),
        ],
      });

      setFlowStep("paying");

      const paymentPayload = {
        x402Version: 1,
        scheme: "exact",
        network: invoice.paymentRequirements.network,
        payload: {
          from: walletAddress,
          to: invoice.paymentRequirements.payTo,
          value: invoice.paymentRequirements.maxAmountRequired,
          validAfter: 0,
          validBefore: Number(validBefore),
          nonce,
          signature,
          asset: invoice.paymentRequirements.asset,
        },
      };

      const paymentHeader = btoa(JSON.stringify(paymentPayload));

      const fetchOptions2: RequestInit = {
        method: httpMethod,
        headers: {
          "X-PAYMENT": paymentHeader,
          "X-PAYMENT-ID": invoice.paymentId,
          ...(httpMethod === "POST" && requestBody.trim() ? { "Content-Type": "application/json" } : {}),
        },
      };
      if (httpMethod === "POST" && requestBody.trim()) {
        fetchOptions2.body = requestBody;
      }
      const response2 = await fetch(apiUrl, fetchOptions2);

      const txHashHeader = response2.headers.get("X-Payment-TxHash");
      if (txHashHeader) {
        setTxHash(txHashHeader);
      }

      const data = await response2.json();
      setResult(data);
      setFlowStep(response2.ok ? "success" : "error");

    } catch (err: any) {
      console.error("Payment flow error:", err);
      setError(err.message || "Payment failed");
      setFlowStep("error");
    }
  };

  const selectedEndpointData = endpoints.find(e => e.id === selectedEndpoint);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Playground</h2>
          <p className="text-muted-foreground">
            Test x402 payment flow with real on-chain USDC payments
          </p>
        </div>
        {walletAddress && (
          <Badge variant="outline" className="font-mono">
            <Wallet className="w-3 h-3 mr-1" />
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </Badge>
        )}
      </div>

      {!walletAddress && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="font-medium">Wallet not connected</p>
              <p className="text-sm text-muted-foreground">
                Connect your wallet using the button in the navbar to test the payment flow
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Select API Endpoint
            </CardTitle>
            <CardDescription>
              Choose an endpoint to test the payment flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : endpoints.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No endpoints available. Check backend connection.
              </div>
            ) : (
              <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an endpoint" />
                </SelectTrigger>
                <SelectContent>
                  {endpoints.some(ep => ep.merchant?.toLowerCase() === walletAddress?.toLowerCase()) && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-green-500 bg-green-500/10 rounded mx-1 mb-1">
                      🏪 Your Merchant APIs
                    </div>
                  )}
                  {endpoints
                    .filter(ep => ep.merchant?.toLowerCase() === walletAddress?.toLowerCase())
                    .map((ep) => (
                      <SelectItem key={ep.id} value={ep.id} className="border-l-2 border-green-500">
                        {ep.service}/{ep.route} ({ep.pricing.formatted})
                      </SelectItem>
                    ))}

                  {endpoints.some(ep => ep.merchant?.toLowerCase() !== walletAddress?.toLowerCase()) && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-blue-500 bg-blue-500/10 rounded mx-1 mb-1 mt-2">
                      🤖 Demo APIs
                    </div>
                  )}
                  {endpoints
                    .filter(ep => ep.merchant?.toLowerCase() !== walletAddress?.toLowerCase())
                    .map((ep) => (
                      <SelectItem key={ep.id} value={ep.id}>
                        {ep.service}/{ep.route} ({ep.pricing.formatted})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}

            {selectedEndpointData && (
              <div className={`rounded-lg border p-4 space-y-2 ${
                selectedEndpointData.merchant?.toLowerCase() === walletAddress?.toLowerCase()
                  ? "border-green-500/50 bg-green-500/5"
                  : ""
              }`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{selectedEndpointData.description}</div>
                  {selectedEndpointData.merchant?.toLowerCase() === walletAddress?.toLowerCase() && (
                    <Badge className="bg-green-500 text-white text-xs">Your API</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {selectedEndpointData.pricing.formatted}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    300s timeout
                  </span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {selectedEndpointData.fullPath}
                </div>
                {selectedEndpointData.merchant?.toLowerCase() === walletAddress?.toLowerCase() && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                    💰 Payments for this API go to your wallet
                  </div>
                )}
              </div>
            )}

            {selectedEndpointData && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">HTTP Method:</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={httpMethod === "GET" ? "default" : "outline"}
                      onClick={() => setHttpMethod("GET")}
                      className="h-7 px-3"
                    >
                      GET
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={httpMethod === "POST" ? "default" : "outline"}
                      onClick={() => setHttpMethod("POST")}
                      className="h-7 px-3"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      POST
                    </Button>
                  </div>
                </div>

                {httpMethod === "POST" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <FileJson className="w-4 h-4" />
                      Request Body (JSON)
                    </Label>
                    <Textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder={`{\n  "contents": [{\n    "parts": [{"text": "Hello, what is 2+2?"}]\n  }]\n}`}
                      className="font-mono text-xs min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      For Gemini API, use the format above. Your API key is injected automatically via secret headers.
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={executePaymentFlow}
              disabled={!walletAddress || !selectedEndpoint || (flowStep !== "idle" && flowStep !== "success" && flowStep !== "error")}
              className="w-full"
              size="lg"
            >
              {flowStep === "idle" || flowStep === "success" || flowStep === "error" ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Execute Payment Flow
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Flow Status</CardTitle>
            <CardDescription>
              Watch the x402 protocol in action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <FlowStepItem
                step={1}
                title="Request API"
                description="Send GET request to protected endpoint"
                status={getStepStatus(flowStep, ["requesting", "got402", "signing", "paying", "success"])}
              />
              <FlowStepItem
                step={2}
                title="Receive 402"
                description="Get payment requirements"
                status={getStepStatus(flowStep, ["got402", "signing", "paying", "success"])}
                extra={invoiceData && (
                  <span className="text-xs text-muted-foreground">
                    Pay {Number(invoiceData.paymentRequirements.maxAmountRequired) / 1e6} USDC
                  </span>
                )}
              />
              <FlowStepItem
                step={3}
                title="Sign Authorization"
                description="Sign EIP-3009 transferWithAuthorization"
                status={getStepStatus(flowStep, ["signing", "paying", "success"])}
              />
              <FlowStepItem
                step={4}
                title="Send Payment"
                description="Submit payment header and settle on-chain"
                status={getStepStatus(flowStep, ["paying", "success"])}
              />
              <FlowStepItem
                step={5}
                title="Receive Response"
                description="Get API data after payment settles"
                status={flowStep === "success" ? "complete" : flowStep === "error" ? "error" : "pending"}
              />
            </div>

            {txHash && (
              <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Payment Settled On-Chain
                </div>
                <a
                  href={`https://explorer.cronos.org/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:underline flex items-center gap-1 mt-1"
                >
                  {txHash.slice(0, 20)}...
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" />
                  {error}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {flowStep === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              API Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getStepStatus(
  currentFlow: FlowStep,
  activeSteps: FlowStep[]
): "pending" | "active" | "complete" | "error" {
  if (currentFlow === "error") return "error";
  if (currentFlow === "idle") return "pending";
  if (activeSteps.includes(currentFlow)) {
    const index = activeSteps.indexOf(currentFlow);
    return index === 0 ? "active" : "complete";
  }
  return "pending";
}

function FlowStepItem({
  step,
  title,
  description,
  status,
  extra
}: {
  step: number;
  title: string;
  description: string;
  status: "pending" | "active" | "complete" | "error";
  extra?: React.ReactNode;
}) {
  return (
    <div className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
      status === "active" ? "bg-blue-500/10" :
      status === "complete" ? "bg-green-500/10" :
      status === "error" ? "bg-red-500/10" : ""
    }`}>
      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
        status === "complete" ? "bg-green-500 text-white" :
        status === "active" ? "bg-blue-500 text-white" :
        status === "error" ? "bg-red-500 text-white" :
        "bg-muted text-muted-foreground"
      }`}>
        {status === "complete" ? "✓" : status === "active" ? <Loader2 className="w-3 h-3 animate-spin" /> : step}
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
        {extra}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
      isPhantom?: boolean;
      providers?: Array<{
        request: (args: { method: string; params?: any[] }) => Promise<any>;
        isMetaMask?: boolean;
        isPhantom?: boolean;
      }>;
    };
  }
}
