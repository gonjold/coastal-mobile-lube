import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Resolve the canonical `customers/{id}` doc for a given lookup hint, creating
 * it if it doesn't exist yet. Used by admin inline-edit flows on the Customers
 * table where rows may be bookings-derived (no canonical doc) until first edit.
 *
 * Match priority: phone (digits-only) → email (lowercased). Returns the id of
 * the first match, or a newly created doc.
 */
export async function getOrCreateCustomerId(hint: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<string> {
  const phoneDigits = (hint.phone || "").replace(/\D/g, "") || null;
  const emailLower = (hint.email || "").trim().toLowerCase() || null;

  if (phoneDigits) {
    const snap = await getDocs(
      query(
        collection(db, "customers"),
        where("phone", "==", phoneDigits),
        limit(1),
      ),
    );
    if (!snap.empty) return snap.docs[0].id;
  }
  if (emailLower) {
    const snap = await getDocs(
      query(
        collection(db, "customers"),
        where("email", "==", emailLower),
        limit(1),
      ),
    );
    if (!snap.empty) return snap.docs[0].id;
  }

  const ref = doc(collection(db, "customers"));
  await setDoc(ref, {
    name: hint.name?.trim() || "",
    phone: phoneDigits,
    email: emailLower,
    address: hint.address?.trim() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdVia: "admin-inline-edit",
  });
  return ref.id;
}
