const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart"); // ← ADD THIS IMPORT!

const {
  addToCart,
  getCart,
  removeItem
} = require("../controllers/cartController");

router.post("/add", addToCart);
router.get("/:userId", getCart);
router.post("/remove", removeItem);

// Update quantity route
router.put("/update", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      const itemIndex = cart.items.findIndex(item => item.productId === productId);
      if (itemIndex > -1) {
        if (quantity <= 0) {
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
        await cart.save();
      }
    }
    res.json(cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

module.exports = router;