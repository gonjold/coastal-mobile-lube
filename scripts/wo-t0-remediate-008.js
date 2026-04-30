#!/usr/bin/env node
/**
 * One-shot remediation: backfill qb* fields on CMLT-2026-008 from QB.
 *
 * The WO-QB-NUMBERS-AND-TAX deploy left CMLT-2026-008 with status="sent" but
 * no qb* references in Firestore — the cloud function created the QB invoice
 * (TxnId=6) successfully but the link fetch failed downstream and lost the
 * writeback. This script reads QB authoritatively and writes the missing
 * fields back so future resends find existingData.qbInvoiceId and take the
 * update path instead of creating a duplicate (6140).
 *
 * The script refreshes the access token before fetching, so a stale token in
 * Firestore does not block remediation. Refreshed token is written back to
 * settings/quickbooks so the cloud function inherits the fresh credential.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/Users/jgsystems/.coastal-firebase-admin.json \
 *     node scripts/wo-t0-remediate-008.js
 *
 * Reads QB_CLIENT_ID / QB_CLIENT_SECRET from env if set, otherwise pulls them
 * from Google Secret Manager via gcloud (must be authenticated for project
 * coastal-mobile-lube).
 */

const admin = require("firebase-admin");
const fetch = require("node-fetch");
const { execFileSync } = require("child_process");

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const PROJECT = "coastal-mobile-lube";

function fetchSecret(name) {
  if (process.env[name]) return process.env[name];
  try {
    return execFileSync(
      "gcloud",
      ["secrets", "versions", "access", "latest", `--secret=${name}`, `--project=${PROJECT}`],
      { encoding: "utf8" }
    ).trim();
  } catch (err) {
    console.error(`Failed to read secret ${name} via gcloud:`, err.message);
    process.exit(1);
  }
}

async function refreshAccessToken(clientId, clientSecret) {
  const tokenRef = db.collection("settings").doc("quickbooks");
  const snap = await tokenRef.get();
  if (!snap.exists) {
    console.error("settings/quickbooks does not exist — QB not connected");
    process.exit(1);
  }
  const data = snap.data();
  if (!data.refreshToken || !data.realmId) {
    console.error("settings/quickbooks missing refreshToken or realmId");
    process.exit(1);
  }

  console.log("Refreshing QB access token...");
  const tokenResponse = await fetch(
    "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: data.refreshToken,
      }),
    }
  );

  if (!tokenResponse.ok) {
    const errBody = await tokenResponse.text();
    console.error(`QB token refresh failed: ${tokenResponse.status} ${errBody}`);
    process.exit(1);
  }

  const tokens = await tokenResponse.json();
  if (tokens.error) {
    console.error(`Token refresh failed: ${tokens.error}`);
    process.exit(1);
  }

  await tokenRef.update({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    refreshTokenExpiresAt: new Date(
      Date.now() + tokens.x_refresh_token_expires_in * 1000
    ).toISOString(),
    lastRefreshedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("✓ Token refreshed and written back to settings/quickbooks");

  return { accessToken: tokens.access_token, realmId: data.realmId };
}

// Re-targeted to CMLT-2026-007 (QB Id=4) after discovery that QB sandbox was
// reseeded — original WO-stated TxnId=6 / CMLT-2026-008 no longer exists in QB,
// and CMLT-2026-008 is soft-deleted in Firestore. The real divergence is 007:
// paid in Firestore, present in QB, but no qb* link in the Firestore doc.
const TARGET_INVOICE_NUMBER = "CMLT-2026-007";
const TARGET_QB_INVOICE_ID = "4";

async function main() {
  const apply = process.env.APPLY === "1";

  const clientId = fetchSecret("QB_CLIENT_ID");
  const clientSecret = fetchSecret("QB_CLIENT_SECRET");

  const { accessToken, realmId } = await refreshAccessToken(clientId, clientSecret);

  const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/invoice/${TARGET_QB_INVOICE_ID}?minorversion=70`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("QB fetch failed:", response.status, body);
    process.exit(1);
  }

  const result = await response.json();
  const qb = result.Invoice;

  console.log("=== QB Invoice verification payload ===");
  console.log("  Id:", qb.Id);
  console.log("  DocNumber:", qb.DocNumber);
  console.log("  TxnDate:", qb.TxnDate);
  console.log("  CustomerRef:", JSON.stringify(qb.CustomerRef));
  console.log("  BillEmail:", JSON.stringify(qb.BillEmail));
  console.log("  TotalAmt:", qb.TotalAmt);
  console.log("  Balance:", qb.Balance);
  console.log("  TxnTaxDetail.TotalTax:", qb.TxnTaxDetail?.TotalTax);
  console.log("  Line items:");
  (qb.Line || []).forEach((ln, i) => {
    console.log(
      `    [${i}] DetailType=${ln.DetailType} Amount=${ln.Amount} Description=${
        ln.Description ?? "<none>"
      } Item=${ln.SalesItemLineDetail?.ItemRef?.name ?? "<n/a>"} Qty=${
        ln.SalesItemLineDetail?.Qty ?? "<n/a>"
      } UnitPrice=${ln.SalesItemLineDetail?.UnitPrice ?? "<n/a>"} TaxCodeRef=${
        ln.SalesItemLineDetail?.TaxCodeRef?.value ?? "<n/a>"
      }`
    );
  });

  const qbInvoiceIdStr = qb.Id;
  const qbDocNumber = qb.DocNumber;
  const qbTotalAmount = qb.TotalAmt != null ? parseFloat(qb.TotalAmt) : null;
  const qbTaxAmount =
    qb.TxnTaxDetail?.TotalTax != null ? parseFloat(qb.TxnTaxDetail.TotalTax) : 0;
  const qbSubtotal =
    qbTotalAmount != null
      ? Math.round((qbTotalAmount - qbTaxAmount) * 100) / 100
      : null;

  const snapshot = await db
    .collection("invoices")
    .where("invoiceNumber", "==", TARGET_INVOICE_NUMBER)
    .get();
  if (snapshot.empty) {
    console.error(`No Firestore doc found for ${TARGET_INVOICE_NUMBER}`);
    process.exit(1);
  }
  const docRef = snapshot.docs[0].ref;
  const fsData = snapshot.docs[0].data();
  console.log("\n=== Firestore current state ===");
  console.log("  docId:", docRef.id);
  console.log("  status:", fsData.status, "deleted:", !!fsData.deleted);
  console.log("  customerName:", fsData.customerName);
  console.log("  customerEmail:", fsData.customerEmail);
  console.log("  total:", fsData.total);

  const update = {
    qbInvoiceId: qbInvoiceIdStr,
    qbDocNumber,
    qbTaxAmount,
  };
  if (qbTotalAmount != null) update.qbTotalAmount = qbTotalAmount;
  if (qbSubtotal != null) update.qbSubtotal = qbSubtotal;

  console.log("\n=== Proposed Firestore update ===");
  console.log(update);

  if (!apply) {
    console.log(
      "\nDRY RUN — no Firestore write. Re-run with APPLY=1 to commit the update."
    );
    return;
  }

  await docRef.update(update);
  console.log(`\n✓ Remediation complete for ${TARGET_INVOICE_NUMBER}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
