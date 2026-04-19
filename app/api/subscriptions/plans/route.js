/**
 * app/api/subscriptions/plans/route.js
 * GET /api/subscriptions/plans — Returns available subscription plans and features.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    price: 0,
    interval: 'forever',
    features: [
      '5 Daily Downloads',
      'Access to Free Collection',
      'Standard Resolution',
      'Community Support'
    ],
    highlight: false,
    buttonText: 'Current Plan',
    limit: 5
  },
  {
    id: 'pro',
    name: 'Pro Creator',
    price: 19,
    interval: 'month',
    features: [
      '50 Daily Downloads',
      'Access to Pro & Free',
      '4K High Resolution',
      'Priority Support',
      'No Ads'
    ],
    highlight: true,
    buttonText: 'Upgrade to Pro',
    limit: 50
  },
  {
    id: 'premium',
    name: 'Ultimate Premium',
    price: 49,
    interval: 'month',
    features: [
      'Unlimited Downloads',
      'Full Access (8K + Studio)',
      'Commercial License',
      '24/7 Dedicated Support',
      'Early Access Features'
    ],
    highlight: false,
    buttonText: 'Go Premium',
    limit: -1 // Unlimited
  }
];

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}
