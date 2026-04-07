/* ─── Shared Admin Types & Helpers ──────────────────────── */

export interface FirestoreTimestamp {
  toDate: () => Date;
}

export interface Booking {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  contactPreference?: string;
  service?: string;
  serviceCategory?: string;
  selectedServices?: Array<{ id: string; name: string; price: number | null; category: string }>;
  source?: string;
  status?: string;
  address?: string;
  preferredDate?: string;
  datesFlexible?: boolean;
  timeWindow?: string;
  zip?: string;
  notes?: string;
  fleetSize?: string;
  engineType?: string;
  engineCount?: string;
  adminNotes?: string;
  commsLog?: Array<{ id: string; type: "call" | "text" | "email" | "note"; direction: "outbound" | "inbound"; summary: string; createdAt: string; createdBy: string }>;
  confirmedDate?: string;
  confirmedArrivalWindow?: string;
  estimatedDuration?: string;
  confirmedAt?: FirestoreTimestamp;
  cancelledAt?: FirestoreTimestamp;
  returningCustomer?: boolean;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  lastViewedAt?: FirestoreTimestamp;
}

export interface Customer {
  key: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalBookings: number;
  lastBookingDate: string;
  lastBookingStatus?: string;
  bookings: Booking[];
}

/* ─── Formatters ────────────────────────────────────────── */

export function formatPhone(phone?: string): string {
  if (!phone) return "-";
  const d = phone.replace(/\D/g, "");
  if (d.length === 10)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

export function formatTimestamp(ts?: FirestoreTimestamp): string {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts as unknown as string);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getBookingCalendarDate(b: Booking): string | null {
  if ((b.status === "confirmed" || b.status === "completed") && b.confirmedDate) return b.confirmedDate;
  if (b.preferredDate) return b.preferredDate;
  if (b.createdAt?.toDate) return toISODate(b.createdAt.toDate());
  return null;
}

export function getSourceLabel(source?: string): { label: string; color: string } {
  switch (source) {
    case "homepage-widget":
      return { label: "Homepage", color: "bg-[#1A5FAC]" };
    case "website":
      return { label: "Book Page", color: "bg-[#1A5FAC]" };
    case "fleet-page":
      return { label: "Fleet", color: "bg-[#16a34a]" };
    case "marine-page":
      return { label: "Marine", color: "bg-[#7c3aed]" };
    case "admin-manual":
      return { label: "Manual", color: "bg-[#0D8A8F]" };
    default:
      return { label: source || "-", color: "bg-[#888]" };
  }
}

export function getStatusStyle(status?: string) {
  switch (status) {
    case "pending":
      return { label: "Pending", cls: "bg-[#E07B2D] text-white" };
    case "confirmed":
      return { label: "Confirmed", cls: "bg-[#1A5FAC] text-white" };
    case "completed":
      return { label: "Completed", cls: "bg-[#16a34a] text-white" };
    case "cancelled":
      return { label: "Cancelled", cls: "bg-[#999] text-white" };
    default:
      return { label: status || "-", cls: "bg-[#eee] text-[#444]" };
  }
}

export function getCalendarDays(year: number, month: number): (number | null)[] {
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export function formatTimeWindow(tw?: string): string | undefined {
  if (!tw) return undefined;
  const labels: Record<string, string> = {
    "early-morning": "Early Morning (7-9)",
    "earlyMorning": "Early Morning (7-9)",
    "morning": "Morning (9-11)",
    "midday": "Midday (11-1)",
    "afternoon": "Afternoon (1-3)",
    "late-afternoon": "Late Afternoon (3-5)",
    "lateAfternoon": "Late Afternoon (3-5)",
  };
  return labels[tw] || tw;
}

export function getServiceLabel(b: Booking): string {
  if (b.service) return b.service;
  if (b.selectedServices?.length) return b.selectedServices.map((s) => s.name).join(", ");
  if (b.serviceCategory) return b.serviceCategory;
  return "";
}

export function isNewBooking(b: Booking): boolean {
  if (b.status !== "pending") return false;
  if (!b.createdAt?.toDate) return false;
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  return b.createdAt.toDate().getTime() > twoHoursAgo;
}

export function parseArrivalWindowHours(window: string): { start: number; end: number } {
  const hourMap: Record<string, { start: number; end: number }> = {
    "8:00 - 9:00 AM": { start: 8, end: 9 },
    "9:00 - 10:00 AM": { start: 9, end: 10 },
    "10:00 - 11:00 AM": { start: 10, end: 11 },
    "11:00 AM - 12:00 PM": { start: 11, end: 12 },
    "12:00 - 1:00 PM": { start: 12, end: 13 },
    "1:00 - 2:00 PM": { start: 13, end: 14 },
    "2:00 - 3:00 PM": { start: 14, end: 15 },
    "3:00 - 4:00 PM": { start: 15, end: 16 },
    "4:00 - 5:00 PM": { start: 16, end: 17 },
  };
  return hourMap[window] || { start: 9, end: 10 };
}

export function generateGCalUrl(booking: Booking): string {
  const title = encodeURIComponent(`Coastal Mobile - ${booking.service || "Service"} - ${booking.name || "Customer"}`);
  const dateStr = booking.confirmedDate || booking.preferredDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];
  let startHour = 9;
  let endHour = 10;
  if (booking.confirmedArrivalWindow) {
    const parsed = parseArrivalWindowHours(booking.confirmedArrivalWindow);
    startHour = parsed.start;
    endHour = parsed.end;
  } else {
    if (booking.timeWindow === "midday") { startHour = 11; endHour = 12; }
    if (booking.timeWindow === "afternoon") { startHour = 14; endHour = 15; }
  }
  const startDate = dateStr.replace(/-/g, "") + "T" + String(startHour).padStart(2, "0") + "0000";
  const endDate = dateStr.replace(/-/g, "") + "T" + String(endHour).padStart(2, "0") + "0000";
  const details = encodeURIComponent(
    `Service: ${booking.service || "TBD"}\nCustomer: ${booking.name || "N/A"}\nPhone: ${booking.phone || "N/A"}\nEmail: ${booking.email || "N/A"}\nContact Pref: ${booking.contactPreference || "N/A"}\nSource: ${booking.source || "N/A"}\nArrival: ${booking.confirmedArrivalWindow || "TBD"}\nNotes: ${booking.notes || "None"}\nAdmin: https://coastal-mobile-lube.netlify.app/admin`
  );
  const location = encodeURIComponent(booking.address || booking.zip || "Apollo Beach, FL");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}

/* ─── CSV Export ─────────────────────────────────────────── */

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map(escapeCsvField).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportBookingsCsv(bookings: Booking[]) {
  const header = ["Date", "Customer", "Phone", "Email", "Service", "Source", "Status", "Notes", "Created"];
  const rows = bookings.map((b) => [
    b.preferredDate || b.confirmedDate || "-",
    b.name || b.customerName || "-",
    b.phone || b.customerPhone || "-",
    b.email || b.customerEmail || "-",
    getServiceLabel(b) || "-",
    b.source || "-",
    b.status || "-",
    b.notes || "",
    b.createdAt?.toDate ? b.createdAt.toDate().toISOString() : "-",
  ]);
  downloadCsv(`bookings-${toISODate(new Date())}.csv`, [header, ...rows]);
}

export function exportCustomersCsv(bookings: Booking[]) {
  const customers = buildCustomerList(bookings);
  const header = ["Name", "Phone", "Email", "Total Bookings", "Last Booking"];
  const rows = customers.map((c) => [
    c.name,
    c.phone || "-",
    c.email || "-",
    String(c.totalBookings),
    c.lastBookingDate,
  ]);
  downloadCsv(`customers-${toISODate(new Date())}.csv`, [header, ...rows]);
}

/* ─── Customer List Builder ─────────────────────────────── */

export function buildCustomerList(bookings: Booking[]): Customer[] {
  const map = new Map<string, Booking[]>();
  bookings.forEach((b) => {
    const phone = b.phone || b.customerPhone;
    const email = b.email || b.customerEmail;
    const key = phone?.replace(/\D/g, "") || email?.toLowerCase() || b.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  });

  const customers: Customer[] = [];
  map.forEach((bks, key) => {
    const sorted = [...bks].sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
      return bTime - aTime;
    });
    const latest = sorted[0];
    customers.push({
      key,
      name: latest.name || latest.customerName || "-",
      phone: latest.phone || latest.customerPhone,
      email: latest.email || latest.customerEmail,
      address: latest.address,
      totalBookings: sorted.length,
      lastBookingDate: formatTimestamp(latest.createdAt),
      lastBookingStatus: latest.status,
      bookings: sorted,
    });
  });

  customers.sort((a, b) => {
    const aTime = a.bookings[0]?.createdAt?.toDate?.()?.getTime() ?? 0;
    const bTime = b.bookings[0]?.createdAt?.toDate?.()?.getTime() ?? 0;
    return bTime - aTime;
  });

  return customers;
}
