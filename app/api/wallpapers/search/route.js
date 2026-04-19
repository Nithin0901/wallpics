/**
 * app/api/wallpapers/search/route.js
 * GET /api/wallpapers/search — Search approved wallpapers by title, category, or uploader username.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const mainCategory = searchParams.get('mainCategory') || '';
    const subCategory = searchParams.get('subCategory') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    await connectDB();

    const filter = { status: 'approved' };

    if (mainCategory) filter.mainCategory = mainCategory;
    if (subCategory) filter.subCategory = subCategory;

    if (query) {
      // Find users matching the query for uploader search
      const matchingUsers = await User.find({
        username: { $regex: query, $options: 'i' },
      }).select('_id');

      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
        { mainCategory: { $regex: query, $options: 'i' } },
        { subCategory: { $regex: query, $options: 'i' } },
        ...(matchingUsers.length > 0
          ? [{ uploadedBy: { $in: matchingUsers.map((u) => u._id) } }]
          : []),
      ];
    }

    const skip = (page - 1) * limit;
    const wallpapers = await Wallpaper.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'username profileImage');

    const total = await Wallpaper.countDocuments(filter);

    return NextResponse.json({
      wallpapers,
      query,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
