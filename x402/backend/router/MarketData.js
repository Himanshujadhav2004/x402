const express = require("express");
const {
  getTicker,
  getMultipleTickers,
  getOrderBook,
  getRecentTrades,
  getCandlesticks,
  getInstruments,
  getSupportedSymbols,
} = require("../controller/MarketData");

const router = express.Router();

router.get("/supported", getSupportedSymbols);

router.get("/instruments", getInstruments);

router.get("/ticker/:symbol", getTicker);

router.get("/tickers", getMultipleTickers);

router.get("/orderbook/:symbol", getOrderBook);

router.get("/trades/:symbol", getRecentTrades);

router.get("/candles/:symbol", getCandlesticks);

module.exports = router;
