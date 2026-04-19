/**
 * app/api/admin/wallpapers/route.js
 * GET /api/admin/wallpapers — Fetch wallpapers by status (admin+).
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || !['admin', 'superadmin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'approved';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    await connectDB();

    const filter = { status };
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const wallpapers = await Wallpaper.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'username email profileImage')
      .populate('reviewedBy', 'username');

    const total = await Wallpaper.countDocuments(filter);

    return NextResponse.json({
      wallpapers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin wallpapers error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallpapers' }, { status: 500 });
  }
}
