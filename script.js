const APPS_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"; // Replace after deployment

// Global State
let aetherShards = 100;
let currentAppMode = "DUEL"; // "DUEL" or "SOLO"
let allCardsPool = [];

// Fallback card definitions
const DEFAULT_CARDS = [
    { id: "CARD_001", name: "Cryo-Armor Directive", type: "Trap/Tool", grammar_role: "trigger", spell_speed: 2, activation_cost: { energy: 30 }, resolution_payload: "Grant +30 kinetic shield.", effect: { shield: 30 } },
    { id: "CARD_002", name: "Aether Inversion Protocol", type: "Spell/Quick-Play", grammar_role: "reaction", spell_speed: 2, activation_cost: { energy: 25 }, resolution_payload: "Negate previous chain link and refund 20 energy.", effect: { negate: true, energyRefund: 20 } },
    { id: "CARD_003", name: "Solaris Flare Overcharge", type: "Action/Attack", grammar_role: "action", spell_speed: 1, activation_cost: { energy: 40 }, resolution_payload: "Deal 40 thermal damage.", effect: { damage: 40 } },
    { id: "CARD_004", name: "Synaptic Echo Anchor", type: "Passive/Aura", grammar_role: "continuous", spell_speed: 1, activation_cost: { energy: 20 }, resolution_payload: "Restore 25 Energy and repair 15 HP.", effect: { heal: 15, energy: 25 } },
    { id: "CARD_005", name: "Kinetic Breaker Railgun", type: "Action/Attack", grammar_role: "action", spell_speed: 1, activation_cost: { energy: 35 }, resolution_payload: "Deal 35 piercing damage.", effect: { damage: 35 } },
    { id: "CARD_006", name: "Effect Veiler Pulse", type: "Hand-Trap/Reaction", grammar_role: "reaction", spell_speed: 2, activation_cost: { energy: 20 }, resolution_payload: "Negate opponent's active attack.", effect: { negate: true } },
    { id: "CARD_007", name: "Bottomless Void Collapse", type: "Trap/Tool", grammar_role: "trigger", spell_speed: 2, activation_cost: { energy: 35 }, resolution_payload: "Deal 35 gravity damage.", effect: { damage: 35 } },
    { id: "CARD_008", name: "Skill Drain Matrix", type: "Continuous Trap", grammar_role: "continuous", spell_speed: 2, activation_cost: { energy: 30 }, resolution_payload: "Drain 30 Energy from opponent.", effect: { energyDrain: 30 } },
    { id: "CARD_009", name: "Plasma Ray Surge", type: "Action/Attack", grammar_role: "action", spell_speed: 1, activation_cost: { energy: 45 }, resolution_payload: "Deal 45 plasma damage.", effect: { damage: 45 } },
    { id: "CARD_010", name: "Solemn Sentinel Barrier", type: "Counter Trap", grammar_role: "reaction", spell_speed: 3, activation_cost: { energy: 40 }, resolution_payload: "Negate opponent action and reflect 20 damage.", effect: { negate: true, reflect: 20 } },
    { id: "CARD_011", name: "Mystical Space Typhoon", type: "Spell/Quick-Play", grammar_role: "reaction", spell_speed: 2, activation_cost: { energy: 25 }, resolution_payload: "Destroy opponent shield barrier instantly.", effect: { destroyShield: true } },
    { id: "CARD_012", name: "Apophis Guardian Summon", type: "Trap Monster", grammar_role: "trigger", spell_speed: 2, activation_cost: { energy: 35 }, resolution_payload: "Summon guardian: +40 Shield and +15 Counter damage.", effect: { shield: 40, reflect: 15 } }
];

allCardsPool = [...DEFAULT_CARDS];

// Load structured assets from cards.json
fetch('cards.json')
    .then(res => res.json())
    .then(data => { if (Array.isArray(data) && data.length > 0) allCardsPool = data; })
    .catch(() => {});

// ============================================================================
// 2-PLAYER TACTICAL DUEL ENGINE
// ============================================================================
const DuelEngine = {
    p1: {
        id: "P1",
        name: "Operative Alpha (Sanctum)",
        hp: 100,
        maxHp: 100,
        energy: 100,
        maxEnergy: 100,
        shield: 0,
        hand: [],
        deck: [],
        graveyard: []
    },
    p2: {
        id: "P2",
        name: "Operative Omega (Void)",
        hp: 100,
        maxHp: 100,
        energy: 100,
        maxEnergy: 100,
        shield: 0,
        hand: [],
        deck: [],
        graveyard: []
    },
    activeTurn: "P1", // "P1" or "P2"
    turnCount: 1,
    chainStack: [],   // Array of { player: "P1"|"P2", card: obj }
    isResolving: false,
    waitingForReaction: false,
    reactionPlayer: null,

    initMatch() {
        this.p1.hp = 100;
        this.p1.energy = 100;
        this.p1.shield = 0;
        this.p1.graveyard = [];

        this.p2.hp = 100;
        this.p2.energy = 100;
        this.p2.shield = 0;
        this.p2.graveyard = [];

        // Distribute sample decks
        this.p1.deck = allCardsPool.slice(0, 6).map(c => ({ ...c }));
        this.p2.deck = allCardsPool.slice(6, 12).map(c => ({ ...c }));

        // Shuffle
        this.shuffleDeck(this.p1.deck);
        this.shuffleDeck(this.p2.deck);

        // Draw initial 4-card hands
        this.p1.hand = [];
        this.p2.hand = [];
        for (let i = 0; i < 4; i++) {
            if (this.p1.deck.length) this.p1.hand.push(this.p1.deck.pop());
            if (this.p2.deck.length) this.p2.hand.push(this.p2.deck.pop());
        }

        this.activeTurn = "P1";
        this.turnCount = 1;
        this.chainStack = [];
        this.isResolving = false;
        this.waitingForReaction = false;

        logToTerminal(`⚔️ [DUEL INITIALIZED] Match started! ${this.p1.name} VS ${this.p2.name}.`);
        logToTerminal(`👉 [TURN 1] ${this.p1.name}'s turn. Select a card from your hand to initiate Chain Link 1.`);
        this.renderDuelUI();
    },

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    },

    playCard(playerKey, cardIndex) {
        if (this.isResolving) return;

        const player = playerKey === "P1" ? this.p1 : this.p2;
        const opponentKey = playerKey === "P1" ? "P2" : "P1";
        const opponent = playerKey === "P1" ? this.p2 : this.p1;

        // Check if it's the player's legal window
        if (!this.waitingForReaction && this.activeTurn !== playerKey) {
            logToTerminal(`⚠️ Not your turn! Waiting for ${this.activeTurn === "P1" ? this.p1.name : this.p2.name}.`);
            return;
        }

        if (this.waitingForReaction && this.reactionPlayer !== playerKey) {
            logToTerminal(`⚠️ Waiting for reaction from ${this.reactionPlayer === "P1" ? this.p1.name : this.p2.name}.`);
            return;
        }

        const card = player.hand[cardIndex];
        if (!card) return;

        const energyCost = (card.activation_cost && card.activation_cost.energy) ? card.activation_cost.energy : 25;
        if (player.energy < energyCost) {
            logToTerminal(`⚠️ [INSUFFICIENT ENERGY] ${card.name} requires ${energyCost} Energy! (Current: ${player.energy})`);
            return;
        }

        // Deduct energy & remove card from hand
        player.energy -= energyCost;
        player.hand.splice(cardIndex, 1);
        player.graveyard.push(card);

        // Add to Chain Stack
        const linkNumber = this.chainStack.length + 1;
        this.chainStack.push({ playerKey, card });

        logToTerminal(`⛓️ [CHAIN LINK ${linkNumber}] ${player.name} played: [${card.name}] (${card.type})!`);

        // Give opponent reaction window
        this.waitingForReaction = true;
        this.reactionPlayer = opponentKey;
        logToTerminal(`⏱️ [REACTION WINDOW] ${opponent.name}: Play a Quick-Play/Trap reaction to Chain Link ${linkNumber + 1}, or click 'Pass' to resolve!`);

        this.renderDuelUI();
    },

    passReaction(playerKey) {
        if (!this.waitingForReaction || this.isResolving) return;
        if (this.reactionPlayer !== playerKey) return;

        const player = playerKey === "P1" ? this.p1 : this.p2;
        logToTerminal(`⏭️ ${player.name} PASSED the reaction window.`);

        this.waitingForReaction = false;
        this.reactionPlayer = null;

        // Start LIFO chain resolution
        this.resolveChain();
    },

    async resolveChain() {
        this.isResolving = true;
        logToTerminal(`⚡ [RESOLVING LIFO CHAIN] Executing ${this.chainStack.length} link(s) in reverse order...`);
        this.renderDuelUI();

        let chainIsNegated = false;

        while (this.chainStack.length > 0) {
            await sleep(650);
            const linkObj = this.chainStack.pop();
            const linkNum = this.chainStack.length + 1;
            const actor = linkObj.playerKey === "P1" ? this.p1 : this.p2;
            const target = linkObj.playerKey === "P1" ? this.p2 : this.p1;
            const card = linkObj.card;
            const eff = card.effect || {};

            if (chainIsNegated) {
                logToTerminal(`🚫 [CL${linkNum} NEGATED] ${actor.name}'s [${card.name}] was negated by a previous chain reaction!`);
                chainIsNegated = false; // Reset for lower links
                this.renderDuelUI();
                continue;
            }

            logToTerminal(`↳ [CL${linkNum} RESOLVING] ${actor.name} activates ${card.name}:`);

            // Apply card effects
            if (eff.negate) {
                logToTerminal(`   ✨ NEGATION EFFECT: The next underlying action in the chain will be canceled!`);
                chainIsNegated = true;
            }

            if (eff.energyRefund) {
                actor.energy = Math.min(actor.maxEnergy, actor.energy + eff.energyRefund);
                logToTerminal(`   ⚡ Refunded +${eff.energyRefund} Energy to ${actor.name}.`);
            }

            if (eff.shield) {
                actor.shield += eff.shield;
                logToTerminal(`   🛡️ ${actor.name} gained +${eff.shield} Kinetic Shield (Total: ${actor.shield}).`);
            }

            if (eff.destroyShield) {
                target.shield = 0;
                logToTerminal(`   💥 ${target.name}'s Kinetic Shield was shattered!`);
            }

            if (eff.heal) {
                actor.hp = Math.min(actor.maxHp, actor.hp + eff.heal);
                logToTerminal(`   💚 ${actor.name} repaired +${eff.heal} HP (Current: ${actor.hp}/${actor.maxHp}).`);
            }

            if (eff.energy) {
                actor.energy = Math.min(actor.maxEnergy, actor.energy + eff.energy);
                logToTerminal(`   ⚡ ${actor.name} restored +${eff.energy} Energy.`);
            }

            if (eff.energyDrain) {
                target.energy = Math.max(0, target.energy - eff.energyDrain);
                logToTerminal(`   🔋 Drained ${eff.energyDrain} Energy from ${target.name}!`);
            }

            if (eff.damage) {
                let dmg = eff.damage;
                if (target.shield > 0 && !eff.pierce) {
                    const absorbed = Math.min(target.shield, dmg);
                    target.shield -= absorbed;
                    dmg -= absorbed;
                    logToTerminal(`   🛡️ Shield absorbed ${absorbed} damage.`);
                }
                if (dmg > 0) {
                    target.hp = Math.max(0, target.hp - dmg);
                    logToTerminal(`   💥 Dealt ${dmg} direct damage to ${target.name}! (HP: ${target.hp}/${target.maxHp})`);
                }
            }

            if (eff.reflect) {
                actor.hp = Math.max(0, actor.hp - eff.reflect);
                logToTerminal(`   ⚡ Reflected ${eff.reflect} damage back to ${actor.name}!`);
            }

            this.renderDuelUI();

            // Check for match victory
            if (this.p1.hp <= 0 || this.p2.hp <= 0) {
                this.handleMatchEnd();
                return;
            }
        }

        await sleep(400);
        logToTerminal(`✅ [CHAIN COMPLETE] All chain links resolved.`);
        this.isResolving = false;
        this.renderDuelUI();
    },

    endTurn() {
        if (this.isResolving || this.waitingForReaction) return;

        // Switch active player
        this.activeTurn = this.activeTurn === "P1" ? "P2" : "P1";
        this.turnCount++;

        const currentActive = this.activeTurn === "P1" ? this.p1 : this.p2;

        // Turn recovery: +30 Energy, Draw 1 Card
        currentActive.energy = Math.min(currentActive.maxEnergy, currentActive.energy + 30);
        if (currentActive.deck.length > 0 && currentActive.hand.length < 5) {
            currentActive.hand.push(currentActive.deck.pop());
            logToTerminal(`🎴 ${currentActive.name} drew 1 card.`);
        }

        logToTerminal(`--------------------------------------------------`);
        logToTerminal(`👉 [TURN ${this.turnCount}] ${currentActive.name}'s turn. (+30 Energy restored).`);
        this.renderDuelUI();
    },

    handleMatchEnd() {
        this.isResolving = false;
        this.waitingForReaction = false;
        let winner = this.p1.hp > 0 ? this.p1.name : this.p2.name;
        let loser = this.p1.hp > 0 ? this.p2.name : this.p1.name;

        logToTerminal(`🏆 ==============================================`);
        logToTerminal(`🏆 DUEL CONCLUDED! ${winner.toUpperCase()} IS VICTORIOUS!`);
        logToTerminal(`💀 ${loser} was eliminated. +50 Aether Shards awarded.`);
        logToTerminal(`🏆 ==============================================`);

        aetherShards += 50;
        updateShardDisplay();

        syncWithBackend({ action: 'duel_result', winner, loser, rounds: this.turnCount });
        this.renderDuelUI();
    },

    renderDuelUI() {
        const p1Hp = document.getElementById('p1-hp');
        const p1Energy = document.getElementById('p1-energy');
        const p1Shield = document.getElementById('p1-shield');
        const p1Hand = document.getElementById('p1-hand');

        const p2Hp = document.getElementById('p2-hp');
        const p2Energy = document.getElementById('p2-energy');
        const p2Shield = document.getElementById('p2-shield');
        const p2Hand = document.getElementById('p2-hand');

        const turnIndicator = document.getElementById('turn-indicator');
        const chainStackDisplay = document.getElementById('duel-chain-stack');

        if (p1Hp) p1Hp.innerText = `${this.p1.hp}/${this.p1.maxHp}`;
        if (p1Energy) p1Energy.innerText = `${this.p1.energy}/${this.p1.maxEnergy}`;
        if (p1Shield) p1Shield.innerText = this.p1.shield;

        if (p2Hp) p2Hp.innerText = `${this.p2.hp}/${this.p2.maxHp}`;
        if (p2Energy) p2Energy.innerText = `${this.p2.energy}/${this.p2.maxEnergy}`;
        if (p2Shield) p2Shield.innerText = this.p2.shield;

        if (turnIndicator) {
            const activePlayer = this.activeTurn === "P1" ? this.p1 : this.p2;
            if (this.waitingForReaction) {
                const reactionPlayer = this.reactionPlayer === "P1" ? this.p1 : this.p2;
                turnIndicator.innerHTML = `⏱️ REACTION WINDOW: <span style="color: #f59e0b;">${reactionPlayer.name}</span> must Respond or Pass!`;
            } else if (this.isResolving) {
                turnIndicator.innerHTML = `⚡ RESOLVING LIFO CHAIN...`;
            } else {
                turnIndicator.innerHTML = `👉 ACTIVE TURN: <span style="color: ${this.activeTurn === 'P1' ? '#60a5fa' : '#c084fc'};">${activePlayer.name}</span>`;
            }
        }

        // Render Chain Stack
        if (chainStackDisplay) {
            if (this.chainStack.length === 0) {
                chainStackDisplay.innerHTML = `<span style="color: #64748b; font-size: 12px;">[No Active Chain Links]</span>`;
            } else {
                chainStackDisplay.innerHTML = this.chainStack.map((item, idx) => `
                    <div style="background: #1e1b4b; border: 1px solid #818cf8; padding: 4px 8px; border-radius: 4px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; margin: 2px;">
                        <strong style="color: #f43f5e;">CL${idx + 1}</strong>
                        <span style="color: #cbd5e1;">${item.playerKey === 'P1' ? 'Alpha' : 'Omega'}:</span>
                        <strong style="color: #38bdf8;">${item.card.name}</strong>
                    </div>
                `).join(' ➔ ');
            }
        }

        // Render Player 1 Hand Cards
        if (p1Hand) {
            p1Hand.innerHTML = this.p1.hand.map((card, idx) => {
                const cost = card.activation_cost ? card.activation_cost.energy : 25;
                const canAfford = this.p1.energy >= cost;
                const isP1Turn = (!this.waitingForReaction && this.activeTurn === "P1") || (this.waitingForReaction && this.reactionPlayer === "P1");
                return `
                    <div class="duel-card ${canAfford && isP1Turn ? 'playable' : 'disabled'}" onclick="DuelEngine.playCard('P1', ${idx})">
                        <div class="card-name" style="color: #60a5fa; font-weight: bold; font-size: 11px;">${card.name}</div>
                        <div class="card-type" style="font-size: 10px; color: #94a3b8;">${card.type} (⚡${cost})</div>
                        <div class="card-payload" style="font-size: 10px; color: #cbd5e1; margin-top: 3px; line-height: 1.2;">${card.resolution_payload}</div>
                    </div>
                `;
            }).join('');
        }

        // Render Player 2 Hand Cards
        if (p2Hand) {
            p2Hand.innerHTML = this.p2.hand.map((card, idx) => {
                const cost = card.activation_cost ? card.activation_cost.energy : 25;
                const canAfford = this.p2.energy >= cost;
                const isP2Turn = (!this.waitingForReaction && this.activeTurn === "P2") || (this.waitingForReaction && this.reactionPlayer === "P2");
                return `
                    <div class="duel-card ${canAfford && isP2Turn ? 'playable' : 'disabled'}" onclick="DuelEngine.playCard('P2', ${idx})">
                        <div class="card-name" style="color: #c084fc; font-weight: bold; font-size: 11px;">${card.name}</div>
                        <div class="card-type" style="font-size: 10px; color: #94a3b8;">${card.type} (⚡${cost})</div>
                        <div class="card-payload" style="font-size: 10px; color: #cbd5e1; margin-top: 3px; line-height: 1.2;">${card.resolution_payload}</div>
                    </div>
                `;
            }).join('');
        }
    }
};

// ============================================================================
// SINGLE-PLAYER INCURSION & ENGINE LOGIC
// ============================================================================
const GameEngine = {
    chainStack: [],
    toggleState: "AUTO", // AUTO, ON, OFF
    isExecuting: false,
    
    setToggle(state) {
        this.toggleState = state;
        const toggleEl = document.getElementById('toggle-status');
        if (toggleEl) toggleEl.innerText = state;
        logToTerminal(`[SYSTEM] Rules Engine toggle state shifted to: ${state}`);
    },

    async triggerEvent(eventType, cardData) {
        console.log(`[EVENT HOOK] Trigger fired: ${eventType}`);
        if (this.toggleState === "ON" || (this.toggleState === "AUTO" && this.isLogicalWindow(eventType))) {
            await this.openChainLink(cardData);
        } else {
            logToTerminal(`[SYSTEM] Toggle set to ${this.toggleState}. Bypassing optional prompt for: ${cardData.name}`);
            logToTerminal(`[READY] Tactical state idle. Awaiting next command.`);
        }
    },

    isLogicalWindow(type) {
        return type === "ATTACK_INCOMING" || type === "VAULT_BREACH";
    },

    async openChainLink(cardData) {
        this.chainStack.push(cardData);
        const linkNum = this.chainStack.length;
        logToTerminal(`⛓️ [CHAIN LINK ${linkNum}] Opened by: ${cardData.name} (${cardData.type})`);
        
        await sleep(400);
        await this.resolveChain();
    },

    async resolveChain() {
        logToTerminal(`⚡ [RESOLVING LIFO] Executing stack in reverse order...`);
        await sleep(350);

        while (this.chainStack.length > 0) {
            let resolvingCard = this.chainStack.pop();
            const payload = resolvingCard.resolution_payload || `Deployed ${resolvingCard.name}`;
            logToTerminal(`↳ [PAYLOAD RESOLVED] ${resolvingCard.name}: "${payload}"`);
            
            aetherShards += 25;
            updateShardDisplay();
            await sleep(300);
        }

        logToTerminal(`✅ [CHAIN COMPLETE] Resolution finished. +25 Aether Shards banked into Sanctum.`);
        logToTerminal(`[READY] Tactical link active. Ready for next incursion.`);
    }
};

// Mode Switcher between 2-Player Duel and Solo Incursion
function switchAppMode(mode) {
    currentAppMode = mode;
    const duelSection = document.getElementById('duel-section');
    const soloSection = document.getElementById('dashboard-section');
    const tabDuel = document.getElementById('tab-duel');
    const tabSolo = document.getElementById('tab-solo');

    if (mode === "DUEL") {
        if (duelSection) duelSection.classList.remove('hidden');
        if (soloSection) soloSection.classList.add('hidden');
        if (tabDuel) tabDuel.classList.add('active');
        if (tabSolo) tabSolo.classList.remove('active');
        DuelEngine.initMatch();
    } else {
        if (duelSection) duelSection.classList.add('hidden');
        if (soloSection) soloSection.classList.remove('hidden');
        if (tabDuel) tabDuel.classList.remove('active');
        if (tabSolo) tabSolo.classList.add('active');
    }
}

function logToTerminal(message) {
    const term = document.getElementById('terminal-log');
    if (!term) return;

    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.style.marginBottom = '4px';
    line.style.lineHeight = '1.4';
    line.innerText = `[${time}] ${message}`;

    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
}

function updateShardDisplay() {
    const shardEl = document.getElementById('shard-display');
    if (shardEl) shardEl.innerText = aetherShards;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function toggleGameEngineMode() {
    if (GameEngine.toggleState === "AUTO") GameEngine.setToggle("ON");
    else if (GameEngine.toggleState === "ON") GameEngine.setToggle("OFF");
    else GameEngine.setToggle("AUTO");
}

function initializeOperative() {
    const playerId = document.getElementById('player-id').value;
    const clearanceDate = document.getElementById('player-birthday').value;
    
    if (!playerId || !clearanceDate) {
        alert("Please provide both an operative handle and clearance timestamp.");
        return;
    }

    const date = new Date(clearanceDate);
    const hiddenVector = computeHiddenTemporalAnchor(date.getMonth() + 1, date.getDate());

    const anchorEl = document.getElementById('anchor-display');
    if (anchorEl) anchorEl.innerText = hiddenVector.code;

    updateShardDisplay();
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('mode-tabs').classList.remove('hidden');
    
    // Default to Duel Mode
    switchAppMode("DUEL");

    logToTerminal(`[AUTH] Operative Link Established: ${playerId}`);
    logToTerminal(`[SYSTEM] Synaptic Anchor Calibrated: ${hiddenVector.code}`);

    syncWithBackend({ 
        player_id: playerId, 
        zodiac: hiddenVector.raw, 
        anchor_code: hiddenVector.code, 
        action: 'initialize' 
    });
}

function computeHiddenTemporalAnchor(month, day) {
    let raw = "Capricorn";
    let code = "SYN-CAP-10";

    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) { raw = "Aquarius"; code = "SYN-AQU-11"; }
    else if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) { raw = "Pisces"; code = "SYN-PSC-12"; }
    else if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) { raw = "Aries"; code = "SYN-ARI-01"; }
    else if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) { raw = "Taurus"; code = "SYN-TAU-02"; }
    else if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) { raw = "Gemini"; code = "SYN-GEM-03"; }
    else if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) { raw = "Cancer"; code = "SYN-CAN-04"; }
    else if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) { raw = "Leo"; code = "SYN-LEO-05"; }
    else if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) { raw = "Virgo"; code = "SYN-VIR-06"; }
    else if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) { raw = "Libra"; code = "SYN-LIB-07"; }
    else if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) { raw = "Scorpio"; code = "SYN-SCO-08"; }
    else if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) { raw = "Sagittarius"; code = "SYN-SAG-09"; }

    return { raw, code };
}

async function executeTacticalAction() {
    if (GameEngine.isExecuting) return;
    GameEngine.isExecuting = true;

    const actionBtn = document.getElementById('action-btn');
    if (actionBtn) {
        actionBtn.disabled = true;
        actionBtn.innerText = "⚡ Resolving Incursion...";
    }

    let roll = Math.floor(Math.random() * 20) + 1;
    let totalMod = roll + 3;
    
    let sampleCard = allCardsPool[Math.floor(Math.random() * allCardsPool.length)] || allCardsPool[0];
    
    logToTerminal(`🎲 [INCURSION] Rolled d20: ${roll} + Mod (3) = ${totalMod}. Vault breached!`);
    await sleep(350);

    await GameEngine.triggerEvent("VAULT_BREACH", sampleCard);
    syncWithBackend({ action: 'vault_breach', card: sampleCard.name, result: totalMod });

    if (actionBtn) {
        actionBtn.disabled = false;
        actionBtn.innerText = "Simulate Incursion Action (Vault Breach)";
    }
    GameEngine.isExecuting = false;
}

function syncWithBackend(payload) {
    if (APPS_SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) return;
    
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error("Sync error:", err));
}
