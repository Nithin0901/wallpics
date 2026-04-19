/**
 * app/api/wallpapers/[id]/like/route.js
 * PUT /api/wallpapers/:id/like — Toggle like/unlike for authenticated users.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Login required to like wallpapers' }, { status: 401 });
    }

    await connectDB();

    const [wallpaper, user] = await Promise.all([
      Wallpaper.findById(params.id),
      User.findById(authUser.id),
    ]);

    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    const wallpaperId = wallpaper._id.toString();
    const hasLiked = user.likedWallpapers.some((id) => id.toString() === wallpaperId);

    if (hasLiked) {
      // Unlike
      user.likedWallpapers = user.likedWallpapers.filter((id) => id.toString() !== wallpaperId);
      wallpaper.likes = Math.max(0, wallpaper.likes - 1);
    } else {
      // Like
      user.likedWallpapers.push(wallpaper._id);
      wallpaper.likes += 1;
    }

    await Promise.all([user.save(), wallpaper.save()]);

    return NextResponse.json({
      liked: !hasLiked,
      likes: wallpaper.likes,
      message: hasLiked ? 'Wallpaper unliked' : 'Wallpaper liked',
    });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed to update like' }, { status: 500 });
  }
}
