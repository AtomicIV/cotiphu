import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function TileIcon3D({ type, color, id }) {
    const groupRef = useRef();

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        // Float and spin gently
        groupRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 2 + type.length) * 0.05;
        
        if (type !== 'jail' && type !== 'parking') {
            groupRef.current.rotation.y += delta;
        }
    });

    // Material helpers 
    const gold = <meshStandardMaterial color="#f1c40f" metalness={0.8} roughness={0.2} />;
    const shiny = (c) => <meshStandardMaterial color={c} metalness={0.5} roughness={0.2} />;
    const dull = (c) => <meshStandardMaterial color={c} metalness={0.1} roughness={0.8} />;

    return (
        <group position={[0, 0.4, 0]} scale={[1.2, 1.2, 1.2]} ref={groupRef}>
            {(() => {
                switch (type) {
                    case 'start':
                        // Arrow pointing forward
                        return (
                            <group rotation={[-Math.PI/2, 0, 0]}>
                                <mesh castShadow position={[0, 0.1, 0]}>
                                    <coneGeometry args={[0.2, 0.4, 3]} />
                                    {shiny('#2ecc71')}
                                </mesh>
                            </group>
                        );
                    case 'tax':
                        // Gold Coin
                        return (
                            <mesh castShadow rotation={[Math.PI/2, 0, 0]}>
                                <cylinderGeometry args={[0.2, 0.2, 0.05, 32]} />
                                {gold}
                            </mesh>
                        );
                    case 'chance':
                        // Gift Box
                        return (
                            <group>
                                <mesh castShadow>
                                    <boxGeometry args={[0.25, 0.25, 0.25]} />
                                    {shiny('#3498db')}
                                </mesh>
                                {/* Ribbon */}
                                <mesh position={[0,0.13,0]}>
                                    <boxGeometry args={[0.26, 0.02, 0.05]} />
                                    {dull('#e74c3c')}
                                </mesh>
                                <mesh position={[0,0.13,0]}>
                                    <boxGeometry args={[0.05, 0.02, 0.26]} />
                                    {dull('#e74c3c')}
                                </mesh>
                            </group>
                        );
                    case 'chest':
                        // Treasure Chest
                        return (
                            <group>
                                <mesh castShadow position={[0, -0.05, 0]}>
                                    <boxGeometry args={[0.3, 0.15, 0.2]} />
                                    {dull('#8e44ad')}
                                </mesh>
                                <mesh castShadow position={[0, 0.025, 0]} rotation={[0,0,Math.PI/2]}>
                                    <cylinderGeometry args={[0.1, 0.1, 0.3, 16, 1, false, 0, Math.PI]} />
                                    {dull('#9b59b6')}
                                </mesh>
                            </group>
                        );
                    case 'station':
                        // Simple Train/Bus
                        return (
                            <group>
                                <mesh castShadow position={[0, -0.05, 0]}>
                                    <boxGeometry args={[0.4, 0.15, 0.2]} />
                                    {shiny('#34495e')}
                                </mesh>
                                <mesh castShadow position={[-0.05, 0.1, 0]}>
                                    <boxGeometry args={[0.2, 0.15, 0.2]} />
                                    {shiny('#2c3e50')}
                                </mesh>
                            </group>
                        );
                    case 'jail':
                        // Prison Bars
                        return (
                            <group position={[0, -0.1, 0]}>
                                {[-0.1, 0, 0.1].map((x, i) => (
                                    <mesh key={i} castShadow position={[x, 0, 0.1]}>
                                        <cylinderGeometry args={[0.015, 0.015, 0.4]} />
                                        {dull('#7f8c8d')}
                                    </mesh>
                                ))}
                            </group>
                        );
                    case 'gojail':
                        // Police Siren
                        return (
                            <group>
                                <mesh castShadow position={[0, -0.05, 0]}>
                                    <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
                                    {dull('#34495e')}
                                </mesh>
                                <mesh position={[0, 0.05, 0]}>
                                    <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
                                    <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={2} />
                                </mesh>
                            </group>
                        );
                    case 'parking':
                        // Traffic Cone
                        return (
                            <mesh castShadow position={[0, -0.1, 0]}>
                                <coneGeometry args={[0.15, 0.4, 16]} />
                                {shiny('#e67e22')}
                            </mesh>
                        );
                    case 'property':
                        if (id === 1 || id === 19) {
                            // Cụm Toà tháp chọc trời (Hà Nội, TpHCM)
                            return (
                                <group position={[0, -0.05, 0]}>
                                    <mesh castShadow position={[-0.1, 0.15, 0]}>
                                        <boxGeometry args={[0.15, 0.3, 0.15]} />
                                        {shiny(color)}
                                    </mesh>
                                    <mesh castShadow position={[0.1, 0.25, 0]}>
                                        <boxGeometry args={[0.15, 0.5, 0.15]} />
                                        {shiny(color)}
                                    </mesh>
                                </group>
                            );
                        } else if (id === 5 || id === 11) {
                            // Đồi thông (Đà Lạt, Quảng Ninh)
                            return (
                                <group position={[0, 0, 0]}>
                                    <mesh castShadow position={[0.1, 0.1, 0.1]}>
                                        <coneGeometry args={[0.1, 0.3, 5]} />
                                        {shiny('#2ecc71')}
                                    </mesh>
                                    <mesh castShadow position={[-0.05, 0.2, -0.05]}>
                                        <coneGeometry args={[0.15, 0.4, 5]} />
                                        {shiny('#27ae60')}
                                    </mesh>
                                </group>
                            );
                        } else if (id === 10 || id === 23) {
                            // Cây dù biển / Bãi tắm (Nha Trang, Phú Quốc)
                            return (
                                <group position={[0, 0, 0]}>
                                    <mesh castShadow position={[0, 0, 0]}>
                                        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
                                        {dull('#bdc3c7')}
                                    </mesh>
                                    <mesh castShadow position={[0, 0.15, 0]}>
                                        <coneGeometry args={[0.2, 0.05, 16]} />
                                        {shiny('#e74c3c')}
                                    </mesh>
                                </group>
                            );
                        } else if (id === 9) {
                            // Đèn lồng Hội An
                            return (
                                <mesh castShadow position={[0, 0.1, 0]}>
                                    <sphereGeometry args={[0.15, 16, 16]} />
                                    <meshStandardMaterial color="#e67e22" emissive="#d35400" emissiveIntensity={0.5} roughness={0.3} />
                                </mesh>
                            );
                        } else if (id === 3 || id === 13) {
                            // Ngọn hải đăng biển (Hải Phòng, Vũng Tàu)
                            return (
                                <group>
                                    <mesh castShadow position={[0, 0.15, 0]}>
                                        <cylinderGeometry args={[0.06, 0.1, 0.3]} />
                                        {dull('#ecf0f1')}
                                    </mesh>
                                    <mesh castShadow position={[0, 0.33, 0]}>
                                        <sphereGeometry args={[0.05]} />
                                        {shiny('#f1c40f')}
                                    </mesh>
                                </group>
                            );
                        } else if (id === 15 || id === 16) {
                            // Khu Công Nghiệp (Đồng Nai, Bình Dương)
                            return (
                                <group position={[0, -0.05, 0]}>
                                    <mesh castShadow position={[0, 0.1, 0]}>
                                        <boxGeometry args={[0.25, 0.2, 0.2]} />
                                        {dull('#95a5a6')}
                                    </mesh>
                                    <mesh castShadow position={[0.05, 0.25, 0]}>
                                        <cylinderGeometry args={[0.03, 0.03, 0.2]} />
                                        {dull('#7f8c8d')}
                                    </mesh>
                                </group>
                            );
                        }
                        
                        // Mặc định (Float Crystal)
                        return (
                            <mesh castShadow position={[0, 0.1, 0]}>
                                <octahedronGeometry args={[0.15]} />
                                {shiny(color)}
                            </mesh>
                        );
                }
            })()}
        </group>
    );
}
