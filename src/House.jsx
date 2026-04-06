import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function House({ color = "#e74c3c" }) {
  const houseRef = useRef();
  
  // Animation mọc lên nhẹ nhàng khi mới được mua
  useFrame(() => {
    if (houseRef.current.scale.y < 1) {
        houseRef.current.scale.y += 0.05;
        houseRef.current.scale.x += 0.05;
        houseRef.current.scale.z += 0.05;
    }
  });

  return (
    <group ref={houseRef} position={[0, -0.05, 0]} scale={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
      {/* Tường nhà */}
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
        <meshStandardMaterial color="#fdf5e6" roughness={0.7} />
      </mesh>

      {/* Mái nhà (Hình lăng trụ tam giác) */}
      <mesh castShadow receiveShadow position={[0, 0.55, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0, 0.5, 0.3, 4, 1]} />
        {/* Màu mái theo màu đất đai để dễ phân biệt, hoặc đỏ mặc định */}
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>

      {/* Ống khói */}
      <mesh castShadow receiveShadow position={[0.2, 0.6, -0.1]}>
        <boxGeometry args={[0.08, 0.3, 0.08]} />
        <meshStandardMaterial color="#a0522d" roughness={0.8} />
      </mesh>

      {/* Cửa chính */}
      <mesh position={[0, 0.15, 0.26]}>
        <boxGeometry args={[0.15, 0.3, 0.02]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Núm cửa */}
      <mesh position={[0.05, 0.15, 0.27]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#f1c40f" metalness={0.8} />
      </mesh>

      {/* Cửa sổ 1 */}
      <group position={[-0.15, 0.25, 0.25]}>
        <mesh>
          <boxGeometry args={[0.15, 0.15, 0.02]} />
          <meshStandardMaterial color="#3498db" emissive="#3498db" emissiveIntensity={0.5} opacity={0.8} transparent />
        </mesh>
        {/* Khung cửa sổ */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.17, 0.02, 0.02]} />
          <meshStandardMaterial color="#ecf0f1" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.02, 0.17, 0.02]} />
          <meshStandardMaterial color="#ecf0f1" />
        </mesh>
      </group>

      {/* Cửa sổ 2 */}
      <group position={[0.15, 0.25, 0.25]}>
        <mesh>
          <boxGeometry args={[0.15, 0.15, 0.02]} />
          <meshStandardMaterial color="#3498db" emissive="#3498db" emissiveIntensity={0.5} opacity={0.8} transparent />
        </mesh>
        {/* Khung */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.17, 0.02, 0.02]} />
          <meshStandardMaterial color="#ecf0f1" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.02, 0.17, 0.02]} />
          <meshStandardMaterial color="#ecf0f1" />
        </mesh>
      </group>
    </group>
  );
}
