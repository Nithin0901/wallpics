/**
 * app/api/admin/users/[id]/route.js
 * GET /api/admin/users/:id — Admin: Fetch detailed user profile.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Wallpaper from '@/models/Wallpaper';
import { getAuthUser, hasRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const authUser = await getAuthUser(request);

    if (!authUser || !hasRole(authUser.role, ['admin', 'superadmin'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(id)
      .populate('likedWallpapers', 'title image status')
      .populate('downloadedWallpapers', 'title image status');

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const uploads = await Wallpaper.find({ uploadedBy: id }).sort({ createdAt: -1 });

    return NextResponse.json({
      user,
      stats: {
        uploads: uploads.length,
        likes: user.likedWallpapers.length,
        downloads: user.downloadedWallpapers.length,
      },
      uploads,
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}
