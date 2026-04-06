<script>
    import { T, useTask } from '@threlte/core';
    import { OrbitControls, Environment, ContactShadows, HTML } from '@threlte/extras';
    import { tweened } from 'svelte/motion';
    import { cubicInOut } from 'svelte/easing';
    
    let { cells = [], players = [], ownership = {} } = $props();
    
    const boardSize = 7;
    const spacing = 1.3;
    const offset = (boardSize - 1) * spacing / 2;

    function getCellCoord(index) {
        if (!cells[index]) return { x: 0, z: 0 };
        const r = cells[index].r - 1;
        const c = cells[index].c - 1;
        return {
            x: c * spacing - offset,
            z: r * spacing - offset
        };
    }

    const getCellColor = (cell) => {
        if (cell.type === 'start') return '#2ed573';
        if (cell.type === 'prison') return '#eccc68';
        if (cell.type === 'chance') return '#ffa502';
        if (cell.type === 'party') return '#ff4757';
        if (cell.type === 'free') return '#7bed9f';
        return '#f1f2f6'; // Mặc định nền đất trắng/xám
    };

    // Để lấy màu của owner
    const getOwnerColor = (ownerId) => {
        const owner = players.find(p => p.id === ownerId);
        return owner ? owner.color : '#bdc3c7';
    };

</script>

<!-- Góc nhìn Isometric hoàn hảo 100% giống game 2D/3D lai -->
<T.OrthographicCamera
    makeDefault
    position={[20, 20, 20]}
    zoom={45}
    on:create={({ ref }) => {
        ref.lookAt(0, 0, 0);
    }}
>
    <!-- Khóa Camera để góc nhìn giống hệt ảnh, chỉ cho kéo thả và zoom -->
    <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 3}
        minAzimuthAngle={Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
        enableRotate={false} 
    />
</T.OrthographicCamera>

<T.AmbientLight intensity={0.7} />
<T.DirectionalLight 
    position={[10, 20, 5]} 
    intensity={1.2} 
    castShadow
    shadow.mapSize={[2048, 2048]}
    shadow.camera.left={-10}
    shadow.camera.right={10}
    shadow.camera.top={10}
    shadow.camera.bottom={-10}
/>

<!-- Nền đúc nguyên khối của bàn cờ (Trắng xám) -->
<T.Mesh position={[0, -0.2, 0]} castShadow receiveShadow>
    <T.BoxGeometry args={[boardSize * spacing, 0.4, boardSize * spacing]} />
    <T.MeshStandardMaterial color="#dcdde1" roughness={0.8} />
</T.Mesh>

<!-- Sân cỏ ở giữa -->
<T.Mesh position={[0, 0.01, 0]} receiveShadow>
    <T.PlaneGeometry args={[(boardSize - 2) * spacing, (boardSize - 2) * spacing]} rotation={[-Math.PI / 2, 0, 0]} />
    <T.MeshStandardMaterial color="#aed581" roughness={1} />
</T.Mesh>

<!-- Vẽ các ô đất (Cells) phẳng trên mặt bàn -->
{#each cells as cell, i}
    {@const coord = getCellCoord(i)}
    {@const color = getCellColor(cell)}
    {@const owner = ownership[cell.id]}
    
    <T.Group position={[coord.x, 0.015, coord.z]}>
        <!-- Bề mặt nền ô -->
        <T.Mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <T.PlaneGeometry args={[spacing * 0.95, spacing * 0.95]} />
            <T.MeshStandardMaterial color={color} roughness={0.5} />
        </T.Mesh>

        <!-- Nếu có Owner -> Nổi Building 3D lên (Nhà cửa) -->
        {#if owner}
            <T.Group position={[0, 0, -spacing * 0.25]}> <!-- Lùi nhà vào góc trong -->
                <!-- Khối nhà chính -->
                <T.Mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                    <T.BoxGeometry args={[0.6, 0.6, 0.6]} />
                    <T.MeshStandardMaterial color={getOwnerColor(owner)} roughness={0.4} />
                </T.Mesh>
                <!-- Mái nhà -->
                <T.Mesh position={[0, 0.7, 0]} castShadow receiveShadow rotation={[0, Math.PI/4, 0]}>
                    <T.ConeGeometry args={[0.55, 0.4, 4]} />
                    <T.MeshStandardMaterial color="#c0392b" roughness={0.3} />
                </T.Mesh>
            </T.Group>
        {/if}

        <!-- Text thông số (Phẳng trên mặt đất giống game Let's Get Rich) -->
        <T.Mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, owner ? spacing * 0.2 : 0]}>
            <HTML transform scale={0.15} pointerEvents="none">
                <div style="text-align: center; color: #2c3e50; font-family: sans-serif; width: 150px;">
                    <div style="font-weight: 800; font-size: 2rem;">{cell.name}</div>
                    {#if cell.price > 0}
                        <div style="font-weight: 900; font-size: 2.5rem; color: #e74c3c;">${cell.price}</div>
                    {/if}
                </div>
            </HTML>
        </T.Mesh>
    </T.Group>
{/each}

<!-- Xúc xắc ở giữa (Tĩnh) -->
<T.Group position={[0, 0.4, 0]}>
    <T.Mesh position={[-0.8, 0, 0]} castShadow rotation={[Math.PI/4, Math.PI/4, 0]}>
        <T.BoxGeometry args={[0.8, 0.8, 0.8]} />
        <T.MeshStandardMaterial color="#e74c3c" />
    </T.Mesh>
    <T.Mesh position={[0.8, 0, 0]} castShadow rotation={[Math.PI/3, Math.PI/6, Math.PI/4]}>
        <T.BoxGeometry args={[0.8, 0.8, 0.8]} />
        <T.MeshStandardMaterial color="#e74c3c" />
    </T.Mesh>
</T.Group>

<!-- Người chơi -->
{#each players as player}
    {@const targetCoord = getCellCoord(player.pos)}
    {#if !player.bankrupt}
        <!-- Nâng người chơi lên cao để khỏi kẹt vào bảng -->
        <T.Group position={[targetCoord.x, 0.1, targetCoord.z]}>
            <T.Mesh position={[(player.id % 3) * 0.4 - 0.4, 0.2, Math.floor(player.id / 3) * 0.4 - 0.2]} castShadow>
                <T.CylinderGeometry args={[0.2, 0.25, 0.4, 16]} />
                <T.MeshStandardMaterial color={player.color} roughness={0.2} metalness={0.1} />
            </T.Mesh>
            <T.Mesh position={[(player.id % 3) * 0.4 - 0.4, 0.5, Math.floor(player.id / 3) * 0.4 - 0.2]} castShadow>
                <T.SphereGeometry args={[0.2, 16, 16]} />
                <T.MeshStandardMaterial color={player.color} roughness={0.2} metalness={0.1} />
                <!-- Avatar nổi trên con cờ, xoay về theo Camera -->
                <HTML transform position={[0, 0.4, 0]} sprite scale={0.2}>
                    <div style="background: white; border: 4px solid {player.color}; border-radius: 50%; padding: 4px 8px; font-weight: bold; font-size: 2.5rem; color: {player.color}; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                        {player.emoji}
                    </div>
                </HTML>
            </T.Mesh>
        </T.Group>
    {/if}
{/each}

<ContactShadows 
    position={[0, -0.4, 0]} 
    opacity={0.8} 
    scale={40} 
    blur={1.5} 
    far={10} 
/>

