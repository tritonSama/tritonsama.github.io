const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxM9lthJCoadHZ6WvT37GTXBRcoE_3UOzZtC8kr7EcY6IhSs4lA_SvyzafXvGuIX7Lj/exec";

// Global State
let aetherFavor = 100;
let currentAppMode = "DUEL";
let allCardsPool = [];
let archetypeDecks = {};

// Willpower Slot definitions — body slots each angel can equip
const WILLPOWER_SLOTS = ["helm", "torso", "arms", "legs", "back"];

// Fallback card pool
const DEFAULT_CARDS = [
    { id: "WILLPOWER_001", name: "Seraph Blade Gauntlets",         type: "Willpower/Equipment", slot: "arms",  tier: 1, atkBonus: 400, defBonus: 150, activation_cost: { grace: 20 }, resolution_payload: "Arms Slot: Dual radiant grace blades (+400 ATK / +150 DEF).",          effect: { equipSlot: "arms",  atkBonus: 400, defBonus: 150 } },
    { id: "WILLPOWER_002", name: "Apophis Stone Vanguard Plate",   type: "Willpower/Equipment", slot: "torso", tier: 1, atkBonus: 200, defBonus: 600, activation_cost: { grace: 25 }, resolution_payload: "Torso Slot: Ancient stone chest plate (+200 ATK / +600 DEF).",           effect: { equipSlot: "torso", atkBonus: 200, defBonus: 600 } },
    { id: "WILLPOWER_003", name: "Cybernetic Archangel Wings",     type: "Willpower/Equipment", slot: "back",  tier: 2, atkBonus: 700, defBonus: 500, activation_cost: { grace: 40 }, resolution_payload: "Back Slot: Titanium ceramic wings (+700 ATK / +500 DEF).",             effect: { equipSlot: "back",  atkBonus: 700, defBonus: 500 } },
    { id: "WILLPOWER_004", name: "Solaris Seraph Crown",           type: "Willpower/Equipment", slot: "helm",  tier: 3, atkBonus: 900, defBonus: 700, activation_cost: { grace: 50 }, resolution_payload: "Helm Slot: Solar sovereign crown (+900 ATK / +700 DEF).",              effect: { equipSlot: "helm",  atkBonus: 900, defBonus: 700 } },
    { id: "WILLPOWER_005", name: "Void Stalker Stealth Cloak",     type: "Willpower/Equipment", slot: "back",  tier: 1, atkBonus: 550, defBonus: 200, activation_cost: { grace: 20 }, resolution_payload: "Back Slot: Dark matter infiltration cloak (+550 ATK / +200 DEF).",    effect: { equipSlot: "back",  atkBonus: 550, defBonus: 200 } },
    { id: "WILLPOWER_006", name: "Cryo Sentry Leg Guards",         type: "Willpower/Equipment", slot: "legs",  tier: 1, atkBonus: 150, defBonus: 650, activation_cost: { grace: 20 }, resolution_payload: "Legs Slot: Sub-zero cryo-alloy plating (+150 ATK / +650 DEF).",      effect: { equipSlot: "legs",  atkBonus: 150, defBonus: 650 } },
    { id: "WILLPOWER_007", name: "Dark Matter Shoulderplates",     type: "Willpower/Equipment", slot: "arms",  tier: 2, atkBonus: 800, defBonus: 550, activation_cost: { grace: 40 }, resolution_payload: "Arms Slot: Void-forged titanite pauldrons (+800 ATK / +550 DEF).",  effect: { equipSlot: "arms",  atkBonus: 800, defBonus: 550 } },
    { id: "WILLPOWER_008", name: "Abyssal Dragon Scale Chestplate",type: "Willpower/Equipment", slot: "torso", tier: 3, atkBonus: 600, defBonus: 900, activation_cost: { grace: 50 }, resolution_payload: "Torso Slot: Void-dragon scale plating (+600 ATK / +900 DEF).",       effect: { equipSlot: "torso", atkBonus: 600, defBonus: 900 } },
    { id: "SPELL_001", name: "Divine Inversion Protocol", type: "Spell/Quick-Play", spell_agility: 2, activation_cost: { grace: 25 }, resolution_payload: "Negate active chain link and refund 20 grace.", effect: { negate: true, graceRefund: 20 } },
    { id: "SPELL_002", name: "Solaris Flare Burst",       type: "Spell/Normal",     spell_agility: 1, activation_cost: { grace: 30 }, resolution_payload: "Deal 800 direct LP damage.",                    effect: { directDamage: 800 } },
    { id: "SPELL_003", name: "Mystical Space Typhoon",    type: "Spell/Quick-Play", spell_agility: 2, activation_cost: { grace: 20 }, resolution_payload: "Destroy 1 equipped Willpower piece on opponent.",   effect: { destroyEquipment: true } },
    { id: "SPELL_004", name: "Pot of Divine Greed",       type: "Spell/Normal",     spell_agility: 1, activation_cost: { grace: 25 }, resolution_payload: "Draw 2 cards from deck.",                      effect: { drawCards: 2 } },
    { id: "SPELL_005", name: "Synaptic Echo Anchor",      type: "Spell/Continuous", spell_agility: 1, activation_cost: { grace: 20 }, resolution_payload: "+300 LP and +20 Grace each Standby Phase.",   effect: { standbyHeal: 300, standbyGrace: 20 } },
    { id: "SPELL_006", name: "Power Bond Sync",           type: "Spell/Normal",     spell_agility: 1, activation_cost: { grace: 35 }, resolution_payload: "Double ATK bonus of one equipped Willpower piece this turn.", effect: { doubleEquipAtk: true } },
    { id: "TRAP_001", name: "Cryo-Willpower Directive",     type: "Trap/Normal",     spell_agility: 2, activation_cost: { grace: 25 }, resolution_payload: "When radianceed: Halt radiance and grant +600 LP.",                    effect: { haltRadiance: true, heal: 600 } },
    { id: "TRAP_002", name: "Willpower Shatter Collapse",   type: "Trap/Normal",     spell_agility: 2, activation_cost: { grace: 30 }, resolution_payload: "Destroy target Willpower piece on opponent angel.",               effect: { destroyTargetWillpower: true } },
    { id: "TRAP_003", name: "Mirror Force Radiance",    type: "Trap/Normal",     spell_agility: 2, activation_cost: { grace: 35 }, resolution_payload: "When radianceed: Destroy 1 random opponent equipped Willpower piece!",   effect: { reflectDestroyWillpower: true } },
    { id: "TRAP_004", name: "Skill Drain Matrix",       type: "Trap/Continuous", spell_agility: 2, activation_cost: { grace: 30 }, resolution_payload: "Drain 40 Grace from opponent each turn.",                        effect: { graceDrain: 40 } },
    { id: "TRAP_005", name: "Solemn Sentinel Barrier",  type: "Trap/Counter",    spell_agility: 3, activation_cost: { grace: 40 }, resolution_payload: "Pay 500 LP: Negate opponent action and destroy it.",              effect: { counterNegate: true, costLP: 500 } },
    { id: "TRAP_006", name: "Effect Veiler Pulse",      type: "Hand-Trap/Reaction", spell_agility: 2, activation_cost: { grace: 20 }, resolution_payload: "Discard: Negate opponent equipment activation or radiance.",    effect: { handTrapNegate: true } }
];

allCardsPool = [...DEFAULT_CARDS];

const ANGELIC_HOUSES = {
    "Flame": {
        desc: "Strength, passion, courage and destruction.",
        combat: "Aggressive melee combat.",
        abilities: ["Flame Blade", "Inferno Strike", "Burning Wings", "Meteor Fall", "Solar Burst", "Phoenix Ascension"],
        color: "#ef4444"
    },
    "Storm": {
        desc: "Freedom, agility, precision and power.",
        combat: "Fast radiances and mobility.",
        abilities: ["Lightning Step", "Thunder Spear", "Storm Wings", "Chain Lightning", "Tempest Strike", "Heaven's Thunder"],
        color: "#fbbf24"
    },
    "Tide": {
        desc: "Adaptation, patience, knowledge and balance.",
        combat: "Defensive and counterradiance-oriented.",
        abilities: ["Water Blade", "Frost Willpower", "Tidal Wave", "Ice Lance", "Frozen Domain", "Ocean's Judgment"],
        color: "#38bdf8"
    },
    "Terra": {
        desc: "Strength, stability, endurance and protection.",
        combat: "Heavy weapons and defensive combat.",
        abilities: ["Stone Skin", "Earthquake", "Titan Strike", "Crystal Shield", "Mountain's Wrath", "Colossus Ascension"],
        color: "#10b981"
    },
    "Gale": {
        desc: "Freedom, movement, awareness and perception.",
        combat: "Extreme mobility and ranged radiances.",
        abilities: ["Wind Blade", "Air Dash", "Cyclone", "Vacuum Strike", "Sky Prison", "Heaven's Gale"],
        color: "#a7f3d0"
    },
    "Radiance": {
        desc: "Justice, protection, healing and leadership.",
        combat: "Balanced offense/support.",
        abilities: ["Radiant Blade", "Holy Barrier", "Restoration", "Light Spear", "Divine Judgment", "Seraphic Ascension"],
        color: "#fde047"
    },
    "Shadow": {
        desc: "Knowledge, sacrifice, secrecy and power.",
        combat: "Assassination, debuffs and forbidden abilities.",
        abilities: ["Shadow Step", "Void Blade", "Darkness Field", "Soul Rend", "Abyssal Chains", "Eclipse Ascension"],
        color: "#c084fc"
    }
};

const ARCHETYPE_INFO = {
    "ABYSSAL_TIDE": {
        title: "Abyssal Tide Corps (WATER)",
        desc: "Deep-grid pressure-alloy willpower. Strips enemy tactical assets, executes rapid search combos, and unleashes high-priority counter-traps.",
        color: "#38bdf8"
    },
    "INFERNAL_FORGE": {
        title: "Infernal Forge Corps (FIRE)",
        desc: "Volcanic-core reactor plating. Emits passive End Phase burn damage, punishes willpower destruction with Backfire, and deflects strikes with Magic Cylinder.",
        color: "#f87171"
    },
    "ZEPHYR_AVIAN": {
        title: "Zephyr Sky-Reign Aviary (WIND)",
        desc: "High-altitude storm-forged chassis. Chains rapid multi-slot willpower mounts in a single turn, searches boss willpower, and halves opponent ATK.",
        color: "#34d399"
    },
    "TERRA_MAGNET": {
        title: "Terra-Magnet Bastion (EARTH)",
        desc: "Sub-crust electromagnetic ferrolith willpower. Excavates deep deck reserves, fields massive DEF monolithic frames, and wields superconducting negations.",
        color: "#fbbf24"
    },
    "DEFAULT": {
        title: "Tactical Default Hybrid",
        desc: "Balanced standard-issue The Great Archive angel chassis with versatile equipment, spells, and traps.",
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
            if (typeof CombatEngine !== 'undefined' && CombatEngine.p1SelectedDeck === "ABYSSAL_TIDE" && archetypeDecks["ABYSSAL_TIDE"]) {
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
function createAngel(id, name, deckArchetypeId = "DEFAULT") {
    return {
        id,
        name,
        deckArchetypeId,
        lp: 4000,
        maxLp: 4000,
        baseAtk: 500,
        baseDef: 500,
        grace: 100,
        maxGrace: 100,
        hand: [],
        deck: [],
        graveyard: [],
        equippedWillpower: { helm: null, torso: null, arms: null, legs: null, back: null },
        spellsTraps: [],
        normalEquipUsed: false,
        hasRadianceed: false,

        get totalAtk() {
            let atk = this.baseAtk;
            const pieces = this.willpowerPieces;
            for (const slot of WILLPOWER_SLOTS) {
                const item = this.equippedWillpower[slot];
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
            for (const slot of WILLPOWER_SLOTS) {
                if (this.equippedWillpower[slot]) def += this.equippedWillpower[slot].defBonus || 0;
            }
            return def;
        },
        get willpowerPieces() {
            return WILLPOWER_SLOTS.filter(s => this.equippedWillpower[s] !== null).length;
        }
    };
}

// ============================================================================
// 6-PHASE 2-PLAYER TACTICAL DUEL ENGINE
// ============================================================================
const CombatEngine = {
    p1: createAngel("P1", "Angel Alpha", "ABYSSAL_TIDE"),
    p2: createAngel("P2", "Angel Omega", "INFERNAL_FORGE"),
    p1SelectedDeck: "ABYSSAL_TIDE",
    p2SelectedDeck: "INFERNAL_FORGE",
    isCombatActive: false,
    activeTurn: "P1",
    turnCount: 1,
    currentPhase: "DRAW",
    chainStack: [],
    isResolving: false,
    waitingForReaction: false,
    reactionPlayer: null,
    pendingRadiance: null,

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
        const defaultName = playerSlot === "P1" ? "Angel Alpha" : "Angel Omega";
        switch (deckId) {
            case "ABYSSAL_TIDE": return `${defaultName} (Abyssal Tide)`;
            case "INFERNAL_FORGE": return `${defaultName} (Infernal Forge)`;
            case "ZEPHYR_AVIAN": return `${defaultName} (Zephyr Aviary)`;
            case "TERRA_MAGNET": return `${defaultName} (Terra-Magnet)`;
            default: return `${defaultName} (The Great Archive)`;
        }
    },

    openSetupScreen() {
        this.isCombatActive = false;
        const welcomeSec = document.getElementById('welcome-section');
        const setupSec   = document.getElementById('pre-combat-setup-section');
        const combatSec    = document.getElementById('combat-section');
        const betaSec    = document.getElementById('beta-signup-section');
        const modeTabs   = document.getElementById('mode-tabs');
        
        if (welcomeSec) welcomeSec.classList.add('hidden');
        if (betaSec)    betaSec.classList.add('hidden');
        if (combatSec)    combatSec.classList.add('hidden');
        if (setupSec)   setupSec.classList.remove('hidden');
        if (modeTabs)   modeTabs.classList.remove('hidden');

        // Sync dropdowns
        const p1Sel = document.getElementById('setup-p1-deck');
        const p2Sel = document.getElementById('setup-p2-deck');
        if (p1Sel) p1Sel.value = this.p1SelectedDeck;
        if (p2Sel) p2Sel.value = this.p2SelectedDeck;
        this.updateSetupPreview('P1', this.p1SelectedDeck);
        this.updateSetupPreview('P2', this.p2SelectedDeck);

        if (window.MultiplayerManager && typeof window.MultiplayerManager.syncDeckSelectionControls === 'function') {
            window.MultiplayerManager.syncDeckSelectionControls();
        }

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
        const setupSec = document.getElementById('pre-combat-setup-section');
        const combatSec = document.getElementById('combat-section');
        if (setupSec) setupSec.classList.add('hidden');
        if (combatSec) combatSec.classList.remove('hidden');
        this.isCombatActive = true;
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

        this.p1 = createAngel("P1", p1Name, this.p1SelectedDeck);
        this.p2 = createAngel("P2", p2Name, this.p2SelectedDeck);

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
        this.pendingRadiance = null;

        logToTerminal(`⚔️ =================================================`);
        logToTerminal(`⚔️ TACTICAL DUEL STARTED!`);
        logToTerminal(`🛡️ P1: ${this.p1.name} [Deck: ${this.p1SelectedDeck}]`);
        logToTerminal(`⚔️ P2: ${this.p2.name} [Deck: ${this.p2SelectedDeck}]`);
        logToTerminal(`🧥 Willpower Cards equip directly to angel body slots.`);
        logToTerminal(`⚔️ =================================================`);
        this.startDrawPhase();
    },

    // ── PHASE 1: DRAW PHASE ──────────────────────────────────────────────────
    async startDrawPhase() {
        this.currentPhase = "DRAW";
        const player = this.activeTurn === "P1" ? this.p1 : this.p2;
        player.normalEquipUsed = false;
        player.hasRadianceed = false;

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

        // Resource Dice Roll (d6) → +25 to +50 Grace
        await sleep(300);
        const roll = Math.floor(Math.random() * 6) + 1;
        const manaGain = 20 + (roll * 5);
        player.grace = Math.min(player.maxGrace, player.grace + manaGain);
        logToTerminal(`🎲 [RESOURCE ROLL] d6 → ${roll} → +${manaGain} Grace/Favor! (Total: ${player.grace})`);

        this.renderCombatUI();
        await sleep(400);
        this.startStandbyPhase();
    },

    // ── PHASE 2: STANDBY PHASE ───────────────────────────────────────────────
    async startStandbyPhase() {
        this.currentPhase = "STANDBY";
        const player = this.activeTurn === "P1" ? this.p1 : this.p2;
        const opponent = this.activeTurn === "P1" ? this.p2 : this.p1;
        logToTerminal(`⏱️ [STANDBY PHASE] Evaluating field runes and persistent willpower cores...`);

        // Continuous Spell/Trap standby effects for active player
        player.spellsTraps.forEach(slot => {
            const eff = slot.card && slot.card.effect;
            if (!eff || slot.isSet) return;
            if (eff.standbyHeal) {
                player.lp = Math.min(player.maxLp, player.lp + eff.standbyHeal);
                logToTerminal(`✨ [${slot.card.name}] Standby: +${eff.standbyHeal} LP restored.`);
            }
            if (eff.standbyGrace) {
                player.grace = Math.min(player.maxGrace, player.grace + eff.standbyGrace);
                logToTerminal(`✨ [${slot.card.name}] Standby: +${eff.standbyGrace} Grace restored.`);
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

        this.renderCombatUI();
        await sleep(350);
        this.startMainPhase1();
    },

    // ── PHASE 3: MAIN PHASE 1 ───────────────────────────────────────────────
    startMainPhase1() {
        this.currentPhase = "MAIN1";
        const player = this.activeTurn === "P1" ? this.p1 : this.p2;
        logToTerminal(`🏛️ [MAIN PHASE 1] ${player.name}: Equip Willpower, activate Spells, or Set Traps.`);
        logToTerminal(`   ⚔️ Current Stats → ATK: ${player.totalAtk} / DEF: ${player.totalDef}`);
        this.renderCombatUI();
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
        this.renderCombatUI();
    },

    async declareStrike() {
        if (this.currentPhase !== "BATTLE") {
            logToTerminal(`⚠️ Must be in Battle Phase to strike!`);
            return;
        }
        const radianceerKey = this.activeTurn;
        const radianceer = radianceerKey === "P1" ? this.p1 : this.p2;
        const defenderKey = radianceerKey === "P1" ? "P2" : "P1";

        if (radianceer.hasRadianceed) {
            logToTerminal(`⚠️ You have already declared a strike this turn!`);
            return;
        }

        radianceer.hasRadianceed = true;
        const defender = defenderKey === "P1" ? this.p1 : this.p2;
        logToTerminal(`⚔️ [STRIKE DECLARED] ${radianceer.name} (ATK ${radianceer.totalAtk}) strikes at ${defender.name} (DEF ${defender.totalDef})!`);

        this.pendingRadiance = { radianceerKey, defenderKey };
        this.waitingForReaction = true;
        this.reactionPlayer = defenderKey;
        logToTerminal(`⏱️ [BATTLE REACTION WINDOW] ${defender.name}: Activate a Trap/Quick-Play to respond, or Pass to take the hit!`);
        this.renderCombatUI();
    },

    // ── PHASE 5: MAIN PHASE 2 ───────────────────────────────────────────────
    startMainPhase2() {
        if (this.currentPhase !== "BATTLE" && this.currentPhase !== "MAIN1") {
            logToTerminal(`⚠️ Must transition from Battle Phase or remain in Main Phase 1.`);
            return;
        }
        this.currentPhase = "MAIN2";
        const player = this.activeTurn === "P1" ? this.p1 : this.p2;
        logToTerminal(`🏛️ [MAIN PHASE 2] ${player.name}: Equip additional Willpower, set Traps, or activate post-battle Spells.`);
        this.renderCombatUI();
    },

    // ── PHASE 6: END PHASE ───────────────────────────────────────────────────
    async startEndPhase() {
        this.currentPhase = "END";
        const player = this.activeTurn === "P1" ? this.p1 : this.p2;
        const opponent = this.activeTurn === "P1" ? this.p2 : this.p1;
        logToTerminal(`🚪 [END PHASE] ${player.name}: Resolving end-of-turn cleanup.`);

        // End Phase burn effects from equipped willpower (Solar Flare Reactor, etc.)
        for (const slot of WILLPOWER_SLOTS) {
            const piece = player.equippedWillpower[slot];
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
            if (eff.graceDrain) {
                player.grace = Math.max(0, player.grace - eff.graceDrain);
                logToTerminal(`🔋 [${slot.card.name}] Drained ${eff.graceDrain} Grace from ${player.name}!`);
            }
        });

        if (this.p1.lp <= 0 || this.p2.lp <= 0) { this.handleMatchEnd(); return; }

        await sleep(400);
        this.activeTurn = this.activeTurn === "P1" ? "P2" : "P1";
        this.turnCount++;
        this.startDrawPhase();
    },

    // ── EQUIP WILLPOWER PIECE ────────────────────────────────────────────────────
    equipWillpower(playerKey, cardIndex) {
        const isMain = this.currentPhase === "MAIN1" || this.currentPhase === "MAIN2";
        if (!isMain) {
            logToTerminal(`⚠️ Can only equip Willpower during Main Phase 1 or 2!`);
            return;
        }
        if (this.activeTurn !== playerKey) {
            logToTerminal(`⚠️ Not your turn!`);
            return;
        }
        const player = playerKey === "P1" ? this.p1 : this.p2;
        if (player.normalEquipUsed) {
            logToTerminal(`⚠️ [EQUIP LIMIT] You have already equipped 1 Willpower piece this turn!`);
            return;
        }

        const card = player.hand[cardIndex];
        if (!card || card.type !== "Willpower/Equipment") {
            logToTerminal(`⚠️ Selected card is not an Willpower/Equipment piece!`);
            return;
        }

        // Check required willpower pieces condition (e.g. Moulinglacia / Infernal Emperor / Empen / Block Dragon)
        if (card.effect && card.effect.requirePieces && player.willpowerPieces < card.effect.requirePieces) {
            logToTerminal(`⚠️ [RESTRICTION] [${card.name}] requires at least ${card.effect.requirePieces} equipped Willpower pieces to mount! (Current: ${player.willpowerPieces})`);
            return;
        }

        const cost = card.activation_cost ? card.activation_cost.grace : 20;
        if (player.grace < cost) {
            logToTerminal(`⚠️ [GRACE] Insufficient Grace for [${card.name}] (requires ${cost}).`);
            return;
        }

        const slot = card.effect && card.effect.equipSlot ? card.effect.equipSlot : card.slot;
        if (!slot || !WILLPOWER_SLOTS.includes(slot)) {
            logToTerminal(`⚠️ Unknown slot: [${slot}].`);
            return;
        }

        player.grace -= cost;
        player.hand.splice(cardIndex, 1);

        // Unequip existing willpower in slot → send to graveyard
        if (player.equippedWillpower[slot]) {
            const old = player.equippedWillpower[slot];
            player.graveyard.push(old);
            logToTerminal(`🗑️ [REPLACED] Sent [${old.name}] from ${slot.toUpperCase()} slot to Graveyard.`);
        }

        player.equippedWillpower[slot] = card;
        
        // Check extraEquip effect (Zephyr chain equip)
        if (card.effect && card.effect.extraEquip) {
            player.normalEquipUsed = false;
            logToTerminal(`🌪️ [ZEPHYR SLIPSTREAM] Chain Equip triggered! You can equip another Willpower piece this turn.`);
        } else {
            player.normalEquipUsed = true;
        }

        logToTerminal(`🧥 [EQUIP] ${player.name} equipped [${card.name}] to ${slot.toUpperCase()} SLOT.`);
        logToTerminal(`   ⚔️ New Angel ATK: ${player.totalAtk} / DEF: ${player.totalDef}`);

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
                this.destroyRandomOpponentWillpower(opponent);
            }
            // Destroy opponent field Spells/Traps on equip (Infernal Emperor / Harpie Duster)
            if (card.effect.destroySpellTrap && opponent.spellsTraps.length > 0) {
                opponent.spellsTraps.forEach(st => opponent.graveyard.push(st.card));
                opponent.spellsTraps = [];
                logToTerminal(`   💥 [OBLITERATE] Wiped all active Spell/Trap runes on ${opponent.name}'s field!`);
            }
            // Revive willpower from Graveyard (Abyssteus / Inferno / Toccan / Valkyrion / Magnet Bonding)
            if (card.effect.reviveWillpower && player.graveyard.length > 0) {
                const willpowerInGrave = player.graveyard.filter(c => c.type === "Willpower/Equipment");
                if (willpowerInGrave.length > 0) {
                    const rev = willpowerInGrave[0];
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
        this.renderCombatUI();
    },

    destroyRandomOpponentWillpower(opponent) {
        const equippedSlots = WILLPOWER_SLOTS.filter(s => opponent.equippedWillpower[s]);
        if (equippedSlots.length > 0) {
            const slot = equippedSlots[Math.floor(Math.random() * equippedSlots.length)];
            const destroyedCard = opponent.equippedWillpower[slot];
            opponent.equippedWillpower[slot] = null;
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
            logToTerminal(`   ℹ️ ${opponent.name} has no equipped Willpower pieces to destroy.`);
        }
    },

    // ── ACTIVATE SPELL / SET TRAP ─────────────────────────────────────────────
    activateSpellCard(playerKey, cardIndex, fromField = false, fieldIndex = -1) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const opponentKey = playerKey === "P1" ? "P2" : "P1";
        const opponent = opponentKey === "P1" ? this.p1 : this.p2;
        const card = fromField ? player.spellsTraps[fieldIndex].card : player.hand[cardIndex];
        if (!card) return;

        const cost = card.activation_cost ? card.activation_cost.grace : 20;
        if (player.grace < cost) {
            logToTerminal(`⚠️ [GRACE] ${card.name} requires ${cost} Grace!`);
            return;
        }

        player.grace -= cost;
        if (fromField) {
            player.spellsTraps.splice(fieldIndex, 1);
        } else {
            player.hand.splice(cardIndex, 1);
        }

        // Continuous spells go to field, not chain
        if (card.type === "Spell/Continuous") {
            player.spellsTraps.push({ card, isSet: false });
            logToTerminal(`🌀 [CONTINUOUS] ${player.name} activated [${card.name}] as a persistent field rune.`);
            this.renderCombatUI();
            return;
        }

        const linkNum = this.chainStack.length + 1;
        this.chainStack.push({ playerKey, card });
        logToTerminal(`⛓️ [CHAIN LINK ${linkNum}] ${player.name} activated: [${card.name}] (${card.type})!`);

        this.waitingForReaction = true;
        this.reactionPlayer = opponentKey;
        logToTerminal(`⏱️ [REACTION WINDOW] ${opponent.name}: Chain a Fast Effect or Pass.`);
        this.renderCombatUI();
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
        this.renderCombatUI();
    },

    activateSetCard(playerKey, fieldIndex) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const opponentKey = playerKey === "P1" ? "P2" : "P1";
        const slot = player.spellsTraps[fieldIndex];
        if (!slot || !slot.isSet) return;

        const card = slot.card;
        const cost = card.activation_cost ? card.activation_cost.grace : 20;
        if (player.grace < cost) {
            logToTerminal(`⚠️ Insufficient Grace to activate [${card.name}].`);
            return;
        }

        player.grace -= cost;
        player.spellsTraps.splice(fieldIndex, 1);

        if (card.type === "Trap/Continuous") {
            player.spellsTraps.push({ card, isSet: false });
            logToTerminal(`🌀 [CONTINUOUS TRAP] ${player.name} activated [${card.name}] into active rune state.`);
            this.renderCombatUI();
            return;
        }

        player.graveyard.push(card);
        const linkNum = this.chainStack.length + 1;
        this.chainStack.push({ playerKey, card });
        logToTerminal(`⛓️ [CHAIN LINK ${linkNum}] ${player.name} flipped [${card.name}] from S/T Zone!`);
        this.renderCombatUI();
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
        } else if (this.pendingRadiance) {
            this.resolveDamageStep();
        }
    },

    // ── LIFO CHAIN RESOLUTION ─────────────────────────────────────────────────
    async resolveChain() {
        this.isResolving = true;
        logToTerminal(`⚡ [LIFO CHAIN RESOLVING] ${this.chainStack.length} link(s) in reverse order...`);
        this.renderCombatUI();

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
                this.renderCombatUI();
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
            if (eff.graceRefund) {
                actor.grace = Math.min(actor.maxGrace, actor.grace + eff.graceRefund);
                logToTerminal(`   ⚡ +${eff.graceRefund} Grace refunded to ${actor.name}.`);
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
            if (eff.haltRadiance && this.pendingRadiance) {
                logToTerminal(`   🛑 Pending radiance was halted!`);
                this.pendingRadiance = null;
            }
            if (eff.reflectAtkDamage && this.pendingRadiance) {
                const strikeDmg = target.totalAtk;
                target.lp = Math.max(0, target.lp - strikeDmg);
                logToTerminal(`   🔄 [MAGIC CYLINDER] Strike redirected! ${target.name} takes ${strikeDmg} LP damage! (LP: ${target.lp})`);
                this.pendingRadiance = null;
            }

            // Willpower destruction effects
            if (eff.destroyEquipment || eff.destroyTargetWillpower) {
                this.destroyRandomOpponentWillpower(target);
            }
            if (eff.destroySpellTrap && target.spellsTraps.length > 0) {
                target.spellsTraps.forEach(st => target.graveyard.push(st.card));
                target.spellsTraps = [];
                logToTerminal(`   💥 [OBLITERATE] Wiped all active Spell/Trap runes on ${target.name}'s field!`);
            }
            if (eff.reflectDestroyWillpower && this.pendingRadiance) {
                this.destroyRandomOpponentWillpower(target);
                this.pendingRadiance = null;
            }
            if (eff.reviveWillpower && actor.graveyard.length > 0) {
                const willpowerInGrave = actor.graveyard.filter(c => c.type === "Willpower/Equipment");
                if (willpowerInGrave.length > 0) {
                    const rev = willpowerInGrave[0];
                    const gIdx = actor.graveyard.indexOf(rev);
                    actor.graveyard.splice(gIdx, 1);
                    actor.hand.push(rev);
                    logToTerminal(`   ♻️ [FORGE RECOVER] Retrieved [${rev.name}] from Graveyard to hand.`);
                }
            }

            this.renderCombatUI();
            if (this.p1.lp <= 0 || this.p2.lp <= 0) { this.handleMatchEnd(); return; }
        }

        await sleep(400);
        logToTerminal(`✅ [CHAIN COMPLETE] All links resolved.`);
        this.isResolving = false;

        if (this.pendingRadiance) { await this.resolveDamageStep(); }
        this.renderCombatUI();
    },

    // ── DAMAGE STEP (Angel vs Angel) ─────────────────────────────────
    async resolveDamageStep() {
        if (!this.pendingRadiance) return;
        const { radianceerKey, defenderKey } = this.pendingRadiance;
        this.pendingRadiance = null;

        const radianceer = radianceerKey === "P1" ? this.p1 : this.p2;
        const defender = defenderKey === "P1" ? this.p1 : this.p2;

        await sleep(500);

        const atkVal = radianceer.totalAtk;
        const defVal = defender.totalDef;

        logToTerminal(`⚔️ [DAMAGE STEP] ${radianceer.name} ATK ${atkVal} vs ${defender.name} DEF ${defVal}`);

        if (atkVal > defVal) {
            const dmg = atkVal - defVal;
            defender.lp = Math.max(0, defender.lp - dmg);
            logToTerminal(`💥 [HIT!] ATK overpowered DEF by ${dmg}! ${defender.name} takes ${dmg} LP damage! (LP: ${defender.lp})`);
        } else if (atkVal < defVal) {
            const rebound = defVal - atkVal;
            radianceer.lp = Math.max(0, radianceer.lp - rebound);
            logToTerminal(`🛡️ [REBOUND!] DEF outclassed ATK! ${radianceer.name} takes ${rebound} rebound damage! (LP: ${radianceer.lp})`);
        } else {
            logToTerminal(`⚡ [CLASH!] ATK equals DEF — both angels hold ground. No LP damage.`);
        }

        if (this.p1.lp <= 0 || this.p2.lp <= 0) { this.handleMatchEnd(); return; }
        this.renderCombatUI();
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
        aetherFavor += 50;
        updateFavorDisplay();
        syncWithBackend({ action: 'combat_result', winner, loser, rounds: this.turnCount });
        this.renderCombatUI();
    },

    // ── CARD & ABILITY INTEL INSPECTOR ───────────────────────────────────────
    inspectWillpower(playerKey, slot) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const piece = player.equippedWillpower[slot];
        if (!piece) return;

        this.openCardInspector(piece, `${slot.toUpperCase()} SLOT • ${player.name}`);
        logToTerminal(`🔍 [INTEL INSPECT] ${player.name}'s ${slot.toUpperCase()} Slot: [${piece.name}] - ${piece.resolution_payload}`);
    },

    inspectFieldCard(playerKey, idx) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const slot = player.spellsTraps[idx];
        if (!slot) return;

        if (slot.isSet) {
            // Face down can only be peeked by owner
            const isMe = (window.MultiplayerManager && window.MultiplayerManager.role === "CLIENT") ? (playerKey === "P2") : (playerKey === "P1");
            if (isMe || (window.MultiplayerManager && window.MultiplayerManager.role === "LOCAL")) {
                this.peekFaceDown(playerKey, idx);
            } else {
                logToTerminal(`🔒 [INTEL LOCKED] Opponent's face-down card cannot be inspected until activated!`);
            }
            return;
        }

        this.openCardInspector(slot.card, `ACTIVE GRID RUNE • ${player.name}`);
        logToTerminal(`🔍 [INTEL INSPECT] Active Rune [${slot.card.name}] (${slot.card.type}) - ${slot.card.resolution_payload}`);
    },

    openCardInspector(card, contextLabel = "CARD INTEL") {
        const modal = document.getElementById("intel-inspector-modal");
        const titleEl = document.getElementById("intel-modal-title");
        const subtitleEl = document.getElementById("intel-modal-subtitle");
        const tagEl = document.getElementById("intel-modal-tag");
        const atkEl = document.getElementById("intel-stat-atk");
        const defEl = document.getElementById("intel-stat-def");
        const costEl = document.getElementById("intel-stat-cost");
        const effectEl = document.getElementById("intel-modal-effect");
        const statsRow = document.getElementById("intel-modal-stats-row");

        if (!modal || !card) return;

        if (titleEl) titleEl.innerText = card.name;
        if (tagEl) tagEl.innerText = contextLabel;
        if (subtitleEl) subtitleEl.innerText = `${card.type} • Tier ${card.tier || 1} ${card.spell_agility ? `(Agility ${card.spell_agility})` : ''}`;
        
        const isWillpower = card.type === "Willpower/Equipment";
        if (statsRow) {
            if (isWillpower) {
                statsRow.style.display = "flex";
                if (atkEl) atkEl.innerText = `+${card.atkBonus || 0}`;
                if (defEl) defEl.innerText = `+${card.defBonus || 0}`;
            } else {
                statsRow.style.display = "flex";
                if (atkEl) atkEl.innerText = `N/A`;
                if (defEl) defEl.innerText = `N/A`;
            }
            const graceCost = card.activation_cost ? card.activation_cost.grace : 20;
            if (costEl) costEl.innerText = `${graceCost} Grace`;
        }

        if (effectEl) {
            effectEl.innerHTML = `<strong>Ability Resolution:</strong><br>${card.resolution_payload || 'Standard deployment piece.'}`;
        }

        modal.classList.remove("hidden");
    },

    closeCardInspector() {
        const modal = document.getElementById("intel-inspector-modal");
        if (modal) modal.classList.add("hidden");
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
        logToTerminal(`   📋 Type: ${card.type} (Agility ${card.spell_agility || 1})`);
        logToTerminal(`   📋 Cost: ${card.activation_cost ? card.activation_cost.grace : '?'} Grace`);
        logToTerminal(`   📋 Effect: ${card.resolution_payload}`);
        this.openCardInspector(card, `👁️ YOUR FACE-DOWN CARD • ${player.name}`);
    },

    // ── UI RENDER ────────────────────────────────────────────────────────────
    renderCombatUI() {
        this.renderStats("P1");
        this.renderStats("P2");
        this.renderWillpowerLoadout("P1");
        this.renderWillpowerLoadout("P2");
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
        const grace= document.getElementById(`${playerKey.toLowerCase()}-grace`);
        const atk   = document.getElementById(`${playerKey.toLowerCase()}-atk`);
        const def   = document.getElementById(`${playerKey.toLowerCase()}-def`);
        const pieces= document.getElementById(`${playerKey.toLowerCase()}-pieces`);
        if (lp)     lp.innerText     = `${player.lp}`;
        if (grace) grace.innerText = `${player.grace}`;
        if (atk)    atk.innerText    = `${player.totalAtk}`;
        if (def)    def.innerText    = `${player.totalDef}`;
        if (pieces) pieces.innerText = `${player.willpowerPieces}/5`;
    },

    renderWillpowerLoadout(playerKey) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const container = document.getElementById(`${playerKey.toLowerCase()}-willpower`);
        if (!container) return;

        container.innerHTML = WILLPOWER_SLOTS.map(slot => {
            const piece = player.equippedWillpower[slot];
            const slotIcon = { helm: "🪖", torso: "🛡️", arms: "⚔️", legs: "🦿", back: "🦅" }[slot] || "📦";
            if (piece) {
                return `
                    <div class="willpower-slot equipped" onclick="CombatEngine.inspectWillpower('${playerKey}', '${slot}')" title="Click to inspect ${piece.name} ability">
                        <div class="slot-label">${slotIcon} ${slot.toUpperCase()} 🔍</div>
                        <div class="slot-name">${piece.name}</div>
                        <div class="slot-stats">+${piece.atkBonus} ATK / +${piece.defBonus} DEF</div>
                    </div>`;
            }
            return `
                <div class="willpower-slot empty">
                    <div class="slot-label">${slotIcon} ${slot.toUpperCase()}</div>
                    <div class="slot-empty-text">[Empty]</div>
                </div>`;
        }).join('');
    },

    renderSpellZone(playerKey) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const container = document.getElementById(`${playerKey.toLowerCase()}-spells`);
        if (!container) return;

        if (player.spellsTraps.length === 0) {
            container.innerHTML = `<div class="empty-zone-slot">[No active Spells/Traps]</div>`;
            return;
        }

        const isMe = (window.MultiplayerManager && window.MultiplayerManager.role === "CLIENT") ? (playerKey === "P2") : (window.MultiplayerManager && window.MultiplayerManager.role === "HOST") ? (playerKey === "P1") : true;

        container.innerHTML = player.spellsTraps.map((st, idx) => {
            if (st.isSet) {
                return `
                    <div class="field-st-card">
                        <div style="font-size: 10px; font-weight: bold; color: #f59e0b;">🎴 Face-Down</div>
                        <div style="font-size: 9px; color: #94a3b8;">Set Trap/Spell</div>
                        <div class="card-btn-row">
                            ${isMe ? `<button class="btn-micro btn-phase" onclick="CombatEngine.peekFaceDown('${playerKey}', ${idx})" title="Peek face-down card">👁️ Peek</button>` : ''}
                            ${this.waitingForReaction && this.reactionPlayer === playerKey && st.card.spell_agility >= 2 ? `
                                <button class="btn-micro btn-react" onclick="CombatEngine.activateSetCard('${playerKey}', ${idx})">⚡ Flip!</button>
                            ` : ''}
                        </div>
                    </div>`;
            } else {
                return `
                    <div class="field-st-card" onclick="CombatEngine.inspectFieldCard('${playerKey}', ${idx})" style="cursor:pointer;" title="Click to inspect card ability">
                        <div style="font-size: 10px; font-weight: bold; color: #67e8f9;">${st.card.name} 🔍</div>
                        <div style="font-size: 9px; color: #94a3b8;">${st.card.type}</div>
                    </div>`;
            }
        }).join('');
    },

    renderHand(playerKey) {
        const player = playerKey === "P1" ? this.p1 : this.p2;
        const container = document.getElementById(`${playerKey.toLowerCase()}-hand`);
        if (!container) return;

        const isTurn    = this.activeTurn === playerKey;
        const isMain    = this.currentPhase === "MAIN1" || this.currentPhase === "MAIN2";
        const isReact   = this.waitingForReaction && this.reactionPlayer === playerKey;
        const color     = playerKey === "P1" ? "#60a5fa" : "#c084fc";

        // Determine if this hand belongs to the local screen viewer
        const isMultiplayer = window.MultiplayerManager && (window.MultiplayerManager.role === "HOST" || window.MultiplayerManager.role === "CLIENT" || window.MultiplayerManager.role === "SPECTATOR");
        
        let isHidden = false;
        if (isMultiplayer) {
            if (window.MultiplayerManager.role === "HOST") {
                isHidden = (playerKey !== "P1"); // Hide P2 hand on Host
            } else if (window.MultiplayerManager.role === "CLIENT") {
                isHidden = (playerKey !== "P2"); // Hide P1 hand on Client
            } else if (window.MultiplayerManager.role === "SPECTATOR") {
                isHidden = true; // Hide both in spectator
            }
        } else {
            // Local hotseat: hide hand of player whose turn/reaction it is not
            isHidden = !isTurn && !isReact;
        }

        if (isHidden) {
            if (player.hand.length === 0) {
                container.innerHTML = `<div class="empty-zone-slot">[No cards in hand]</div>`;
            } else {
                container.innerHTML = player.hand.map((_, i) => `
                    <div class="combat-card disabled" style="text-align:center; justify-content:center; min-height:55px; background:#0f172a; border:1px solid #334155;">
                        <div style="font-size:16px;">🂠</div>
                        <div style="font-size:9px; color:#64748b; font-weight:bold;">CLASSIFIED (${i + 1}/${player.hand.length})</div>
                    </div>
                `).join('');
            }
            return;
        }

        container.innerHTML = player.hand.map((card, idx) => {
            const isWillpower = card.type === "Willpower/Equipment";
            const cost    = card.activation_cost ? card.activation_cost.grace : 20;
            const canAfford = player.grace >= cost;

            let buttons = "";

            if (isWillpower && isTurn && isMain && !player.normalEquipUsed) {
                buttons += `<button class="btn-micro btn-action" onclick="CombatEngine.equipWillpower('${playerKey}', ${idx})">🧥 Equip ${(card.slot || card.effect?.equipSlot || '?').toUpperCase()}</button>`;
            }
            if (!isWillpower && isTurn && isMain) {
                if (card.type !== "Trap/Normal" && card.type !== "Trap/Continuous" && card.type !== "Trap/Counter" && card.type !== "Hand-Trap/Reaction") {
                    buttons += `<button class="btn-micro btn-action" onclick="CombatEngine.activateSpellCard('${playerKey}', ${idx})">⚡ Activate</button>`;
                }
                buttons += `<button class="btn-micro btn-warn" onclick="CombatEngine.setSpellTrap('${playerKey}', ${idx})">📋 Set</button>`;
            }
            if (isReact && card.spell_agility >= 2) {
                buttons += `<button class="btn-micro btn-react" onclick="CombatEngine.activateSpellCard('${playerKey}', ${idx})">⛓️ Chain!</button>`;
            }

            return `
                <div class="combat-card ${canAfford ? 'playable' : 'disabled'}">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-weight:bold; font-size:11px; color:${color};">${card.name}</div>
                        <button class="btn-micro btn-phase" style="padding:1px 4px; font-size:9px;" onclick="CombatEngine.openCardInspector(CombatEngine.${playerKey.toLowerCase()}.hand[${idx}], 'HAND CARD INTEL')" title="Inspect Full Card Details">🔍</button>
                    </div>
                    <div style="font-size:9px; color:#94a3b8;">${card.type}${isWillpower ? ` [${(card.slot||card.effect?.equipSlot||'').toUpperCase()} SLOT]` : ` (Spd ${card.spell_agility||1})`}</div>
                    ${isWillpower ? `<div style="font-size:10px; color:#fde047;">+${card.atkBonus} ATK / +${card.defBonus} DEF</div>` : ''}
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
        const el = document.getElementById('combat-chain-stack');
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
        if (this.toggleState === "ON" || (this.toggleState === "AUTO" && (eventType === "RADIANCE_INCOMING" || eventType === "VAULT_BREACH"))) {
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
            aetherFavor += 25;
            updateFavorDisplay();
            await sleep(300);
        }
        logToTerminal(`✅ [CHAIN COMPLETE] +25 Divine Favor banked.`);
    }
};

function switchAppMode(mode) {
    currentAppMode = mode;
    const welcomeSec = document.getElementById('welcome-section');
    
    // Remove the welcome section once a user signs in
    if (welcomeSec) welcomeSec.classList.add('hidden');
    
    // In a unified scrolling layout, we don't hide sections.
    // We can just scroll to the relevant section or trigger updates if needed.

    // Always trigger any rendering required for specific modes when accessed
    if (mode === "OUTIE" && window.SeveranceManager && typeof window.SeveranceManager.updateThe Great ArchiveDisplay === 'function') {
        window.SeveranceManager.updateThe Great ArchiveDisplay();
    }
    if (mode === "INNIE" && window.SeveranceManager && typeof window.SeveranceManager.renderChronicleGrid === 'function') {
        window.SeveranceManager.renderChronicleGrid();
        window.SeveranceManager.updateChronicleDisplay();
    }
    if (mode === "LOBBY" && window.LobbyFeedManager && typeof window.LobbyFeedManager.renderLobbyFeed === 'function') {
        window.LobbyFeedManager.renderLobbyFeed();
    }
    if (mode === "LEADERBOARD" && window.SeveranceManager && typeof window.SeveranceManager.fetchArchangel Hierarchy === 'function') {
        window.SeveranceManager.fetchArchangel Hierarchy();
    }
}

function enterStage1Demo() {
    const paladinNameInput = document.getElementById('welcome-player-id');
    const paladinName = (paladinNameInput && paladinNameInput.value.trim()) || "PILGRIM-ALPHA";
    
    const welcomeSec = document.getElementById('welcome-section');
    
    if (welcomeSec) welcomeSec.classList.add('hidden');
    
    switchAppMode("ANGELIC");
    logToTerminal(`🚀 [STAGE 1 DEMO] Grid Link Initialized for Angel: ${paladin name}`);
    logToTerminal(`⚔️ Welcome to Stage 1: Angel Willpower Card Celestial Combat.`);
    logToTerminal(`🛡️ Configure P1 & P2 Combat Archetypes below to engage.`);
    
    syncWithBackend({ player_id: paladin name, action: 'stage1_demo_enter' });
}

function enterBetaSignup() {
    const welcomeSec = document.getElementById('welcome-section');
    
    if (welcomeSec) welcomeSec.classList.add('hidden');
    
    switchAppMode("BETA");
    document.getElementById('beta-signup-section').scrollIntoView({ behavior: 'smooth' });
    logToTerminal(`📝 [BETA PORTAL] Navigated to Closed Beta Application Form.`);
}

function selectHouse(houseName) {
    const input = document.getElementById('angelic-house-input');
    if (input) input.value = houseName;

    // Update active button styling
    document.querySelectorAll('.house-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`house-btn-${houseName}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Update Info Box
    const box = document.getElementById('house-info-box');
    const data = ANGELIC_HOUSES[houseName];
    if (box && data) {
        box.innerHTML = `
            <h4 style="color:${data.color}; margin-top:0; margin-bottom:8px; font-size:16px;">HOUSE OF ${houseName.toUpperCase()}</h4>
            <div style="margin-bottom:8px;"><strong>Philosophy:</strong> <span style="color:#cbd5e1;">${data.desc}</span></div>
            <div style="margin-bottom:12px;"><strong>Combat Style:</strong> <span style="color:#cbd5e1;">${data.combat}</span></div>
            <div style="font-weight:bold; color:#94a3b8; font-size:11px; margin-bottom:4px; text-transform:uppercase;">Core Abilities:</div>
            <div class="abilities-grid">
                ${data.abilities.map(ab => `<div class="ability-tag">${ab}</div>`).join('')}
            </div>
        `;
    }
}

async function submitAngelicForm(event) {
    if (event) event.preventDefault();

    const nameEl = document.getElementById('angelic-name');
    const bodyEl = document.getElementById('angelic-body');
    const cosmeticsEl = document.getElementById('angelic-cosmetics');
    const houseInput = document.getElementById('angelic-house-input');
    const submitBtn = document.getElementById('angelic-submit-btn');
    const summaryBox = document.getElementById('angelic-summary');

    const name = nameEl ? nameEl.value.trim() : "";
    const bodyType = bodyEl ? bodyEl.value : "";
    const cosmetics = cosmeticsEl ? cosmeticsEl.value : "";
    const house = houseInput ? houseInput.value : "";

    if (!name || !house) {
        alert("⚠️ Please provide a Character Name and select an Elemental House.");
        return;
    }

    const payload = {
        timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
        name,
        bodyType,
        cosmetics,
        house,
        action: "angelic_creation"
    };

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "⏳ FORGING PALADIN OATH...";
    }

    try {
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        logToTerminal(`👼 [ANGELIC WARRIOR CREATED] ${name} joined House of ${house}.`);

        const form = document.getElementById('angelicCreationForm');
        if (form) form.classList.add('hidden');

        if (summaryBox) {
            const data = ANGELIC_HOUSES[house];
            summaryBox.innerHTML = `
            <h3>🌟 Paladin Initiation Successful</h3>
            <p>Welcome, <strong>${name}</strong>.</p>
            <p>You have joined the <strong>House of ${house}</strong>.</p>
            <p>Your journey into Celestia begins now.</p>
            <div style="margin-top: 15px;">
                <button class="btn-action" onclick="switchAppMode('OUTIE')">Enter The Great Archive ➔</button>
            </div>
        `;
        summaryBox.classList.remove('hidden');
        window.characterCreated = true;
        // Un-hide the tabs
        document.getElementById('mode-tabs').classList.remove('hidden');
        }

    } catch (err) {
        console.error("Angelic form submission error:", err);
        alert("Transmission failed. Please check your connection.");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "👼 CREATE PALADIN / ENTER WORLD";
        }
    }
}

function calculateBossDamage() {
    const p1Dmg = parseInt(document.getElementById('ledger-p1-dmg').value) || 0;
    const p2Dmg = parseInt(document.getElementById('ledger-p2-dmg').value) || 0;
    const p3Dmg = parseInt(document.getElementById('ledger-p3-dmg').value) || 0;
    const p4Dmg = parseInt(document.getElementById('ledger-p4-dmg').value) || 0;

    const totalOffense = p1Dmg + p2Dmg + p3Dmg + p4Dmg;
    const conviction = 50; // Hardcoded boss conviction for Xaphan
    let actualDamage = totalOffense - conviction;
    if (actualDamage < 0) actualDamage = 0;

    const vitalityElement = document.getElementById('boss-vitality');
    // Basic logic to reduce HP
    let currentHpStr = vitalityElement.innerText.split(' / ')[0];
    let currentHp = parseInt(currentHpStr) || 1500;

    currentHp -= actualDamage;
    if (currentHp < 0) currentHp = 0;

    vitalityElement.innerText = currentHp + ' / 1500';

    const resultDiv = document.getElementById('ledger-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <div style="color:#94a3b8; font-size:11px;">Math Resolution:</div>
        <div style="color:#ef4444; font-size:13px; font-weight:bold;">Total Player Offense: ${totalOffense}</div>
        <div style="color:#a78bfa; font-size:13px; font-weight:bold;">Boss Conviction: -${conviction}</div>
        <hr style="border-color:#334155; margin:8px 0;">
        <div style="color:#4ade80; font-size:14px; font-weight:bold;">Actual Damage Taken: ${actualDamage}</div>
        <div style="color:#cbd5e1; font-size:11px; margin-top:8px;">[SYSTEM POST REQUIRED]: Write narrative resolving damage absorbed and updated health pools. Determine boss counter-attack using Behavior Protocol Matrix.</div>
    `;

    // Reset inputs
    document.getElementById('ledger-p1-dmg').value = 0;
    document.getElementById('ledger-p2-dmg').value = 0;
    document.getElementById('ledger-p3-dmg').value = 0;
    document.getElementById('ledger-p4-dmg').value = 0;
}

window.calculateBossDamage = calculateBossDamage;

async function submitBetaTesterForm(event) {
    if (event) event.preventDefault();
    
    const nameEl = document.getElementById('beta-name');
    const emailEl = document.getElementById('beta-email');
    const classEl = document.getElementById('beta-guild-class');
    const phoneEl = document.getElementById('beta-phone');
    const birthDateEl = document.getElementById('beta-birthdate');
    const birthTimeEl = document.getElementById('beta-birthtime');
    const submitBtn = document.getElementById('beta-submit-btn');
    const statusEl = document.getElementById('beta-form-status');
    
    const name = nameEl ? nameEl.value.trim() : "";
    const email = emailEl ? emailEl.value.trim() : "";
    const guildClass = classEl ? classEl.value : "Tactical Angel";
    const phone = phoneEl ? phoneEl.value.trim() : "";
    const birthDate = birthDateEl ? birthDateEl.value : "";
    const birthTime = birthTimeEl ? birthTimeEl.value : "12:00";
    
    if (!name || !email) {
        if (statusEl) {
            statusEl.className = "form-status-msg error";
            statusEl.innerText = "⚠️ Please provide your Name and Email address.";
        }
        return;
    }
    
    const payload = {
        timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
        name,
        email,
        guildClass,
        birthDate,
        birthTime,
        phone,
        action: "beta_signup"
    };
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "⏳ TRANSMITTING APPLICATION TO GOOGLE SHEETS...";
    }
    if (statusEl) {
        statusEl.className = "form-status-msg pending";
        statusEl.innerText = "📡 Transmitting telemetry to Google Sheets...";
    }
    
    try {
        // text/plain avoids CORS preflight restrictions on Google Apps Script
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        
        if (statusEl) {
            statusEl.className = "form-status-msg success";
            statusEl.innerHTML = `✅ <strong>BETA APPLICATION RECORDED!</strong><br>Welcome to the Fledgling Protocol, Angel <strong>${name}</strong> (${guildClass}). Your record has been transmitted to Google Sheets.`;
        }
        
        logToTerminal(`✅ [BETA APPLICATION SUBMITTED] Angel: ${name} | Class: ${guildClass} | Transmitted to Google Sheets.`);
        
        const form = document.getElementById('betaSignupForm');
        if (form) form.reset();
    } catch (err) {
        if (statusEl) {
            statusEl.className = "form-status-msg error";
            statusEl.innerText = `⚠️ Transmission failed: ${err.message || 'Check your connection.'}`;
        }
        logToTerminal(`⚠️ [BETA SIGNUP ERROR] ${err.message}`);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "🚀 TRANSMIT BETA APPLICATION TO GOOGLE SHEETS";
        }
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

function updateFavorDisplay() {
    const el = document.getElementById('favor-display');
    if (el) el.innerText = aetherFavor;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function syncWithBackend(payload) {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) return;
    fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    }).catch(err => console.error("Sync error:", err));
}

// Explicit global exports for HTML button handlers
window.enterStage1Demo = enterStage1Demo;
window.enterBetaSignup = enterBetaSignup;
window.switchAppMode = switchAppMode;
window.submitBetaTesterForm = submitBetaTesterForm;
window.CombatEngine = CombatEngine;

// Wire up event listeners
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWelcomeButtons);
} else {
    initWelcomeButtons();
}

function initWelcomeButtons() {
    const btnEnter = document.getElementById('btn-welcome-enter');
    const btnBeta = document.getElementById('btn-welcome-beta');
    if (btnEnter) {
        btnEnter.addEventListener('click', (e) => {
            e.preventDefault();
            enterStage1Demo();
        });
    }
    if (btnBeta) {
        btnBeta.addEventListener('click', (e) => {
            e.preventDefault();
            enterBetaSignup();
        });
    }
}


