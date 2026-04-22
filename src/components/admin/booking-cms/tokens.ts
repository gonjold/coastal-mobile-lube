export const NAVY = "#0B2040";
export const NAVY_SOFT = "#1B3057";
export const ORANGE = "#E07B2D";
export const ORANGE_DARK = "#CC6A1F";
export const SURFACE = "#F7F8FA";
export const BORDER = "#E5E7EB";

import type { BookingVisibility } from "@/hooks/useServices";

export const VIS_CONFIG: Record<
  BookingVisibility,
  {
    label: string;
    description: string;
    pillClass: string;
  }
> = {
  inline: {
    label: "Inline",
    description: "Shown inline in booking modal",
    pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  searchable: {
    label: "Searchable only",
    description: "Findable via search, not inline",
    pillClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  hidden: {
    label: "Hidden",
    description: "Does not appear in booking modal",
    pillClass: "bg-gray-100 text-gray-600 border-gray-200",
  },
};
