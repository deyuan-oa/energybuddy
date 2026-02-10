import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { HealthScore } from '@/data/mockEnergyData';

interface HealthScorePanelProps {
  score: HealthScore;
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-rag-green';
  if (score >= 60) return 'text-rag-amber';
  return 'text-rag-red';
}

function getBarColor(score: number) {
  if (score >= 80) return 'bg-rag-green';
  if (score >= 60) return 'bg-rag-amber';
  return 'bg-rag-red';
}

export function HealthScorePanel({ score }: HealthScorePanelProps) {
  return (
    <Card className="elevation-1">
      <CardHeader className="pb-3">
        <CardTitle className="si-h4">Energy Management Health Score</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall score ring */}
        <div className="flex items-center gap-6 mb-5">
          <div className="relative size-24 shrink-0">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={score.overall >= 80 ? 'hsl(var(--rag-green))' : score.overall >= 60 ? 'hsl(var(--rag-amber))' : 'hsl(var(--rag-red))'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${score.overall * 2.64} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('si-h2', getScoreColor(score.overall))}>{score.overall}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="si-body text-muted-foreground">
              Internal operational metric — not a certification score. Tracks energy management maturity across 5 dimensions.
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          {score.breakdown.map((item) => (
            <div key={item.name} className="group cursor-pointer">
              <div className="flex items-center justify-between mb-1">
                <span className="si-body text-foreground group-hover:text-primary transition-colors">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="si-caption text-muted-foreground">{item.weight}%</span>
                  <span className={cn('si-body font-semibold', getScoreColor(item.score))}>{item.score}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', getBarColor(item.score))} style={{ width: `${item.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
