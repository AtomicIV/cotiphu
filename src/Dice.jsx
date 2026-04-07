import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from './store';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

const getTargetRotation = (roll) => {
    switch(roll) {
        case 1: return [0, 0, 0];
        case 2: return [-Math.PI / 2, 0, 0];
        case 3: return [0, 0, Math.PI / 2];
        case 4: return [0, 0, -Math.PI / 2];
        case 5: return [Math.PI / 2, 0, 0];
        case 6: return [Math.PI, 0, 0];
        default: return [0, 0, 0];
    }
}

function Dot({ position, rotation, color = "#111111", radius = 0.09 }) {
    return (
        <mesh position={position} rotation={rotation || [0, 0, 0]} castShadow>
            <cylinderGeometry args={[radius, radius, 0.02, 32]} />
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
        </mesh>
    );
}

// Dynamic shadow that follows the dice on the floor
function DiceShadow({ diceRef }) {
    const shadowRef = useRef();

    useFrame(() => {
        if (!diceRef.current || !shadowRef.current) return;
        
        const dicePos = diceRef.current.position;
        
        // Shadow follows dice X/Z on the floor
        shadowRef.current.position.x = dicePos.x;
        shadowRef.current.position.z = dicePos.z;
        
        // Scale shadow based on dice height — closer to ground = bigger & darker
        const height = Math.max(dicePos.y, 0.5);
        const maxHeight = 12;
        const t = Math.min(height / maxHeight, 1); // 0 = ground, 1 = very high
        
        // Shadow gets smaller and more transparent as dice goes higher
        const scale = 1.8 - t * 1.2; // 1.8 on ground → 0.6 very high
        const opacity = 0.45 - t * 0.35; // 0.45 on ground → 0.1 very high
        
        shadowRef.current.scale.set(scale, 1, scale);
        shadowRef.current.material.opacity = Math.max(opacity, 0.05);
    });

    return (
        <mesh ref={shadowRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.8, 32]} />
            <meshBasicMaterial 
                color="#000000" 
                transparent 
                opacity={0.35}
                depthWrite={false}
            />
        </mesh>
    );
}

export default function Dice() {
    const { currentRoll, isRollingDice, gameSpeed } = useStore();
    const meshRef = useRef();
    const shockRef = useRef();
    const [shock, setShock] = useState(false);

    // Core physical vectors
    const velocity = useRef(new THREE.Vector3(0, 0, 0));
    const rotVelocity = useRef(new THREE.Vector3(0, 0, 0));
    
    // Scale tracking
    const DICE_SCALE = 1.3;
    const REST_Y = DICE_SCALE * 0.5;
    
    // Zone bounds (matches the 10x10 zone on the board, minus dice half-size)
    const ZONE_BOUNDS = 4.3;

    React.useEffect(() => {
        if (isRollingDice && meshRef.current) {
            const powerMult = 1.2;
            
            velocity.current.set(
                 (Math.random() - 0.5) * 15 * powerMult,
                 12 + Math.random() * 5 * powerMult,
                 (Math.random() - 0.5) * 15 * powerMult
            );
            
            rotVelocity.current.set(
                 (Math.random() - 0.5) * 30 * powerMult,
                 (Math.random() - 0.5) * 30 * powerMult,
                 (Math.random() - 0.5) * 30 * powerMult
            );
        } else if (!isRollingDice && currentRoll > 0) {
            // Dice stopped rolling! Trigger shockwave!
            setShock(true);
            setTimeout(() => setShock(false), 800);
            if (shockRef.current && meshRef.current) {
                shockRef.current.scale.set(1, 1, 1);
                shockRef.current.material.opacity = 0.8;
                shockRef.current.position.set(meshRef.current.position.x, 0.02, meshRef.current.position.z);
            }
        }
    }, [isRollingDice, currentRoll]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        const dt = Math.min(delta, 0.1) * gameSpeed;

        if (shock && shockRef.current) {
            shockRef.current.scale.x += dt * 8;
            shockRef.current.scale.y += dt * 8; // Because it's rotated X, y scale is Z axis
            shockRef.current.material.opacity = Math.max(0, shockRef.current.material.opacity - dt * 1.5);
        }

        if (isRollingDice) {
            // Apply Gravity
            velocity.current.y -= 35 * dt; 
            
            // Apply velocity to position
            meshRef.current.position.addScaledVector(velocity.current, dt);
            
            // Apply rotational velocity via quaternion (avoids gimbal lock)
            const angVel = new THREE.Vector3().copy(rotVelocity.current).multiplyScalar(dt);
            const rLen = angVel.length();
            if (rLen > 0.0001) {
                const deltaQ = new THREE.Quaternion().setFromAxisAngle(angVel.normalize(), rLen);
                meshRef.current.quaternion.premultiply(deltaQ);
                meshRef.current.quaternion.normalize();
            }

            // Calculate exact height of rotated cube corners to avoid clipping
            const matrix = new THREE.Matrix4().makeRotationFromQuaternion(meshRef.current.quaternion);
            const e = matrix.elements; 
            const targetY = REST_Y * (Math.abs(e[1]) + Math.abs(e[5]) + Math.abs(e[9]));

            // FLOOR COLLISION
            if (meshRef.current.position.y < targetY) {
                meshRef.current.position.y = targetY;
                velocity.current.y *= -0.6; // Nảy
                velocity.current.x *= 0.8;  // Ma sát ngang
                velocity.current.z *= 0.8;
                rotVelocity.current.multiplyScalar(0.8); // Ma sát xoay
                
                // Add a bit of chaotic torque when hitting a corner
                if (velocity.current.y > 1) {
                    rotVelocity.current.x += (Math.random() - 0.5) * 10;
                    rotVelocity.current.z += (Math.random() - 0.5) * 10;
                }
            }
            
            // BOUNDARY COLLISION — confined to the dice zone
            if (Math.abs(meshRef.current.position.x) > ZONE_BOUNDS) {
                meshRef.current.position.x = Math.sign(meshRef.current.position.x) * ZONE_BOUNDS;
                velocity.current.x *= -0.7;
            }
            if (Math.abs(meshRef.current.position.z) > ZONE_BOUNDS) {
                meshRef.current.position.z = Math.sign(meshRef.current.position.z) * ZONE_BOUNDS;
                velocity.current.z *= -0.7;
            }

            // Phụ hoạ: To lên đỉnh khi đang bay cao
            const targetScale = DICE_SCALE * (1 + velocity.current.length() * 0.02);
            meshRef.current.scale.setScalar(THREE.MathUtils.damp(meshRef.current.scale.x, targetScale, 10, dt));

        } else if (currentRoll > 0) {
            // Đã tung xong -> Tìm góc xoay đúng
            const [tx, ty, tz] = getTargetRotation(currentRoll);
            const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(tx, ty, tz));
            
            // Xoay mượt về đích (Slerp)
            meshRef.current.quaternion.slerp(targetQ, dt * 12); // Nhanh hơn 1 xíu để nằm bẹp kịp

            const matrix = new THREE.Matrix4().makeRotationFromQuaternion(meshRef.current.quaternion);
            const e = matrix.elements;
            const targetY = REST_Y * (Math.abs(e[1]) + Math.abs(e[5]) + Math.abs(e[9]));
            
            velocity.current.y -= 35 * dt;
            meshRef.current.position.addScaledVector(velocity.current, dt);
            
            velocity.current.x = THREE.MathUtils.damp(velocity.current.x, 0, 8, dt);
            velocity.current.z = THREE.MathUtils.damp(velocity.current.z, 0, 8, dt);
            
            if (meshRef.current.position.y < targetY) {
                meshRef.current.position.y = targetY;
                velocity.current.y *= -0.4;
                if (Math.abs(velocity.current.y) < 0.5) velocity.current.y = 0;
            }

            meshRef.current.scale.setScalar(THREE.MathUtils.damp(meshRef.current.scale.x, DICE_SCALE, 10, dt));
        }
    });

    if (currentRoll === 0 && !isRollingDice) return null;

    const D = 0.501;

    return (
        <>
            {/* Dynamic floor shadow */}
            <DiceShadow diceRef={meshRef} />
            
            {shock && (
                <mesh ref={shockRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.5, 2.0, 32]} />
                    <meshBasicMaterial color="#f1c40f" transparent opacity={0.8} depthWrite={false} />
                </mesh>
            )}

            <group ref={meshRef} position={[0, REST_Y, 0]} castShadow>
                <RoundedBox args={[1, 1, 1]} radius={0.15} smoothness={8} castShadow receiveShadow>
                    <meshPhysicalMaterial 
                        color="#fdfdfd" 
                        clearcoat={1.0} 
                        clearcoatRoughness={0.0} 
                        roughness={0.05} 
                        metalness={0.1}
                        transmission={0.05} 
                        envMapIntensity={2.0}
                        thickness={1.0}
                    />
                </RoundedBox>
                
                <group>
                    {/* Mặt 1 (Chóp +Y) - ĐỎ và TO hơn */}
                    <Dot position={[0, D, 0]} color="#cc0000" radius={0.14} />

                    {/* Mặt 6 (Đáy -Y) */}
                    {[
                        [-0.25, -0.25], [0.25, -0.25],
                        [-0.25, 0], [0.25, 0],
                        [-0.25, 0.25], [0.25, 0.25]
                    ].map((pos, i) => (
                        <Dot key={`6_${i}`} position={[pos[0], -D, pos[1]]} />
                    ))}

                    {/* Mặt 2 (Trước +Z) */}
                    {[[-0.2, 0.2], [0.2, -0.2]].map((pos, i) => (
                        <Dot key={`2_${i}`} position={[pos[0], pos[1], D]} rotation={[Math.PI/2, 0, 0]} />
                    ))}

                    {/* Mặt 5 (Sau -Z) */}
                    {[
                        [-0.25, 0.25], [0.25, -0.25],
                        [-0.25, -0.25], [0.25, 0.25], [0, 0]
                    ].map((pos, i) => (
                        <Dot key={`5_${i}`} position={[pos[0], pos[1], -D]} rotation={[Math.PI/2, 0, 0]} />
                    ))}

                    {/* Mặt 3 (Phải +X) */}
                    {[[-0.25, -0.25], [0, 0], [0.25, 0.25]].map((pos, i) => (
                        <Dot key={`3_${i}`} position={[D, pos[0], pos[1]]} rotation={[0, 0, Math.PI/2]} />
                    ))}

                    {/* Mặt 4 (Trái -X) */}
                    {[[-0.25, -0.25], [-0.25, 0.25], [0.25, -0.25], [0.25, 0.25]].map((pos, i) => (
                        <Dot key={`4_${i}`} position={[-D, pos[0], pos[1]]} rotation={[0, 0, Math.PI/2]} />
                    ))}
                </group>
            </group>
        </>
    );
}
