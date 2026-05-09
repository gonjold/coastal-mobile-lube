"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import {
  CalendarCheck,
  CalendarDays,
  Clock,
  FileText,
  LayoutGrid,
  Percent,
  Plug,
  Plus,
  QrCode,
  Receipt,
  Search,
  Settings,
  Sparkles,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAdminModal } from "@/contexts/AdminModalContext";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const RECENT_KEY = "admin-cmdk-recent";
const RECENT_MAX = 5;

type CommandSpec = {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: "Navigation" | "Create" | "Customers" | "Bookings" | "Invoices";
  run: () => void;
  keywords?: string;
};

type SubscriptionState = {
  customers: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }>;
  bookings: Array<{
    id: string;
    name: string;
    date?: string;
  }>;
  invoices: Array<{
    id: string;
    number: string;
    customerName: string;
  }>;
};

let openHandler: (() => void) | null = null;

export function useCommandPalette() {
  return useMemo(
    () => ({
      open: () => openHandler?.(),
    }),
    [],
  );
}

export default function CommandPalette() {
  const router = useRouter();
  const { openModal } = useAdminModal();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [data, setData] = useState<SubscriptionState>({
    customers: [],
    bookings: [],
    invoices: [],
  });

  const openTimerRef = useRef<{ start: number; logged: boolean }>({
    start: 0,
    logged: false,
  });

  // Module-level open hook
  useEffect(() => {
    const handler = () => {
      openTimerRef.current = { start: performance.now(), logged: false };
      setOpen(true);
    };
    openHandler = handler;
    return () => {
      if (openHandler === handler) openHandler = null;
    };
  }, []);

  // Cmd/Ctrl+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openTimerRef.current = { start: performance.now(), logged: false };
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Log open-time on first paint after open=true (used by Playwright Flow B)
  useEffect(() => {
    if (open && openTimerRef.current.start && !openTimerRef.current.logged) {
      const elapsed = performance.now() - openTimerRef.current.start;
      openTimerRef.current.logged = true;
      // Expose to window for verification capture
      (window as unknown as { __cmdkOpenMs?: number }).__cmdkOpenMs = elapsed;
      // eslint-disable-next-line no-console
      console.info(`[cmdk] open-paint=${elapsed.toFixed(1)}ms`);
    }
  }, [open]);

  // Load recents
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        if (Array.isArray(arr)) setRecent(arr.slice(0, RECENT_MAX));
      }
    } catch {}
  }, []);

  // Subscribe to recent customers/bookings/invoices when palette is opened
  useEffect(() => {
    if (!open) return;
    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        query(collection(db, "customers"), limit(200)),
        (snap) => {
          setData((prev) => ({
            ...prev,
            customers: snap.docs.map((d) => {
              const v = d.data() as Record<string, unknown>;
              return {
                id: d.id,
                name: (v.name as string) || "",
                email: v.email as string | undefined,
                phone: v.phone as string | undefined,
              };
            }),
          }));
        },
        () => {},
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, "bookings"),
          orderBy("createdAt", "desc"),
          limit(100),
        ),
        (snap) => {
          setData((prev) => ({
            ...prev,
            bookings: snap.docs.map((d) => {
              const v = d.data() as Record<string, unknown>;
              return {
                id: d.id,
                name:
                  (v.name as string) ||
                  (v.customerName as string) ||
                  "(no name)",
                date:
                  (v.confirmedDate as string) ||
                  (v.preferredDate as string) ||
                  undefined,
              };
            }),
          }));
        },
        () => {},
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, "invoices"),
          orderBy("createdAt", "desc"),
          limit(100),
        ),
        (snap) => {
          setData((prev) => ({
            ...prev,
            invoices: snap.docs.map((d) => {
              const v = d.data() as Record<string, unknown>;
              return {
                id: d.id,
                number: (v.invoiceNumber as string) || d.id,
                customerName: (v.customerName as string) || "",
              };
            }),
          }));
        },
        () => {},
      ),
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [open]);

  const persistRecent = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, RECENT_MAX);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  const run = useCallback(
    (cmd: CommandSpec) => {
      persistRecent(cmd.id);
      cmd.run();
      close();
    },
    [persistRecent, close],
  );

  // Static commands
  const staticCommands: CommandSpec[] = useMemo(
    () => [
      {
        id: "nav:dashboard",
        label: "Go to Dashboard",
        icon: LayoutGrid,
        group: "Navigation",
        run: () => router.push("/admin"),
      },
      {
        id: "nav:schedule",
        label: "Go to Schedule",
        icon: CalendarDays,
        group: "Navigation",
        run: () => router.push("/admin/schedule"),
      },
      {
        id: "nav:bookings",
        label: "Go to Bookings",
        icon: CalendarCheck,
        group: "Navigation",
        run: () => router.push("/admin/bookings"),
      },
      {
        id: "nav:customers",
        label: "Go to Customers",
        icon: Users,
        group: "Navigation",
        run: () => router.push("/admin/customers"),
      },
      {
        id: "nav:invoices",
        label: "Go to Invoices",
        icon: Receipt,
        group: "Navigation",
        run: () => router.push("/admin/invoices"),
      },
      {
        id: "nav:invoicing",
        label: "Go to Invoicing (legacy)",
        icon: FileText,
        group: "Navigation",
        run: () => router.push("/admin/invoicing"),
      },
      {
        id: "nav:team",
        label: "Go to Team",
        icon: UserCog,
        group: "Navigation",
        run: () => router.push("/admin/team"),
      },
      {
        id: "nav:services",
        label: "Go to Services CMS",
        icon: Settings,
        group: "Navigation",
        run: () => router.push("/admin/services"),
      },
      {
        id: "nav:hero",
        label: "Go to Hero editor",
        icon: Sparkles,
        group: "Navigation",
        run: () => router.push("/admin/hero-editor"),
      },
      {
        id: "nav:fees",
        label: "Go to Fees",
        icon: Percent,
        group: "Navigation",
        run: () => router.push("/admin/fees"),
      },
      {
        id: "nav:integrations",
        label: "Go to Integrations",
        icon: Plug,
        group: "Navigation",
        run: () => router.push("/admin/integrations"),
      },
      {
        id: "nav:qr",
        label: "Go to QR codes",
        icon: QrCode,
        group: "Navigation",
        run: () => router.push("/admin/qr"),
      },
      {
        id: "nav:jobs",
        label: "Go to Jobs (field view)",
        icon: Wrench,
        group: "Navigation",
        run: () => router.push("/tech/jobs"),
      },
      {
        id: "create:booking",
        label: "Create new booking",
        icon: Plus,
        group: "Create",
        run: () => openModal("booking"),
      },
      {
        id: "create:customer",
        label: "Create new customer",
        icon: Plus,
        group: "Create",
        run: () => openModal("customer"),
      },
      {
        id: "create:invoice",
        label: "Create new invoice",
        icon: Plus,
        group: "Create",
        run: () => openModal("invoice"),
      },
    ],
    [router, openModal],
  );

  const recentCommands = useMemo(() => {
    if (recent.length === 0 || search.trim()) return [];
    return recent
      .map((id) => staticCommands.find((c) => c.id === id))
      .filter((c): c is CommandSpec => Boolean(c));
  }, [recent, staticCommands, search]);

  // Search results from live data — limit to top matches per group
  const searchTrim = search.trim().toLowerCase();
  const customerHits = useMemo(() => {
    if (!searchTrim) return [];
    return data.customers
      .filter((c) => {
        const hay = `${c.name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
        return hay.includes(searchTrim);
      })
      .slice(0, 8);
  }, [data.customers, searchTrim]);

  const bookingHits = useMemo(() => {
    if (!searchTrim) return [];
    return data.bookings
      .filter((b) => {
        const hay = `${b.name} ${b.date ?? ""}`.toLowerCase();
        return hay.includes(searchTrim);
      })
      .slice(0, 8);
  }, [data.bookings, searchTrim]);

  const invoiceHits = useMemo(() => {
    if (!searchTrim) return [];
    return data.invoices
      .filter((i) => {
        const hay = `${i.number} ${i.customerName}`.toLowerCase();
        return hay.includes(searchTrim);
      })
      .slice(0, 8);
  }, [data.invoices, searchTrim]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch("");
      }}
      title="Command palette"
      description="Search for a command, customer, booking, or invoice."
      className="max-w-[600px]"
    >
      <CommandInput
        placeholder="Type a command or search…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>No results.</CommandEmpty>

        {recentCommands.length > 0 && (
          <CommandGroup heading="Recent">
            {recentCommands.map((cmd) => (
              <CommandItem
                key={`recent-${cmd.id}`}
                value={`recent ${cmd.label}`}
                onSelect={() => run(cmd)}
              >
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" strokeWidth={1.75} />
                <span>{cmd.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {recentCommands.length > 0 && <CommandSeparator />}

        <CommandGroup heading="Navigation">
          {staticCommands
            .filter((c) => c.group === "Navigation")
            .map((cmd) => (
              <CommandItem
                key={cmd.id}
                value={cmd.label}
                onSelect={() => run(cmd)}
              >
                <cmd.icon className="h-4 w-4 mr-2 text-muted-foreground" strokeWidth={1.75} />
                <span>{cmd.label}</span>
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Create">
          {staticCommands
            .filter((c) => c.group === "Create")
            .map((cmd) => (
              <CommandItem
                key={cmd.id}
                value={cmd.label}
                onSelect={() => run(cmd)}
              >
                <cmd.icon className="h-4 w-4 mr-2 text-muted-foreground" strokeWidth={1.75} />
                <span>{cmd.label}</span>
              </CommandItem>
            ))}
        </CommandGroup>

        {customerHits.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Customers">
              {customerHits.map((c) => (
                <CommandItem
                  key={`cust-${c.id}`}
                  value={`customer ${c.name} ${c.email ?? ""} ${c.phone ?? ""}`}
                  onSelect={() => {
                    persistRecent(`cust-${c.id}`);
                    router.push(`/admin/customers?id=${c.id}`);
                    close();
                  }}
                >
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" strokeWidth={1.75} />
                  <span className="font-medium">{c.name || "(no name)"}</span>
                  {(c.email || c.phone) && (
                    <span className="ml-2 text-xs text-muted-foreground truncate">
                      {c.email || c.phone}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {bookingHits.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Bookings">
              {bookingHits.map((b) => (
                <CommandItem
                  key={`bk-${b.id}`}
                  value={`booking ${b.name} ${b.date ?? ""}`}
                  onSelect={() => {
                    persistRecent(`bk-${b.id}`);
                    router.push(`/admin/bookings?id=${b.id}`);
                    close();
                  }}
                >
                  <CalendarCheck className="h-4 w-4 mr-2 text-muted-foreground" strokeWidth={1.75} />
                  <span className="font-medium">{b.name}</span>
                  {b.date && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {b.date}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {invoiceHits.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Invoices">
              {invoiceHits.map((i) => (
                <CommandItem
                  key={`inv-${i.id}`}
                  value={`invoice ${i.number} ${i.customerName}`}
                  onSelect={() => {
                    persistRecent(`inv-${i.id}`);
                    router.push(`/admin/invoices?id=${i.id}`);
                    close();
                  }}
                >
                  <Receipt className="h-4 w-4 mr-2 text-muted-foreground" strokeWidth={1.75} />
                  <span className="font-medium">{i.number}</span>
                  {i.customerName && (
                    <span className="ml-2 text-xs text-muted-foreground truncate">
                      {i.customerName}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Avoid unused import lint when search icon shipped by command primitive
void Search;
