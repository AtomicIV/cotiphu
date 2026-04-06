import { getTileCoordinates, BOARD_SIZE } from './constants';
import { Html } from '@react-three/drei';
import { useStore } from './store';
import Dice from './Dice';
import * as THREE from 'three';



export default function Board() {
  const ownership = useStore((state) => state.ownership);
  const players = useStore((state) => state.players);
  const tiles = useStore((state) => state.tiles);
  const shootOrigin = useStore((state) => state.shootOrigin);
  const chargePower = useStore((state) => state.chargePower);

  return (
    <group position={[0, -0.2, 0]}>


      {/* Dice */}
      <Dice />

      {/* Nền bệ bê tông bên dưới */}
      <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[BOARD_SIZE * 2.5 + 2.5, 0.2, BOARD_SIZE * 2.5 + 2.5]} />
        <meshStandardMaterial color="#bdc3c7" roughness={0.9} />
      </mesh>

      {/* Tiles viền xung quanh */}
      {tiles.map((tile, i) => {
        const [x, y, z] = getTileCoordinates(i);
        const isOwned = ownership[tile.id] !== undefined;

        // Đổi màu thành màu của chủ sở hữu, hoặc màu gốc
        let tileColor = tile.color;
        let pLevel = 0;
        if (isOwned) {
            const ownerData = ownership[tile.id];
            const owner = players.find(p => p.id === ownerData.pIndex);
            if (owner) {
                tileColor = owner.color;
                pLevel = ownerData.level;
            }
        }

        // Tính toán góc xoay hướng về giữa bàn cờ
        let rotY = 0;
        if (i >= 0 && i < 6) rotY = 0;                 // Cạnh dưới
        else if (i >= 6 && i < 12) rotY = -Math.PI / 2; // Cạnh trái
        else if (i >= 12 && i < 18) rotY = Math.PI;    // Cạnh trên
        else if (i >= 18 && i < 24) rotY = Math.PI / 2; // Cạnh phải

        // Tính toán vị trí Text (Label & Price) thủ công cho các vị trí đặc biệt
        let offsetZ = 1.8; // Luôn đẩy ra ngoài hoàn toàn vỏ cell
        let offsetX = 0;
        let textRotZ = 0; // Default nằm ngang trực diện camera

        if (i === 6) {
           // Ô nhà tù: Di chuyển xuống dưới (xuống là Global +Z -> Local +X)
           offsetX = 1.8;
           offsetZ = 1.8;
        } else if (i >= 7 && i <= 11) {
           textRotZ = Math.PI / 2; // Xoay 90 độ
        } else if (i === 18) {
           // Giữ tù: di chuyển lên trên ra ngoài (lên là Global -Z -> Local +X)
           offsetX = 1.8;
           offsetZ = 1.8;
           textRotZ = Math.PI / 2; // xoay 90 độ
        } else if (i >= 19 && i <= 23) {
           textRotZ = Math.PI / 2; // Xoay 90 độ
        }

        return (
          <group key={tile.id} position={[x, y + 0.05, z]} rotation={[0, rotY, 0]}>
            {/* Tấm bìa nền cứng bên dưới */}
            <mesh receiveShadow castShadow position={[0, -0.05, 0]}>
              <boxGeometry args={[2.3, 0.1, 2.3]} />
              <meshStandardMaterial color="#bdc3c7" roughness={1} />
            </mesh>
            
            {/* Lớp màu ô đất ở trên với viền mỏng (Trang trí nền gạch) */}
            <mesh receiveShadow position={[0, 0.005, 0]}>
              <boxGeometry args={[2.1, 0.015, 2.1]} />
              <meshPhysicalMaterial color={tileColor} roughness={0.5} clearcoat={0.5} />
            </mesh>
            
            {/* Đường highlight viền mỏng sát mép ranh */}
            <mesh position={[0, 0.015, 0]}>
              <boxGeometry args={[1.9, 0.01, 1.9]} />
              <meshStandardMaterial color={isOwned ? "#ffffff" : "#000000"} transparent opacity={isOwned ? 0.4 : 0.1} />
            </mesh>
            
            {/* Biểu tượng trung tâm */}
            <group position={[0, 0, 0]}>
                {/* Emoji nằm bẹp trên đất, hướng xoay đồng bộ góc nhìn Camera, lật ngang 90 độ theo yêu cầu */}
                <Html transform center position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, -rotY + Math.PI / 4]} style={{ pointerEvents: 'none' }}>
                    <div style={{ fontSize: '40px', opacity: 0.9, filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }}>
                        {tile.icon}
                    </div>
                </Html>
            </group>

            {/* Tên Phố và Giá tiền lôi ra ngoài Rim của bàn cờ chung 1 khối */}
            <Html transform center position={[offsetX, 0.051, offsetZ]} rotation={[-Math.PI / 2, 0, -rotY + textRotZ]} style={{ pointerEvents: 'none', width: '120px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    {pLevel > 0 && (
                        <div style={{ color: '#f1c40f', fontSize: '10px', textShadow: '0 1px 1px black', marginBottom: '-5px', zIndex: 2 }}>
                             {'⭐'.repeat(pLevel)}
                        </div>
                    )}
                    <div style={{ 
                        color: "#2c3e50", 
                        fontSize: '11px', 
                        fontWeight: '900', 
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        background: 'rgba(255,255,255,0.85)',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        lineHeight: 1.1
                    }}>
                        {tile.name}
                    </div>
                    {/* Giá ở dưới */}
                    {tile.basePrice > 0 && (
                        <div style={{ 
                            color: "#f1c40f", 
                            fontSize: '12px', 
                            fontWeight: '900', 
                            textAlign: 'center',
                            textShadow: '0px 1px 1px rgba(0,0,0,0.9)',
                            background: 'rgba(0,0,0,0.6)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            border: `1px solid ${tile.color}`,
                            whiteSpace: 'nowrap'
                        }}>
                            {tile.basePrice} Tỷ
                        </div>
                    )}
                </div>
            </Html>

            {/* Debug ID Label */}
            <Html transform center position={[-0.8, 0.051, -0.8]} rotation={[-Math.PI / 2, 0, -rotY]} style={{ pointerEvents: 'none' }}>
                <div style={{
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    padding: '2px 4px',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    fontSize: '10px'
                }}>
                    {tile.id}
                </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
