"use client";

import { useState, useRef, useEffect } from "react";
import type { Service, ServiceCategory } from "@/hooks/useServices";

interface CategoryTreeProps {
  categories: ServiceCategory[];
  services: Service[];
  activeDivision: string;
  selectedCategory: string | null;
  onSelectCategory: (name: string | null) => void;
  onAddCategory: (name: string) => void;
  onRenameCategory: (id: string, newName: string) => void;
  onDuplicateCategory: (cat: ServiceCategory) => void;
  onDeleteCategory: (cat: ServiceCategory) => void;
}

export default function CategoryTree({
  categories,
  services,
  activeDivision,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onRenameCategory,
  onDuplicateCategory,
  onDeleteCategory,
}: CategoryTreeProps) {
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const addRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const divisionServices = services.filter((s) => s.division === activeDivision);
  const divisionCategories = categories
    .filter((c) => c.division === activeDivision)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const totalCount = divisionServices.length;

  function getCount(catName: string) {
    return divisionServices.filter((s) => s.category === catName).length;
  }

  useEffect(() => {
    if (addingNew && addRef.current) addRef.current.focus();
  }, [addingNew]);

  useEffect(() => {
    if (renamingId && renameRef.current) renameRef.current.focus();
  }, [renamingId]);

  function handleAddSubmit() {
    const trimmed = newName.trim();
    if (trimmed) {
      onAddCategory(trimmed);
    }
    setNewName("");
    setAddingNew(false);
  }

  function handleRenameSubmit(id: string) {
    const trimmed = renameValue.trim();
    if (trimmed) {
      onRenameCategory(id, trimmed);
    }
    setRenamingId(null);
    setRenameValue("");
  }

  const selectedCat = divisionCategories.find((c) => c.name === selectedCategory);

  return (
    <div
      style={{
        width: 230,
        minWidth: 230,
        borderRight: "1px solid #E2E8F0",
        background: "#F8F9FA",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 12px 8px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#9CA3AF",
            fontWeight: 500,
          }}
        >
          Categories
        </span>
        <button
          onClick={() => setAddingNew(true)}
          style={{
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 4,
            border: "none",
            background: "transparent",
            color: "#9CA3AF",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
          }}
          title="Add category"
        >
          +
        </button>
      </div>

      {/* All services item */}
      <button
        onClick={() => onSelectCategory(null)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          fontSize: 13,
          border: "none",
          background:
            selectedCategory === null ? "rgba(26,82,118,0.06)" : "transparent",
          fontWeight: selectedCategory === null ? 500 : 400,
          color: selectedCategory === null ? "#1a5276" : "#6B7280",
          borderLeft:
            selectedCategory === null
              ? "3px solid #1a5276"
              : "3px solid transparent",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
        }}
      >
        <span>All services</span>
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{totalCount}</span>
      </button>

      {/* Category items */}
      {divisionCategories.map((cat) => (
        <div key={cat.id}>
          {renamingId === cat.id ? (
            <div style={{ padding: "4px 12px" }}>
              <input
                ref={renameRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit(cat.id);
                  if (e.key === "Escape") {
                    setRenamingId(null);
                    setRenameValue("");
                  }
                }}
                onBlur={() => handleRenameSubmit(cat.id)}
                style={{
                  width: "100%",
                  fontSize: 13,
                  padding: "4px 6px",
                  border: "1px solid #1a5276",
                  borderRadius: 4,
                  outline: "none",
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => onSelectCategory(cat.name)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                fontSize: 13,
                border: "none",
                background:
                  selectedCategory === cat.name
                    ? "rgba(26,82,118,0.06)"
                    : "transparent",
                fontWeight: selectedCategory === cat.name ? 500 : 400,
                color: selectedCategory === cat.name ? "#1a5276" : "#6B7280",
                borderLeft:
                  selectedCategory === cat.name
                    ? "3px solid #1a5276"
                    : "3px solid transparent",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginRight: 8,
                }}
              >
                {cat.name}
              </span>
              <span style={{ fontSize: 12, color: "#9CA3AF", flexShrink: 0 }}>
                {getCount(cat.name)}
              </span>
            </button>
          )}
        </div>
      ))}

      {/* Inline add input */}
      {addingNew && (
        <div style={{ padding: "4px 12px 8px" }}>
          <input
            ref={addRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddSubmit();
              if (e.key === "Escape") {
                setAddingNew(false);
                setNewName("");
              }
            }}
            onBlur={handleAddSubmit}
            placeholder="New category name"
            style={{
              width: "100%",
              fontSize: 13,
              padding: "4px 6px",
              border: "1px solid #1a5276",
              borderRadius: 4,
              outline: "none",
            }}
          />
        </div>
      )}

      {/* Category actions */}
      {selectedCat && (
        <div
          style={{
            borderTop: "0.5px solid #E5E7EB",
            padding: "10px 12px",
            marginTop: "auto",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#9CA3AF",
              marginBottom: 6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedCat.name}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                setRenamingId(selectedCat.id);
                setRenameValue(selectedCat.name);
              }}
              style={{
                fontSize: 12,
                color: "#1a5276",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Rename
            </button>
            <button
              onClick={() => onDuplicateCategory(selectedCat)}
              style={{
                fontSize: 12,
                color: "#1a5276",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Duplicate
            </button>
            <button
              onClick={() => onDeleteCategory(selectedCat)}
              style={{
                fontSize: 12,
                color: "#DC2626",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
