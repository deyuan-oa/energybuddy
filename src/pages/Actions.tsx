import { useState, useMemo } from 'react';
import { format, isPast, isToday } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  CircleDot,
  Bot,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  mockActions,
  teamMembers,
  type CorrectiveAction,
  type ActionStatus,
  type ActionPriority,
  type TeamRole,
} from '@/data/mockActions';

/* ── Status config ─────────────────── */
const statusConfig: Record<ActionStatus, { label: string; icon: React.ElementType; className: string }> = {
  open: { label: 'Open', icon: CircleDot, className: 'bg-rag-red/15 text-rag-red border-rag-red/30' },
  'in-progress': { label: 'In Progress', icon: Clock, className: 'bg-rag-amber/15 text-rag-amber border-rag-amber/30' },
  closed: { label: 'Closed', icon: CheckCircle2, className: 'bg-rag-green/15 text-rag-green border-rag-green/30' },
  verified: { label: 'Verified', icon: ShieldCheck, className: 'bg-primary/15 text-primary border-primary/30' },
};

const priorityConfig: Record<ActionPriority, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-rag-red text-destructive-foreground' },
  high: { label: 'High', className: 'bg-rag-amber text-primary-foreground' },
  medium: { label: 'Medium', className: 'bg-secondary text-secondary-foreground' },
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
};

/* ── Summary cards ─────────────────── */
function SummaryCards({ actions }: { actions: CorrectiveAction[] }) {
  const open = actions.filter(a => a.status === 'open').length;
  const inProgress = actions.filter(a => a.status === 'in-progress').length;
  const overdue = actions.filter(
    a => ['open', 'in-progress'].includes(a.status) && isPast(new Date(a.dueDate)) && !isToday(new Date(a.dueDate))
  ).length;
  const closed = actions.filter(a => a.status === 'closed' || a.status === 'verified').length;

  const items = [
    { label: 'Open', value: open, icon: CircleDot, color: 'text-rag-red' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-rag-amber' },
    { label: 'Overdue', value: overdue, icon: AlertTriangle, color: 'text-rag-red' },
    { label: 'Closed / Verified', value: closed, icon: CheckCircle2, color: 'text-rag-green' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(item => (
        <Card key={item.label} className="elevation-1">
          <CardContent className="flex items-center gap-3 p-4">
            <item.icon className={`size-8 ${item.color}`} />
            <div>
              <p className="si-display text-foreground leading-none">{item.value}</p>
              <p className="si-caption text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Action row ─────────────────── */
function ActionRow({ action }: { action: CorrectiveAction }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[action.status];
  const priority = priorityConfig[action.priority];
  const StatusIcon = status.icon;
  const overdue =
    ['open', 'in-progress'].includes(action.status) &&
    isPast(new Date(action.dueDate)) &&
    !isToday(new Date(action.dueDate));

  return (
    <Card className={`elevation-1 transition-shadow hover:elevation-2 ${overdue ? 'border-rag-red/40' : ''}`}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left: status icon */}
        <StatusIcon className={`size-5 mt-0.5 shrink-0 ${status.className.split(' ').find(c => c.startsWith('text-'))}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="si-label text-muted-foreground">{action.id}</span>
            <Badge variant="outline" className={priority.className}>
              {priority.label}
            </Badge>
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            {action.aiSuggested && (
              <Badge variant="outline" className="bg-accent text-accent-foreground border-primary/20 gap-1">
                <Bot className="size-3" /> AI
              </Badge>
            )}
            {overdue && (
              <Badge variant="outline" className="bg-rag-red/15 text-rag-red border-rag-red/30 gap-1">
                <AlertTriangle className="size-3" /> Overdue
              </Badge>
            )}
          </div>
          <p className="si-body-lg font-medium text-foreground mt-1 truncate">{action.title}</p>
          <div className="flex items-center gap-4 mt-1 text-muted-foreground si-caption flex-wrap">
            <span className="flex items-center gap-1">
              <User className="size-3" /> {action.owner.name} ({action.owner.role})
            </span>
            <span>Due: {format(new Date(action.dueDate), 'dd MMM yyyy')}</span>
            <span>SEU: {action.linkedSeu}</span>
          </div>
        </div>

        {/* Expand chevron */}
        {expanded ? <ChevronUp className="size-4 text-muted-foreground mt-1" /> : <ChevronDown className="size-4 text-muted-foreground mt-1" />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Detail label="Description" value={action.description} />
            <Detail label="Root Cause" value={action.rootCause} />
            <Detail label="Linked KPI" value={action.linkedKpi} />
            <Detail label="Required Evidence" value={action.requiredEvidence} />
            <Detail label="Created By" value={`${action.createdBy.name} (${action.createdBy.role})`} />
            <Detail label="Created" value={format(new Date(action.createdAt), 'dd MMM yyyy HH:mm')} />
            {action.outcomeNotes && <Detail label="Outcome" value={action.outcomeNotes} />}
            {action.closedAt && <Detail label="Closed" value={format(new Date(action.closedAt), 'dd MMM yyyy HH:mm')} />}
          </div>
        </div>
      )}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="si-label text-muted-foreground">{label}</p>
      <p className="si-body text-foreground mt-0.5">{value}</p>
    </div>
  );
}

/* ── Main page ─────────────────── */
export default function Actions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return mockActions.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
      if (roleFilter !== 'all' && a.owner.role !== roleFilter) return false;
      if (ownerFilter !== 'all' && a.owner.id !== ownerFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.id.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.linkedSeu.toLowerCase().includes(q) ||
          a.owner.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, statusFilter, priorityFilter, roleFilter, ownerFilter]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <SummaryCards actions={mockActions} />

      {/* Filters */}
      <Card className="elevation-1">
        <CardHeader className="pb-3">
          <CardTitle className="si-h4 flex items-center gap-2">
            <Filter className="size-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search actions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Operator">Operator</SelectItem>
              <SelectItem value="Supervisor">Supervisor</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Owner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {teamMembers.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Action list */}
      <div className="flex items-center justify-between">
        <p className="si-body text-muted-foreground">{filtered.length} action{filtered.length !== 1 ? 's' : ''}</p>
        <Button size="sm" className="gap-2">
          <Plus className="size-4" /> New Action
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="elevation-1">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle2 className="size-10 mb-2" />
              <p className="si-body-lg">No actions match your filters</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map(action => <ActionRow key={action.id} action={action} />)
        )}
      </div>
    </div>
  );
}
