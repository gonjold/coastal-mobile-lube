'use client';

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@coastal/shared-ui';
import { db } from '@/lib/firebase';
import { useAdminModal } from '@/lib/AdminModalContext';

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  service: string;
  serviceCategory: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  preferredDate: string;
  timeWindow: string;
  notes: string;
}

const EMPTY: FormState = {
  name: '', phone: '', email: '', address: '', service: '', serviceCategory: 'auto',
  vehicleYear: '', vehicleMake: '', vehicleModel: '', vin: '',
  preferredDate: '', timeWindow: 'morning', notes: '',
};

const TIME_WINDOWS = [
  { value: 'early-morning', label: 'Early morning (7am)' },
  { value: 'morning', label: 'Morning (9am)' },
  { value: 'midday', label: 'Midday (11am)' },
  { value: 'afternoon', label: 'Afternoon (1pm)' },
  { value: 'late-afternoon', label: 'Late afternoon (3pm)' },
];

const CATEGORIES = [
  { value: 'auto', label: 'Auto' },
  { value: 'marine', label: 'Marine' },
  { value: 'fleet', label: 'Fleet' },
  { value: 'rv', label: 'RV' },
];

/** A3b-1 simplified port. Captures essential booking fields and writes to
 * Firestore. The full marketing NewBookingModal (services hook, VIN decode,
 * vehicle make/model dropdowns) stays in marketing for Jason; A3c canonicalizes
 * a single richer modal in shared-ui. */
export function NewBookingModal() {
  const { activeModal, prefill, closeModal } = useAdminModal();
  const open = activeModal === 'booking';
  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY,
    name: prefill?.customer?.name ?? '',
    phone: prefill?.customer?.phone ?? '',
    email: prefill?.customer?.email ?? '',
    address: prefill?.customer?.address ?? '',
  }));
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name.trim()) {
      toast.error('Customer name required');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, '') || null,
        email: form.email.trim().toLowerCase() || null,
        address: form.address.trim() || null,
        service: form.service.trim() || null,
        serviceCategory: form.serviceCategory,
        vehicleYear: form.vehicleYear.trim() || null,
        vehicleMake: form.vehicleMake.trim() || null,
        vehicleModel: form.vehicleModel.trim() || null,
        vin: form.vin.trim() || null,
        preferredDate: form.preferredDate || null,
        timeWindow: form.timeWindow,
        notes: form.notes.trim() || null,
        source: 'admin-manual',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Booking created for ${form.name.trim()}`);
      setForm(EMPTY);
      closeModal();
    } catch (err) {
      toast.error('Save failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) closeModal(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <Field label="Customer name *" className="col-span-2">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Address" className="col-span-2">
            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Service">
            <Input value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} placeholder="e.g. Oil change" />
          </Field>
          <Field label="Category">
            <select value={form.serviceCategory} onChange={e => setForm({ ...form, serviceCategory: e.target.value })} className="h-9 px-2 border border-border rounded-md bg-background text-sm w-full">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Year"><Input value={form.vehicleYear} onChange={e => setForm({ ...form, vehicleYear: e.target.value })} /></Field>
          <Field label="Make"><Input value={form.vehicleMake} onChange={e => setForm({ ...form, vehicleMake: e.target.value })} /></Field>
          <Field label="Model"><Input value={form.vehicleModel} onChange={e => setForm({ ...form, vehicleModel: e.target.value })} /></Field>
          <Field label="VIN"><Input value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value })} /></Field>
          <Field label="Preferred date">
            <Input type="date" value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value })} />
          </Field>
          <Field label="Time window">
            <select value={form.timeWindow} onChange={e => setForm({ ...form, timeWindow: e.target.value })} className="h-9 px-2 border border-border rounded-md bg-background text-sm w-full">
              {TIME_WINDOWS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Notes" className="col-span-2">
            <textarea
              className="w-full text-sm border border-border rounded-md p-2 min-h-[60px] bg-background"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Create booking'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </label>
  );
}
