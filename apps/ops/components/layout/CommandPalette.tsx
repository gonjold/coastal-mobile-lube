'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@coastal/shared-ui';
import { getPaletteCommands, type PaletteCommand } from '@/lib/paletteCommands';
import { useLayout } from './ClientLayoutProvider';

export function CommandPalette() {
  const router = useRouter();
  const { paletteOpen, setPaletteOpen } = useLayout();
  const commands = useMemo(getPaletteCommands, []);

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteCommand[]>();
    for (const cmd of commands) {
      const arr = map.get(cmd.group) ?? [];
      arr.push(cmd);
      map.set(cmd.group, arr);
    }
    return Array.from(map.entries());
  }, [commands]);

  function handleSelect(cmd: PaletteCommand) {
    if (cmd.disabled) return;
    if (cmd.href) {
      router.push(cmd.href);
      setPaletteOpen(false);
    }
  }

  return (
    <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {grouped.map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((cmd) => (
              <CommandItem
                key={cmd.id}
                value={`${cmd.group} ${cmd.label}`}
                disabled={cmd.disabled}
                onSelect={() => handleSelect(cmd)}
              >
                <span className="flex-1">{cmd.label}</span>
                {cmd.disabled && cmd.disabledReason && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {cmd.disabledReason}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
