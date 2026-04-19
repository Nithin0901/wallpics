/**
 * middleware.js
 * Next.js Edge Middleware — protects admin UI routes and API endpoints.
 * Runs on the Edge Runtime (uses 'jose' instead of 'jsonwebtoken').
 */
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET);

// Routes that require authentication (any role)
const AUTH_REQUIRED = [
  '/upload',
  '/profile',
  '/api/wallpapers/upload',
  '/api/users',
];

// Routes that require admin or superadmin
const ADMIN_REQUIRED = [
  '/admin',
  '/api/admin',
  '/api/wallpapers/pending',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const needsAuth = AUTH_REQUIRED.some((p) => pathname.startsWith(p));
  const needsAdmin = ADMIN_REQUIRED.some((p) => pathname.startsWith(p));

  if (!needsAuth && !needsAdmin) {
    return NextResponse.next();
  }

  // Extract token from Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  const token =
    authHeader?.replace('Bearer ', '') ||
    request.cookies.get('wh_token')?.value;

  if (!token) {
    return redirectOrUnauthorized(request, pathname);
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());

    // Admin route: require admin or superadmin
    if (needsAdmin && !['admin', 'superadmin'].includes(payload.role)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Forward user info to route handlers via headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.id);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-email', payload.email);
    requestHeaders.set('x-user-username', payload.username || '');

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return redirectOrUnauthorized(request, pathname);
  }
}

function redirectOrUnauthorized(request, pathname) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing token' }, { status: 401 });
  }
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/upload',
    '/profile',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/wallpapers/pending',
    '/api/users/:path*',
  ],
};
