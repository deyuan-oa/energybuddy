import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, ContactShadows, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { Anomaly, ZoneId } from '@/data/mockEnergyData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Box, Thermometer, Zap, TrendingUp, TrendingDown, Activity, Clock, Maximize2, Minimize2, Sun, Moon, CloudRain, Cable, Play, Pause, History, Bell, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductionLineModel, CompressorModel, WarehouseModel, OfficeModel } from './EquipmentModels';
import { CityEnvironment } from './CityEnvironment';
import { SmokeParticles } from './SmokeParticles';
import { RainParticles, CloudShadows, OverheadClouds, RainPuddles } from './WeatherEffects';
import { Slider } from '@/components/ui/slider';
import { EnergyFlowVisualization } from './EnergyFlow';
import { toast } from 'sonner';

/* ── Types ── */
interface AlertHistoryEntry {
  id: string;
  zoneId: string;
  zoneLabel: string;
  kw: number;
  kwBaseline: number;
  deviation: number;
  temp: number;
  timestamp: Date;
}

interface ZoneLiveData {
  kw: number;
  kwBaseline: number;
  temp: number;
  pf: number; // power factor
  status: 'normal' | 'warning' | 'critical';
  trend: number; // % change from last reading
  history: number[]; // last 8 readings for sparkline
}

interface ZoneConfig {
  id: string;
  label: string;
  dataZoneId: ZoneId; // maps to mockEnergyData zone
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  kwBaseline: number;
  tempBaseline: number;
}

/* ── Zone config matching our 5 monitored zones ── */
const ZONE_CONFIGS: ZoneConfig[] = [
  { id: 'A', label: 'Production Line A', dataZoneId: 'production', x: -3.2, z: -0.8, w: 2.8, d: 3.2, h: 2.6, kwBaseline: 300, tempBaseline: 36 },
  { id: 'B', label: 'Production Line B', dataZoneId: 'production', x: 0.2, z: -0.8, w: 2.8, d: 3.2, h: 2.6, kwBaseline: 280, tempBaseline: 35 },
  { id: 'C', label: 'Compressor Room', dataZoneId: 'compressed_air', x: 3.6, z: -1.6, w: 2.0, d: 1.8, h: 3.0, kwBaseline: 170, tempBaseline: 40 },
  { id: 'D', label: 'Warehouse & Logistics', dataZoneId: 'lighting', x: 3.6, z: 1.0, w: 2.0, d: 2.6, h: 2.2, kwBaseline: 50, tempBaseline: 29 },
  { id: 'E', label: 'Admin & Offices', dataZoneId: 'hvac', x: -3.2, z: 2.8, w: 2.8, d: 1.6, h: 1.8, kwBaseline: 40, tempBaseline: 24 },
];

const STATUS_COLORS: Record<string, string> = {
  normal: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
};

/* ── Simulate live 15-min interval data ── */
function generateLiveReading(config: ZoneConfig, prev?: ZoneLiveData): ZoneLiveData {
  const jitter = () => (Math.random() - 0.5) * 2;
  const prevKw = prev?.kw ?? config.kwBaseline;
  // Random walk with mean reversion
  const kw = Math.max(5, Math.round(prevKw + jitter() * config.kwBaseline * 0.06 + (config.kwBaseline - prevKw) * 0.1));
  const temp = Math.round((prev?.temp ?? config.tempBaseline) + jitter() * 1.5 + (config.tempBaseline - (prev?.temp ?? config.tempBaseline)) * 0.15);
  const pf = Math.min(1, Math.max(0.7, (prev?.pf ?? 0.92) + jitter() * 0.02));
  const deviation = (kw - config.kwBaseline) / config.kwBaseline;
  const status: ZoneLiveData['status'] = deviation > 0.15 ? 'critical' : deviation > 0.08 ? 'warning' : 'normal';
  const trend = prev ? ((kw - prev.kw) / prev.kw) * 100 : 0;
  const history = prev ? [...prev.history.slice(-7), kw] : Array.from({ length: 8 }, () => config.kwBaseline + jitter() * config.kwBaseline * 0.05);

  return { kw, kwBaseline: config.kwBaseline, temp, pf: Math.round(pf * 100) / 100, status, trend: Math.round(trend * 10) / 10, history };
}

/* ── Pre-generate 96 historical snapshots (24h at 15-min intervals) ── */
const HISTORY_STEPS = 96;
function generateHistory(): Record<string, ZoneLiveData>[] {
  const steps: Record<string, ZoneLiveData>[] = [];
  let prev: Record<string, ZoneLiveData> | undefined;
  for (let i = 0; i < HISTORY_STEPS; i++) {
    const snap: Record<string, ZoneLiveData> = {};
    ZONE_CONFIGS.forEach(c => {
      // Apply time-of-day load profile: lower at night (0-6), peak mid-day (10-14)
      const hour = (i / 4) % 24;
      const loadFactor = hour < 6 ? 0.5 : hour < 10 ? 0.7 + (hour - 6) * 0.075 : hour < 14 ? 1.0 : hour < 18 ? 0.9 : 0.6;
      const adjusted = { ...c, kwBaseline: Math.round(c.kwBaseline * loadFactor) };
      snap[c.id] = generateLiveReading(adjusted, prev?.[c.id]);
    });
    steps.push(snap);
    prev = snap;
  }
  return steps;
}

// Singleton so it doesn't regenerate on re-render
const HISTORICAL_DATA = generateHistory();
function formatSliderTime(step: number): string {
  const totalMinutes = step * 15;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/* ── Temperature to heatmap color (blue → green → yellow → red) ── */
function tempToHeatColor(temp: number): string {
  // Map 20°C–50°C to a gradient
  const t = Math.max(0, Math.min(1, (temp - 20) / 30));
  if (t < 0.33) {
    // blue → green
    const p = t / 0.33;
    return `rgb(${Math.round(30 * (1 - p) + 34 * p)}, ${Math.round(120 * (1 - p) + 197 * p)}, ${Math.round(255 * (1 - p) + 94 * p)})`;
  } else if (t < 0.66) {
    // green → yellow
    const p = (t - 0.33) / 0.33;
    return `rgb(${Math.round(34 * (1 - p) + 245 * p)}, ${Math.round(197 * (1 - p) + 158 * p)}, ${Math.round(94 * (1 - p) + 11 * p)})`;
  } else {
    // yellow → red
    const p = (t - 0.66) / 0.34;
    return `rgb(${Math.round(245 * (1 - p) + 239 * p)}, ${Math.round(158 * (1 - p) + 68 * p)}, ${Math.round(11 * (1 - p) + 68 * p)})`;
  }
}

/* ── Mini sparkline (HTML overlay) ── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 48},${16 - ((v - min) / range) * 14}`).join(' ');
  return (
    <svg width="48" height="16" className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Equipment selector per zone ── */
function ZoneEquipment({ zoneId }: { zoneId: string }) {
  switch (zoneId) {
    case 'A': return <ProductionLineModel />;
    case 'B': return <ProductionLineModel mirror />;
    case 'C': return <CompressorModel />;
    case 'D': return <WarehouseModel />;
    case 'E': return <OfficeModel />;
    default: return null;
  }
}

/* ── Animated zone block with real equipment ── */
function ZoneBlock({ config, data, selected, onSelect, anomalyCount, onAnomalyClick, showHeatmap }: {
  config: ZoneConfig;
  data: ZoneLiveData;
  selected: boolean;
  onSelect: () => void;
  anomalyCount: number;
  onAnomalyClick: () => void;
  showHeatmap: boolean;
}) {
  const boxRef = useRef<THREE.Mesh>(null);
  const heatColor = showHeatmap ? tempToHeatColor(data.temp) : null;
  const baseColor = heatColor ?? STATUS_COLORS[data.status];

  useFrame(({ clock }) => {
    if (!boxRef.current) return;
    const mat = boxRef.current.material as THREE.MeshStandardMaterial;
    if (data.status !== 'normal') {
      mat.emissiveIntensity = 0.08 + Math.sin(clock.getElapsedTime() * 2.5) * 0.06;
    } else {
      mat.emissiveIntensity = selected ? 0.06 : 0.02;
    }
    mat.opacity = selected ? 0.18 : 0.08;
  });

  return (
    <group position={[config.x, 0, config.z]}>
      {/* Floor slab */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[config.w, 0.03, config.d]} />
        <meshStandardMaterial
          color={baseColor}
          transparent
          opacity={showHeatmap ? 0.55 : 0.15}
          emissive={baseColor}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Transparent bounding volume (clickable) */}
      <mesh
        ref={boxRef}
        position={[0, config.h / 2, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <boxGeometry args={[config.w, config.h, config.d]} />
        <meshStandardMaterial
          color={baseColor}
          transparent
          opacity={0.08}
          emissive={baseColor}
          emissiveIntensity={0.02}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Zone boundary edges */}
      <lineSegments position={[0, config.h / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(config.w, config.h, config.d)]} />
        <lineBasicMaterial color={baseColor} transparent opacity={selected ? 0.5 : 0.2} />
      </lineSegments>

      {/* Equipment models inside */}
      <group position={[0, 0.03, 0]}>
        <ZoneEquipment zoneId={config.id} />
      </group>

      {/* Zone label */}
      <Text
        position={[0, config.h + 0.25, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="black"
      >
        Zone {config.id}
      </Text>

      {/* Live kW floating label (always visible) */}
      <Html position={[0, config.h + 0.05, 0]} center distanceFactor={10}>
        <div className="flex items-center gap-1 pointer-events-none">
          <div className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-card/70 backdrop-blur border border-border/50" style={{ color: baseColor }}>
            {showHeatmap ? `🌡 ${data.temp}°C` : `⚡ ${data.kw} kW`}
          </div>
          {anomalyCount > 0 && (
            <button
              className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-rag-red text-white animate-pulse pointer-events-auto cursor-pointer hover:bg-rag-red/80 transition-colors"
              onClick={(e) => { e.stopPropagation(); onAnomalyClick(); }}
            >
              ⚠ {anomalyCount}
            </button>
          )}
        </div>
      </Html>

      {/* Detailed popup on select */}
      {selected && (
        <Html position={[0, config.h + 0.7, 0]} center distanceFactor={8}>
          <div className="bg-card/95 backdrop-blur border border-border rounded-lg px-3 py-2.5 shadow-lg min-w-[190px] pointer-events-none">
            <p className="text-xs font-semibold text-foreground mb-1.5">{config.label}</p>
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Zap className="size-3 text-primary" /> {data.kw} kW
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] font-medium ${data.trend > 0 ? 'text-rag-red' : 'text-rag-green'}`}>
                {data.trend > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {data.trend > 0 ? '+' : ''}{data.trend}%
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkline data={data.history} color={baseColor} />
              <span className="text-[9px] text-muted-foreground">last 2h</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
              <Activity className="size-3" />
              Baseline: {data.kwBaseline} kW
              <span className={`font-medium ${data.kw > data.kwBaseline ? 'text-rag-amber' : 'text-rag-green'}`}>
                ({data.kw > data.kwBaseline ? '+' : ''}{Math.round(((data.kw - data.kwBaseline) / data.kwBaseline) * 100)}%)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Thermometer className="size-3" /> {data.temp}°C
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                PF: {data.pf.toFixed(2)}
              </div>
            </div>
            <div className="mt-1.5">
              <span
                className="inline-block text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${STATUS_COLORS[data.status]}22`, color: STATUS_COLORS[data.status] }}
              >
                {data.status.toUpperCase()}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ── Ground plane ── */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, -0.01, 0.5]} receiveShadow>
      <planeGeometry args={[14, 12]} />
      <meshStandardMaterial color="#1a2332" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

/* ── Grid overlay ── */
function FloorGrid() {
  return (
    <gridHelper
      args={[14, 28, '#334155', '#1e293b']}
      position={[0.5, 0.01, 0.5]}
    />
  );
}

/* ── Main exported component ── */
interface DigitalTwinProps {
  anomalies?: Anomaly[];
  onAnomalyClick?: (anomaly: Anomaly) => void;
}

export function DigitalTwin({ anomalies = [], onAnomalyClick }: DigitalTwinProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>('C');
  const [fullscreen, setFullscreen] = useState(false);
  const [isDay, setIsDay] = useState(false);
  const [weather, setWeather] = useState<'clear' | 'rain'>('clear');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showFlow, setShowFlow] = useState(true);
  const [timeMode, setTimeMode] = useState<'live' | 'history'>('live');
  const [historyStep, setHistoryStep] = useState(HISTORY_STEPS - 1);
  const [playing, setPlaying] = useState(false);
  const [liveData, setLiveData] = useState<Record<string, ZoneLiveData>>(() => {
    const initial: Record<string, ZoneLiveData> = {};
    ZONE_CONFIGS.forEach(c => { initial[c.id] = generateLiveReading(c); });
    return initial;
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [alertHistory, setAlertHistory] = useState<AlertHistoryEntry[]>([]);

  // The data currently displayed (live or historical)
  const displayData = timeMode === 'live' ? liveData : HISTORICAL_DATA[historyStep];

  // Escape key to exit fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Track which zones have already alerted to avoid spam
  const alertedZonesRef = useRef<Set<string>>(new Set());

  // Simulate real-time updates every 5 seconds (only in live mode)
  useEffect(() => {
    if (timeMode !== 'live') return;
    const interval = setInterval(() => {
      setLiveData(prev => {
        const next: Record<string, ZoneLiveData> = {};
        ZONE_CONFIGS.forEach(c => { next[c.id] = generateLiveReading(c, prev[c.id]); });
        return next;
      });
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, [timeMode]);

  // Alert notifications when a zone enters critical status
  useEffect(() => {
    if (timeMode !== 'live') return;
    ZONE_CONFIGS.forEach(config => {
      const zd = liveData[config.id];
      if (!zd) return;
      if (zd.status === 'critical' && !alertedZonesRef.current.has(config.id)) {
        alertedZonesRef.current.add(config.id);
        const dev = Math.round(((zd.kw - zd.kwBaseline) / zd.kwBaseline) * 100);
        // Log to alert history
        setAlertHistory(prev => [{
          id: `${config.id}-${Date.now()}`,
          zoneId: config.id,
          zoneLabel: config.label,
          kw: zd.kw,
          kwBaseline: zd.kwBaseline,
          deviation: dev,
          temp: zd.temp,
          timestamp: new Date(),
        }, ...prev].slice(0, 50)); // keep last 50
        toast.error(`Zone ${config.id} — ${config.label}`, {
          description: `Critical: ${zd.kw} kW (+${dev}% above baseline). Temp ${zd.temp}°C.`,
          duration: 8000,
          action: {
            label: 'View',
            onClick: () => setSelectedZone(config.id),
          },
        });
      } else if (zd.status !== 'critical') {
        // Clear flag so it can re-alert if it goes critical again
        alertedZonesRef.current.delete(config.id);
      }
    });
  }, [liveData, timeMode]);

  // Auto-play through history
  useEffect(() => {
    if (!playing || timeMode !== 'history') return;
    const iv = setInterval(() => {
      setHistoryStep(s => {
        if (s >= HISTORY_STEPS - 1) { setPlaying(false); return HISTORY_STEPS - 1; }
        return s + 1;
      });
    }, 300);
    return () => clearInterval(iv);
  }, [playing, timeMode]);

  const totalKw = useMemo(() => Object.values(displayData).reduce((s, z) => s + z.kw, 0), [displayData]);
  const totalBaseline = useMemo(() => ZONE_CONFIGS.reduce((s, c) => s + c.kwBaseline, 0), []);
  const activeAlerts = useMemo(() => Object.values(displayData).filter(z => z.status !== 'normal').length, [displayData]);
  const deviation = Math.round(((totalKw - totalBaseline) / totalBaseline) * 100);

  // Chart data from historical snapshots
  const chartData = useMemo(() => HISTORICAL_DATA.map((snap, i) => {
    const entry: Record<string, string | number> = { time: formatSliderTime(i) };
    ZONE_CONFIGS.forEach(c => { entry[c.id] = snap[c.id].kw; });
    return entry;
  }), []);

  return (
    <>
    <Card className={`elevation-1 overflow-hidden transition-all duration-300 ${
      fullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : ''
    }`}>
      {/* Fullscreen backdrop */}
      {fullscreen && <div className="fixed inset-0 bg-background -z-10" />}
      <CardHeader className="pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Box className="size-5 text-primary" />
          <CardTitle className="si-h4">Digital Twin — PJ Plant</CardTitle>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-2">
            <span className={`size-1.5 rounded-full ${timeMode === 'live' ? 'bg-rag-green animate-pulse' : 'bg-rag-amber'}`} />
            <Clock className="size-3" />
            {timeMode === 'live' ? lastUpdate.toLocaleTimeString() : `History ${formatSliderTime(historyStep)}`}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs gap-1">
            <Zap className="size-3" /> {totalKw} kW
            <span className={`ml-1 font-medium ${deviation > 0 ? 'text-rag-amber' : 'text-rag-green'}`}>
              ({deviation > 0 ? '+' : ''}{deviation}%)
            </span>
          </Badge>
          {activeAlerts > 0 && (
            <Badge variant="destructive" className="text-xs">
              {activeAlerts} alert{activeAlerts > 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setIsDay(d => !d)}
            aria-label={isDay ? 'Switch to night' : 'Switch to day'}
          >
            {isDay ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`size-7 ${weather === 'rain' ? 'text-primary bg-primary/10' : ''}`}
            onClick={() => setWeather(w => w === 'clear' ? 'rain' : 'clear')}
            aria-label={weather === 'rain' ? 'Clear weather' : 'Toggle rain'}
          >
            <CloudRain className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`size-7 ${showFlow ? 'text-primary bg-primary/10' : ''}`}
            onClick={() => setShowFlow(f => !f)}
            aria-label={showFlow ? 'Hide energy flow' : 'Show energy flow'}
          >
            <Cable className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`size-7 ${showHeatmap ? 'text-primary bg-primary/10' : ''}`}
            onClick={() => setShowHeatmap(h => !h)}
            aria-label={showHeatmap ? 'Hide heatmap' : 'Show temperature heatmap'}
          >
            <Thermometer className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`size-7 ${timeMode === 'history' ? 'text-primary bg-primary/10' : ''}`}
            onClick={() => {
              setTimeMode(m => m === 'live' ? 'history' : 'live');
              setPlaying(false);
            }}
            aria-label={timeMode === 'history' ? 'Switch to live' : 'View history'}
          >
            <History className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setFullscreen(f => !f)}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`relative w-full transition-all duration-300 ${
          fullscreen ? 'h-[calc(100vh-64px)]' : 'h-[360px] sm:h-[420px] lg:h-[480px]'
        }`}>
          <Canvas
            shadows
            camera={{ position: [10, 8, 12], fov: 50, near: 0.1, far: 200 }}
            gl={{ antialias: true }}
            onPointerMissed={() => setSelectedZone(null)}
          >
            <color attach="background" args={[weather === 'rain' ? (isDay ? '#7a9aad' : '#0d1520') : (isDay ? '#87CEEB' : '#111d2e')]} />
            <fog attach="fog" args={[weather === 'rain' ? (isDay ? '#7a9aad' : '#0d1520') : (isDay ? '#87CEEB' : '#111d2e'), weather === 'rain' ? 18 : 25, weather === 'rain' ? 40 : 55]} />

            <ambientLight intensity={weather === 'rain' ? (isDay ? 0.5 : 0.35) : (isDay ? 1.0 : 0.6)} />
            <directionalLight
              position={isDay ? [12, 15, 10] : [10, 12, 8]}
              intensity={weather === 'rain' ? (isDay ? 0.8 : 0.5) : (isDay ? 2.0 : 1.2)}
              castShadow
              shadow-mapSize-width={2048} shadow-mapSize-height={2048}
              shadow-camera-far={50} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15}
              color={weather === 'rain' ? '#b0c4de' : (isDay ? '#fff5e6' : '#ffffff')}
            />
            <directionalLight position={[-8, 10, -5]} intensity={weather === 'rain' ? 0.2 : (isDay ? 0.6 : 0.4)} color={isDay ? '#e0f0ff' : '#ffffff'} />
            <pointLight position={[-5, 6, -3]} intensity={isDay ? 0.2 : 0.5} color="#38bdf8" />
            <hemisphereLight intensity={weather === 'rain' ? 0.25 : (isDay ? 0.7 : 0.4)} color={isDay ? '#87CEEB' : '#7dd3fc'} groundColor={isDay ? '#8B7355' : '#334155'} />

            {/* City surroundings */}
            <CityEnvironment isDay={isDay} />

            {/* Factory floor */}
            <Ground />
            <FloorGrid />
            <ContactShadows position={[0.5, 0, 0.5]} width={14} height={12} far={4} opacity={0.4} blur={2} />

            {ZONE_CONFIGS.map((config) => {
              const zoneAnomalies = anomalies.filter(a => a.zone === config.dataZoneId);
              return (
                <ZoneBlock
                  key={config.id}
                  config={config}
                  data={displayData[config.id]}
                  selected={selectedZone === config.id}
                  onSelect={() => setSelectedZone(prev => prev === config.id ? null : config.id)}
                  showHeatmap={showHeatmap}
                  anomalyCount={zoneAnomalies.length}
                  onAnomalyClick={() => {
                    if (zoneAnomalies.length > 0 && onAnomalyClick) {
                      // Open the most severe anomaly
                      const sorted = [...zoneAnomalies].sort((a, b) => (a.severity === 'red' ? -1 : 1));
                      onAnomalyClick(sorted[0]);
                    }
                  }}
                />
              );
            })}

            {/* Energy flow lines between zones */}
            {showFlow && <EnergyFlowVisualization liveData={displayData} />}

            {/* Factory chimney smoke stacks */}
            <SmokeParticles position={[3.6, 3.2, -1.6]} count={25} speed={0.35} height={2.0} spread={0.12} opacity={0.2} color="#94a3b8" />
            <SmokeParticles position={[-3.2, 2.8, -0.8]} count={18} speed={0.25} height={1.8} spread={0.1} opacity={0.15} color="#cbd5e1" />
            <SmokeParticles position={[0.2, 2.8, -0.8]} count={18} speed={0.28} height={1.6} spread={0.1} opacity={0.15} color="#cbd5e1" />

            {/* Weather overlay */}
            {weather === 'rain' && (
              <>
                <RainParticles intensity={1.0} />
                <CloudShadows />
                <OverheadClouds />
                <RainPuddles />
              </>
            )}

            <OrbitControls enablePan enableZoom enableRotate minDistance={4} maxDistance={35} maxPolarAngle={Math.PI / 2.15} target={[0.5, 0.5, 0.5]} />

            {/* Environment map for realistic reflections */}
            <Environment preset="city" background={false} />

            {/* Post-processing: Bloom for glowing indicators */}
            <EffectComposer>
              <Bloom
                luminanceThreshold={0.8}
                luminanceSmoothing={0.3}
                intensity={0.6}
                mipmapBlur
              />
            </EffectComposer>
          </Canvas>

          {/* Power summary bar */}
          <div className="absolute bottom-12 left-3 right-[156px] bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-1.5 flex items-center gap-4 shadow-lg">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground whitespace-nowrap">
              <Zap className="size-3 text-primary" />
              <span>{totalKw} kW</span>
              <span className={`text-[9px] font-medium ${deviation > 0 ? 'text-rag-amber' : 'text-rag-green'}`}>
                ({deviation > 0 ? '+' : ''}{deviation}% vs baseline)
              </span>
            </div>
            <div className="flex-1 flex items-center gap-1 min-w-0">
              {ZONE_CONFIGS.map(config => {
                const zd = displayData[config.id];
                const pct = Math.round((zd.kw / totalKw) * 100);
                return (
                  <div
                    key={config.id}
                    className="h-3 rounded-sm transition-all duration-500 relative group cursor-pointer"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: STATUS_COLORS[zd.status],
                      opacity: selectedZone === config.id ? 1 : 0.6,
                    }}
                    onClick={() => setSelectedZone(prev => prev === config.id ? null : config.id)}
                  >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 hidden group-hover:block text-[8px] font-mono bg-card border border-border rounded px-1 py-0.5 whitespace-nowrap text-foreground shadow z-10">
                      {config.id}: {zd.kw}kW ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
            <span className="text-[9px] text-muted-foreground whitespace-nowrap">Baseline: {totalBaseline} kW</span>
          </div>

          {/* Time-of-day slider (history mode) */}
          {timeMode === 'history' && (
            <div className="absolute bottom-[88px] left-3 right-[156px] bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={() => setPlaying(p => !p)}
              >
                {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              </Button>
              <span className="text-[10px] font-mono text-primary font-bold w-10 shrink-0">{formatSliderTime(historyStep)}</span>
              <Slider
                value={[historyStep]}
                onValueChange={([v]) => { setHistoryStep(v); setPlaying(false); }}
                min={0}
                max={HISTORY_STEPS - 1}
                step={1}
                className="flex-1"
              />
              <span className="text-[10px] text-muted-foreground shrink-0">23:45</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[9px] px-1.5"
                onClick={() => { setTimeMode('live'); setPlaying(false); }}
              >
                ● LIVE
              </Button>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
            {!showHeatmap ? (
              <div className="flex gap-2">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                    {status}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur rounded px-2 py-1 border border-border/50">
                <span className="text-[9px] text-muted-foreground">20°C</span>
                <div className="w-24 h-2.5 rounded-sm" style={{
                  background: 'linear-gradient(to right, rgb(30,120,255), rgb(34,197,94), rgb(245,158,11), rgb(239,68,68))'
                }} />
                <span className="text-[9px] text-muted-foreground">50°C</span>
              </div>
            )}
          </div>

          {/* Mini-map overlay */}
          <div className="absolute bottom-3 right-3 w-[140px] h-[100px] bg-card/90 backdrop-blur border border-border rounded-lg overflow-hidden shadow-lg">
            <div className="absolute inset-0 p-1.5">
              <div className="text-[7px] font-semibold text-muted-foreground mb-0.5 text-center tracking-wider">MINI-MAP</div>
              <svg viewBox="-6 -4 14 10" className="w-full h-[calc(100%-12px)]">
                {/* Grid background */}
                <rect x="-6" y="-4" width="14" height="10" fill="hsl(var(--muted) / 0.3)" rx="0.3" />
                {/* Energy flow lines */}
                {ZONE_CONFIGS.map((from, i) =>
                  ZONE_CONFIGS.slice(i + 1).map(to => (
                    <line
                      key={`${from.id}-${to.id}`}
                      x1={from.x} y1={from.z}
                      x2={to.x} y2={to.z}
                      stroke="hsl(var(--muted-foreground) / 0.15)"
                      strokeWidth="0.08"
                    />
                  ))
                )}
                {/* Zone blocks */}
                {ZONE_CONFIGS.map(config => {
                  const zd = displayData[config.id];
                  const isSelected = selectedZone === config.id;
                  return (
                    <g key={config.id}>
                      <rect
                        x={config.x - config.w / 2}
                        y={config.z - config.d / 2}
                        width={config.w}
                        height={config.d}
                        fill={STATUS_COLORS[zd.status]}
                        opacity={isSelected ? 0.6 : 0.3}
                        rx="0.15"
                        stroke={isSelected ? 'white' : STATUS_COLORS[zd.status]}
                        strokeWidth={isSelected ? 0.15 : 0.06}
                        className="cursor-pointer transition-opacity"
                        onClick={() => setSelectedZone(prev => prev === config.id ? null : config.id)}
                      />
                      <text
                        x={config.x}
                        y={config.z + 0.15}
                        textAnchor="middle"
                        fill="white"
                        fontSize="0.55"
                        fontWeight="bold"
                        className="pointer-events-none select-none"
                      >
                        {config.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Zone list with live kW */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {ZONE_CONFIGS.map(config => {
              const zd = displayData[config.id];
              const zoneAnomalyCount = anomalies.filter(a => a.zone === config.dataZoneId).length;
              return (
                <button
                  key={config.id}
                  onClick={() => setSelectedZone(prev => prev === config.id ? null : config.id)}
                  className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border transition-colors ${
                    selectedZone === config.id
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-card/80 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[zd.status] }} />
                  <span>Zone {config.id}</span>
                  <span className="font-mono ml-1">{zd.kw}kW</span>
                  {zoneAnomalyCount > 0 && (
                    <span className="size-3.5 flex items-center justify-center rounded-full bg-rag-red text-white text-[7px] font-bold ml-0.5">
                      {zoneAnomalyCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* 24-hour energy consumption chart */}
    <Card className="elevation-1 mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="si-h4 flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            24h Energy Profile
          </CardTitle>
          {timeMode === 'history' && (
            <Badge variant="outline" className="text-xs">
              <Clock className="size-3 mr-1" /> {formatSliderTime(historyStep)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              onClick={(e) => {
                if (e?.activeLabel) {
                  const idx = chartData.findIndex(d => d.time === e.activeLabel);
                  if (idx >= 0) {
                    setTimeMode('history');
                    setHistoryStep(idx);
                    setPlaying(false);
                  }
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                {ZONE_CONFIGS.map((config, i) => {
                  const colors = ['#38bdf8', '#818cf8', '#f59e0b', '#a78bfa', '#34d399'];
                  return (
                    <linearGradient key={config.id} id={`grad-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[i]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={colors[i]} stopOpacity={0.05} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval={11}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={35}
                tickFormatter={(v: number) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              {ZONE_CONFIGS.map((config, i) => {
                const colors = ['#38bdf8', '#818cf8', '#f59e0b', '#a78bfa', '#34d399'];
                return (
                  <Area
                    key={config.id}
                    type="monotone"
                    dataKey={config.id}
                    name={`Zone ${config.id}`}
                    stroke={colors[i]}
                    fill={`url(#grad-${config.id})`}
                    strokeWidth={1.5}
                    dot={false}
                  />
                );
              })}
              {timeMode === 'history' && (
                <ReferenceLine
                  x={formatSliderTime(historyStep)}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  label={{ value: '▼', position: 'top', fill: 'hsl(var(--primary))', fontSize: 12 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>

    {/* Zone comparison table */}
    <Card className="elevation-1 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="si-h4 flex items-center gap-2">
          <Box className="size-4 text-primary" />
          Zone Comparison
          {timeMode === 'history' && (
            <Badge variant="outline" className="text-xs ml-2">
              <Clock className="size-3 mr-1" /> {formatSliderTime(historyStep)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Zone</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">Power (kW)</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">Baseline</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">Deviation</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">Temp (°C)</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">Power Factor</th>
                <th className="text-center px-4 py-2 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ZONE_CONFIGS.map(config => {
                const zd = displayData[config.id];
                const dev = Math.round(((zd.kw - zd.kwBaseline) / zd.kwBaseline) * 100);
                return (
                  <tr
                    key={config.id}
                    className={`border-b border-border/50 transition-colors cursor-pointer hover:bg-muted/30 ${
                      selectedZone === config.id ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedZone(prev => prev === config.id ? null : config.id)}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[zd.status] }} />
                        <span>Zone {config.id}</span>
                        <span className="text-muted-foreground">— {config.label}</span>
                      </div>
                    </td>
                    <td className="text-right px-4 py-2.5 font-mono font-semibold text-foreground">{zd.kw}</td>
                    <td className="text-right px-4 py-2.5 font-mono text-muted-foreground">{zd.kwBaseline}</td>
                    <td className={`text-right px-4 py-2.5 font-mono font-medium ${dev > 0 ? 'text-rag-amber' : 'text-rag-green'}`}>
                      {dev > 0 ? '+' : ''}{dev}%
                    </td>
                    <td className="text-right px-4 py-2.5 font-mono text-foreground">{zd.temp}</td>
                    <td className="text-right px-4 py-2.5 font-mono text-foreground">{zd.pf.toFixed(2)}</td>
                    <td className="text-center px-4 py-2.5">
                      <span
                        className="inline-block text-[9px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${STATUS_COLORS[zd.status]}22`, color: STATUS_COLORS[zd.status] }}
                      >
                        {zd.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td className="px-4 py-2.5 font-semibold text-foreground">Total</td>
                <td className="text-right px-4 py-2.5 font-mono font-bold text-foreground">{totalKw}</td>
                <td className="text-right px-4 py-2.5 font-mono text-muted-foreground">{totalBaseline}</td>
                <td className={`text-right px-4 py-2.5 font-mono font-medium ${deviation > 0 ? 'text-rag-amber' : 'text-rag-green'}`}>
                  {deviation > 0 ? '+' : ''}{deviation}%
                </td>
                <td className="text-right px-4 py-2.5 font-mono text-muted-foreground">—</td>
                <td className="text-right px-4 py-2.5 font-mono text-muted-foreground">—</td>
                <td className="text-center px-4 py-2.5">
                  {activeAlerts > 0 ? (
                    <Badge variant="destructive" className="text-[9px]">{activeAlerts} alert{activeAlerts > 1 ? 's' : ''}</Badge>
                  ) : (
                    <span className="text-[9px] text-rag-green font-medium">ALL OK</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>

    {/* Alert History Panel */}
    <Card className="elevation-1">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-rag-red" />
          <CardTitle className="si-h4">Alert History</CardTitle>
          <span className="text-xs text-muted-foreground">({alertHistory.length})</span>
        </div>
        {alertHistory.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => setAlertHistory([])}>
            <Trash2 className="size-3" /> Clear
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {alertHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Bell className="size-8 mx-auto mb-2 opacity-30" />
            <p>No critical alerts yet.</p>
            <p className="text-xs mt-1">Alerts appear here when a zone exceeds 15% above baseline.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[280px]">
            <div className="space-y-1">
              {alertHistory.map(entry => (
                <button
                  key={entry.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-muted/50 transition-colors group"
                  onClick={() => setSelectedZone(entry.zoneId)}
                >
                  <span className="size-2 rounded-full bg-rag-red shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">Zone {entry.zoneId}</span>
                      <span className="text-muted-foreground truncate">— {entry.zoneLabel}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span className="font-mono">{entry.kw} kW</span>
                      <span className="text-rag-red font-medium">+{entry.deviation}%</span>
                      <span>{entry.temp}°C</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
    </>
  );
}
