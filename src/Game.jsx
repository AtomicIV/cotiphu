import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import Board from './Board';
import Player from './Player';
import EffectsManager from './Effects';

export default function Game() {
  return (
    <div className="canvas-container">
      <Canvas shadows>
        {/* Isometric Camera setup */}
        <OrthographicCamera
            makeDefault
            position={[15, 15, 15]}
            zoom={32}
        />
        
        {/* Khóa camera góc Isometric, kéo thả được nhưng góc bị fix */}
        <OrbitControls 
            enableDamping 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 4} 
            minAzimuthAngle={Math.PI / 4}
            maxAzimuthAngle={Math.PI / 4}
            enableRotate={false}
        />

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
            castShadow 
            position={[5, 10, 5]} 
            intensity={1.5} 
            shadow-mapSize={[2048, 2048]} 
        />
        
        {/* Game Elements */}
        <group position={[0, -0.5, 0]}>
            <Board />
            <Player />
            <EffectsManager />
        </group>
        
        {/* Môi trường chiếu sáng */}
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
