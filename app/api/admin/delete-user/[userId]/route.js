/**
 * app/api/admin/delete-user/[userId]/route.js
 * DELETE /api/admin/delete-user/:userId — RBAC-aware user deletion.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Wallpaper from '@/models/Wallpaper';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || !['admin', 'superadmin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const targetUser = await User.findById(params.userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot delete yourself
    if (targetUser._id.toString() === authUser.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 403 });
    }

    // Admin cannot delete superadmin
    if (authUser.role === 'admin' && targetUser.role === 'superadmin') {
      return NextResponse.json(
        { error: 'Admins cannot delete superadmin accounts' },
        { status: 403 }
      );
    }

    // Admin cannot delete other admins  
    if (authUser.role === 'admin' && targetUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot delete other admin accounts' },
        { status: 403 }
      );
    }

    // Delete user's wallpapers too
    await Wallpaper.deleteMany({ uploadedBy: targetUser._id });
    await targetUser.deleteOne();

    return NextResponse.json({ message: `User "${targetUser.username}" deleted successfully` });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
