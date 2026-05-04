// Token expiration checker utility
const checkTokenExpiration = () => {
  const token = localStorage.getItem('token');
  const expiresAt = localStorage.getItem('tokenExpiresAt');
  
  if (!token || !expiresAt) {
    return { isValid: false, message: 'No token found' };
  }
  
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  
  if (expiryDate < now) {
    return { isValid: false, message: 'Token has expired' };
  }
  
  // Check if token will expire in less than 1 day
  const timeLeft = expiryDate - now;
  const hoursLeft = timeLeft / (1000 * 60 * 60);
  
  return { 
    isValid: true, 
    timeLeftMs: timeLeft,
    hoursLeft: hoursLeft,
    willExpireSoon: hoursLeft < 24,
    expiresAt: expiresAt
  };
};

// Auto logout when token expires
const setupTokenExpiryCheck = () => {
  setInterval(async () => {
    const status = checkTokenExpiration();
    
    if (!status.isValid) {
      // Token expired, logout user
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiresAt');
      
      // Show message and redirect to login
      alert('Your session has expired. Please login again.');
      window.location.href = '/login.html';
    } else if (status.willExpireSoon) {
      // Show warning for expiring soon (optional)
      console.log(`Token will expire in ${Math.round(status.hoursLeft)} hours`);
    }
  }, 60000); // Check every minute
};

// Refresh token function
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('tokenExpiresAt', data.data.expiresAt);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
  
  return false;
};