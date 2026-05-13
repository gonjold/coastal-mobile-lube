/* ── A3c canonicalization candidate ──────────────────────────
   Port of apps/marketing/src/lib/customerDedup.ts. Drop-in copy
   with the marketing-only Customer type re-typed against the
   minimal local Customer shape used by the merge modal.
   ──────────────────────────────────────────────────────────── */

import type { Customer } from './customerTypes';

export interface DuplicateGroup {
  matchType: 'phone' | 'email' | 'name';
  customers: Customer[];
  matchValue: string;
}

const NICKNAME_PAIRS: [string, string][] = [
  ['mike', 'michael'],
  ['bill', 'william'],
  ['bob', 'robert'],
  ['jim', 'james'],
  ['joe', 'joseph'],
  ['tom', 'thomas'],
  ['dan', 'daniel'],
  ['dave', 'david'],
  ['chris', 'christopher'],
  ['matt', 'matthew'],
  ['jon', 'jonathan'],
  ['tony', 'anthony'],
  ['sam', 'samuel'],
  ['ben', 'benjamin'],
  ['alex', 'alexander'],
  ['nick', 'nicholas'],
  ['ed', 'edward'],
  ['pat', 'patrick'],
  ['rick', 'richard'],
  ['steve', 'steven'],
];

function areNicknames(a: string, b: string): boolean {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return true;
  for (const [n1, n2] of NICKNAME_PAIRS) {
    if ((al === n1 && bl === n2) || (al === n2 && bl === n1)) return true;
  }
  return false;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

function namesMatch(nameA: string, nameB: string): boolean {
  const a = nameA.trim().toLowerCase();
  const b = nameB.trim().toLowerCase();
  if (!a || !b || a === '-' || b === '-') return false;
  if (a === b) return true;

  const partsA = a.split(/\s+/);
  const partsB = b.split(/\s+/);
  if (partsA.length < 2 || partsB.length < 2) return false;

  const firstA = partsA[0];
  const lastA = partsA[partsA.length - 1];
  const firstB = partsB[0];
  const lastB = partsB[partsB.length - 1];

  if (lastA !== lastB) return false;

  if (areNicknames(firstA, firstB)) return true;
  if (firstA.length >= 3 && firstB.length >= 3 && firstA.slice(0, 3) === firstB.slice(0, 3))
    return true;

  return false;
}

function hasActivity(c: Customer): boolean {
  return c.totalBookings > 0;
}

export function findDuplicates(customers: Customer[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];

  const phoneMap = new Map<string, Customer[]>();
  for (const c of customers) {
    if (!c.phone) continue;
    const norm = normalizePhone(c.phone);
    if (norm.length < 7) continue;
    if (!phoneMap.has(norm)) phoneMap.set(norm, []);
    phoneMap.get(norm)!.push(c);
  }
  for (const [norm, custs] of phoneMap) {
    if (custs.length < 2) continue;
    if (!custs.some(hasActivity)) continue;
    groups.push({ matchType: 'phone', customers: custs, matchValue: norm });
  }

  const emailMap = new Map<string, Customer[]>();
  for (const c of customers) {
    if (!c.email) continue;
    const norm = c.email.toLowerCase().trim();
    if (!norm) continue;
    if (!emailMap.has(norm)) emailMap.set(norm, []);
    emailMap.get(norm)!.push(c);
  }
  for (const [norm, custs] of emailMap) {
    if (custs.length < 2) continue;
    if (!custs.some(hasActivity)) continue;
    groups.push({ matchType: 'email', customers: custs, matchValue: norm });
  }

  const seenNamePair = new Set<string>();
  for (let i = 0; i < customers.length; i++) {
    for (let j = i + 1; j < customers.length; j++) {
      const a = customers[i];
      const b = customers[j];
      const pairKey = [a.key, b.key].sort().join('|');
      if (seenNamePair.has(pairKey)) continue;
      if (!namesMatch(a.name, b.name)) continue;
      if (!hasActivity(a) && !hasActivity(b)) continue;
      seenNamePair.add(pairKey);
      groups.push({
        matchType: 'name',
        customers: [a, b],
        matchValue: `${a.name} / ${b.name}`,
      });
    }
  }

  return groups;
}
