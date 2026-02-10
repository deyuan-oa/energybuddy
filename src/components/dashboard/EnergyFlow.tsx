import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/* ── Energy flow route definition ── */
interface EnergyFlowRoute {
  id: string;
  label: string;
  from: [number, number, number]; // source position (center of zone)
  to: [number, number, number];   // destination position
  kw: number;
  color: string;
}

/* ── Animated pulse traveling along a line ── */
function FlowPulse({ from, to, color, speed, kw }: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  speed: number;
  kw: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const pulseCount = Math.max(2, Math.min(5, Math.floor(kw / 60)));

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() * speed) % 1;
    ref.current.position.lerpVectors(from, to, t);
  });

  return (
    <>
      {Array.from({ length: pulseCount }).map((_, i) => (
        <FlowPulseSingle key={i} from={from} to={to} color={color} speed={speed} offset={i / pulseCount} kw={kw} />
      ))}
    </>
  );
}

function FlowPulseSingle({ from, to, color, speed, offset, kw }: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  speed: number;
  offset: number;
  kw: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const pulseSize = Math.min(0.12, 0.04 + kw / 2000);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = ((clock.getElapsedTime() * speed + offset) % 1);
    ref.current.position.lerpVectors(from, to, t);
    // Pulsing scale
    const pulse = 0.8 + Math.sin(clock.getElapsedTime() * 6) * 0.2;
    ref.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[pulseSize, 6, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.5}
        toneMapped={false}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/* ── Compressed air particle stream ── */
function AirParticleStream({ from, to, color, count = 30 }: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  count?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const offsets = useMemo(() => Array.from({ length: count }, () => Math.random()), [count]);
  const speeds = useMemo(() => Array.from({ length: count }, () => 0.15 + Math.random() * 0.25), [count]);
  const laterals = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 0.15,
    y: (Math.random() - 0.5) * 0.1,
  })), [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const progress = (offsets[i] + t * speeds[i]) % 1;
      dummy.position.lerpVectors(from, to, progress);
      dummy.position.x += laterals[i].x * Math.sin(t * 3 + i);
      dummy.position.y += laterals[i].y * Math.cos(t * 2.5 + i) + 0.05;
      const scale = 0.6 + Math.sin(progress * Math.PI) * 0.4;
      dummy.scale.setScalar(scale * 0.03);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
        toneMapped={false}
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
}

/* ── Visible pipe geometry (hollow tube) ── */
function PipeSegment({ from, to, radius = 0.06, color = '#64748b' }: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  radius?: number;
  color?: string;
}) {
  const direction = useMemo(() => new THREE.Vector3().subVectors(to, from), [from, to]);
  const length = useMemo(() => direction.length(), [direction]);
  const midpoint = useMemo(() => new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5), [from, to]);
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    return q;
  }, [direction]);
  const euler = useMemo(() => new THREE.Euler().setFromQuaternion(quaternion), [quaternion]);

  return (
    <group>
      {/* Outer pipe shell */}
      <mesh position={midpoint} rotation={euler} castShadow>
        <cylinderGeometry args={[radius, radius, length, 12, 1, true]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.25}
          side={THREE.DoubleSide}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* Pipe end caps (rings) */}
      {[from, to].map((pos, i) => (
        <mesh key={i} position={pos} rotation={euler}>
          <torusGeometry args={[radius, radius * 0.25, 8, 12]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Glowing line between two points ── */
function GlowLine({ from, to, color, thickness }: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  thickness: number;
}) {
  const direction = useMemo(() => new THREE.Vector3().subVectors(to, from), [from, to]);
  const length = useMemo(() => direction.length(), [direction]);
  const midpoint = useMemo(() => new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5), [from, to]);

  // Calculate rotation to align cylinder with direction
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    q.setFromUnitVectors(up, direction.clone().normalize());
    return q;
  }, [direction]);

  const euler = useMemo(() => new THREE.Euler().setFromQuaternion(quaternion), [quaternion]);

  return (
    <mesh position={midpoint} rotation={euler}>
      <cylinderGeometry args={[thickness, thickness, length, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        toneMapped={false}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

/* ══════════════════════════════════════════════
   ENERGY FLOW VISUALIZATION
   Shows animated energy flowing between zones
   ══════════════════════════════════════════════ */

// Flow routes: main supply → zones, and inter-zone flows
const FLOW_ROUTES: Omit<EnergyFlowRoute, 'kw'>[] = [
  // Main supply feeds into Production A
  { id: 'supply-A', label: 'Grid → Prod A', from: [-6, 0.5, -0.8], to: [-3.2, 1.3, -0.8], color: '#38bdf8' },
  // Main supply feeds into Production B
  { id: 'supply-B', label: 'Grid → Prod B', from: [-6, 0.5, 0.5], to: [0.2, 1.3, -0.8], color: '#38bdf8' },
  // Supply to Compressor
  { id: 'supply-C', label: 'Grid → Compressor', from: [-6, 0.5, -2], to: [3.6, 1.5, -1.6], color: '#f59e0b' },
  // Compressor feeds compressed air to Production A
  { id: 'C-A', label: 'Air → Prod A', from: [3.6, 1.0, -1.6], to: [-3.2, 0.8, -0.8], color: '#22d3ee' },
  // Compressor feeds compressed air to Production B
  { id: 'C-B', label: 'Air → Prod B', from: [3.6, 1.0, -0.8], to: [0.2, 0.8, -0.8], color: '#22d3ee' },
  // Supply to Warehouse
  { id: 'supply-D', label: 'Grid → Warehouse', from: [3.6, 0.5, -0.2], to: [3.6, 1.1, 1.0], color: '#a78bfa' },
  // Supply to Admin
  { id: 'supply-E', label: 'Grid → Admin', from: [-6, 0.5, 2.8], to: [-3.2, 0.9, 2.8], color: '#34d399' },
];

interface EnergyFlowProps {
  liveData: Record<string, { kw: number; status: string }>;
}

export function EnergyFlowVisualization({ liveData }: EnergyFlowProps) {
  // Map route kw values from live data
  const routesWithKw = useMemo(() => {
    const kwMap: Record<string, number> = {
      'supply-A': liveData['A']?.kw ?? 300,
      'supply-B': liveData['B']?.kw ?? 280,
      'supply-C': liveData['C']?.kw ?? 170,
      'C-A': Math.round((liveData['A']?.kw ?? 300) * 0.3),
      'C-B': Math.round((liveData['B']?.kw ?? 280) * 0.25),
      'supply-D': liveData['D']?.kw ?? 50,
      'supply-E': liveData['E']?.kw ?? 40,
    };

    return FLOW_ROUTES.map(r => ({
      ...r,
      kw: kwMap[r.id] ?? 100,
    }));
  }, [liveData]);

  return (
    <group>
      {/* Main supply transformer box */}
      <group position={[-6, 0, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.5, 0.8, 0.5]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* HV indicator */}
        <mesh position={[0.26, 0.6, 0]}>
          <boxGeometry args={[0.01, 0.15, 0.15]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.0} toneMapped={false} />
        </mesh>
        {/* Label */}
        <mesh position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
      </group>

      {/* Flow lines + animated pulses */}
      {routesWithKw.map(route => {
        const from = new THREE.Vector3(...route.from);
        const to = new THREE.Vector3(...route.to);
        const thickness = Math.min(0.04, 0.01 + route.kw / 5000);
        const speed = 0.3 + (route.kw / 500) * 0.2;

        const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
        mid.y += 0.3; // float label above the line

        return (
          <group key={route.id}>
            <GlowLine from={from} to={to} color={route.color} thickness={thickness} />
            <FlowPulse from={from} to={to} color={route.color} speed={speed} kw={route.kw} />
            {/* Electrical supply conduits */}
            {route.id.startsWith('supply-') && (
              <PipeSegment from={from} to={to} radius={0.05} color="#334155" />
            )}
            {/* Compressed air pipes + particle stream */}
            {(route.id === 'C-A' || route.id === 'C-B') && (
              <>
                <PipeSegment from={from} to={to} radius={0.07} color="#475569" />
                <AirParticleStream from={from} to={to} color="#22d3ee" count={35} />
              </>
            )}
            {/* Floating kW label */}
            <Html position={[mid.x, mid.y, mid.z]} center distanceFactor={12}>
              <div
                className="pointer-events-none select-none whitespace-nowrap rounded px-1.5 py-0.5 text-[8px] font-mono font-bold backdrop-blur border border-border/40"
                style={{
                  color: route.color,
                  backgroundColor: 'hsl(var(--card) / 0.75)',
                }}
              >
                ⚡ {route.kw} kW
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
