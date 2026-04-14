"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface NewCustomerModalProps {
  onClose: () => void;
  onSuccess?: (name: string) => void;
}

export default function NewCustomerModal({
  onClose,
  onSuccess,
}: NewCustomerModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    type: "Residential",
    vehicle: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function reset() {
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      type: "Residential",
      vehicle: "",
      notes: "",
    });
  }

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setSaving(true);
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
    try {
      await addDoc(collection(db, "bookings"), {
        name: fullName,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        fullName,
        phone: form.phone.replace(/\D/g, "") || null,
        email: form.email.trim().toLowerCase() || null,
        address: form.address.trim() || null,
        vehicleMake: form.vehicle.trim() || null,
        notes: form.notes.trim() || null,
        source: "admin-manual",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onSuccess?.(fullName);
      reset();
      onClose();
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FAC] transition-colors";

  return (
    <div className="fixed inset-0 bg-black/30 z-[70] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-[480px] max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0B2040]">New Customer</h3>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="text-xl text-gray-500 cursor-pointer hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="First name"
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="Last name"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="(813) 555-1234"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="customer@email.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Street address"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              className={`${inputCls} bg-white`}
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Vehicle
            </label>
            <input
              type="text"
              value={form.vehicle}
              onChange={(e) => update("vehicle", e.target.value)}
              placeholder="Year Make Model"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.firstName.trim() || !form.lastName.trim() || saving}
            className="px-5 py-2.5 bg-[#E07B2D] rounded-lg text-sm font-semibold text-white cursor-pointer hover:bg-[#CC6A1F] transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
