import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Lightbulb,
  ShieldCheck,
  ClipboardList,
  BarChart3,
  FileWarning,
} from 'lucide-react';

interface ReportContentRendererProps {
  content: string;
}

/* ---- RAG helpers ---- */
function ragColor(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('red') || lower.includes('critical') || lower.includes('🔴'))
    return 'bg-rag-red/15 text-rag-red border-rag-red/30';
  if (lower.includes('amber') || lower.includes('warning') || lower.includes('🟠'))
    return 'bg-rag-amber/15 text-rag-amber border-rag-amber/30';
  if (lower.includes('green') || lower.includes('on target') || lower.includes('🟢'))
    return 'bg-rag-green/15 text-rag-green border-rag-green/30';
  return 'bg-muted text-muted-foreground';
}

function varianceIcon(text: string) {
  const num = parseFloat(text);
  if (isNaN(num)) return <Minus className="size-4 text-muted-foreground" />;
  if (num > 0) return <TrendingUp className="size-4 text-rag-red" />;
  if (num < 0) return <TrendingDown className="size-4 text-rag-green" />;
  return <Minus className="size-4 text-muted-foreground" />;
}

function sectionIcon(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('executive')) return <FileWarning className="size-5" />;
  if (lower.includes('kpi') || lower.includes('performance')) return <BarChart3 className="size-5" />;
  if (lower.includes('finding') || lower.includes('anomal')) return <AlertTriangle className="size-5" />;
  if (lower.includes('corrective') || lower.includes('action')) return <ClipboardList className="size-5" />;
  if (lower.includes('recommend')) return <Lightbulb className="size-5" />;
  if (lower.includes('data quality') || lower.includes('confidence')) return <ShieldCheck className="size-5" />;
  return <Zap className="size-5" />;
}

function statusBadge(status: string) {
  const lower = status.toLowerCase().trim();
  if (lower === 'open') return <Badge variant="outline" className="bg-rag-red/15 text-rag-red border-rag-red/30 text-xs">Open</Badge>;
  if (lower === 'in progress') return <Badge variant="outline" className="bg-rag-amber/15 text-rag-amber border-rag-amber/30 text-xs">In Progress</Badge>;
  if (lower === 'closed') return <Badge variant="outline" className="bg-rag-green/15 text-rag-green border-rag-green/30 text-xs">Closed</Badge>;
  if (lower === 'verified') return <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 text-xs">Verified</Badge>;
  return <Badge variant="outline" className="text-xs">{status}</Badge>;
}

function priorityBadge(priority: string) {
  const lower = priority.toLowerCase().trim();
  if (lower === 'critical') return <Badge className="bg-rag-red text-white text-xs">Critical</Badge>;
  if (lower === 'high') return <Badge className="bg-rag-amber text-white text-xs">High</Badge>;
  if (lower === 'medium') return <Badge variant="outline" className="text-xs">Medium</Badge>;
  if (lower === 'low') return <Badge variant="outline" className="text-muted-foreground text-xs">Low</Badge>;
  return <Badge variant="outline" className="text-xs">{priority}</Badge>;
}

/* ---- Custom markdown components ---- */
const markdownComponents: Components = {
  h1: ({ children }) => (
    <div className="flex items-center gap-3 mb-4 mt-6 first:mt-0 pb-3 border-b border-border">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Zap className="size-5" />
      </div>
      <h1 className="si-h2 text-foreground">{children}</h1>
    </div>
  ),
  h2: ({ children }) => {
    const text = typeof children === 'string' ? children : String(children);
    return (
      <div className="flex items-center gap-3 mb-3 mt-8 first:mt-0">
        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
          {sectionIcon(text)}
        </div>
        <h2 className="si-h3 text-foreground">{children}</h2>
      </div>
    );
  },
  h3: ({ children }) => (
    <h3 className="si-h4 text-foreground mt-5 mb-2">{children}</h3>
  ),
  p: ({ children }) => {
    const text = typeof children === 'string' ? children : '';

    // Detect key-value lines like "Peak Demand Breach: ..."
    if (text && /^[A-Z][\w\s&]+:/.test(text)) {
      const colonIdx = text.indexOf(':');
      const label = text.slice(0, colonIdx);
      const value = text.slice(colonIdx + 1).trim();
      const isWarning = /breach|anomaly|critical|alert|exceeded/i.test(label);
      const isPositive = /positive|improvement|success|achieved/i.test(label);

      return (
        <div className={`flex gap-3 p-3 rounded-lg mb-2 ${
          isWarning ? 'bg-rag-red/5 border border-rag-red/20' :
          isPositive ? 'bg-rag-green/5 border border-rag-green/20' :
          'bg-muted/30'
        }`}>
          <div className="shrink-0 mt-0.5">
            {isWarning ? <AlertTriangle className="size-4 text-rag-red" /> :
             isPositive ? <CheckCircle2 className="size-4 text-rag-green" /> :
             <Minus className="size-4 text-muted-foreground" />}
          </div>
          <div>
            <span className="font-semibold text-foreground si-body">{label}:</span>{' '}
            <span className="text-muted-foreground si-body">{value}</span>
          </div>
        </div>
      );
    }

    return <p className="si-body text-foreground/90 mb-3 leading-relaxed">{children}</p>;
  },
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  table: ({ children }) => (
    <div className="my-4 rounded-lg border border-border overflow-hidden">
      <Table>{children}</Table>
    </div>
  ),
  thead: ({ children }) => (
    <TableHeader className="bg-muted/50">{children}</TableHeader>
  ),
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow>{children}</TableRow>,
  th: ({ children }) => (
    <TableHead className="si-label text-xs font-semibold text-muted-foreground whitespace-nowrap">
      {children}
    </TableHead>
  ),
  td: ({ children }) => {
    const text = String(children ?? '').trim();

    // RAG status cell
    if (/^(🔴|🟠|🟢|Red|Amber|Green)\s*/i.test(text)) {
      return (
        <TableCell className="py-2">
          <Badge variant="outline" className={`${ragColor(text)} text-xs`}>{text.replace(/[🔴🟠🟢]\s*/, '')}</Badge>
        </TableCell>
      );
    }

    // Status cell
    if (/^(Open|Closed|In Progress|Verified)$/i.test(text)) {
      return <TableCell className="py-2">{statusBadge(text)}</TableCell>;
    }

    // Priority cell
    if (/^(Critical|High|Medium|Low)$/i.test(text)) {
      return <TableCell className="py-2">{priorityBadge(text)}</TableCell>;
    }

    // Variance percentage cell
    if (/^[+-]?\d+\.?\d*%$/.test(text)) {
      return (
        <TableCell className="py-2">
          <span className="flex items-center gap-1.5">
            {varianceIcon(text)}
            <span className="font-mono text-sm">{text}</span>
          </span>
        </TableCell>
      );
    }

    return <TableCell className="py-2 si-body">{children}</TableCell>;
  },
  ul: ({ children }) => (
    <ul className="space-y-2 my-3 ml-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-2 my-3 ml-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 si-body text-foreground/90">
      <span className="shrink-0 mt-1.5 size-1.5 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/30 bg-primary/5 rounded-r-lg pl-4 pr-3 py-3 my-3 italic text-muted-foreground si-body">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-border" />,
};

export function ReportContentRenderer({ content }: ReportContentRendererProps) {
  if (!content) return null;

  return (
    <div className="space-y-1">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
