import { create } from 'zustand';
import { TILES, GAME_CONFIG, PLAYER_COLORS, PLAYER_ICONS } from './constants';
import { playRoll, playCoin, playNegative, playUpgrade, playJackpot } from './audioEngine';

import { BOT_PERSONALITIES, BOT_DIFFICULTIES, decideBuy, decideUpgrade, getBotThinkDelay, decideEvent } from './botAI';

export const useStore = create((set, get) => ({
  gameState: 'setup', // 'setup' | 'playing'
  gameSpeed: 1, // Tốc độ game (1x, 2x, 3x)
  isRollingDice: false, // Quản lý vòng lặp xúc xắc
  shootOrigin: null, // Lưu vị trí bắt đầu bắn laze
  tiles: TILES, // State động cho tiles (để random tên đường)
  gameConfig: {
      startingMoney: 1500,
      goBonus: 200,
      botBuyChance: 0.8,
      botDifficulty: 'medium',
      mathDifficulty: 3,
      mathTimeout: 15
  },
  players: [],
  turn: 0,
  ownership: {}, // tileId -> playerId
  log: ['Đang tải cấu hình game...'],
  currentRoll: null,
  isMoving: false,
  pendingPurchase: null, // { pIndex, cell }
  pendingUpgrade: null,  // { pIndex, cell, currentLevel, upgradeCost }
  activeQuiz: null, // deprecated
  activeDecision: null, // { title, desc, choices: [], pIndex }
  jackpotPool: 0,
  effects: [],
  roundCount: 0,
  activeMarketEvent: null, // { type: 'boom'|'crisis'|'discount', color?: string, duration: number }

  spawnEffect: (pos, text, color, type) => set((state) => {
      const existingAtPos = state.effects.filter(e => e.pos === pos).length;
      return {
          effects: [...state.effects, { id: Date.now() + Math.random(), pos, text, color, type, offsetY: existingAtPos * 1.5 }]
      };
  }),
  removeEffect: (id) => set((state) => ({
      effects: state.effects.filter(e => e.id !== id)
  })),

  toggleSpeed: () => set(state => ({ gameSpeed: state.gameSpeed === 1 ? 2 : state.gameSpeed === 2 ? 5 : state.gameSpeed === 5 ? 10 : state.gameSpeed === 10 ? 20 : 1 })),
  
  addLog: (msg) => set((state) => ({ log: [msg, ...state.log] })), // Do not slice, allow scrolling in UI

  resetToSetup: () => set({ gameState: 'setup' }),

  setupGame: (customPlayers, config) => {
    const newPlayers = customPlayers.map((p, i) => ({
        id: i,
        name: p.name || `Người chơi ${i+1}`,
        type: p.type,
        personality: p.type === 'bot' ? (BOT_PERSONALITIES[p.personality] || BOT_PERSONALITIES.strategic) : null,
        shapeId: p.shapeId !== undefined ? p.shapeId : i,
        money: config ? config.startingMoney : 30,
        pos: 0,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        icon: PLAYER_ICONS[i % PLAYER_ICONS.length],
        inJail: false,
        bankrupt: false
    }));

    // Randomize Vietnamese names for properties/stations
    const POOL = [
        'Nguyễn Huệ', 'Lê Lợi', 'Trần Phú', 'Phố Cổ', 'Bến Thành', 'Hồ Gươm', 'Cầu Rồng', 'Phố Đi Bộ',
        'Hàm Nghi', 'Bà Nà', 'Mũi Né', 'Tháp Bà', 'Tôn Đ.Thắng', 'Lê Duẩn', 'Chợ Lớn', 'Landmark', 
        'Tràng Tiền', 'Hồ Tây', 'Cát Bà', 'Sơn Đoòng', 'Ng. Trãi', 'Hoàng Sa', 'H. Kiếm', 'Bitexco'
    ];
    const shuffledPool = [...POOL].sort(() => Math.random() - 0.5);
    let nIdx = 0;
    const newTiles = TILES.map(t => {
        if (t.type === 'property' || t.type === 'station') {
            return { ...t, name: shuffledPool[nIdx++] };
        }
        return t;
    });
    
    set({
        gameState: 'playing',
        players: newPlayers,
        gameConfig: config || get().gameConfig,
        gameSpeed: config ? config.gameSpeed : 1,
        tiles: newTiles,
        turn: 0,
        ownership: {},
        log: ['🎯 Trò chơi bắt đầu!'],
        pendingPurchase: null,
        pendingUpgrade: null,
        activeEventCard: null,
        activeQuiz: null,
        jackpotPool: 0,
        isMoving: false,
        currentRoll: null
    });

    // Nếu player đầu tiên là bot, tự động kích hoạt
    if (newPlayers[0].type === 'bot') {
        setTimeout(() => get().rollDice(), 1500 / get().gameSpeed);
    }
  },

  adjustMoney: (pIndex, amount, reason = '') => {
    set(state => {
        const newPlayers = [...state.players];
        const p = newPlayers[pIndex];
        if (amount !== 0) {
            get().spawnEffect(p.pos, amount > 0 ? `+ ${amount} Tỷ` : `- ${-amount} Tỷ`, amount > 0 ? '#2ecc71' : '#e74c3c', amount > 0 ? 'money_gain' : 'money_lose');
            if (amount > 0) playCoin();
            else playNegative();
        }
        p.money += amount;
        if (reason) {
            state.log = [`${amount > 0 ? '🤑' : '💸'} ${p.name} ${amount > 0 ? '+' : '-'}${Math.abs(amount)} Tỷ (${reason})`, ...state.log].slice(0, 10);
        }
        return { players: newPlayers };
    });
  },

  checkBankruptcy: (pIndex) => {
      const p = get().players[pIndex];
      if (p.money < 0) {
          get().addLog(`💀 ${p.name} đã PHÁ SẢN!`);
          set(state => {
              const newPlayers = [...state.players];
              newPlayers[pIndex].bankrupt = true;
              
              // Clear ownership
              const newOwnership = { ...state.ownership };
              for (const cellId in newOwnership) {
                  if (newOwnership[cellId].pIndex === p.id) {
                      delete newOwnership[cellId];
                  }
              }
              return { players: newPlayers, ownership: newOwnership };
          });
          get().checkWinCondition();
          return true;
      }
      return false;
  },

  checkWinCondition: () => {
      const activePlayers = get().players.filter(p => !p.bankrupt);
      if (activePlayers.length === 1) {
          get().addLog(`🏆 ${activePlayers[0].name} ĐÃ CHIẾN THẮNG TRÒ CHƠI!`);
          // end game logic can be added here
      }
  },

  rollDice: (chargeLevel = 0) => {
    const state = get();
    if (state.isMoving || state.pendingPurchase || state.gameState !== 'playing' || state.isRollingDice) return;
    
    const pIndex = state.turn;
    const p = state.players[pIndex];

    if (p.bankrupt) {
        get().endTurn();
        return;
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    
    const rollMsg = p.inJail
        ? `🎲 ${p.name} lắc xúc xắc thử phá gông, ra số ${roll}...`
        : `🎲 ${p.name} tung xúc xắc và di chuyển ${roll} bước...`;
    set({ isRollingDice: true, currentRoll: roll, shootOrigin: p.pos });
    get().addLog(rollMsg);
    playRoll();
    
    // 0.3s sau thì tia laze mờ dần
    setTimeout(() => set({ shootOrigin: null }), 300);
    
    // Thời gian xoay lơ lửng ngắn t gọn
    const rollDuration = 600;

    // Đợi animation Xúc xắc tung trên trời rồi đáp đất
    setTimeout(() => {
        set({ isRollingDice: false });

        // TRÌ HOÃN THÊM VÀI TRĂM MS ĐỂ ĐỌC SỐ XÚC XẮC TRƯỚC KHI ĐI!
        setTimeout(() => {
            let escapeJail = false;
            if (p.inJail) {
                 if (roll === 1 || roll === 6) {
                      escapeJail = true;
                      get().addLog(`🔓 ${p.name} tung xúc xắc PHÁT TÙ THÀNH CÔNG!`);
                      const np = [...get().players];
                      np[pIndex] = { ...np[pIndex], inJail: false };
                      set({ players: np });
                 } else {
                      get().addLog(`🔒 ${p.name} tung được ${roll}, tiếp tục mọt gông trong tù.`);
                      get().endTurn();
                      return;
                 }
            }

        set({ isMoving: true });

        
        let currentPos = p.pos;
        const targetPos = (currentPos + roll) % get().tiles.length;
        
        // Check passing GO
        if (currentPos + roll >= get().tiles.length) {
            let bonus = get().gameConfig.goBonus;
            if (p.shapeId === 6) bonus *= 2; // Pikachu tốc độ
            get().adjustMoney(pIndex, bonus, 'Đi qua Bắt Đầu');
        }

        const updatedPlayers = [...get().players];
        updatedPlayers[pIndex] = { ...updatedPlayers[pIndex], pos: targetPos };
        
        // Thời gian chờ để animation đi xong (khoảng 1-2s tùy roll)
        setTimeout(() => {
            set({ isMoving: false });
            get().resolveTile(targetPos, pIndex);
        }, 1500 / get().gameSpeed);

        set({ players: updatedPlayers });

        }, 700 / get().gameSpeed); // Thời gian delay chờ xem xúc xắc

    }, rollDuration / state.gameSpeed);
  },

  resolveTile: (tileId, pIndex) => {
    const state = get();
    const p = state.players[pIndex];
    const tile = state.tiles[tileId];
    const { players, ownership, addLog, adjustMoney, checkBankruptcy } = get();

    if (tile.type === 'start') {
        get().endTurn();
    } else if (tile.type === 'tax') {
        let taxAmount = tile.basePrice; 
        if (p.shapeId === 0) taxAmount = Math.floor(taxAmount * 0.7); // Spider-Man giảm thuế
        if (p.shapeId === 1) taxAmount = 0; // Superman miễn thuế hoàn toàn
        
        if (taxAmount > 0) {
             set(s => ({ jackpotPool: s.jackpotPool + taxAmount }));
             adjustMoney(pIndex, -taxAmount, 'Đóng thuế');
             addLog(`💰 Quỹ Lễ Hội được cộng thêm ${taxAmount} Tỷ từ tiền thuế!`);
        } else {
             addLog(`✨ ${p.name} được miễn thuế 100% nhờ kỹ năng Công Dân Ưu Tú!`);
        }
        if (!checkBankruptcy(pIndex)) get().endTurn();
    } else if (tile.type === 'chance' || tile.type === 'chest') {
        const EVENTS = [
            {
                title: 'Phi Vụ Chợ Đen',
                desc: 'Khám phá một kho hàng lậu vô chủ. Có nên tham gia tuồn hàng?',
                choices: [
                    { 
                        text: 'Tham dự (Cơ hội ăn 15 Tỷ, 30% đi Tù)',
                        style: 'danger',
                        resolve: (p) => {
                             if (Math.random() < 0.3) {
                                 get().addLog(`🚓 ${p.name} tham lam bị tóm cổ vào TÙ!`);
                                 get().sendToJail(p.id);
                             } else {
                                 get().adjustMoney(p.id, 15, 'Trúng mánh Chợ Đen');
                                 get().endTurn();
                             }
                        }
                    },
                    {
                        text: 'Báo Cảnh sát (An toàn, được thưởng 3 Tỷ)',
                        style: 'safe',
                        resolve: (p) => {
                             get().adjustMoney(p.id, 3, 'Tố giác tội phạm');
                             get().endTurn();
                        }
                    }
                ]
            },
            {
                title: 'Khởi Nghiệp Công Nghệ',
                desc: 'Một startup bạn bè đang gọi vốn 8 Tỷ.',
                choices: [
                    {
                        text: 'Đầu tư (50% x3 số tiền, 50% mất trắng)',
                        style: 'danger',
                        condition: (p) => p.money >= 8,
                        resolve: (p) => {
                            get().adjustMoney(p.id, -8, 'Vốn Startup');
                            if (Math.random() < 0.5) {
                                setTimeout(() => get().adjustMoney(p.id, 24, 'Thưởng Startup IPO'), 800);
                                get().addLog(`🚀 Startup của ${p.name} IPO thành công!`);
                            } else {
                                setTimeout(() => get().addLog(`💸 Startup phá sản, ${p.name} mất trắng vốn!`), 500);
                            }
                            get().endTurn();
                        }
                    },
                    {
                        text: 'Từ chối đầu tư',
                        style: 'safe',
                        resolve: (p) => {
                            get().addLog(`⏭️ ${p.name} chọn giữ tiền an toàn.`);
                            get().endTurn();
                        }
                    }
                ]
            },
            {
                title: 'Cơ Hội Làm Tượng Đài',
                desc: 'Quỹ Lễ hội cần người quyên góp Tạc tượng.',
                choices: [
                    {
                        text: 'Góp 5 Tỷ (Nhận Khí Vận may mắn)',
                        style: 'buy',
                        condition: (p) => p.money >= 5,
                        resolve: (p) => {
                            get().adjustMoney(p.id, -5, 'Tạc tượng');
                            set(s => ({ jackpotPool: s.jackpotPool + 5 }));
                            get().addLog(`✨ Nhờ tạc tượng, ${p.name} nhận được phúc lành!`);
                            setTimeout(() => get().adjustMoney(p.id, 12, 'Phước lành'), 800);
                            get().endTurn();
                        }
                    },
                    {
                        text: 'Bỏ qua đi thẳng',
                        style: 'safe',
                        resolve: () => get().endTurn()
                    }
                ]
            }
        ];
        
        const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        set({ activeDecision: { ...event, pIndex } });
        get().checkBotDecision();
    } else if (tile.type === 'gojail') {
        set({ activeDecision: {
            title: 'Cảnh Sát Giao Thông',
            desc: 'Bạn bị tóm vì vượt đèn đỏ và kẹt xe! Đóng phạt nhanh hay lên đồn?',
            pIndex,
            choices: [
                {
                    text: 'Nộp phạt 10 Tỷ (Chạy lỗi)',
                    style: 'buy',
                    condition: (p) => p.money >= 10,
                    resolve: (p) => {
                         get().adjustMoney(p.id, -10, 'Nộp phạt vi phạm');
                         set(s => ({ jackpotPool: s.jackpotPool + 10 }));
                         get().endTurn();
                    }
                },
                {
                    text: 'Lên Đồn (Vào Tù)',
                    style: 'danger',
                    resolve: (p) => {
                         get().sendToJail(p.id);
                    }
                }
            ]
        }});
        get().checkBotDecision();
    } else if (tile.type === 'jail') {
        addLog(`📍 ${p.name} vào thăm rạp giam.`);
        get().endTurn();
    } else if (tile.type === 'parking') {
        let reward = get().jackpotPool;
        if (reward > 0) {
             if (p.shapeId === 4) reward = Math.floor(reward * 1.5); // Batman Quỹ Đen
             addLog(`🎉 ${p.name} tới Lễ Hội! HỐT TRỌN GIẢI JACKPOT ${reward} TỔNG!`);
             playJackpot();
             adjustMoney(pIndex, reward, 'Jackpot Lễ Hội');
             set({ jackpotPool: 0 });
        } else {
             addLog(`📍 ${p.name} dừng ở Lễ Hội (Quỹ đang rỗng).`);
        }
        get().endTurn();
    } else if (tile.type === 'property' || tile.type === 'station') {
        const ownerData = ownership[tile.id]; // Dạng { pIndex, level }
        
        if (ownerData !== undefined && ownerData.pIndex !== p.id) {
            // Trả tiền cước
            const owner = players.find(x => x.id === ownerData.pIndex);
            const level = ownerData.level;
            
            // Xử lý cơ bản & Sự kiện thị trường 
            let rentCost = tile.rent * Math.pow(2, level - 1); // Lv1=x1, Lv2=x2, Lv3=x4
            if (state.activeMarketEvent?.type === 'crisis') rentCost = Math.floor(rentCost / 2);
            if (state.activeMarketEvent?.type === 'boom' && state.activeMarketEvent.color === tile.color) rentCost *= 3;
            
            // ĐỘC QUYỀN VÙNG MIỀN (Monopoly Synergy)
            const sameColorTiles = state.tiles.filter(t => t.type === 'property' && t.color === tile.color);
            const isMonopoly = sameColorTiles.length > 0 && sameColorTiles.every(t => state.ownership[t.id]?.pIndex === owner.id);
            if (isMonopoly) {
                 rentCost *= 2; 
                 get().spawnEffect(tile.id, 'ĐỘC QUYỀN x2!', '#9b59b6', 'synergy');
            }
            
            // Passives
            if (owner.shapeId === 2) rentCost = Math.floor(rentCost * 1.25); // Huggy Wuggy hút máu
            if (p.shapeId === 0) rentCost = Math.floor(rentCost * 0.7); // Spider-Man giảm nộp
            
            rentCost = Math.max(1, rentCost); // Tối thiểu 1 Tỷ

            addLog(`💸 ${p.name} trả ${rentCost} Tỷ thuê nhà Cấp ${level} cho ${owner.name}. ${isMonopoly ? '(Bị Độc Quyền)' : ''}`);
            adjustMoney(pIndex, -rentCost, 'Tiền thuê');
            adjustMoney(owner.id, rentCost, 'Thu tiền thuê');
            
            // Creeper nổ phá nhà
            if (p.shapeId === 5 && level > 1 && Math.random() < 0.2) {
                setTimeout(() => {
                     set(s => ({ ownership: { ...s.ownership, [tile.id]: { pIndex: owner.id, level: level - 1 } } }));
                     addLog(`💥 ${p.name} (Bùng Nổ) làm nổ tung nhà ${owner.name} xuống cấp ${level - 1}!`);
                }, 1000);
            }
            
            if (!checkBankruptcy(pIndex)) {
                get().endTurn();
            } else {
                get().endTurn();
            }
        } else if (ownerData === undefined) {
            // Đất trống -> Mua mới
            let buyPrice = tile.basePrice;
            if (p.shapeId === 3) buyPrice = Math.floor(buyPrice * 0.75); // Iron Man giảm giá
            if (state.activeMarketEvent?.type === 'discount') buyPrice = Math.floor(buyPrice / 2);
            buyPrice = Math.max(1, buyPrice); // Tối thiểu 1 tỷ
            
            const effectiveTile = { ...tile, basePrice: buyPrice };

            if (p.type === 'bot') {
                const botDiff = BOT_DIFFICULTIES[get().gameConfig.botDifficulty] || BOT_DIFFICULTIES.medium;
                const shouldBuy = decideBuy(effectiveTile, p, state.ownership, state.players, p.personality, botDiff);
                if (shouldBuy) {
                    const thinkDelay = getBotThinkDelay(botDiff, get().gameSpeed);
                    setTimeout(() => {
                        addLog(`🤖 ${p.name} phân tích và quyết định MUA ${tile.name}!`);
                        get().buyPropertyDirect(pIndex, effectiveTile);
                        get().endTurn();
                    }, thinkDelay);
                } else {
                    addLog(`⏭️ ${p.name} (Bot) đánh giá và bỏ qua ${tile.name}.`);
                    get().endTurn();
                }
            } else {
                set({ pendingPurchase: { pIndex, cell: effectiveTile } });
            }
        } else {
            // Đất của mình -> Có thể Nâng cấp (tối đa cấp 3)
            if (ownerData.level < 3) {
                let upgradeCost = Math.floor(tile.basePrice * 1.5);
                if (p.shapeId === 3) upgradeCost = Math.floor(upgradeCost * 0.75); // Iron Man
                if (state.activeMarketEvent?.type === 'discount') upgradeCost = Math.floor(upgradeCost / 2);
                upgradeCost = Math.max(1, upgradeCost);

                if (p.type === 'bot') {
                    const botDiff = BOT_DIFFICULTIES[get().gameConfig.botDifficulty] || BOT_DIFFICULTIES.medium;
                    const mockedTile = { ...tile, basePrice: upgradeCost }; // for decideUpgrade computation
                    const shouldUpgrade = decideUpgrade(mockedTile, ownerData.level, p, p.personality, botDiff);
                    if (shouldUpgrade) {
                        const thinkDelay = getBotThinkDelay(botDiff, get().gameSpeed);
                        setTimeout(() => {
                            addLog(`🏗️ ${p.name} quyết định NÂNG CẤP ${tile.name} lên Cấp ${ownerData.level + 1}!`);
                            get().upgradePropertyDirect(tile.id, upgradeCost);
                            get().endTurn();
                        }, thinkDelay);
                    } else {
                        addLog(`⏭️ ${p.name} (Bot) giữ nguyên ${tile.name} (không đủ lợi).`);
                        get().endTurn();
                    }
                } else {
                    set({ pendingUpgrade: { pIndex, cell: tile, currentLevel: ownerData.level, upgradeCost } });
                }
            } else {
                addLog(`🏡 ${p.name} nghỉ ngơi tại khu Đất Cấp Tối Đa.`);
                get().endTurn();
            }
        }
    }
  },

  buyPropertyDirect: (pIndex, cell) => {
      const { adjustMoney, players } = get();
      const p = players[pIndex];
      adjustMoney(pIndex, -cell.basePrice, 'Mua ' + cell.name);
      
      set(s => ({
          ownership: { ...s.ownership, [cell.id]: { pIndex: p.id, level: 1 } }
      }));
      get().spawnEffect(p.pos, 'SỞ HỮU!', '#f1c40f', 'buy');
  },

  buyPropertyInteraction: () => {
      const { pendingPurchase, buyPropertyDirect } = get();
      if (!pendingPurchase) return;
      
      buyPropertyDirect(pendingPurchase.pIndex, pendingPurchase.cell);
      set({ pendingPurchase: null });
      get().endTurn();
  },

  skipPurchase: () => {
      const { pendingPurchase, addLog, players } = get();
      if (!pendingPurchase) return;
      addLog(`⏭️ ${players[pendingPurchase.pIndex].name} quyết định hủy mua ${pendingPurchase.cell.name}.`);
      set({ pendingPurchase: null });
      get().endTurn();
  },

  upgradePropertyDirect: (tileId, cost) => {
      const { adjustMoney, ownership, turn } = get();
      const ownerData = ownership[tileId];
      if (!ownerData || ownerData.level >= 3) return;

      adjustMoney(turn, -cost, 'Nâng cấp BĐS');
      set(s => ({
          ownership: { ...s.ownership, [tileId]: { pIndex: ownerData.pIndex, level: ownerData.level + 1 } }
      }));
      playUpgrade();
      get().spawnEffect(get().players[turn].pos, `LÊN CẤP ${ownerData.level + 1}!`, '#e74c3c', 'upgrade');
  },

  upgradePropertyInteraction: () => {
      const { pendingUpgrade, upgradePropertyDirect } = get();
      if (!pendingUpgrade) return;

      upgradePropertyDirect(pendingUpgrade.cell.id, pendingUpgrade.upgradeCost);
      set({ pendingUpgrade: null });
      get().endTurn();
  },

  skipUpgrade: () => {
      const { pendingUpgrade, addLog, players } = get();
      if (!pendingUpgrade) return;
      
      addLog(`⏭️ ${players[pendingUpgrade.pIndex].name} quyết định giữ nguyên hiện trạng ${pendingUpgrade.cell.name}.`);
      set({ pendingUpgrade: null });
      get().endTurn();
  },

  sendToJail: (pId) => {
      set(s => {
          const np = [...s.players];
          const idx = np.findIndex(x => x.id === pId);
          if (idx !== -1) {
              np[idx].pos = 6;
              np[idx].inJail = true;
          }
          return { players: np };
      });
      get().endTurn();
  },

  checkBotDecision: () => {
      const state = get();
      if (!state.activeDecision) return;
      
      const evt = state.activeDecision;
      const p = state.players[evt.pIndex];
      
      if (p.type === 'bot') {
          const botDiff = BOT_DIFFICULTIES[state.gameConfig.botDifficulty] || BOT_DIFFICULTIES.medium;
          const thinkDelay = getBotThinkDelay(botDiff, state.gameSpeed);
          
          setTimeout(() => {
              const stillActive = get().activeDecision;
              if (stillActive && stillActive.pIndex === p.id) {
                  // Lấy choices có thể bấm được
                  const possibleChoices = stillActive.choices.map((c, i) => ({
                      ...c,
                      index: i,
                      disabled: c.condition && !c.condition(p)
                  }));
                  
                  const cIndex = decideEvent(possibleChoices, p, p.personality, botDiff);
                  if (cIndex !== -1 && stillActive.choices[cIndex]) {
                      get().addLog(`🤖 ${p.name} (Bot) đã chọn: "${stillActive.choices[cIndex].text}"`);
                      get().submitDecision(cIndex);
                  }
              }
          }, thinkDelay * 1.5); // Bot suy nghĩ ra quyết định lâu hơn chút
      }
  },

  submitDecision: (index) => {
      const state = get();
      if (!state.activeDecision) return;
      
      const evt = state.activeDecision;
      const p = state.players[evt.pIndex];
      const choice = evt.choices[index];
      
      // Execute the decision side effect
      set({ activeDecision: null });
      if (choice && choice.resolve) {
          choice.resolve(p);
      } else {
          // Fallback
          get().endTurn();
      }
  },

  endTurn: () => {
    set(state => {
        let nextTurn = (state.turn + 1) % state.players.length;
        // Bỏ qua người đã phá sản
        while (state.players[nextTurn].bankrupt && nextTurn !== state.turn) {
            nextTurn = (nextTurn + 1) % state.players.length;
        }
        
        let newRoundCount = state.roundCount;
        let newMarketEvent = state.activeMarketEvent;
        const newLog = [...state.log];

        if (nextTurn === 0) {
            newRoundCount++;
            
            // Xử lý giảm duration event
            if (newMarketEvent) {
                newMarketEvent.duration--;
                if (newMarketEvent.duration <= 0) {
                    newLog.unshift(`🌤️ Sự kiện thị trường đã kết thúc, giá cả bình ổn trở lại.`);
                    newMarketEvent = null;
                }
            }
            
            // Mỗi 4 vòng (round), trigger Market Event
            if (newRoundCount % 4 === 0 && !newMarketEvent) {
                const events = [
                    { type: 'boom', name: 'Bùng Nổ Du Lịch', desc: 'Nhóm Tỉnh Thành Du Lịch được nhân 3 Tiền Thuê', color: '#e91e63' }, // Hồng / Du lịch
                    { type: 'crisis', name: 'Khủng Hoảng Mùa Đông', desc: 'Tất cả tiền thuê nhà trên bản đồ giảm 50%', duration: 1 },
                    { type: 'discount', name: 'Trợ Giá Kiến Thiết', desc: 'Mua đất và Nâng cấp hôm nay chỉ còn nửa giá!', duration: 1 },
                    { type: 'jackpot_fill', name: 'Xổ Số Quốc Gia', desc: 'Chính phủ bơm 20 Tỷ vào Quỹ Lễ Hội!', amount: 20 }
                ];
                const evt = events[Math.floor(Math.random() * events.length)];
                newLog.unshift(`🚨 SỰ KIỆN THỊ TRƯỜNG: ${evt.name}! ${evt.desc}`);
                
                if (evt.type === 'jackpot_fill') {
                     setTimeout(() => get().spawnEffect(12, "+20 TỶ JACKPOT", "#f1c40f", "jackpot"), 500);
                     set(s => ({ jackpotPool: s.jackpotPool + evt.amount }));
                } else {
                     newMarketEvent = { type: evt.type, color: evt.color, duration: evt.duration || 1 };
                }
            }
        }

        return { turn: nextTurn, roundCount: newRoundCount, activeMarketEvent: newMarketEvent, log: newLog.slice(0, 20) };
    });

    const nextP = get().players[get().turn];
    if (nextP && nextP.type === 'bot' && !nextP.bankrupt) {
        setTimeout(() => {
            get().rollDice();
        }, 1500 / get().gameSpeed);
    }
  }
}));
