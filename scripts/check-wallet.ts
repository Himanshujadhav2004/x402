import { createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { cronosTestnet } from "viem/chains";

const PRIVATE_KEY = "0x66bf9a6d000a4f9be2974990b31f4845ec9f4bc1887b6ac41eaaee61b630a46e";
const USDC_ADDRESS = "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0";

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  console.log("Wallet Address:", account.address);

  const client = createPublicClient({
    chain: cronosTestnet,
    transport: http("https://evm-t3.cronos.org"),
  });

  const tcroBalance = await client.getBalance({ address: account.address });
  console.log("TCRO Balance:", Number(tcroBalance) / 1e18, "TCRO");

  const usdcAbi = parseAbi(["function balanceOf(address) view returns (uint256)"]);
  const usdcBalance = await client.readContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log("USDC Balance:", Number(usdcBalance) / 1e6, "USDC");
}

main().catch(console.error);
