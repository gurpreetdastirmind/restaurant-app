const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

router.post("/admin-forgot-password", adminForgotPassword);
router.post("/admin-verify-otp", adminVerifyOTP);
router.post("/admin-reset-password", adminResetPassword);

// Protected routes (require authentication)
router.get("/me", protect, getMe);
router.post("/logout", protect, logoutUser);
router.get("/token-status", protect, getTokenStatus);
router.put("/profile", protect, updateProfile);  

module.exports = router;