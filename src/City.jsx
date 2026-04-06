import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from './store';

function Skyscraper({ position, scale, color }) {
    const glowRef = useRef();
    const gameSpeed = useStore(state => state.gameSpeed);

    useFrame((state) => {
        if (glowRef.current) {
            glowRef.current.position.y = (Math.sin(state.clock.elapsedTime * gameSpeed + position[0]) * 0.5 + 0.5) * scale[1];
        }
    });

    return (
        <group position={position}>
            {/* Thân toà nhà */}
            <mesh position={[0, scale[1] / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={scale} />
                <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.1} transparent opacity={0.9} clearcoat={1} />
            </mesh>
            {/* Vòng sáng viền quét dọc toà nhà */}
            <mesh position={[0, scale[1] / 2, 0]} scale={[1.05, 0.02, 1.05]} ref={glowRef}>
                <boxGeometry args={[scale[0], 1, scale[2]]} />
                <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={2} transparent opacity={0.7} />
            </mesh>
            {/* Ăng ten */}
            <mesh position={[0, scale[1] + 0.3, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.6]} />
                <meshStandardMaterial color="#bdc3c7" />
            </mesh>
            <mesh position={[0, scale[1] + 0.6, 0]}>
                <sphereGeometry args={[0.06]} />
                <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={3} />
            </mesh>
        </group>
    );
}

function HoverCar({ radius, speed, y, color }) {
    const ref = useRef();
    const gameSpeed = useStore(state => state.gameSpeed);

    useFrame((state) => {
        if (!ref.current) return;
        const angle = state.clock.elapsedTime * speed * gameSpeed;
        ref.current.position.x = Math.cos(angle) * radius;
        ref.current.position.z = Math.sin(angle) * radius;
        ref.current.rotation.y = -angle; // Quay đầu xe hướng đi tới
    });

    return (
        <group position={[radius, y, 0]} ref={ref}>
            <mesh castShadow>
                <boxGeometry args={[0.2, 0.1, 0.4]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Kính xe */}
            <mesh position={[0, 0.05, 0.05]}>
                <boxGeometry args={[0.15, 0.08, 0.15]} />
                <meshStandardMaterial color="#ecf0f1" transparent opacity={0.8} />
            </mesh>
            {/* Đèn pha */}
            <mesh position={[0, 0, 0.2]}>
                <boxGeometry args={[0.16, 0.05, 0.05]} />
                <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
            </mesh>
            {/* Động cơ phản lực */}
            <mesh position={[0, 0, -0.2]}>
                <boxGeometry args={[0.16, 0.05, 0.05]} />
                <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={4} />
            </mesh>
        </group>
    );
}

export default function City() {
  return (
    <group position={[0, 0, 0]}>
      {/* Nền bệ bê tông công nghệ lõi */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[10.5, 0.05, 10.5]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.6} metalness={0.5} />
      </mesh>
      
      {/* Lưới sáng Neon trên nền */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10, 10, 10]} />
        <meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Cụm Toà tháp trung tâm */}
      <Skyscraper position={[0, 0.05, 0]} scale={[2, 4, 2]} color="#0e1726" />
      <Skyscraper position={[2.5, 0.05, 2.5]} scale={[1.2, 2.5, 1.2]} color="#172b4d" />
      <Skyscraper position={[-2.5, 0.05, 2.5]} scale={[1.5, 3.2, 1.5]} color="#0a192f" />
      <Skyscraper position={[3, 0.05, -3]} scale={[1, 2.8, 1]} color="#112240" />
      <Skyscraper position={[-3, 0.05, -3]} scale={[1.4, 3.5, 1.4]} color="#091e3b" />
      <Skyscraper position={[3.5, 0.05, 0]} scale={[1, 2, 1.5]} color="#172b4d" />
      <Skyscraper position={[-3.5, 0.05, 0]} scale={[1.2, 2.2, 1]} color="#0e1726" />

      {/* Xe bay lượn lờ dạo phố */}
      <HoverCar radius={4} speed={0.8} y={0.8} color="#e74c3c" />
      <HoverCar radius={3.5} speed={-1.2} y={1.5} color="#f1c40f" />
      <HoverCar radius={4.5} speed={0.6} y={0.5} color="#2ecc71" />
      <HoverCar radius={2.8} speed={-0.9} y={2.2} color="#9b59b6" />
    </group>
  );
}
