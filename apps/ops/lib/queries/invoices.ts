import { collection, getDocs, query, where, type QuerySnapshot, type DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import {
  getCurrentMonthRange,
  getPreviousMonthRange,
  getTodayESTISO,
} from "@coastal/shared-ui";
import type { Invoice } from "@coastal/shared-types";

type InvoiceDoc = Invoice & { id: string };

function mapSnap(snap: QuerySnapshot<DocumentData>): InvoiceDoc[] {
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as InvoiceDoc));
}

function isLive(i: InvoiceDoc): boolean {
  return i.deleted !== true && i.isTest !== true;
}

function sumTotal(rows: InvoiceDoc[]): number {
  return rows.reduce((acc, r) => acc + (typeof r.qbTotalAmount === "number" ? r.qbTotalAmount : (r.total ?? 0)), 0);
}

/** Paid invoices with paidDate in current EST month. Money in dollars. */
export async function fetchRevenueMTD(): Promise<{ total: number; rows: InvoiceDoc[] }> {
  const { start, end } = getCurrentMonthRange();
  const q = query(
    collection(db, "invoices"),
    where("status", "==", "paid"),
    where("paidDate", ">=", start),
    where("paidDate", "<=", end),
  );
  const snap = await getDocs(q);
  const rows = mapSnap(snap).filter(isLive);
  return { total: sumTotal(rows), rows };
}

/** Paid invoices in previous EST month, used for MTD delta. */
export async function fetchRevenuePreviousMonth(): Promise<{ total: number; rows: InvoiceDoc[] }> {
  const { start, end } = getPreviousMonthRange();
  const q = query(
    collection(db, "invoices"),
    where("status", "==", "paid"),
    where("paidDate", ">=", start),
    where("paidDate", "<=", end),
  );
  const snap = await getDocs(q);
  const rows = mapSnap(snap).filter(isLive);
  return { total: sumTotal(rows), rows };
}

/** Sent + overdue invoices. Sub-stat: count of overdue OR sent with dueDate past today. */
export async function fetchAROutstanding(): Promise<{ total: number; pastDueCount: number; rows: InvoiceDoc[] }> {
  const q = query(
    collection(db, "invoices"),
    where("status", "in", ["sent", "overdue"]),
  );
  const snap = await getDocs(q);
  const rows = mapSnap(snap).filter(isLive);
  const todayISO = getTodayESTISO();
  const pastDueCount = rows.filter(r => r.status === "overdue" || (r.status === "sent" && r.dueDate && r.dueDate < todayISO)).length;
  return { total: sumTotal(rows), pastDueCount, rows };
}

export interface ARPastDueRow {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  dueDate: string;
  daysOverdue: number;
}

/** Overdue OR sent-with-past-due invoices, oldest dueDate first. */
export async function fetchARPastDue(limitN = 5): Promise<ARPastDueRow[]> {
  const q = query(
    collection(db, "invoices"),
    where("status", "in", ["sent", "overdue"]),
  );
  const snap = await getDocs(q);
  const todayISO = getTodayESTISO();
  const rows = mapSnap(snap)
    .filter(isLive)
    .filter(r => r.status === "overdue" || (r.status === "sent" && r.dueDate && r.dueDate < todayISO));
  rows.sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  return rows.slice(0, limitN).map(r => ({
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    customerName: r.customerName,
    total: typeof r.qbTotalAmount === "number" ? r.qbTotalAmount : r.total,
    dueDate: r.dueDate,
    daysOverdue: daysBetweenISO(r.dueDate, todayISO),
  }));
}

function daysBetweenISO(earlier: string, later: string): number {
  if (!earlier || !later) return 0;
  const [y1, m1, d1] = earlier.split("-").map(Number);
  const [y2, m2, d2] = later.split("-").map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.max(0, Math.floor((t2 - t1) / (1000 * 60 * 60 * 24)));
}
