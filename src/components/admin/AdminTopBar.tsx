"use client";

import { type ReactNode } from "react";

export default function AdminTopBar({
  title,
  subtitle,
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex justify-between items-center px-8 py-3.5">
        {/* Left side */}
        <div>
          <h1 className="text-xl font-bold text-[#0B2040]">{title}</h1>
          {subtitle && (
            <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search bar (display only) */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 gap-2 min-w-[220px]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {onSearchChange ? (
              <input
                type="text"
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder || "Search customers, bookings..."}
                className="border-none outline-none bg-transparent text-[13px] w-full"
              />
            ) : (
              <span className="text-[13px] text-gray-500">
                Search customers, bookings...
              </span>
            )}
          </div>

          {/* User avatar */}
          <div className="w-[34px] h-[34px] rounded-full bg-[#0B2040] text-white flex items-center justify-center text-[13px] font-bold">
            JB
          </div>

          {/* Page-specific action buttons */}
          {children}
        </div>
      </div>
    </div>
  );
}
