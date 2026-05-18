import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
};

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

async function findCustomerId(
  db: FirebaseFirestore.Firestore,
  email: string,
  phoneDigits: string,
  name: string,
): Promise<string | null> {
  const e = email.trim().toLowerCase();
  if (e) {
    const snap = await db
      .collection("customers")
      .where("email", "==", e)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].id;
  }
  if (phoneDigits.length >= 10) {
    const snap = await db
      .collection("customers")
      .where("phoneNormalized", "==", phoneDigits)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].id;
  }
  if (name) {
    const snap = await db
      .collection("customers")
      .where("name", "==", name)
      .limit(2)
      .get();
    if (snap.size === 1) return snap.docs[0].id;
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireRole(["owner", "tech"]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const status = msg === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const name = (body.name ?? "").trim();
  const phoneRaw = (body.phone ?? "").trim();
  const phoneDigits = digitsOnly(phoneRaw);
  const email = (body.email ?? "").trim();
  const address = (body.address ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  if (!phoneDigits || phoneDigits.length !== 10) {
    return NextResponse.json(
      { error: "Phone must be 10 digits" },
      { status: 400 },
    );
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 500 },
    );
  }

  const bRef = db.collection("bookings").doc(id);
  const snap = await bRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const booking = snap.data() ?? {};
  const finalized = Boolean(booking.invoiceId);

  const bookingPatch: Record<string, unknown> = {
    name,
    phone: phoneRaw,
    email: email || null,
    address: address || null,
    customerName: name,
    customerPhone: phoneRaw,
    customerEmail: email || null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (finalized) {
    // Snapshot on the QBO invoice is frozen — only update the live customer
    // record below. Skip the booking writeback so the audit trail keeps the
    // values that were on the booking when it was finalized.
  } else {
    await bRef.update(bookingPatch);
  }

  // Best-effort customer doc update — reuses ensureBookingAsset's match logic.
  let updatedCustomerId: string | null = null;
  try {
    const lookupEmail = email || (booking.email as string) || (booking.customerEmail as string) || "";
    const lookupPhoneRaw = phoneRaw || (booking.phone as string) || (booking.customerPhone as string) || "";
    const lookupPhoneDigits = digitsOnly(lookupPhoneRaw);
    const lookupName = name || (booking.name as string) || (booking.customerName as string) || "";
    const customerId = await findCustomerId(
      db,
      lookupEmail,
      lookupPhoneDigits,
      lookupName,
    );
    if (customerId) {
      const customerPatch: Record<string, unknown> = {
        name,
        phone: phoneRaw,
        phoneNormalized: phoneDigits,
        email: email || null,
        address: address || null,
        updatedAt: new Date().toISOString(),
      };
      await db.collection("customers").doc(customerId).update(customerPatch);
      updatedCustomerId = customerId;
    }
  } catch (err) {
    console.error("[field/customer] customers writeback failed:", err);
  }

  return NextResponse.json({
    ok: true,
    finalized,
    bookingUpdated: !finalized,
    customerUpdated: Boolean(updatedCustomerId),
    customerId: updatedCustomerId,
    actorUid: user.uid,
  });
}
