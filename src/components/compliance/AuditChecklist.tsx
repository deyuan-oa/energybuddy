import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Info,
  Loader2,
  Shield,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  clause: string;
  requirement: string;
  description: string;
  checked: boolean;
  priority: 'critical' | 'high' | 'medium';
  evidence: string;
}

const priorityColors = {
  critical: 'bg-rag-red/15 text-rag-red border-rag-red/30',
  high: 'bg-rag-amber/15 text-rag-amber border-rag-amber/30',
  medium: 'bg-muted text-muted-foreground border-border',
};

export function AuditChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('audit_checklist_items')
      .select('*')
      .order('clause', { ascending: true });

    if (error) {
      console.error('Failed to load audit checklist:', error);
      toast.error('Failed to load audit checklist');
    } else {
      setItems((data as ChecklistItem[]) || []);
    }
    setLoading(false);
  };

  const toggle = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newChecked = !item.checked;
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: newChecked } : i));

    const { error } = await supabase
      .from('audit_checklist_items')
      .update({ checked: newChecked })
      .eq('id', id);

    if (error) {
      // Revert on failure
      setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !newChecked } : i));
      toast.error('Failed to save change');
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

  const completed = items.filter(i => i.checked).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const criticalMissing = items.filter(i => !i.checked && i.priority === 'critical');

  return (
    <Card className="elevation-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="si-h4 flex items-center gap-2">
            <ClipboardCheck className="size-4" />
            Audit Readiness Checklist
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{completed}/{total} complete</Badge>
            {criticalMissing.length > 0 && (
              <Badge variant="outline" className="bg-rag-red/15 text-rag-red border-rag-red/30 gap-1">
                <AlertTriangle className="size-3" /> {criticalMissing.length} critical gaps
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="si-caption">This checklist covers all ISO 50001:2018 clauses. Items marked "Critical" are mandatory for certification and must have documented evidence.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress */}
        <div className="flex items-center gap-4">
          <Progress value={pct} className="flex-1 h-3" />
          <span className="si-body font-medium text-foreground">{pct}% ready</span>
        </div>

        {/* Critical gaps alert */}
        {criticalMissing.length > 0 && (
          <div className="rounded-lg border border-rag-red/30 bg-rag-red/5 p-3">
            <p className="si-body font-medium text-foreground flex items-center gap-2">
              <Shield className="size-4 text-rag-red" />
              Critical gaps requiring attention
            </p>
            <ul className="mt-2 space-y-1">
              {criticalMissing.map(item => (
                <li key={item.id} className="si-caption text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="size-3 text-rag-red shrink-0" />
                  <span className="font-medium">§{item.clause}</span> — {item.requirement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Checklist */}
        <div className="space-y-1">
          {items.map(item => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                item.checked ? 'bg-muted/20' : 'hover:bg-muted/30'
              }`}
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => toggle(item.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="si-body font-medium text-foreground">
                    §{item.clause} — {item.requirement}
                  </span>
                  <Badge variant="outline" className={priorityColors[item.priority]}>
                    {item.priority}
                  </Badge>
                </div>
                <p className={`si-caption mt-0.5 ${item.checked ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                  {item.description}
                </p>
                {item.checked && item.evidence && (
                  <p className="si-caption text-rag-green mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> {item.evidence}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
