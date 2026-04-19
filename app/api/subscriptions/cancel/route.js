/**
 * app/api/subscriptions/cancel/route.js
 * POST /api/subscriptions/cancel — Cancel the user's premium subscription.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    
    // Switch the user back to free tier
    const user = await User.findByIdAndUpdate(
      authUser.id,
      {
        subscription: 'free',
        subscriptionExpiresAt: null,
        subscriptionStartDate: null,
      },
      { new: true }
    );

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      message: 'Subscription cancelled successfully.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        subscriptionStartDate: user.subscriptionStartDate,
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
