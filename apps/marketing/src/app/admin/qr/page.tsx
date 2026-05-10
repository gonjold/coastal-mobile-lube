"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import AdminTopBar from "@/components/admin/AdminTopBar";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableRow,
  type AdminColumn,
} from "@/components/admin/AdminTable";
import AdminBadge from "@/components/admin/AdminBadge";
import ToastContainer, { type ToastItem } from "../Toast";
import {
  buildPublicUrl,
  relativeTime,
  truncate,
  type QRCodeDoc,
} from "./shared";
import { generateQR } from "@/lib/qr/generate";
import { DEFAULT_QR_STYLE } from "@/lib/qr/types";

const COLUMNS: AdminColumn[] = [
  { key: "name", label: "Name", align: "left", sortable: true },
  { key: "slug", label: "Slug", align: "left", sortable: true },
  { key: "campaign", label: "Campaign", align: "left", sortable: true },
  { key: "destination", label: "Destination", align: "left", sortable: false },
  { key: "scanCount", label: "Scans", align: "center", sortable: true },
  { key: "lastScannedAt", label: "Last Scanned", align: "left", sortable: true },
  { key: "status", label: "Status", align: "center", sortable: true },
  { key: "actions", label: "", align: "center", sortable: false },
];

const GRID = "1.4fr 1fr 1fr 1.6fr 80px 1fr 100px 40px";

export default function QRListPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<QRCodeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [actionMenuKey, setActionMenuKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QRCodeDoc | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function addToast(message: string, type: "success" | "info" = "success") {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    const q = query(collection(db, "qrCodes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCodes(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as QRCodeDoc),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!actionMenuKey) return;
    function handleClick() {
      setActionMenuKey(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [actionMenuKey]);

  const filtered = useMemo(() => {
    let list = codes;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.campaign || "").toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "slug":
          cmp = a.slug.localeCompare(b.slug);
          break;
        case "campaign":
          cmp = (a.campaign || "").localeCompare(b.campaign || "");
          break;
        case "scanCount":
          cmp = (a.scanCount || 0) - (b.scanCount || 0);
          break;
        case "lastScannedAt": {
          const at = a.lastScannedAt?.toDate?.().getTime() || 0;
          const bt = b.lastScannedAt?.toDate?.().getTime() || 0;
          cmp = at - bt;
          break;
        }
        case "status":
          cmp = Number(a.active) - Number(b.active);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [codes, search, sortKey, sortDir]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function togglePause(code: QRCodeDoc) {
    try {
      await updateDoc(doc(db, "qrCodes", code.id), {
        active: !code.active,
        updatedAt: serverTimestamp(),
      });
      addToast(code.active ? "QR code paused" : "QR code resumed");
    } catch {
      addToast("Failed to update", "info");
    }
  }

  async function copyUrl(code: QRCodeDoc) {
    const url = buildPublicUrl(code.slug);
    try {
      await navigator.clipboard.writeText(url);
      addToast("URL copied");
    } catch {
      addToast("Failed to copy URL", "info");
    }
  }

  async function downloadPng(code: QRCodeDoc) {
    try {
      const { png } = await generateQR({
        url: buildPublicUrl(code.slug),
        logoUrl: code.logoUrl || undefined,
        style: code.styleConfig ?? DEFAULT_QR_STYLE,
      });
      const url = URL.createObjectURL(png);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coastal-qr-${code.slug}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("PNG downloaded");
    } catch {
      addToast("Failed to download", "info");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "qrCodes", deleteTarget.id));
      addToast(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch {
      addToast("Failed to delete", "info");
    }
  }

  if (loading) {
    return (
      <>
        <AdminTopBar title="QR Codes" />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-4 border-[#E07B2D] border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminTopBar
        title="QR Codes"
        subtitle={`${filtered.length} code${filtered.length !== 1 ? "s" : ""}`}
        onSearchChange={setSearch}
      />

      <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center gap-4">
        <p className="text-[13px] text-gray-500">
          Branded short links that redirect through go.coastalmobilelube.com.
        </p>
        <div className="ml-auto">
          <button
            onClick={() => router.push("/admin/qr/new")}
            className="px-4.5 py-2 rounded-lg bg-[#E07B2D] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#CC6A1F] transition"
          >
            + New QR Code
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {filtered.length === 0 && codes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0B2040"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <line x1="14" y1="14" x2="14" y2="21" />
                <line x1="18" y1="14" x2="21" y2="14" />
                <line x1="21" y1="17" x2="17" y2="17" />
                <line x1="17" y1="21" x2="21" y2="21" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#0B2040] mb-1.5">
              No QR codes yet
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Create your first one to start tracking scans.
            </p>
            <button
              onClick={() => router.push("/admin/qr/new")}
              className="px-5 py-2.5 rounded-lg bg-[#E07B2D] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#CC6A1F] transition"
            >
              + New QR Code
            </button>
          </div>
        ) : (
          <AdminTable>
            <AdminTableHeader
              columns={COLUMNS}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              gridTemplateColumns={GRID}
            />
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-[14px] text-gray-500">
                No QR codes match your search
              </div>
            ) : (
              filtered.map((c) => (
                <AdminTableRow
                  key={c.id}
                  onClick={() => router.push(`/admin/qr/${c.id}`)}
                  gridTemplateColumns={GRID}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <PresetDot preset={c.styleConfig?.preset} />
                    <div className="text-sm font-semibold text-[#0B2040] truncate">
                      {c.name}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-mono text-gray-600">
                      {c.slug}
                    </span>
                  </div>
                  <div className="min-w-0">
                    {c.campaign ? (
                      <AdminBadge label={c.campaign} variant="blue" />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                  <div className="min-w-0" title={c.destination}>
                    <span className="text-[12px] text-gray-600 truncate block">
                      {truncate(c.destination, 48)}
                    </span>
                  </div>
                  <div className="text-center text-sm font-bold text-[#0B2040]">
                    {c.scanCount || 0}
                  </div>
                  <div className="text-xs text-gray-500">
                    {relativeTime(c.lastScannedAt?.toDate?.())}
                  </div>
                  <div className="text-center">
                    <AdminBadge
                      label={c.active ? "Active" : "Paused"}
                      variant={c.active ? "green" : "gray"}
                    />
                  </div>
                  <div
                    className="relative flex justify-center"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuKey(actionMenuKey === c.id ? null : c.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100 transition"
                    >
                      <span className="text-lg text-gray-400 leading-none">
                        &#8942;
                      </span>
                    </button>
                    {actionMenuKey === c.id && (
                      <div
                        className="absolute right-full top-0 mr-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[170px] z-[50]"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            router.push(`/admin/qr/${c.id}`);
                            setActionMenuKey(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                        >
                          View
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            copyUrl(c);
                            setActionMenuKey(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                        >
                          Copy URL
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            downloadPng(c);
                            setActionMenuKey(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                        >
                          Download PNG
                        </button>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            togglePause(c);
                            setActionMenuKey(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
                        >
                          {c.active ? "Pause" : "Resume"}
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setDeleteTarget(c);
                            setActionMenuKey(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-gray-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </AdminTableRow>
              ))
            )}
          </AdminTable>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 z-[80] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-[400px] mx-4 p-6">
            <h3 className="text-lg font-bold text-[#0B2040]">Delete QR Code</h3>
            <p className="text-sm text-gray-500 mt-2">
              Delete <strong>{deleteTarget.name}</strong>? The short URL
              <span className="font-mono text-[12px]">
                {" "}
                /q/{deleteTarget.slug}
              </span>{" "}
              will stop redirecting. Scan history is retained.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
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

function PresetDot({ preset }: { preset?: string }) {
  const p = preset ?? "coastal-brand";
  let className = "w-2.5 h-2.5 rounded-full shrink-0 bg-[#0B2040]";
  let title = "Coastal Brand";
  if (p === "classic") {
    title = "Classic";
  } else if (p === "minimal") {
    title = "Minimal";
  } else if (p === "inverted") {
    className =
      "w-2.5 h-2.5 rounded-full shrink-0 bg-[#0B2040] ring-2 ring-[#E07B2D]";
    title = "Inverted";
  } else if (p === "custom") {
    className = "w-2.5 h-2.5 rounded-full shrink-0 bg-gray-400";
    title = "Custom";
  } else {
    title = "Coastal Brand";
  }
  return <span className={className} title={title} />;
}
