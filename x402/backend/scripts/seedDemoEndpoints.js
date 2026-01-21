

require("../model/db");
const Endpoint = require("../model/Endpoint");


const PLATFORM_WALLET = process.env.PLATFORM_WALLET || "0x742d35Cc6634C0532925a3b844Bc9e7595f5bB0a";


const INTERNAL_BASE = "http://localhost:8080/internal/market";


const DEMO_ENDPOINTS = [
  
  {
    service: "crypto-com",
    route: "ticker/btc",
    upstreamUrl: `${INTERNAL_BASE}/ticker/BTC`,
    priceAmount: "100000", 
    description: "Bitcoin (BTC) real-time price from Crypto.com",
    chainId: 338,
  },
  {
    service: "crypto-com",
    route: "ticker/eth",
    upstreamUrl: `${INTERNAL_BASE}/ticker/ETH`,
    priceAmount: "100000", 
    description: "Ethereum (ETH) real-time price from Crypto.com",
    chainId: 338,
  },
  {
    service: "crypto-com",
    route: "ticker/cro",
    upstreamUrl: `${INTERNAL_BASE}/ticker/CRO`,
    priceAmount: "50000", 
    description: "Cronos (CRO) real-time price from Crypto.com",
    chainId: 338,
  },
  {
    service: "crypto-com",
    route: "tickers",
    upstreamUrl: `${INTERNAL_BASE}/tickers`,
    priceAmount: "200000", 
    description: "Multiple crypto prices from Crypto.com (BTC, ETH, CRO, etc.)",
    chainId: 338,
  },

  
  {
    service: "crypto-com",
    route: "orderbook/btc",
    upstreamUrl: `${INTERNAL_BASE}/orderbook/BTC`,
    priceAmount: "500000", 
    description: "Bitcoin (BTC) order book depth from Crypto.com",
    chainId: 338,
  },
  {
    service: "crypto-com",
    route: "orderbook/eth",
    upstreamUrl: `${INTERNAL_BASE}/orderbook/ETH`,
    priceAmount: "500000", 
    description: "Ethereum (ETH) order book depth from Crypto.com",
    chainId: 338,
  },


  {
    service: "crypto-com",
    route: "trades/btc",
    upstreamUrl: `${INTERNAL_BASE}/trades/BTC`,
    priceAmount: "300000", // 0.30 USDC
    description: "Bitcoin (BTC) recent trades from Crypto.com",
    chainId: 338,
  },

  
  {
    service: "crypto-com",
    route: "candles/btc",
    upstreamUrl: `${INTERNAL_BASE}/candles/BTC`,
    priceAmount: "400000", 
    description: "Bitcoin (BTC) OHLCV candlestick data from Crypto.com",
    chainId: 338,
  },
  {
    service: "crypto-com",
    route: "candles/eth",
    upstreamUrl: `${INTERNAL_BASE}/candles/ETH`,
    priceAmount: "400000", 
    description: "Ethereum (ETH) OHLCV candlestick data from Crypto.com",
    chainId: 338,
  },

  {
    service: "crypto-com",
    route: "instruments",
    upstreamUrl: `${INTERNAL_BASE}/instruments`,
    priceAmount: "0", 
    description: "List of all trading instruments on Crypto.com (FREE)",
    chainId: 338,
  },

  
  {
    service: "coingecko",
    route: "price",
    upstreamUrl: "https://api.coingecko.com/api/v3/simple/price",
    priceAmount: "100000", 
    description: "Crypto prices from CoinGecko API",
    chainId: 338,
  },
  {
    service: "coingecko",
    route: "coins/list",
    upstreamUrl: "https://api.coingecko.com/api/v3/coins/list",
    priceAmount: "50000", 
    description: "List of all coins on CoinGecko",
    chainId: 338,
  },
];

async function seedEndpoints() {
  console.log("Seeding demo endpoints...\n");

  let created = 0;
  let skipped = 0;

  for (const config of DEMO_ENDPOINTS) {
    
    const existing = await Endpoint.findOne({
      service: config.service,
      route: config.route,
    });

    if (existing) {
      console.log(`⏭️  Skipped: ${config.service}/${config.route} (already exists)`);
      skipped++;
      continue;
    }

    
    const endpoint = await Endpoint.create({
      merchantId: PLATFORM_WALLET.toLowerCase(),
      merchantWallet: PLATFORM_WALLET,
      tokenAddress: "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0", // USDC.e testnet
      enabled: true,
      ...config,
    });

    console.log(`Created: ${config.service}/${config.route} - ${Number(config.priceAmount) / 1e6} USDC`);
    created++;
  }

  console.log(`\nSummary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${DEMO_ENDPOINTS.length}`);

  console.log(`\nDemo endpoints ready! Try:`);
  console.log(`   curl http://localhost:8080/proxy/crypto-com/ticker/btc`);
  console.log(`   curl http://localhost:8080/proxy/crypto-com/tickers?symbols=BTC,ETH,CRO`);
}

// Run seeder
seedEndpoints()
  .then(() => {
    console.log("\nSeeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
