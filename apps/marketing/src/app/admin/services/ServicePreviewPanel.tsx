"use client";

import { useState, useEffect } from "react";
import { useServices, type Service } from "@/hooks/useServices";
import { groupByCategory } from "@/lib/serviceHelpers";

/* ── Price display (matches public page logic) ── */
function formatPrice(svc: Service): string {
  if (svc.priceLabel && svc.priceLabel.startsWith("$")) return svc.priceLabel;
  if (svc.price > 0) return `$${svc.price.toFixed(2)}`;
  return "Call for price";
}

const DIVISION_LABELS: Record<string, string> = {
  auto: "Automotive Services",
  marine: "Marine Services",
  fleet: "Fleet Services",
  rv: "RV Services",
};

/* ── Main Preview Panel ── */
export default function ServicePreviewPanel({ division = "auto", onClose }: { division?: "auto" | "marine" | "fleet" | "rv"; onClose: () => void }) {
  const { services, categories: firestoreCategories, loading } = useServices({ division, activeOnly: true });

  const isAuto = division === "auto";
  const packages = isAuto
    ? services.filter((s) => s.type === "package").sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [];
  const regularServices = services.filter((s) => s.type !== "package");

  const autoPriority = ["oil", "tire", "wheel", "brake", "basic maintenance", "hvac"];
  const marinePriority = ["oil"];
  const grouped = groupByCategory(regularServices)
    .filter((g) => !/labor\s*rate/i.test(g.category))
    .filter((g) => !/coastal\s*packages?/i.test(g.category))
    .filter((g) => division !== "marine" || !/marine\s*brakes?/i.test(g.category))
    .sort((a, b) => {
      const priority = division === "marine" ? marinePriority : autoPriority;
      const aIdx = priority.findIndex((p) => a.category.toLowerCase().includes(p));
      const bIdx = priority.findIndex((p) => b.category.toLowerCase().includes(p));
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });

  const PACKAGES_TAB_ID = "coastal-packages";
  const categoryTabs = grouped.map((g) => ({
    id: g.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label: g.category,
  }));
  const tabs = [
    ...(isAuto && packages.length > 0 ? [{ id: PACKAGES_TAB_ID, label: "Coastal Packages" }] : []),
    ...categoryTabs,
  ];

  const [activeTab, setActiveTab] = useState("");
  const [visible, setVisible] = useState(false);

  // Slide-in animation
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Reset tab when division or tabs change
  useEffect(() => {
    if (tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [division]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set initial tab if empty
  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[500px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.12)] flex flex-col transition-transform duration-200 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-[#0B2040]">Public Page Preview</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{DIVISION_LABELS[division] || "Services"}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Info banner */}
        <div className="px-5 py-2.5 bg-[#FFFBF5] border-b border-[#f0ede6] shrink-0">
          <p className="text-[11px] text-[#996B2D] leading-[1.5]">
            Showing currently saved data. Save changes first to see updates here.
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-6 h-6 border-3 border-[#E07B2D] border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Tab pills */}
              <div className="px-4 py-3 border-b border-gray-100 overflow-x-auto no-scrollbar">
                <div className="flex gap-1.5">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                        activeTab === tab.id
                          ? "bg-[#0B2040] text-white shadow-sm"
                          : "bg-[#F5F6F8] text-[#666] hover:bg-[#EDEEF0] hover:text-[#0B2040]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Packages tab */}
              {activeTab === PACKAGES_TAB_ID && packages.length > 0 && (
                <div className="px-4 py-4">
                  <h3 className="text-[15px] font-extrabold text-[#0B2040] mb-1">Coastal Packages</h3>
                  <p className="text-[11px] text-[#555] mb-4">Bundle and save on routine maintenance</p>
                  <div className="flex flex-col gap-3">
                    {packages.map((pkg) => {
                      const isFeatured = pkg.featured === true;
                      return (
                        <div
                          key={pkg.id}
                          className={`relative bg-white rounded-[10px] p-4 flex flex-col ${
                            isFeatured
                              ? "border-t-[2px] border-t-[#E07B2D] border border-[#E07B2D]/20 shadow-sm"
                              : "border border-[#f0ede6] shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                          }`}
                        >
                          {isFeatured && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#E07B2D] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                              Most Popular
                            </span>
                          )}
                          <h4 className="text-[14px] font-bold text-[#0B2040] mb-0.5">
                            {pkg.displayName || pkg.name}
                          </h4>
                          <p className="text-[12px] font-semibold text-[#E07B2D] mb-2">
                            Starting at ${pkg.price.toFixed(2)}
                          </p>
                          <ul className="flex flex-col gap-1">
                            {pkg.bundleItems.map((item: string) => (
                              <li key={item} className="flex items-start gap-1.5 text-[11px] text-[#444] leading-[1.5]">
                                <span className="inline-block shrink-0 w-1 h-1 rounded-full bg-[#E07B2D] mt-[5px]" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category service sections */}
              {grouped
                .filter((g) => g.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") === activeTab)
                .map((group) => {
                  const startingAt = `$${Math.min(...group.services.map((s) => s.price)).toFixed(2)}`;
                  const description = firestoreCategories.find((c) => c.name === group.category)?.description || "";

                  return (
                    <div key={group.category} className="px-4 py-4">
                      <div className="mb-3">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h3 className="text-[15px] font-extrabold text-[#0B2040]">{group.category}</h3>
                          <span className="text-[11px] font-semibold text-[#E07B2D]">starting at {startingAt}</span>
                        </div>
                        {description && (
                          <p className="text-[11px] text-[#555] leading-[1.5] max-w-[400px]">{description}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {group.services.map((svc) => (
                          <div
                            key={svc.id}
                            className="flex items-center justify-between bg-white border border-[#f0ede6] rounded-[8px] px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
                          >
                            <span className="text-[13px] font-medium text-[#0B2040]">
                              {svc.displayName || svc.name}
                            </span>
                            <span className="text-[13px] font-bold text-[#E07B2D] whitespace-nowrap ml-3">
                              {formatPrice(svc)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

              {/* Empty state */}
              {grouped.length === 0 && packages.length === 0 && (
                <div className="px-4 py-16 text-center text-[13px] text-gray-400">
                  No active services to preview.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
