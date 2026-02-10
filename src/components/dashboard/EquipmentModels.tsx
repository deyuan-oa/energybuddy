import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SmokeParticles } from './SmokeParticles';

const METAL = { color: '#64748b', roughness: 0.4, metalness: 0.7 };
const DARK_METAL = { color: '#334155', roughness: 0.3, metalness: 0.8 };
const PIPE = { color: '#94a3b8', roughness: 0.35, metalness: 0.6 };
const GLOW_CYAN = { color: '#22d3ee', emissive: '#22d3ee', emissiveIntensity: 1.5, toneMapped: false as const };
const BELT = { color: '#1e293b', roughness: 0.8, metalness: 0.1 };
const GLASS = { color: '#e0f2fe', transparent: true, opacity: 0.25, roughness: 0.1, metalness: 0.3 };
const WOOD = { color: '#92400e', roughness: 0.9, metalness: 0.0 };
const CRATE = { color: '#78716c', roughness: 0.85, metalness: 0.05 };

/* ══════════════════════════════════════════════
   PRODUCTION LINE — conveyor belt + robot arms + CNC machines
   ══════════════════════════════════════════════ */
export function ProductionLineModel({ mirror = false }: { mirror?: boolean }) {
  const robotArm1 = useRef<THREE.Group>(null);
  const robotArm2 = useRef<THREE.Group>(null);
  const beltRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (robotArm1.current) robotArm1.current.rotation.z = Math.sin(t * 1.2) * 0.4;
    if (robotArm2.current) robotArm2.current.rotation.z = Math.sin(t * 1.2 + 1.5) * 0.35;
    // Animate belt texture offset
    if (beltRef.current) {
      const mat = beltRef.current.material as THREE.MeshStandardMaterial;
      if (mat.map) mat.map.offset.x = (t * 0.3) % 1;
    }
  });

  const sx = mirror ? -1 : 1;

  return (
    <group scale={[sx, 1, 1]}>
      {/* ── Conveyor Belt ── */}
      <group position={[0, 0.35, 0]}>
        {/* Belt surface */}
        <mesh ref={beltRef} position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[2.2, 0.06, 0.5]} />
          <meshStandardMaterial {...BELT} />
        </mesh>
        {/* Side rails */}
        {[-0.28, 0.28].map((z, i) => (
          <mesh key={i} position={[0, 0.05, z]} castShadow>
            <boxGeometry args={[2.3, 0.1, 0.04]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        ))}
        {/* Legs */}
        {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
          <mesh key={i} position={[x, -0.15, 0]} castShadow>
            <boxGeometry args={[0.06, 0.3, 0.5]} />
            <meshStandardMaterial {...DARK_METAL} />
          </mesh>
        ))}
        {/* Rollers */}
        {[-1.0, -0.5, 0, 0.5, 1.0].map((x, i) => (
          <mesh key={i} position={[x, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.46, 8]} />
            <meshStandardMaterial {...PIPE} />
          </mesh>
        ))}
        {/* Products on belt */}
        {[-0.6, 0.1, 0.7].map((x, i) => (
          <mesh key={i} position={[x, 0.22, 0]} castShadow>
            <boxGeometry args={[0.18, 0.12, 0.16]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.5} metalness={0.3} />
          </mesh>
        ))}
      </group>

      {/* ── Robot Arm 1 ── */}
      <group position={[-0.5, 0, -0.6]}>
        {/* Base */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 0.3, 12]} />
          <meshStandardMaterial {...DARK_METAL} />
        </mesh>
        {/* Rotating turret */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, 0.1, 8]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        {/* Arm segment */}
        <group ref={robotArm1} position={[0, 0.4, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.06, 0.6, 0.06]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.5} metalness={0.4} />
          </mesh>
          {/* Joint */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0.15, 0.6, 0]} rotation={[0, 0, -0.8]} castShadow>
            <boxGeometry args={[0.05, 0.35, 0.05]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.5} metalness={0.4} />
          </mesh>
          {/* Gripper */}
          <mesh position={[0.3, 0.45, 0]} castShadow>
            <boxGeometry args={[0.08, 0.04, 0.1]} />
            <meshStandardMaterial {...DARK_METAL} />
          </mesh>
        </group>
      </group>

      {/* ── Robot Arm 2 ── */}
      <group position={[0.5, 0, -0.6]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 0.3, 12]} />
          <meshStandardMaterial {...DARK_METAL} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, 0.1, 8]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <group ref={robotArm2} position={[0, 0.4, 0]}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.06, 0.5, 0.06]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
          <mesh position={[0.12, 0.5, 0]} rotation={[0, 0, -0.6]} castShadow>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      </group>

      {/* ── CNC Machine ── */}
      <group position={[0, 0, 0.8]}>
        {/* Main body */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.9, 1.0, 0.7]} />
          <meshStandardMaterial {...DARK_METAL} />
        </mesh>
        {/* Control panel */}
        <mesh position={[0, 0.85, 0.36]} castShadow>
          <boxGeometry args={[0.35, 0.25, 0.02]} />
          <meshStandardMaterial {...GLOW_CYAN} />
        </mesh>
        {/* Status LED strip */}
        <mesh position={[0, 1.02, 0.2]}>
          <boxGeometry args={[0.6, 0.02, 0.02]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2.0} toneMapped={false} />
        </mesh>
      </group>

      {/* ── HVAC Duct running overhead ── */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <boxGeometry args={[2.4, 0.25, 0.3]} />
        <meshStandardMaterial {...PIPE} />
      </mesh>
      {/* Duct vents */}
      {[-0.8, 0, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 1.95, 0]} castShadow>
          <boxGeometry args={[0.15, 0.08, 0.32]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════
   COMPRESSOR ROOM — tanks, pipes, gauges
   ══════════════════════════════════════════════ */
export function CompressorModel() {
  const fanRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (fanRef.current) fanRef.current.rotation.z = clock.getElapsedTime() * 8;
  });

  return (
    <group>
      {/* ── Main compressor tank ── */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 1.0, 16]} />
        <meshPhysicalMaterial color="#64748b" metalness={0.9} roughness={0.1} clearcoat={0.3} clearcoatRoughness={0.1} />
      </mesh>
      {/* Tank end caps */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.03, 16]} />
          <meshPhysicalMaterial color="#94a3b8" metalness={0.9} roughness={0.1} clearcoat={0.2} />
        </mesh>
      ))}
      {/* Tank legs */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.1, 0]} castShadow>
          <boxGeometry args={[0.08, 0.2, 0.5]} />
          <meshStandardMaterial {...DARK_METAL} />
        </mesh>
      ))}

      {/* ── Secondary tank (vertical) ── */}
      <mesh position={[0.55, 0.55, -0.3]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 1.1, 12]} />
        <meshPhysicalMaterial color="#475569" metalness={0.9} roughness={0.1} clearcoat={0.3} clearcoatRoughness={0.1} />
      </mesh>
      {/* Pressure gauge */}
      <mesh position={[0.55, 1.15, -0.3]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.03, 12]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>

      {/* ── Pipes ── */}
      {/* Horizontal pipe */}
      <mesh position={[0.2, 0.85, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial {...PIPE} />
      </mesh>
      {/* Vertical pipe */}
      <mesh position={[0.55, 0.7, 0.15]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.4, 8]} />
        <meshStandardMaterial {...PIPE} />
      </mesh>
      {/* Pipe elbow connectors */}
      <mesh position={[0.55, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial {...PIPE} />
      </mesh>

      {/* ── Cooling fan ── */}
      <group position={[-0.55, 0.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.05, 0.5, 0.5]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        <mesh ref={fanRef} position={[-0.04, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          {/* Fan blades */}
          <boxGeometry args={[0.35, 0.06, 0.02]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Cross blade */}
        <mesh position={[-0.04, 0, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
          <boxGeometry args={[0.35, 0.06, 0.02]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* ── Control panel ── */}
      <group position={[-0.2, 0, 0.55]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.5, 0.8, 0.08]} />
          <meshStandardMaterial {...DARK_METAL} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.7, 0.045]}>
          <boxGeometry args={[0.3, 0.2, 0.01]} />
          <meshStandardMaterial {...GLOW_CYAN} />
        </mesh>
        {/* Warning light */}
        <mesh position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      </group>

      {/* Exhaust steam from compressor */}
      <SmokeParticles position={[-0.55, 0.85, 0]} count={12} speed={0.4} height={1.0} spread={0.08} opacity={0.3} size={0.05} color="#e2e8f0" />
      <SmokeParticles position={[0.55, 1.2, -0.3]} count={8} speed={0.3} height={0.6} spread={0.05} opacity={0.2} size={0.04} color="#f1f5f9" />
    </group>
  );
}

/* ══════════════════════════════════════════════
   WAREHOUSE — racking, pallets, forklift
   ══════════════════════════════════════════════ */
export function WarehouseModel() {
  return (
    <group>
      {/* ── Racking units ── */}
      {[-0.5, 0.5].map((x, ri) => (
        <group key={ri} position={[x, 0, 0]}>
          {/* Uprights */}
          {[-0.35, 0.35].map((z, i) => (
            <mesh key={i} position={[0, 0.9, z]} castShadow>
              <boxGeometry args={[0.05, 1.8, 0.05]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.5} metalness={0.4} />
            </mesh>
          ))}
          {/* Shelves */}
          {[0.3, 0.9, 1.5].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} castShadow>
              <boxGeometry args={[0.08, 0.03, 0.75]} />
              <meshStandardMaterial {...METAL} />
            </mesh>
          ))}
          {/* Crates on shelves */}
          {[0.38, 1.0, 1.55].map((y, i) => (
            <mesh key={i} position={[0, y, Math.random() * 0.2 - 0.1]} castShadow>
              <boxGeometry args={[0.2, 0.15, 0.25]} />
              <meshStandardMaterial {...CRATE} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Pallets on floor ── */}
      {[{ x: 0, z: -0.6 }, { x: -0.5, z: -0.7 }].map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, 0.04, 0]} castShadow>
            <boxGeometry args={[0.35, 0.04, 0.35]} />
            <meshStandardMaterial {...WOOD} />
          </mesh>
          {/* Stacked boxes */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <boxGeometry args={[0.3, 0.2, 0.3]} />
            <meshStandardMaterial {...CRATE} />
          </mesh>
        </group>
      ))}

      {/* ── Simple forklift ── */}
      <group position={[0, 0, 0.5]}>
        {/* Body */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.45]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Mast */}
        <mesh position={[0, 0.45, -0.2]} castShadow>
          <boxGeometry args={[0.04, 0.55, 0.04]} />
          <meshStandardMaterial {...DARK_METAL} />
        </mesh>
        {/* Forks */}
        {[-0.06, 0.06].map((x, i) => (
          <mesh key={i} position={[x, 0.08, -0.4]} castShadow>
            <boxGeometry args={[0.03, 0.02, 0.2]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
        ))}
        {/* Wheels */}
        {[[-0.12, 0.04, -0.15], [0.12, 0.04, -0.15], [-0.1, 0.04, 0.15], [0.1, 0.04, 0.15]].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} />
            <meshStandardMaterial {...DARK_METAL} />
          </mesh>
        ))}
      </group>

      {/* ── Overhead lights ── */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 1.9, 0]} castShadow>
          <boxGeometry args={[0.08, 0.04, 0.5]} />
          <meshStandardMaterial color="#fef9c3" emissive="#fef9c3" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════
   ADMIN OFFICES — desks, monitors, partition walls
   ══════════════════════════════════════════════ */
export function OfficeModel() {
  return (
    <group>
      {/* ── Partition walls ── */}
      <mesh position={[0, 0.6, -0.3]} castShadow>
        <boxGeometry args={[2.0, 1.2, 0.04]} />
        <meshStandardMaterial {...GLASS} />
      </mesh>
      {/* Partition frame */}
      <mesh position={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[2.0, 0.04, 0.06]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 1.2, -0.3]} castShadow>
        <boxGeometry args={[2.0, 0.04, 0.06]} />
        <meshStandardMaterial {...METAL} />
      </mesh>

      {/* ── Desks with monitors ── */}
      {[-0.6, 0.2, 0.9].map((x, i) => (
        <group key={i} position={[x, 0, 0.1]}>
          {/* Desk surface */}
          <mesh position={[0, 0.38, 0]} castShadow>
            <boxGeometry args={[0.55, 0.03, 0.35]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.2} />
          </mesh>
          {/* Desk legs */}
          {[[-0.24, -0.14], [0.24, -0.14], [-0.24, 0.14], [0.24, 0.14]].map(([dx, dz], j) => (
            <mesh key={j} position={[dx, 0.19, dz]} castShadow>
              <boxGeometry args={[0.03, 0.38, 0.03]} />
              <meshStandardMaterial {...METAL} />
            </mesh>
          ))}
          {/* Monitor */}
          <mesh position={[0, 0.58, -0.08]} castShadow>
            <boxGeometry args={[0.28, 0.18, 0.02]} />
            <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.15} />
          </mesh>
          {/* Monitor stand */}
          <mesh position={[0, 0.45, -0.08]} castShadow>
            <boxGeometry args={[0.03, 0.1, 0.03]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
          {/* Chair */}
          <mesh position={[0, 0.22, 0.2]} castShadow>
            <boxGeometry args={[0.2, 0.04, 0.2]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.35, 0.28]} castShadow>
            <boxGeometry args={[0.2, 0.22, 0.03]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* ── Ceiling HVAC unit ── */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.6, 0.12, 0.4]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* AC vents */}
      <mesh position={[0, 1.43, 0]}>
        <boxGeometry args={[0.4, 0.01, 0.25]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>
    </group>
  );
}
