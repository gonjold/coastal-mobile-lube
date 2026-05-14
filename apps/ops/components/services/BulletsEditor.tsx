"use client";

import { useRef } from "react";
import { GripVertical, X, Plus } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BulletsEditorProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

type Row = { key: string; text: string };

function makeKey() {
  return `b-${Math.random().toString(36).slice(2, 10)}`;
}

export default function BulletsEditor({
  value,
  onChange,
  placeholder,
}: BulletsEditorProps) {
  const keysRef = useRef<string[]>([]);
  if (keysRef.current.length !== value.length) {
    if (keysRef.current.length < value.length) {
      while (keysRef.current.length < value.length) keysRef.current.push(makeKey());
    } else {
      keysRef.current = keysRef.current.slice(0, value.length);
    }
  }
  const rows: Row[] = value.map((text, i) => ({ key: keysRef.current[i], text }));

  const lastInputRef = useRef<HTMLInputElement | null>(null);
  const shouldFocusLastRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.key === active.id);
    const newIndex = rows.findIndex((r) => r.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    keysRef.current = arrayMove(keysRef.current, oldIndex, newIndex);
    onChange(arrayMove(value, oldIndex, newIndex));
  }

  function updateAt(index: number, text: string) {
    const next = value.slice();
    next[index] = text;
    onChange(next);
  }

  function removeAt(index: number) {
    const next = value.slice();
    next.splice(index, 1);
    keysRef.current.splice(index, 1);
    onChange(next);
  }

  function addBullet() {
    keysRef.current.push(makeKey());
    shouldFocusLastRef.current = true;
    onChange([...value, ""]);
  }

  function setLastInputRef(index: number) {
    return (el: HTMLInputElement | null) => {
      if (index === value.length - 1) {
        lastInputRef.current = el;
        if (el && shouldFocusLastRef.current) {
          shouldFocusLastRef.current = false;
          el.focus();
        }
      }
    };
  }

  const addButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "#E07B2D",
    background: "transparent",
    border: "1px dashed rgba(224,123,45,0.35)",
    borderRadius: 6,
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.length === 0 ? (
        <>
          <button type="button" onClick={addBullet} style={addButtonStyle}>
            <Plus style={{ width: 12, height: 12 }} />
            Add bullet
          </button>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>
            No bullets yet. Add one to describe what&apos;s included.
          </span>
        </>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rows.map((r) => r.key)}
              strategy={verticalListSortingStrategy}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rows.map((row, index) => (
                  <BulletRow
                    key={row.key}
                    id={row.key}
                    index={index}
                    text={row.text}
                    placeholder={placeholder}
                    inputRef={setLastInputRef(index)}
                    onTextChange={(t) => updateAt(index, t)}
                    onRemove={() => removeAt(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button type="button" onClick={addBullet} style={addButtonStyle}>
            <Plus style={{ width: 12, height: 12 }} />
            Add bullet
          </button>
        </>
      )}
    </div>
  );
}

function BulletRow({
  id,
  index,
  text,
  placeholder,
  inputRef,
  onTextChange,
  onRemove,
}: {
  id: string;
  index: number;
  text: string;
  placeholder?: string;
  inputRef: (el: HTMLInputElement | null) => void;
  onTextChange: (t: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const wrapperStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    display: "flex",
    alignItems: "center",
    gap: 6,
    height: 40,
  };

  const dragStyle: React.CSSProperties = {
    width: 24,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9CA3AF",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "grab",
    touchAction: "none",
    flexShrink: 0,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "7px 10px",
    border: "1px solid #E5E7EB",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    background: "#FFFFFF",
    height: 34,
  };

  const removeStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9CA3AF",
    background: "transparent",
    border: "none",
    borderRadius: 4,
    padding: 0,
    cursor: "pointer",
    flexShrink: 0,
  };

  return (
    <div ref={setNodeRef} style={wrapperStyle}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        style={dragStyle}
        aria-label={`Reorder bullet ${index + 1}`}
      >
        <GripVertical style={{ width: 16, height: 16 }} />
      </button>
      <input
        ref={inputRef}
        type="text"
        value={text}
        placeholder={placeholder}
        onChange={(e) => onTextChange(e.target.value)}
        aria-label={`Bullet ${index + 1}`}
        style={inputStyle}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove bullet ${index + 1}`}
        style={removeStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#DC2626";
          (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}
