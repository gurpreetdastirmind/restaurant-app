const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");

// GET all products
exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ADD product with image upload
exports.addProduct = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;
    
    // Get image path if file was uploaded
    let imageUrl = "images/default.jpg";
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const product = new Product({
      name,
      price,
      image: imageUrl,
      category,
      description: description || ""
    });
    
    await product.save();
    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// UPDATE product with image upload
exports.updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // If new image uploaded, update image path
    if (req.file) {
      // Get the existing product to delete old image
      const existingProduct = await Product.findById(req.params.id);
      if (existingProduct && existingProduct.image && existingProduct.image !== "images/default.jpg") {
        const oldImagePath = path.join(__dirname, "..", existingProduct.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    res.json({
      success: true,
      message: "Product updated successfully",
      data: product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// DELETE product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    // Delete image file if not default
    if (product.image && product.image !== "images/default.jpg") {
      const imagePath = path.join(__dirname, "..", product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category: category });
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = [
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
    ];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};