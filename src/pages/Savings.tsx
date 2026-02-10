import { SavingsPanel } from '@/components/dashboard/SavingsPanel';

export default function Savings() {
  return (
    <div className="max-w-[1400px] space-y-6">
      <div>
        <h1 className="si-h2 text-foreground">Energy Savings</h1>
        <p className="si-body text-muted-foreground mt-1">
          Track identified opportunities, implementation progress, and verified savings against ISO 50001 targets.
        </p>
      </div>
      <SavingsPanel />
    </div>
  );
}
