import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { HERO_DEFAULTS, type HeroCopy } from "./hero";

let cachedDb: Firestore | null = null;

function getAdminDb(): Firestore | null {
  if (cachedDb) return cachedDb;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  const app: App =
    getApps().length === 0
      ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
      : getApps()[0];

  cachedDb = getFirestore(app);
  return cachedDb;
}

export async function getHeroCopy(): Promise<HeroCopy> {
  const db = getAdminDb();
  if (!db) return HERO_DEFAULTS;
  try {
    const snap = await db.collection("siteConfig").doc("heroCopy").get();
    if (!snap.exists) return HERO_DEFAULTS;
    const d = snap.data() ?? {};
    return {
      eyebrowLine1: d.eyebrowLine1 || HERO_DEFAULTS.eyebrowLine1,
      eyebrowLine2: d.eyebrowLine2 || HERO_DEFAULTS.eyebrowLine2,
      headline: d.headline || HERO_DEFAULTS.headline,
      subheadline: d.subheadline || HERO_DEFAULTS.subheadline,
    };
  } catch {
    return HERO_DEFAULTS;
  }
}
