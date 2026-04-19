/**
 * app/api/admin/change-subscription/[userId]/route.js
 * PUT /api/admin/change-subscription/:userId — Admin: Update user's subscription tier.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getAuthUser, hasRole } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const { userId } = params;
    const authUser = await getAuthUser(request);
    
    // Only admins or superadmins can change subscriptions
    if (!authUser || !hasRole(authUser.role, ['admin', 'superadmin'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await request.json();
    const validPlans = ['free', 'pro', 'premium'];

    if (!validPlans.includes(subscription)) {
      return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
    }

    await connectDB();
    
    // Get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Superadmin can change anyone; Admin can only change 'user' or 'admin' 
    // (though usually admin shouldn't change superadmin)
    if (authUser.role !== 'superadmin' && targetUser.role === 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    targetUser.subscription = subscription;
    if (subscription === 'free') {
      targetUser.subscriptionExpiresAt = null;
      targetUser.subscriptionStartDate = null;
    } else {
      if (!targetUser.subscriptionStartDate) {
        targetUser.subscriptionStartDate = new Date();
      }
      if (!targetUser.subscriptionExpiresAt) {
        // Set default 1 month if none exists
        const expiry = new Date();
        // Correcting likely bug: setMonth should take month index
        expiry.setMonth(expiry.getMonth() + 1);
        targetUser.subscriptionExpiresAt = expiry;
      }
    }

    await targetUser.save();

    return NextResponse.json({ 
      message: `Subscription successfully updated to ${subscription.toUpperCase()}`,
      user: targetUser 
    });
  } catch (error) {
    console.error('Admin subscription change error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
