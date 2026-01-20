import { createWalletClient, http, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { cronosTestnet } from "viem/chains";
import crypto from "crypto";

const PRIVATE_KEY = "0x66bf9a6d000a4f9be2974990b31f4845ec9f4bc1887b6ac41eaaee61b630a46e" as const;
const USDC_ADDRESS = "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0" as `0x${string}`;
const FACILITATOR_URL = "https://facilitator.cronoslabs.org/v2/x402";

const EIP712_DOMAIN = {
  name: "Bridged USDC (Stargate)",
  version: "1",
  chainId: 338,
  verifyingContract: USDC_ADDRESS,
} as const;

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

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  console.log("Agent:", account.address);

  const walletClient = createWalletClient({
    account,
    chain: cronosTestnet,
    transport: http("https://evm-t3.cronos.org"),
  });

  const payTo = getAddress("0x742d35cc6634c0532925a3b844bc9e7595f5bb0a");
  const amount = "100000";

  const nonce = `0x${crypto.randomBytes(32).toString("hex")}` as `0x${string}`;
  const validAfter = 0n;
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 300);

  const signature = await walletClient.signTypedData({
    domain: EIP712_DOMAIN,
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization",
    message: {
      from: account.address,
      to: payTo as `0x${string}`,
      value: BigInt(amount),
      validAfter,
      validBefore,
      nonce,
    },
  });

  console.log("Signature:", signature);

  const r = signature.slice(0, 66);
  const s = `0x${signature.slice(66, 130)}`;
  const v = parseInt(signature.slice(130, 132), 16);
  console.log("r:", r);
  console.log("s:", s);
  console.log("v:", v);

  const paymentPayload = {
    x402Version: 1,
    scheme: "exact",
    network: "cronos-testnet",
    payload: {
      from: getAddress(account.address),
      to: getAddress(payTo),
      value: amount,
      validAfter: Number(validAfter),
      validBefore: Number(validBefore),
      nonce,
      signature,
      asset: USDC_ADDRESS,
    },
  };

  console.log("Payment payload:", JSON.stringify(paymentPayload, null, 2));

  const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

  const paymentRequirements = {
    scheme: "exact",
    network: "cronos-testnet",
    payTo: getAddress(payTo),
    asset: USDC_ADDRESS,
    maxAmountRequired: amount,
    maxTimeoutSeconds: 300,
    description: "Test payment for API access",
    mimeType: "application/json",
  };

  console.log("\nTesting /verify...");
  const verifyPayload = {
    x402Version: 1,
    paymentHeader,
    paymentRequirements,
  };

  console.log("Payload:", JSON.stringify(verifyPayload, null, 2).slice(0, 500) + "...");

  const response = await fetch(`${FACILITATOR_URL}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X402-Version": "1",
    },
    body: JSON.stringify(verifyPayload),
  });

  console.log("\nResponse Status:", response.status);
  const responseText = await response.text();
  console.log("Response Body:", responseText);
}

main().catch(console.error);
