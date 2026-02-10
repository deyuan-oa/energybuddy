import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useChatContext } from '@/contexts/ChatContext';
import { AnomalyDrawer } from '@/components/dashboard/AnomalyDrawer';
import type { KpiCard as KpiCardData, Anomaly } from '@/data/mockEnergyData';

interface ExceptionSummaryProps {
  kpis: KpiCardData[];
  anomalies: Anomaly[];
}

const ragDot = {
  green: 'bg-rag-green',
  amber: 'bg-rag-amber',
  red: 'bg-rag-red',
};

export function ExceptionSummary({ kpis, anomalies }: ExceptionSummaryProps) {
  const [drawerAnomaly, setDrawerAnomaly] = useState<Anomaly | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const headlineIds = ['total_consumption', 'peak_demand', 'energy_intensity'];
  const headlines = useMemo(
    () => headlineIds.map(id => kpis.find(k => k.id === id)).filter(Boolean) as KpiCardData[],
    [kpis],
  );

  const topIssues = useMemo(
    () =>
      [...anomalies]
        .sort((a, b) => (b.severity === 'red' ? 1 : 0) - (a.severity === 'red' ? 1 : 0))
        .slice(0, 3),
    [anomalies],
  );

  const ragCounts = {
    green: kpis.filter(k => k.rag === 'green').length,
    amber: kpis.filter(k => k.rag === 'amber').length,
    red: kpis.filter(k => k.rag === 'red').length,
  };

  const openDrawer = (anomaly: Anomaly) => {
    setDrawerAnomaly(anomaly);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="si-h3 text-foreground">Today's Overview</h2>
          <div className="flex items-center gap-2">
            {ragCounts.red > 0 && (
              <Badge variant="outline" className="gap-1 bg-rag-red/10 text-rag-red border-rag-red/30">
                <span className="size-2 rounded-full bg-rag-red" /> {ragCounts.red} Critical
              </Badge>
            )}
            {ragCounts.amber > 0 && (
              <Badge variant="outline" className="gap-1 bg-rag-amber/10 text-rag-amber border-rag-amber/30">
                <span className="size-2 rounded-full bg-rag-amber" /> {ragCounts.amber} At Risk
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 bg-rag-green/10 text-rag-green border-rag-green/30">
              <span className="size-2 rounded-full bg-rag-green" /> {ragCounts.green} On Target
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1.5 si-caption text-freshness-live">
          <span className="size-2 rounded-full bg-freshness-live animate-pulse" />
          Updated 3 min ago
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {headlines.map(kpi => {
          const deviation = ((kpi.value - kpi.target) / kpi.target * 100).toFixed(1);
          const above = kpi.value > kpi.target;
          return (
            <Card
              key={kpi.id}
              className={cn(
                'elevation-1 border transition-shadow hover:elevation-2',
                kpi.rag === 'red'
                  ? 'border-rag-red/30'
                  : kpi.rag === 'amber'
                    ? 'border-rag-amber/20'
                    : 'border-border',
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn('size-2.5 rounded-full', ragDot[kpi.rag])} />
                  <span className="si-label text-muted-foreground">{kpi.name}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-foreground">
                    {kpi.value.toLocaleString()}
                  </span>
                  <span className="si-body text-muted-foreground">{kpi.unit}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="si-caption text-muted-foreground">
                    Target: {kpi.target.toLocaleString()} {kpi.unit}
                  </span>
                  <span
                    className={cn(
                      'si-caption font-medium',
                      kpi.rag === 'green' ? 'text-rag-green' : kpi.rag === 'amber' ? 'text-rag-amber' : 'text-rag-red',
                    )}
                  >
                    {above ? '+' : ''}{deviation}%
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Issues strip */}
      {topIssues.length > 0 && (
        <Card className="elevation-1">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
              <AlertTriangle className="size-4 text-rag-amber" />
              <span className="si-label text-muted-foreground">TOP ISSUES</span>
              <Badge variant="outline" className="text-xs">{anomalies.length} total</Badge>
            </div>
            <div className="divide-y divide-border">
              {topIssues.map(issue => (
                <div
                  key={issue.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => openDrawer(issue)}
                >
                  <span
                    className={cn(
                      'size-2 rounded-full shrink-0',
                      issue.severity === 'red' ? 'bg-rag-red' : 'bg-rag-amber',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="si-body text-foreground truncate">
                      <span className="font-medium capitalize">{issue.zone.replace('_', ' ')}</span>
                      {' — '}
                      {issue.description.split('—')[0] || issue.description.substring(0, 60)}
                    </p>
                  </div>
                  <span className="si-caption text-muted-foreground whitespace-nowrap">
                    +{issue.magnitude}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 opacity-0 group-hover:opacity-100 transition-opacity si-caption"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDrawer(issue);
                    }}
                  >
                    Investigate <ArrowRight className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomaly Investigation Drawer */}
      <AnomalyDrawer
        anomaly={drawerAnomaly}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
