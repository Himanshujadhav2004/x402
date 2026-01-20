import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { cronosTestnet } from "viem/chains";
import crypto from "crypto";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8080";
const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY as `0x${string}`;

const USDC_ADDRESS = "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0" as const;

const EIP712_DOMAIN = {
  name: "Bridged USDC (Stargate)",
  version: "1",
  chainId: 338,
  verifyingContract: USDC_ADDRESS,
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

interface PaymentRequirements {
  scheme: string;
  network: string;
  payTo: string;
  asset: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
}

interface Invoice402Response {
  success: boolean;
  error: string;
  x402Version: number;
  paymentId: string;
  paymentRequirements: PaymentRequirements;
  expiresAt: string;
  endpoint: {
    service: string;
    route: string;
    description: string;
  };
}

async function main() {
  console.log("=".repeat(60));
  console.log("x402 Agent Demo - Cronos Testnet");
  console.log("=".repeat(60));
  console.log();

  if (!PRIVATE_KEY) {
    console.error("Error: AGENT_PRIVATE_KEY environment variable required");
    console.log("Usage: AGENT_PRIVATE_KEY=0x... npm run demo");
    process.exit(1);
  }

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`Agent Wallet: ${account.address}`);

  const walletClient = createWalletClient({
    account,
    chain: cronosTestnet,
    transport: http("https://evm-t3.cronos.org"),
  });

  const publicClient = createPublicClient({
    chain: cronosTestnet,
    transport: http("https://evm-t3.cronos.org"),
  });

  const usdcAbi = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ]);

  const balance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: [account.address],
  });

  console.log(`USDC Balance: ${Number(balance) / 1e6} USDC`);
  console.log();

  console.log("=".repeat(60));
  console.log("Step 1: Requesting protected resource (expecting 402)");
  console.log("=".repeat(60));

  const resourceUrl = `${GATEWAY_URL}/proxy/crypto-data/price?ids=bitcoin,ethereum&vs_currencies=usd`;
  console.log(`URL: ${resourceUrl}`);
  console.log();

  const response1 = await fetch(resourceUrl);
  console.log(`Status: ${response1.status} ${response1.statusText}`);

  if (response1.status !== 402) {
    console.log("Unexpected response (not 402):");
    console.log(await response1.text());
    return;
  }

  const invoiceData: Invoice402Response = await response1.json();
  console.log();
  console.log("Received x402 Invoice:");
  console.log(JSON.stringify(invoiceData, null, 2));
  console.log();

  const { paymentId, paymentRequirements } = invoiceData;

  const requiredAmount = BigInt(paymentRequirements.maxAmountRequired);
  if (balance < requiredAmount) {
    console.error(`Insufficient balance: have ${balance}, need ${requiredAmount}`);
    console.log("Get testnet USDC from a faucet or swap");
    return;
  }

  console.log("=".repeat(60));
  console.log("Step 2: Signing EIP-3009 authorization");
  console.log("=".repeat(60));

  const nonce = `0x${crypto.randomBytes(32).toString("hex")}` as `0x${string}`;
  const validAfter = 0n;
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 300);

  console.log(`Nonce: ${nonce}`);
  console.log(`Amount: ${Number(requiredAmount) / 1e6} USDC`);
  console.log(`Recipient: ${paymentRequirements.payTo}`);
  console.log(`Valid Before: ${new Date(Number(validBefore) * 1000).toISOString()}`);
  console.log();

  const signature = await walletClient.signTypedData({
    domain: EIP712_DOMAIN,
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization",
    message: {
      from: account.address,
      to: paymentRequirements.payTo as `0x${string}`,
      value: requiredAmount,
      validAfter,
      validBefore,
      nonce,
    },
  });

  console.log(`Signature: ${signature.slice(0, 20)}...`);
  console.log();

  console.log("=".repeat(60));
  console.log("Step 3: Building X-PAYMENT header");
  console.log("=".repeat(60));

  const paymentPayload = {
    x402Version: 1,
    scheme: "exact",
    network: paymentRequirements.network,
    payload: {
      from: account.address,
      to: paymentRequirements.payTo,
      value: paymentRequirements.maxAmountRequired,
      validAfter: Number(validAfter),
      validBefore: Number(validBefore),
      nonce,
      signature,
      asset: paymentRequirements.asset,
    },
  };

  const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
  console.log(`Payment Header (Base64): ${paymentHeader.slice(0, 50)}...`);
  console.log();

  console.log("=".repeat(60));
  console.log("Step 4: Retrying request with payment header");
  console.log("=".repeat(60));

  const response2 = await fetch(resourceUrl, {
    headers: {
      "X-PAYMENT": paymentHeader,
      "X-PAYMENT-ID": paymentId,
    },
  });

  console.log(`Status: ${response2.status} ${response2.statusText}`);
  console.log();

  const txHash = response2.headers.get("X-Payment-TxHash");
  const blockNumber = response2.headers.get("X-Payment-BlockNumber");
  const explorerUrl = response2.headers.get("X-Payment-Explorer");

  if (txHash) {
    console.log("Payment Settlement:");
    console.log(`  TX Hash: ${txHash}`);
    console.log(`  Block: ${blockNumber}`);
    console.log(`  Explorer: ${explorerUrl}`);
    console.log();
  }

  const responseData = await response2.json();
  console.log("API Response:");
  console.log(JSON.stringify(responseData, null, 2));
  console.log();

  if (response2.ok) {
    console.log("=".repeat(60));
    console.log("SUCCESS! Payment completed and API data received.");
    console.log("=".repeat(60));
  } else {
    console.log("=".repeat(60));
    console.log("FAILED: Payment or request failed");
    console.log("=".repeat(60));
  }
}

main().catch(console.error);
