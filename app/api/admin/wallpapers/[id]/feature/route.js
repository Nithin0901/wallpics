/**
 * app/api/admin/wallpapers/[id]/feature/route.js
 * PATCH /api/admin/wallpapers/:id/feature — Admin: Toggle featured status of a wallpaper.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
import { getAuthUser, hasRole } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const authUser = await getAuthUser(request);
    
    // Only admins or superadmins can feature wallpapers
    if (!authUser || !hasRole(authUser.role, ['admin', 'superadmin'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isFeatured } = await request.json();

    await connectDB();
    
    const updateData = { isFeatured };
    if (isFeatured) {
      updateData.featuredAt = new Date();
    } else {
      updateData.featuredAt = null;
    }

    const wallpaper = await Wallpaper.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: `Wallpaper ${isFeatured ? 'added to' : 'removed from'} featured content.`,
      wallpaper 
    });
  } catch (error) {
    console.error('Admin wallpaper feature update error:', error);
    return NextResponse.json({ error: 'Failed to update featured status' }, { status: 500 });
  }
}
