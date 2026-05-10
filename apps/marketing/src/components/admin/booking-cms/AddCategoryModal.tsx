"use client";

import { useState } from "react";
import { Package, Plus } from "lucide-react";
import type { BookingVisibility } from "@/hooks/useServices";
import { NAVY, ORANGE, ORANGE_DARK, BORDER } from "./tokens";

export type AddCategorySubmit = {
  name: string;
  subtitle: string;
  visibility: BookingVisibility;
};

export default function AddCategoryModal({
  kind,
  open,
  onClose,
  onSubmit,
}: {
  kind: "regular" | "featured";
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddCategorySubmit) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [visibility, setVisibility] = useState<BookingVisibility>("inline");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const isFeatured = kind === "featured";
  const title = isFeatured ? "New featured block" : "New category";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        subtitle: subtitle.trim(),
        visibility,
      });
      setName("");
      setSubtitle("");
      setVisibility("inline");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={() => !saving && onClose()}
      />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
      >
        <div
          className="px-5 py-4 border-b flex items-center gap-2"
          style={{ borderColor: BORDER, background: "#FAFAFB" }}
        >
          {isFeatured ? (
            <Package className="w-4 h-4" style={{ color: ORANGE }} />
          ) : (
            <Plus className="w-4 h-4" style={{ color: NAVY }} />
          )}
          <h2 className="text-[15px] font-bold" style={{ color: NAVY }}>
            {title}
          </h2>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label
              className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-600"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                isFeatured ? "Spring Offers, Coastal Packages…" : "Oil Changes, Tire & Wheel…"
              }
              className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none focus:ring-2"
              style={{ borderColor: BORDER }}
            />
          </div>

          {isFeatured && (
            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-600"
              >
                Subtitle
              </label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Bundled services at a better price"
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none focus:ring-2"
                style={{ borderColor: BORDER }}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Shown under the block title in the booking modal.
              </p>
            </div>
          )}

          <div>
            <label
              className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-600"
            >
              Booking visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as BookingVisibility)}
              className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none bg-white"
              style={{ borderColor: BORDER, color: NAVY }}
            >
              <option value="inline">Inline — show in booking modal</option>
              <option value="searchable">Searchable only — findable via search</option>
              <option value="hidden">Hidden — do not show</option>
            </select>
          </div>
        </div>

        <div
          className="px-5 py-3 border-t flex items-center justify-end gap-2"
          style={{ borderColor: BORDER, background: "#FAFAFB" }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 text-[12px] font-semibold rounded-lg border bg-white hover:bg-gray-50 transition disabled:opacity-50"
            style={{ borderColor: BORDER, color: "#4b5563" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-3 py-1.5 text-[12px] font-semibold rounded-lg text-white transition disabled:opacity-50"
            style={{ background: ORANGE }}
            onMouseEnter={(e) => {
              if (!saving) (e.currentTarget.style.background = ORANGE_DARK);
            }}
            onMouseLeave={(e) => {
              if (!saving) (e.currentTarget.style.background = ORANGE);
            }}
          >
            {saving ? "Creating…" : isFeatured ? "Create block" : "Create category"}
          </button>
        </div>
      </form>
    </div>
  );
}
