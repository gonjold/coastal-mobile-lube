"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const DEFAULTS = {
  eyebrowLine1: "Mobile Service",
  eyebrowLine2: "Oil, Brakes, Tires & More",
  headline: "We bring the shop.",
  subheadline:
    "Oil changes, tires, and brakes wherever you are. A master tech with 30 years of experience. Apollo Beach and the South Shore.",
};

export default function HeroEditorPage() {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "siteConfig", "heroCopy"))
      .then(async (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setForm({
            eyebrowLine1: d.eyebrowLine1 || DEFAULTS.eyebrowLine1,
            eyebrowLine2: d.eyebrowLine2 || DEFAULTS.eyebrowLine2,
            headline: d.headline || DEFAULTS.headline,
            subheadline: d.subheadline || DEFAULTS.subheadline,
          });
        } else {
          // Seed defaults
          await setDoc(doc(db, "siteConfig", "heroCopy"), {
            ...DEFAULTS,
            updatedAt: serverTimestamp(),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await setDoc(doc(db, "siteConfig", "heroCopy"), {
        ...form,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const labelClass = "block text-[13px] font-semibold text-[#333] mb-1";
  const inputClass =
    "w-full bg-white border border-[#E2E8F0] rounded-lg text-[15px] px-3 py-[10px] outline-none focus:border-[#E07B2D] transition-colors";

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-[22px] font-extrabold text-[#0B2040] mb-6">Hero Copy Editor</h1>
        <p className="text-[#888]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[800px]">
      <h1 className="text-[22px] font-extrabold text-[#0B2040] mb-6">Hero Copy Editor</h1>

      <div className="flex flex-col gap-4 mb-8">
        <div>
          <label className={labelClass}>Eyebrow Line 1</label>
          <input
            type="text"
            className={inputClass}
            value={form.eyebrowLine1}
            onChange={(e) => setForm({ ...form, eyebrowLine1: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Eyebrow Line 2</label>
          <input
            type="text"
            className={inputClass}
            value={form.eyebrowLine2}
            onChange={(e) => setForm({ ...form, eyebrowLine2: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Headline</label>
          <input
            type="text"
            className={inputClass}
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Subheadline</label>
          <textarea
            rows={3}
            className={inputClass}
            value={form.subheadline}
            onChange={(e) => setForm({ ...form, subheadline: e.target.value })}
          />
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-[14px] overflow-hidden mb-6">
        <div className="bg-[#0B2040] p-8 text-center">
          <p className="text-[13px] uppercase font-extrabold text-white tracking-[4px] mb-1">
            {form.eyebrowLine1}
          </p>
          <p className="text-[12px] uppercase font-semibold text-[#D9A441] tracking-[2.5px] opacity-90 mb-4">
            {form.eyebrowLine2}
          </p>
          <h2 className="text-[36px] font-extrabold leading-[1.04] text-white tracking-[-1px] mb-3">
            {form.headline}
          </h2>
          <p className="text-[16px] leading-[1.55] text-white/[0.68] max-w-[460px] mx-auto">
            {form.subheadline}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#E07B2D] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#CC6A1F] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && (
          <span className="text-emerald-600 text-[14px] font-semibold">
            Saved successfully!
          </span>
        )}
      </div>
    </div>
  );
}
