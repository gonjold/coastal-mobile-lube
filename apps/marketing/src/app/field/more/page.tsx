"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Settings, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { Button } from "@coastal/shared-ui";

export default function MorePage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut(auth);
      router.push("/admin/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign out failed");
      setSigningOut(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 p-4">
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">
            {user?.email ?? "Not signed in"}
          </p>
          {role && (
            <p className="text-xs capitalize text-muted-foreground">{role}</p>
          )}
          <Button
            variant="outline"
            className="mt-4 w-full gap-2"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </section>

      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <Settings
          className="h-10 w-10 text-muted-foreground/60"
          strokeWidth={1.5}
        />
        <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
          More features coming
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Settings, support, and team tools land here next.
        </p>
      </div>
    </div>
  );
}
