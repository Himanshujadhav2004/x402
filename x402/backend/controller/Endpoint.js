const Endpoint = require("../model/Endpoint");

exports.createEndpoint = async (req, res) => {
  try {
    const {
      service,
      route,
      upstreamUrl,
      priceAmount,
      tokenAddress,
      merchantWallet,
      secretHeaders,
      description,
      chainId,
    } = req.body;

    const walletAddress = req.headers['x-wallet-address'];
    
    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: "Wallet address required in x-wallet-address header",
      });
    }

    const endpoint = await Endpoint.create({
      merchantId: walletAddress.toLowerCase(),
      merchantWallet: merchantWallet.toLowerCase(),
      service,
      route,
      upstreamUrl,
      priceAmount,
      tokenAddress,
      secretHeaders,
      description,
      chainId,
    });

    res.status(201).json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Endpoint already exists for this service & route",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEndpoints = async (req, res) => {
  try {
    const walletAddress = req.headers['x-wallet-address'];
    
    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: "Wallet address required",
      });
    }

    const endpoints = await Endpoint.find({
      merchantId: walletAddress.toLowerCase(),
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: endpoints.length,
      data: endpoints,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEndpointById = async (req, res) => {
  try {
    const walletAddress = req.headers['x-wallet-address'];
    
    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: "Wallet address required",
      });
    }

    const endpoint = await Endpoint.findOne({
      _id: req.params.id,
      merchantId: walletAddress.toLowerCase(),
    });

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: "Endpoint not found",
      });
    }

    res.status(200).json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateEndpoint = async (req, res) => {
  try {
    const walletAddress = req.headers['x-wallet-address'];
    
    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: "Wallet address required",
      });
    }

    const endpoint = await Endpoint.findOneAndUpdate(
      {
        _id: req.params.id,
        merchantId: walletAddress.toLowerCase(),
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: "Endpoint not found",
      });
    }

    res.status(200).json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteEndpoint = async (req, res) => {
  try {
    const walletAddress = req.headers['x-wallet-address'];
    
    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: "Wallet address required",
      });
    }

    const endpoint = await Endpoint.findOneAndDelete({
      _id: req.params.id,
      merchantId: walletAddress.toLowerCase(),
    });

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: "Endpoint not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Endpoint deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.toggleEndpoint = async (req, res) => {
  try {
    const walletAddress = req.headers['x-wallet-address'];
    
    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: "Wallet address required",
      });
    }

    const endpoint = await Endpoint.findOne({
      _id: req.params.id,
      merchantId: walletAddress.toLowerCase(),
    });

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: "Endpoint not found",
      });
    }

    endpoint.enabled = !endpoint.enabled;
    await endpoint.save();

    res.status(200).json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};