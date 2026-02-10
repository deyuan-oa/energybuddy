import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Target, Bell, Users } from 'lucide-react';
import { SiteConfigTab } from '@/components/settings/SiteConfigTab';
import { BaselineTargetTab } from '@/components/settings/BaselineTargetTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { TeamTab } from '@/components/settings/TeamTab';

export default function Settings() {
  return (
    <div className="max-w-[1000px] space-y-6">
      <Tabs defaultValue="site" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="site" className="gap-2">
            <Building2 className="size-4 hidden sm:block" />
            Site
          </TabsTrigger>
          <TabsTrigger value="baselines" className="gap-2">
            <Target className="size-4 hidden sm:block" />
            Baselines
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="size-4 hidden sm:block" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="size-4 hidden sm:block" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="site"><SiteConfigTab /></TabsContent>
        <TabsContent value="baselines"><BaselineTargetTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="team"><TeamTab /></TabsContent>
      </Tabs>
    </div>
  );
}
