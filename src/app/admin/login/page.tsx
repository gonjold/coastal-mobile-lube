"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2040] px-4">
      <div className="w-full max-w-[400px] bg-white rounded-[12px] p-8">
        <h1 className="text-[24px] font-[800] text-[#0B2040] mb-1">
          Admin Login
        </h1>
        <p className="text-[14px] text-[#888] mb-6">
          Coastal Mobile Lube &amp; Tire
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm rounded-[10px] px-3 py-2.5 outline-none border-2 border-[#eee] bg-[#fafafa] focus:border-[#1A5FAC] transition-colors"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase font-semibold text-[#888] tracking-[0.5px] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm rounded-[10px] px-3 py-2.5 outline-none border-2 border-[#eee] bg-[#fafafa] focus:border-[#1A5FAC] transition-colors"
              placeholder="Password"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-500 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full font-semibold text-white rounded-[8px] py-3 bg-[#E07B2D] hover:bg-[#CC6A1F] transition-colors disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
