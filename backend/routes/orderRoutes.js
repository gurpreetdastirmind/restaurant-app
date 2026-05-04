const express = require("express");
const router = express.Router();
const {
  placeOrder,
  getOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public routes
router.post("/place", placeOrder);

// Protected routes (require login)
router.get("/user/:userId", protect, getOrders);
router.get("/:id", protect, getOrderById);

// Admin only routes
router.get("/admin/all", protect, adminOnly, getAllOrders);
router.put("/admin/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;