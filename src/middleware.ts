import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge-safe middleware: presence-check the `__session` Firebase session
 * cookie minted by /api/auth/login. Deeper verification (signature, expiry,
 * custom-claim role) happens at the page/API level via getCurrentUser() and
 * requireRole() in `@/lib/auth/server` — those use firebase-admin's
 * verifySessionCookie(), which is not available in the Edge runtime.
 *
 * Why presence-check rather than full verification: firebase-admin can't run
 * in the Edge runtime, and full session-cookie verification on every request
 * would require either (a) a JWKS-based JWT verifier (Firebase session
 * cookies are not standard JWTs and aren't designed for client verification)
 * or (b) switching middleware to the Node runtime. Presence-check is the
 * pragmatic choice; the existing `AdminAuthGuard` and `TechAuthShell` plus
 * server-side `requireRole()` still enforce real auth on the inside.
 */

const ADMIN_RE = /^\/admin/;
const TECH_RE = /^\/tech/;
const API_ADMIN_RE = /^\/api\/admin/;
const ADMIN_LOGIN_PATH = '/admin/login';
const TECH_LOGIN_PATH = '/tech/login';

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Login pages themselves are public (the login UIs that mint the cookie).
  if (path === ADMIN_LOGIN_PATH || path === TECH_LOGIN_PATH) {
    return NextResponse.next();
  }

  const isAdmin = ADMIN_RE.test(path) || API_ADMIN_RE.test(path);
  const isTech = TECH_RE.test(path);
  if (!isAdmin && !isTech) return NextResponse.next();

  const session = req.cookies.get('__session')?.value;
  if (session) return NextResponse.next();

  // No session — redirect to the appropriate login. JSON 401 for API routes
  // so callers see a clean error, not a redirect-with-HTML body.
  if (API_ADMIN_RE.test(path)) {
    return NextResponse.json(
      { error: 'UNAUTHENTICATED' },
      { status: 401 },
    );
  }
  const loginUrl = new URL(
    isTech ? TECH_LOGIN_PATH : ADMIN_LOGIN_PATH,
    req.url,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/tech/:path*', '/api/admin/:path*'],
};
