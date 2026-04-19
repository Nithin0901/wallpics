/**
 * app/api/auth/google/callback/route.js
 * GET /api/auth/google/callback
 * Handles the OAuth redirect from Google:
 *  1. Exchanges the code for tokens
 *  2. Fetches the Google user profile
 *  3. Upserts the user in MongoDB
 *  4. Signs our JWT, sets wh_token cookie, redirects to /
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Generate a unique username from a Google display name or email */
function usernameFromName(name, email) {
  const base = (name || email.split('@')[0])
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 20);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}_${suffix}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const base = process.env.NEXT_PUBLIC_BASE_URL;

  // User denied access
  if (error || !code) {
    return NextResponse.redirect(`${base}/login?error=google_denied`);
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${base}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      return NextResponse.redirect(`${base}/login?error=google_token`);
    }

    // 2. Fetch user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      return NextResponse.redirect(`${base}/login?error=google_profile`);
    }

    await connectDB();

    // 3. Upsert user (find by googleId or email)
    let user = await User.findOne({
      $or: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }],
    });

    if (!user) {
      // Create new Google user
      let username = usernameFromName(profile.name, profile.email);
      while (await User.exists({ username })) {
        username = usernameFromName(profile.name, profile.email);
      }
      user = await User.create({
        username,
        email: profile.email.toLowerCase(),
        googleId: profile.sub,
        authProvider: 'google',
        profileImage: profile.picture || '',
      });
    } else if (!user.googleId) {
      // Existing email-based user signing in with Google for the first time — link accounts
      user.googleId = profile.sub;
      user.authProvider = 'google';
      if (!user.profileImage && profile.picture) user.profileImage = profile.picture;
      await user.save();
    }

    // 4. Sign JWT and set cookie
    const token = await signToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Redirect to homepage with cookie set
    const response = NextResponse.redirect(base + '/');

    response.cookies.set({
      name: 'wh_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Also expose token in a short-lived readable cookie so the client
    // can pick it up and store it in localStorage (AuthContext).
    response.cookies.set({
      name: 'wh_token_init',
      value: JSON.stringify({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
        },
      }),
      httpOnly: false, // readable by JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60, // expires after 60 seconds — just long enough to be read on redirect
    });

    return response;
  } catch (err) {
    console.error('Google callback error:', err);
    return NextResponse.redirect(`${base}/login?error=google_error`);
  }
}
