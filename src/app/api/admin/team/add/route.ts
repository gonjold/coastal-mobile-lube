import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireRole, setUserRole } from '@/lib/auth';
import type { TeamMember, UserRole } from '@/types';

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
    const owner = await requireRole(['owner']);
    const { email, displayName, role } = (await req.json()) as {
      email: string;
      displayName: string;
      role: UserRole;
    };

    if (!email || !displayName || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (!['tech', 'admin_only'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role for new member' },
        { status: 400 },
      );
    }

    adminApp();

    let userRecord;
    try {
      userRecord = await getAuth().getUserByEmail(email);
    } catch {
      userRecord = await getAuth().createUser({
        email,
        displayName,
        emailVerified: false,
      });
    }

    await setUserRole(userRecord.uid, role);

    const newMember: TeamMember = {
      uid: userRecord.uid,
      email,
      displayName,
      role,
      active: true,
      addedAt: new Date().toISOString(),
      addedBy: owner.uid,
    };
    await getFirestore().collection('team').doc('coastal').update({
      members: FieldValue.arrayUnion(newMember),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, uid: userRecord.uid });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    const status = msg === 'UNAUTHENTICATED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
