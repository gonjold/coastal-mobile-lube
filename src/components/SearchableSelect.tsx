"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxVisible?: number;
  loading?: boolean;
}

const MAX_RENDERED = 100;

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "",
  disabled = false,
  maxVisible = 6,
  loading = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync query to value when closed (handles external changes like VIN decode)
  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  // Update dropdown position relative to viewport
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      const t = e.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(t) &&
        (!dropdownRef.current || !dropdownRef.current.contains(t))
      ) {
        const match = options.find(
          (o) => o.toLowerCase() === query.toLowerCase()
        );
        if (match && match !== value) onChange(match);
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, options, query, value, onChange]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setQuery(value);
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, value]);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;
  const displayed = filtered.slice(0, MAX_RENDERED);
  const hasMore = filtered.length > MAX_RENDERED;
  const itemHeight = 38;

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        value={open ? query : value}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          if (disabled) return;
          setQuery(value);
          setOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "12px 10px",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 10,
          fontSize: 14,
          outline: "none",
          fontFamily: "inherit",
          background: "rgba(255,255,255,0.08)",
          color: disabled ? "rgba(255,255,255,0.35)" : "#fff",
          cursor: disabled ? "not-allowed" : undefined,
        }}
      />
      {open &&
        !disabled &&
        mounted &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: maxVisible * itemHeight,
              overflowY: "auto",
              background: "rgba(15, 23, 42, 0.98)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              zIndex: 10001,
            }}
          >
            {loading ? (
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Loading...
              </div>
            ) : displayed.length === 0 ? (
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                No matches
              </div>
            ) : (
              <>
                {displayed.map((opt) => (
                  <div
                    key={opt}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(opt);
                      setQuery(opt);
                      setOpen(false);
                    }}
                    style={{
                      padding: "10px 14px",
                      fontSize: 14,
                      color: "#fff",
                      cursor: "pointer",
                      background:
                        opt === value
                          ? "rgba(249,115,22,0.15)"
                          : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        opt === value
                          ? "rgba(249,115,22,0.25)"
                          : "rgba(255,255,255,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        opt === value
                          ? "rgba(249,115,22,0.15)"
                          : "transparent";
                    }}
                  >
                    {opt}
                  </div>
                ))}
                {hasMore && (
                  <div
                    style={{
                      padding: "8px 14px",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      textAlign: "center",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    Type more to narrow results
                  </div>
                )}
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
