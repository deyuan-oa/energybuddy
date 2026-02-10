import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ClipboardList,
  Clock,
  ExternalLink,
  Info,
  Layers,
  MessageSquare,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useChatContext } from '@/contexts/ChatContext';
import type { Anomaly, ZoneId, zones as zonesData } from '@/data/mockEnergyData';
import { zones } from '@/data/mockEnergyData';

interface AnomalyDrawerProps {
  anomaly: Anomaly | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── Mock 24h trend data for the zone ── */
function generateZoneTrend(zone: ZoneId, anomalyHour: number) {
  const zoneInfo = zones.find(z => z.id === zone)!;
  const basePerHour = zoneInfo.baselineKwh / 24;
  const targetPerHour = zoneInfo.targetKwh / 24;
  const points = [];

  for (let h = 0; h < 24; h++) {
    let loadFactor = 0.3;
    if (h >= 6 && h < 8) loadFactor = 0.65;
    else if (h >= 8 && h < 17) loadFactor = 0.9;
    else if (h >= 17 && h < 20) loadFactor = 0.55;
    else if (h >= 20) loadFactor = 0.35;

    let actual = basePerHour * loadFactor * (0.95 + Math.random() * 0.1);
    // Inject the anomaly spike
    if (h === anomalyHour) actual *= 1.35;
    if (h === anomalyHour + 1) actual *= 1.15;

    points.push({
      hour: `${h.toString().padStart(2, '0')}:00`,
      actual: Math.round(actual),
      baseline: Math.round(basePerHour * loadFactor),
      target: Math.round(targetPerHour * loadFactor),
    });
  }
  return points;
}

/* ── Contributing signals for the anomaly ── */
interface Signal {
  label: string;
  value: string;
  status: 'normal' | 'warning' | 'critical';
  description: string;
}

function getContributingSignals(anomaly: Anomaly): Signal[] {
  const base: Signal[] = [];

  if (anomaly.zone === 'compressed_air') {
    base.push(
      { label: 'System Pressure', value: '7.8 bar', status: 'warning', description: 'Above optimal 6.5 bar setpoint — possible leak compensation' },
      { label: 'Compressor Runtime', value: '98%', status: 'critical', description: 'Near-continuous operation — no cycling detected' },
      { label: 'Flow Rate', value: '12.4 m³/min', status: 'warning', description: 'Higher than baseload; demand exceeds design' },
      { label: 'Ambient Temperature', value: '24°C', status: 'normal', description: 'Within normal operating range' },
    );
  } else if (anomaly.zone === 'hvac') {
    base.push(
      { label: 'Supply Air Temp', value: '16°C', status: 'warning', description: 'Lower than setpoint — overcooling detected' },
      { label: 'Outdoor Temp', value: '8°C', status: 'normal', description: 'Mild conditions — free cooling opportunity missed' },
      { label: 'AHU-3 Runtime', value: '100%', status: 'critical', description: 'Running overnight — schedule override active' },
      { label: 'Damper Position', value: '15%', status: 'warning', description: 'Nearly closed — stuck damper suspected' },
    );
  } else {
    base.push(
      { label: 'Power Draw', value: `${(842 * (1 + anomaly.magnitude / 100)).toFixed(0)} kW`, status: 'critical', description: 'Exceeding demand limit' },
      { label: 'Load Factor', value: '94%', status: 'warning', description: 'Operating near capacity during changeover' },
      { label: 'Shift Schedule', value: 'Changeover', status: 'warning', description: 'Overlap between shifts causing concurrent demand' },
      { label: 'Equipment Temp', value: '72°C', status: 'normal', description: 'Within operating limits' },
    );
  }

  return base;
}

const statusColors: Record<Signal['status'], string> = {
  normal: 'text-rag-green bg-rag-green/10',
  warning: 'text-rag-amber bg-rag-amber/10',
  critical: 'text-rag-red bg-rag-red/10',
};

const statusDot: Record<Signal['status'], string> = {
  normal: 'bg-rag-green',
  warning: 'bg-rag-amber',
  critical: 'bg-rag-red',
};

export function AnomalyDrawer({ anomaly, open, onOpenChange }: AnomalyDrawerProps) {
  const { askAboutKpi } = useChatContext();
  const navigate = useNavigate();

  const trendData = useMemo(() => {
    if (!anomaly) return [];
    const hour = anomaly.timestamp.getHours();
    return generateZoneTrend(anomaly.zone, hour);
  }, [anomaly]);

  const signals = useMemo(() => {
    if (!anomaly) return [];
    return getContributingSignals(anomaly);
  }, [anomaly]);

  if (!anomaly) return null;

  const zoneInfo = zones.find(z => z.id === anomaly.zone);
  const anomalyContext = `Anomaly: ${anomaly.id}\nZone: ${anomaly.zone}\nType: ${anomaly.type}\nSeverity: ${anomaly.severity}\nMagnitude: +${anomaly.magnitude}% above baseline\nTime: ${anomaly.timestamp.toLocaleString()}\nDescription: ${anomaly.description}\nSignals: ${signals.map(s => `${s.label}: ${s.value} (${s.status})`).join(', ')}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-0 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'size-2.5 rounded-full',
                anomaly.severity === 'red' ? 'bg-rag-red' : 'bg-rag-amber',
              )}
            />
            <SheetTitle className="si-h4 text-foreground">
              {anomaly.id} — {anomaly.type.replace('_', ' ')}
            </SheetTitle>
          </div>
          <SheetDescription className="si-body text-muted-foreground">
            {zoneInfo?.name} • {anomaly.timestamp.toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-5 pb-5 space-y-5 pt-4">
            {/* Severity & Magnitude badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  'capitalize',
                  anomaly.severity === 'red'
                    ? 'bg-rag-red/15 text-rag-red border-rag-red/30'
                    : 'bg-rag-amber/15 text-rag-amber border-rag-amber/30',
                )}
              >
                <AlertTriangle className="size-3 mr-1" />
                {anomaly.severity}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="size-3" />
                +{anomaly.magnitude}% above baseline
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Layers className="size-3" />
                {anomaly.type.replace('_', ' ')}
              </Badge>
            </div>

            {/* Description */}
            <p className="si-body text-foreground leading-relaxed">{anomaly.description}</p>

            <Separator />

            {/* ── Trend Chart ── */}
            <div>
              <h3 className="si-label text-muted-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="size-3.5" /> ZONE TREND — 24H
              </h3>
              <Card className="elevation-1">
                <CardContent className="p-3">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(190, 100%, 45%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(190, 100%, 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 87%)" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10 }}
                        stroke="hsl(210, 10%, 50%)"
                        interval={3}
                      />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(210, 10%, 50%)" />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(210, 18%, 87%)',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      />
                      <ReferenceLine
                        x={`${anomaly.timestamp.getHours().toString().padStart(2, '0')}:00`}
                        stroke="hsl(0, 72%, 51%)"
                        strokeDasharray="4 4"
                        label={{ value: 'Anomaly', fontSize: 10, fill: 'hsl(0, 72%, 51%)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        stroke="hsl(190, 100%, 45%)"
                        fill="url(#anomalyGrad)"
                        name="Actual"
                      />
                      <Area
                        type="monotone"
                        dataKey="baseline"
                        stroke="hsl(210, 10%, 65%)"
                        strokeDasharray="5 5"
                        fill="none"
                        name="Baseline"
                      />
                      <Area
                        type="monotone"
                        dataKey="target"
                        stroke="hsl(142, 71%, 45%)"
                        strokeDasharray="3 3"
                        fill="none"
                        name="Target"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* ── Contributing Signals ── */}
            <div>
              <h3 className="si-label text-muted-foreground mb-3 flex items-center gap-2">
                <Zap className="size-3.5" /> CONTRIBUTING SIGNALS
              </h3>
              <div className="space-y-2">
                {signals.map((signal, i) => (
                  <Card key={i} className="elevation-1">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <span className={cn('size-2 rounded-full shrink-0', statusDot[signal.status])} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="si-body font-medium text-foreground">{signal.label}</span>
                            <Badge
                              variant="outline"
                              className={cn('text-xs font-mono', statusColors[signal.status])}
                            >
                              {signal.value}
                            </Badge>
                          </div>
                          <p className="si-caption text-muted-foreground mt-0.5">{signal.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* ── Evidence / Context ── */}
            <div>
              <h3 className="si-label text-muted-foreground mb-3 flex items-center gap-2">
                <Info className="size-3.5" /> CONTEXT
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Clock className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="si-body text-foreground">
                      Detected at {anomaly.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="si-caption text-muted-foreground">
                      Duration: ~{anomaly.magnitude > 20 ? '45' : '15'} minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Layers className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="si-body text-foreground">Zone: {zoneInfo?.name}</p>
                    <p className="si-caption text-muted-foreground">SEU: {zoneInfo?.seuType}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* ── Footer Actions ── */}
        <div className="border-t border-border px-5 py-4 space-y-2 shrink-0">
          <Button
            className="w-full gap-2"
            onClick={() => {
              onOpenChange(false);
              navigate('/actions');
            }}
          >
            <ClipboardList className="size-4" />
            Create Corrective Action
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() => {
                onOpenChange(false);
                askAboutKpi(
                  anomaly.zone,
                  'Investigate this anomaly, explain the root cause, and suggest corrective actions',
                  anomalyContext,
                );
              }}
            >
              <MessageSquare className="size-4" />
              Ask Coach
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() => {
                onOpenChange(false);
                navigate('/reports');
              }}
            >
              <ExternalLink className="size-4" />
              Add to Report
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
