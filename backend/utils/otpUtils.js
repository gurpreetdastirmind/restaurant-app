// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get OTP expiration time (10 minutes from now)
const getOTPExpiration = () => {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10);
  return expires;
};

// Check if OTP is expired
const isOTPExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

module.exports = {
  generateOTP,
  getOTPExpiration,
  isOTPExpired
};