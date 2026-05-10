import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth";
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

type CustomerSummary = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export async function GET(req: NextRequest) {
  try {
    await requireRole(["owner", "tech"]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const status = msg === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const limit = Math.min(
    Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "10", 10) || 10,
    25,
  );

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 500 },
    );
  }

  // Coastal-scale: a few hundred customers; full read + in-memory filter is
  // simpler than Firestore prefix gymnastics and matches the admin search.
  const snap = await db.collection("customers").limit(1000).get();
  const all: CustomerSummary[] = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      name: typeof data.name === "string" ? data.name : "Unknown",
      phone: typeof data.phone === "string" ? data.phone : null,
      email: typeof data.email === "string" ? data.email : null,
      address: typeof data.address === "string" ? data.address : null,
    };
  });

  if (!q) {
    return NextResponse.json({
      results: all.slice(0, limit),
    });
  }

  const qLower = q.toLowerCase();
  const qDigits = digitsOnly(q);
  const matches = all.filter((c) => {
    if (c.name.toLowerCase().includes(qLower)) return true;
    if (c.email && c.email.toLowerCase().includes(qLower)) return true;
    if (qDigits && c.phone && digitsOnly(c.phone).includes(qDigits))
      return true;
    return false;
  });
  return NextResponse.json({ results: matches.slice(0, limit) });
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireRole(["owner", "tech"]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const status = msg === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const address = (body.address ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const phoneNormalized = digitsOnly(phone);
  if (phoneNormalized.length !== 10) {
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

  // Best-effort de-dup: if a customer with the same phoneNormalized exists,
  // return that one rather than creating a duplicate. Tech can pick from the
  // search later if they wanted a different customer.
  const existing = await db
    .collection("customers")
    .where("phoneNormalized", "==", phoneNormalized)
    .limit(1)
    .get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    return NextResponse.json(
      { id: doc.id, deduped: true, customer: { id: doc.id, ...doc.data() } },
      { status: 200 },
    );
  }

  const ref = db.collection("customers").doc();
  const payload = {
    name,
    phone: phoneNormalized,
    phoneNormalized,
    email: email || null,
    address: address || null,
    assets: [] as string[],
    source: "field-app",
    createdBy: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(payload);

  return NextResponse.json(
    { id: ref.id, customer: { id: ref.id, ...payload } },
    { status: 201 },
  );
}
