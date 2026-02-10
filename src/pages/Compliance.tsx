import { BaselinePanel } from '@/components/compliance/BaselinePanel';
import { SeuTracker } from '@/components/compliance/SeuTracker';
import { PdcaTracker } from '@/components/compliance/PdcaTracker';
import { AuditChecklist } from '@/components/compliance/AuditChecklist';

export default function Compliance() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <BaselinePanel />
      <SeuTracker />
      <PdcaTracker />
      <AuditChecklist />
    </div>
  );
}
