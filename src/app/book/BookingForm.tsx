"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getCatalogByDivision } from "@/data/pricingCatalog";

/* ─── Types ────────────────────────────────────────────────────── */

interface SelectedService {
  id: string;
  name: string;
  price: number;
}

interface FormData {
  preferredDate: string;
  timeWindow: string;
  name: string;
  phone: string;
  email: string;
  contactPreference: "call" | "text" | "email";
  datesFlexible: boolean;
  address: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  notes: string;
}

type Errors = Partial<Record<keyof FormData | "services", string>>;

/* ─── Static Data ──────────────────────────────────────────────── */

const mostBooked = [
  { id: "auto-oc-synthetic-blend", name: "Synthetic Blend Oil Change", price: 89.95, startingAt: true, desc: "Up to 5 quarts of synthetic blend oil plus filter" },
  { id: "auto-oc-full-synthetic", name: "Full Synthetic Oil Change", price: 119.95, startingAt: true, desc: "Up to 5 quarts of full synthetic oil plus filter" },
  { id: "auto-tw-tire-rotation", name: "Tire Rotation", price: 39.95, startingAt: false, desc: "All four tires rotated to extend tread life" },
  { id: "auto-tw-mount-balance-4", name: "Mount & Balance (4 Tires)", price: 159.95, startingAt: false, desc: "Mount and balance all four tires on your vehicle" },
  { id: "auto-br-front-rear", name: "Front + Rear Brakes", price: 320, startingAt: true, desc: "Pads and rotor resurfacing, front and rear" },
  { id: "auto-bm-cabin-air-filter", name: "Cabin Air Filter", price: 99.95, startingAt: false, desc: "Fresh cabin filter for cleaner air inside your vehicle" },
];

const bundleItems = [
  { id: "auto-oc-syn-blend-basic", tier: "Basic", price: 119.95, tagline: "Oil change + tire rotation", detail: "Synthetic blend oil change and tire rotation" },
  { id: "auto-oc-syn-blend-better", tier: "Better", price: 139.95, tagline: "Basic + MOA additive", detail: "Everything in Basic plus MOA engine treatment" },
  { id: "auto-oc-syn-blend-best", tier: "Best", price: 179.95, tagline: "Basic + MOA + fuel additives", detail: "Everything in Better plus fuel system additives" },
];

const oilChangeIds = ["auto-oc-synthetic-blend", "auto-oc-full-synthetic", "auto-oc-diesel"];
const allBundleIds = [
  "auto-oc-syn-blend-basic", "auto-oc-syn-blend-better", "auto-oc-syn-blend-best",
  "auto-oc-full-syn-basic", "auto-oc-full-syn-better", "auto-oc-full-syn-best",
  "auto-oc-diesel-basic", "auto-oc-diesel-better", "auto-oc-diesel-best",
];

const timeWindows = [
  { value: "morning", label: "Morning (7-10)" },
  { value: "late-morning", label: "Late Morning (10-12)" },
  { value: "afternoon", label: "Afternoon (12-3)" },
  { value: "late-afternoon", label: "Late Afternoon (3-5)" },
];

/* ─── Helpers ──────────────────────────────────────────────────── */

function strip(phone: string) {
  return phone.replace(/\D/g, "");
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function maxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split("T")[0];
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}/${y}`;
}

function fmtPrice(n: number) {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

function fmtPhone(p: string) {
  const d = p.replace(/\D/g, "");
  return d.length === 10
    ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
    : p;
}

/* ─── Checkmark Icon ───────────────────────────────────────────── */

function Check({ size = 10, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function BookingForm() {
  /* ── State ── */
  const [selected, setSelected] = useState<SelectedService[]>([]);
  const [form, setForm] = useState<FormData>({
    preferredDate: "",
    timeWindow: "",
    name: "",
    phone: "",
    email: "",
    contactPreference: "call",
    datesFlexible: false,
    address: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Returning customer
  const [showLookup, setShowLookup] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<{
    type: "success" | "info";
    text: string;
  } | null>(null);
  const [returning, setReturning] = useState(false);

  // Browse All
  const [browseOpen, setBrowseOpen] = useState(false);
  const [activeCat, setActiveCat] = useState("all");

  // Mobile cart
  const [cartOpen, setCartOpen] = useState(false);

  /* ── Derived ── */
  const catalog = useMemo(
    () =>
      getCatalogByDivision("auto")
        .filter(
          (c) =>
            c.id !== "auto-labor-rates" &&
            c.items.some((i) => i.displayOnSite)
        )
        .map((c) => ({
          ...c,
          items: c.items.filter(
            (i) => i.displayOnSite && i.subcategory !== "Add-Ons"
          ),
        })),
    []
  );
  const subtotal = selected.reduce((s, x) => s + x.price, 0);

  /* ── Toggle service ── */
  function toggle(svc: SelectedService) {
    setSelected((prev) => {
      if (prev.some((s) => s.id === svc.id))
        return prev.filter((s) => s.id !== svc.id);

      let next = [...prev, svc];

      // Bundles and standalone oil changes are mutually exclusive
      if (allBundleIds.includes(svc.id)) {
        next = next.filter(
          (s) =>
            s.id === svc.id ||
            (!oilChangeIds.includes(s.id) && !allBundleIds.includes(s.id))
        );
      }
      if (oilChangeIds.includes(svc.id)) {
        next = next.filter((s) => !allBundleIds.includes(s.id));
      }

      return next;
    });
    if (errors.services)
      setErrors((p) => ({ ...p, services: undefined }));
  }

  function has(id: string) {
    return selected.some((s) => s.id === id);
  }

  /* ── Form helpers ── */
  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!selected.length)
      e.services = "Please select at least one service";
    if (!form.preferredDate) e.preferredDate = "Please pick a date";
    if (!form.timeWindow) e.timeWindow = "Please choose a time window";
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) {
      e.phone = "Phone is required";
    } else if (strip(form.phone).length < 10) {
      e.phone = "Please enter a valid phone number";
    }
    if (!form.address.trim()) e.address = "Address is required";
    return e;
  }

  /* ── Customer lookup ── */
  async function handleLookup() {
    const digits = strip(lookupPhone);
    if (digits.length < 10) {
      setLookupMsg({ type: "info", text: "Enter a valid phone number" });
      return;
    }
    setLookupLoading(true);
    setLookupMsg(null);
    try {
      const q = query(
        collection(db, "bookings"),
        where("phone", "==", digits)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0].data();
        setForm((p) => ({
          ...p,
          name: d.name || p.name,
          phone: d.phone || p.phone,
          email: d.email || p.email,
          address: d.address || p.address,
        }));
        setReturning(true);
        setLookupMsg({ type: "success", text: "Welcome back!" });
      } else {
        setLookupMsg({
          type: "info",
          text: "No worries, fill out the form below and we will get you set up.",
        });
      }
    } catch {
      setLookupMsg({
        type: "info",
        text: "Couldn't look up your info right now. Please fill out the form below.",
      });
    } finally {
      setLookupLoading(false);
    }
  }

  /* ── Submit ── */
  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      if (errs.services) window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      const names = selected.map((s) => s.name);
      await addDoc(collection(db, "bookings"), {
        services: names,
        service: names.join(", "),
        selectedServices: selected.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
        })),
        subtotalEstimate: subtotal,
        preferredDate: form.preferredDate,
        timeWindow: form.timeWindow,
        name: form.name.trim(),
        phone: strip(form.phone),
        email: form.email.trim().toLowerCase(),
        contactPreference: form.contactPreference,
        datesFlexible: form.datesFlexible,
        address: form.address.trim(),
        vehicleYear: form.vehicleYear.trim(),
        vehicleMake: form.vehicleMake.trim(),
        vehicleModel: form.vehicleModel.trim(),
        notes: form.notes.trim() || "",
        status: "pending",
        source: "booking-page",
        returningCustomer: returning,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ services: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSelected([]);
    setForm({
      preferredDate: "",
      timeWindow: "",
      name: "",
      phone: "",
      email: "",
      contactPreference: "call",
      datesFlexible: false,
      address: "",
      vehicleYear: "",
      vehicleMake: "",
      vehicleModel: "",
      notes: "",
    });
    setErrors({});
    setSubmitted(false);
    setReturning(false);
    setLookupMsg(null);
    setLookupPhone("");
    setShowLookup(false);
    setCartOpen(false);
    setBrowseOpen(false);
  }

  /* ─── Styles ─── */
  const inp =
    "w-full text-[15px] rounded-[10px] px-3.5 py-3 outline-none border border-[#0B2040]/10 bg-white focus:border-[#E07B2D] transition-all placeholder:text-[#888]/60";
  const lbl =
    "block text-[12px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5";

  /* ── Spinner ── */
  const Spinner = () => (
    <span className="inline-flex items-center gap-2">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      Submitting...
    </span>
  );

  /* ═══ RENDER ══════════════════════════════════════════════════ */

  /* ── Confirmation screen ── */
  if (submitted) {
    return (
      <>
        <section className="relative bg-gradient-to-b from-[#07192F] via-[#0B2040] to-[#0F2A52] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(107,163,224,0.08),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(224,123,45,0.05),transparent_50%)]" />
          <div className="relative section-inner px-4 lg:px-6 pt-12 pb-6 md:pt-16 md:pb-8">
            <h1 className="text-[28px] md:text-[34px] font-[800] leading-[1.1] text-white tracking-[-1px]">
              You&apos;re all set!
            </h1>
          </div>
        </section>

        <section className="bg-gradient-to-b from-[#0F2A52] to-[#F5F7FA]">
          <div className="section-inner px-4 lg:px-6 py-10 md:py-14">
            <div className="max-w-[600px] mx-auto">
              <div className="bg-white border border-[#E8E8E8] rounded-[12px] p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center mb-5">
                    <Check size={24} />
                  </div>

                  {/* Services breakdown */}
                  <div className="w-full mb-6 text-left">
                    <div className="divide-y divide-[#0B2040]/8">
                      {selected.map((s) => (
                        <div
                          key={s.id}
                          className="flex justify-between py-2.5 text-[14px]"
                        >
                          <span className="text-[#0B2040] font-medium">
                            {s.name}
                          </span>
                          <span className="text-[#E07B2D] font-semibold">
                            {fmtPrice(s.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between py-3 mt-1 border-t-2 border-[#0B2040]/15">
                      <span className="text-[15px] font-bold text-[#0B2040]">
                        Estimated total
                      </span>
                      <span className="text-[15px] font-bold text-[#E07B2D]">
                        {fmtPrice(subtotal)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[15px] text-[#444] mb-2 leading-relaxed">
                    Preferred date:{" "}
                    <span className="font-semibold text-[#0B2040]">
                      {fmtDate(form.preferredDate)}
                    </span>
                  </p>
                  <p className="text-[15px] text-[#444] mb-6 leading-relaxed">
                    {form.contactPreference === "email" ? (
                      <>
                        We will email you at{" "}
                        <span className="font-semibold text-[#0B2040]">
                          {form.email}
                        </span>
                      </>
                    ) : (
                      <>
                        We will {form.contactPreference} you at{" "}
                        <span className="font-semibold text-[#0B2040]">
                          {fmtPhone(form.phone)}
                        </span>
                      </>
                    )}{" "}
                    within 2 hours to confirm your appointment.
                  </p>

                  <p className="text-[14px] text-[#888] mb-8">
                    Need to make changes? Call us at{" "}
                    <a
                      href="tel:8137225823"
                      className="font-semibold text-[#0B2040] hover:underline"
                    >
                      813-722-LUBE
                    </a>
                  </p>

                  <div className="flex flex-col w-full max-w-[340px] gap-3">
                    <button
                      onClick={reset}
                      className="w-full py-4 rounded-[10px] bg-[#E07B2D] text-white font-bold text-[16px] hover:bg-[#cc6a1f] transition-colors"
                    >
                      Book Another Service
                    </button>
                    <Link
                      href="/"
                      className="w-full py-4 rounded-[10px] border-2 border-[#0B2040] text-[#0B2040] font-bold text-[16px] text-center hover:bg-[#0B2040] hover:text-white transition-colors"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  /* ── Main booking flow ── */
  return (
    <>
      {/* ═══ 1. Hero ═══ */}
      <section className="relative bg-gradient-to-b from-[#07192F] via-[#0B2040] to-[#0F2A52] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(107,163,224,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(224,123,45,0.05),transparent_50%)]" />
        <div className="relative section-inner px-4 lg:px-6 pt-12 pb-6 md:pt-16 md:pb-8">
          <div className="max-w-[700px]">
            <p className="text-[13px] uppercase font-bold text-[#6BA3E0] tracking-[1.5px] mb-3">
              Automotive Service
            </p>
            <h1 className="text-[28px] md:text-[34px] font-[800] leading-[1.1] text-white tracking-[-1px] mb-4">
              Book your service
            </h1>
            <p className="text-[16px] leading-[1.7] text-white/60 max-w-[700px]">
              Pick a service, choose a date, and we will confirm your
              appointment within 2 hours. Or call{" "}
              <a
                href="tel:8137225823"
                className="text-[#E07B2D] font-semibold hover:underline"
              >
                813-722-LUBE
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Content ═══ */}
      <section className="bg-gradient-to-b from-[#0F2A52] via-[#F0F2F5] to-[#F5F7FA]">
        <div className="section-inner px-4 lg:px-6 py-8 md:py-12">
          {/* 8. Fleet / Marine redirect */}
          <p className="text-center text-[13px] text-white/50 mb-8">
            Looking for{" "}
            <Link
              href="/fleet"
              className="text-[#E07B2D] font-semibold hover:underline"
            >
              fleet
            </Link>{" "}
            or{" "}
            <Link
              href="/marine"
              className="text-[#E07B2D] font-semibold hover:underline"
            >
              marine
            </Link>{" "}
            service? Get a custom quote on those pages.
          </p>

          {errors.services && (
            <div className="max-w-[900px] mx-auto mb-4">
              <p className="text-center text-[13px] text-red-500 font-medium bg-red-50 rounded-[10px] py-2 px-4">
                {errors.services}
              </p>
            </div>
          )}

          {/* Two-column layout: services+form | cart sidebar */}
          <div className="max-w-[1100px] mx-auto lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
            {/* ─── Left column ─── */}
            <div>
              {/* ═══ 2. Most Booked ═══ */}
              <div className="mb-8">
                <h2 className="text-[20px] font-[800] text-[#0B2040] mb-1">
                  Most booked
                </h2>
                <p className="text-[14px] text-[#666] mb-5">
                  Tap to add to your service list
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {mostBooked.map((item) => {
                    const on = has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggle(item)}
                        className={`relative text-left rounded-[12px] p-4 border-2 transition-all duration-150 cursor-pointer ${
                          on
                            ? "border-[#E07B2D] bg-[#E07B2D]/5 shadow-[0_0_0_1px_rgba(224,123,45,0.2)]"
                            : "border-[#0B2040]/8 bg-white hover:border-[#E07B2D]/40 hover:shadow-[0_4px_16px_rgba(11,32,64,0.08)] hover:-translate-y-[1px]"
                        }`}
                      >
                        {on && (
                          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E07B2D] flex items-center justify-center">
                            <Check size={12} />
                          </span>
                        )}
                        <span className="block text-[14px] font-semibold text-[#0B2040] mb-1 pr-6">
                          {item.name}
                        </span>
                        <span className="block text-[14px] font-bold text-[#E07B2D] mb-1.5">
                          {item.startingAt ? "starting at " : ""}
                          {fmtPrice(item.price)}
                        </span>
                        <span className="block text-[12px] text-[#888] leading-[1.4]">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ 3. Bundle Upsell ═══ */}
              <div className="mb-8">
                <h2 className="text-[20px] font-[800] text-[#0B2040] mb-1">
                  Save with a package
                </h2>
                <p className="text-[14px] text-[#666] mb-5">
                  Synthetic blend bundles. Also available in Full Synthetic and
                  Diesel in the full catalog below.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {bundleItems.map((b) => {
                    const on = has(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          toggle({
                            id: b.id,
                            name: `${b.tier} Bundle`,
                            price: b.price,
                          })
                        }
                        className={`relative text-left rounded-[12px] p-5 border-2 transition-all duration-150 cursor-pointer ${
                          on
                            ? "border-[#E07B2D] bg-[#E07B2D]/5 shadow-[0_0_0_1px_rgba(224,123,45,0.2)]"
                            : "border-[#0B2040]/8 bg-white hover:border-[#E07B2D]/40 hover:shadow-[0_4px_16px_rgba(11,32,64,0.08)] hover:-translate-y-[1px]"
                        }`}
                      >
                        {on && (
                          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E07B2D] flex items-center justify-center">
                            <Check size={12} />
                          </span>
                        )}
                        <span className="text-[12px] uppercase font-bold text-[#0B2040]/40 tracking-[1px]">
                          {b.tier}
                        </span>
                        <span className="block text-[22px] font-[800] text-[#E07B2D] mt-1">
                          {fmtPrice(b.price)}
                        </span>
                        <span className="block text-[14px] font-semibold text-[#0B2040] mt-1">
                          {b.tagline}
                        </span>
                        <span className="block text-[12px] text-[#888] mt-1">
                          {b.detail}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ 4. Browse All Services ═══ */}
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setBrowseOpen(!browseOpen)}
                  className="flex items-center gap-2 text-[16px] font-bold text-[#0B2040] hover:text-[#E07B2D] transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${browseOpen ? "rotate-90" : ""}`}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Browse all services
                </button>

                {browseOpen && (
                  <div className="mt-4">
                    {/* Category pills */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
                      <button
                        type="button"
                        onClick={() => setActiveCat("all")}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                          activeCat === "all"
                            ? "bg-[#0B2040] text-white shadow-[0_2px_8px_rgba(11,32,64,0.2)]"
                            : "bg-[#FAFBFC] text-[#666] hover:bg-[#f0ede6] hover:text-[#0B2040]"
                        }`}
                      >
                        All
                      </button>
                      {catalog.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setActiveCat(cat.id)}
                          className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                            activeCat === cat.id
                              ? "bg-[#0B2040] text-white shadow-[0_2px_8px_rgba(11,32,64,0.2)]"
                              : "bg-[#FAFBFC] text-[#666] hover:bg-[#f0ede6] hover:text-[#0B2040]"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    {/* Category items */}
                    <div className="flex flex-col gap-6">
                      {catalog
                        .filter(
                          (c) => activeCat === "all" || c.id === activeCat
                        )
                        .map((cat) => {
                          // Group items by subcategory
                          const groups = new Map<
                            string,
                            typeof cat.items
                          >();
                          for (const item of cat.items) {
                            const key = item.subcategory || "";
                            if (!groups.has(key)) groups.set(key, []);
                            groups.get(key)!.push(item);
                          }

                          return (
                            <div key={cat.id}>
                              <p className="text-[11px] uppercase font-bold text-[#0B2040]/40 tracking-[1.5px] mb-3">
                                {cat.name}
                              </p>
                              {Array.from(groups.entries()).map(
                                ([sub, items]) => (
                                  <div
                                    key={sub || "default"}
                                    className={sub ? "mb-3" : ""}
                                  >
                                    {sub && (
                                      <p className="text-[10px] uppercase font-semibold text-[#0B2040]/25 tracking-[1px] mb-2 ml-1">
                                        {sub}
                                      </p>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {items.map((item) => {
                                        const on = has(item.id);
                                        return (
                                          <button
                                            key={item.id}
                                            type="button"
                                            onClick={() =>
                                              toggle({
                                                id: item.id,
                                                name: item.name,
                                                price: item.price,
                                              })
                                            }
                                            className={`relative text-left rounded-[10px] p-3 border-2 transition-all duration-150 cursor-pointer ${
                                              on
                                                ? "border-[#E07B2D] bg-[#E07B2D]/5"
                                                : "border-[#0B2040]/8 bg-white hover:border-[#E07B2D]/40"
                                            }`}
                                          >
                                            {on && (
                                              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#E07B2D] flex items-center justify-center">
                                                <Check size={10} />
                                              </span>
                                            )}
                                            <span className="block text-[14px] font-semibold text-[#0B2040]">
                                              {item.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[13px] font-semibold text-[#E07B2D]">
                                                {fmtPrice(item.price)}
                                              </span>
                                              {item.note && (
                                                <span className="text-[11px] text-[#888]">
                                                  {item.note}
                                                </span>
                                              )}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* ═══ 6. Booking Form ═══ */}
              <div className="bg-white border border-[#E8E8E8] rounded-[12px] p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <h2 className="text-[20px] font-[800] text-[#0B2040] mb-6">
                  Your details
                </h2>

                <div className="flex flex-col gap-5">
                  {/* Returning customer lookup */}
                  <div>
                    {!showLookup ? (
                      <p className="text-[14px] text-[#444]">
                        Been here before?{" "}
                        <button
                          type="button"
                          onClick={() => setShowLookup(true)}
                          className="text-[#E07B2D] font-semibold hover:underline"
                        >
                          Look up your info
                        </button>
                      </p>
                    ) : (
                      <div className="bg-white border border-[#0B2040]/8 rounded-[10px] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[13px] font-semibold text-[#444]">
                            Find your info
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowLookup(false);
                              setLookupMsg(null);
                            }}
                            className="text-[12px] text-[#888] hover:text-[#444]"
                          >
                            Dismiss
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            placeholder="(555) 555-5555"
                            value={lookupPhone}
                            onChange={(e) => setLookupPhone(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleLookup();
                            }}
                            className={`${inp} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={handleLookup}
                            disabled={lookupLoading}
                            className="px-5 py-3 bg-[#0B2040] text-white text-[14px] font-semibold rounded-[10px] hover:bg-[#132E54] transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {lookupLoading ? "..." : "Find me"}
                          </button>
                        </div>
                        {lookupMsg && (
                          <p
                            className={`mt-2 text-[13px] font-medium ${
                              lookupMsg.type === "success"
                                ? "text-[#22c55e]"
                                : "text-[#444]"
                            }`}
                          >
                            {lookupMsg.text}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Preferred Date */}
                  <div>
                    <label className={lbl}>Preferred Date</label>
                    <input
                      type="date"
                      value={form.preferredDate}
                      min={tomorrow()}
                      max={maxDate()}
                      onChange={(e) => set("preferredDate", e.target.value)}
                      className={`${inp} ${errors.preferredDate ? "border-red-500" : ""}`}
                    />
                    {errors.preferredDate && (
                      <p className="text-[12px] text-red-500 mt-1">
                        {errors.preferredDate}
                      </p>
                    )}
                  </div>

                  {/* Dates flexible */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span
                      className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors ${
                        form.datesFlexible
                          ? "bg-[#E07B2D] border-[#E07B2D]"
                          : "border-[#ddd]"
                      }`}
                    >
                      {form.datesFlexible && <Check size={10} />}
                    </span>
                    <span className="text-[14px] text-[#888]">
                      My dates are flexible
                    </span>
                    <input
                      type="checkbox"
                      checked={form.datesFlexible}
                      onChange={(e) => set("datesFlexible", e.target.checked)}
                      className="sr-only"
                    />
                  </label>

                  {/* Time Window */}
                  <div>
                    <label className={lbl}>Preferred Time</label>
                    <div className="flex flex-wrap gap-2">
                      {timeWindows.map((tw) => (
                        <button
                          key={tw.value}
                          type="button"
                          onClick={() => set("timeWindow", tw.value)}
                          className={`px-4 py-3 rounded-[10px] text-[13px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                            form.timeWindow === tw.value
                              ? "bg-[#E07B2D] text-white border-[#E07B2D] shadow-[0_2px_8px_rgba(224,123,45,0.3)]"
                              : "border-[#0B2040]/10 bg-white text-[#444] hover:border-[#E07B2D]/40"
                          }`}
                        >
                          {tw.label}
                        </button>
                      ))}
                    </div>
                    {errors.timeWindow && (
                      <p className="text-[12px] text-red-500 mt-1">
                        {errors.timeWindow}
                      </p>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label className={lbl}>Your Name</label>
                    <input
                      type="text"
                      placeholder="First and last name"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      className={`${inp} ${errors.name ? "border-red-500" : ""}`}
                    />
                    {errors.name && (
                      <p className="text-[12px] text-red-500 mt-1">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={lbl}>Phone</label>
                    <input
                      type="tel"
                      placeholder="(555) 555-5555"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className={`${inp} ${errors.phone ? "border-red-500" : ""}`}
                    />
                    {errors.phone && (
                      <p className="text-[12px] text-red-500 mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className={lbl}>Email</label>
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className={inp}
                    />
                  </div>

                  {/* Contact Preference */}
                  <div>
                    <label className={lbl}>Best way to reach you</label>
                    <div className="flex gap-2">
                      {(["call", "text", "email"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => set("contactPreference", m)}
                          className={`flex-1 py-3 rounded-[10px] text-[14px] font-semibold border transition-all cursor-pointer ${
                            form.contactPreference === m
                              ? "bg-[#E07B2D] text-white border-[#E07B2D] shadow-[0_2px_8px_rgba(224,123,45,0.3)]"
                              : "border-[#0B2040]/10 bg-white text-[#444] hover:border-[#E07B2D]/40"
                          }`}
                        >
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className={lbl}>Service Address</label>
                    <input
                      type="text"
                      placeholder="Street address, city, ZIP"
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      className={`${inp} ${errors.address ? "border-red-500" : ""}`}
                    />
                    {errors.address && (
                      <p className="text-[12px] text-red-500 mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Vehicle Info (optional) */}
                  <div>
                    <label className={lbl}>Vehicle (optional)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Year"
                        value={form.vehicleYear}
                        onChange={(e) => set("vehicleYear", e.target.value)}
                        className={inp}
                      />
                      <input
                        type="text"
                        placeholder="Make"
                        value={form.vehicleMake}
                        onChange={(e) => set("vehicleMake", e.target.value)}
                        className={inp}
                      />
                      <input
                        type="text"
                        placeholder="Model"
                        value={form.vehicleModel}
                        onChange={(e) => set("vehicleModel", e.target.value)}
                        className={inp}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={lbl}>
                      Anything else we should know?
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Gate codes, special requests, vehicle details..."
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      className={`${inp} resize-y`}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 rounded-[10px] bg-[#E07B2D] text-white font-bold text-[16px] hover:bg-[#cc6a1f] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(224,123,45,0.35)] transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {submitting ? <Spinner /> : "Get My Quote"}
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Right column: Desktop sidebar ─── */}
            <div className="hidden lg:block">
              <div className="sticky top-6">
                <div className="bg-white border border-[#E8E8E8] rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <h3 className="text-[15px] font-bold text-[#0B2040] mb-4">
                    Your services
                  </h3>

                  {selected.length === 0 ? (
                    <p className="text-[13px] text-[#888] py-4">
                      No services selected yet
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 mb-4">
                        {selected.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-start justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="block text-[13px] font-medium text-[#0B2040] truncate">
                                {s.name}
                              </span>
                              <span className="block text-[12px] font-semibold text-[#E07B2D]">
                                {fmtPrice(s.price)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSelected((p) =>
                                  p.filter((x) => x.id !== s.id)
                                )
                              }
                              className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0B2040]/8 flex items-center justify-center hover:bg-red-100 transition-colors mt-0.5"
                            >
                              <svg
                                width="8"
                                height="8"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#888"
                                strokeWidth="3"
                                strokeLinecap="round"
                              >
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-[#0B2040]/10 pt-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-[14px] font-bold text-[#0B2040]">
                            Estimated total
                          </span>
                          <span className="text-[14px] font-bold text-[#E07B2D]">
                            {fmtPrice(subtotal)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !selected.length}
                    className="w-full py-3.5 rounded-[10px] bg-[#E07B2D] text-white font-bold text-[15px] hover:bg-[#cc6a1f] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(224,123,45,0.35)] transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {submitting ? "Submitting..." : "Get My Quote"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 5. Mobile sticky bottom bar ═══ */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          {/* Expandable panel */}
          {cartOpen && (
            <div className="bg-white border-t border-[#0B2040]/10 shadow-[0_-4px_24px_rgba(11,32,64,0.12)] rounded-t-[16px] max-h-[60vh] overflow-y-auto px-5 pt-5 pb-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-[#0B2040]">
                  Your services
                </h3>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="text-[12px] text-[#888] hover:text-[#444]"
                >
                  Close
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {selected.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="block text-[13px] font-medium text-[#0B2040]">
                        {s.name}
                      </span>
                      <span className="block text-[12px] font-semibold text-[#E07B2D]">
                        {fmtPrice(s.price)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected((p) => p.filter((x) => x.id !== s.id))
                      }
                      className="w-6 h-6 rounded-full bg-[#0B2040]/8 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#888"
                        strokeWidth="3"
                        strokeLinecap="round"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#0B2040]/10 mt-3 pt-3 mb-2">
                <div className="flex justify-between">
                  <span className="text-[14px] font-bold text-[#0B2040]">
                    Estimated total
                  </span>
                  <span className="text-[14px] font-bold text-[#E07B2D]">
                    {fmtPrice(subtotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom bar */}
          <button
            type="button"
            onClick={() => setCartOpen(!cartOpen)}
            className="w-full bg-[#0B2040] text-white px-5 py-4 flex items-center justify-between shadow-[0_-2px_16px_rgba(11,32,64,0.15)]"
          >
            <span className="text-[14px] font-semibold">
              {selected.length} service{selected.length > 1 ? "s" : ""}{" "}
              selected
            </span>
            <span className="text-[15px] font-bold text-[#E07B2D]">
              {fmtPrice(subtotal)}
            </span>
          </button>
        </div>
      )}

      {/* Bottom padding for mobile sticky bar */}
      {selected.length > 0 && <div className="h-16 lg:hidden" />}
    </>
  );
}
