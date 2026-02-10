import { cn } from '@/lib/utils';
import type { DataQuality } from '@/data/mockEnergyData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DataReadinessProps {
  quality: DataQuality[];
}

const confidenceIcons = {
  green: CheckCircle,
  amber: AlertTriangle,
  red: AlertTriangle,
};

const confidenceColors = {
  green: 'text-rag-green',
  amber: 'text-rag-amber',
  red: 'text-rag-red',
};

export function DataReadinessPanel({ quality }: DataReadinessProps) {
  const avgCoverage = Math.round(quality.reduce((sum, q) => sum + q.coverage, 0) / quality.length);

  return (
    <Card className="elevation-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="si-h4">Data Readiness & Quality</CardTitle>
          <span className={cn('si-label px-2 py-0.5 rounded', avgCoverage >= 95 ? 'bg-rag-green/10 text-rag-green' : 'bg-rag-amber/10 text-rag-amber')}>
            {avgCoverage}% avg coverage
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {quality.map((q) => {
          const Icon = confidenceIcons[q.confidence];
          const minutesAgo = Math.round((Date.now() - q.lastUpdate.getTime()) / 60000);

          return (
            <div key={q.zone} className="flex items-center gap-3 rounded bg-secondary/50 px-3 py-2">
              <Icon className={cn('size-4 shrink-0', confidenceColors[q.confidence])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="si-body font-medium capitalize text-foreground">{q.zone.replace('_', ' ')}</span>
                  <span className="si-caption text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {minutesAgo}m ago
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', q.confidence === 'green' ? 'bg-rag-green' : q.confidence === 'amber' ? 'bg-rag-amber' : 'bg-rag-red')}
                      style={{ width: `${q.coverage}%` }}
                    />
                  </div>
                  <span className="si-caption text-muted-foreground w-10 text-right">{q.coverage}%</span>
                </div>
                {q.issues.length > 0 && (
                  <div className="mt-1 space-x-2">
                    {q.issues.map((issue, i) => (
                      <span key={i} className="si-caption text-rag-amber">⚠ {issue}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <p className="si-caption text-muted-foreground">Data updated at 15-min intervals</p>
      </CardContent>
    </Card>
  );
}
