import React, { useState, useRef, useEffect } from 'react';
import { useStore } from './store';

export default function UI() {
  const state = useStore();
  const { 
      gameState, players, turn, currentRoll, isMoving, rollDice, tiles,
      pendingPurchase, buyPropertyInteraction, skipPurchase, log, ownership, gameSpeed, toggleSpeed,
      pendingUpgrade, upgradePropertyInteraction, skipUpgrade,
      activeEventCard, resolveEventCard, jackpotPool
  } = state;

  const [setupList, setSetupList] = useState([
     { name: 'Tôi', type: 'human', shapeId: 0 },
     { name: 'Máy', type: 'bot', shapeId: 1 }
  ]);

  const [setupConfig, setSetupConfig] = useState({
      startingMoney: 1500,
      goBonus: 200,
      botBuyChance: 0.8,
      gameSpeed: 1
  });

  const updateCfg = (k, v) => setSetupConfig(c => ({...c, [k]: v}));

  // --- PLAYING STATE (UI Toggles) ---
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Click to Roll
  const handleRollClick = () => {
      const currentP = players[turn];
      if (isMoving || state.isRollingDice || pendingPurchase || gameState !== 'playing' || currentP?.type === 'bot' || currentP?.bankrupt || currentP?.inJail) return;
      
      rollDice(75); // Lực mặc định
  };

  const SHAPE_NAMES = ['♟️ Con Tốt', '🎩 Mũ Phớt', '🚘 Siêu Xe', '🔺 Kim Tự Tháp', '💍 Chiếc Nhẫn', '⛵ Tàu Thuỷ', '💎 Kim Cương', '🏠 Nhà Nhỏ'];

  if (gameState === 'setup') {
      const addPlayer = () => {
          if (setupList.length < 12) {
              setSetupList([...setupList, { name: `Người chơi ${setupList.length+1}`, type: 'bot', shapeId: setupList.length % 8 }]);
          }
      };
      
      const updatePlayer = (index, field, value) => {
          const newList = [...setupList];
          newList[index][field] = value;
          setSetupList(newList);
      };
      
      const removePlayer = (index) => {
          setSetupList(setupList.filter((_, i) => i !== index));
      };

      return (
          <div className="ui-overlay setup-overlay glassmorphism" style={{ justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto', background: 'rgba(255,255,255,0.95)' }}>
              <div style={{ textAlign: 'center', maxWidth: '800px', width: '100%', padding: '20px', display: 'flex', gap: '30px' }}>
                  
                  {/* Cột trái: Cấu hình Luật Game */}
                  <div style={{ flex: 1, backgroundColor: 'rgba(236, 240, 241, 0.8)', padding: '20px', borderRadius: '12px', textAlign: 'left' }}>
                      <h1 style={{ fontSize: '2.4rem', marginBottom: '10px', background: 'linear-gradient(90deg, #e74c3c, #c0392b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}>Cờ Tỷ Phú 3D</h1>
                      <h3 style={{ marginBottom: '20px', color: '#34495e', textAlign: 'center' }}>Cấu hình Luật Chơi</h3>
                      
                      <div className="config-item" style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>💰 Số tiền ban đầu (Tỷ)</label>
                          <input type="number" step="100" value={setupConfig.startingMoney} onChange={e => updateCfg('startingMoney', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #bdc3c7' }} />
                      </div>
                      <div className="config-item" style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>🏁 Tiền thưởng qua xuất phát</label>
                          <input type="number" step="50" value={setupConfig.goBonus} onChange={e => updateCfg('goBonus', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #bdc3c7' }} />
                      </div>
                      <div className="config-item" style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>🤖 Tỉ lệ Bot mua nhà (0 - 1.0)</label>
                          <input type="number" step="0.1" min="0" max="1" value={setupConfig.botBuyChance} onChange={e => updateCfg('botBuyChance', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #bdc3c7' }} />
                      </div>
                      <div className="config-item" style={{ marginBottom: '25px' }}>
                          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>🚀 Tốc độ Game (1x, 2x, 3x)</label>
                          <select value={setupConfig.gameSpeed} onChange={e => updateCfg('gameSpeed', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #bdc3c7' }}>
                              <option value="1">1x (Thường)</option>
                              <option value="2">2x (Nhanh)</option>
                              <option value="3">3x (Siêu tốc)</option>
                          </select>
                      </div>

                      <button 
                          className="btn btn-buy" 
                          style={{ fontSize: '1.2rem', width: '100%', padding: '15px' }}
                          onClick={() => state.setupGame(setupList, setupConfig)}
                          disabled={setupList.length < 2}
                      >
                          BẮT ĐẦU VÁN CỜ
                      </button>
                  </div>

                  {/* Cột phải: Người chơi */}
                  <div style={{ flex: 1.5 }}>
                      <h3 style={{ marginBottom: '20px', color: '#7f8c8d', fontSize: '1.5rem' }}>Danh sách Người chơi</h3>
                      
                      <div style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
                      {setupList.map((p, i) => (
                          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', background: '#ecf0f1', padding: '10px', borderRadius: '8px' }}>
                              <span style={{ fontWeight: 'bold' }}>#{i+1}</span>
                              <input 
                                  value={p.name} 
                                  onChange={e => updatePlayer(i, 'name', e.target.value)}
                                  placeholder="Tên" 
                                  style={{ padding: '8px', flex: 1, borderRadius: '5px', border: '1px solid #bdc3c7' }} 
                              />
                              <select 
                                  value={p.type} 
                                  onChange={e => updatePlayer(i, 'type', e.target.value)} 
                                  style={{ padding: '8px', borderRadius: '5px', border: '1px solid #bdc3c7' }}
                              >
                                  <option value="human">👤 Người</option>
                                  <option value="bot">🤖 Máy tự chơi</option>
                              </select>
                              <select 
                                  value={p.shapeId} 
                                  onChange={e => updatePlayer(i, 'shapeId', parseInt(e.target.value))} 
                                  style={{ padding: '8px', borderRadius: '5px', border: '1px solid #bdc3c7', minWidth: '130px' }}
                              >
                                  {SHAPE_NAMES.map((name, idx) => <option key={idx} value={idx}>{name}</option>)}
                              </select>
                              <button onClick={() => removePlayer(i)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer' }} disabled={setupList.length <= 2}>X</button>
                          </div>
                      ))}
                  </div>

                      <button className="btn" onClick={addPlayer} disabled={setupList.length >= 12} style={{ background: '#34495e', fontSize: '1.2rem', padding: '10px 20px', width: '100%' }}>
                          + Thêm Người Chơi
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- PLAYING STATE ---

  const currentP = players[turn];
  const isBotTurn = currentP?.type === 'bot';

  return (
    <div className="ui-overlay">
      {/* Top Center: Jackpot HUD */}
      {!isStatsCollapsed && jackpotPool > 0 && (
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #f1c40f, #e67e22)', padding: '10px 30px', borderRadius: '30px', boxShadow: '0 5px 15px rgba(241, 196, 15, 0.4)', color: 'white', fontWeight: '900', fontSize: '1.5rem', border: '3px solid white', zIndex: 10, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              🎉 Quỹ Lễ Hội: {jackpotPool} Tỷ
          </div>
      )}
      {/* Top Left: Logo & Stats (Multiplayer list) */}
      <div className="stats-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '350px', pointerEvents: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: 900, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Monopoly 3D</h1>
            <div style={{ display: 'flex', gap: '5px' }}>
                <button className="btn" onClick={() => setIsRulesOpen(true)} style={{ padding: '5px 10px', background: '#8e44ad', fontSize: '1.2rem', minWidth: '40px', border: '1px solid #9b59b6' }} title="Luật chơi">
                    📖
                </button>
                <button className="btn" onClick={() => setIsStatsCollapsed(!isStatsCollapsed)} style={{ padding: '5px 10px', background: '#34495e', fontSize: '1.2rem', minWidth: '40px' }} title="Thu gọn/Mở rộng">
                    {isStatsCollapsed ? '👁️' : '➖'}
                </button>
                <button className="btn" onClick={toggleSpeed} style={{ padding: '5px 15px', background: '#34495e', fontSize: '1.2rem' }}>
                    🚀 {gameSpeed}x
                </button>
            </div>
        </div>
        
        {!isStatsCollapsed && players.map((p, idx) => {
            const isActive = idx === turn;
            return (
                <div key={p.id} style={{ 
                    padding: '15px', 
                    background: isActive ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))' : 'rgba(255,255,255,0.3)', 
                    borderRadius: '12px',
                    borderLeft: `8px solid ${p.color}`,
                    boxShadow: isActive ? '0 4px 15px rgba(0,0,0,0.1)' : 'none',
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                    opacity: p.bankrupt ? 0.5 : 1
                }}>
                    <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{p.icon} {p.name} {p.bankrupt && '(PHÁ SẢN)'}</span>
                        {isActive && <span style={{ fontSize: '0.8rem', background: '#3498db', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>Đang đi...</span>}
                    </h3>
                    <div className="money-display" style={{ color: p.money < 0 ? '#e74c3c' : '#27ae60' }}>
                        {p.money} Tỷ {p.inJail && <span style={{ color: '#c0392b', fontSize: '1rem' }}>(Đang ở tù)</span>}
                    </div>
                </div>
            )
        })}
      </div>

      {/* Right Side: Event Log */}
      <div className="log-box glassmorphism" style={{ pointerEvents: 'auto', padding: isLogsCollapsed ? '10px 20px' : '20px' }}>
        <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isLogsCollapsed ? 0 : '15px', borderBottom: isLogsCollapsed ? 'none' : '2px solid rgba(0,0,0,0.1)', paddingBottom: isLogsCollapsed ? 0 : '5px' }}>
            <span>Nhật ký Board</span>
            <button onClick={() => setIsLogsCollapsed(!isLogsCollapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }} title="Thu gọn/Mở rộng">
                {isLogsCollapsed ? '🔽' : '🔼'}
            </button>
        </h3>
        {!isLogsCollapsed && (
            <div className="logs">
                {log.map((item, index) => (
                    <div key={index} className="log-item" style={{opacity: 1 - index * 0.1, fontSize: '1.1rem'}}>
                        {item}
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Bottom Center: Actions */}
      <div className="action-box" style={{ pointerEvents: 'auto' }}>
        
        {pendingPurchase ? (
             <div className="glassmorphism" style={{ padding: '30px', textAlign: 'center', minWidth: '400px' }}>
              <h2 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '2rem' }}>Mua {pendingPurchase.cell.name}?</h2>
              <div style={{ fontSize: '3rem', margin: '20px 0', color: '#27ae60', fontWeight: '900' }}>{pendingPurchase.cell.basePrice} Tỷ</div>
              <div style={{ fontSize: '1.2rem', color: '#7f8c8d', marginBottom: '30px' }}>Tiền thuê sau này: {pendingPurchase.cell.rent} Tỷ</div>
              
              <div className="button-group" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-buy" onClick={buyPropertyInteraction} disabled={players[pendingPurchase.pIndex].money < pendingPurchase.cell.basePrice}>
                       Mua Đất
                  </button>
                  <button className="btn" onClick={skipPurchase} style={{ background: '#95a5a6' }}>
                       Bỏ qua
                  </button>
              </div>
          </div>
        ) : pendingUpgrade ? (
             <div className="glassmorphism" style={{ padding: '30px', textAlign: 'center', minWidth: '400px', border: '2px solid #3498db' }}>
                <h2 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '2rem' }}>Nâng cấp {pendingUpgrade.cell.name}?</h2>
                <div style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>Đang ở: Cấp {pendingUpgrade.currentLevel}</div>
                <div style={{ fontSize: '3rem', margin: '15px 0', color: '#e74c3c', fontWeight: '900' }}>{pendingUpgrade.upgradeCost} Tỷ</div>
                <div style={{ fontSize: '1.2rem', color: '#27ae60', marginBottom: '20px' }}>Tiền thuê sau khi lên Cấp {pendingUpgrade.currentLevel + 1}: {pendingUpgrade.cell.rent * Math.pow(2, pendingUpgrade.currentLevel)} Tỷ</div>
                <div className="button-group" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-buy" onClick={upgradePropertyInteraction} disabled={players[pendingUpgrade.pIndex].money < pendingUpgrade.upgradeCost} style={{ background: '#3498db' }}>
                        Nâng Cấp
                    </button>
                    <button className="btn" onClick={skipUpgrade} style={{ background: '#95a5a6' }}>
                        Bỏ qua
                    </button>
                </div>
            </div>
        ) : activeEventCard ? (
             <div className="glassmorphism" style={{ padding: '40px', textAlign: 'center', minWidth: '400px', background: 'linear-gradient(135deg, #9b59b6, #8e44ad)', color: 'white', border: '5px solid #f1c40f', transform: 'scale(1.1)' }}>
                <div style={{ fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#f1c40f', marginBottom: '10px', fontWeight: '900' }}>CƠ HỘI / KHÍ VẬN</div>
                <h2 style={{ marginBottom: '20px', fontSize: '2.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{activeEventCard.title}</h2>
                <div style={{ fontSize: '1.4rem', margin: '20px 0', lineHeight: '1.5', padding: '0 20px' }}>{activeEventCard.text}</div>
                <button className="btn" onClick={resolveEventCard} style={{ background: '#f1c40f', color: '#2c3e50', fontSize: '1.5rem', padding: '15px 40px', marginTop: '20px', fontWeight: '900', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                    XÁC NHẬN
                </button>
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'absolute', bottom: '30px', right: '40px' }}>
                <div className="turn-indicator glassmorphism" style={{ padding: '10px 20px', marginBottom: '15px', color: currentP.color, fontWeight: 800, fontSize: '1.2rem', textAlign: 'right' }}>
                    Tới lượt của {currentP.name}
                </div>
                
                <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {/* Vòng tròn tĩnh trang trí */}
                    <svg height="120" width="120" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', transform: 'rotate(-90deg)', dropShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                        <circle
                            stroke="rgba(0,0,0,0.2)"
                            fill="transparent"
                            strokeWidth="8"
                            r="52"
                            cx="60"
                            cy="60"
                        />
                        <circle
                            stroke="#f1c40f"
                            fill="transparent"
                            strokeWidth="8"
                            strokeDasharray={52 * 2 * Math.PI}
                            style={{ 
                                strokeDashoffset: 0 
                            }}
                            strokeLinecap="round"
                            r="52"
                            cx="60"
                            cy="60"
                        />
                    </svg>
                    
                    {/* Nút bấm tròn xoe ở giữa */}
                    <button 
                        className="btn btn-roll" 
                        onClick={handleRollClick}
                        disabled={isMoving || state.isRollingDice || currentP?.type === 'bot'}
                        style={{ 
                            width: '90px', 
                            height: '90px', 
                            borderRadius: '50%',
                            padding: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '2.5rem',
                            background: 'linear-gradient(135deg, #f1c40f, #f39c12)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            border: '4px solid white'
                        }}
                        title="Tung Xúc Xắc"
                    >
                        🎲
                    </button>
                </div>
            </div>
        )}
      </div>
      {isRulesOpen && (
         <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, pointerEvents: 'auto' }}>
            <div className="glassmorphism" style={{ width: '80%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto', padding: '40px', position: 'relative', border: '2px solid #f1c40f' }}>
                <button onClick={() => setIsRulesOpen(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '2rem', color: '#e74c3c', cursor: 'pointer' }}>✖</button>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', textAlign: 'center', color: '#f1c40f', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>📜 LUẬT CHƠI COTIPHU 3D</h2>
                <div style={{ fontSize: '1.2rem', lineHeight: '1.5', color: '#ecf0f1', display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                    <p><b>1. Mục tiêu:</b> Mua đất, xây nhà, thu tiền thuê và làm cho tất cả đối thủ khác phá sản.</p>
                    <p><b>2. Đất & Xây nhà:</b> Nếu vào ô đất trống, bạn có thể Lập tức mua nó. Nếu giẫm lại ô đất bạn Đã Sở Hữu, bạn có quyền <b>nâng cấp nó</b> lên tối đa Cấp 3 (biểu tượng ⭐) để nhân đôi hoặc nhân bốn tiền thuê áp lên đối thủ.</p>
                    <p><b>3. Sự kiện (Cơ Hội / Khí Vận):</b> Rút thẻ ngẫu nhiên. Bạn có thể được Thưởng tiền, Bị phạt tiền bảo trì, Di chuyển tức thời hoặc Bị bỏ tù.</p>
                    <p><b>4. Vào Tù:</b> Nếu bị bắt (Rút trúng án tù hoặc đạp ô Cảnh Sát), bạn sẽ bị tóm vào Ô Số 6. Trong lượt của mình, bạn VẪN được đổ xúc xắc, nhưng <b>CHỈ ĐƯỢC RA TÙ nếu lắc ra số 1 hoặc số 6</b> (ra tù được phép đi luôn đúng số bước đó). Các số khác sẽ khiến bạn tiếp tục mọt gông.</p>
                    <p><b>5. Quỹ Lễ Hội (Jackpot):</b> Tất cả mọi đồng tiền bạn Nộp Phạt Sự Kiện / Dóng Thuế đều không mất đi mà chảy vào trung tâm vũ trụ: <b>Quỹ Lễ Hội</b>. Nếu may mắn đạp trúng Ô số 12 (Bãi Lễ Hội), bạn sẽ <b>vơ vét trọn số tiền khổng lồ</b> trong Quỹ để làm giàu phút chót!</p>
                    <p><b>6. Phá sản:</b> Khi số dư âm (Money &lt; 0), bạn lập tức <b>Bị Loại</b>. Toàn bộ đất đai danh mục của bạn sẽ bị <b>tịch thu và trở về trạng thái vô chủ</b> cho kẻ khác mua lại.</p>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}
