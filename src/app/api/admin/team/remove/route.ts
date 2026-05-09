import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { requireRole, clearUserRole, getTeam } from '@/lib/auth';

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
    await requireRole(['owner']);
    const { uid } = (await req.json()) as { uid: string };

    adminApp();
    const team = await getTeam();
    if (!team)
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    if (uid === team.ownerUid)
      return NextResponse.json(
        { error: 'Cannot remove owner' },
        { status: 400 },
      );

    const updated = team.members.map((m) =>
      m.uid === uid ? { ...m, active: false } : m,
    );
    await getFirestore().collection('team').doc('coastal').update({
      members: updated,
      updatedAt: new Date().toISOString(),
    });

    await clearUserRole(uid);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    const status = msg === 'UNAUTHENTICATED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
