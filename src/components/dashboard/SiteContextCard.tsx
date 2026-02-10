import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Clock, Zap } from 'lucide-react';
import factoryImg from '@/assets/factory-illustration.png';

export function SiteContextCard() {
  return (
    <Card className="elevation-1 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-0">
          {/* Factory illustration + info */}
          <div className="flex items-center gap-4 p-4 sm:w-1/2 lg:w-2/5">
            <img
              src={factoryImg}
              alt="Petaling Jaya manufacturing facility"
              className="size-20 sm:size-24 object-contain shrink-0 rounded-lg"
            />
            <div className="space-y-1.5 min-w-0">
              <h3 className="si-body font-semibold text-foreground">PJ Manufacturing Plant</h3>
              <div className="flex items-center gap-1.5 si-caption text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                <span>Petaling Jaya, Selangor, Malaysia</span>
              </div>
              <div className="flex items-center gap-1.5 si-caption text-muted-foreground">
                <Building2 className="size-3 shrink-0" />
                <span>12,400 m² · 5 monitored zones</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <Badge variant="outline" className="text-[10px] h-5 gap-1">
                  <Zap className="size-2.5" /> ISO 50001
                </Badge>
                <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-rag-green/10 text-rag-green border-rag-green/30">
                  <Clock className="size-2.5" /> Live
                </Badge>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="sm:w-1/2 lg:w-3/5 min-h-[160px] sm:min-h-0 bg-muted/30">
            <iframe
              title="Factory location — Petaling Jaya, Malaysia"
              src="https://www.openstreetmap.org/export/embed.html?bbox=101.6200%2C3.0900%2C101.6700%2C3.1200&layer=mapnik&marker=3.1067%2C101.6456"
              className="w-full h-full min-h-[160px] border-0"
              loading="lazy"
              style={{ filter: 'saturate(0.85) contrast(1.05)' }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
