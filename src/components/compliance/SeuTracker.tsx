import { useState } from 'react';
import { zones } from '@/data/mockEnergyData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Thermometer,
  Zap,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SeuEntry {
  id: string;
  zone: string;
  seuType: string;
  baselineKwh: number;
  currentKwh: number;
  targetKwh: number;
  shareOfTotal: number;
  monitored: boolean;
  controlPlan: boolean;
  lastAssessment: string;
  drivers: string[];
  risks: string[];
  rag: 'green' | 'amber' | 'red';
}

const totalBaseline = zones.reduce((s, z) => s + z.baselineKwh, 0);

const seuData: SeuEntry[] = zones.map(z => {
  const share = Math.round((z.baselineKwh / totalBaseline) * 100);
  const rag = z.currentKwh <= z.targetKwh ? 'green' : z.currentKwh <= z.baselineKwh ? 'amber' : 'red';
  return {
    id: z.id,
    zone: z.name,
    seuType: z.seuType,
    baselineKwh: z.baselineKwh,
    currentKwh: z.currentKwh,
    targetKwh: z.targetKwh,
    shareOfTotal: share,
    monitored: true,
    controlPlan: z.id !== 'lighting',
    lastAssessment: z.id === 'compressed_air' ? '2025-11-20' : '2026-01-15',
    drivers: getDrivers(z.id),
    risks: getRisks(z.id),
    rag,
  };
});

function getDrivers(id: string): string[] {
  const map: Record<string, string[]> = {
    hvac: ['Outdoor temperature', 'Occupancy schedule', 'Setpoint configuration'],
    production: ['Production volume', 'Machine utilization', 'Product mix'],
    lighting: ['Occupancy', 'Daylight availability', 'Schedule overrides'],
    compressed_air: ['Production demand', 'Leak rate', 'System pressure'],
    refrigeration: ['Product load', 'Ambient temperature', 'Door opening frequency'],
  };
  return map[id] || [];
}

function getRisks(id: string): string[] {
  const map: Record<string, string[]> = {
    hvac: ['Sensor drift causing overcooling', 'Schedule overrides not restored'],
    production: ['Simultaneous line starts causing peak demand', 'Idle running during breaks'],
    lighting: ['Manual override left on 24/7', 'Daylight sensors disabled'],
    compressed_air: ['Undetected leaks degrading system', 'Pressure setpoint creep'],
    refrigeration: ['Condenser fouling', 'Door seals deterioration'],
  };
  return map[id] || [];
}

const ragColors = {
  green: 'bg-rag-green/15 text-rag-green border-rag-green/30',
  amber: 'bg-rag-amber/15 text-rag-amber border-rag-amber/30',
  red: 'bg-rag-red/15 text-rag-red border-rag-red/30',
};

const iconMap: Record<string, React.ElementType> = {
  hvac: Thermometer,
  production: Activity,
  lighting: Zap,
  compressed_air: Zap,
  refrigeration: Thermometer,
};

function SeuRow({ seu }: { seu: SeuEntry }) {
  const [open, setOpen] = useState(false);
  const Icon = iconMap[seu.id] || Zap;
  const delta = ((seu.currentKwh - seu.baselineKwh) / seu.baselineKwh * 100).toFixed(1);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg">
          <Icon className="size-5 mt-0.5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="si-body-lg font-medium text-foreground">{seu.zone}</span>
              <Badge variant="outline" className="si-caption">{seu.seuType}</Badge>
              <Badge variant="outline" className={ragColors[seu.rag]}>
                {seu.rag === 'green' ? 'On Target' : seu.rag === 'amber' ? 'At Risk' : 'Exceeding'}
              </Badge>
              {!seu.controlPlan && (
                <Badge variant="outline" className="bg-rag-amber/15 text-rag-amber border-rag-amber/30 gap-1">
                  <AlertTriangle className="size-3" /> No Control Plan
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 si-caption text-muted-foreground flex-wrap">
              <span>{seu.shareOfTotal}% of total consumption</span>
              <span>{Number(delta) > 0 ? '+' : ''}{delta}% vs baseline</span>
              <span>Current: {seu.currentKwh.toLocaleString()} kWh/day</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 hidden sm:block">
              <Progress
                value={Math.min(100, Math.max(0, ((seu.baselineKwh - seu.currentKwh) / (seu.baselineKwh - seu.targetKwh)) * 100))}
                className="h-2"
              />
            </div>
            {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border mx-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="si-label text-muted-foreground mb-1">Energy Drivers</p>
            <ul className="space-y-1">
              {seu.drivers.map(d => (
                <li key={d} className="si-body text-foreground flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="si-label text-muted-foreground mb-1">Known Risks</p>
            <ul className="space-y-1">
              {seu.risks.map(r => (
                <li key={r} className="si-body text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="size-3 text-rag-amber shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="si-label text-muted-foreground mb-1">Controls</p>
            <div className="space-y-1.5 si-body">
              <div className="flex items-center gap-1.5">
                {seu.monitored ? <CheckCircle2 className="size-3 text-rag-green" /> : <AlertTriangle className="size-3 text-rag-red" />}
                <span className="text-foreground">Monitoring: {seu.monitored ? 'Active' : 'Not active'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {seu.controlPlan ? <CheckCircle2 className="size-3 text-rag-green" /> : <AlertTriangle className="size-3 text-rag-amber" />}
                <span className="text-foreground">Control plan: {seu.controlPlan ? 'Documented' : 'Missing'}</span>
              </div>
              <p className="text-muted-foreground si-caption">Last assessment: {seu.lastAssessment}</p>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SeuTracker() {
  const monitored = seuData.filter(s => s.monitored).length;
  const withPlan = seuData.filter(s => s.controlPlan).length;

  return (
    <Card className="elevation-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="si-h4 flex items-center gap-2">
            <Activity className="size-4" />
            Significant Energy Uses (SEUs)
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{monitored}/{seuData.length} monitored</Badge>
            <Badge variant="outline">{withPlan}/{seuData.length} control plans</Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="si-caption">ISO 50001 §6.3 — SEUs are determined from the energy review. Each SEU must have identified relevant variables, current performance, and person(s) working on behalf of the organization.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {seuData.map(seu => (
          <SeuRow key={seu.id} seu={seu} />
        ))}
      </CardContent>
    </Card>
  );
}
