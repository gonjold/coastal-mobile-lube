/* A3f Phase 3.4: role-filtered command palette. getPaletteCommands(role)
 * derives nav commands from getNavItemsForRole(role) so techs see only
 * their 4 nav commands + the 3 admin quick actions (which we leave
 * available to all authenticated roles for now; future sprint can filter
 * by role if quick actions diverge).
 *
 * Backward-compat: calling getPaletteCommands() with no role argument
 * returns the OWNER nav (the pre-A3f shape) so any unconverted callers
 * keep working until they migrate.
 */
import { getNavItemsForRole } from "./nav";
import type { UserRole } from "@coastal/shared-types";

export type PaletteCommand = {
  id: string;
  label: string;
  group: string;
  href?: string;
  /** Action key consumed by CommandPalette for quick actions that open modals. */
  action?: "open-booking-modal" | "open-customer-modal" | "open-merge-modal";
  disabled: boolean;
  disabledReason?: string;
};

export function getPaletteCommands(role: UserRole | null = "owner"): PaletteCommand[] {
  const commands: PaletteCommand[] = [];

  for (const item of getNavItemsForRole(role)) {
    commands.push({
      id: `nav-${item.href}`,
      label: `Go to ${item.label}`,
      group: item.group,
      href: item.href,
      disabled: !item.available,
      disabledReason: item.available ? undefined : `Available in ${item.availableIn}`,
    });
  }

  // Quick actions stay available to every authenticated role for now.
  // Tech-specific filtering can branch here in a future sprint.
  commands.push(
    { id: "action-new-booking", label: "New booking", group: "Quick actions", action: "open-booking-modal", disabled: false },
    { id: "action-new-customer", label: "New customer", group: "Quick actions", action: "open-customer-modal", disabled: false },
    { id: "action-merge-customers", label: "Merge customers", group: "Quick actions", action: "open-merge-modal", disabled: false },
  );
  return commands;
}
