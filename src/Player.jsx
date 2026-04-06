import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from './store';
import { getTileCoordinates } from './constants';
import * as THREE from 'three';

// 8 Token Shapes for 8 players!
function TokenShape({ typeIndex, color }) {
    const mat = <meshPhysicalMaterial 
        color={color} 
        metalness={0.1} 
        roughness={0.1} 
        clearcoat={1} 
        clearcoatRoughness={0.1} 
        transmission={0.2}
        thickness={0.5}
    />;
    
    switch(typeIndex % 8) {
        case 0: // Classic Pawn
            return (
                <group>
                    <mesh castShadow position={[0, -0.15, 0]}>
                        <cylinderGeometry args={[0.2, 0.3, 0.3, 16]} />
                        {mat}
                    </mesh>
                    <mesh castShadow position={[0, 0.15, 0]}>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        {mat}
                    </mesh>
                </group>
            );
        case 1: // Top Hat
            return (
                <group>
                    <mesh castShadow position={[0, -0.2, 0]}>
                        <cylinderGeometry args={[0.35, 0.35, 0.05, 32]} />
                        {mat}
                    </mesh>
                    <mesh castShadow position={[0, 0.05, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 0.4, 32]} />
                        {mat}
                    </mesh>
                </group>
            );
        case 2: // Abstract Car
            return (
                <group>
                    <mesh castShadow position={[0, -0.15, 0]}>
                        <boxGeometry args={[0.3, 0.15, 0.5]} />
                        {mat}
                    </mesh>
                    <mesh castShadow position={[0, -0.02, -0.05]}>
                        <boxGeometry args={[0.25, 0.15, 0.25]} />
                        {mat}
                    </mesh>
                </group>
            );
        case 3: // Pyramid
            return (
                <mesh castShadow position={[0, 0, 0]}>
                    <coneGeometry args={[0.3, 0.5, 4]} />
                    {mat}
                </mesh>
            );
        case 4: // Ring (Torus)
            return (
                <mesh castShadow position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
                    <torusGeometry args={[0.2, 0.08, 16, 32]} />
                    {mat}
                </mesh>
            );
        case 5: // Little Boat
            return (
                <group>
                    <mesh castShadow position={[0, -0.15, 0]}>
                        <boxGeometry args={[0.3, 0.1, 0.6]} />
                        {mat}
                    </mesh>
                    <mesh castShadow position={[0, 0.1, 0]}>
                        <coneGeometry args={[0.1, 0.4, 3]} />
                        {mat}
                    </mesh>
                </group>
            );
        case 6: // Diamond
            return (
                <mesh castShadow position={[0, 0, 0]}>
                    <octahedronGeometry args={[0.3]} />
                    {mat}
                </mesh>
            );
        case 7: // Abstract House/Block
            return (
                <group>
                    <mesh castShadow position={[0, -0.1, 0]}>
                        <boxGeometry args={[0.3, 0.3, 0.3]} />
                        {mat}
                    </mesh>
                    <mesh castShadow position={[0, 0.15, 0]} rotation={[0, Math.PI/4, 0]}>
                        <coneGeometry args={[0.25, 0.2, 4]} />
                        {mat}
                    </mesh>
                </group>
            );
        default:
            return null;
    }
}

function PlayerToken({ player, index, totalPlayers }) {
  const meshRef = useRef();
  const rippleRef = useRef();
  const rippleMatRef = useRef();
  
  // Trạng thái vị trí ảo của token để làm hoạt ảnh
  const visualPosRef = useRef(player.pos);
  const gameSpeed = useStore(state => state.gameSpeed);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (player.bankrupt) {
        meshRef.current.visible = false;
        if (rippleRef.current) rippleRef.current.visible = false;
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
    const hopSpeed = 6 * gameSpeed; 
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
    
    // Lấy toạ độ 2 đầu điểm để Lerp
    const [x1, y1, z1] = getTileCoordinates(currentIdx);
    const [x2, y2, z2] = getTileCoordinates(nextIdx);

    // Tính offset chống đè nhau
    const angle = (index / totalPlayers) * Math.PI * 2;
    const radius = 0.4; // Tụm lại đứng bên trong ô thay vì văng ra quá lề
    const offsetX = Math.cos(angle) * radius;
    const offsetZ = Math.sin(angle) * radius;

    // Tính độ cao nảy (Hop) hình parabol
    let hopY = isMoving ? Math.sin(fraction * Math.PI) * 0.8 : 0;

    // Hiệu ứng co giãn (Squash & Stretch) kèm Scale Up (x1.5)
    meshRef.current.scale.set(1.5 - hopY * 0.2, 1.5 + hopY * 0.3, 1.5 - hopY * 0.2);

    // Apply vị trí mới (Thêm 0.4 vào Y để đứng cao hơn một chút so với đất)
    meshRef.current.position.set(
        THREE.MathUtils.lerp(x1, x2, fraction) + offsetX, // X
        THREE.MathUtils.lerp(y1, y2, fraction) + 0.4 + hopY, // Y
        THREE.MathUtils.lerp(z1, z2, fraction) + offsetZ  // Z
    );

    // Xoay khi di chuyển
    if (isMoving) {
        meshRef.current.rotation.y += 12 * delta * gameSpeed;
    } else {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 10 * delta * gameSpeed);
    }

    // Cập nhật Vòng Ánh Sáng Lan Toả (Ripple Effect)
    if (rippleRef.current && rippleMatRef.current) {
        if (isMoving && fraction > 0.05 && fraction < 0.95) {
            rippleRef.current.visible = true;
            // Đặt vòng sáng chính tâm ô cờ vừa đi qua
            rippleRef.current.position.set(x1, 0.05, z1);
            // Phóng to dần 
            rippleRef.current.scale.setScalar(1 + fraction * 1.8);
            // Mờ dần về 0
            rippleMatRef.current.opacity = 1 - Math.pow(fraction, 2);
        } else {
            rippleRef.current.visible = false;
        }
    }
  });

    return (
        <group>
            <group ref={meshRef}>
                <TokenShape typeIndex={player.shapeId} color={player.color} />
            </group>
            {/* Vòng Ripple bám sát mặt đất của ô cờ */}
            <mesh ref={rippleRef} rotation={[-Math.PI/2, 0, 0]} visible={false}>
                <ringGeometry args={[1.0, 1.2, 32]} />
                <meshBasicMaterial ref={rippleMatRef} color={player.color} transparent opacity={1} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
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
