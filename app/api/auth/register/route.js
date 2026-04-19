/**
 * app/api/auth/register/route.js
 * POST /api/auth/register — Create a new user account.
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if username or email already exists
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existing) {
      const field = existing.email === email.toLowerCase() ? 'Email' : 'Username';
      return NextResponse.json({ error: `${field} is already taken` }, { status: 409 });
    }

    // Create user (password is hashed via pre-save hook in model)
    const user = await User.create({ username, email, password });

    // Sign JWT with user info
    const token = await signToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: 'wh_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json({ error: `${field} is already in use` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
