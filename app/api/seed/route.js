/**
 * app/api/seed/route.js
 * POST /api/seed — Seed demo data (dev only).
 * Creates superadmin + sample approved wallpapers using Picsum images.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Wallpaper from '@/models/Wallpaper';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

const DEMO_MAIN_CATEGORIES = [
  { name: 'Portrait', description: 'Vertical focus, characters', emoji: '👤', seed: 'por', type: 'main' },
  { name: 'Landscape', description: 'Wide vistas, scenic views', emoji: '🌄', seed: 'lan', type: 'main' },
];

const DEMO_SUB_CATEGORIES = [
  { name: 'Nature', description: 'Landscapes, forests, oceans', emoji: '🌿', seed: 'nat', type: 'sub' },
  { name: 'Anime', description: 'Anime artwork & illustrations', emoji: '⚡', seed: 'ani', type: 'sub' },
  { name: 'Minimal', description: 'Clean, simple, aesthetic', emoji: '◻️', seed: 'min', type: 'sub' },
  { name: 'Space', description: 'Galaxies, planets, cosmos', emoji: '🌌', seed: 'spa', type: 'sub' },
  { name: 'Cars', description: 'Supercars, classics, races', emoji: '🚗', seed: 'car', type: 'sub' },
  { name: 'City', description: 'Urban, skylines, nightlife', emoji: '🏙️', seed: 'cit', type: 'sub' },
  { name: 'Abstract', description: 'Patterns, colors, textures', emoji: '🎨', seed: 'abs', type: 'sub' },
  { name: 'Fantasy', description: 'Dragons, magic, mythical', emoji: '🐉', seed: 'fan', type: 'sub' },
];

const DEMO_WALLPAPERS = [
  { title: 'Sunset in the Mountains', mainCategory: 'Landscape', subCategory: 'Nature', image: 'https://picsum.photos/seed/mtn1/1920/1080', likes: 1200, downloads: 3400, views: 12000 },
  { title: 'Cyberpunk City Lights', mainCategory: 'Landscape', subCategory: 'City', image: 'https://picsum.photos/seed/city1/1920/1080', likes: 2100, downloads: 5700, views: 18000 },
  { title: 'Galactic Beauty', mainCategory: 'Landscape', subCategory: 'Space', image: 'https://picsum.photos/seed/space1/1920/1080', likes: 1800, downloads: 4100, views: 15000 },
  { title: 'Midnight Racer', mainCategory: 'Landscape', subCategory: 'Cars', image: 'https://picsum.photos/seed/car1/1920/1080', likes: 1600, downloads: 3800, views: 13000 },
  { title: 'Anime Samurai', mainCategory: 'Portrait', subCategory: 'Anime', image: 'https://picsum.photos/seed/sam1/1080/1920', likes: 2500, downloads: 6000, views: 25000 },
  { title: 'Neon Portrait', mainCategory: 'Portrait', subCategory: 'Abstract', image: 'https://picsum.photos/seed/neonpor1/1080/1920', likes: 1400, downloads: 3200, views: 11000 },
  { title: 'Mountain Peak at Dawn', mainCategory: 'Landscape', subCategory: 'Nature', image: 'https://picsum.photos/seed/peak1/1920/1080', likes: 1300, downloads: 2900, views: 10000 },
  { title: 'Fantasy Dragon', mainCategory: 'Landscape', subCategory: 'Fantasy', image: 'https://picsum.photos/seed/fan1/1920/1080', likes: 890, downloads: 2100, views: 7800 },
];

export async function POST() {
  try {
    await connectDB();

    // Create superadmin if not exists
    let superadmin = await User.findOne({ email: 'superadmin@wallpaperhub.com' });
    if (!superadmin) {
      superadmin = await User.create({
        username: 'SuperAdmin',
        email: 'superadmin@wallpaperhub.com',
        password: 'superadmin123',
        role: 'superadmin',
      });
    }

    // Create demo admin
    let admin = await User.findOne({ email: 'admin@wallpaperhub.com' });
    if (!admin) {
      admin = await User.create({
        username: 'AdminUser',
        email: 'admin@wallpaperhub.com',
        password: 'admin123',
        role: 'admin',
      });
    }

    // Create demo user
    let demoUser = await User.findOne({ email: 'user@wallpaperhub.com' });
    if (!demoUser) {
      demoUser = await User.create({
        username: 'DemoUser',
        email: 'user@wallpaperhub.com',
        password: 'user1234',
        role: 'user',
      });
    }

    // Clear existing data to ensure new structure is applied
    await Category.deleteMany({});
    await Wallpaper.deleteMany({});

    // Seed Categories
    let seededCategoriesCount = 0;
    const ALL_DEMO_CATS = [...DEMO_MAIN_CATEGORIES, ...DEMO_SUB_CATEGORIES];
    for (const cat of ALL_DEMO_CATS) {
      await Category.create(cat);
      seededCategoriesCount++;
    }

    // Seed wallpapers
    const seededCount = DEMO_WALLPAPERS.length;
    const wallpapers = DEMO_WALLPAPERS.map((w) => ({
      ...w,
      uploadedBy: demoUser._id,
      status: 'approved',
      reviewedBy: superadmin._id,
    }));
    await Wallpaper.insertMany(wallpapers);

    // Add 2 pending wallpapers for admin demo
    await Wallpaper.insertMany([
      { 
        title: 'City Skyline Dusk', 
        mainCategory: 'Landscape', 
        subCategory: 'City', 
        image: 'https://picsum.photos/seed/sky1/1920/1080', 
        uploadedBy: demoUser._id, 
        status: 'pending' 
      },
      { 
        title: 'Forest Path', 
        mainCategory: 'Landscape', 
        subCategory: 'Nature', 
        image: 'https://picsum.photos/seed/forest1/1920/1080', 
        uploadedBy: demoUser._id, 
        status: 'pending' 
      },
    ]);

    return NextResponse.json({
      message: 'Seed completed successfully!',
      accounts: {
        superadmin: { email: 'superadmin@wallpaperhub.com', password: 'superadmin123' },
        admin: { email: 'admin@wallpaperhub.com', password: 'admin123' },
        user: { email: 'user@wallpaperhub.com', password: 'user1234' },
      },
      seededWallpapers: seededCount,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
