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
  ChevronsUpDown,
  Plus,
  Users as UsersIcon,
} from "lucide-react";
import { db } from "@/lib/firebase";
import EditableCell from "@/components/admin/EditableCell";
import { getOrCreateCustomerId } from "@/lib/customers/getOrCreateCustomerId";
import { useAdminModal } from "@/contexts/AdminModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  type Booking,
  buildCustomerList,
  formatPhone,
} from "../shared";

type SortKey = "name" | "phone" | "email" | "jobs";

type CanonicalCustomer = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type CustomerRow = {
  /** Canonical id if backed by a customers/{id} doc; null if derived only. */
  customerId: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  jobCount: number;
};

export default function CustomersPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [canonical, setCanonical] = useState<CanonicalCustomer[]>([]);
  const [optimistic, setOptimistic] = useState<
    Record<string, Partial<CustomerRow>>
  >({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { openModal } = useAdminModal();

  useEffect(() => {
    const qBookings = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc"),
    );
    const u1 = onSnapshot(
      qBookings,
      (snap) => {
        setBookings(
          snap.docs
            .filter(
              (d) =>
                !(d.data() as Record<string, unknown>).customerDeleted &&
                (d.data() as Record<string, unknown>).isTest !== true,
            )
            .map((d) => ({ id: d.id, ...d.data() }) as Booking),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );

    const u2 = onSnapshot(collection(db, "customers"), (snap) => {
      setCanonical(
        snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<CanonicalCustomer, "id">) }),
        ),
      );
      setOptimistic((prev) => {
        const next = { ...prev };
        snap.docs.forEach((d) => {
          delete next[d.id];
        });
        return next;
      });
    });

    return () => {
      u1();
      u2();
    };
  }, []);

  const rows = useMemo<CustomerRow[]>(() => {
    const phoneIndex = new Map<string, CanonicalCustomer>();
    const emailIndex = new Map<string, CanonicalCustomer>();
    canonical.forEach((c) => {
      const p = (c.phone || "").replace(/\D/g, "");
      const e = (c.email || "").toLowerCase();
      if (p) phoneIndex.set(p, c);
      if (e) emailIndex.set(e, c);
    });

    const linkedIds = new Set<string>();
    const derived = buildCustomerList(bookings);
    const out: CustomerRow[] = [];

    for (const d of derived) {
      const phoneDigits = (d.phone || "").replace(/\D/g, "");
      const emailLower = (d.email || "").toLowerCase();
      const hit =
        (phoneDigits && phoneIndex.get(phoneDigits)) ||
        (emailLower && emailIndex.get(emailLower)) ||
        null;
      if (hit) {
        linkedIds.add(hit.id);
        out.push({
          customerId: hit.id,
          name: hit.name || d.name,
          phone: hit.phone || phoneDigits,
          email: (hit.email || emailLower) ?? "",
          address: hit.address || d.address || "",
          jobCount: d.totalBookings,
        });
      } else {
        out.push({
          customerId: null,
          name: d.name,
          phone: phoneDigits,
          email: emailLower,
          address: d.address || "",
          jobCount: d.totalBookings,
        });
      }
    }

    canonical.forEach((c) => {
      if (linkedIds.has(c.id)) return;
      out.push({
        customerId: c.id,
        name: c.name || "(no name)",
        phone: c.phone || "",
        email: c.email || "",
        address: c.address || "",
        jobCount: 0,
      });
    });

    return out.map((r) => {
      if (!r.customerId) return r;
      const o = optimistic[r.customerId];
      return o ? { ...r, ...o } : r;
    });
  }, [bookings, canonical, optimistic]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.phone, formatPhone(r.phone)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "phone") cmp = a.phone.localeCompare(b.phone);
      else if (sortKey === "email") cmp = a.email.localeCompare(b.email);
      else if (sortKey === "jobs") cmp = a.jobCount - b.jobCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function patchRow(row: CustomerRow, patch: Partial<CustomerRow>) {
    let id = row.customerId;
    if (!id) {
      id = await getOrCreateCustomerId({
        name: row.name,
        phone: row.phone,
        email: row.email,
        address: row.address,
      });
    }
    setOptimistic((prev) => ({ ...prev, [id!]: { ...prev[id!], ...patch } }));
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[id!];
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
            Customers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sorted.length} customer{sorted.length !== 1 ? "s" : ""}. Click a
            name, phone, or email cell to edit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[260px]"
          />
          <Button onClick={() => openModal("customer")}>
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
            New customer
          </Button>
        </div>
      </header>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-muted/50 sticky top-0">
                <SortHeader
                  label="Name"
                  active={sortKey === "name"}
                  dir={sortDir}
                  onClick={() => toggleSort("name")}
                />
                <SortHeader
                  label="Phone"
                  active={sortKey === "phone"}
                  dir={sortDir}
                  onClick={() => toggleSort("phone")}
                />
                <SortHeader
                  label="Email"
                  active={sortKey === "email"}
                  dir={sortDir}
                  onClick={() => toggleSort("email")}
                />
                <SortHeader
                  label="Jobs"
                  active={sortKey === "jobs"}
                  dir={sortDir}
                  onClick={() => toggleSort("jobs")}
                />
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">
                  Profile
                </th>
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
                    <EmptyState onAdd={() => openModal("customer")} />
                  </td>
                </tr>
              ) : (
                sorted.map((r) => (
                  <tr
                    key={`${r.customerId ?? "derived"}-${r.phone || r.email || r.name}`}
                    className="border-t border-border hover:bg-muted/30 transition-colors duration-150"
                  >
                    <td className="px-4 py-2 align-middle min-w-[200px]">
                      <EditableCell
                        type="text"
                        value={r.name}
                        onSave={(next) => patchRow(r, { name: next })}
                        placeholder="Customer name"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle w-[180px]">
                      <EditableCell
                        type="tel"
                        value={r.phone}
                        onSave={(next) => patchRow(r, { phone: next })}
                        display={r.phone ? formatPhone(r.phone) : undefined}
                        placeholder="Phone"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle min-w-[220px]">
                      <EditableCell
                        type="email"
                        value={r.email}
                        onSave={(next) => patchRow(r, { email: next })}
                        placeholder="Email"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle text-muted-foreground w-[80px]">
                      {r.jobCount}
                    </td>
                    <td className="px-4 py-2 align-middle text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          openModal("customer-profile", {
                            customer: {
                              name: r.name,
                              phone: r.phone,
                              email: r.email,
                              address: r.address,
                            },
                          })
                        }
                      >
                        View
                      </Button>
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
      <UsersIcon className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
      <h3 className="mt-3 text-base font-semibold text-foreground">
        No customers yet
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        Add a customer or wait for one to come in via the booking form.
      </p>
      <Button className="mt-4" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
        New customer
      </Button>
    </div>
  );
}
