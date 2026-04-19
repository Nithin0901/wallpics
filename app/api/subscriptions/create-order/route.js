import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import connectDB from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Use same config as in plans endpoint, or fetch them
const PLAN_PRICES = {
  pro: 19,
  premium: 49
};

export async function POST(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();
    const validPlans = ['pro', 'premium'];

    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const amount = PLAN_PRICES[plan] * 100; // Razorpay expects amount in smallest currency unit (paise)

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
      notes: {
        userId: authUser.id,
        plan: plan
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
