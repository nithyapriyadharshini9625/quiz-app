const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function() {
      return !this.googleId; // Required only if not using Google OAuth
    },
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Required only if not using Google OAuth
    },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  profilePicture: {
    type: String,
    default: null
  },
      role: {
        type: String,
        enum: ['admin', 'superadmin', 'user', 'manager'],
        default: 'user'
      }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  // Only hash password if it's modified and exists (not for Google OAuth users)
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password || !candidatePassword) {
    return false;
  }
  
  // All passwords should be hashed - use bcrypt.compare
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    // If comparison fails (e.g., password not properly hashed), return false
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);

