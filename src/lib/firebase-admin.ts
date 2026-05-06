import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { HERO_DEFAULTS, type HeroCopy } from "./hero";
import type { Service, ServiceCategory } from "./services";

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

// Firestore Timestamp instances can't cross the Server → Client Component
// boundary (they're classes, not plain objects). Convert to ISO strings; the
// type is `unknown` on both Service and ServiceCategory so consumers don't
// rely on a specific shape.
function serializeTimestamps<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data } as Record<string, unknown>;
  for (const key of ["createdAt", "updatedAt"]) {
    const v = out[key] as { toDate?: () => Date } | undefined;
    if (v && typeof v.toDate === "function") {
      out[key] = v.toDate().toISOString();
    }
  }
  return out as T;
}

// Mirrors useServices({ activeOnly: true }) semantics: fetches active services,
// then drops any whose category isn't in the active categories set. Sorted by
// sortOrder ascending. Returns [] on any failure (graceful degradation).
export async function getServices(): Promise<Service[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const [servicesSnap, categoriesSnap] = await Promise.all([
      db.collection("services").where("isActive", "==", true).get(),
      db.collection("serviceCategories").where("isActive", "==", true).get(),
    ]);
    const activeCategoryNames = new Set(
      categoriesSnap.docs.map((d) => d.data().name as string)
    );
    const services = servicesSnap.docs
      .map((d) => serializeTimestamps({ id: d.id, ...d.data() }) as Service)
      .filter((s) => activeCategoryNames.has(s.category));
    services.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return services;
  } catch (err) {
    console.error("[firebase-admin] getServices failed:", err);
    return [];
  }
}

// Returns active categories with startingAt computed dynamically from
// min(services.price) where service.category === category.name. The stored
// startingAt field is intentionally IGNORED on read — admin manual edits to
// that field will not appear on the public site (drift-proofing). When no
// priced services exist for a category, startingAt is set to 0 (matching the
// existing ">0" filter convention used by consumers).
export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const [categoriesSnap, servicesSnap] = await Promise.all([
      db.collection("serviceCategories").where("isActive", "==", true).get(),
      db.collection("services").where("isActive", "==", true).get(),
    ]);
    const services = servicesSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Service
    );
    const categories = categoriesSnap.docs.map((d) => {
      const category = serializeTimestamps({ id: d.id, ...d.data() }) as ServiceCategory;
      const matched = services.filter(
        (s) => s.category === category.name && (s.price ?? 0) > 0
      );
      const computedStartingAt =
        matched.length > 0 ? Math.min(...matched.map((s) => s.price)) : 0;
      return { ...category, startingAt: computedStartingAt };
    });
    categories.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return categories;
  } catch (err) {
    console.error("[firebase-admin] getServiceCategories failed:", err);
    return [];
  }
}
