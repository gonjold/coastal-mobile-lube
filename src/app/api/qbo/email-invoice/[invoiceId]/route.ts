import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { requireRole } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";

// TODO Phase 3: extend or duplicate this proxy for sendInvoiceWithQBPayment
// when Clover ships. The legacy admin caller in src/app/admin/invoicing/page.tsx
// branches on the QB-connected setting to pick the cloud function — this proxy
// is intentionally pinned to the non-QB path (sendInvoiceEmail) for Phase 2.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SEND_INVOICE_EMAIL_URL =
  "https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendInvoiceEmail";

type LineItem = {
  serviceName?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  taxable?: boolean;
};

type InvoiceDoc = {
  invoiceNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  lineItems?: LineItem[];
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  notes?: string;
  vehicle?: string;
  invoiceDate?: string;
  dueDate?: string;
  deleted?: boolean;
};

// Auth approach (option a): the field client posts to this proxy with only the
// __session cookie. The cloud function expects a Firebase ID token in
// Authorization: Bearer. We mint a custom token for the verified caller via
// firebase-admin, then exchange it for an ID token via Firebase Auth REST
// (signInWithCustomToken). This keeps JobPaymentSection.tsx unchanged.
async function mintIdTokenForUser(uid: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not set");
  }
  const customToken = await getAuth().createCustomToken(uid);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  if (!res.ok) {
    throw new Error(
      `Custom token exchange failed (${res.status}): ${await res.text()}`,
    );
  }
  const data = (await res.json()) as { idToken?: string };
  if (!data.idToken) {
    throw new Error("Custom token exchange returned no idToken");
  }
  return data.idToken;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  let user;
  try {
    user = await requireRole(["owner", "tech"]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const status = msg === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { invoiceId } = await params;
  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 500 },
    );
  }

  const snap = await db.collection("invoices").doc(invoiceId).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  const inv = snap.data() as InvoiceDoc;
  if (inv.deleted) {
    return NextResponse.json({ error: "Invoice is deleted" }, { status: 410 });
  }
  if (!inv.customerEmail) {
    return NextResponse.json(
      { error: "Invoice has no customerEmail" },
      { status: 400 },
    );
  }
  if (!inv.invoiceNumber) {
    return NextResponse.json(
      { error: "Invoice has no invoiceNumber" },
      { status: 400 },
    );
  }

  // Body shape mirrors src/app/admin/invoicing/page.tsx handleSendInvoice's
  // non-QB branch (lines 1181–1195) field-for-field. The cloud function's
  // destructure at functions/index.js:850–855 is the source of truth for
  // accepted fields — do not add fields here that aren't in that list.
  const body = {
    invoiceId,
    customerEmail: inv.customerEmail,
    customerName: inv.customerName ?? "",
    customerPhone: inv.customerPhone ?? "",
    invoiceNumber: inv.invoiceNumber,
    lineItems: Array.isArray(inv.lineItems) ? inv.lineItems : [],
    subtotal: inv.subtotal ?? 0,
    taxAmount: inv.taxAmount ?? 0,
    total: inv.total ?? 0,
    notes: inv.notes ?? "",
    vehicle: inv.vehicle ?? "",
    invoiceDate: inv.invoiceDate ?? "",
    dueDate: inv.dueDate ?? "",
  };

  let idToken: string;
  try {
    idToken = await mintIdTokenForUser(user.uid);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Token mint failed";
    console.error("[email-invoice proxy] mintIdTokenForUser failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const cfRes = await fetch(SEND_INVOICE_EMAIL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  const text = await cfRes.text();
  return new NextResponse(text, {
    status: cfRes.status,
    headers: {
      "Content-Type":
        cfRes.headers.get("Content-Type") ?? "application/json",
    },
  });
}
