"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

type Position = { top: number; left: number };

const RowActionMenuContext = createContext<{ close: () => void } | null>(null);

interface RowActionMenuProps {
  children: ReactNode;
  align?: "left" | "right";
  triggerClassName?: string;
}

export function RowActionMenu({
  children,
  align = "right",
  triggerClassName = "",
}: RowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  const toggleOpen = () => {
    if (!triggerRef.current) return;
    if (!open) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 200;
      const top = rect.bottom + 4;
      const left =
        align === "right" ? rect.right - menuWidth : rect.left;
      setPosition({ top, left });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleOpen();
        }}
        className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition ${triggerClassName}`}
        aria-label="Row actions"
      >
        <span className="text-lg text-gray-400 leading-none">&#8942;</span>
      </button>
      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                zIndex: 9999,
              }}
              className="min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 py-1"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <RowActionMenuContext.Provider value={{ close: () => setOpen(false) }}>
                {children}
              </RowActionMenuContext.Provider>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

interface RowActionItemProps {
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  title?: string;
  closeOnClick?: boolean;
  children: ReactNode;
}

export function RowActionItem({
  onClick,
  disabled = false,
  destructive = false,
  title,
  closeOnClick = true,
  children,
}: RowActionItemProps) {
  const ctx = useContext(RowActionMenuContext);
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) return;
        onClick();
        if (closeOnClick) ctx?.close();
      }}
      disabled={disabled}
      className={`block w-full text-left px-4 py-2 text-sm transition ${
        disabled
          ? "text-gray-300 cursor-not-allowed"
          : destructive
          ? "text-red-600 cursor-pointer hover:bg-gray-50"
          : "text-gray-700 cursor-pointer hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

export function RowActionDivider() {
  return <div className="h-px bg-gray-100 my-1" />;
}

export function useRowActionMenu() {
  return useContext(RowActionMenuContext);
}
