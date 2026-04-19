/**
 * app/api/auth/otp/verify/route.js
 * POST /api/auth/otp/verify
 * Validates OTP, upserts user, returns JWT + sets cookie.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { verifyOtp } from '@/lib/otpStore';

export const dynamic = 'force-dynamic';

/** Generate a unique username from an email address */
function usernameFromEmail(email) {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}_${suffix}`;
}

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const valid = verifyOtp(email, String(otp).trim());
    if (!valid) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    await connectDB();

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Auto-create account for new OTP users
      let username = usernameFromEmail(email);
      // Ensure uniqueness
      while (await User.exists({ username })) {
        username = usernameFromEmail(email);
      }
      user = await User.create({
        username,
        email: email.toLowerCase(),
        authProvider: 'otp',
      });
    }

    const token = await signToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });

    response.cookies.set({
      name: 'wh_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
