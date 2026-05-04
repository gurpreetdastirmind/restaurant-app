const Cart = require("../models/Cart");

// ADD to cart
exports.addToCart = async (req, res) => {
  const { userId, product } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [product] });
    } else {
      const itemIndex = cart.items.findIndex(
        item => item.productId === product.productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push(product);
      }
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
};

// GET cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.json(cart || { userId: req.params.userId, items: [] });
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ error: "Failed to get cart" });
  }
};

// REMOVE item
exports.removeItem = async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (cart) {
      cart.items = cart.items.filter(item => item.productId !== productId);
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ error: "Failed to remove item" });
  }
};