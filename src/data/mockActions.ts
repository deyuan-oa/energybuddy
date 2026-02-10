export type ActionStatus = 'open' | 'in-progress' | 'closed' | 'verified';
export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';
export type TeamRole = 'Operator' | 'Supervisor' | 'Manager';

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
}

export interface CorrectiveAction {
  id: string;
  title: string;
  description: string;
  rootCause: string;
  linkedKpi: string;
  linkedSeu: string;
  priority: ActionPriority;
  status: ActionStatus;
  owner: TeamMember;
  createdBy: TeamMember;
  createdAt: string;
  dueDate: string;
  closedAt?: string;
  outcomeNotes?: string;
  requiredEvidence: string;
  aiSuggested: boolean;
}

export const teamMembers: TeamMember[] = [
  { id: 'tm-1', name: 'Alex Chen', role: 'Operator' },
  { id: 'tm-2', name: 'Maria Silva', role: 'Operator' },
  { id: 'tm-3', name: 'James Park', role: 'Supervisor' },
  { id: 'tm-4', name: 'Sarah Johnson', role: 'Manager' },
  { id: 'tm-5', name: 'David Kim', role: 'Supervisor' },
];

export const mockActions: CorrectiveAction[] = [
  {
    id: 'CA-001',
    title: 'Compressed air leak — Zone B manifold',
    description: 'Ultrasonic survey detected 3 leaks on Zone B manifold downstream of FRL unit. Estimated loss ~12 CFM.',
    rootCause: 'Aged quick-connect fittings and worn O-rings',
    linkedKpi: 'Energy Intensity',
    linkedSeu: 'Compressed Air',
    priority: 'high',
    status: 'in-progress',
    owner: teamMembers[0],
    createdBy: teamMembers[2],
    createdAt: '2026-02-07T08:30:00Z',
    dueDate: '2026-02-11T17:00:00Z',
    requiredEvidence: 'Photo of repaired fittings + post-repair pressure reading',
    aiSuggested: true,
  },
  {
    id: 'CA-002',
    title: 'HVAC setpoint drift — Office block AHU-3',
    description: 'AHU-3 supply air temp measured at 14°C vs 18°C setpoint. Suspected sensor calibration issue.',
    rootCause: 'Return air temperature sensor drift',
    linkedKpi: 'Total Consumption',
    linkedSeu: 'HVAC',
    priority: 'medium',
    status: 'open',
    owner: teamMembers[1],
    createdBy: teamMembers[4],
    createdAt: '2026-02-08T10:15:00Z',
    dueDate: '2026-02-12T17:00:00Z',
    requiredEvidence: 'Calibration certificate + BMS screenshot showing corrected reading',
    aiSuggested: true,
  },
  {
    id: 'CA-003',
    title: 'Lighting schedule override — Warehouse',
    description: 'Warehouse high-bay lights running 24/7 instead of occupancy-controlled schedule after weekend maintenance.',
    rootCause: 'BMS schedule overridden to manual during maintenance, not restored',
    linkedKpi: 'Total Consumption',
    linkedSeu: 'Lighting',
    priority: 'low',
    status: 'closed',
    owner: teamMembers[0],
    createdBy: teamMembers[0],
    createdAt: '2026-02-05T14:00:00Z',
    dueDate: '2026-02-06T17:00:00Z',
    closedAt: '2026-02-06T09:30:00Z',
    outcomeNotes: 'Schedule restored via BMS. Estimated savings ~45 kWh/day.',
    requiredEvidence: 'BMS schedule screenshot',
    aiSuggested: false,
  },
  {
    id: 'CA-004',
    title: 'Peak demand exceedance — production ramp-up',
    description: 'Peak demand hit 892 kW vs 850 kW target during simultaneous start of Line 1 and Line 2 at shift change.',
    rootCause: 'No staggered start procedure documented for production lines',
    linkedKpi: 'Peak Demand',
    linkedSeu: 'Production Line',
    priority: 'critical',
    status: 'open',
    owner: teamMembers[2],
    createdBy: teamMembers[3],
    createdAt: '2026-02-09T07:45:00Z',
    dueDate: '2026-02-10T17:00:00Z',
    requiredEvidence: 'Staggered start SOP document + next-day demand profile showing compliance',
    aiSuggested: true,
  },
  {
    id: 'CA-005',
    title: 'Refrigeration condenser coil cleaning',
    description: 'Condenser approach temperature 2°C above baseline. Visual inspection confirmed dirty coils.',
    rootCause: 'Overdue preventive maintenance — coil cleaning schedule missed',
    linkedKpi: 'SEU Performance',
    linkedSeu: 'Refrigeration',
    priority: 'medium',
    status: 'verified',
    owner: teamMembers[1],
    createdBy: teamMembers[2],
    createdAt: '2026-02-03T11:00:00Z',
    dueDate: '2026-02-05T17:00:00Z',
    closedAt: '2026-02-04T16:00:00Z',
    outcomeNotes: 'Coils cleaned. Approach temp returned to baseline within 4 hours. Estimated saving 8 kWh/day.',
    requiredEvidence: 'Before/after photos + condenser temp log',
    aiSuggested: false,
  },
  {
    id: 'CA-006',
    title: 'Idle running — CNC machines during breaks',
    description: 'CNC machines on Line 3 observed running idle during 30-min lunch break. ~15 kW draw with no production.',
    rootCause: 'No shutdown procedure during scheduled breaks',
    linkedKpi: 'Energy Intensity',
    linkedSeu: 'Production Line',
    priority: 'medium',
    status: 'in-progress',
    owner: teamMembers[0],
    createdBy: teamMembers[4],
    createdAt: '2026-02-08T13:30:00Z',
    dueDate: '2026-02-13T17:00:00Z',
    requiredEvidence: 'Updated break procedure + power log showing idle elimination',
    aiSuggested: true,
  },
];
