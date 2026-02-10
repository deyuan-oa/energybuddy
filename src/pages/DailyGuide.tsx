import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChatContext } from '@/contexts/ChatContext';
import {
  Sun, Activity, Cloud, ClipboardCheck, AlertTriangle,
  Clock, FileText, Check, ChevronRight, ChevronDown,
  MessageSquare, Trophy, Zap, Lock,
} from 'lucide-react';
import { generateKpis, generateAnomalies, generateDataQuality, zones } from '@/data/mockEnergyData';

interface StepData {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  estimatedTime: string;
  xp: number;
}

const steps: StepData[] = [
  { id: 1, title: 'Morning Energy Review', subtitle: 'Overnight consumption summary & anomaly highlights', icon: Sun, estimatedTime: '5 min', xp: 10 },
  { id: 2, title: 'KPI Health Check', subtitle: 'Review all KPIs, acknowledge amber/red items', icon: Activity, estimatedTime: '8 min', xp: 15 },
  { id: 3, title: 'Weather & Forecast', subtitle: "Today's weather impact & schedule adjustment suggestions", icon: Cloud, estimatedTime: '3 min', xp: 5 },
  { id: 4, title: 'SEU Inspection Tasks', subtitle: 'Specific checklists per Significant Energy Use', icon: ClipboardCheck, estimatedTime: '15 min', xp: 20 },
  { id: 5, title: 'Action Items', subtitle: 'Corrective/improvement tasks with evidence links', icon: AlertTriangle, estimatedTime: '10 min', xp: 15 },
  { id: 6, title: 'Midday Check-in', subtitle: 'Pulse check on KPI trends since morning', icon: Clock, estimatedTime: '5 min', xp: 10 },
  { id: 7, title: 'End-of-Day Log', subtitle: 'Record observations, mark completed actions, flag issues', icon: FileText, estimatedTime: '10 min', xp: 25 },
];

function StepContent({ step, onAskCoach }: { step: StepData; onAskCoach: (msg: string, ctx: string) => void }) {
  const kpis = useMemo(() => generateKpis(), []);
  const anomalies = useMemo(() => generateAnomalies(), []);
  const dataQuality = useMemo(() => generateDataQuality(), []);

  switch (step.id) {
    case 1: return <MorningReviewContent anomalies={anomalies} onAskCoach={onAskCoach} />;
    case 2: return <KpiHealthContent kpis={kpis} onAskCoach={onAskCoach} />;
    case 3: return <WeatherContent onAskCoach={onAskCoach} />;
    case 4: return <SeuInspectionContent onAskCoach={onAskCoach} />;
    case 5: return <ActionItemsContent anomalies={anomalies} onAskCoach={onAskCoach} />;
    case 6: return <MiddayCheckinContent kpis={kpis} onAskCoach={onAskCoach} />;
    case 7: return <EndOfDayContent onAskCoach={onAskCoach} />;
    default: return null;
  }
}

function MorningReviewContent({ anomalies, onAskCoach }: { anomalies: any[]; onAskCoach: (m: string, c: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded bg-secondary/50 p-4">
        <p className="si-body font-semibold text-foreground mb-2">Overnight Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div><span className="si-caption text-muted-foreground block">Total Overnight</span><span className="si-h4 text-foreground">3,240 kWh</span></div>
          <div><span className="si-caption text-muted-foreground block">vs Baseline</span><span className="si-h4 text-rag-amber">+8.2%</span></div>
          <div><span className="si-caption text-muted-foreground block">Anomalies</span><span className="si-h4 text-rag-red">{anomalies.length} detected</span></div>
        </div>
      </div>
      {anomalies.length > 0 && (
        <div className="space-y-2">
          <p className="si-body font-semibold text-foreground">Anomalies to Review</p>
          {anomalies.map(a => (
            <div key={a.id} className="rounded border border-rag-amber/30 bg-rag-amber/5 px-3 py-2 si-body text-foreground">
              <span className="font-medium capitalize">{a.zone.replace('_', ' ')}</span> — {a.description}
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" size="sm" className="gap-2" onClick={() => onAskCoach('Summarize the overnight energy consumption and highlight key anomalies', 'Step: Morning Energy Review. Overnight consumption: 3,240 kWh, +8.2% vs baseline. ' + anomalies.length + ' anomalies detected.')}>
        <MessageSquare className="size-4" /> Ask Coach to Summarize
      </Button>
    </div>
  );
}

function KpiHealthContent({ kpis, onAskCoach }: { kpis: any[]; onAskCoach: (m: string, c: string) => void }) {
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const alertKpis = kpis.filter(k => k.rag !== 'green');

  return (
    <div className="space-y-4">
      <p className="si-body text-muted-foreground">Review and acknowledge all amber/red KPIs below.</p>
      <div className="space-y-2">
        {alertKpis.map(kpi => (
          <div key={kpi.id} className={cn('flex items-center justify-between rounded border px-3 py-2', kpi.rag === 'red' ? 'border-rag-red/30 bg-rag-red/5' : 'border-rag-amber/30 bg-rag-amber/5')}>
            <div>
              <span className="si-body font-medium text-foreground">{kpi.name}</span>
              <span className="si-caption text-muted-foreground ml-2">{kpi.value} {kpi.unit} (target: {kpi.target})</span>
            </div>
            <Button
              variant={acknowledged.includes(kpi.id) ? 'default' : 'outline'}
              size="sm" className="h-7 si-caption"
              onClick={() => setAcknowledged(prev => prev.includes(kpi.id) ? prev : [...prev, kpi.id])}
            >
              {acknowledged.includes(kpi.id) ? <><Check className="size-3 mr-1" /> Acknowledged</> : 'Acknowledge'}
            </Button>
          </div>
        ))}
      </div>
      <p className="si-caption text-muted-foreground">{acknowledged.length}/{alertKpis.length} acknowledged</p>
    </div>
  );
}

function WeatherContent({ onAskCoach }: { onAskCoach: (m: string, c: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded bg-secondary/50 p-3"><span className="si-caption text-muted-foreground block">Today</span><span className="si-body font-medium">22°C, Sunny</span></div>
        <div className="rounded bg-secondary/50 p-3"><span className="si-caption text-muted-foreground block">Tomorrow</span><span className="si-body font-medium">28°C, Clear</span></div>
        <div className="rounded bg-secondary/50 p-3"><span className="si-caption text-muted-foreground block">Wed</span><span className="si-body font-medium">31°C, Hot</span></div>
        <div className="rounded bg-secondary/50 p-3"><span className="si-caption text-muted-foreground block">Impact</span><span className="si-body font-medium text-rag-amber">HVAC +12%</span></div>
      </div>
      <div className="rounded border border-primary/30 bg-accent px-3 py-2">
        <p className="si-body text-foreground">⚡ <strong>Coach Suggestion:</strong> Temperature rising Wed — consider pre-cooling overnight (off-peak tariff €0.08/kWh) to reduce peak HVAC load.</p>
      </div>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => onAskCoach('What schedule adjustments should I make based on the weather forecast?', 'Weather: Today 22°C sunny, tomorrow 28°C, Wed 31°C hot. Expected HVAC impact +12%.')}>
        <MessageSquare className="size-4" /> Ask Coach for Schedule Advice
      </Button>
    </div>
  );
}

function SeuInspectionContent({ onAskCoach }: { onAskCoach: (m: string, c: string) => void }) {
  const [checked, setChecked] = useState<string[]>([]);
  const seuChecks = [
    { id: 'hvac-1', zone: 'HVAC', task: 'Check AHU supply air temperature setpoints' },
    { id: 'hvac-2', zone: 'HVAC', task: 'Inspect damper positions on AHU-1 and AHU-2' },
    { id: 'ca-1', zone: 'Compressed Air', task: 'Walk compressor room — listen for leaks' },
    { id: 'ca-2', zone: 'Compressed Air', task: 'Check system pressure (target: 6.5 bar)' },
    { id: 'ca-3', zone: 'Compressed Air', task: 'Verify condensate drains are operational' },
    { id: 'ref-1', zone: 'Refrigeration', task: 'Check cold store door seals and strip curtains' },
    { id: 'ref-2', zone: 'Refrigeration', task: 'Log compressor suction/discharge pressures' },
    { id: 'prod-1', zone: 'Production', task: 'Verify idle equipment is powered down between shifts' },
  ];

  return (
    <div className="space-y-4">
      <p className="si-body text-muted-foreground">Complete the SEU inspection checklist. Check items as you go.</p>
      <div className="space-y-2">
        {seuChecks.map(item => (
          <label key={item.id} className={cn('flex items-center gap-3 rounded border px-3 py-2 cursor-pointer transition-colors', checked.includes(item.id) ? 'border-rag-green/30 bg-rag-green/5' : 'border-border hover:bg-secondary/30')}>
            <input
              type="checkbox"
              checked={checked.includes(item.id)}
              onChange={() => setChecked(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id])}
              className="size-4 rounded border-input accent-primary"
            />
            <div className="flex-1">
              <span className="si-body text-foreground">{item.task}</span>
              <span className="si-caption text-muted-foreground ml-2">({item.zone})</span>
            </div>
            {checked.includes(item.id) && <Check className="size-4 text-rag-green" />}
          </label>
        ))}
      </div>
      <p className="si-caption text-muted-foreground">{checked.length}/{seuChecks.length} completed</p>
    </div>
  );
}

function ActionItemsContent({ anomalies, onAskCoach }: { anomalies: any[]; onAskCoach: (m: string, c: string) => void }) {
  return (
    <div className="space-y-4">
      <p className="si-body text-muted-foreground">Review AI-suggested actions based on today's anomalies and KPI status.</p>
      <div className="space-y-2">
        <div className="rounded border border-rag-red/30 bg-rag-red/5 px-3 py-2">
          <p className="si-body font-medium text-foreground">CA-015: Investigate compressed air spike</p>
          <p className="si-caption text-muted-foreground">Priority: High • Due: Today • Owner: Unassigned</p>
        </div>
        <div className="rounded border border-rag-amber/30 bg-rag-amber/5 px-3 py-2">
          <p className="si-body font-medium text-foreground">CA-016: Check HVAC nighttime baseload</p>
          <p className="si-caption text-muted-foreground">Priority: Medium • Due: Tomorrow • Owner: Unassigned</p>
        </div>
        <div className="rounded border border-rag-amber/30 bg-rag-amber/5 px-3 py-2">
          <p className="si-body font-medium text-foreground">CA-017: Review peak demand shift changeover procedure</p>
          <p className="si-caption text-muted-foreground">Priority: Medium • Due: This week • Owner: Unassigned</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => onAskCoach('Was there an overtime shift or unusual production schedule today that might explain the anomalies?', 'Step: Action Items. Open actions: CA-015 (compressed air spike, High), CA-016 (HVAC baseload, Medium), CA-017 (peak demand, Medium).')}>
        <MessageSquare className="size-4" /> Ask Coach About Root Causes
      </Button>
    </div>
  );
}

function MiddayCheckinContent({ kpis, onAskCoach }: { kpis: any[]; onAskCoach: (m: string, c: string) => void }) {
  return (
    <div className="space-y-4">
      <p className="si-body text-muted-foreground">Quick pulse check on how KPIs have trended since this morning.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {kpis.slice(0, 4).map(kpi => (
          <div key={kpi.id} className="rounded bg-secondary/50 p-3">
            <span className="si-caption text-muted-foreground block">{kpi.name}</span>
            <span className={cn('si-h4', kpi.rag === 'green' ? 'text-rag-green' : kpi.rag === 'amber' ? 'text-rag-amber' : 'text-rag-red')}>{kpi.value} {kpi.unit}</span>
            <span className="si-caption text-muted-foreground block">Target: {kpi.target}</span>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => onAskCoach('How are KPIs trending since this morning? Any new concerns?', 'Step: Midday Check-in. KPI snapshot: ' + kpis.slice(0, 4).map(k => `${k.name}: ${k.value} ${k.unit} (${k.rag})`).join(', '))}>
        <MessageSquare className="size-4" /> Ask Coach for Midday Summary
      </Button>
    </div>
  );
}

function EndOfDayContent({ onAskCoach }: { onAskCoach: (m: string, c: string) => void }) {
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <p className="si-body text-muted-foreground">Record your end-of-day observations and flag any issues for tomorrow.</p>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Enter observations, completed actions, issues for tomorrow..."
        className="w-full rounded border border-input bg-background px-3 py-2 si-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        rows={4}
      />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => onAskCoach('Draft an end-of-day summary report based on today\'s energy performance', 'Step: End-of-Day Log. User notes: ' + (notes || '(none entered)'))}>
          <MessageSquare className="size-4" /> Ask Coach to Draft Summary
        </Button>
        <Button size="sm" className="gap-2">
          <FileText className="size-4" /> Save Log
        </Button>
      </div>
    </div>
  );
}

const DailyGuide = () => {
  const { askAboutKpi } = useChatContext();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [expandedStep, setExpandedStep] = useState<number>(1);

  const progress = Math.round((completedSteps.length / steps.length) * 100);
  const totalXp = completedSteps.reduce((sum, id) => sum + (steps.find(s => s.id === id)?.xp ?? 0), 0);
  const maxXp = steps.reduce((sum, s) => sum + s.xp, 0);

  const handleComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
      // Auto-expand next step
      const nextStep = steps.find(s => s.id > stepId && !completedSteps.includes(s.id));
      if (nextStep) setExpandedStep(nextStep.id);
    }
  };

  const handleAskCoach = (msg: string, ctx: string) => {
    askAboutKpi('Daily Guide', msg, ctx);
  };

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* Header with progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="si-h2 text-foreground">Daily Energy Guide</h2>
            <p className="si-body text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1 si-body">
              <Trophy className="size-3.5 text-rag-amber" /> {totalXp}/{maxXp} XP
            </Badge>
            <Badge variant={progress === 100 ? 'default' : 'secondary'} className="si-body">
              {completedSteps.length}/{steps.length} Steps
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', progress === 100 ? 'bg-rag-green' : 'bg-primary')}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between si-caption text-muted-foreground">
            <span>{progress}% complete</span>
            <span>~{steps.filter(s => !completedSteps.includes(s.id)).reduce((sum, s) => sum + parseInt(s.estimatedTime), 0)} min remaining</span>
          </div>
        </div>
      </div>

      {/* Completion banner */}
      {progress === 100 && (
        <Card className="border-rag-green/30 bg-rag-green/5 elevation-1">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="size-12 rounded-full bg-rag-green/20 flex items-center justify-center">
              <Trophy className="size-6 text-rag-green" />
            </div>
            <div>
              <p className="si-h4 text-rag-green">Daily Guide Complete! 🎉</p>
              <p className="si-body text-muted-foreground">You earned {totalXp} XP today. Great energy management!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isExpanded = expandedStep === step.id;
          const isLocked = index > 0 && !completedSteps.includes(steps[index - 1].id) && !isCompleted;
          const Icon = step.icon;

          return (
            <Card
              key={step.id}
              className={cn(
                'elevation-1 transition-all',
                isCompleted && 'border-rag-green/30 bg-rag-green/5',
                isLocked && 'opacity-60'
              )}
            >
              {/* Step header */}
              <button
                className="flex w-full items-center gap-4 p-4 text-left"
                onClick={() => !isLocked && setExpandedStep(isExpanded ? -1 : step.id)}
                disabled={isLocked}
              >
                <div className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full',
                  isCompleted ? 'bg-rag-green text-primary-foreground' : isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                )}>
                  {isCompleted ? <Check className="size-5" /> : isLocked ? <Lock className="size-4" /> : <Icon className="size-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('si-body font-semibold', isCompleted ? 'text-rag-green' : 'text-foreground')}>
                      Step {step.id}: {step.title}
                    </span>
                    {isCompleted && <Badge className="bg-rag-green/10 text-rag-green border-rag-green/30 si-caption">+{step.xp} XP</Badge>}
                  </div>
                  <p className="si-caption text-muted-foreground">{step.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="si-caption text-muted-foreground hidden sm:inline">{step.estimatedTime}</span>
                  {!isLocked && (isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />)}
                </div>
              </button>

              {/* Step content */}
              {isExpanded && !isLocked && (
                <CardContent className="pt-0 pb-4 px-4 border-t border-border">
                  <div className="pl-14 space-y-4">
                    <StepContent step={step} onAskCoach={handleAskCoach} />
                    {!isCompleted && (
                      <Button onClick={() => handleComplete(step.id)} className="gap-2">
                        <Check className="size-4" /> Mark Step Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DailyGuide;
