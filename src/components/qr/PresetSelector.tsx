"use client";

import { useEffect, useMemo, useRef } from "react";
import { buildQRForPreview } from "@/lib/qr/generate";
import {
  QR_PRESETS,
  PRESET_LABELS,
  PRESET_DESCRIPTIONS,
  type QRStyleConfig,
} from "@/lib/qr/types";

interface PresetSelectorProps {
  value: QRStyleConfig;
  onChange: (config: QRStyleConfig) => void;
}

const PRESET_ORDER: Array<Exclude<QRStyleConfig["preset"], "custom">> = [
  "coastal-brand",
  "classic",
  "minimal",
  "inverted",
];

const THUMB_URL = "https://example.com";

export default function PresetSelector({ value, onChange }: PresetSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {PRESET_ORDER.map((preset) => (
        <PresetCard
          key={preset}
          preset={preset}
          selected={value.preset === preset}
          onSelect={() => onChange(QR_PRESETS[preset])}
        />
      ))}
    </div>
  );
}

function PresetCard({
  preset,
  selected,
  onSelect,
}: {
  preset: Exclude<QRStyleConfig["preset"], "custom">;
  selected: boolean;
  onSelect: () => void;
}) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const config = useMemo(() => QR_PRESETS[preset], [preset]);

  useEffect(() => {
    if (!thumbRef.current) return;
    const node = thumbRef.current;
    node.innerHTML = "";
    const qr = buildQRForPreview({
      url: THUMB_URL,
      size: 120,
      style: config,
    });
    qr.append(node);
    return () => {
      node.innerHTML = "";
    };
  }, [config]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition cursor-pointer text-left ${
        selected
          ? "border-2 border-[#0B2040] bg-[#F5F7FB]"
          : "border border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div
        ref={thumbRef}
        className="w-[120px] h-[120px] flex items-center justify-center"
      />
      <div className="w-full">
        <div className="text-[13px] font-bold text-[#0B2040]">
          {PRESET_LABELS[preset]}
        </div>
        <div className="text-[11px] text-gray-500 leading-snug mt-0.5">
          {PRESET_DESCRIPTIONS[preset]}
        </div>
      </div>
    </button>
  );
}
