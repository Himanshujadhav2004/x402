

const mongoose = require("mongoose");


const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://himanshujadhav341_db_user:dfmAw9eQutnFsULQ@cluster0.ahv0oqx.mongodb.net/?appName=Cluster0";


const EndpointSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, index: true },
  service: { type: String, required: true, trim: true, lowercase: true, index: true },
  route: { type: String, required: true, trim: true, lowercase: true },
  upstreamUrl: { type: String, required: true },
  description: { type: String, default: "" },
  priceAmount: { type: String, required: true },
  chainId: { type: Number, default: 338 },
  tokenSymbol: { type: String, default: "USDC" },
  tokenAddress: { type: String, required: true, lowercase: true },
  acceptedTokens: { type: [String], default: ["USDC"] },
  merchantWallet: { type: String, required: true, lowercase: true, index: true },
  secretHeaders: { type: Map, of: String, default: {} },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

const Endpoint = mongoose.model("Endpoint", EndpointSchema);


const DEMO_MERCHANT = "0x742d35Cc6634C0532925a3b844Bc9e7595f5BB0a";
const USDC_ADDRESS = "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0";

const DEMO_ENDPOINTS = [

  {
    service: "crypto-com",
    route: "ticker/btc",
    upstreamUrl: "https://api.crypto.com/exchange/v1/public/get-tickers",
    description: "Bitcoin price ticker from Crypto.com Exchange",
    priceAmount: "1000", 
  },
  {
    service: "crypto-com",
    route: "ticker/eth",
    upstreamUrl: "https://api.crypto.com/exchange/v1/public/get-tickers",
    description: "Ethereum price ticker from Crypto.com Exchange",
    priceAmount: "1000", 
  },
  {
    service: "crypto-com",
    route: "ticker/cro",
    upstreamUrl: "https://api.crypto.com/exchange/v1/public/get-tickers",
    description: "Cronos price ticker from Crypto.com Exchange",
    priceAmount: "1000", 
  },
  {
    service: "crypto-com",
    route: "instruments",
    upstreamUrl: "https://api.crypto.com/exchange/v1/public/get-instruments",
    description: "All trading instruments on Crypto.com",
    priceAmount: "500", 
  },
  {
    service: "crypto-com",
    route: "orderbook/btc",
    upstreamUrl: "https://api.crypto.com/exchange/v1/public/get-book?instrument_name=BTC_USDT&depth=10",
    description: "Bitcoin order book (depth 10)",
    priceAmount: "5000", 
  },
  
  {
    service: "binance",
    route: "ticker/btc",
    upstreamUrl: "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
    description: "Bitcoin price from Binance",
    priceAmount: "1000", 
  },
  {
    service: "binance",
    route: "ticker/eth",
    upstreamUrl: "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT",
    description: "Ethereum price from Binance",
    priceAmount: "1000", 
  },
  {
    service: "binance",
    route: "ticker/all",
    upstreamUrl: "https://api.binance.com/api/v3/ticker/price",
    description: "All crypto prices from Binance",
    priceAmount: "5000", 
  },
  
  {
    service: "premium",
    route: "market-depth",
    upstreamUrl: "https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=100",
    description: "Deep order book analysis (100 levels)",
    priceAmount: "50000", 
  },
  {
    service: "premium",
    route: "recent-trades",
    upstreamUrl: "https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=500",
    description: "500 most recent BTC trades",
    priceAmount: "30000", 
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!");

    
    const deleted = await Endpoint.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing endpoints`);

    
    const endpoints = DEMO_ENDPOINTS.map(ep => ({
      ...ep,
      merchantId: DEMO_MERCHANT.toLowerCase(),
      merchantWallet: DEMO_MERCHANT,
      chainId: 338,
      tokenSymbol: "USDC",
      tokenAddress: USDC_ADDRESS,
      acceptedTokens: ["USDC"],
      enabled: true,
    }));

    const result = await Endpoint.insertMany(endpoints);
    console.log(`\nSeeded ${result.length} demo endpoints:`);

    result.forEach(ep => {
      const price = Number(ep.priceAmount) / 1e6;
      console.log(`  - ${ep.service}/${ep.route}: ${price} USDC`);
    });

    console.log(`\nDemo merchant wallet: ${DEMO_MERCHANT}`);
    console.log("\nDone!");

  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
