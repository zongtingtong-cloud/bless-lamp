import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Single Lotus Petal Component
function LotusPetal({ position, rotation, scale, color }: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Breathing animation
      const breathe = Math.sin(state.clock.elapsedTime * 2) * 0.02;
      meshRef.current.scale.setScalar(1 + breathe);
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={[1, 1.5, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        side={THREE.DoubleSide}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// Lotus Center
function LotusCenter({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={ref} position={[0, 0, 0]}>
      <Sphere args={[0.3, 32, 32]}>
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffa500"
          emissiveIntensity={1}
        />
      </Sphere>
      {/* Glowing rings */}
      {[0.4, 0.5, 0.6].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.02, 16, 100]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// Complete Lotus
function Lotus({ color = '#d4a550' }: { color?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      // Floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  // Generate petal positions
  const petals = useMemo(() => {
    const result = [];
    const layers = 3;
    const petalsPerLayer = 8;

    for (let layer = 0; layer < layers; layer++) {
      for (let i = 0; i < petalsPerLayer; i++) {
        const angle = (i / petalsPerLayer) * Math.PI * 2;
        const layerOffset = layer * 0.3;
        const radius = 0.3 + layer * 0.25;
        const tilt = 0.3 + layer * 0.2;

        result.push({
          position: [
            Math.cos(angle) * radius,
            layerOffset,
            Math.sin(angle) * radius
          ] as [number, number, number],
          rotation: [
            tilt + Math.sin(angle) * 0.2,
            angle,
            Math.cos(angle) * 0.1
          ] as [number, number, number],
          scale: 0.8 - layer * 0.15
        });
      }
    }
    return result;
  }, []);

  return (
    <group ref={groupRef}>
      {petals.map((petal, i) => (
        <LotusPetal
          key={i}
          position={petal.position}
          rotation={petal.rotation}
          scale={petal.scale}
          color={color}
        />
      ))}
      <LotusCenter color={color} />
    </group>
  );
}

// Particle System
function Particles({ count = 200, color = '#d4a550' }: { count?: number; color?: string }) {
  const mesh = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random positions in a sphere
      const radius = 2 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    return { positions, velocities };
  }, [count]);

  useFrame(() => {
    if (mesh.current) {
      const positions = mesh.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < count; i++) {
        // Update positions with velocity
        positions[i * 3] += particles.velocities[i * 3];
        positions[i * 3 + 1] += particles.velocities[i * 3 + 1];
        positions[i * 3 + 2] += particles.velocities[i * 3 + 2];

        // Reset particles that go too far
        const distance = Math.sqrt(
          positions[i * 3] ** 2 +
          positions[i * 3 + 1] ** 2 +
          positions[i * 3 + 2] ** 2
        );

        if (distance > 5) {
          const radius = 2 + Math.random() * 1;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);

          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = radius * Math.cos(phi);
        }
      }

      mesh.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.05}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// Main 3D Scene Component
export default function ThreeDLotusScene({ color = '#d4a550', onClick }: {
  color?: string;
  onClick?: () => void;
}) {
  return (
    <div className="w-full h-full cursor-pointer" onClick={onClick}>
      <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color={color} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />

        <Lotus color={color} />
        <Particles color={color} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
        />

        <fog attach="fog" args={['#0a0a0a', 5, 15]} />
      </Canvas>
    </div>
  );
}
