// A3a: nav-to-route commands only. Quick actions (New Booking, New Customer,
// etc.) defer to A3b when the creation modals migrate over.

import { SIDEBAR_SECTIONS } from './sidebarConfig';

export type PaletteCommand = {
  id: string;
  label: string;
  group: string;
  href?: string;
  disabled: boolean;
  disabledReason?: string;
};

export function getPaletteCommands(): PaletteCommand[] {
  const commands: PaletteCommand[] = [];
  for (const section of SIDEBAR_SECTIONS) {
    for (const item of section.items) {
      commands.push({
        id: `nav-${item.href}`,
        label: `Go to ${item.label}`,
        group: section.label,
        href: item.href,
        disabled: !item.available,
        disabledReason: item.available ? undefined : `Available in ${item.availableIn}`,
      });
    }
  }
  return commands;
}
