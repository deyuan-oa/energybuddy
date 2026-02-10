// Mock Energy Data Engine — realistic 15-min interval data for 5 factory zones

export type ZoneId = 'hvac' | 'production' | 'lighting' | 'compressed_air' | 'refrigeration';

export interface Zone {
  id: ZoneId;
  name: string;
  seuType: string;
  icon: string;
  baselineKwh: number; // daily baseline
  currentKwh: number;
  targetKwh: number;
}

export type DataSource = 'measured' | 'estimated' | 'calculated';

export interface KpiCard {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  baseline: number;
  trend: 'up' | 'down' | 'flat';
  rag: 'green' | 'amber' | 'red';
  zone?: ZoneId;
  description: string;
  /** Data provenance */
  source: DataSource;
  /** Coverage percentage 0-100 */
  coverage: number;
  /** Minutes since last data update */
  freshnessMinutes: number;
}

export interface EnergyReading {
  timestamp: Date;
  zone: ZoneId;
  kwh: number;
  cost: number;
  quality: 'good' | 'suspect' | 'missing';
}

export interface ProductionData {
  zone: ZoneId;
  unitsProduced: number;
  date: string;
}

export interface TariffSchedule {
  period: 'peak' | 'off-peak' | 'shoulder';
  startHour: number;
  endHour: number;
  ratePerKwh: number;
  color: string;
}

export interface DataQuality {
  zone: ZoneId;
  coverage: number; // 0-100%
  lastUpdate: Date;
  confidence: 'green' | 'amber' | 'red';
  issues: string[];
}

export interface Anomaly {
  id: string;
  zone: ZoneId;
  type: 'spike' | 'step_change' | 'abnormal_baseload' | 'peak_exceedance';
  timestamp: Date;
  magnitude: number; // % above baseline
  description: string;
  severity: 'amber' | 'red';
}

// Zone definitions
export const zones: Zone[] = [
  { id: 'hvac', name: 'HVAC', seuType: 'Heating & Cooling', icon: 'air', baselineKwh: 4200, currentKwh: 4580, targetKwh: 3990 },
  { id: 'production', name: 'Production Line', seuType: 'Manufacturing', icon: 'capacity', baselineKwh: 8500, currentKwh: 8120, targetKwh: 8075 },
  { id: 'lighting', name: 'Lighting', seuType: 'Facility Lighting', icon: 'bulb', baselineKwh: 1200, currentKwh: 1150, targetKwh: 1080 },
  { id: 'compressed_air', name: 'Compressed Air', seuType: 'Pneumatics', icon: 'maintenance', baselineKwh: 3100, currentKwh: 3450, targetKwh: 2945 },
  { id: 'refrigeration', name: 'Refrigeration', seuType: 'Cold Storage', icon: 'capacity', baselineKwh: 2800, currentKwh: 2750, targetKwh: 2660 },
];

// Tariff schedules
export const tariffSchedules: TariffSchedule[] = [
  { period: 'off-peak', startHour: 0, endHour: 7, ratePerKwh: 0.08, color: 'hsl(var(--rag-green))' },
  { period: 'shoulder', startHour: 7, endHour: 9, ratePerKwh: 0.14, color: 'hsl(var(--rag-amber))' },
  { period: 'peak', startHour: 9, endHour: 17, ratePerKwh: 0.22, color: 'hsl(var(--rag-red))' },
  { period: 'shoulder', startHour: 17, endHour: 21, ratePerKwh: 0.14, color: 'hsl(var(--rag-amber))' },
  { period: 'off-peak', startHour: 21, endHour: 24, ratePerKwh: 0.08, color: 'hsl(var(--rag-green))' },
];

function getTariffRate(hour: number): number {
  const schedule = tariffSchedules.find(s => hour >= s.startHour && hour < s.endHour);
  return schedule?.ratePerKwh ?? 0.14;
}

// Generate 24h of 15-min readings for a zone
export function generateDailyReadings(zone: Zone, date: Date = new Date()): EnergyReading[] {
  const readings: EnergyReading[] = [];
  const basePerInterval = zone.currentKwh / 96; // 96 intervals per day

  for (let i = 0; i < 96; i++) {
    const hour = Math.floor(i / 4);
    const timestamp = new Date(date);
    timestamp.setHours(hour, (i % 4) * 15, 0, 0);

    // Realistic load profile: low at night, peak during work hours
    let loadFactor = 0.3; // nighttime base
    if (hour >= 6 && hour < 8) loadFactor = 0.6 + Math.random() * 0.2; // ramp up
    else if (hour >= 8 && hour < 17) loadFactor = 0.85 + Math.random() * 0.15; // peak hours
    else if (hour >= 17 && hour < 20) loadFactor = 0.5 + Math.random() * 0.15; // ramp down
    else if (hour >= 20) loadFactor = 0.35 + Math.random() * 0.1;

    // Zone-specific patterns
    if (zone.id === 'lighting') {
      loadFactor = hour >= 6 && hour < 20 ? 0.8 + Math.random() * 0.2 : 0.15;
    } else if (zone.id === 'refrigeration') {
      loadFactor = 0.7 + Math.random() * 0.3; // always running, cyclic
    }

    const kwh = basePerInterval * loadFactor * (0.95 + Math.random() * 0.1);
    const cost = kwh * getTariffRate(hour);

    // Occasional quality issues
    const qualityRoll = Math.random();
    const quality: 'good' | 'suspect' | 'missing' = qualityRoll > 0.97 ? 'missing' : qualityRoll > 0.93 ? 'suspect' : 'good';

    readings.push({ timestamp, zone: zone.id, kwh: Math.round(kwh * 100) / 100, cost: Math.round(cost * 100) / 100, quality });
  }
  return readings;
}

// Generate all zone readings for today
export function generateAllZoneReadings(): EnergyReading[] {
  return zones.flatMap(zone => generateDailyReadings(zone));
}

// Production data
export function generateProductionData(): ProductionData[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    { zone: 'hvac', unitsProduced: 0, date: today }, // HVAC doesn't produce
    { zone: 'production', unitsProduced: 1247 + Math.floor(Math.random() * 100), date: today },
    { zone: 'lighting', unitsProduced: 0, date: today },
    { zone: 'compressed_air', unitsProduced: 0, date: today },
    { zone: 'refrigeration', unitsProduced: 0, date: today },
  ];
}

// Data quality per zone
export function generateDataQuality(): DataQuality[] {
  const now = new Date();
  return zones.map(zone => {
    const coverage = zone.id === 'compressed_air' ? 87 : 94 + Math.floor(Math.random() * 6);
    const minutesAgo = zone.id === 'compressed_air' ? 45 : Math.floor(Math.random() * 15);
    const lastUpdate = new Date(now.getTime() - minutesAgo * 60000);
    const issues: string[] = [];
    if (coverage < 90) issues.push('Low data coverage');
    if (minutesAgo > 30) issues.push('Stale data');
    if (zone.id === 'compressed_air') issues.push('Sensor drift detected on meter CA-03');

    return {
      zone: zone.id,
      coverage,
      lastUpdate,
      confidence: coverage >= 95 ? 'green' : coverage >= 85 ? 'amber' : 'red',
      issues,
    };
  });
}

// KPI calculations
export function generateKpis(): KpiCard[] {
  const totalConsumption = zones.reduce((sum, z) => sum + z.currentKwh, 0);
  const totalBaseline = zones.reduce((sum, z) => sum + z.baselineKwh, 0);
  const totalTarget = zones.reduce((sum, z) => sum + z.targetKwh, 0);
  const productionUnits = 1280;
  const co2Factor = 0.42; // kg CO2 per kWh

  return [
    {
      id: 'total_consumption', name: 'Total Consumption', value: totalConsumption,
      unit: 'kWh', target: totalTarget, baseline: totalBaseline,
      trend: totalConsumption > totalBaseline ? 'up' : 'down',
      rag: totalConsumption <= totalTarget ? 'green' : totalConsumption <= totalBaseline ? 'amber' : 'red',
      description: 'Total energy consumed across all zones today',
      source: 'measured', coverage: 96, freshnessMinutes: 3,
    },
    {
      id: 'energy_intensity', name: 'Energy Intensity', value: Math.round((totalConsumption / productionUnits) * 100) / 100,
      unit: 'kWh/unit', target: Math.round((totalTarget / productionUnits) * 100) / 100, baseline: Math.round((totalBaseline / productionUnits) * 100) / 100,
      trend: 'up', rag: 'amber',
      description: 'Energy consumed per unit of production output',
      source: 'calculated', coverage: 94, freshnessMinutes: 3,
    },
    {
      id: 'peak_demand', name: 'Peak Demand', value: 842,
      unit: 'kW', target: 800, baseline: 820,
      trend: 'up', rag: 'red',
      description: 'Maximum instantaneous demand recorded today',
      source: 'measured', coverage: 100, freshnessMinutes: 1,
    },
    {
      id: 'cost_per_unit', name: 'Cost per Unit', value: 2.34,
      unit: '€/unit', target: 2.10, baseline: 2.25,
      trend: 'up', rag: 'amber',
      description: 'Energy cost per production unit using current tariff',
      source: 'calculated', coverage: 94, freshnessMinutes: 3,
    },
    {
      id: 'co2_equivalent', name: 'CO₂ Equivalent', value: Math.round(totalConsumption * co2Factor),
      unit: 'kg CO₂', target: Math.round(totalTarget * co2Factor), baseline: Math.round(totalBaseline * co2Factor),
      trend: 'up', rag: 'amber',
      description: 'Carbon dioxide equivalent emissions from energy use',
      source: 'estimated', coverage: 92, freshnessMinutes: 15,
    },
    {
      id: 'seu_performance', name: 'SEU Performance', value: 78,
      unit: '%', target: 85, baseline: 80,
      trend: 'down', rag: 'amber',
      description: 'Composite performance score for Significant Energy Uses',
      source: 'calculated', coverage: 87, freshnessMinutes: 12,
    },
    {
      id: 'baseline_deviation', name: 'Baseline Deviation', value: 3.2,
      unit: '%', target: 0, baseline: 0,
      trend: 'up', rag: 'amber',
      description: 'Current consumption deviation from the established baseline',
      source: 'calculated', coverage: 96, freshnessMinutes: 3,
    },
  ];
}

// Anomalies
export function generateAnomalies(): Anomaly[] {
  const now = new Date();
  return [
    {
      id: 'ANO-001', zone: 'compressed_air', type: 'spike',
      timestamp: new Date(now.getTime() - 2 * 3600000),
      magnitude: 34, description: 'Compressor room consumption spiked 34% above baseline at 10:15 — possible leak or stuck valve.',
      severity: 'red',
    },
    {
      id: 'ANO-002', zone: 'hvac', type: 'abnormal_baseload',
      timestamp: new Date(now.getTime() - 8 * 3600000),
      magnitude: 18, description: 'HVAC nighttime baseload 18% above expected — check for stuck dampers or schedule override.',
      severity: 'amber',
    },
    {
      id: 'ANO-003', zone: 'production', type: 'peak_exceedance',
      timestamp: new Date(now.getTime() - 1 * 3600000),
      magnitude: 5, description: 'Peak demand briefly exceeded 800kW target during shift changeover.',
      severity: 'amber',
    },
  ];
}

// Health Score
export interface HealthScore {
  overall: number;
  breakdown: { name: string; score: number; weight: number; description: string }[];
}

export function generateHealthScore(): HealthScore {
  const breakdown = [
    { name: 'Data Completeness', score: 91, weight: 20, description: 'Average data coverage across all zones' },
    { name: 'EnPI vs Baseline', score: 72, weight: 30, description: 'Energy performance indicators trending vs baseline' },
    { name: 'Action Closure Rate', score: 65, weight: 20, description: 'Corrective actions closed on time' },
    { name: 'SEU Attention', score: 80, weight: 15, description: 'Significant Energy Uses monitored and reviewed' },
    { name: 'Guide Completion', score: 85, weight: 15, description: 'Daily guide steps completed this week' },
  ];
  const overall = Math.round(breakdown.reduce((sum, b) => sum + b.score * b.weight / 100, 0));
  return { overall, breakdown };
}

// 7-day trend data for charts
export function generateWeeklyTrend(): { day: string; consumption: number; baseline: number; target: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const totalBaseline = zones.reduce((sum, z) => sum + z.baselineKwh, 0);
  const totalTarget = zones.reduce((sum, z) => sum + z.targetKwh, 0);

  return days.map((day, i) => {
    const weekendFactor = i >= 5 ? 0.4 : 1;
    return {
      day,
      consumption: Math.round(totalBaseline * weekendFactor * (0.9 + Math.random() * 0.2)),
      baseline: Math.round(totalBaseline * weekendFactor),
      target: Math.round(totalTarget * weekendFactor),
    };
  });
}

// Zone breakdown for bar chart
export function generateZoneBreakdown(): { zone: string; current: number; baseline: number; target: number }[] {
  return zones.map(z => ({
    zone: z.name,
    current: z.currentKwh,
    baseline: z.baselineKwh,
    target: z.targetKwh,
  }));
}

// ── Energy Savings Data ──

export interface SavingsOpportunity {
  id: string;
  title: string;
  zone: ZoneId;
  estimatedKwhSaved: number;
  estimatedCostSaved: number;
  estimatedCo2Saved: number;
  status: 'identified' | 'in_progress' | 'implemented' | 'verified';
  priority: 'high' | 'medium' | 'low';
  paybackMonths: number;
  description: string;
}

export interface SavingsSummary {
  totalIdentifiedKwh: number;
  totalIdentifiedCost: number;
  totalImplementedKwh: number;
  totalImplementedCost: number;
  totalVerifiedKwh: number;
  totalVerifiedCost: number;
  targetKwh: number;
  targetCost: number;
  co2Avoided: number;
  opportunities: SavingsOpportunity[];
  monthlyTrend: { month: string; identified: number; implemented: number; verified: number; target: number }[];
}

export function generateSavingsData(): SavingsSummary {
  const opportunities: SavingsOpportunity[] = [
    {
      id: 'SAV-001', title: 'Compressed air leak repair — Zone B manifold',
      zone: 'compressed_air', estimatedKwhSaved: 73000, estimatedCostSaved: 10220, estimatedCo2Saved: 30660,
      status: 'in_progress', priority: 'high', paybackMonths: 1,
      description: 'Repair identified leaks on Zone B manifold to eliminate 200 kWh/day waste.',
    },
    {
      id: 'SAV-002', title: 'HVAC setpoint optimization — Office block',
      zone: 'hvac', estimatedKwhSaved: 36500, estimatedCostSaved: 5110, estimatedCo2Saved: 15330,
      status: 'implemented', priority: 'medium', paybackMonths: 0,
      description: 'Adjust AHU-3 setpoints from 21°C to 22°C during summer and enable night setback.',
    },
    {
      id: 'SAV-003', title: 'LED retrofit — Warehouse lighting',
      zone: 'lighting', estimatedKwhSaved: 54750, estimatedCostSaved: 7665, estimatedCo2Saved: 22995,
      status: 'verified', priority: 'high', paybackMonths: 14,
      description: 'Replace 120 fluorescent fixtures with LED equivalents with PIR occupancy sensors.',
    },
    {
      id: 'SAV-004', title: 'Production line idle-running elimination',
      zone: 'production', estimatedKwhSaved: 29200, estimatedCostSaved: 4088, estimatedCo2Saved: 12264,
      status: 'identified', priority: 'medium', paybackMonths: 2,
      description: 'Implement automated shutdown of CNC machines during scheduled breaks.',
    },
    {
      id: 'SAV-005', title: 'Refrigeration condenser coil cleaning schedule',
      zone: 'refrigeration', estimatedKwhSaved: 18250, estimatedCostSaved: 2555, estimatedCo2Saved: 7665,
      status: 'verified', priority: 'low', paybackMonths: 0,
      description: 'Quarterly condenser coil cleaning to maintain COP above 3.2.',
    },
    {
      id: 'SAV-006', title: 'Load shifting — Production ramp to shoulder tariff',
      zone: 'production', estimatedKwhSaved: 0, estimatedCostSaved: 43800, estimatedCo2Saved: 0,
      status: 'identified', priority: 'high', paybackMonths: 0,
      description: 'Shift Stage 2 production ramp-up from peak (14:00-16:00) to shoulder period (starting 16:00).',
    },
    {
      id: 'SAV-007', title: 'VSD installation on cooling water pumps',
      zone: 'refrigeration', estimatedKwhSaved: 21900, estimatedCostSaved: 3066, estimatedCo2Saved: 9198,
      status: 'identified', priority: 'medium', paybackMonths: 18,
      description: 'Install variable speed drives on 3 × 15kW cooling water pumps.',
    },
  ];

  const implemented = opportunities.filter(o => o.status === 'implemented' || o.status === 'verified');
  const verified = opportunities.filter(o => o.status === 'verified');

  const totalIdentifiedKwh = opportunities.reduce((s, o) => s + o.estimatedKwhSaved, 0);
  const totalIdentifiedCost = opportunities.reduce((s, o) => s + o.estimatedCostSaved, 0);
  const totalImplementedKwh = implemented.reduce((s, o) => s + o.estimatedKwhSaved, 0);
  const totalImplementedCost = implemented.reduce((s, o) => s + o.estimatedCostSaved, 0);
  const totalVerifiedKwh = verified.reduce((s, o) => s + o.estimatedKwhSaved, 0);
  const totalVerifiedCost = verified.reduce((s, o) => s + o.estimatedCostSaved, 0);
  const co2Avoided = implemented.reduce((s, o) => s + o.estimatedCo2Saved, 0);

  const monthlyTrend = [
    { month: 'Sep', identified: 18000, implemented: 5000, verified: 0, target: 20000 },
    { month: 'Oct', identified: 42000, implemented: 12000, verified: 5000, target: 40000 },
    { month: 'Nov', identified: 85000, implemented: 35000, verified: 12000, target: 60000 },
    { month: 'Dec', identified: 120000, implemented: 58000, verified: 35000, target: 80000 },
    { month: 'Jan', identified: 180000, implemented: 92000, verified: 58000, target: 100000 },
    { month: 'Feb', identified: totalIdentifiedKwh, implemented: totalImplementedKwh, verified: totalVerifiedKwh, target: 120000 },
  ];

  return {
    totalIdentifiedKwh,
    totalIdentifiedCost,
    totalImplementedKwh,
    totalImplementedCost,
    totalVerifiedKwh,
    totalVerifiedCost,
    targetKwh: 120000,
    targetCost: 16800,
    co2Avoided,
    opportunities,
    monthlyTrend,
  };
}
