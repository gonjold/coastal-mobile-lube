import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import type { AuthenticatedUser } from './types';
import type { Team, UserRole } from '@/types';

/**
 * Initialize the Firebase Admin SDK using FIREBASE_PROJECT_ID +
 * FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (matching the existing pattern
 * in `@/lib/firebase-admin`). FIREBASE_ADMIN_KEY_JSON is supported as a
 * single-secret alternative.
 */
function adminApp() {
  if (getApps().length > 0) return getApps()[0];

  const json = process.env.FIREBASE_ADMIN_KEY_JSON;
  if (json) {
    const sa = JSON.parse(json);
    return initializeApp({ credential: cert(sa) });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin not configured: set FIREBASE_ADMIN_KEY_JSON, ' +
        'or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY',
    );
  }
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('__session')?.value;
  if (!session) return null;

  try {
    adminApp();
    const decoded = await getAuth().verifySessionCookie(session, true);
    const role = (decoded.role as UserRole) || 'tech';
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      displayName: decoded.name,
      role,
      emailVerified: !!decoded.email_verified,
    };
  } catch {
    return null;
  }
}

export async function requireRole(
  allowed: UserRole[],
): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  if (!allowed.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}

export async function getTeam(): Promise<Team | null> {
  adminApp();
  const doc = await getFirestore().collection('team').doc('coastal').get();
  return doc.exists ? (doc.data() as Team) : null;
}
