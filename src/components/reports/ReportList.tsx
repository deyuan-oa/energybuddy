import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  Eye,
  Loader2,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Report = Tables<'reports'>;

const typeConfig: Record<string, { label: string; color: string }> = {
  daily: { label: 'Daily Summary', color: 'bg-primary/15 text-primary border-primary/30' },
  weekly: { label: 'Weekly Review', color: 'bg-accent text-accent-foreground border-primary/20' },
  monthly: { label: 'Monthly Pack', color: 'bg-secondary text-secondary-foreground border-border' },
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  draft: { label: 'Draft', icon: FileText, color: 'bg-muted text-muted-foreground' },
  review: { label: 'Reviewed', icon: Eye, color: 'bg-rag-amber/15 text-rag-amber border-rag-amber/30' },
  finalized: { label: 'Finalized', icon: CheckCircle2, color: 'bg-rag-green/15 text-rag-green border-rag-green/30' },
};

interface ReportListProps {
  onOpenReport: (id: string) => void;
}

export function ReportList({ onOpenReport }: ReportListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState('daily');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('report_date', { ascending: false });
    if (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const createReport = async () => {
    setCreating(true);
    const typeLabels: Record<string, string> = {
      daily: 'Daily Summary',
      weekly: 'Weekly Operations Review',
      monthly: 'Monthly Management Review Pack',
    };
    const title = `${typeLabels[newType]} — ${format(new Date(newDate), 'dd MMM yyyy')}`;

    const { data, error } = await supabase
      .from('reports')
      .insert({
        report_type: newType,
        report_date: newDate,
        title,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create report');
      console.error(error);
      setCreating(false);
      return;
    }

    toast.success('Report created — generating AI draft…');
    setDialogOpen(false);

    // Trigger AI draft generation
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          report_type: newType,
          report_date: newDate,
          report_id: data.id,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || 'AI draft generation failed');
      } else {
        toast.success('AI draft generated!');
      }
    } catch {
      toast.error('Failed to connect to AI service');
    }

    setCreating(false);
    fetchReports();
    onOpenReport(data.id);
  };

  const filtered = reports.filter(r => {
    if (typeFilter !== 'all' && r.report_type !== typeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    draft: reports.filter(r => r.status === 'draft').length,
    review: reports.filter(r => r.status === 'review').length,
    finalized: reports.filter(r => r.status === 'finalized').length,
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(counts).map(([status, count]) => {
          const cfg = statusConfig[status];
          const Icon = cfg.icon;
          return (
            <Card key={status} className="elevation-1">
              <CardContent className="flex items-center gap-3 p-4">
                <Icon className="size-8 text-muted-foreground" />
                <div>
                  <p className="si-display text-foreground leading-none">{count}</p>
                  <p className="si-caption text-muted-foreground">{cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
            <Input placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="daily">Daily Summary</SelectItem>
              <SelectItem value="weekly">Weekly Review</SelectItem>
              <SelectItem value="monthly">Monthly Pack</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="review">Reviewed</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <p className="si-body text-muted-foreground">{filtered.length} report{filtered.length !== 1 ? 's' : ''}</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="size-4" /> New Report</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>Select report type and date. An AI draft will be generated automatically.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="si-label text-muted-foreground mb-1.5 block">Report Type</label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Operations Review</SelectItem>
                    <SelectItem value="monthly">Monthly Management Review Pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="si-label text-muted-foreground mb-1.5 block">Report Date</label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createReport} disabled={creating} className="gap-2">
                {creating && <Loader2 className="size-4 animate-spin" />}
                Create & Generate Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Report list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="elevation-1">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="size-10 mb-2" />
            <p className="si-body-lg">No reports found</p>
            <p className="si-caption">Create a new report to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => {
            const type = typeConfig[report.report_type] || typeConfig.daily;
            const status = statusConfig[report.status] || statusConfig.draft;
            const StatusIcon = status.icon;
            return (
              <Card
                key={report.id}
                className="elevation-1 hover:elevation-2 transition-shadow cursor-pointer"
                onClick={() => onOpenReport(report.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <StatusIcon className="size-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={type.color}>{type.label}</Badge>
                      <Badge variant="outline" className={status.color}>{status.label}</Badge>
                    </div>
                    <p className="si-body-lg font-medium text-foreground mt-1 truncate">{report.title}</p>
                    <div className="flex items-center gap-4 mt-1 si-caption text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" /> {format(new Date(report.report_date), 'dd MMM yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> Updated {format(new Date(report.updated_at), 'dd MMM HH:mm')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
