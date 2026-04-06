<script>
    import { T } from '@threlte/core';
    import { OrbitControls, Environment, ContactShadows, HTML } from '@threlte/extras';
    import { tweened } from 'svelte/motion';
    import { cubicInOut } from 'svelte/easing';
    
    let { cells = [], players = [], ownership = {} } = $props();
    
    // Animation targets for players
    // We can map players to their visual positions.
    const boardSize = 7;
    const spacing = 1.25;
    const offset = (boardSize - 1) * spacing / 2;

    // Helper to calculate X and Z coordinates based on 7x7 grid
    function getCellCoord(index) {
        if (!cells[index]) return { x: 0, z: 0 };
        const r = cells[index].r - 1;
        const c = cells[index].c - 1;
        return {
            x: c * spacing - offset,
            z: r * spacing - offset
        };
    }

    // Colors mapping
    const getCellColor = (cell, ownerId) => {
        if (cell.type === 'start') return '#2ed573';
        if (cell.type === 'prison') return '#eccc68';
        if (cell.type === 'chance') return '#ffa502';
        if (cell.type === 'party') return '#ff4757';
        if (cell.type === 'free') return '#7bed9f';
        if (ownerId && players.find(p => p.id === ownerId)) {
            return players.find(p => p.id === ownerId).color;
        }
        return '#f1f2f6';
    };

</script>

<!-- Camera setup for precise Isometric look -->
<T.PerspectiveCamera
    makeDefault
    position={[20, 16, 20]}
    fov={35}
    on:create={({ ref }) => {
        ref.lookAt(0, 0, 0);
    }}
>
    <!-- Mượt mà, giới hạn xoay góc chết -->
    <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={8}
        maxDistance={40}
    />
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.6} />
<T.DirectionalLight 
    position={[10, 20, 10]} 
    intensity={1.2} 
    castShadow
    shadow.mapSize={[2048, 2048]}
    shadow.camera.left={-10}
    shadow.camera.right={10}
    shadow.camera.top={10}
    shadow.camera.bottom={-10}
/>

<!-- Center Grass Area -->
<T.Mesh position={[0, -0.4, 0]} receiveShadow>
    <T.BoxGeometry args={[boardSize * spacing - spacing, 0.4, boardSize * spacing - spacing]} />
    <T.MeshStandardMaterial color="#81c784" />
</T.Mesh>

<!-- Draw all cells as raised platforms (Kenney style) -->
{#each cells as cell, i}
    {@const coord = getCellCoord(i)}
    {@const color = getCellColor(cell, ownership[cell.id])}
    
    <T.Group position={[coord.x, 0, coord.z]}>
        <!-- Cell base -->
        <T.Mesh castShadow receiveShadow>
            <T.BoxGeometry args={[1.2, 0.5, 1.2]} />
            <T.MeshStandardMaterial color={color} roughness={0.7} />
        </T.Mesh>
        
        <!-- Cell inner white tile -->
        {#if cell.type === 'property'}
            <T.Mesh position={[0, 0.26, 0]} receiveShadow>
                <T.PlaneGeometry args={[1.0, 1.0]} />
                <T.MeshStandardMaterial color="#ffffff" roughness={0.3} />
            </T.Mesh>
        {/if}

        <!-- Threlte HTML Overlay for Text Overlay (Always facing Camera) -->
        <HTML transform position={[0, 0.35, 0]} sprite scale={0.25} zIndexRange={[100,0]}>
            <div style="pointer-events: none; text-align: center; color: #2c3e50; text-shadow: 0 1px 2px white; width: 150px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
                <div style="font-weight: 800; font-size: 1.2rem; background: rgba(255,255,255,0.7); padding: 2px 8px; border-radius: 8px;">{cell.name}</div>
                {#if cell.price > 0}
                    <div style="font-weight: 900; font-size: 1.4rem; color: #e74c3c;">${cell.price}</div>
                {/if}
            </div>
        </HTML>
    </T.Group>
{/each}

<!-- Draw players as 3D tokens -->
{#each players as player}
    {@const targetCoord = getCellCoord(player.pos)}
    {#if !player.bankrupt}
        <!-- In a real scenario we'd use tweened on position. For simplicity we snap or use spring. -->
        <T.Group position={[targetCoord.x, 0.5, targetCoord.z]}>
            <!-- Pawn base -->
            <T.Mesh position={[(player.id % 3) * 0.3 - 0.3, 0.2, Math.floor(player.id / 3) * 0.3 - 0.15]} castShadow>
                <T.CylinderGeometry args={[0.2, 0.25, 0.5, 16]} />
                <T.MeshStandardMaterial color={player.color} roughness={0.2} metalness={0.1} />
            </T.Mesh>
            <!-- Pawn head -->
            <T.Mesh position={[(player.id % 3) * 0.3 - 0.3, 0.55, Math.floor(player.id / 3) * 0.3 - 0.15]} castShadow>
                <T.SphereGeometry args={[0.2, 16, 16]} />
                <T.MeshStandardMaterial color={player.color} roughness={0.2} metalness={0.1} />

                <!-- Player Avatar HTML floating specifically above the head -->
                <HTML transform position={[0, 0.4, 0]} sprite scale={0.4}>
                    <div style="background: white; border: 3px solid {player.color}; border-radius: 50%; padding: 4px 8px; font-weight: bold; font-size: 1.2rem; color: {player.color}; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                        {player.emoji}
                    </div>
                </HTML>
            </T.Mesh>
        </T.Group>
    {/if}
{/each}

<!-- Center Dice visuals (Static placeholders for now, can be bound to physics later) -->
<T.Group position={[0, 1, 0]}>
    <T.Mesh position={[-0.8, 0, 0]} castShadow rotation={[Math.PI/4, Math.PI/4, 0]}>
        <T.BoxGeometry args={[0.8, 0.8, 0.8]} />
        <T.MeshStandardMaterial color="#e74c3c" />
    </T.Mesh>
    <T.Mesh position={[0.8, 0, 0]} castShadow rotation={[Math.PI/3, Math.PI/6, Math.PI/4]}>
        <T.BoxGeometry args={[0.8, 0.8, 0.8]} />
        <T.MeshStandardMaterial color="#e74c3c" />
    </T.Mesh>
</T.Group>

<!-- Ground plane for contact shadows -->
<ContactShadows 
    position={[0, -0.45, 0]} 
    opacity={0.8} 
    scale={30} 
    blur={1.5} 
    far={10} 
/>

