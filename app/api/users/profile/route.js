/**
 * app/api/users/profile/route.js
 * GET /api/users/profile — Authenticated user's profile.
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

    await connectDB();
    const user = await User.findById(authUser.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [uploadCount, likeCount] = await Promise.all([
      Wallpaper.countDocuments({ uploadedBy: user._id }),
      Promise.resolve(user.likedWallpapers.length),
    ]);

    return NextResponse.json({ user, stats: { uploads: uploadCount, likes: likeCount } });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
