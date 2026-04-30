/**
 * models/User.js
 * Mongoose User model — supports local (password), OTP, and Google auth.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    // Optional — not set for OTP / Google users
    password: {
      type: String,
      required: false,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by default
    },
    // Google OAuth subject identifier
    googleId: {
      type: String,
      sparse: true,
      default: null,
    },
    // How the account was originally created
    authProvider: {
      type: String,
      enum: ['local', 'google', 'otp'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    profileImage: {
      type: String,
      default: '',
    },
    profileCloudinaryId: {
      type: String,
      default: null,
    },
    likedWallpapers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallpaper',
      },
    ],
    downloadedWallpapers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallpaper',
      },
    ],
    // Subscription fields
    subscription: {
      type: String,
      enum: ['free', 'pro', 'premium'],
      default: 'free',
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    dailyDownloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloadReset: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving — only when a password is set/modified
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare plain text password with stored hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Never return password in JSON responses
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
