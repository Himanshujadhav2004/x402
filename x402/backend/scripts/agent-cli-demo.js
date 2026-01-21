const crypto = require("crypto");

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8080";
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Optional: for signing payments
const ENDPOINT = process.argv[2] || "crypto-com/ticker/btc";


const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function log(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

function logStep(step, message) {
  console.log(`\n${colors.cyan}[Step ${step}]${colors.reset} ${colors.bright}${message}${colors.reset}`);
}

function logJson(data) {
  console.log(colors.yellow + JSON.stringify(data, null, 2) + colors.reset);
}

async function main() {
  console.log(`
${colors.magenta}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ${colors.bright}ATOMX - x402 Agent CLI Demo${colors.reset}${colors.magenta}                               ║
║   ${colors.cyan}Cronos Pay-per-API Gateway${colors.reset}${colors.magenta}                                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
`);

  log(colors.blue, "🎯 Target:", `${GATEWAY_URL}/proxy/${ENDPOINT}`);
  console.log("");


  logStep(1, "Requesting API endpoint...");

  const apiUrl = `${GATEWAY_URL}/proxy/${ENDPOINT}`;
  log(colors.cyan, "→ GET", apiUrl);

  const response1 = await fetch(apiUrl);

  log(colors.yellow, "← Status:", `${response1.status} ${response1.statusText}`);

  if (response1.status === 200) {
    log(colors.green, "✅", "Endpoint is FREE - no payment required!");
    const data = await response1.json();
    console.log("\n📦 Response Data:");
    logJson(data);
    return;
  }

  if (response1.status !== 402) {
    log(colors.red, "❌", `Unexpected status: ${response1.status}`);
    const text = await response1.text();
    console.log(text);
    return;
  }

  
  logStep(2, "Received HTTP 402 - Payment Required");

  const invoice = await response1.json();

  console.log("\n📋 Payment Requirements:");
  logJson({
    paymentId: invoice.paymentId,
    amount: `${Number(invoice.paymentRequirements.maxAmountRequired) / 1e6} USDC`,
    payTo: invoice.paymentRequirements.payTo,
    network: invoice.paymentRequirements.network,
    timeout: `${invoice.paymentRequirements.maxTimeoutSeconds}s`,
  });

  if (!PRIVATE_KEY) {
    logStep(3, "Payment Signing (Simulated)");
    log(colors.yellow, "⚠️", "No PRIVATE_KEY provided - showing simulated flow");
    console.log(`
${colors.cyan}To complete the payment flow, provide a private key:${colors.reset}
  PRIVATE_KEY=0x... node scripts/agent-cli-demo.js ${ENDPOINT}

${colors.cyan}Or use the Frontend API Playground for visual testing.${colors.reset}
`);


    console.log("📝 In a real agent, the following would happen:");
    console.log("   1. Generate random nonce (32 bytes)");
    console.log("   2. Sign EIP-712 TransferWithAuthorization message");
    console.log("   3. Build X-PAYMENT header (Base64 encoded)");
    console.log("   4. Retry request with payment header");
    console.log("   5. Gateway verifies → settles on-chain → returns data");

   
    console.log(`
${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.bright}Manual Testing with curl:${colors.reset}

${colors.cyan}# Step 1: Get 402 response${colors.reset}
curl -i ${GATEWAY_URL}/proxy/${ENDPOINT}

${colors.cyan}# Step 2: With payment (requires signed header)${colors.reset}
curl -i ${GATEWAY_URL}/proxy/${ENDPOINT} \\
  -H "X-PAYMENT: <base64-encoded-payment>" \\
  -H "X-PAYMENT-ID: ${invoice.paymentId}"
${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`);
    return;
  }

 
  logStep(3, "Signing Payment Authorization...");
  log(colors.green, "🔐", "Private key detected - signing EIP-3009 authorization");

  
  const nonce = "0x" + crypto.randomBytes(32).toString("hex");
  const validBefore = Math.floor(Date.now() / 1000) + 300;

  console.log("\n📝 Authorization Parameters:");
  logJson({
    from: "Agent Wallet",
    to: invoice.paymentRequirements.payTo,
    value: invoice.paymentRequirements.maxAmountRequired,
    validAfter: 0,
    validBefore,
    nonce,
  });

  log(colors.yellow, "⚠️", "Full signing requires ethers.js - use frontend for complete flow");
}


main()
  .then(() => {
    console.log(`\n${colors.green}Demo complete!${colors.reset}\n`);
  })
  .catch((error) => {
    console.error(`\n${colors.red} Error: ${error.message}${colors.reset}\n`);
    process.exit(1);
  });
