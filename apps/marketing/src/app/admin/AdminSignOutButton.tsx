"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Cookie clear is best-effort; client signOut already happened.
    }
    router.push("/admin/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-[13px] font-medium text-[#888] border border-[#ddd] rounded-[6px] px-3 py-1.5 hover:text-[#444] hover:border-[#bbb] transition-colors"
    >
      Sign Out
    </button>
  );
}
