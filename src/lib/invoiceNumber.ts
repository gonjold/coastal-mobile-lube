import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

const PREFIX_FOR_YEAR = (year: number) => `CMLT-${year}-`;

interface MinimalInvoice {
  invoiceNumber: string;
}

// Synchronous variant — used by /admin/invoicing where the full invoice list
// is already loaded via onSnapshot. Picks the highest existing CMLT-{year}-NNN
// in the supplied list and returns the next sequential.
export function nextInvoiceNumberFromList(
  existing: MinimalInvoice[],
  year: number = new Date().getFullYear()
): string {
  const prefix = PREFIX_FOR_YEAR(year);
  let max = 0;
  existing.forEach((inv) => {
    if (inv.invoiceNumber?.startsWith(prefix)) {
      const num = parseInt(inv.invoiceNumber.replace(prefix, ""), 10);
      if (!isNaN(num) && num > max) max = num;
    }
  });
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

// Async variant — used by the tech app's Mark Complete flow, which doesn't
// have invoices loaded. Queries Firestore for the highest existing
// invoiceNumber for this year and returns the next sequential.
export async function getNextInvoiceNumber(
  year: number = new Date().getFullYear()
): Promise<string> {
  const prefix = PREFIX_FOR_YEAR(year);
  const nextPrefix = PREFIX_FOR_YEAR(year + 1);
  const q = query(
    collection(db, "invoices"),
    where("invoiceNumber", ">=", prefix),
    where("invoiceNumber", "<", nextPrefix),
    orderBy("invoiceNumber", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  let next = 1;
  if (!snap.empty) {
    const last = snap.docs[0].data().invoiceNumber as string | undefined;
    if (last) {
      const match = last.match(/CMLT-\d{4}-(\d+)/);
      if (match) next = parseInt(match[1], 10) + 1;
    }
  }
  return `${prefix}${String(next).padStart(3, "0")}`;
}
