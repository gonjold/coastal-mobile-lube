"use client";

import type { Service, ServiceCategory } from "@/hooks/useServices";

type Division = "auto" | "marine" | "fleet" | "rv";

const DIVISIONS: { key: Division; label: string }[] = [
  { key: "auto", label: "Automotive" },
  { key: "marine", label: "Marine" },
  { key: "fleet", label: "Fleet" },
  { key: "rv", label: "RV" },
];

interface ServiceRowProps {
  svc: Service;
  rowIndex: number;
  isEditing: boolean;
  isEditingPrice: boolean;
  priceEditValue: string;
  priceFlash: boolean;
  isSelected: boolean;
  isDragging: boolean;
  menuOpen: boolean;
  moveMenuOpen: boolean;
  copyMenuOpen: boolean;
  activeDivision: Division;
  divisionCategories: ServiceCategory[];
  onToggleSelect: () => void;
  onDragStart: () => void;
  onToggleField: (
    field: "isActive" | "showOnBooking" | "showOnPricing",
    current: boolean
  ) => void;
  onStartPriceEdit: () => void;
  onPriceChange: (val: string) => void;
  onPriceSave: () => void;
  onPriceCancel: () => void;
  onMenuToggle: () => void;
  onEditDetails: () => void;
  onDuplicate: () => void;
  onMoveMenuToggle: () => void;
  onMoveToCategory: (catName: string) => void;
  onCopyMenuToggle: () => void;
  onCopyToDivision: (div: Division) => void;
  onDelete: () => void;
  onCollapseEdit: () => void;
}

export default function ServiceRow({
  svc,
  rowIndex,
  isEditing,
  isEditingPrice,
  priceEditValue,
  priceFlash,
  isSelected,
  isDragging,
  menuOpen,
  moveMenuOpen,
  copyMenuOpen,
  activeDivision,
  divisionCategories,
  onToggleSelect,
  onDragStart,
  onToggleField,
  onStartPriceEdit,
  onPriceChange,
  onPriceSave,
  onPriceCancel,
  onMenuToggle,
  onEditDetails,
  onDuplicate,
  onMoveMenuToggle,
  onMoveToCategory,
  onCopyMenuToggle,
  onCopyToDivision,
  onDelete,
  onCollapseEdit,
}: ServiceRowProps) {
  const mi: React.CSSProperties = {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "8px 14px",
    fontSize: 13,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#374151",
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        display: "grid",
        gridTemplateColumns: "28px 28px 1fr 90px 72px 72px 60px 36px",
        padding: "9px 12px",
        alignItems: "center",
        borderBottom: "0.5px solid #E5E7EB",
        opacity: svc.isActive ? 1 : 0.45,
        background: isEditing
          ? "rgba(26,82,118,0.05)"
          : isDragging
            ? "#F0F7FF"
            : rowIndex % 2 === 1
              ? "#FAFBFC"
              : "transparent",
        transition: "background 0.15s",
      }}
    >
      {/* Checkbox */}
      <div>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ accentColor: "#1a5276" }}
        />
      </div>

      {/* Drag handle */}
      <div
        style={{
          cursor: "grab",
          color: "#D1D5DB",
          fontSize: 14,
          userSelect: "none",
          textAlign: "center",
        }}
      >
        &#x2630;
      </div>

      {/* Name + description */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#0B2040",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {svc.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: isEditing ? "#1a5276" : "#9CA3AF",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: isEditing ? 500 : 400,
          }}
        >
          {isEditing ? "Editing" : svc.description || "\u00A0"}
        </div>
      </div>

      {/* Price */}
      <div>
        {isEditingPrice ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input
              type="number"
              step="0.01"
              value={priceEditValue}
              onChange={(e) => onPriceChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onPriceSave();
                if (e.key === "Escape") onPriceCancel();
              }}
              autoFocus
              style={{
                width: 60,
                padding: "2px 4px",
                fontSize: 13,
                textAlign: "right",
                border: "1px solid #1a5276",
                borderRadius: 4,
                outline: "none",
              }}
            />
            <button
              onClick={onPriceSave}
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#FFF",
                background: "#1a5276",
                border: "none",
                borderRadius: 4,
                padding: "2px 6px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              onClick={onPriceCancel}
              style={{
                fontSize: 11,
                color: "#6B7280",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onStartPriceEdit}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#0B2040",
              background: priceFlash ? "rgba(22,163,74,0.15)" : "none",
              border: "none",
              borderBottom: "1px dashed #9CA3AF",
              cursor: "pointer",
              padding: priceFlash ? "1px 4px" : 0,
              borderRadius: priceFlash ? 4 : 0,
              transition: "background 0.3s",
            }}
          >
            ${svc.price.toFixed(2)}
          </button>
        )}
      </div>

      {/* Book pill */}
      <div style={{ textAlign: "center" }}>
        <Pill
          show={svc.showOnBooking}
          onClick={() => onToggleField("showOnBooking", svc.showOnBooking)}
        />
      </div>

      {/* Site pill */}
      <div style={{ textAlign: "center" }}>
        <Pill
          show={svc.showOnPricing}
          onClick={() => onToggleField("showOnPricing", svc.showOnPricing)}
        />
      </div>

      {/* Active toggle */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => onToggleField("isActive", svc.isActive)}
          style={{
            width: 34,
            height: 18,
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            background: svc.isActive ? "#1a5276" : "#D1D5DB",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: "#FFF",
              position: "absolute",
              top: 2,
              left: svc.isActive ? 18 : 2,
              transition: "left 0.2s",
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}
          />
        </button>
      </div>

      {/* Three-dot menu */}
      <div style={{ position: "relative" }}>
        {isEditing ? (
          <button
            onClick={onCollapseEdit}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6B7280",
              padding: 2,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onMenuToggle}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9CA3AF",
              padding: 2,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            &#x22EE;
          </button>
        )}

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              marginTop: 4,
              background: "#FFF",
              border: "0.5px solid #D1D5DB",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              width: 180,
              zIndex: 20,
              overflow: "hidden",
            }}
          >
            <button onClick={onEditDetails} style={mi}>Edit details</button>
            <button onClick={onDuplicate} style={mi}>Duplicate</button>

            {/* Move to category */}
            <div style={{ position: "relative" }}>
              <button onClick={onMoveMenuToggle} style={mi}>Move to category...</button>
              {moveMenuOpen && (
                <div style={{ position: "absolute", left: "100%", top: 0, background: "#FFF", border: "0.5px solid #D1D5DB", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", width: 180, zIndex: 21, overflow: "hidden" }}>
                  {divisionCategories.map((cat) => (
                    <button key={cat.id} onClick={() => onMoveToCategory(cat.name)} style={{ ...mi, fontWeight: svc.category === cat.name ? 600 : 400 }}>{cat.name}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Copy to division */}
            <div style={{ position: "relative" }}>
              <button onClick={onCopyMenuToggle} style={mi}>Copy to division...</button>
              {copyMenuOpen && (
                <div style={{ position: "absolute", left: "100%", top: 0, background: "#FFF", border: "0.5px solid #D1D5DB", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", width: 180, zIndex: 21, overflow: "hidden" }}>
                  {DIVISIONS.filter((d) => d.key !== activeDivision).map((d) => (
                    <button key={d.key} onClick={() => onCopyToDivision(d.key)} style={mi}>{d.label}</button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: 1, background: "#E5E7EB", margin: "4px 0" }} />
            <button onClick={onDelete} style={{ ...mi, color: "#DC2626" }}>Delete service</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        background: show ? "#EAF3DE" : "#F3F4F6",
        color: show ? "#3B6D11" : "#9CA3AF",
      }}
    >
      {show ? "Show" : "Hide"}
    </button>
  );
}
