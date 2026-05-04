const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Token = require("../models/Token");

// Verify Token Middleware
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Check if token is blacklisted
      const blacklistedToken = await Token.findOne({ 
        token: token, 
        isRevoked: true 
      });
      
      if (blacklistedToken) {
        return res.status(401).json({
          success: false,
          message: "Token has been revoked. Please login again.",
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token exists in DB and not expired
      const savedToken = await Token.findOne({ token: token });
      if (savedToken && savedToken.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please login again.",
        });
      }

      // Get user from database
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated. Please contact support.",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please login again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
};

// Staff or Admin middleware
const staffOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "staff")) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Staff or Admin only.",
    });
  }
};

module.exports = {
  protect,
  adminOnly,
  staffOrAdmin,
};