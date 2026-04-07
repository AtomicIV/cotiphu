import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useStore } from './store';
import { getTileCoordinates } from './constants';

// Emoji particle that flies outward with physics
function EmojiParticle({ emoji, startPos, velocity, delay, onComplete }) {
    const ref = useRef();
    const divRef = useRef();
    const ageRef = useRef(0);
    const gameSpeed = useStore(state => state.gameSpeed);
    const started = useRef(false);
    
    const vel = useRef({ x: velocity[0], y: velocity[1], z: velocity[2] });

    useFrame((_, delta) => {
        const dt = delta * gameSpeed;
        ageRef.current += dt;
        const age = ageRef.current;
        
        if (age < delay) return;
        if (!started.current) {
            started.current = true;
        }
        
        if (!ref.current) return;
        
        const realAge = age - delay;
        
        // Gravity
        vel.current.y -= 6 * dt;
        
        ref.current.position.x += vel.current.x * dt;
        ref.current.position.y += vel.current.y * dt;
        ref.current.position.z += vel.current.z * dt;
        
        if (divRef.current) {
            const opacity = Math.max(0, 1 - realAge / 2.5);
            divRef.current.style.opacity = opacity;
            divRef.current.style.fontSize = `${20 + realAge * 4}px`;
        }
        
        if (realAge > 2.5) {
            onComplete();
        }
    });

    return (
        <group ref={ref} position={startPos}>
            <Html transform center style={{ pointerEvents: 'none' }}>
                <div ref={divRef} style={{ 
                    fontSize: '20px',
                    opacity: 0,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                    transition: 'none'
                }}>
                    {emoji}
                </div>
            </Html>
        </group>
    );
}

function FloatingEffect({ effect, onComplete }) {
    const meshRef = useRef();
    const divRef = useRef();
    const ageRef = useRef(0);
    const gameSpeed = useStore(state => state.gameSpeed);

    // Generate particles based on effect type
    const particles = useMemo(() => {
        const type = effect.type || 'default';
        const items = [];
        
        if (type === 'buy') {
            const emojis = ['🏠', '🎉', '✨', '🔑', '🎊', '💫', '🏡', '⭐'];
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                items.push({
                    id: i,
                    emoji: emojis[i],
                    velocity: [Math.cos(angle) * 3, 4 + Math.random() * 3, Math.sin(angle) * 3],
                    delay: i * 0.06
                });
            }
        } else if (type === 'rent') {
            const emojis = ['💸', '😭', '💰', '🤑', '😤', '💸', '😢', '💰'];
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                items.push({
                    id: i,
                    emoji: emojis[i % emojis.length],
                    velocity: [Math.cos(angle) * 2, 3 + Math.random() * 2, Math.sin(angle) * 2],
                    delay: i * 0.08
                });
            }
        } else if (type === 'upgrade') {
            const emojis = ['⬆️', '⭐', '🔨', '💪', '🏗️', '✨', '🌟', '🔥'];
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                items.push({
                    id: i,
                    emoji: emojis[i],
                    velocity: [Math.cos(angle) * 2.5, 5 + Math.random() * 2, Math.sin(angle) * 2.5],
                    delay: i * 0.05
                });
            }
        } else if (type === 'money_gain') {
            const emojis = ['🤑', '💰', '💵', '💎', '🎉', '💰'];
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                items.push({
                    id: i,
                    emoji: emojis[i],
                    velocity: [Math.cos(angle) * 2, 5 + Math.random() * 3, Math.sin(angle) * 2],
                    delay: i * 0.07
                });
            }
        } else if (type === 'money_lose') {
            const emojis = ['💸', '😱', '🔥', '💀', '😵', '💸'];
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                items.push({
                    id: i,
                    emoji: emojis[i],
                    velocity: [Math.cos(angle) * 1.5, 2 + Math.random() * 2, Math.sin(angle) * 1.5],
                    delay: i * 0.1
                });
            }
        } else if (type === 'jackpot') {
            const emojis = ['🎰', '🎉', '💰', '🏆', '🎊', '✨', '💎', '🌟', '💵', '🎇'];
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2;
                items.push({
                    id: i,
                    emoji: emojis[i],
                    velocity: [Math.cos(angle) * 4, 6 + Math.random() * 4, Math.sin(angle) * 4],
                    delay: i * 0.04
                });
            }
        }
        
        return items;
    }, [effect.type]);

    useFrame((state, delta) => {
        ageRef.current += delta * gameSpeed;
        const age = ageRef.current;
        
        if (meshRef.current) {
            meshRef.current.position.y += delta * 2.0 * gameSpeed;
            const pulse = 1 + Math.sin(age * 8) * 0.08;
            meshRef.current.scale.setScalar(pulse);
        }
        
        if (divRef.current) {
            const opacity = Math.max(0, 1 - age / 3);
            const scaleIn = Math.min(1, age * 5);
            const bounce = scaleIn < 1 ? 0 : 1 + Math.sin((age - 0.2) * 12) * 0.15 * Math.max(0, 1 - age);
            
            divRef.current.style.opacity = opacity;
            divRef.current.style.fontSize = `${28 * bounce}px`;
            divRef.current.style.transform = `scale(${scaleIn})`;
        }
        
        if (age > 3) {
            onComplete(effect.id);
        }
    });

    const [x, y, z] = getTileCoordinates(effect.pos);
    const offsetY = effect.offsetY || 0;

    return (
        <group position={[x, y + 0.8 + offsetY, z]}>
            {/* Main text label */}
            <group ref={meshRef}>
                <Html transform center style={{ pointerEvents: 'none' }}>
                    <div ref={divRef} style={{
                        color: effect.color || 'white',
                        fontWeight: 900,
                        fontSize: '0px',
                        opacity: 0,
                        textShadow: `0px 3px 8px rgba(0,0,0,0.9), 0px 0px 20px ${effect.color || 'white'}`,
                        whiteSpace: 'nowrap',
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: '1px',
                        transform: 'scale(0)'
                    }}>
                        {effect.text}
                    </div>
                </Html>
            </group>
            
            {/* Emoji particles */}
            {particles.map(p => (
                <EmojiParticle
                    key={p.id}
                    emoji={p.emoji}
                    startPos={[0, 0.5, 0]}
                    velocity={p.velocity}
                    delay={p.delay}
                    onComplete={() => {}}
                />
            ))}
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
