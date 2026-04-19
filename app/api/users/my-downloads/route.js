/**
 * app/api/users/my-downloads/route.js
 * GET /api/users/my-downloads — Wallpapers downloaded by the authenticated user.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Wallpaper from '@/models/Wallpaper';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    await connectDB();

    const user = await User.findById(authUser.id).select('downloadedWallpapers');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const skip = (page - 1) * limit;
    const total = user.downloadedWallpapers.length;

    const downloadIds = user.downloadedWallpapers.slice(skip, skip + limit);
    const wallpapers = await Wallpaper.find({
      _id: { $in: downloadIds },
      status: 'approved',
    }).populate('uploadedBy', 'username profileImage');

    return NextResponse.json({ wallpapers, pagination: { page, limit, total } });
  } catch (error) {
    console.error('My downloads error:', error);
    return NextResponse.json({ error: 'Failed to fetch downloaded wallpapers' }, { status: 500 });
  }
}
