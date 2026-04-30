import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
import Category from '@/models/Category';
import axios from 'axios';
import { uploadToCloudinary } from '@/lib/cloudinary';
import sharp from 'sharp';
import { Vibrant } from 'node-vibrant/node';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin' && authUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, title, mainCategory, subCategory, tags = [] } = await request.json();

    if (!imageUrl || !title || !mainCategory || !subCategory) {
      return NextResponse.json({ error: 'Missing required configuration for import' }, { status: 400 });
    }

    await connectDB();

    const mainExists = await Category.exists({ name: mainCategory, type: 'main' });
    const subExists = await Category.exists({ name: subCategory, type: 'sub' });
    if (!mainExists || !subExists) {
      return NextResponse.json({ error: 'Invalid category selection' }, { status: 400 });
    }

    // 1. Download Content with persistent Headers
    console.log(`[SCRAPER] Importing: ${imageUrl}`);
    const res = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Referer': 'https://www.google.com/'
      },
      timeout: 15000 
    });
    
    const originalBuffer = Buffer.from(res.data);
    console.log(`[SCRAPER] Binary received: ${originalBuffer.length} bytes`);

    // 2. Validate & Process Image
    const image = sharp(originalBuffer);
    const metadata = await image.metadata();

    if (!metadata || !metadata.width || !metadata.height) {
      console.error('[SCRAPER] Analysis Failed: Invalid image metadata');
      throw new Error("Invalid or corrupted image format received");
    }
    
    console.log(`[SCRAPER] Image Analysed: ${metadata.width}x${metadata.height} ${metadata.format}`);

    const cleanBuffer = await image
      .webp({ quality: 92 })
      .toBuffer();

    // ─── Upload to Cloudinary ───
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(cleanBuffer, 'scraped');
      console.log(`[SCRAPER] Asset uploaded to Cloudinary: ${cloudinaryResult.public_id}`);
    } catch (cloudErr) {
      console.error('[SCRAPER] Cloudinary upload failed:', cloudErr);
      throw new Error("Cloud storage upload failed during import");
    }


    // AI Palette Extraction
    let paletteHexes = [];
    try {
      const palette = await Vibrant.from(originalBuffer).getPalette();
      paletteHexes = Object.values(palette)
        .filter(swatch => swatch !== null)
        .map(swatch => swatch.hex);
    } catch (err) {
      console.warn("[SCRAPER] Vibrant palette extractions failed, continuing...");
    }

    // AI Auto-Tagging logic
    const simulatedAITags = [...tags];
    const checkContext = (title + ' ' + (tags.join(' '))).toLowerCase();
    if (checkContext.includes('dark')) simulatedAITags.push('darkmode');
    if (checkContext.includes('neon')) simulatedAITags.push('vibrant');
    if (checkContext.includes('nature')) simulatedAITags.push('landscape');

    const finalTags = ['scraped', ...new Set(simulatedAITags)].slice(0, 15);

    const wallpaper = await Wallpaper.create({
      title: title.trim(),
      image: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
      mainCategory,
      subCategory,
      uploadedBy: authUser.id,
      status: 'approved',
      tags: finalTags,
      colors: paletteHexes,
    });

    console.log(`[SCRAPER] DB Entry Created: ${wallpaper._id}`);
    return NextResponse.json({ message: 'Success', wallpaper }, { status: 201 });
  } catch (error) {
    console.error('[SCRAPER] Full Error:', error);
    return NextResponse.json({ 
      error: 'Failed to import', 
      details: error.message,
      code: error.code // Axios error codes like ETIMEDOUT
    }, { status: 500 });
  }
}
