/**
 * ============================================================================
 * HeavenlyBound - Core Game Engine
 * ============================================================================
 * Features:
 *   1. Outie Sanctum Base Builder (C&C style grid, structures, resource ticks)
 *   2. Innie Ascent Incursion (D&D 5e-style d20 procedural dungeon crawler)
 *   3. Severed Grace Degradation Loop (Memory decay, glitch shaders, extraction)
 *   4. Pure Web Audio Synthesizer (Retro-cyber celestial SFX)
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
    playBuildingPlaced() {
      this.playTone(330, 'square', 0.1, 0.08);
      setTimeout(() => this.playTone(554, 'square', 0.15, 0.08), 80);
      setTimeout(() => this.playTone(659, 'sine', 0.2, 0.1), 160);
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

  // --- GAME CONSTANTS ---
  const STRUCTURE_TYPES = {
    SOL_FOUNDRY: {
      id: 'SOL_FOUNDRY',
      name: 'Sol Foundry',
      cost: 50,
      energyCost: 5,
      creditGen: 6,
      shardGen: 0,
      color: '#ffd700',
      icon: '🏛️',
      desc: '+6 Tithe Credits/tick',
      buffDesc: 'Economic backbone of the Sanctum'
    },
    AETHER_WELL: {
      id: 'AETHER_WELL',
      name: 'Aether Well',
      cost: 80,
      energyCost: 8,
      creditGen: 0,
      shardGen: 3,
      color: '#00f0ff',
      icon: '💠',
      desc: '+3 Aether Shards/tick',
      buffDesc: 'Extracts celestial raw matrix'
    },
    GRACE_ANCHOR: {
      id: 'GRACE_ANCHOR',
      name: 'Grace Anchor',
      cost: 120,
      energyCost: 12,
      creditGen: 2,
      shardGen: 1,
      color: '#00ff88',
      icon: '⚓',
      desc: 'Decay Resistance',
      buffDesc: 'Slows Innie memory degradation by 30%'
    },
    ASCENDED_CHAMBER: {
      id: 'ASCENDED_CHAMBER',
      name: 'Ascended Chamber',
      cost: 160,
      energyCost: 15,
      creditGen: 0,
      shardGen: 2,
      color: '#a855f7',
      icon: '⚔️',
      desc: '+2 Operative D&D Mods',
      buffDesc: 'Improves dice checks in Ascent incursions'
    },
    HEAVENLY_BEACON: {
      id: 'HEAVENLY_BEACON',
      name: 'Heavenly Beacon',
      cost: 220,
      energyCost: 20,
      creditGen: 4,
      shardGen: 4,
      color: '#ffaa00',
      icon: '✨',
      desc: '+35% Extraction Loot',
      buffDesc: 'Amplifies extraction shard banking'
    }
  };

  const ROOM_TYPES = [
    {
      type: 'CORRUPTED_SERAPH',
      title: 'Corrupted Seraph Daemon',
      icon: '👾',
      desc: 'A rogue security entity bars the way. Neutralize it or bypass its optic sensors.',
      dc: 12,
      statCheck: 'prowess',
      statName: 'Prowess (STR)',
      altCheck: 'reflex',
      altName: 'Reflex (DEX)',
      shardReward: 15,
      creditReward: 25
    },
    {
      type: 'ENCRYPTED_SCRIPTURE',
      title: 'Encrypted Celestial Terminal',
      icon: '💾',
      desc: 'A glowing data altar containing forgotten divine code matrices.',
      dc: 13,
      statCheck: 'logic',
      statName: 'Logic (INT)',
      altCheck: 'perception',
      altName: 'Perception (WIS)',
      shardReward: 25,
      creditReward: 15
    },
    {
      type: 'VOID_FIREWALL',
      title: 'Void Fracture Barrier',
      icon: '⚡',
      desc: 'Corrosive energy ripples across the sector. Endure the shock or channel grace.',
      dc: 11,
      statCheck: 'resilience',
      statName: 'Resilience (CON)',
      altCheck: 'grace',
      altName: 'Grace (CHA)',
      shardReward: 10,
      creditReward: 30
    },
    {
      type: 'SANCTUM_SHRINE',
      title: 'Sanctum Restoration Node',
      icon: '🕊️',
      desc: 'A quiet harmonic nexus that temporarily re-stabilizes psychic severance.',
      dc: 8,
      statCheck: 'grace',
      statName: 'Grace (CHA)',
      altCheck: 'perception',
      altName: 'Perception (WIS)',
      shardReward: 5,
      creditReward: 10,
      isHealing: true
    },
    {
      type: 'EXTRACTION_GATE',
      title: 'Ascent Extraction Gate',
      icon: '🚪',
      desc: 'Sub-dimensional elevator back to the Outie Sanctum. Bank all collected loot immediately.',
      isExit: true
    }
  ];

  class HeavenlyGameEngine {
    constructor() {
      this.sound = new HeavenlyAudioSynth();
      
      // Base State (Outie C&C Grid)
      this.gridCols = 10;
      this.gridRows = 6;
      this.baseGrid = Array(this.gridRows).fill(null).map(() => Array(this.gridCols).fill(null));
      this.selectedBuildTool = null;

      // Resources
      this.credits = 150;
      this.aetherShards = 40;
      this.energy = 50;
      this.maxEnergy = 100;
      this.baseLevel = 1;
      this.highScore = 0;

      // Operative State (Innie D&D Run)
      this.operative = {
        name: 'Agent 7-Bound',
        hp: 30,
        maxHp: 30,
        graceIntegrity: 100, // Memory degradation (100% down to 0%)
        stats: {
          prowess: 14,    // STR (+2)
          reflex: 15,     // DEX (+2)
          logic: 16,      // INT (+3)
          resilience: 13, // CON (+1)
          perception: 14, // WIS (+2)
          grace: 12       // CHA (+1)
        }
      };

      // Incursion Run State
      this.inRun = false;
      this.dungeonFloor = 1;
      this.incursionGrid = [];
      this.currentNode = null;
      this.incursionShardsLooted = 0;
      this.incursionCreditsLooted = 0;

      // Tick Loops
      this.tickTimer = null;
      this.saveTimer = null;
      this.isRolling = false;
    }

    /**
     * Initialize Engine
     */
    async init() {
      const user = window.HeavenlyAuth ? window.HeavenlyAuth.getCurrentUser() : null;
      if (user) {
        await this.loadSavedState(user.githubId);
      } else {
        this.setupDefaultBase();
      }

      this.startBaseTickLoop();
      this.startAutoSaveLoop();
      this.log('HeavenlyBound Tactical Core Initialized. Sanctum link established.', 'info');
    }

    /**
     * Start Resource Generation Tick Loop
     */
    startBaseTickLoop() {
      if (this.tickTimer) clearInterval(this.tickTimer);
      this.tickTimer = setInterval(() => this.processBaseTick(), 2000);
    }

    startAutoSaveLoop() {
      if (this.saveTimer) clearInterval(this.saveTimer);
      this.saveTimer = setInterval(() => this.autoSave(), 30000);
    }

    /**
     * Process 1 Tick of Base Production
     */
    processBaseTick() {
      let creditDelta = 2; // Passive base stipend
      let shardDelta = 0;
      let usedEnergy = 0;

      for (let r = 0; r < this.gridRows; r++) {
        for (let c = 0; c < this.gridCols; c++) {
          const struct = this.baseGrid[r][c];
          if (struct) {
            creditDelta += struct.creditGen || 0;
            shardDelta += struct.shardGen || 0;
            usedEnergy += struct.energyCost || 0;
          }
        }
      }

      this.credits += creditDelta;
      this.aetherShards += shardDelta;
      this.energy = Math.max(0, this.maxEnergy - usedEnergy);

      // Trigger UI updates
      if (window.HeavenlyUI) {
        window.HeavenlyUI.updateResourceDisplays();
      }
    }

    /**
     * Place Structure on Outie Base Grid
     */
    placeStructure(r, c, typeKey) {
      const def = STRUCTURE_TYPES[typeKey];
      if (!def) return false;

      if (this.credits < def.cost) {
        this.log(`Insufficient Tithe Credits! Requires ${def.cost} Credits.`, 'warning');
        this.sound.playAlarm();
        return false;
      }

      if (this.baseGrid[r][c] !== null) {
        this.log('Location occupied by another structure.', 'warning');
        return false;
      }

      this.credits -= def.cost;
      this.baseGrid[r][c] = {
        ...def,
        placedAt: Date.now()
      };

      this.sound.playBuildingPlaced();
      this.log(`Constructed [${def.name}] at sector (${c + 1}, ${r + 1}).`, 'success');
      this.autoSave();

      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderCanvas();
        window.HeavenlyUI.updateResourceDisplays();
      }
      return true;
    }

    /**
     * Demolish Structure
     */
    demolishStructure(r, c) {
      const struct = this.baseGrid[r][c];
      if (!struct) return;

      const refund = Math.floor(struct.cost * 0.5);
      this.credits += refund;
      this.baseGrid[r][c] = null;
      this.log(`Decommissioned [${struct.name}]. Refunded +${refund} Credits.`, 'info');
      this.sound.playClick();

      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderCanvas();
        window.HeavenlyUI.updateResourceDisplays();
      }
    }

    /**
     * Count structures of given type
     */
    countStructures(typeKey) {
      let count = 0;
      for (let r = 0; r < this.gridRows; r++) {
        for (let c = 0; c < this.gridCols; c++) {
          if (this.baseGrid[r][c] && this.baseGrid[r][c].id === typeKey) {
            count++;
          }
        }
      }
      return count;
    }

    // --------------------------------------------------------------------------
    // INNIE ASCENT INCURSION (D&D 5E LOOP)
    // --------------------------------------------------------------------------

    /**
     * Deploy Operative into Ascent Incursion
     */
    startIncursion() {
      this.inRun = true;
      this.incursionShardsLooted = 0;
      this.incursionCreditsLooted = 0;
      this.operative.hp = this.operative.maxHp;
      this.operative.graceIntegrity = 100;

      this.generateDungeonGrid(5, 5);
      this.sound.playSuccess();
      this.log(`+++ DEPLOYING OPERATIVE INTO CELESTIAL INCURSION FLOOR ${this.dungeonFloor} +++`, 'info');

      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderIncursion();
      }
    }

    /**
     * Generate Procedural 5x5 Incursion Grid
     */
    generateDungeonGrid(rows = 5, cols = 5) {
      this.incursionGrid = [];
      const totalNodes = rows * cols;
      const exitIndex = totalNodes - 1;

      for (let i = 0; i < totalNodes; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;

        let nodeData;
        if (i === 0) {
          // Entry Node
          nodeData = {
            id: i, r, c,
            isEntry: true,
            cleared: true,
            fogged: false,
            title: 'Ascent Insertion Gateway',
            desc: 'Starting point of the ethereal run.',
            icon: '🚪'
          };
          this.currentNode = nodeData;
        } else if (i === exitIndex) {
          // Exit / Extraction Gate
          const exitType = ROOM_TYPES.find(rt => rt.isExit);
          nodeData = {
            id: i, r, c,
            ...exitType,
            cleared: false,
            fogged: true
          };
        } else {
          // Random Room Encounter
          const encounterPool = ROOM_TYPES.filter(rt => !rt.isExit);
          const template = encounterPool[Math.floor(Math.random() * encounterPool.length)];
          nodeData = {
            id: i, r, c,
            ...template,
            cleared: false,
            fogged: true
          };
        }

        this.incursionGrid.push(nodeData);
      }

      // Unfog neighboring rooms around starting point
      this.revealNeighbors(0, 0);
    }

    revealNeighbors(r, c) {
      const neighbors = [
        { r: r - 1, c }, { r: r + 1, c },
        { r, c: c - 1 }, { r, c: c + 1 }
      ];

      neighbors.forEach(n => {
        if (n.r >= 0 && n.r < 5 && n.c >= 0 && n.c < 5) {
          const idx = n.r * 5 + n.c;
          if (this.incursionGrid[idx]) {
            this.incursionGrid[idx].fogged = false;
          }
        }
      });
    }

    /**
     * Move to adjacent node
     */
    moveToNode(nodeIndex) {
      const targetNode = this.incursionGrid[nodeIndex];
      if (!targetNode || targetNode.fogged) return;

      const dist = Math.abs(targetNode.r - this.currentNode.r) + Math.abs(targetNode.c - this.currentNode.c);
      if (dist > 1) {
        this.log('Can only traverse to adjacent nodes!', 'warning');
        return;
      }

      this.currentNode = targetNode;
      this.revealNeighbors(targetNode.r, targetNode.c);

      // Severed Degradation Step
      this.applyGraceDegradation(3);

      this.sound.playClick();
      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderIncursion();
      }
    }

    /**
     * Resolve D&D Encounter with D20 Dice Roll
     */
    async executeD20Check(chosenStatKey) {
      if (!this.currentNode || this.currentNode.cleared || this.isRolling) return;

      this.isRolling = true;
      this.sound.playDiceRoll();

      if (window.HeavenlyUI) {
        window.HeavenlyUI.animateDiceRoll();
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      const d20 = Math.floor(1 + Math.random() * 20);
      const statScore = this.operative.stats[chosenStatKey] || 10;
      const baseMod = Math.floor((statScore - 10) / 2);
      
      // Buff from Ascended Chambers in Base
      const chamberBuff = this.countStructures('ASCENDED_CHAMBER') * 2;

      // Penalty if Grace Integrity is critical (< 50%)
      const gracePenalty = this.operative.graceIntegrity < 25 ? -3 : (this.operative.graceIntegrity < 50 ? -1 : 0);

      const totalMod = baseMod + chamberBuff + gracePenalty;
      const totalScore = d20 + totalMod;
      const targetDC = this.currentNode.dc || 10;

      const isNat20 = (d20 === 20);
      const isNat1 = (d20 === 1);
      const isSuccess = isNat20 || (!isNat1 && totalScore >= targetDC);

      let resultMsg = `Rolled [d20: ${d20}] + Mod (${totalMod}) = ${totalScore} vs DC ${targetDC}. `;

      if (isSuccess) {
        this.sound.playSuccess();
        this.currentNode.cleared = true;

        if (this.currentNode.isHealing) {
          this.operative.graceIntegrity = Math.min(100, this.operative.graceIntegrity + 25);
          this.operative.hp = Math.min(this.operative.maxHp, this.operative.hp + 10);
          resultMsg += 'Restoration Harmonic Achieved! (+25% Grace, +10 HP)';
        } else {
          const rewardMultiplier = isNat20 ? 2 : 1;
          const shards = (this.currentNode.shardReward || 10) * rewardMultiplier;
          const creds = (this.currentNode.creditReward || 15) * rewardMultiplier;

          this.incursionShardsLooted += shards;
          this.incursionCreditsLooted += creds;
          resultMsg += `SUCCESS! Harvested +${shards} Aether Shards, +${creds} Credits.`;
          if (isNat20) resultMsg += ' [CRITICAL GLORY NAT 20!]';
        }

        this.log(resultMsg, 'success');
      } else {
        this.sound.playGlitch();
        const damage = isNat1 ? 12 : 6;
        this.operative.hp = Math.max(0, this.operative.hp - damage);
        this.applyGraceDegradation(isNat1 ? 12 : 6);

        resultMsg += `FAILED! Suffered ${damage} damage & Severance degradation.`;
        if (isNat1) resultMsg += ' [CRITICAL FUMBLE NAT 1!]';
        this.log(resultMsg, 'danger');

        if (this.operative.hp <= 0) {
          this.handleOperativeDeath('HP Depleted');
          this.isRolling = false;
          return;
        }
      }

      this.isRolling = false;
      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderIncursion();
        window.HeavenlyUI.updateResourceDisplays();
      }
    }

    /**
     * Apply Memory/Grace Degradation
     */
    applyGraceDegradation(amount) {
      // Grace Anchors reduce degradation
      const anchorCount = this.countStructures('GRACE_ANCHOR');
      const resistanceFactor = Math.max(0.3, 1 - (anchorCount * 0.25));
      const actualLoss = Math.max(1, Math.round(amount * resistanceFactor));

      this.operative.graceIntegrity = Math.max(0, this.operative.graceIntegrity - actualLoss);

      if (this.operative.graceIntegrity <= 0) {
        this.sound.playAlarm();
        this.handleOperativeDeath('Complete Synaptic Severance Wipe');
      } else if (this.operative.graceIntegrity <= 25) {
        this.sound.playGlitch();
        this.log('WARNING: CRITICAL SEVERANCE DEGRADATION! Visual distortions active.', 'danger');
      }
    }

    /**
     * Extract & Bank Harvested Shards into Base
     */
    extractFromIncursion() {
      if (!this.currentNode || !this.currentNode.isExit) {
        this.log('Extraction only possible at the Ascent Extraction Gate!', 'warning');
        return;
      }

      const beaconCount = this.countStructures('HEAVENLY_BEACON');
      const beaconMultiplier = 1 + (beaconCount * 0.35);

      const finalShards = Math.round(this.incursionShardsLooted * beaconMultiplier);
      const finalCredits = this.incursionCreditsLooted;

      this.aetherShards += finalShards;
      this.credits += finalCredits;

      const runScore = (finalShards * 10) + finalCredits + (this.dungeonFloor * 100);
      this.highScore = Math.max(this.highScore, runScore);

      this.inRun = false;
      this.dungeonFloor++;
      this.sound.playSuccess();
      this.log(`+++ EXTRACTION SUCCESSFUL! +++ Banked +${finalShards} Shards & +${finalCredits} Credits.`, 'success');

      this.autoSave();
      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderIncursion();
        window.HeavenlyUI.updateResourceDisplays();
      }
    }

    /**
     * Handle Operative Death or Amnesia Collapse
     */
    handleOperativeDeath(reason) {
      this.inRun = false;
      this.sound.playAlarm();
      this.log(`OPERATIVE CASUALTY [${reason}]. Incursion shards lost to the void. Re-initializing clone in Sanctum...`, 'danger');
      this.incursionShardsLooted = 0;
      this.incursionCreditsLooted = 0;
      this.operative.hp = this.operative.maxHp;
      this.operative.graceIntegrity = 100;

      if (window.HeavenlyUI) {
        window.HeavenlyUI.renderIncursion();
        window.HeavenlyUI.updateResourceDisplays();
      }
    }

    // --------------------------------------------------------------------------
    // STATE SERIALIZATION & CLOUD PERSISTENCE
    // --------------------------------------------------------------------------

    setupDefaultBase() {
      // Place initial Starter buildings
      this.baseGrid[2][2] = { ...STRUCTURE_TYPES.SOL_FOUNDRY, placedAt: Date.now() };
      this.baseGrid[2][4] = { ...STRUCTURE_TYPES.AETHER_WELL, placedAt: Date.now() };
      this.baseGrid[3][3] = { ...STRUCTURE_TYPES.GRACE_ANCHOR, placedAt: Date.now() };
    }

    serializeState() {
      return {
        credits: this.credits,
        aetherShards: this.aetherShards,
        energy: this.energy,
        maxEnergy: this.maxEnergy,
        baseLevel: this.baseLevel,
        highScore: this.highScore,
        dungeonFloor: this.dungeonFloor,
        baseGrid: this.baseGrid,
        operative: this.operative,
        lastSaved: new Date().toISOString()
      };
    }

    deserializeState(data) {
      if (!data) return;
      if (data.credits !== undefined) this.credits = data.credits;
      if (data.aetherShards !== undefined) this.aetherShards = data.aetherShards;
      if (data.energy !== undefined) this.energy = data.energy;
      if (data.maxEnergy !== undefined) this.maxEnergy = data.maxEnergy;
      if (data.baseLevel !== undefined) this.baseLevel = data.baseLevel;
      if (data.highScore !== undefined) this.highScore = data.highScore;
      if (data.dungeonFloor !== undefined) this.dungeonFloor = data.dungeonFloor;
      if (Array.isArray(data.baseGrid)) this.baseGrid = data.baseGrid;
      if (data.operative) this.operative = { ...this.operative, ...data.operative };
    }

    async autoSave() {
      const user = window.HeavenlyAuth ? window.HeavenlyAuth.getCurrentUser() : null;
      if (!user || !user.githubId) return;

      const stateObj = this.serializeState();
      await window.HeavenlyApi.saveGameState(user.githubId, stateObj, this.highScore);
    }

    async loadSavedState(githubId) {
      if (!githubId) return;
      const state = await window.HeavenlyApi.loadGameState(githubId);
      if (state) {
        this.deserializeState(state);
        this.log('Sanctum state successfully synchronized from memory.', 'success');
      } else {
        this.setupDefaultBase();
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
