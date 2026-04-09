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

  // 4 ô góc: index 0 (Bắt Đầu), 6 (Nhà Tù), 12 (Bến Xe), 18 (Đi Tù)
  const CORNER_INDICES = [0, 6, 12, 18];

  return (
    <group position={[0, -0.2, 0]}>


      {/* Dice */}
      <Dice />

      {/* Nền bệ bê tông bên dưới */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[BOARD_SIZE * 2.5 + 2.5, 0.2, BOARD_SIZE * 2.5 + 2.5]} />
        <meshStandardMaterial color="#bdc3c7" roughness={0.9} />
      </mesh>

      {/* ===== DECORATIVE DICE ZONE (Art Floor) ===== */}
      <group position={[0, 0, 0]}>
        {/* Base marble floor */}
        <mesh position={[0, 0.004, 0]} receiveShadow>
          <boxGeometry args={[10, 0.015, 10]} />
          <meshPhysicalMaterial 
            color="#2c3e50" 
            roughness={0.3} 
            clearcoat={0.8}
            clearcoatRoughness={0.1}
            metalness={0.2}
          />
        </mesh>

        {/* Inner lighter area */}
        <mesh position={[0, 0.013, 0]} receiveShadow>
          <boxGeometry args={[9.2, 0.005, 9.2]} />
          <meshPhysicalMaterial 
            color="#34495e" 
            roughness={0.25} 
            clearcoat={0.9}
            metalness={0.15}
          />
        </mesh>

        {/* Gold border trim - outer */}
        {[
          [0, 0.017, 5.05, 10.2, 0.008, 0.12],
          [0, 0.017, -5.05, 10.2, 0.008, 0.12],
          [5.05, 0.017, 0, 0.12, 0.008, 10.2],
          [-5.05, 0.017, 0, 0.12, 0.008, 10.2],
        ].map(([x, y, z, w, h, d], i) => (
          <mesh key={`border_${i}`} position={[x, y, z]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#d4a017" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}

        {/* Gold border trim - inner */}
        {[
          [0, 0.017, 4.55, 9.2, 0.006, 0.06],
          [0, 0.017, -4.55, 9.2, 0.006, 0.06],
          [4.55, 0.017, 0, 0.06, 0.006, 9.2],
          [-4.55, 0.017, 0, 0.06, 0.006, 9.2],
        ].map(([x, y, z, w, h, d], i) => (
          <mesh key={`inner_border_${i}`} position={[x, y, z]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#c9a832" metalness={0.7} roughness={0.25} />
          </mesh>
        ))}

        {/* Compass Rose - Cardinal lines (N/S/E/W) */}
        {[
          [0, 0.015, 0, 0.06, 0.004, 8.5, 0],   // N-S
          [0, 0.015, 0, 8.5, 0.004, 0.06, 0],     // E-W
        ].map(([x, y, z, w, h, d, ry], i) => (
          <mesh key={`compass_${i}`} position={[x, y, z]} rotation={[0, ry, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#d4a017" metalness={0.7} roughness={0.3} transparent opacity={0.5} />
          </mesh>
        ))}

        {/* Compass Rose - Diagonal lines */}
        {[
          [0, 0.015, 0, 0.04, 0.004, 11.5, Math.PI / 4],
          [0, 0.015, 0, 0.04, 0.004, 11.5, -Math.PI / 4],
        ].map(([x, y, z, w, h, d, ry], i) => (
          <mesh key={`diag_${i}`} position={[x, y, z]} rotation={[0, ry, 0]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#c9a832" metalness={0.6} roughness={0.3} transparent opacity={0.35} />
          </mesh>
        ))}

        {/* Concentric circles */}
        {[4.0, 3.0, 2.0, 1.0].map((radius, i) => (
          <mesh key={`circle_${i}`} position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.03, radius, 64]} />
            <meshStandardMaterial 
              color="#d4a017" 
              metalness={0.7} 
              roughness={0.3} 
              transparent 
              opacity={0.3 - i * 0.04}
              side={2}
            />
          </mesh>
        ))}

        {/* Center emblem - large coin */}
        <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.6, 48]} />
          <meshPhysicalMaterial 
            color="#d4a017" 
            metalness={0.9} 
            roughness={0.1} 
            clearcoat={1}
          />
        </mesh>
        <mesh position={[0, 0.019, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.55, 48]} />
          <meshStandardMaterial color="#2c3e50" metalness={0.5} roughness={0.3} side={2} />
        </mesh>
        {/* Dollar sign in center */}
        <Html transform center position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: '24px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>💰</div>
        </Html>

        {/* 4 Corner ornamental medallions */}
        {[
          [3.8, 3.8], [-3.8, 3.8], [-3.8, -3.8], [3.8, -3.8]
        ].map(([cx, cz], i) => (
          <group key={`medal_${i}`}>
            <mesh position={[cx, 0.017, cz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.45, 6]} />
              <meshPhysicalMaterial 
                color="#d4a017" 
                metalness={0.85} 
                roughness={0.15}
                clearcoat={0.5}
              />
            </mesh>
            <mesh position={[cx, 0.018, cz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.3, 32]} />
              <meshStandardMaterial color="#2c3e50" metalness={0.4} roughness={0.3} />
            </mesh>
            <Html transform center position={[cx, 0.022, cz]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} style={{ pointerEvents: 'none' }}>
              <div style={{ fontSize: '14px' }}>{['🏆', '⭐', '👑', '💎'][i]}</div>
            </Html>
          </group>
        ))}

        {/* Diamond accent shapes at cardinal edges */}
        {[
          [0, 4.2], [0, -4.2], [4.2, 0], [-4.2, 0]
        ].map(([dx, dz], i) => (
          <mesh key={`diamond_${i}`} position={[dx, 0.017, dz]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
            <planeGeometry args={[0.35, 0.35]} />
            <meshStandardMaterial color="#d4a017" metalness={0.8} roughness={0.2} side={2} />
          </mesh>
        ))}
      </group>

      {/* Tiles viền xung quanh */}
      {tiles.map((tile, i) => {
        const [x, y, z] = getTileCoordinates(i);
        const isOwned = ownership[tile.id] !== undefined;
        const isCorner = CORNER_INDICES.includes(i);

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

        // Tính toán vị trí Text (Label & Price)
        let offsetZ = 1.8; // Luôn đẩy ra ngoài hoàn toàn vỏ cell
        let offsetX = 0;
        let textRotZ = 0; // Default nằm ngang trực diện camera

        if (isCorner) {
            // 4 ô góc: đặt text ở bên ngoài, xoay ngang cho dễ đọc
            if (i === 0) {
                // Bắt Đầu (góc dưới phải) - đẩy ra ngoài theo cả X và Z
                offsetX = 1.5;
                offsetZ = 1.5;
                textRotZ = Math.PI / 4; // Xoay 45 độ cho đẹp
            } else if (i === 6) {
                // Nhà Tù (góc dưới trái)
                offsetX = 1.5;
                offsetZ = 1.5;
                textRotZ = Math.PI / 4;
            } else if (i === 12) {
                // Bến Xe (góc trên trái)
                offsetX = 1.5;
                offsetZ = 1.5;
                textRotZ = Math.PI / 4;
            } else if (i === 18) {
                // Đi Tù (góc trên phải)
                offsetX = 1.5;
                offsetZ = 1.5;
                textRotZ = Math.PI / 4;
            }
        } else if (i >= 7 && i <= 11) {
           textRotZ = Math.PI / 2; // Cạnh trái: xoay 90 độ
        } else if (i >= 19 && i <= 23) {
           textRotZ = Math.PI / 2; // Cạnh phải: xoay 90 độ
        }

        // Tính giá hiển thị: nếu đã nâng cấp, hiển thị tiền thuê thực tế
        let displayPrice = tile.basePrice;
        let displayRent = tile.rent;
        if (pLevel > 0) {
            displayRent = tile.rent * Math.pow(2, pLevel - 1); // Lv1=x1, Lv2=x2, Lv3=x4
        }

        return (
          <group key={tile.id} position={[x, y + 0.05, z]} rotation={[0, rotY, 0]}>
            {/* Tấm bìa nền cứng bên dưới */}
            <mesh receiveShadow position={[0, -0.05, 0]}>
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

            {/* Tên Phố và Giá tiền */}
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
                    {/* Giá hiển thị: ô chưa mua = giá gốc, ô đã mua = tiền thuê thực tế */}
                    {tile.basePrice > 0 && (
                        <div style={{ 
                            color: isOwned ? "#2ecc71" : "#f1c40f", 
                            fontSize: '12px', 
                            fontWeight: '900', 
                            textAlign: 'center',
                            textShadow: '0px 1px 1px rgba(0,0,0,0.9)',
                            background: 'rgba(0,0,0,0.6)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            border: `1px solid ${isOwned ? tileColor : tile.color}`,
                            whiteSpace: 'nowrap'
                        }}>
                            {isOwned ? `🏠 ${displayRent} Tỷ/lượt` : `${tile.basePrice} Tỷ`}
                        </div>
                    )}
                </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
