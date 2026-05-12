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

type CustomerType = 'Residential' | 'Commercial';

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  type: CustomerType;
  vehicle: string;
  notes: string;
}

const EMPTY: FormState = {
  firstName: '', lastName: '', phone: '', email: '', address: '', type: 'Residential', vehicle: '', notes: '',
};

export function NewCustomerModal() {
  const { activeModal, prefill, closeModal } = useAdminModal();
  const open = activeModal === 'customer';
  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY,
    firstName: prefill?.customer?.name?.split(' ')[0] ?? '',
    lastName: prefill?.customer?.name?.split(' ').slice(1).join(' ') ?? '',
    phone: prefill?.customer?.phone ?? '',
    email: prefill?.customer?.email ?? '',
    address: prefill?.customer?.address ?? '',
  }));
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First and last name required');
      return;
    }
    setSaving(true);
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
    const phoneDigits = form.phone.replace(/\D/g, '');
    const emailNorm = form.email.trim().toLowerCase();
    try {
      // A3b-1 rewrite per walkthrough Decision 4: writes to customers, not bookings.
      await addDoc(collection(db, 'customers'), {
        name: fullName,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        fullName,
        phone: phoneDigits || null,
        phoneNormalized: phoneDigits || null,
        email: emailNorm || null,
        address: form.address.trim() || null,
        type: form.type,
        vehicleMake: form.vehicle.trim() || null,
        notes: form.notes.trim() || null,
        source: 'admin-manual',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Customer ${fullName} added`);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <Field label="First name *">
            <Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Last name *">
            <Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Address" className="col-span-2">
            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Type">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as CustomerType })} className="h-9 px-2 border border-border rounded-md bg-background text-sm w-full">
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
          </Field>
          <Field label="Vehicle">
            <Input value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} placeholder="e.g. 2020 Honda Civic" />
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
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Add customer'}</Button>
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
