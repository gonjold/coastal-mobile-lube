import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Asset, AssetType } from '@/types';

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

export async function getAsset(id: string): Promise<Asset | null> {
  adminApp();
  const doc = await getFirestore().collection('assets').doc(id).get();
  return doc.exists ? ({ id: doc.id, ...doc.data() } as Asset) : null;
}

export async function listAssetsForCustomer(
  customerId: string,
  type?: AssetType,
): Promise<Asset[]> {
  adminApp();
  let q = getFirestore()
    .collection('assets')
    .where('customerId', '==', customerId) as FirebaseFirestore.Query;
  if (type) q = q.where('type', '==', type);
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Asset);
}

export async function listAllAssets(limit = 100): Promise<Asset[]> {
  adminApp();
  const snap = await getFirestore().collection('assets').limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Asset);
}
