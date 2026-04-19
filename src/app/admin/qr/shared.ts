import type { Timestamp } from "firebase/firestore";

export interface QRCodeDoc {
  id: string;
  slug: string;
  name: string;
  destination: string;
  campaign?: string | null;
  active: boolean;
  logoUrl?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  scanCount?: number;
  lastScannedAt?: Timestamp | null;
}

export interface QRScanDoc {
  id: string;
  slug: string;
  qrCodeId: string;
  scannedAt?: Timestamp;
  userAgent: string;
  referrer: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  ipHash: string | null;
}

export function relativeTime(date: Date | null | undefined): string {
  if (!date) return "Never";
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.round(mo / 12);
  return `${yr}y ago`;
}

export function deviceFromUA(ua: string): "iOS" | "Android" | "Desktop" | "Other" {
  const s = ua.toLowerCase();
  if (/iphone|ipad|ipod/.test(s)) return "iOS";
  if (/android/.test(s)) return "Android";
  if (/windows|macintosh|linux|x11/.test(s)) return "Desktop";
  return "Other";
}

export const PUBLIC_REDIRECT_BASE = "https://go.coastalmobilelube.com";

export function buildPublicUrl(slug: string): string {
  return `${PUBLIC_REDIRECT_BASE}/q/${slug}`;
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "\u2026";
}
