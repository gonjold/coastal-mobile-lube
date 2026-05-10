"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, User as UserIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CustomerSummary } from "./types";

function formatPhoneShort(phone: string | null): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  if (d.length === 10)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

export function CustomerCombobox({
  selected,
  onSelect,
  onClear,
  onCreateNew,
}: {
  selected: CustomerSummary | null;
  onSelect: (c: CustomerSummary) => void;
  onClear: () => void;
  onCreateNew: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (selected) return;
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/field/customers?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { results?: CustomerSummary[] };
        setResults(json.results ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, selected]);

  const subtitle = useMemo(() => {
    if (!selected) return null;
    const parts: string[] = [];
    if (selected.phone) parts.push(formatPhoneShort(selected.phone));
    if (selected.email) parts.push(selected.email);
    return parts.join(" · ") || null;
  }, [selected]);

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <UserIcon
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {selected.name}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
          {selected.address && (
            <p className="truncate text-xs text-muted-foreground">
              {selected.address}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Clear customer"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search customers"
          placeholder="Search name, phone, or email"
          className="h-11 pl-9"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}
          {error && !loading && (
            <p className="px-3 py-3 text-sm text-destructive">{error}</p>
          )}
          {!loading && !error && results.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No matches.
            </p>
          )}
          {!loading &&
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full flex-col items-start gap-0.5 border-b border-border/50 px-3 py-2.5 text-left transition-colors duration-150 ease-out last:border-b-0 hover:bg-muted/40 active:bg-muted"
              >
                <span className="text-sm font-semibold text-foreground">
                  {c.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {[
                    formatPhoneShort(c.phone),
                    c.email,
                    c.address,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </span>
              </button>
            ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onCreateNew}
      >
        Create new customer
      </Button>
    </div>
  );
}
