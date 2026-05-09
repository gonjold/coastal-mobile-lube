"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ChevronsUpDown, Mail, Plus, UserPlus, Users as UsersIcon } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import type { AppUser } from "../shared";
import EditableCell from "@/components/admin/EditableCell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SortKey = "name" | "email" | "role" | "active";

export default function TeamPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [optimistic, setOptimistic] = useState<
    Record<string, Partial<AppUser>>
  >({});
  const [showCreate, setShowCreate] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => d.data() as AppUser));
      setOptimistic({});
    });
  }, []);

  const merged = users.map((u) => ({ ...u, ...optimistic[u.uid] }));
  const sorted = [...merged].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name")
      cmp = (a.displayName || "").localeCompare(b.displayName || "");
    else if (sortKey === "email") cmp = (a.email || "").localeCompare(b.email || "");
    else if (sortKey === "role") cmp = (a.role || "").localeCompare(b.role || "");
    else if (sortKey === "active")
      cmp = Number(b.isActive ?? false) - Number(a.isActive ?? false);
    return sortDir === "asc" ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function patchUser(uid: string, patch: Partial<AppUser>) {
    setOptimistic((prev) => ({ ...prev, [uid]: { ...prev[uid], ...patch } }));
    const res = await fetch(`/api/admin/team/${uid}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[uid];
        return next;
      });
      throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
    }
  }

  async function sendReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Could not send reset", { description: msg });
    }
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Team
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage admin and technician accounts. Click a role or status cell to
            edit.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="h-4 w-4 mr-1.5" strokeWidth={1.75} />
          Add technician
        </Button>
      </header>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-muted/50 sticky top-0">
                <SortHeader
                  label="Name"
                  active={sortKey === "name"}
                  dir={sortDir}
                  onClick={() => toggleSort("name")}
                />
                <SortHeader
                  label="Email"
                  active={sortKey === "email"}
                  dir={sortDir}
                  onClick={() => toggleSort("email")}
                />
                <SortHeader
                  label="Role"
                  active={sortKey === "role"}
                  dir={sortDir}
                  onClick={() => toggleSort("role")}
                />
                <SortHeader
                  label="Status"
                  active={sortKey === "active"}
                  dir={sortDir}
                  onClick={() => toggleSort("active")}
                />
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground text-[12px] uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <EmptyState onAdd={() => setShowCreate(true)} />
                  </td>
                </tr>
              ) : (
                sorted.map((u) => (
                  <tr
                    key={u.uid}
                    className="border-t border-border hover:bg-muted/30 transition-colors duration-150"
                  >
                    <td className="px-4 py-2 align-middle">
                      <span className="font-medium text-foreground">
                        {u.displayName || "(no name)"}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-middle text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="px-4 py-2 align-middle w-[140px]">
                      <EditableCell
                        type="select"
                        value={u.role}
                        options={[
                          { value: "admin", label: "Admin" },
                          { value: "tech", label: "Tech" },
                        ]}
                        onSave={(next) =>
                          patchUser(u.uid, { role: next as AppUser["role"] })
                        }
                        display={
                          <Badge
                            variant={u.role === "admin" ? "default" : "secondary"}
                            className="font-normal"
                          >
                            {u.role}
                          </Badge>
                        }
                      />
                    </td>
                    <td className="px-4 py-2 align-middle w-[140px]">
                      <EditableCell
                        type="select"
                        value={u.isActive ? "true" : "false"}
                        options={[
                          { value: "true", label: "Active" },
                          { value: "false", label: "Inactive" },
                        ]}
                        onSave={(next) =>
                          patchUser(u.uid, { isActive: next === "true" })
                        }
                        display={
                          u.isActive ? (
                            <Badge className="bg-success/10 text-success border-success/20 font-normal">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-normal text-muted-foreground">
                              Inactive
                            </Badge>
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-2 align-middle text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => sendReset(u.email)}
                      >
                        <Mail className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.75} />
                        Send reset
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateTechDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-[12px] uppercase tracking-wide cursor-pointer select-none group"
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <span
          className={cn(
            "inline-flex transition-opacity duration-150",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-50",
          )}
        >
          {!active ? (
            <ChevronsUpDown className="h-3 w-3" strokeWidth={2} />
          ) : dir === "asc" ? (
            <ArrowUp className="h-3 w-3" strokeWidth={2} />
          ) : (
            <ArrowDown className="h-3 w-3" strokeWidth={2} />
          )}
        </span>
      </span>
    </th>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <UsersIcon className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
      <h3 className="mt-3 text-base font-semibold text-foreground">
        No team members yet
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        Add your technicians to give them access to the field app.
      </p>
      <Button className="mt-4" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
        Add technician
      </Button>
    </div>
  );
}

function CreateTechDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const tempPassword =
        "Coastal" + Math.random().toString(36).slice(2, 10) + "!";
      const cred = await createUserWithEmailAndPassword(auth, email, tempPassword);

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email,
        displayName,
        role: "tech",
        isActive: true,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || "unknown",
        lastLoginAt: null,
      });

      await sendPasswordResetEmail(auth, email);
      toast.success("Tech created", {
        description:
          "Password reset email sent. You may need to sign out and back in as yourself.",
      });
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.replace("Firebase: ", "") || "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add technician</DialogTitle>
          <DialogDescription>
            They&apos;ll receive a password reset email and set their own
            password on first sign-in.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tech-name">Display name</Label>
            <Input
              id="tech-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tech-email">Email</Label>
            <Input
              id="tech-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tech@coastalmobilelube.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !email || !displayName}
          >
            {creating ? "Creating…" : "Create & send setup email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
