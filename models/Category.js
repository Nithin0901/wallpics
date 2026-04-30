import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    emoji: {
      type: String,
      trim: true,
      default: '📁',
    },
    seed: {
      type: String,
      trim: true,
      default: 'nature',
    },
    image: {
      type: String,
      default: '',
    },
    cloudinaryId: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ['main', 'sub'],
      default: 'sub',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for counting wallpapers (requires querying Wallpaper collection in API)
// Use this pattern to prevent model overwrite errors in Next.js dev mode, 
// and to ensure schema changes (like new fields) take effect.
if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

export default mongoose.model('Category', CategorySchema);
