const { sendContactEmail } = require('../config/emailConfig');

// @desc    Handle contact form submission
// @route   POST /api/contact/send
// @access  Public
const sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, subject and message"
      });
    }
    
    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }
    
    // Send emails
    const result = await sendContactEmail(name, email, phone || 'Not provided', subject, message);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Message sent successfully! We'll get back to you soon."
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send message. Please try again later."
      });
    }
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
};

module.exports = { sendContactMessage };