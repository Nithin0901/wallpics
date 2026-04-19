/**
 * app/api/wallpapers/pending/route.js
 * GET /api/wallpapers/pending — Admin only: fetch all pending wallpapers.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Role is enforced by Next.js middleware (admin/superadmin only)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort') || 'newest';

    await connectDB();

    const query = { status: 'pending' };
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const sortOption = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const skip = (page - 1) * limit;
    const wallpapers = await Wallpaper.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'username email profileImage');

    const total = await Wallpaper.countDocuments(query);

    return NextResponse.json({
      wallpapers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET pending error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending wallpapers' }, { status: 500 });
  }
}
