const express = require('express');
const router = express.Router();
const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCouponToCart,
   getPublicCoupons
} = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/public', getPublicCoupons); 

// Admin only routes
router.post('/', protect, adminOnly, createCoupon);
router.get('/', protect, adminOnly, getAllCoupons);
router.get('/:id', protect, adminOnly, getCouponById);
router.put('/:id', protect, adminOnly, updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

// Public routes for coupon validation
router.post('/validate', validateCoupon);
router.post('/apply', protect, applyCouponToCart);

module.exports = router;