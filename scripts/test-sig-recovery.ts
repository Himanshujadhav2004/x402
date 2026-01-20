import { createWalletClient, http, verifyTypedData, hashTypedData, recoverAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { cronosTestnet } from "viem/chains";
import crypto from "crypto";

const PRIVATE_KEY = "0x66bf9a6d000a4f9be2974990b31f4845ec9f4bc1887b6ac41eaaee61b630a46e";
const USDC_ADDRESS = "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0";

const domain = {
  name: "Bridged USDC (Stargate)",
  version: "1",
  chainId: 338,
  verifyingContract: USDC_ADDRESS,
} as const;

const types = {
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
  console.log("Signer:", account.address);

  const walletClient = createWalletClient({
    account,
    chain: cronosTestnet,
    transport: http("https://evm-t3.cronos.org"),
  });

  const payTo = "0x742d35cc6634C0532925a3B844bC9e7595F5bb0A" as `0x${string}`;
  const value = 100000n;
  const validAfter = 0n;
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 300);
  const nonce = `0x${crypto.randomBytes(32).toString("hex")}` as `0x${string}`;

  const message = {
    from: account.address,
    to: payTo,
    value,
    validAfter,
    validBefore,
    nonce,
  };

  console.log("Message:", message);

  const signature = await walletClient.signTypedData({
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message,
  });

  console.log("Signature:", signature);

  const isValid = await verifyTypedData({
    address: account.address,
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message,
    signature,
  });

  console.log("Local verification:", isValid);

  const hash = hashTypedData({
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message,
  });

  console.log("Typed data hash:", hash);

  const recovered = await recoverAddress({
    hash,
    signature,
  });

  console.log("Recovered address:", recovered);
  console.log("Match:", recovered.toLowerCase() === account.address.toLowerCase());
}

main().catch(console.error);
