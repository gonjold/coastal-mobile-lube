"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Package, Plus } from "lucide-react";
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
  resolveBookingVisibility,
  type Service,
  type ServiceCategory,
  type BookingVisibility,
} from "@/hooks/useServices";
import ToastContainer, { type ToastItem } from "../Toast";
import ServicePreviewPanel from "./ServicePreviewPanel";
import InlineEditForm from "@/components/admin/services/InlineEditForm";
import CategoryList from "@/components/admin/booking-cms/CategoryList";
import SelectedCategoryPanel from "@/components/admin/booking-cms/SelectedCategoryPanel";
import AddCategoryModal, {
  type AddCategorySubmit,
} from "@/components/admin/booking-cms/AddCategoryModal";
import { NAVY, ORANGE, ORANGE_DARK, BORDER } from "@/components/admin/booking-cms/tokens";

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

// Sync rule: bookingVisibility is authoritative; showOnBooking is a shadow
// boolean kept true unless hidden, so pre-WO-40b consumers keep working.
function shadowShowOnBooking(v: BookingVisibility): boolean {
  return v !== "hidden";
}

export default function ServicesPage() {
  const { services, categories, loading } = useServices();

  const [activeDivision, setActiveDivision] = useState<Division>("auto");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [addModal, setAddModal] = useState<{
    kind: "regular" | "featured";
  } | null>(null);
  const [editServiceTarget, setEditServiceTarget] = useState<Service | null>(
    null
  );
  const [addingNewInCategory, setAddingNewInCategory] =
    useState<ServiceCategory | null>(null);
  const [editCategoryTarget, setEditCategoryTarget] =
    useState<ServiceCategory | null>(null);

  const addToast = useCallback(
    (message: string, type: "success" | "info" = "success") => {
      const id = Date.now().toString() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((p) => p.filter((t) => t.id !== id)),
        4000
      );
    },
    []
  );

  const divisionCategories = useMemo(
    () =>
      categories
        .filter((c) => c.division === activeDivision)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories, activeDivision]
  );

  const divisionServices = useMemo(
    () =>
      services
        .filter((s) => s.division === activeDivision)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [services, activeDivision]
  );

  // Auto-select first category when division changes or current selection disappears
  useEffect(() => {
    if (divisionCategories.length === 0) {
      setSelectedCategoryId(null);
      return;
    }
    const stillExists = divisionCategories.some(
      (c) => c.id === selectedCategoryId
    );
    if (!stillExists) {
      // Prefer first featured, then first regular
      const first =
        divisionCategories.find((c) => c.isFeatured) || divisionCategories[0];
      setSelectedCategoryId(first.id);
    }
  }, [divisionCategories, selectedCategoryId]);

  const selectedCategory = useMemo(
    () => divisionCategories.find((c) => c.id === selectedCategoryId) || null,
    [divisionCategories, selectedCategoryId]
  );

  const selectedCategoryServices = useMemo(() => {
    if (!selectedCategory) return [];
    return divisionServices.filter(
      (s) => s.category === selectedCategory.name
    );
  }, [divisionServices, selectedCategory]);

  const inlineCount = divisionCategories.filter(
    (c) => resolveBookingVisibility(c) === "inline"
  ).length;
  const searchableCount = divisionCategories.filter(
    (c) => resolveBookingVisibility(c) === "searchable"
  ).length;
  const hiddenCount = divisionCategories.filter(
    (c) => resolveBookingVisibility(c) === "hidden"
  ).length;

  /* ── Category writes ── */

  async function updateCategoryDoc(
    id: string,
    patch: Partial<ServiceCategory>
  ) {
    try {
      const payload: Record<string, unknown> = {
        ...patch,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, "serviceCategories", id), payload);
    } catch {
      addToast("Failed to update category", "info");
    }
  }

  async function createCategory(
    kind: "regular" | "featured",
    data: AddCategorySubmit
  ) {
    const divCats = divisionCategories;
    const maxOrder = divCats.reduce(
      (max, c) => Math.max(max, c.sortOrder ?? 0),
      0
    );
    const isFeatured = kind === "featured";
    try {
      const docRef = await addDoc(collection(db, "serviceCategories"), {
        name: data.name,
        division: activeDivision,
        description: "",
        startingAt: 0,
        sortOrder: maxOrder + 1,
        isActive: true,
        isFeatured,
        featuredSubtitle: isFeatured ? data.subtitle : "",
        bookingVisibility: data.visibility,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addToast(isFeatured ? "Featured block created" : "Category created");
      setSelectedCategoryId(docRef.id);
    } catch {
      addToast("Failed to create", "info");
    }
  }

  async function deleteCategoryById(cat: ServiceCategory) {
    const count = services.filter(
      (s) => s.category === cat.name && s.division === cat.division
    ).length;
    if (count > 0) {
      addToast(
        `Cannot delete: ${count} service${count === 1 ? "" : "s"} still in this ${
          cat.isFeatured ? "block" : "category"
        }. Move them first.`,
        "info"
      );
      return;
    }
    if (
      !confirm(
        `Delete ${cat.isFeatured ? "featured block" : "category"} "${cat.name}"?`
      )
    )
      return;
    try {
      await deleteDoc(doc(db, "serviceCategories", cat.id));
      addToast("Deleted");
      if (selectedCategoryId === cat.id) setSelectedCategoryId(null);
      setEditCategoryTarget(null);
    } catch {
      addToast("Failed to delete", "info");
    }
  }

  async function saveCategoryMeta(
    id: string,
    patch: {
      name: string;
      description: string;
      startingAt: number;
      featuredSubtitle: string;
    }
  ) {
    const current = categories.find((c) => c.id === id);
    if (!current) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "serviceCategories", id), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
      // Rename services whose category name matches the old name
      if (patch.name !== current.name) {
        const matching = services.filter(
          (s) =>
            s.category === current.name && s.division === current.division
        );
        if (matching.length > 0) {
          const batch = writeBatch(db);
          matching.forEach((s) => {
            batch.update(doc(db, "services", s.id), {
              category: patch.name,
              updatedAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }
      }
      addToast("Saved");
      setEditCategoryTarget(null);
    } catch {
      addToast("Failed to save", "info");
    }
    setSaving(false);
  }

  async function reorderCategories(
    kind: "regular" | "featured",
    orderedIds: string[]
  ) {
    // Optimistic: let Firestore snapshot redraw after batch; old order shows
    // momentarily. If the batch fails, the snapshot will revert naturally.
    const previousOrders = new Map<string, number>();
    divisionCategories.forEach((c) => previousOrders.set(c.id, c.sortOrder));
    try {
      const batch = writeBatch(db);
      orderedIds.forEach((id, idx) => {
        batch.update(doc(db, "serviceCategories", id), {
          sortOrder: idx + 1,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch {
      addToast("Failed to reorder", "info");
    }
    void kind; // reserved for future cross-group guarding
  }

  /* ── Service writes ── */

  async function updateServiceDoc(id: string, patch: Partial<Service>) {
    try {
      const payload: Record<string, unknown> = {
        ...patch,
        updatedAt: serverTimestamp(),
      };
      // Sync shadow showOnBooking when bookingVisibility changes
      if (patch.bookingVisibility) {
        payload.showOnBooking = shadowShowOnBooking(patch.bookingVisibility);
      }
      await updateDoc(doc(db, "services", id), payload);
    } catch {
      addToast("Failed to update service", "info");
    }
  }

  async function saveServiceFromForm(
    data: Partial<Service> & { _isNew?: boolean }
  ) {
    setSaving(true);
    try {
      const {
        _isNew,
        id,
        createdAt: _ca,
        updatedAt: _ua,
        ...fields
      } = data as Service & { _isNew?: boolean };
      void _ca;
      void _ua;
      if (_isNew) {
        const catServices = services.filter(
          (s) =>
            s.category === fields.category && s.division === fields.division
        );
        const maxOrder = catServices.reduce(
          (max, s) => Math.max(max, s.sortOrder ?? 0),
          0
        );
        // New services inherit the category's bookingVisibility as a default
        const parentCat = categories.find(
          (c) =>
            c.name === fields.category && c.division === fields.division
        );
        const defaultVis: BookingVisibility =
          parentCat ? resolveBookingVisibility(parentCat) : "inline";
        await addDoc(collection(db, "services"), {
          ...EMPTY_SERVICE,
          ...fields,
          sortOrder: maxOrder + 1,
          bookingVisibility: defaultVis,
          showOnBooking:
            fields.showOnBooking ?? shadowShowOnBooking(defaultVis),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        addToast("Service added");
      } else {
        await updateDoc(doc(db, "services", id), {
          ...fields,
          updatedAt: serverTimestamp(),
        });
        addToast("Service updated");
      }
      setEditServiceTarget(null);
      setAddingNewInCategory(null);
    } catch {
      addToast("Failed to save service", "info");
    }
    setSaving(false);
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "services", id));
      addToast("Service deleted");
    } catch {
      addToast("Failed to delete service", "info");
    }
    setEditServiceTarget(null);
  }

  async function duplicateService(svc: Service) {
    try {
      const catServices = services.filter(
        (s) => s.category === svc.category && s.division === svc.division
      );
      const maxOrder = catServices.reduce(
        (max, s) => Math.max(max, s.sortOrder ?? 0),
        0
      );
      const { id, createdAt, updatedAt, ...data } = svc;
      void id;
      void createdAt;
      void updatedAt;
      await addDoc(collection(db, "services"), {
        ...data,
        name: `Copy of ${svc.name}`,
        isActive: false,
        sortOrder: maxOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addToast("Service duplicated");
    } catch {
      addToast("Failed to duplicate service", "info");
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
      <AdminTopBar title="Services & Pricing">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="px-3 py-2 text-[12px] font-semibold rounded-lg border bg-white hover:bg-gray-50 transition"
          style={{ borderColor: BORDER, color: NAVY }}
        >
          Preview booking modal
        </button>
        <button
          type="button"
          onClick={() => setAddModal({ kind: "featured" })}
          className="px-3 py-2 text-[12px] font-semibold rounded-lg border bg-white hover:bg-gray-50 transition flex items-center gap-1"
          style={{ borderColor: "rgba(224,123,45,0.3)", color: ORANGE }}
        >
          <Package className="w-3.5 h-3.5" />
          New featured block
        </button>
        <button
          type="button"
          onClick={() => setAddModal({ kind: "regular" })}
          className="px-3 py-2 text-[12px] font-semibold rounded-lg text-white transition flex items-center gap-1"
          style={{ background: ORANGE }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = ORANGE_DARK)
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = ORANGE)}
        >
          <Plus className="w-3.5 h-3.5" />
          New category
        </button>
      </AdminTopBar>

      <div
        className="px-6 py-5"
        style={{
          background: "#F7F8FA",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          minHeight: "calc(100vh - 56px)",
        }}
      >
        {/* Division tabs */}
        <div
          className="flex items-center gap-1 mb-4 border-b"
          style={{ borderColor: BORDER }}
        >
          {DIVISIONS.map((d) => {
            const count = categories.filter((c) => c.division === d.key).length;
            const active = activeDivision === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDivision(d.key)}
                className={`px-4 py-2.5 text-[13px] font-semibold transition relative ${
                  active ? "" : "text-gray-500 hover:text-gray-700"
                }`}
                style={
                  active
                    ? { color: NAVY, boxShadow: `inset 0 -2px 0 ${ORANGE}` }
                    : {}
                }
              >
                {d.label}
                <span className="ml-2 text-[10px] text-gray-400 font-medium">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary strip */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <StatPill label={`${inlineCount} inline`} tone="emerald" />
          <StatPill label={`${searchableCount} searchable`} tone="amber" />
          <StatPill label={`${hiddenCount} hidden`} tone="gray" />
          <div className="text-[11px] text-gray-500 ml-2">
            Inline categories show above the fold in Step 2. Searchable ones appear only when customers type in the search bar.
          </div>
        </div>

        {/* Two panels */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "340px 1fr" }}>
          <CategoryList
            categories={divisionCategories}
            services={divisionServices}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            onAddClick={(kind) => setAddModal({ kind })}
            onReorder={reorderCategories}
          />

          {selectedCategory ? (
            <SelectedCategoryPanel
              category={selectedCategory}
              services={selectedCategoryServices}
              onUpdateCategory={(patch) =>
                updateCategoryDoc(selectedCategory.id, patch)
              }
              onUpdateService={updateServiceDoc}
              onEditCategoryMeta={() => setEditCategoryTarget(selectedCategory)}
              onAddService={() => setAddingNewInCategory(selectedCategory)}
              onEditService={(svc) => setEditServiceTarget(svc)}
              onDuplicateService={duplicateService}
            />
          ) : (
            <div
              className="bg-white rounded-xl border flex items-center justify-center text-[13px] text-gray-500"
              style={{ borderColor: BORDER, minHeight: 320 }}
            >
              No categories yet. Create one to get started.
            </div>
          )}
        </div>
      </div>

      {/* New category / featured block modal */}
      <AddCategoryModal
        open={addModal !== null}
        kind={addModal?.kind ?? "regular"}
        onClose={() => setAddModal(null)}
        onSubmit={async (data) => {
          if (!addModal) return;
          await createCategory(addModal.kind, data);
        }}
      />

      {/* Edit category meta modal */}
      {editCategoryTarget && (
        <EditCategoryMetaModal
          category={editCategoryTarget}
          onClose={() => setEditCategoryTarget(null)}
          onSave={(patch) => saveCategoryMeta(editCategoryTarget.id, patch)}
          onDelete={() => deleteCategoryById(editCategoryTarget)}
          saving={saving}
        />
      )}

      {/* Service edit / add modal (reuses InlineEditForm) */}
      {editServiceTarget && (
        <ServiceFormModal onClose={() => setEditServiceTarget(null)}>
          <InlineEditForm
            service={{ ...editServiceTarget, _isNew: false }}
            categories={categories}
            activeDivision={activeDivision}
            onSave={saveServiceFromForm}
            onCancel={() => setEditServiceTarget(null)}
            onDelete={(id) => deleteService(id)}
            saving={saving}
          />
        </ServiceFormModal>
      )}

      {addingNewInCategory && (
        <ServiceFormModal onClose={() => setAddingNewInCategory(null)}>
          <InlineEditForm
            service={{
              ...EMPTY_SERVICE,
              division: activeDivision,
              category: addingNewInCategory.name,
              _isNew: true,
            }}
            categories={categories}
            activeDivision={activeDivision}
            onSave={saveServiceFromForm}
            onCancel={() => setAddingNewInCategory(null)}
            saving={saving}
          />
        </ServiceFormModal>
      )}

      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />
      {showPreview && (
        <ServicePreviewPanel
          division={activeDivision}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

/* ── Inline helpers ── */

function StatPill({
  label,
  tone,
}: {
  label: string;
  tone: "emerald" | "amber" | "gray";
}) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold ${toneMap[tone]}`}
    >
      {label}
    </span>
  );
}

function ServiceFormModal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{ border: `1px solid ${BORDER}` }}
      >
        {children}
      </div>
    </div>
  );
}

function EditCategoryMetaModal({
  category,
  onClose,
  onSave,
  onDelete,
  saving,
}: {
  category: ServiceCategory;
  onClose: () => void;
  onSave: (patch: {
    name: string;
    description: string;
    startingAt: number;
    featuredSubtitle: string;
  }) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || "");
  const [startingAt, setStartingAt] = useState(category.startingAt || 0);
  const [featuredSubtitle, setFeaturedSubtitle] = useState(
    category.featuredSubtitle || ""
  );
  const isFeatured = !!category.isFeatured;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <form
        className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name: name.trim(), description, startingAt, featuredSubtitle });
        }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: BORDER, background: "#FAFAFB" }}
        >
          <h2 className="text-[15px] font-bold" style={{ color: NAVY }}>
            Edit {isFeatured ? "featured block" : "category"}
          </h2>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-600">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
              style={{ borderColor: BORDER }}
            />
          </div>
          {isFeatured ? (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-600">
                Subtitle
              </label>
              <input
                value={featuredSubtitle}
                onChange={(e) => setFeaturedSubtitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ borderColor: BORDER }}
              />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-600">
                Starting at ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={startingAt}
                onChange={(e) => setStartingAt(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ borderColor: BORDER }}
              />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-600">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none resize-none"
              style={{ borderColor: BORDER }}
            />
          </div>
        </div>
        <div
          className="px-5 py-3 border-t flex items-center justify-between gap-2"
          style={{ borderColor: BORDER, background: "#FAFAFB" }}
        >
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1.5 text-[12px] font-semibold rounded-lg border bg-white hover:bg-red-50 transition"
            style={{ borderColor: "#FECACA", color: "#DC2626" }}
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-lg border bg-white hover:bg-gray-50 transition"
              style={{ borderColor: BORDER, color: "#4b5563" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-lg text-white transition disabled:opacity-50"
              style={{ background: ORANGE }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

