"use client";

import { useState } from "react";
import {
  DOT_STYLE_LABELS,
  type DotStyle,
  type QRStyleConfig,
} from "@/lib/qr/types";

interface AdvancedStylePanelProps {
  value: QRStyleConfig;
  onChange: (config: QRStyleConfig) => void;
}

const DOT_STYLES: DotStyle[] = [
  "rounded",
  "dots",
  "square",
  "classy-rounded",
  "extra-rounded",
];

export default function AdvancedStylePanel({
  value,
  onChange,
}: AdvancedStylePanelProps) {
  const [open, setOpen] = useState(false);

  function patch(partial: Partial<QRStyleConfig>) {
    onChange({ ...value, ...partial, preset: "custom" });
  }

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-semibold text-[#0B2040] cursor-pointer hover:bg-gray-50 transition"
      >
        <span>Advanced</span>
        <span className="text-gray-400 text-xs">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="px-3.5 py-3 border-t border-gray-200 flex flex-col gap-3">
          <ColorRow
            label="Dot color"
            value={value.dotColor}
            onChange={(v) => patch({ dotColor: v })}
          />
          <ColorRow
            label="Corner color"
            value={value.cornerColor}
            onChange={(v) => patch({ cornerColor: v })}
          />
          <ColorRow
            label="Background"
            value={value.backgroundColor}
            onChange={(v) => patch({ backgroundColor: v })}
          />
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Dot style
            </label>
            <select
              value={value.dotStyle}
              onChange={(e) =>
                patch({ dotStyle: e.target.value as DotStyle })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#1A5FAC] transition-colors bg-white"
            >
              {DOT_STYLES.map((s) => (
                <option key={s} value={s}>
                  {DOT_STYLE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#0B2040]">
              Show logo
            </span>
            <button
              type="button"
              onClick={() => patch({ showLogo: !value.showLogo })}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                value.showLogo ? "bg-[#0B2040]" : "bg-gray-300"
              }`}
              aria-pressed={value.showLogo}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  value.showLogo ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 border border-gray-200 rounded-lg cursor-pointer bg-white p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-mono outline-none focus:border-[#1A5FAC] transition-colors"
        />
      </div>
    </div>
  );
}
