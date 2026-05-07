"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { type Booking, formatTimeWindow } from "@/app/admin/shared";
import Link from "next/link";

export default function TechJobsPage() {
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  // Track auth state — uid may not be set on initial render
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
  }, []);

  useEffect(() => {
    if (!uid) {
      setJobs([]);
      setLoading(uid === null ? true : false);
      return;
    }

    const q = query(
      collection(db, "bookings"),
      where("assignedTechId", "==", uid),
      where("status", "in", ["confirmed", "in-progress"]),
      orderBy("confirmedDate", "asc")
    );

    return onSnapshot(
      q,
      (snap) => {
        setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
        setLoading(false);
      },
      (err) => {
        console.error("Jobs query failed:", err);
        setLoading(false);
      }
    );
  }, [uid]);

  if (loading) {
    return <div className="text-slate-500">Loading jobs...</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <div className="text-base font-semibold text-[#0B2040]">No jobs assigned</div>
        <div className="mt-1 text-sm text-slate-600">
          When a job is assigned to you, it&apos;ll show up here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-[#0B2040]">My Jobs</h1>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

function JobCard({ job }: { job: Booking }) {
  const customer = job.customerName || job.name || "Customer";
  const vehicle =
    [job.vehicleYear, job.vehicleMake, job.vehicleModel].filter(Boolean).join(" ") ||
    [job.vesselYear, job.vesselMake, job.vesselModel].filter(Boolean).join(" ") ||
    "Vehicle pending";
  const service = job.selectedServices?.[0]?.name || job.service || "Service";

  return (
    <Link
      href={`/tech/jobs/${job.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 active:bg-slate-50"
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="text-base font-semibold text-[#0B2040]">{customer}</div>
        <StatusBadge status={job.status} />
      </div>
      <div className="text-sm text-slate-700">{vehicle}</div>
      <div className="mt-1 text-xs text-slate-500">
        {job.address || "Address pending"}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600">
        <div>{formatScheduledTime(job)}</div>
        <div className="font-medium">{service}</div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-blue-100 text-blue-800",
    "in-progress": "bg-amber-100 text-amber-800",
  };
  const label = (status || "").replace("-", " ") || "—";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        colors[status || ""] || "bg-slate-100 text-slate-800"
      }`}
    >
      {label}
    </span>
  );
}

function formatScheduledTime(job: Booking): string {
  const dateStr = job.confirmedDate || job.preferredDate;
  const window = job.confirmedArrivalWindow || formatTimeWindow(job.timeWindow);
  if (!dateStr) return "Time TBD";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return window || "Time TBD";
  const ds = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return window ? `${ds} · ${window}` : ds;
}
