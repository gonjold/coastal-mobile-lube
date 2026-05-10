import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieStore = await cookies();
  // Overwrite with an immediately-expiring cookie. Mirrors the set options
  // used by /api/auth/login so the browser actually clears the entry rather
  // than ignoring a domain/path-mismatched delete.
  cookieStore.set('__session', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    domain: isProd ? '.coastalmobilelube.com' : undefined,
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
