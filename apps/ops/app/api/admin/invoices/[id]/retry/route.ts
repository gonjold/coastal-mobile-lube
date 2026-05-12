import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireRole } from '@/lib/auth/server';

// us-east1 region — matches functions/index.js sendInvoiceWithQBPayment.
const FN_URL =
  'https://us-east1-coastal-mobile-lube.cloudfunctions.net/sendInvoiceWithQBPayment';

const FB_AUTH_REST = (apiKey: string) =>
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

/**
 * Manually retries the QuickBooks finalize step for an invoice that previously
 * errored. Mirrors the marketing /api/admin/invoices/[id]/retry route verbatim
 * (mint custom token → exchange via identitytoolkit → call cloud function with
 * Bearer idToken). The cloud function (sendInvoiceWithQBPayment) remains frozen.
 *
 * Outcome persisted on the invoice doc per Decision 5:
 *   - On success: qboFinalizeStatus = "ok", lastError cleared, attemptedAt set
 *   - On failure: qboFinalizeStatus = "error", lastError + qboResponseSnippet
 *     + attemptedAt populated. Caller surfaces QB errors verbatim in the Fix
 *     dialog (do not swallow or rephrase).
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireRole(['owner', 'admin_only']);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'FORBIDDEN';
    const status = msg === 'UNAUTHENTICATED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 });

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'MISSING_API_KEY' }, { status: 500 });
  }

  const db = getFirestore();
  const invoiceRef = db.collection('invoices').doc(id);
  const snap = await invoiceRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  const invoice = snap.data() as Record<string, unknown>;

  const payload = {
    invoiceId: id,
    invoiceNumber: invoice.invoiceNumber || '',
    customerName: invoice.customerName || '',
    customerEmail: invoice.customerEmail || '',
    customerPhone: invoice.customerPhone || '',
    customerAddress: invoice.customerAddress || '',
    customerId: invoice.customerId || '',
    lineItems: invoice.lineItems || [],
    subtotal: invoice.subtotal || 0,
    tax: invoice.taxAmount || invoice.tax || 0,
    convenienceFee: invoice.convenienceFee || 0,
    total: invoice.total || 0,
    vehicle:
      typeof invoice.vehicleInfo === 'object' && invoice.vehicleInfo
        ? Object.values(invoice.vehicleInfo as Record<string, unknown>)
            .filter(Boolean)
            .join(' ')
        : invoice.vehicle || '',
    dueDate: invoice.dueDate || '',
  };

  // 1. Mint custom token for the calling admin user.
  let customToken: string;
  try {
    customToken = await getAuth().createCustomToken(user.uid, {
      role: user.role,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'MINT_FAILED';
    return NextResponse.json({ error: `MINT_FAILED: ${msg}` }, { status: 500 });
  }

  // 2. Exchange for ID token.
  let idToken: string;
  try {
    const ex = await fetch(FB_AUTH_REST(apiKey), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    });
    if (!ex.ok) {
      const text = await ex.text();
      throw new Error(`Exchange failed (${ex.status}): ${text.slice(0, 200)}`);
    }
    const json = (await ex.json()) as { idToken?: string };
    if (!json.idToken) throw new Error('No idToken in exchange response');
    idToken = json.idToken;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'EXCHANGE_FAILED';
    return NextResponse.json({ error: `EXCHANGE_FAILED: ${msg}` }, { status: 500 });
  }

  // 3. Call the cloud function.
  let fnRes: Response;
  let fnText: string;
  try {
    fnRes = await fetch(FN_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });
    fnText = await fnRes.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'FETCH_FAILED';
    await invoiceRef.set(
      {
        qboFinalizeStatus: 'error',
        lastError: msg,
        attemptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return NextResponse.json(
      { ok: false, error: msg, stage: 'network' },
      { status: 502 },
    );
  }

  if (!fnRes.ok) {
    await invoiceRef.set(
      {
        qboFinalizeStatus: 'error',
        lastError: `HTTP ${fnRes.status}`,
        qboResponseSnippet: fnText.slice(0, 500),
        attemptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return NextResponse.json(
      {
        ok: false,
        error: `HTTP ${fnRes.status}`,
        snippet: fnText.slice(0, 500),
        stage: 'cloud-function',
      },
      { status: fnRes.status },
    );
  }

  // Success: clear the error fields. Don't overwrite qbInvoiceId/qbPaymentLink
  // — the cloud function does its own writeback and we'd race it.
  await invoiceRef.set(
    {
      qboFinalizeStatus: 'ok',
      lastError: null,
      qboResponseSnippet: null,
      attemptedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(fnText);
  } catch {}

  return NextResponse.json({ ok: true, response: parsed ?? fnText });
}
