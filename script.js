const APPS_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"; // Replace after deployment

// Global State
let aetherShards = 100;
let currentAppMode = "DUEL";
let allCardsPool = [];
let archetypeDecks = {};

// Armor Slot definitions — body slots each operative can equip
const ARMOR_SLOTS = ["helm", "torso", "arms", "legs", "back"];

// Fallback card pool
const DEFAULT_CARDS = [
    { id: "ARMOR_001", name: "Seraph Blade Gauntlets",         type: "Armor/Equipment", slot: "arms",  tier: 1, atkBonus: 400, defBonus: 150, activation_cost: { energy: 20 }, resolution_payload: "Arms Slot: Dual radiant energy blades (+400 ATK / +150 DEF).",          effect: { equipSlot: "arms",  atkBonus: 400, defBonus: 150 } },
    { id: "ARMOR_002", name: "Apophis Stone Vanguard Plate",   type: "Armor/Equipment", slot: "torso", tier: 1, atkBonus: 200, defBonus: 600, activation_cost: { energy: 25 }, resolution_payload: "Torso Slot: Ancient stone chest plate (+200 ATK / +600 DEF).",           effect: { equipSlot: "torso", atkBonus: 200, defBonus: 600 } },
    { id: "ARMOR_003", name: "Cybernetic Archangel Wings",     type: "Armor/Equipment", slot: "back",  tier: 2, atkBonus: 700, defBonus: 500, activation_cost: { energy: 40 }, resolution_payload: "Back Slot: Titanium ceramic wings (+700 ATK / +500 DEF).",             effect: { equipSlot: "back",  atkBonus: 700, defBonus: 500 } },
    { id: "ARMOR_004", name: "Solaris Seraph Crown",           type: "Armor/Equipment", slot: "helm",  tier: 3, atkBonus: 900, defBonus: 700, activation_cost: { energy: 50 }, resolution_payload: "Helm Slot: Solar sovereign crown (+900 ATK / +700 DEF).",              effect: { equipSlot: "helm",  atkBonus: 900, defBonus: 700 } },
    { id: "ARMOR_005", name: "Void Stalker Stealth Cloak",     type: "Armor/Equipment", slot: "back",  tier: 1, atkBonus: 550, defBonus: 200, activation_cost: { energy: 20 }, resolution_payload: "Back Slot: Dark matter infiltration cloak (+550 ATK / +200 DEF).",    effect: { equipSlot: "back",  atkBonus: 550, defBonus: 200 } },
    { id: "ARMOR_006", name: "Cryo Sentry Leg Guards",         type: "Armor/Equipment", slot: "legs",  tier: 1, atkBonus: 150, defBonus: 650, activation_cost: { energy: 20 }, resolution_payload: "Legs Slot: Sub-zero cryo-alloy plating (+150 ATK / +650 DEF).",      effect: { equipSlot: "legs",  atkBonus: 150, defBonus: 650 } },
    { id: "ARMOR_007", name: "Dark Matter Shoulderplates",     type: "Armor/Equipment", slot: "arms",  tier: 2, atkBonus: 800, defBonus: 550, activation_cost: { energy: 40 }, resolution_payload: "Arms Slot: Void-forged titanite pauldrons (+800 ATK / +550 DEF).",  effect: { equipSlot: "arms",  atkBonus: 800, defBonus: 550 } },
    { id: "ARMOR_008", name: "Abyssal Dragon Scale Chestplate",type: "Armor/Equipment", slot: "torso", tier: 3, atkBonus: 600, defBonus: 900, activation_cost: { energy: 50 }, resolution_payload: "Torso Slot: Void-dragon scale plating (+600 ATK / +900 DEF).",       effect: { equipSlot: "torso", atkBonus: 600, defBonus: 900 } },
    { id: "SPELL_001", name: "Aether Inversion Protocol", type: "Spell/Quick-Play", spell_speed: 2, activation_cost: { energy: 25 }, resolution_payload: "Negate active chain link and refund 20 energy.", effect: { negate: true, energyRefund: 20 } },
    { id: "SPELL_002", name: "Solaris Flare Burst",       type: "Spell/Normal",     spell_speed: 1, activation_cost: { energy: 30 }, resolution_payload: "Deal 800 direct LP damage.",                    effect: { directDamage: 800 } },
    { id: "SPELL_003", name: "Mystical Space Typhoon",    type: "Spell/Quick-Play", spell_speed: 2, activation_cost: { energy: 20 }, resolution_payload: "Destroy 1 equipped Armor piece on opponent.",   effect: { destroyEquipment: true } },
    { id: "SPELL_004", name: "Pot of Aether Greed",       type: "Spell/Normal",     spell_speed: 1, activation_cost: { energy: 25 }, resolution_payload: "Draw 2 cards from deck.",                      effect: { drawCards: 2 } },
    { id: "SPELL_005", name: "Synaptic Echo Anchor",      type: "Spell/Continuous", spell_speed: 1, activation_cost: { energy: 20 }, resolution_payload: "+300 LP and +20 Energy each Standby Phase.",   effect: { standbyHeal: 300, standbyEnergy: 20 } },
    { id: "SPELL_006", name: "Power Bond Sync",           type: "Spell/Normal",     spell_speed: 1, activation_cost: { energy: 35 }, resolution_payload: "Double ATK bonus of one equipped Armor piece this turn.", effect: { doubleEquipAtk: true } },
    { id: "TRAP_001", name: "Cryo-Armor Directive",     type: "Trap/Normal",     spell_speed: 2, activation_cost: { energy: 25 }, resolution_payload: "When attacked: Halt attack and grant +600 LP.",                    effect: { haltAttack: true, heal: 600 } },
    { id: "TRAP_002", name: "Armor Shatter Collapse",   type: "Trap/Normal",     spell_speed: 2, activation_cost: { energy: 30 }, resolution_payload: "Destroy target Armor piece on opponent operative.",               effect: { destroyTargetArmor: true } },
    { id: "TRAP_003", name: "Mirror Force Radiance",    type: "Trap/Normal",     spell_speed: 2, activation_cost: { energy: 35 }, resolution_payload: "When attacked: Destroy 1 random opponent equipped Armor piece!",   effect: { reflectDestroyArmor: true } },
    { id: "TRAP_004", name: "Skill Drain Matrix",       type: "Trap/Continuous", spell_speed: 2, activation_cost: { energy: 30 }, resolution_payload: "Drain 40 Energy from opponent each turn.",                        effect: { energyDrain: 40 } },
    { id: "TRAP_005", name: "Solemn Sentinel Barrier",  type: "Trap/Counter",    spell_speed: 3, activation_cost: { energy: 40 }, resolution_payload: "Pay 500 LP: Negate opponent action and destroy it.",              effect: { counterNegate: true, costLP: 500 } },
    { id: "TRAP_006", name: "Effect Veiler Pulse",      type: "Hand-Trap/Reaction", spell_speed: 2, activation_cost: { energy: 20 }, resolution_payload: "Discard: Negate opponent equipment activation or attack.",    effect: { handTrapNegate: true } }
];

allCardsPool = [...DEFAULT_CARDS];

const ARCHETYPE_INFO = {
    "ABYSSAL_TIDE": {
        title: "Abyssal Tide Corps (WATER)",
        desc: "Deep-grid pressure-alloy armor. Strips enemy tactical assets, executes rapid search combos, and unleashes high-priority counter-traps.",
        color: "#38bdf8"
    },
    "INFERNAL_FORGE": {
        title: "Infernal Forge Corps (FIRE)",
        desc: "Volcanic-core reactor plating. Emits passive End Phase burn damage, punishes armor destruction with Backfire, and deflects strikes with Magic Cylinder.",
        color: "#f87171"
    },
    "ZEPHYR_AVIAN": {
        title: "Zephyr Sky-Reign Aviary (WIND)",
        desc: "High-altitude storm-forged chassis. Chains rapid multi-slot armor mounts in a single turn, searches boss armor, and halves opponent ATK.",
        color: "#34d399"
    },
    "TERRA_MAGNET": {
        title: "Terra-Magnet Bastion (EARTH)",
        desc: "Sub-crust electromagnetic ferrolith armor. Excavates deep deck reserves, fields massive DEF monolithic frames, and wields superconducting negations.",
        color: "#fbbf24"
    },
    "DEFAULT": {
        title: "Tactical Default Hybrid",
        desc: "Balanced standard-issue Sanctum operative chassis with versatile equipment, spells, and traps.",
        color: "#94a3b8"
    }
};

// Load structured assets from decks.json & cards.json
fetch('decks.json')
    .then(res => res.json())
    .then(data => {
        if (data && Array.isArray(data.decks)) {
            data.decks.forEach(d => {
                archetypeDecks[d.id] = d;
            });
            if (DuelEngine.p1SelectedDeck === "ABYSSAL_TIDE" && archetypeDecks["ABYSSAL_TIDE"]) {
                allCardsPool = [...archetypeDecks["ABYSSAL_TIDE"].cards, ...DEFAULT_CARDS];
            }
        }
    })
    .catch(() => {});

fetch('cards.json')
    .then(res => res.json())
    .then(data => { if (Array.isArray(data) && data.length > 0) allCardsPool = data; })
    .catch(() => {});

// ============================================================================
// OPERATIVE BASE STATS
// ============================================================================
function createOperative(id, name, deckArchetypeId = "DEFAULT") {
    return {
        id,
        name,
        deckArchetypeId,
        lp: 4000,
        maxLp: 4000,
        baseAtk: 500,
        baseDef: 500,
        energy: 100,
        maxEnergy: 100,
        hand: [],
        deck: [],
        graveyard: [],
        equippedArmor: { helm: null, torso: null, arms: null, legs: null, back: null },
        spellsTraps: [],
        normalEquipUsed: false,
        hasAttacked: false,

        get totalAtk() {
            let atk = this.baseAtk;
            const pieces = this.armorPieces;
            for (const slot of ARMOR_SLOTS) {
                const item = this.equippedArmor[slot];
                if (item) {
                    let bonus = item.atkBonus || 0;
                    if (item.effect && item.effect.scalingAtkPerPiece) {
                        const others = Math.max(0, pieces - 1);
                        bonus += others * item.effect.scalingAtkPerPiece;
                    }
                    atk += bonus;
                }
            }
            return atk;
        },
        get totalDef() {
            let def = this.baseDef;
            for (const slot of ARMOR_SLOTS) {
                if (this.equippedArmor[slot]) def += this.equippedArmor[slot].defBonus || 0;
            }
            return def;
        },
        get armorPieces() {
            return ARMOR_SLOTS.filter(s => this.equippedArmor[s] !== null).length;
        }
    };
}

// ============================================================================
// 6-PHASE 2-PLAYER TACTICAL DUEL ENGINE
// ============================================================================
const DuelEngine = {
    p1: createOperative("P1", "Operative Alpha", "ABYSSAL_TIDE"),
    p2: createOperative("P2", "Operative Omega", "INFERNAL_FORGE"),
    p1SelectedDeck: "ABYSSAL_TIDE",
    p2SelectedDeck: "INFERNAL_FORGE",
    isDuelActive: false,
    activeTurn: "P1",
    turnCount: 1,
    currentPhase: "DRAW",
    chainStack: [],
    isResolving: false,
    waitingForReaction: false,
    reactionPlayer: null,
    pendingAttack: null,

    getArchetypeBadgeLabel(deckId, playerSlot) {
        const defaultName = playerSlot === "P1" ? "ALPHA" : "OMEGA";
        switch (deckId) {
            case "ABYSSAL_TIDE": return `${playerSlot}: ${defaultName} (ABYSSAL TIDE)`;
            case "INFERNAL_FORGE": return `${playerSlot}: ${defaultName} (INFERNAL FORGE)`;
            case "ZEPHYR_AVIAN": return `${playerSlot}: ${defaultName} (ZEPHYR AVIARY)`;
            case "TERRA_MAGNET": return `${playerSlot}: ${defaultName} (TERRA-MAGNET)`;
            default: return `${playerSlot}: ${defaultName} (SANCTUM)`;
        }
    },

    getArchetypeName(deckId, playerSlot) {
        const defaultName = playerSlot === "P1" ? "Operative Alpha" : "Operative Omega";
        switch (deckId) {
            case "ABYSSAL_TIDE": return `${defaultName} (Abyssal Tide)`;
            case "INFERNAL_FORGE": return `${defaultName} (Infernal Forge)`;
            case "ZEPHYR_AVIAN": return `${defaultName} (Zephyr Aviary)`;
            case "TERRA_MAGNET": return `${defaultName} (Terra-Magnet)`;
            default: return `${defaultName} (Sanctum)`;
        }
    },

    openSetupScreen() {
        this.isDuelActive = false;
        const setupSec = document.getElementById('pre-duel-setup-section');
        const duelSec = document.getElementById('duel-section');
        const soloSec = document.getElementById('dashboard-section');
        if (setupSec) setupSec.classList.remove('hidden');
        if (duelSec) duelSec.classList.add('hidden');
        if (soloSec) soloSec.classList.add('hidden');

        // Sync dropdowns
        const p1Sel = document.getElementById('setup-p1-deck');
        const p2Sel = document.getElementById('setup-p2-deck');
        if (p1Sel) p1Sel.value = this.p1SelectedDeck;
        if (p2Sel) p2Sel.value = this.p2SelectedDeck;
        this.updateSetupPreview('P1', this.p1SelectedDeck);
        this.updateSetupPreview('P2', this.p2SelectedDeck);

        logToTerminal(`⚙️ [PRE-DUEL SETUP] Choose P1 and P2 archetypes before engaging.`);
    },

    updateSetupPreview(playerKey, deckId) {
        if (playerKey === "P1") this.p1SelectedDeck = deckId;
        else this.p2SelectedDeck = deckId;

        const info = ARCHETYPE_INFO[deckId] || ARCHETYPE_INFO["DEFAULT"];
        const descEl = document.getElementById(`setup-${playerKey.toLowerCase()}-desc`);
        if (descEl) {
            descEl.innerHTML = `
                <strong style="color:${info.color};">${info.title}</strong><br>
                <span>${info.desc}</span>
            `;
        }
    },

    startConfiguredMatch() {
        const setupSec = document.getElementById('pre-duel-setup-section');
        const duelSec = document.getElementById('duel-section');
        if (setupSec) setupSec.classList.add('hidden');
        if (duelSec) duelSec.classList.remove('hidden');
        this.isDuelActive = true;
        this.initMatch();
    },

    changeDeck(playerKey, deckId) {
        if (playerKey === "P1") this.p1SelectedDeck = deckId;
        else this.p2SelectedDeck = deckId;
        logToTerminal(`🔄 [LOADOUT CHANGED] ${playerKey} Archetype set to: ${deckId}`);
        this.initMatch();
    },

    getDeckCards(deckId) {
        if (archetypeDecks[deckId] && Array.isArray(archetypeDecks[deckId].cards) && archetypeDecks[deckId].cards.length > 0) {
            return [...archetypeDecks[deckId].cards];
        }
        if (deckId === "ABYSSAL_TIDE") {
            const cards = allCardsPool.filter(c => c.id.startsWith("AT_"));
            if (cards.length > 0) return cards;
        }
        if (deckId === "INFERNAL_FORGE") {
            const cards = allCardsPool.filter(c => c.id.startsWith("IF_"));
            if (cards.length > 0) return cards;
        }
        if (deckId === "ZEPHYR_AVIAN") {
            const cards = allCardsPool.filter(c => c.id.startsWith("ZA_"));
            if (cards.length > 0) return cards;
        }
        if (deckId === "TERRA_MAGNET") {
            const cards = allCardsPool.filter(c => c.id.startsWith("TM_"));
            if (cards.length > 0) return cards;
        }
        return [...DEFAULT_CARDS];
    },

    buildDeck(deckId) {
        const pool = this.getDeckCards(deckId);
        // Shuffle pool
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Return 25 card tactical deck (repeating if needed)
        const result = [];
        while (result.length < 25) {
            for (let card of shuffled) {
                if (result.length < 25) result.push(JSON.parse(JSON.stringify(card)));
            }
        }
        return result;
    },

    initMatch() {
        const p1Name = this.getArchetypeName(this.p1SelectedDeck, "P1");
        const p2Name = this.getArchetypeName(this.p2SelectedDeck, "P2");

        this.p1 = createOperative("P1", p1Name, this.p1SelectedDeck);
        this.p2 = createOperative("P2", p2Name, this.p2SelectedDeck);

        this.p1.deck = this.buildDeck(this.p1SelectedDeck);
        this.p2.deck = this.buildDeck(this.p2SelectedDeck);

        // Draw initial 4-card hands
        for (let i = 0; i < 4; i++) {
            if (this.p1.deck.length) this.p1.hand.push(this.p1.deck.pop());
            if (this.p2.deck.length) this.p2.hand.push(this.p2.deck.pop());
        }

        this.activeTurn = "P1";
        this.turnCount = 1;
        this.currentPhase = "DRAW";
        this.chainStack = [];
        this.isResolving = false;
        this.waitingForReaction = false;
        this.pendingAttack = null;

        logToTerminal(`⚔️ =================================================`);
        logToTerminal(`⚔️ TACTICAL DUEL STARTED!`);
        logToTerminal(`🛡️ P1: ${this.p1.name} [Deck: ${this.p1SelectedDeck}]`);
        logToTerminal(`⚔️ P2: ${this.p2.name} [Deck: ${this.p2SelectedDeck}]`);
        logToTerminal(`🧥 Armor Cards equip directly to operative body slots.`);
        logToTerminal(`⚔️ =================================================`);
        this.startDrawPhase();
    },

    // ── PHASE 1: DRAW PHASE ──────────────────────────────────────────────────
    async startDrawPhase() {
        this.currentPhase = "DRAW";
        const player = this.activeTurn === "P1" ? this.p1 : this.p2;
        player.normalEquipUsed = false;
        player.hasAttacked = false;

        logToTerminal(`──────────────────────────────────────────────────`);
        logToTerminal(`👉 [TURN ${this.turnCount}] ${player.name} — 🃏 DRAW PHASE`);

        // First-turn rule: P1 doesn't draw on Turn 1
        if (this.turnCount === 1 && this.activeTurn === "P1") {
            logToTerminal(`🚫 [FIRST TURN] No Draw on Turn 1 for the first player.`);
        } else {
            if (player.deck.length > 0) {
                const drawn = player.deck.pop();
                player.hand.push(drawn);
                logToTerminal(`🎴 [DRAW] Drew [${drawn.name}] (${drawn.type}). Deck: ${player.deck.length} remaining.`);
            } else {
                logToTerminal(`⚠️ [DECK OUT] Deck is empty!`);
            }
        }

        // Resource Dice Roll (d6) → +25 to +50 Energy
        await sleep(300);
        const roll = Math.floor(Math.random() * 6) + 1;
        const manaGain = 20 + (roll * 5);
        player.energy = Math.min(player.maxEnergy, player.energy + manaGain);
        logToTerminal(`🎲 [RESOURCE ROLL] d6 → ${roll} → +${manaGain} Energy/Shards! (Total: ${player.energy})`);

        this.renderDuelUI();
        await sleep(400);
        this.startStandbyPhase();
    },

    // ── PHASE 2: STANDBY PHASE ───────────────────────────────────────────────
    async startStandbyPhase() {
        this.currentPhase = "STANDBY";
        const player = this.activeTurn === "P1" ? this.p1 : this.p2;
        const opponent = this.activeTurn === "P1" ? this.p2 : this.p1;
        logToTerminal(`⏱️ [STANDBY PHASE] Evaluating field runes and persistent armor cores...`);

        // Continuous Spell/Trap standby effects for active player
        player.spellsTraps.forEach(slot => {
            const eff = slot.card && slot.card.effect;
            if (!eff || slot.isSet) return;
            if (eff.standbyHeal) {
                player.lp = Math.min(player.maxLp, player.lp + eff.standbyHeal);
                logToTerminal(`✨ [${slot.card.name}] Standby: +${eff.standbyHeal} LP restored.`);
            }
            if (eff.standbyEnergy) {
                player.energy = Math.min(player.maxEnergy, player.energy + eff.standbyEnergy);
                logToTerminal(`✨ [${slot.card.name}] Standby: +${eff.standbyEnergy} Energy restored.`);
            }
        });

        // Opponent continuous burn effects (Nightmare Wheel, etc.)
        opponent.spellsTraps.forEach(slot => {
            const eff = slot.card && slot.card.effect;
            if (!eff || slot.isSet) return;
            if (eff.standbyOpponentBurn) {
                player.lp = Math.max(0, player.lp - eff.standbyOpponentBurn);
                logToTerminal(`🔥 [${slot.card.name}] Opponent Trap: -${eff.standbyOpponentBurn} LP burn to ${player.name}! (LP: ${player.lp})`);
            }
        });

        if (this.p1.lp <= 0 || this.p2.lp <= 0) { this.handleMatchEnd(); return; }

        this.renderDuelUI();
        await sleep(350);
        this.startMainPhase1();
    },

    // ── PHASE 3: MAIN PHASE 1 ───────────────────────────────────────────────
    startMainPhase1() {
        this.currentPhase = "MAIN1";
        const player = this.activeTurn === "P1" ? this.p1 : this.p2;
        logToTerminal(`🏛️ [MAIN PHASE 1] ${player.name}: Equip Armor, activate Spells, or Set Traps.`);
        logToTerminal(`   ⚔️ Current Stats → ATK: ${player.totalAtk} / DEF: ${player.totalDef}`);
        this.renderDuelUI();
    },

    // ── PHASE 4: BATTLE PHASE ────────────────────────────────────────────────
    startBattlePhase() {
        if (this.turnCount === 1 && this.activeTurn === "P1") {
            logToTerminal(`🚫 [RULE] Battle Phase skipped on Turn 1!`);
            return;
        }
        if (this.currentPhase !== "MAIN1" && this.currentPhase !== "MAIN2") {
            logToTerminal(`⚠️ Must be in Main Phase to enter Battle Phase.`);
            return;
        }
        this.currentPhase = "BATTLE";
        const player = this.activeTurn === "P1" ? this.p1 : this.p2;
        const opponent = this.activeTurn === "P1" ? this.p2 : this.p1;
        logToTerminal(`⚔️ [BATTLE PHASE] ${player.name} (ATK ${player.totalAtk}) advances on ${opponent.name} (DEF ${opponent.totalDef})!`);
        logToTerminal(`   Click [⚔️ Declare Strike] to initiate the Damage Step!`);
        this.renderDuelUI();
    },

    async declareStrike() {
        if (this.currentPhase !== "BATTLE") {
            logToTerminal(`⚠️ Must be in Battle Phase to strike!`);
            return;
        }
        const attackerKey = this.activeTurn;
        const attacker = attackerKey === "P1" ? this.p1 : this.p2;
        const defenderKey = attackerKey === "P1" ? "P2" : "P1";

        if (attacker.hasAttacked) {
            logToTerminal(`⚠️ You have already declared a strike this turn!`);
            return;
        }

        attacker.hasAttacked = true;
        const defender = defenderKey === "P1" ? this.p1 : this.p2;
        logToTerminal(`⚔️ [STRIKE DECLARED] ${attacker.name} (ATK ${attacker.totalAtk}) strikes at ${defender.name} (DEF ${defender.totalDef})!`);

        this.pendingAttack = { attackerKey, defenderKey };
        this.waitingForReaction = true;
        this.reactionPlayer = defenderKey;
        logToTerminal(`⏱️ [BATTLE REACTION WINDOW] ${defender.name}: Activate a Trap/Quick-Play to respond, or Pass to take the hit!`);
        this.renderDuelUI();
    },

    // ── PHASE 5: MAIN PHASE 2 ───────────────────────────────────────────────
    startMainPhase2() {
        if (this.currentPhase !== "BATTLE" && this.currentPhase !== "MAIN1") {
            logToTerminal(`⚠️ Must transition from Battle Phase or remain in Main Phase 1.`);
            return;
        }
        this.currentPhase = "MAIN2";
        const player = this.activeTurn === "P1" ? this.p1 : this.p2;
        logToTerminal(`🏛️ [MAIN PHASE 2] ${player.name}: Equip additional Armor, set Traps, or activate post-battle Spells.`);
        this.renderDuelUI();
    },

    // ── PHASE 6: END PHASE ───────────────────────────────────────────────────
    async startEndPhase() {
        this.currentPhase = "END";
        const player = this.activeTurn === "P1" ? this.p1 : this.p2;
        const opponent = this.activeTurn === "P1" ? this.p2 : this.p1;
        logToTerminal(`🚪 [END PHASE] ${player.name}: Resolving end-of-turn cleanup.`);

        // End Phase burn effects from equipped armor (Solar Flare Reactor, etc.)
        for (const slot of ARMOR_SLOTS) {
            const piece = player.equippedArmor[slot];
            if (piece && piece.effect && piece.effect.endPhaseBurn) {
                opponent.lp = Math.max(0, opponent.lp - piece.effect.endPhaseBurn);
                logToTerminal(`🔥 [${piece.name}] End Phase Reactor: Inflicted ${piece.effect.endPhaseBurn} LP burn to ${opponent.name}! (LP: ${opponent.lp})`);
            }
        }

        // Hand limit check (max 6 cards)
        while (player.hand.length > 6) {
            const discarded = player.hand.shift();
            player.graveyard.push(discarded);
            logToTerminal(`⚠️ [HAND LIMIT] Discarded [${discarded.name}] to Graveyard.`);
        }

        // Continuous Drain Traps fire at End Phase
        opponent.spellsTraps.forEach(slot => {
            const eff = slot.card && slot.card.effect;
            if (!eff || slot.isSet) return;
            if (eff.energyDrain) {
                player.energy = Math.max(0, player.energy - eff.energyDrain);
                logToTerminal(`🔋 [${slot.card.name}] Drained ${eff.energyDrain} Energy from ${player.name}!`);
            }
        });

        if (this.p1.lp <= 0 || this.p2.lp <= 0) { this.handleMatchEnd(); return; }

        await sleep(400);
        this.activeTurn = this.activeTurn === "P1" ? "P2" : "P1";
        this.turnCount++;
        this.startDrawPhase();
    },

    // ── EQUIP ARMOR PIECE ────────────────────────────────────────────────────
    equipArmor(playerKey, cardIndex) {
        const isMain = this.currentPhase === "MAIN1" || this.currentPhase === "MAIN2";
        if (!isMain) {
            logToTerminal(`⚠️ Can only equip Armor during Main Phase 1 or 2!`);
            return;
        }
        if (this.activeTurn !== playerKey) {
            logToTerminal(`⚠️ Not your turn!`);
            return;
        }
        const player = playerKey === "P1" ? this.p1 : this.p2;
        if (player.normalEquipUsed) {
            logToTerminal(`⚠️ [EQUIP LIMIT] You have already equipped 1 Armor piece this turn!`);
            return;
        }

        const card = player.hand[cardIndex];
        if (!card || card.type !== "Armor/Equipment") {
            logToTerminal(`⚠️ Selected card is not an Armor/Equipment piece!`);
            return;
        }

        // Check required armor pieces condition (e.g. Moulinglacia / Infernal Emperor / Empen / Block Dragon)
        if (card.effect && card.effect.requirePieces && player.armorPieces < card.effect.requirePieces) {
            logToTerminal(`⚠️ [RESTRICTION] [${card.name}] requires at least ${card.effect.requirePieces} equipped Armor pieces to mount! (Current: ${player.armorPieces})`);
            return;
        }

        const cost = card.activation_cost ? card.activation_cost.energy : 20;
        if (player.energy < cost) {
            logToTerminal(`⚠️ [ENERGY] Insufficient Energy for [${card.name}] (requires ${cost}).`);
            return;
        }

        const slot = card.effect && card.effect.equipSlot ? card.effect.equipSlot : card.slot;
        if (!slot || !ARMOR_SLOTS.includes(slot)) {
            logToTerminal(`⚠️ Unknown slot: [${slot}].`);
            return;
        }

        player.energy -= cost;
        player.hand.splice(cardIndex, 1);

        // Unequip existing armor in slot → send to graveyard
        if (player.equippedArmor[slot]) {
            const old = player.equippedArmor[slot];
            player.graveyard.push(old);
            logToTerminal(`🗑️ [REPLACED] Sent [${old.name}] from ${slot.toUpperCase()} slot to Graveyard.`);
        }

        player.equippedArmor[slot] = card;
        
        // Check extraEquip effect (Zephyr chain equip)
        if (card.effect && card.effect.extraEquip) {
            player.normalEquipUsed = false;
            logToTerminal(`🌪️ [ZEPHYR SLIPSTREAM] Chain Equip triggered! You can equip another Armor piece this turn.`);
        } else {
            player.normalEquipUsed = true;
        }

        logToTerminal(`🧥 [EQUIP] ${player.name} equipped [${card.name}] to ${slot.toUpperCase()} SLOT.`);
        logToTerminal(`   ⚔️ New Operative ATK: ${player.totalAtk} / DEF: ${player.totalDef}`);

        // Trigger on-equip special archetypal effects
        const opponentKey = playerKey === "P1" ? "P2" : "P1";
        const opponent = opponentKey === "P1" ? this.p1 : this.p2;

        if (card.effect) {
            // Draw cards on equip (Neptabyss / Dragoon / Abysspike / Robina / Eglen / Researcher / Block Dragon)
            if (card.effect.drawCards) {
                for (let d = 0; d < card.effect.drawCards; d++) {
                    if (player.deck.length) {
                        const drawn = player.deck.pop();
                        player.hand.push(drawn);
                        logToTerminal(`   🎴 [SEARCH/DRAW] ${player.name} added [${drawn.name}] from Deck to hand!`);
                    }
                }
            }
            // Discard opponent cards (Moulinglacia / Poseidra / Thestalos / Raiza / Dark Simorgh)
            if (card.effect.opponentDiscardCount || card.effect.forceDiscard) {
                const count = card.effect.opponentDiscardCount || 1;
                for (let c = 0; c < count; c++) {
                    if (opponent.hand.length > 0) {
                        const rIdx = Math.floor(Math.random() * opponent.hand.length);
                        const discarded = opponent.hand.splice(rIdx, 1)[0];
                        opponent.graveyard.push(discarded);
                        logToTerminal(`   🌊 [HAND RIP] Force-discarded [${discarded.name}] from ${opponent.name}'s hand!`);
                    }
                }
            }
            // Direct burn on equip (Blazing Inpachi / Thestalos)
            if (card.effect.directDamage) {
                opponent.lp = Math.max(0, opponent.lp - card.effect.directDamage);
                logToTerminal(`   🔥 [THERMAL BURST] Inflicted ${card.effect.directDamage} direct burn damage to ${opponent.name}! (LP: ${opponent.lp})`);
            }
            // Destroy opponent equipment on equip (Abyssrhine / Empen / Raiza / Berserkion / Baronne)
            if (card.effect.destroyEquipment) {
                this.destroyRandomOpponentArmor(opponent);
            }
            // Destroy opponent field Spells/Traps on equip (Infernal Emperor / Harpie Duster)
            if (card.effect.destroySpellTrap && opponent.spellsTraps.length > 0) {
                opponent.spellsTraps.forEach(st => opponent.graveyard.push(st.card));
                opponent.spellsTraps = [];
                logToTerminal(`   💥 [OBLITERATE] Wiped all active Spell/Trap runes on ${opponent.name}'s field!`);
            }
            // Revive armor from Graveyard (Abyssteus / Inferno / Toccan / Valkyrion / Magnet Bonding)
            if (card.effect.reviveArmor && player.graveyard.length > 0) {
                const armorInGrave = player.graveyard.filter(c => c.type === "Armor/Equipment");
                if (armorInGrave.length > 0) {
                    const rev = armorInGrave[0];
                    const gIdx = player.graveyard.indexOf(rev);
                    player.graveyard.splice(gIdx, 1);
                    player.hand.push(rev);
                    logToTerminal(`   ♻️ [FORGE RECOVER] Retrieved [${rev.name}] from Graveyard to hand.`);
                }
            }
        }

        if (this.p1.lp <= 0 || this.p2.lp <= 0) { this.handleMatchEnd(); return; }

        this.waitingForReaction = true;
        this.reactionPlayer = opponentKey;
        logToTerminal(`⏱️ [REACTION WINDOW] ${opponent.name}: Respond with a Trap/Quick-Play or Pass.`);
        this.renderDuelUI();
    },

    destroyRandomOpponentArmor(opponent) {
        const equippedSlots = ARMOR_SLOTS.filter(s => opponent.equippedArmor[s]);
        if (equippedSlots.length > 0) {
            const slot = equippedSlots[Math.floor(Math.random() * equippedSlots.length)];
            const destroyedCard = opponent.equippedArmor[slot];
            opponent.equippedArmor[slot] = null;
            opponent.graveyard.push(destroyedCard);
            logToTerminal(`   💥 Destroyed [${destroyedCard.name}] from ${opponent.name}'s ${slot.toUpperCase()} slot!`);
            logToTerminal(`   ⚔️ ${opponent.name} revised stats → ATK: ${opponent.totalAtk} / DEF: ${opponent.totalDef}`);

            // Check opponent Backfire trap
            opponent.spellsTraps.forEach(st => {
                if (!st.isSet && st.card && st.card.effect && st.card.effect.burnOnOwnDestroy) {
                    const actor = opponent.id === "P1" ? this.p2 : this.p1;
                    actor.lp = Math.max(0, actor.lp - st.card.effect.burnOnOwnDestroy);
                    logToTerminal(`   🔥 [Backfire Reactive Plating] Inflicted ${st.card.effect.burnOnOwnDestroy} LP burn! (LP: ${actor.lp})`);
                }
            });
        } else {
            logToTerminal(`   ℹ️ ${opponent.name} has no equipped Armor pieces to destroy.`);
        }
    },

    // ── ACTIVATE SPELL / SET TRAP ─────────────────────────────────────────────
    activateSpellCard(playerKey, cardIndex, fromField = false, fieldIndex = -1) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const opponentKey = playerKey === "P1" ? "P2" : "P1";
        const opponent = opponentKey === "P1" ? this.p1 : this.p2;
        const card = fromField ? player.spellsTraps[fieldIndex].card : player.hand[cardIndex];
        if (!card) return;

        const cost = card.activation_cost ? card.activation_cost.energy : 20;
        if (player.energy < cost) {
            logToTerminal(`⚠️ [ENERGY] ${card.name} requires ${cost} Energy!`);
            return;
        }

        player.energy -= cost;
        if (fromField) {
            player.spellsTraps.splice(fieldIndex, 1);
        } else {
            player.hand.splice(cardIndex, 1);
        }

        // Continuous spells go to field, not chain
        if (card.type === "Spell/Continuous") {
            player.spellsTraps.push({ card, isSet: false });
            logToTerminal(`🌀 [CONTINUOUS] ${player.name} activated [${card.name}] as a persistent field rune.`);
            this.renderDuelUI();
            return;
        }

        const linkNum = this.chainStack.length + 1;
        this.chainStack.push({ playerKey, card });
        logToTerminal(`⛓️ [CHAIN LINK ${linkNum}] ${player.name} activated: [${card.name}] (${card.type})!`);

        this.waitingForReaction = true;
        this.reactionPlayer = opponentKey;
        logToTerminal(`⏱️ [REACTION WINDOW] ${opponent.name}: Chain a Fast Effect or Pass.`);
        this.renderDuelUI();
    },

    setSpellTrap(playerKey, cardIndex) {
        const isMain = this.currentPhase === "MAIN1" || this.currentPhase === "MAIN2";
        if (!isMain) { logToTerminal(`⚠️ Can only set Spells/Traps during Main Phase.`); return; }

        const player = playerKey === "P1" ? this.p1 : this.p2;
        const card = player.hand[cardIndex];
        if (!card) return;
        if (player.spellsTraps.length >= 3) { logToTerminal(`⚠️ S/T Zone full (max 3).`); return; }

        player.hand.splice(cardIndex, 1);
        player.spellsTraps.push({ card, isSet: true });
        logToTerminal(`🎴 ${player.name} SET [${card.name}] face-down.`);
        this.renderDuelUI();
    },

    activateSetCard(playerKey, fieldIndex) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const opponentKey = playerKey === "P1" ? "P2" : "P1";
        const slot = player.spellsTraps[fieldIndex];
        if (!slot || !slot.isSet) return;

        const card = slot.card;
        const cost = card.activation_cost ? card.activation_cost.energy : 20;
        if (player.energy < cost) {
            logToTerminal(`⚠️ Insufficient Energy to activate [${card.name}].`);
            return;
        }

        player.energy -= cost;
        player.spellsTraps.splice(fieldIndex, 1);

        if (card.type === "Trap/Continuous") {
            player.spellsTraps.push({ card, isSet: false });
            logToTerminal(`🌀 [CONTINUOUS TRAP] ${player.name} activated [${card.name}] into active rune state.`);
            this.renderDuelUI();
            return;
        }

        player.graveyard.push(card);
        const linkNum = this.chainStack.length + 1;
        this.chainStack.push({ playerKey, card });
        logToTerminal(`⛓️ [CHAIN LINK ${linkNum}] ${player.name} flipped [${card.name}] from S/T Zone!`);
        this.renderDuelUI();
    },

    passReaction(playerKey) {
        if (!this.waitingForReaction) return;
        if (this.reactionPlayer && this.reactionPlayer !== playerKey) {
            logToTerminal(`⚠️ It's not your reaction window.`);
            return;
        }
        const player = playerKey === "P1" ? this.p1 : this.p2;
        logToTerminal(`⏭️ ${player.name} passed the reaction window.`);
        this.waitingForReaction = false;
        this.reactionPlayer = null;

        if (this.chainStack.length > 0) {
            this.resolveChain();
        } else if (this.pendingAttack) {
            this.resolveDamageStep();
        }
    },

    // ── LIFO CHAIN RESOLUTION ─────────────────────────────────────────────────
    async resolveChain() {
        this.isResolving = true;
        logToTerminal(`⚡ [LIFO CHAIN RESOLVING] ${this.chainStack.length} link(s) in reverse order...`);
        this.renderDuelUI();

        let chainNegated = false;

        while (this.chainStack.length > 0) {
            await sleep(650);
            const linkObj = this.chainStack.pop();
            const linkNum = this.chainStack.length + 1;
            const actor = linkObj.playerKey === "P1" ? this.p1 : this.p2;
            const target = linkObj.playerKey === "P1" ? this.p2 : this.p1;
            const card = linkObj.card;
            const eff = card.effect || {};

            if (chainNegated) {
                logToTerminal(`🚫 [CL${linkNum} NEGATED] ${actor.name}'s [${card.name}] was negated!`);
                chainNegated = false;
                this.renderDuelUI();
                continue;
            }

            logToTerminal(`↳ [CL${linkNum}] ${actor.name} resolves [${card.name}]:`);

            if (eff.negate || eff.counterNegate || eff.handTrapNegate) {
                logToTerminal(`   ✨ Negation applied! Lower link in chain is negated.`);
                chainNegated = true;
                if (eff.costLP) {
                    actor.lp = Math.max(0, actor.lp - eff.costLP);
                    logToTerminal(`   💔 Paid ${eff.costLP} LP.`);
                }
            }
            if (eff.energyRefund) {
                actor.energy = Math.min(actor.maxEnergy, actor.energy + eff.energyRefund);
                logToTerminal(`   ⚡ +${eff.energyRefund} Energy refunded to ${actor.name}.`);
            }
            if (eff.directDamage) {
                target.lp = Math.max(0, target.lp - eff.directDamage);
                logToTerminal(`   💥 ${eff.directDamage} direct LP damage dealt to ${target.name}! (LP: ${target.lp})`);
            }
            if (eff.drawCards) {
                for (let d = 0; d < eff.drawCards; d++) {
                    if (actor.deck.length) actor.hand.push(actor.deck.pop());
                }
                logToTerminal(`   🎴 ${actor.name} drew ${eff.drawCards} card(s)!`);
            }
            if (eff.heal) {
                actor.lp = Math.min(actor.maxLp, actor.lp + eff.heal);
                logToTerminal(`   💚 Restored +${eff.heal} LP to ${actor.name}. (LP: ${actor.lp})`);
            }
            if (eff.haltAttack && this.pendingAttack) {
                logToTerminal(`   🛑 Pending attack was halted!`);
                this.pendingAttack = null;
            }
            if (eff.reflectAtkDamage && this.pendingAttack) {
                const strikeDmg = target.totalAtk;
                target.lp = Math.max(0, target.lp - strikeDmg);
                logToTerminal(`   🔄 [MAGIC CYLINDER] Strike redirected! ${target.name} takes ${strikeDmg} LP damage! (LP: ${target.lp})`);
                this.pendingAttack = null;
            }

            // Armor destruction effects
            if (eff.destroyEquipment || eff.destroyTargetArmor) {
                this.destroyRandomOpponentArmor(target);
            }
            if (eff.destroySpellTrap && target.spellsTraps.length > 0) {
                target.spellsTraps.forEach(st => target.graveyard.push(st.card));
                target.spellsTraps = [];
                logToTerminal(`   💥 [OBLITERATE] Wiped all active Spell/Trap runes on ${target.name}'s field!`);
            }
            if (eff.reflectDestroyArmor && this.pendingAttack) {
                this.destroyRandomOpponentArmor(target);
                this.pendingAttack = null;
            }
            if (eff.reviveArmor && actor.graveyard.length > 0) {
                const armorInGrave = actor.graveyard.filter(c => c.type === "Armor/Equipment");
                if (armorInGrave.length > 0) {
                    const rev = armorInGrave[0];
                    const gIdx = actor.graveyard.indexOf(rev);
                    actor.graveyard.splice(gIdx, 1);
                    actor.hand.push(rev);
                    logToTerminal(`   ♻️ [FORGE RECOVER] Retrieved [${rev.name}] from Graveyard to hand.`);
                }
            }

            this.renderDuelUI();
            if (this.p1.lp <= 0 || this.p2.lp <= 0) { this.handleMatchEnd(); return; }
        }

        await sleep(400);
        logToTerminal(`✅ [CHAIN COMPLETE] All links resolved.`);
        this.isResolving = false;

        if (this.pendingAttack) { await this.resolveDamageStep(); }
        this.renderDuelUI();
    },

    // ── DAMAGE STEP (Operative vs Operative) ─────────────────────────────────
    async resolveDamageStep() {
        if (!this.pendingAttack) return;
        const { attackerKey, defenderKey } = this.pendingAttack;
        this.pendingAttack = null;

        const attacker = attackerKey === "P1" ? this.p1 : this.p2;
        const defender = defenderKey === "P1" ? this.p1 : this.p2;

        await sleep(500);

        const atkVal = attacker.totalAtk;
        const defVal = defender.totalDef;

        logToTerminal(`⚔️ [DAMAGE STEP] ${attacker.name} ATK ${atkVal} vs ${defender.name} DEF ${defVal}`);

        if (atkVal > defVal) {
            const dmg = atkVal - defVal;
            defender.lp = Math.max(0, defender.lp - dmg);
            logToTerminal(`💥 [HIT!] ATK overpowered DEF by ${dmg}! ${defender.name} takes ${dmg} LP damage! (LP: ${defender.lp})`);
        } else if (atkVal < defVal) {
            const rebound = defVal - atkVal;
            attacker.lp = Math.max(0, attacker.lp - rebound);
            logToTerminal(`🛡️ [REBOUND!] DEF outclassed ATK! ${attacker.name} takes ${rebound} rebound damage! (LP: ${attacker.lp})`);
        } else {
            logToTerminal(`⚡ [CLASH!] ATK equals DEF — both operatives hold ground. No LP damage.`);
        }

        if (this.p1.lp <= 0 || this.p2.lp <= 0) { this.handleMatchEnd(); return; }
        this.renderDuelUI();
    },

    handleMatchEnd() {
        this.isResolving = false;
        this.waitingForReaction = false;
        const winner = this.p1.lp > 0 ? this.p1.name : this.p2.name;
        const loser  = this.p1.lp > 0 ? this.p2.name : this.p1.name;
        logToTerminal(`🏆 ==============================================`);
        logToTerminal(`🏆 DUEL CONCLUDED! ${winner.toUpperCase()} WINS!`);
        logToTerminal(`💀 ${loser}'s Life Points reached 0.`);
        logToTerminal(`🏆 ==============================================`);
        aetherShards += 50;
        updateShardDisplay();
        syncWithBackend({ action: 'duel_result', winner, loser, rounds: this.turnCount });
        this.renderDuelUI();
    },

    // ── PEEK AT OWN FACE-DOWN CARD ────────────────────────────────────────────
    peekFaceDown(playerKey, fieldIndex) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const slot = player.spellsTraps[fieldIndex];
        if (!slot || !slot.isSet) {
            logToTerminal(`⚠️ No face-down card at that position.`);
            return;
        }
        const card = slot.card;
        logToTerminal(`👁️ [PEEK] ${player.name} inspects face-down card:`);
        logToTerminal(`   📋 Name: ${card.name}`);
        logToTerminal(`   📋 Type: ${card.type} (Speed ${card.spell_speed || 1})`);
        logToTerminal(`   📋 Cost: ${card.activation_cost ? card.activation_cost.energy : '?'} Energy`);
        logToTerminal(`   📋 Effect: ${card.resolution_payload}`);
    },

    // ── UI RENDER ────────────────────────────────────────────────────────────
    renderDuelUI() {
        this.renderStats("P1");
        this.renderStats("P2");
        this.renderArmorLoadout("P1");
        this.renderArmorLoadout("P2");
        this.renderSpellZone("P1");
        this.renderSpellZone("P2");
        this.renderHand("P1");
        this.renderHand("P2");
        this.renderPhaseBar();
        this.renderChainStack();
        this.renderTurnBanner();

        // Update deck remaining badges
        const p1DeckEl = document.getElementById("p1-deck-count");
        const p2DeckEl = document.getElementById("p2-deck-count");
        if (p1DeckEl) p1DeckEl.innerText = `Deck: ${this.p1.deck.length}`;
        if (p2DeckEl) p2DeckEl.innerText = `Deck: ${this.p2.deck.length}`;

        const p1Badge = document.getElementById("p1-deck-badge");
        const p2Badge = document.getElementById("p2-deck-badge");
        if (p1Badge) p1Badge.innerText = this.getArchetypeBadgeLabel(this.p1SelectedDeck, "P1");
        if (p2Badge) p2Badge.innerText = this.getArchetypeBadgeLabel(this.p2SelectedDeck, "P2");

        const p1Summ = document.getElementById("p1-summary-badge");
        const p2Summ = document.getElementById("p2-summary-badge");
        if (p1Summ) p1Summ.innerText = this.getArchetypeBadgeLabel(this.p1SelectedDeck, "P1");
        if (p2Summ) p2Summ.innerText = this.getArchetypeBadgeLabel(this.p2SelectedDeck, "P2");
    },

    renderStats(playerKey) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const lp    = document.getElementById(`${playerKey.toLowerCase()}-lp`);
        const energy= document.getElementById(`${playerKey.toLowerCase()}-energy`);
        const atk   = document.getElementById(`${playerKey.toLowerCase()}-atk`);
        const def   = document.getElementById(`${playerKey.toLowerCase()}-def`);
        const pieces= document.getElementById(`${playerKey.toLowerCase()}-pieces`);
        if (lp)     lp.innerText     = `${player.lp}`;
        if (energy) energy.innerText = `${player.energy}`;
        if (atk)    atk.innerText    = `${player.totalAtk}`;
        if (def)    def.innerText    = `${player.totalDef}`;
        if (pieces) pieces.innerText = `${player.armorPieces}/5`;
    },

    renderArmorLoadout(playerKey) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const container = document.getElementById(`${playerKey.toLowerCase()}-armor`);
        if (!container) return;

        const isTurn = this.activeTurn === playerKey;
        const isReact = this.waitingForReaction && this.reactionPlayer === playerKey;
        const isHidden = !isTurn && !isReact;

        container.innerHTML = ARMOR_SLOTS.map(slot => {
            const piece = player.equippedArmor[slot];
            const slotIcon = { helm: "🪖", torso: "🛡️", arms: "⚔️", legs: "🦿", back: "🦅" }[slot] || "📦";
            if (piece) {
                if (isHidden) {
                    return `
                        <div class="armor-slot equipped" style="opacity:0.6;">
                            <div class="slot-label">${slotIcon} ${slot.toUpperCase()}</div>
                            <div class="slot-name" style="color:#94a3b8;">🔒 EQUIPPED</div>
                            <div class="slot-stats" style="color:#475569;">[INTEL LOCKED]</div>
                        </div>`;
                }
                return `
                    <div class="armor-slot equipped">
                        <div class="slot-label">${slotIcon} ${slot.toUpperCase()}</div>
                        <div class="slot-name">${piece.name}</div>
                        <div class="slot-stats">+${piece.atkBonus} ATK / +${piece.defBonus} DEF</div>
                    </div>`;
            }
            return `
                <div class="armor-slot empty">
                    <div class="slot-label">${slotIcon} ${slot.toUpperCase()}</div>
                    <div class="slot-empty-text">[Empty]</div>
                </div>`;
        }).join('');
    },

    renderSpellZone(playerKey) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const container = document.getElementById(`${playerKey.toLowerCase()}-spells`);
        if (!container) return;

        const isTurn = this.activeTurn === playerKey;
        const isReact = this.waitingForReaction && this.reactionPlayer === playerKey;
        const isOwner = isTurn || isReact;
        const isHidden = !isOwner;

        if (player.spellsTraps.length === 0) {
            container.innerHTML = `<div class="empty-zone-slot">[No active Spells/Traps]</div>`;
            return;
        }

        // If it's not this player's turn, hide their S/T zone details
        if (isHidden) {
            container.innerHTML = player.spellsTraps.map((st) => `
                <div class="field-st-card" style="opacity:0.6;">
                    <div style="font-size: 10px; font-weight: bold; color: #475569;">${st.isSet ? '🎴 Face-Down' : '🔒 Active Rune'}</div>
                    <div style="font-size: 9px; color: #334155;">[INTEL LOCKED]</div>
                </div>
            `).join('');
            return;
        }

        container.innerHTML = player.spellsTraps.map((st, idx) => `
            <div class="field-st-card">
                <div style="font-size: 10px; font-weight: bold; color: #67e8f9;">${st.isSet ? '🎴 Face-Down' : st.card.name}</div>
                <div style="font-size: 9px; color: #94a3b8;">${st.isSet ? 'Set Card' : st.card.type}</div>
                ${st.isSet ? `
                    <div class="card-btn-row">
                        <button class="btn-micro btn-phase" onclick="DuelEngine.peekFaceDown('${playerKey}', ${idx})" title="View your face-down card">👁️ Peek</button>
                        ${this.waitingForReaction && this.reactionPlayer === playerKey && st.card.spell_speed >= 2 ? `
                            <button class="btn-micro btn-react" onclick="DuelEngine.activateSetCard('${playerKey}', ${idx})">⚡ Flip!</button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');
    },

    renderHand(playerKey) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const container = document.getElementById(`${playerKey.toLowerCase()}-hand`);
        if (!container) return;

        const isTurn    = this.activeTurn === playerKey;
        const isMain    = this.currentPhase === "MAIN1" || this.currentPhase === "MAIN2";
        const isReact   = this.waitingForReaction && this.reactionPlayer === playerKey;
        const color     = playerKey === "P1" ? "#60a5fa" : "#c084fc";

        // Hide hand if it's not this player's turn AND not their reaction window
        const isHidden = !isTurn && !isReact;

        if (isHidden) {
            if (player.hand.length === 0) {
                container.innerHTML = `<div class="empty-zone-slot">[No cards in hand]</div>`;
            } else {
                container.innerHTML = player.hand.map(() => `
                    <div class="duel-card disabled" style="text-align:center; justify-content:center; min-height:60px;">
                        <div style="font-size:18px;">🂠</div>
                        <div style="font-size:10px; color:#475569; font-weight:bold;">CLASSIFIED</div>
                    </div>
                `).join('');
            }
            return;
        }

        container.innerHTML = player.hand.map((card, idx) => {
            const isArmor = card.type === "Armor/Equipment";
            const cost    = card.activation_cost ? card.activation_cost.energy : 20;
            const canAfford = player.energy >= cost;

            let buttons = "";

            if (isArmor && isTurn && isMain && !player.normalEquipUsed) {
                buttons += `<button class="btn-micro btn-action" onclick="DuelEngine.equipArmor('${playerKey}', ${idx})">🧥 Equip ${(card.slot || card.effect?.equipSlot || '?').toUpperCase()}</button>`;
            }
            if (!isArmor && isTurn && isMain) {
                if (card.type !== "Trap/Normal" && card.type !== "Trap/Continuous" && card.type !== "Trap/Counter" && card.type !== "Hand-Trap/Reaction") {
                    buttons += `<button class="btn-micro btn-action" onclick="DuelEngine.activateSpellCard('${playerKey}', ${idx})">⚡ Activate</button>`;
                }
                buttons += `<button class="btn-micro btn-warn" onclick="DuelEngine.setSpellTrap('${playerKey}', ${idx})">📋 Set</button>`;
            }
            if (isReact && card.spell_speed >= 2) {
                buttons += `<button class="btn-micro btn-react" onclick="DuelEngine.activateSpellCard('${playerKey}', ${idx})">⛓️ Chain!</button>`;
            }

            return `
                <div class="duel-card ${canAfford ? 'playable' : 'disabled'}">
                    <div style="font-weight:bold; font-size:11px; color:${color};">${card.name}</div>
                    <div style="font-size:9px; color:#94a3b8;">${card.type}${isArmor ? ` [${(card.slot||card.effect?.equipSlot||'').toUpperCase()} SLOT]` : ` (Spd ${card.spell_speed||1})`}</div>
                    ${isArmor ? `<div style="font-size:10px; color:#fde047;">+${card.atkBonus} ATK / +${card.defBonus} DEF</div>` : ''}
                    <div style="font-size:9px; color:#cbd5e1; line-height:1.2; margin-top:2px;">${card.resolution_payload}</div>
                    <div style="font-size:9px; color:#94a3b8;">⚡ Cost: ${cost}</div>
                    <div class="card-btn-row">${buttons}</div>
                </div>`;
        }).join('');
    },

    renderPhaseBar() {
        const bar = document.getElementById('phase-bar');
        if (!bar) return;
        const phases = ["DRAW", "STANDBY", "MAIN1", "BATTLE", "MAIN2", "END"];
        bar.innerHTML = phases.map(ph => `
            <span class="phase-chip ${this.currentPhase === ph ? 'active-phase' : ''}">${ph}</span>
        `).join(' ➔ ');
    },

    renderChainStack() {
        const el = document.getElementById('duel-chain-stack');
        if (!el) return;
        if (this.chainStack.length === 0) {
            el.innerHTML = `<span style="color:#64748b; font-size:11px;">[No Active Chain Links]</span>`;
        } else {
            el.innerHTML = this.chainStack.map((item, idx) => `
                <div style="background:#1e1b4b; border:1px solid #818cf8; padding:2px 6px; border-radius:3px; font-size:11px; display:inline-flex; align-items:center; gap:4px;">
                    <strong style="color:#f43f5e;">CL${idx+1}</strong>
                    <span style="color:#cbd5e1;">${item.playerKey}:</span>
                    <strong style="color:#38bdf8;">${item.card.name}</strong>
                </div>
            `).join(' ➔ ');
        }
    },

    renderTurnBanner() {
        const el = document.getElementById('turn-indicator');
        if (!el) return;
        const activePlayer = this.activeTurn === "P1" ? this.p1 : this.p2;
        if (this.waitingForReaction) {
            const rPlayer = this.reactionPlayer === "P1" ? this.p1 : this.p2;
            el.innerHTML = `⏱️ REACTION WINDOW: <span style="color:#f59e0b;">${rPlayer.name}</span> — Respond or Pass!`;
        } else if (this.isResolving) {
            el.innerHTML = `⚡ RESOLVING CHAIN...`;
        } else {
            const color = this.activeTurn === "P1" ? "#60a5fa" : "#c084fc";
            el.innerHTML = `👉 [TURN ${this.turnCount}] <span style="color:${color};">${activePlayer.name}</span> — ${this.currentPhase} PHASE`;
        }
    }
};

// ============================================================================
// SOLO INCURSION ENGINE
// ============================================================================
const GameEngine = {
    chainStack: [],
    toggleState: "AUTO",
    isExecuting: false,

    setToggle(state) {
        this.toggleState = state;
        const el = document.getElementById('toggle-status');
        if (el) el.innerText = state;
        logToTerminal(`[SYSTEM] Rules Engine → ${state}`);
    },

    async triggerEvent(eventType, cardData) {
        if (this.toggleState === "ON" || (this.toggleState === "AUTO" && (eventType === "ATTACK_INCOMING" || eventType === "VAULT_BREACH"))) {
            await this.openChainLink(cardData);
        } else {
            logToTerminal(`[SYSTEM] Toggle: ${this.toggleState}. Bypassing prompt for: ${cardData.name}`);
        }
    },

    async openChainLink(cardData) {
        this.chainStack.push(cardData);
        logToTerminal(`⛓️ [CHAIN LINK ${this.chainStack.length}] ${cardData.name} (${cardData.type})`);
        await sleep(400);
        await this.resolveChain();
    },

    async resolveChain() {
        logToTerminal(`⚡ [RESOLVING LIFO]...`);
        await sleep(350);
        while (this.chainStack.length > 0) {
            const c = this.chainStack.pop();
            logToTerminal(`↳ [RESOLVED] ${c.name}: "${c.resolution_payload}"`);
            aetherShards += 25;
            updateShardDisplay();
            await sleep(300);
        }
        logToTerminal(`✅ [CHAIN COMPLETE] +25 Aether Shards banked.`);
    }
};

function switchAppMode(mode) {
    currentAppMode = mode;
    const setupSec = document.getElementById('pre-duel-setup-section');
    const duelSec  = document.getElementById('duel-section');
    const soloSec  = document.getElementById('dashboard-section');
    
    document.getElementById('tab-duel').classList.toggle('active', mode === "DUEL");
    document.getElementById('tab-solo').classList.toggle('active', mode === "SOLO");
    
    if (mode === "DUEL") {
        soloSec.classList.add('hidden');
        if (!DuelEngine.isDuelActive) {
            DuelEngine.openSetupScreen();
        } else {
            setupSec.classList.add('hidden');
            duelSec.classList.remove('hidden');
        }
    } else {
        if (setupSec) setupSec.classList.add('hidden');
        if (duelSec) duelSec.classList.add('hidden');
        if (soloSec) soloSec.classList.remove('hidden');
    }
}

function logToTerminal(message) {
    const term = document.getElementById('terminal-log');
    if (!term) return;
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.style.cssText = "margin-bottom:3px; line-height:1.35;";
    line.innerText = `[${time}] ${message}`;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
}

function updateShardDisplay() {
    const el = document.getElementById('shard-display');
    if (el) el.innerText = aetherShards;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function toggleGameEngineMode() {
    if (GameEngine.toggleState === "AUTO") GameEngine.setToggle("ON");
    else if (GameEngine.toggleState === "ON") GameEngine.setToggle("OFF");
    else GameEngine.setToggle("AUTO");
}

function initializeOperative() {
    const playerId = document.getElementById('player-id').value;
    const clearanceDate = document.getElementById('player-birthday').value;
    if (!playerId || !clearanceDate) { alert("Please provide handle and clearance timestamp."); return; }

    const date = new Date(clearanceDate);
    const hiddenVector = computeHiddenTemporalAnchor(date.getMonth() + 1, date.getDate());
    const anchorEl = document.getElementById('anchor-display');
    if (anchorEl) anchorEl.innerText = hiddenVector.code;

    updateShardDisplay();
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('mode-tabs').classList.remove('hidden');
    
    // Always land on pre-duel selection screen first
    switchAppMode("DUEL");

    logToTerminal(`[AUTH] Operative Link Established: ${playerId}`);
    logToTerminal(`[SYSTEM] Synaptic Anchor Calibrated: ${hiddenVector.code}`);
    syncWithBackend({ player_id: playerId, zodiac: hiddenVector.raw, anchor_code: hiddenVector.code, action: 'initialize' });
}

function computeHiddenTemporalAnchor(month, day) {
    let raw = "Capricorn", code = "SYN-CAP-10";
    if ((month==1&&day>=20)||(month==2&&day<=18))  { raw="Aquarius";    code="SYN-AQU-11"; }
    else if ((month==2&&day>=19)||(month==3&&day<=20)) { raw="Pisces";  code="SYN-PSC-12"; }
    else if ((month==3&&day>=21)||(month==4&&day<=19)) { raw="Aries";   code="SYN-ARI-01"; }
    else if ((month==4&&day>=20)||(month==5&&day<=20)) { raw="Taurus";  code="SYN-TAU-02"; }
    else if ((month==5&&day>=21)||(month==6&&day<=20)) { raw="Gemini";  code="SYN-GEM-03"; }
    else if ((month==6&&day>=21)||(month==7&&day<=22)) { raw="Cancer";  code="SYN-CAN-04"; }
    else if ((month==7&&day>=23)||(month==8&&day<=22)) { raw="Leo";     code="SYN-LEO-05"; }
    else if ((month==8&&day>=23)||(month==9&&day<=22)) { raw="Virgo";   code="SYN-VIR-06"; }
    else if ((month==9&&day>=23)||(month==10&&day<=22)){ raw="Libra";   code="SYN-LIB-07"; }
    else if ((month==10&&day>=23)||(month==11&&day<=21)){ raw="Scorpio";code="SYN-SCO-08"; }
    else if ((month==11&&day>=22)||(month==12&&day<=21)){ raw="Sagittarius"; code="SYN-SAG-09"; }
    return { raw, code };
}

async function executeTacticalAction() {
    if (GameEngine.isExecuting) return;
    GameEngine.isExecuting = true;
    const actionBtn = document.getElementById('action-btn');
    if (actionBtn) { actionBtn.disabled = true; actionBtn.innerText = "⚡ Resolving..."; }

    const roll = Math.floor(Math.random() * 20) + 1;
    const card = allCardsPool[Math.floor(Math.random() * allCardsPool.length)] || allCardsPool[0];
    logToTerminal(`🎲 [INCURSION] d20 → ${roll} + 3 = ${roll+3}. Vault breached!`);
    await sleep(350);
    await GameEngine.triggerEvent("VAULT_BREACH", card);
    syncWithBackend({ action: 'vault_breach', card: card.name, result: roll + 3 });

    if (actionBtn) { actionBtn.disabled = false; actionBtn.innerText = "Simulate Incursion Action (Vault Breach)"; }
    GameEngine.isExecuting = false;
}

function syncWithBackend(payload) {
    if (APPS_SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) return;
    fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .catch(err => console.error("Sync error:", err));
}
