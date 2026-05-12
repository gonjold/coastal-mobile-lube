import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export interface TechInfo {
  initials: string;
  displayName: string;
}

function deriveInitials(name: string | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Map of uid → { initials, displayName } for users with role tech or owner.
 * Consumed by the Jobs in Flight panel to render techInitials. */
export async function fetchTechMap(): Promise<Map<string, TechInfo>> {
  const q = query(collection(db, "users"), where("role", "in", ["tech", "owner"]));
  const snap = await getDocs(q);
  const map = new Map<string, TechInfo>();
  for (const doc of snap.docs) {
    const data = doc.data() as { displayName?: string; uid?: string };
    const uid = data.uid ?? doc.id;
    const displayName = data.displayName ?? "";
    map.set(uid, { displayName, initials: deriveInitials(displayName) });
  }
  return map;
}
