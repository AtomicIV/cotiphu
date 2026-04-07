let ctx = null;
let sfxGain = null;
let bgmGain = null;
let isMuted = false;
let bgmInterval = null;
let sfxVolume = 0.5;
let bgmVolume = 0.5;

export const initAudio = () => {
    if (ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioContext();
    
    sfxGain = ctx.createGain();
    sfxGain.gain.value = sfxVolume;
    sfxGain.connect(ctx.destination);
    
    bgmGain = ctx.createGain();
    bgmGain.gain.value = bgmVolume;
    bgmGain.connect(ctx.destination);
    
    // Resume context if suspended (Browser policy)
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
};

export const setMute = (muted) => {
    isMuted = muted;
    if (sfxGain) sfxGain.gain.setTargetAtTime(muted ? 0 : sfxVolume, ctx?.currentTime || 0, 0.1);
    if (bgmGain) bgmGain.gain.setTargetAtTime(muted ? 0 : bgmVolume, ctx?.currentTime || 0, 0.1);
};

export const setSfxVolume = (vol) => {
    sfxVolume = vol;
    if (sfxGain && !isMuted) sfxGain.gain.setTargetAtTime(vol, ctx?.currentTime || 0, 0.1);
};

export const setBgmVolume = (vol) => {
    bgmVolume = vol;
    if (bgmGain && !isMuted) bgmGain.gain.setTargetAtTime(vol, ctx?.currentTime || 0, 0.1);
};

export const getMute = () => isMuted;

// Base synthesized sound function
const playTone = (freq, type, duration, vol = 1, slide = 0, isBgm = false) => {
    if (!ctx || isMuted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide !== 0) {
        osc.frequency.exponentialRampToValueAtTime(freq * slide, ctx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(isBgm ? bgmGain : sfxGain);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
};

// Hop (Token jumping on board)
export const playHop = () => {
    playTone(400, 'sine', 0.1, 0.15, 1.5);
};

// Dice Roll (Rattle effect)
export const playRoll = () => {
    if (!ctx || isMuted) return;
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            playTone(800 + Math.random() * 400, 'square', 0.05, 0.1);
        }, i * 80);
    }
};

// Buy / Cash in
export const playCoin = () => {
    if (!ctx || isMuted) return;
    playTone(987.77, 'square', 0.1, 0.15); // B5
    setTimeout(() => playTone(1318.51, 'square', 0.3, 0.15), 100); // E6
};

// Pay rent / Tax / Go to Jail
export const playNegative = () => {
    if (!ctx || isMuted) return;
    playTone(150, 'sawtooth', 0.2, 0.2, 0.5); // Slide down
    setTimeout(() => playTone(100, 'sawtooth', 0.4, 0.2, 0.5), 200);
};

// Upgrade Property
export const playUpgrade = () => {
    if (!ctx || isMuted) return;
    playTone(440, 'square', 0.1, 0.15);
    setTimeout(() => playTone(554.37, 'square', 0.1, 0.15), 100);
    setTimeout(() => playTone(659.25, 'square', 0.3, 0.15), 200);
};

// Jackpot
export const playJackpot = () => {
    if (!ctx || isMuted) return;
    [
        [523.25, 0], [659.25, 100], [783.99, 200], [1046.50, 300],
        [783.99, 450], [1046.50, 600]
    ].forEach(([freq, delay]) => {
        setTimeout(() => playTone(freq, 'square', 0.2, 0.15), delay);
    });
};

// Simple BGM Sequence
export const startBGM = () => {
    if (!ctx) return;
    stopBGM();
    
    // A bouncy baseline
    const notes = [
        130.81, 196.00, 130.81, 164.81, 
        146.83, 220.00, 146.83, 174.61,
        130.81, 196.00, 130.81, 164.81,
        123.47, 196.00, 246.94, 196.00
    ];
    let step = 0;
    
    bgmInterval = setInterval(() => {
        if (!isMuted && ctx.state === 'running') {
            const freq = notes[step % notes.length];
            // Quiet, staccato bass notes
            playTone(freq, 'triangle', 0.15, 0.05, 0, true); 
            step++;
        }
    }, 250); // 120 BPM roughly (2 eighth notes per beat)
};

export const stopBGM = () => {
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
};
