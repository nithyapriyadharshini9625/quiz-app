const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { auth } = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/emailService');

const router = express.Router();

// Initialize Google OAuth Client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
);

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Validate username
    if (username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: normalizedEmail }, 
        { username: normalizedUsername }
      ] 
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      if (existingUser.username === normalizedUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Validate role if provided
    if (role && !['admin', 'superadmin', 'user', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = new User({ 
      username: normalizedUsername, 
      email: normalizedEmail, 
      password, 
      role: role || 'user' 
    });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field === 'email' ? 'Email' : 'Username'} already exists` 
      });
    }
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user has a password (not Google OAuth user)
    if (!user.password) {
      return res.status(400).json({ 
        message: 'This account uses Google Sign-In. Please use Google to login.' 
      });
    }

    // Check if password is hashed (should always be, but handle legacy data)
    let isMatch = false;
    if (user.password.startsWith('$2')) {
      // Password is hashed - use standard comparison
      isMatch = await user.comparePassword(password);
    } else {
      // Legacy plain text password - compare directly, then rehash for security
      isMatch = password === user.password;
      if (isMatch) {
        // Rehash the password for security
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ 
        message: 'If the email exists, an OTP has been sent to your email address.' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: email.toLowerCase().trim() });

    // Save OTP to database (expires in 10 minutes)
    const otpRecord = new OTP({
      email: email.toLowerCase().trim(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    await otpRecord.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(email.toLowerCase().trim(), otp);

    if (!emailResult.success) {
      await OTP.deleteOne({ _id: otpRecord._id });
      console.error('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({ 
        message: emailResult.error || 'Failed to send email. Please try again later.' 
      });
    }

    res.json({ 
      message: 'OTP has been sent to your email address. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase().trim(),
      otp: otp.trim()
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // OTP is valid
    res.json({ 
      message: 'OTP verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase().trim(),
      otp: otp.trim()
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});

// Google OAuth - Verify token from frontend
router.post('/google', async (req, res) => {
  try {
    const { tokenId } = req.body;

    console.log('Google OAuth request received');
    console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'NOT SET');
    console.log('Token ID received:', tokenId ? 'Yes' : 'No');

    if (!tokenId) {
      console.error('No tokenId provided');
      return res.status(400).json({ message: 'Google token is required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID not configured');
      return res.status(500).json({ message: 'Google OAuth not configured on server' });
    }

    // Verify the Google token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      console.log('Token verified successfully');
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError.message);
      return res.status(401).json({ 
        message: 'Invalid Google token. Please try signing in again.',
        error: verifyError.message 
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    console.log('User info from Google:', { email, name, googleId });

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      // User exists - update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = picture;
        if (!user.username) {
          user.username = name || email.split('@')[0];
        }
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        googleId,
        email: email.toLowerCase(),
        username: name || email.split('@')[0],
        profilePicture: picture,
        role: 'user' // Default role for OAuth users
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('User authenticated successfully:', user.email);
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Google authentication failed. Please try again.',
      error: error.message 
    });
  }
});

module.exports = router;

