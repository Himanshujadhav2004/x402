"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Plus, Pencil, Trash2, Power, Loader2, ExternalLink, Key, X, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";

interface SecretHeader {
  key: string;
  value: string;
}

interface Endpoint {
  _id: string;
  service: string;
  route: string;
  upstreamUrl: string;
  priceAmount: string;
  tokenAddress: string;
  merchantWallet: string;
  description?: string;
  chainId: number;
  enabled: boolean;
  secretHeaders?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/endpoints`;

export function EndpointRegistry() {
  const account = useActiveAccount();
  const walletAddress = account?.address;

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const USDC_ADDRESS = "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0";

  const [formData, setFormData] = useState({
    service: "",
    route: "",
    upstreamUrl: "",
    priceAmount: "",
    tokenAddress: USDC_ADDRESS,
    description: "",
    chainId: "338",
  });

  const [secretHeaders, setSecretHeaders] = useState<SecretHeader[]>([]);
  const [showSecretValues, setShowSecretValues] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      fetchEndpoints();
    } else {
      setLoading(false);
      setEndpoints([]);
    }
  }, [walletAddress]);

  const fetchEndpoints = async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      const response = await fetch(API_BASE_URL, {
        headers: {
          "x-wallet-address": walletAddress.toLowerCase(),
        },
      });
      const result = await response.json();
      if (result.success) {
        setEndpoints(result.data || []);
      } else {
        toast.error(result.message || "Failed to fetch endpoints");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch endpoints");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const secretHeadersObj: Record<string, string> = {};
      secretHeaders.forEach(h => {
        if (h.key.trim() && h.value.trim()) {
          secretHeadersObj[h.key.trim()] = h.value.trim();
        }
      });

      const payload = {
        ...formData,
        merchantWallet: walletAddress.toLowerCase(),
        chainId: parseInt(formData.chainId) || 338,
        secretHeaders: secretHeadersObj,
      };

      const url = editingEndpoint 
        ? `${API_BASE_URL}/${editingEndpoint._id}`
        : API_BASE_URL;
      
      const method = editingEndpoint ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": walletAddress.toLowerCase(),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          editingEndpoint 
            ? "Endpoint updated successfully" 
            : "Endpoint created successfully"
        );
        setSheetOpen(false);
        resetForm();
        fetchEndpoints();
      } else {
        toast.error(result.message || "Operation failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!confirm("Are you sure you want to delete this endpoint?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: {
          "x-wallet-address": walletAddress.toLowerCase(),
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Endpoint deleted successfully");
        fetchEndpoints();
      } else {
        toast.error(result.message || "Failed to delete endpoint");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete endpoint");
    }
  };

  const handleToggle = async (id: string) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}/toggle`, {
        method: "PATCH",
        headers: {
          "x-wallet-address": walletAddress.toLowerCase(),
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          result.data.enabled 
            ? "Endpoint enabled" 
            : "Endpoint disabled"
        );
        fetchEndpoints();
      } else {
        toast.error(result.message || "Failed to toggle endpoint");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle endpoint");
    }
  };

  const handleEdit = (endpoint: Endpoint) => {
    setEditingEndpoint(endpoint);
    setFormData({
      service: endpoint.service,
      route: endpoint.route,
      upstreamUrl: endpoint.upstreamUrl,
      priceAmount: endpoint.priceAmount,
      tokenAddress: endpoint.tokenAddress,
      description: endpoint.description || "",
      chainId: endpoint.chainId.toString(),
    });
    if (endpoint.secretHeaders) {
      const headers = Object.entries(endpoint.secretHeaders).map(([key, value]) => ({
        key,
        value,
      }));
      setSecretHeaders(headers);
    } else {
      setSecretHeaders([]);
    }
    setSheetOpen(true);
  };

  const resetForm = () => {
    setFormData({
      service: "",
      route: "",
      upstreamUrl: "",
      priceAmount: "",
      tokenAddress: USDC_ADDRESS,
      description: "",
      chainId: "338",
    });
    setSecretHeaders([]);
    setShowSecretValues(false);
    setEditingEndpoint(null);
  };

  const addSecretHeader = () => {
    setSecretHeaders([...secretHeaders, { key: "", value: "" }]);
  };

  const removeSecretHeader = (index: number) => {
    setSecretHeaders(secretHeaders.filter((_, i) => i !== index));
  };

  const updateSecretHeader = (index: number, field: "key" | "value", value: string) => {
    const updated = [...secretHeaders];
    updated[index][field] = value;
    setSecretHeaders(updated);
  };

  const handleSheetClose = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (!walletAddress) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Endpoint Registry</h2>
            <p className="text-muted-foreground">
              Manage your API endpoints and configurations
            </p>
          </div>
        </div>
       
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Endpoint Registry</h2>
          <p className="text-muted-foreground">
            Manage your API endpoints and configurations
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
          <SheetTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Endpoint
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {editingEndpoint ? "Edit Endpoint" : "Create New Endpoint"}
              </SheetTitle>
              <SheetDescription>
                {editingEndpoint
                  ? "Update your endpoint configuration below."
                  : "Fill in the details to create a new endpoint."}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service *</Label>
                  <Input
                    id="service"
                    value={formData.service}
                    onChange={(e) =>
                      setFormData({ ...formData, service: e.target.value })
                    }
                    placeholder="crypto-data"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route">Route *</Label>
                  <Input
                    id="route"
                    value={formData.route}
                    onChange={(e) =>
                      setFormData({ ...formData, route: e.target.value })
                    }
                    placeholder="price"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upstreamUrl">Upstream URL *</Label>
                <Input
                  id="upstreamUrl"
                  value={formData.upstreamUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, upstreamUrl: e.target.value })
                  }
                  placeholder="https://api.example.com/data"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceAmount">Price Amount *</Label>
                  <Input
                    id="priceAmount"
                    type="number"
                    value={formData.priceAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, priceAmount: e.target.value })
                    }
                    placeholder="20000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chainId">Chain ID</Label>
                  <Input
                    id="chainId"
                    type="number"
                    value={formData.chainId}
                    onChange={(e) =>
                      setFormData({ ...formData, chainId: e.target.value })
                    }
                    placeholder="338"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenAddress">Token Address *</Label>
                <Input
                  id="tokenAddress"
                  value={formData.tokenAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, tokenAddress: e.target.value })
                  }
                  placeholder="0x..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchantWallet">Merchant Wallet</Label>
                <Input
                  id="merchantWallet"
                  value={walletAddress}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Automatically set to your connected wallet
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>

              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-[#10E46C]" />
                    <Label className="font-medium">Secret Headers (API Keys)</Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecretValues(!showSecretValues)}
                  >
                    {showSecretValues ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add API keys or auth headers that will be injected into upstream requests.
                  <span className="text-[#10E46C]"> Agents never see these values.</span>
                </p>
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border">
                  <strong>Examples:</strong>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li><code className="text-[#10E46C]">x-goog-api-key</code> → Your Gemini API key</li>
                    <li><code className="text-[#10E46C]">Authorization</code> → Bearer sk-xxx (OpenAI)</li>
                    <li><code className="text-[#10E46C]">X-API-Key</code> → Your custom API key</li>
                  </ul>
                </div>

                {secretHeaders.length > 0 && (
                  <div className="space-y-2">
                    {secretHeaders.map((header, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="x-goog-api-key"
                          value={header.key}
                          onChange={(e) => updateSecretHeader(index, "key", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="AIza... (your API key)"
                          type={showSecretValues ? "text" : "password"}
                          value={header.value}
                          onChange={(e) => updateSecretHeader(index, "value", e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSecretHeader(index)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSecretHeader}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Secret Header
                </Button>

                {secretHeaders.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background p-2 rounded">
                    <Shield className="h-3 w-3 text-[#10E46C]" />
                    <span>{secretHeaders.length} secret header(s) configured - encrypted at rest</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingEndpoint ? "Update" : "Create"} Endpoint
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSheetClose(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : endpoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg">
          <p className="text-muted-foreground mb-4">No endpoints found</p>
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Endpoint
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service / Route</TableHead>
                <TableHead>Upstream URL</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((endpoint) => (
                <TableRow key={endpoint._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {endpoint.service}
                        {endpoint.secretHeaders && Object.keys(endpoint.secretHeaders).length > 0 && (
                          <span title="Has secret headers (API keys)">
                            <Key className="h-3 w-3 text-[#10E46C]" />
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        /{endpoint.route}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-xs truncate">
                      <span className="truncate">{endpoint.upstreamUrl}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">{endpoint.priceAmount}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={endpoint.enabled ? "default" : "secondary"}>
                      {endpoint.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggle(endpoint._id)}
                        title={endpoint.enabled ? "Disable" : "Enable"}
                      >
                        <Power
                          className={`h-4 w-4 ${
                            endpoint.enabled ? "text-green-500" : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(endpoint)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(endpoint._id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}