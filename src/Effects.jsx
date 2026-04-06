import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useStore } from './store';
import { getTileCoordinates } from './constants';

function FloatingEffect({ effect, onComplete }) {
    const meshRef = useRef();
    const [age, setAge] = useState(0);
    const gameSpeed = useStore(state => state.gameSpeed);

    useFrame((state, delta) => {
        setAge(a => a + delta * gameSpeed);
        if (meshRef.current) {
            meshRef.current.position.y += delta * 1.5 * gameSpeed; // Bay lên nhanh hơn
        }
        if (age > 2) {
            onComplete(effect.id);
        }
    });

    const [x, y, z] = getTileCoordinates(effect.pos);
    const opacity = Math.max(0, 1 - age / 2);

    return (
        <group position={[x, y + 0.8, z]} ref={meshRef}>
            <Html transform center style={{ pointerEvents: 'none', opacity }}>
                <div style={{
                    color: effect.color || 'white',
                    fontWeight: 900,
                    fontSize: '32px',
                    textShadow: '0px 3px 6px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace'
                }}>
                    {effect.text}
                </div>
            </Html>
        </group>
    );
}

export default function EffectsManager() {
    const effects = useStore(state => state.effects);
    const removeEffect = useStore(state => state.removeEffect);

    return (
        <group>
            {effects.map(eff => (
                <FloatingEffect 
                    key={eff.id} 
                    effect={eff} 
                    onComplete={() => removeEffect(eff.id)} 
                />
            ))}
        </group>
    );
}
