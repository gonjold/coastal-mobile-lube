"use client";

import { type Booking, getServiceLabel } from "@/app/admin/shared";
import AdminBadge from "./AdminBadge";

const ROW_HEIGHT = 72;
const START_HOUR = 7;
const END_HOUR = 18; // 5 PM (exclusive, so 7 AM–5 PM = 11 rows)
const TOTAL_HOURS = END_HOUR - START_HOUR;

/* ── Time parsing utility ── */

function parseTimeToDecimalHour(time?: string): number {
  if (!time) return 9;
  // Handle "8:00 - 9:00 AM" style arrival windows
  const windowMatch = time.match(/^(\d{1,2}):(\d{2})\s*(?:-|–)\s*\d{1,2}:\d{2}\s*(AM|PM)/i);
  if (windowMatch) {
    let h = parseInt(windowMatch[1], 10);
    const m = parseInt(windowMatch[2], 10);
    const period = windowMatch[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h + m / 60;
  }
  // Handle "8:00 AM" style
  const singleMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (singleMatch) {
    let h = parseInt(singleMatch[1], 10);
    const m = parseInt(singleMatch[2], 10);
    const period = singleMatch[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h + m / 60;
  }
  // Handle time window labels
  const windowMap: Record<string, number> = {
    "early-morning": 7, earlyMorning: 7, morning: 9, midday: 11, afternoon: 13,
    "late-afternoon": 15, lateAfternoon: 15, late: 16,
  };
  if (windowMap[time] !== undefined) return windowMap[time];
  return 9;
}

function getBookingTimeHour(b: Booking): number {
  if (b.confirmedArrivalWindow) return parseTimeToDecimalHour(b.confirmedArrivalWindow);
  if (b.timeWindow) return parseTimeToDecimalHour(b.timeWindow);
  return 9;
}

// TODO: add duration field to booking schema
function getBookingDuration(b: Booking): number {
  if (b.estimatedDuration) {
    if (b.estimatedDuration.includes("Under 1")) return 1;
    if (b.estimatedDuration.includes("1-2")) return 1.5;
    if (b.estimatedDuration.includes("2-3")) return 2.5;
    if (b.estimatedDuration.includes("Half day")) return 4;
  }
  return 1;
}

function getStatusBlockColors(status?: string): { bg: string; border: string } {
  switch (status) {
    case "confirmed": return { bg: "bg-green-50", border: "border-green-300" };
    case "pending": return { bg: "bg-amber-50", border: "border-amber-300" };
    case "new-lead": return { bg: "bg-blue-50", border: "border-blue-300" };
    case "in-progress": return { bg: "bg-teal-50", border: "border-teal-300" };
    case "completed": return { bg: "bg-gray-100", border: "border-gray-300" };
    default: return { bg: "bg-gray-50", border: "border-gray-200" };
  }
}

function getDivisionColor(b: Booking): string {
  const cat = b.division || b.serviceCategory || "";
  if (cat.toLowerCase().includes("marine") || b.vesselMake) return "#0D8A8F";
  if (cat.toLowerCase().includes("fleet") || b.fleetSize) return "#1A5FAC";
  if (cat.toLowerCase().includes("rv") || b.rvType) return "#7c3aed";
  return "#0B2040";
}

function getStatusBadgeVariant(status?: string): "green" | "red" | "amber" | "gray" | "blue" | "teal" {
  switch (status) {
    case "pending": return "amber";
    case "confirmed": return "blue";
    case "in-progress": return "teal";
    case "completed": return "green";
    case "cancelled": return "red";
    default: return "gray";
  }
}

function formatHourLabel(h: number): string {
  if (h === 0 || h === 12) return h === 0 ? "12 AM" : "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

/* ── Week builder ── */

function getWeekDays(selectedDay: string): { label: string; date: string; isToday: boolean }[] {
  const sel = new Date(selectedDay + "T12:00:00");
  const dayOfWeek = sel.getDay();
  const sunday = new Date(sel);
  sunday.setDate(sel.getDate() - dayOfWeek);

  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const days: { label: string; date: string; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    days.push({ label: `${dayName} ${d.getDate()}`, date: iso, isToday: iso === todayISO });
  }
  return days;
}

export default function ScheduleCalendar({
  bookings,
  selectedId,
  onSelect,
  selectedDay,
  onDayChange,
}: {
  bookings: Booking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectedDay: string;
  onDayChange: (day: string) => void;
}) {
  const weekDays = getWeekDays(selectedDay);

  // Count jobs per day
  const jobCounts: Record<string, number> = {};
  bookings.forEach((b) => {
    const date = b.confirmedDate || b.preferredDate;
    if (date) jobCounts[date] = (jobCounts[date] || 0) + 1;
  });

  // Filter bookings for the selected day
  const dayBookings = bookings.filter((b) => {
    const date = b.confirmedDate || b.preferredDate;
    return date === selectedDay;
  });

  // Current time indicator
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const showNowLine = currentHour >= START_HOUR && currentHour < END_HOUR;
  const nowTop = (currentHour - START_HOUR) * ROW_HEIGHT;

  return (
    <div>
      {/* Day selector bar */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-4">
        {weekDays.map((day) => {
          const isActive = day.date === selectedDay;
          const count = jobCounts[day.date] || 0;
          return (
            <button
              key={day.date}
              onClick={() => onDayChange(day.date)}
              className={`px-4 py-2 rounded-lg text-[13px] cursor-pointer transition ${
                isActive
                  ? "bg-[#0B2040] text-white font-semibold"
                  : day.isToday
                    ? "border border-[#E07B2D] bg-transparent text-[#0B2040] font-medium"
                    : "bg-transparent text-[#0B2040] font-medium hover:bg-gray-50"
              }`}
            >
              {day.label}
              {count > 0 && (
                <span className={`ml-1.5 inline-block px-1.5 py-px rounded text-[10px] font-bold ${
                  isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline grid */}
      <div className="relative" style={{ minHeight: TOTAL_HOURS * ROW_HEIGHT }}>
        {/* Hour lines */}
        {Array.from({ length: TOTAL_HOURS }, (_, i) => {
          const hour = START_HOUR + i;
          return (
            <div key={hour} className="absolute left-0 right-0" style={{ top: i * ROW_HEIGHT }}>
              <div className="flex items-start">
                <div className="w-[72px] text-right text-xs font-medium text-gray-500 pr-4 pt-2">
                  {formatHourLabel(hour)}
                </div>
                <div className="flex-1 border-b border-gray-200" style={{ height: ROW_HEIGHT }} />
              </div>
            </div>
          );
        })}

        {/* Now indicator */}
        {showNowLine && (
          <div className="absolute left-0 right-0 z-10" style={{ top: nowTop }}>
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 ml-[60px]" />
              <div className="flex-1 h-0.5 bg-red-600" />
            </div>
          </div>
        )}

        {/* Job blocks */}
        {dayBookings.map((b) => {
          const timeHour = getBookingTimeHour(b);
          const duration = getBookingDuration(b);
          const top = (timeHour - START_HOUR) * ROW_HEIGHT + 2;
          const height = Math.max(duration * ROW_HEIGHT - 4, 48);
          const { bg, border } = getStatusBlockColors(b.status);
          const divColor = getDivisionColor(b);
          const isSelected = selectedId === b.id;

          const vehicle = [b.vehicleYear, b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") ||
            [b.vesselYear, b.vesselMake, b.vesselModel].filter(Boolean).join(" ");

          const price = b.selectedServices?.reduce((sum, s) => sum + (s.price || 0), 0);

          return (
            <div
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`absolute cursor-pointer transition-shadow ${bg} ${
                isSelected ? "shadow-md" : "hover:shadow-sm"
              }`}
              style={{
                top,
                height,
                left: 80,
                right: 16,
                borderRadius: 10,
                border: `1.5px solid`,
                borderColor: isSelected ? divColor : undefined,
                borderLeftWidth: 4,
                borderLeftColor: divColor,
                padding: "8px 14px",
              }}
            >
              {/* Top row */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[#0B2040] truncate">{b.name || b.customerName || "—"}</span>
                {price ? (
                  <span className="text-xs font-semibold text-[#0B2040]">${price}</span>
                ) : null}
              </div>
              {/* Middle */}
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {b.confirmedArrivalWindow || formatHourLabel(timeHour)} · {getServiceLabel(b) || "—"}
              </p>
              {/* Bottom (only if tall enough) */}
              {height > 56 && (
                <div className="flex items-center gap-2 mt-1">
                  {vehicle && <span className="text-xs text-gray-500 truncate">{vehicle}</span>}
                  <AdminBadge
                    label={b.status || "—"}
                    variant={getStatusBadgeVariant(b.status)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
