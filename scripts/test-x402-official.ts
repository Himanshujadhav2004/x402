import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { cronosTestnet } from "viem/chains";

import { signTransferAuthorization, createPaymentHeader } from "x402/client";
import { verifyPayment } from "x402/facilitator";

const PRIVATE_KEY = "0x66bf9a6d000a4f9be2974990b31f4845ec9f4bc1887b6ac41eaaee61b630a46e" as `0x${string}`;
const USDC_ADDRESS = "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0" as `0x${string}`;
const FACILITATOR_URL = "https://facilitator.cronoslabs.org/v2/x402";

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log("Agent:", account.address);

  const walletClient = createWalletClient({
    account,
    chain: cronosTestnet,
    transport: http("https://evm-t3.cronos.org"),
  });

  const publicClient = createPublicClient({
    chain: cronosTestnet,
    transport: http("https://evm-t3.cronos.org"),
  });

  const paymentRequirements = {
    scheme: "exact" as const,
    network: "cronos-testnet" as const,
    payTo: "0x742d35cc6634C0532925a3B844bC9e7595F5bb0A" as `0x${string}`,
    asset: USDC_ADDRESS,
    maxAmountRequired: "100000",
    maxTimeoutSeconds: 300,
    description: "Test payment",
    mimeType: "application/json",
  };

  console.log("\nPayment Requirements:", paymentRequirements);

  try {
    const paymentHeader = await createPaymentHeader(
      walletClient,
      publicClient,
      paymentRequirements
    );

    console.log("\nPayment Header created:", paymentHeader.slice(0, 50) + "...");

    const decoded = JSON.parse(Buffer.from(paymentHeader, "base64").toString());
    console.log("\nDecoded payload:", JSON.stringify(decoded, null, 2));

    console.log("\nVerifying with facilitator...");
    const response = await fetch(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X402-Version": "1",
      },
      body: JSON.stringify({
        x402Version: 1,
        paymentHeader,
        paymentRequirements,
      }),
    });

    console.log("Response Status:", response.status);
    const result = await response.text();
    console.log("Response Body:", result);

  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
