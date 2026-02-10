import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  BarChart3,
  AlertTriangle,
  ClipboardList,
  Lightbulb,
  ShieldCheck,
  Zap,
  Paperclip,
  ChevronRight,
  Sparkles,
  TrendingUp,
  List,
  Settings2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateReportPdf } from '@/lib/reportPdf';
import { EvidenceAttachments } from '@/components/reports/EvidenceAttachments';
import { ReportContentRenderer } from '@/components/reports/ReportContentRenderer';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Report = Tables<'reports'>;

const statusFlow: Record<string, { next: string; label: string; icon: React.ElementType }> = {
  draft: { next: 'review', label: 'Mark as Reviewed', icon: Eye },
  review: { next: 'finalized', label: 'Approve & Finalize', icon: CheckCircle2 },
  finalized: { next: 'finalized', label: 'Finalized', icon: CheckCircle2 },
};

/* ── Section definitions for the outline ── */
interface ReportSection {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const reportSections: ReportSection[] = [
  { id: 'executive', label: 'Executive Summary', icon: FileText, description: 'High-level overview and key findings' },
  { id: 'kpis', label: 'KPI Performance', icon: BarChart3, description: 'Energy performance indicators vs targets' },
  { id: 'anomalies', label: 'Findings & Anomalies', icon: AlertTriangle, description: 'Deviations and detected issues' },
  { id: 'actions', label: 'Corrective Actions', icon: ClipboardList, description: 'Open and completed actions' },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, description: 'AI and team suggestions' },
  { id: 'data_quality', label: 'Data Quality', icon: ShieldCheck, description: 'Coverage, confidence, provenance' },
  { id: 'evidence', label: 'Evidence', icon: Paperclip, description: 'Attachments and supporting files' },
];

/* ── Helpers ── */
function detectSections(content: string): string[] {
  const found: string[] = [];
  const lower = content.toLowerCase();
  for (const section of reportSections) {
    // Check if heading matching this section exists in content
    const keywords = section.label.toLowerCase().split(' ');
    if (keywords.some(kw => lower.includes(`## ${kw}`) || lower.includes(`# ${kw}`))) {
      found.push(section.id);
    }
  }
  // Always show executive if there's any content
  if (content.trim().length > 0 && !found.includes('executive')) {
    found.unshift('executive');
  }
  return found;
}

interface ReportEditorProps {
  reportId: string;
  onBack: () => void;
}

export function ReportEditor({ reportId, onBack }: ReportEditorProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState('executive');
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);
  const [aiStreamContent, setAiStreamContent] = useState('');
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !data) {
      toast.error('Failed to load report');
      onBack();
      return;
    }
    setReport(data);
    setContent(data.final_content || data.ai_draft || '');
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [reportId]);

  const detectedSections = useMemo(() => detectSections(content), [content]);

  const saveContent = async () => {
    if (!report) return;
    setSaving(true);
    const { error } = await supabase
      .from('reports')
      .update({ final_content: content, updated_at: new Date().toISOString() })
      .eq('id', report.id);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Report saved');
      setReport(prev => prev ? { ...prev, final_content: content } : null);
      setEditMode(false);
    }
    setSaving(false);
  };

  const advanceStatus = async () => {
    if (!report) return;
    const flow = statusFlow[report.status];
    if (!flow || flow.next === report.status) return;

    if (editMode && content !== (report.final_content || report.ai_draft || '')) {
      await saveContent();
    }

    const { error } = await supabase
      .from('reports')
      .update({
        status: flow.next,
        final_content: content || report.ai_draft,
        updated_at: new Date().toISOString(),
      })
      .eq('id', report.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Report marked as ${flow.next}`);
      setReport(prev => prev ? { ...prev, status: flow.next } : null);
    }
  };

  const regenerateDraft = async () => {
    if (!report) return;
    setRegenerating(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          report_type: report.report_type,
          report_date: report.report_date,
          report_id: report.id,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || 'Regeneration failed');
      } else {
        const { draft } = await resp.json();
        setContent(draft);
        setReport(prev => prev ? { ...prev, ai_draft: draft } : null);
        toast.success('New AI draft generated');
      }
    } catch {
      toast.error('Failed to connect to AI service');
    }
    setRegenerating(false);
  };

  const exportPdf = async () => {
    if (!report) return;
    setExporting(true);
    try {
      await generateReportPdf(report, content);
      toast.success('PDF downloaded');
    } catch (e) {
      console.error('PDF export error:', e);
      toast.error('PDF export failed');
    }
    setExporting(false);
  };
  const runSectionAi = useCallback(async (action: 'generate_summary' | 'explain_deviation') => {
    if (!report) return;
    const section = reportSections.find(s => s.id === activeSection);
    if (!section) return;

    setAiGenerating(action);
    setAiStreamContent('');

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/report-section-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action,
          section_id: section.id,
          section_label: section.label,
          existing_content: content,
          report_type: report.report_type,
          report_date: report.report_date,
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || 'AI request failed');
        setAiGenerating(null);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setAiStreamContent(accumulated);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setAiStreamContent(accumulated);
            }
          } catch {}
        }
      }

      if (accumulated) {
        toast.success(`AI ${action === 'generate_summary' ? 'summary' : 'analysis'} ready — click "Insert" to add to report`);
      }
    } catch (e) {
      console.error('Section AI error:', e);
      toast.error('Failed to connect to AI service');
    }
    setAiGenerating(null);
  }, [report, activeSection, content]);

  const insertAiContent = useCallback(() => {
    if (!aiStreamContent) return;
    const section = reportSections.find(s => s.id === activeSection);
    const heading = `\n\n## ${section?.label || 'Section'}\n\n`;
    const hasSection = content.toLowerCase().includes(`## ${section?.label.toLowerCase()}`);
    if (hasSection) {
      setContent(prev => prev + '\n\n' + aiStreamContent);
    } else {
      setContent(prev => prev + heading + aiStreamContent);
    }
    setAiStreamContent('');
    setEditMode(true);
    toast.success('Content inserted into report');
  }, [aiStreamContent, activeSection, content]);

  if (loading || !report) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const flow = statusFlow[report.status];
  const isApproved = report.status === 'finalized';

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-1 pb-3 flex-wrap shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="si-h3 text-foreground truncate">{report.title}</h2>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="si-caption text-muted-foreground">
              {format(new Date(report.report_date), 'dd MMMM yyyy')}
            </span>
            <Badge variant="outline" className="capitalize text-xs">{report.report_type}</Badge>
            <Badge
              variant="outline"
              className={cn(
                'capitalize text-xs',
                report.status === 'finalized' && 'bg-rag-green/15 text-rag-green border-rag-green/30',
                report.status === 'review' && 'bg-rag-amber/15 text-rag-amber border-rag-amber/30',
              )}
            >
              {report.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Mobile panel toggles */}
          <Button
            variant="outline" size="icon" className="lg:hidden h-8 w-8"
            onClick={() => setOutlineOpen(true)}
          >
            <List className="size-4" />
          </Button>
          <Button
            variant="outline" size="icon" className="xl:hidden h-8 w-8"
            onClick={() => setPropsOpen(true)}
          >
            <Settings2 className="size-4" />
          </Button>
          {!isApproved && (
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={regenerateDraft} disabled={regenerating}
            >
              {regenerating ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
          )}
          <Button
            variant="outline" size="sm" className="gap-1.5"
            onClick={exportPdf} disabled={exporting}
          >
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            <span className="hidden sm:inline">PDF</span>
          </Button>
          {!isApproved && flow && (
            <Button size="sm" className="gap-1.5" onClick={advanceStatus}>
              <flow.icon className="size-4" />
              <span className="hidden sm:inline">{flow.label}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── 3-Panel Canvas ── */}
      <div className="flex flex-1 gap-3 min-h-0 overflow-hidden">
        {/* LEFT: Outline */}
        <div className="w-56 shrink-0 hidden lg:flex flex-col">
          <Card className="elevation-1 flex-1 flex flex-col">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="si-label text-muted-foreground">OUTLINE</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="px-2 pb-3 space-y-0.5">
                {reportSections.map(section => {
                  const isPresent = detectedSections.includes(section.id);
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted/50',
                        !isPresent && !isActive && 'opacity-50',
                      )}
                    >
                      <section.icon className="size-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="si-body block truncate">{section.label}</span>
                      </div>
                      {isPresent && (
                        <CheckCircle2 className="size-3 text-rag-green shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Provenance footer */}
            <div className="border-t border-border p-3 space-y-1">
              <div className="flex items-center gap-1.5 si-caption text-muted-foreground">
                <Bot className="size-3" />
                <span>AI-assisted draft</span>
              </div>
              <p className="si-caption text-muted-foreground">
                Generated {format(new Date(report.created_at), 'dd MMM HH:mm')}
              </p>
            </div>
          </Card>
        </div>

        {/* CENTER: Preview / Editor */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Card className="elevation-1 flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2 pt-3 px-4 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="si-label text-muted-foreground flex items-center gap-2">
                  {editMode ? (
                    <><Edit3 className="size-3.5" /> EDITING</>
                  ) : (
                    <><Eye className="size-3.5" /> PREVIEW</>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {editMode && (
                    <Button
                      size="sm" variant="default" className="gap-1.5 h-7"
                      onClick={saveContent} disabled={saving}
                    >
                      {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                      Save
                    </Button>
                  )}
                  {!isApproved && (
                    <Button
                      variant="ghost" size="sm" className="gap-1.5 h-7"
                      onClick={() => setEditMode(!editMode)}
                    >
                      {editMode ? <Eye className="size-3.5" /> : <Edit3 className="size-3.5" />}
                      {editMode ? 'Preview' : 'Edit'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="p-5">
                {editMode ? (
                  <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="min-h-[600px] font-mono text-sm border-0 shadow-none focus-visible:ring-0 p-0 resize-none"
                    placeholder="Report content (Markdown supported)…"
                  />
                ) : content ? (
                  <ReportContentRenderer content={content} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Bot className="size-10 mb-3" />
                    <p className="si-body-lg">No content yet</p>
                    <p className="si-caption mb-4">Generate an AI draft to get started</p>
                    <Button
                      variant="outline" size="sm" className="gap-2"
                      onClick={regenerateDraft} disabled={regenerating}
                    >
                      {regenerating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                      Generate AI Draft
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* RIGHT: Properties */}
        <div className="w-72 shrink-0 hidden xl:flex flex-col gap-3">
          {/* Section properties */}
          <Card className="elevation-1">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="si-label text-muted-foreground">PROPERTIES</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="si-caption text-muted-foreground">Report Type</Label>
                <Select value={report.report_type} disabled>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Review</SelectItem>
                    <SelectItem value="monthly">Monthly Pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="si-caption text-muted-foreground">Report Date</Label>
                <Input
                  type="date"
                  value={report.report_date}
                  disabled
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="si-caption text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'capitalize',
                      report.status === 'finalized' && 'bg-rag-green/15 text-rag-green border-rag-green/30',
                      report.status === 'review' && 'bg-rag-amber/15 text-rag-amber border-rag-amber/30',
                    )}
                  >
                    {report.status}
                  </Badge>
                  {flow && report.status !== 'finalized' && (
                    <ChevronRight className="size-3 text-muted-foreground" />
                  )}
                  {flow && report.status !== 'finalized' && (
                    <span className="si-caption text-muted-foreground capitalize">{flow.next}</span>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <Label className="si-caption text-muted-foreground">Last Updated</Label>
                <p className="si-body text-foreground">
                  {format(new Date(report.updated_at), 'dd MMM yyyy HH:mm')}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="si-caption text-muted-foreground">Created</Label>
                <p className="si-body text-foreground">
                  {format(new Date(report.created_at), 'dd MMM yyyy HH:mm')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Active section info + AI assistance */}
          <Card className="elevation-1">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="si-label text-muted-foreground">
                ACTIVE SECTION
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {(() => {
                const section = reportSections.find(s => s.id === activeSection);
                if (!section) return null;
                const isPresent = detectedSections.includes(section.id);
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <section.icon className="size-4 text-primary" />
                      <span className="si-body font-medium text-foreground">{section.label}</span>
                    </div>
                    <p className="si-caption text-muted-foreground">{section.description}</p>
                    <div className="flex items-center gap-2">
                      {isPresent ? (
                        <Badge variant="outline" className="text-xs bg-rag-green/15 text-rag-green border-rag-green/30">
                          <CheckCircle2 className="size-3 mr-1" /> Present
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Not detected
                        </Badge>
                      )}
                    </div>
                    {!isPresent && !isApproved && (
                      <Button
                        variant="outline" size="sm" className="w-full gap-1.5 mt-1"
                        onClick={() => {
                          const heading = `\n\n## ${section.label}\n\n`;
                          setContent(prev => prev + heading);
                          setEditMode(true);
                        }}
                      >
                        <Zap className="size-3" />
                        Add Section
                      </Button>
                    )}

                    {/* AI Assistance buttons */}
                    {!isApproved && (
                      <>
                        <Separator className="my-2" />
                        <div className="space-y-1.5">
                          <p className="si-caption text-muted-foreground flex items-center gap-1.5">
                            <Sparkles className="size-3" /> AI Assistance
                          </p>
                          <Button
                            variant="outline" size="sm" className="w-full gap-1.5 justify-start"
                            onClick={() => runSectionAi('generate_summary')}
                            disabled={!!aiGenerating}
                          >
                            {aiGenerating === 'generate_summary' ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Sparkles className="size-3" />
                            )}
                            Generate Summary
                          </Button>
                          <Button
                            variant="outline" size="sm" className="w-full gap-1.5 justify-start"
                            onClick={() => runSectionAi('explain_deviation')}
                            disabled={!!aiGenerating}
                          >
                            {aiGenerating === 'explain_deviation' ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <TrendingUp className="size-3" />
                            )}
                            Explain Deviation
                          </Button>
                        </div>
                      </>
                    )}

                    {/* AI streaming preview */}
                    {(aiStreamContent || aiGenerating) && (
                      <div className="mt-3 space-y-2">
                        <Separator />
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 max-h-48 overflow-y-auto">
                          {aiStreamContent ? (
                            <p className="si-caption text-foreground whitespace-pre-wrap leading-relaxed">
                              {aiStreamContent}
                            </p>
                          ) : (
                            <div className="flex items-center gap-2 si-caption text-muted-foreground">
                              <Loader2 className="size-3 animate-spin" />
                              Generating…
                            </div>
                          )}
                        </div>
                        {aiStreamContent && !aiGenerating && (
                          <div className="flex gap-2">
                            <Button
                              size="sm" className="flex-1 gap-1.5 h-7"
                              onClick={insertAiContent}
                            >
                              <Zap className="size-3" />
                              Insert
                            </Button>
                            <Button
                              variant="outline" size="sm" className="h-7"
                              onClick={() => setAiStreamContent('')}
                            >
                              Discard
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Evidence — compact in sidebar */}
          <div className="flex-1 min-h-0">
            <EvidenceAttachments reportId={report.id} readonly={isApproved} />
          </div>
        </div>
      </div>

      {/* Mobile Outline Sheet */}
      <Sheet open={outlineOpen} onOpenChange={setOutlineOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="si-label text-muted-foreground">OUTLINE</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
            <div className="px-2 pb-3 space-y-0.5">
              {reportSections.map(section => {
                const isPresent = detectedSections.includes(section.id);
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => { setActiveSection(section.id); setOutlineOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-left transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/50',
                      !isPresent && !isActive && 'opacity-50',
                    )}
                  >
                    <section.icon className="size-4 shrink-0" />
                    <span className="si-body flex-1 truncate">{section.label}</span>
                    {isPresent && <CheckCircle2 className="size-3 text-rag-green shrink-0" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
          <div className="border-t border-border p-3 space-y-1">
            <div className="flex items-center gap-1.5 si-caption text-muted-foreground">
              <Bot className="size-3" />
              <span>AI-assisted draft</span>
            </div>
            <p className="si-caption text-muted-foreground">
              Generated {format(new Date(report.created_at), 'dd MMM HH:mm')}
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Properties Sheet */}
      <Sheet open={propsOpen} onOpenChange={setPropsOpen}>
        <SheetContent side="right" className="w-80 p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="si-label text-muted-foreground">PROPERTIES</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="px-4 pb-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="si-caption text-muted-foreground">Report Type</Label>
                <p className="si-body text-foreground capitalize">{report.report_type}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="si-caption text-muted-foreground">Report Date</Label>
                <p className="si-body text-foreground">{format(new Date(report.report_date), 'dd MMM yyyy')}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="si-caption text-muted-foreground">Status</Label>
                <Badge variant="outline" className={cn('capitalize', report.status === 'finalized' && 'bg-rag-green/15 text-rag-green border-rag-green/30', report.status === 'review' && 'bg-rag-amber/15 text-rag-amber border-rag-amber/30')}>
                  {report.status}
                </Badge>
              </div>
              <Separator />

              {/* Active section + AI buttons */}
              {(() => {
                const section = reportSections.find(s => s.id === activeSection);
                if (!section) return null;
                const isPresent = detectedSections.includes(section.id);
                return (
                  <div className="space-y-3">
                    <p className="si-label text-muted-foreground">ACTIVE SECTION</p>
                    <div className="flex items-center gap-2">
                      <section.icon className="size-4 text-primary" />
                      <span className="si-body font-medium text-foreground">{section.label}</span>
                    </div>
                    <p className="si-caption text-muted-foreground">{section.description}</p>
                    {isPresent ? (
                      <Badge variant="outline" className="text-xs bg-rag-green/15 text-rag-green border-rag-green/30">
                        <CheckCircle2 className="size-3 mr-1" /> Present
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Not detected</Badge>
                    )}
                    {!isApproved && (
                      <>
                        <Separator className="my-2" />
                        <p className="si-caption text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="size-3" /> AI Assistance
                        </p>
                        <Button variant="outline" size="sm" className="w-full gap-1.5 justify-start" onClick={() => { setPropsOpen(false); runSectionAi('generate_summary'); }} disabled={!!aiGenerating}>
                          {aiGenerating === 'generate_summary' ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                          Generate Summary
                        </Button>
                        <Button variant="outline" size="sm" className="w-full gap-1.5 justify-start" onClick={() => { setPropsOpen(false); runSectionAi('explain_deviation'); }} disabled={!!aiGenerating}>
                          {aiGenerating === 'explain_deviation' ? <Loader2 className="size-3 animate-spin" /> : <TrendingUp className="size-3" />}
                          Explain Deviation
                        </Button>
                      </>
                    )}
                  </div>
                );
              })()}

              <Separator />
              <EvidenceAttachments reportId={report.id} readonly={isApproved} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
