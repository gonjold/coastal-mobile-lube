"use client";

import { useMemo, useState } from "react";
import { useServices, type Service } from "@/hooks/useServices";

export interface NewLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  taxable: boolean;
  sourceServiceId: string | null;
}

interface Props {
  onAdd: (line: NewLineItem) => void;
  onClose: () => void;
}

type Tab = "catalog" | "custom";

export default function AddLineItemModal({ onAdd, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("catalog");
  const { services, loading, error } = useServices({ activeOnly: true });
  const [search, setSearch] = useState("");

  const [customDesc, setCustomDesc] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customPrice, setCustomPrice] = useState("");
  const [customTaxable, setCustomTaxable] = useState(false);

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? services.filter(
          (s) =>
            s.name.toLowerCase().includes(term) ||
            s.category?.toLowerCase().includes(term) ||
            s.description?.toLowerCase().includes(term)
        )
      : services;
    const map = new Map<string, Service[]>();
    for (const s of filtered) {
      const key = s.category || "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [services, search]);

  function pickFromCatalog(s: Service) {
    onAdd({
      description: s.name,
      qty: 1,
      unitPrice: typeof s.price === "number" ? s.price : 0,
      taxable: false,
      sourceServiceId: s.id,
    });
  }

  function submitCustom() {
    const desc = customDesc.trim();
    const qty = parseInt(customQty, 10);
    const price = parseFloat(customPrice);
    if (!desc) return;
    if (isNaN(qty) || qty < 1 || qty > 99) return;
    if (isNaN(price) || price < 0) return;
    onAdd({
      description: desc,
      qty,
      unitPrice: price,
      taxable: customTaxable,
      sourceServiceId: null,
    });
  }

  const customValid =
    customDesc.trim().length > 0 &&
    !isNaN(parseInt(customQty, 10)) &&
    parseInt(customQty, 10) >= 1 &&
    parseInt(customQty, 10) <= 99 &&
    !isNaN(parseFloat(customPrice)) &&
    parseFloat(customPrice) >= 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-bold text-[#0B2040]">Add Line Item</h2>
        <button
          onClick={onClose}
          className="min-h-[48px] min-w-[48px] rounded text-2xl text-slate-500 hover:text-slate-700"
          aria-label="Close"
        >
          ×
        </button>
      </header>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab("catalog")}
          className={`flex-1 px-4 py-3 text-sm font-semibold ${
            tab === "catalog"
              ? "border-b-2 border-[#E07B2D] text-[#0B2040]"
              : "text-slate-500"
          }`}
        >
          Catalog
        </button>
        <button
          onClick={() => setTab("custom")}
          className={`flex-1 px-4 py-3 text-sm font-semibold ${
            tab === "custom"
              ? "border-b-2 border-[#E07B2D] text-[#0B2040]"
              : "text-slate-500"
          }`}
        >
          Custom
        </button>
      </div>

      {tab === "catalog" && (
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white px-4 py-3 border-b border-slate-100">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services…"
              className="w-full rounded border border-slate-300 px-3 py-3 text-base"
            />
          </div>
          {loading && (
            <div className="p-4 text-sm text-slate-500">Loading services…</div>
          )}
          {error && (
            <div className="p-4 text-sm text-red-600">Failed to load: {error}</div>
          )}
          {!loading && !error && grouped.length === 0 && (
            <div className="p-4 text-sm text-slate-500">
              No services match &ldquo;{search}&rdquo;.
            </div>
          )}
          {grouped.map(([category, list]) => (
            <div key={category} className="border-b border-slate-100 last:border-b-0">
              <div className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {category}
              </div>
              {list.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pickFromCatalog(s)}
                  className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 last:border-b-0 min-h-[48px]"
                >
                  <span className="text-base text-[#0B2040]">{s.name}</span>
                  <span className="text-base text-slate-700">
                    {typeof s.price === "number" ? `$${s.price.toFixed(2)}` : "—"}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "custom" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Description
              </label>
              <input
                type="text"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="e.g. Brake inspection"
                className="w-full rounded border border-slate-300 px-3 py-3 text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Qty
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99}
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-3 text-base"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Unit Price
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded border border-slate-300 px-3 py-3 text-base"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-base">
              <input
                type="checkbox"
                checked={customTaxable}
                onChange={(e) => setCustomTaxable(e.target.checked)}
                className="h-5 w-5"
              />
              Taxable
            </label>
          </div>
          <div className="border-t border-slate-200 bg-white p-3">
            <button
              onClick={submitCustom}
              disabled={!customValid}
              className="w-full rounded-lg bg-[#E07B2D] px-4 py-4 text-base font-semibold text-white shadow disabled:opacity-50 min-h-[48px]"
            >
              Add Line Item
            </button>
          </div>
        </>
      )}
    </div>
  );
}
