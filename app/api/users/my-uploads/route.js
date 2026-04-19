/**
 * app/api/users/my-uploads/route.js
 * GET /api/users/my-uploads — Authenticated user's uploaded wallpapers.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
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
    const status = searchParams.get('status') || '';

    await connectDB();

    const filter = { uploadedBy: authUser.id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const wallpapers = await Wallpaper.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Wallpaper.countDocuments(filter);

    return NextResponse.json({ wallpapers, pagination: { page, limit, total } });
  } catch (error) {
    console.error('My uploads error:', error);
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
  }
}
