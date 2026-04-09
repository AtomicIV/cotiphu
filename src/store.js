import { create } from 'zustand';
import { TILES, GAME_CONFIG, PLAYER_COLORS, PLAYER_ICONS } from './constants';
import { playRoll, playCoin, playNegative, playUpgrade, playJackpot } from './audioEngine';
import { generateMathQuiz } from './mathLogic';
import { BOT_PERSONALITIES, BOT_DIFFICULTIES, decideBuy, decideUpgrade, getBotQuizCorrectChance, getBotThinkDelay } from './botAI';

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
  activeEventCard: null, // { title, text, type, amount }
  activeQuiz: null, // { type: 'jail'|'chance'|'chest'|'gojail', card?: {...}, targetPos?: number, questionObj, timeRemaining, pIndex }
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
                 if (roll === 1 || roll === 6 || p.shapeId === 1 /* Superman bay lượn */) {
                      escapeJail = true;
                      get().addLog(`🔓 ${p.name} ${p.shapeId === 1 ? '(Sức Mạnh Bay Lượn) ' : 'tung xúc xắc ' }PHÁT TÙ THÀNH CÔNG!`);
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
        set(s => ({ jackpotPool: s.jackpotPool + taxAmount }));
        adjustMoney(pIndex, -taxAmount, 'Đóng thuế');
        addLog(`💰 Quỹ Lễ Hội được cộng thêm ${taxAmount} Tỷ từ tiền thuế!`);
        if (!checkBankruptcy(pIndex)) get().endTurn();
    } else if (tile.type === 'chance' || tile.type === 'chest') {
        const CHANCE_CARDS = [
            { title: 'Tốc Hành', text: 'Chuyến bay thẳng đến vạch Xuất Phát. Nhận ngay khoản thưởng!', type: 'go', targetPos: 0 },
            { title: 'Bị Cải Tạo', text: 'Bị tuần tra gô cổ vào Tù. Thu hồi giấy phép.', type: 'jail', targetPos: 6 },
            { title: 'Trúng Số', text: 'Trúng vé số độc đắc. Nhận khoản tiền lớn.', type: 'money', amount: 10 },
            { title: 'Đóng Phạt', text: 'Vi phạm luật. Trừ tiền đút vào Quỹ Lễ Hội.', type: 'tax', amount: 3 },
            { title: 'Sinh Nhật', text: 'Được chuyển khoản quà sinh nhật bất ngờ.', type: 'money', amount: 5 },
            { title: 'Bảo Trì', text: 'Cột điện nhà bị hỏng. Đóng phạt ngay lập tức.', type: 'tax', amount: 2 },
            { title: 'Được Đầu Tư', text: 'Cổ phiếu trên sàn giao dịch phất lên.', type: 'money', amount: 8 },
            { title: 'Trễ Phà', text: 'Phải đóng phạt phí chờ đợi để di chuyển.', type: 'tax', amount: 1 },
        ];
        const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
        
        const qObj = generateMathQuiz(state.gameConfig.mathDifficulty || 3);
        set({ activeQuiz: { type: tile.type, card, questionObj: qObj, timeRemaining: state.gameConfig.mathTimeout || 15, pIndex: pIndex } });
        get().checkBotQuiz();
    } else if (tile.type === 'gojail') {
        const qObj = generateMathQuiz(state.gameConfig.mathDifficulty || 3);
        set({ activeQuiz: { type: 'gojail', questionObj: qObj, timeRemaining: state.gameConfig.mathTimeout || 15, pIndex: pIndex } });
        get().checkBotQuiz();
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

  resolveEventCard: () => {
      const { activeEventCard, turn, adjustMoney, checkBankruptcy, addLog } = get();
      if (!activeEventCard) return;

      const pIndex = turn;
      const p = get().players[pIndex];
      const card = activeEventCard;

      set({ activeEventCard: null });

      if (card.type === 'money') {
          adjustMoney(pIndex, card.amount, card.title);
      } else if (card.type === 'tax') {
          set(s => ({ jackpotPool: s.jackpotPool + card.amount }));
          adjustMoney(pIndex, -card.amount, card.title);
          addLog(`💰 Quỹ Lễ Hội nhận ${card.amount} Tỷ từ ${p.name}!`);
      } else if (card.type === 'go') {
          set(s => {
              const np = [...s.players];
              np[pIndex].pos = card.targetPos;
              return { players: np };
          });
          adjustMoney(pIndex, get().gameConfig.goBonus, card.title);
          // Cho player đi luôn không cần roll animation vì bốc bài
      } else if (card.type === 'jail') {
          set(s => {
              const np = [...s.players];
              np[pIndex].pos = card.targetPos;
              np[pIndex].inJail = true;
              return { players: np };
          });
          addLog(`🚓 Bốc bài gô cổ! ${p.name} vô thẳng Tù.`);
      }

      if (!checkBankruptcy(pIndex)) {
          get().endTurn();
      }
  },

  checkBotQuiz: () => {
      const state = get();
      if (!state.activeQuiz) return;
      const p = state.players[state.activeQuiz.pIndex];
      if (p.type === 'bot') {
          const botDiff = BOT_DIFFICULTIES[state.gameConfig.botDifficulty] || BOT_DIFFICULTIES.medium;
          const mathDiff = state.gameConfig.mathDifficulty || 3;
          const chanceCorrect = getBotQuizCorrectChance(mathDiff, botDiff);
          const thinkDelay = getBotThinkDelay(botDiff, state.gameSpeed);
          
          setTimeout(() => {
              const stillActive = get().activeQuiz;
              if (stillActive && stillActive.pIndex === p.id) {
                  const isCorrect = Math.random() < chanceCorrect;
                  const emoji = isCorrect ? '🧠' : '😵';
                  get().addLog(`${emoji} ${p.name} (Bot ${botDiff.name}) đang giải toán...`);
                  get().submitQuizAnswer(isCorrect ? stillActive.questionObj.correctIndex : -1);
              }
          }, thinkDelay);
      }
  },

  submitQuizAnswer: (selectedIndex) => {
      const state = get();
      if (!state.activeQuiz) return;
      
      const { type, card, questionObj, pIndex } = state.activeQuiz;
      let isCorrect = selectedIndex === questionObj.correctIndex;
      const p = state.players[pIndex];
      
      set({ activeQuiz: null });
      
      if (type === 'gojail') {
          if (isCorrect) {
              get().addLog(`🎓 ${p.name} TRẢ LỜI ĐÚNG! Trắng án, thoát khởi việc Đi Tù!`);
              get().endTurn();
          } else {
              get().addLog(`🚓 TRẢ LỜI SAI (hoặc Hết giờ)! ${p.name} BỊ BẮT VÀO TÙ!`);
              playNegative();
              set(s => {
                  const np = [...s.players];
                  np[pIndex].pos = 6;
                  np[pIndex].inJail = true;
                  return { players: np };
              });
              get().endTurn();
          }
      } else if (type === 'chance' || type === 'chest') {
          // Good cards vs Bad cards
          const isBadCard = ['tax', 'jail'].includes(card.type);
          if (isBadCard) {
              if (p.shapeId === 7) isCorrect = true; // Minion may mắn (miễn phạt)
              
              if (isCorrect) {
                  get().addLog(`🎓 ${p.name} giải toán đúng thẻ Xấu! KHÁNG CÁO THÀNH CÔNG, KHÔNG BỊ PHẠT!`);
                  get().endTurn();
              } else {
                  get().addLog(`❌ Giải toán thất bại thẻ Xấu! Hình phạt nhân đôi!`);
                  if (card.amount) card.amount *= 2;
                  set({ activeEventCard: card }); // Pass to confirm screen
              }
          } else {
              // Good card
              if (isCorrect || p.shapeId === 7 /* Minion auto win good */) {
                  get().addLog(`🎓 ${p.name} XUẤT SẮC! Thẻ Thưởng nhân đôi giá trị!`);
                  if (card.amount) card.amount *= 2;
                  set({ activeEventCard: card });
              } else {
                  get().addLog(`❌ Trả lời sai rùi! ${p.name} nhận mức Thưởng gốc.`);
                  set({ activeEventCard: card });
              }
          }
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
