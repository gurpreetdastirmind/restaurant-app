const nodemailer = require('nodemailer');

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'yourappemail@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD || 'your_app_password_here'
    }
  });
};

// Function to send contact form email
const sendContactEmail = async (name, email, phone, subject, message) => {
  try {
    const transporter = createTransporter();
    
    // Email to admin (you) - Shows the customer's name as sender
    const adminMailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER || 'yourappemail@gmail.com'}>`,
      replyTo: email,
      to: 'rathoresingh523@gmail.com',
      subject: `📧 New Contact Form Message: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #c49a6c; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #c49a6c; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 5px; }
            .reply-button { 
              display: inline-block; 
              background: #c49a6c; 
              color: white; 
              padding: 10px 20px; 
              text-decoration: none; 
              border-radius: 5px;
              margin-top: 15px;
            }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📬 New Contact Form Submission</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">👤 Sender Name:</div>
                <div class="value"><strong>${escapeHtml(name)}</strong></div>
              </div>
              <div class="field">
                <div class="label">📧 Sender Email:</div>
                <div class="value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
              </div>
              <div class="field">
                <div class="label">📞 Phone:</div>
                <div class="value">${escapeHtml(phone) || 'Not provided'}</div>
              </div>
              <div class="field">
                <div class="label">📌 Subject:</div>
                <div class="value">${escapeHtml(subject)}</div>
              </div>
              <div class="field">
                <div class="label">💬 Message:</div>
                <div class="value">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
              </div>
              <div style="text-align: center;">
                <a href="mailto:${escapeHtml(email)}?subject=Re: ${escapeHtml(subject)}" class="reply-button">
                  📧 Reply to ${escapeHtml(name)}
                </a>
              </div>
            </div>
            <div class="footer">
              <p>This message was sent from your restaurant website contact form.</p>
              <p>Sent on: ${new Date().toLocaleString()}</p>
              <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    // Auto-reply to customer - Shows restaurant name as sender
    const customerMailOptions = {
      from: `"Olives Mediterranean Grill" <${process.env.EMAIL_USER || 'yourappemail@gmail.com'}>`,
      to: email,
      subject: `Thank you for contacting Olives Mediterranean Grill`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #c49a6c; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
            .button { 
              display: inline-block; 
              background: #c49a6c; 
              color: white; 
              padding: 10px 20px; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 10px;
            }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Thank You for Contacting Us! 🍽️</h2>
            </div>
            <div class="content">
              <p>Dear <strong>${escapeHtml(name)}</strong>,</p>
              <p>Thank you for reaching out to <strong>Olives Mediterranean Grill</strong>. We have received your message and will get back to you within 24-48 hours.</p>
              
              <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📝 Your Message Summary:</strong></p>
                <p style="margin: 10px 0 0 0; font-style: italic;">"${escapeHtml(message.substring(0, 300))}${message.length > 300 ? '...' : ''}"</p>
              </div>
              
              <p><strong>📌 Quick Actions:</strong></p>
              <div style="text-align: center;">
                <a href="http://localhost:5500/menu.html" class="button">🍽️ Browse Menu</a>
                <a href="http://localhost:5500/reservation.html" class="button">📅 Make Reservation</a>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
                <p style="margin: 0;"><strong>📞 Need Immediate Assistance?</strong></p>
                <p style="margin: 5px 0 0 0;">Call us directly at: <strong>+1587 272 1088</strong></p>
                <p style="margin: 5px 0 0 0;">Visit us: 159 B Leva Avenue, Unit 103, Red Deer County AB</p>
              </div>
              
              <p style="margin-top: 20px;">Best regards,<br>
              <strong>Olives Mediterranean Grill Team</strong><br>
              <span style="font-size: 12px; color: #666;">Creating memorable dining experiences since 2008</span></p>
            </div>
            <div class="footer">
              <p>This is an automated response. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Olives Mediterranean Grill. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    // Send both emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(customerMailOptions);
    
    return { success: true, message: "Emails sent successfully" };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, message: error.message };
  }
};

// Function to send OTP email for password reset
const sendOTPEmail = async (email, name, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Olives Mediterranean Grill" <${process.env.EMAIL_USER || 'yourappemail@gmail.com'}>`,
      to: email,
      subject: 'Password Reset OTP - Olives Mediterranean Grill',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #c49a6c; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
            .otp-code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #c49a6c; 
              text-align: center;
              letter-spacing: 5px;
              padding: 15px;
              background: white;
              border-radius: 10px;
              margin: 20px 0;
            }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { color: #dc3545; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Password Reset Request 🔐</h2>
            </div>
            <div class="content">
              <p>Dear <strong>${escapeHtml(name)}</strong>,</p>
              <p>We received a request to reset your password for your Olives Mediterranean Grill account.</p>
              <p>Use the following OTP (One-Time Password) to reset your password:</p>
              <div class="otp-code">${otp}</div>
              <p>This OTP is valid for <strong>10 minutes</strong>.</p>
              <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
              <div class="warning">
                <p>⚠️ Never share this OTP with anyone.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Olives Mediterranean Grill. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("OTP email error:", error);
    return { success: false, message: error.message };
  }
};

// Function to send password reset success email
const sendPasswordResetSuccessEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Olives Mediterranean Grill" <${process.env.EMAIL_USER || 'yourappemail@gmail.com'}>`,
      to: email,
      subject: 'Password Reset Successful - Olives Mediterranean Grill',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
            .button { 
              display: inline-block; 
              background: #c49a6c; 
              color: white; 
              padding: 10px 20px; 
              text-decoration: none; 
              border-radius: 5px;
              margin-top: 15px;
            }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Password Reset Successful ✅</h2>
            </div>
            <div class="content">
              <p>Dear <strong>${escapeHtml(name)}</strong>,</p>
              <p>Your password has been successfully reset.</p>
              <p>You can now log in to your account with your new password.</p>
              <div style="text-align: center;">
                <a href="http://localhost:5500/login.html" class="button">Login to Your Account</a>
              </div>
              <p>If you did not perform this action, please contact us immediately.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Olives Mediterranean Grill. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Success email sent" };
  } catch (error) {
    console.error("Success email error:", error);
    return { success: false, message: error.message };
  }
};

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Export all functions
module.exports = { 
  sendContactEmail, 
  sendOTPEmail, 
  sendPasswordResetSuccessEmail 
};