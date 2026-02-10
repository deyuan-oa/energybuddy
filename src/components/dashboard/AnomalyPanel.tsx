import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Anomaly } from '@/data/mockEnergyData';
import { AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnomalyDrawer } from '@/components/dashboard/AnomalyDrawer';

interface AnomalyPanelProps {
  anomalies: Anomaly[];
}

export function AnomalyPanel({ anomalies }: AnomalyPanelProps) {
  const [drawerAnomaly, setDrawerAnomaly] = useState<Anomaly | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (anomalies.length === 0) return null;

  const openDrawer = (anomaly: Anomaly) => {
    setDrawerAnomaly(anomaly);
    setDrawerOpen(true);
  };

  return (
    <>
      <Card className="elevation-1 border-rag-amber/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-rag-amber" />
            <CardTitle className="si-h4">Anomalies Detected</CardTitle>
            <span className="si-caption bg-rag-amber/10 text-rag-amber px-2 py-0.5 rounded-full">{anomalies.length}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={cn(
                'rounded border px-4 py-3 cursor-pointer transition-colors',
                anomaly.severity === 'red'
                  ? 'border-rag-red/30 bg-rag-red/5 hover:bg-rag-red/10'
                  : 'border-rag-amber/30 bg-rag-amber/5 hover:bg-rag-amber/10',
              )}
              onClick={() => openDrawer(anomaly)}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={cn('size-4 shrink-0 mt-0.5', anomaly.severity === 'red' ? 'text-rag-red' : 'text-rag-amber')} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="si-body font-semibold text-foreground capitalize">
                      {anomaly.zone.replace('_', ' ')} — {anomaly.type.replace('_', ' ')}
                    </span>
                    <span className="si-caption text-muted-foreground">
                      {anomaly.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="si-body text-muted-foreground mb-2">{anomaly.description}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm" className="h-7 si-caption"
                      onClick={(e) => { e.stopPropagation(); openDrawer(anomaly); }}
                    >
                      Investigate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AnomalyDrawer
        anomaly={drawerAnomaly}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
