#!/usr/bin/env node

/**
 * Phase A WO Unit 4: clear the stale qbInvoiceId cross-customer pointer
 * flagged in WORKFLOW-AUDIT-20260520T182331Z.md (CMLT-2026-005 → QB Id=4
 * → CMLT-2026-007 / Melissa Gonzales). PR #20 added a verify-matches gate
 * at functions/index.js:1615-1641 so this is mitigated at send time;
 * on-disk hygiene only.
 *
 * Defaults to --dry-run. Supports --execute and --revert.
 * Writes a markdown report when --report-out is supplied.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=~/.coastal-firebase-admin.json \
 *     node scripts/cleanup-cmlt-stale-qb-pointers.js [opts]
 *
 * Options:
 *   --dry-run                   (default) read and report, no writes
 *   --execute                   apply the change (writes audit + backup blob)
 *   --revert                    restore cleared fields from the backup blob
 *   --invoice-number <CMLT-...> target invoice number; default CMLT-2026-005
 *   --report-out <path>         also write a markdown report to this path
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const ARGS = process.argv.slice(2);
const HAS = (flag) => ARGS.includes(flag);
const VAL = (flag) => {
  const i = ARGS.indexOf(flag);
  return i >= 0 && i + 1 < ARGS.length ? ARGS[i + 1] : null;
};

const MODES = ["--dry-run", "--execute", "--revert"];
const explicitMode = MODES.find(HAS) || "--dry-run";
const TARGET_INVOICE_NUMBER = VAL("--invoice-number") || "CMLT-2026-005";
const REPORT_OUT = VAL("--report-out");
const CLEAR_REASON = "manual-cleanup-phase-a-u4-WO-COASTAL-PHASE-A-STABILIZATION";

if (
  HAS("--execute") + HAS("--dry-run") + HAS("--revert") >
  1
) {
  console.error(
    "ERROR: pick exactly one of --dry-run, --execute, --revert (default is --dry-run)",
  );
  process.exit(2);
}

admin.initializeApp({ projectId: "coastal-mobile-lube" });
const db = admin.firestore();

function nowIso() {
  return new Date().toISOString();
}

async function findTargetInvoice(invoiceNumber) {
  const snap = await db
    .collection("invoices")
    .where("invoiceNumber", "==", invoiceNumber)
    .get();
  if (snap.empty) return [];
  return snap.docs.map((d) => ({ id: d.id, ref: d.ref, data: d.data() }));
}

function describe(inv) {
  return {
    id: inv.id,
    invoiceNumber: inv.data.invoiceNumber || "(none)",
    customerName: inv.data.customerName || "(none)",
    customerEmail: inv.data.customerEmail || "(none)",
    status: inv.data.status || "(none)",
    source: inv.data.source || "(none)",
    bookingId: inv.data.bookingId || "(none)",
    qbInvoiceId: inv.data.qbInvoiceId || "(empty)",
    qbAttachableId: inv.data.qbAttachableId || "(empty)",
    qbPaymentLink: inv.data.qbPaymentLink || "(empty)",
    qbDocNumber: inv.data.qbDocNumber || "(empty)",
    qbStaleClearedAt: inv.data.qbStaleClearedAt
      ? "previously cleared (audit field present)"
      : "(empty)",
    hasBackupBlob: !!inv.data.qbStaleClearedBackup,
  };
}

function plannedChangeForExecute(inv) {
  const changes = {
    clearFields: [],
    backupBlob: {},
    auditFields: {
      qbStaleClearedAt: "<serverTimestamp at execute>",
      qbStaleClearedReason: CLEAR_REASON,
      updatedAt: "<serverTimestamp at execute>",
    },
  };
  if (inv.data.qbInvoiceId) {
    changes.clearFields.push("qbInvoiceId");
    changes.backupBlob.qbInvoiceId = inv.data.qbInvoiceId;
  }
  if (inv.data.qbAttachableId) {
    changes.clearFields.push("qbAttachableId");
    changes.backupBlob.qbAttachableId = inv.data.qbAttachableId;
  }
  if (inv.data.qbPaymentLink) {
    changes.clearFields.push("qbPaymentLink");
    changes.backupBlob.qbPaymentLink = inv.data.qbPaymentLink;
  }
  return changes;
}

function plannedChangeForRevert(inv) {
  const blob = inv.data.qbStaleClearedBackup;
  if (!blob || typeof blob !== "object") {
    return { canRevert: false, reason: "no qbStaleClearedBackup blob on doc" };
  }
  const restore = {};
  if (blob.qbInvoiceId) restore.qbInvoiceId = blob.qbInvoiceId;
  if (blob.qbAttachableId) restore.qbAttachableId = blob.qbAttachableId;
  if (blob.qbPaymentLink) restore.qbPaymentLink = blob.qbPaymentLink;
  return { canRevert: true, restore };
}

async function executeClear(inv) {
  const plan = plannedChangeForExecute(inv);
  const update = {
    ...Object.fromEntries(
      plan.clearFields.map((f) => [f, admin.firestore.FieldValue.delete()]),
    ),
    qbStaleClearedBackup: plan.backupBlob,
    qbStaleClearedAt: admin.firestore.FieldValue.serverTimestamp(),
    qbStaleClearedReason: CLEAR_REASON,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await inv.ref.update(update);
  return { applied: plan.clearFields, backed_up: plan.backupBlob };
}

async function executeRevert(inv) {
  const plan = plannedChangeForRevert(inv);
  if (!plan.canRevert) return plan;
  const update = {
    ...plan.restore,
    qbStaleClearedBackup: admin.firestore.FieldValue.delete(),
    qbStaleClearedAt: admin.firestore.FieldValue.delete(),
    qbStaleClearedReason: admin.firestore.FieldValue.delete(),
    qbRevertedAt: admin.firestore.FieldValue.serverTimestamp(),
    qbRevertedReason: CLEAR_REASON + ":revert",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await inv.ref.update(update);
  return { canRevert: true, restored: plan.restore };
}

function buildMarkdownReport({ mode, invoiceNumber, found, plans, results }) {
  const lines = [];
  lines.push(
    `# Phase A WO Unit 4: CMLT stale qbInvoiceId cleanup report`,
  );
  lines.push(``);
  lines.push(`- Run at: ${nowIso()}`);
  lines.push(`- Mode: \`${mode}\``);
  lines.push(`- Target invoiceNumber: \`${invoiceNumber}\``);
  lines.push(`- Source WO: \`outputs/06-WORK-ORDERS/WO-COASTAL-PHASE-A-STABILIZATION.md\``);
  lines.push(
    `- Source audit: \`outputs/04-AUDITS/WORKFLOW-AUDIT-20260520T182331Z.md\` (known bug #3)`,
  );
  lines.push(``);
  if (found.length === 0) {
    lines.push(
      `## Result: NO MATCH. No invoice with invoiceNumber=\`${invoiceNumber}\` in Firestore.`,
    );
    lines.push(``);
    lines.push(
      `Either the doc was already removed or the invoiceNumber argument is wrong.`,
    );
    return lines.join("\n");
  }
  lines.push(`## Matched documents (${found.length})`);
  lines.push(``);
  found.forEach((inv, i) => {
    const d = describe(inv);
    lines.push(`### ${i + 1}. \`invoices/${d.id}\``);
    lines.push(``);
    lines.push("```");
    Object.entries(d).forEach(([k, v]) => lines.push(`${k}: ${v}`));
    lines.push("```");
    lines.push(``);
    if (mode === "--dry-run" || mode === "--execute") {
      const plan = plans[i];
      lines.push(`#### Proposed change (clear stale pointers + write audit blob)`);
      if (plan.clearFields.length === 0) {
        lines.push(
          `Nothing to clear: qbInvoiceId, qbAttachableId, qbPaymentLink are all empty already.`,
        );
      } else {
        lines.push(`- Clear fields: ${plan.clearFields.join(", ")}`);
        lines.push("- Backup blob to write:");
        lines.push("```json");
        lines.push(JSON.stringify(plan.backupBlob, null, 2));
        lines.push("```");
        lines.push(`- Audit fields:`);
        lines.push("```json");
        lines.push(JSON.stringify(plan.auditFields, null, 2));
        lines.push("```");
      }
    }
    if (mode === "--revert") {
      const plan = plans[i];
      lines.push(`#### Proposed revert (restore from qbStaleClearedBackup)`);
      if (!plan.canRevert) {
        lines.push(`Cannot revert: ${plan.reason}`);
      } else {
        lines.push(`- Restore fields:`);
        lines.push("```json");
        lines.push(JSON.stringify(plan.restore, null, 2));
        lines.push("```");
      }
    }
    if (mode !== "--dry-run") {
      lines.push(``);
      lines.push(`#### Applied`);
      lines.push("```json");
      lines.push(JSON.stringify(results[i], null, 2));
      lines.push("```");
    }
    lines.push(``);
  });
  return lines.join("\n");
}

async function main() {
  console.log(
    `=== CMLT stale qbInvoiceId cleanup (${explicitMode}) — target=${TARGET_INVOICE_NUMBER} ===\n`,
  );

  const found = await findTargetInvoice(TARGET_INVOICE_NUMBER);
  if (found.length === 0) {
    console.log(`No invoice with invoiceNumber=${TARGET_INVOICE_NUMBER} found.`);
    if (REPORT_OUT) {
      fs.mkdirSync(path.dirname(path.resolve(REPORT_OUT)), { recursive: true });
      fs.writeFileSync(
        path.resolve(REPORT_OUT),
        buildMarkdownReport({
          mode: explicitMode,
          invoiceNumber: TARGET_INVOICE_NUMBER,
          found,
          plans: [],
          results: [],
        }),
      );
      console.log(`Report written: ${REPORT_OUT}`);
    }
    return;
  }

  const plans = found.map((inv) =>
    explicitMode === "--revert"
      ? plannedChangeForRevert(inv)
      : plannedChangeForExecute(inv),
  );

  found.forEach((inv, i) => {
    const d = describe(inv);
    console.log(`Doc ${i + 1}: invoices/${d.id}`);
    Object.entries(d).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    const plan = plans[i];
    if (explicitMode === "--revert") {
      if (!plan.canRevert) {
        console.log(`  --revert: ${plan.reason}`);
      } else {
        console.log(`  --revert: would restore`, plan.restore);
      }
    } else {
      console.log(
        `  --${explicitMode === "--execute" ? "execute" : "dry-run"}: clear=[${plan.clearFields.join(", ")}]`,
      );
      if (plan.clearFields.length > 0) {
        console.log(`  backup blob:`, plan.backupBlob);
      }
    }
    console.log();
  });

  const results = [];
  if (explicitMode === "--execute") {
    for (const inv of found) {
      const res = await executeClear(inv);
      results.push(res);
      console.log(`Applied to invoices/${inv.id}:`, res);
    }
  } else if (explicitMode === "--revert") {
    for (const inv of found) {
      const res = await executeRevert(inv);
      results.push(res);
      console.log(`Applied to invoices/${inv.id}:`, res);
    }
  }

  if (REPORT_OUT) {
    fs.mkdirSync(path.dirname(path.resolve(REPORT_OUT)), { recursive: true });
    fs.writeFileSync(
      path.resolve(REPORT_OUT),
      buildMarkdownReport({
        mode: explicitMode,
        invoiceNumber: TARGET_INVOICE_NUMBER,
        found,
        plans,
        results,
      }),
    );
    console.log(`Report written: ${REPORT_OUT}`);
  }

  if (explicitMode === "--dry-run") {
    console.log(
      "Dry-run only. To apply: pass --execute (require Firestore backup first).",
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FATAL:", err);
    process.exit(1);
  });
