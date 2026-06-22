const User = require("../models/User");
const Token = require("../models/Token");
const jwt = require("jsonwebtoken");
const { sendOTPEmail, sendPasswordResetSuccessEmail } = require('../config/emailConfig');
const { generateOTP, getOTPExpiration, isOTPExpired } = require('../utils/otpUtils');

// Generate JWT Token
const generateToken = (userId, role, expiresIn = "7d") => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: expiresIn }
  );
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

    console.log('Registration attempt for:', email);

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: phone || "",
      password: password,
    });

    console.log('User created successfully:', user._id);

    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await Token.create({
      token: token,
      userId: user._id,
      type: "access",
      expiresAt: expiresAt,
    });

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);
    await Token.create({
      token: refreshToken,
      userId: user._id,
      type: "refresh",
      expiresAt: refreshExpiresAt,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: { street: "", city: "", state: "", postalCode: "" }, 
        token: token,
        refreshToken: refreshToken,
        expiresIn: 7 * 24 * 60 * 60 * 1000,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await Token.deleteMany({ userId: user._id, type: "access" });

    await Token.create({
      token: token,
      userId: user._id,
      type: "access",
      expiresAt: expiresAt,
    });

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);
    await Token.create({
      token: refreshToken,
      userId: user._id,
      type: "refresh",
      expiresAt: refreshExpiresAt,
    });

    console.log('User logged in successfully:', user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address || { street: "", city: "", state: "", postalCode: "" },
        token: token,
        refreshToken: refreshToken,
        expiresIn: 7 * 24 * 60 * 60 * 1000,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const savedToken = await Token.findOne({ 
      token: refreshToken, 
      type: "refresh",
      isRevoked: false 
    });

    if (!savedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (savedToken.expiresAt < new Date()) {
      await Token.deleteOne({ token: refreshToken });
      return res.status(401).json({
        success: false,
        message: "Refresh token has expired. Please login again.",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    const newToken = generateToken(decoded.id, decoded.role);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await Token.create({
      token: newToken,
      userId: decoded.id,
      type: "access",
      expiresAt: expiresAt,
    });

    await Token.deleteMany({ userId: decoded.id, type: "access", token: { $ne: newToken } });

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        expiresIn: 7 * 24 * 60 * 60 * 1000,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    
    await Token.findOneAndUpdate(
      { token: token },
      { isRevoked: true }
    );

    await Token.updateMany(
      { userId: req.user._id, type: "refresh" },
      { isRevoked: true }
    );

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get token status/expiry info
// @route   GET /api/auth/token-status
// @access  Private
const getTokenStatus = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    
    const tokenDoc = await Token.findOne({ token: token });
    
    if (!tokenDoc) {
      return res.status(404).json({
        success: false,
        message: "Token not found",
      });
    }

    const isExpired = tokenDoc.expiresAt < new Date();
    const timeLeft = tokenDoc.expiresAt - new Date();

    res.status(200).json({
      success: true,
      data: {
        isExpired: isExpired,
        expiresAt: tokenDoc.expiresAt,
        timeLeftMs: timeLeft,
        timeLeftDays: Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24))),
        timeLeftHours: Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update user profile (for logged in users)
// @route   PUT /api/auth/profile
// @access  Private
// @desc    Update user profile (for logged in users)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    // Update basic fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;
    
    // ✅ Update address fields
    if (address) {
      user.address = {
        street: address.street || user.address?.street || "",
        city: address.city || user.address?.city || "",
        state: address.state || user.address?.state || "",
        postalCode: address.postalCode || user.address?.postalCode || ""
      };
    }
    
    user.updatedAt = Date.now();
    await user.save();

    const updatedUser = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address, // ✅ Include address in response
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ========== CUSTOMER PASSWORD RESET FUNCTIONS ==========

// @desc    Forgot password - send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address"
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address"
      });
    }
    
    const otp = generateOTP();
    const otpExpiry = getOTPExpiration();
    
    user.resetOTP = otp;
    user.resetOTPExpires = otpExpiry;
    await user.save();
    
    const emailResult = await sendOTPEmail(user.email, user.firstName, otp);
    
    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: "OTP sent to your email address",
        email: user.email
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again."
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
      error: error.message
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and OTP"
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() }).select("+resetOTP +resetOTPExpires");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    if (!user.resetOTP || user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }
    
    if (isOTPExpired(user.resetOTPExpires)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }
    
    res.status(200).json({
      success: true,
      message: "OTP verified successfully"
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again."
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() }).select("+resetOTP +resetOTPExpires");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    if (!user.resetOTP || user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }
    
    if (isOTPExpired(user.resetOTPExpires)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }
    
    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    user.updatedAt = Date.now();
    await user.save();
    
    await sendPasswordResetSuccessEmail(user.email, user.firstName);
    
    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login with your new password."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again."
    });
  }
};

// ========== ADMIN PASSWORD RESET FUNCTIONS ==========

// @desc    Admin Forgot password - send OTP
// @route   POST /api/auth/admin-forgot-password
// @access  Public
const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address"
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address"
      });
    }
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "This account does not have admin privileges"
      });
    }
    
    const otp = generateOTP();
    const otpExpiry = getOTPExpiration();
    
    user.resetOTP = otp;
    user.resetOTPExpires = otpExpiry;
    await user.save();
    
    const emailResult = await sendOTPEmail(user.email, user.firstName, otp);
    
    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: "OTP sent to your admin email address",
        email: user.email
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again."
      });
    }
  } catch (error) {
    console.error("Admin forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
      error: error.message
    });
  }
};

// @desc    Admin Verify OTP
// @route   POST /api/auth/admin-verify-otp
// @access  Public
const adminVerifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and OTP"
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() }).select("+resetOTP +resetOTPExpires");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "This account does not have admin privileges"
      });
    }
    
    if (!user.resetOTP || user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }
    
    if (isOTPExpired(user.resetOTPExpires)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }
    
    res.status(200).json({
      success: true,
      message: "OTP verified successfully"
    });
  } catch (error) {
    console.error("Admin verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again."
    });
  }
};

// @desc    Admin Reset Password
// @route   POST /api/auth/admin-reset-password
// @access  Public
const adminResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() }).select("+resetOTP +resetOTPExpires");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "This account does not have admin privileges"
      });
    }
    
    if (!user.resetOTP || user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }
    
    if (isOTPExpired(user.resetOTPExpires)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }
    
    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    user.updatedAt = Date.now();
    await user.save();
    
    await sendPasswordResetSuccessEmail(user.email, user.firstName);
    
    res.status(200).json({
      success: true,
      message: "Admin password reset successfully. You can now login with your new password."
    });
  } catch (error) {
    console.error("Admin reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again."
    });
  }
};

// ========== MODULE EXPORTS ==========

module.exports = {
  registerUser,
  loginUser,
  getMe,
  refreshToken,
  logoutUser,
  getTokenStatus,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
  adminForgotPassword,
  adminVerifyOTP,
  adminResetPassword
};