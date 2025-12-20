const requestCounts = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const MAX_402_REQUESTS_PER_WINDOW = 20;

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

exports.proxyRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  const hasPayment = !!req.headers["x-payment"];

  const maxRequests = hasPayment ? MAX_REQUESTS_PER_WINDOW * 5 : MAX_REQUESTS_PER_WINDOW;

  let data = requestCounts.get(ip);

  if (!data || now > data.resetTime) {
    // New window
    data = { count: 1, resetTime: now + WINDOW_MS };
    requestCounts.set(ip, data);
    return next();
  }

  data.count++;

  if (data.count > maxRequests) {
    return res.status(429).json({
      success: false,
      error: "Too Many Requests",
      message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute.`,
      retryAfter: Math.ceil((data.resetTime - now) / 1000),
    });
  }

  next();
};

exports.invoiceRateLimiter = (req, res, next) => {
  if (req.headers["x-payment"]) {
    return next();
  }

  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const key = `invoice:${ip}`;
  const now = Date.now();

  let data = requestCounts.get(key);

  if (!data || now > data.resetTime) {
    data = { count: 1, resetTime: now + WINDOW_MS };
    requestCounts.set(key, data);
    return next();
  }

  data.count++;

  if (data.count > MAX_402_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      error: "Too Many Invoice Requests",
      message: `Rate limit exceeded. Maximum ${MAX_402_REQUESTS_PER_WINDOW} invoice requests per minute.`,
      retryAfter: Math.ceil((data.resetTime - now) / 1000),
    });
  }

  next();
};
