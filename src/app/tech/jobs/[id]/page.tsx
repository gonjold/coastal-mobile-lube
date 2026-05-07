"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function JobDetailPlaceholder() {
  const params = useParams();
  return (
    <div>
      <Link href="/tech/jobs" className="text-sm text-slate-600 hover:underline">
        ← Back to jobs
      </Link>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6 text-center">
        <div className="text-base font-semibold text-[#0B2040]">
          Job Detail (WO-C-CHECKIN)
        </div>
        <div className="mt-1 text-sm text-slate-600">Job ID: {params.id}</div>
        <div className="mt-3 text-xs text-slate-500">
          The check-in flow (VIN scan, odometer, complaint capture, signatures,
          photos) ships in the next WO.
        </div>
      </div>
    </div>
  );
}
