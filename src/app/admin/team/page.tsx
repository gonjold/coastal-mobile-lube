"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import type { AppUser } from "../shared";

export default function TeamPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => d.data() as AppUser));
    });
  }, []);

  async function toggleActive(user: AppUser) {
    await updateDoc(doc(db, "users", user.uid), { isActive: !user.isActive });
  }

  async function sendReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Password reset email sent to ${email}.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Failed to send reset: ${msg}`);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2040]">Team</h1>
          <p className="text-sm text-slate-600">
            Manage admin and technician accounts.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-[#E07B2D] px-4 py-2 font-semibold text-white hover:bg-[#c66a24]"
        >
          + Add Technician
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Role
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.uid}>
                <td className="px-4 py-3 text-sm">{u.displayName}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {u.isActive ? (
                    <span className="text-emerald-700">Active</span>
                  ) : (
                    <span className="text-slate-400">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => toggleActive(u)}
                    className="text-blue-600 hover:underline"
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                  {" · "}
                  <button
                    onClick={() => sendReset(u.email)}
                    className="text-blue-600 hover:underline"
                  >
                    Send password reset
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  No team members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateTechModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateTechModal({ onClose }: { onClose: () => void }) {
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

      alert(
        `Tech created. Password reset email sent to ${email}. ` +
          `Please sign out and sign back in as yourself to continue ` +
          `(creating a user temporarily signed you in as them).`
      );

      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.replace("Firebase: ", "") || "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#0B2040]">
          Add Technician
        </h2>
        {error && (
          <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="John Doe"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="tech@coastalmobilelube.com"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2"
            disabled={creating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !email || !displayName}
            className="rounded bg-[#E07B2D] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create + Send Setup Email"}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Tech receives a password reset email from Firebase. They set their own
          password on first login.
        </p>
      </div>
    </div>
  );
}
