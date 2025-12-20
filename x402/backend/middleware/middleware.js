exports.extractWallet = (req, res, next) => {
  const walletAddress = req.headers['x-wallet-address'];
  
  if (!walletAddress) {
    return res.status(401).json({
      success: false,
      message: "Wallet address required in x-wallet-address header",
    });
  }

  req.user = {
    id: walletAddress.toLowerCase(),
    address: walletAddress.toLowerCase(),
  };
  
  next();
};