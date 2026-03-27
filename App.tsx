import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { Loader } from '@react-three/drei';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 p-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-light tracking-widest text-white uppercase opacity-90">
          Kinetic<span className="font-bold">Wall</span>
        </h1>
        <p className="mt-2 text-sm text-gray-400 max-w-xs font-mono">
          Interactive Digital Twin.<br/>
          Use the controls on the right to adjust parameters.
        </p>
      </div>

      <div className="absolute bottom-8 left-8 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-green-500 font-mono tracking-widest uppercase">System Online</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]} // Optimize pixel ratio for performance
        camera={{ position: [0, 0, 12], fov: 45 }}
        gl={{ antialias: true, toneMappingExposure: 1.1 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Loader />
    </div>
  );
};

export default App;
