/**
 * app/api/admin/stats/route.js
 * GET /api/admin/stats — Full dashboard stats including engagement totals.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || !['admin', 'superadmin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const [
      pending, approved, rejected, totalUsers,
      engagementAgg, categoryStats,
    ] = await Promise.all([
      Wallpaper.countDocuments({ status: 'pending' }),
      Wallpaper.countDocuments({ status: 'approved' }),
      Wallpaper.countDocuments({ status: 'rejected' }),
      User.countDocuments(),
      // Sum all engagement counters across approved wallpapers
      Wallpaper.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: null,
            totalLikes:     { $sum: '$likes' },
            totalDownloads: { $sum: '$downloads' },
            totalViews:     { $sum: '$views' },
          },
        },
      ]),
      // Per-category counts
      Wallpaper.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const engagement = engagementAgg[0] || { totalLikes: 0, totalDownloads: 0, totalViews: 0 };

    const categoryCounts = {};
    categoryStats.forEach(({ _id, count }) => {
      if (_id) categoryCounts[_id] = count;
    });

    return NextResponse.json({
      stats: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected,
        totalUsers,
        totalLikes:     engagement.totalLikes,
        totalDownloads: engagement.totalDownloads,
        totalViews:     engagement.totalViews,
      },
      categories: categoryCounts,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
