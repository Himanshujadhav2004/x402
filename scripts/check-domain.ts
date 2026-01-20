import { createPublicClient, http, parseAbi } from "viem";
import { cronosTestnet } from "viem/chains";

const USDC_ADDRESS = "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0";

async function main() {
  const client = createPublicClient({
    chain: cronosTestnet,
    transport: http("https://evm-t3.cronos.org"),
  });

  const abi = parseAbi([
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function version() view returns (string)",
    "function DOMAIN_SEPARATOR() view returns (bytes32)",
  ]);

  try {
    const name = await client.readContract({
      address: USDC_ADDRESS,
      abi,
      functionName: "name",
    });
    console.log("Name:", name);
  } catch (e) {
    console.log("Name: error reading");
  }

  try {
    const symbol = await client.readContract({
      address: USDC_ADDRESS,
      abi,
      functionName: "symbol",
    });
    console.log("Symbol:", symbol);
  } catch (e) {
    console.log("Symbol: error reading");
  }

  try {
    const version = await client.readContract({
      address: USDC_ADDRESS,
      abi,
      functionName: "version",
    });
    console.log("Version:", version);
  } catch (e) {
    console.log("Version: error reading");
  }

  try {
    const domainSeparator = await client.readContract({
      address: USDC_ADDRESS,
      abi,
      functionName: "DOMAIN_SEPARATOR",
    });
    console.log("Domain Separator:", domainSeparator);
  } catch (e) {
    console.log("Domain Separator: error reading");
  }
}

main().catch(console.error);
