const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Token = require("../models/Token");

const router = express.Router();

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // User exists, update Google ID if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        }
        
        // Create new user
        user = await User.create({
          firstName: profile.name.givenName || "",
          lastName: profile.name.familyName || "",
          email: profile.emails[0].value,
          googleId: profile.id,
          password: Math.random().toString(36).slice(-16), // Random password
          isVerified: true,
        });
        
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Generate JWT for user
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Google Auth Routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "http://localhost:5500/login.html" }),
  async (req, res) => {
    try {
      const user = req.user;
      const token = generateToken(user._id, user.role);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await Token.create({
        token: token,
        userId: user._id,
        type: "access",
        expiresAt: expiresAt,
      });
      
      // Redirect back to frontend with token
      const redirectUrl = `https://restaurant-app-ru0u.onrender.com/auth-callback.html?token=${token}&userId=${user._id}&firstName=${user.firstName}&lastName=${user.lastName}&email=${user.email}&role=${user.role}`;
      res.redirect(redirectUrl);
    } catch (err) {
      res.redirect("https://restaurant-app-ru0u.onrender.com/login.html?error=google_auth_failed");
    }
  }
);

module.exports = router;