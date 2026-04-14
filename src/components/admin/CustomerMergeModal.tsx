"use client";

import { useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Customer, Booking } from "@/app/admin/shared";
import { formatPhone } from "@/app/admin/shared";
import type { DuplicateGroup } from "@/lib/customerDedup";

/* ── Types ── */

interface MergeInvoice {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  total: number;
  status: string;
}

/* ── Helpers ── */

function getVehicles(bookings: Booking[]): string[] {
  const set = new Set<string>();
  bookings.forEach((b) => {
    const v = [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") ||
      [b.vesselYear, b.vesselMake, b.vesselModel].filter(Boolean).join(" ");
    if (v) set.add(v);
  });
  return Array.from(set);
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

/* ── Component ── */

export default function CustomerMergeModal({
  group,
  allBookings,
  allInvoices,
  onClose,
  onMerged,
}: {
  group: DuplicateGroup;
  allBookings: Booking[];
  allInvoices: MergeInvoice[];
  onClose: () => void;
  onMerged: () => void;
}) {
  const customers = group.customers;

  // Figure out which customer has more bookings (default to primary)
  const defaultPrimary = customers.reduce((best, c) =>
    c.totalBookings > best.totalBookings ? c : best,
    customers[0],
  );

  const [primaryKey, setPrimaryKey] = useState(defaultPrimary.key);

  // Field selections: key = field name, value = customer key whose value to use
  const [fieldSelections, setFieldSelections] = useState<Record<string, string>>(() => {
    const pk = defaultPrimary.key;
    return {
      name: pk,
      phone: pk,
      email: pk,
      address: pk,
      type: pk,
    };
  });

  // Vehicle selections: all checked by default
  const allVehicles = useMemo(() => {
    const vMap = new Map<string, string>(); // vehicle -> customer key
    customers.forEach((c) => {
      getVehicles(c.bookings).forEach((v) => {
        if (!vMap.has(v)) vMap.set(v, c.key);
      });
    });
    return Array.from(vMap.entries());
  }, [customers]);

  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(
    () => new Set(allVehicles.map(([v]) => v)),
  );

  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking/invoice counts per customer
  const customerStats = useMemo(() => {
    const stats = new Map<string, { bookings: number; invoices: number }>();
    customers.forEach((c) => {
      const phone = c.phone ? normalizePhone(c.phone) : "";
      const email = c.email?.toLowerCase() || "";
      const name = c.name.toLowerCase();

      let invCount = 0;
      allInvoices.forEach((inv) => {
        if (phone && inv.customerPhone && normalizePhone(inv.customerPhone) === phone) { invCount++; return; }
        if (email && inv.customerEmail?.toLowerCase() === email) { invCount++; return; }
        if (name && name !== "-" && inv.customerName?.toLowerCase() === name) { invCount++; }
      });

      stats.set(c.key, { bookings: c.totalBookings, invoices: invCount });
    });
    return stats;
  }, [customers, allInvoices]);

  // Totals after merge
  const totalBookings = Array.from(customerStats.values()).reduce((s, v) => s + v.bookings, 0);
  const totalInvoices = Array.from(customerStats.values()).reduce((s, v) => s + v.invoices, 0);

  // Get field value for a customer
  function getField(c: Customer, field: string): string {
    switch (field) {
      case "name": return c.name || "—";
      case "phone": return c.phone ? formatPhone(c.phone) : "—";
      case "email": return c.email || "—";
      case "address": return c.address || "—";
      case "type": return "Residential";
      default: return "—";
    }
  }

  function getRawField(c: Customer, field: string): string | undefined {
    switch (field) {
      case "name": return c.name;
      case "phone": return c.phone;
      case "email": return c.email;
      case "address": return c.address;
      case "type": return "Residential";
      default: return undefined;
    }
  }

  // Fields for comparison
  const fields = ["name", "phone", "email", "address", "type"];
  const fieldLabels: Record<string, string> = {
    name: "Name",
    phone: "Phone",
    email: "Email",
    address: "Address",
    type: "Type",
  };

  async function handleMerge() {
    setMerging(true);
    setError(null);

    try {
      const primary = customers.find((c) => c.key === primaryKey)!;
      const secondaries = customers.filter((c) => c.key !== primaryKey);

      // Build merged field values
      const mergedName = getRawField(customers.find((c) => c.key === fieldSelections.name)!, "name") || primary.name;
      const mergedPhone = getRawField(customers.find((c) => c.key === fieldSelections.phone)!, "phone");
      const mergedEmail = getRawField(customers.find((c) => c.key === fieldSelections.email)!, "email");
      const mergedAddress = getRawField(customers.find((c) => c.key === fieldSelections.address)!, "address");

      const batch = writeBatch(db);

      // 1. Update all primary customer bookings with merged field values
      for (const b of primary.bookings) {
        batch.update(doc(db, "bookings", b.id), {
          name: mergedName,
          phone: mergedPhone || null,
          email: mergedEmail || null,
          address: mergedAddress || null,
          updatedAt: serverTimestamp(),
        });
      }

      // 2. Transfer secondary bookings to primary
      for (const sec of secondaries) {
        for (const b of sec.bookings) {
          batch.update(doc(db, "bookings", b.id), {
            name: mergedName,
            phone: mergedPhone || null,
            email: mergedEmail || null,
            address: mergedAddress || null,
            customerDeleted: false,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // 3. Transfer invoices: query by secondary customer identifiers
      for (const sec of secondaries) {
        const secPhone = sec.phone ? normalizePhone(sec.phone) : "";
        const secEmail = sec.email?.toLowerCase() || "";
        const secName = sec.name.toLowerCase();

        // Find matching invoices from the allInvoices list
        const matchingInvoiceIds = new Set<string>();
        allInvoices.forEach((inv) => {
          if (secPhone && inv.customerPhone && normalizePhone(inv.customerPhone) === secPhone) {
            matchingInvoiceIds.add(inv.id);
            return;
          }
          if (secEmail && inv.customerEmail?.toLowerCase() === secEmail) {
            matchingInvoiceIds.add(inv.id);
            return;
          }
          if (secName && secName !== "-" && inv.customerName?.toLowerCase() === secName) {
            matchingInvoiceIds.add(inv.id);
          }
        });

        for (const invId of matchingInvoiceIds) {
          batch.update(doc(db, "invoices", invId), {
            customerName: mergedName,
            customerPhone: mergedPhone || "",
            customerEmail: mergedEmail || "",
            updatedAt: serverTimestamp(),
          });
        }

        // 4. Mark secondary customer's bookings as belonging to primary
        //    (they're already updated above, but also delete secondary from customers collection if it exists)
        // Try to delete from customers collection (may not exist)
        // We'll query for it
        const custQuery = query(
          collection(db, "customers"),
          where("phone", "==", sec.phone || null),
        );
        const custSnap = await getDocs(custQuery);
        custSnap.docs.forEach((d) => {
          batch.delete(d.ref);
        });

        if (sec.email) {
          const custEmailQuery = query(
            collection(db, "customers"),
            where("email", "==", sec.email.toLowerCase()),
          );
          const custEmailSnap = await getDocs(custEmailQuery);
          custEmailSnap.docs.forEach((d) => {
            batch.delete(d.ref);
          });
        }
      }

      await batch.commit();
      onMerged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Merge failed. No changes were made.");
    } finally {
      setMerging(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-[70]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl w-[600px] max-h-[90vh] overflow-y-auto mx-4">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0B2040]">Merge Customers</h3>
              <button onClick={onClose} className="text-xl text-gray-500 cursor-pointer hover:text-gray-700">
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Choose the primary record. All bookings, invoices, and history from the other record will be moved to the primary.
            </p>
          </div>

          {/* Primary selection */}
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Primary Record</p>
            <div className="flex gap-2">
              {customers.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setPrimaryKey(c.key)}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition border ${
                    primaryKey === c.key
                      ? "bg-blue-50 border-blue-300 text-blue-800"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Field comparison */}
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Choose values to keep</p>
            <div className="flex flex-col gap-1">
              {fields.map((field) => (
                <div key={field} className="flex items-center gap-2 py-1.5">
                  <span className="text-xs font-semibold text-gray-500 w-16 shrink-0">{fieldLabels[field]}</span>
                  <div className="flex-1 flex gap-2">
                    {customers.map((c) => {
                      const val = getField(c, field);
                      const isSelected = fieldSelections[field] === c.key;
                      return (
                        <button
                          key={c.key}
                          onClick={() => setFieldSelections((p) => ({ ...p, [field]: c.key }))}
                          className={`flex-1 px-3 py-2 rounded-lg text-[13px] text-left cursor-pointer transition border ${
                            isSelected
                              ? "bg-blue-50 border-blue-300 text-[#0B2040] font-medium"
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Vehicles (checkboxes) */}
              {allVehicles.length > 0 && (
                <div className="flex items-start gap-2 py-1.5">
                  <span className="text-xs font-semibold text-gray-500 w-16 shrink-0 pt-2">Vehicles</span>
                  <div className="flex-1 flex flex-col gap-1.5">
                    {allVehicles.map(([v]) => (
                      <label
                        key={v}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                          selectedVehicles.has(v)
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedVehicles.has(v)}
                          onChange={(e) => {
                            setSelectedVehicles((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(v);
                              else next.delete(v);
                              return next;
                            });
                          }}
                          className="accent-blue-600"
                        />
                        <span className="text-[13px] text-[#0B2040]">{v}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Linked records summary */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Linked Records</p>
            {customers.map((c) => {
              const stats = customerStats.get(c.key);
              return (
                <p key={c.key} className="text-sm text-gray-600">
                  <strong>{c.name}</strong> has {stats?.bookings ?? 0} booking{(stats?.bookings ?? 0) !== 1 ? "s" : ""} and {stats?.invoices ?? 0} invoice{(stats?.invoices ?? 0) !== 1 ? "s" : ""}
                </p>
              );
            })}
            <p className="text-sm font-semibold text-[#0B2040] mt-2">
              After merge: {totalBookings} booking{totalBookings !== 1 ? "s" : ""} and {totalInvoices} invoice{totalInvoices !== 1 ? "s" : ""} linked to the primary record
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="px-6 py-3 bg-red-50 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleMerge}
              disabled={merging}
              className="px-5 py-2.5 bg-blue-600 rounded-lg text-sm font-semibold text-white cursor-pointer hover:bg-blue-700 transition disabled:opacity-50"
            >
              {merging ? "Merging..." : "Merge Customers"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
