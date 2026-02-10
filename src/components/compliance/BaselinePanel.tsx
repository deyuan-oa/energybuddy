import { zones } from '@/data/mockEnergyData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingDown, TrendingUp, Minus, Calendar, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BaselineEntry {
  zone: string;
  seuType: string;
  baselineKwh: number;
  targetKwh: number;
  currentKwh: number;
  baselineYear: string;
  lastReview: string;
}

const baselineData: BaselineEntry[] = zones.map(z => ({
  zone: z.name,
  seuType: z.seuType,
  baselineKwh: z.baselineKwh,
  targetKwh: z.targetKwh,
  currentKwh: z.currentKwh,
  baselineYear: '2025',
  lastReview: '2026-01-15',
}));

function getRag(current: number, target: number, baseline: number) {
  if (current <= target) return 'green';
  if (current <= baseline) return 'amber';
  return 'red';
}

const ragColors = {
  green: 'bg-rag-green/15 text-rag-green border-rag-green/30',
  amber: 'bg-rag-amber/15 text-rag-amber border-rag-amber/30',
  red: 'bg-rag-red/15 text-rag-red border-rag-red/30',
};

export function BaselinePanel() {
  const totalBaseline = baselineData.reduce((s, d) => s + d.baselineKwh, 0);
  const totalTarget = baselineData.reduce((s, d) => s + d.targetKwh, 0);
  const totalCurrent = baselineData.reduce((s, d) => s + d.currentKwh, 0);
  const overallDelta = ((totalCurrent - totalBaseline) / totalBaseline * 100).toFixed(1);
  const overallRag = getRag(totalCurrent, totalTarget, totalBaseline);

  return (
    <Card className="elevation-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="si-h4 flex items-center gap-2">
            <Calendar className="size-4" />
            Energy Baseline &amp; Target Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={ragColors[overallRag]}>
              {Number(overallDelta) > 0 ? '+' : ''}{overallDelta}% vs baseline
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="si-caption">ISO 50001 §6.5 — Energy baselines must be established using initial energy review data. Baselines are adjusted when significant changes occur.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone / SEU</TableHead>
              <TableHead className="text-right">Baseline (kWh/day)</TableHead>
              <TableHead className="text-right">Target (kWh/day)</TableHead>
              <TableHead className="text-right">Current (kWh/day)</TableHead>
              <TableHead className="text-right">Δ Baseline</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {baselineData.map(row => {
              const delta = ((row.currentKwh - row.baselineKwh) / row.baselineKwh * 100).toFixed(1);
              const rag = getRag(row.currentKwh, row.targetKwh, row.baselineKwh);
              // Progress: 100% = target achieved, 0% = at baseline, can exceed
              const range = row.baselineKwh - row.targetKwh;
              const achieved = row.baselineKwh - row.currentKwh;
              const pct = range > 0 ? Math.min(100, Math.max(0, (achieved / range) * 100)) : 0;

              return (
                <TableRow key={row.zone}>
                  <TableCell>
                    <p className="font-medium text-foreground">{row.zone}</p>
                    <p className="si-caption text-muted-foreground">{row.seuType}</p>
                  </TableCell>
                  <TableCell className="text-right font-mono">{row.baselineKwh.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{row.targetKwh.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{row.currentKwh.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      {Number(delta) < 0 ? (
                        <TrendingDown className="size-3 text-rag-green" />
                      ) : Number(delta) > 0 ? (
                        <TrendingUp className="size-3 text-rag-red" />
                      ) : (
                        <Minus className="size-3 text-muted-foreground" />
                      )}
                      <span className="font-mono">{Number(delta) > 0 ? '+' : ''}{delta}%</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <Progress value={pct} className="h-2" />
                      <p className="si-caption text-muted-foreground mt-0.5 text-center">{pct.toFixed(0)}% to target</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ragColors[rag]}>
                      {rag === 'green' ? 'On Target' : rag === 'amber' ? 'At Risk' : 'Exceeding'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Totals */}
            <TableRow className="font-semibold border-t-2">
              <TableCell>Total</TableCell>
              <TableCell className="text-right font-mono">{totalBaseline.toLocaleString()}</TableCell>
              <TableCell className="text-right font-mono">{totalTarget.toLocaleString()}</TableCell>
              <TableCell className="text-right font-mono">{totalCurrent.toLocaleString()}</TableCell>
              <TableCell className="text-right font-mono">{Number(overallDelta) > 0 ? '+' : ''}{overallDelta}%</TableCell>
              <TableCell />
              <TableCell>
                <Badge variant="outline" className={ragColors[overallRag]}>
                  {overallRag === 'green' ? 'On Target' : overallRag === 'amber' ? 'At Risk' : 'Exceeding'}
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p className="si-caption text-muted-foreground mt-3">
          Baseline year: 2025 • Last baseline review: 15 Jan 2026 • Adjustment criteria: ±5% production variance or equipment change
        </p>
      </CardContent>
    </Card>
  );
}
