import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";

const clientId = "fe761f417614ce3ae4277baa4cfbf3e0";

if (!clientId) {
  throw new Error("No client ID provided");
}

export const client = createThirdwebClient({
  clientId: clientId,
});

export const cronosTestnet = defineChain({
  id: 338,
  name: "Cronos Testnet",
  nativeCurrency: {
    name: "Test CRO",
    symbol: "TCRO",
    decimals: 18,
  },
  rpc: "https://evm-t3.cronos.org",
  blockExplorers: [
    {
      name: "Cronos Explorer",
      url: "https://explorer.cronos.org/testnet",
    },
  ],
  testnet: true,
});
