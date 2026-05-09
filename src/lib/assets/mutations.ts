import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { customAlphabet } from 'nanoid';
import type { Asset } from '@/types';

const nanoid = customAlphabet(
  'abcdefghijklmnopqrstuvwxyz0123456789',
  12,
);

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

export async function createAsset(
  asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Asset> {
  adminApp();
  const id = `${asset.type}_${nanoid()}`;
  const now = new Date().toISOString();
  const full = { ...asset, id, createdAt: now, updatedAt: now } as Asset;
  await getFirestore().collection('assets').doc(id).set(full);
  await getFirestore().collection('customers').doc(asset.customerId).update({
    assets: FieldValue.arrayUnion(id),
  });
  return full;
}

export async function updateAsset(
  id: string,
  patch: Partial<Asset>,
): Promise<void> {
  adminApp();
  await getFirestore().collection('assets').doc(id).update({
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

/** Soft-delete: marks `deletedAt`, removes from customer.assets[]. */
export async function deleteAsset(
  id: string,
  customerId: string,
): Promise<void> {
  adminApp();
  await getFirestore().collection('assets').doc(id).update({
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await getFirestore().collection('customers').doc(customerId).update({
    assets: FieldValue.arrayRemove(id),
  });
}
