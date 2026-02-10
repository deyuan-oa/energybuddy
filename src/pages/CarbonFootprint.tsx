import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Leaf,
  Factory,
  Zap,
  Truck,
  TrendingDown,
  Target,
  AlertTriangle,
  Info,
  Flame,
} from 'lucide-react';

/* ── Mock data generators ── */

interface ScopeData {
  scope: string;
  label: string;
  description: string;
  icon: React.ElementType;
  tCo2: number;
  color: string;
  items: { source: string; tCo2: number; pct: number }[];
}

function generateScopeData(): ScopeData[] {
  return [
    {
      scope: 'Scope 1',
      label: 'Direct Emissions',
      description: 'On-site fuel combustion, refrigerant leaks, company vehicles',
      icon: Flame,
      tCo2: 342,
      color: 'hsl(0, 72%, 51%)',
      items: [
        { source: 'Natural gas boilers', tCo2: 185, pct: 54 },
        { source: 'Diesel generators', tCo2: 78, pct: 23 },
        { source: 'Refrigerant leakage (R-410A)', tCo2: 52, pct: 15 },
        { source: 'Company fleet', tCo2: 27, pct: 8 },
      ],
    },
    {
      scope: 'Scope 2',
      label: 'Indirect — Electricity',
      description: 'Purchased electricity from grid (location-based)',
      icon: Zap,
      tCo2: 2847,
      color: 'hsl(190, 100%, 45%)',
      items: [
        { source: 'Production line', tCo2: 1302, pct: 46 },
        { source: 'HVAC systems', tCo2: 644, pct: 23 },
        { source: 'Compressed air', tCo2: 475, pct: 17 },
        { source: 'Refrigeration', tCo2: 285, pct: 10 },
        { source: 'Lighting & other', tCo2: 141, pct: 5 },
      ],
    },
    {
      scope: 'Scope 3',
      label: 'Value Chain',
      description: 'Upstream & downstream: purchased goods, transport, waste, commuting',
      icon: Truck,
      tCo2: 1210,
      color: 'hsl(210, 15%, 55%)',
      items: [
        { source: 'Purchased raw materials', tCo2: 520, pct: 43 },
        { source: 'Inbound logistics', tCo2: 285, pct: 24 },
        { source: 'Employee commuting', tCo2: 180, pct: 15 },
        { source: 'Waste disposal', tCo2: 125, pct: 10 },
        { source: 'Business travel', tCo2: 100, pct: 8 },
      ],
    },
  ];
}

function generateMonthlyEmissions() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, i) => {
    const seasonal = 1 + 0.1 * Math.sin((i - 3) * Math.PI / 6);
    return {
      month,
      scope1: Math.round(28.5 * seasonal * (0.95 + Math.random() * 0.1)),
      scope2: Math.round(237 * seasonal * (0.95 + Math.random() * 0.1)),
      scope3: Math.round(101 * seasonal * (0.95 + Math.random() * 0.1)),
      target: Math.round(340 * (1 - i * 0.008)),
    };
  });
}

function generateIntensityTrend() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, i) => ({
    month,
    intensity: +(0.42 - i * 0.003 + (Math.random() - 0.5) * 0.01).toFixed(3),
    target: +(0.40 - i * 0.002).toFixed(3),
  }));
}

/* ── Pie chart colors ── */
const SCOPE_COLORS = ['hsl(0, 72%, 51%)', 'hsl(190, 100%, 45%)', 'hsl(210, 15%, 55%)'];

/* ── Component ── */

const CarbonFootprint = () => {
  const scopes = useMemo(() => generateScopeData(), []);
  const monthlyData = useMemo(() => generateMonthlyEmissions(), []);
  const intensityData = useMemo(() => generateIntensityTrend(), []);

  const totalEmissions = scopes.reduce((s, sc) => s + sc.tCo2, 0);
  const annualTarget = 4000;
  const reductionTarget = 10; // % year-over-year
  const lastYearTotal = 4890;
  const actualReduction = +((1 - totalEmissions / lastYearTotal) * 100).toFixed(1);
  const onTrack = actualReduction >= reductionTarget;
  const progressPct = Math.min(100, Math.round((actualReduction / reductionTarget) * 100));

  const pieData = scopes.map(s => ({ name: s.scope, value: s.tCo2 }));

  const gridFactor = 0.78; // Malaysia grid emission factor kg CO₂/kWh
  const renewablePct = 8; // % of electricity from on-site solar

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* ── Header KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="elevation-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="size-4 text-rag-green" />
              <span className="si-caption text-muted-foreground">Total Emissions (YTD)</span>
            </div>
            <p className="si-h2 text-foreground">{(totalEmissions / 1000).toFixed(1)}k</p>
            <p className="si-caption text-muted-foreground">tonnes CO₂e</p>
          </CardContent>
        </Card>
        <Card className={cn('elevation-1', onTrack ? 'border-rag-green/30' : 'border-rag-amber/30')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className={cn('size-4', onTrack ? 'text-rag-green' : 'text-rag-amber')} />
              <span className="si-caption text-muted-foreground">YoY Reduction</span>
            </div>
            <p className={cn('si-h2', onTrack ? 'text-rag-green' : 'text-rag-amber')}>{actualReduction}%</p>
            <p className="si-caption text-muted-foreground">Target: {reductionTarget}%</p>
          </CardContent>
        </Card>
        <Card className="elevation-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Factory className="size-4 text-primary" />
              <span className="si-caption text-muted-foreground">Carbon Intensity</span>
            </div>
            <p className="si-h2 text-foreground">0.35</p>
            <p className="si-caption text-muted-foreground">kg CO₂/unit produced</p>
          </CardContent>
        </Card>
        <Card className="elevation-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="size-4 text-rag-amber" />
              <span className="si-caption text-muted-foreground">Grid Factor (MY)</span>
            </div>
            <p className="si-h2 text-foreground">{gridFactor}</p>
            <p className="si-caption text-muted-foreground">kg CO₂/kWh · {renewablePct}% solar</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Reduction target progress ── */}
      <Card className="elevation-1">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <span className="si-body font-medium text-foreground">Annual Reduction Target</span>
            </div>
            <Badge variant="outline" className={cn(onTrack ? 'bg-rag-green/15 text-rag-green border-rag-green/30' : 'bg-rag-amber/15 text-rag-amber border-rag-amber/30')}>
              {onTrack ? 'On Track' : 'At Risk'}
            </Badge>
          </div>
          <Progress value={progressPct} className="h-3" />
          <div className="flex items-center justify-between mt-1">
            <span className="si-caption text-muted-foreground">{actualReduction}% achieved of {reductionTarget}% target</span>
            <span className="si-caption text-muted-foreground">
              {totalEmissions.toLocaleString()} / {annualTarget.toLocaleString()} t CO₂e budget
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Scope breakdown + Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Pie chart */}
        <Card className="elevation-1">
          <CardHeader className="pb-2">
            <CardTitle className="si-h4">Emissions by Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={SCOPE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString()} t CO₂e`, undefined]}
                  contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(210, 18%, 87%)', borderRadius: '4px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {scopes.map((s, i) => (
                <div key={s.scope} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: SCOPE_COLORS[i] }} />
                  <span className="si-caption text-muted-foreground">{s.scope}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scope detail cards */}
        <div className="lg:col-span-2 space-y-3">
          {scopes.map((scope, i) => {
            const ScopeIcon = scope.icon;
            return (
              <Card key={scope.scope} className="elevation-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: SCOPE_COLORS[i] + '20' }}>
                      <ScopeIcon className="size-4" style={{ color: SCOPE_COLORS[i] }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="si-body font-semibold text-foreground">{scope.scope}: {scope.label}</span>
                        <Badge variant="outline" className="text-xs">{scope.tCo2.toLocaleString()} t CO₂e</Badge>
                        <Badge variant="outline" className="text-xs">{((scope.tCo2 / totalEmissions) * 100).toFixed(0)}%</Badge>
                      </div>
                      <p className="si-caption text-muted-foreground">{scope.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {scope.items.map(item => (
                      <div key={item.source} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <span className="si-caption text-foreground">{item.source}</span>
                        <div className="flex items-center gap-2">
                          <span className="si-caption font-mono text-muted-foreground">{item.tCo2} t</span>
                          <span className="si-caption text-muted-foreground">({item.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Monthly emissions trend ── */}
      <Card className="elevation-1">
        <CardHeader className="pb-3">
          <CardTitle className="si-h4">Monthly Emissions Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 87%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(210, 10%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(210, 10%, 50%)" />
              <Tooltip
                contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(210, 18%, 87%)', borderRadius: '4px', fontSize: '12px' }}
                formatter={(value: number) => [`${value} t CO₂e`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="scope1" name="Scope 1" stackId="a" fill={SCOPE_COLORS[0]} radius={[0, 0, 0, 0]} />
              <Bar dataKey="scope2" name="Scope 2" stackId="a" fill={SCOPE_COLORS[1]} radius={[0, 0, 0, 0]} />
              <Bar dataKey="scope3" name="Scope 3" stackId="a" fill={SCOPE_COLORS[2]} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Carbon intensity trend ── */}
      <Card className="elevation-1">
        <CardHeader className="pb-3">
          <CardTitle className="si-h4">Carbon Intensity — kg CO₂/unit</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={intensityData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 87%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(210, 10%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(210, 10%, 50%)" domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(210, 18%, 87%)', borderRadius: '4px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="intensity" name="Actual" stroke="hsl(142, 71%, 45%)" fill="url(#intensityGrad)" />
              <Area type="monotone" dataKey="target" name="Target" stroke="hsl(0, 72%, 51%)" strokeDasharray="6 3" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Offset & Renewable note ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="elevation-1 border-rag-green/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Leaf className="size-5 text-rag-green shrink-0 mt-0.5" />
              <div>
                <h4 className="si-body font-semibold text-foreground mb-1">Renewable Energy</h4>
                <p className="si-caption text-muted-foreground">
                  Rooftop solar PV generates ~{renewablePct}% of site consumption ({(2847 * renewablePct / 100).toFixed(0)} MWh/yr), 
                  offsetting an estimated <strong>{Math.round(2847 * renewablePct / 100 * gridFactor / 1000 * 1000)} t CO₂e/yr</strong>.
                  Expansion to 15% is under evaluation (payback: 4.2 years).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="elevation-1">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="si-body font-semibold text-foreground mb-1">Methodology & Boundaries</h4>
                <p className="si-caption text-muted-foreground">
                  Emissions calculated per GHG Protocol Corporate Standard. Scope 2 uses location-based method with 
                  Malaysia grid factor of <strong>{gridFactor} kg CO₂/kWh</strong> (source: Suruhanjaya Tenaga, 2025). 
                  Scope 3 categories 1, 4, 5, 6, 7 included. Reporting boundary: operational control.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CarbonFootprint;
