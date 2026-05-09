"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import {
  ArrowRight,
  CalendarCheck,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  type Booking,
  toISODate,
} from "./shared";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: string;
  invoiceDate?: string;
  dueDate?: string;
  qbPaymentLink?: string;
  qboFinalizeStatus?: string;
  deleted?: boolean;
  isTest?: boolean;
  createdAt?: { toDate: () => Date };
};

function statusBadgeClass(s: string): string {
  if (s === "completed" || s === "invoiced" || s === "paid")
    return "bg-success/10 text-success border-success/20";
  if (s === "confirmed" || s === "in-progress" || s === "sent")
    return "bg-info/10 text-info border-info/20";
  if (s === "cancelled" || s === "dead" || s === "overdue")
    return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted text-muted-foreground border-border";
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const u1 = onSnapshot(
      query(collection(db, "bookings"), orderBy("createdAt", "desc")),
      (snap) => {
        setBookings(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Booking)
            .filter((b) => b.isTest !== true),
        );
      },
    );
    const u2 = onSnapshot(
      query(collection(db, "invoices"), orderBy("createdAt", "desc")),
      (snap) => {
        setInvoices(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Invoice)
            .filter((i) => !i.deleted && !i.isTest),
        );
      },
    );
    return () => {
      u1();
      u2();
    };
  }, []);

  const today = new Date();
  const todayISO = toISODate(today);
  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const todaysBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const d = b.confirmedDate || b.preferredDate;
        return d === todayISO;
      }),
    [bookings, todayISO],
  );

  const openInvoices = useMemo(
    () =>
      invoices.filter(
        (i) => i.status === "sent" || i.status === "overdue",
      ),
    [invoices],
  );

  const openTotal = useMemo(
    () => openInvoices.reduce((sum, i) => sum + (i.total || 0), 0),
    [openInvoices],
  );

  const recentBookings = bookings.slice(0, 10);
  const recentInvoices = invoices.slice(0, 10);

  const erroredCount = invoices.filter(
    (i) => i.qboFinalizeStatus === "error",
  ).length;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <h1
          className="text-2xl font-semibold text-foreground tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{todayLabel}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <CounterCard
          icon={<CalendarCheck className="h-5 w-5 text-accent" strokeWidth={1.75} />}
          title="Today's bookings"
          value={String(todaysBookings.length)}
          href="/admin/schedule"
          linkLabel="View schedule"
        />
        <CounterCard
          icon={<Receipt className="h-5 w-5 text-accent" strokeWidth={1.75} />}
          title="Open invoices"
          value={String(openInvoices.length)}
          subtitle={openTotal > 0 ? formatCurrency(openTotal) : "—"}
          href="/admin/invoicing"
          linkLabel="Open invoicing"
        />
        <CounterCard
          icon={
            <TrendingUp
              className={
                erroredCount > 0
                  ? "h-5 w-5 text-destructive"
                  : "h-5 w-5 text-success"
              }
              strokeWidth={1.75}
            />
          }
          title="Errored invoices"
          value={String(erroredCount)}
          href="/admin/invoices"
          linkLabel={erroredCount > 0 ? "Fix in Invoices" : "All clear"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle
              className="text-base"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Recent bookings
            </CardTitle>
            <CardDescription>Last 10 bookings created.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {recentBookings.length === 0 ? (
              <p className="px-6 pb-4 text-sm text-muted-foreground">
                No bookings yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentBookings.map((b) => {
                  const date = b.confirmedDate || b.preferredDate;
                  return (
                    <li
                      key={b.id}
                      className="flex items-center justify-between px-6 py-2.5 hover:bg-muted/30 transition-colors duration-150"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-foreground truncate">
                          {b.name || b.customerName || "(no name)"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {date || "no date"}
                          {b.timeWindow && ` · ${b.timeWindow}`}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`font-normal capitalize ${statusBadgeClass(b.status || "")}`}
                      >
                        {b.status || "—"}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex-row items-start justify-between">
            <div>
              <CardTitle
                className="text-base"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                Recent invoices
              </CardTitle>
              <CardDescription>Last 10 invoices created.</CardDescription>
            </div>
            <Link
              href="/admin/invoices"
              className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors duration-150"
            >
              All invoices
              <ArrowRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            {recentInvoices.length === 0 ? (
              <p className="px-6 pb-4 text-sm text-muted-foreground">
                No invoices yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentInvoices.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between px-6 py-2.5 hover:bg-muted/30 transition-colors duration-150"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-foreground">
                        {i.invoiceNumber}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {i.customerName || "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] tabular-nums text-foreground">
                        {formatCurrency(i.total || 0)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`font-normal capitalize ${statusBadgeClass(i.status || "")}`}
                      >
                        {i.status || "draft"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CounterCard({
  icon,
  title,
  value,
  subtitle,
  href,
  linkLabel,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle
          className="text-[13px] font-normal text-muted-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div
          className="text-3xl tracking-tight font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </div>
        {subtitle && (
          <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div>
        )}
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1 text-[12px] text-accent hover:text-accent/80 transition-colors duration-150"
        >
          {linkLabel}
          <ArrowRight className="h-3 w-3" strokeWidth={2} />
        </Link>
      </CardContent>
    </Card>
  );
}
