import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, MessageSquare, Radio, FlaskConical, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatContext } from '@/contexts/ChatContext';
import type { KpiCard as KpiCardData, DataSource } from '@/data/mockEnergyData';

interface KpiCardProps {
  kpi: KpiCardData;
}

const ragColors = {
  green: 'bg-rag-green/10 border-rag-green/30 text-rag-green',
  amber: 'bg-rag-amber/10 border-rag-amber/30 text-rag-amber',
  red: 'bg-rag-red/10 border-rag-red/30 text-rag-red',
};

const ragDotColors = {
  green: 'bg-rag-green',
  amber: 'bg-rag-amber',
  red: 'bg-rag-red',
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'flat' }) => {
  if (trend === 'up') return <TrendingUp className="size-4" />;
  if (trend === 'down') return <TrendingDown className="size-4" />;
  return <Minus className="size-4" />;
};

const sourceConfig: Record<DataSource, { label: string; icon: React.ElementType; className: string }> = {
  measured: { label: 'Measured', icon: Radio, className: 'bg-rag-green/10 text-rag-green border-rag-green/30' },
  estimated: { label: 'Estimated', icon: FlaskConical, className: 'bg-rag-amber/10 text-rag-amber border-rag-amber/30' },
  calculated: { label: 'Calculated', icon: Calculator, className: 'bg-primary/10 text-primary border-primary/30' },
};

function freshnessLabel(minutes: number) {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function freshnessColor(minutes: number) {
  if (minutes <= 5) return 'text-freshness-live';
  if (minutes <= 30) return 'text-rag-amber';
  return 'text-rag-red';
}

export function KpiCard({ kpi }: KpiCardProps) {
  const { askAboutKpi } = useChatContext();
  const deviationFromTarget = ((kpi.value - kpi.target) / kpi.target * 100).toFixed(1);
  const isAboveTarget = kpi.value > kpi.target;
  const src = sourceConfig[kpi.source];
  const SrcIcon = src.icon;

  const kpiContext = `KPI: ${kpi.name}\nCurrent Value: ${kpi.value} ${kpi.unit}\nTarget: ${kpi.target} ${kpi.unit}\nBaseline: ${kpi.baseline} ${kpi.unit}\nTrend: ${kpi.trend}\nRAG Status: ${kpi.rag}\nDeviation from target: ${deviationFromTarget}%\nSource: ${kpi.source}\nCoverage: ${kpi.coverage}%\nFreshness: ${freshnessLabel(kpi.freshnessMinutes)}\nDescription: ${kpi.description}`;

  return (
    <Card className={cn('relative overflow-hidden border elevation-1 transition-shadow hover:elevation-2', ragColors[kpi.rag])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn('size-2.5 rounded-full', ragDotColors[kpi.rag])} />
            <span className="si-label text-muted-foreground">{kpi.name}</span>
          </div>
          <TrendIcon trend={kpi.trend} />
        </div>

        <div className="mb-3">
          <span className="si-h2 text-foreground">{kpi.value.toLocaleString()}</span>
          <span className="si-body text-muted-foreground ml-1">{kpi.unit}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <span className="si-caption text-muted-foreground block">Target</span>
            <span className="si-body font-medium text-foreground">{kpi.target.toLocaleString()}</span>
          </div>
          <div>
            <span className="si-caption text-muted-foreground block">Baseline</span>
            <span className="si-body font-medium text-foreground">{kpi.baseline.toLocaleString()}</span>
          </div>
        </div>

        {/* Provenance & freshness row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className={cn('text-[10px] gap-1 h-5 px-1.5 font-medium', src.className)}>
                <SrcIcon className="size-2.5" />
                {src.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Data source: {src.label.toLowerCase()} value
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn('si-caption tabular-nums', freshnessColor(kpi.freshnessMinutes))}>
                {kpi.freshnessMinutes <= 5 && <span className="inline-block size-1.5 rounded-full bg-freshness-live animate-pulse mr-1 align-middle" />}
                {freshnessLabel(kpi.freshnessMinutes)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Last data update
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn('si-caption tabular-nums ml-auto', kpi.coverage >= 95 ? 'text-rag-green' : kpi.coverage >= 85 ? 'text-rag-amber' : 'text-rag-red')}>
                {kpi.coverage}%
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Data coverage: {kpi.coverage}% of expected readings received
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center justify-between">
          <span className={cn('si-caption font-medium', kpi.rag === 'green' ? 'text-rag-green' : kpi.rag === 'amber' ? 'text-rag-amber' : 'text-rag-red')}>
            {isAboveTarget ? '+' : ''}{deviationFromTarget}% vs target
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 si-caption text-primary"
            onClick={() => askAboutKpi(kpi.name, 'What changed and what should I check?', kpiContext)}
          >
            <MessageSquare className="size-3" />
            Ask
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
