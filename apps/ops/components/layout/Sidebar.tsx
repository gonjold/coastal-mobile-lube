'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wrench } from 'lucide-react';
import { Kbd } from '@coastal/shared-ui';
import { SIDEBAR_SECTIONS, type SidebarItem as SidebarItemType } from '@/lib/sidebarConfig';
import { useLayout } from './ClientLayoutProvider';

export function SidebarContent() {
  const pathname = usePathname();
  const { setMobileSidebarOpen } = useLayout();

  return (
    <div className="flex h-full flex-col bg-card border-r border-border">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Wrench className="w-4 h-4 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Coastal Ops</div>
            <div className="text-[11px] text-muted-foreground leading-tight">Owner</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarRow
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  onNavigate={() => setMobileSidebarOpen(false)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>
            Press <Kbd>⌘K</Kbd>
          </span>
          <span>v0.A3a</span>
        </div>
      </div>
    </div>
  );
}

function SidebarRow({
  item,
  active,
  onNavigate,
}: {
  item: SidebarItemType;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const baseClasses =
    'w-full px-3 py-1.5 rounded-md flex items-center gap-2 text-sm text-left transition-colors';
  const activeClasses = active
    ? 'bg-primary text-primary-foreground'
    : 'text-foreground hover:bg-muted';

  if (item.available) {
    return (
      <Link
        href={item.href}
        className={`${baseClasses} ${activeClasses}`}
        onClick={onNavigate}
      >
        <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-accent/15 text-accent-text'
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled
      title={item.availableIn ? `Available in ${item.availableIn}` : undefined}
      className={`${baseClasses} text-muted-foreground/70 cursor-not-allowed`}
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
      <span className="flex-1">{item.label}</span>
      {item.availableIn && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
          {item.availableIn}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 min-h-screen shrink-0">
      <SidebarContent />
    </aside>
  );
}
