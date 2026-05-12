/* Field-mapping helpers that normalize the divergent Booking shapes the
 * ops surfaces consume (automotive / marine / RV / fleet). The Booking type
 * lives in apps/marketing/src/app/admin/shared.ts today; A3c will canonicalize
 * it into shared-types. For A3b-1 we type the helpers against a minimal
 * BookingShape interface so they're usable from both apps without coupling
 * shared-types to marketing's source layout.
 */

export interface BookingShape {
  name?: string;
  customerName?: string;
  customerPhone?: string;
  phone?: string;
  customerEmail?: string;
  email?: string;
  address?: string;
  zip?: string;
  service?: string;
  serviceCategory?: string;
  selectedServices?: Array<{ id?: string; name?: string; price?: number | null; category?: string }>;
  confirmedArrivalWindow?: string;
  timeWindow?: string;
  vehicleYear?: string | number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleInfo?: {
    year?: string | number | null;
    make?: string | null;
    model?: string | null;
  } | null;
  vesselYear?: string | number;
  vesselMake?: string;
  vesselModel?: string;
}

function joinVehicleParts(parts: Array<string | number | null | undefined>): string {
  return parts
    .map(p => (p == null ? "" : String(p).trim()))
    .filter(Boolean)
    .join(" ");
}

export function formatBookingVehicle(b: BookingShape): string {
  const automotive = joinVehicleParts([b.vehicleYear, b.vehicleMake, b.vehicleModel]);
  if (automotive) return automotive.toUpperCase();
  if (b.vehicleInfo) {
    const fromInfo = joinVehicleParts([b.vehicleInfo.year, b.vehicleInfo.make, b.vehicleInfo.model]);
    if (fromInfo) return fromInfo.toUpperCase();
  }
  const marine = joinVehicleParts([b.vesselYear, b.vesselMake, b.vesselModel]);
  if (marine) return marine.toUpperCase();
  return "";
}

export function formatBookingService(b: BookingShape): string {
  if (b.service) return b.service;
  const first = b.selectedServices?.[0]?.name;
  if (first) return first;
  if (b.serviceCategory) return b.serviceCategory;
  return "—";
}

export function getBookingCustomerName(b: BookingShape): string {
  return b.name || b.customerName || "";
}

export function getBookingCustomerPhone(b: BookingShape): string {
  return b.phone || b.customerPhone || "";
}

export function getBookingCustomerEmail(b: BookingShape): string {
  return b.email || b.customerEmail || "";
}

export function getBookingLocation(b: BookingShape): string {
  return b.address || b.zip || "";
}

const ARRIVAL_SLOT_LABELS: Record<string, string> = {
  "early-morning": "7:00 AM",
  earlyMorning: "7:00 AM",
  morning: "9:00 AM",
  midday: "11:00 AM",
  afternoon: "1:00 PM",
  "late-afternoon": "3:00 PM",
  lateAfternoon: "3:00 PM",
  late: "4:00 PM",
};

export function getBookingArrivalTime(b: BookingShape): string {
  if (b.confirmedArrivalWindow) {
    return b.confirmedArrivalWindow.split(" - ")[0] || b.confirmedArrivalWindow;
  }
  if (b.timeWindow && b.timeWindow in ARRIVAL_SLOT_LABELS) {
    return ARRIVAL_SLOT_LABELS[b.timeWindow];
  }
  return b.timeWindow || "TBD";
}
