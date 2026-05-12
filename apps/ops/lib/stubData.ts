// A3a stub data for the home dashboard. Shapes match the eventual real-data
// shape so A3b-1 can swap in Firestore queries with minimal diff.

export type JobInFlight = {
  id: string;
  status: 'in-progress' | 'confirmed' | 'scheduled';
  customer: string;
  vehicle: string;
  service: string;
  time: string;
  location: string;
  techInitials: string;
};

export type EstimateAwaiting = {
  id: string;
  number: string;
  customer: string;
  amount: number;     // cents
  sentDaysAgo: number;
};

export type ARPastDueRow = {
  id: string;
  number: string;
  customer: string;
  amount: number;     // cents
  daysOverdue: number;
};

export type DashboardKpis = {
  revenueMTD: { value: number; deltaPct: number; baselineLabel: string };
  jobsThisWeek: { count: number; inFlight: number };
  arOutstanding: { value: number; pastDueCount: number };
  pipelineValue: { value: number; estimateCount: number };
};

export const stubJobsInFlight: JobInFlight[] = [
  {
    id: 'job_stub_001',
    status: 'in-progress',
    customer: 'Robert Chen',
    vehicle: '2020 Honda Civic LX',
    service: 'Oil change + tire rotation',
    time: '9:30 AM',
    location: 'Apollo Beach',
    techInitials: 'JB',
  },
  {
    id: 'job_stub_002',
    status: 'confirmed',
    customer: 'Maria Esposito',
    vehicle: '2018 Toyota RAV4',
    service: 'Mount and balance (4)',
    time: '11:00 AM',
    location: 'Riverview',
    techInitials: 'JB',
  },
  {
    id: 'job_stub_003',
    status: 'scheduled',
    customer: 'James Park',
    vehicle: '2022 Ford F-150',
    service: 'Inspection + filter',
    time: '2:00 PM',
    location: 'Brandon',
    techInitials: 'JB',
  },
];

export const stubEstimatesAwaiting: EstimateAwaiting[] = [
  {
    id: 'est_stub_001',
    number: 'EST-2026-0143',
    customer: 'James Park',
    amount: 38500,
    sentDaysAgo: 1,
  },
  {
    id: 'est_stub_002',
    number: 'EST-2026-0141',
    customer: 'Coastal Towing LLC',
    amount: 124000,
    sentDaysAgo: 4,
  },
];

export const stubARPastDue: ARPastDueRow[] = [
  {
    id: 'ar_stub_001',
    number: 'CMLT-2026-018',
    customer: 'Hilltop Auto Group',
    amount: 124000,
    daysOverdue: 12,
  },
  {
    id: 'ar_stub_002',
    number: 'CMLT-2026-015',
    customer: 'Ricardo Diaz',
    amount: 60000,
    daysOverdue: 32,
  },
];

export const stubKpis: DashboardKpis = {
  revenueMTD: { value: 1284700, deltaPct: 18, baselineLabel: 'vs Apr' },
  jobsThisWeek: { count: 14, inFlight: 3 },
  arOutstanding: { value: 231000, pastDueCount: 2 },
  pipelineValue: { value: 457500, estimateCount: 2 },
};
