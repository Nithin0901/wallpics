/**
 * app/api/wallpapers/[id]/download/route.js
 * PUT /api/wallpapers/:id/download — Enforced download with tiered restrictions.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TIER_HIERARCHY = {
  'free': 1,
  'pro': 2,
  'premium': 3
};

const DAILY_LIMITS = {
  'free': 5,
  'pro': 50,
  'premium': -1 // Unlimited
};

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // 1. Authenticate user
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required to download.' }, { status: 401 });
    }

    await connectDB();
    
    // 2. Fetch Wallpaper and User info
    const [wallpaper, user] = await Promise.all([
      Wallpaper.findById(id),
      User.findById(authUser.id)
    ]);

    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Check Plan Requirement
    const paperTier = TIER_HIERARCHY[wallpaper.planRequired || 'free'];
    const userTier = TIER_HIERARCHY[user.subscription || 'free'];

    if (userTier < paperTier) {
      return NextResponse.json({ 
        error: `This content requires a ${wallpaper.planRequired.toUpperCase()} subscription.`,
        code: 'INSUFFICIENT_PLAN',
        required: wallpaper.planRequired
      }, { status: 403 });
    }

    // 4. Handle Daily Limits
    const limit = DAILY_LIMITS[user.subscription || 'free'];
    const now = new Date();
    const lastReset = user.lastDownloadReset ? new Date(user.lastDownloadReset) : null;
    
    // Reset daily count if it's a new day
    const isNewDay = !lastReset || now.toDateString() !== lastReset.toDateString();
    
    if (isNewDay) {
      user.dailyDownloadCount = 0;
      user.lastDownloadReset = now;
    }

    if (limit !== -1 && user.dailyDownloadCount >= limit) {
      return NextResponse.json({ 
        error: 'You have reached your daily download limit. Upgrade for more!',
        code: 'LIMIT_REACHED',
        limit: limit
      }, { status: 429 });
    }

    // 5. Success: Increment counters and track download
    user.dailyDownloadCount += 1;
    wallpaper.downloads += 1;

    // Track in user download history if not already there
    if (!user.downloadedWallpapers.includes(id)) {
      user.downloadedWallpapers.push(id);
    }

    await Promise.all([user.save(), wallpaper.save()]);

    // ─── BINARY DELIVERY ─────────────────────────────────────────────────────
    // If user is FREE -> Apply watermark on the fly
    // If user is PRO/PREMIUM -> Send original master
    
    const { readFile } = await import('fs/promises');
    const { applyWatermark } = await import('@/lib/imageProcessor');
    const path = await import('path');

    const filePath = path.join(process.cwd(), 'public', wallpaper.image);
    let buffer = await readFile(filePath);

    // ─── TIER LOGIC ──────────────────────────────────────────────────────────
    const isStaff = ['admin', 'superadmin'].includes(user.role);
    const isPaying = user.subscription === 'pro' || user.subscription === 'premium';
    const shouldWatermark = !isStaff && !isPaying;

    console.log(`[DOWNLOAD] ID: ${id} | User: ${user.username} | Role: ${user.role} | Sub: ${user.subscription} | Watermark: ${shouldWatermark}`);

    if (shouldWatermark) {
      buffer = await applyWatermark(buffer);
    }

    const filename = `${wallpaper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webp`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Subscription': user.subscription,
        'X-Daily-Remaining': String(limit === -1 ? 'Unlimited' : limit - user.dailyDownloadCount)
      }
    });
  } catch (error) {
    console.error('Download enforced error:', error);
    return NextResponse.json({ error: 'Failed to process download request' }, { status: 500 });
  }
}
