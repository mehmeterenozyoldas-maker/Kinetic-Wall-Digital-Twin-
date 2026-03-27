import React, { useMemo, useRef, useLayoutEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ModuleProps } from '../types';

// ==========================================
// SHARED LOGIC
// ==========================================

const useKineticAnimation = (
  x: number, 
  y: number, 
  totalX: number, 
  totalY: number, 
  config: any
) => {
  const [hovered, setHover] = useState(false);

  // Return a function to calculate progress inside useFrame to avoid recreating hooks
  const getProgress = (time: number) => {
    const { speed, phaseOffset, manualProgress, isPaused } = config;
    if (isPaused) return manualProgress;

    const normX = x / totalX;
    const normY = y / totalY;
    const phase = (normX + normY) * Math.PI * phaseOffset;
    const sineVal = Math.sin(time * speed + phase);
    return (sineVal + 1) / 2; // 0..1
  };

  return { hovered, setHover, getProgress };
};

// ==========================================
// DESIGN 1: FOLDING STAR (Original)
// ==========================================

const createStarGeometry = (size: number) => {
  const half = size / 2;
  const t1 = [-half, half, 0, half, half, 0, 0, 0, 0];
  const t2 = [half, half, 0, half, -half, 0, 0, 0, 0];
  const t3 = [half, -half, 0, -half, -half, 0, 0, 0, 0];
  const t4 = [-half, -half, 0, -half, half, 0, 0, 0, 0];
  return new Float32Array([...t1, ...t2, ...t3, ...t4]);
};

const FoldingStar: React.FC<ModuleProps> = ({ x, y, totalX, totalY, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const { hovered, setHover, getProgress } = useKineticAnimation(x, y, totalX, totalY, config);

  const initialVertices = useMemo(() => createStarGeometry(config.size), [config.size]);
  const positionAttribute = useMemo(() => new THREE.BufferAttribute(new Float32Array(initialVertices), 3), [initialVertices]);
  const centerIndices = [2, 5, 8, 11];

  useLayoutEffect(() => {
    if (meshRef.current) meshRef.current.geometry.computeVertexNormals();
  }, [positionAttribute]);

  useFrame((state) => {
    if (!meshRef.current || !geometryRef.current) return;
    const time = state.clock.getElapsedTime();
    const progress = getProgress(time);

    // Star Folding Logic
    const currentZ = progress * config.maxHeight;
    const positions = geometryRef.current.attributes.position.array as Float32Array;
    
    for (const idx of centerIndices) {
      positions[idx * 3 + 2] = currentZ;
    }
    
    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.computeVertexNormals();

    // Secondary Animation
    meshRef.current.rotation.y = Math.sin(time * 0.5 + x * 0.2 + y * 0.2) * 0.15;

    // Hover
    const targetScale = hovered ? 1.15 : 1.0;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    
    if (materialRef.current) {
      materialRef.current.emissive.lerp(hovered ? new THREE.Color("#00aaff") : new THREE.Color("#000000"), 0.1);
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(materialRef.current.emissiveIntensity, hovered ? 0.8 : 0.0, 0.1);
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} onPointerOut={() => setHover(false)}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positionAttribute.array, 3]} count={positionAttribute.count} usage={THREE.DynamicDrawUsage} />
      </bufferGeometry>
      <meshStandardMaterial ref={materialRef} color={config.baseColor} metalness={config.metalness} roughness={config.roughness} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ==========================================
// DESIGN 2: HINGED FLAP
// ==========================================

const HingedFlap: React.FC<ModuleProps> = ({ x, y, totalX, totalY, config }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const { hovered, setHover, getProgress } = useKineticAnimation(x, y, totalX, totalY, config);

  // Translate geometry so top edge is at y=0 to act as hinge
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(config.size, config.size);
    geo.translate(0, -config.size / 2, 0); // Shift down so origin is at top edge
    return geo;
  }, [config.size]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const progress = getProgress(time);

    // Flap Rotation Logic (Rotate X)
    // Map progress 0..1 to angle 0..PI/2
    // We offset Z slightly based on rotation to give it a mechanical feel
    const targetRotation = progress * Math.PI * 0.75; 
    
    meshRef.current.rotation.x = targetRotation;
    
    // Slight Y rotation for organic wave feel
    meshRef.current.rotation.y = Math.sin(time * 0.5 + x * 0.2) * 0.1;

    // Hover
    const targetScale = hovered ? 1.05 : 1.0;
    meshRef.current.scale.setScalar(targetScale);

    if (materialRef.current) {
        materialRef.current.emissive.lerp(hovered ? new THREE.Color("#ffaa00") : new THREE.Color("#000000"), 0.1);
        materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(materialRef.current.emissiveIntensity, hovered ? 0.5 : 0.0, 0.1);
    }
  });

  // We need to offset the position because we shifted the geometry origin
  // Original center was (0,0). New origin is Top Edge.
  // To keep visual center, we move the mesh up by size/2
  return (
    <group position={[0, config.size / 2, 0]}>
        <mesh 
            ref={meshRef} 
            geometry={geometry} 
            castShadow 
            receiveShadow
            onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} 
            onPointerOut={() => setHover(false)}
        >
        <meshStandardMaterial ref={materialRef} color={config.baseColor} metalness={config.metalness} roughness={config.roughness} side={THREE.DoubleSide} />
        </mesh>
    </group>
  );
};

// ==========================================
// DESIGN 3: PISTON RIPPLE
// ==========================================

const PistonRipple: React.FC<ModuleProps> = ({ x, y, totalX, totalY, config }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const { hovered, setHover, getProgress } = useKineticAnimation(x, y, totalX, totalY, config);
  
    const geometry = useMemo(() => {
      // Hexagon cylinder
      const geo = new THREE.CylinderGeometry(config.size / 2, config.size / 2, 1, 6);
      geo.rotateX(Math.PI / 2); // Point Z
      return geo;
    }, [config.size]);
  
    useFrame((state) => {
      if (!meshRef.current) return;
      const time = state.clock.getElapsedTime();
      const progress = getProgress(time);
  
      // Piston Logic: Move in Z
      // 0..1 progress -> 0..maxHeight z-position
      const targetZ = (progress - 0.5) * config.maxHeight * 2;
      meshRef.current.position.z = targetZ;

      // Rotation
      meshRef.current.rotation.z = progress * Math.PI * 0.25;
  
      // Hover
      if (materialRef.current) {
          materialRef.current.emissive.lerp(hovered ? new THREE.Color("#ff00aa") : new THREE.Color("#000000"), 0.1);
          materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(materialRef.current.emissiveIntensity, hovered ? 0.8 : 0.0, 0.1);
      }
    });
  
    return (
      <mesh 
        ref={meshRef} 
        geometry={geometry} 
        castShadow 
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} 
        onPointerOut={() => setHover(false)}
      >
        <meshStandardMaterial ref={materialRef} color={config.baseColor} metalness={config.metalness} roughness={config.roughness} />
      </mesh>
    );
  };

// ==========================================
// MAIN COMPONENT SWITCHER
// ==========================================

export const KineticModule: React.FC<ModuleProps> = (props) => {
  const { config, x, y } = props;

  // Calculate position once here
  const totalWidth = props.totalX * (config.size + config.gap) - config.gap;
  const totalHeight = props.totalY * (config.size + config.gap) - config.gap;
  
  const posX = (x * (config.size + config.gap)) - totalWidth / 2 + (config.size / 2);
  const posY = (y * (config.size + config.gap)) - totalHeight / 2 + (config.size / 2);

  return (
    <group position={[posX, posY, 0]}>
      {config.design === 'Star' && <FoldingStar {...props} />}
      {config.design === 'Flap' && <HingedFlap {...props} />}
      {config.design === 'Ripple' && <PistonRipple {...props} />}
    </group>
  );
};
