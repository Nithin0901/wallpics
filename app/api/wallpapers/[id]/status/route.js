/**
 * app/api/wallpapers/[id]/status/route.js
 * PUT /api/wallpapers/:id/status — Admin only: approve or reject a wallpaper.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || !['admin', 'superadmin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    await connectDB();

    const wallpaper = await Wallpaper.findByIdAndUpdate(
      params.id,
      { status, reviewedBy: authUser.id },
      { new: true }
    ).populate('uploadedBy', 'username email');

    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: `Wallpaper ${status} successfully`,
      wallpaper,
    });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
