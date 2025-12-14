const cryptoCom = require("../services/cryptoComMarketData");

exports.getTicker = async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await cryptoCom.getTicker(symbol);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMultipleTickers = async (req, res) => {
  try {
    const symbols = req.query.symbols?.split(",") || ["BTC", "ETH", "CRO"];
    const data = await cryptoCom.getMultipleTickers(symbols);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getOrderBook = async (req, res) => {
  try {
    const { symbol } = req.params;
    const depth = parseInt(req.query.depth) || 10;
    const data = await cryptoCom.getOrderBook(symbol, depth);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getRecentTrades = async (req, res) => {
  try {
    const { symbol } = req.params;
    const count = parseInt(req.query.count) || 50;
    const data = await cryptoCom.getRecentTrades(symbol, count);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getCandlesticks = async (req, res) => {
  try {
    const { symbol } = req.params;
    const interval = req.query.interval || "1h";
    const count = parseInt(req.query.count) || 100;
    const data = await cryptoCom.getCandlesticks(symbol, interval, count);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getInstruments = async (req, res) => {
  try {
    const data = await cryptoCom.getInstruments();
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getSupportedSymbols = (req, res) => {
  res.json({
    success: true,
    symbols: Object.keys(cryptoCom.SUPPORTED_PAIRS),
    pairs: cryptoCom.SUPPORTED_PAIRS,
    source: "crypto.com",
  });
};
