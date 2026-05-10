"use client";

import {
  Package,
  LayoutList,
  Globe,
  Settings2,
  Plus,
  Pencil,
  Copy as CopyIcon,
} from "lucide-react";
import type { Service, ServiceCategory, BookingVisibility } from "@/hooks/useServices";
import { resolveBookingVisibility } from "@/hooks/useServices";
import VisibilitySelect from "./VisibilitySelect";
import { NAVY, ORANGE, SURFACE, BORDER } from "./tokens";

export default function SelectedCategoryPanel({
  category,
  services,
  onUpdateCategory,
  onUpdateService,
  onEditCategoryMeta,
  onAddService,
  onEditService,
  onDuplicateService,
}: {
  category: ServiceCategory;
  services: Service[];
  onUpdateCategory: (patch: Partial<ServiceCategory>) => Promise<void> | void;
  onUpdateService: (id: string, patch: Partial<Service>) => Promise<void> | void;
  onEditCategoryMeta: () => void;
  onAddService: () => void;
  onEditService: (svc: Service) => void;
  onDuplicateService: (svc: Service) => void;
}) {
  const isFeatured = !!category.isFeatured;
  const categoryVis = resolveBookingVisibility(category);
  const isPublic = category.isActive !== false;

  const gridCols = isFeatured
    ? "1fr 90px 170px 80px 80px"
    : "1fr 100px 170px 80px 80px";

  return (
    <div
      className="bg-white rounded-xl border overflow-hidden"
      style={{ borderColor: BORDER }}
    >
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: BORDER, background: SURFACE }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-bold tracking-widest text-gray-500 uppercase mb-1">
              {isFeatured ? "Featured Block · Pinned to Top" : "Category"}
            </div>
            <h2
              className="text-[18px] font-bold tracking-tight flex items-center gap-2"
              style={{ color: NAVY }}
            >
              {category.name}
              {isFeatured && (
                <Package className="w-4 h-4" style={{ color: ORANGE }} />
              )}
            </h2>
            <div className="text-[12px] text-gray-500 mt-0.5">
              {isFeatured
                ? category.featuredSubtitle || "Featured block subtitle"
                : `Starting at $${category.startingAt || 0} · ${services.length} service${
                    services.length !== 1 ? "s" : ""
                  }`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEditCategoryMeta}
              className="px-2.5 py-1.5 text-[11.5px] font-semibold rounded-lg border bg-white hover:bg-gray-50 transition flex items-center gap-1"
              style={{ borderColor: BORDER, color: "#4b5563" }}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Edit {isFeatured ? "block" : "category"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <ControlCard
            icon={<LayoutList className="w-3.5 h-3.5" />}
            label="Booking modal"
            sub={
              isFeatured
                ? "Featured blocks always show at the top"
                : "Where this category appears in the wizard"
            }
          >
            <VisibilitySelect
              value={categoryVis}
              onChange={(v) => onUpdateCategory({ bookingVisibility: v })}
            />
          </ControlCard>
          <ControlCard
            icon={<Globe className="w-3.5 h-3.5" />}
            label="Public site"
            sub="Show on /services and division pages"
          >
            <Toggle
              on={isPublic}
              onChange={(v) => onUpdateCategory({ isActive: v })}
            />
          </ControlCard>
        </div>
      </div>

      <div className="px-5 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10.5px] font-bold tracking-widest text-gray-500 uppercase">
            {isFeatured ? "Items in this block" : "Services in this category"}
          </div>
          <button
            type="button"
            onClick={onAddService}
            className="text-[11.5px] font-semibold flex items-center gap-1"
            style={{ color: ORANGE }}
          >
            <Plus className="w-3.5 h-3.5" /> Add {isFeatured ? "item" : "service"}
          </button>
        </div>

        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: BORDER }}
        >
          <div
            className="grid px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b"
            style={{
              gridTemplateColumns: gridCols,
              borderColor: BORDER,
              background: "#FAFAFB",
            }}
          >
            <div>{isFeatured ? "Item" : "Service"}</div>
            <div className="text-right">Price</div>
            <div>Booking</div>
            <div className="text-center">Site</div>
            <div className="text-right">Actions</div>
          </div>

          {services.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12px] text-gray-500">
              No {isFeatured ? "items" : "services"} yet. Click &ldquo;Add{" "}
              {isFeatured ? "item" : "service"}&rdquo; above.
            </div>
          ) : (
            services.map((svc, idx) => (
              <ServiceTableRow
                key={svc.id}
                svc={svc}
                isFeatured={isFeatured}
                gridCols={gridCols}
                isLast={idx === services.length - 1}
                onUpdate={(patch) => onUpdateService(svc.id, patch)}
                onEdit={() => onEditService(svc)}
                onDuplicate={() => onDuplicateService(svc)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceTableRow({
  svc,
  isFeatured,
  gridCols,
  isLast,
  onUpdate,
  onEdit,
  onDuplicate,
}: {
  svc: Service;
  isFeatured: boolean;
  gridCols: string;
  isLast: boolean;
  onUpdate: (patch: Partial<Service>) => Promise<void> | void;
  onEdit: () => void;
  onDuplicate: () => void;
}) {
  const visibility = resolveBookingVisibility(svc);
  return (
    <div
      className="grid px-4 py-3 items-center transition hover:bg-gray-50"
      style={{
        gridTemplateColumns: gridCols,
        borderColor: BORDER,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomStyle: "solid",
      }}
    >
      <div className="min-w-0">
        <div
          className="text-[13px] font-medium truncate"
          style={{ color: NAVY }}
        >
          {svc.name}
        </div>
        {isFeatured && svc.description && (
          <div className="text-[11px] text-gray-500 mt-0.5 truncate">
            {svc.description}
          </div>
        )}
      </div>
      <div className="text-right text-[13px] font-semibold text-gray-700 tabular-nums">
        ${svc.price.toFixed(2)}
      </div>
      <div>
        <VisibilitySelect
          value={visibility}
          onChange={(v: BookingVisibility) =>
            onUpdate({ bookingVisibility: v })
          }
          dense
        />
      </div>
      <div className="flex justify-center">
        <Toggle
          on={svc.showOnPricing !== false}
          onChange={(v) => onUpdate({ showOnPricing: v })}
        />
      </div>
      <div className="flex items-center justify-end gap-1">
        <IconButton title="Edit" onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton title="Duplicate" onClick={onDuplicate}>
          <CopyIcon className="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </div>
  );
}

function ControlCard({
  icon,
  label,
  sub,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-3 rounded-lg border bg-white flex items-center justify-between gap-3"
      style={{ borderColor: BORDER }}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: SURFACE, color: NAVY }}
        >
          {icon}
        </div>
        <div>
          <div className="text-[12px] font-bold" style={{ color: NAVY }}>
            {label}
          </div>
          <div className="text-[10.5px] text-gray-500 mt-0.5">{sub}</div>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="relative inline-flex items-center h-5 w-9 rounded-full transition flex-shrink-0"
      style={{ background: on ? "#10B981" : "#D1D5DB" }}
      aria-pressed={on}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition"
        style={{ transform: on ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function IconButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
    >
      {children}
    </button>
  );
}
