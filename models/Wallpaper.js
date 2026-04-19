/**
 * models/Wallpaper.js
 * Mongoose Wallpaper model with status-based moderation workflow.
 */
import mongoose from 'mongoose';



const WallpaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    // Stores local path (/uploads/filename.jpg) or external URL for demo data
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    mainCategory: {
      type: String,
      required: [true, 'Main category (orientation) is required'],
    },
    subCategory: {
      type: String,
      required: [true, 'Subcategory (theme) is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Moderation workflow: pending → approved | rejected
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // Admin who last changed the status
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Plan required for download
    planRequired: {
      type: String,
      enum: ['free', 'pro', 'premium'],
      default: 'free',
    },
    // Descriptive tags for discovery
    tags: {
      type: [String],
      default: [],
    },
    // Dominant Color Palette (HEX code strings)
    colors: {
      type: [String],
      default: [],
    },
    // Featured content flag
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient public query (approved + sorted by date)
WallpaperSchema.index({ status: 1, createdAt: -1 });
// Index for featured content
WallpaperSchema.index({ isFeatured: 1, featuredAt: -1 });
// Text index for search functionality
WallpaperSchema.index({ title: 'text', mainCategory: 'text', subCategory: 'text' });
// Index for user uploads query
WallpaperSchema.index({ uploadedBy: 1, status: 1 });

// Virtual: trending score = likes*3 + downloads*2 + views
WallpaperSchema.virtual('trendingScore').get(function () {
  return this.likes * 3 + this.downloads * 2 + this.views;
});

WallpaperSchema.set('toObject', { virtuals: true });
WallpaperSchema.set('toJSON', { virtuals: true });

// Use this pattern to prevent model overwrite errors in Next.js dev mode, 
// and to ensure schema changes (like removing the category enum) take effect.
if (mongoose.models.Wallpaper) {
  delete mongoose.models.Wallpaper;
}

export default mongoose.model('Wallpaper', WallpaperSchema);
