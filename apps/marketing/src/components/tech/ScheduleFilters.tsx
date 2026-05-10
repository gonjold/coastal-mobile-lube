'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  DivisionFilter,
  StatusFilter,
  TimeFilter,
} from '@/lib/schedule-filters';
import { FILTER_DEFAULTS } from '@/lib/schedule-filters';

interface Props {
  time: TimeFilter;
  status: StatusFilter;
  division: DivisionFilter;
  q: string;
  resultCount: number;
  onChange: (key: 'time' | 'status' | 'division' | 'q', value: string) => void;
  onReset: () => void;
}

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DIVISION_OPTIONS: { value: DivisionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'auto', label: 'Auto' },
  { value: 'marine', label: 'Marine' },
  { value: 'fleet', label: 'Fleet' },
  { value: 'rv', label: 'RV' },
];

export function ScheduleFilters({
  time,
  status,
  division,
  q,
  resultCount,
  onChange,
  onReset,
}: Props) {
  const [searchInput, setSearchInput] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep input in sync if URL param changes externally (e.g. Reset)
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  function handleSearchChange(v: string) {
    setSearchInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange('q', v);
    }, 200);
  }

  const isDefault =
    time === FILTER_DEFAULTS.time &&
    status === FILTER_DEFAULTS.status &&
    division === FILTER_DEFAULTS.division &&
    q === FILTER_DEFAULTS.q;

  return (
    <div
      className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50 border-b border-slate-200"
      style={{ backdropFilter: 'saturate(180%) blur(8px)' }}
    >
      <div className="space-y-2">
        <PillRow
          label="Time"
          options={TIME_OPTIONS}
          value={time}
          onSelect={(v) => onChange('time', v)}
        />
        <PillRow
          label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onSelect={(v) => onChange('status', v)}
        />
        <PillRow
          label="Division"
          options={DIVISION_OPTIONS}
          value={division}
          onSelect={(v) => onChange('division', v)}
        />
        <div className="pt-1">
          <label htmlFor="schedule-search" className="sr-only">
            Search bookings
          </label>
          <input
            id="schedule-search"
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="search"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by customer name, phone, or vehicle"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#0B2040] placeholder:text-slate-400 focus:border-[#0B2040] focus:outline-none focus:ring-1 focus:ring-[#0B2040]"
          />
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <div className="text-xs text-slate-500">
            {resultCount} {resultCount === 1 ? 'booking' : 'bookings'}
          </div>
          {!isDefault && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-[#0B2040] hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PillRow<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto"
      role="group"
      aria-label={label}
      style={{ scrollbarWidth: 'none' }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            aria-pressed={active}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
              active
                ? 'bg-[#0B2040] text-white border-[#0B2040]'
                : 'bg-white text-[#0B2040] border-[#0B2040]/40 hover:border-[#0B2040]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
