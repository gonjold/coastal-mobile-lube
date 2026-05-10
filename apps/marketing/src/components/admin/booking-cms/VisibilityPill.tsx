import { LayoutList, SearchCode, EyeOff } from "lucide-react";
import type { BookingVisibility } from "@/hooks/useServices";
import { VIS_CONFIG } from "./tokens";

const ICONS = {
  inline: LayoutList,
  searchable: SearchCode,
  hidden: EyeOff,
};

export default function VisibilityPill({
  value,
  className = "",
}: {
  value: BookingVisibility;
  className?: string;
}) {
  const conf = VIS_CONFIG[value];
  const Icon = ICONS[value];
  return (
    <span
      title={conf.description}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${conf.pillClass} ${className}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {conf.label}
    </span>
  );
}
