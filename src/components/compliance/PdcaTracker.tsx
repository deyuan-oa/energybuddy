import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Info,
  Loader2,
  RefreshCw,
  Target,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PhaseStatus = 'complete' | 'in_progress' | 'not_started';

interface PdcaItem {
  id: string;
  title: string;
  phase: 'plan' | 'do' | 'check' | 'act';
  status: PhaseStatus;
  description: string;
  owner: string;
  due_date: string;
  evidence: string[];
  notes: string;
}

const phaseConfig = {
  plan: { label: 'Plan', color: 'bg-primary/15 text-primary border-primary/30', icon: Target },
  do: { label: 'Do', color: 'bg-rag-cyan/15 text-accent-foreground border-primary/20', icon: RefreshCw },
  check: { label: 'Check', color: 'bg-rag-amber/15 text-rag-amber border-rag-amber/30', icon: Clock },
  act: { label: 'Act', color: 'bg-rag-green/15 text-rag-green border-rag-green/30', icon: CheckCircle2 },
};

const statusConfig: Record<PhaseStatus, { label: string; icon: React.ElementType; color: string }> = {
  complete: { label: 'Complete', icon: CheckCircle2, color: 'text-rag-green' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-rag-amber' },
  not_started: { label: 'Not Started', icon: Circle, color: 'text-muted-foreground' },
};

function PdcaItemRow({ item, onStatusChange }: { item: PdcaItem; onStatusChange: (id: string, status: PhaseStatus) => void }) {
  const [open, setOpen] = useState(false);
  const status = statusConfig[item.status];
  const StatusIcon = status.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg">
          <StatusIcon className={`size-4 mt-0.5 shrink-0 ${status.color}`} />
          <div className="flex-1 min-w-0">
            <p className="si-body font-medium text-foreground">{item.id}. {item.title}</p>
            <div className="flex items-center gap-3 mt-0.5 si-caption text-muted-foreground flex-wrap">
              <span>{item.owner}</span>
              <span>Due: {item.due_date}</span>
              {item.evidence.length > 0 && <span>{item.evidence.length} evidence item(s)</span>}
            </div>
          </div>
          <Badge variant="outline" className={`${status.color === 'text-rag-green' ? 'bg-rag-green/15 border-rag-green/30' : status.color === 'text-rag-amber' ? 'bg-rag-amber/15 border-rag-amber/30' : 'bg-muted border-border'} text-xs`}>
            {status.label}
          </Badge>
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border mx-3 pb-3 pt-2 space-y-2">
          <p className="si-body text-muted-foreground">{item.description}</p>
          <div className="flex items-center gap-2">
            <span className="si-label text-muted-foreground">Status:</span>
            <Select value={item.status} onValueChange={(v) => onStatusChange(item.id, v as PhaseStatus)}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {item.evidence.length > 0 && (
            <div>
              <p className="si-label text-muted-foreground">Evidence</p>
              <ul className="mt-0.5 space-y-0.5">
                {item.evidence.map(e => (
                  <li key={e} className="si-caption text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-rag-green shrink-0" /> {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.notes && (
            <div>
              <p className="si-label text-muted-foreground">Notes</p>
              <p className="si-caption text-foreground mt-0.5">{item.notes}</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PdcaTracker() {
  const [items, setItems] = useState<PdcaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const phases = ['plan', 'do', 'check', 'act'] as const;

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('pdca_items')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Failed to load PDCA items:', error);
      toast.error('Failed to load PDCA items');
    } else {
      setItems((data as PdcaItem[]) || []);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: PhaseStatus) => {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));

    const { error } = await supabase
      .from('pdca_items')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      // Revert
      fetchItems();
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
    }
  };

  if (loading) {
    return (
      <Card className="elevation-1">
        <CardContent className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const phaseCounts = Object.fromEntries(
    phases.map(p => {
      const phaseItems = items.filter(i => i.phase === p);
      const complete = phaseItems.filter(i => i.status === 'complete').length;
      return [p, { total: phaseItems.length, complete }];
    })
  );
  const totalComplete = items.filter(i => i.status === 'complete').length;
  const overallPct = items.length > 0 ? Math.round((totalComplete / items.length) * 100) : 0;

  return (
    <Card className="elevation-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="si-h4 flex items-center gap-2">
            <RefreshCw className="size-4" />
            PDCA Cycle Tracker
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{totalComplete}/{items.length} complete</Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="si-caption">ISO 50001 uses the Plan-Do-Check-Act (PDCA) cycle for continual improvement of the Energy Management System.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall progress */}
        <div className="flex items-center gap-4">
          <Progress value={overallPct} className="flex-1 h-3" />
          <span className="si-body font-medium text-foreground">{overallPct}%</span>
        </div>

        {/* Phase progress pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {phases.map(p => {
            const cfg = phaseConfig[p];
            const counts = phaseCounts[p];
            const pct = counts.total > 0 ? Math.round((counts.complete / counts.total) * 100) : 0;
            return (
              <div key={p} className={`rounded-lg border p-3 ${cfg.color}`}>
                <p className="si-label">{cfg.label}</p>
                <p className="si-h3 mt-1">{counts.complete}/{counts.total}</p>
                <Progress value={pct} className="h-1.5 mt-1.5" />
              </div>
            );
          })}
        </div>

        {/* Items by phase */}
        {phases.map(p => {
          const cfg = phaseConfig[p];
          const phaseItems = items.filter(i => i.phase === p);
          return (
            <div key={p}>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                <span className="si-caption text-muted-foreground">{phaseItems.length} item(s)</span>
              </div>
              <div className="space-y-0.5">
                {phaseItems.map(item => (
                  <PdcaItemRow key={item.id} item={item} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
