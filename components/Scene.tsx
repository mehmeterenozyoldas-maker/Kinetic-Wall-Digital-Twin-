import React from 'react';
import { useControls, button } from 'leva';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { KineticModule } from './KineticModule';
import { WallConfig } from '../types';

export const Scene: React.FC = () => {
  // Leva Controls
  const controls = useControls('Kinetic Wall Settings', {
    design: { options: ['Star', 'Flap', 'Ripple'], value: 'Star', label: 'Design Type' },
    
    Layout: { value: '', editable: false },
    gridX: { value: 6, min: 1, max: 15, step: 1, label: 'Columns' },
    gridY: { value: 6, min: 1, max: 15, step: 1, label: 'Rows' },
    gap: { value: 0.1, min: 0, max: 0.5, step: 0.01, label: 'Gap Size' },
    size: { value: 1, min: 0.5, max: 2, step: 0.1, label: 'Module Size' },
    
    Animation: { value: '', editable: false },
    speed: { value: 1.5, min: 0.1, max: 5, step: 0.1 },
    phaseOffset: { value: 1.2, min: 0, max: 4, step: 0.1, label: 'Phase Flow' },
    maxHeight: { value: 1.2, min: 0.1, max: 3, step: 0.1, label: 'Amplitude' },
    
    Manual: { value: '', editable: false },
    isPaused: { value: false, label: 'Pause Animation' },
    manualProgress: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Open/Close' },

    Material: { value: '', editable: false },
    baseColor: { value: '#e0e0e0', label: 'Color' },
    metalness: { value: 0.9, min: 0, max: 1, step: 0.05 },
    roughness: { value: 0.2, min: 0, max: 1, step: 0.05 },
    
    reset: button(() => window.location.reload()),
  });

  // Generate the grid array
  const modules = [];
  for (let x = 0; x < controls.gridX; x++) {
    for (let y = 0; y < controls.gridY; y++) {
      modules.push({ x, y, id: `${x}-${y}` });
    }
  }

  // Cast controls to our typed interface
  const config: WallConfig = {
    ...controls,
    size: controls.size, 
    // Typescript might infer string from Leva options, so we cast if necessary, 
    // but Leva types usually align well if initialized correctly.
  } as unknown as WallConfig;

  return (
    <>
      <OrbitControls 
        makeDefault 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 1.5}
        enablePan={true}
        enableZoom={true}
        dampingFactor={0.05}
      />
      
      {/* Cinematic Lighting Setup */}
      <ambientLight intensity={0.2} color="#ffffff" />
      
      {/* Key Light - Cool Blueish */}
      <spotLight
        position={[20, 20, 20]}
        angle={0.25}
        penumbra={1}
        intensity={200}
        castShadow
        color="#dceeff"
      />
      
      {/* Rim Light - Warm */}
      <pointLight position={[-10, 0, -10]} intensity={50} color="#ffaa88" />
      
      {/* Environment for reflections */}
      <Environment preset="studio" />

      <group>
        {/* The Wall Board (Background) */}
        <mesh 
          position={[0, 0, -0.4]} 
          receiveShadow
        >
          <planeGeometry args={[
            config.gridX * (config.size + config.gap) + 2, 
            config.gridY * (config.size + config.gap) + 2
          ]} />
          <meshStandardMaterial color="#050505" roughness={0.9} metalness={0.1} />
        </mesh>

        {/* The Grid of Kinetic Modules */}
        <group>
          {modules.map((m) => (
            <KineticModule
              key={m.id}
              x={m.x}
              y={m.y}
              totalX={config.gridX}
              totalY={config.gridY}
              config={config}
            />
          ))}
        </group>
      </group>

      <ContactShadows 
        position={[0, 0, -0.3]} 
        opacity={0.6} 
        scale={50} 
        blur={2} 
        far={4} 
        resolution={256} 
        color="#000000" 
      />
    </>
  );
};
