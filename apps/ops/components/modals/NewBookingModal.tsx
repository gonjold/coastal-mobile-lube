'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  writeBatch,
  doc,
  getDoc,
} from 'firebase/firestore';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@coastal/shared-ui';
import { db } from '@/lib/firebase';
import { useAdminModal } from '@/lib/AdminModalContext';
import { useServices, type Service } from '@/hooks/useServices';
import {
  decodeVIN,
  getYears,
  getMakes,
  getModels,
  getFuelCategory,
} from '@/lib/vehicleApi';
import { formatCurrency } from '@/lib/formatCurrency';

/* ── A3c canonicalization candidates ─────────────────────────
   Minimal local shapes + helpers below mirror the subset of
   apps/marketing/src/app/admin/shared.ts that this modal needs
   (Booking, Customer, buildCustomerList, formatPhone, toISODate).
   Canonicalize into @coastal/shared-types in A3c.
   ──────────────────────────────────────────────────────────── */

type FirestoreTimestamp = { toDate: () => Date };

interface Booking {
  id: string;
  name?: string;
  customerName?: string;
  phone?: string;
  customerPhone?: string;
  email?: string;
  customerEmail?: string;
  address?: string;
  status?: string;
  createdAt?: FirestoreTimestamp;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vesselYear?: string;
  vesselMake?: string;
  vesselModel?: string;
}

interface Customer {
  key: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalBookings: number;
  lastBookingDate: string;
  lastBookingStatus?: string;
  bookings: Booking[];
}

function formatPhone(phone?: string): string {
  if (!phone) return '-';
  const d = phone.replace(/\D/g, '');
  if (d.length === 10)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildCustomerList(bookings: Booking[]): Customer[] {
  const map = new Map<string, Booking[]>();
  bookings.forEach((b) => {
    const phone = b.phone || b.customerPhone;
    const email = b.email || b.customerEmail;
    const key = phone?.replace(/\D/g, '') || email?.toLowerCase() || b.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  });

  const customers: Customer[] = [];
  map.forEach((bks, key) => {
    const sorted = [...bks].sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
      return bTime - aTime;
    });
    const latest = sorted[0];
    customers.push({
      key,
      name: latest.name || latest.customerName || '-',
      phone: latest.phone || latest.customerPhone,
      email: latest.email || latest.customerEmail,
      address: latest.address,
      totalBookings: sorted.length,
      lastBookingDate: '',
      lastBookingStatus: latest.status,
      bookings: sorted,
    });
  });

  customers.sort((a, b) => {
    const aTime = a.bookings[0]?.createdAt?.toDate?.()?.getTime() ?? 0;
    const bTime = b.bookings[0]?.createdAt?.toDate?.()?.getTime() ?? 0;
    return bTime - aTime;
  });

  return customers;
}

/* ── Time slots: 8:00 AM – 4:30 PM in 30-min increments ── */

const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 16; h++) {
  for (const m of [0, 30]) {
    const hour12 = h > 12 ? h - 12 : h;
    const amPm = h >= 12 ? 'PM' : 'AM';
    TIME_SLOTS.push(`${hour12}:${m === 0 ? '00' : '30'} ${amPm}`);
  }
}

const DIVISIONS = ['Auto', 'Marine', 'Fleet', 'RV'];

const COMMON_MAKES = [
  'Acura', 'Alfa Romeo', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet',
  'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'Genesis', 'GMC', 'Honda',
  'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Land Rover',
  'Lexus', 'Lincoln', 'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz',
  'Mercury', 'Mini', 'Mitsubishi', 'Nissan', 'Pontiac', 'Porsche', 'Ram',
  'Rivian', 'Rolls-Royce', 'Saturn', 'Scion', 'Subaru', 'Tesla', 'Toyota',
  'Volkswagen', 'Volvo',
];

function parseVehicleText(text: string): { year?: string; make?: string; model?: string } {
  const tokens = text.trim().split(/\s+/);
  let year: string | undefined;
  let make: string | undefined;
  const rest: string[] = [];

  for (const tok of tokens) {
    if (!year && /^\d{4}$/.test(tok)) {
      const y = parseInt(tok, 10);
      if (y >= 1990 && y <= 2030) { year = tok; continue; }
    }
    if (!make) {
      const found = COMMON_MAKES.find((m) => m.toLowerCase() === tok.toLowerCase());
      if (found) { make = found; continue; }
      if (rest.length > 0) {
        const twoWord = `${rest[rest.length - 1]} ${tok}`;
        const found2 = COMMON_MAKES.find((m) => m.toLowerCase() === twoWord.toLowerCase());
        if (found2) { rest.pop(); make = found2; continue; }
      }
    }
    rest.push(tok);
  }

  return { year, make, model: rest.join(' ') || undefined };
}

/* ── Types ── */

interface PreFilledCustomer {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

/* ── Component ── */

export function NewBookingModal() {
  const { activeModal, prefill, closeModal } = useAdminModal();
  const open = activeModal === 'booking';

  const preFilledCustomer: PreFilledCustomer | null = prefill?.customer?.name
    ? {
        name: prefill.customer.name,
        phone: prefill.customer.phone,
        email: prefill.customer.email,
        address: prefill.customer.address,
      }
    : null;

  /* Form state */
  const [customer, setCustomer] = useState<PreFilledCustomer | null>(
    preFilledCustomer || null,
  );
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [creatingNewCustomer, setCreatingNewCustomer] = useState(false);
  const [newCustFirst, setNewCustFirst] = useState('');
  const [newCustLast, setNewCustLast] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  /* Vehicle state */
  const [vinInput, setVinInput] = useState('');
  const [vinStatus, setVinStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleTrim, setVehicleTrim] = useState('');
  const [engineSize, setEngineSize] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [isHybrid, setIsHybrid] = useState(false);
  const [isElectric, setIsElectric] = useState(false);
  const [isDiesel, setIsDiesel] = useState(false);
  const [yearOptions] = useState(() => getYears());
  const [makeOptions, setMakeOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [makesLoading, setMakesLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [vehicleSearchText, setVehicleSearchText] = useState('');
  const [showManualVehicle, setShowManualVehicle] = useState(false);

  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toISODate(tomorrow);
  });
  const [time, setTime] = useState('');
  const [address, setAddress] = useState(preFilledCustomer?.address || '');
  const [division, setDivision] = useState('Auto');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  /* Convenience fee */
  const [feeConfig, setFeeConfig] = useState<{
    enabled: boolean; amount: number; label: string; taxable: boolean; waiveFirstService: boolean;
  } | null>(null);
  const [feeWaived, setFeeWaived] = useState(false);
  const [feeWaivedReason, setFeeWaivedReason] = useState<string | null>(null);

  /* Data sources */
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { services } = useServices();
  const customerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLDivElement>(null);

  /* Load fee config from Firestore */
  useEffect(() => {
    async function loadFees() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'fees'));
        if (snap.exists()) {
          const data = snap.data()?.convenienceFee;
          if (data) setFeeConfig(data);
        } else {
          const { setDoc } = await import('firebase/firestore');
          const defaultFee = {
            convenienceFee: {
              enabled: true,
              amount: 39.95,
              label: 'Mobile Service Fee',
              taxable: false,
              waiveFirstService: true,
              promoOverride: null,
            },
          };
          await setDoc(doc(db, 'settings', 'fees'), defaultFee);
          setFeeConfig(defaultFee.convenienceFee);
        }
      } catch { /* silent */ }
    }
    loadFees();
  }, []);

  /* Load bookings for customer search */
  useEffect(() => {
    const q = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc'),
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
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* Group services by division */
  const servicesByDivision = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    services.forEach((s) => {
      if (!s.isActive) return;
      const div =
        (s.division || 'auto').charAt(0).toUpperCase() +
        (s.division || 'auto').slice(1);
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
        .join(' ');
      if (v) vehicleSet.add(v);
      const vessel = [b.vesselYear, b.vesselMake, b.vesselModel]
        .filter(Boolean)
        .join(' ');
      if (vessel) vehicleSet.add(vessel);
    });
    return Array.from(vehicleSet);
  }, [customer, customers]);

  /* Check if customer is first-time -> auto-waive fee */
  const isFirstTimeCustomer = useMemo(() => {
    if (!customer) return false;
    const matched = customers.find((c) => c.name === customer.name);
    if (!matched) return true; // new customer
    return matched.bookings.filter((b) => b.status === 'completed').length === 0;
  }, [customer, customers]);

  useEffect(() => {
    if (feeConfig?.waiveFirstService && isFirstTimeCustomer) {
      setFeeWaived(true);
      setFeeWaivedReason('first_service');
    } else if (feeWaivedReason === 'first_service') {
      setFeeWaived(false);
      setFeeWaivedReason(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstTimeCustomer, feeConfig]);

  /* Load makes when year changes */
  useEffect(() => {
    if (!vehicleYear) { setMakeOptions([]); return; }
    let cancelled = false;
    setMakesLoading(true);
    getMakes().then((m) => { if (!cancelled) { setMakeOptions(m); setMakesLoading(false); } });
    return () => { cancelled = true; };
  }, [vehicleYear]);

  /* Load models when make changes */
  useEffect(() => {
    if (!vehicleYear || !vehicleMake) { setModelOptions([]); return; }
    let cancelled = false;
    setModelsLoading(true);
    getModels(vehicleYear, vehicleMake).then((m) => { if (!cancelled) { setModelOptions(m); setModelsLoading(false); } });
    return () => { cancelled = true; };
  }, [vehicleYear, vehicleMake]);

  /* VIN decode handler */
  async function handleVinDecode() {
    if (!vinInput.trim()) return;
    setVinStatus('loading');
    const result = await decodeVIN(vinInput.trim());
    if (result) {
      setVehicleYear(result.year);
      setVehicleMake(result.make);
      setVehicleModel(result.model);
      setVehicleTrim(result.trim);
      setEngineSize(result.engineSize);
      setFuelType(result.fuelType);
      setIsHybrid(result.isHybrid);
      setIsElectric(result.isElectric);
      setIsDiesel(result.isDiesel);
      setVinStatus('success');
    } else {
      setVinStatus('error');
    }
  }

  /* Computed vehicle string for saving */
  const vehicleString = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ');

  /* Fuel category for service filtering */
  const fuelCategory = getFuelCategory(fuelType);

  /* Estimated total */
  const servicesTotalOnly = selectedServices.reduce(
    (sum, s) => sum + (s.price || 0),
    0,
  );
  const feeAmount = feeConfig?.enabled && !feeWaived ? feeConfig.amount : 0;
  const estimatedTotal = servicesTotalOnly + feeAmount;

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
    setCustomerQuery('');
    setShowCustomerDropdown(false);
    if (c.address && !address) setAddress(c.address);
  }

  function clearCustomer() {
    setCustomer(null);
    setCustomerQuery('');
    setAddress('');
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

  async function handleCreate(status: 'pending' | 'draft') {
    const hasCustomer = customer || (creatingNewCustomer && newCustFirst.trim() && newCustLast.trim());
    if (!hasCustomer || !date || !time) return;
    setSaving(true);
    try {
      const bookingData: Record<string, unknown> = {
        selectedServices: selectedServices.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          category: s.category,
        })),
        vehicle: vehicleString || null,
        vehicleYear: vehicleYear || null,
        vehicleMake: vehicleMake || null,
        vehicleModel: vehicleModel || null,
        vin: vinInput.trim() || null,
        fuelType: fuelType || null,
        preferredDate: date,
        timeWindow: time,
        division: division.toLowerCase(),
        notes: notes || null,
        status,
        source: 'Admin',
        totalEstimate: estimatedTotal,
        convenienceFee: {
          amount: feeWaived ? 0 : (feeConfig?.amount || 0),
          waived: feeWaived,
          waivedReason: feeWaivedReason,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (creatingNewCustomer) {
        /* Create new customer + booking atomically */
        const fullName = `${newCustFirst.trim()} ${newCustLast.trim()}`;
        const customerData = {
          name: fullName,
          firstName: newCustFirst.trim(),
          lastName: newCustLast.trim(),
          fullName,
          phone: newCustPhone.replace(/\D/g, '') || null,
          email: newCustEmail.trim().toLowerCase() || null,
          address: newCustAddress.trim() || address || null,
          source: 'admin-manual',
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        /* Firestore batch doesn't support addDoc, so create refs manually */
        const batch = writeBatch(db);
        const custRef = doc(collection(db, 'customers'));
        batch.set(custRef, customerData);
        const bookRef = doc(collection(db, 'bookings'));
        batch.set(bookRef, {
          ...bookingData,
          name: fullName,
          firstName: newCustFirst.trim(),
          lastName: newCustLast.trim(),
          fullName,
          phone: newCustPhone.replace(/\D/g, '') || null,
          email: newCustEmail.trim().toLowerCase() || null,
          address: address || newCustAddress.trim() || null,
          customerId: custRef.id,
        });
        await batch.commit();
      } else {
        /* Existing customer */
        await addDoc(collection(db, 'bookings'), {
          ...bookingData,
          name: customer!.name,
          phone: customer!.phone || null,
          email: customer!.email || null,
          address: address || null,
        });
      }
      closeModal();
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  }

  /* Validation */
  const hasValidCustomer = !!customer || (creatingNewCustomer && !!newCustFirst.trim() && !!newCustLast.trim());
  const isValid =
    hasValidCustomer && !!date && !!time;

  const inputCls =
    'border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm w-full focus:border-[#1A5FAC] focus:ring-1 focus:ring-[#1A5FAC] outline-none transition';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeModal(); }}>
      <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 py-5 border-b border-gray-200">
          <DialogTitle className="text-lg font-bold text-[#0B2040]">New Booking</DialogTitle>
        </DialogHeader>

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
                          {c.phone ? formatPhone(c.phone) : ''}{' '}
                          {c.email ? `· ${c.email}` : ''}
                        </div>
                      </button>
                    ))}
                    {customerQuery.trim() && (
                      <button
                        onClick={() => {
                          const parts = customerQuery.trim().split(/\s+/);
                          setNewCustFirst(parts[0] || '');
                          setNewCustLast(parts.slice(1).join(' ') || '');
                          setCreatingNewCustomer(true);
                          setShowCustomerDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-t border-gray-100 text-sm font-medium text-[#1A5FAC]"
                      >
                        + Create &ldquo;{customerQuery.trim()}&rdquo; as new customer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── DNC Warning ── */}
          {customer && (() => {
            const matched = customers.find((c) => c.name === customer.name);
            const prefs = matched?.bookings[0] && (matched.bookings[0] as unknown as Record<string, unknown>).communicationPreferences as { doNotCall?: boolean; doNotText?: boolean; doNotEmail?: boolean } | undefined;
            if (!prefs) return null;
            const flags: string[] = [];
            if (prefs.doNotCall) flags.push('call');
            if (prefs.doNotText) flags.push('text');
            if (prefs.doNotEmail) flags.push('email');
            if (flags.length === 0) return null;
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800 -mt-2">
                This customer has opted out of <strong>{flags.join('/')}</strong>. Contact through other channels.
              </div>
            );
          })()}

          {/* ── Inline new customer ── */}
          {creatingNewCustomer && !customer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 -mt-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#1A5FAC] uppercase">New Customer</span>
                <button
                  onClick={() => { setCreatingNewCustomer(false); setNewCustFirst(''); setNewCustLast(''); setNewCustPhone(''); setNewCustEmail(''); setNewCustAddress(''); }}
                  className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input type="text" value={newCustFirst} onChange={(e) => setNewCustFirst(e.target.value)} className={inputCls} placeholder="First name" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" value={newCustLast} onChange={(e) => setNewCustLast(e.target.value)} className={inputCls} placeholder="Last name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phone</label>
                  <input type="tel" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} className={inputCls} placeholder="(813) 555-1234" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input type="email" value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)} className={inputCls} placeholder="customer@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Address</label>
                <input type="text" value={newCustAddress} onChange={(e) => setNewCustAddress(e.target.value)} className={inputCls} placeholder="Street address" />
              </div>
            </div>
          )}

          {/* ── Vehicle ── */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Vehicle
            </label>

            {/* Previous vehicles for this customer */}
            {customer && customerVehicles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {customerVehicles.map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      const parts = v.split(' ');
                      if (parts.length >= 3) {
                        setVehicleYear(parts[0]);
                        setVehicleMake(parts[1]);
                        setVehicleModel(parts.slice(2).join(' '));
                      } else if (parts.length === 2) {
                        setVehicleMake(parts[0]);
                        setVehicleModel(parts[1]);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md cursor-pointer transition ${
                      vehicleString === v
                        ? 'bg-[#0B2040] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}

            {/* VIN input */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={vinInput}
                onChange={(e) => { setVinInput(e.target.value.toUpperCase()); setVinStatus('idle'); }}
                placeholder="Enter VIN to auto-fill"
                className={`${inputCls} flex-1`}
              />
              <button
                onClick={handleVinDecode}
                disabled={vinStatus === 'loading' || !vinInput.trim()}
                className="px-4 py-2.5 bg-[#1A5FAC] text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#174f94] transition disabled:opacity-50 shrink-0"
              >
                {vinStatus === 'loading' ? 'Decoding...' : 'Decode'}
              </button>
              {vinStatus === 'success' && (
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1 shrink-0">
                  <span>&#10003;</span> Decoded
                </span>
              )}
              {vinStatus === 'error' && (
                <span className="text-xs text-red-500 font-semibold shrink-0">Invalid VIN</span>
              )}
            </div>

            {/* VIN decode result summary */}
            {vinStatus === 'success' && (vehicleTrim || engineSize || isHybrid || isElectric || isDiesel) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {vehicleTrim && (
                  <span className="inline-flex items-center bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-md">
                    {vehicleTrim}
                  </span>
                )}
                {engineSize && (
                  <span className="text-xs text-gray-500">{engineSize}</span>
                )}
                {isHybrid && (
                  <span className="inline-flex items-center bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded-md">
                    Hybrid
                  </span>
                )}
                {isDiesel && (
                  <span className="inline-flex items-center bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-md">
                    Diesel
                  </span>
                )}
                {isElectric && (
                  <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-md">
                    Electric
                  </span>
                )}
              </div>
            )}

            {/* Quick Vehicle Search */}
            <div className="mt-3">
              <input
                type="text"
                value={vehicleSearchText}
                onChange={(e) => setVehicleSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const parsed = parseVehicleText(vehicleSearchText);
                    if (parsed.year) setVehicleYear(parsed.year);
                    if (parsed.make) setVehicleMake(parsed.make);
                    if (parsed.model) setVehicleModel(parsed.model);
                    setShowManualVehicle(true);
                  }
                }}
                onBlur={() => {
                  if (!vehicleSearchText.trim()) return;
                  const parsed = parseVehicleText(vehicleSearchText);
                  if (parsed.year) setVehicleYear(parsed.year);
                  if (parsed.make) setVehicleMake(parsed.make);
                  if (parsed.model) setVehicleModel(parsed.model);
                  if (parsed.year || parsed.make || parsed.model) setShowManualVehicle(true);
                }}
                placeholder="Search vehicle... (e.g. 2024 Toyota Camry)"
                className={inputCls}
              />
            </div>

            {/* Manual Y/M/M toggle */}
            {!showManualVehicle && !vehicleYear && (
              <button
                onClick={() => setShowManualVehicle(!showManualVehicle)}
                className="text-xs text-[#1A5FAC] mt-1 cursor-pointer"
              >
                Or select year/make/model manually
              </button>
            )}

            {/* Year / Make / Model dropdowns */}
            {(showManualVehicle || !!vehicleYear) && (
              <>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <select
                    value={vehicleYear}
                    onChange={(e) => { setVehicleYear(e.target.value); setVehicleMake(''); setVehicleModel(''); }}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#1A5FAC] outline-none bg-white"
                  >
                    <option value="" className="text-gray-400">Year</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <select
                    value={vehicleMake}
                    onChange={(e) => { setVehicleMake(e.target.value); setVehicleModel(''); }}
                    disabled={!vehicleYear}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#1A5FAC] outline-none bg-white disabled:opacity-50"
                  >
                    <option value="" className="text-gray-400">{makesLoading ? 'Loading...' : 'Make'}</option>
                    {makeOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    disabled={!vehicleMake}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#1A5FAC] outline-none bg-white disabled:opacity-50"
                  >
                    <option value="" className="text-gray-400">{modelsLoading ? 'Loading...' : 'Model'}</option>
                    {modelOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Engine / Fuel Type */}
                <div className="mt-3">
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#1A5FAC] outline-none bg-white w-full sm:w-1/2"
                  >
                    <option value="">Fuel Type</option>
                    <option value="Gas">Gas</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                    <option value="Flex Fuel">Flex Fuel</option>
                    <option value="Plug-in Hybrid">Plug-in Hybrid</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* ── Services ── */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              Service
            </label>

            {/* Selected service pills */}
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedServices.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 bg-[#F0F7FF] text-[#1A5FAC] text-xs font-medium px-2.5 py-1.5 rounded-md"
                  >
                    {s.name}{' '}
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
              <Command className="border border-gray-200 rounded-lg bg-white overflow-visible [&_[data-slot=command-input-wrapper]]:border-b-0">
                <CommandInput
                  placeholder="Search services..."
                  onFocus={() => setShowServiceDropdown(true)}
                  onValueChange={() => setShowServiceDropdown(true)}
                />
                {showServiceDropdown && (
                  <CommandList className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-[260px]">
                    <CommandEmpty>No services match.</CommandEmpty>
                    {DIVISIONS.map((div) => {
                  const divServices = servicesByDivision[div];
                  if (!divServices?.length) return null;

                  /* Annotate and sort services based on fuelCategory */
                  const annotated = divServices.map((s) => {
                    const name = s.name.toLowerCase();
                    const isDieselService = name.includes('diesel');
                    const isOilChange = name.includes('oil change') || name.includes('oil service');
                    let annotation = '';
                    let dimmed = false;

                    if (fuelCategory === 'diesel') {
                      if (isDieselService) annotation = 'Recommended for diesel';
                    } else if (fuelCategory === 'electric') {
                      if (isOilChange || isDieselService) { annotation = 'Not compatible'; dimmed = true; }
                    } else if (fuelCategory === 'hybrid') {
                      if (isDieselService) { annotation = 'Not compatible'; dimmed = true; }
                    } else {
                      if (isDieselService) { annotation = 'Diesel vehicles only'; dimmed = true; }
                    }
                    return { service: s, annotation, dimmed };
                  });

                  /* Sort: non-dimmed first */
                  annotated.sort((a, b) => (a.dimmed === b.dimmed ? 0 : a.dimmed ? 1 : -1));

                  const heading = div === 'Auto' ? 'Automotive' : div;
                  return (
                    <CommandGroup key={div} heading={heading}>
                      {annotated.map(({ service: s, annotation, dimmed }) => {
                        const isSelected = selectedServices.some(
                          (sel) => sel.id === s.id,
                        );
                        return (
                          <CommandItem
                            key={s.id}
                            value={`${heading} ${s.name} ${s.category}`}
                            onSelect={() => toggleService(s)}
                            className={
                              isSelected
                                ? 'bg-[#EBF4FF] text-[#1A5FAC] font-medium'
                                : dimmed
                                  ? 'text-gray-400'
                                  : ''
                            }
                          >
                            <span className="flex-1">{s.name}</span>
                            {annotation && (
                              <span className={`ml-2 text-[10px] font-semibold ${dimmed ? 'text-gray-400' : 'text-green-600'}`}>
                                {annotation}
                              </span>
                            )}
                            <span className="ml-2 text-gray-500">
                              ${s.price}
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  );
                })}
                  </CommandList>
                )}
              </Command>
            </div>
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
              placeholder="E.g.: Keys will be at reception, ask for Ana. Call (813) 555-1234 upon arrival. Access code: #1234. Car is on parking level 2, spot 45."
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
              {/* Convenience fee line */}
              {feeConfig?.enabled && (
                <div className="flex justify-between text-sm text-[#0B2040] py-0.5">
                  <span className={feeWaived ? 'line-through text-gray-400' : ''}>
                    {feeConfig.label}
                  </span>
                  <span className="flex items-center gap-2">
                    {feeWaived && (
                      <span className="text-xs text-green-600 font-medium">
                        Waived{feeWaivedReason === 'first_service' ? ' - first service' : ''}
                      </span>
                    )}
                    <span className={`font-medium ${feeWaived ? 'line-through text-gray-400' : ''}`}>
                      {formatCurrency(feeConfig.amount)}
                    </span>
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#0B2040] pt-2 mt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(estimatedTotal)}</span>
              </div>
              {/* Admin waive toggle */}
              {feeConfig?.enabled && (
                <button
                  type="button"
                  onClick={() => {
                    if (feeWaived && feeWaivedReason !== 'first_service') {
                      setFeeWaived(false);
                      setFeeWaivedReason(null);
                    } else if (!feeWaived) {
                      setFeeWaived(true);
                      setFeeWaivedReason('admin_override');
                    } else {
                      setFeeWaived(false);
                      setFeeWaivedReason(null);
                    }
                  }}
                  className="text-xs text-blue-600 cursor-pointer mt-2 hover:underline"
                >
                  {feeWaived ? 'Restore Mobile Service Fee' : 'Waive Mobile Service Fee'}
                </button>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={closeModal} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleCreate('draft')}
            disabled={!isValid || saving}
          >
            Save Draft
          </Button>
          <Button
            onClick={() => handleCreate('pending')}
            disabled={!isValid || saving}
            className="bg-[#E07B2D] hover:bg-[#CC6A1F] text-white"
          >
            {saving ? 'Creating...' : 'Create Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
