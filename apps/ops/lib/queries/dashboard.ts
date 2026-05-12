import {
  fetchBookingsThisWeek,
  fetchJobsInFlight,
  fetchEstimatesAwaiting,
  fetchPipelineSum,
  type BookingDoc,
} from "./bookings";
import {
  fetchRevenueMTD,
  fetchRevenuePreviousMonth,
  fetchAROutstanding,
  fetchARPastDue,
  type ARPastDueRow,
} from "./invoices";
import { fetchTechMap, type TechInfo } from "./users";

export interface DashboardKpis {
  revenue: { value: number; delta: number | null };
  jobs: { thisWeek: number; inFlight: number };
  ar: { outstanding: number; pastDueCount: number };
  pipeline: { value: number; count: number };
}

export interface DashboardPanels {
  jobsInFlight: BookingDoc[];
  estimatesAwaiting: BookingDoc[];
  arPastDue: ARPastDueRow[];
  techMap: Map<string, TechInfo>;
}

export interface DashboardResult {
  kpis: DashboardKpis;
  panels: DashboardPanels;
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}

export async function fetchDashboard(): Promise<DashboardResult> {
  const [
    revenueMTD,
    revenuePrev,
    jobsThisWeek,
    arOutstanding,
    pipeline,
    jobsInFlight,
    estimatesAwaiting,
    arPastDue,
    techMap,
  ] = await Promise.all([
    fetchRevenueMTD(),
    fetchRevenuePreviousMonth(),
    fetchBookingsThisWeek(),
    fetchAROutstanding(),
    fetchPipelineSum(),
    fetchJobsInFlight(5),
    fetchEstimatesAwaiting(5),
    fetchARPastDue(5),
    fetchTechMap(),
  ]);
  return {
    kpis: {
      revenue: { value: revenueMTD.total, delta: pctDelta(revenueMTD.total, revenuePrev.total) },
      jobs: {
        thisWeek: jobsThisWeek.length,
        inFlight: jobsThisWeek.filter(b => b.status === "in-progress").length,
      },
      ar: { outstanding: arOutstanding.total, pastDueCount: arOutstanding.pastDueCount },
      pipeline: { value: pipeline.total, count: pipeline.count },
    },
    panels: { jobsInFlight, estimatesAwaiting, arPastDue, techMap },
  };
}
