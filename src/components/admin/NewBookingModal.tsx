"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  type Booking,
  buildCustomerList,
  formatPhone,
  toISODate,
} from "@/app/admin/shared";
import { useServices, type Service } from "@/hooks/useServices";

/* ── Time slots: 8:00 AM – 4:30 PM in 30-min increments ── */

const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 16; h++) {
  for (const m of [0, 30]) {
    const hour12 = h > 12 ? h - 12 : h;
    const amPm = h >= 12 ? "PM" : "AM";
    TIME_SLOTS.push(`${hour12}:${m === 0 ? "00" : "30"} ${amPm}`);
  }
}

const DIVISIONS = ["Auto", "Marine", "Fleet", "RV"];

/* ── Types ── */

interface PreFilledCustomer {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface NewBookingModalProps {
  onClose: () => void;
  preFilledCustomer?: PreFilledCustomer | null;
}

/* ── Component ── */

export default function NewBookingModal({
  onClose,
  preFilledCustomer,
}: NewBookingModalProps) {
  /* Form state */
  const [customer, setCustomer] = useState<PreFilledCustomer | null>(
    preFilledCustomer || null,
  );
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [vehicle, setVehicle] = useState("");
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toISODate(tomorrow);
  });
  const [time, setTime] = useState("");
  const [address, setAddress] = useState(preFilledCustomer?.address || "");
  const [division, setDivision] = useState("Auto");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  /* Data sources */
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { services } = useServices();
  const customerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLDivElement>(null);

  /* Load bookings for customer search */
  useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setBookings(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking),
      );
    });
    return () => unsub();
  }, []);

  const customers = useMemo(() => buildCustomerList(bookings), [bookings]);

  /* Customer search */
  const customerMatches = useMemo(() => {
    if (!customerQuery.trim()) return customers.slice(0, 6);
    const q = customerQuery.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [customerQuery, customers]);

  /* Close dropdowns on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        customerRef.current &&
        !customerRef.current.contains(e.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
      if (
        serviceRef.current &&
        !serviceRef.current.contains(e.target as Node)
      ) {
        setShowServiceDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* Group services by division */
  const servicesByDivision = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    services.forEach((s) => {
      if (!s.isActive) return;
      const div =
        (s.division || "auto").charAt(0).toUpperCase() +
        (s.division || "auto").slice(1);
      if (!groups[div]) groups[div] = [];
      groups[div].push(s);
    });
    return groups;
  }, [services]);

  /* Customer vehicles */
  const customerVehicles = useMemo(() => {
    if (!customer) return [];
    const matched = customers.find((c) => c.name === customer.name);
    if (!matched) return [];
    const vehicleSet = new Set<string>();
    matched.bookings.forEach((b) => {
      const v = [b.vehicleYear, b.vehicleMake, b.vehicleModel]
        .filter(Boolean)
        .join(" ");
      if (v) vehicleSet.add(v);
      const vessel = [b.vesselYear, b.vesselMake, b.vesselModel]
        .filter(Boolean)
        .join(" ");
      if (vessel) vehicleSet.add(vessel);
    });
    return Array.from(vehicleSet);
  }, [customer, customers]);

  /* Estimated total */
  const estimatedTotal = selectedServices.reduce(
    (sum, s) => sum + (s.price || 0),
    0,
  );

  /* Handlers */

  function selectCustomer(c: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  }) {
    setCustomer({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
    });
    setCustomerQuery("");
    setShowCustomerDropdown(false);
    if (c.address && !address) setAddress(c.address);
  }

  function clearCustomer() {
    setCustomer(null);
    setCustomerQuery("");
    setAddress("");
  }

  function toggleService(service: Service) {
    setSelectedServices((prev) => {
      if (prev.some((s) => s.id === service.id)) {
        return prev.filter((s) => s.id !== service.id);
      }
      return [...prev, service];
    });
    if (service.division) {
      const div =
        service.division.charAt(0).toUpperCase() +
        service.division.slice(1);
      setDivision(div);
    }
  }

  function removeService(id: string) {
    setSelectedServices((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleCreate(status: "pending" | "draft") {
    if (!customer || selectedServices.length === 0 || !date || !time)
      return;
    setSaving(true);
    try {
      await addDoc(collection(db, "bookings"), {
        name: customer.name,
        phone: customer.phone || null,
        email: customer.email || null,
        address: address || null,
        selectedServices: selectedServices.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          category: s.category,
        })),
        vehicle: vehicle || null,
        preferredDate: date,
        timeWindow: time,
        division: division.toLowerCase(),
        notes: notes || null,
        status,
        source: "Admin",
        totalEstimate: estimatedTotal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onClose();
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  }

  /* Validation */
  const isValid =
    !!customer && selectedServices.length > 0 && !!date && !!time;

  const inputCls =
    "border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm w-full focus:border-[#1A5FAC] focus:ring-1 focus:ring-[#1A5FAC] outline-none transition";

  return (
    <div className="fixed inset-0 bg-black/30 z-[70] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-[540px] max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0B2040]">New Booking</h3>
          <button
            onClick={onClose}
            className="text-xl text-gray-500 cursor-pointer hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* ── Customer ── */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Customer <span className="text-red-500">*</span>
            </label>
            {customer && preFilledCustomer ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#EBF4FF] text-[#1A5FAC] text-sm font-medium px-3 py-2 rounded-lg">
                  {customer.name}
                  <button
                    onClick={clearCustomer}
                    className="text-[#1A5FAC] hover:text-[#0B2040] cursor-pointer ml-1"
                  >
                    ✕
                  </button>
                </span>
              </div>
            ) : customer ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#EBF4FF] text-[#1A5FAC] text-sm font-medium px-3 py-2 rounded-lg">
                  {customer.name}
                  <button
                    onClick={clearCustomer}
                    className="text-[#1A5FAC] hover:text-[#0B2040] cursor-pointer ml-1"
                  >
                    ✕
                  </button>
                </span>
              </div>
            ) : (
              <div ref={customerRef} className="relative">
                <input
                  type="text"
                  value={customerQuery}
                  onChange={(e) => {
                    setCustomerQuery(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search by name, phone, or email..."
                  className={inputCls}
                />
                {showCustomerDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-[220px] overflow-y-auto">
                    {customerMatches.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => selectCustomer(c)}
                        className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-sm font-medium text-[#0B2040]">
                          {c.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {c.phone ? formatPhone(c.phone) : ""}{" "}
                          {c.email ? `· ${c.email}` : ""}
                        </div>
                      </button>
                    ))}
                    {customerMatches.length === 0 && customerQuery && (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No matching customers
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Services ── */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Service <span className="text-red-500">*</span>
            </label>

            {/* Selected service pills */}
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedServices.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 bg-[#F0F7FF] text-[#1A5FAC] text-xs font-medium px-2.5 py-1.5 rounded-md"
                  >
                    {s.name}{" "}
                    <span className="text-[#1A5FAC]/60">
                      ${s.price}
                    </span>
                    <button
                      onClick={() => removeService(s.id)}
                      className="text-[#1A5FAC] hover:text-red-500 cursor-pointer ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div ref={serviceRef} className="relative">
              <button
                onClick={() => setShowServiceDropdown((p) => !p)}
                className={`${inputCls} text-left text-gray-500 cursor-pointer`}
              >
                {selectedServices.length === 0
                  ? "Select services..."
                  : "+ Add another service"}
              </button>
              {showServiceDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-[280px] overflow-y-auto">
                  {DIVISIONS.map((div) => {
                    const divServices = servicesByDivision[div];
                    if (!divServices?.length) return null;
                    return (
                      <div key={div}>
                        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 sticky top-0">
                          {div === "Auto"
                            ? "Automotive"
                            : div}
                        </div>
                        {divServices.map((s) => {
                          const isSelected = selectedServices.some(
                            (sel) => sel.id === s.id,
                          );
                          return (
                            <button
                              key={s.id}
                              onClick={() => toggleService(s)}
                              className={`block w-full text-left px-4 py-2.5 text-sm cursor-pointer border-b border-gray-50 ${
                                isSelected
                                  ? "bg-[#EBF4FF] text-[#1A5FAC] font-medium"
                                  : "text-[#0B2040] hover:bg-gray-50"
                              }`}
                            >
                              <span>{s.name}</span>
                              <span className="float-right text-gray-500">
                                ${s.price}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Vehicle ── */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Vehicle
            </label>
            {customer && customerVehicles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {customerVehicles.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVehicle(v)}
                    className={`text-xs px-2.5 py-1 rounded-md cursor-pointer transition ${
                      vehicle === v
                        ? "bg-[#0B2040] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="Year Make Model"
              className={inputCls}
            />
          </div>

          {/* ── Date + Time row ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                Time <span className="text-red-500">*</span>
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`${inputCls} bg-white`}
              >
                <option value="">Select time...</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Address ── */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Service address"
              className={inputCls}
            />
          </div>

          {/* ── Division ── */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Division
            </label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* ── Notes ── */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gate code, key location, special instructions..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* ── Estimated Total ── */}
          {selectedServices.length > 0 && (
            <div className="bg-[#F7F8FA] rounded-lg p-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">
                Estimated Total
              </p>
              {selectedServices.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between text-sm text-[#0B2040] py-0.5"
                >
                  <span>{s.name}</span>
                  <span className="font-medium">${s.price}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-[#0B2040] pt-2 mt-2 border-t border-gray-200">
                <span>Total</span>
                <span>${estimatedTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => handleCreate("draft")}
            disabled={!isValid || saving}
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-[#0B2040] cursor-pointer hover:bg-gray-50 transition disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleCreate("pending")}
            disabled={!isValid || saving}
            className="px-5 py-2.5 bg-[#E07B2D] rounded-lg text-sm font-semibold text-white cursor-pointer hover:bg-[#CC6A1F] transition disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
