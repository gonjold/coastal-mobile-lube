import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieStore = await cookies();
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
