const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import User model
const User = require("./models/User");

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "guru24055@gmail.com" });
    
    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email: guru24055@gmail.com");
      console.log("Password: Admin@123");
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      firstName: "Super",
      lastName: "Admin",
      email: "guru24055@gmail.com",
      phone: "1234567890",
      password: "Admin@123",
      role: "admin",
      isActive: true,
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: guru24055@gmail.com");
    console.log("🔑 Password: Admin@123");
    console.log("👑 Role: Admin");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();