import { authMiddleware } from 'next-firebase-auth-edge';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ADMIN = /^\/admin/;
const PROTECTED_TECH = /^\/tech/;
const PROTECTED_API_ADMIN = /^\/api\/admin/;

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAdmin =
    PROTECTED_ADMIN.test(path) || PROTECTED_API_ADMIN.test(path);
  const isTech = PROTECTED_TECH.test(path);
  if (!isAdmin && !isTech) return NextResponse.next();

  return authMiddleware(req, {
    loginPath: '/api/auth/login',
    logoutPath: '/api/auth/logout',
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    cookieName: '__session',
    cookieSerializeOptions: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      domain:
        process.env.NODE_ENV === 'production'
          ? '.coastalmobilelube.com'
          : undefined,
    },
    cookieSignatureKeys: [
      process.env.AUTH_COOKIE_SIGNATURE_KEY_1!,
      process.env.AUTH_COOKIE_SIGNATURE_KEY_2!,
    ],
    serviceAccount: {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    handleValidToken: async ({ decodedToken }, headers) => {
      const role = (decodedToken.role as string) || 'tech';
      if (isAdmin && !['owner', 'admin_only'].includes(role)) {
        return NextResponse.redirect(new URL('/tech', req.url));
      }
      return NextResponse.next({ request: { headers } });
    },
    handleInvalidToken: async () => {
      return NextResponse.redirect(new URL('/login', req.url));
    },
    handleError: async (error) => {
      console.error('Auth middleware error:', error);
      return NextResponse.redirect(new URL('/login', req.url));
    },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/tech/:path*', '/api/admin/:path*'],
};
