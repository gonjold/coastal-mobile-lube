import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { UserRole } from '@/types';

function adminApp() {
  if (getApps().length > 0) return getApps()[0];
  const json = process.env.FIREBASE_ADMIN_KEY_JSON;
  if (json) {
    return initializeApp({ credential: cert(JSON.parse(json)) });
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin not configured');
  }
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  adminApp();
  await getAuth().setCustomUserClaims(uid, { role });
}

export async function clearUserRole(uid: string): Promise<void> {
  adminApp();
  await getAuth().setCustomUserClaims(uid, null);
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  adminApp();
  const user = await getAuth().getUser(uid);
  return (user.customClaims?.role as UserRole) || null;
}
