"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServices, type Service } from "@/hooks/useServices";
import {
  FALLBACK_SERVICE_CATALOG,
  type FallbackServiceItem,
} from "@/lib/services/catalog";

type CatalogPick = {
  id: string;
  name: string;
  category: string;
  price: number;
  isFallback: boolean;
};

export function AddServiceDialog({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"catalog" | "custom">("catalog");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const { services, loading, error } = useServices({ activeOnly: true });

  const [customDesc, setCustomDesc] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customPrice, setCustomPrice] = useState("");
  const [customTaxable, setCustomTaxable] = useState(false);

  const catalogItems = useMemo<CatalogPick[]>(() => {
    if (services.length > 0) {
      return services.map((s: Service) => ({
        id: s.id,
        name: s.name,
        category: s.category || "Service",
        price: typeof s.price === "number" ? s.price : 0,
        isFallback: false,
      }));
    }
    return FALLBACK_SERVICE_CATALOG.map((s: FallbackServiceItem) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      price: s.price,
      isFallback: true,
    }));
  }, [services]);

  const groupedCatalog = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? catalogItems.filter(
          (s) =>
            s.name.toLowerCase().includes(term) ||
            s.category.toLowerCase().includes(term),
        )
      : catalogItems;
    const map = new Map<string, CatalogPick[]>();
    for (const s of filtered) {
      const key = s.category || "Service";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [catalogItems, search]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSearch("");
      setCustomDesc("");
      setCustomQty("1");
      setCustomPrice("");
      setCustomTaxable(false);
      setTab("catalog");
    }
  }

  async function postLineItem(payload: {
    description: string;
    qty: number;
    unitPrice: number;
    taxable: boolean;
    sourceServiceId: string | null;
  }) {
    setSaving(true);
    try {
      const res = await fetch(`/api/field/jobs/${jobId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Couldn't add line item", {
          description: json?.error ?? `HTTP ${res.status}`,
        });
        return false;
      }
      toast.success(`Added: ${payload.description}`);
      router.refresh();
      return true;
    } catch (err) {
      toast.error("Couldn't add line item", {
        description: err instanceof Error ? err.message : "Network error",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function pickFromCatalog(item: CatalogPick) {
    const ok = await postLineItem({
      description: item.name,
      qty: 1,
      unitPrice: item.price,
      taxable: false,
      sourceServiceId: item.isFallback ? null : item.id,
    });
    if (ok) onOpenChange(false);
  }

  const customQtyN = parseInt(customQty, 10);
  const customPriceN = parseFloat(customPrice);
  const customValid =
    customDesc.trim().length > 0 &&
    Number.isFinite(customQtyN) &&
    customQtyN >= 1 &&
    customQtyN <= 99 &&
    Number.isFinite(customPriceN) &&
    customPriceN >= 0;

  async function submitCustom() {
    if (!customValid) return;
    const ok = await postLineItem({
      description: customDesc.trim(),
      qty: customQtyN,
      unitPrice: customPriceN,
      taxable: customTaxable,
      sourceServiceId: null,
    });
    if (ok) onOpenChange(false);
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-3 w-3" strokeWidth={2} /> Add
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Add line item</DialogTitle>
            <DialogDescription>
              Pick from the catalog or enter a custom item.
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "catalog" | "custom")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="catalog">Catalog</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="pt-4">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search services…"
                    className="pl-9"
                    disabled={saving}
                  />
                </div>
                <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
                  {loading && (
                    <p className="p-4 text-sm text-muted-foreground">
                      Loading services…
                    </p>
                  )}
                  {!loading && services.length === 0 && (
                    <p className="px-4 py-2 text-xs text-muted-foreground">
                      Showing fallback catalog ({FALLBACK_SERVICE_CATALOG.length}{" "}
                      items){error ? ` — ${error}` : ""}.
                    </p>
                  )}
                  {!loading && groupedCatalog.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground">
                      No matches.
                    </p>
                  )}
                  {groupedCatalog.map(([category, list]) => (
                    <div
                      key={category}
                      className="border-b border-border last:border-0"
                    >
                      <div className="bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {category}
                      </div>
                      {list.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          disabled={saving}
                          onClick={() => void pickFromCatalog(s)}
                          className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-muted/40 last:border-0 disabled:opacity-50"
                        >
                          <span className="text-sm font-semibold text-foreground">
                            {s.name}
                          </span>
                          <span className="text-sm tabular-nums text-foreground">
                            {s.price > 0 ? `$${s.price.toFixed(2)}` : "—"}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="pt-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="svc-desc">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="svc-desc"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="e.g. Brake inspection"
                    disabled={saving}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="svc-qty">Qty</Label>
                    <Input
                      id="svc-qty"
                      inputMode="numeric"
                      value={customQty}
                      onChange={(e) =>
                        setCustomQty(e.target.value.replace(/\D/g, ""))
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="svc-price">Unit price (USD)</Label>
                    <Input
                      id="svc-price"
                      inputMode="decimal"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="0.00"
                      disabled={saving}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={customTaxable}
                    onChange={(e) => setCustomTaxable(e.target.checked)}
                    disabled={saving}
                    className="h-4 w-4 rounded border-input"
                  />
                  Taxable (Florida 7.5%)
                </label>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitCustom}
                    disabled={!customValid || saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add line item"
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
