import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: 'coastal-mobile-lube.firebaseapp.com',
  projectId: 'coastal-mobile-lube',
  storageBucket: 'coastal-mobile-lube.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (typeof window !== 'undefined') {
  const existing = getApps()[0];
  app = existing ?? initializeApp(firebaseConfig);

  if (existing) {
    db = getFirestore(app);
  } else {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      db = getFirestore(app);
    }
  }

  auth = getAuth(app);
} else {
  app = (getApps()[0] ?? initializeApp(firebaseConfig)) as FirebaseApp;
  db = undefined as unknown as Firestore;
  auth = undefined as unknown as Auth;
}

export { app, db, auth };
