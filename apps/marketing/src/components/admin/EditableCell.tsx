"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EditableCellType = "text" | "email" | "tel" | "date" | "select";

export interface EditableCellProps {
  /** Current value displayed when not editing. */
  value: string;
  /** Optional render override for the non-edit state (e.g. formatted phone). */
  display?: ReactNode;
  /** Save handler — should write to backend. Throw / reject to revert. */
  onSave: (next: string) => Promise<void>;
  /** Optional callback invoked after a successful save via Enter key. */
  onAdvance?: () => void;
  type?: EditableCellType;
  /** Required when type === "select". */
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  readOnly?: boolean;
  /** Forces edit-on-mount; useful when row supplies external focus. */
  autoEdit?: boolean;
  /** Tailwind classes for the wrapper. */
  className?: string;
}

export default function EditableCell({
  value,
  display,
  onSave,
  onAdvance,
  type = "text",
  options,
  placeholder,
  readOnly = false,
  autoEdit = false,
  className,
}: EditableCellProps) {
  const [editing, setEditing] = useState(autoEdit);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft when value changes (e.g. external Firestore update).
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && type !== "select") {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing, type]);

  function startEdit() {
    if (readOnly || saving) return;
    setDraft(value);
    setEditing(true);
  }

  async function commit({ advance = false }: { advance?: boolean } = {}) {
    if (saving) return;
    if (draft === value) {
      setEditing(false);
      if (advance) onAdvance?.();
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
      if (advance) onAdvance?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save";
      toast.error("Save failed", { description: message });
      setDraft(value); // revert to last server state
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement | HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Enter") {
      e.preventDefault();
      void commit({ advance: true });
    } else if (e.key === "Tab") {
      // Save on Tab; let Tab navigation continue via blur.
      void commit();
    }
  }

  if (!editing) {
    const isEmpty = !value || value.trim() === "";
    return (
      <div
        role={readOnly ? undefined : "button"}
        tabIndex={readOnly ? undefined : 0}
        aria-label={readOnly ? undefined : "Edit"}
        onClick={startEdit}
        onKeyDown={(e) => {
          if (readOnly) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            startEdit();
          }
        }}
        className={cn(
          "min-h-[28px] rounded-sm px-1.5 py-0.5 -mx-1.5 -my-0.5 text-[13px] leading-tight",
          "transition-colors duration-150",
          !readOnly &&
            "cursor-text hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          isEmpty && "text-muted-foreground italic",
          className,
        )}
      >
        {display ?? (isEmpty ? placeholder ?? "—" : value)}
      </div>
    );
  }

  if (type === "select" && options) {
    return (
      <Select
        value={draft}
        onValueChange={(v) => {
          setDraft(v);
          // commit immediately on select change
          setTimeout(() => {
            // re-read draft via closure capture: schedule commit using new value
            // by calling onSave directly rather than commit() which uses stale state
            void (async () => {
              if (v === value) {
                setEditing(false);
                return;
              }
              setSaving(true);
              try {
                await onSave(v);
                setEditing(false);
              } catch (err) {
                const m = err instanceof Error ? err.message : "Could not save";
                toast.error("Save failed", { description: m });
                setDraft(value);
                setEditing(false);
              } finally {
                setSaving(false);
              }
            })();
          }, 0);
        }}
        open
        onOpenChange={(open) => {
          if (!open && draft === value) setEditing(false);
        }}
      >
        <SelectTrigger className="h-7 text-[13px] px-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      ref={inputRef}
      type={type === "tel" ? "tel" : type === "email" ? "email" : type === "date" ? "date" : "text"}
      value={draft}
      placeholder={placeholder}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={onKeyDown}
      className={cn(
        "h-7 text-[13px] px-2 py-0.5",
        saving && "opacity-60",
        className,
      )}
    />
  );
}
