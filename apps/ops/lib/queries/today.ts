import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import { getTodayESTISO } from "@coastal/shared-ui";
import type { BookingDoc } from "./bookings";

const TODAY_STATUSES = new Set(["confirmed", "in-progress"]);

function isToday(b: BookingDoc, todayISO: string): boolean {
  const date = b.confirmedDate || b.preferredDate;
  return typeof date === "string" && date === todayISO;
}

export type TodayView = "in-progress" | "upcoming" | "unassigned";

export function partitionToday(rows: BookingDoc[]): Record<TodayView, BookingDoc[]> {
  const out: Record<TodayView, BookingDoc[]> = {
    "in-progress": [],
    upcoming: [],
    unassigned: [],
  };
  for (const b of rows) {
    if (!b.assignedTechId) {
      out.unassigned.push(b);
      continue;
    }
    if (b.status === "in-progress") {
      out["in-progress"].push(b);
      continue;
    }
    out.upcoming.push(b);
  }
  return out;
}

export async function fetchTodayJobs(): Promise<BookingDoc[]> {
  const todayISO = getTodayESTISO();
  const q = query(
    collection(db, "bookings"),
    where("confirmedDate", "==", todayISO),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as BookingDoc))
    .filter((b) => b.isTest !== true)
    .filter((b) => typeof b.status === "string" && TODAY_STATUSES.has(b.status))
    .filter((b) => isToday(b, todayISO));
}

export function subscribeTodayJobs(
  cb: (rows: BookingDoc[]) => void,
): Unsubscribe {
  const todayISO = getTodayESTISO();
  const q = query(
    collection(db, "bookings"),
    where("confirmedDate", "==", todayISO),
  );
  return onSnapshot(q, (snap) => {
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as BookingDoc))
      .filter((b) => b.isTest !== true)
      .filter((b) => typeof b.status === "string" && TODAY_STATUSES.has(b.status))
      .filter((b) => isToday(b, todayISO));
    cb(rows);
  });
}
