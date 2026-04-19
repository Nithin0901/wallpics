/**
 * app/api/wallpapers/[id]/route.js
 * GET    /api/wallpapers/:id  — Fetch single wallpaper (approved, or own/admin)
 * DELETE /api/wallpapers/:id  — Delete wallpaper (owner or admin)
 */
import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const wallpaper = await Wallpaper.findById(params.id);
    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    const isOwner = authUser.id === wallpaper.uploadedBy.toString();
    const isAdmin = ['admin', 'superadmin'].includes(authUser.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, subCategory, tags } = await request.json();

    if (title) wallpaper.title = title;
    if (subCategory) wallpaper.subCategory = subCategory;
    if (tags !== undefined) wallpaper.tags = Array.isArray(tags) ? tags : [];

    await wallpaper.save();

    return NextResponse.json({ 
      message: 'Wallpaper updated successfully',
      wallpaper 
    });
  } catch (error) {
    console.error('PATCH wallpaper error:', error);
    return NextResponse.json({ error: 'Failed to update wallpaper' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    await connectDB();
    const wallpaper = await Wallpaper.findById(params.id).populate(
      'uploadedBy',
      'username email profileImage'
    );

    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    // Non-approved wallpapers are only visible to their owner or admins
    const authUser = await getAuthUser(request);
    const isOwner = authUser && authUser.id === wallpaper.uploadedBy._id.toString();
    const isAdmin = authUser && ['admin', 'superadmin'].includes(authUser.role);

    if (wallpaper.status !== 'approved' && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    // ─── Fetch related wallpapers (Discovery Engine) ──────────────────────────
    // Strategy: Match by same subCategory AND/OR overlapping tags, exclude current.
    const related = await Wallpaper.find({
      status: 'approved',
      _id: { $ne: wallpaper._id },
      $or: [
        { subCategory: wallpaper.subCategory },
        { tags: { $in: wallpaper.tags || [] } }
      ]
    })
      .sort({ 
        // We'll sort by most recent but the filter ensures relevance
        createdAt: -1 
      })
      .limit(12) // Fetch more for better variety in the masonry grid
      .populate('uploadedBy', 'username profileImage');

    // Optional: Sort by "Relevance Score" in memory if needed, 
    // but for now, the $or filter with limit 12 is a huge upgrade.
    
    return NextResponse.json({ wallpaper, related });
  } catch (error) {
    console.error('GET wallpaper error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallpaper' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const wallpaper = await Wallpaper.findById(params.id);
    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }

    const isOwner = authUser.id === wallpaper.uploadedBy.toString();
    const isAdmin = ['admin', 'superadmin'].includes(authUser.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete local file if it's in /uploads/
    if (wallpaper.image.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', wallpaper.image);
      try {
        await unlink(filePath);
      } catch {
        // File may already be gone, continue anyway
      }
    }

    await wallpaper.deleteOne();
    return NextResponse.json({ message: 'Wallpaper deleted successfully' });
  } catch (error) {
    console.error('DELETE wallpaper error:', error);
    return NextResponse.json({ error: 'Failed to delete wallpaper' }, { status: 500 });
  }
}
