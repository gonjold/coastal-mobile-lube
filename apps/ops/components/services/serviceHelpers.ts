import type { Service } from "@/hooks/useServices";

/**
 * Groups services by category, with each group sorted by sortOrder.
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
