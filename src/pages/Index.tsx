import { useMemo, useState } from 'react';
import { ExceptionSummary } from '@/components/dashboard/ExceptionSummary';
import { SiteContextCard } from '@/components/dashboard/SiteContextCard';
import { AnomalyPanel } from '@/components/dashboard/AnomalyPanel';
import { AnomalyDrawer } from '@/components/dashboard/AnomalyDrawer';
import { EnergyTrendChart, ZoneBreakdownChart, TariffPanel, ProductionPanel } from '@/components/dashboard/EnergyCharts';
import { SavingsSummaryCards } from '@/components/dashboard/SavingsPanel';
import { HealthScorePanel } from '@/components/dashboard/HealthScorePanel';
import { DataReadinessPanel } from '@/components/dashboard/DataReadinessPanel';
import { DigitalTwin } from '@/components/dashboard/DigitalTwin';
import { generateKpis, generateDataQuality, generateHealthScore, generateAnomalies } from '@/data/mockEnergyData';
import type { Anomaly } from '@/data/mockEnergyData';

const Index = () => {
  const kpis = useMemo(() => generateKpis(), []);
  const dataQuality = useMemo(() => generateDataQuality(), []);
  const healthScore = useMemo(() => generateHealthScore(), []);
  const anomalies = useMemo(() => generateAnomalies(), []);

  const [drawerAnomaly, setDrawerAnomaly] = useState<Anomaly | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTwinAnomalyClick = (anomaly: Anomaly) => {
    setDrawerAnomaly(anomaly);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Site context: factory illustration + map */}
      <SiteContextCard />

      {/* 3D Digital Twin */}
      <DigitalTwin anomalies={anomalies} onAnomalyClick={handleTwinAnomalyClick} />

      {/* Exception-led summary: headline KPIs + top issues */}
      <ExceptionSummary kpis={kpis} anomalies={anomalies} />

      {/* Charts — visible but not the first thing you see */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EnergyTrendChart />
        <ZoneBreakdownChart />
      </div>

      {/* Production & Tariff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProductionPanel />
        <TariffPanel />
      </div>

      {/* Energy Savings */}
      <SavingsSummaryCards />

      {/* Health Score & Data Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthScorePanel score={healthScore} />
        <DataReadinessPanel quality={dataQuality} />
      </div>

      {/* Anomaly Drawer triggered from Digital Twin */}
      <AnomalyDrawer
        anomaly={drawerAnomaly}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default Index;
