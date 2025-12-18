const keccak = require("keccak");

function checksumAddress(address) {
  if (!address || typeof address !== "string") return address;

  const addr = address.toLowerCase().replace("0x", "");

  const hash = keccak("keccak256").update(addr).digest("hex");

  let result = "0x";
  for (let i = 0; i < addr.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      result += addr[i].toUpperCase();
    } else {
      result += addr[i];
    }
  }

  return result;
}

const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

const SUPPORTED_TOKENS = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: {
      338: "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0",
      25: "0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C"
    }
  },
  CRO: {
    symbol: "CRO",
    name: "Cronos",
    decimals: 18,
    address: {
      338: NATIVE_TOKEN_ADDRESS,
      25: NATIVE_TOKEN_ADDRESS
    }
  },
  WCRO: {
    symbol: "WCRO",
    name: "Wrapped CRO",
    decimals: 18,
    address: {
      338: "0x6a3173618859C7cd40fAF6921b5E9eB6A76f1321",
      25: "0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23"
    }
  }
};

module.exports = {
  FACILITATOR_URL: "https://facilitator.cronoslabs.org/v2/x402",

  checksumAddress,

  NATIVE_TOKEN_ADDRESS,

  SUPPORTED_TOKENS,

  USDC_ADDRESS: SUPPORTED_TOKENS.USDC.address,

  CRO_ADDRESS: SUPPORTED_TOKENS.CRO.address,

  getTokenAddress: (symbol, chainId) => {
    const token = SUPPORTED_TOKENS[symbol.toUpperCase()];
    if (!token) return null;
    return token.address[chainId];
  },

  getTokenByAddress: (address, chainId) => {
    for (const [symbol, token] of Object.entries(SUPPORTED_TOKENS)) {
      if (token.address[chainId]?.toLowerCase() === address?.toLowerCase()) {
        return { symbol, ...token };
      }
    }
    return null;
  },

  NETWORK_NAME: {
    338: "cronos-testnet",
    25: "cronos"
  },

  RPC_URL: {
    338: "https://evm-t3.cronos.org",
    25: "https://evm.cronos.org"
  },

  EXPLORER_URL: {
    338: "https://explorer.cronos.org/testnet",
    25: "https://explorer.cronos.org"
  },

  X402_VERSION: 1,

  DEFAULT_TIMEOUT_SECONDS: 300,

  USDC_DECIMALS: 6,
  CRO_DECIMALS: 18
};
