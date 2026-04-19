/**
 * app/api/admin/wallpapers/[id]/plan/route.js
 * PUT /api/admin/wallpapers/:id/plan — Admin: Update wallpaper's required subscription tier.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
import { getAuthUser, hasRole } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const authUser = await getAuthUser(request);
    
    // Only admins or superadmins can change wallpaper plans
    if (!authUser || !hasRole(authUser.role, ['admin', 'superadmin'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planRequired } = await request.json();
    const validPlans = ['free', 'pro', 'premium'];

    if (!validPlans.includes(planRequired)) {
      return NextResponse.json({ error: 'Invalid plan requirement' }, { status: 400 });
    }

    await connectDB();
    
    const wallpaper = await Wallpaper.findByIdAndUpdate(
      id,
      { planRequired },
      { new: true }
    );

    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: `Wallpaper access updated to ${planRequired.toUpperCase()}`,
      wallpaper 
    });
  } catch (error) {
    console.error('Admin wallpaper plan update error:', error);
    return NextResponse.json({ error: 'Failed to update wallpaper access' }, { status: 500 });
  }
}
