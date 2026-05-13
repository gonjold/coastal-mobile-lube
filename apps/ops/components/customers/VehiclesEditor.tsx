'use client';

import { useEffect, useState } from 'react';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@coastal/shared-ui';
import { decodeVIN } from '@/lib/vehicleApi';
import {
  type Asset,
  type VehicleAsset,
  createAsset,
  listAssetsForCustomer,
  countBookingsReferencingAsset,
  softDeleteAsset,
  updateAsset,
} from '@/lib/assets';

interface Props {
  customerId: string;
}

interface VehicleFormState {
  year: string;
  make: string;
  model: string;
  trim: string;
  vin: string;
  licensePlate: string;
  color: string;
  nickname: string;
  mileage: string;
}

const EMPTY_FORM: VehicleFormState = {
  year: '',
  make: '',
  model: '',
  trim: '',
  vin: '',
  licensePlate: '',
  color: '',
  nickname: '',
  mileage: '',
};

type ConfirmState =
  | { mode: 'block'; asset: Asset; total: number }
  | { mode: 'warn'; asset: Asset; total: number }
  | { mode: 'simple'; asset: Asset; total: number }
  | null;

export function VehiclesEditor({ customerId }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const next = await listAssetsForCustomer(customerId);
      setAssets(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function handleCreate(form: VehicleFormState) {
    const yearNum = parseInt(form.year, 10);
    if (!yearNum || !form.make.trim() || !form.model.trim()) return;
    setBusy(true);
    try {
      const mileageNum = form.mileage.trim() ? parseInt(form.mileage, 10) : NaN;
      await createAsset({
        customerId,
        type: 'vehicle',
        year: yearNum,
        make: form.make.trim(),
        model: form.model.trim(),
        ...(form.trim.trim() && { trim: form.trim.trim() }),
        ...(form.vin.trim() && { vin: form.vin.trim().toUpperCase() }),
        ...(form.licensePlate.trim() && { licensePlate: form.licensePlate.trim() }),
        ...(form.color.trim() && { color: form.color.trim() }),
        ...(form.nickname.trim() && { nickname: form.nickname.trim() }),
        ...(!isNaN(mileageNum) && { mileage: mileageNum }),
      });
      setShowAddForm(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(id: string, form: VehicleFormState) {
    setBusy(true);
    try {
      const mileageNum = form.mileage.trim() ? parseInt(form.mileage, 10) : NaN;
      const yearNum = form.year.trim() ? parseInt(form.year, 10) : NaN;
      const patch: Partial<VehicleAsset> = {
        ...(yearNum && { year: yearNum }),
        make: form.make.trim(),
        model: form.model.trim(),
        trim: form.trim.trim() || undefined,
        vin: form.vin.trim() ? form.vin.trim().toUpperCase() : undefined,
        licensePlate: form.licensePlate.trim() || undefined,
        color: form.color.trim() || undefined,
        nickname: form.nickname.trim() || undefined,
        ...(!isNaN(mileageNum) && { mileage: mileageNum }),
      };
      await updateAsset(id, patch);
      setEditingId(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function requestDelete(asset: Asset) {
    setBusy(true);
    try {
      const counts = await countBookingsReferencingAsset(asset.id);
      if (counts.inProgress > 0) {
        setConfirm({ mode: 'block', asset, total: counts.total });
      } else if (counts.activeNonCancelled > 0) {
        setConfirm({ mode: 'warn', asset, total: counts.total });
      } else {
        setConfirm({ mode: 'simple', asset, total: counts.total });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check failed');
    } finally {
      setBusy(false);
    }
  }

  async function performDelete() {
    if (!confirm || confirm.mode === 'block') return;
    setBusy(true);
    try {
      await softDeleteAsset(confirm.asset.id, confirm.asset.customerId);
      setConfirm(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5 gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Vehicles ({assets.length})
        </h2>
        {!showAddForm && (
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add vehicle
          </Button>
        )}
      </header>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      {showAddForm && (
        <VehicleForm
          initial={EMPTY_FORM}
          submitLabel="Add vehicle"
          busy={busy}
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : assets.length === 0 && !showAddForm ? (
        <div className="text-sm text-muted-foreground">No vehicles yet.</div>
      ) : (
        <ul className="text-sm divide-y divide-border">
          {assets.map((a) => (
            <li key={a.id} className="py-3">
              {editingId === a.id ? (
                <VehicleForm
                  initial={assetToForm(a)}
                  submitLabel="Save"
                  busy={busy}
                  onSubmit={(form) => handleUpdate(a.id, form)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <DisplayRow
                  asset={a}
                  onEdit={() => setEditingId(a.id)}
                  onDelete={() => requestDelete(a)}
                  disabled={busy}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        state={confirm}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={performDelete}
      />
    </Card>
  );
}

/* ── Display row ──────────────────────────────────────────── */

function DisplayRow({
  asset,
  onEdit,
  onDelete,
  disabled,
}: {
  asset: Asset;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const title = asset.nickname || assetSummary(asset);
  const vin = (asset as VehicleAsset).vin;
  const plate = (asset as VehicleAsset).licensePlate;
  const mileage = asset.mileage;
  const lastServiced = asset.lastServicedAt;

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground truncate">{title}</div>
        {asset.nickname && (
          <div className="text-xs text-muted-foreground truncate">{assetSummary(asset)}</div>
        )}
        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
          {vin && <span>VIN: {vin}</span>}
          {plate && <span>Plate: {plate}</span>}
          {mileage != null && (
            <span>
              Last known: {mileage.toLocaleString()} mi
              {lastServiced && ` (${new Date(lastServiced).toLocaleDateString()})`}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={onEdit} disabled={disabled} aria-label="Edit vehicle">
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} disabled={disabled} aria-label="Delete vehicle">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function assetSummary(a: Asset): string {
  const v = a as VehicleAsset;
  const parts = [v.year, v.make, v.model].filter(Boolean);
  const base = parts.join(' ').trim();
  return base || 'Vehicle';
}

function assetToForm(a: Asset): VehicleFormState {
  const v = a as VehicleAsset;
  return {
    year: v.year != null ? String(v.year) : '',
    make: v.make ?? '',
    model: v.model ?? '',
    trim: v.trim ?? '',
    vin: v.vin ?? '',
    licensePlate: v.licensePlate ?? '',
    color: v.color ?? '',
    nickname: a.nickname ?? '',
    mileage: a.mileage != null ? String(a.mileage) : '',
  };
}

/* ── Add / Edit form ──────────────────────────────────────── */

function VehicleForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  initial: VehicleFormState;
  submitLabel: string;
  busy: boolean;
  onSubmit: (form: VehicleFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<VehicleFormState>(initial);
  const [vinStatus, setVinStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleDecode() {
    if (!form.vin.trim()) return;
    setVinStatus('loading');
    const r = await decodeVIN(form.vin.trim());
    if (r && r.year && r.make && r.model) {
      setForm((f) => ({
        ...f,
        year: r.year,
        make: r.make,
        model: r.model,
        trim: r.trim || f.trim,
      }));
      setVinStatus('success');
    } else {
      setVinStatus('error');
    }
  }

  const canSubmit =
    !!parseInt(form.year, 10) && !!form.make.trim() && !!form.model.trim() && !busy;

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Input
          value={form.vin}
          onChange={(e) => { setForm({ ...form, vin: e.target.value.toUpperCase() }); setVinStatus('idle'); }}
          placeholder="VIN (optional, auto-fills year/make/model)"
          className="flex-1"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecode}
          disabled={!form.vin.trim() || vinStatus === 'loading'}
        >
          {vinStatus === 'loading' ? 'Decoding…' : 'Decode'}
        </Button>
        {vinStatus === 'success' && (
          <span className="text-xs text-green-600 font-medium">Decoded</span>
        )}
        {vinStatus === 'error' && (
          <span className="text-xs text-destructive font-medium">Invalid VIN</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Year *">
          <Input
            type="number"
            inputMode="numeric"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            placeholder="2024"
          />
        </Field>
        <Field label="Make *">
          <Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
        </Field>
        <Field label="Model *">
          <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Trim">
          <Input value={form.trim} onChange={(e) => setForm({ ...form, trim: e.target.value })} />
        </Field>
        <Field label="License plate">
          <Input value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} />
        </Field>
        <Field label="Color">
          <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Nickname">
          <Input
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            placeholder="e.g. Mom's Honda"
          />
        </Field>
        <Field label="Last-known mileage">
          <Input
            type="number"
            inputMode="numeric"
            value={form.mileage}
            onChange={(e) => setForm({ ...form, mileage: e.target.value })}
            placeholder="123456"
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={onCancel} disabled={busy}>
          <X className="h-4 w-4 mr-1" /> Cancel
        </Button>
        <Button size="sm" onClick={() => onSubmit(form)} disabled={!canSubmit}>
          {busy ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

/* ── Confirm dialog (local; promote to shared-ui AlertDialog in A3c if reused) ── */

function ConfirmDialog({
  state,
  busy,
  onCancel,
  onConfirm,
}: {
  state: ConfirmState;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const open = state !== null;
  const title =
    state?.mode === 'block'
      ? 'Vehicle is on an in-progress job'
      : state?.mode === 'warn'
        ? 'Remove this vehicle?'
        : 'Remove this vehicle?';
  const body =
    state?.mode === 'block'
      ? 'A job using this vehicle is currently in progress. Complete or cancel the job first, then try again.'
      : state?.mode === 'warn'
        ? `This vehicle is referenced on ${state.total} booking${state.total === 1 ? '' : 's'}. Removing it hides the vehicle from new bookings but keeps the existing booking and invoice records intact — the job records will still show the vehicle info captured at the time. Continue?`
        : 'Remove this vehicle from the customer profile?';
  const confirmLabel = state?.mode === 'warn' ? 'Remove anyway' : 'Remove';
  const hideConfirm = state?.mode === 'block';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{body}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {hideConfirm ? 'OK' : 'Cancel'}
          </Button>
          {!hideConfirm && (
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? 'Removing…' : confirmLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
