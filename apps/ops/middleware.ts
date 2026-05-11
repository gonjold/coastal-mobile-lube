import { NextResponse, type NextRequest } from 'next/server';

// PWA assets — must be publicly accessible for browser SW registration, manifest parsing, and icon fetches during install. Do not gate behind auth.
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/sw.js', '/manifest.webmanifest', '/icons'];
// Hashed Serwist/Workbox worker chunks (e.g. /swe-worker-<hash>.js) — also public for the same reason.
const PUBLIC_PREFIXES = ['/swe-worker-', '/workbox-'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }
  const session = req.cookies.get('__session');
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
