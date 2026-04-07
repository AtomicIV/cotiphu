import { create } from 'zustand';
import { TILES, GAME_CONFIG, PLAYER_COLORS, PLAYER_ICONS } from './constants';
import { playRoll, playCoin, playNegative, playUpgrade, playJackpot } from './audioEngine';
import { generateMathQuiz } from './mathLogic';

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
    
    set({ isRollingDice: true, currentRoll: roll, shootOrigin: p.pos });
    get().addLog(`🎲 ${p.name} tung xúc xắc và di chuyển ${roll} bước...`);
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
            if (p.inJail) {
             if (roll === 1 || roll === 6) {
                  get().addLog(`🔓 ${p.name} tung được ${roll}, PHÁT TÙ THÀNH CÔNG!`);
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
            get().adjustMoney(pIndex, get().gameConfig.goBonus, 'Đi qua Bắt Đầu');
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
        const taxAmount = tile.basePrice; 
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
        const reward = get().jackpotPool;
        if (reward > 0) {
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
            const rentCost = tile.rent * Math.pow(2, level - 1); // Lv1=x1, Lv2=x2, Lv3=x4
            addLog(`💸 ${p.name} trả ${rentCost} Tỷ thuê nhà Cấp ${level} cho ${owner.name}.`);
            adjustMoney(pIndex, -rentCost, 'Tiền thuê');
            adjustMoney(owner.id, rentCost, 'Thu tiền thuê');
            
            if (!checkBankruptcy(pIndex)) {
                get().endTurn();
            } else {
                get().endTurn();
            }
        } else if (ownerData === undefined) {
            // Đất trống -> Mua mới
            if (p.type === 'bot') {
                if (p.money >= tile.basePrice && Math.random() < get().gameConfig.botBuyChance) {
                    get().buyPropertyDirect(pIndex, tile);
                } else {
                    addLog(`⏭️ ${p.name} (Bot) bỏ qua ${tile.name}.`);
                }
                get().endTurn();
            } else {
                set({ pendingPurchase: { pIndex, cell: tile } });
            }
        } else {
            // Đất của mình -> Có thể Nâng cấp (tối đa cấp 3)
            if (ownerData.level < 3) {
                const upgradeCost = Math.floor(tile.basePrice * 1.5);
                if (p.type === 'bot') {
                    if (p.money >= upgradeCost && Math.random() < get().gameConfig.botBuyChance) {
                        get().upgradePropertyDirect(tile.id, upgradeCost);
                    } else {
                        addLog(`⏭️ ${p.name} (Bot) không xây thêm tại ${tile.name}.`);
                    }
                    get().endTurn();
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
          // Bot takes 2-3 seconds to answer
          setTimeout(() => {
              const stillActive = get().activeQuiz;
              if (stillActive && stillActive.pIndex === p.id) {
                  // Probability of answering correct based on difficulty
                  const diff = get().gameConfig.mathDifficulty || 3;
                  // Base 95% for grade 1, drops by 10% per grade. Grade 6 = 45%
                  const chanceCorrect = 1.0 - (diff * 0.1); 
                  const isCorrect = Math.random() < chanceCorrect;
                  get().submitQuizAnswer(isCorrect ? stillActive.questionObj.correctIndex : -1);
              }
          }, 2000 / state.gameSpeed);
      }
  },

  submitQuizAnswer: (selectedIndex) => {
      const state = get();
      if (!state.activeQuiz) return;
      
      const { type, card, questionObj, pIndex } = state.activeQuiz;
      const isCorrect = selectedIndex === questionObj.correctIndex;
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
              if (isCorrect) {
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

        return { turn: nextTurn };
    });

    const nextP = get().players[get().turn];
    if (nextP.type === 'bot') {
        setTimeout(() => {
            get().rollDice();
        }, 1500 / get().gameSpeed);
    }
  }
}));
