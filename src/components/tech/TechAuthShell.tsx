"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import type { AppUser } from "@/app/admin/shared";

export default function TechAuthShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoginRoute = pathname === "/tech/login";

  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      // Clear any prior user-doc subscription
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }

      if (!fbUser) {
        setUser(null);
        setLoading(false);
        if (!isLoginRoute) router.replace("/tech/login");
        return;
      }

      const userRef = doc(db, "users", fbUser.uid);
      unsubUser = onSnapshot(
        userRef,
        (snap) => {
          if (!snap.exists()) {
            setUser(null);
            setLoading(false);
            // Auth user without users doc — sign out, send to login
            signOut(auth);
            router.replace("/tech/login");
            return;
          }
          const data = snap.data() as AppUser;
          setUser(data);
          setLoading(false);

          if (data.role === "tech" && !data.isActive && !isLoginRoute) {
            signOut(auth);
            router.replace("/tech/login");
          } else if (isLoginRoute && data.isActive) {
            // Active user (admin or tech) hitting login → go straight to jobs
            router.replace("/tech/jobs");
          }
        },
        (err) => {
          console.error("Failed to read users doc:", err);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, [pathname, router, isLoginRoute]);

  if (loading && !isLoginRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B2040] text-white">
        Loading...
      </div>
    );
  }

  if (isLoginRoute) return <>{children}</>;

  if (!user || !user.isActive) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0B2040] text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold">Coastal Tech</div>
          <div className="flex items-center gap-3 text-xs">
            <span>{user.displayName}</span>
            <button
              onClick={() => signOut(auth)}
              className="rounded border border-white/30 px-2 py-1 hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-4">{children}</main>
    </div>
  );
}
