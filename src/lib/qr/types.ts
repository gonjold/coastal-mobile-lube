export type DotStyle =
  | "rounded"
  | "dots"
  | "square"
  | "classy-rounded"
  | "extra-rounded";

export type QRPreset =
  | "coastal-brand"
  | "classic"
  | "minimal"
  | "inverted"
  | "custom";

export interface QRStyleConfig {
  preset: QRPreset;
  dotColor: string;
  cornerColor: string;
  backgroundColor: string;
  dotStyle: DotStyle;
  showLogo: boolean;
}

export const DEFAULT_QR_STYLE: QRStyleConfig = {
  preset: "coastal-brand",
  dotColor: "#0B2040",
  cornerColor: "#E07B2D",
  backgroundColor: "#FFFFFF",
  dotStyle: "rounded",
  showLogo: true,
};

export const QR_PRESETS: Record<Exclude<QRPreset, "custom">, QRStyleConfig> = {
  "coastal-brand": {
    preset: "coastal-brand",
    dotColor: "#0B2040",
    cornerColor: "#E07B2D",
    backgroundColor: "#FFFFFF",
    dotStyle: "rounded",
    showLogo: true,
  },
  classic: {
    preset: "classic",
    dotColor: "#0B2040",
    cornerColor: "#0B2040",
    backgroundColor: "#FFFFFF",
    dotStyle: "rounded",
    showLogo: true,
  },
  minimal: {
    preset: "minimal",
    dotColor: "#0B2040",
    cornerColor: "#0B2040",
    backgroundColor: "#FFFFFF",
    dotStyle: "square",
    showLogo: false,
  },
  inverted: {
    preset: "inverted",
    dotColor: "#FFFFFF",
    cornerColor: "#E07B2D",
    backgroundColor: "#0B2040",
    dotStyle: "rounded",
    showLogo: true,
  },
};

export const PRESET_LABELS: Record<Exclude<QRPreset, "custom">, string> = {
  "coastal-brand": "Coastal Brand",
  classic: "Classic",
  minimal: "Minimal",
  inverted: "Inverted",
};

export const PRESET_DESCRIPTIONS: Record<Exclude<QRPreset, "custom">, string> =
  {
    "coastal-brand": "Navy dots with orange corners and Coastal logo",
    classic: "All navy with logo. Clean and professional",
    minimal: "All navy, no logo. Best for small print and high scan distance",
    inverted: "White on navy. For dark backgrounds and signage",
  };

export const DOT_STYLE_LABELS: Record<DotStyle, string> = {
  rounded: "Rounded",
  dots: "Dots",
  square: "Square",
  "classy-rounded": "Classy Rounded",
  "extra-rounded": "Extra Rounded",
};
