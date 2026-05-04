const express = require("express");
const router = express.Router();
const {
  createReservation,
  getUserReservations,
  getAllReservations,
  updateReservationStatus,
  cancelReservation,
  getReservationStats
} = require("../controllers/reservationController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public routes (no auth required)
router.post("/create", createReservation);

// Protected routes (require login)
router.get("/my-reservations", protect, getUserReservations);

// Admin only routes
router.get("/all", protect, adminOnly, getAllReservations);
router.put("/:id/status", protect, adminOnly, updateReservationStatus);
router.put("/:id/cancel", protect, cancelReservation);
router.get("/stats", protect, adminOnly, getReservationStats);

module.exports = router;