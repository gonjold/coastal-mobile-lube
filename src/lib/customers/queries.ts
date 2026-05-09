import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Customer } from '@/types';

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

export async function getCustomer(id: string): Promise<Customer | null> {
  adminApp();
  const doc = await getFirestore().collection('customers').doc(id).get();
  return doc.exists ? ({ id: doc.id, ...doc.data() } as Customer) : null;
}

export async function findCustomerByEmail(
  email: string,
): Promise<Customer | null> {
  adminApp();
  const snap = await getFirestore()
    .collection('customers')
    .where('email', '==', email)
    .limit(1)
    .get();
  return snap.empty
    ? null
    : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Customer);
}

export async function findCustomerByPhone(
  phone: string,
): Promise<Customer | null> {
  adminApp();
  const normalized = phone.replace(/\D/g, '');
  const snap = await getFirestore()
    .collection('customers')
    .where('phoneNormalized', '==', normalized)
    .limit(1)
    .get();
  return snap.empty
    ? null
    : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Customer);
}
