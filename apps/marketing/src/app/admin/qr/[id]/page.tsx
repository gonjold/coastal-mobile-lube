"use client";

import { use, useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminBadge from "@/components/admin/AdminBadge";
import ToastContainer, { type ToastItem } from "../../Toast";
import {
  buildPublicUrl,
  deviceFromUA,
  relativeTime,
  truncate,
  type QRCodeDoc,
  type QRScanDoc,
} from "../shared";
import { buildQRForPreview, generateQR } from "@/lib/qr/generate";
import { DEFAULT_QR_STYLE, type QRStyleConfig } from "@/lib/qr/types";
import PresetSelector from "@/components/qr/PresetSelector";
import AdvancedStylePanel from "@/components/qr/AdvancedStylePanel";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[260px] text-sm text-gray-400">
      Loading chart...
    </div>
  ),
});

export default function QRDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [code, setCode] = useState<QRCodeDoc | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [scans, setScans] = useState<QRScanDoc[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingDest, setEditingDest] = useState(false);
  const [destDraft, setDestDraft] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [styleOpen, setStyleOpen] = useState(false);
  const [styleDraft, setStyleDraft] = useState<QRStyleConfig>(DEFAULT_QR_STYLE);
  const [savingStyle, setSavingStyle] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  function addToast(message: string, type: "success" | "info" = "success") {
    const tid = crypto.randomUUID();
    setToasts((prev) => [...prev, { id: tid, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== tid)),
      3000,
    );
  }
  function removeToast(tid: string) {
    setToasts((prev) => prev.filter((t) => t.id !== tid));
  }

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "qrCodes", id),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        const data = { id: snap.id, ...snap.data() } as QRCodeDoc;
        setCode(data);
        if (!editingName) setNameDraft(data.name);
        if (!editingDest) setDestDraft(data.destination);
        if (!styleOpen) setStyleDraft(data.styleConfig ?? DEFAULT_QR_STYLE);
      },
      () => setNotFound(true),
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!code?.slug) return;
    const q = query(
      collection(db, "qrScans"),
      where("slug", "==", code.slug),
      orderBy("scannedAt", "desc"),
      limit(500),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setScans(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as QRScanDoc),
        );
      },
      () => {},
    );
    return () => unsub();
  }, [code?.slug]);

  useEffect(() => {
    if (!code || !previewRef.current) return;
    const node = previewRef.current;
    node.innerHTML = "";
    const qr = buildQRForPreview({
      url: buildPublicUrl(code.slug),
      logoUrl: code.logoUrl || undefined,
      size: 400,
      style: styleDraft,
    });
    qr.append(node);
    return () => {
      node.innerHTML = "";
    };
  }, [code, styleDraft]);

  const publicUrl = code ? buildPublicUrl(code.slug) : "";

  const stats = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400_000;
    const sevenDaysAgo = now - 7 * dayMs;
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const todayMs = startToday.getTime();

    let thisWeek = 0;
    let today = 0;
    scans.forEach((s) => {
      const t = s.scannedAt?.toDate?.().getTime();
      if (!t) return;
      if (t >= sevenDaysAgo) thisWeek += 1;
      if (t >= todayMs) today += 1;
    });

    return {
      total: code?.scanCount || scans.length,
      thisWeek,
      today,
      last: code?.lastScannedAt?.toDate?.(),
    };
  }, [scans, code]);

  const lineOption = useMemo(() => {
    const days: string[] = [];
    const counts: number[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const buckets = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push(
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      );
      buckets.set(key, 0);
    }
    scans.forEach((s) => {
      const dt = s.scannedAt?.toDate?.();
      if (!dt) return;
      const key = dt.toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    buckets.forEach((v) => counts.push(v));
    return {
      grid: { top: 20, right: 20, bottom: 30, left: 36 },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: days,
        axisLine: { lineStyle: { color: "#E5E7EB" } },
        axisLabel: { color: "#6B7280", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#F3F4F6" } },
        axisLabel: { color: "#6B7280", fontSize: 11 },
      },
      series: [
        {
          type: "line",
          smooth: true,
          data: counts,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { color: "#0B2040", width: 2 },
          itemStyle: { color: "#0B2040" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(11,32,64,0.15)" },
                { offset: 1, color: "rgba(11,32,64,0)" },
              ],
            },
          },
        },
      ],
    };
  }, [scans]);

  const pieOption = useMemo(() => {
    const counts: Record<"iOS" | "Android" | "Desktop" | "Other", number> = {
      iOS: 0,
      Android: 0,
      Desktop: 0,
      Other: 0,
    };
    scans.forEach((s) => {
      counts[deviceFromUA(s.userAgent || "")] += 1;
    });
    const data = [
      { name: "iOS", value: counts.iOS, itemStyle: { color: "#0B2040" } },
      { name: "Android", value: counts.Android, itemStyle: { color: "#E07B2D" } },
      { name: "Desktop", value: counts.Desktop, itemStyle: { color: "#6B7280" } },
      { name: "Other", value: counts.Other, itemStyle: { color: "#D1D5DB" } },
    ].filter((d) => d.value > 0);
    return {
      tooltip: { trigger: "item" },
      legend: {
        orient: "vertical",
        right: 0,
        top: "center",
        textStyle: { color: "#6B7280", fontSize: 12 },
      },
      series: [
        {
          type: "pie",
          radius: ["55%", "80%"],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          data,
        },
      ],
    };
  }, [scans]);

  async function saveName() {
    if (!code) return;
    const v = nameDraft.trim();
    if (!v || v === code.name) {
      setEditingName(false);
      return;
    }
    try {
      await updateDoc(doc(db, "qrCodes", code.id), {
        name: v,
        updatedAt: serverTimestamp(),
      });
      setEditingName(false);
      addToast("Name updated");
    } catch {
      addToast("Failed to update name", "info");
    }
  }

  async function saveDestination() {
    if (!code) return;
    const v = destDraft.trim();
    if (!v || v === code.destination) {
      setEditingDest(false);
      return;
    }
    try {
      new URL(v);
    } catch {
      addToast("Invalid URL", "info");
      return;
    }
    try {
      await updateDoc(doc(db, "qrCodes", code.id), {
        destination: v,
        updatedAt: serverTimestamp(),
      });
      setEditingDest(false);
      addToast("Destination updated");
    } catch {
      addToast("Failed to update destination", "info");
    }
  }

  async function toggleActive() {
    if (!code) return;
    try {
      await updateDoc(doc(db, "qrCodes", code.id), {
        active: !code.active,
        updatedAt: serverTimestamp(),
      });
      addToast(code.active ? "Paused" : "Resumed");
    } catch {
      addToast("Failed to update", "info");
    }
  }

  async function copyUrl() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      addToast("URL copied");
    } catch {
      addToast("Failed to copy", "info");
    }
  }

  async function downloadFormat(format: "png" | "svg") {
    if (!code) return;
    try {
      const { png, svg } = await generateQR({
        url: publicUrl,
        logoUrl: code.logoUrl || undefined,
        size: 1200,
        style: code.styleConfig ?? DEFAULT_QR_STYLE,
      });
      if (format === "png") {
        const url = URL.createObjectURL(png);
        const a = document.createElement("a");
        a.href = url;
        a.download = `coastal-qr-${code.slug}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `coastal-qr-${code.slug}.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      addToast(`${format.toUpperCase()} downloaded`);
    } catch {
      addToast("Failed to download", "info");
    }
  }

  async function saveStyle() {
    if (!code) return;
    setSavingStyle(true);
    try {
      await updateDoc(doc(db, "qrCodes", code.id), {
        styleConfig: styleDraft,
        updatedAt: serverTimestamp(),
      });
      addToast("Style saved");
    } catch {
      addToast("Failed to save style", "info");
    } finally {
      setSavingStyle(false);
    }
  }

  function resetStyleToDefault() {
    setStyleDraft(DEFAULT_QR_STYLE);
  }

  async function handleDelete() {
    if (!code) return;
    try {
      await deleteDoc(doc(db, "qrCodes", code.id));
      router.push("/admin/qr");
    } catch {
      addToast("Failed to delete", "info");
    }
  }

  if (notFound) {
    return (
      <>
        <AdminTopBar title="QR Code" />
        <div className="px-8 py-16 text-center">
          <p className="text-sm text-gray-500">
            This QR code does not exist or was deleted.
          </p>
          <button
            onClick={() => router.push("/admin/qr")}
            className="mt-4 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-[#1A5FAC] cursor-pointer hover:bg-gray-50 transition"
          >
            Back to QR Codes
          </button>
        </div>
      </>
    );
  }

  if (!code) {
    return (
      <>
        <AdminTopBar title="QR Code" />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminTopBar title={code.name} subtitle={publicUrl} />

      <div className="px-8 py-6 max-w-[1400px] mx-auto flex flex-col gap-6">
        {/* ── Header: QR + metadata ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 bg-white rounded-xl border border-gray-200 p-6">
          <div
            ref={previewRef}
            className="w-[280px] h-[280px] flex items-center justify-center bg-white self-start"
          />

          <div className="flex flex-col gap-4 min-w-0">
            <div>
              <span className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Name
              </span>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") {
                        setNameDraft(code.name);
                        setEditingName(false);
                      }
                    }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-lg font-bold text-[#0B2040] outline-none focus:border-[#1A5FAC]"
                    autoFocus
                  />
                  <button
                    onClick={saveName}
                    className="px-3 py-1.5 bg-[#E07B2D] text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-[#CC6A1F]"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-left text-xl font-bold text-[#0B2040] hover:bg-gray-50 rounded-md px-1 -mx-1 transition cursor-pointer"
                >
                  {code.name}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Slug
                </span>
                <span className="text-sm font-mono text-gray-700">
                  {code.slug}
                </span>
              </div>
              {code.campaign && (
                <div>
                  <span className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Campaign
                  </span>
                  <AdminBadge label={code.campaign} variant="blue" />
                </div>
              )}
              <div>
                <span className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Status
                </span>
                <button
                  onClick={toggleActive}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                    code.active
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      code.active ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                  {code.active ? "Active" : "Paused"}
                </button>
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Destination
              </span>
              {editingDest ? (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={destDraft}
                    onChange={(e) => setDestDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveDestination();
                      if (e.key === "Escape") {
                        setDestDraft(code.destination);
                        setEditingDest(false);
                      }
                    }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#1A5FAC]"
                    autoFocus
                  />
                  <button
                    onClick={saveDestination}
                    className="px-3 py-1.5 bg-[#E07B2D] text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-[#CC6A1F]"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingDest(true)}
                  className="text-left text-sm text-gray-700 hover:bg-gray-50 rounded-md px-1 -mx-1 transition cursor-pointer break-all"
                >
                  {code.destination}
                </button>
              )}
            </div>

            <div>
              <span className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Public URL
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-gray-700 break-all">
                  {publicUrl}
                </span>
                <button
                  onClick={copyUrl}
                  className="shrink-0 px-3 py-1 rounded-md border border-gray-200 text-xs font-semibold text-[#1A5FAC] cursor-pointer hover:bg-gray-50 transition"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Scans" value={String(stats.total)} />
          <StatCard label="Scans This Week" value={String(stats.thisWeek)} />
          <StatCard label="Scans Today" value={String(stats.today)} />
          <StatCard
            label="Last Scanned"
            value={relativeTime(stats.last)}
            small
          />
        </div>

        {/* ── Style section ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setStyleOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
          >
            <div className="text-left">
              <h3 className="text-[13px] font-bold text-[#0B2040]">Style</h3>
              <p className="text-xs text-gray-500">
                Customize the visual look. Style changes don't affect
                scanability, but always test a fresh print before distributing.
              </p>
            </div>
            <span className="text-gray-400 text-xs font-semibold">
              {styleOpen ? "Hide" : "Edit"}
            </span>
          </button>
          {styleOpen && (
            <div className="border-t border-gray-200 px-5 py-5 flex flex-col gap-5">
              <PresetSelector value={styleDraft} onChange={setStyleDraft} />
              <AdvancedStylePanel
                value={styleDraft}
                onChange={setStyleDraft}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveStyle}
                  disabled={savingStyle}
                  className="px-4 py-2 rounded-lg bg-[#0B2040] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#0a1a36] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingStyle ? "Saving..." : "Save Style"}
                </button>
                <button
                  type="button"
                  onClick={resetStyleToDefault}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 transition"
                >
                  Reset to Coastal Brand
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[13px] font-bold text-[#0B2040] mb-1">
              Scans per day
            </h3>
            <p className="text-xs text-gray-500 mb-2">Last 30 days</p>
            <ReactECharts
              option={lineOption}
              style={{ height: 260, width: "100%" }}
              notMerge
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-[13px] font-bold text-[#0B2040] mb-1">
              Device breakdown
            </h3>
            <p className="text-xs text-gray-500 mb-2">All-time</p>
            {scans.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-sm text-gray-400">
                No scans yet
              </div>
            ) : (
              <ReactECharts
                option={pieOption}
                style={{ height: 260, width: "100%" }}
                notMerge
              />
            )}
          </div>
        </div>

        {/* ── Recent scans ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-[13px] font-bold text-[#0B2040]">
              Recent scans
            </h3>
            <p className="text-xs text-gray-500">Last {Math.min(scans.length, 50)}</p>
          </div>
          {scans.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              No scans yet.
            </div>
          ) : (
            <>
              <div
                className="grid bg-gray-50 px-5 py-3 border-b border-gray-200"
                style={{
                  gridTemplateColumns: "1fr 1fr 1.5fr 2fr",
                }}
              >
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Time
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Device
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Location
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Referrer
                </span>
              </div>
              {scans.slice(0, 50).map((s) => (
                <div
                  key={s.id}
                  className="grid items-center px-5 py-2.5 border-b border-gray-200 last:border-b-0"
                  style={{ gridTemplateColumns: "1fr 1fr 1.5fr 2fr" }}
                >
                  <span className="text-[13px] text-gray-700">
                    {relativeTime(s.scannedAt?.toDate?.())}
                  </span>
                  <span className="text-[13px] text-gray-700">
                    {deviceFromUA(s.userAgent || "")}
                  </span>
                  <span className="text-[13px] text-gray-700 truncate">
                    {[s.city, s.region, s.country].filter(Boolean).join(", ") ||
                      "Unknown"}
                  </span>
                  <span
                    className="text-[13px] text-gray-500 font-mono truncate"
                    title={s.referrer || ""}
                  >
                    {s.referrer ? truncate(s.referrer, 56) : "Direct"}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Actions bar ── */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-wrap gap-3">
          <button
            onClick={() => downloadFormat("png")}
            className="px-4 py-2 rounded-lg bg-[#0B2040] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#0a1a36] transition"
          >
            Download PNG
          </button>
          <button
            onClick={() => downloadFormat("svg")}
            className="px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-semibold text-[#0B2040] cursor-pointer hover:bg-gray-50 transition"
          >
            Download SVG
          </button>
          <button
            onClick={toggleActive}
            className="px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-semibold text-[#0B2040] cursor-pointer hover:bg-gray-50 transition"
          >
            {code.active ? "Pause" : "Resume"}
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="ml-auto px-4 py-2 rounded-lg border border-red-200 text-[13px] font-semibold text-red-600 cursor-pointer hover:bg-red-50 transition"
          >
            Delete
          </button>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 bg-black/30 z-[80] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-[400px] mx-4 p-6">
            <h3 className="text-lg font-bold text-[#0B2040]">Delete QR Code</h3>
            <p className="text-sm text-gray-500 mt-2">
              Delete <strong>{code.name}</strong>? The short URL
              <span className="font-mono text-[12px]"> /q/{code.slug}</span>{" "}
              will stop redirecting. Scan history is retained.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 rounded-lg py-2.5 text-sm font-semibold text-white cursor-pointer hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

function StatCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={`font-bold text-[#0B2040] ${small ? "text-lg" : "text-3xl"}`}
      >
        {value}
      </p>
    </div>
  );
}
