"use client";

function escapeCSV(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function AdminCSVExport({
  data,
  filename,
}: {
  data: Record<string, unknown>[];
  filename: string;
}) {
  function handleExport() {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => escapeCSV(row[h])).join(",")
    );
    const csv = [headers.map(escapeCSV).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-500 hover:bg-gray-50 transition cursor-pointer"
    >
      Export CSV
    </button>
  );
}
