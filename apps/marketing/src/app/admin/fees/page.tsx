"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/* ── Types ── */

interface FeeConditions {
  timeOfDay: { before: string; after: string } | null;
  daysOfWeek: string[] | null;
  minDistance: number | null;
  minOrder: number | null;
}

interface Fee {
  id: string;
  name: string;
  type: "flat" | "percentage" | "per-mile";
  amount: number;
  appliesTo: string;
  customerType: string;
  conditions: FeeConditions;
  showOnBooking: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface Promo {
  id: string;
  name: string;
  type: "percentage" | "flat" | "waive-fee" | "free-service";
  value: number;
  waivesFeeId: string | null;
  freeServiceName?: string;
  appliesTo: string;
  customerType: string;
  code: string;
  autoApply: boolean;
  startDate: string;
  endDate: string | null;
  showAs: "banner" | "popup" | "badge" | "none";
  usageCount: number;
  isActive: boolean;
  sortOrder: number;
}

/* ── Helpers ── */

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const EMPTY_FEE: Omit<Fee, "id"> = {
  name: "",
  type: "flat",
  amount: 0,
  appliesTo: "all",
  customerType: "all",
  conditions: { timeOfDay: null, daysOfWeek: null, minDistance: null, minOrder: null },
  showOnBooking: true,
  isActive: true,
  sortOrder: 0,
};

const EMPTY_PROMO: Omit<Promo, "id"> = {
  name: "",
  type: "percentage",
  value: 0,
  waivesFeeId: null,
  freeServiceName: "",
  appliesTo: "all",
  customerType: "all",
  code: "",
  autoApply: false,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: null,
  showAs: "none",
  usageCount: 0,
  isActive: true,
  sortOrder: 0,
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function feeTypeIcon(type: Fee["type"]) {
  if (type === "flat") return { label: "$", bg: "#E6F1FB", color: "#185FA5" };
  if (type === "percentage") return { label: "%", bg: "#FAEEDA", color: "#854F0B" };
  return { label: "mi", bg: "#E1F5EE", color: "#0F6E56" };
}

function feeAmountDisplay(fee: Fee) {
  if (fee.type === "flat") return `$${fee.amount.toFixed(2)}`;
  if (fee.type === "percentage") return `${fee.amount}%`;
  return `$${fee.amount.toFixed(2)}/mi`;
}

function feeSubtitle(fee: Fee) {
  const parts: string[] = [];
  if (fee.conditions.timeOfDay) parts.push("Time-based");
  if (fee.conditions.daysOfWeek) parts.push(fee.conditions.daysOfWeek.map((d) => d.slice(0, 3)).join(", "));
  if (fee.conditions.minDistance) parts.push(`>${fee.conditions.minDistance}mi`);
  if (fee.conditions.minOrder) parts.push(`Min $${fee.conditions.minOrder}`);
  const condStr = parts.length > 0 ? parts.join(" · ") + " · " : "";
  const typeLabel = fee.type === "flat" ? "Flat rate" : fee.type === "percentage" ? "Percentage" : "Per mile";
  return condStr + typeLabel;
}

function promoStatusPill(promo: Promo): { label: string; bg: string; color: string } | null {
  const today = new Date().toISOString().slice(0, 10);
  if (!promo.isActive) return null;
  if (promo.endDate && promo.endDate < today) return { label: "Expired", bg: "#F1F5F9", color: "#64748B" };
  if (promo.startDate > today) return { label: "Scheduled", bg: "#E6F1FB", color: "#185FA5" };
  if (!promo.endDate || promo.endDate >= today) return { label: "Active", bg: "#EAF3DE", color: "#3B6D11" };
  return null;
}

function promoSubtitle(promo: Promo) {
  const custLabel = promo.customerType === "all" ? "All customers" : promo.customerType === "new" ? "New customers" : promo.customerType === "returning" ? "Returning" : "Commercial";
  const dateStr = promo.endDate ? `${promo.startDate} – ${promo.endDate}` : "No expiration";
  return `${custLabel} · ${dateStr}`;
}

/* ── Toggle Switch ── */

function Toggle({ on, size = 34, onChange }: { on: boolean; size?: number; onChange: () => void }) {
  const h = size === 34 ? 18 : 24;
  const w = size === 34 ? 34 : 44;
  const knob = size === 34 ? 12 : 16;
  const pad = size === 34 ? 3 : 4;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        position: "relative", display: "inline-flex", height: h, width: w, alignItems: "center",
        borderRadius: h / 2, border: "none", cursor: "pointer", background: on ? "#1A5FAC" : "#E5E7EB",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        display: "inline-block", height: knob, width: knob, borderRadius: knob / 2,
        background: "#FFF", boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        transform: on ? `translateX(${w - knob - pad}px)` : `translateX(${pad}px)`, transition: "transform 0.2s",
      }} />
    </button>
  );
}

/* ── Chevron ── */

function Chevron({ up }: { up: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.2s", transform: up ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
      <polyline points="4,6 8,10 12,6" />
    </svg>
  );
}

/* ── Main Page ── */

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState<"fees" | "promos">("fees");
  const [fees, setFees] = useState<Fee[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const addBtnRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback((message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  /* Close add dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (addBtnRef.current && !addBtnRef.current.contains(e.target as Node)) setAddDropdownOpen(false);
    }
    if (addDropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [addDropdownOpen]);

  /* ── Load from Firestore ── */
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "settings", "fees"));
        if (snap.exists()) {
          const data = snap.data();

          // New format
          if (data.fees && Array.isArray(data.fees)) {
            setFees(data.fees);
          }
          // Backward compatibility: migrate old convenienceFee
          else if (data.convenienceFee) {
            const old = data.convenienceFee;
            const migrated: Fee = {
              id: "mobile-service-fee",
              name: old.label || "Mobile Service Fee",
              type: "flat",
              amount: old.amount ?? 39.95,
              appliesTo: "all",
              customerType: "all",
              conditions: { timeOfDay: null, daysOfWeek: null, minDistance: null, minOrder: null },
              showOnBooking: true,
              isActive: old.enabled ?? true,
              sortOrder: 0,
            };
            setFees([migrated]);
          }

          if (data.promos && Array.isArray(data.promos)) {
            setPromos(data.promos);
          }
        }
      } catch (err) {
        console.error("Failed to load fees settings:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  /* ── Save to Firestore ── */
  const persist = useCallback(async (newFees: Fee[], newPromos: Promo[]) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "fees"), {
        fees: newFees,
        promos: newPromos,
        // Keep convenienceFee for backward compatibility with booking wizard
        convenienceFee: (() => {
          const main = newFees.find((f) => f.type === "flat" && f.appliesTo === "all");
          if (!main) return { enabled: false, amount: 0, label: "", taxable: false, waiveFirstService: false, promoOverride: false };
          return { enabled: main.isActive, amount: main.amount, label: main.name, taxable: false, waiveFirstService: false, promoOverride: false };
        })(),
      });
    } catch (err) {
      console.error("Failed to save:", err);
      addToast("Failed to save changes");
    }
    setSaving(false);
  }, [addToast]);

  /* ── Fee CRUD ── */

  function handleToggleFee(id: string) {
    const updated = fees.map((f) => f.id === id ? { ...f, isActive: !f.isActive } : f);
    setFees(updated);
    persist(updated, promos);
  }

  function handleSaveFee(fee: Fee) {
    const exists = fees.find((f) => f.id === fee.id);
    let updated: Fee[];
    if (exists) {
      updated = fees.map((f) => f.id === fee.id ? fee : f);
    } else {
      updated = [fee, ...fees];
    }
    setFees(updated);
    persist(updated, promos);
    setExpandedId(null);
    addToast(exists ? "Fee updated" : "Fee added");
  }

  function handleDeleteFee(id: string) {
    const updated = fees.filter((f) => f.id !== id);
    setFees(updated);
    persist(updated, promos);
    setExpandedId(null);
    addToast("Fee deleted");
  }

  /* ── Promo CRUD ── */

  function handleTogglePromo(id: string) {
    const updated = promos.map((p) => p.id === id ? { ...p, isActive: !p.isActive } : p);
    setPromos(updated);
    persist(fees, updated);
  }

  function handleSavePromo(promo: Promo) {
    const exists = promos.find((p) => p.id === promo.id);
    let updated: Promo[];
    if (exists) {
      updated = promos.map((p) => p.id === promo.id ? promo : p);
    } else {
      updated = [promo, ...promos];
    }
    setPromos(updated);
    persist(fees, updated);
    setExpandedId(null);
    addToast(exists ? "Promotion updated" : "Promotion added");
  }

  function handleDeletePromo(id: string) {
    const updated = promos.filter((p) => p.id !== id);
    setPromos(updated);
    persist(fees, updated);
    setExpandedId(null);
    addToast("Promotion deleted");
  }

  /* ── Add New ── */

  function handleAddNew(type: "fee" | "promo") {
    setAddDropdownOpen(false);
    const newId = genId();
    if (type === "fee") {
      setActiveTab("fees");
      const newFee: Fee = { ...EMPTY_FEE, id: newId, sortOrder: fees.length };
      setFees((prev) => [newFee, ...prev]);
      setExpandedId(newId);
    } else {
      setActiveTab("promos");
      const newPromo: Promo = { ...EMPTY_PROMO, id: newId, sortOrder: promos.length };
      setPromos((prev) => [newPromo, ...prev]);
      setExpandedId(newId);
    }
  }

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#0F2A44] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <AdminTopBar title="Fees & promotions" subtitle="Manage service fees, surcharges, and promotional discounts">
        <div ref={addBtnRef} style={{ position: "relative" }}>
          <button
            onClick={() => setAddDropdownOpen((p) => !p)}
            style={{
              padding: "7px 14px", fontSize: 13, fontWeight: 600, background: "#0B2040", color: "#FFF",
              border: "none", borderRadius: 8, cursor: "pointer",
            }}
          >
            + Add new
          </button>
          {addDropdownOpen && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#FFF", borderRadius: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: "1px solid #E2E8F0", overflow: "hidden", zIndex: 50, minWidth: 160,
            }}>
              <button onClick={() => handleAddNew("fee")}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#0B2040", background: "transparent", border: "none", borderBottom: "1px solid #E2E8F0", cursor: "pointer" }}>
                Service fee
              </button>
              <button onClick={() => handleAddNew("promo")}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#0B2040", background: "transparent", border: "none", cursor: "pointer" }}>
                Promotion
              </button>
            </div>
          )}
        </div>
      </AdminTopBar>

      {/* Tab pills row */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", padding: "12px 24px" }}>
        <div style={{ display: "inline-flex", background: "#F7F8FA", borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setActiveTab("fees")}
            style={{
              padding: "6px 16px", fontSize: 13, border: activeTab === "fees" ? "0.5px solid #E2E8F0" : "none",
              borderRadius: 6, fontWeight: activeTab === "fees" ? 500 : 400, cursor: "pointer",
              background: activeTab === "fees" ? "#FFFFFF" : "transparent",
              color: activeTab === "fees" ? "#0B2040" : "#64748B",
            }}
          >
            Service fees ({fees.length})
          </button>
          <button
            onClick={() => setActiveTab("promos")}
            style={{
              padding: "6px 16px", fontSize: 13, border: activeTab === "promos" ? "0.5px solid #E2E8F0" : "none",
              borderRadius: 6, fontWeight: activeTab === "promos" ? 500 : 400, cursor: "pointer",
              background: activeTab === "promos" ? "#FFFFFF" : "transparent",
              color: activeTab === "promos" ? "#0B2040" : "#64748B",
            }}
          >
            Promotions ({promos.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px" }}>
        {activeTab === "fees" && (
          <>
            {fees.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#94A3B8", fontSize: 14 }}>
                No service fees configured.
                <button onClick={() => handleAddNew("fee")} style={{ display: "block", margin: "12px auto 0", fontSize: 13, fontWeight: 600, color: "#185FA5", background: "none", border: "none", cursor: "pointer" }}>
                  + Add your first fee
                </button>
              </div>
            )}
            {fees.map((fee) => (
              <FeeCard
                key={fee.id}
                fee={fee}
                isExpanded={expandedId === fee.id}
                isNew={!fee.name}
                onToggleExpand={() => setExpandedId(expandedId === fee.id ? null : fee.id)}
                onToggleActive={() => handleToggleFee(fee.id)}
                onSave={handleSaveFee}
                onDelete={() => handleDeleteFee(fee.id)}
                saving={saving}
              />
            ))}
          </>
        )}

        {activeTab === "promos" && (
          <>
            {promos.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "#94A3B8", fontSize: 14 }}>
                No promotions configured.
                <button onClick={() => handleAddNew("promo")} style={{ display: "block", margin: "12px auto 0", fontSize: 13, fontWeight: 600, color: "#185FA5", background: "none", border: "none", cursor: "pointer" }}>
                  + Add your first promotion
                </button>
              </div>
            )}
            {promos.map((promo) => (
              <PromoCard
                key={promo.id}
                promo={promo}
                fees={fees}
                isExpanded={expandedId === promo.id}
                isNew={!promo.name}
                onToggleExpand={() => setExpandedId(expandedId === promo.id ? null : promo.id)}
                onToggleActive={() => handleTogglePromo(promo.id)}
                onSave={handleSavePromo}
                onDelete={() => handleDeletePromo(promo.id)}
                saving={saving}
              />
            ))}
          </>
        )}
      </div>

      {/* Toasts */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, display: "flex", flexDirection: "column", gap: 8 }}>
          {toasts.map((t) => (
            <div key={t.id} style={{ background: "#0B2040", color: "#FFF", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              {t.message}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   Fee Card
   ══════════════════════════════════════════ */

function FeeCard({
  fee, isExpanded, isNew, onToggleExpand, onToggleActive, onSave, onDelete, saving,
}: {
  fee: Fee; isExpanded: boolean; isNew: boolean;
  onToggleExpand: () => void; onToggleActive: () => void;
  onSave: (f: Fee) => void; onDelete: () => void; saving: boolean;
}) {
  const icon = feeTypeIcon(fee.type);

  const [form, setForm] = useState<Fee>({ ...fee });

  // Reset form when card is opened
  useEffect(() => {
    if (isExpanded) setForm({ ...fee });
  }, [isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Condition visibility
  const [showTimeCond, setShowTimeCond] = useState(!!fee.conditions.timeOfDay);
  const [showDayCond, setShowDayCond] = useState(!!fee.conditions.daysOfWeek);
  const [showDistCond, setShowDistCond] = useState(!!fee.conditions.minDistance);
  const [showMinOrderCond, setShowMinOrderCond] = useState(!!fee.conditions.minOrder);

  useEffect(() => {
    if (isExpanded) {
      setShowTimeCond(!!fee.conditions.timeOfDay);
      setShowDayCond(!!fee.conditions.daysOfWeek);
      setShowDistCond(!!fee.conditions.minDistance);
      setShowMinOrderCond(!!fee.conditions.minOrder);
    }
  }, [isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isExpanded && isNew && nameRef.current) nameRef.current.focus();
  }, [isExpanded, isNew]);

  function handleSave() {
    if (!form.name.trim()) return;
    // Clean up conditions based on visibility
    const cleaned: Fee = {
      ...form,
      conditions: {
        timeOfDay: showTimeCond ? form.conditions.timeOfDay : null,
        daysOfWeek: showDayCond ? form.conditions.daysOfWeek : null,
        minDistance: showDistCond ? form.conditions.minDistance : null,
        minOrder: showMinOrderCond ? form.conditions.minOrder : null,
      },
    };
    onSave(cleaned);
  }

  const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 4 };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13, outline: "none", background: "#FFF" };

  return (
    <div style={{
      background: "#FFFFFF", border: isExpanded ? "1px solid #CBD5E1" : "1px solid #E2E8F0",
      borderRadius: 10, marginBottom: 10, transition: "border-color 0.2s",
      borderLeft: isNew && !fee.name ? "2px solid #2563EB" : undefined,
    }}>
      {/* Collapsed summary row */}
      <div
        onClick={onToggleExpand}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Icon */}
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: icon.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: icon.color, flexShrink: 0,
          }}>
            {icon.label}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0B2040" }}>{fee.name || "New fee"}</div>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>{feeSubtitle(fee)}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: "#0B2040" }}>{feeAmountDisplay(fee)}</span>
          <Toggle on={fee.isActive} onChange={onToggleActive} />
          <Chevron up={isExpanded} />
        </div>
      </div>

      {/* Expanded edit form */}
      {isExpanded && (
        <div style={{ borderTop: "1px solid #E2E8F0", padding: "14px 18px" }}>
          {/* Row 1: Name + Amount */}
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Fee name</label>
              <input ref={nameRef} style={inputStyle} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Amount</label>
              <div style={{ display: "flex", gap: 0 }}>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Fee["type"] }))}
                  style={{ padding: "7px 6px", border: "1px solid #E5E7EB", borderRadius: "6px 0 0 6px", fontSize: 12, background: "#F7F8FA", color: "#64748B", outline: "none", borderRight: "none" }}
                >
                  <option value="flat">$</option>
                  <option value="percentage">%</option>
                  <option value="per-mile">$/mi</option>
                </select>
                <input
                  type="number" step="0.01" style={{ ...inputStyle, borderRadius: "0 6px 6px 0" }}
                  value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Applies to + Customer type */}
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Applies to division</label>
              <select style={{ ...inputStyle, background: "#FFF" }} value={form.appliesTo} onChange={(e) => setForm((p) => ({ ...p, appliesTo: e.target.value }))}>
                <option value="all">All divisions</option>
                <option value="automotive">Automotive</option>
                <option value="marine">Marine</option>
                <option value="fleet">Fleet</option>
                <option value="rv">RV</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Customer type</label>
              <select style={{ ...inputStyle, background: "#FFF" }} value={form.customerType} onChange={(e) => setForm((p) => ({ ...p, customerType: e.target.value }))}>
                <option value="all">All customers</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>

          {/* Row 3: Conditions */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Conditions (optional)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              <ConditionChip
                label="Time of day" active={showTimeCond}
                onToggle={() => {
                  if (showTimeCond) { setShowTimeCond(false); setForm((p) => ({ ...p, conditions: { ...p.conditions, timeOfDay: null } })); }
                  else { setShowTimeCond(true); setForm((p) => ({ ...p, conditions: { ...p.conditions, timeOfDay: { before: "07:00", after: "17:00" } } })); }
                }}
              />
              <ConditionChip
                label="Day of week" active={showDayCond}
                onToggle={() => {
                  if (showDayCond) { setShowDayCond(false); setForm((p) => ({ ...p, conditions: { ...p.conditions, daysOfWeek: null } })); }
                  else { setShowDayCond(true); setForm((p) => ({ ...p, conditions: { ...p.conditions, daysOfWeek: ["saturday", "sunday"] } })); }
                }}
              />
              <ConditionChip
                label="Distance" active={showDistCond}
                onToggle={() => {
                  if (showDistCond) { setShowDistCond(false); setForm((p) => ({ ...p, conditions: { ...p.conditions, minDistance: null } })); }
                  else { setShowDistCond(true); setForm((p) => ({ ...p, conditions: { ...p.conditions, minDistance: 25 } })); }
                }}
              />
              <ConditionChip
                label="Min order" active={showMinOrderCond}
                onToggle={() => {
                  if (showMinOrderCond) { setShowMinOrderCond(false); setForm((p) => ({ ...p, conditions: { ...p.conditions, minOrder: null } })); }
                  else { setShowMinOrderCond(true); setForm((p) => ({ ...p, conditions: { ...p.conditions, minOrder: 50 } })); }
                }}
              />
            </div>

            {/* Condition inputs */}
            {showTimeCond && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 13, color: "#374151" }}>
                Applies before
                <input type="time" style={{ ...inputStyle, width: 110 }}
                  value={form.conditions.timeOfDay?.before || "07:00"}
                  onChange={(e) => setForm((p) => ({ ...p, conditions: { ...p.conditions, timeOfDay: { before: e.target.value, after: p.conditions.timeOfDay?.after || "17:00" } } }))}
                />
                or after
                <input type="time" style={{ ...inputStyle, width: 110 }}
                  value={form.conditions.timeOfDay?.after || "17:00"}
                  onChange={(e) => setForm((p) => ({ ...p, conditions: { ...p.conditions, timeOfDay: { before: p.conditions.timeOfDay?.before || "07:00", after: e.target.value } } }))}
                />
              </div>
            )}
            {showDayCond && (
              <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                {DAYS.map((day, i) => {
                  const checked = form.conditions.daysOfWeek?.includes(day) || false;
                  return (
                    <label key={day} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                      <input type="checkbox" checked={checked} style={{ accentColor: "#1a5276" }}
                        onChange={() => setForm((p) => {
                          const current = p.conditions.daysOfWeek || [];
                          const next = checked ? current.filter((d) => d !== day) : [...current, day];
                          return { ...p, conditions: { ...p.conditions, daysOfWeek: next.length > 0 ? next : null } };
                        })}
                      />
                      {DAY_LABELS[i]}
                    </label>
                  );
                })}
              </div>
            )}
            {showDistCond && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 13, color: "#374151" }}>
                <input type="number" style={{ ...inputStyle, width: 80 }}
                  value={form.conditions.minDistance || ""}
                  onChange={(e) => setForm((p) => ({ ...p, conditions: { ...p.conditions, minDistance: parseFloat(e.target.value) || null } }))}
                />
                miles from base
              </div>
            )}
            {showMinOrderCond && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6, fontSize: 13, color: "#374151" }}>
                $
                <input type="number" step="0.01" style={{ ...inputStyle, width: 100 }}
                  value={form.conditions.minOrder || ""}
                  onChange={(e) => setForm((p) => ({ ...p, conditions: { ...p.conditions, minOrder: parseFloat(e.target.value) || null } }))}
                />
                minimum order
              </div>
            )}
          </div>

          {/* Row 4: Show on booking */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Show on booking summary</label>
            <div style={{ display: "flex", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                <input type="radio" name={`booking-${fee.id}`} checked={form.showOnBooking} onChange={() => setForm((p) => ({ ...p, showOnBooking: true }))} style={{ accentColor: "#1a5276" }} />
                Yes, as line item
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                <input type="radio" name={`booking-${fee.id}`} checked={!form.showOnBooking} onChange={() => setForm((p) => ({ ...p, showOnBooking: false }))} style={{ accentColor: "#1a5276" }} />
                No, internal only
              </label>
            </div>
          </div>

          {/* Action bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #E2E8F0", paddingTop: 12 }}>
            <button onClick={onDelete} style={{ fontSize: 13, color: "#DC2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Delete fee
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onToggleExpand}
                style={{ padding: "7px 16px", fontSize: 13, fontWeight: 500, border: "1px solid #E5E7EB", borderRadius: 6, background: "#FFF", color: "#6B7280", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                style={{
                  padding: "7px 16px", fontSize: 13, fontWeight: 500, border: "none", borderRadius: 6, cursor: saving || !form.name.trim() ? "default" : "pointer",
                  background: saving || !form.name.trim() ? "#94A3B8" : "#0B2040", color: "#FFF", opacity: saving ? 0.7 : 1,
                }}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Condition Chip ── */

function ConditionChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: 12, fontWeight: 500,
        borderRadius: 20, border: "none", cursor: "pointer",
        background: active ? "#E6F1FB" : "#F1F5F9", color: active ? "#185FA5" : "#64748B",
      }}
    >
      {active ? (
        <>
          {label}
          <span style={{ marginLeft: 2, fontSize: 14, lineHeight: 1 }}>&times;</span>
        </>
      ) : (
        <>+ {label}</>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════
   Promo Card
   ══════════════════════════════════════════ */

function PromoCard({
  promo, fees, isExpanded, isNew, onToggleExpand, onToggleActive, onSave, onDelete, saving,
}: {
  promo: Promo; fees: Fee[]; isExpanded: boolean; isNew: boolean;
  onToggleExpand: () => void; onToggleActive: () => void;
  onSave: (p: Promo) => void; onDelete: () => void; saving: boolean;
}) {
  const pill = promoStatusPill(promo);

  const [form, setForm] = useState<Promo>({ ...promo });
  const [noExpiration, setNoExpiration] = useState(!promo.endDate);

  useEffect(() => {
    if (isExpanded) { setForm({ ...promo }); setNoExpiration(!promo.endDate); }
  }, [isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isExpanded && isNew && nameRef.current) nameRef.current.focus();
  }, [isExpanded, isNew]);

  function handleSave() {
    if (!form.name.trim()) return;
    const cleaned: Promo = {
      ...form,
      endDate: noExpiration ? null : form.endDate,
      code: form.autoApply ? "" : form.code,
    };
    onSave(cleaned);
  }

  const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 4 };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13, outline: "none", background: "#FFF" };

  const promoTypeLabel = form.type === "percentage" ? "Percentage discount" : form.type === "flat" ? "Flat discount" : form.type === "waive-fee" ? "Waive fee" : "Free service";

  return (
    <div style={{
      background: "#FFFFFF", border: isExpanded ? "1px solid #CBD5E1" : "1px solid #E2E8F0",
      borderRadius: 10, marginBottom: 10, transition: "border-color 0.2s",
      borderLeft: isNew && !promo.name ? "2px solid #2563EB" : undefined,
    }}>
      {/* Collapsed summary row */}
      <div
        onClick={onToggleExpand}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: "#EAF3DE",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 8.5V3a1 1 0 011-1h5.5L14 7.5 8.5 13 2 8.5z" />
              <circle cx="5.5" cy="5.5" r="1" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0B2040" }}>{promo.name || "New promotion"}</div>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>{promoSubtitle(promo)}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {pill && (
            <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: pill.bg, color: pill.color }}>
              {pill.label}
            </span>
          )}
          <Toggle on={promo.isActive} onChange={onToggleActive} />
          <Chevron up={isExpanded} />
        </div>
      </div>

      {/* Expanded edit form */}
      {isExpanded && (
        <div style={{ borderTop: "1px solid #E2E8F0", padding: "14px 18px" }}>
          {/* Row 1: Name */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Promo name</label>
            <input ref={nameRef} style={inputStyle} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>

          {/* Row 2: Type + Value */}
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Type</label>
              <select style={{ ...inputStyle, background: "#FFF" }} value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Promo["type"], waivesFeeId: null, freeServiceName: "" }))}>
                <option value="percentage">Percentage discount</option>
                <option value="flat">Flat discount</option>
                <option value="waive-fee">Waive fee</option>
                <option value="free-service">Free service</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              {form.type === "waive-fee" ? (
                <>
                  <label style={labelStyle}>Fee to waive</label>
                  <select style={{ ...inputStyle, background: "#FFF" }} value={form.waivesFeeId || ""}
                    onChange={(e) => setForm((p) => ({ ...p, waivesFeeId: e.target.value || null }))}>
                    <option value="">Select a fee</option>
                    {fees.filter((f) => f.isActive).map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </>
              ) : form.type === "free-service" ? (
                <>
                  <label style={labelStyle}>Service</label>
                  <input style={inputStyle} placeholder="Which service?" value={form.freeServiceName || ""}
                    onChange={(e) => setForm((p) => ({ ...p, freeServiceName: e.target.value }))} />
                </>
              ) : (
                <>
                  <label style={labelStyle}>Value</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {form.type === "flat" && <span style={{ color: "#9CA3AF", fontSize: 13 }}>$</span>}
                    <input type="number" step={form.type === "percentage" ? "1" : "0.01"} style={inputStyle}
                      value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: parseFloat(e.target.value) || 0 }))} />
                    {form.type === "percentage" && <span style={{ color: "#9CA3AF", fontSize: 13 }}>%</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 3: Applies to + Customer type */}
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Applies to division</label>
              <select style={{ ...inputStyle, background: "#FFF" }} value={form.appliesTo} onChange={(e) => setForm((p) => ({ ...p, appliesTo: e.target.value }))}>
                <option value="all">All divisions</option>
                <option value="automotive">Automotive</option>
                <option value="marine">Marine</option>
                <option value="fleet">Fleet</option>
                <option value="rv">RV</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Customer type</label>
              <select style={{ ...inputStyle, background: "#FFF" }} value={form.customerType} onChange={(e) => setForm((p) => ({ ...p, customerType: e.target.value }))}>
                <option value="all">All customers</option>
                <option value="new">New customers</option>
                <option value="returning">Returning</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>

          {/* Row 4: Promo code + Auto-apply */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Promo code</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                style={{ ...inputStyle, maxWidth: 240, opacity: form.autoApply ? 0.5 : 1 }}
                placeholder="Leave empty for auto-apply" value={form.code} disabled={form.autoApply}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", cursor: "pointer", whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={form.autoApply} style={{ accentColor: "#1a5276" }}
                  onChange={() => setForm((p) => ({ ...p, autoApply: !p.autoApply, code: !p.autoApply ? "" : p.code }))} />
                Auto-apply
              </label>
            </div>
          </div>

          {/* Row 5: Date range */}
          <div style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start date</label>
              <input type="date" style={inputStyle} value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>End date</label>
              <input type="date" style={{ ...inputStyle, opacity: noExpiration ? 0.5 : 1 }}
                value={form.endDate || ""} disabled={noExpiration}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value || null }))} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", cursor: "pointer", whiteSpace: "nowrap", paddingBottom: 7 }}>
              <input type="checkbox" checked={noExpiration} style={{ accentColor: "#1a5276" }}
                onChange={() => { setNoExpiration((p) => !p); if (!noExpiration) setForm((p) => ({ ...p, endDate: null })); }} />
              No expiration
            </label>
          </div>

          {/* Row 6: Display */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Display on public site</label>
            <select style={{ ...inputStyle, maxWidth: 280, background: "#FFF" }} value={form.showAs}
              onChange={(e) => setForm((p) => ({ ...p, showAs: e.target.value as Promo["showAs"] }))}>
              <option value="banner">Banner on homepage</option>
              <option value="popup">Popup</option>
              <option value="badge">Badge on services</option>
              <option value="none">None (internal only)</option>
            </select>
          </div>

          {/* Row 7: Usage count */}
          <div style={{ marginBottom: 14, fontSize: 13, color: "#64748B" }}>
            Used <strong style={{ color: "#0B2040" }}>{form.usageCount}</strong> times
            {form.usageCount > 0 && (
              <button onClick={() => setForm((p) => ({ ...p, usageCount: 0 }))}
                style={{ marginLeft: 8, fontSize: 12, color: "#185FA5", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Reset count
              </button>
            )}
          </div>

          {/* Action bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #E2E8F0", paddingTop: 12 }}>
            <button onClick={onDelete} style={{ fontSize: 13, color: "#DC2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Delete promo
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onToggleExpand}
                style={{ padding: "7px 16px", fontSize: 13, fontWeight: 500, border: "1px solid #E5E7EB", borderRadius: 6, background: "#FFF", color: "#6B7280", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                style={{
                  padding: "7px 16px", fontSize: 13, fontWeight: 500, border: "none", borderRadius: 6, cursor: saving || !form.name.trim() ? "default" : "pointer",
                  background: saving || !form.name.trim() ? "#94A3B8" : "#0B2040", color: "#FFF", opacity: saving ? 0.7 : 1,
                }}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
