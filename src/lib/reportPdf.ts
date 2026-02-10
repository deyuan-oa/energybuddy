import type { Tables } from '@/integrations/supabase/types';

type Report = Tables<'reports'>;

/**
 * Generates a printable PDF from the report content using the browser print API.
 * Uses a hidden iframe approach for clean layout with page numbers.
 */
export async function generateReportPdf(report: Report, content: string): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }

  const reportDate = new Date(report.report_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const generatedAt = new Date(report.created_at).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Convert markdown to simple HTML (basic conversion)
  const htmlContent = markdownToHtml(content);

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${report.title}</title>
  <style>
    @page {
      margin: 20mm 15mm;
      @bottom-center { content: counter(page) " / " counter(pages); font-size: 10px; color: #888; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 3px solid #007993;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 20px;
      color: #007993;
      margin: 0 0 4px;
    }
    .header .meta {
      font-size: 11px;
      color: #666;
    }
    .header .meta span { margin-right: 16px; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      background: #e6f7fa;
      color: #007993;
    }
    h1 { font-size: 18px; color: #007993; margin-top: 24px; }
    h2 { font-size: 15px; color: #333; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { font-size: 13px; color: #555; margin-top: 16px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 11px;
    }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    tr:nth-child(even) { background: #fafafa; }
    ul, ol { padding-left: 20px; }
    li { margin-bottom: 4px; }
    strong { color: #007993; }
    code { background: #f0f0f0; padding: 1px 4px; border-radius: 2px; font-size: 11px; }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #888;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.title}</h1>
    <div class="meta">
      <span>Date: ${reportDate}</span>
      <span>Type: <span class="badge">${report.report_type}</span></span>
      <span>Status: <span class="badge">${report.status}</span></span>
    </div>
  </div>
  <div class="content">${htmlContent}</div>
  <div class="footer">
    <p>Generated: ${generatedAt} • ISO 50001:2018 Energy Management System • Energy Coach</p>
    <p>This report is system-generated. Final content may have been edited by the energy management team.</p>
  </div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to render, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };
}

/** Basic markdown-to-HTML converter */
function markdownToHtml(md: string): string {
  if (!md) return '<p>No content available.</p>';

  let html = md
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr/>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Tables (simple pipe tables)
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => /^[\s-:]+$/.test(c))) return ''; // separator row
      const tag = 'td';
      return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
    });

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  // Wrap consecutive <tr> in <table>
  html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<table>$1</table>');
  // Make first row of each table <th>
  html = html.replace(/<table><tr>(.*?)<\/tr>/g, (match, row) => {
    const headerRow = row.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
    return `<table><thead><tr>${headerRow}</tr></thead><tbody>`;
  });
  html = html.replace(/<\/table>/g, '</tbody></table>');

  // Paragraphs: wrap remaining plain lines
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<')) return line;
    return `<p>${line}</p>`;
  }).join('\n');

  return html;
}
