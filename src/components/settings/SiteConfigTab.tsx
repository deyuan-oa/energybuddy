import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import { zones } from '@/data/mockEnergyData';
import { toast } from '@/hooks/use-toast';

interface ZoneConfig {
  id: string;
  name: string;
  seuType: string;
}

const timezones = [
  'Europe/Berlin', 'Europe/London', 'America/New_York', 'America/Chicago',
  'America/Los_Angeles', 'Asia/Shanghai', 'Asia/Tokyo',
];

const shiftOptions = ['1 Shift (06:00–14:00)', '2 Shifts (06:00–22:00)', '3 Shifts (24h)', 'Custom'];

export function SiteConfigTab() {
  const [siteName, setSiteName] = useState('Main Manufacturing Plant');
  const [location, setLocation] = useState('Munich, Germany');
  const [timezone, setTimezone] = useState('Europe/Berlin');
  const [operatingHours, setOperatingHours] = useState('06:00 – 22:00');
  const [shiftPattern, setShiftPattern] = useState('2 Shifts (06:00–22:00)');
  const [zoneList, setZoneList] = useState<ZoneConfig[]>(
    zones.map(z => ({ id: z.id, name: z.name, seuType: z.seuType }))
  );
  const [newZoneName, setNewZoneName] = useState('');

  const removeZone = (id: string) => {
    setZoneList(prev => prev.filter(z => z.id !== id));
  };

  const addZone = () => {
    if (!newZoneName.trim()) return;
    const id = newZoneName.toLowerCase().replace(/\s+/g, '_');
    setZoneList(prev => [...prev, { id, name: newZoneName.trim(), seuType: 'General' }]);
    setNewZoneName('');
  };

  const handleSave = () => {
    toast({ title: 'Settings saved', description: 'Site configuration updated successfully.' });
  };

  return (
    <div className="space-y-4">
      <Card className="elevation-1">
        <CardHeader>
          <CardTitle className="si-h4 flex items-center gap-2">
            <Building2 className="size-4" /> Site Information
          </CardTitle>
          <CardDescription className="si-body">General site details used across reports and dashboards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input id="siteName" value={siteName} onChange={e => setSiteName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input id="location" value={location} onChange={e => setLocation(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shift Pattern</Label>
              <Select value={shiftPattern} onValueChange={setShiftPattern}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {shiftOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Operating Hours</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input id="hours" value={operatingHours} onChange={e => setOperatingHours(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="elevation-1">
        <CardHeader>
          <CardTitle className="si-h4">Zones / Areas</CardTitle>
          <CardDescription className="si-body">Define energy monitoring zones used in SEU tracking and dashboards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {zoneList.map(zone => (
            <div key={zone.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-1 min-w-0">
                <span className="si-body font-medium text-foreground">{zone.name}</span>
                <Badge variant="outline" className="ml-2 si-caption">{zone.seuType}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removeZone(zone.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <Input placeholder="New zone name..." value={newZoneName} onChange={e => setNewZoneName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addZone()} />
            <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={addZone}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
