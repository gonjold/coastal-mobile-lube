"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  useServices,
  type Service,
  type ServiceCategory,
} from "@/hooks/useServices";
import ToastContainer, { type ToastItem } from "../Toast";
import ServicePreviewPanel from "./ServicePreviewPanel";
import CategoryTree from "@/components/admin/services/CategoryTree";
import InlineEditForm from "@/components/admin/services/InlineEditForm";
import BulkActionsBar from "@/components/admin/services/BulkActionsBar";
import ServiceRow from "@/components/admin/services/ServiceRow";
import FeeSettings from "@/components/admin/services/FeeSettings";

/* ── Constants ── */

type Division = "auto" | "marine" | "fleet" | "rv";

const DIVISIONS: { key: Division; label: string }[] = [
  { key: "auto", label: "Automotive" },
  { key: "marine", label: "Marine" },
  { key: "fleet", label: "Fleet" },
  { key: "rv", label: "RV" },
];

const EMPTY_SERVICE = {
  name: "",
  description: "",
  price: 0,
  priceLabel: "",
  category: "",
  subcategory: "",
  division: "auto" as Division,
  sortOrder: 0,
  isActive: true,
  showOnBooking: true,
  showOnPricing: true,
  bundleItems: [] as string[],
  notes: "",
  laborHours: 0,
};

/* ── Main page ── */

export default function ServicesPage() {
  const { services, categories, loading } = useServices();

  const [activeDivision, setActiveDivision] = useState<Division>("auto");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Inline editing
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceEditValue, setPriceEditValue] = useState("");
  const [priceFlash, setPriceFlash] = useState<string | null>(null);
  const [addingNewService, setAddingNewService] = useState(false);

  // Bulk selection
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

  // Three-dot menu
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [moveMenuId, setMoveMenuId] = useState<string | null>(null);
  const [copyMenuId, setCopyMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Drag-and-drop
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Delete confirm + duplicate category modal
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [dupCatModal, setDupCatModal] = useState<{ category: ServiceCategory; targetDivision: Division } | null>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
        setMoveMenuId(null);
        setCopyMenuId(null);
      }
    }
    if (menuOpenId) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpenId]);

  // Reset selection on nav change
  useEffect(() => {
    setSelectedServices(new Set());
    setEditingRowId(null);
    setEditingPriceId(null);
    setAddingNewService(false);
  }, [activeDivision, selectedCategory]);

  /* ── Toast helper ── */

  const addToast = useCallback((message: string, type: "success" | "info" = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  /* ── Derived data ── */

  const divisionCategories = useMemo(
    () => categories.filter((c) => c.division === activeDivision).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories, activeDivision]
  );

  const divisionServices = useMemo(
    () => services.filter((s) => s.division === activeDivision).sort((a, b) => a.sortOrder - b.sortOrder),
    [services, activeDivision]
  );

  const isSearchActive = search.trim().length > 0;

  const tableServices = useMemo(() => {
    if (isSearchActive) {
      const q = search.toLowerCase();
      return divisionServices.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    if (selectedCategory === null) return divisionServices;
    return divisionServices.filter((s) => s.category === selectedCategory);
  }, [divisionServices, selectedCategory, search, isSearchActive]);

  const activeCount = tableServices.filter((s) => s.isActive).length;
  const divisionLabel = DIVISIONS.find((d) => d.key === activeDivision)?.label || "";
  const headerTitle = isSearchActive ? `Search results for "${search}"` : selectedCategory || "All services";

  /* ── Toggle helpers ── */

  async function toggleServiceField(id: string, field: "isActive" | "showOnBooking" | "showOnPricing", currentValue: boolean) {
    try {
      await updateDoc(doc(db, "services", id), { [field]: !currentValue, updatedAt: serverTimestamp() });
    } catch {
      addToast("Failed to update service", "info");
    }
  }

  /* ── CRUD: Services ── */

  async function saveServiceFromForm(data: Partial<Service> & { _isNew?: boolean }) {
    setSaving(true);
    try {
      const { _isNew, id, createdAt: _ca, updatedAt: _ua, ...fields } = data as Service & { _isNew?: boolean };
      if (_isNew) {
        const catServices = services.filter((s) => s.category === fields.category && s.division === fields.division);
        const maxOrder = catServices.reduce((max, s) => Math.max(max, s.sortOrder), 0);
        await addDoc(collection(db, "services"), {
          ...EMPTY_SERVICE, ...fields, sortOrder: maxOrder + 1,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        addToast("Service added");
      } else {
        await updateDoc(doc(db, "services", id), { ...fields, updatedAt: serverTimestamp() });
        addToast("Service updated");
      }
      setEditingRowId(null);
      setAddingNewService(false);
    } catch {
      addToast("Failed to save service", "info");
    }
    setSaving(false);
  }

  async function deleteService(id: string) {
    try {
      await deleteDoc(doc(db, "services", id));
      addToast("Service deleted");
    } catch {
      addToast("Failed to delete service", "info");
    }
    setDeleteConfirm(null);
    setEditingRowId(null);
  }

  async function duplicateService(svc: Service) {
    try {
      const catServices = services.filter((s) => s.category === svc.category && s.division === svc.division);
      const maxOrder = catServices.reduce((max, s) => Math.max(max, s.sortOrder), 0);
      const { id, createdAt, updatedAt, ...data } = svc;
      await addDoc(collection(db, "services"), {
        ...data, name: `Copy of ${svc.name}`, isActive: false, sortOrder: maxOrder + 1,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      addToast("Service duplicated");
    } catch {
      addToast("Failed to duplicate service", "info");
    }
    setMenuOpenId(null);
  }

  async function moveServiceToCategory(svcId: string, categoryName: string) {
    try {
      await updateDoc(doc(db, "services", svcId), { category: categoryName, updatedAt: serverTimestamp() });
      addToast("Service moved");
    } catch {
      addToast("Failed to move service", "info");
    }
    setMenuOpenId(null);
    setMoveMenuId(null);
  }

  async function copyServiceToDivision(svc: Service, targetDiv: Division) {
    try {
      const targetCats = categories.filter((c) => c.division === targetDiv);
      const matchingCat = targetCats.find((c) => c.name === svc.category);
      const targetCategory = matchingCat?.name || targetCats[0]?.name || "";
      const { id, createdAt, updatedAt, ...data } = svc;
      await addDoc(collection(db, "services"), {
        ...data, division: targetDiv, category: targetCategory, isActive: false,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      addToast("Service copied to " + targetDiv);
    } catch {
      addToast("Failed to copy service", "info");
    }
    setMenuOpenId(null);
    setCopyMenuId(null);
  }

  /* ── Inline price editing ── */

  async function savePriceEdit(svcId: string) {
    const newPrice = parseFloat(priceEditValue) || 0;
    try {
      await updateDoc(doc(db, "services", svcId), { price: newPrice, updatedAt: serverTimestamp() });
      setPriceFlash(svcId);
      setTimeout(() => setPriceFlash(null), 600);
    } catch {
      addToast("Failed to update price", "info");
    }
    setEditingPriceId(null);
    setPriceEditValue("");
  }

  /* ── Drag-and-drop reorder ── */

  async function handleDrop(targetIdx: number) {
    if (dragId === null) return;
    const list = [...tableServices];
    const fromIdx = list.findIndex((s) => s.id === dragId);
    if (fromIdx === -1 || fromIdx === targetIdx) { setDragId(null); setDragOverIdx(null); return; }
    const [moved] = list.splice(fromIdx, 1);
    list.splice(targetIdx > fromIdx ? targetIdx - 1 : targetIdx, 0, moved);
    const batch = writeBatch(db);
    list.forEach((s, i) => {
      batch.update(doc(db, "services", s.id), { sortOrder: i + 1, updatedAt: serverTimestamp() });
    });
    try { await batch.commit(); } catch { addToast("Failed to reorder", "info"); }
    setDragId(null);
    setDragOverIdx(null);
  }

  /* ── Bulk actions ── */

  function toggleSelect(id: string) {
    setSelectedServices((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function toggleSelectAll() {
    setSelectedServices(selectedServices.size === tableServices.length ? new Set() : new Set(tableServices.map((s) => s.id)));
  }

  async function bulkActivate(active: boolean) {
    const batch = writeBatch(db);
    selectedServices.forEach((id) => { batch.update(doc(db, "services", id), { isActive: active, updatedAt: serverTimestamp() }); });
    try { await batch.commit(); addToast(`${selectedServices.size} service${selectedServices.size !== 1 ? "s" : ""} ${active ? "activated" : "deactivated"}`); } catch { addToast("Failed to update services", "info"); }
    setSelectedServices(new Set());
  }

  async function bulkMoveTo(categoryName: string) {
    const batch = writeBatch(db);
    selectedServices.forEach((id) => { batch.update(doc(db, "services", id), { category: categoryName, updatedAt: serverTimestamp() }); });
    try { await batch.commit(); addToast(`Moved ${selectedServices.size} services`); } catch { addToast("Failed to move services", "info"); }
    setSelectedServices(new Set());
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedServices.size} service${selectedServices.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    const batch = writeBatch(db);
    selectedServices.forEach((id) => { batch.delete(doc(db, "services", id)); });
    try { await batch.commit(); addToast(`Deleted ${selectedServices.size} services`); } catch { addToast("Failed to delete services", "info"); }
    setSelectedServices(new Set());
  }

  async function bulkAdjustPrices(action: "increase" | "decrease" | "set", amount: number, unit: "flat" | "percent") {
    const batch = writeBatch(db);
    selectedServices.forEach((id) => {
      const svc = services.find((s) => s.id === id);
      if (!svc) return;
      let np = svc.price;
      if (action === "set") np = unit === "flat" ? amount : svc.price;
      else if (action === "increase") np = unit === "flat" ? svc.price + amount : svc.price * (1 + amount / 100);
      else np = unit === "flat" ? svc.price - amount : svc.price * (1 - amount / 100);
      if (np < 0) np = 0;
      batch.update(doc(db, "services", id), { price: Math.round(np * 100) / 100, updatedAt: serverTimestamp() });
    });
    try { await batch.commit(); addToast("Prices updated"); } catch { addToast("Failed to update prices", "info"); }
    setSelectedServices(new Set());
  }

  /* ── CRUD: Categories ── */

  async function addCategory(name: string) {
    try {
      const divCats = categories.filter((c) => c.division === activeDivision);
      const maxOrder = divCats.reduce((max, c) => Math.max(max, c.sortOrder), 0);
      await addDoc(collection(db, "serviceCategories"), {
        name, division: activeDivision, description: "", startingAt: 0,
        sortOrder: maxOrder + 1, isActive: true,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      addToast("Category added");
      setSelectedCategory(name);
    } catch { addToast("Failed to add category", "info"); }
  }

  async function renameCategory(id: string, newName: string) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    try {
      await updateDoc(doc(db, "serviceCategories", id), { name: newName, updatedAt: serverTimestamp() });
      const matching = services.filter((s) => s.category === cat.name && s.division === cat.division);
      if (matching.length > 0) {
        const batch = writeBatch(db);
        matching.forEach((s) => { batch.update(doc(db, "services", s.id), { category: newName, updatedAt: serverTimestamp() }); });
        await batch.commit();
      }
      if (selectedCategory === cat.name) setSelectedCategory(newName);
      addToast("Category renamed");
    } catch { addToast("Failed to rename category", "info"); }
  }

  async function handleDuplicateCategory() {
    if (!dupCatModal) return;
    const { category: srcCat, targetDivision } = dupCatModal;
    setSaving(true);
    try {
      const divCats = categories.filter((c) => c.division === targetDivision);
      const maxCatOrder = divCats.reduce((max, c) => Math.max(max, c.sortOrder), 0);
      const newCatName = `Copy of ${srcCat.name}`;
      await addDoc(collection(db, "serviceCategories"), {
        name: newCatName, division: targetDivision, description: srcCat.description || "",
        startingAt: srcCat.startingAt || 0, sortOrder: maxCatOrder + 1, isActive: true,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      const srcServices = services.filter((s) => s.category === srcCat.name && s.division === srcCat.division);
      if (srcServices.length > 0) {
        const batch = writeBatch(db);
        srcServices.forEach((svc, idx) => {
          const { id, createdAt, updatedAt, ...data } = svc;
          batch.set(doc(collection(db, "services")), {
            ...data, category: newCatName, division: targetDivision, isActive: false,
            sortOrder: idx + 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
      addToast(`Category duplicated with ${srcServices.length} service${srcServices.length === 1 ? "" : "s"}`);
      setDupCatModal(null);
    } catch { addToast("Failed to duplicate category", "info"); }
    setSaving(false);
  }

  async function handleDeleteCategory(cat: ServiceCategory) {
    const catCount = services.filter((s) => s.category === cat.name && s.division === cat.division).length;
    if (catCount > 0) { addToast(`Cannot delete: ${catCount} services still in this category. Move them first.`, "info"); return; }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await deleteDoc(doc(db, "serviceCategories", cat.id));
      if (selectedCategory === cat.name) setSelectedCategory(null);
      addToast("Category deleted");
    } catch { addToast("Failed to delete category", "info"); }
  }

  /* ── Loading ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#0F2A44] border-t-transparent rounded-full" />
      </div>
    );
  }

  const selectedSvcList = tableServices.filter((s) => selectedServices.has(s.id));

  /* ── Render ── */

  return (
    <>
      <AdminTopBar title="Services & Pricing">
        <button
          onClick={() => { setAddingNewService(true); setEditingRowId(null); }}
          style={{ padding: "7px 14px", fontSize: 13, fontWeight: 600, background: "#1a5276", color: "#FFF", border: "none", borderRadius: 8, cursor: "pointer" }}
        >
          + Add Service
        </button>
      </AdminTopBar>

      {/* Division tabs + search bar */}
      <div style={{ background: "#FFF", borderBottom: "0.5px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex" }}>
          {DIVISIONS.map((div) => {
            const active = activeDivision === div.key;
            const count = services.filter((s) => s.division === div.key).length;
            return (
              <button key={div.key} onClick={() => { setActiveDivision(div.key); setSelectedCategory(null); setSearch(""); }}
                style={{ padding: "10px 16px", fontSize: 13, fontWeight: active ? 500 : 400, color: active ? "#1a5276" : "#6B7280", background: "transparent", border: "none", borderBottom: active ? "2px solid #1a5276" : "2px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {div.label} <span style={{ fontSize: 11, color: active ? "#1a5276" : "#9CA3AF" }}>{count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search all services..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240, padding: "7px 10px 7px 32px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none" }} />
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <CategoryTree
          categories={categories} services={services} activeDivision={activeDivision}
          selectedCategory={isSearchActive ? "__search__" : selectedCategory}
          onSelectCategory={(name) => { setSearch(""); setSelectedCategory(name); }}
          onAddCategory={addCategory} onRenameCategory={renameCategory}
          onDuplicateCategory={(cat) => setDupCatModal({ category: cat, targetDivision: cat.division as Division })}
          onDeleteCategory={handleDeleteCategory}
        />

        {/* Right panel */}
        <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto" }}>
          {/* Category header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#0B2040" }}>{headerTitle}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{tableServices.length} services &middot; {activeCount} active &middot; {divisionLabel}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowPreview(true)}
                style={{ padding: "6px 12px", fontSize: 12, fontWeight: 500, border: "1px solid #E5E7EB", borderRadius: 6, background: "#FFF", color: "#6B7280", cursor: "pointer" }}>
                Preview
              </button>
              <button onClick={() => { setAddingNewService(true); setEditingRowId(null); }}
                style={{ padding: "6px 12px", fontSize: 12, fontWeight: 500, border: "1px solid #E5E7EB", borderRadius: 6, background: "#FFF", color: "#1a5276", cursor: "pointer" }}>
                + Add to category
              </button>
            </div>
          </div>

          {/* Bulk actions bar */}
          {selectedServices.size > 0 && (
            <BulkActionsBar selectedCount={selectedServices.size} selectedServices={selectedSvcList} categories={categories} activeDivision={activeDivision}
              onAdjustPrices={bulkAdjustPrices} onActivate={() => bulkActivate(true)} onDeactivate={() => bulkActivate(false)}
              onMoveTo={bulkMoveTo} onDelete={bulkDelete} onClear={() => setSelectedServices(new Set())} />
          )}

          {/* Table */}
          <div style={{ background: "#FFF", border: "0.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "28px 28px 1fr 90px 72px 72px 60px 36px", padding: "8px 12px", background: "#FAFBFC", fontSize: 11, color: "#9CA3AF", fontWeight: 500, alignItems: "center", borderBottom: "0.5px solid #E5E7EB" }}>
              <div><input type="checkbox" checked={tableServices.length > 0 && selectedServices.size === tableServices.length} onChange={toggleSelectAll} style={{ accentColor: "#1a5276" }} /></div>
              <div /><div>SERVICE</div><div>PRICE</div>
              <div style={{ textAlign: "center" }}>BOOK</div><div style={{ textAlign: "center" }}>SITE</div>
              <div style={{ textAlign: "center" }}>ACTIVE</div><div />
            </div>

            {/* New service form */}
            {addingNewService && (
              <InlineEditForm
                service={{ ...EMPTY_SERVICE, division: activeDivision, category: selectedCategory || divisionCategories[0]?.name || "", _isNew: true }}
                categories={categories} activeDivision={activeDivision}
                onSave={saveServiceFromForm} onCancel={() => setAddingNewService(false)} saving={saving} />
            )}

            {/* Empty state */}
            {tableServices.length === 0 && !addingNewService && (
              <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>
                {isSearchActive ? "No services match your search." : "No services in this category."}
              </div>
            )}

            {/* Service rows */}
            {tableServices.map((svc, idx) => (
              <div key={svc.id}
                onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                onDrop={(e) => { e.preventDefault(); handleDrop(idx); }}>
                {dragOverIdx === idx && dragId !== svc.id && <div style={{ height: 2, background: "#1a5276", margin: "0 12px" }} />}
                <ServiceRow svc={svc} isEditing={editingRowId === svc.id} isEditingPrice={editingPriceId === svc.id}
                  priceEditValue={priceEditValue} priceFlash={priceFlash === svc.id} isSelected={selectedServices.has(svc.id)}
                  isDragging={dragId === svc.id} menuOpen={menuOpenId === svc.id} moveMenuOpen={moveMenuId === svc.id}
                  copyMenuOpen={copyMenuId === svc.id} activeDivision={activeDivision} divisionCategories={divisionCategories}
                  onToggleSelect={() => toggleSelect(svc.id)}
                  onDragStart={() => setDragId(svc.id)}
                  onToggleField={(field, current) => toggleServiceField(svc.id, field, current)}
                  onStartPriceEdit={() => { setEditingPriceId(svc.id); setPriceEditValue(String(svc.price)); }}
                  onPriceChange={setPriceEditValue} onPriceSave={() => savePriceEdit(svc.id)}
                  onPriceCancel={() => { setEditingPriceId(null); setPriceEditValue(""); }}
                  onMenuToggle={() => { setMenuOpenId(menuOpenId === svc.id ? null : svc.id); setMoveMenuId(null); setCopyMenuId(null); }}
                  onEditDetails={() => { setEditingRowId(svc.id); setMenuOpenId(null); }}
                  onDuplicate={() => duplicateService(svc)}
                  onMoveMenuToggle={() => setMoveMenuId(moveMenuId === svc.id ? null : svc.id)}
                  onMoveToCategory={(catName) => moveServiceToCategory(svc.id, catName)}
                  onCopyMenuToggle={() => setCopyMenuId(copyMenuId === svc.id ? null : svc.id)}
                  onCopyToDivision={(div) => copyServiceToDivision(svc, div)}
                  onDelete={() => { setDeleteConfirm({ id: svc.id, name: svc.name }); setMenuOpenId(null); }}
                  onCollapseEdit={() => setEditingRowId(null)} />
                {editingRowId === svc.id && (
                  <InlineEditForm service={{ ...svc, _isNew: false }} categories={categories} activeDivision={activeDivision}
                    onSave={saveServiceFromForm} onCancel={() => setEditingRowId(null)}
                    onDelete={(id) => setDeleteConfirm({ id, name: svc.name })} saving={saving} />
                )}
              </div>
            ))}
          </div>

          {/* Fee settings */}
          <FeeSettings onToast={addToast} />
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setDeleteConfirm(null)} />
          <div style={{ position: "relative", background: "#FFF", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", width: "100%", maxWidth: 420, padding: 24, margin: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0B2040", marginBottom: 12 }}>Delete Service</h2>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
              Are you sure you want to delete <strong style={{ color: "#0B2040" }}>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, border: "1px solid #E5E7EB", borderRadius: 8, background: "#FFF", color: "#6B7280", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => deleteService(deleteConfirm.id)} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 8, background: "#DC2626", color: "#FFF", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Category Modal */}
      {dupCatModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setDupCatModal(null)} />
          <div style={{ position: "relative", background: "#FFF", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", width: "100%", maxWidth: 420, padding: 24, margin: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0B2040", marginBottom: 16 }}>Duplicate: {dupCatModal.category.name}</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>Target Division</label>
              <select value={dupCatModal.targetDivision} onChange={(e) => setDupCatModal((p) => p ? { ...p, targetDivision: e.target.value as Division } : p)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, background: "#FFF" }}>
                {DIVISIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
              </select>
            </div>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
              This will create &ldquo;Copy of {dupCatModal.category.name}&rdquo; and duplicate all{" "}
              {services.filter((s) => s.category === dupCatModal.category.name && s.division === dupCatModal.category.division).length}{" "}
              services into it. Duplicated services will be inactive by default.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid #E5E7EB", paddingTop: 12 }}>
              <button onClick={() => setDupCatModal(null)} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, border: "1px solid #E5E7EB", borderRadius: 8, background: "#FFF", color: "#6B7280", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDuplicateCategory} disabled={saving}
                style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 8, background: "#E97F2F", color: "#FFF", cursor: saving ? "default" : "pointer", opacity: saving ? 0.5 : 1 }}>
                {saving ? "Duplicating..." : "Duplicate"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      {showPreview && <ServicePreviewPanel division={activeDivision} onClose={() => setShowPreview(false)} />}
    </>
  );
}
