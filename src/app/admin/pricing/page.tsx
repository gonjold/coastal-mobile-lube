"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
/* pricingCatalog.ts kept as offline backup — all live data comes from Firestore */
import ToastContainer, { type ToastItem } from "../Toast";

/* ── Types ── */

type Division = "auto" | "marine" | "fleet";

interface EditableItem {
  id: string;
  category: string;
  subcategory?: string;
  name: string;
  price: number;
  note?: string;
  laborHours?: number;
  division: Division;
  displayOnSite: boolean;
  displayOrder: number;
  active: boolean;
}

interface EditableCategory {
  id: string;
  name: string;
  division: Division;
  description: string;
  startingAt: number;
  displayOrder: number;
  items: EditableItem[];
}

interface ServiceDocData {
  categories: EditableCategory[];
  updatedAt?: Timestamp;
}

/* ── Helpers ── */

const DIVISIONS: { key: Division; label: string }[] = [
  { key: "auto", label: "Auto" },
  { key: "marine", label: "Marine" },
  { key: "fleet", label: "Fleet" },
];

/* catalogToEditable removed — Firestore is now the sole data source */

function editableToFirestore(cats: EditableCategory[]) {
  return cats.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => ({
      id: item.id,
      category: item.category,
      subcategory: item.subcategory || null,
      name: item.name,
      price: item.price,
      note: item.note || null,
      laborHours: item.laborHours || null,
      division: item.division,
      displayOnSite: item.active,
      displayOrder: item.displayOrder,
    })),
  }));
}

/* ── Component ── */

export default function PricingPage() {
  const [categories, setCategories] = useState<EditableCategory[]>([]);
  const [originalCategories, setOriginalCategories] = useState<EditableCategory[]>([]);
  const [activeDivision, setActiveDivision] = useState<Division>("auto");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const hasUnsavedChanges = useRef(false);

  const addToast = useCallback((message: string, type: "success" | "info" = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  /* ── Load from Firestore, fall back to static catalog ── */
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, "services"));
        if (snap.empty) {
          setCategories([]);
          setOriginalCategories([]);
        } else {
          const allCats: EditableCategory[] = [];
          let latestUpdate: Date | null = null;
          snap.forEach((d) => {
            const data = d.data() as ServiceDocData;
            if (data.categories) allCats.push(...data.categories);
            if (data.updatedAt?.toDate) {
              const dt = data.updatedAt.toDate();
              if (!latestUpdate || dt > latestUpdate) latestUpdate = dt;
            }
          });
          if (allCats.length > 0) {
            setCategories(allCats);
            setOriginalCategories(allCats);
            setLastUpdated(latestUpdate);
          } else {
            setCategories([]);
            setOriginalCategories([]);
          }
        }
      } catch {
        setCategories([]);
        setOriginalCategories([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  /* ── Auto-expand first category on division change ── */
  useEffect(() => {
    const divCats = categories.filter((c) => c.division === activeDivision);
    if (divCats.length > 0) setExpandedCategory(divCats[0].id);
  }, [activeDivision, categories]);

  /* ── Track unsaved changes ── */
  useEffect(() => {
    hasUnsavedChanges.current =
      JSON.stringify(categories) !== JSON.stringify(originalCategories);
  }, [categories, originalCategories]);

  /* ── Mutations ── */

  function updateItemField(
    catId: string,
    itemId: string,
    field: "price" | "note" | "name",
    value: string | number
  ) {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== catId
          ? cat
          : {
              ...cat,
              items: cat.items.map((item) =>
                item.id !== itemId ? item : { ...item, [field]: value }
              ),
            }
      )
    );
  }

  function toggleItemActive(catId: string, itemId: string) {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== catId
          ? cat
          : {
              ...cat,
              items: cat.items.map((item) =>
                item.id !== itemId ? item : { ...item, active: !item.active }
              ),
            }
      )
    );
  }

  /* ── Save to Firestore ── */
  async function handleSave() {
    setSaving(true);
    try {
      // Group by division and save one doc per division
      for (const div of DIVISIONS) {
        const divCats = categories.filter((c) => c.division === div.key);
        if (divCats.length === 0) continue;
        await setDoc(doc(db, "services", div.key), {
          categories: editableToFirestore(divCats),
          updatedAt: serverTimestamp(),
        });
      }
      const now = new Date();
      setLastUpdated(now);
      setOriginalCategories(categories);
      hasUnsavedChanges.current = false;
      addToast("Pricing saved successfully");
    } catch {
      addToast("Failed to save pricing. Please try again.", "info");
    }
    setSaving(false);
  }

  /* ── Reset to original catalog ── */
  function handleReset() {
    setCategories(originalCategories);
    addToast("Reset to last saved state", "info");
  }

  /* ── Derived ── */
  const visibleCategories = categories.filter((c) => c.division === activeDivision);
  const totalItems = visibleCategories.reduce((sum, c) => sum + c.items.length, 0);
  const activeItems = visibleCategories.reduce(
    (sum, c) => sum + c.items.filter((i) => i.active).length,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[#888] mb-6">
        <Link href="/admin" className="hover:text-[#1A5FAC] transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-[#0B2040] font-semibold">Pricing &amp; Services</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-[800] text-[#0B2040] mb-1">
            Pricing &amp; Services
          </h1>
          <p className="text-[14px] text-[#888]">
            Manage service pricing, availability, and notes across all divisions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-[13px] font-semibold border border-[#e8e8e8] rounded-[8px] text-[#888] hover:text-[#0B2040] hover:border-[#ccc] transition-all"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-[13px] font-semibold bg-[#E07B2D] text-white rounded-[8px] hover:bg-[#c96a22] transition-all disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-4">
          <div className="text-[11px] uppercase tracking-[0.5px] text-[#888] mb-1">
            Categories
          </div>
          <div className="text-[24px] font-[800] text-[#0B2040]">
            {visibleCategories.length}
          </div>
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-4">
          <div className="text-[11px] uppercase tracking-[0.5px] text-[#888] mb-1">
            Total Services
          </div>
          <div className="text-[24px] font-[800] text-[#0B2040]">{totalItems}</div>
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-[12px] p-4">
          <div className="text-[11px] uppercase tracking-[0.5px] text-[#888] mb-1">
            Active on Site
          </div>
          <div className="text-[24px] font-[800] text-[#16a34a]">{activeItems}</div>
        </div>
      </div>

      {/* Last updated + division tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        {/* Division tabs */}
        <div className="flex border border-[#e8e8e8] rounded-[8px] overflow-hidden">
          {DIVISIONS.map((div) => {
            const isActive = activeDivision === div.key;
            const count = categories.filter((c) => c.division === div.key).length;
            return (
              <button
                key={div.key}
                onClick={() => setActiveDivision(div.key)}
                className={`px-5 py-2.5 text-[13px] font-semibold transition-all ${
                  isActive
                    ? "bg-[#0B2040] text-white"
                    : "bg-white text-[#888] hover:text-[#0B2040] hover:bg-[#f5f5f5]"
                }`}
              >
                {div.label}
                <span
                  className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/20" : "bg-[#f0f0f0]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <div className="text-[12px] text-[#888]">
            Last updated:{" "}
            <span className="font-semibold text-[#0B2040]">
              {lastUpdated.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at{" "}
              {lastUpdated.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Category accordion + service tables */}
      <div className="flex flex-col gap-4">
        {visibleCategories.map((cat) => {
          const isExpanded = expandedCategory === cat.id;
          const catActiveCount = cat.items.filter((i) => i.active).length;
          return (
            <div
              key={cat.id}
              className="bg-white border border-[#e8e8e8] rounded-[12px] overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FAFBFC] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#888"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[15px] font-bold text-[#0B2040]">{cat.name}</div>
                    <div className="text-[12px] text-[#888]">{cat.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-[#888] shrink-0">
                  <span>{cat.items.length} services</span>
                  <span className="text-[#16a34a] font-semibold">
                    {catActiveCount} active
                  </span>
                </div>
              </button>

              {/* Expanded service table */}
              {isExpanded && (
                <div className="border-t border-[#e8e8e8]">
                  {/* Table header */}
                  <div className="hidden sm:grid sm:grid-cols-[1fr_100px_1fr_80px] gap-3 px-5 py-2.5 bg-[#FAFBFC] text-[11px] uppercase tracking-[0.5px] text-[#888] font-semibold">
                    <div>Service</div>
                    <div>Price</div>
                    <div>Notes</div>
                    <div className="text-center">Active</div>
                  </div>

                  {/* Service rows */}
                  {cat.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`grid grid-cols-1 sm:grid-cols-[1fr_100px_1fr_80px] gap-3 px-5 py-3 items-center ${
                        idx > 0 ? "border-t border-[#f0f0f0]" : ""
                      } ${!item.active ? "opacity-50" : ""}`}
                    >
                      {/* Name */}
                      <div className="flex items-center gap-2">
                        {item.subcategory && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF4FF] text-[#1A5FAC] font-semibold whitespace-nowrap">
                            {item.subcategory}
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItemField(cat.id, item.id, "name", e.target.value)
                          }
                          className="text-[14px] text-[#0B2040] font-medium bg-transparent border-b border-transparent hover:border-[#e8e8e8] focus:border-[#1A5FAC] focus:outline-none transition-colors w-full py-0.5"
                        />
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] text-[#888]">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            updateItemField(
                              cat.id,
                              item.id,
                              "price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="text-[14px] text-[#0B2040] font-semibold bg-transparent border-b border-transparent hover:border-[#e8e8e8] focus:border-[#1A5FAC] focus:outline-none transition-colors w-full py-0.5"
                        />
                      </div>

                      {/* Notes */}
                      <input
                        type="text"
                        value={item.note || ""}
                        placeholder="—"
                        onChange={(e) =>
                          updateItemField(cat.id, item.id, "note", e.target.value)
                        }
                        className="text-[13px] text-[#888] bg-transparent border-b border-transparent hover:border-[#e8e8e8] focus:border-[#1A5FAC] focus:outline-none transition-colors py-0.5"
                      />

                      {/* Active toggle */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleItemActive(cat.id, item.id)}
                          className={`relative w-10 h-[22px] rounded-full transition-colors ${
                            item.active ? "bg-[#16a34a]" : "bg-[#ddd]"
                          }`}
                        >
                          <div
                            className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
                              item.active ? "left-[20px]" : "left-[2px]"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom save bar (sticky on scroll) */}
      {hasUnsavedChanges.current && (
        <div className="sticky bottom-4 mt-6 bg-[#0B2040] text-white rounded-[12px] px-5 py-3 flex items-center justify-between shadow-lg">
          <span className="text-[13px] font-medium">You have unsaved changes</span>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-1.5 text-[13px] font-semibold border border-white/30 rounded-[6px] hover:bg-white/10 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-[13px] font-semibold bg-[#E07B2D] rounded-[6px] hover:bg-[#c96a22] transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
