const CRYPTO_COM_API_BASE = "https://api.crypto.com/v2";

const SUPPORTED_PAIRS = {
  BTC: "BTC_USDT",
  ETH: "ETH_USDT",
  CRO: "CRO_USDT",
  SOL: "SOL_USDT",
  AVAX: "AVAX_USDT",
  MATIC: "MATIC_USDT",
  LINK: "LINK_USDT",
  DOT: "DOT_USDT",
};

async function getTicker(symbol) {
  const pair = SUPPORTED_PAIRS[symbol.toUpperCase()];
  if (!pair) {
    throw new Error(`Unsupported symbol: ${symbol}. Supported: ${Object.keys(SUPPORTED_PAIRS).join(", ")}`);
  }

  const response = await fetch(`${CRYPTO_COM_API_BASE}/public/get-ticker?instrument_name=${pair}`);
  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Crypto.com API error: ${data.message || "Unknown error"}`);
  }

  const ticker = data.result.data[0];

  return {
    symbol: symbol.toUpperCase(),
    pair,
    price: ticker.k || ticker.a,
    bid: ticker.b,
    ask: ticker.a,
    high24h: ticker.h,
    low24h: ticker.l,
    volume24h: ticker.v,
    volumeValue24h: ticker.vv,
    change24h: ticker.c,
    timestamp: ticker.t,
    source: "crypto.com",
  };
}

async function getMultipleTickers(symbols) {
  const results = {};
  const errors = [];

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        results[symbol.toUpperCase()] = await getTicker(symbol);
      } catch (error) {
        errors.push({ symbol, error: error.message });
      }
    })
  );

  return { data: results, errors: errors.length > 0 ? errors : undefined };
}

async function getOrderBook(symbol, depth = 10) {
  const pair = SUPPORTED_PAIRS[symbol.toUpperCase()];
  if (!pair) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }

  const response = await fetch(`${CRYPTO_COM_API_BASE}/public/get-book?instrument_name=${pair}&depth=${depth}`);
  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Crypto.com API error: ${data.message || "Unknown error"}`);
  }

  const book = data.result.data[0];

  return {
    symbol: symbol.toUpperCase(),
    pair,
    bids: book.bids.map(([price, qty]) => ({ price, quantity: qty })),
    asks: book.asks.map(([price, qty]) => ({ price, quantity: qty })),
    timestamp: book.t,
    source: "crypto.com",
  };
}

async function getRecentTrades(symbol, count = 50) {
  const pair = SUPPORTED_PAIRS[symbol.toUpperCase()];
  if (!pair) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }

  const response = await fetch(`${CRYPTO_COM_API_BASE}/public/get-trades?instrument_name=${pair}&count=${count}`);
  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Crypto.com API error: ${data.message || "Unknown error"}`);
  }

  return {
    symbol: symbol.toUpperCase(),
    pair,
    trades: data.result.data.map((trade) => ({
      price: trade.p,
      quantity: trade.q,
      side: trade.s,
      timestamp: trade.t,
      tradeId: trade.d,
    })),
    source: "crypto.com",
  };
}

async function getCandlesticks(symbol, interval = "1h", count = 100) {
  const pair = SUPPORTED_PAIRS[symbol.toUpperCase()];
  if (!pair) {
    throw new Error(`Unsupported symbol: ${symbol}`);
  }

  const intervalMap = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1h": "1h",
    "4h": "4h",
    "1d": "1D",
    "1D": "1D",
  };

  const mappedInterval = intervalMap[interval] || "1h";

  const response = await fetch(
    `${CRYPTO_COM_API_BASE}/public/get-candlestick?instrument_name=${pair}&timeframe=${mappedInterval}&count=${count}`
  );
  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Crypto.com API error: ${data.message || "Unknown error"}`);
  }

  return {
    symbol: symbol.toUpperCase(),
    pair,
    interval: mappedInterval,
    candles: data.result.data.map((candle) => ({
      timestamp: candle.t,
      open: candle.o,
      high: candle.h,
      low: candle.l,
      close: candle.c,
      volume: candle.v,
    })),
    source: "crypto.com",
  };
}

async function getInstruments() {
  const response = await fetch(`${CRYPTO_COM_API_BASE}/public/get-instruments`);
  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Crypto.com API error: ${data.message || "Unknown error"}`);
  }

  return {
    instruments: data.result.data.map((inst) => ({
      symbol: inst.instrument_name,
      baseCurrency: inst.base_currency,
      quoteCurrency: inst.quote_currency,
      priceDecimals: inst.price_decimals,
      quantityDecimals: inst.quantity_decimals,
      maxQuantity: inst.max_quantity,
      minQuantity: inst.min_quantity,
    })),
    count: data.result.data.length,
    source: "crypto.com",
  };
}

module.exports = {
  getTicker,
  getMultipleTickers,
  getOrderBook,
  getRecentTrades,
  getCandlesticks,
  getInstruments,
  SUPPORTED_PAIRS,
};
