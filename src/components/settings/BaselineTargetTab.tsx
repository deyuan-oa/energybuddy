import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info, Target } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { zones } from '@/data/mockEnergyData';
import { toast } from '@/hooks/use-toast';

interface BaselineRow {
  id: string;
  zone: string;
  baselineKwh: number;
  targetKwh: number;
  baselineDate: string;
  reductionPct: number;
}

export function BaselineTargetTab() {
  const [rows, setRows] = useState<BaselineRow[]>(
    zones.map(z => ({
      id: z.id,
      zone: z.name,
      baselineKwh: z.baselineKwh,
      targetKwh: z.targetKwh,
      baselineDate: '2025-01-01',
      reductionPct: Math.round(((z.baselineKwh - z.targetKwh) / z.baselineKwh) * 100),
    }))
  );

  const [enpiVersion, setEnpiVersion] = useState('v2.1');
  const [co2Factor, setCo2Factor] = useState('0.42');

  const updateRow = (id: string, field: 'baselineKwh' | 'targetKwh', value: number) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      updated.reductionPct = updated.baselineKwh > 0
        ? Math.round(((updated.baselineKwh - updated.targetKwh) / updated.baselineKwh) * 100)
        : 0;
      return updated;
    }));
  };

  const handleSave = () => {
    toast({ title: 'Baselines saved', description: 'Baseline and target values updated.' });
  };

  const totalBaseline = rows.reduce((s, r) => s + r.baselineKwh, 0);
  const totalTarget = rows.reduce((s, r) => s + r.targetKwh, 0);
  const totalReduction = totalBaseline > 0 ? Math.round(((totalBaseline - totalTarget) / totalBaseline) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card className="elevation-1">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="si-h4 flex items-center gap-2">
                <Target className="size-4" /> Baselines & Targets
              </CardTitle>
              <CardDescription className="si-body">ISO 50001 §6.5 — Energy baselines established from the energy review.</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="si-caption">Changes to baselines should be documented and justified per ISO 50001 §6.5. Adjustment criteria should be defined.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Baseline (kWh/day)</TableHead>
                  <TableHead className="text-right">Target (kWh/day)</TableHead>
                  <TableHead className="text-right">Reduction</TableHead>
                  <TableHead>Baseline Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.zone}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={row.baselineKwh}
                        onChange={e => updateRow(row.id, 'baselineKwh', Number(e.target.value))}
                        className="w-24 text-right ml-auto"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={row.targetKwh}
                        onChange={e => updateRow(row.id, 'targetKwh', Number(e.target.value))}
                        className="w-24 text-right ml-auto"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={row.reductionPct > 0 ? 'bg-rag-green/15 text-rag-green border-rag-green/30' : 'bg-rag-red/15 text-rag-red border-rag-red/30'}>
                        {row.reductionPct > 0 ? '-' : ''}{row.reductionPct}%
                      </Badge>
                    </TableCell>
                    <TableCell className="si-caption text-muted-foreground">{row.baselineDate}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold border-t-2">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{totalBaseline.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{totalTarget.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-rag-green/15 text-rag-green border-rag-green/30">
                      -{totalReduction}%
                    </Badge>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="elevation-1">
        <CardHeader>
          <CardTitle className="si-h4">EnPI & Conversion Factors</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>EnPI Formula Version</Label>
            <Input value={enpiVersion} onChange={e => setEnpiVersion(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CO₂ Emission Factor (kg CO₂/kWh)</Label>
            <Input type="number" step="0.01" value={co2Factor} onChange={e => setCo2Factor(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
