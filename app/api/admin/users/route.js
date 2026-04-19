/**
 * app/api/admin/users/route.js
 * GET /api/admin/users — List all users (admin+).
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
    if (!authUser || !['admin', 'superadmin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    await connectDB();

    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password -likedWallpapers');

    const total = await User.countDocuments(filter);

    // Attach upload counts per user
    const userIds = users.map((u) => u._id);
    const uploadCounts = await Wallpaper.aggregate([
      { $match: { uploadedBy: { $in: userIds } } },
      { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    uploadCounts.forEach(({ _id, count }) => {
      countMap[_id.toString()] = count;
    });

    const usersWithCounts = users.map((u) => ({
      ...u.toObject(),
      uploadCount: countMap[u._id.toString()] || 0,
    }));

    return NextResponse.json({
      users: usersWithCounts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
