"use client";

import { useState } from "react";
import type { Service, ServiceCategory } from "@/hooks/useServices";

type Division = "auto" | "marine" | "fleet" | "rv";

interface BulkActionsBarProps {
  selectedCount: number;
  selectedServices: Service[];
  categories: ServiceCategory[];
  activeDivision: Division;
  onAdjustPrices: (
    action: "increase" | "decrease" | "set",
    amount: number,
    unit: "flat" | "percent"
  ) => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onMoveTo: (categoryName: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  selectedServices,
  categories,
  activeDivision,
  onAdjustPrices,
  onActivate,
  onDeactivate,
  onMoveTo,
  onDelete,
  onClear,
}: BulkActionsBarProps) {
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [priceAction, setPriceAction] = useState<
    "increase" | "decrease" | "set"
  >("increase");
  const [priceAmount, setPriceAmount] = useState("");
  const [priceUnit, setPriceUnit] = useState<"flat" | "percent">("flat");
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const divisionCategories = categories
    .filter((c) => c.division === activeDivision)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const amt = parseFloat(priceAmount) || 0;

  function computePreview(svc: Service): string {
    const old = svc.price;
    let newPrice = old;
    if (priceAction === "set") {
      newPrice = priceUnit === "flat" ? amt : old;
    } else if (priceAction === "increase") {
      newPrice = priceUnit === "flat" ? old + amt : old * (1 + amt / 100);
    } else {
      newPrice = priceUnit === "flat" ? old - amt : old * (1 - amt / 100);
    }
    if (newPrice < 0) newPrice = 0;
    return `${svc.name} $${old.toFixed(2)} → $${newPrice.toFixed(2)}`;
  }

  const linkStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "#185FA5",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  };

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Main bar */}
      <div
        style={{
          background: "#E6F1FB",
          borderRadius: 8,
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 500, color: "#185FA5", fontSize: 13 }}>
          {selectedCount} service{selectedCount !== 1 ? "s" : ""} selected
        </span>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button
            style={linkStyle}
            onClick={() => setShowPriceForm((p) => !p)}
          >
            Adjust prices
          </button>
          <button style={linkStyle} onClick={onActivate}>
            Activate
          </button>
          <button style={linkStyle} onClick={onDeactivate}>
            Deactivate
          </button>
          <div style={{ position: "relative" }}>
            <button
              style={linkStyle}
              onClick={() => setShowMoveMenu((p) => !p)}
            >
              Move to...
            </button>
            {showMoveMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  background: "#FFFFFF",
                  border: "0.5px solid #D1D5DB",
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  width: 180,
                  zIndex: 20,
                  overflow: "hidden",
                }}
              >
                {divisionCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onMoveTo(cat.name);
                      setShowMoveMenu(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: 13,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#374151",
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            style={{ ...linkStyle, color: "#DC2626" }}
            onClick={onDelete}
          >
            Delete
          </button>
          <button
            style={{ ...linkStyle, color: "#6B7280" }}
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Price adjustment form */}
      {showPriceForm && (
        <div
          style={{
            background: "#F0F7FF",
            borderRadius: "0 0 8px 8px",
            padding: "10px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={priceAction}
              onChange={(e) =>
                setPriceAction(
                  e.target.value as "increase" | "decrease" | "set"
                )
              }
              style={{
                padding: "5px 8px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                fontSize: 13,
                background: "#FFFFFF",
              }}
            >
              <option value="increase">Increase by</option>
              <option value="decrease">Decrease by</option>
              <option value="set">Set to</option>
            </select>
            <input
              type="number"
              step="0.01"
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: 80,
                padding: "5px 8px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                fontSize: 13,
              }}
            />
            <select
              value={priceUnit}
              onChange={(e) =>
                setPriceUnit(e.target.value as "flat" | "percent")
              }
              style={{
                padding: "5px 8px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                fontSize: 13,
                background: "#FFFFFF",
              }}
            >
              <option value="flat">$ flat</option>
              <option value="percent">% percent</option>
            </select>
            <button
              onClick={() => {
                onAdjustPrices(priceAction, amt, priceUnit);
                setShowPriceForm(false);
                setPriceAmount("");
              }}
              disabled={amt === 0}
              style={{
                padding: "5px 14px",
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                borderRadius: 6,
                background: amt === 0 ? "#94A3B8" : "#185FA5",
                color: "#FFFFFF",
                cursor: amt === 0 ? "default" : "pointer",
              }}
            >
              Apply
            </button>
          </div>
          {/* Preview */}
          {amt > 0 && selectedServices.length > 0 && (
            <div
              style={{
                fontSize: 12,
                color: "#374151",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {selectedServices.slice(0, 5).map((svc) => (
                <div key={svc.id}>Preview: {computePreview(svc)}</div>
              ))}
              {selectedServices.length > 5 && (
                <div style={{ color: "#6B7280" }}>
                  ...and {selectedServices.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
