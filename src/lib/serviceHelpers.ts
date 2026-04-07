import type { Service, ServiceCategory } from "@/hooks/useServices";

/**
 * Groups services by category, with each group sorted by sortOrder.
 * Returns an array of { category, services } sorted by the category's
 * first service sortOrder.
 */
export function groupByCategory(
  services: Service[]
): { category: string; services: Service[] }[] {
  const map = new Map<string, Service[]>();

  for (const svc of services) {
    const list = map.get(svc.category) ?? [];
    list.push(svc);
    map.set(svc.category, list);
  }

  return Array.from(map.entries())
    .map(([category, items]) => ({
      category,
      services: items.sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .sort(
      (a, b) =>
        (a.services[0]?.sortOrder ?? 0) - (b.services[0]?.sortOrder ?? 0)
    );
}

/**
 * Returns active services for a specific division.
 */
export function getActiveServices(
  services: Service[],
  division: "auto" | "marine" | "fleet" | "rv"
): Service[] {
  return services
    .filter((s) => s.isActive && s.division === division)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Returns services marked for the booking flow.
 */
export function getBookingServices(services: Service[]): Service[] {
  return services
    .filter((s) => s.isActive && s.showOnBooking)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Returns services marked for the public pricing page, filtered by division.
 */
export function getPricingServices(
  services: Service[],
  division: "auto" | "marine" | "fleet" | "rv"
): Service[] {
  return services
    .filter((s) => s.isActive && s.showOnPricing && s.division === division)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
