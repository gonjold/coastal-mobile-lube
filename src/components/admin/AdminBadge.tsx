"use client";

const VARIANTS: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  gray: "bg-gray-100 text-gray-600",
  blue: "bg-blue-100 text-blue-700",
  teal: "bg-teal-100 text-teal-700",
};

export default function AdminBadge({
  label,
  variant = "gray",
}: {
  label: string;
  variant?: "green" | "red" | "amber" | "gray" | "blue" | "teal";
}) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-wide ${
        VARIANTS[variant] ?? VARIANTS.gray
      }`}
    >
      {label}
    </span>
  );
}
