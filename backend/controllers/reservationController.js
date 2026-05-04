const Reservation = require("../models/Reservation");

// @desc    Create a new reservation
// @route   POST /api/reservations/create
// @access  Public
const createReservation = async (req, res) => {
  try {
    const { name, email, phone, date, time, guests, userId, specialRequests } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !date || !time || !guests) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Validate guests count
    if (guests < 1 || guests > 20) {
      return res.status(400).json({
        success: false,
        message: "Number of guests must be between 1 and 20",
      });
    }

    // Check if table is available at that time (simple check)
    const existingReservation = await Reservation.findOne({
      date: date,
      time: time,
      status: { $in: ["pending", "confirmed"] }
    });

    // For demo purposes, we'll still allow but you can add capacity limits
    // In a real app, you'd check against table capacity

    const reservation = await Reservation.create({
      name,
      email,
      phone,
      date,
      time,
      guests: parseInt(guests),
      userId: userId || null,
      specialRequests: specialRequests || "",
      status: "pending"
    });

    res.status(201).json({
      success: true,
      message: "Reservation created successfully! We'll contact you shortly.",
      data: reservation,
    });
  } catch (error) {
    console.error("Create reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
      error: error.message,
    });
  }
};

// @desc    Get user's reservations
// @route   GET /api/reservations/my-reservations
// @access  Private
const getUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    console.error("Get user reservations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get all reservations (Admin only)
// @route   GET /api/reservations/all
// @access  Private/Admin
const getAllReservations = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (startDate) {
      filter.date = { $gte: startDate };
    }
    if (endDate) {
      filter.date = { ...filter.date, $lte: endDate };
    }

    const reservations = await Reservation.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    console.error("Get all reservations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update reservation status (Admin only)
// @route   PUT /api/reservations/:id/status
// @access  Private/Admin
const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    reservation.status = status;
    reservation.updatedAt = Date.now();
    await reservation.save();

    res.status(200).json({
      success: true,
      message: `Reservation ${status} successfully`,
      data: reservation,
    });
  } catch (error) {
    console.error("Update reservation status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Cancel reservation (User can cancel their own)
// @route   PUT /api/reservations/:id/cancel
// @access  Private
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    // Check if user owns this reservation or is admin
    if (reservation.userId && reservation.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this reservation",
      });
    }

    reservation.status = "cancelled";
    reservation.updatedAt = Date.now();
    await reservation.save();

    res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully",
      data: reservation,
    });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get reservation statistics (Admin only)
// @route   GET /api/reservations/stats
// @access  Private/Admin
const getReservationStats = async (req, res) => {
  try {
    const total = await Reservation.countDocuments();
    const pending = await Reservation.countDocuments({ status: "pending" });
    const confirmed = await Reservation.countDocuments({ status: "confirmed" });
    const cancelled = await Reservation.countDocuments({ status: "cancelled" });
    const completed = await Reservation.countDocuments({ status: "completed" });

    // Today's reservations
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = await Reservation.countDocuments({ date: today });

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        confirmed,
        cancelled,
        completed,
        today: todayReservations,
      },
    });
  } catch (error) {
    console.error("Get reservation stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createReservation,
  getUserReservations,
  getAllReservations,
  updateReservationStatus,
  cancelReservation,
  getReservationStats,
};