

import { X402Client } from "../src";

// Load private key from environment
const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY as `0x${string}`;
const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8080";

if (!PRIVATE_KEY) {
  console.error("Error: AGENT_PRIVATE_KEY environment variable is required");
  console.error("Example: AGENT_PRIVATE_KEY=0x... npx tsx examples/basic-usage.ts");
  process.exit(1);
}

async function main() {
  console.log("=== @atomx/agent-sdk Basic Usage Example ===\n");

  
  const client = new X402Client({
    privateKey: PRIVATE_KEY,
    gatewayUrl: GATEWAY_URL,
    chainId: 338, // Cronos Testnet
    debug: true,
  });

  console.log("Agent Address:", client.address);
  console.log("Gateway URL:", GATEWAY_URL);
  console.log("");

 
  console.log("--- Discovering Endpoints ---");
  try {
    const endpoints = await client.discover();
    console.log(`Found ${endpoints.length} endpoints:\n`);

    for (const ep of endpoints.slice(0, 5)) {
      console.log(`  ${ep.fullPath}`);
      console.log(`    Price: ${ep.pricing.formatted}`);
      console.log(`    Description: ${ep.description || "N/A"}`);
      console.log("");
    }

    if (endpoints.length > 5) {
      console.log(`  ... and ${endpoints.length - 5} more\n`);
    }
  } catch (error) {
    console.error("Failed to discover endpoints:", error);
  }

  console.log("--- Checking Endpoint Price ---");
  try {
    const price = await client.getPrice("/proxy/crypto-com/ticker/btc");
    if (price) {
      console.log(`BTC Ticker Price: ${price.formatted} (${price.amount} atomic units)\n`);
    }
  } catch (error) {
    console.error("Failed to check price:", error);
  }

  
  console.log("--- Fetching Paid API Data ---");
  console.log("Calling /proxy/crypto-com/ticker/btc...\n");

  try {
    const response = await client.fetch<{
      result: {
        data: {
          i: string; // instrument name
          a: string; // ask price
          b: string; // bid price
          t: number; // timestamp
        };
      };
    }>("/proxy/crypto-com/ticker/btc");

    console.log("Response received!");
    console.log("  Paid:", response.paid);
    console.log("  TX Hash:", response.txHash || "N/A");
    console.log("  Payment ID:", response.paymentId || "N/A");
    console.log("");

    if (response.data?.result?.data) {
      const ticker = response.data.result.data;
      console.log("BTC/USDT Ticker:");
      console.log(`  Ask Price: $${parseFloat(ticker.a).toLocaleString()}`);
      console.log(`  Bid Price: $${parseFloat(ticker.b).toLocaleString()}`);
      console.log(`  Timestamp: ${new Date(ticker.t).toISOString()}`);
    }
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    console.log("\nNote: Make sure you have testnet USDC in your wallet.");
    console.log("Get testnet TCRO from: https://cronos.org/faucet");
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
