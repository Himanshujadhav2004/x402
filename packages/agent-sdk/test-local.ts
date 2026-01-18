/**
 * Quick local test for @atomx/agent-sdk
 * Tests against the local backend without making actual payments
 */

import { X402Client } from "./src";

// Test wallet (don't need real funds for discovery test)
const TEST_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`;
const GATEWAY_URL = "http://localhost:8080";

async function main() {
  console.log("=== @atomx/agent-sdk Local Test ===\n");

  // 1. Create client
  console.log("1. Creating client...");
  const client = new X402Client({
    privateKey: TEST_PRIVATE_KEY,
    gatewayUrl: GATEWAY_URL,
    chainId: 338,
    debug: true,
  });
  console.log("   ✓ Client created");
  console.log("   Address:", client.address);
  console.log("");

  // 2. Test discovery
  console.log("2. Testing endpoint discovery...");
  try {
    const endpoints = await client.discover();
    console.log(`   ✓ Found ${endpoints.length} endpoints`);

    if (endpoints.length > 0) {
      console.log("\n   Available endpoints:");
      for (const ep of endpoints.slice(0, 5)) {
        console.log(`     - ${ep.fullPath} (${ep.pricing.formatted})`);
      }
    }
  } catch (error: any) {
    console.log("   ✗ Discovery failed:", error.message);
  }
  console.log("");

  // 3. Test getPrice
  console.log("3. Testing getPrice...");
  try {
    const price = await client.getPrice("/proxy/crypto-com/ticker/btc");
    if (price) {
      console.log(`   ✓ Price: ${price.formatted}`);
    } else {
      console.log("   - No price (endpoint might not exist)");
    }
  } catch (error: any) {
    console.log("   ✗ getPrice failed:", error.message);
  }
  console.log("");

  // 4. Test 402 response (without payment)
  console.log("4. Testing 402 response...");
  try {
    const response = await fetch(`${GATEWAY_URL}/proxy/crypto-com/ticker/btc`);
    if (response.status === 402) {
      const data = await response.json();
      console.log("   ✓ Received 402 Payment Required");
      console.log("   Payment ID:", data.paymentId);
      console.log("   Amount:", data.paymentRequirements?.maxAmountRequired);
    }
  } catch (error: any) {
    console.log("   ✗ 402 test failed:", error.message);
  }
  console.log("");

  console.log("=== Test Complete ===");
  console.log("\nTo test actual payments, run:");
  console.log("  AGENT_PRIVATE_KEY=0x... npx tsx examples/basic-usage.ts");
}

main().catch(console.error);
