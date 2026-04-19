/**
 * app/api/wallpapers/[id]/view/route.js
 * PUT /api/wallpapers/:id/view — Increment view counter (public).
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const wallpaper = await Wallpaper.findByIdAndUpdate(
      params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    return NextResponse.json({ views: wallpaper.views });
  } catch (error) {
    console.error('View increment error:', error);
    return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
  }
}
