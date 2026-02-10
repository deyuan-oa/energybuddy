import { useState } from 'react';
import { ReportList } from '@/components/reports/ReportList';
import { ReportEditor } from '@/components/reports/ReportEditor';

export type ReportView = 'list' | 'editor';

export default function Reports() {
  const [view, setView] = useState<ReportView>('list');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const openReport = (id: string) => {
    setSelectedReportId(id);
    setView('editor');
  };

  const backToList = () => {
    setSelectedReportId(null);
    setView('list');
  };

  return (
    <div className="max-w-[1400px] h-full">
      {view === 'list' ? (
        <ReportList onOpenReport={openReport} />
      ) : (
        <ReportEditor reportId={selectedReportId!} onBack={backToList} />
      )}
    </div>
  );
}
