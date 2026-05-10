"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

interface CommsEntry {
  id: string;
  type: "call" | "text" | "email" | "note";
  direction: "outbound" | "inbound";
  summary: string;
  createdAt: string;
  createdBy: string;
}

export default function CommsLog({
  bookingId,
  commsLog,
  onToast,
}: {
  bookingId: string;
  commsLog: CommsEntry[];
  onToast: (message: string, type?: "success" | "info") => void;
}) {
  const [type, setType] = useState<CommsEntry["type"]>("call");
  const [direction, setDirection] = useState<CommsEntry["direction"]>("outbound");
  const [summary, setSummary] = useState("");
  const [logging, setLogging] = useState(false);

  async function handleLog() {
    if (!summary.trim()) return;
    setLogging(true);
    try {
      const entry: CommsEntry = {
        id: crypto.randomUUID(),
        type,
        direction,
        summary: summary.trim(),
        createdAt: new Date().toISOString(),
        createdBy: "admin",
      };
      await updateDoc(doc(db, "bookings", bookingId), {
        commsLog: arrayUnion(entry),
      });
      setSummary("");
      onToast("Communication logged");
    } catch {
      onToast("Failed to log communication", "info");
    } finally {
      setLogging(false);
    }
  }

  const sorted = [...(commsLog || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const typeIcons: Record<string, React.ReactNode> = {
    call: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    text: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    email: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="22,7 12,13 2,7" />
      </svg>
    ),
    note: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  };

  return (
    <div className="mt-6 pt-6 border-t border-[#e8e8e8]">
      <h4 className="text-[20px] font-[700] text-[#0B2040] mb-4">
        Communication Log{sorted.length > 0 && (
          <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[12px] font-semibold text-white bg-[#0B2040] align-middle">
            {sorted.length}
          </span>
        )}
      </h4>

      {/* New entry form */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {(["call", "text", "email", "note"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                type === t
                  ? "bg-[#0B2040] text-white"
                  : "bg-[#f0f0f0] text-[#444] hover:bg-[#e8e8e8]"
              }`}
            >
              {typeIcons[t]}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <div className="flex rounded-md overflow-hidden border border-[#e8e8e8] ml-auto">
            {(["outbound", "inbound"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  direction === d
                    ? "bg-[#0B2040] text-white"
                    : "bg-white text-[#444] hover:bg-[#f5f5f5]"
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="What happened?"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLog();
            }}
            className="flex-1 text-[14px] rounded-[8px] px-3 py-2 border border-[#ddd] outline-none focus:border-[#1A5FAC] transition-colors"
          />
          <button
            onClick={handleLog}
            disabled={logging || !summary.trim()}
            className="px-4 py-2 text-[13px] font-semibold text-white bg-[#0B2040] rounded-md hover:bg-[#132E54] transition-colors disabled:opacity-50"
          >
            {logging ? "..." : "Log"}
          </button>
        </div>
      </div>

      {/* Log history */}
      {sorted.length === 0 ? (
        <div className="bg-[#f8f9fa] rounded-[10px] p-4">
          <p className="text-[13px] text-[#888] italic">
            No communication logged yet
          </p>
        </div>
      ) : (
        <div className="bg-[#f8f9fa] rounded-[10px] p-4 flex flex-col gap-1">
          {sorted.map((entry) => {
            const date = new Date(entry.createdAt);
            const typeColors: Record<string, string> = {
              call: "bg-[#1A5FAC] text-white",
              text: "bg-[#16a34a] text-white",
              email: "bg-[#7c3aed] text-white",
              note: "bg-[#888] text-white",
            };
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 py-2.5 px-3 bg-white rounded-[8px] border border-[#eee]"
              >
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold shrink-0 ${typeColors[entry.type] || "bg-[#eee] text-[#444]"}`}>
                  {typeIcons[entry.type]}
                  {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                </span>
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#444] bg-[#f0f0f0] shrink-0">
                  {entry.direction === "inbound" ? "↙ In" : "↗ Out"}
                </span>
                <span className="text-[13px] text-[#444] flex-1 min-w-0 truncate">
                  {entry.summary}
                </span>
                <span className="text-[11px] text-[#888] whitespace-nowrap shrink-0">
                  {date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {", "}
                  {date.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
