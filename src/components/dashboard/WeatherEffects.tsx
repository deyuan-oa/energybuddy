import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ══════════════════════════════════════════════
   RAIN PARTICLES — instanced falling drops
   ══════════════════════════════════════════════ */
export function RainParticles({ intensity = 1.0 }: { intensity?: number }) {
  const count = Math.floor(800 * intensity);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const drops = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 30,
      z: (Math.random() - 0.5) * 30,
      y: Math.random() * 12,
      speed: 6 + Math.random() * 4,
      length: 0.15 + Math.random() * 0.15,
    })),
    [count]
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    drops.forEach((d, i) => {
      d.y -= d.speed * delta;
      if (d.y < -0.5) {
        d.y = 10 + Math.random() * 3;
        d.x = (Math.random() - 0.5) * 30;
        d.z = (Math.random() - 0.5) * 30;
      }
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.set(0.01, d.length, 0.01);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[1, 1, 1, 4]} />
      <meshBasicMaterial color="#a0c4e8" transparent opacity={0.35} />
    </instancedMesh>
  );
}

/* ══════════════════════════════════════════════
   CLOUD SHADOWS — slow-moving dark patches on ground
   ══════════════════════════════════════════════ */
export function CloudShadows() {
  const group = useRef<THREE.Group>(null);

  const clouds = useMemo(() => [
    { x: -5, z: 2, size: 6, speed: 0.15, phase: 0 },
    { x: 4, z: -3, size: 5, speed: 0.12, phase: 1.5 },
    { x: -2, z: 7, size: 4, speed: 0.18, phase: 3.0 },
    { x: 8, z: 5, size: 3.5, speed: 0.1, phase: 4.5 },
  ], []);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((child, i) => {
      const c = clouds[i];
      // Drift slowly across the ground
      child.position.x = c.x + Math.sin(t * c.speed + c.phase) * 4;
      child.position.z = c.z + Math.cos(t * c.speed * 0.7 + c.phase) * 3;
    });
  });

  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[c.x, 0.03, c.z]}
          receiveShadow
        >
          <circleGeometry args={[c.size, 16]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════
   OVERHEAD CLOUDS — volumetric-ish floating shapes
   ══════════════════════════════════════════════ */
export function OverheadClouds() {
  const group = useRef<THREE.Group>(null);

  const clouds = useMemo(() => [
    { x: -6, z: 0, y: 10, scaleX: 5, scaleZ: 3, speed: 0.08, phase: 0 },
    { x: 3, z: -4, y: 11, scaleX: 4, scaleZ: 3.5, speed: 0.06, phase: 2 },
    { x: -1, z: 6, y: 9.5, scaleX: 6, scaleZ: 2.5, speed: 0.1, phase: 4 },
    { x: 7, z: 3, y: 10.5, scaleX: 3.5, scaleZ: 2, speed: 0.07, phase: 1 },
    { x: -4, z: -5, y: 11.5, scaleX: 4.5, scaleZ: 3, speed: 0.09, phase: 3 },
  ], []);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((child, i) => {
      const c = clouds[i];
      child.position.x = c.x + Math.sin(t * c.speed + c.phase) * 5;
      child.position.z = c.z + Math.cos(t * c.speed * 0.6 + c.phase) * 3;
    });
  });

  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]}>
          <boxGeometry args={[c.scaleX, 0.4, c.scaleZ]} />
          <meshStandardMaterial
            color="#d1d5db"
            transparent
            opacity={0.5}
            depthWrite={false}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════
   RAIN PUDDLES — reflective patches on the ground
   ══════════════════════════════════════════════ */
export function RainPuddles() {
  const puddles = useMemo(() => [
    { x: -2, z: 3, size: 1.2, elongation: 1.3 },
    { x: 1.5, z: 1, size: 0.8, elongation: 1.0 },
    { x: -4, z: -1, size: 1.0, elongation: 1.5 },
    { x: 3, z: 2.5, size: 0.7, elongation: 1.1 },
    { x: 0, z: -2, size: 1.4, elongation: 1.2 },
    { x: -1, z: 5.5, size: 1.1, elongation: 0.9 },
    { x: 4, z: 5.3, size: 0.9, elongation: 1.4 },
    { x: -5, z: 5.7, size: 0.6, elongation: 1.0 },
    { x: 2, z: -1.5, size: 0.5, elongation: 1.2 },
    { x: -6.5, z: 1, size: 0.8, elongation: 1.3 },
  ], []);

  // Animate subtle ripple effect via opacity fluctuation
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
      if (mat) {
        mat.opacity = 0.55 + Math.sin(t * 1.5 + i * 0.8) * 0.1;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {puddles.map((p, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, i * 1.1]}
          position={[p.x, 0.015, p.z]}
          scale={[1, p.elongation, 1]}
        >
          <circleGeometry args={[p.size, 24]} />
          <meshPhysicalMaterial
            color="#1e3a5f"
            metalness={0.9}
            roughness={0.05}
            transparent
            opacity={0.6}
            depthWrite={false}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}
