import React, { useState, useRef, useEffect } from 'react';
import { PLAYER_NAMES, PLAYER_ICONS, PLAYER_PASSIVES } from './constants';
import { useStore } from './store';
import { initAudio, setMute, startBGM, getMute, setSfxVolume, setBgmVolume } from './audioEngine';
import { BOT_PERSONALITIES, BOT_DIFFICULTIES } from './botAI';

export default function UI() {
  const state = useStore();
  const { 
      gameState, players, turn, currentRoll, isMoving, rollDice, tiles,
      pendingPurchase, buyPropertyInteraction, skipPurchase, log, ownership, gameSpeed, toggleSpeed,
      pendingUpgrade, upgradePropertyInteraction, skipUpgrade,
      activeEventCard, resolveEventCard, jackpotPool,
      activeQuiz, submitQuizAnswer, activeMarketEvent, roundCount
  } = state;

  const [setupList, setSetupList] = useState([
     { name: 'Tôi', type: 'human', shapeId: 0 },
     { name: 'Máy', type: 'bot', shapeId: 1, personality: 'strategic' }
  ]);

  const [setupConfig, setSetupConfig] = useState({
      startingMoney: 30,
      goBonus: 5,
      botDifficulty: 'medium',
      gameSpeed: 1,
      mathDifficulty: 3,
      mathTimeout: 15,
      sfxVolume: 50,
      bgmVolume: 50
  });

  const updateCfg = (k, v) => {
      setSetupConfig(c => ({...c, [k]: v}));
      if (k === 'sfxVolume') {
          setSfxVolume(v / 100);
      } else if (k === 'bgmVolume') {
          setBgmVolume(v / 100);
      }
  };

  // --- PLAYING STATE (UI Toggles) ---
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
      const newMuted = !getMute();
      setMute(newMuted);
      setSoundEnabled(!newMuted);
  };

  // Click to Roll
  const handleRollClick = () => {
      const currentP = players[turn];
      if (isMoving || state.isRollingDice || pendingPurchase || gameState !== 'playing' || currentP?.type === 'bot' || currentP?.bankrupt || currentP?.inJail) return;
      
      rollDice(75);
  };

  // Bỏ SHAPE_NAMES tĩnh, sử dụng hằng số từ constants.js

  // ===== SETUP SCREEN =====
  if (gameState === 'setup') {
      const addPlayer = () => {
          if (setupList.length < 12) {
              setSetupList([...setupList, { name: `Người chơi ${setupList.length+1}`, type: 'bot', shapeId: setupList.length % 8, personality: 'strategic' }]);
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
          <div className="ui-overlay setup-overlay glassmorphism">
              <div className="setup-container">
                  
                  {/* Cột trái: Cấu hình Luật Game */}
                  <div className="setup-config">
                      <h1>Cờ Tỷ Phú 3D</h1>
                      <h3>Cấu hình Luật Chơi</h3>
                      
                      <div className="config-item">
                          <label>💰 Số tiền ban đầu (Tỷ)</label>
                          <input type="number" step="5" value={setupConfig.startingMoney} onChange={e => updateCfg('startingMoney', Number(e.target.value))} />
                      </div>
                      <div className="config-item">
                          <label>🏁 Thưởng qua vạch Bắt Đầu</label>
                          <input type="number" step="1" value={setupConfig.goBonus} onChange={e => updateCfg('goBonus', Number(e.target.value))} />
                      </div>
                      <div className="config-item">
                          <label>🤖 Độ khó Bot AI</label>
                          <select value={setupConfig.botDifficulty} onChange={e => updateCfg('botDifficulty', e.target.value)}>
                              {Object.values(BOT_DIFFICULTIES).map(d => (
                                  <option key={d.id} value={d.id}>{d.name} — {d.desc}</option>
                              ))}
                          </select>
                      </div>
                      <div className="config-item">
                          <label>🚀 Tốc độ Game (1x - 20x)</label>
                          <select value={setupConfig.gameSpeed} onChange={e => updateCfg('gameSpeed', Number(e.target.value))}>
                              <option value="1">1x (Thường)</option>
                              <option value="2">2x (Nhanh)</option>
                              <option value="5">5x (Rất nhanh)</option>
                              <option value="10">10x (Thần tốc)</option>
                              <option value="20">20x (Hack speed)</option>
                          </select>
                      </div>
                      <div className="config-item">
                          <label>🧠 Khổ Toàn Tập (Độ khó Toán)</label>
                          <select value={setupConfig.mathDifficulty} onChange={e => updateCfg('mathDifficulty', Number(e.target.value))}>
                              <option value="1">Lớp 1 (Cộng trừ &lt; 20)</option>
                              <option value="2">Lớp 2 (Cộng trừ &lt; 100)</option>
                              <option value="3">Lớp 3 (Cửu chương)</option>
                              <option value="4">Lớp 4 (Nhân chia lớn)</option>
                              <option value="5">Lớp 5 (Biểu thức ngoặc)</option>
                              <option value="6">Lớp 6 (Phương trình x)</option>
                          </select>
                      </div>
                      <div className="config-item">
                          <label>⏱ Thời gian giải bài (Giây)</label>
                          <input type="number" step="1" min="5" max="60" value={setupConfig.mathTimeout} onChange={e => updateCfg('mathTimeout', Number(e.target.value))} />
                      </div>
                      <div className="config-item">
                          <label>🔊 Âm lượng SFX ({setupConfig.sfxVolume}%)</label>
                          <input type="range" min="0" max="100" value={setupConfig.sfxVolume} onChange={e => updateCfg('sfxVolume', Number(e.target.value))} />
                      </div>
                      <div className="config-item" style={{ marginBottom: '20px' }}>
                          <label>🎵 Âm lượng Nhạc nền ({setupConfig.bgmVolume}%)</label>
                          <input type="range" min="0" max="100" value={setupConfig.bgmVolume} onChange={e => updateCfg('bgmVolume', Number(e.target.value))} />
                      </div>

                      <button 
                          className="btn btn-buy" 
                          style={{ width: '100%', padding: '12px' }}
                          onClick={() => {
                              initAudio();
                              setMute(!soundEnabled);
                              startBGM();
                              state.setupGame(setupList, setupConfig);
                          }}
                          disabled={setupList.length < 2}
                      >
                          BẮT ĐẦU VÁN CỜ
                      </button>
                  </div>

                  {/* Cột phải: Người chơi */}
                  <div className="setup-players">
                      <h3>Danh sách Người chơi</h3>
                      
                      <div className="player-list-scroll">
                      {setupList.map((p, i) => (
                          <div key={i} className="player-row" style={{ flexWrap: 'wrap', gap: '6px' }}>
                              <span>#{i+1}</span>
                              <input 
                                  value={p.name} 
                                  onChange={e => updatePlayer(i, 'name', e.target.value)}
                                  placeholder="Tên"
                                  style={{ minWidth: '70px', flex: '1' }}
                              />
                              <select 
                                  value={p.type} 
                                  onChange={e => {
                                      updatePlayer(i, 'type', e.target.value);
                                      if (e.target.value === 'bot' && !p.personality) {
                                          updatePlayer(i, 'personality', 'strategic');
                                      }
                                  }} 
                              >
                                  <option value="human">👤 Người</option>
                                  <option value="bot">🤖 Máy</option>
                              </select>
                              {p.type === 'bot' && (
                                  <select
                                      value={p.personality || 'strategic'}
                                      onChange={e => updatePlayer(i, 'personality', e.target.value)}
                                      title="Tính cách Bot"
                                      style={{ fontSize: '0.78rem', padding: '4px 6px', background: 'rgba(52,73,94,0.9)', color: 'white', border: '1px solid #7f8c8d', borderRadius: '6px' }}
                                  >
                                      {Object.values(BOT_PERSONALITIES).map(per => (
                                          <option key={per.id} value={per.id}>{per.name}</option>
                                      ))}
                                  </select>
                              )}
                              <select 
                                  className="shape-select"
                                  value={p.shapeId} 
                                  onChange={e => updatePlayer(i, 'shapeId', parseInt(e.target.value))}
                                  title={PLAYER_PASSIVES[p.shapeId]?.desc}
                              >
                                  {PLAYER_NAMES.map((name, idx) => <option key={idx} value={idx}>{PLAYER_ICONS[idx]} {name} - {PLAYER_PASSIVES[idx]?.name}</option>)}
                              </select>
                              <button className="remove-btn" onClick={() => removePlayer(i)} disabled={setupList.length <= 2}>✕</button>
                          </div>
                      ))}
                  </div>

                      <button className="btn" onClick={addPlayer} disabled={setupList.length >= 12} style={{ background: '#34495e', width: '100%' }}>
                          + Thêm Người Chơi
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // ===== PLAYING STATE =====

  const currentP = players[turn];
  const isBotTurn = currentP?.type === 'bot';

  return (
    <div className="ui-overlay">
      {/* Jackpot HUD */}
      {!isStatsCollapsed && jackpotPool > 0 && (
          <div className="jackpot-hud">
              🎉 Quỹ Lễ Hội: {jackpotPool} Tỷ
          </div>
      )}

      {/* Top Left: Stats */}
      <div className="stats-container">
        <div className="stats-header">
            <h1>Monopoly 3D</h1>
                <div className="stats-actions">
                    <button className="btn btn-sm" onClick={toggleSound} style={{ background: '#e67e22', border: '1px solid #d35400' }} title="Bật/Tắt Âm thanh">
                        {soundEnabled ? '🔊' : '🔇'}
                    </button>
                    <button className="btn btn-sm" onClick={() => setIsRulesOpen(true)} style={{ background: '#8e44ad', border: '1px solid #9b59b6' }} title="Luật chơi">
                        📖
                    </button>
                    <button className="btn btn-sm" onClick={() => setIsStatsCollapsed(!isStatsCollapsed)} style={{ background: '#34495e' }} title="Thu gọn/Mở rộng">
                        {isStatsCollapsed ? '👁️' : '➖'}
                    </button>
                    <button className="btn btn-sm" onClick={toggleSpeed} style={{ background: '#34495e' }}>
                        🚀{gameSpeed}x
                    </button>
                    <button className="btn btn-sm" onClick={() => state.resetToSetup()} style={{ background: '#c0392b' }} title="Chơi lại từ đầu">
                        🔄
                    </button>
                </div>
        </div>
        
        {!isStatsCollapsed && players.map((p, idx) => {
            const isActive = idx === turn;
            return (
                <div key={p.id} className={`player-card ${isActive ? 'active' : ''} ${p.bankrupt ? 'bankrupt' : ''}`}
                     style={{ borderLeft: `6px solid ${p.color}` }}>
                    <h3>
                        <span>{p.icon} {p.name} {p.bankrupt && '💀'}</span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span 
                                title={PLAYER_PASSIVES[p.shapeId]?.desc}
                                style={{ fontSize: '0.65rem', background: 'rgba(52,152,219,0.3)', border: '1px solid rgba(41,128,185,0.8)', borderRadius: '4px', padding: '1px 4px', color: '#85c1e9', fontWeight: 600, cursor: 'help' }}
                            >
                                ✨ {PLAYER_PASSIVES[p.shapeId]?.name}
                            </span>
                            {p.type === 'bot' && p.personality && (
                                <span style={{ fontSize: '0.65rem', background: 'rgba(155,89,182,0.35)', border: '1px solid rgba(155,89,182,0.6)', borderRadius: '8px', padding: '1px 6px', color: '#c39bd3', fontWeight: 600 }}>
                                    {p.personality.name}
                                </span>
                            )}
                            {isActive && <span className="player-badge">Đang đi...</span>}
                        </div>
                    </h3>
                    <div className="money-display" style={{ color: p.money < 0 ? '#e74c3c' : '#27ae60' }}>
                        {p.money} Tỷ {p.inJail && <span className="jail-badge">(Đang ở tù)</span>}
                    </div>
                </div>
            )
        })}
        {activeMarketEvent && (
            <div className="glassmorphism" style={{ marginTop: '10px', padding: '8px', borderLeft: `4px solid ${activeMarketEvent.color || '#e74c3c'}`, background: 'rgba(0,0,0,0.6)'}}>
                 <div style={{ fontSize: '0.75rem', color: '#bdc3c7' }}>🚨 Sự kiện Thị Trường (còn {activeMarketEvent.duration} vòng)</div>
                 <div style={{ fontWeight: 'bold', color: activeMarketEvent.color || '#e74c3c' }}>{
                     activeMarketEvent.type === 'boom' ? 'BÙNG NỔ DU LỊCH!' : 
                     activeMarketEvent.type === 'crisis' ? 'KHỦNG HOẢNG KINH TẾ!' :
                     activeMarketEvent.type === 'discount' ? 'TRỢ GIÁ KIẾN THIẾT!' : 'SỰ KIỆN LẠ!'
                 }</div>
            </div>
        )}
      </div>

      {/* Right: Event Log */}
      <div className={`log-box glassmorphism ${isLogsCollapsed ? 'collapsed' : ''}`}>
        <h3>
            <span>Nhật ký</span>
            <button className="log-toggle-btn" onClick={() => setIsLogsCollapsed(!isLogsCollapsed)} title="Thu gọn/Mở rộng">
                {isLogsCollapsed ? '🔽' : '🔼'}
            </button>
        </h3>
        {!isLogsCollapsed && (
            <div className="logs">
                {log.map((item, index) => (
                    <div key={index} className="log-item">
                        {item}
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Bottom: Actions */}
      <div className="action-box">
        
        {pendingPurchase ? (
             <div className="glassmorphism action-panel">
              <h2>Mua {pendingPurchase.cell.name}?</h2>
              <div className="price-big" style={{ color: '#27ae60' }}>{pendingPurchase.cell.basePrice} Tỷ</div>
              <div className="price-sub">Tiền thuê: {pendingPurchase.cell.rent} Tỷ</div>
              
              <div className="button-group" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-buy" onClick={buyPropertyInteraction} disabled={players[pendingPurchase.pIndex].money < pendingPurchase.cell.basePrice}>
                       Mua Đất
                  </button>
                  <button className="btn btn-skip" onClick={skipPurchase}>
                       Bỏ qua
                  </button>
              </div>
          </div>
        ) : pendingUpgrade ? (
             <div className="glassmorphism action-panel" style={{ border: '2px solid #3498db' }}>
                <h2>Nâng cấp {pendingUpgrade.cell.name}?</h2>
                <div className="price-sub" style={{ marginBottom: '4px' }}>Đang ở: Cấp {pendingUpgrade.currentLevel}</div>
                <div className="price-big" style={{ color: '#e74c3c' }}>{pendingUpgrade.upgradeCost} Tỷ</div>
                <div className="price-sub">Thuê sau lên Cấp {pendingUpgrade.currentLevel + 1}: {pendingUpgrade.cell.rent * Math.pow(2, pendingUpgrade.currentLevel)} Tỷ</div>
                <div className="button-group" style={{ justifyContent: 'center' }}>
                    <button className="btn btn-buy" onClick={upgradePropertyInteraction} disabled={players[pendingUpgrade.pIndex].money < pendingUpgrade.upgradeCost} style={{ background: '#3498db' }}>
                        Nâng Cấp
                    </button>
                    <button className="btn btn-skip" onClick={skipUpgrade}>
                        Bỏ qua
                    </button>
                </div>
            </div>
        ) : activeEventCard ? (
             <div className="glassmorphism event-panel">
                <div className="event-label">CƠ HỘI / KHÍ VẬN</div>
                <h2>{activeEventCard.title}</h2>
                <div className="event-text">{activeEventCard.text}</div>
                <button className="btn btn-event-confirm" onClick={resolveEventCard}>
                    XÁC NHẬN
                </button>
            </div>
        ) : (
            <div className="roll-area">
                <div className="turn-indicator glassmorphism" style={{ color: currentP.color }}>
                    Tới lượt của {currentP.name}
                </div>
                
                {currentP?.inJail ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#e74c3c', fontWeight: 600, textAlign: 'center', maxWidth: '120px' }}>
                            🔒 Lắc <b>1</b> hoặc <b>6</b> để ra tù!
                        </div>
                        <button
                            className="btn btn-roll"
                            onClick={handleRollClick}
                            disabled={isMoving || state.isRollingDice}
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%', padding: 0,
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                fontSize: '3rem', border: '4px solid #e74c3c', alignSelf: 'flex-end',
                                background: 'linear-gradient(135deg, #922b21, #e74c3c)',
                                boxShadow: '0 8px 25px rgba(231, 76, 60, 0.6)'
                            }}
                            title="Thử Phá Gông (chỉ ra tù khi lắc 1 hoặc 6)"
                        >
                            🎲
                        </button>
                    </div>
                ) : (
                <button 
                    className="btn btn-roll" 
                    onClick={handleRollClick}
                    disabled={isMoving || state.isRollingDice || currentP?.type === 'bot' || activeQuiz != null || currentP?.inJail}
                    style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%',
                        padding: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '3rem',
                        border: '4px solid white',
                        alignSelf: 'flex-end',
                        boxShadow: '0 8px 25px rgba(241, 196, 15, 0.6)'
                    }}
                    title="Tung Xúc Xắc"
                >
                    🎲
                </button>
                )}
            </div>
        )}
      </div>

      {/* Rules Modal */}
      {isRulesOpen && (
         <div className="rules-overlay">
            <div className="glassmorphism rules-modal">
                <button className="rules-close" onClick={() => setIsRulesOpen(false)}>✖</button>
                <h2>📜 LUẬT CHƠI CỜ TỶ PHÚ 3D</h2>
                <div className="rules-content">
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

      {/* Math Quiz Modal */}
      {activeQuiz && players[activeQuiz.pIndex].type !== 'bot' && (
          <QuizModal activeQuiz={activeQuiz} submitQuizAnswer={submitQuizAnswer} pName={players[activeQuiz.pIndex].name} />
      )}
    </div>
  );
}

function QuizModal({ activeQuiz, submitQuizAnswer, pName }) {
   const [timeLeft, setTimeLeft] = useState(activeQuiz.timeRemaining);
   const [result, setResult] = useState(null); // 'correct', 'wrong', 'timeout'

   useEffect(() => {
       if (result !== null) return;
       setTimeLeft(activeQuiz.timeRemaining);
       
       const tick = setInterval(() => {
           setTimeLeft(prev => {
               if (prev <= 1) {
                   clearInterval(tick);
                   setResult('timeout');
                   setTimeout(() => submitQuizAnswer(-1), 1500);
                   return 0;
               }
               return prev - 1;
           });
       }, 1000);

       return () => clearInterval(tick);
   }, [activeQuiz, result, submitQuizAnswer]);

   const { questionObj, card } = activeQuiz;

   const handleAnswer = (idx) => {
       if (result !== null) return; // Prevent multiple clicks
       const isCorrect = idx === questionObj.correctIndex;
       setResult(isCorrect ? 'correct' : 'wrong');
       setTimeout(() => submitQuizAnswer(idx), 1500);
   };

   let subtitle = 'Trả lời đúng để thoát Tù!';
   if (card) {
       subtitle = `Thẻ Rút: "${card.title}" - ${card.text}`;
   }

   return (
       <div className="ui-overlay quiz-overlay glassmorphism" style={{ zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)' }}>
           <div className="quiz-panel glassmorphism" style={{ width: 'min(450px, 95vw)', maxHeight: '95dvh', overflowY: 'auto', position: 'relative', background: 'linear-gradient(135deg, #2c3e50, #34495e)', padding: 'clamp(14px, 4vw, 24px)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '2px solid #f1c40f', animation: 'popIn 0.3s ease-out' }}>
               
               {result && (
                   <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: result === 'correct' ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', animation: 'popIn 0.2s ease' }}>
                       <div style={{ fontSize: '5rem' }}>{result === 'correct' ? '✅' : (result === 'timeout' ? '⏰' : '❌')}</div>
                       <h1 style={{ color: 'white', margin: '10px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                           {result === 'correct' ? 'CHÍNH XÁC!' : (result === 'timeout' ? 'HẾT GIỜ!' : 'SAI MẤT RỒI!')}
                       </h1>
                   </div>
               )}

               <div className="quiz-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <h2 style={{ margin: 0, color: '#f1c40f', textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontSize: 'clamp(0.9rem, 4vw, 1.4rem)' }}>🧠 Giải Toán {activeQuiz.type === 'gojail' ? 'Kháng Cáo' : 'Nhận Thưởng'}!</h2>
                   <div className="quiz-timer" style={{ 
                       fontSize: 'clamp(14px, 4vw, 24px)', fontWeight: 'bold', 
                       color: timeLeft <= 5 ? '#e74c3c' : '#2ecc71',
                       background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '8px',
                       border: `1px solid ${timeLeft <= 5 ? '#e74c3c' : '#2ecc71'}`,
                       whiteSpace: 'nowrap', flexShrink: 0
                   }}>
                       ⏱ {timeLeft}s
                   </div>
               </div>

               <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', margin: '20px 0', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                   <div style={{ fontSize: '1rem', marginBottom: '10px', color: '#bdc3c7' }}>
                       Lượt của <b style={{ color: 'white' }}>{pName}</b> <br/>
                       <span style={{ color: '#f1c40f' }}>{subtitle}</span>
                   </div>
                   <div style={{ fontSize: 'clamp(1.8rem, 8vw, 3rem)', fontWeight: '900', letterSpacing: '2px', color: '#fff', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                       {questionObj.question}
                   </div>
               </div>

               <div className="quiz-options" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                   {questionObj.answers.map((ans, idx) => (
                       <button 
                           key={idx} 
                           className="btn btn-buy" 
                           style={{ 
                               fontSize: 'clamp(1rem, 5vw, 1.8rem)', padding: 'clamp(10px, 3vw, 20px)', background: 'linear-gradient(to bottom, #4aa3df, #2980b9)', 
                               border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer',
                               boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                           }}
                           onClick={() => handleAnswer(idx)}
                       >
                           {ans}
                       </button>
                   ))}
               </div>
           </div>
       </div>
   );
}
