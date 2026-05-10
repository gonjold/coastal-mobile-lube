"use client";

import { type ReactNode } from "react";

/* ── Types ── */
export interface AdminColumn {
  key: string;
  label: string;
  align: "left" | "center";
  sortable?: boolean;
}

/* ── AdminTable (wrapper) ── */
export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {children}
    </div>
  );
}

/* ── AdminTableHeader ── */
export function AdminTableHeader({
  columns,
  sortKey,
  sortDir,
  onSort,
  gridTemplateColumns,
}: {
  columns: AdminColumn[];
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  gridTemplateColumns: string;
}) {
  return (
    <div
      className="grid bg-gray-50 px-5 py-3 border-b border-gray-200"
      style={{ gridTemplateColumns }}
    >
      {columns.map((col) => {
        const isActive = sortKey === col.key;
        const alignCls = col.align === "center" ? "text-center" : "";

        if (col.sortable) {
          return (
            <button
              key={col.key}
              onClick={() => onSort?.(col.key)}
              className={`text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition ${alignCls}`}
            >
              {col.label}{" "}
              {isActive ? (sortDir === "asc" ? "\u2191" : "\u2193") : "\u2013"}
            </button>
          );
        }

        return (
          <span
            key={col.key}
            className={`text-[11px] font-bold text-gray-500 uppercase tracking-wider ${alignCls}`}
          >
            {col.label}
          </span>
        );
      })}
    </div>
  );
}

/* ── AdminTableRow ── */
export function AdminTableRow({
  children,
  onClick,
  isSelected,
  gridTemplateColumns,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  gridTemplateColumns: string;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`grid items-center px-5 py-3.5 border-b border-gray-200 cursor-pointer transition ${
        isSelected ? "bg-blue-50" : "bg-white hover:bg-gray-50"
      } ${className || ""}`}
      style={{ gridTemplateColumns }}
    >
      {children}
    </div>
  );
}
