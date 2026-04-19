/**
 * app/api/admin/change-role/[userId]/route.js
 * PUT /api/admin/change-role/:userId — RBAC-aware role change.
 *
 * RBAC Rules:
 * - Admin can promote user↔admin (cannot touch superadmin)
 * - Superadmin can do anything including promote admin→superadmin
 * - Nobody can demote themselves
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || !['admin', 'superadmin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { role: newRole } = body;

    if (!['user', 'admin', 'superadmin'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await connectDB();

    const targetUser = await User.findById(params.userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot modify yourself
    if (targetUser._id.toString() === authUser.id) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 403 });
    }

    // Admin cannot touch superadmin accounts or promote to superadmin
    if (authUser.role === 'admin') {
      if (targetUser.role === 'superadmin') {
        return NextResponse.json(
          { error: 'Admins cannot modify superadmin accounts' },
          { status: 403 }
        );
      }
      if (newRole === 'superadmin') {
        return NextResponse.json(
          { error: 'Admins cannot promote to superadmin' },
          { status: 403 }
        );
      }
    }

    targetUser.role = newRole;
    await targetUser.save();

    return NextResponse.json({
      message: `Role updated to ${newRole}`,
      user: { id: targetUser._id, username: targetUser.username, role: targetUser.role },
    });
  } catch (error) {
    console.error('Change role error:', error);
    return NextResponse.json({ error: 'Failed to change role' }, { status: 500 });
  }
}
