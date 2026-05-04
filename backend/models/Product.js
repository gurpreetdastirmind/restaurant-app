const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    default: "images/default.jpg"
  },
  category: {
    type: String,
    required: true,
    enum: [
       "OMG! Menu", 
      "Grilled Wraps",
      "Salads",
      "Mediterranean Plater",
      "Sides",
      "Calamari",
      "Baklava (Piece)",
      "Beverages",
      "Local Favorites",
      "Classic Poutines"
    ]
  },
  description: {
    type: String,
    default: ""
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Product", productSchema);