const Order = require("../models/Order");
const Cart = require("../models/Cart");

// PLACE ORDER
exports.placeOrder = async (req, res) => {
  try {
    const { 
      userId, 
      items, 
      subtotal, 
      tax, 
      total, 
      customerInfo 
    } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Cart is empty" 
      });
    }

    // Create order with all details
    const orderData = {
      userId: userId || null,
      items: items,
      subtotal: subtotal || 0,
      tax: tax || 0,
      total: total || 0,
      customerInfo: customerInfo || {},
      orderNumber: 'ORD-' + Math.floor(Math.random() * 10000) + Date.now().toString().slice(-6),
      status: 'pending',
      orderDate: new Date()
    };

    const order = new Order(orderData);
    await order.save();

    // Clear cart if user is logged in
    if (userId) {
      try {
        const cart = await Cart.findOne({ userId: userId });
        if (cart) {
          cart.items = [];
          await cart.save();
        }
      } catch (err) {
        console.error("Error clearing cart:", err);
      }
    }

    res.status(201).json({ 
      success: true, 
      message: "Order placed successfully", 
      order: order 
    });
  } catch (error) {
    console.error("Place order error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to place order", 
      error: error.message 
    });
  }
};

// GET orders for a specific user
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      data: orders 
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get orders" 
    });
  }
};

// GET single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: order 
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get order" 
    });
  }
};

// GET all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      count: orders.length,
      data: orders 
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get orders" 
    });
  }
};

// UPDATE order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    order.status = status;
    order.updatedAt = Date.now();
    await order.save();
    
    res.status(200).json({ 
      success: true, 
      message: "Order status updated", 
      data: order 
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update order status" 
    });
  }
};