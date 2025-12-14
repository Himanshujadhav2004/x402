const Endpoint = require("../model/Endpoint");
const { SUPPORTED_TOKENS, NETWORK_NAME } = require("../utils/constants");

exports.discoverEndpoints = async (req, res) => {
  try {
    const { service, minPrice, maxPrice, token, chainId } = req.query;

    // Build query
    const query = { enabled: true };

    if (service) {
      query.service = service.toLowerCase();
    }

    if (chainId) {
      query.chainId = parseInt(chainId);
    }

    if (token) {
      query.tokenSymbol = token.toUpperCase();
    }

    let endpoints = await Endpoint.find(query)
      .select("-secretHeaders -__v")
      .sort({ service: 1, route: 1 })
      .lean();

    if (minPrice || maxPrice) {
      endpoints = endpoints.filter((ep) => {
        const price = BigInt(ep.priceAmount);
        if (minPrice && price < BigInt(minPrice)) return false;
        if (maxPrice && price > BigInt(maxPrice)) return false;
        return true;
      });
    }

    const formatted = endpoints.map((ep) => {
      const tokenInfo = SUPPORTED_TOKENS[ep.tokenSymbol || "USDC"];
      const decimals = tokenInfo?.decimals || 6;

      return {
        id: ep._id,
        service: ep.service,
        route: ep.route,
        fullPath: `/proxy/${ep.service}/${ep.route}`,
        description: ep.description,
        pricing: {
          amount: ep.priceAmount,
          formatted: `${Number(ep.priceAmount) / Math.pow(10, decimals)} ${ep.tokenSymbol || "USDC"}`,
          token: ep.tokenSymbol || "USDC",
          tokenAddress: ep.tokenAddress,
          acceptedTokens: ep.acceptedTokens || [ep.tokenSymbol || "USDC"],
        },
        network: {
          chainId: ep.chainId,
          name: NETWORK_NAME[ep.chainId] || "cronos-testnet",
        },
        merchant: ep.merchantWallet,
      };
    });

    const byService = formatted.reduce((acc, ep) => {
      if (!acc[ep.service]) {
        acc[ep.service] = [];
      }
      acc[ep.service].push(ep);
      return acc;
    }, {});

    res.json({
      success: true,
      count: formatted.length,
      endpoints: formatted,
      byService,
      filters: {
        service,
        minPrice,
        maxPrice,
        token,
        chainId,
      },
    });
  } catch (error) {
    console.error("[Discovery] Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch endpoints",
      message: error.message,
    });
  }
};

exports.listServices = async (req, res) => {
  try {
    const services = await Endpoint.aggregate([
      { $match: { enabled: true } },
      {
        $group: {
          _id: "$service",
          count: { $sum: 1 },
          endpoints: { $push: "$route" },
          minPrice: { $min: { $toLong: "$priceAmount" } },
          maxPrice: { $max: { $toLong: "$priceAmount" } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      count: services.length,
      services: services.map((s) => ({
        name: s._id,
        endpointCount: s.count,
        routes: s.endpoints,
        priceRange: {
          min: s.minPrice,
          max: s.maxPrice,
        },
      })),
    });
  } catch (error) {
    console.error("[Discovery] Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list services",
    });
  }
};

exports.getService = async (req, res) => {
  try {
    const { service } = req.params;

    const endpoints = await Endpoint.find({
      service: service.toLowerCase(),
      enabled: true,
    })
      .select("-secretHeaders -__v")
      .lean();

    if (endpoints.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
        service,
      });
    }

    // Format endpoints
    const formatted = endpoints.map((ep) => {
      const tokenInfo = SUPPORTED_TOKENS[ep.tokenSymbol || "USDC"];
      const decimals = tokenInfo?.decimals || 6;

      return {
        route: ep.route,
        fullPath: `/proxy/${ep.service}/${ep.route}`,
        description: ep.description,
        price: `${Number(ep.priceAmount) / Math.pow(10, decimals)} ${ep.tokenSymbol || "USDC"}`,
        priceRaw: ep.priceAmount,
        token: ep.tokenSymbol || "USDC",
        acceptedTokens: ep.acceptedTokens || [ep.tokenSymbol || "USDC"],
      };
    });

    res.json({
      success: true,
      service,
      count: formatted.length,
      network: NETWORK_NAME[endpoints[0].chainId] || "cronos-testnet",
      chainId: endpoints[0].chainId,
      endpoints: formatted,
    });
  } catch (error) {
    console.error("[Discovery] Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get service details",
    });
  }
};

exports.listTokens = async (req, res) => {
  const chainId = parseInt(req.query.chainId) || 338;

  const tokens = Object.entries(SUPPORTED_TOKENS).map(([symbol, info]) => ({
    symbol,
    name: info.name,
    decimals: info.decimals,
    address: info.address[chainId],
  }));

  res.json({
    success: true,
    chainId,
    network: NETWORK_NAME[chainId],
    tokens,
  });
};
