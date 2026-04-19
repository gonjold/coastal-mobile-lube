"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
} from "firebase/firestore";
import AdminTopBar from "@/components/admin/AdminTopBar";
import ToastContainer, { type ToastItem } from "../../Toast";
import { buildPublicUrl, type QRCodeDoc } from "../shared";
import {
  generateSlug,
  isSlugAvailable,
  isValidSlug,
} from "@/lib/qr/slugs";
import { generateQR, buildQRForPreview } from "@/lib/qr/generate";
import { DEFAULT_QR_STYLE, type QRStyleConfig } from "@/lib/qr/types";
import PresetSelector from "@/components/qr/PresetSelector";
import AdvancedStylePanel from "@/components/qr/AdvancedStylePanel";

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function isValidHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export default function NewQRCodePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [destination, setDestination] = useState("");
  const [campaign, setCampaign] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [styleConfig, setStyleConfig] = useState<QRStyleConfig>(DEFAULT_QR_STYLE);
  const [saving, setSaving] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [existingCampaigns, setExistingCampaigns] = useState<string[]>([]);
  const [showCampaignSuggest, setShowCampaignSuggest] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addToast(message: string, type: "success" | "info" = "success") {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000,
    );
  }
  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    (async () => {
      const snap = await getDocs(query(collection(db, "qrCodes")));
      const set = new Set<string>();
      snap.forEach((d) => {
        const c = (d.data() as QRCodeDoc).campaign;
        if (c) set.add(c);
      });
      setExistingCampaigns([...set].sort());
    })().catch(() => {});
  }, []);

  useEffect(() => {
    if (!slugEdited) {
      setSlug(generateSlug(name));
    }
  }, [name, slugEdited]);

  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    if (!isValidSlug(slug)) {
      setSlugStatus("invalid");
      return;
    }
    setSlugStatus("checking");
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const ok = await isSlugAvailable(slug);
        if (!cancelled) setSlugStatus(ok ? "available" : "taken");
      } catch {
        if (!cancelled) setSlugStatus("idle");
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  const previewUrl = useMemo(
    () => (slug ? buildPublicUrl(slug) : "https://go.coastalmobilelube.com/q/..."),
    [slug],
  );

  useEffect(() => {
    if (!previewRef.current) return;
    const node = previewRef.current;
    node.innerHTML = "";
    const qr = buildQRForPreview({
      url: previewUrl,
      logoUrl: logoDataUrl || undefined,
      size: 280,
      style: styleConfig,
    });
    qr.append(node);
    return () => {
      node.innerHTML = "";
    };
  }, [previewUrl, logoDataUrl, styleConfig]);

  async function handleLogoUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") setLogoDataUrl(result);
    };
    reader.readAsDataURL(file);
  }

  const slugHint = (() => {
    switch (slugStatus) {
      case "checking":
        return { text: "Checking...", color: "text-gray-500" };
      case "available":
        return { text: "Available", color: "text-emerald-600" };
      case "taken":
        return { text: "Already taken", color: "text-red-600" };
      case "invalid":
        return {
          text: "Use lowercase letters, numbers, dashes (2-32 chars)",
          color: "text-red-600",
        };
      default:
        return null;
    }
  })();

  const canSubmit =
    name.trim().length > 0 &&
    slugStatus === "available" &&
    isValidHttpsUrl(destination) &&
    !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "qrCodes"), {
        slug,
        name: name.trim(),
        destination: destination.trim(),
        campaign: campaign.trim() || null,
        active: true,
        logoUrl: logoDataUrl || null,
        styleConfig,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || null,
        scanCount: 0,
        lastScannedAt: null,
      });

      const { png } = await generateQR({
        url: buildPublicUrl(slug),
        logoUrl: logoDataUrl || undefined,
        size: 1200,
        style: styleConfig,
      });
      const url = URL.createObjectURL(png);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coastal-qr-${slug}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      router.push(`/admin/qr/${docRef.id}`);
    } catch {
      addToast("Failed to create QR code", "info");
      setSaving(false);
    }
  }

  const filteredCampaigns = existingCampaigns.filter(
    (c) =>
      campaign.length > 0 &&
      c.toLowerCase().includes(campaign.toLowerCase()) &&
      c.toLowerCase() !== campaign.toLowerCase(),
  );

  return (
    <>
      <AdminTopBar title="New QR Code" subtitle="Create a branded short link" />

      <div className="px-8 py-6 max-w-[1100px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* ── Form ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Style preset
                </label>
                <PresetSelector value={styleConfig} onChange={setStyleConfig} />
              </div>

              <AdvancedStylePanel value={styleConfig} onChange={setStyleConfig} />

              <div className="h-px bg-gray-100" />

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Van Wrap - Jason's Truck"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugEdited(true);
                  }}
                  placeholder="van-wrap-jason"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm font-mono outline-none focus:border-[#1A5FAC] transition-colors"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] font-mono text-gray-500">
                    {previewUrl}
                  </span>
                  {slugHint && (
                    <span className={`text-[11px] font-semibold ${slugHint.color}`}>
                      {slugHint.text}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Destination URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="https://coastalmobilelube.com/book"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors"
                />
                {destination && !isValidHttpsUrl(destination) && (
                  <p className="text-[11px] text-red-600 mt-1.5">
                    Must be a full URL starting with https://
                  </p>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Campaign (optional)
                </label>
                <input
                  type="text"
                  value={campaign}
                  onChange={(e) => {
                    setCampaign(e.target.value);
                    setShowCampaignSuggest(true);
                  }}
                  onFocus={() => setShowCampaignSuggest(true)}
                  onBlur={() =>
                    setTimeout(() => setShowCampaignSuggest(false), 150)
                  }
                  placeholder="spring-2026"
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors"
                />
                {showCampaignSuggest && filteredCampaigns.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[40]">
                    {filteredCampaigns.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCampaign(c);
                          setShowCampaignSuggest(false);
                        }}
                        className="block w-full text-left px-3.5 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Custom Logo (optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(f);
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                  >
                    {logoDataUrl ? "Change logo" : "Upload logo"}
                  </button>
                  {logoDataUrl && (
                    <button
                      onClick={() => setLogoDataUrl(null)}
                      className="text-[12px] text-gray-500 cursor-pointer hover:text-gray-700"
                    >
                      Use Coastal default
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Empty uses the Coastal logo.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
              <button
                onClick={() => router.push("/admin/qr")}
                className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-5 py-2.5 bg-[#E07B2D] rounded-lg text-sm font-semibold text-white cursor-pointer hover:bg-[#CC6A1F] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Creating..." : "Create & Download PNG"}
              </button>
            </div>
          </div>

          {/* ── Preview ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center h-fit">
            <h3 className="text-sm font-bold text-[#0B2040] self-start mb-4">
              Live Preview
            </h3>
            <div
              ref={previewRef}
              className="w-[280px] h-[280px] flex items-center justify-center bg-white"
            />
            <p className="text-[11px] font-mono text-gray-500 mt-4 text-center break-all">
              {previewUrl}
            </p>
            <p className="text-[10px] text-gray-400 mt-3 text-center">
              Preview only. Final PNG downloads at 1200x1200.
            </p>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
