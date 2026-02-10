import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, Gauge, Mail, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AlertConfig {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ElementType;
}

export function NotificationsTab() {
  const [anomalySensitivity, setAnomalySensitivity] = useState([15]);
  const [peakThreshold, setPeakThreshold] = useState('800');
  const [coverageThreshold, setCoverageThreshold] = useState('90');
  const [emailRecipients, setEmailRecipients] = useState('plant-manager@example.com');

  const [alerts, setAlerts] = useState<AlertConfig[]>([
    { id: 'anomaly', label: 'Anomaly Alerts', description: 'Notify when energy consumption deviates beyond threshold', enabled: true, icon: AlertTriangle },
    { id: 'peak', label: 'Peak Demand Alerts', description: 'Notify when peak demand exceeds target', enabled: true, icon: Zap },
    { id: 'data_gap', label: 'Data Quality Alerts', description: 'Notify when data coverage drops below threshold', enabled: true, icon: Gauge },
    { id: 'action_overdue', label: 'Overdue Action Alerts', description: 'Notify when corrective actions pass their due date', enabled: false, icon: Bell },
  ]);

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const sensitivityLabel = anomalySensitivity[0] <= 10 ? 'High' : anomalySensitivity[0] <= 20 ? 'Medium' : 'Low';
  const sensitivityColor = anomalySensitivity[0] <= 10
    ? 'bg-rag-red/15 text-rag-red border-rag-red/30'
    : anomalySensitivity[0] <= 20
      ? 'bg-rag-amber/15 text-rag-amber border-rag-amber/30'
      : 'bg-rag-green/15 text-rag-green border-rag-green/30';

  const handleSave = () => {
    toast({ title: 'Alert settings saved', description: 'Notification preferences updated.' });
  };

  return (
    <div className="space-y-4">
      <Card className="elevation-1">
        <CardHeader>
          <CardTitle className="si-h4 flex items-center gap-2">
            <Bell className="size-4" /> Alert Channels
          </CardTitle>
          <CardDescription className="si-body">Toggle which alert types are active.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <alert.icon className="size-5 text-primary shrink-0" />
                <div>
                  <p className="si-body font-medium text-foreground">{alert.label}</p>
                  <p className="si-caption text-muted-foreground">{alert.description}</p>
                </div>
              </div>
              <Switch checked={alert.enabled} onCheckedChange={() => toggleAlert(alert.id)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="elevation-1">
        <CardHeader>
          <CardTitle className="si-h4">Thresholds</CardTitle>
          <CardDescription className="si-body">Configure sensitivity and trigger levels for alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Anomaly Detection Sensitivity</Label>
              <Badge variant="outline" className={sensitivityColor}>{sensitivityLabel} ({anomalySensitivity[0]}% deviation)</Badge>
            </div>
            <Slider
              value={anomalySensitivity}
              onValueChange={setAnomalySensitivity}
              min={5}
              max={40}
              step={1}
              className="w-full"
            />
            <p className="si-caption text-muted-foreground">
              Alert triggers when consumption exceeds baseline by {anomalySensitivity[0]}% or more.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Peak Demand Threshold (kW)</Label>
              <Input type="number" value={peakThreshold} onChange={e => setPeakThreshold(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Coverage Minimum (%)</Label>
              <Input type="number" value={coverageThreshold} onChange={e => setCoverageThreshold(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="elevation-1">
        <CardHeader>
          <CardTitle className="si-h4 flex items-center gap-2">
            <Mail className="size-4" /> Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Recipients (comma-separated)</Label>
          <Input value={emailRecipients} onChange={e => setEmailRecipients(e.target.value)} placeholder="user@example.com, manager@example.com" />
          <p className="si-caption text-muted-foreground">Email delivery requires backend configuration in a later phase.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
