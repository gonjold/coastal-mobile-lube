"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CalendarCheck,
  ChevronsUpDown,
  Plus,
} from "lucide-react";
import { db } from "@/lib/firebase";
import EditableCell from "@/components/admin/EditableCell";
import { useAdminModal } from "@/contexts/AdminModalContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  type Booking,
  getServiceLabel,
  toISODate,
} from "../shared";

type SortKey = "date" | "name" | "service" | "status";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "new-lead", label: "New lead" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "invoiced", label: "Invoiced" },
  { value: "cancelled", label: "Cancelled" },
  { value: "dead", label: "Dead" },
];

function statusVariant(
  s: string | undefined,
): "default" | "secondary" | "outline" | "destructive" {
  if (!s) return "outline";
  if (s === "completed" || s === "invoiced") return "default";
  if (s === "confirmed" || s === "in-progress") return "secondary";
  if (s === "cancelled" || s === "dead") return "destructive";
  return "outline";
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [optimistic, setOptimistic] = useState<Record<string, Partial<Booking>>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const { openModal } = useAdminModal();

  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
        setOptimistic({});
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  const merged = useMemo(
    () => bookings.map((b) => ({ ...b, ...optimistic[b.id] })),
    [bookings, optimistic],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return merged;
    return merged.filter((b) => {
      const hay = [
        b.name,
        b.customerName,
        b.email,
        b.customerEmail,
        b.phone,
        b.customerPhone,
        b.confirmedDate,
        b.preferredDate,
        b.status,
        b.timeWindow,
        getServiceLabel(b),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [merged, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date")
        cmp = (a.confirmedDate || a.preferredDate || "").localeCompare(
          b.confirmedDate || b.preferredDate || "",
        );
      else if (sortKey === "name")
        cmp = (a.name || a.customerName || "").localeCompare(
          b.name || b.customerName || "",
        );
      else if (sortKey === "service")
        cmp = getServiceLabel(a).localeCompare(getServiceLabel(b));
      else if (sortKey === "status")
        cmp = (a.status || "").localeCompare(b.status || "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  }

  async function patchBooking(id: string, patch: Partial<Booking>) {
    setOptimistic((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
    }
    toast.success("Saved");
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Bookings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sorted.length} booking{sorted.length !== 1 ? "s" : ""}. Click a date,
            time window, or status cell to edit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[260px]"
          />
          <Button onClick={() => openModal("booking")}>
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
            New booking
          </Button>
        </div>
      </header>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-muted/50 sticky top-0">
                <SortHeader
                  label="Customer"
                  active={sortKey === "name"}
                  dir={sortDir}
                  onClick={() => toggleSort("name")}
                />
                <SortHeader
                  label="Service"
                  active={sortKey === "service"}
                  dir={sortDir}
                  onClick={() => toggleSort("service")}
                />
                <SortHeader
                  label="Date"
                  active={sortKey === "date"}
                  dir={sortDir}
                  onClick={() => toggleSort("date")}
                />
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">
                  Time window
                </th>
                <SortHeader
                  label="Status"
                  active={sortKey === "status"}
                  dir={sortDir}
                  onClick={() => toggleSort("status")}
                />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <EmptyState onAdd={() => openModal("booking")} />
                  </td>
                </tr>
              ) : (
                sorted.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t border-border hover:bg-muted/30 transition-colors duration-150"
                  >
                    <td className="px-4 py-2 align-middle">
                      <div className="font-medium text-foreground">
                        {b.name || b.customerName || "(no name)"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {b.phone || b.customerPhone || b.email || b.customerEmail || ""}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-middle text-muted-foreground truncate max-w-[260px]">
                      {getServiceLabel(b) || "—"}
                    </td>
                    <td className="px-4 py-2 align-middle w-[160px]">
                      <EditableCell
                        type="date"
                        value={b.confirmedDate || b.preferredDate || ""}
                        onSave={(next) =>
                          patchBooking(b.id, { confirmedDate: next })
                        }
                        display={
                          (b.confirmedDate || b.preferredDate) ? (
                            <span>
                              {(b.confirmedDate || b.preferredDate)}
                              {!b.confirmedDate && b.preferredDate && (
                                <span className="ml-1 text-muted-foreground text-[11px]">
                                  (pref.)
                                </span>
                              )}
                            </span>
                          ) : undefined
                        }
                        placeholder="set date"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle w-[180px]">
                      <EditableCell
                        type="text"
                        value={b.timeWindow || ""}
                        onSave={(next) =>
                          patchBooking(b.id, { timeWindow: next })
                        }
                        placeholder="set window"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle w-[160px]">
                      <EditableCell
                        type="select"
                        value={b.status || "pending"}
                        options={STATUS_OPTIONS}
                        onSave={(next) =>
                          patchBooking(b.id, { status: next as Booking["status"] })
                        }
                        display={
                          <Badge
                            variant={statusVariant(b.status)}
                            className="font-normal"
                          >
                            {b.status || "pending"}
                          </Badge>
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide cursor-pointer select-none group"
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <span
          className={cn(
            "inline-flex transition-opacity duration-150",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-50",
          )}
        >
          {!active ? (
            <ChevronsUpDown className="h-3 w-3" strokeWidth={2} />
          ) : dir === "asc" ? (
            <ArrowUp className="h-3 w-3" strokeWidth={2} />
          ) : (
            <ArrowDown className="h-3 w-3" strokeWidth={2} />
          )}
        </span>
      </span>
    </th>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <CalendarCheck className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
      <h3 className="mt-3 text-base font-semibold text-foreground">
        No bookings yet
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        When customers book, they&apos;ll show up here.
      </p>
      <Button className="mt-4" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
        New booking
      </Button>
    </div>
  );
}

// avoid unused-import warnings for utility imports
void toISODate;
