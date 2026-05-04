const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");

const {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getCategories
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/category/:category", getProductsByCategory);
router.get("/:id", getProductById);

// Admin only routes with image upload
router.post("/", protect, adminOnly, upload.single("image"), addProduct);
router.put("/:id", protect, adminOnly, upload.single("image"), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;