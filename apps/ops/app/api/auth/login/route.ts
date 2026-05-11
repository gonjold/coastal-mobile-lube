import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const FIVE_DAYS_SECONDS = 5 * 24 * 60 * 60;
const FIVE_DAYS_MS = FIVE_DAYS_SECONDS * 1000;

function adminApp() {
  if (getApps().length > 0) return;
  const json = process.env.FIREBASE_ADMIN_KEY_JSON;
  if (json) {
    initializeApp({ credential: cert(JSON.parse(json)) });
    return;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin not configured');
  }
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export async function POST(req: Request) {
  try {
    const { idToken } = (await req.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing idToken' },
        { status: 400 },
      );
    }

    adminApp();
    await getAuth().verifyIdToken(idToken, true);
    const sessionCookie = await getAuth().createSessionCookie(idToken, {
      expiresIn: FIVE_DAYS_MS,
    });

    const isProd = process.env.NODE_ENV === 'production';
    // Scope cookie to .coastalmobilelube.com ONLY when the request host is on that apex
    // (e.g. app.coastalmobilelube.com). On Netlify previews and the coastal-ops.netlify.app
    // default subdomain, fall back to host-only — the browser rejects any Set-Cookie whose
    // Domain attribute doesn't match the request host.
    const host = req.headers.get('host') || '';
    const onApexDomain = host.endsWith('coastalmobilelube.com');
    const cookieStore = await cookies();
    cookieStore.set('__session', sessionCookie, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      domain: isProd && onApexDomain ? '.coastalmobilelube.com' : undefined,
      path: '/',
      maxAge: FIVE_DAYS_SECONDS,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
