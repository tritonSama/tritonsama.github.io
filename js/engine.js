/**
 * ============================================================================
 * HeavenlyBound - Core Game Engine (Yu-Gi-Oh Hybrid Edition)
 * ============================================================================
 * Features:
 *   1. Top-Down Tabletop Dungeon Defense Architect (Yu-Gi-Oh Trap Primitives)
 *   2. Chain Link LIFO Resolution Engine (CL1 -> CL2 -> CL3 => CL3 -> CL2 -> CL1)
 *   3. Tactical Infiltration Action-Crawler (Attribute Stances, Spell Decks, Perception)
 *   4. Real-time "Breaking the Chain" Reaction Window
 *   5. Master Core Extinction & SPL Token / Aether Harvesting
 *   6. Web Audio Synthesizer (Yu-Gi-Oh activation sounds, dice rolls, alarms)
 * ============================================================================
 */

(function(window) {
  'use strict';

  // --- AUDIO SYNTHESIZER ---
  class HeavenlyAudioSynth {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    initCtx() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.1) {
      if (!this.enabled) return;
      try {
        this.initCtx();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }

    playClick() { this.playTone(880, 'triangle', 0.05, 0.05); }
    playCardActivate() {
      this.playTone(520, 'square', 0.08, 0.08);
      setTimeout(() => this.playTone(784, 'sine', 0.12, 0.1), 60);
      setTimeout(() => this.playTone(1046, 'sine', 0.2, 0.12), 120);
    }
    playChainTrigger() {
      this.playTone(220, 'sawtooth', 0.1, 0.15);
      setTimeout(() => this.playTone(440, 'sawtooth', 0.15, 0.15), 80);
      setTimeout(() => this.playTone(880, 'sawtooth', 0.25, 0.2), 160);
    }
    playChainBreak() {
      [1046, 880, 659, 1318].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.18, 0.1), i * 50);
      });
    }
    playDiceRoll() {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => this.playTone(200 + Math.random() * 600, 'square', 0.04, 0.04), i * 70);
      }
    }
    playSuccess() {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 'triangle', 0.25, 0.08), idx * 80);
      });
    }
    playGlitch() {
      this.playTone(120, 'sawtooth', 0.15, 0.15);
      setTimeout(() => this.playTone(90, 'sawtooth', 0.12, 0.15), 60);
    }
    playAlarm() {
      this.playTone(800, 'sawtooth', 0.2, 0.1);
      setTimeout(() => this.playTone(400, 'sawtooth', 0.2, 0.1), 150);
    }
  }

  class HeavenlyGameEngine {
    constructor() {
      this.sound = new HeavenlyAudioSynth();

      // Club & Resource State
      this.credits = 250;      // Tithe Credits
      this.aetherShards = 80;  // Aether Shards
      this.splTokens = 150;    // SPL Token Resources
      this.essence = {
        DARK: 150,
        LIGHT: 150,
        EARTH: 150,
        FIRE: 120,
        WATER: 120,
        WIND: 120
      };
      this.highScore = 0;

      // Active Mode: 'DEFENSE' or 'INFILTRATION'
      this.currentMode = 'DEFENSE';

      // --- PHASE 1: DUNGEON DEFENSE GRID ---
      this.defCols = 8;
      this.defRows = 5;
      this.defenseGrid = Array(this.defRows).fill(null).map(() => Array(this.defCols).fill(null));
      this.selectedTrapCard = null;

      // --- PHASE 2: INFILTRATION RAID STATE ---
      this.operative = {
        name: 'Operative 7-Bound',
        hp: 100,
        maxHp: 100,
        stamina: 100,
        maxStamina: 100,
        graceIntegrity: 100,
        stance: 'DARK', // 'DARK', 'LIGHT', 'FIRE', 'WATER', 'EARTH', 'WIND'
        stats: {
          prowess: 14,
          reflex: 16,
          logic: 16,
          resilience: 13,
          perception: 16, // Reveals face-down normal traps
          grace: 14
        },
        hand: [] // Active Quick-Play / Equip / Hand-Traps
      };

      // Infiltration Map (Enemy Club Sector)
      this.infilRows = 6;
      this.infilCols = 6;
      this.infilGrid = [];
      this.infilPlayerPos = { r: 0, c: 0 };
      this.inRun = false;
      this.raidFloor = 1;
      this.raidLoot = { spl: 0, shards: 0, credits: 0 };

      // Chain Link Real-Time Window
      this.activeChain = null; // { room, links: [], timer: null, timeLeft: 0 }
      this.chainWindowActive = false;

      // Master Core State
      this.masterCore = {
        hp: 200,
        maxHp: 200,
        shieldActive: true,
        destroyed: false
      };

      // Tick & Save loops
      this.tickTimer = null;
      this.saveTimer = null;
    }

    async init() {
      const user = window.HeavenlyAuth ? window.HeavenlyAuth.getCurrentUser() : null;
      if (user) {
        await this.loadSavedState(user.githubId);
      } else {
        this.setupDefaultDefense();
      }

      this.initInfiltratorHand();
      this.startBaseTickLoop();
      this.startAutoSaveLoop();
      this.log('HeavenlyBound Yu-Gi-Oh Tactical Grid Initialized. Spell Speed clocks synchronized.', 'info');
    }

    initInfiltratorHand() {
      if (window.YgoApi) {
        this.operative.hand = window.YgoApi.getInfiltratorHand();
      }
    }

    startBaseTickLoop() {
      if (this.tickTimer) clearInterval(this.tickTimer);
      this.tickTimer = setInterval(() => this.processEssenceTick(), 2500);
    }

    startAutoSaveLoop() {
      if (this.saveTimer) clearInterval(this.saveTimer);
      this.saveTimer = setInterval(() => this.autoSave(), 30000);
    }

    processEssenceTick() {
      // Passive essence distillation
      this.credits += 4;
      this.aetherShards += 1;
      this.essence.DARK += 2;
      this.essence.LIGHT += 2;
      this.essence.EARTH += 2;
      this.essence.FIRE += 1;
      this.essence.WATER += 1;
      this.essence.WIND += 1;

      if (window.HeavenlyUI) {
        window.HeavenlyUI.updateResourceDisplays();
      }
    }

    // --------------------------------------------------------------------------
    // PHASE 1: TOP-DOWN DUNGEON DEFENSE (Yu-Gi-Oh Architect)
    // --------------------------------------------------------------------------

    setupDefaultDefense() {
      // Place starting defense layout
      if (!window.YgoApi) return;
      const bHole = window.YgoApi.getCard(29401950); // Bottomless Trap Hole
      const sDrain = window.YgoApi.getCard(82732705); // Skill Drain
      const sJudge = window.YgoApi.getCard(41420027); // Solemn Judgment
      const apophis = window.YgoApi.getCard(28649820); // Embodiment of Apophis

      if (bHole) this.placeTrap(1, 2, bHole);
      if (sDrain) this.placeTrap(2, 3, sDrain);
      if (sJudge) this.placeTrap(2, 5, sJudge);
      if (apophis) this.placeTrap(3, 4, apophis);
    }

    /**
     * Place Trap Card onto Defense Grid Tile
     */
    placeTrap(r, c, card) {
      if (!card) return false;

      // Check costs
      if (this.credits < (card.cost.tithes || 0)) {
        this.log(`Insufficient Tithe Credits! Requires ${card.cost.tithes} Credits.`, 'warning');
        this.sound.playAlarm();
        return false;
      }

      const attr = card.attribute || 'DARK';
      const reqEssence = card.cost[attr.toLowerCase()] || 0;
      if (this.essence[attr] < reqEssence) {
        this.log(`Insufficient ${attr} Essence! Requires ${reqEssence} ${attr} Essence.`, 'warning');
        this.sound.playAlarm();
        return false;
      }

      // Deduct cost
      this.credits -= (card.cost.tithes || 0);
      this.essence[attr] -= reqEssence;

      const existing = this.defenseGrid[r][c];
      if (existing) {
        // Append into Chain Link sequence if slot has existing trap
        if (!existing.chain) existing.chain = [existing.card];
        existing.chain.push(card);
        this.log(`Chain Link Augmented at Sector (${c + 1}, ${r + 1}): [Chain Link ${existing.chain.length}: ${card.name} (${card.category})].`, 'success');
      } else {
        this.defenseGrid[r][c] = {
          card: card,
          chain: [card],
          isFaceDown: card.mechanicType === 'NORMAL_TRAP',
          r, c,
          placedAt: Date.now()
        };
        this.log(`Set [${card.name}] (${card.category}) at Sector (${c + 1}, ${r + 1}).`, 'success');
      }

      this.sound.playCardActivate();
      this.autoSave();

      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderDefenseGrid();
        window.HeavenlyUI.updateResourceDisplays();
      }
      return true;
    }

    /**
     * Remove / Dismantle Trap from Grid Tile
     */
    removeTrap(r, c) {
      const tile = this.defenseGrid[r][c];
      if (!tile) return;

      const refundCredits = Math.floor((tile.card.cost.tithes || 40) * 0.5);
      this.credits += refundCredits;
      this.defenseGrid[r][c] = null;

      this.log(`Dismantled defense at Sector (${c + 1}, ${r + 1}). Refunded +${refundCredits} Credits.`, 'info');
      this.sound.playClick();

      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderDefenseGrid();
        window.HeavenlyUI.updateResourceDisplays();
      }
    }

    // --------------------------------------------------------------------------
    // PHASE 2: INFILTRATION RAID (Tabletop Action-Crawler)
    // --------------------------------------------------------------------------

    startInfiltrationRaid() {
      this.inRun = true;
      this.operative.hp = this.operative.maxHp;
      this.operative.stamina = this.operative.maxStamina;
      this.operative.graceIntegrity = 100;
      this.infilPlayerPos = { r: 0, c: 0 };
      this.raidLoot = { spl: 0, shards: 0, credits: 0 };

      this.masterCore.hp = this.masterCore.maxHp;
      this.masterCore.destroyed = false;

      this.generateInfiltrationSector(6, 6);
      this.sound.playSuccess();
      this.log(`+++ INFILTRATING ENEMY CLUB TERRITORY SECTOR ${this.raidFloor} +++`, 'info');

      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderInfiltration();
      }
    }

    generateInfiltrationSector(rows = 6, cols = 6) {
      this.infilGrid = [];
      const total = rows * cols;
      const coreIndex = total - 1;

      // Sample preset traps from YGOPRODeck cards for the enemy dungeon
      const enemyTrapPool = [
        window.YgoApi.getCard(29401950), // Bottomless Trap Hole
        window.YgoApi.getCard(77414722), // Compulsory Evacuation
        window.YgoApi.getCard(82732705), // Skill Drain
        window.YgoApi.getCard(41420027), // Solemn Judgment
        window.YgoApi.getCard(28649820), // Embodiment of Apophis
        window.YgoApi.getCard(44095762)  // Mirror Force
      ].filter(Boolean);

      for (let i = 0; i < total; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;

        let node;
        if (i === 0) {
          node = {
            id: i, r, c,
            type: 'ENTRY',
            title: 'Insertion AirLock',
            desc: 'Starting point of the territory raid.',
            icon: '🚪',
            cleared: true,
            fogged: false,
            chain: []
          };
        } else if (i === coreIndex) {
          node = {
            id: i, r, c,
            type: 'MASTER_CORE',
            title: 'Master Territory Core',
            desc: 'The beating heart of the rival club territory. Destroy it to liberate the sector!',
            icon: '💠',
            cleared: false,
            fogged: true,
            chain: []
          };
        } else {
          // 40% chance of traps, 25% chance of chained trap combo!
          const hasTrap = Math.random() < 0.55;
          const chain = [];
          if (hasTrap && enemyTrapPool.length > 0) {
            const trap1 = enemyTrapPool[Math.floor(Math.random() * enemyTrapPool.length)];
            chain.push(trap1);
            if (Math.random() < 0.35) {
              const trap2 = enemyTrapPool[Math.floor(Math.random() * enemyTrapPool.length)];
              chain.push(trap2);
            }
          }

          node = {
            id: i, r, c,
            type: chain.length > 0 ? 'TRAP_CHAMBER' : 'DATA_CORRIDOR',
            title: chain.length > 0 ? 'Armed Defense Chamber' : 'Security Corridor',
            desc: chain.length > 0 ? 'Heavy sensors and ethereal rune signatures detected.' : 'Clear hallway with minor data caches.',
            icon: chain.length > 0 ? '⚠️' : '▪️',
            cleared: false,
            fogged: true,
            chain: chain,
            shards: Math.floor(10 + Math.random() * 20),
            spl: Math.floor(15 + Math.random() * 30)
          };
        }
        this.infilGrid.push(node);
      }

      this.revealInfiltrationNeighbors(0, 0);
    }

    revealInfiltrationNeighbors(r, c) {
      const neighbors = [
        { r: r - 1, c }, { r: r + 1, c },
        { r, c: c - 1 }, { r, c: c + 1 }
      ];

      neighbors.forEach(n => {
        if (n.r >= 0 && n.r < this.infilRows && n.c >= 0 && n.c < this.infilCols) {
          const idx = n.r * this.infilCols + n.c;
          if (this.infilGrid[idx]) {
            this.infilGrid[idx].fogged = false;
          }
        }
      });
    }

    /**
     * Set Active Infiltrator Attribute Stance
     */
    setStance(newStance) {
      this.operative.stance = newStance;
      this.sound.playClick();
      this.log(`Operative Stance shifted to [${newStance}]: ${this.getStanceDescription(newStance)}`, 'info');
      if (window.HeavenlyUI) {
        window.HeavenlyUI.updateStanceDisplay();
      }
    }

    getStanceDescription(stance) {
      switch (stance) {
        case 'DARK': return 'Shadow Stealth (Undetectable by automated turrets)';
        case 'LIGHT': return 'Radiant Flash (Blinds security cameras & stuns guardians)';
        case 'FIRE': return 'Explosive Breach (Melts door locks & reinforced mounts)';
        case 'WATER': return 'Frost Shield (Chills sensors, 50% hazard reduction)';
        case 'EARTH': return 'Seismic Grounding (Immune to gravity collapse pits)';
        case 'WIND': return 'Zephyr Agility (Speed boost, evasion)';
        default: return '';
      }
    }

    /**
     * Move Infiltrator to Target Node
     */
    moveInfiltrator(r, c) {
      if (this.chainWindowActive) {
        this.log('Cannot move while Chain Link is resolving! Break the chain or wait.', 'warning');
        return;
      }

      const current = this.infilPlayerPos;
      const dist = Math.abs(r - current.r) + Math.abs(c - current.c);
      if (dist > 1) {
        this.log('Can only move to adjacent sectors!', 'warning');
        return;
      }

      const idx = r * this.infilCols + c;
      const targetNode = this.infilGrid[idx];
      if (!targetNode || targetNode.fogged) return;

      this.infilPlayerPos = { r, c };
      this.revealInfiltrationNeighbors(r, c);
      this.sound.playClick();

      // Check if room has armed Chain Link traps
      if (targetNode.chain && targetNode.chain.length > 0 && !targetNode.cleared) {
        this.triggerChainLinkEncounter(targetNode);
      } else {
        targetNode.cleared = true;
        this.operative.graceIntegrity = Math.max(0, this.operative.graceIntegrity - 3);
        if (targetNode.type === 'DATA_CORRIDOR') {
          this.raidLoot.shards += (targetNode.shards || 5);
          this.raidLoot.spl += (targetNode.spl || 10);
        }
      }

      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderInfiltration();
        window.HeavenlyUI.updateResourceDisplays();
      }
    }

    // --------------------------------------------------------------------------
    // CHAIN LINK RESOLUTION & "BREAKING THE CHAIN" REAL-TIME WINDOW
    // --------------------------------------------------------------------------

    /**
     * Trigger Chain Link in Room
     */
    triggerChainLinkEncounter(roomNode) {
      this.chainWindowActive = true;
      this.sound.playChainTrigger();

      this.activeChain = {
        room: roomNode,
        links: [...roomNode.chain], // [CL1, CL2, CL3...]
        chainBroken: false,
        brokenBy: null,
        timeLeft: 3.5
      };

      this.log(`⚠️ CHAIN LINK INITIATED! Detected ${roomNode.chain.length} linked trap mechanism(s)!`, 'danger');
      roomNode.chain.forEach((card, i) => {
        this.log(`↳ Chain Link ${i + 1}: [${card.name}] (${card.category}) armed.`, 'warning');
      });

      if (window.HeavenlyUI) {
        window.HeavenlyUI.showChainLinkModal(this.activeChain);
      }

      // Countdown Timer for Bullet-Time Reaction Window
      const timerInterval = setInterval(() => {
        if (!this.activeChain) {
          clearInterval(timerInterval);
          return;
        }

        this.activeChain.timeLeft -= 0.5;
        if (window.HeavenlyUI) {
          window.HeavenlyUI.updateChainTimer(this.activeChain.timeLeft);
        }

        if (this.activeChain.timeLeft <= 0) {
          clearInterval(timerInterval);
          this.resolveChainLinks(this.activeChain);
        }
      }, 500);
    }

    /**
     * Infiltrator Plays Fast-Effect Card from Hand to "Break the Chain"
     */
    castReactionCard(cardId) {
      if (!this.activeChain || !this.chainWindowActive) return;

      const card = window.YgoApi.getCard(cardId);
      if (!card) return;

      this.sound.playChainBreak();
      this.activeChain.chainBroken = true;
      this.activeChain.brokenBy = card;

      this.log(`⚡ REACTION PLAYED: [${card.name}] (${card.category}) cast from active hand!`, 'success');
      this.log(`>>> TRAP CHAIN INTERRUPTED & NEGATED BY ${card.name.toUpperCase()}! <<<`, 'success');

      if (window.HeavenlyUI) {
        window.HeavenlyUI.updateChainBrokenDisplay(card);
      }

      // Resolve early
      setTimeout(() => {
        this.resolveChainLinks(this.activeChain);
      }, 1000);
    }

    /**
     * Resolve Chain in LIFO (Reverse Order: CL3 -> CL2 -> CL1)
     */
    resolveChainLinks(chainObj) {
      this.chainWindowActive = false;
      const room = chainObj.room;
      room.cleared = true;

      if (chainObj.chainBroken) {
        this.log('Chain resolution halted. Infiltrator bypassed security mechanisms unharmed!', 'success');
        this.raidLoot.shards += 35;
        this.raidLoot.spl += 50;
      } else {
        this.log('--- RESOLVING TRAP CHAIN IN REVERSE ORDER (LIFO: CL' + chainObj.links.length + ' ➔ CL1) ---', 'danger');

        // Resolve in REVERSE order
        const reverseLinks = [...chainObj.links].reverse();
        reverseLinks.forEach((trap, idx) => {
          const clNum = chainObj.links.length - idx;
          let damage = 20;

          // Water Stance mitigation
          if (this.operative.stance === 'WATER') damage = Math.floor(damage * 0.5);

          if (trap.mechanicType === 'COUNTER_TRAP') {
            this.log(`↳ Resolving CL${clNum} [${trap.name}]: Spell Speed 3 Reflex Nullifier disabled operative dash!`, 'danger');
            this.operative.stamina = Math.max(0, this.operative.stamina - 40);
          } else if (trap.mechanicType === 'CONTINUOUS_TRAP') {
            this.log(`↳ Resolving CL${clNum} [${trap.name}]: Field Aura ignited. Active abilities silenced!`, 'danger');
            this.operative.graceIntegrity = Math.max(0, this.operative.graceIntegrity - 20);
          } else if (trap.mechanicType === 'NORMAL_TRAP') {
            this.log(`↳ Resolving CL${clNum} [${trap.name}]: Hazard triggered! Inflicted ${damage} damage.`, 'danger');
            this.operative.hp = Math.max(0, this.operative.hp - damage);
          } else if (trap.mechanicType === 'TRAP_MONSTER') {
            this.log(`↳ Resolving CL${clNum} [${trap.name}]: Guardian animated! Inflicted ${damage + 10} combat damage.`, 'danger');
            this.operative.hp = Math.max(0, this.operative.hp - (damage + 10));
          }
        });

        if (this.operative.hp <= 0) {
          this.handleRaidFailure('Terminated by Trap Chain Reaction');
          return;
        }
      }

      this.activeChain = null;
      if (window.HeavenlyUI) {
        window.HeavenlyUI.closeChainModal();
        window.HeavenlyUI.renderInfiltration();
        window.HeavenlyUI.updateResourceDisplays();
      }
    }

    /**
     * Attack Master Core in Final Chamber
     */
    attackMasterCore() {
      if (this.masterCore.destroyed) return;

      const stance = this.operative.stance;
      let damage = 40;
      if (stance === 'FIRE') damage = 70; // Fire stance bonus vs Core

      this.masterCore.hp = Math.max(0, this.masterCore.hp - damage);
      this.sound.playCardActivate();
      this.log(`Fired Kinetic Plasma Blaster at Master Core! Inflicted ${damage} damage. Core HP: ${this.masterCore.hp}/${this.masterCore.maxHp}`, 'info');

      if (this.masterCore.hp <= 0) {
        this.masterCore.destroyed = true;
        this.sound.playSuccess();
        this.log('💥 MASTER CORE DESTROYED! TERRITORY EXTINCTION ACHIEVED! 💥', 'success');

        // Extract massive SPL & Aether loot
        const extractedSPL = 450 + (this.raidFloor * 100);
        const extractedShards = 120 + (this.raidFloor * 30);
        const extractedCredits = 200;

        this.splTokens += extractedSPL;
        this.aetherShards += extractedShards;
        this.credits += extractedCredits;

        this.raidLoot.spl += extractedSPL;
        this.raidLoot.shards += extractedShards;
        this.highScore = Math.max(this.highScore, this.splTokens * 5 + this.aetherShards * 10);

        this.inRun = false;
        this.raidFloor++;
        this.autoSave();
      }

      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderInfiltration();
        window.HeavenlyUI.updateResourceDisplays();
      }
    }

    handleRaidFailure(reason) {
      this.inRun = false;
      this.sound.playAlarm();
      this.log(`OPERATIVE CASUALTY [${reason}]. Extracted back to Sanctum with zero loot.`, 'danger');
      this.operative.hp = this.operative.maxHp;
      this.operative.graceIntegrity = 100;

      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderInfiltration();
        window.HeavenlyUI.updateResourceDisplays();
      }
    }

    // --------------------------------------------------------------------------
    // STATE PERSISTENCE
    // --------------------------------------------------------------------------

    serializeState() {
      return {
        credits: this.credits,
        aetherShards: this.aetherShards,
        splTokens: this.splTokens,
        essence: this.essence,
        highScore: this.highScore,
        raidFloor: this.raidFloor,
        defenseGrid: this.defenseGrid,
        operative: this.operative,
        lastSaved: new Date().toISOString()
      };
    }

    deserializeState(data) {
      if (!data) return;
      if (data.credits !== undefined) this.credits = data.credits;
      if (data.aetherShards !== undefined) this.aetherShards = data.aetherShards;
      if (data.splTokens !== undefined) this.splTokens = data.splTokens;
      if (data.essence) this.essence = { ...this.essence, ...data.essence };
      if (data.highScore !== undefined) this.highScore = data.highScore;
      if (data.raidFloor !== undefined) this.raidFloor = data.raidFloor;
      if (Array.isArray(data.defenseGrid)) this.defenseGrid = data.defenseGrid;
      if (data.operative) this.operative = { ...this.operative, ...data.operative };
    }

    async autoSave() {
      const user = window.HeavenlyAuth ? window.HeavenlyAuth.getCurrentUser() : null;
      if (!user || !user.githubId) return;

      const stateObj = this.serializeState();
      if (window.HeavenlyApi) {
        await window.HeavenlyApi.saveGameState(user.githubId, stateObj, this.highScore);
      }
    }

    async loadSavedState(githubId) {
      if (!githubId || !window.HeavenlyApi) return;
      const state = await window.HeavenlyApi.loadGameState(githubId);
      if (state) {
        this.deserializeState(state);
        this.log('Territory & Deck state loaded from memory archive.', 'success');
      } else {
        this.setupDefaultDefense();
      }
    }

    log(msg, type = 'info') {
      const time = new Date().toLocaleTimeString();
      const entry = { time, msg, type };
      if (window.HeavenlyUI) {
        window.HeavenlyUI.appendLog(entry);
      } else {
        console.log(`[${time}] ${msg}`);
      }
    }
  }

  // Export singleton to window
  window.HeavenlyEngine = new HeavenlyGameEngine();

})(window);
