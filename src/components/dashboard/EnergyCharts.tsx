import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { generateWeeklyTrend, generateZoneBreakdown, zones, tariffSchedules } from '@/data/mockEnergyData';
import { useMemo } from 'react';

export function EnergyTrendChart() {
  const data = useMemo(() => generateWeeklyTrend(), []);

  return (
    <Card className="elevation-1">
      <CardHeader className="pb-3">
        <CardTitle className="si-h4">7-Day Energy Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(190, 100%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(190, 100%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 87%)" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(210, 10%, 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(210, 10%, 50%)" />
            <Tooltip
              contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(210, 18%, 87%)', borderRadius: '4px', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area type="monotone" dataKey="consumption" stroke="hsl(190, 100%, 45%)" fill="url(#colorConsumption)" name="Actual" />
            <Line type="monotone" dataKey="baseline" stroke="hsl(210, 10%, 50%)" strokeDasharray="5 5" dot={false} name="Baseline" />
            <Line type="monotone" dataKey="target" stroke="hsl(142, 71%, 45%)" strokeDasharray="3 3" dot={false} name="Target" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ZoneBreakdownChart() {
  const data = useMemo(() => generateZoneBreakdown(), []);

  return (
    <Card className="elevation-1">
      <CardHeader className="pb-3">
        <CardTitle className="si-h4">Consumption by Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 87%)" />
            <XAxis dataKey="zone" tick={{ fontSize: 11 }} stroke="hsl(210, 10%, 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(210, 10%, 50%)" />
            <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(210, 18%, 87%)', borderRadius: '4px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="current" fill="hsl(190, 100%, 45%)" name="Current" radius={[2, 2, 0, 0]} />
            <Bar dataKey="baseline" fill="hsl(210, 15%, 75%)" name="Baseline" radius={[2, 2, 0, 0]} />
            <Bar dataKey="target" fill="hsl(142, 71%, 45%)" name="Target" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TariffPanel() {
  const zoneData = useMemo(() => {
    return zones.map(z => ({
      name: z.name,
      peakCost: Math.round(z.currentKwh * 0.55 * 0.22 * 100) / 100, // ~55% during peak
      shoulderCost: Math.round(z.currentKwh * 0.25 * 0.14 * 100) / 100,
      offPeakCost: Math.round(z.currentKwh * 0.20 * 0.08 * 100) / 100,
    }));
  }, []);

  return (
    <Card className="elevation-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="si-h4">Tariff & Cost Breakdown</CardTitle>
          <div className="flex gap-2">
            {tariffSchedules.slice(0, 3).map(t => (
              <span key={t.period} className="si-caption flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ background: t.color }} />
                {t.period} €{t.ratePerKwh}/kWh
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={zoneData} layout="vertical" margin={{ top: 0, right: 5, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 87%)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(210, 10%, 50%)" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(210, 10%, 50%)" />
            <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(210, 18%, 87%)', borderRadius: '4px', fontSize: '12px' }} />
            <Bar dataKey="peakCost" stackId="a" fill="hsl(0, 72%, 51%)" name="Peak (€)" />
            <Bar dataKey="shoulderCost" stackId="a" fill="hsl(38, 92%, 50%)" name="Shoulder (€)" />
            <Bar dataKey="offPeakCost" stackId="a" fill="hsl(142, 71%, 45%)" name="Off-Peak (€)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ProductionPanel() {
  return (
    <Card className="elevation-1">
      <CardHeader className="pb-3">
        <CardTitle className="si-h4">Production Output</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded bg-secondary/50 p-3">
            <span className="si-caption text-muted-foreground block">Units Produced</span>
            <span className="si-h2 text-foreground">1,247</span>
            <span className="si-caption text-rag-green block mt-1">↑ 3.2% vs yesterday</span>
          </div>
          <div className="rounded bg-secondary/50 p-3">
            <span className="si-caption text-muted-foreground block">Energy per Unit</span>
            <span className="si-h2 text-foreground">15.6</span>
            <span className="si-body text-muted-foreground ml-1">kWh</span>
            <span className="si-caption text-rag-amber block mt-1">↑ 1.1% vs baseline</span>
          </div>
          <div className="rounded bg-secondary/50 p-3">
            <span className="si-caption text-muted-foreground block">Cost per Unit</span>
            <span className="si-h2 text-foreground">€2.34</span>
            <span className="si-caption text-rag-amber block mt-1">Target: €2.10</span>
          </div>
          <div className="rounded bg-secondary/50 p-3">
            <span className="si-caption text-muted-foreground block">Shift Efficiency</span>
            <span className="si-h2 text-foreground">87%</span>
            <span className="si-caption text-rag-green block mt-1">On target</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
