import React, { useRef } from 'react';
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

function Dot({ position, rotation }) {
    return (
        <mesh position={position} rotation={rotation || [0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.02, 32]} />
            <meshStandardMaterial color="#111111" roughness={0.4} metalness={0.1} />
        </mesh>
    );
}

export default function Dice() {
    const { currentRoll, isRollingDice, gameSpeed, chargePower } = useStore();
    const meshRef = useRef();

    // Core physical vectors
    const velocity = useRef(new THREE.Vector3(0, 0, 0));
    const rotVelocity = useRef(new THREE.Vector3(0, 0, 0));
    
    // Scale tracking
    const DICE_SCALE = 1.3;
    const REST_Y = DICE_SCALE * 0.5;

    React.useEffect(() => {
        if (isRollingDice && meshRef.current) {
            const powerMult = 1 + (chargePower / 100);
            
            // Kick upwards and horizontally (random direction)
            velocity.current.set(
                 (Math.random() - 0.5) * 15 * powerMult,
                 15 + Math.random() * 5 * powerMult,
                 (Math.random() - 0.5) * 15 * powerMult
            );
            
            // Strong spin
            rotVelocity.current.set(
                 (Math.random() - 0.5) * 30 * powerMult,
                 (Math.random() - 0.5) * 30 * powerMult,
                 (Math.random() - 0.5) * 30 * powerMult
            );
        }
    }, [isRollingDice, chargePower]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        // Capped delta to prevent explosion on tab resume
        const dt = Math.min(delta, 0.1) * gameSpeed;

        if (isRollingDice) {
            // Apply Gravity
            velocity.current.y -= 35 * dt; 
            
            // Apply velocity to position
            meshRef.current.position.x += velocity.current.x * dt;
            meshRef.current.position.y += velocity.current.y * dt;
            meshRef.current.position.z += velocity.current.z * dt;
            
            // Apply rotational velocity
            meshRef.current.rotation.x += rotVelocity.current.x * dt;
            meshRef.current.rotation.y += rotVelocity.current.y * dt;
            meshRef.current.rotation.z += rotVelocity.current.z * dt;

            // FLOOR COLLISION
            if (meshRef.current.position.y < REST_Y) {
                meshRef.current.position.y = REST_Y;
                velocity.current.y *= -0.6; // Nảy
                velocity.current.x *= 0.8;  // Ma sát ngang
                velocity.current.z *= 0.8;
                rotVelocity.current.multiplyScalar(0.8); // Ma sát xoay
            }
            
            // BOUNDARY COLLISION (Bàn cờ khoảng 10x10 -> Bounds = 4.5)
            const BOUNDS = 4.5;
            if (Math.abs(meshRef.current.position.x) > BOUNDS) {
                meshRef.current.position.x = Math.sign(meshRef.current.position.x) * BOUNDS;
                velocity.current.x *= -0.7;
            }
            if (Math.abs(meshRef.current.position.z) > BOUNDS) {
                meshRef.current.position.z = Math.sign(meshRef.current.position.z) * BOUNDS;
                velocity.current.z *= -0.7;
            }

            // Phụ hoạ: To lên đỉnh khi đang bay cao
            const targetScale = DICE_SCALE * (1 + velocity.current.length() * 0.02);
            meshRef.current.scale.setScalar(THREE.MathUtils.damp(meshRef.current.scale.x, targetScale, 10, dt));

        } else if (currentRoll > 0) {
            // Đã tung xong -> Tìm góc xoay đúng và làm mượt về đó bằng Slerp
            const [tx, ty, tz] = getTargetRotation(currentRoll);
            const targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(tx, ty, tz));
            
            // Slerp allows taking shortest rotation path cleanly
            meshRef.current.quaternion.slerp(targetQ, dt * 10);
            
            // Position rests exactly where it stopped, just strictly damp Y to rest
            meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, REST_Y, 15, dt);
            
            // Bring scale back to normal
            meshRef.current.scale.setScalar(THREE.MathUtils.damp(meshRef.current.scale.x, DICE_SCALE, 10, dt));
        }
    });

    if (currentRoll === 0 && !isRollingDice) return null;

    // Khoảng cách Dot tới mặt
    const D = 0.501;

    return (
        <group ref={meshRef} position={[0, REST_Y, 0]} castShadow>
            <RoundedBox args={[1, 1, 1]} radius={0.15} smoothness={8} castShadow receiveShadow>
                {/* Vật liệu White Polycarbonate siêu bóng cho Dice Trắng */}
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
                {/* Mặt 1 (Chóp +Y) */}
                <Dot position={[0, D, 0]} />

                {/* Mặt 6 (Đáy -Y) */}
                {[
                    [-0.25, -0.25], [0.25, -0.25],
                    [-0.25, 0], [0.25, 0],
                    [-0.25, 0.25], [0.25, 0.25]
                ].map((pos, i) => (
                    <Dot key={`6_${i}`} position={[pos[0], -D, pos[1]]} />
                ))}

                {/* Mặt 2 (Trước +Z) -> rotation X = 90 */}
                {[[-0.2, 0.2], [0.2, -0.2]].map((pos, i) => (
                    <Dot key={`2_${i}`} position={[pos[0], pos[1], D]} rotation={[Math.PI/2, 0, 0]} />
                ))}

                {/* Mặt 5 (Sau -Z) -> rotation X = 90 */}
                {[
                    [-0.25, 0.25], [0.25, -0.25],
                    [-0.25, -0.25], [0.25, 0.25], [0, 0]
                ].map((pos, i) => (
                    <Dot key={`5_${i}`} position={[pos[0], pos[1], -D]} rotation={[Math.PI/2, 0, 0]} />
                ))}

                {/* Mặt 3 (Phải +X) -> rotation Z = 90 */}
                {[[-0.25, -0.25], [0, 0], [0.25, 0.25]].map((pos, i) => (
                    <Dot key={`3_${i}`} position={[D, pos[0], pos[1]]} rotation={[0, 0, Math.PI/2]} />
                ))}

                {/* Mặt 4 (Trái -X) -> rotation Z = 90 */}
                {[[-0.25, -0.25], [-0.25, 0.25], [0.25, -0.25], [0.25, 0.25]].map((pos, i) => (
                    <Dot key={`4_${i}`} position={[-D, pos[0], pos[1]]} rotation={[0, 0, Math.PI/2]} />
                ))}
            </group>
        </group>
    );
}
