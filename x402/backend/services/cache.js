const cache = new Map();

const DEFAULT_TTL_MS = 30 * 1000;

const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
};

function generateKey(service, route, query = {}) {
  const queryString = Object.keys(query)
    .sort()
    .map((k) => `${k}=${query[k]}`)
    .join("&");
  return `${service}:${route}:${queryString}`;
}

function get(key) {
  const entry = cache.get(key);

  if (!entry) {
    stats.misses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    stats.misses++;
    return null;
  }

  stats.hits++;
  return entry.data;
}

function set(key, data, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    cachedAt: Date.now(),
  });
  stats.sets++;
}

function del(key) {
  if (cache.delete(key)) {
    stats.deletes++;
  }
}

function clear() {
  const size = cache.size;
  cache.clear();
  stats.deletes += size;
}

function getStats() {
  const total = stats.hits + stats.misses;
  return {
    hits: stats.hits,
    misses: stats.misses,
    hitRate: total > 0 ? (stats.hits / total * 100).toFixed(2) + "%" : "0%",
    sets: stats.sets,
    deletes: stats.deletes,
    size: cache.size,
  };
}

function cleanup() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

setInterval(cleanup, 60 * 1000);

function cacheMiddleware(options = {}) {
  const ttlMs = options.ttlMs || DEFAULT_TTL_MS;

  return (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : generateKey(req.params.service || "", req.params.route || "", req.query);

    const cached = get(key);
    if (cached) {
      res.set("X-Cache", "HIT");
      res.set("X-Cache-Key", key);
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);

    res.json = (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        set(key, data, ttlMs);
      }
      res.set("X-Cache", "MISS");
      res.set("X-Cache-Key", key);
      return originalJson(data);
    };

    next();
  };
}

module.exports = {
  generateKey,
  get,
  set,
  del,
  clear,
  getStats,
  cleanup,
  cacheMiddleware,
  DEFAULT_TTL_MS,
};
