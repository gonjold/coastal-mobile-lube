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
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  ExternalLink,
  Plus,
  Receipt,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { EditableCell } from "@coastal/shared-ui";
import FixInvoiceDialog, {
  type ErroredInvoice,
} from "@/components/admin/FixInvoiceDialog";
import { useAdminModal } from "@/contexts/AdminModalContext";
import { Badge } from "@coastal/shared-ui";
import { Button } from "@coastal/shared-ui";
import { Input } from "@coastal/shared-ui";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatCurrency";

type SortKey = "number" | "customer" | "total" | "due" | "status";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: string;
  invoiceDate?: string;
  dueDate?: string;
  qbInvoiceId?: string;
  qbDocNumber?: string;
  qbPaymentLink?: string;
  qboFinalizeStatus?: "error" | string;
  lastError?: string | null;
  lastErrorAt?: { toDate: () => Date } | null;
  qboResponseSnippet?: string | null;
  attemptedAt?: { toDate: () => Date } | null;
  deleted?: boolean;
  isTest?: boolean;
  createdAt?: { toDate: () => Date };
};

function statusBadge(s: string) {
  if (s === "paid") return "bg-success/10 text-success border-success/20";
  if (s === "overdue") return "bg-destructive/10 text-destructive border-destructive/20";
  if (s === "sent") return "bg-info/10 text-info border-info/20";
  return "bg-muted text-muted-foreground border-border";
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [optimistic, setOptimistic] = useState<Record<string, Partial<Invoice>>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [fixTarget, setFixTarget] = useState<ErroredInvoice | null>(null);
  const { openModal } = useAdminModal();

  useEffect(() => {
    const q = query(
      collection(db, "invoices"),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(
      q,
      (snap) => {
        setInvoices(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Invoice)
            .filter((i) => !i.deleted && !i.isTest),
        );
        setOptimistic({});
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  const merged = useMemo(
    () => invoices.map((i) => ({ ...i, ...optimistic[i.id] })),
    [invoices, optimistic],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return merged;
    return merged.filter((i) =>
      [i.invoiceNumber, i.customerName, i.qbDocNumber, i.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [merged, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "number")
        cmp = (a.invoiceNumber || "").localeCompare(b.invoiceNumber || "");
      else if (sortKey === "customer")
        cmp = (a.customerName || "").localeCompare(b.customerName || "");
      else if (sortKey === "total") cmp = (a.total || 0) - (b.total || 0);
      else if (sortKey === "due")
        cmp = (a.dueDate || "").localeCompare(b.dueDate || "");
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
      setSortDir(key === "due" || key === "total" ? "desc" : "asc");
    }
  }

  async function patchInvoice(id: string, patch: Partial<Invoice>) {
    setOptimistic((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    const res = await fetch(`/api/admin/invoices/${id}`, {
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
            Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sorted.length} invoice{sorted.length !== 1 ? "s" : ""}. Click the
            due-date cell to edit. Use the legacy Invoicing page to create or
            send invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[260px]"
          />
          <Button onClick={() => openModal("invoice")}>
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
            New invoice
          </Button>
        </div>
      </header>

      <FixInvoiceDialog
        invoice={fixTarget}
        open={fixTarget !== null}
        onOpenChange={(o) => !o && setFixTarget(null)}
      />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-muted/50 sticky top-0">
                <SortHeader
                  label="Invoice #"
                  active={sortKey === "number"}
                  dir={sortDir}
                  onClick={() => toggleSort("number")}
                />
                <SortHeader
                  label="Customer"
                  active={sortKey === "customer"}
                  dir={sortDir}
                  onClick={() => toggleSort("customer")}
                />
                <SortHeader
                  label="Total"
                  active={sortKey === "total"}
                  dir={sortDir}
                  onClick={() => toggleSort("total")}
                />
                <SortHeader
                  label="Due"
                  active={sortKey === "due"}
                  dir={sortDir}
                  onClick={() => toggleSort("due")}
                />
                <SortHeader
                  label="Status"
                  active={sortKey === "status"}
                  dir={sortDir}
                  onClick={() => toggleSort("status")}
                />
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState onAdd={() => openModal("invoice")} />
                  </td>
                </tr>
              ) : (
                sorted.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-border hover:bg-muted/30 transition-colors duration-150"
                  >
                    <td className="px-4 py-2 align-middle font-semibold text-foreground">
                      {inv.invoiceNumber}
                      {inv.qbDocNumber && (
                        <div className="text-[11px] text-muted-foreground">
                          QB #{inv.qbDocNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 align-middle text-muted-foreground">
                      {inv.customerName || "—"}
                    </td>
                    <td className="px-4 py-2 align-middle text-foreground tabular-nums">
                      {formatCurrency(inv.total || 0)}
                    </td>
                    <td className="px-4 py-2 align-middle w-[160px]">
                      <EditableCell
                        type="date"
                        value={inv.dueDate || ""}
                        onSave={(next) => patchInvoice(inv.id, { dueDate: next })}
                        placeholder="set due date"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle w-[120px]">
                      <Badge
                        variant="outline"
                        className={cn("font-normal capitalize", statusBadge(inv.status || ""))}
                      >
                        {inv.status || "draft"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 align-middle text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        {inv.qboFinalizeStatus === "error" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-warning/40 text-warning hover:bg-warning/10"
                            onClick={() =>
                              setFixTarget({
                                id: inv.id,
                                invoiceNumber: inv.invoiceNumber,
                                customerName: inv.customerName,
                                lastError: inv.lastError ?? null,
                                qboResponseSnippet:
                                  inv.qboResponseSnippet ?? null,
                                attemptedAt: inv.attemptedAt ?? null,
                              })
                            }
                          >
                            <AlertTriangle
                              className="h-3.5 w-3.5 mr-1.5"
                              strokeWidth={1.75}
                            />
                            Fix
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            window.open(
                              `/admin/invoicing?id=${inv.id}`,
                              "_self",
                            )
                          }
                        >
                          <ExternalLink
                            className="h-3.5 w-3.5 mr-1.5"
                            strokeWidth={1.75}
                          />
                          Open
                        </Button>
                      </div>
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
      <Receipt className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
      <h3 className="mt-3 text-base font-semibold text-foreground">
        No invoices yet
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        Create an invoice from a completed booking to get started.
      </p>
      <Button className="mt-4" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
        New invoice
      </Button>
    </div>
  );
}
