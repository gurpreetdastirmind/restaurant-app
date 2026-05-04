const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true, // Add index here instead
  },
  type: {
    type: String,
    enum: ["access", "refresh", "reset"],
    default: "access",
    index: true, // Add index for type
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true, // Add index for expiration
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true, // Add index for revoked status
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for common query patterns
tokenSchema.index({ userId: 1, type: 1, isRevoked: 1 });
tokenSchema.index({ expiresAt: 1, isRevoked: 1 });

module.exports = mongoose.model("Token", tokenSchema);