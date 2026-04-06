<script>
    import { Canvas } from '@threlte/core';
    import Scene from './Scene.svelte';
    
    import { fade, scale, fly } from 'svelte/transition';

    const cells = [
        { id: 0, name: 'Bắt Đầu', type: 'start', color: '#ffeb3b', price: 0, rent: 0, r: 7, c: 7, d: 'Nhận $200', icon: '🏁' },
        { id: 1, name: 'Hà Nội', type: 'property', color: '#8bc34a', price: 100, rent: 10, r: 7, c: 6, icon: '🏙️' },
        { id: 2, name: 'Cơ Hội', type: 'chance', color: '#03a9f4', price: 0, rent: 0, r: 7, c: 5, icon: '🎁' },
        { id: 3, name: 'Hải Phòng', type: 'property', color: '#8bc34a', price: 120, rent: 12, r: 7, c: 4, icon: '⚓' },
        { id: 4, name: 'Thuế', type: 'tax', color: '#f44336', price: 200, rent: 0, r: 7, c: 3, icon: '💸' },
        { id: 5, name: 'Quảng Ninh', type: 'property', color: '#8bc34a', price: 150, rent: 15, r: 7, c: 2, icon: '⛰️' },
        { id: 6, name: 'Nhà Tù', type: 'jail', color: '#9e9e9e', price: 0, rent: 0, r: 7, c: 1, d: 'Vào thăm', icon: '🏢' },
        { id: 7, name: 'Đà Nẵng', type: 'property', color: '#e91e63', price: 200, rent: 20, r: 6, c: 1, icon: '🌉' },
        { id: 8, name: 'Khí Vận', type: 'chest', color: '#ff9800', price: 0, rent: 0, r: 5, c: 1, icon: '🍀' },
        { id: 9, name: 'Hội An', type: 'property', color: '#e91e63', price: 220, rent: 22, r: 4, c: 1, icon: '🏮' },
        { id: 10, name: 'Nha Trang', type: 'property', color: '#e91e63', price: 240, rent: 24, r: 3, c: 1, icon: '🏖️' },
        { id: 11, name: 'Đà Lạt', type: 'property', color: '#e91e63', price: 260, rent: 26, r: 2, c: 1, icon: '🌲' },
        { id: 12, name: 'Bến Xe', type: 'parking', color: '#795548', price: 0, rent: 0, r: 1, c: 1, d: 'Miễn phí', icon: '🅿️' },
        { id: 13, name: 'Vũng Tàu', type: 'property', color: '#9c27b0', price: 300, rent: 30, r: 1, c: 2, icon: '🚢' },
        { id: 14, name: 'Cơ Hội', type: 'chance', color: '#03a9f4', price: 0, rent: 0, r: 1, c: 3, icon: '🎁' },
        { id: 15, name: 'Đồng Nai', type: 'property', color: '#9c27b0', price: 320, rent: 32, r: 1, c: 4, icon: '🏭' },
        { id: 16, name: 'Bình Dương', type: 'property', color: '#9c27b0', price: 350, rent: 35, r: 1, c: 5, icon: '🏗️' },
        { id: 17, name: 'Sân Bay', type: 'station', color: '#607d8b', price: 200, rent: 25, r: 1, c: 6, icon: '✈️' },
        { id: 18, name: 'Đi Tù', type: 'gojail', color: '#3f51b5', price: 0, rent: 0, r: 1, c: 7, d: 'Đến ô số 6', icon: '🚓' },
        { id: 19, name: 'TpHCM', type: 'property', color: '#009688', price: 400, rent: 40, r: 2, c: 7, icon: '🌃' },
        { id: 20, name: 'Thuế VIP', type: 'tax', color: '#f44336', price: 300, rent: 0, r: 3, c: 7, icon: '💰' },
        { id: 21, name: 'Cần Thơ', type: 'property', color: '#009688', price: 450, rent: 45, r: 4, c: 7, icon: '🚤' },
        { id: 22, name: 'Khí Vận', type: 'chest', color: '#ff9800', price: 0, rent: 0, r: 5, c: 7, icon: '🍀' },
        { id: 23, name: 'Phú Quốc', type: 'property', color: '#009688', price: 500, rent: 50, r: 6, c: 7, icon: '🏝️' }
    ];

    let gameState = $state('setup'); // 'setup', 'playing'
    let numPlayers = $state(2); // 2 to 8
    
    // Player setup default schema
    let setupPlayers = $state([
        { name: 'Người chơi 1', type: 'human', icon: '😀' },
        { name: 'Người chơi 2', type: 'human', icon: '🤖' },
        { name: 'Người chơi 3', type: 'human', icon: '🐶' },
        { name: 'Người chơi 4', type: 'human', icon: '🐱' },
        { name: 'Người chơi 5', type: 'human', icon: '🦊' },
        { name: 'Người chơi 6', type: 'human', icon: '🐼' },
        { name: 'Người chơi 7', type: 'human', icon: '🐯' },
        { name: 'Người chơi 8', type: 'human', icon: '🐸' },
    ]);
    
    /** @type {any[]} */
    let players = $state([]);
    /** @type {Record<number, number>} */
    let ownership = $state({}); // cellId -> playerId
    let turn = $state(0);
    let diceValue = $state(1);
    let diceRotations = $state({ x: 15, y: -15 });
    let isRolling = $state(false);
    /** @type {any} */
    let modalData = $state(null);
    let showModal = $state(false);
    let logCounter = $state(0);
    /** @type {any[]} */
    let gameLog = $state([]);
    /** @type {any} */
    let logContainer;
    /** @type {any} */
    let trailRaf;
    let dicePosition = $state({ x: 0, y: 0 });
    /** @type {any} */
    let pendingPurchase = $state(null);
    let gameSpeed = $state(1);
    /** @type {any[]} */
    let cellEffects = $state([]);
    /** @type {any[]} */
    let cellVisualEffects = $state([]);
    let globalGameId = 0;
    
    let config = $state({
        startingMoney: 1500,
        goBonus: 200,
        botBuyChance: 0.8
    });

    

    function playCellEffect(cellId, type) {
        let id = Date.now() + Math.random();
        cellVisualEffects = [...cellVisualEffects, { id, cellId, type }];
        setTimeout(() => {
            cellVisualEffects = cellVisualEffects.filter(e => e.id !== id);
        }, 1500 / gameSpeed);
    }
    
    function addCellEffect(cellPos, text) {
        let id = Date.now() + Math.random();
        cellEffects = [...cellEffects, {id, cellPos, text}];
        setTimeout(() => {
            cellEffects = cellEffects.filter(e => e.id !== id);
        }, 1200 / gameSpeed);
    }

    function pColor(i) {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
        return colors[i % colors.length];
    }

    async function ensureLogScroll() {
        await tick();
        if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
    }

    function log(msg) {
        gameLog = [...gameLog, { id: logCounter++, text: msg }];
        ensureLogScroll();
    }

    function moveMoney(p, target) {
        let start = p.displayedMoney !== undefined ? p.displayedMoney : p.money;
        let diff = target - start;
        let duration = 800;
        let startTime = performance.now();
        function update(currentTime) {
            let elapsed = currentTime - startTime;
            let progress = Math.min(elapsed / duration, 1);
            let easeProg = 1 - Math.pow(1 - progress, 3); // cubicOut
            p.displayedMoney = Math.round(start + diff * easeProg);
            players = [...players];
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    function adjustMoney(p, amount, reason = null) {
        if (p.displayedMoney === undefined) p.displayedMoney = p.money;
        p.money += amount;
        moveMoney(p, p.money);
        
        let id = Date.now() + Math.random();
        let text = amount > 0 ? `+${amount}` : `${amount}`;
        let color = amount > 0 ? '#2ecc71' : '#e74c3c';
        p.floatTexts = [...(p.floatTexts || []), { id, text, color }];
        players = [...players]; 
        
        setTimeout(() => {
            p.floatTexts = p.floatTexts.filter(t => t.id !== id);
            players = [...players];
        }, 1200);
        
        if (reason) {
            log(`${amount > 0 ? '🤑' : '💸'} ${p.name} ${amount > 0 ? '+' : ''}$${amount} (${reason})`);
        }
    }

    function confirmReset() {
        modalData = {
            title: "Khởi động lại?",
            msg: "Bạn có chắc muốn thoát và thiết lập lại trò chơi không?",
            confirmLabel: 'Đồng ý',
            cancelLabel: 'Hủy',
            action: () => {
                showModal = false;
                gameState = 'setup';
            },
            close: () => {
                showModal = false;
            }
        };
        showModal = true;
    }

    function startGame() {
        if (numPlayers < 2) numPlayers = 2;
        if (numPlayers > 8) numPlayers = 8;
        
        players = setupPlayers.slice(0, numPlayers).map((p, i) => ({
            id: i,
            name: p.name || `Người chơi ${i+1}`,
            type: p.type,
            money: config.startingMoney,
            displayedMoney: config.startingMoney,
            floatTexts: [],
            pos: 0,
            color: pColor(i),
            icon: p.icon,
            inJail: false,
            bankrupt: false
        }));
        
        ownership = {};
        turn = 0;
        logCounter = 0;
        gameLog = [{ id: logCounter++, text: '🎯 Trò chơi bắt đầu!' }];
        gameState = 'playing';
        globalGameId++;
        let currentGameId = globalGameId;
        if (players[turn].type === 'bot') {
            setTimeout(() => {
                if (globalGameId === currentGameId) executeRoll();
            }, 1500 / gameSpeed);
        }
    }

    function rollDice() {
        if (isRolling || players[turn].type === 'bot' || showModal) return;
        executeRoll();
    }

    function executeRoll() {
        let currentGameId = globalGameId;
        isRolling = true;
        diceValue = Math.floor(Math.random() * 6) + 1;
        
        let targetX = 0, targetY = 0;
        switch(diceValue) {
            case 1: targetX = 0; targetY = 0; break;
            case 2: targetX = 0; targetY = -90; break;
            case 3: targetX = 0; targetY = 90; break;
            case 4: targetX = -90; targetY = 0; break;
            case 5: targetX = 90; targetY = 0; break;
            case 6: targetX = 0; targetY = -180; break;
        }
        
        let baseTurnX = Math.floor(diceRotations.x / 360) * 360;
        let baseTurnY = Math.floor(diceRotations.y / 360) * 360;

        let extraX = (Math.floor(Math.random() * 3) + 3) * 360;
        let extraY = (Math.floor(Math.random() * 3) + 3) * 360;
        
        if (Math.random() > 0.5) extraX *= -1;
        if (Math.random() > 0.5) extraY *= -1;

        diceRotations = {
            x: baseTurnX + extraX + targetX,
            y: baseTurnY + extraY + targetY
        };
        // Realistic Toss position
        dicePosition = {
            x: (Math.random() - 0.5) * 120,
            y: (Math.random() - 0.5) * 120
        };

        setTimeout(() => {
            if (globalGameId === currentGameId) handleMove();
        }, 1800 / gameSpeed);
    }

    function handleMove() {
        let currentGameId = globalGameId;
        let p = players[turn];
        if (p.inJail) {
            log(`🚔 ${p.name} đang ở tù. Cần đổ được 6 để ra.`);
            if (diceValue === 6) {
                p.inJail = false;
                log(`🎉 ${p.name} đã ra tù!`);
            } else {
                return endTurn();
            }
        }

        let oldPos = p.pos;
        let steps = diceValue;
        
        startTrails(p);

        let stepInterval = setInterval(() => {
            if (globalGameId !== currentGameId) return clearInterval(stepInterval);
            
            // Move player
            p.pos = (p.pos + 1) % 24;
            players = [...players];
            
            if (p.pos === 0 && oldPos > 0) {
                adjustMoney(p, config.goBonus, "Đi qua Bắt Đầu");
            }
            
            steps--;
            if (steps === 0) {
                clearInterval(stepInterval);
                stopTrails();
                setTimeout(() => {
                    if (globalGameId === currentGameId) processCell(p);
                }, 300 / gameSpeed);
            }
        }, 300 / gameSpeed);
    }

    function startTrails(p) {
        let tokenStr = `token-${p.id}`;
        let boardEl = document.getElementById('monopoly-board');
        if (!boardEl) return;
        
        function frame() {
            let el = document.getElementById(tokenStr);
            if (el) {
                let rect = el.getBoundingClientRect();
                let boardRect = boardEl.getBoundingClientRect();
                let top = rect.top + rect.height/2 - boardRect.top;
                let left = rect.left + rect.width/2 - boardRect.left;
                
                let dot = document.createElement('div');
                dot.className = 'continuous-trail';
                dot.style.background = p.color;
                dot.style.top = top + 'px';
                dot.style.left = left + 'px';
                dot.style.boxShadow = `0 0 10px 4px ${p.color}`;
                boardEl.appendChild(dot);
                
                setTimeout(() => {
                    dot.style.opacity = '0';
                    dot.style.transform = 'translate(-50%, -50%) scale(0.1)';
                }, 100);

                setTimeout(() => {
                    if (dot.parentNode) dot.parentNode.removeChild(dot);
                }, 600);
            }
            trailRaf = requestAnimationFrame(frame);
        }
        frame();
    }
    
    function stopTrails() { cancelAnimationFrame(trailRaf); }

    function processCell(p) {
        let cell = cells[p.pos];
        log(`📍 ${p.name} đến [${cell.name}]`);

        if (cell.type === 'property' || cell.type === 'station') {
            if (ownership[cell.id] === undefined) {
                if (p.money >= cell.price) {
                    if (p.type === 'human') {
                        pendingPurchase = { p, cell };
                        return; // Wait for inline purchase button click
                    } else {
                        if (Math.random() < config.botBuyChance) {
                            adjustMoney(p, -cell.price, `Mua ${cell.name}`);
                            ownership[cell.id] = p.id;
                            ownership = { ...ownership };
                            addCellEffect(cell.id, "🤑 Mua!");
                            playCellEffect(cell.id, 'star');
                        } else {
                            log(`⏭️ Máy ${p.name} bỏ qua ${cell.name}`);
                        }
                    }
                } else {
                    log(`❌ ${p.name} thiếu tiền để mua ${cell.name}`);
                }
            } else if (ownership[cell.id] !== p.id) {
                let owner = players[ownership[cell.id]];
                let toll = cell.rent;
                if (p.money >= toll) {
                    adjustMoney(p, -toll, `Trả tiền cước`);
                    adjustMoney(owner, toll, `Thu cước ${cell.name}`);
                    addCellEffect(cell.id, "💸 Đóng họ!");
                    playCellEffect(cell.id, 'rent');
                } else {
                    let allIn = p.money;
                    adjustMoney(p, -allIn, "Khấu trừ");
                    adjustMoney(owner, allIn, `Thu cước (cạn túi)`);
                    return playerBankrupt(p, owner);
                }
            }
        } else if (cell.type === 'tax') {
            let toll = cell.price;
            adjustMoney(p, -toll, 'Đóng Thuế');
            if (p.money < 0) {
                return playerBankrupt(p, null);
            }
        } else if (cell.type === 'gojail') {
            p.pos = 6;
            p.inJail = true;
            log(`🚔 ${p.name} đi tù!`);
            players = [...players];
        } else if (cell.type === 'chance' || cell.type === 'chest') {
            let bonus = (Math.floor(Math.random() * 5) - 1) * 50;
            if (bonus > 0) {
                adjustMoney(p, bonus, 'Cơ Hội Vàng');
            } else if (bonus < 0) {
                adjustMoney(p, bonus, 'Gặp Xui Xẻo');
                if (p.money < 0) return playerBankrupt(p, null);
            } else {
                log(`😐 ${p.name} không có gì thay đổi.`);
            }
        }
        
        endTurn();
    }

    function playerBankrupt(loser, winner) {
        loser.money = 0;
        loser.bankrupt = true;
        log(`💥 ${loser.name} đã đi tong! (Phá sản)`);
        addCellEffect(loser.pos, "☠️ Phá sản");
        
        for (let cellId in ownership) {
            if (ownership[cellId] === loser.id) {
                if (winner) ownership[cellId] = winner.id;
                else delete ownership[cellId];
            }
        }
        ownership = { ...ownership };
        
        let activePlayers = players.filter(p => !p.bankrupt);
        if (activePlayers.length <= 1) {
            return gameOver(activePlayers[0]);
        }
        
        players = [...players];
        endTurn();
    }

    function endTurn() {
        if (gameState !== 'playing') return;
        pendingPurchase = null;
        players = [...players];
        isRolling = false;
        
        let next = (turn + 1) % players.length;
        let attempts = 0;
        // ... loop ...
        while (players[next].bankrupt && attempts < players.length) {
            next = (next + 1) % players.length;
            attempts++;
        }
        turn = next;
        
        if (players[turn].type === 'bot' && !showModal) {
            let currentGameId = globalGameId;
            setTimeout(() => {
                if (globalGameId === currentGameId && gameState === 'playing') executeRoll();
            }, 1000 / gameSpeed);
        }
    }

    function gameOver(winner) {
        let winnerName = winner ? winner.name : 'Không ai';
        modalData = {
            title: "🎉 Trò Chơi Kết Thúc",
            msg: `<strong>${winnerName}</strong> đã giành chiến thắng!<br><br>Nhấn [Xem Bàn Cờ] để ở lại, hoặc [Thoát] để về menu.`,
            confirmLabel: 'Xem Bàn Cờ',
            cancelLabel: 'Bảng Thiết Lập',
            action: () => {
                showModal = false;
                gameState = 'finished';
            },
            close: () => {
                showModal = false;
                gameState = 'setup';
            }
        };
        showModal = true;
    }

</script>

<div class="game-wrapper">
    {#if gameState === 'setup'}
        <div class="monopoly-container setup-container" transition:fade>
            <h2 class="logo setup-logo" style="margin-top: 10px;">Cờ Tỷ Phú</h2>
            <div class="setup-form">
                
                <div class="setup-config-grid">
                    <div class="setup-group">
                        <label>👤 Số người chơi: {numPlayers}</label>
                        <input type="range" min="2" max="8" bind:value={numPlayers} class="num-slider" />
                    </div>
                    
                    <div class="setup-group">
                        <label>💰 Vốn ban đầu: ${config.startingMoney}</label>
                        <input type="range" min="500" max="5000" step="100" bind:value={config.startingMoney} class="num-slider" />
                    </div>

                    <div class="setup-group">
                        <label>🎁 Qua Bắt Đầu: ${config.goBonus}</label>
                        <input type="range" min="0" max="1000" step="50" bind:value={config.goBonus} class="num-slider" />
                    </div>
                    
                    <div class="setup-group">
                        <label>🤖 Bot tỷ lệ mua: {Math.round(config.botBuyChance * 100)}%</label>
                        <input type="range" min="0" max="1" step="0.1" bind:value={config.botBuyChance} class="num-slider" />
                    </div>

                    
                </div>
                
                <div class="players-list">
                    {#each setupPlayers.slice(0, numPlayers) as sp, i}
                    <div class="player-setup-row">
                        <select bind:value={sp.icon} class="icon-select">
                            <option value="😀">😀</option>
                            <option value="🤖">🤖</option>
                            <option value="🐶">🐶</option>
                            <option value="🐱">🐱</option>
                            <option value="🦊">🦊</option>
                            <option value="🐼">🐼</option>
                            <option value="🐯">🐯</option>
                            <option value="🦁">🦁</option>
                            <option value="🐸">🐸</option>
                            <option value="🥶">🥶</option>
                            <option value="🤡">🤡</option>
                            <option value="👻">👻</option>
                            <option value="🐧">🐧</option>
                            <option value="🐻">🐻</option>
                            <option value="🐨">🐨</option>
                            <option value="🦝">🦝</option>
                            <option value="🐵">🐵</option>
                            <option value="🐷">🐷</option>
                            <option value="🐗">🐗</option>
                            <option value="🐢">🐢</option>
                            <option value="🐙">🐙</option>
                            <option value="🦋">🦋</option>
                            <option value="🐔">🐔</option>
                            <option value="🦄">🦄</option>
                        </select>
                        <input type="text" bind:value={sp.name} placeholder="Tên" class="name-input" />
                        <select bind:value={sp.type} class="type-select">
                            <option value="human">Người</option>
                            <option value="bot">Máy</option>
                        </select>
                    </div>
                    {/each}
                </div>
                
                <button class="btn btn-confirm start-btn" on:click={startGame}>Bắt Đầu Chơi</button>
            </div>
        </div>
    {:else}
        <div class="game-layout" transition:fade>
            <div class="monopoly-container">
                <div class="board" id="monopoly-board">
                <!-- Center Area -->
                <div class="board-center">
                    <div class="logo">Cờ Tỷ Phú</div>
                    
                    <div class="stats-panel">
                        {#each players as p, i (p.id)}
                        <div class="player-stat {i === turn ? 'active' : ''} {p.bankrupt ? 'bankrupt' : ''}" style="border-left-color: {p.color}">
                            <div class="p-name">{p.icon} {p.name}</div>
                            {#if p.bankrupt}
                                <div class="p-money" style="color: #e74c3c;">Phá sản</div>
                            {:else}
                                <div class="p-money">${p.displayedMoney || p.money}</div>
                                {#each p.floatTexts || [] as ft (ft.id)}
                                    <div class="float-text" style="color: {ft.color}" out:fly={{y: -20, duration: 800}} in:fly={{y: 10, duration: 300}}>
                                        <strong>{ft.text}</strong>
                                    </div>
                                {/each}
                            {/if}
                        </div>
                        {/each}
                    </div>

                    <div class="action-panel">
                        {#if pendingPurchase}
                            <div class="inline-purchase-panel" transition:scale={{duration: 150}}>
                                <div style="font-weight: bold; margin-bottom: 8px; font-size: 1.1rem; color: var(--text-main);">Mua {pendingPurchase.cell.name}?</div>
                                <div style="font-size: 0.95rem; margin-bottom: 15px;">Giá: <strong style="color: #27ae60">${pendingPurchase.cell.price}</strong> | Cước: <strong>${pendingPurchase.cell.rent}</strong></div>
                                <div style="display:flex; justify-content:center; gap: 10px;">
                                    <button class="btn accent" on:click={() => {
                                        adjustMoney(pendingPurchase.p, -pendingPurchase.cell.price, '');
                                        ownership[pendingPurchase.cell.id] = pendingPurchase.p.id;
                                        ownership = { ...ownership };
                                        addCellEffect(pendingPurchase.cell.id, "🤑 Mua!");
                                        playCellEffect(pendingPurchase.cell.id, 'star');
                                        log(`🏠 ${pendingPurchase.p.name} mua ${pendingPurchase.cell.name}`);
                                        endTurn();
                                    }}>Mua</button>
                                    <button class="btn btn-cancel" on:click={() => {
                                        log(`⏭️ ${pendingPurchase.p.name} bỏ qua`);
                                        endTurn();
                                    }}>Bỏ qua</button>
                                </div>
                            </div>
                        {:else}
                            <div class="dice-scene" role="button" tabindex="0" on:click={rollDice} on:keydown={(e) => e.key === 'Enter' && rollDice()} class:disabled={players[turn].type === 'bot' || isRolling || players[turn].bankrupt}>
                                <div class="dice-shadow" style="transform: translate({dicePosition.x}px, {dicePosition.y}px) scale({isRolling ? 0.5 : 1}); opacity: {isRolling ? 0.2 : 0.6}"></div>
                                <div class="dice-wrapper" style="transform: translate({dicePosition.x}px, {dicePosition.y}px)">
                                    <div class="dice-bouncer" class:bounce={isRolling}>
                                        <div class="dice-cube" style="transform: rotateX({diceRotations.x}deg) rotateY({diceRotations.y}deg);">
                                            <!-- Solid internal core to block see-through -->
                                            <div class="dice-core">
                                                <div class="core-face" style="transform: rotateY(0deg) translateZ(25px);"></div>
                                                <div class="core-face" style="transform: rotateY(90deg) translateZ(25px);"></div>
                                                <div class="core-face" style="transform: rotateY(180deg) translateZ(25px);"></div>
                                                <div class="core-face" style="transform: rotateY(-90deg) translateZ(25px);"></div>
                                                <div class="core-face" style="transform: rotateX(90deg) translateZ(25px);"></div>
                                                <div class="core-face" style="transform: rotateX(-90deg) translateZ(25px);"></div>
                                            </div>
                                            <div class="dice-face front">
                                                <span class="dot"></span>
                                            </div>
                                            <div class="dice-face right">
                                                <span class="dot"></span><span class="dot"></span>
                                            </div>
                                            <div class="dice-face left">
                                                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                                            </div>
                                            <div class="dice-face top">
                                                <span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>
                                            </div>
                                            <div class="dice-face bottom">
                                                <span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>
                                            </div>
                                            <div class="dice-face back">
                                                <span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="turn-indicator" style="color: {players[turn].color}; font-weight: bold;">
                                {isRolling ? 'Đang tung xúc xắc...' : `Lượt của ${players[turn].name}`}
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Cells -->
                {#each cells as c}
                <div class="cell bg-{c.type}" 
                     style="grid-row: {c.r}; grid-column: {c.c}; 
                            border: {ownership[c.id] !== undefined && !players[ownership[c.id]].bankrupt ? `3px solid ${players[ownership[c.id]].color}` : '2px solid transparent'};
                            box-shadow: {ownership[c.id] !== undefined && !players[ownership[c.id]].bankrupt ? `0 0 10px ${players[ownership[c.id]].color}` : '0 2px 4px rgba(0,0,0,0.05)'};
                     ">
                    <div class="cell-head" style="background: {c.color}">
                        <span class="c-head-icon">{c.icon}</span>
                    </div>
                    <div class="cell-body">
                        <div class="c-name">{c.name}</div>
                        {#if c.price > 0}
                            <div class="c-price">${c.price}</div>
                        {/if}
                        {#if c.d}
                            <div class="c-desc">{c.d}</div>
                        {/if}
                        <!-- Visual Special Effects -->
                {#each cellVisualEffects as ve (ve.id)}
                    <div style="position:absolute; z-index:30; pointer-events:none; top: calc({(cells[ve.cellId].r - 1) * 100 / 7}% + 35px); left: calc({(cells[ve.cellId].c - 1) * 100 / 7}% + 35px);">
                         {#if ve.type === 'star'}
                             <div class="fx-sp star" style="margin-left: -15px;">✨</div>
                             <div class="fx-sp star" style="margin-top: -20px; animation-delay: 0.1s">✨</div>
                             <div class="fx-sp star" style="margin-left: 15px; animation-delay: 0.2s">✨</div>
                         {:else if ve.type === 'rent'}
                             <div class="fx-sp rent" style="margin-left: -10px;">💸</div>
                             <div class="fx-sp rent" style="margin-top: -15px; animation-delay: 0.15s">💸</div>
                             <div class="fx-sp rent" style="margin-left: 10px; animation-delay: 0.3s">💸</div>
                         {/if}
                    </div>
                {/each}

            </div>
                    {#if ownership[c.id] !== undefined && !players[ownership[c.id]].bankrupt}
                        <div class="owner-avatar" style="background: {players[ownership[c.id]].color}">{players[ownership[c.id]].icon}</div>
                    {/if}
                </div>
                {/each}

                <!-- Player Tokens -->
                {#each players as p (p.id)}
                    {#if !p.bankrupt}
                    <div class="player-token" id="token-{p.id}"
                         style="
                            top: calc({(cells[p.pos].r - 1) * 100 / 7}% + {15 + Math.floor(p.id / 3) * 22}px);
                            left: calc({(cells[p.pos].c - 1) * 100 / 7}% + {20 + (p.id % 3) * 22}px);
                            background: {gameState === 'finished' && p.bankrupt ? '#aaa' : p.color};
                            z-index: {10 + p.id};
                            transition: all {300 / gameSpeed}ms cubic-bezier(0.3, 0, 0.2, 1);
                         ">
                        {p.icon}
                    </div>
                    {/if}
                {/each}

                <!-- Cell Effects -->
                {#each cellEffects as ce (ce.id)}
                    <div class="cell-effect-burst" out:fade={{duration: 200}}
                         style="
                            top: calc({(cells[ce.cellPos].r - 1) * 100 / 7}% + 30px);
                            left: calc({(cells[ce.cellPos].c - 1) * 100 / 7}% + 30px);
                         ">
                        {ce.text}
                    </div>
                {/each}

            </div>
        </div>
            
        <div class="right-panel">
                <div class="panel-header" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; margin-bottom: 10px; gap:8px;">
                    <div class="sh-title" style="font-weight: bold; color: var(--text-main); font-size: 1.1rem;">Nhật Ký</div>
                    <div class="speed-control" style="font-size:0.85rem; display:flex; align-items:center; gap:5px; background: var(--bg-panel-alt); padding: 4px 8px; border-radius: 6px;">
                        <span style="font-weight:bold; color: #e67e22;">{gameSpeed}x</span>
                        <input type="range" min="0.5" max="20" step="0.5" bind:value={gameSpeed} style="width:50px; cursor:pointer;" title="Tốc độ trận đấu" />
                    </div>
                    <button class="btn reset-btn-small" on:click={confirmReset}>Thoát</button>
                </div>
                <div class="log-container" bind:this={logContainer}>
                    {#each gameLog as l (l.id)}
                    <div class="log-entry" transition:fade={{duration: 200}}>{l.text}</div>
                    {/each}
                </div>
            </div>

        </div>
    {/if}

    <!-- Modal Overlay -->
    {#if showModal && modalData}
    <div class="modal-overlay" transition:fade={{duration: 150}}>
        <div class="modal-content" transition:scale={{duration: 250, start: 0.9}}>
            <h2 class="modal-title">{modalData.title}</h2>
            <div class="modal-body">{@html modalData.msg}</div>
            <div class="modal-actions">
                {#if modalData.cancelLabel}
                <button class="btn btn-cancel" on:click={modalData.close}>{modalData.cancelLabel}</button>
                {/if}
                {#if modalData.confirmLabel}
                <button class="btn btn-confirm" on:click={modalData.action}>{modalData.confirmLabel}</button>
                {/if}
            </div>
        </div>
    </div>
    {/if}
</div>

<style>

    :global(:root) {
        --bg-window: linear-gradient(to bottom, #87CEEB, #e0f6ff);
        --bg-board-ext: transparent;
        --bg-board-int: #aed581; /* Green grass */
        --bg-panel: rgba(255,255,255,0.95);
        --bg-panel-alt: rgba(248,249,250,0.85);
        --text-main: #34495e;
        --text-muted: #7f8c8d;
        --border-color: #d1d8e0;
        --border-soft: #e1e8ed;
        --log-text: #444;
        --log-bg: white;
        --log-border: #3498db;
        --cell-bg: #f5f6fa;
        --input-border: #ddd;
        --title-gradient: linear-gradient(135deg, #c0392b, #d35400);
        --p-money-color: #27ae60;
    }

    .game-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-window);
        font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        padding: 10px;
        box-sizing: border-box;
    }

    .game-layout {
        display: flex;
        gap: 20px;
        width: 100%;
        max-width: 1100px;
        height: 100%;
        max-height: 800px;
        align-items: stretch;
    }

    .right-panel {
        width: 340px;
        background: var(--bg-panel);
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
    }

    @media (max-width: 900px) {
        .game-layout {
            flex-direction: column;
            overflow-y: auto;
            max-height: none;
            align-items: center;
        }
        .right-panel {
            width: 100%;
            height: 400px;
        }
    }

    /* Replaced dynamically */

    .setup-container {
        background: var(--bg-panel);
        aspect-ratio: auto;
        padding: 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .setup-logo {
        margin-bottom: 30px !important;
    }

    .setup-form {
        width: 100%;
        max-width: 550px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .setup-config-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 15px;
        background: var(--bg-panel-alt);
        padding: 15px;
        border-radius: 12px;
        border: 1px solid var(--border-soft);
    }

    .setup-group {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        background: var(--bg-panel-alt);
        padding: 15px;
        border-radius: 8px;
    }

    .setup-config-grid .setup-group {
        background: none;
        padding: 0;
    }

    .setup-group label {
        font-weight: 600;
        color: var(--text-main);
        font-size: 0.95rem;
        text-align: center;
    }
    
    .num-slider { flex: 1; }
    .num-display { font-weight: bold; font-size: 1.2rem; min-width: 20px; }

    .players-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 400px;
        overflow-y: auto;
        padding: 5px;
    }

    .player-setup-row {
        display: flex;
        gap: 10px;
        align-items: center;
        background: var(--bg-panel-alt);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .icon-select {
        font-size: 1.3rem;
        padding: 5px;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        background: var(--bg-panel);
    }
    
    .name-input {
        flex: 1;
        padding: 10px;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        font-size: 1rem;
    }
    
    .type-select {
        padding: 10px;
        border: 1px solid var(--input-border);
        border-radius: 4px;
        background: var(--bg-panel);
    }
    
    .start-btn {
        margin-top: 10px;
        padding: 15px !important;
        font-size: 1.2rem !important;
    }

    
    .monopoly-container {
        flex: 1;
        aspect-ratio: 1;
        background: var(--bg-board-ext);
        border-radius: 12px;
        padding: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        position: relative;
        perspective: 1400px;
        transition: background 0.3s;
    }

    .board {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-template-rows: repeat(7, 1fr);
        gap: 6px;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.6s cubic-bezier(0.3, 0, 0.2, 1), box-shadow 0.6s ease;
    }

    .board {
        transform: rotateX(45deg) scale(0.9) translateY(-20px);
        box-shadow: 0 40px 60px rgba(0,0,0,0.4);
        border-radius: 12px;
    }

    .player-token {
        transform: translate(-50%, -50%) rotateX(-45deg) translateY(-15px);
        transform-origin: center bottom;
        box-shadow: 0 15px 10px rgba(0,0,0,0.3);
    }
    
    .fx-sp {
        transform: translate(-50%, -50%) rotateX(-45deg);
    }
    
    .cell-effect-burst {
        transform: translate(-50%, -50%) rotateX(-45deg);
    }

    .dice-scene {
        transform: rotateX(-45deg) scale(1.2);
        transform-origin: center bottom;
        margin-top: -30px;
    }


    

    .logo {
        font-size: 2.5rem;
        font-weight: 800;
        background: var(--title-gradient);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 10px;
    }

    .stats-panel {
        display: flex;
        gap: 8px;
        width: 100%;
        justify-content: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }

    .player-stat {
        background: var(--bg-panel);
        padding: 8px 12px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        border-left: 6px solid #ccc;
        transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.3s ease;
        min-width: 90px;
        text-align: center;
        position: relative;
    }

    .float-text {
        position: absolute;
        width: 100%;
        text-align: center;
        left: 0;
        top: -15px;
        font-size: 1.1rem;
        pointer-events: none;
        z-index: 10;
        text-shadow: 0 1px 2px rgba(255,255,255,0.8);
    }

    .player-stat.active {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0,0,0,0.1);
    }
    
    .player-stat.bankrupt {
        opacity: 0.6;
        filter: grayscale(1);
    }
    .player-stat.bankrupt .p-name { text-decoration: line-through; }

    .p-name { font-weight: bold; font-size: 0.95rem; margin-bottom: 4px; color: var(--text-main);}
    .p-money { font-family: monospace; font-size: 1.1rem; color: var(--p-money-color); font-weight: bold; }

    .action-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        margin-bottom: auto;
    }

    .dice-scene {
        width: 150px;
        height: 150px;
        perspective: 800px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }
    .dice-scene.disabled { cursor: not-allowed; opacity: 0.8; }
    
    .dice-shadow {
        position: absolute;
        width: 50px; height: 50px;
        background: rgba(0,0,0,0.6);
        border-radius: 50%;
        filter: blur(8px);
        left: calc(50% - 25px); top: calc(50% - 25px);
        transition: all 1.8s cubic-bezier(0.1, 0.9, 0.2, 1);
        z-index: 0;
    }

    .dice-wrapper {
        position: absolute;
        width: 60px; height: 60px;
        left: calc(50% - 30px); top: calc(50% - 30px);
        transition: transform 1.8s cubic-bezier(0.1, 0.9, 0.2, 1);
        z-index: 1;
    }

    .dice-bouncer {
        width: 100%; height: 100%;
        transform-style: preserve-3d;
    }
    .dice-bouncer.bounce {
        animation: diceBounce 1.8s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
    }

    @keyframes diceBounce {
        0% { transform: translateZ(0) scale(1); }
        30% { transform: translateZ(80px) scale(1.6); }
        80% { transform: translateZ(5px) scale(1.05); }
        100% { transform: translateZ(0) scale(1); }
    }

    .dice-cube {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 1.8s cubic-bezier(0.1, 0.9, 0.2, 1);
    }
    
    .dice-core {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        transform-style: preserve-3d;
        display: flex; align-items:center; justify-content:center;
    }
    .dice-core .core-face {
        position: absolute;
        width: 50px;
        height: 50px;
        background: var(--bg-panel);
    }

    .dice-face {
        position: absolute;
        width: 58px;
        height: 58px;
        top: 1px;
        left: 1px;
        background: #ffffff;
        border: 2px solid #e0e0e0;
        border-radius: 16px;
        box-sizing: border-box;
        box-shadow: inset 0 0 15px rgba(0,0,0,0.15);
        display: grid;
        grid-template-areas: 
            "a . c"
            "d e f"
            "g . i";
        padding: 8px;
    }
    
    .dice-face.front  { transform: rotateY(  0deg) translateZ(30px); }
    .dice-face.right  { transform: rotateY( 90deg) translateZ(30px); }
    .dice-face.back   { transform: rotateY(180deg) translateZ(30px); }
    .dice-face.left   { transform: rotateY(-90deg) translateZ(30px); }
    .dice-face.top    { transform: rotateX( 90deg) translateZ(30px); }
    .dice-face.bottom { transform: rotateX(-90deg) translateZ(30px); }

    .dice-face .dot { width: 10px; height: 10px; background: #2c3e50; border-radius: 50%; justify-self: center; align-self: center;}
    .dice-face.front .dot { grid-area: e; background: #e74c3c; width: 14px; height: 14px;}
    .dice-face.right .dot:nth-child(1) { grid-area: a; }
    .dice-face.right .dot:nth-child(2) { grid-area: i; }
    .dice-face.left .dot:nth-child(1) { grid-area: a; }
    .dice-face.left .dot:nth-child(2) { grid-area: e; }
    .dice-face.left .dot:nth-child(3) { grid-area: i; }
    .dice-face.top .dot:nth-child(1) { grid-area: a; }
    .dice-face.top .dot:nth-child(2) { grid-area: c; }
    .dice-face.top .dot:nth-child(3) { grid-area: g; }
    .dice-face.top .dot:nth-child(4) { grid-area: i; }
    .dice-face.bottom .dot:nth-child(1) { grid-area: a; }
    .dice-face.bottom .dot:nth-child(2) { grid-area: c; }
    .dice-face.bottom .dot:nth-child(3) { grid-area: e; }
    .dice-face.bottom .dot:nth-child(4) { grid-area: g; }
    .dice-face.bottom .dot:nth-child(5) { grid-area: i; }
    .dice-face.back .dot:nth-child(1) { grid-area: a; }
    .dice-face.back .dot:nth-child(2) { grid-area: d; }
    .dice-face.back .dot:nth-child(3) { grid-area: g; }
    .dice-face.back .dot:nth-child(4) { grid-area: c; }
    .dice-face.back .dot:nth-child(5) { grid-area: f; }
    .dice-face.back .dot:nth-child(6) { grid-area: i; }

    .turn-indicator {
        font-weight: 600;
        font-size: 1.1rem;
    }

    .reset-btn-small {
        background: #e74c3c;
        padding: 4px 10px;
        font-size: 0.8rem;
        border-radius: 6px;
    }
    .reset-btn-small:hover {
        background: #c0392b;
    }

    .log-container {
        width: 100%;
        flex: 1;
        background: var(--bg-panel-alt);
        border-radius: 8px;
        padding: 12px 14px;
        overflow-y: auto;
        font-size: 0.95rem;
        box-shadow: inset 0 2px 6px rgba(0,0,0,0.05);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .log-entry {
        background: var(--bg-panel);
        padding: 8px 12px;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        border-left: 4px solid var(--log-border);
        color: var(--log-text);
        transition: transform 0.2s;
    }
    .log-entry:last-child {
        font-weight: 600;
        color: var(--text-main);
        border-left: 4px solid #f1c40f;
        transform: translateX(4px);
        box-shadow: 0 2px 6px rgba(241, 196, 15, 0.2);
    }

    /* Cell styling */
    .cell {
        background: var(--bg-panel);
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 2px solid transparent;
        transition: all 0.3s ease;
    }

    .owner-avatar {
        position: absolute;
        top: -10px; right: -10px;
        width: 26px; height: 26px;
        border-radius: 50%;
        display: flex; align-items:center; justify-content:center;
        font-size: 0.8rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        color: white;
        border: 2px solid white;
        z-index: 2;
    }

    .cell-head {
        height: 28%;
        width: 100%;
        min-height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: inset 0 -2px 5px rgba(0,0,0,0.1);
    }
    
    .c-head-icon {
        font-size: 1.25rem;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
    }

    .cell-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4px;
        text-align: center;
        font-size: 0.8rem;
    }

    .c-name {
        font-weight: bold;
        color: var(--text-main);
        line-height: 1.1;
        margin-bottom: 4px;
    }

    .c-price {
        font-weight: 600;
        color: #e74c3c;
        font-size: 0.85rem;
    }

    .c-desc {
        color: var(--text-muted);
        font-size: 0.75rem;
    }

    .owner-badge {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 6px;
        opacity: 0.9;
    }

    .player-token {
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        color: white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
        transition: top 0.3s ease-in-out, left 0.3s ease-in-out;
        border: 2px solid white;
    }

    :global(.continuous-trail) {
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(1);
        pointer-events: none;
        z-index: 5;
        opacity: 0.8;
        transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        mix-blend-mode: multiply;
    }

    .fx-sp {
        position: absolute;
        font-size: 2rem;
        transform: translate(-50%, -50%);
        opacity: 0;
        pointer-events: none;
    }
    .fx-sp.star {
        animation: starFx 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        filter: drop-shadow(0 0 5px gold);
    }
    .fx-sp.rent {
        animation: rentFx 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        font-size: 2.2rem;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    @keyframes starFx {
        0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
        20% { transform: translate(-50%, -60%) scale(1.5) rotate(45deg); opacity: 1; }
        100% { transform: translate(-50%, -120%) scale(1) rotate(180deg); opacity: 0; }
    }
    @keyframes rentFx {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        20% { transform: translate(-50%, -50%) scale(1.6); opacity: 1; }
        100% { transform: translate(-50%, -100%) scale(1); opacity: 0; }
    }

    .inline-purchase-panel {
        background: var(--bg-panel);
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        text-align: center;
        border: 2px solid #3498db;
    }

    /* Modal Styling */
    .modal-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        backdrop-filter: blur(3px);
        border-radius: 12px;
    }

    .modal-content {
        background: var(--bg-panel);
        padding: 30px;
        border-radius: 16px;
        width: 90%;
        max-width: 350px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        text-align: center;
    }

    .modal-title {
        font-size: 1.5rem;
        color: var(--text-main);
        margin: 0 0 16px 0;
    }

    .modal-body {
        font-size: 1.1rem;
        color: var(--text-muted);
        margin-bottom: 24px;
        line-height: 1.5;
    }

    .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
    }

    .btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }

    .btn-cancel {
        background: var(--bg-panel);
        color: #57606f;
    }
    .btn-cancel:hover { background: #dfe4ea; }

    .btn-confirm {
        background: #2ed573;
        color: white;
        box-shadow: 0 4px 10px rgba(46, 213, 115, 0.3);
    }
    .btn-confirm:hover {
        background: #27ae60;
        transform: translateY(-2px);
    }

    .cell-effect-burst {
        position: absolute;
        transform: translate(-50%, -50%);
        font-size: 2.2rem;
        z-index: 50;
        pointer-events: none;
        animation: floatUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        text-shadow: 0 2px 5px rgba(0,0,0,0.3);
        white-space: nowrap;
    }
    @keyframes floatUp {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        20% { transform: translate(-50%, -70%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -100%) scale(1); opacity: 0; }
    }

    @media (max-width: 600px) {
        .logo { font-size: 1.5rem; margin-bottom: 10px; }
        .p-name { font-size: 0.8rem; }
        .p-money { font-size: 0.95rem; }
        .dice-container { width: 60px; height: 60px; }
        .c-name { font-size: 0.65rem; }
        .c-price { font-size: 0.65rem; }
        .c-desc { display: none; }
        .player-token { width: 20px; height: 20px; font-size: 0.75rem; }
        .setup-container { padding: 20px; }
    }
</style>
