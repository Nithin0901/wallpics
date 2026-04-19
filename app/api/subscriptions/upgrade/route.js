import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body;
    
    // Validate if downgrading to free or doing regular mock call vs real payment
    if (plan !== 'free') {
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 });
      }
    }

    const validPlans = ['free', 'pro', 'premium'];

    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    await connectDB();
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month from now

    const user = await User.findByIdAndUpdate(
      authUser.id,
      {
        subscription: plan,
        subscriptionExpiresAt: plan === 'free' ? null : expiryDate,
        subscriptionStartDate: plan === 'free' ? null : new Date(),
      },
      { new: true }
    );

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      message: `Successfully upgraded to ${plan.toUpperCase()}`,
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
    console.error('Upgrade subscription error:', error);
    return NextResponse.json({ error: 'Failed to process upgrade' }, { status: 500 });
  }
}
