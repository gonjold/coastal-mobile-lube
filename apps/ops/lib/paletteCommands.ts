import { SIDEBAR_SECTIONS } from './sidebarConfig';

export type PaletteCommand = {
  id: string;
  label: string;
  group: string;
  href?: string;
  /** Action key consumed by CommandPalette for quick actions that open modals. */
  action?: 'open-booking-modal' | 'open-customer-modal' | 'open-merge-modal';
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
  // Quick actions — wired to AdminModalContext at the CommandPalette consumer.
  commands.push(
    { id: 'action-new-booking', label: 'New booking', group: 'Quick actions', action: 'open-booking-modal', disabled: false },
    { id: 'action-new-customer', label: 'New customer', group: 'Quick actions', action: 'open-customer-modal', disabled: false },
    { id: 'action-merge-customers', label: 'Merge customers', group: 'Quick actions', action: 'open-merge-modal', disabled: false },
  );
  return commands;
}
