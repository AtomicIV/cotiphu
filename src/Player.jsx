import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from './store';
import { getTileCoordinates } from './constants';
import { playHop } from './audioEngine';
import * as THREE from 'three';

const SpidermanToken = () => (
    <group scale={0.7} position={[0, -0.1, 0]}>
        <mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[0.4, 0.4, 0.4]} /><meshStandardMaterial color="#e23636" roughness={0.3} /></mesh>
        <mesh position={[-0.1, 0.65, 0.21]} castShadow><boxGeometry args={[0.15, 0.1, 0.05]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[0.1, 0.65, 0.21]} castShadow><boxGeometry args={[0.15, 0.1, 0.05]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 0.15, 0]} castShadow><boxGeometry args={[0.3, 0.5, 0.2]} /><meshStandardMaterial color="#2d52a2" /></mesh>
        <mesh position={[-0.25, 0.2, 0]} castShadow><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#e23636" /></mesh>
        <mesh position={[0.25, 0.2, 0]} castShadow><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#e23636" /></mesh>
        <mesh position={[-0.1, -0.2, 0]} castShadow><boxGeometry args={[0.13, 0.2, 0.15]} /><meshStandardMaterial color="#e23636" /></mesh>
        <mesh position={[0.1, -0.2, 0]} castShadow><boxGeometry args={[0.13, 0.2, 0.15]} /><meshStandardMaterial color="#e23636" /></mesh>
    </group>
);

const SupermanToken = () => (
    <group scale={0.7} position={[0, -0.1, 0]}>
        <mesh position={[0, 0.65, 0]} castShadow><boxGeometry args={[0.35, 0.35, 0.35]} /><meshStandardMaterial color="#f1c27d" /></mesh>
        <mesh position={[0, 0.85, 0]} castShadow><boxGeometry args={[0.37, 0.1, 0.37]} /><meshStandardMaterial color="#1f1f1f" /></mesh>
        <mesh position={[0, 0.2, 0]} castShadow><boxGeometry args={[0.35, 0.55, 0.2]} /><meshStandardMaterial color="#2980b9" /></mesh>
        <mesh position={[0, 0.3, 0.11]}><boxGeometry args={[0.2, 0.15, 0.02]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[0, 0.2, -0.15]} rotation={[0.2, 0, 0]} castShadow><boxGeometry args={[0.35, 0.7, 0.05]} /><meshStandardMaterial color="#c0392b" /></mesh>
        <mesh position={[-0.25, 0.2, 0]} castShadow><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#2980b9" /></mesh>
        <mesh position={[0.25, 0.2, 0]} castShadow><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#2980b9" /></mesh>
        <mesh position={[-0.1, -0.2, 0]} castShadow><boxGeometry args={[0.15, 0.25, 0.15]} /><meshStandardMaterial color="#c0392b" /></mesh>
        <mesh position={[0.1, -0.2, 0]} castShadow><boxGeometry args={[0.15, 0.25, 0.15]} /><meshStandardMaterial color="#c0392b" /></mesh>
    </group>
);

const HuggyWuggyToken = () => (
    <group scale={0.65} position={[0, 0.1, 0]}>
        <mesh position={[0, 0.8, 0]} castShadow><boxGeometry args={[0.6, 0.4, 0.3]} /><meshStandardMaterial color="#1a52c3" /></mesh>
        <mesh position={[0, 0.7, 0.16]}><boxGeometry args={[0.4, 0.1, 0.05]} /><meshStandardMaterial color="#ff1e42" /></mesh>
        <mesh position={[-0.15, 0.85, 0.16]}><cylinderGeometry args={[0.08, 0.08, 0.02]} rotation={[Math.PI/2, 0, 0]}/><meshStandardMaterial color="#fff" /></mesh>
        <mesh position={[-0.15, 0.85, 0.17]}><cylinderGeometry args={[0.03, 0.03, 0.02]} rotation={[Math.PI/2, 0, 0]}/><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[0.15, 0.85, 0.16]}><cylinderGeometry args={[0.08, 0.08, 0.02]} rotation={[Math.PI/2, 0, 0]}/><meshStandardMaterial color="#fff" /></mesh>
        <mesh position={[0.15, 0.85, 0.17]}><cylinderGeometry args={[0.03, 0.03, 0.02]} rotation={[Math.PI/2, 0, 0]}/><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.3, 0.6, 0.2]} /><meshStandardMaterial color="#1a52c3" /></mesh>
        <mesh position={[-0.25, 0.1, 0]} castShadow><boxGeometry args={[0.15, 0.8, 0.15]} /><meshStandardMaterial color="#1a52c3" /></mesh>
        <mesh position={[0.25, 0.1, 0]} castShadow><boxGeometry args={[0.15, 0.8, 0.15]} /><meshStandardMaterial color="#1a52c3" /></mesh>
        <mesh position={[-0.25, -0.35, 0]} castShadow><boxGeometry args={[0.2, 0.15, 0.2]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[0.25, -0.35, 0]} castShadow><boxGeometry args={[0.2, 0.15, 0.2]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[-0.1, -0.2, 0]} castShadow><boxGeometry args={[0.13, 0.4, 0.15]} /><meshStandardMaterial color="#1a52c3" /></mesh>
        <mesh position={[0.1, -0.2, 0]} castShadow><boxGeometry args={[0.13, 0.4, 0.15]} /><meshStandardMaterial color="#1a52c3" /></mesh>
    </group>
);

const IronManToken = () => (
    <group scale={0.7} position={[0, -0.1, 0]}>
        <mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[0.4, 0.4, 0.4]} /><meshStandardMaterial color="#c0392b" metalness={0.6} roughness={0.3} /></mesh>
        <mesh position={[0, 0.6, 0.15]}><boxGeometry args={[0.3, 0.3, 0.15]} /><meshStandardMaterial color="#f1c40f" metalness={0.8} roughness={0.2}/></mesh>
        <mesh position={[-0.1, 0.65, 0.23]}><boxGeometry args={[0.1, 0.05, 0.02]} /><meshBasicMaterial color="#00ffff" /></mesh>
        <mesh position={[0.1, 0.65, 0.23]}><boxGeometry args={[0.1, 0.05, 0.02]} /><meshBasicMaterial color="#00ffff" /></mesh>
        <mesh position={[0, 0.15, 0]} castShadow><boxGeometry args={[0.35, 0.5, 0.2]} /><meshStandardMaterial color="#c0392b" metalness={0.6} roughness={0.3}/></mesh>
        <mesh position={[0, 0.25, 0.11]}><cylinderGeometry args={[0.07, 0.07, 0.02]} rotation={[Math.PI/2, 0, 0]} /><meshBasicMaterial color="#00ffff" /></mesh>
        <mesh position={[-0.25, 0.2, 0]} castShadow><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#c0392b" metalness={0.6} roughness={0.3}/></mesh>
        <mesh position={[0.25, 0.2, 0]} castShadow><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#c0392b" metalness={0.6} roughness={0.3}/></mesh>
        <mesh position={[-0.1, -0.2, 0]} castShadow><boxGeometry args={[0.15, 0.2, 0.15]} /><meshStandardMaterial color="#f1c40f" metalness={0.8} roughness={0.2}/></mesh>
        <mesh position={[0.1, -0.2, 0]} castShadow><boxGeometry args={[0.15, 0.2, 0.15]} /><meshStandardMaterial color="#f1c40f" metalness={0.8} roughness={0.2}/></mesh>
    </group>
);

const BatmanToken = () => (
    <group scale={0.7} position={[0, -0.1, 0]}>
        <mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[0.35, 0.35, 0.35]} /><meshStandardMaterial color="#2d3436" /></mesh>
        <mesh position={[0, 0.5, 0.15]}><boxGeometry args={[0.25, 0.15, 0.05]} /><meshStandardMaterial color="#ffeaa7" /></mesh>
        <mesh position={[-0.12, 0.85, 0]} castShadow><coneGeometry args={[0.05, 0.2, 4]} rotation={[0, Math.PI/4, 0]} /><meshStandardMaterial color="#2d3436" /></mesh>
        <mesh position={[0.12, 0.85, 0]} castShadow><coneGeometry args={[0.05, 0.2, 4]} rotation={[0, Math.PI/4, 0]} /><meshStandardMaterial color="#2d3436" /></mesh>
        <mesh position={[-0.1, 0.65, 0.18]}><boxGeometry args={[0.1, 0.05, 0.02]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0.1, 0.65, 0.18]}><boxGeometry args={[0.1, 0.05, 0.02]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 0.15, 0]} castShadow><boxGeometry args={[0.35, 0.5, 0.25]} /><meshStandardMaterial color="#636e72" /></mesh>
        <mesh position={[0, 0.25, 0.13]}><boxGeometry args={[0.15, 0.08, 0.02]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[0, 0.25, 0.125]}><boxGeometry args={[0.2, 0.12, 0.02]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[0, 0.15, -0.15]} rotation={[0.1, 0, 0]} castShadow><boxGeometry args={[0.5, 0.8, 0.05]} /><meshStandardMaterial color="#2d3436" /></mesh>
        <mesh position={[-0.25, 0.2, 0]} castShadow><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#636e72" /></mesh>
        <mesh position={[0.25, 0.2, 0]} castShadow><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#636e72" /></mesh>
        <mesh position={[-0.1, -0.2, 0]} castShadow><boxGeometry args={[0.15, 0.2, 0.15]} /><meshStandardMaterial color="#2d3436" /></mesh>
        <mesh position={[0.1, -0.2, 0]} castShadow><boxGeometry args={[0.15, 0.2, 0.15]} /><meshStandardMaterial color="#2d3436" /></mesh>
    </group>
);

const CreeperToken = () => (
    <group scale={0.7} position={[0, -0.1, 0]}>
        <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[0.4, 0.4, 0.4]} /><meshStandardMaterial color="#2ecc71" /></mesh>
        <mesh position={[-0.1, 0.75, 0.21]}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[0.1, 0.75, 0.21]}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[0, 0.6, 0.21]}><boxGeometry args={[0.1, 0.15, 0.02]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[-0.1, 0.55, 0.21]}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[0.1, 0.55, 0.21]}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[0, 0.2, 0]} castShadow><boxGeometry args={[0.3, 0.6, 0.2]} /><meshStandardMaterial color="#2ecc71" /></mesh>
        <mesh position={[-0.1, -0.2, 0.1]} castShadow><boxGeometry args={[0.15, 0.2, 0.15]} /><meshStandardMaterial color="#27ae60" /></mesh>
        <mesh position={[0.1, -0.2, 0.1]} castShadow><boxGeometry args={[0.15, 0.2, 0.15]} /><meshStandardMaterial color="#27ae60" /></mesh>
        <mesh position={[-0.1, -0.2, -0.1]} castShadow><boxGeometry args={[0.15, 0.2, 0.15]} /><meshStandardMaterial color="#27ae60" /></mesh>
        <mesh position={[0.1, -0.2, -0.1]} castShadow><boxGeometry args={[0.15, 0.2, 0.15]} /><meshStandardMaterial color="#27ae60" /></mesh>
    </group>
);

const PikachuToken = () => (
    <group scale={0.7} position={[0, -0.1, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[0.4, 0.4, 0.4]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[-0.15, 0.8, 0]} rotation={[0, 0, 0.3]} castShadow><boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[-0.2, 0.95, 0]} rotation={[0, 0, 0.3]} castShadow><boxGeometry args={[0.11, 0.1, 0.11]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[0.15, 0.8, 0]} rotation={[0, 0, -0.3]} castShadow><boxGeometry args={[0.1, 0.4, 0.1]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[0.2, 0.95, 0]} rotation={[0, 0, -0.3]} castShadow><boxGeometry args={[0.11, 0.1, 0.11]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[-0.15, 0.4, 0.21]}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshStandardMaterial color="#e74c3c" /></mesh>
        <mesh position={[0.15, 0.4, 0.21]}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshStandardMaterial color="#e74c3c" /></mesh>
        <mesh position={[0, 0.15, 0]} castShadow><boxGeometry args={[0.3, 0.3, 0.3]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <group position={[0, 0.2, -0.15]} rotation={[0.2, 0, 0]}>
            <mesh position={[0, 0, -0.1]}><boxGeometry args={[0.05, 0.2, 0.05]} /><meshStandardMaterial color="#d35400" /></mesh>
            <mesh position={[0.1, 0.1, -0.1]}><boxGeometry args={[0.2, 0.05, 0.05]} /><meshStandardMaterial color="#f1c40f" /></mesh>
            <mesh position={[0.2, 0.2, -0.1]}><boxGeometry args={[0.05, 0.25, 0.05]} /><meshStandardMaterial color="#f1c40f" /></mesh>
            <mesh position={[0.3, 0.35, -0.1]}><boxGeometry args={[0.25, 0.1, 0.05]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        </group>
        <mesh position={[-0.1, -0.05, 0]} castShadow><boxGeometry args={[0.1, 0.1, 0.1]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[0.1, -0.05, 0]} castShadow><boxGeometry args={[0.1, 0.1, 0.1]} /><meshStandardMaterial color="#f1c40f" /></mesh>
    </group>
);

const MinionToken = () => (
    <group scale={0.7} position={[0, -0.1, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.25, 0.25, 0.5, 32]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[0, 0.65, 0]} castShadow><sphereGeometry args={[0.25, 32, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[0, 0.15, 0]} castShadow><sphereGeometry args={[0.25, 32, 16, 0, Math.PI*2, Math.PI/2, Math.PI/2]} /><meshStandardMaterial color="#2980b9" /></mesh>
        <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.26, 0.26, 0.2, 32]} /><meshStandardMaterial color="#2980b9" /></mesh>
        <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.26, 0.26, 0.05, 32]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[0, 0.55, 0.25]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.12, 0.12, 0.05, 32]} /><meshStandardMaterial color="#bdc3c7" /></mesh>
        <mesh position={[0, 0.55, 0.27]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.08, 0.08, 0.01, 32]} /><meshStandardMaterial color="#fff" /></mesh>
        <mesh position={[0, 0.55, 0.28]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.01, 32]} /><meshStandardMaterial color="#000" /></mesh>
        <mesh position={[-0.3, 0.3, 0]} rotation={[0, 0, 0.3]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.3, 16]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[0.3, 0.3, 0]} rotation={[0, 0, -0.3]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.3, 16]} /><meshStandardMaterial color="#f1c40f" /></mesh>
        <mesh position={[-0.1, -0.1, 0]} castShadow><cylinderGeometry args={[0.06, 0.06, 0.2, 16]} /><meshStandardMaterial color="#2980b9" /></mesh>
        <mesh position={[0.1, -0.1, 0]} castShadow><cylinderGeometry args={[0.06, 0.06, 0.2, 16]} /><meshStandardMaterial color="#2980b9" /></mesh>
    </group>
);

function TokenShape({ typeIndex, color }) {
    switch(typeIndex % 8) {
        case 0: return <SpidermanToken />;
        case 1: return <SupermanToken />;
        case 2: return <HuggyWuggyToken />;
        case 3: return <IronManToken />;
        case 4: return <BatmanToken />;
        case 5: return <CreeperToken />;
        case 6: return <PikachuToken />;
        case 7: return <MinionToken />;
        default: return null;
    }
}

function PlayerToken({ player, index, totalPlayers }) {
  const meshRef = useRef();
  const MAX_EFFECTS = 6;
  const effectsStateRef = useRef([...Array(MAX_EFFECTS)].map(() => ({ active: false, age: 0, x: 0, z: 0, type: 'step' })));
  const effectsGroupRef = useRef();
  
  // Trạng thái vị trí ảo của token để làm hoạt ảnh
  const visualPosRef = useRef(player.pos);
  const lastIntegerPosRef = useRef(Math.floor(player.pos));
  const isMovingLastFrame = useRef(false);
  const gameSpeed = useStore(state => state.gameSpeed);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (player.bankrupt) {
        meshRef.current.visible = false;
        if (effectsGroupRef.current) effectsGroupRef.current.visible = false;
        return;
    }
    
    // Luôn luôn đi xuôi theo 1 chiều! (Cùng chiều kim đồng hồ)
    let targetV = player.pos;
    if (targetV < visualPosRef.current) {
        let diff = visualPosRef.current - targetV;
        // Gom làm chẵn vòng wrap
        targetV += Math.ceil(diff / 24) * 24; 
    }
    
    // Cập nhật vị trí ảo
    const hopSpeed = 3.5 * gameSpeed; 
    let isMoving = false;

    if (Math.abs(targetV - visualPosRef.current) > 0.02) {
        isMoving = true;
        visualPosRef.current += 1 * hopSpeed * delta;
        
        if (visualPosRef.current > targetV) {
            visualPosRef.current = targetV;
        }
    } else {
        visualPosRef.current = targetV;
    }

    // Chuẩn hoá visualPos để tính toạ độ
    let actualVisualPos = (visualPosRef.current + 24) % 24; // đảm bảo số dương
    let currentIdx = Math.floor(actualVisualPos) % 24;
    let nextIdx = (currentIdx + 1) % 24;
    let fraction = actualVisualPos - Math.floor(actualVisualPos);
    
    if (isMoving && currentIdx !== lastIntegerPosRef.current) {
        lastIntegerPosRef.current = currentIdx;
        playHop();

        // Spawn hiệu ứng SÁNG Ô vừa đi qua
        const eff = effectsStateRef.current.find(e => !e.active);
        if (eff) {
            const [sx, sy, sz] = getTileCoordinates(currentIdx);
            eff.active = true;
            eff.age = 0;
            eff.x = sx;
            eff.z = sz;
            eff.type = 'step';
        }
    }

    // Spawn hiệu ứng ĐÁP ĐẤT MẠNH (LOÉ SÁNG RỘNG)
    if (!isMoving && isMovingLastFrame.current) {
        const eff = effectsStateRef.current.find(e => !e.active);
        if (eff) {
            const [sx, sy, sz] = getTileCoordinates(targetV % 24);
            eff.active = true;
            eff.age = 0;
            eff.x = sx;
            eff.z = sz;
            eff.type = 'land';
        }
    }
    isMovingLastFrame.current = isMoving;

    // Cập nhật mảng Effects Độc Lập
    if (effectsGroupRef.current) {
        effectsStateRef.current.forEach((eff, i) => {
            const child = effectsGroupRef.current.children[i];
            if (!child) return;
            
            if (eff.active) {
                eff.age += delta * 3.0; // Tốc độ fade
                if (eff.age > 1) {
                    eff.active = false;
                    child.visible = false;
                } else {
                    child.visible = true;
                    child.position.set(eff.x, 0.05, eff.z);
                    if (eff.type === 'step') {
                        child.scale.setScalar(1 + eff.age * 0.4); // Nở ra xíu
                        child.material.opacity = (1 - eff.age) * 0.6;
                    } else { // Land 
                        child.scale.setScalar(1 + eff.age * 1.5); // Bung bự hơn
                        child.material.opacity = (1 - eff.age) * 1.0;
                    }
                }
            }
        });
    }

    // Lấy toạ độ 2 đầu điểm để Lerp
    const [x1, y1, z1] = getTileCoordinates(currentIdx);
    const [x2, y2, z2] = getTileCoordinates(nextIdx);

    // Tính offset chống đè nhau
    const angle = (index / totalPlayers) * Math.PI * 2;
    const radius = 0.4;
    const offsetX = Math.cos(angle) * radius;
    const offsetZ = Math.sin(angle) * radius;

    let hopY = isMoving ? Math.sin(fraction * Math.PI) * 0.8 : 0;

    meshRef.current.scale.set(1.5 - hopY * 0.2, 1.5 + hopY * 0.3, 1.5 - hopY * 0.2);

    meshRef.current.position.set(
        THREE.MathUtils.lerp(x1, x2, fraction) + offsetX, 
        THREE.MathUtils.lerp(y1, y2, fraction) + 0.4 + hopY, 
        THREE.MathUtils.lerp(z1, z2, fraction) + offsetZ  
    );

    if (isMoving) {
        meshRef.current.rotation.y += 12 * delta * gameSpeed;
    } else {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 10 * delta * gameSpeed);
    }
  });

  return (
    <>
      <group ref={effectsGroupRef}>
          {effectsStateRef.current.map((_, i) => (
             <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                 <planeGeometry args={[2.0, 2.0]} />
                 <meshBasicMaterial color={player.color} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
             </mesh>
          ))}
      </group>
      
      <group ref={meshRef}>
        <TokenShape typeIndex={player.shapeId} color={player.color} />
      </group>
    </>
  );
}

export default function Players() {
    const players = useStore(state => state.players);
    const activePlayersCount = players.filter(p => !p.bankrupt).length || 1;

    return (
        <group>
            {players.map((p, i) => (
                <PlayerToken key={p.id} player={p} index={i} totalPlayers={activePlayersCount} />
            ))}
        </group>
    );
}
