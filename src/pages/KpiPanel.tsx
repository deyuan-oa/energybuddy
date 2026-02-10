import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  ArrowLeft,
  Target,
  BarChart3,
  Info,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useChatContext } from '@/contexts/ChatContext';
import { generateKpis, generateWeeklyTrend, zones, type KpiCard as KpiData } from '@/data/mockEnergyData';

/* ── helpers ─────────────────── */
const ragDot: Record<string, string> = {
  green: 'bg-rag-green',
  amber: 'bg-rag-amber',
  red: 'bg-rag-red',
};
const ragBg: Record<string, string> = {
  green: 'bg-rag-green/10 border-rag-green/30',
  amber: 'bg-rag-amber/10 border-rag-amber/30',
  red: 'bg-rag-red/10 border-rag-red/30',
};
const ragText: Record<string, string> = {
  green: 'text-rag-green',
  amber: 'text-rag-amber',
  red: 'text-rag-red',
};

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === 'up') return <TrendingUp className="size-4" />;
  if (trend === 'down') return <TrendingDown className="size-4" />;
  return <Minus className="size-4" />;
};

/* ── 30-day trend generator ─────────────────── */
function generate30DayTrend(kpi: KpiData) {
  const days: { day: string; value: number; baseline: number; target: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const variance = 0.9 + Math.random() * 0.2;
    const weekendFactor = d.getDay() === 0 || d.getDay() === 6 ? 0.5 : 1;
    days.push({
      day: label,
      value: Math.round(kpi.value * variance * weekendFactor * 100) / 100,
      baseline: Math.round(kpi.baseline * weekendFactor * 100) / 100,
      target: Math.round(kpi.target * weekendFactor * 100) / 100,
    });
  }
  return days;
}

/* ── Contributing factors for each KPI ── */
function getContributingFactors(kpiId: string) {
  const factorMap: Record<string, { factor: string; impact: string; direction: 'positive' | 'negative' | 'neutral' }[]> = {
    total_consumption: [
      { factor: 'Compressed air leak in Zone B', impact: '+350 kWh/day', direction: 'negative' },
      { factor: 'HVAC nighttime baseload elevation', impact: '+180 kWh/day', direction: 'negative' },
      { factor: 'Lighting schedule optimisation', impact: '-50 kWh/day', direction: 'positive' },
      { factor: 'Higher ambient temperature', impact: '+120 kWh/day', direction: 'negative' },
    ],
    energy_intensity: [
      { factor: 'Production volume slightly below plan', impact: '+0.4 kWh/unit', direction: 'negative' },
      { factor: 'Idle running during breaks', impact: '+0.2 kWh/unit', direction: 'negative' },
      { factor: 'VSD optimisation on Line 2', impact: '-0.15 kWh/unit', direction: 'positive' },
    ],
    peak_demand: [
      { factor: 'Simultaneous line start at shift change', impact: '+42 kW', direction: 'negative' },
      { factor: 'Chiller compressor cycling overlap', impact: '+18 kW', direction: 'negative' },
      { factor: 'No staggered start SOP in place', impact: 'Process gap', direction: 'neutral' },
    ],
    cost_per_unit: [
      { factor: 'Peak tariff period consumption up 8%', impact: '+€0.12/unit', direction: 'negative' },
      { factor: 'Lower production volume', impact: '+€0.08/unit', direction: 'negative' },
      { factor: 'Off-peak shifting opportunity missed', impact: 'Potential saving', direction: 'neutral' },
    ],
    co2_equivalent: [
      { factor: 'Grid carbon intensity higher this week', impact: '+3% CO₂', direction: 'negative' },
      { factor: 'Total consumption above baseline', impact: '+5% CO₂', direction: 'negative' },
      { factor: 'Renewable energy share stable', impact: 'No change', direction: 'neutral' },
    ],
    seu_performance: [
      { factor: 'Compressed air efficiency below target', impact: '-8 pts', direction: 'negative' },
      { factor: 'HVAC COP within range', impact: '+2 pts', direction: 'positive' },
      { factor: 'Refrigeration condenser cleaned', impact: '+3 pts', direction: 'positive' },
      { factor: 'Lighting occupancy sensors active', impact: '+1 pt', direction: 'positive' },
    ],
    baseline_deviation: [
      { factor: 'Weather normalisation adjustment', impact: '-0.8%', direction: 'positive' },
      { factor: 'Production volume normalisation', impact: '+0.5%', direction: 'negative' },
      { factor: 'Equipment change (new compressor)', impact: 'Baseline review needed', direction: 'neutral' },
    ],
  };
  return factorMap[kpiId] ?? [];
}

/* ── Zone contribution breakdown ── */
function getZoneContributions(kpiId: string) {
  if (['total_consumption', 'co2_equivalent', 'cost_per_unit'].includes(kpiId)) {
    return zones.map(z => ({
      zone: z.name,
      current: z.currentKwh,
      baseline: z.baselineKwh,
      target: z.targetKwh,
      deviation: Math.round((z.currentKwh - z.baselineKwh) / z.baselineKwh * 100 * 10) / 10,
    }));
  }
  return null;
}

/* ── Linked actions ── */
function getLinkedActions(kpiId: string) {
  const map: Record<string, { id: string; title: string; status: string; owner: string }[]> = {
    total_consumption: [
      { id: 'CA-001', title: 'Compressed air leak — Zone B manifold', status: 'in-progress', owner: 'Alex Chen' },
      { id: 'CA-003', title: 'Lighting schedule override — Warehouse', status: 'closed', owner: 'Alex Chen' },
    ],
    peak_demand: [
      { id: 'CA-004', title: 'Peak demand exceedance — production ramp-up', status: 'open', owner: 'James Park' },
    ],
    energy_intensity: [
      { id: 'CA-006', title: 'Idle running — CNC machines during breaks', status: 'in-progress', owner: 'Alex Chen' },
    ],
    seu_performance: [
      { id: 'CA-001', title: 'Compressed air leak — Zone B manifold', status: 'in-progress', owner: 'Alex Chen' },
      { id: 'CA-005', title: 'Refrigeration condenser coil cleaning', status: 'verified', owner: 'Maria Silva' },
    ],
  };
  return map[kpiId] ?? [];
}

/* ── KPI Detail Panel ─────────────────── */
function KpiDetail({ kpi, onBack }: { kpi: KpiData; onBack: () => void }) {
  const { askAboutKpi } = useChatContext();
  const trendData = useMemo(() => generate30DayTrend(kpi), [kpi]);
  const factors = getContributingFactors(kpi.id);
  const zoneData = getZoneContributions(kpi.id);
  const linkedActions = getLinkedActions(kpi.id);
  const deviation = ((kpi.value - kpi.target) / kpi.target * 100).toFixed(1);
  const kpiContext = `KPI: ${kpi.name}\nValue: ${kpi.value} ${kpi.unit}\nTarget: ${kpi.target}\nBaseline: ${kpi.baseline}\nRAG: ${kpi.rag}\nDeviation: ${deviation}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={cn('size-3 rounded-full', ragDot[kpi.rag])} />
            <h2 className="si-h2 text-foreground">{kpi.name}</h2>
            <Badge variant="outline" className={ragBg[kpi.rag]}>
              <span className={ragText[kpi.rag]}>{kpi.rag.toUpperCase()}</span>
            </Badge>
          </div>
          <p className="si-body text-muted-foreground mt-1">{kpi.description}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => askAboutKpi(kpi.name, 'Deep dive: what changed, why, and what should I do?', kpiContext)}>
          <MessageSquare className="size-4" /> Ask Coach
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Current', value: kpi.value, sub: kpi.unit, icon: BarChart3 },
          { label: 'Target', value: kpi.target, sub: kpi.unit, icon: Target },
          { label: 'Baseline', value: kpi.baseline, sub: kpi.unit, icon: Layers },
          { label: 'Deviation', value: `${Number(deviation) > 0 ? '+' : ''}${deviation}%`, sub: 'vs target', icon: kpi.rag === 'green' ? TrendingDown : TrendingUp },
        ].map(item => (
          <Card key={item.label} className="elevation-1">
            <CardContent className="flex items-center gap-3 p-4">
              <item.icon className="size-6 text-muted-foreground" />
              <div>
                <p className="si-h3 text-foreground">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</p>
                <p className="si-caption text-muted-foreground">{item.label} · {item.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">30-Day Trend</TabsTrigger>
          <TabsTrigger value="factors">Contributing Factors</TabsTrigger>
          {zoneData && <TabsTrigger value="zones">Zone Breakdown</TabsTrigger>}
          <TabsTrigger value="actions">Linked Actions</TabsTrigger>
        </TabsList>

        {/* 30-day trend */}
        <TabsContent value="trend">
          <Card className="elevation-1">
            <CardHeader>
              <CardTitle className="si-h4">Historical Trend — 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval={2} />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12 }}
                    />
                    <Legend />
                    <ReferenceLine y={kpi.target} stroke="hsl(var(--rag-green))" strokeDasharray="6 3" label={{ value: 'Target', fill: 'hsl(var(--rag-green))', fontSize: 11 }} />
                    <Line type="monotone" dataKey="value" name="Actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="baseline" name="Baseline" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contributing factors */}
        <TabsContent value="factors">
          <Card className="elevation-1">
            <CardHeader>
              <CardTitle className="si-h4 flex items-center gap-2">
                <Info className="size-4" /> Contributing Factors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {factors.length === 0 ? (
                <p className="si-body text-muted-foreground">No contributing factors identified.</p>
              ) : (
                factors.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md border border-border bg-muted/20">
                    <div className={cn(
                      'mt-0.5 size-2.5 rounded-full shrink-0',
                      f.direction === 'positive' ? 'bg-rag-green' : f.direction === 'negative' ? 'bg-rag-red' : 'bg-muted-foreground'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="si-body font-medium text-foreground">{f.factor}</p>
                      <p className="si-caption text-muted-foreground">Impact: {f.impact}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      'shrink-0',
                      f.direction === 'positive' ? 'text-rag-green border-rag-green/30' : f.direction === 'negative' ? 'text-rag-red border-rag-red/30' : 'text-muted-foreground'
                    )}>
                      {f.direction === 'positive' ? '↓ Positive' : f.direction === 'negative' ? '↑ Negative' : '— Neutral'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zone breakdown */}
        {zoneData && (
          <TabsContent value="zones">
            <Card className="elevation-1">
              <CardHeader>
                <CardTitle className="si-h4">Zone Contribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zoneData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="zone" type="category" tick={{ fontSize: 11 }} width={110} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12 }} />
                      <Legend />
                      <Bar dataKey="current" name="Current" fill="hsl(var(--primary))" radius={[0, 2, 2, 0]} />
                      <Bar dataKey="baseline" name="Baseline" fill="hsl(var(--muted-foreground))" opacity={0.4} radius={[0, 2, 2, 0]} />
                      <Bar dataKey="target" name="Target" fill="hsl(var(--rag-green))" opacity={0.4} radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Deviation table */}
                <div className="mt-4 space-y-2">
                  {zoneData.map(z => (
                    <div key={z.zone} className="flex items-center justify-between p-2 rounded border border-border">
                      <span className="si-body font-medium text-foreground">{z.zone}</span>
                      <span className={cn('si-body font-medium', z.deviation > 0 ? 'text-rag-red' : 'text-rag-green')}>
                        {z.deviation > 0 ? '+' : ''}{z.deviation}% vs baseline
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Linked corrective actions */}
        <TabsContent value="actions">
          <Card className="elevation-1">
            <CardHeader>
              <CardTitle className="si-h4 flex items-center gap-2">
                <AlertTriangle className="size-4" /> Linked Corrective Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {linkedActions.length === 0 ? (
                <p className="si-body text-muted-foreground">No corrective actions linked to this KPI.</p>
              ) : (
                linkedActions.map(a => {
                  const statusColor =
                    a.status === 'open' ? 'bg-rag-red/15 text-rag-red border-rag-red/30' :
                    a.status === 'in-progress' ? 'bg-rag-amber/15 text-rag-amber border-rag-amber/30' :
                    a.status === 'verified' ? 'bg-primary/15 text-primary border-primary/30' :
                    'bg-rag-green/15 text-rag-green border-rag-green/30';
                  return (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-md border border-border">
                      <span className="si-label text-muted-foreground">{a.id}</span>
                      <span className="si-body text-foreground flex-1 truncate">{a.title}</span>
                      <Badge variant="outline" className={statusColor}>{a.status}</Badge>
                      <span className="si-caption text-muted-foreground hidden sm:inline">{a.owner}</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── KPI Overview Card (clickable) ── */
function KpiOverviewCard({ kpi, onClick }: { kpi: KpiData; onClick: () => void }) {
  const deviation = ((kpi.value - kpi.target) / kpi.target * 100).toFixed(1);
  return (
    <Card
      className={cn('cursor-pointer elevation-1 transition-all hover:elevation-2 border', ragBg[kpi.rag])}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn('size-2.5 rounded-full', ragDot[kpi.rag])} />
            <span className="si-label text-muted-foreground">{kpi.name}</span>
          </div>
          <TrendIcon trend={kpi.trend} />
        </div>
        <div className="mb-2">
          <span className="si-h2 text-foreground">{kpi.value.toLocaleString()}</span>
          <span className="si-body text-muted-foreground ml-1">{kpi.unit}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={cn('si-caption font-medium', ragText[kpi.rag])}>
            {Number(deviation) > 0 ? '+' : ''}{deviation}% vs target
          </span>
          <span className="si-caption text-primary">View details →</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Radar overview ── */
function KpiRadar({ kpis }: { kpis: KpiData[] }) {
  const data = kpis.map(k => ({
    name: k.name.length > 14 ? k.name.slice(0, 12) + '…' : k.name,
    score: Math.round(Math.min(k.target / k.value, k.value / k.target) * 100),
  }));

  return (
    <Card className="elevation-1">
      <CardHeader>
        <CardTitle className="si-h4">KPI Performance Radar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--border))" />
              <Radar name="Performance" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="si-caption text-muted-foreground text-center mt-2">Score = closeness to target (100% = on target)</p>
      </CardContent>
    </Card>
  );
}

/* ── Main Page ─────────────────── */
export default function KpiPanel() {
  const kpis = useMemo(() => generateKpis(), []);
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const selectedKpi = kpis.find(k => k.id === selectedKpiId);

  if (selectedKpi) {
    return (
      <div className="max-w-[1400px]">
        <KpiDetail kpi={selectedKpi} onBack={() => setSelectedKpiId(null)} />
      </div>
    );
  }

  const ragCounts = {
    green: kpis.filter(k => k.rag === 'green').length,
    amber: kpis.filter(k => k.rag === 'amber').length,
    red: kpis.filter(k => k.rag === 'red').length,
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* RAG summary */}
      <div className="flex items-center gap-4">
        <span className="si-label text-muted-foreground">KPI Health</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 si-caption"><span className="size-3 rounded-full bg-rag-green" /> {ragCounts.green} On Target</span>
          <span className="flex items-center gap-1 si-caption"><span className="size-3 rounded-full bg-rag-amber" /> {ragCounts.amber} At Risk</span>
          <span className="flex items-center gap-1 si-caption"><span className="size-3 rounded-full bg-rag-red" /> {ragCounts.red} Critical</span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {kpis.map(kpi => (
          <KpiOverviewCard key={kpi.id} kpi={kpi} onClick={() => setSelectedKpiId(kpi.id)} />
        ))}
      </div>

      {/* Radar + weekly trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <KpiRadar kpis={kpis} />
        <Card className="elevation-1">
          <CardHeader>
            <CardTitle className="si-h4">Weekly Energy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyTrendChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WeeklyTrendChart() {
  const data = useMemo(() => generateWeeklyTrend(), []);
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12 }} />
          <Legend />
          <Line type="monotone" dataKey="consumption" name="Consumption" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="baseline" name="Baseline" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="target" name="Target" stroke="hsl(var(--rag-green))" strokeWidth={1} strokeDasharray="6 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
