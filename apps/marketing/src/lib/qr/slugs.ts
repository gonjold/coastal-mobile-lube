import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SLUG_REGEX = /^[a-z0-9-]{2,32}$/;

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  if (!isValidSlug(slug)) return false;
  const q = query(collection(db, "qrCodes"), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  return snap.empty;
}
