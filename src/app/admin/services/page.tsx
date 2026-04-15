"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  useServices,
  type Service,
  type ServiceCategory,
} from "@/hooks/useServices";
import ToastContainer, { type ToastItem } from "../Toast";
import ServicePreviewPanel from "./ServicePreviewPanel";

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

/* ── Small components ── */

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2"
      title={label}
    >
      <div
        className={`relative w-9 h-5 rounded-full transition-colors ${
          on ? "bg-[#0F2A44]" : "bg-gray-200"
        }`}
      >
        <div
          className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow transition-all ${
            on ? "left-[18px]" : "left-[2px]"
          }`}
        />
      </div>
      {label && <span className="text-[12px] text-gray-500">{label}</span>}
    </button>
  );
}

function ArrowUp({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-default transition-colors"
      title="Move up"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}

function ArrowDown({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-default transition-colors"
      title="Move down"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[18px] font-bold text-[#0B2040]">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ── Main page ── */

export default function ServicesPage() {
  const { services, categories, loading } = useServices();

  const [activeDivision, setActiveDivision] = useState<Division>("auto");
  const [search, setSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Inline editing state: key = "serviceId:field"
  const [inlineEdits, setInlineEdits] = useState<Record<string, string>>({});

  // Modal state
  const [serviceModal, setServiceModal] = useState<
    (Partial<Service> & { _isNew?: boolean }) | null
  >(null);
  const [categoryModal, setCategoryModal] = useState<
    (Partial<ServiceCategory> & { _isNew?: boolean }) | null
  >(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [dupCatModal, setDupCatModal] = useState<{
    category: ServiceCategory;
    targetDivision: "auto" | "marine" | "fleet" | "rv";
  } | null>(null);

  /* ── Fee settings state ── */
  const [feeSettings, setFeeSettings] = useState({
    enabled: true,
    amount: 39.95,
    label: 'Mobile Service Fee',
    taxable: false,
    waiveFirstService: true,
    promoOverride: false,
  });
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeSaving, setFeeSaving] = useState(false);

  /* ── QuickBooks connection state ── */
  const [qbConnected, setQbConnected] = useState(false);
  const [qbRealmId, setQbRealmId] = useState("");
  const [qbConnectedDate, setQbConnectedDate] = useState("");
  const [qbLoading, setQbLoading] = useState(true);

  useEffect(() => {
    const loadQB = async () => {
      try {
        const qbDoc = await getDoc(doc(db, "settings", "quickbooks"));
        if (qbDoc.exists()) {
          const data = qbDoc.data();
          if (data.accessToken) {
            setQbConnected(true);
            setQbRealmId(data.realmId || "");
            setQbConnectedDate(
              data.connectedAt
                ? new Date(data.connectedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : ""
            );
          }
        }
      } catch (err) {
        console.error("Failed to load QB status:", err);
      }
      setQbLoading(false);
    };
    loadQB();
  }, []);

  const handleDisconnectQB = async () => {
    try {
      await deleteDoc(doc(db, "settings", "quickbooks"));
      setQbConnected(false);
      setQbRealmId("");
      setQbConnectedDate("");
      addToast("QuickBooks disconnected");
    } catch (err) {
      console.error("Failed to disconnect QB:", err);
    }
  };

  useEffect(() => {
    const loadFees = async () => {
      try {
        const feeDoc = await getDoc(doc(db, 'settings', 'fees'));
        if (feeDoc.exists()) {
          const data = feeDoc.data();
          setFeeSettings({
            enabled: data.convenienceFee?.enabled ?? true,
            amount: data.convenienceFee?.amount ?? 39.95,
            label: data.convenienceFee?.label ?? 'Mobile Service Fee',
            taxable: data.convenienceFee?.taxable ?? false,
            waiveFirstService: data.convenienceFee?.waiveFirstService ?? true,
            promoOverride: data.convenienceFee?.promoOverride ?? false,
          });
        }
      } catch (err) {
        console.error('Failed to load fee settings:', err);
      }
      setFeeLoading(false);
    };
    loadFees();
  }, []);

  const handleSaveFees = async () => {
    setFeeSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'fees'), {
        convenienceFee: feeSettings,
      }, { merge: true });
      addToast('Fee settings saved');
    } catch (err) {
      console.error('Failed to save fee settings:', err);
    }
    setFeeSaving(false);
  };

  /* ── Toast helper ── */

  const addToast = useCallback(
    (message: string, type: "success" | "info" = "success") => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((p) => p.filter((t) => t.id !== id)),
        4000
      );
    },
    []
  );

  /* ── Derived data ── */

  const divisionCategories = useMemo(
    () =>
      categories
        .filter((c) => c.division === activeDivision)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories, activeDivision]
  );

  const divisionServices = useMemo(() => {
    let filtered = services.filter((s) => s.division === activeDivision);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [services, activeDivision, search]);

  function getCategoryServices(categoryName: string) {
    return divisionServices.filter((s) => s.category === categoryName);
  }

  // When searching, only show categories that have matching services
  const visibleCategories = useMemo(() => {
    if (!search.trim()) return divisionCategories;
    const catsWithResults = new Set(divisionServices.map((s) => s.category));
    return divisionCategories.filter((c) => catsWithResults.has(c.name));
  }, [divisionCategories, divisionServices, search]);

  /* ── Inline editing helpers ── */

  function getInlineValue(
    serviceId: string,
    field: string,
    original: string | number
  ) {
    const key = `${serviceId}:${field}`;
    return key in inlineEdits ? inlineEdits[key] : String(original);
  }

  function handleInlineFocus(
    serviceId: string,
    field: string,
    original: string | number
  ) {
    setInlineEdits((prev) => ({
      ...prev,
      [`${serviceId}:${field}`]: String(original),
    }));
  }

  function handleInlineChange(
    serviceId: string,
    field: string,
    value: string
  ) {
    setInlineEdits((prev) => ({
      ...prev,
      [`${serviceId}:${field}`]: value,
    }));
  }

  async function handleInlineBlur(
    serviceId: string,
    field: string,
    original: string | number
  ) {
    const key = `${serviceId}:${field}`;
    const value = inlineEdits[key];
    if (value === undefined) return;

    setInlineEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (String(value).trim() === String(original)) return;

    const firestoreValue =
      field === "price" ? parseFloat(value) || 0 : value.trim();
    try {
      await updateDoc(doc(db, "services", serviceId), {
        [field]: firestoreValue,
        updatedAt: serverTimestamp(),
      });
    } catch {
      addToast("Failed to update", "info");
    }
  }

  /* ── Toggle helpers ── */

  async function toggleServiceField(
    id: string,
    field: "isActive" | "showOnBooking" | "showOnPricing",
    currentValue: boolean
  ) {
    try {
      await updateDoc(doc(db, "services", id), {
        [field]: !currentValue,
        updatedAt: serverTimestamp(),
      });
    } catch {
      addToast("Failed to update service", "info");
    }
  }

  async function toggleCategoryActive(id: string, currentValue: boolean) {
    try {
      await updateDoc(doc(db, "serviceCategories", id), {
        isActive: !currentValue,
        updatedAt: serverTimestamp(),
      });
    } catch {
      addToast("Failed to update category", "info");
    }
  }

  /* ── Reorder helpers ── */

  async function moveService(
    categoryName: string,
    serviceId: string,
    direction: "up" | "down"
  ) {
    const catServices = getCategoryServices(categoryName);
    const idx = catServices.findIndex((s) => s.id === serviceId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= catServices.length) return;

    const batch = writeBatch(db);
    batch.update(doc(db, "services", catServices[idx].id), {
      sortOrder: catServices[swapIdx].sortOrder,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, "services", catServices[swapIdx].id), {
      sortOrder: catServices[idx].sortOrder,
      updatedAt: serverTimestamp(),
    });
    try {
      await batch.commit();
    } catch {
      addToast("Failed to reorder", "info");
    }
  }

  async function moveCategory(catId: string, direction: "up" | "down") {
    const idx = divisionCategories.findIndex((c) => c.id === catId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= divisionCategories.length) return;

    const batch = writeBatch(db);
    batch.update(
      doc(db, "serviceCategories", divisionCategories[idx].id),
      {
        sortOrder: divisionCategories[swapIdx].sortOrder,
        updatedAt: serverTimestamp(),
      }
    );
    batch.update(
      doc(db, "serviceCategories", divisionCategories[swapIdx].id),
      {
        sortOrder: divisionCategories[idx].sortOrder,
        updatedAt: serverTimestamp(),
      }
    );
    try {
      await batch.commit();
    } catch {
      addToast("Failed to reorder", "info");
    }
  }

  /* ── CRUD: Services ── */

  function openNewService(prefilledCategory?: string) {
    setServiceModal({
      ...EMPTY_SERVICE,
      division: activeDivision,
      category: prefilledCategory || divisionCategories[0]?.name || "",
      _isNew: true,
    });
  }

  function openEditService(svc: Service) {
    setServiceModal({ ...svc, _isNew: false });
  }

  async function saveService() {
    if (!serviceModal || !serviceModal.name?.trim()) return;
    setSaving(true);
    try {
      const {
        _isNew,
        id,
        createdAt: _ca,
        updatedAt: _ua,
        ...data
      } = serviceModal as Service & { _isNew?: boolean };
      if (_isNew) {
        const catServices = services.filter(
          (s) =>
            s.category === data.category && s.division === data.division
        );
        const maxOrder = catServices.reduce(
          (max, s) => Math.max(max, s.sortOrder),
          0
        );
        await addDoc(collection(db, "services"), {
          ...EMPTY_SERVICE,
          ...data,
          sortOrder: maxOrder + 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        addToast("Service added");
      } else {
        await updateDoc(doc(db, "services", id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        addToast("Service updated");
      }
      setServiceModal(null);
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
  }

  async function duplicateService(svc: Service) {
    try {
      const catServices = services.filter(
        (s) => s.category === svc.category && s.division === svc.division
      );
      const maxOrder = catServices.reduce(
        (max, s) => Math.max(max, s.sortOrder),
        0
      );
      const { id, createdAt, updatedAt, ...data } = svc;
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

  async function duplicateCategory() {
    if (!dupCatModal) return;
    const { category: srcCat, targetDivision } = dupCatModal;
    setSaving(true);
    try {
      const divCats = categories.filter((c) => c.division === targetDivision);
      const maxCatOrder = divCats.reduce(
        (max, c) => Math.max(max, c.sortOrder),
        0
      );
      const newCatName = `Copy of ${srcCat.name}`;

      await addDoc(collection(db, "serviceCategories"), {
        name: newCatName,
        division: targetDivision,
        description: srcCat.description || "",
        startingAt: srcCat.startingAt || 0,
        sortOrder: maxCatOrder + 1,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const srcServices = services.filter(
        (s) => s.category === srcCat.name && s.division === srcCat.division
      );

      if (srcServices.length > 0) {
        const batch = writeBatch(db);
        srcServices.forEach((svc, idx) => {
          const { id, createdAt, updatedAt, ...data } = svc;
          const ref = doc(collection(db, "services"));
          batch.set(ref, {
            ...data,
            category: newCatName,
            division: targetDivision,
            isActive: false,
            sortOrder: idx + 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      addToast(
        `Category duplicated with ${srcServices.length} service${srcServices.length === 1 ? "" : "s"}`
      );
      setDupCatModal(null);
    } catch {
      addToast("Failed to duplicate category", "info");
    }
    setSaving(false);
  }

  /* ── CRUD: Categories ── */

  function openNewCategory() {
    setCategoryModal({
      name: "",
      division: activeDivision,
      description: "",
      startingAt: 0,
      isActive: true,
      _isNew: true,
    });
  }

  function openEditCategory(cat: ServiceCategory) {
    setCategoryModal({ ...cat, _isNew: false });
  }

  async function saveCategory() {
    if (!categoryModal || !categoryModal.name?.trim()) return;
    setSaving(true);
    try {
      const {
        _isNew,
        id,
        createdAt: _ca,
        updatedAt: _ua,
        ...data
      } = categoryModal as ServiceCategory & { _isNew?: boolean };
      if (_isNew) {
        const divCats = categories.filter(
          (c) => c.division === data.division
        );
        const maxOrder = divCats.reduce(
          (max, c) => Math.max(max, c.sortOrder),
          0
        );
        await addDoc(collection(db, "serviceCategories"), {
          name: data.name || "",
          division: data.division || activeDivision,
          description: data.description || "",
          startingAt: data.startingAt || 0,
          sortOrder: maxOrder + 1,
          isActive: data.isActive ?? true,
          tabLabel: (data as Record<string, unknown>).tabLabel || "",
          showOnHomepage: (data as Record<string, unknown>).showOnHomepage ?? true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        addToast("Category added");
      } else {
        const originalCat = categories.find((c) => c.id === id);
        const nameChanged = originalCat && originalCat.name !== data.name;

        await updateDoc(doc(db, "serviceCategories", id), {
          name: data.name,
          division: data.division,
          description: data.description,
          startingAt: data.startingAt,
          isActive: data.isActive,
          tabLabel: (data as Record<string, unknown>).tabLabel || "",
          showOnHomepage: (data as Record<string, unknown>).showOnHomepage ?? true,
          updatedAt: serverTimestamp(),
        });

        if (nameChanged) {
          const matchingServices = services.filter(
            (s) =>
              s.category === originalCat.name &&
              s.division === originalCat.division
          );
          if (matchingServices.length > 0) {
            const batch = writeBatch(db);
            matchingServices.forEach((s) => {
              batch.update(doc(db, "services", s.id), {
                category: data.name,
                updatedAt: serverTimestamp(),
              });
            });
            await batch.commit();
            addToast(
              `Updated ${matchingServices.length} service${matchingServices.length === 1 ? "" : "s"} to new category name`
            );
          } else {
            addToast("Category updated");
          }
        } else {
          addToast("Category updated");
        }
      }
      setCategoryModal(null);
    } catch {
      addToast("Failed to save category", "info");
    }
    setSaving(false);
  }

  /* ── Collapse toggle ── */

  function toggleCollapse(catId: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  /* ── Loading state ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#0F2A44] border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ── Render ── */

  return (
    <>
    <AdminTopBar title="Services & Pricing" />
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F2A44] w-[200px]"
            />
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 text-[13px] font-semibold border border-gray-300 rounded-lg text-[#555] hover:text-[#0B2040] hover:border-gray-400 transition-colors"
          >
            Preview
          </button>
          <button
            onClick={openNewCategory}
            className="px-4 py-2 text-[13px] font-semibold border border-gray-200 rounded-lg text-[#0B2040] hover:bg-gray-50 transition-colors"
          >
            + Add Category
          </button>
          <button
            onClick={() => openNewService()}
            className="px-4 py-2 text-[13px] font-semibold bg-[#0F2A44] text-white rounded-lg hover:bg-[#1a3d5c] transition-colors"
          >
            + Add Service
          </button>
        </div>
      </div>

      {/* Division tabs */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-6 w-fit">
        {DIVISIONS.map((div) => {
          const isActive = activeDivision === div.key;
          const count = categories.filter(
            (c) => c.division === div.key
          ).length;
          return (
            <button
              key={div.key}
              onClick={() => setActiveDivision(div.key)}
              className={`px-5 py-2.5 text-[13px] font-semibold transition-all ${
                isActive
                  ? "bg-[#0F2A44] text-white"
                  : "bg-white text-gray-500 border-r border-gray-200 last:border-r-0 hover:text-[#0B2040] hover:bg-gray-50"
              }`}
            >
              {div.label}
              <span
                className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20" : "bg-gray-100"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category sections */}
      <div className="flex flex-col gap-4">
        {visibleCategories.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-[14px]">
              {search.trim()
                ? "No services match your search."
                : "No categories yet. Add one to get started."}
            </p>
          </div>
        )}

        {visibleCategories.map((cat, catIdx) => {
          const isCollapsed = collapsedCategories.has(cat.id);
          const catServices = getCategoryServices(cat.name);

          return (
            <div
              key={cat.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Category header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/50">
                {/* Reorder arrows */}
                <div className="flex flex-col">
                  <ArrowUp
                    onClick={() => moveCategory(cat.id, "up")}
                    disabled={catIdx === 0}
                  />
                  <ArrowDown
                    onClick={() => moveCategory(cat.id, "down")}
                    disabled={
                      catIdx === divisionCategories.length - 1
                    }
                  />
                </div>

                {/* Expand/collapse + name */}
                <button
                  onClick={() => toggleCollapse(cat.id)}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#888"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform shrink-0 ${
                      isCollapsed ? "" : "rotate-90"
                    }`}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <span className="text-[15px] font-bold text-[#0B2040] truncate">
                    {cat.name}
                  </span>
                  <span className="text-[12px] text-gray-400 shrink-0">
                    ({catServices.length})
                  </span>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() =>
                      setDupCatModal({
                        category: cat,
                        targetDivision: cat.division as "auto" | "marine" | "fleet" | "rv",
                      })
                    }
                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                    title="Duplicate category"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#888"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openEditCategory(cat)}
                    className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                    title="Edit category"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#888"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <Toggle
                    on={cat.isActive}
                    onToggle={() =>
                      toggleCategoryActive(cat.id, cat.isActive)
                    }
                  />
                </div>
              </div>

              {/* Service rows */}
              {!isCollapsed && (
                <div className="border-t border-gray-100">
                  {/* Table header */}
                  <div className="hidden lg:grid lg:grid-cols-[32px_1fr_90px_64px_64px_64px_104px] gap-2 px-4 py-2 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-400 font-semibold items-center">
                    <div />
                    <div>Service</div>
                    <div>Price</div>
                    <div className="text-center">Active</div>
                    <div className="text-center">Book</div>
                    <div className="text-center">Price</div>
                    <div />
                  </div>

                  {catServices.length === 0 && (
                    <div className="px-4 py-6 text-center text-[13px] text-gray-400">
                      No services in this category.
                    </div>
                  )}

                  {catServices.map((svc, svcIdx) => (
                    <div
                      key={svc.id}
                      className={`grid grid-cols-1 lg:grid-cols-[32px_1fr_90px_64px_64px_64px_104px] gap-2 px-4 py-2.5 items-center ${
                        svcIdx > 0
                          ? "border-t border-gray-50"
                          : ""
                      } ${!svc.isActive ? "opacity-50" : ""}`}
                    >
                      {/* Reorder */}
                      <div className="hidden lg:flex flex-col">
                        <ArrowUp
                          onClick={() =>
                            moveService(
                              cat.name,
                              svc.id,
                              "up"
                            )
                          }
                          disabled={svcIdx === 0}
                        />
                        <ArrowDown
                          onClick={() =>
                            moveService(
                              cat.name,
                              svc.id,
                              "down"
                            )
                          }
                          disabled={
                            svcIdx === catServices.length - 1
                          }
                        />
                      </div>

                      {/* Name (inline editable) */}
                      <input
                        type="text"
                        value={getInlineValue(
                          svc.id,
                          "name",
                          svc.name
                        )}
                        onFocus={() =>
                          handleInlineFocus(
                            svc.id,
                            "name",
                            svc.name
                          )
                        }
                        onChange={(e) =>
                          handleInlineChange(
                            svc.id,
                            "name",
                            e.target.value
                          )
                        }
                        onBlur={() =>
                          handleInlineBlur(
                            svc.id,
                            "name",
                            svc.name
                          )
                        }
                        className="text-[14px] text-[#0B2040] font-medium bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#0F2A44] focus:outline-none transition-colors py-0.5 min-w-0"
                      />

                      {/* Price (inline editable) */}
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] text-gray-400">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={getInlineValue(
                            svc.id,
                            "price",
                            svc.price
                          )}
                          onFocus={() =>
                            handleInlineFocus(
                              svc.id,
                              "price",
                              svc.price
                            )
                          }
                          onChange={(e) =>
                            handleInlineChange(
                              svc.id,
                              "price",
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            handleInlineBlur(
                              svc.id,
                              "price",
                              svc.price
                            )
                          }
                          className="text-[14px] text-[#0B2040] font-semibold bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#0F2A44] focus:outline-none transition-colors py-0.5 w-16"
                        />
                      </div>

                      {/* Active toggle */}
                      <div className="flex justify-center">
                        <Toggle
                          on={svc.isActive}
                          onToggle={() =>
                            toggleServiceField(
                              svc.id,
                              "isActive",
                              svc.isActive
                            )
                          }
                        />
                      </div>

                      {/* Booking toggle */}
                      <div className="flex justify-center">
                        <Toggle
                          on={svc.showOnBooking}
                          onToggle={() =>
                            toggleServiceField(
                              svc.id,
                              "showOnBooking",
                              svc.showOnBooking
                            )
                          }
                        />
                      </div>

                      {/* Pricing toggle */}
                      <div className="flex justify-center">
                        <Toggle
                          on={svc.showOnPricing}
                          onToggle={() =>
                            toggleServiceField(
                              svc.id,
                              "showOnPricing",
                              svc.showOnPricing
                            )
                          }
                        />
                      </div>

                      {/* Duplicate + Edit + Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => duplicateService(svc)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="Duplicate service"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#888"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEditService(svc)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="Edit service"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#888"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: svc.id,
                              name: svc.name,
                            })
                          }
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete service"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Service to category */}
                  <div className="px-4 py-3 border-t border-gray-100">
                    <button
                      onClick={() => openNewService(cat.name)}
                      className="text-[13px] font-semibold text-[#0F2A44] hover:text-[#1a3d5c] transition-colors"
                    >
                      + Add Service
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Category button */}
        <button
          onClick={openNewCategory}
          className="w-full py-3 text-[13px] font-semibold text-gray-400 hover:text-[#0F2A44] border-2 border-dashed border-gray-200 hover:border-[#0F2A44] rounded-xl transition-colors"
        >
          + Add Category
        </button>
      </div>

      {/* ═══ Edit Service Modal ═══ */}
      {serviceModal && (
        <Modal
          title={serviceModal._isNew ? "Add Service" : "Edit Service"}
          onClose={() => setServiceModal(null)}
        >
          <div className="flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Name
              </label>
              <input
                type="text"
                value={serviceModal.name || ""}
                onChange={(e) =>
                  setServiceModal((p) =>
                    p ? { ...p, name: e.target.value } : p
                  )
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Description
              </label>
              <textarea
                value={serviceModal.description || ""}
                onChange={(e) =>
                  setServiceModal((p) =>
                    p
                      ? { ...p, description: e.target.value }
                      : p
                  )
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44] resize-none"
              />
            </div>

            {/* Price + Price Label */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Price
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceModal.price ?? 0}
                    onChange={(e) =>
                      setServiceModal((p) =>
                        p
                          ? {
                              ...p,
                              price:
                                parseFloat(e.target.value) ||
                                0,
                            }
                          : p
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Price Label
                </label>
                <input
                  type="text"
                  placeholder='e.g. "Starting at"'
                  value={serviceModal.priceLabel || ""}
                  onChange={(e) =>
                    setServiceModal((p) =>
                      p
                        ? { ...p, priceLabel: e.target.value }
                        : p
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44]"
                />
              </div>
            </div>

            {/* Category + Division */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Category
                </label>
                <select
                  value={serviceModal.category || ""}
                  onChange={(e) =>
                    setServiceModal((p) =>
                      p
                        ? { ...p, category: e.target.value }
                        : p
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44] bg-white"
                >
                  <option value="">Select category</option>
                  {categories
                    .filter(
                      (c) =>
                        c.division ===
                        (serviceModal.division || activeDivision)
                    )
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Division
                </label>
                <select
                  value={serviceModal.division || "auto"}
                  onChange={(e) =>
                    setServiceModal((p) =>
                      p
                        ? {
                            ...p,
                            division: e.target.value as Division,
                          }
                        : p
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44] bg-white"
                >
                  {DIVISIONS.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Notes
              </label>
              <textarea
                value={serviceModal.notes || ""}
                onChange={(e) =>
                  setServiceModal((p) =>
                    p ? { ...p, notes: e.target.value } : p
                  )
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44] resize-none"
              />
            </div>

            {/* Bundle Items */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Bundle Items{" "}
                <span className="text-gray-300 font-normal normal-case">
                  (comma-separated)
                </span>
              </label>
              <input
                type="text"
                value={
                  (serviceModal.bundleItems || []).join(", ")
                }
                onChange={(e) =>
                  setServiceModal((p) =>
                    p
                      ? {
                          ...p,
                          bundleItems: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }
                      : p
                  )
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44]"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6 pt-2">
              <Toggle
                on={serviceModal.showOnBooking ?? true}
                onToggle={() =>
                  setServiceModal((p) =>
                    p
                      ? {
                          ...p,
                          showOnBooking: !p.showOnBooking,
                        }
                      : p
                  )
                }
                label="Show on Booking"
              />
              <Toggle
                on={serviceModal.showOnPricing ?? true}
                onToggle={() =>
                  setServiceModal((p) =>
                    p
                      ? {
                          ...p,
                          showOnPricing: !p.showOnPricing,
                        }
                      : p
                  )
                }
                label="Show on Pricing"
              />
              <Toggle
                on={serviceModal.isActive ?? true}
                onToggle={() =>
                  setServiceModal((p) =>
                    p ? { ...p, isActive: !p.isActive } : p
                  )
                }
                label="Active"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setServiceModal(null)}
                className="px-4 py-2 text-[13px] font-semibold border border-gray-200 rounded-lg text-gray-500 hover:text-[#0B2040] hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveService}
                disabled={saving || !serviceModal.name?.trim()}
                className="px-4 py-2 text-[13px] font-semibold bg-[#0F2A44] text-white rounded-lg hover:bg-[#1a3d5c] transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══ Edit Category Modal ═══ */}
      {categoryModal && (
        <Modal
          title={
            categoryModal._isNew ? "Add Category" : "Edit Category"
          }
          onClose={() => setCategoryModal(null)}
        >
          <div className="flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={categoryModal.name || ""}
                onChange={(e) =>
                  setCategoryModal((p) =>
                    p ? { ...p, name: e.target.value } : p
                  )
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44]"
              />
            </div>

            {/* Division */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Division
              </label>
              <select
                value={categoryModal.division || "auto"}
                onChange={(e) =>
                  setCategoryModal((p) =>
                    p
                      ? {
                          ...p,
                          division: e.target.value as Division,
                        }
                      : p
                  )
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44] bg-white"
              >
                {DIVISIONS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tab Label */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Tab Label <span className="text-gray-300 font-normal normal-case">(optional — overrides category name on public pages)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Oil & Lube"
                value={(categoryModal as Record<string, unknown>).tabLabel as string || ""}
                onChange={(e) =>
                  setCategoryModal((p) =>
                    p ? { ...p, tabLabel: e.target.value } : p
                  )
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44]"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6 pt-2">
              <Toggle
                on={categoryModal.isActive ?? true}
                onToggle={() =>
                  setCategoryModal((p) =>
                    p ? { ...p, isActive: !p.isActive } : p
                  )
                }
                label="Active"
              />
              <Toggle
                on={(categoryModal as Record<string, unknown>).showOnHomepage as boolean ?? true}
                onToggle={() =>
                  setCategoryModal((p) =>
                    p ? { ...p, showOnHomepage: !(p as Record<string, unknown>).showOnHomepage } : p
                  )
                }
                label="Show on Homepage"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setCategoryModal(null)}
                className="px-4 py-2 text-[13px] font-semibold border border-gray-200 rounded-lg text-gray-500 hover:text-[#0B2040] hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCategory}
                disabled={saving || !categoryModal.name?.trim()}
                className="px-4 py-2 text-[13px] font-semibold bg-[#0F2A44] text-white rounded-lg hover:bg-[#1a3d5c] transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══ Delete Confirm Dialog ═══ */}
      {deleteConfirm && (
        <Modal
          title="Delete Service"
          onClose={() => setDeleteConfirm(null)}
        >
          <p className="text-[14px] text-gray-600 mb-6">
            Are you sure you want to delete{" "}
            <strong className="text-[#0B2040]">
              {deleteConfirm.name}
            </strong>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-[13px] font-semibold border border-gray-200 rounded-lg text-gray-500 hover:text-[#0B2040] hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteService(deleteConfirm.id)}
              className="px-4 py-2 text-[13px] font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* ═══ Duplicate Category Modal ═══ */}
      {dupCatModal && (
        <Modal
          title={`Duplicate category: ${dupCatModal.category.name}`}
          onClose={() => setDupCatModal(null)}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Target Division
              </label>
              <select
                value={dupCatModal.targetDivision}
                onChange={(e) =>
                  setDupCatModal((p) =>
                    p
                      ? {
                          ...p,
                          targetDivision: e.target.value as "auto" | "marine" | "fleet" | "rv",
                        }
                      : p
                  )
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0F2A44] bg-white"
              >
                <option value="auto">Automotive</option>
                <option value="marine">Marine</option>
                <option value="fleet">Fleet</option>
                <option value="rv">RV</option>
              </select>
            </div>
            <p className="text-[13px] text-gray-500">
              This will create &ldquo;Copy of {dupCatModal.category.name}&rdquo;{" "}
              and duplicate all{" "}
              {
                services.filter(
                  (s) =>
                    s.category === dupCatModal.category.name &&
                    s.division === dupCatModal.category.division
                ).length
              }{" "}
              services into it. Duplicated services will be inactive by default.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setDupCatModal(null)}
                className="px-4 py-2 text-[13px] font-semibold border border-gray-200 rounded-lg text-gray-500 hover:text-[#0B2040] hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={duplicateCategory}
                disabled={saving}
                className="px-4 py-2 text-[13px] font-semibold bg-[#E97F2F] text-white rounded-lg hover:bg-[#d06f25] transition-colors disabled:opacity-50"
              >
                {saving ? "Duplicating..." : "Duplicate"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Service Fees Section */}
      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#0B2040] mb-4">Service Fees</h2>

        {feeLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0B2040]">Mobile Service Fee</p>
                <p className="text-xs text-gray-500">Charge a fee for mobile service visits</p>
              </div>
              <button
                onClick={() => setFeeSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  feeSettings.enabled ? 'bg-[#1A5FAC]' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  feeSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {feeSettings.enabled && (
              <>
                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fee Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={feeSettings.amount}
                    onChange={(e) => setFeeSettings(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                {/* Label */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Label</label>
                  <input
                    type="text"
                    value={feeSettings.label}
                    onChange={(e) => setFeeSettings(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Mobile Service Fee, Convenience Fee"
                  />
                </div>

                {/* Waive First Service */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0B2040]">Waive for first-time customers</p>
                    <p className="text-xs text-gray-500">New customers get the fee waived on their first booking</p>
                  </div>
                  <button
                    onClick={() => setFeeSettings(prev => ({ ...prev, waiveFirstService: !prev.waiveFirstService }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      feeSettings.waiveFirstService ? 'bg-[#1A5FAC]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      feeSettings.waiveFirstService ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Taxable */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0B2040]">Include in tax calculation</p>
                    <p className="text-xs text-gray-500">Whether the fee is subject to sales tax</p>
                  </div>
                  <button
                    onClick={() => setFeeSettings(prev => ({ ...prev, taxable: !prev.taxable }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      feeSettings.taxable ? 'bg-[#1A5FAC]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      feeSettings.taxable ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </>
            )}

            {/* Save Button */}
            <div className="pt-2">
              <button
                onClick={handleSaveFees}
                disabled={feeSaving}
                className="px-6 py-2.5 bg-[#E07B2D] text-white rounded-lg text-sm font-semibold hover:bg-[#CC6A1F] disabled:opacity-50"
              >
                {feeSaving ? 'Saving...' : 'Save Fee Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QuickBooks Connection */}
      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#0B2040] mb-4">QuickBooks Online</h2>

        {qbLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : qbConnected ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-700">Connected</span>
              <span className="text-xs text-gray-500 ml-2">Company ID: {qbRealmId}</span>
            </div>
            {qbConnectedDate && (
              <p className="text-xs text-gray-500 mb-3">Connected on {qbConnectedDate}</p>
            )}
            <p className="text-sm text-gray-600 mb-4">
              Invoices created in the admin portal will automatically sync to QuickBooks.
              Customer payments through QuickBooks update invoice status automatically.
            </p>
            <button
              onClick={handleDisconnectQB}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50"
            >
              Disconnect QuickBooks
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Connect QuickBooks to automatically sync invoices and receive payment notifications.
            </p>
            <a
              href="https://us-east1-coastal-mobile-lube.cloudfunctions.net/qbOAuthStart"
              className="inline-block px-6 py-2.5 bg-[#2CA01C] text-white rounded-lg text-sm font-semibold hover:bg-[#248a16]"
            >
              Connect to QuickBooks
            </a>
          </div>
        )}
      </div>

      {/* Clover Commerce Sync */}
      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-[#0B2040] mb-4">Clover Commerce Sync</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sync Clover Go card swipes to QuickBooks automatically. Follow these steps from your Clover web dashboard:
        </p>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Log into <span className="font-semibold">clover.com</span></li>
          <li>Go to <span className="font-semibold">More Tools</span></li>
          <li>Search for <span className="font-semibold">&quot;QuickBooks by Commerce Sync&quot;</span></li>
          <li>Install the app (Essentials plan, ~$19/mo)</li>
          <li>Connect to your QuickBooks account when prompted</li>
        </ol>
        <p className="text-xs text-gray-500 mt-3">
          Commerce Sync automatically transfers daily Clover sales to QuickBooks each night.
        </p>
      </div>

      {/* Toasts */}
      <ToastContainer
        toasts={toasts}
        onRemove={(id) =>
          setToasts((p) => p.filter((t) => t.id !== id))
        }
      />

      {/* Preview Panel */}
      {showPreview && (
        <ServicePreviewPanel division={activeDivision} onClose={() => setShowPreview(false)} />
      )}
    </div>
    </>
  );
}
