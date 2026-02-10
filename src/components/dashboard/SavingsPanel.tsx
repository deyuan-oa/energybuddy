import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import {
  PiggyBank,
  Leaf,
  TrendingDown,
  Zap,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
} from 'lucide-react';
import { generateSavingsData, type SavingsOpportunity } from '@/data/mockEnergyData';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  identified: { label: 'Identified', color: 'bg-muted text-muted-foreground', icon: Search },
  in_progress: { label: 'In Progress', color: 'bg-rag-amber/15 text-rag-amber border-rag-amber/30', icon: Clock },
  implemented: { label: 'Implemented', color: 'bg-primary/15 text-primary border-primary/30', icon: ArrowRight },
  verified: { label: 'Verified', color: 'bg-rag-green/15 text-rag-green border-rag-green/30', icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: 'High', color: 'bg-rag-red text-white' },
  medium: { label: 'Medium', color: 'bg-rag-amber/15 text-rag-amber border-rag-amber/30' },
  low: { label: 'Low', color: 'bg-muted text-muted-foreground' },
};

function OpportunityRow({ opp }: { opp: SavingsOpportunity }) {
  const status = statusConfig[opp.status];
  const priority = priorityConfig[opp.priority];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
      <div className="shrink-0 mt-0.5">
        <StatusIcon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="si-label text-muted-foreground">{opp.id}</span>
          <Badge variant="outline" className={cn('text-xs', status.color)}>{status.label}</Badge>
          <Badge variant="outline" className={cn('text-xs', priority.color)}>{priority.label}</Badge>
        </div>
        <p className="si-body font-medium text-foreground">{opp.title}</p>
        <p className="si-caption text-muted-foreground mt-0.5">{opp.description}</p>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="si-caption flex items-center gap-1 text-rag-green">
            <Zap className="size-3" />
            {opp.estimatedKwhSaved > 0 ? `${(opp.estimatedKwhSaved / 1000).toFixed(1)} MWh/yr` : '—'}
          </span>
          <span className="si-caption flex items-center gap-1 text-primary">
            <PiggyBank className="size-3" />
            €{opp.estimatedCostSaved.toLocaleString()}/yr
          </span>
          <span className="si-caption flex items-center gap-1 text-muted-foreground">
            <Leaf className="size-3" />
            {opp.estimatedCo2Saved > 0 ? `${(opp.estimatedCo2Saved / 1000).toFixed(1)} t CO₂` : '—'}
          </span>
          {opp.paybackMonths > 0 && (
            <span className="si-caption text-muted-foreground">
              Payback: {opp.paybackMonths} mo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SavingsPanel() {
  const data = useMemo(() => generateSavingsData(), []);
  const progressPct = Math.round((data.totalVerifiedKwh / data.targetKwh) * 100);

  return (
    <div className="space-y-4">
      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="elevation-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="size-4 text-primary" />
              <span className="si-caption text-muted-foreground">Total Identified</span>
            </div>
            <p className="si-h2 text-foreground">€{(data.totalIdentifiedCost / 1000).toFixed(1)}k</p>
            <p className="si-caption text-muted-foreground">{(data.totalIdentifiedKwh / 1000).toFixed(0)} MWh/yr</p>
          </CardContent>
        </Card>
        <Card className="elevation-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="size-4 text-rag-green" />
              <span className="si-caption text-muted-foreground">Implemented</span>
            </div>
            <p className="si-h2 text-foreground">€{(data.totalImplementedCost / 1000).toFixed(1)}k</p>
            <p className="si-caption text-muted-foreground">{(data.totalImplementedKwh / 1000).toFixed(0)} MWh/yr</p>
          </CardContent>
        </Card>
        <Card className="elevation-1 border-rag-green/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="size-4 text-rag-green" />
              <span className="si-caption text-muted-foreground">Verified Savings</span>
            </div>
            <p className="si-h2 text-rag-green">€{(data.totalVerifiedCost / 1000).toFixed(1)}k</p>
            <p className="si-caption text-muted-foreground">{(data.totalVerifiedKwh / 1000).toFixed(0)} MWh/yr</p>
          </CardContent>
        </Card>
        <Card className="elevation-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="size-4 text-rag-green" />
              <span className="si-caption text-muted-foreground">CO₂ Avoided</span>
            </div>
            <p className="si-h2 text-foreground">{(data.co2Avoided / 1000).toFixed(1)}</p>
            <p className="si-caption text-muted-foreground">tonnes CO₂/yr</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress toward target */}
      <Card className="elevation-1">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="si-body font-medium text-foreground">Annual Savings Target Progress</span>
            <span className="si-caption text-muted-foreground">
              {(data.totalVerifiedKwh / 1000).toFixed(0)} / {(data.targetKwh / 1000).toFixed(0)} MWh verified
            </span>
          </div>
          <Progress value={progressPct} className="h-3" />
          <div className="flex items-center justify-between mt-1">
            <span className="si-caption text-muted-foreground">{progressPct}% of target achieved</span>
            <span className="si-caption text-muted-foreground">
              Target: €{(data.targetCost / 1000).toFixed(1)}k/yr
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Savings trend chart */}
      <Card className="elevation-1">
        <CardHeader className="pb-3">
          <CardTitle className="si-h4">Savings Pipeline — Cumulative kWh</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data.monthlyTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 87%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(210, 10%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(210, 10%, 50%)" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(210, 18%, 87%)', borderRadius: '4px', fontSize: '12px' }}
                formatter={(value: number) => [`${(value / 1000).toFixed(0)} MWh`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="identified" name="Identified" fill="hsl(210, 15%, 75%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="implemented" name="Implemented" fill="hsl(190, 100%, 45%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="verified" name="Verified" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="target" name="Target" stroke="hsl(0, 72%, 51%)" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Opportunities list */}
      <Card className="elevation-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="si-h4">Savings Opportunities</CardTitle>
            <Badge variant="outline">{data.opportunities.length} items</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.opportunities.map(opp => (
            <OpportunityRow key={opp.id} opp={opp} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/** Compact version for embedding in reports */
export function SavingsSummaryCards() {
  const data = useMemo(() => generateSavingsData(), []);
  const progressPct = Math.round((data.totalVerifiedKwh / data.targetKwh) * 100);
  const pipeline = data.opportunities;
  const byStatus = {
    identified: pipeline.filter(o => o.status === 'identified').length,
    in_progress: pipeline.filter(o => o.status === 'in_progress').length,
    implemented: pipeline.filter(o => o.status === 'implemented').length,
    verified: pipeline.filter(o => o.status === 'verified').length,
  };

  return (
    <Card className="elevation-1 border-rag-green/20">
      <CardHeader className="pb-2">
        <CardTitle className="si-h4 flex items-center gap-2">
          <PiggyBank className="size-4 text-rag-green" /> Energy Savings Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-muted/30 p-3">
            <span className="si-caption text-muted-foreground block">Identified</span>
            <span className="si-h3 text-foreground">€{(data.totalIdentifiedCost / 1000).toFixed(1)}k</span>
            <span className="si-caption text-muted-foreground block">{(data.totalIdentifiedKwh / 1000).toFixed(0)} MWh</span>
          </div>
          <div className="rounded-lg bg-primary/5 p-3">
            <span className="si-caption text-muted-foreground block">Implemented</span>
            <span className="si-h3 text-primary">€{(data.totalImplementedCost / 1000).toFixed(1)}k</span>
            <span className="si-caption text-muted-foreground block">{(data.totalImplementedKwh / 1000).toFixed(0)} MWh</span>
          </div>
          <div className="rounded-lg bg-rag-green/5 border border-rag-green/20 p-3">
            <span className="si-caption text-muted-foreground block">Verified</span>
            <span className="si-h3 text-rag-green">€{(data.totalVerifiedCost / 1000).toFixed(1)}k</span>
            <span className="si-caption text-muted-foreground block">{(data.totalVerifiedKwh / 1000).toFixed(0)} MWh</span>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <span className="si-caption text-muted-foreground block">CO₂ Avoided</span>
            <span className="si-h3 text-foreground">{(data.co2Avoided / 1000).toFixed(1)}t</span>
            <span className="si-caption text-muted-foreground block">tonnes/yr</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="si-caption font-medium text-foreground">Target Progress</span>
            <span className="si-caption text-muted-foreground">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="si-caption text-muted-foreground">Pipeline:</span>
          <Badge variant="outline" className="text-xs">{byStatus.identified} identified</Badge>
          <Badge variant="outline" className="text-xs bg-rag-amber/15 text-rag-amber border-rag-amber/30">{byStatus.in_progress} in progress</Badge>
          <Badge variant="outline" className="text-xs bg-primary/15 text-primary border-primary/30">{byStatus.implemented} implemented</Badge>
          <Badge variant="outline" className="text-xs bg-rag-green/15 text-rag-green border-rag-green/30">{byStatus.verified} verified</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
