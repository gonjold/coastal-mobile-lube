"use client";

/* A3f Phase 3.1: client-side silent-redirect guard for role-shaped routes.
 *
 * Sits inside RoleGate in apps/ops/app/(app)/layout.tsx. RoleGate already
 * blocks unauthenticated users + roles outside [owner, admin_only, tech];
 * RouteGuard adds a finer per-route role check so techs typing /team in
 * the URL bar end up on /today silently (no error toast, no red text).
 *
 * Logic:
 * - During useAuth loading -> render nothing (avoid flash of unauthorized
 *   content while role resolves).
 * - After role resolves, if isPathAllowedForRole(pathname, role) is false,
 *   router.replace('/today') + return nothing.
 * - When the path is allowed, render children unchanged.
 *
 * /jobs/[id] subroutes are deliberately permitted for techs (they can VIEW
 * any job; they just can't drive the FDACS flow unless assignedTechId
 * matches per the orchestrator in apps/ops/app/(app)/jobs/[id]/page.tsx:218).
 * isPathAllowedForRole grants /jobs/* to techs because /jobs is in TECH_NAV.
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { isPathAllowedForRole } from "@/lib/nav";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const allowed = role && !loading && isPathAllowedForRole(pathname, role);

  useEffect(() => {
    if (loading) return;
    if (!role) return;
    if (!isPathAllowedForRole(pathname, role)) {
      router.replace("/today");
    }
  }, [pathname, role, loading, router]);

  if (loading) return null;
  if (!role) return null;
  if (!allowed) return null;
  return <>{children}</>;
}
