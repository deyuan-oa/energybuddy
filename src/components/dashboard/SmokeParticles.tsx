import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SmokeParticlesProps {
  position: [number, number, number];
  count?: number;
  spread?: number;
  speed?: number;
  height?: number;
  opacity?: number;
  size?: number;
  color?: string;
}

/**
 * Animated smoke/steam particles rising from a point.
 * Uses instanced meshes for performance.
 */
export function SmokeParticles({
  position,
  count = 20,
  spread = 0.15,
  speed = 0.3,
  height = 1.5,
  opacity = 0.25,
  size = 0.08,
  color = '#cbd5e1',
}: SmokeParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Each particle gets a random phase, drift, and speed multiplier
  const particles = useMemo(() =>
    Array.from({ length: count }, () => ({
      phase: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * spread * 2,
      driftZ: (Math.random() - 0.5) * spread * 2,
      speedMul: 0.6 + Math.random() * 0.8,
      sizeMul: 0.5 + Math.random() * 1.0,
    })),
    [count, spread]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    particles.forEach((p, i) => {
      // Normalized lifecycle [0..1] repeating
      const life = ((t * speed * p.speedMul + p.phase) % height) / height;

      // Rise upward
      const y = life * height;

      // Drift outward as it rises
      const driftScale = life * 1.5;
      const x = p.driftX * driftScale + Math.sin(t * 0.5 + p.phase) * 0.03;
      const z = p.driftZ * driftScale + Math.cos(t * 0.4 + p.phase) * 0.03;

      // Scale: grow then shrink
      const s = size * p.sizeMul * (1 + life * 2) * (1 - life * 0.3);

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}
