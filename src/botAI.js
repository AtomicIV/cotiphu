// src/botAI.js
// Hệ thống AI thông minh cho bot Monopoly

// =============================================
// PERSONALITY PROFILES - Tính cách Bot
// =============================================
export const BOT_PERSONALITIES = {
    aggressive: {
        id: 'aggressive',
        name: '😤 Tham Lam',
        desc: 'Mua mọi thứ có thể, nâng cấp ngay lập tức.',
        reserveRatio: 0.05,   // Chỉ giữ lại 5% tiền dự phòng
        upgradeEagerness: 0.9, // 90% muốn nâng cấp ngay
        colorGroupBonus: 1.5,  // Cộng thêm điểm cho nhóm màu
        riskTolerance: 0.85,   // Chịu rủi ro cao
    },
    conservative: {
        id: 'conservative',
        name: '🤓 Thận Trọng',
        desc: 'Giữ tiền dự phòng cao, chỉ mua khi tỷ lệ ROI tốt.',
        reserveRatio: 0.35,   // Giữ 35% tiền dự phòng
        upgradeEagerness: 0.4,
        colorGroupBonus: 1.1,
        riskTolerance: 0.35,
    },
    strategic: {
        id: 'strategic',
        name: '🧠 Chiến Lược',
        desc: 'Phân tích kỹ ROI, ưu tiên hoàn thành nhóm màu.',
        reserveRatio: 0.20,
        upgradeEagerness: 0.65,
        colorGroupBonus: 2.5, // Rất ưu tiên hoàn thành nhóm màu
        riskTolerance: 0.6,
    },
    random: {
        id: 'random',
        name: '🎲 Ngẫu Nhiên',
        desc: 'Hành động hoàn toàn ngẫu nhiên (kiểu cũ).',
        reserveRatio: 0,
        upgradeEagerness: 0.5,
        colorGroupBonus: 1.0,
        riskTolerance: 0.5,
    },
};

// =============================================
// DIFFICULTY SETTINGS - Độ khó Bot
// =============================================
export const BOT_DIFFICULTIES = {
    easy: {
        id: 'easy',
        name: '😊 Dễ',
        desc: 'Bot hay quyết định sai.',
        decisionNoise: 0.45,  // Tỷ lệ đưa ra quyết định sai ngẫu nhiên
        quizCorrectBase: 0.45, // Xác suất trả lời đúng quiz (trước điều chỉnh độ khó)
        thinkDelay: [1000, 2000], // Thời gian "nghĩ" (ms)
    },
    medium: {
        id: 'medium',
        name: '😐 Vừa',
        desc: 'Bot cân bằng giữa thông minh và lỗi.',
        decisionNoise: 0.2,
        quizCorrectBase: 0.65,
        thinkDelay: [1200, 2500],
    },
    hard: {
        id: 'hard',
        name: '😈 Khó',
        desc: 'Bot ra quyết định tối ưu, hiếm khi sai.',
        decisionNoise: 0.05,
        quizCorrectBase: 0.88,
        thinkDelay: [800, 1800],
    },
};

// =============================================
// CORE SCORING ENGINE - Động cơ tính điểm
// =============================================

/**
 * Tính điểm ROI của một ô đất
 * Điểm cao = đáng mua hơn
 */
export function scoreProperty(tile, ownership, players, currentMoney, personality) {
    if (tile.basePrice === 0) return 0;

    const rentRatio = tile.rent / tile.basePrice; // Tỷ lệ thuê/giá
    let score = rentRatio * 100; // Base score từ ROI

    // Bonus nếu đất giá đắt hơn (đất cao cấp ưu tiên hơn)
    score += tile.basePrice * 0.5;

    // Bonus nếu cùng nhóm màu với đất mình đã có
    const myProps = Object.entries(ownership)
        .filter(([, v]) => players.find(p => p.id === v.pIndex && p.type === 'bot'))
        .map(([k]) => parseInt(k));
    
    // Check color group adjacency (tiles with same color)
    // Specifically look for same color group tiles nearby
    const colorGroupPenalty = personality?.colorGroupBonus ?? 1.0;
    if (myProps.length > 0) {
        // Simple heuristic: adjacent tiles tend to be same color group
        const isNearOwned = myProps.some(id => Math.abs(id - tile.id) <= 2);
        if (isNearOwned) {
            score *= colorGroupPenalty;
        }
    }

    // Penalty nếu tiền ít so với giá (rủi ro phá sản)
    const reserveRatio = personality?.reserveRatio ?? 0.2;
    const minReserve = currentMoney * reserveRatio;
    if (currentMoney - tile.basePrice < minReserve) {
        score *= 0.3; // Bị phạt nặng nếu sau mua sẽ gần cạn tiền
    }

    return score;
}

/**
 * Tính điểm nâng cấp đất
 */
export function scoreUpgrade(tile, currentLevel, currentMoney, personality) {
    if (tile.basePrice === 0) return 0;
    const upgradeCost = Math.floor(tile.basePrice * 1.5);
    if (currentMoney < upgradeCost) return -1; // Không đủ tiền

    const newRent = tile.rent * Math.pow(2, currentLevel); // Thuê sau nâng cấp
    const currentRent = tile.rent * Math.pow(2, currentLevel - 1);
    const rentGain = newRent - currentRent; // Lợi thêm mỗi lượt
    
    // Điểm = lợi nhuận thêm / chi phí (ROI nâng cấp)
    let score = (rentGain / upgradeCost) * 100;

    // Penalty nếu tiền ít
    const reserveRatio = personality?.reserveRatio ?? 0.2;
    const minReserve = currentMoney * reserveRatio;
    if (currentMoney - upgradeCost < minReserve) {
        score *= 0.2;
    }

    return score;
}

// =============================================
// DECISION MAKER - Bộ quyết định
// =============================================

/**
 * Bot quyết định có mua đất không
 * @returns {boolean}
 */
export function decideBuy(tile, player, ownership, players, personality, difficulty) {
    if (player.money < tile.basePrice) return false;

    // Mode ngẫu nhiên hoàn toàn
    if (personality?.id === 'random') {
        return Math.random() < 0.8;
    }

    const score = scoreProperty(tile, ownership, players, player.money, personality);
    const threshold = 30; // Điểm tối thiểu để mua

    // Thêm nhiễu ngẫu nhiên theo độ khó
    const noise = (difficulty?.decisionNoise ?? 0.2) * (Math.random() - 0.5) * 100;
    const finalScore = score + noise;

    return finalScore > threshold;
}

/**
 * Bot quyết định có nâng cấp không
 * @returns {boolean}
 */
export function decideUpgrade(tile, currentLevel, player, personality, difficulty) {
    const upgradeCost = Math.floor(tile.basePrice * 1.5);
    if (player.money < upgradeCost) return false;

    // Mode ngẫu nhiên
    if (personality?.id === 'random') {
        return Math.random() < 0.8;
    }

    const score = scoreUpgrade(tile, currentLevel, player.money, personality);
    if (score < 0) return false;

    // Eagerness = hứng thú nâng cấp theo tính cách
    const eagerness = personality?.upgradeEagerness ?? 0.6;
    const threshold = (1 - eagerness) * 50;

    const noise = (difficulty?.decisionNoise ?? 0.2) * (Math.random() - 0.5) * 50;
    return (score + noise) > threshold;
}

/**
 * Xác suất bot trả lời đúng quiz theo độ khó toán + độ khó bot
 */
export function getBotQuizCorrectChance(mathDifficulty, difficulty) {
    const base = difficulty?.quizCorrectBase ?? 0.65;
    // Giảm xác suất theo độ khó toán học
    const mathPenalty = (mathDifficulty - 1) * 0.07;
    return Math.max(0.15, Math.min(0.97, base - mathPenalty));
}

/**
 * Lấy delay "thời gian suy nghĩ" ngẫu nhiên của bot
 */
export function getBotThinkDelay(difficulty, gameSpeed) {
    const [min, max] = difficulty?.thinkDelay ?? [1000, 2000];
    const rawDelay = min + Math.random() * (max - min);
    return rawDelay / (gameSpeed || 1);
}
