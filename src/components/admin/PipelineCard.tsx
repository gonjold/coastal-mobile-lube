"use client";

interface PipelineRow {
  label: string;
  count: number;
  dotColor: string;
  amount?: string;
}

export default function PipelineCard({
  title,
  accentColor,
  rows,
  actionLabel,
  onAction,
  total,
}: {
  title: string;
  accentColor: string;
  rows: PipelineRow[];
  actionLabel: string;
  onAction: () => void;
  total: number;
}) {
  // Simple sparkline placeholder data
  const sparkData = [3, 5, 2, 7, 4, 6, 5];
  const max = Math.max(...sparkData);
  const h = 24;
  const w = 100; // percentage-based, SVG viewBox
  const points = sparkData
    .map((v, i) => `${(i / (sparkData.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 relative overflow-hidden flex-1">
      {/* 3px accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header row */}
      <div className="flex justify-between items-baseline mb-3.5">
        <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-[0.04em]">
          {title}
        </span>
        <span className="text-[28px] font-bold text-[#0B2040]">{total}</span>
      </div>

      {/* Sub-status rows */}
      <div className="flex flex-col gap-1.5 mb-3.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-[#F7F8FA] cursor-pointer hover:bg-[#EEF0F4] transition"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-[7px] h-[7px] rounded-full"
                style={{ backgroundColor: row.dotColor }}
              />
              <span className="text-[13px] text-[#0B2040] font-medium">
                {row.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {row.amount && (
                <span className="text-xs text-gray-500">{row.amount}</span>
              )}
              <span className="text-sm font-semibold text-[#0B2040] min-w-[20px] text-right">
                {row.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Sparkline area */}
      <div className="mb-3">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full"
          style={{ height: 24 }}
          preserveAspectRatio="none"
        >
          <polyline
            points={points}
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <p className="text-[10px] text-gray-500">Last 7 days</p>
      </div>

      {/* Action button */}
      <button
        onClick={onAction}
        className="w-full py-2 rounded-lg border border-gray-200 text-[13px] font-semibold cursor-pointer transition"
        style={{
          color: accentColor,
          backgroundColor: "transparent",
          borderColor: undefined,
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget;
          btn.style.backgroundColor = accentColor;
          btn.style.color = "#fff";
          btn.style.borderColor = accentColor;
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget;
          btn.style.backgroundColor = "transparent";
          btn.style.color = accentColor;
          btn.style.borderColor = "";
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}
