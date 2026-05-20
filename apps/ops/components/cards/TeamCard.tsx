"use client";

/* A3f Phase 6A: mobile TeamCard. Display-only per WO §"TeamCard" + parent
 * WO §5.1 (no /team/[uid] detail route exists). Renders below `lg` as a
 * static stack of name + role + email (truncate) + status badge. NOT
 * wrapped in OpsCard - not clickable.
 *
 * Role + Active edits stay on the desktop table only for this phase.
 * If a future detail route lands, this card can be upgraded to use
 * OpsCard. For mobile editing of role/active, defer until then. */

import { Badge } from "@coastal/shared-ui";

interface UserRow {
  uid: string;
  email: string;
  displayName: string;
  role: "owner" | "admin_only" | "tech" | string;
  isActive: boolean;
  createdAt?: { toDate: () => Date };
  lastLoginAt?: { toDate: () => Date } | null;
}

interface Props {
  user: UserRow;
}

function roleLabel(role: string): string {
  return role.replace("_", " ");
}

function roleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "owner") return "default";
  if (role === "admin_only") return "secondary";
  return "outline";
}

export function TeamCard({ user }: Props) {
  return (
    <div className="block w-full rounded-[14px] border border-border bg-card p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[15.5px] font-semibold leading-tight text-foreground min-w-0 truncate">
            {user.displayName || "(no name)"}
          </div>
          <Badge variant={user.isActive ? "default" : "outline"} className="shrink-0">
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={roleBadgeVariant(user.role)} className="font-normal capitalize">
            {roleLabel(user.role)}
          </Badge>
        </div>

        <div className="text-[13.5px] text-muted-foreground truncate">
          {user.email}
        </div>
      </div>
    </div>
  );
}
