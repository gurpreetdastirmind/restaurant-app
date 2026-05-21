const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Coupon name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'bogo', 'freeshipping'],
    required: true
  },
  value: {
    type: Number,
    required: function() {
      return this.type === 'percentage' || this.type === 'fixed';
    },
    min: 0
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  maximumDiscount: {
    type: Number,
    default: null,
    comment: 'Maximum discount amount for percentage coupons'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null,
    comment: 'Total times this coupon can be used'
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1,
    comment: 'How many times a single user can use this coupon'
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster lookups
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ expiryDate: 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = async function(userId, cartTotal) {
  // Check if active
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' };
  
  // Check expiry date
  const now = new Date();
  if (now < this.startDate) return { valid: false, message: 'Coupon not yet started' };
  if (now > this.expiryDate) return { valid: false, message: 'Coupon has expired' };
  
  // Check usage limit
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  
  // Check minimum order amount
  if (cartTotal < this.minimumOrderAmount) {
    return { valid: false, message: `Minimum order amount of $${this.minimumOrderAmount} required` };
  }
  
  return { valid: true, message: 'Coupon is valid' };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function(cartTotal) {
  let discount = 0;
  
  switch(this.type) {
    case 'percentage':
      discount = (cartTotal * this.value) / 100;
      if (this.maximumDiscount && discount > this.maximumDiscount) {
        discount = this.maximumDiscount;
      }
      break;
    case 'fixed':
      discount = Math.min(this.value, cartTotal);
      break;
    case 'freeshipping':
      discount = 0; // Will be applied in order calculation
      break;
    case 'bogo':
      discount = 0; // Will be applied based on products
      break;
  }
  
  return parseFloat(discount.toFixed(2));
};

module.exports = mongoose.model('Coupon', couponSchema);