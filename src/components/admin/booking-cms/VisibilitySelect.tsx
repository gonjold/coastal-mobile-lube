import { ChevronDown } from "lucide-react";
import type { BookingVisibility } from "@/hooks/useServices";
import { NAVY, BORDER } from "./tokens";

export default function VisibilitySelect({
  value,
  onChange,
  dense = false,
}: {
  value: BookingVisibility;
  onChange: (next: BookingVisibility) => void;
  dense?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BookingVisibility)}
        className="appearance-none pr-7 pl-2.5 py-1.5 text-[12px] font-semibold rounded-md border bg-white cursor-pointer outline-none focus:ring-2 focus:ring-offset-0"
        style={{
          borderColor: BORDER,
          color: NAVY,
          minWidth: dense ? 140 : 150,
        }}
      >
        <option value="inline">Inline</option>
        <option value="searchable">Searchable only</option>
        <option value="hidden">Hidden</option>
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
    </div>
  );
}
