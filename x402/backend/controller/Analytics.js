const Endpoint = require("../model/Endpoint");
const Invoice = require("../model/Invoice");
const Request = require("../model/Request");
const { EXPLORER_URL } = require("../utils/constants");

function getErrorLabel(status) {
  const labels = {
    "402_RETURNED": "Invoice Generated",
    "VERIFY_FAILED": "Payment Verification Failed",
    "SETTLE_FAILED": "Settlement Failed",
    "UPSTREAM_ERROR": "Upstream API Error",
    "NOT_FOUND": "Endpoint Not Found",
    "EXPIRED": "Invoice Expired",
  };
  return labels[status] || status;
}

exports.getAnalytics = async (req, res) => {
  try {
    const walletAddress = req.headers["x-wallet-address"];

    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: "Wallet address required",
      });
    }

    // Get merchant's endpoints
    const endpoints = await Endpoint.find({
      merchantId: walletAddress.toLowerCase(),
    });

    if (endpoints.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalRequests: 0,
            successfulRequests: 0,
            totalRevenue: "0",
            avgLatency: 0,
            totalEndpoints: 0,
            activeEndpoints: 0,
          },
          recentTransactions: [],
          dailyRevenue: [],
          endpointStats: [],
        },
      });
    }

    const endpointIds = endpoints.map((e) => e._id);

    const [summary, recentTransactions, dailyRevenue, endpointStats, errorBreakdown, latencyData] = await Promise.all([
      Request.aggregate([
        { $match: { endpointId: { $in: endpointIds } } },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            successfulRequests: {
              $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] },
            },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "SUCCESS"] },
                  { $toDouble: { $ifNull: ["$revenue", "0"] } },
                  0,
                ],
              },
            },
            avgLatency: {
              $avg: {
                $cond: [{ $eq: ["$status", "SUCCESS"] }, "$latencyMs", null],
              },
            },
          },
        },
      ]),

      Request.find({
        endpointId: { $in: endpointIds },
        status: "SUCCESS",
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("endpointId", "service route chainId")
        .populate("invoiceId", "txHash blockNumber paymentId settledAt")
        .lean(),

      Request.aggregate([
        {
          $match: {
            endpointId: { $in: endpointIds },
            status: "SUCCESS",
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: {
              $sum: { $toDouble: { $ifNull: ["$revenue", "0"] } },
            },
            requests: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Request.aggregate([
        { $match: { endpointId: { $in: endpointIds } } },
        {
          $group: {
            _id: "$endpointId",
            totalRequests: { $sum: 1 },
            successfulRequests: {
              $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] },
            },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "SUCCESS"] },
                  { $toDouble: { $ifNull: ["$revenue", "0"] } },
                  0,
                ],
              },
            },
            avgLatency: { $avg: "$latencyMs" },
          },
        },
      ]),

      Request.aggregate([
        { $match: { endpointId: { $in: endpointIds }, status: { $ne: "SUCCESS" } } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      Request.aggregate([
        {
          $match: {
            endpointId: { $in: endpointIds },
            status: "SUCCESS",
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        },
        { $sort: { latencyMs: 1 } },
        {
          $group: {
            _id: null,
            latencies: { $push: "$latencyMs" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const endpointMap = new Map(endpoints.map((e) => [e._id.toString(), e]));
    const enrichedEndpointStats = endpointStats.map((stat) => {
      const endpoint = endpointMap.get(stat._id.toString());
      return {
        ...stat,
        service: endpoint?.service,
        route: endpoint?.route,
        enabled: endpoint?.enabled,
      };
    });

    const enrichedTransactions = recentTransactions.map((tx) => ({
      ...tx,
      explorerUrl: tx.invoiceId?.txHash
        ? `${EXPLORER_URL[tx.endpointId?.chainId || 338]}/tx/${tx.invoiceId.txHash}`
        : null,
    }));

    const summaryData = summary[0] || {
      totalRequests: 0,
      successfulRequests: 0,
      totalRevenue: 0,
      avgLatency: 0,
    };

    const latencies = latencyData[0]?.latencies || [];
    const getPercentile = (arr, p) => {
      if (arr.length === 0) return 0;
      const index = Math.ceil((p / 100) * arr.length) - 1;
      return arr[Math.max(0, index)] || 0;
    };

    const latencyPercentiles = {
      p50: Math.round(getPercentile(latencies, 50)),
      p95: Math.round(getPercentile(latencies, 95)),
      p99: Math.round(getPercentile(latencies, 99)),
      min: Math.round(latencies[0] || 0),
      max: Math.round(latencies[latencies.length - 1] || 0),
    };

    const errorRate = summaryData.totalRequests > 0
      ? ((summaryData.totalRequests - summaryData.successfulRequests) / summaryData.totalRequests * 100).toFixed(2)
      : "0.00";

    res.status(200).json({
      success: true,
      data: {
        summary: {
          ...summaryData,
          totalRevenue: String(summaryData.totalRevenue || 0),
          avgLatency: Math.round(summaryData.avgLatency || 0),
          totalEndpoints: endpoints.length,
          activeEndpoints: endpoints.filter((e) => e.enabled).length,
          errorRate: `${errorRate}%`,
          successRate: `${(100 - parseFloat(errorRate)).toFixed(2)}%`,
        },
        latencyPercentiles,
        errorBreakdown: errorBreakdown.map((e) => ({
          status: e._id,
          count: e.count,
          label: getErrorLabel(e._id),
        })),
        recentTransactions: enrichedTransactions,
        dailyRevenue,
        endpointStats: enrichedEndpointStats,
      },
    });
  } catch (error) {
    console.error("[Analytics] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEndpointAnalytics = async (req, res) => {
  try {
    const walletAddress = req.headers["x-wallet-address"];
    const { id } = req.params;

    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: "Wallet address required",
      });
    }

    const endpoint = await Endpoint.findOne({
      _id: id,
      merchantId: walletAddress.toLowerCase(),
    });

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: "Endpoint not found",
      });
    }

    const [summary, recentRequests, hourlyStats] = await Promise.all([
      Request.aggregate([
        { $match: { endpointId: endpoint._id } },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            successfulRequests: {
              $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] },
            },
            failedRequests: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["VERIFY_FAILED", "SETTLE_FAILED", "UPSTREAM_ERROR"]] },
                  1,
                  0,
                ],
              },
            },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "SUCCESS"] },
                  { $toDouble: { $ifNull: ["$revenue", "0"] } },
                  0,
                ],
              },
            },
            avgLatency: { $avg: "$latencyMs" },
          },
        },
      ]),

      Request.find({ endpointId: endpoint._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("invoiceId", "txHash paymentId")
        .lean(),

      Request.aggregate([
        {
          $match: {
            endpointId: endpoint._id,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" },
            },
            requests: { $sum: 1 },
            successful: {
              $sum: { $cond: [{ $eq: ["$status", "SUCCESS"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        endpoint: {
          id: endpoint._id,
          service: endpoint.service,
          route: endpoint.route,
          priceAmount: endpoint.priceAmount,
          enabled: endpoint.enabled,
        },
        summary: summary[0] || {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalRevenue: 0,
          avgLatency: 0,
        },
        recentRequests,
        hourlyStats,
      },
    });
  } catch (error) {
    console.error("[Analytics] Endpoint error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.exportPaymentHistory = async (req, res) => {
  try {
    const walletAddress = req.headers["x-wallet-address"];
    const { startDate, endDate, format = "csv" } = req.query;

    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: "Wallet address required",
      });
    }

    const endpoints = await Endpoint.find({
      merchantId: walletAddress.toLowerCase(),
    });

    if (endpoints.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No endpoints found",
        data: [],
      });
    }

    const endpointIds = endpoints.map((e) => e._id);
    const endpointMap = new Map(endpoints.map((e) => [e._id.toString(), e]));

    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    const query = {
      endpointId: { $in: endpointIds },
      status: "SUCCESS",
    };
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }

    const transactions = await Request.find(query)
      .sort({ createdAt: -1 })
      .populate("invoiceId", "txHash paymentId settledAt")
      .lean();

    const exportData = transactions.map((tx) => {
      const endpoint = endpointMap.get(tx.endpointId?.toString());
      const tokenDecimals = 6; // USDC
      const revenueFormatted = tx.revenue
        ? (Number(tx.revenue) / Math.pow(10, tokenDecimals)).toFixed(tokenDecimals)
        : "0";

      return {
        date: tx.createdAt ? new Date(tx.createdAt).toISOString() : "",
        service: endpoint?.service || "Unknown",
        route: endpoint?.route || "Unknown",
        revenue: revenueFormatted,
        revenueRaw: tx.revenue || "0",
        currency: "USDC",
        txHash: tx.invoiceId?.txHash || "",
        paymentId: tx.invoiceId?.paymentId || "",
        latencyMs: tx.latencyMs || 0,
        status: tx.status,
      };
    });

    if (format === "json") {
      return res.status(200).json({
        success: true,
        count: exportData.length,
        data: exportData,
      });
    }

    const csvHeaders = [
      "Date",
      "Service",
      "Route",
      "Revenue",
      "Revenue (Raw)",
      "Currency",
      "TX Hash",
      "Payment ID",
      "Latency (ms)",
      "Status",
    ];

    const csvRows = exportData.map((row) => [
      row.date,
      row.service,
      row.route,
      row.revenue,
      row.revenueRaw,
      row.currency,
      row.txHash,
      row.paymentId,
      row.latencyMs,
      row.status,
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const filename = `atomx-payments-${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error("[Analytics] Export error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
