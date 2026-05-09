"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function TechLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        setError("Could not establish session. Please try again.");
        return;
      }
      // TechAuthShell will redirect based on role
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.replace("Firebase: ", "") || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent. Check your inbox.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.replace("Firebase: ", "") || "Failed to send reset email");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B2040] px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#0B2040]">Coastal Tech</h1>
          <p className="text-sm text-slate-600">Sign in to view your jobs</p>
        </div>
        <form onSubmit={handleSignIn} className="space-y-3">
          {error && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded border border-slate-300 px-3 py-3 text-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded border border-slate-300 px-3 py-3 text-base"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#E07B2D] px-4 py-3 font-semibold text-white hover:bg-[#c66a24] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <button
            type="button"
            onClick={handleResetPassword}
            className="w-full text-sm text-slate-600 hover:underline"
          >
            Forgot password?
          </button>
        </form>
      </div>
    </div>
  );
}
