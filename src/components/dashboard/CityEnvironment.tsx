import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Materials ── */
const CONCRETE = { color: '#374151', roughness: 0.9, metalness: 0.05 };
const GLASS_BUILDING = { color: '#1e3a5f', roughness: 0.1, metalness: 0.6, transparent: true as const, opacity: 0.7 };
const ROAD = { color: '#1f2937', roughness: 0.95, metalness: 0.0 };
const SIDEWALK = { color: '#4b5563', roughness: 0.9, metalness: 0.0 };
const TREE_TRUNK = { color: '#5c3a1e', roughness: 0.9, metalness: 0.0 };
const TREE_LEAVES = { color: '#166534', roughness: 0.85, metalness: 0.0 };
const GRASS = { color: '#15803d', roughness: 0.95, metalness: 0.0 };
const ROOF = { color: '#292524', roughness: 0.8, metalness: 0.1 };
const WINDOW_LIT = { color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 0.3 };
const CAR_BODY = { roughness: 0.3, metalness: 0.6 };

/* ── Simple tree ── */
function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.6, 6]} />
        <meshStandardMaterial {...TREE_TRUNK} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.25, 8, 6]} />
        <meshStandardMaterial {...TREE_LEAVES} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial color="#1a7a3a" roughness={0.85} />
      </mesh>
    </group>
  );
}

/* ── Palm tree (Malaysian context) ── */
function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 1.2, 6]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      {/* Fronds */}
      {[0, 1.2, 2.4, 3.6, 5.0].map((rot, i) => (
        <mesh key={i} position={[Math.cos(rot) * 0.2, 1.25, Math.sin(rot) * 0.2]} rotation={[0.6 * Math.cos(rot), rot, 0.6 * Math.sin(rot)]} castShadow>
          <boxGeometry args={[0.5, 0.02, 0.12]} />
          <meshStandardMaterial color="#2d6a1e" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* ── City building ── */
function Building({ position, width, depth, height, style = 'office', isDay = false }: {
  position: [number, number, number];
  width: number; depth: number; height: number;
  style?: 'office' | 'residential' | 'commercial';
  isDay?: boolean;
}) {
  const windowRows = Math.floor(height / 0.4);
  const windowCols = Math.floor(width / 0.3);

  return (
    <group position={position}>
      {/* Main structure */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial {...(style === 'office'
          ? { ...GLASS_BUILDING, color: isDay ? '#4a7faa' : GLASS_BUILDING.color, opacity: isDay ? 0.5 : 0.7 }
          : { ...CONCRETE, color: isDay ? '#6b7280' : CONCRETE.color })} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, height + 0.04, 0]} castShadow>
        <boxGeometry args={[width + 0.04, 0.08, depth + 0.04]} />
        <meshStandardMaterial {...ROOF} />
      </mesh>
      {/* Roof equipment (AC units) */}
      {height > 2 && (
        <>
          <mesh position={[-width * 0.2, height + 0.2, 0]} castShadow>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color="#6b7280" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[width * 0.2, height + 0.15, 0]} castShadow>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshStandardMaterial color="#6b7280" roughness={0.5} metalness={0.5} />
          </mesh>
        </>
      )}
      {/* Windows (front face) */}
      {style !== 'office' && Array.from({ length: Math.min(windowRows, 6) }).map((_, r) =>
        Array.from({ length: Math.min(windowCols, 4) }).map((_, c) => {
          const lit = Math.random() > 0.4;
          const windowColor = isDay
            ? (lit ? '#a8d8ea' : '#7eb8d0')
            : (lit ? '#fef9c3' : '#1e293b');
          const windowEmissive = isDay
            ? '#000000'
            : (lit ? '#fef9c3' : '#000000');
          const windowEmissiveIntensity = isDay ? 0 : (lit ? 0.2 : 0);
          return (
            <mesh
              key={`${r}-${c}`}
              position={[
                -width / 2 + 0.2 + c * 0.3,
                0.4 + r * 0.4,
                depth / 2 + 0.01
              ]}
            >
              <boxGeometry args={[0.15, 0.2, 0.01]} />
              <meshStandardMaterial
                color={windowColor}
                emissive={windowEmissive}
                emissiveIntensity={windowEmissiveIntensity}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

/* ── Parked car ── */
function Car({ position, color, rotation = 0 }: { position: [number, number, number]; color: string; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.45]} />
        <meshStandardMaterial color={color} {...CAR_BODY} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.18, -0.02]} castShadow>
        <boxGeometry args={[0.16, 0.08, 0.22]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.6} roughness={0.1} metalness={0.4} />
      </mesh>
      {/* Wheels */}
      {[[-0.1, 0.04, 0.14], [0.1, 0.04, 0.14], [-0.1, 0.04, -0.14], [0.1, 0.04, -0.14]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Animated moving car ── */
interface TrafficCarProps {
  axis: 'x' | 'z';
  fixedPos: number; // position on the non-moving axis
  range: [number, number]; // min/max on the moving axis
  speed: number;
  color: string;
  y?: number;
}

function TrafficCar({ axis, fixedPos, range, speed, color, y = 0 }: TrafficCarProps) {
  const ref = useRef<THREE.Group>(null);
  const direction = speed > 0 ? 1 : -1;

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (axis === 'x') {
      ref.current.position.x += speed * delta;
      if (direction > 0 && ref.current.position.x > range[1]) ref.current.position.x = range[0];
      if (direction < 0 && ref.current.position.x < range[0]) ref.current.position.x = range[1];
    } else {
      ref.current.position.z += speed * delta;
      if (direction > 0 && ref.current.position.z > range[1]) ref.current.position.z = range[0];
      if (direction < 0 && ref.current.position.z < range[0]) ref.current.position.z = range[1];
    }
  });

  const rotation = axis === 'x' ? (direction > 0 ? Math.PI / 2 : -Math.PI / 2) : (direction > 0 ? Math.PI : 0);
  const startPos = speed > 0 ? range[0] : range[1];

  return (
    <group ref={ref} position={axis === 'x' ? [startPos, y, fixedPos] : [fixedPos, y, startPos]}>
      {/* Body */}
      <mesh position={[0, 0.1, 0]} rotation={[0, rotation, 0]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.45]} />
        <meshStandardMaterial color={color} {...CAR_BODY} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.18, 0]} rotation={[0, rotation, 0]} castShadow>
        <boxGeometry args={[0.16, 0.08, 0.22]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.6} roughness={0.1} metalness={0.4} />
      </mesh>
      {/* Headlights */}
      <mesh position={[0, 0.1, direction > 0 ? -0.24 : 0.24]} rotation={[0, rotation, 0]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef9c3" emissiveIntensity={0.6} />
      </mesh>
      {/* Taillights */}
      <mesh position={[0, 0.1, direction > 0 ? 0.24 : -0.24]} rotation={[0, rotation, 0]}>
        <sphereGeometry args={[0.02, 4, 4]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}
function StreetLamp({ position, isDay = false }: { position: [number, number, number]; isDay?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 1.6, 6]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Lamp arm */}
      <mesh position={[0.12, 1.55, 0]} rotation={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[0.25, 0.02, 0.02]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Light */}
      <mesh position={[0.22, 1.5, 0]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial
          color={isDay ? '#d4d4d8' : '#fef9c3'}
          emissive={isDay ? '#000000' : '#fef9c3'}
          emissiveIntensity={isDay ? 0 : 0.5}
        />
      </mesh>
      {!isDay && <pointLight position={[0.22, 1.45, 0]} intensity={0.15} distance={3} color="#fef9c3" />}
    </group>
  );
}

/* ══════════════════════════════════════════════
   CITY ENVIRONMENT — surrounds the factory
   ══════════════════════════════════════════════ */
export function CityEnvironment({ isDay = false }: { isDay?: boolean }) {
  return (
    <group>
      {/* ── Extended ground ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={isDay ? '#4a6741' : '#1a2332'} roughness={0.95} metalness={0.05} />
      </mesh>

      {/* ── Roads ── */}
      {/* Main road (front of factory) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 5.5]} receiveShadow>
        <planeGeometry args={[30, 1.8]} />
        <meshStandardMaterial {...ROAD} />
      </mesh>
      {/* Road markings */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`mark-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-11 + i * 2, 0.008, 5.5]}>
          <planeGeometry args={[0.8, 0.04]} />
          <meshStandardMaterial color="#fef9c3" emissive="#fef9c3" emissiveIntensity={0.1} />
        </mesh>
      ))}
      {/* Side road */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-6.5, 0.005, 0]} receiveShadow>
        <planeGeometry args={[20, 1.4]} />
        <meshStandardMaterial {...ROAD} />
      </mesh>

      {/* ── Sidewalks ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 4.4]} receiveShadow>
        <planeGeometry args={[30, 0.5]} />
        <meshStandardMaterial {...SIDEWALK} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 6.6]} receiveShadow>
        <planeGeometry args={[30, 0.5]} />
        <meshStandardMaterial {...SIDEWALK} />
      </mesh>

      {/* ── Grass patches ── */}
      {[
        [-9, 0.01, 8], [5, 0.01, 8], [-9, 0.01, -5], [10, 0.01, -5],
      ].map(([x, y, z], i) => (
        <mesh key={`grass-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, y, z]} receiveShadow>
          <planeGeometry args={[3, 2]} />
          <meshStandardMaterial {...GRASS} />
        </mesh>
      ))}

      {/* ── Buildings — left side ── */}
      <Building position={[-10, 0, 8]} width={2.5} depth={2} height={4.5} style="office" isDay={isDay} />
      <Building position={[-10, 0, 3]} width={2} depth={1.8} height={2.5} style="residential" isDay={isDay} />
      <Building position={[-10, 0, -2]} width={1.8} depth={2.2} height={3.2} style="commercial" isDay={isDay} />
      <Building position={[-10, 0, -5.5]} width={2.2} depth={1.5} height={1.8} style="residential" isDay={isDay} />

      {/* ── Buildings — right side ── */}
      <Building position={[9, 0, 8]} width={2} depth={2} height={5.5} style="office" isDay={isDay} />
      <Building position={[12, 0, 8]} width={1.5} depth={1.8} height={3.8} style="office" isDay={isDay} />
      <Building position={[9, 0, -3]} width={2.5} depth={2} height={2.8} style="commercial" isDay={isDay} />
      <Building position={[12, 0, -3]} width={1.8} depth={1.5} height={4.2} style="office" isDay={isDay} />

      {/* ── Buildings — across the road ── */}
      <Building position={[-5, 0, 9]} width={3} depth={1.5} height={2.2} style="commercial" isDay={isDay} />
      <Building position={[-1, 0, 9.5]} width={2.5} depth={2} height={6} style="office" isDay={isDay} />
      <Building position={[3, 0, 9]} width={2} depth={1.8} height={3.5} style="residential" isDay={isDay} />
      <Building position={[6, 0, 9.5]} width={1.8} depth={1.5} height={4} style="office" isDay={isDay} />

      {/* ── Buildings — behind factory ── */}
      <Building position={[-4, 0, -7]} width={2} depth={1.5} height={2} style="residential" isDay={isDay} />
      <Building position={[0, 0, -7.5]} width={3} depth={2} height={3.5} style="commercial" isDay={isDay} />
      <Building position={[5, 0, -7]} width={2.2} depth={1.8} height={2.8} style="residential" isDay={isDay} />

      {/* ── Trees along roads ── */}
      {[-8, -5, -2, 1, 4, 7].map((x, i) => (
        <Tree key={`t1-${i}`} position={[x, 0, 4.2]} scale={0.8} />
      ))}
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <Tree key={`t2-${i}`} position={[x, 0, 6.8]} scale={0.7} />
      ))}

      {/* ── Palm trees (Malaysian feel) ── */}
      <PalmTree position={[-7.5, 0, 4]} />
      <PalmTree position={[6.5, 0, 4.1]} />
      <PalmTree position={[-7.2, 0, 7]} />
      <PalmTree position={[7, 0, 7.2]} />
      <PalmTree position={[11, 0, 5]} />

      {/* ── Parked cars ── */}
      <Car position={[-3, 0, 5.0]} color="#dc2626" rotation={0} />
      <Car position={[-1.5, 0, 5.0]} color="#2563eb" rotation={0} />
      <Car position={[1, 0, 5.0]} color="#f8fafc" rotation={0} />
      <Car position={[3, 0, 6.0]} color="#16a34a" rotation={Math.PI} />
      <Car position={[5, 0, 6.0]} color="#7c3aed" rotation={Math.PI} />
      <Car position={[-5, 0, 6.0]} color="#64748b" rotation={Math.PI} />

      {/* ── Street lamps ── */}
      {[-7, -3, 1, 5, 9].map((x, i) => (
        <StreetLamp key={`lamp-${i}`} position={[x, 0, 4.3]} isDay={isDay} />
      ))}
      {[-6, 0, 6].map((x, i) => (
        <StreetLamp key={`lamp2-${i}`} position={[x, 0, 6.7]} isDay={isDay} />
      ))}

      {/* ── Animated traffic — main road (z=5.2 eastbound, z=5.8 westbound) ── */}
      <TrafficCar axis="x" fixedPos={5.15} range={[-15, 15]} speed={2.8} color="#e11d48" />
      <TrafficCar axis="x" fixedPos={5.15} range={[-15, 15]} speed={3.4} color="#f8fafc" />
      <TrafficCar axis="x" fixedPos={5.85} range={[-15, 15]} speed={-2.5} color="#2563eb" />
      <TrafficCar axis="x" fixedPos={5.85} range={[-15, 15]} speed={-3.1} color="#64748b" />
      <TrafficCar axis="x" fixedPos={5.15} range={[-15, 15]} speed={1.9} color="#f59e0b" />
      <TrafficCar axis="x" fixedPos={5.85} range={[-15, 15]} speed={-2.2} color="#16a34a" />

      {/* ── Animated traffic — side road (x=-6.2 southbound, x=-6.8 northbound) ── */}
      <TrafficCar axis="z" fixedPos={-6.2} range={[-10, 10]} speed={2.0} color="#7c3aed" />
      <TrafficCar axis="z" fixedPos={-6.8} range={[-10, 10]} speed={-2.6} color="#0ea5e9" />
      <TrafficCar axis="z" fixedPos={-6.2} range={[-10, 10]} speed={1.6} color="#d4d4d8" />

      {/* ── Factory boundary fence ── */}
      {/* Front fence */}
      <mesh position={[0.5, 0.4, 3.8]} castShadow>
        <boxGeometry args={[12, 0.8, 0.04]} />
        <meshStandardMaterial color="#374151" transparent opacity={0.3} roughness={0.8} metalness={0.3} />
      </mesh>
      {/* Fence posts */}
      {[-5, -3, -1, 1, 3, 5].map((x, i) => (
        <mesh key={`fp-${i}`} position={[x, 0.45, 3.8]} castShadow>
          <boxGeometry args={[0.05, 0.9, 0.05]} />
          <meshStandardMaterial color="#4b5563" roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      {/* Gate */}
      <mesh position={[0.5, 0.5, 3.78]}>
        <boxGeometry args={[1.5, 0.06, 0.06]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* ── Factory parking lot ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3, 0.005, 3]} receiveShadow>
        <planeGeometry args={[3, 1.5]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      {/* Parking lines */}
      {[-4, -3.5, -3, -2.5, -2].map((x, i) => (
        <mesh key={`pl-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.008, 3]}>
          <planeGeometry args={[0.02, 1.2]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}
      {/* Parked employee cars */}
      <Car position={[-3.75, 0, 2.8]} color="#94a3b8" rotation={Math.PI / 2} />
      <Car position={[-3.25, 0, 2.8]} color="#1e40af" rotation={Math.PI / 2} />
      <Car position={[-2.25, 0, 2.8]} color="#b91c1c" rotation={Math.PI / 2} />
    </group>
  );
}
