'use client';

import { useEffect, useState } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { Badge, EditableCell } from '@coastal/shared-ui';

interface UserRow {
  uid: string;
  email: string;
  displayName: string;
  role: 'owner' | 'admin_only' | 'tech' | string;
  isActive: boolean;
  createdAt?: { toDate: () => Date };
  lastLoginAt?: { toDate: () => Date } | null;
}

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin_only', label: 'Admin only' },
  { value: 'tech', label: 'Tech' },
];

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

import { db } from '@/lib/firebase';

export default function TeamPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...(d.data() as Omit<UserRow, 'uid'>) })));
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  async function patchRole(uid: string, role: string) {
    await updateDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() });
    toast.success('Saved');
  }

  async function patchActive(uid: string, isActive: boolean) {
    await updateDoc(doc(db, 'users', uid), { isActive, updatedAt: serverTimestamp() });
    toast.success('Saved');
  }

  function roleVariant(r: string): 'default' | 'secondary' | 'outline' {
    if (r === 'owner') return 'default';
    if (r === 'tech') return 'secondary';
    return 'outline';
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1200px] mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {users.length} member{users.length !== 1 ? 's' : ''} · click role or status to edit
        </p>
      </header>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">Last login</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <UsersIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <div className="text-sm text-muted-foreground">No team members yet.</div>
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  // A3f Phase 5.4: no detail page for team members exists yet;
                  // per WO §5.1 item 5 the select-edit-in-place pattern stays.
                  // Defensive stopPropagation on EditableCell <td>s so if a
                  // future /team/[uid] detail route lands and adds row-level
                  // click, inline edits don't bounce to navigation.
                  const stop = (e: React.MouseEvent) => e.stopPropagation();
                  return (
                    <tr key={u.uid} className="border-t border-border align-middle">
                      <td className="px-4 py-3 font-semibold">{u.displayName || '(no name)'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3 w-[160px]" onClick={stop}>
                        <EditableCell
                          type="select"
                          value={u.role}
                          options={ROLE_OPTIONS}
                          onSave={next => patchRole(u.uid, next)}
                          display={<Badge variant={roleVariant(u.role)} className="font-normal capitalize">{u.role.replace('_', ' ')}</Badge>}
                        />
                      </td>
                      <td className="px-4 py-3 w-[120px]" onClick={stop}>
                        <EditableCell
                          type="select"
                          value={u.isActive ? 'true' : 'false'}
                          options={ACTIVE_OPTIONS}
                          onSave={next => patchActive(u.uid, next === 'true')}
                          display={<Badge variant={u.isActive ? 'default' : 'outline'} className="font-normal">{u.isActive ? 'Active' : 'Inactive'}</Badge>}
                        />
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {u.createdAt?.toDate().toISOString().slice(0, 10) ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {u.lastLoginAt?.toDate().toISOString().slice(0, 10) ?? 'never'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
