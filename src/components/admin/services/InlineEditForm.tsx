"use client";

import { useState } from "react";
import type { Service, ServiceCategory } from "@/hooks/useServices";

type Division = "auto" | "marine" | "fleet" | "rv";

interface InlineEditFormProps {
  service: Partial<Service> & { _isNew?: boolean };
  categories: ServiceCategory[];
  activeDivision: Division;
  onSave: (data: Partial<Service> & { _isNew?: boolean }) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  saving: boolean;
}

export default function InlineEditForm({
  service,
  categories,
  activeDivision,
  onSave,
  onCancel,
  onDelete,
  saving,
}: InlineEditFormProps) {
  const [form, setForm] = useState({
    name: service.name || "",
    price: service.price ?? 0,
    description: service.description || "",
    priceLabel: service.priceLabel || "",
    category: service.category || "",
    notes: service.notes || "",
    showOnBooking: service.showOnBooking ?? true,
    showOnPricing: service.showOnPricing ?? true,
  });

  const divisionCategories = categories
    .filter((c) => c.division === (service.division || activeDivision))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  function handleSave() {
    if (!form.name.trim()) return;
    onSave({
      ...service,
      name: form.name,
      price: form.price,
      description: form.description,
      priceLabel: form.priceLabel,
      category: form.category,
      notes: form.notes,
      showOnBooking: form.showOnBooking,
      showOnPricing: form.showOnPricing,
    });
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    marginBottom: 4,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid #E5E7EB",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    background: "#FFFFFF",
  };

  return (
    <div
      style={{
        background: "#FAFBFC",
        padding: "16px 20px 16px 68px",
        borderBottom: "0.5px solid #E5E7EB",
        animation: "slideDown 0.15s ease-out",
      }}
    >
      <style>{`@keyframes slideDown{from{opacity:0;max-height:0;transform:translateY(-8px)}to{opacity:1;max-height:600px;transform:translateY(0)}}`}</style>

      {/* Row 1: Name + Price */}
      <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>Service name</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Price</label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "#9CA3AF", fontSize: 13 }}>$</span>
            <input
              type="number"
              step="0.01"
              style={inputStyle}
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  price: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Row 2: Description */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ ...inputStyle, resize: "none" }}
          rows={2}
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
        />
      </div>

      {/* Row 3: Price label + Category */}
      <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Price label / display text</label>
          <input
            style={inputStyle}
            placeholder='e.g. "Starting at"'
            value={form.priceLabel}
            onChange={(e) =>
              setForm((p) => ({ ...p, priceLabel: e.target.value }))
            }
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Category</label>
          <select
            style={{ ...inputStyle, background: "#FFFFFF" }}
            value={form.category}
            onChange={(e) =>
              setForm((p) => ({ ...p, category: e.target.value }))
            }
          >
            <option value="">Select category</option>
            {divisionCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 4: Internal notes */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Internal notes</label>
        <textarea
          style={{ ...inputStyle, resize: "none" }}
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        />
      </div>

      {/* Row 5: Checkboxes */}
      <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#374151",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={form.showOnBooking}
            onChange={() =>
              setForm((p) => ({ ...p, showOnBooking: !p.showOnBooking }))
            }
            style={{ accentColor: "#1a5276" }}
          />
          Show in booking wizard
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#374151",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={form.showOnPricing}
            onChange={() =>
              setForm((p) => ({ ...p, showOnPricing: !p.showOnPricing }))
            }
            style={{ accentColor: "#1a5276" }}
          />
          Show on pricing page
        </label>
      </div>

      {/* Bottom action bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "0.5px solid #E5E7EB",
          paddingTop: 12,
        }}
      >
        <div>
          {onDelete && service.id && !service._isNew && (
            <button
              onClick={() => onDelete(service.id!)}
              style={{
                fontSize: 13,
                color: "#DC2626",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Delete service
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 500,
              border: "1px solid #E5E7EB",
              borderRadius: 6,
              background: "#FFFFFF",
              color: "#6B7280",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            style={{
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              borderRadius: 6,
              background: saving || !form.name.trim() ? "#94A3B8" : "#1a5276",
              color: "#FFFFFF",
              cursor: saving || !form.name.trim() ? "default" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
