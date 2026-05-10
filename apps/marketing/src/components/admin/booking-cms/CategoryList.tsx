"use client";

import { useMemo, useState } from "react";
import { GripVertical, Search, Plus, Package } from "lucide-react";
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
import type { Service, ServiceCategory } from "@/hooks/useServices";
import { resolveBookingVisibility } from "@/hooks/useServices";
import VisibilityPill from "./VisibilityPill";
import { NAVY, ORANGE, SURFACE, BORDER } from "./tokens";

type Group = "regular" | "featured";

export default function CategoryList({
  categories,
  services,
  selectedId,
  onSelect,
  onAddClick,
  onReorder,
}: {
  categories: ServiceCategory[];
  services: Service[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddClick: (kind: Group) => void;
  onReorder: (kind: Group, orderedIds: string[]) => Promise<void> | void;
}) {
  const [filter, setFilter] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const filtered = useMemo(
    () =>
      categories.filter((c) =>
        c.name.toLowerCase().includes(filter.toLowerCase())
      ),
    [categories, filter]
  );

  const featured = filtered.filter((c) => c.isFeatured);
  const regular = filtered.filter((c) => !c.isFeatured);

  const serviceCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of services) {
      map.set(s.category, (map.get(s.category) ?? 0) + 1);
    }
    return map;
  }, [services]);

  function handleDragEnd(kind: Group) {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const list = kind === "featured" ? featured : regular;
      const oldIndex = list.findIndex((c) => c.id === active.id);
      const newIndex = list.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(list, oldIndex, newIndex);
      onReorder(
        kind,
        next.map((c) => c.id)
      );
    };
  }

  return (
    <div
      className="bg-white rounded-xl border self-start"
      style={{ borderColor: BORDER }}
    >
      <div className="p-3 border-b" style={{ borderColor: BORDER }}>
        <div
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg border"
          style={{ background: SURFACE, borderColor: BORDER }}
        >
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter categories..."
            className="flex-1 bg-transparent text-[12px] text-gray-700 placeholder:text-gray-400 outline-none"
          />
        </div>
      </div>

      <div className="p-2 max-h-[640px] overflow-y-auto">
        {featured.length > 0 && (
          <>
            <div className="flex items-center justify-between px-2 pt-2 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Package className="w-3 h-3" style={{ color: ORANGE }} />
                <span
                  className="text-[9.5px] font-bold tracking-widest uppercase"
                  style={{ color: ORANGE }}
                >
                  Featured Blocks
                </span>
              </div>
              <span className="text-[9.5px] text-gray-400">pinned to top</span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd("featured")}
            >
              <SortableContext
                items={featured.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {featured.map((c) => (
                  <CategoryRow
                    key={c.id}
                    category={c}
                    serviceCount={serviceCountByCategory.get(c.name) ?? 0}
                    selected={selectedId === c.id}
                    onSelect={() => onSelect(c.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <button
              type="button"
              onClick={() => onAddClick("featured")}
              className="w-full mt-1 mb-3 py-1.5 text-[11.5px] font-semibold rounded-lg border border-dashed hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
              style={{ borderColor: "rgba(224,123,45,0.3)", color: ORANGE }}
            >
              <Plus className="w-3 h-3" />
              Add featured block
            </button>
          </>
        )}

        <div className="flex items-center justify-between px-2 pt-2 pb-1.5 mt-1">
          <span className="text-[9.5px] font-bold tracking-widest uppercase text-gray-500">
            Categories
          </span>
          <span className="text-[9.5px] text-gray-400">drag to reorder</span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd("regular")}
        >
          <SortableContext
            items={regular.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {regular.map((c) => (
              <CategoryRow
                key={c.id}
                category={c}
                serviceCount={serviceCountByCategory.get(c.name) ?? 0}
                selected={selectedId === c.id}
                onSelect={() => onSelect(c.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {regular.length === 0 && filter.trim() !== "" && (
          <div className="px-2 py-4 text-[11.5px] text-gray-400 text-center">
            No categories match.
          </div>
        )}

        <button
          type="button"
          onClick={() => onAddClick("regular")}
          className="w-full mt-2 py-2 text-[12px] font-semibold rounded-lg border border-dashed text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
          style={{ borderColor: BORDER }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add category
        </button>

        {featured.length === 0 && (
          <button
            type="button"
            onClick={() => onAddClick("featured")}
            className="w-full mt-2 py-2 text-[12px] font-semibold rounded-lg border border-dashed hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
            style={{ borderColor: "rgba(224,123,45,0.3)", color: ORANGE }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add featured block
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  serviceCount,
  selected,
  onSelect,
}: {
  category: ServiceCategory;
  serviceCount: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  const visibility = resolveBookingVisibility(category);
  const isFeatured = !!category.isFeatured;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: selected
      ? isFeatured
        ? "rgba(224,123,45,0.08)"
        : "rgba(11,32,64,0.04)"
      : isFeatured
      ? "rgba(224,123,45,0.025)"
      : "transparent",
    borderColor: selected
      ? isFeatured
        ? "rgba(224,123,45,0.3)"
        : "rgba(11,32,64,0.18)"
      : isFeatured
      ? "rgba(224,123,45,0.15)"
      : "transparent",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className="group flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer transition mb-0.5 border"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
      </button>

      {isFeatured && (
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(224,123,45,0.1)" }}
        >
          <Package className="w-3 h-3" style={{ color: ORANGE }} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div
          className="text-[13px] font-semibold truncate"
          style={{ color: selected ? NAVY : "#1f2937" }}
        >
          {category.name}
        </div>
        <div className="text-[10.5px] text-gray-500 truncate mt-0.5">
          {isFeatured
            ? `${serviceCount} item${serviceCount !== 1 ? "s" : ""} · ${
                category.featuredSubtitle || "No subtitle"
              }`
            : `$${category.startingAt || 0} · ${serviceCount} service${
                serviceCount !== 1 ? "s" : ""
              }`}
        </div>
      </div>

      <VisibilityPill value={visibility} />
    </div>
  );
}
