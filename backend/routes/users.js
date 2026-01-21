const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');
const { canDeleteUser, canAccessUsers, canCreate, canEdit } = require('../middleware/permissions');

const router = express.Router();

// Get user statistics (Admin and Super Admin only - Managers cannot access) - MUST be before /:id route
router.get('/stats/overview', adminAuth, canAccessUsers, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });
    const totalManagers = await User.countDocuments({ role: 'manager' });
    
    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    res.json({
      totalUsers,
      totalAdmins,
      totalRegularUsers,
      totalManagers,
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (Admin and Super Admin only - Managers cannot access)
router.get('/', adminAuth, canAccessUsers, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Exclude password from response
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single user by ID (Admin and Super Admin only - Managers cannot access) - Include hashed password for admin view
router.get('/:id', adminAuth, canAccessUsers, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user with hashed password (for admin to see it's set, but can't decrypt)
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user (Admin only)
router.post('/', adminAuth, canAccessUsers, canCreate, async (req, res) => {
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

    // Normalize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    // Validate role if provided
      if (role && !['admin', 'superadmin', 'user', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, superadmin, user, or manager' });
    }

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

    // Create user (password will be hashed by pre-save hook)
    const user = new User({ 
      username: normalizedUsername, 
      email: normalizedEmail, 
      password, 
      role: role || 'user' 
    });
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field === 'email' ? 'Email' : 'Username'} already exists` 
      });
    }
    res.status(500).json({ message: error.message || 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (req.user._id.toString() === req.params.id && role && role !== user.role) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) {
      if (!['admin', 'user', 'manager'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be admin, superadmin, user, or manager' });
      }
      updateData.role = role;
    }
    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      // Hash password before updating (findByIdAndUpdate doesn't trigger pre-save hook)
      updateData.password = await bcrypt.hash(password, 10);
    } else {
      // If password is not provided when updating, keep existing password
      // Don't update password field
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user role (Admin and Super Admin only - Managers cannot access)
router.put('/:id/role', adminAuth, canAccessUsers, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['admin', 'user', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, superadmin, user, or manager' });
    }
    
    // Prevent admin from changing their own role
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (Admin and Super Admin only - Managers cannot access)
router.delete('/:id', adminAuth, canAccessUsers, canDeleteUser, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

