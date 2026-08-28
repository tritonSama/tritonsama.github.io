/**
 * Server-authoritative port of the client's `DuelEngine` object (script.js).
 *
 * What changed vs. the client version, and why:
 *  - Every `document.getElementById(...)` / `renderDuelUI()` / `render*()` call is gone.
 *    The client only ever needs the *result* of a state change, not how to draw it —
 *    so instead we call `this._emitChange()` after any mutation, which fires the
 *    `onChange(state)` callback the room supplies. The room broadcasts that to both
 *    sockets; each client's own renderDuelUI()-equivalent takes it from there.
 *  - `logToTerminal(msg)` -> `this._log(msg)`, collected into `this.logBuffer` and
 *    flushed to `onChange` alongside state, so both players see the same combat log.
 *  - `syncWithBackend(...)` (Google Apps Script) is replaced by an `onMatchEnd`
 *    callback — wire that to Firestore from DuelRoom instead.
 *  - `aetherShards` (client-global currency) is intentionally left out of this engine;
 *    it's meta-progression, not duel state, and belongs in a player-profile service
 *    (Firestore) rather than the authoritative match object.
 *  - Setup-screen navigation (openSetupScreen/switchAppMode) doesn't apply server-side;
 *    the room's message handlers (`select-deck`, `start-match`) take over that role.
 *
 * Everything else — phase order, chain LIFO resolution, equip/spell/trap effect
 * handling, damage-step math — is a line-for-line port of the client logic so the
 * ruleset stays identical between what was prototyped in-browser and what now runs
 * authoritatively.
 */

const { ARMOR_SLOTS, DEFAULT_CARDS, getDeckCards } = require("./cards");

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
            bonus += Math.max(0, pieces - 1) * item.effect.scalingAtkPerPiece;
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
      return ARMOR_SLOTS.filter((s) => this.equippedArmor[s] !== null).length;
    }
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class DuelEngine {
  /**
   * @param {object} hooks
   * @param {(state: object) => void} hooks.onChange - called after any state mutation
   * @param {(result: {winner:string, loser:string, rounds:number}) => void} hooks.onMatchEnd
   */
  constructor(hooks = {}) {
    this.onChange = hooks.onChange || (() => {});
    this.onMatchEnd = hooks.onMatchEnd || (() => {});

    this.p1 = createOperative("P1", "Operative Alpha", "ABYSSAL_TIDE");
    this.p2 = createOperative("P2", "Operative Omega", "INFERNAL_FORGE");
    this.p1SelectedDeck = "ABYSSAL_TIDE";
    this.p2SelectedDeck = "INFERNAL_FORGE";
    this.isDuelActive = false;
    this.activeTurn = "P1";
    this.turnCount = 1;
    this.currentPhase = "SETUP";
    this.chainStack = [];
    this.isResolving = false;
    this.waitingForReaction = false;
    this.reactionPlayer = null;
    this.pendingAttack = null;
    this.logBuffer = [];
  }

  _log(msg) {
    const entry = { time: new Date().toISOString(), msg };
    this.logBuffer.push(entry);
    if (this.logBuffer.length > 200) this.logBuffer.shift(); // cap the log, same intent as client's hand-limit trim
  }

  _emitChange() {
    this.onChange(this.getPublicState());
  }

  /** Serializable snapshot broadcast to clients after every mutation. */
  getPublicState() {
    return {
      p1: this._serializeOperative(this.p1),
      p2: this._serializeOperative(this.p2),
      p1SelectedDeck: this.p1SelectedDeck,
      p2SelectedDeck: this.p2SelectedDeck,
      isDuelActive: this.isDuelActive,
      activeTurn: this.activeTurn,
      turnCount: this.turnCount,
      currentPhase: this.currentPhase,
      chainStack: this.chainStack,
      isResolving: this.isResolving,
      waitingForReaction: this.waitingForReaction,
      reactionPlayer: this.reactionPlayer,
      pendingAttack: this.pendingAttack,
      log: this.logBuffer
    };
  }

  // getters (totalAtk etc.) don't survive JSON.stringify, so flatten explicitly
  _serializeOperative(op) {
    return {
      id: op.id,
      name: op.name,
      deckArchetypeId: op.deckArchetypeId,
      lp: op.lp,
      maxLp: op.maxLp,
      energy: op.energy,
      maxEnergy: op.maxEnergy,
      hand: op.hand,
      deckCount: op.deck.length,
      graveyard: op.graveyard,
      equippedArmor: op.equippedArmor,
      spellsTraps: op.spellsTraps,
      normalEquipUsed: op.normalEquipUsed,
      hasAttacked: op.hasAttacked,
      totalAtk: op.totalAtk,
      totalDef: op.totalDef,
      armorPieces: op.armorPieces
    };
  }

  // ── SETUP ──────────────────────────────────────────────────────────────
  selectDeck(playerKey, deckId) {
    if (playerKey === "P1") this.p1SelectedDeck = deckId;
    else this.p2SelectedDeck = deckId;
    this._emitChange();
  }

  buildDeck(deckId) {
    const pool = getDeckCards(deckId);
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const result = [];
    while (result.length < 25) {
      for (const card of shuffled) {
        if (result.length < 25) result.push(JSON.parse(JSON.stringify(card)));
      }
    }
    return result;
  }

  startMatch() {
    this.p1 = createOperative("P1", "Operative Alpha", this.p1SelectedDeck);
    this.p2 = createOperative("P2", "Operative Omega", this.p2SelectedDeck);
    this.p1.deck = this.buildDeck(this.p1SelectedDeck);
    this.p2.deck = this.buildDeck(this.p2SelectedDeck);

    for (let i = 0; i < 4; i++) {
      if (this.p1.deck.length) this.p1.hand.push(this.p1.deck.pop());
      if (this.p2.deck.length) this.p2.hand.push(this.p2.deck.pop());
    }

    this.isDuelActive = true;
    this.activeTurn = "P1";
    this.turnCount = 1;
    this.currentPhase = "DRAW";
    this.chainStack = [];
    this.isResolving = false;
    this.waitingForReaction = false;
    this.pendingAttack = null;

    this._log("⚔️ TACTICAL DUEL STARTED!");
    this.startDrawPhase();
  }

  // ── PHASE 1: DRAW ────────────────────────────────────────────────────
  async startDrawPhase() {
    this.currentPhase = "DRAW";
    const player = this.activeTurn === "P1" ? this.p1 : this.p2;
    player.normalEquipUsed = false;
    player.hasAttacked = false;

    this._log(`[TURN ${this.turnCount}] ${player.name} — DRAW PHASE`);

    if (this.turnCount === 1 && this.activeTurn === "P1") {
      this._log("[FIRST TURN] No draw for the first player on Turn 1.");
    } else if (player.deck.length > 0) {
      const drawn = player.deck.pop();
      player.hand.push(drawn);
      this._log(`[DRAW] Drew [${drawn.name}].`);
    } else {
      this._log("[DECK OUT] Deck is empty!");
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    const manaGain = 20 + roll * 5;
    player.energy = Math.min(player.maxEnergy, player.energy + manaGain);
    this._log(`[RESOURCE ROLL] d6 -> ${roll} -> +${manaGain} Energy (Total: ${player.energy})`);

    this._emitChange();
    await sleep(300);
    this.startStandbyPhase();
  }

  // ── PHASE 2: STANDBY ─────────────────────────────────────────────────
  startStandbyPhase() {
    this.currentPhase = "STANDBY";
    const player = this.activeTurn === "P1" ? this.p1 : this.p2;
    const opponent = this.activeTurn === "P1" ? this.p2 : this.p1;

    player.spellsTraps.forEach((slot) => {
      const eff = slot.card && slot.card.effect;
      if (!eff || slot.isSet) return;
      if (eff.standbyHeal) {
        player.lp = Math.min(player.maxLp, player.lp + eff.standbyHeal);
        this._log(`[${slot.card.name}] Standby: +${eff.standbyHeal} LP.`);
      }
      if (eff.standbyEnergy) {
        player.energy = Math.min(player.maxEnergy, player.energy + eff.standbyEnergy);
        this._log(`[${slot.card.name}] Standby: +${eff.standbyEnergy} Energy.`);
      }
    });

    opponent.spellsTraps.forEach((slot) => {
      const eff = slot.card && slot.card.effect;
      if (!eff || slot.isSet) return;
      if (eff.standbyOpponentBurn) {
        player.lp = Math.max(0, player.lp - eff.standbyOpponentBurn);
        this._log(`[${slot.card.name}] Opponent trap burn: -${eff.standbyOpponentBurn} LP to ${player.name}.`);
      }
    });

    if (this._checkMatchEnd()) return;
    this._emitChange();
    this.startMainPhase1();
  }

  // ── PHASE 3: MAIN 1 ──────────────────────────────────────────────────
  startMainPhase1() {
    this.currentPhase = "MAIN1";
    this._log(`[MAIN PHASE 1] ${this._active().name}'s move.`);
    this._emitChange();
  }

  // ── PHASE 4: BATTLE ──────────────────────────────────────────────────
  startBattlePhase() {
    if (this.turnCount === 1 && this.activeTurn === "P1") {
      this._log("[RULE] Battle Phase skipped on Turn 1.");
      return;
    }
    if (this.currentPhase !== "MAIN1" && this.currentPhase !== "MAIN2") {
      this._log("Must be in a Main Phase to enter Battle Phase.");
      return;
    }
    this.currentPhase = "BATTLE";
    this._log(`[BATTLE PHASE] ${this._active().name} may declare a strike.`);
    this._emitChange();
  }

  declareStrike(playerKey) {
    if (this.currentPhase !== "BATTLE") return this._log("Must be in Battle Phase to strike.");
    if (this.activeTurn !== playerKey) return this._log("Not your turn.");

    const attacker = playerKey === "P1" ? this.p1 : this.p2;
    const defenderKey = playerKey === "P1" ? "P2" : "P1";
    const defender = defenderKey === "P1" ? this.p1 : this.p2;

    if (attacker.hasAttacked) return this._log("Already struck this turn.");

    attacker.hasAttacked = true;
    this._log(`[STRIKE] ${attacker.name} (ATK ${attacker.totalAtk}) strikes ${defender.name} (DEF ${defender.totalDef}).`);

    this.pendingAttack = { attackerKey: playerKey, defenderKey };
    this.waitingForReaction = true;
    this.reactionPlayer = defenderKey;
    this._emitChange();
  }

  // ── PHASE 5: MAIN 2 ──────────────────────────────────────────────────
  startMainPhase2() {
    if (this.currentPhase !== "BATTLE" && this.currentPhase !== "MAIN1") {
      return this._log("Must come from Battle Phase or Main Phase 1.");
    }
    this.currentPhase = "MAIN2";
    this._emitChange();
  }

  // ── PHASE 6: END ─────────────────────────────────────────────────────
  async startEndPhase() {
    this.currentPhase = "END";
    const player = this._active();
    const opponent = this._opponentOf(this.activeTurn);

    for (const slot of ARMOR_SLOTS) {
      const piece = player.equippedArmor[slot];
      if (piece && piece.effect && piece.effect.endPhaseBurn) {
        opponent.lp = Math.max(0, opponent.lp - piece.effect.endPhaseBurn);
        this._log(`[${piece.name}] End Phase burn: -${piece.effect.endPhaseBurn} LP to ${opponent.name}.`);
      }
    }

    while (player.hand.length > 6) {
      const discarded = player.hand.shift();
      player.graveyard.push(discarded);
      this._log(`[HAND LIMIT] Discarded [${discarded.name}].`);
    }

    opponent.spellsTraps.forEach((slot) => {
      const eff = slot.card && slot.card.effect;
      if (!eff || slot.isSet) return;
      if (eff.energyDrain) {
        player.energy = Math.max(0, player.energy - eff.energyDrain);
        this._log(`[${slot.card.name}] Drained ${eff.energyDrain} Energy from ${player.name}.`);
      }
    });

    if (this._checkMatchEnd()) return;

    this._emitChange();
    await sleep(300);
    this.activeTurn = this.activeTurn === "P1" ? "P2" : "P1";
    this.turnCount++;
    this.startDrawPhase();
  }

  // ── EQUIP ARMOR ──────────────────────────────────────────────────────
  equipArmor(playerKey, cardIndex) {
    if (this.currentPhase !== "MAIN1" && this.currentPhase !== "MAIN2") {
      return this._log("Can only equip Armor during a Main Phase.");
    }
    if (this.activeTurn !== playerKey) return this._log("Not your turn.");

    const player = playerKey === "P1" ? this.p1 : this.p2;
    if (player.normalEquipUsed) return this._log("Already equipped an Armor piece this turn.");

    const card = player.hand[cardIndex];
    if (!card || card.type !== "Armor/Equipment") return this._log("Selected card is not Armor/Equipment.");

    if (card.effect && card.effect.requirePieces && player.armorPieces < card.effect.requirePieces) {
      return this._log(`[${card.name}] requires ${card.effect.requirePieces} equipped Armor pieces.`);
    }

    const cost = card.activation_cost ? card.activation_cost.energy : 20;
    if (player.energy < cost) return this._log(`Insufficient Energy for [${card.name}].`);

    const slot = (card.effect && card.effect.equipSlot) || card.slot;
    if (!slot || !ARMOR_SLOTS.includes(slot)) return this._log(`Unknown slot: [${slot}].`);

    player.energy -= cost;
    player.hand.splice(cardIndex, 1);

    if (player.equippedArmor[slot]) {
      player.graveyard.push(player.equippedArmor[slot]);
    }
    player.equippedArmor[slot] = card;

    if (card.effect && card.effect.extraEquip) {
      player.normalEquipUsed = false;
      this._log(`[CHAIN EQUIP] ${player.name} may equip another Armor piece this turn.`);
    } else {
      player.normalEquipUsed = true;
    }

    this._log(`[EQUIP] ${player.name} equipped [${card.name}] to ${slot.toUpperCase()}.`);

    const opponentKey = playerKey === "P1" ? "P2" : "P1";
    const opponent = this._opponentOf(playerKey);

    if (card.effect) {
      if (card.effect.drawCards) {
        for (let d = 0; d < card.effect.drawCards; d++) {
          if (player.deck.length) player.hand.push(player.deck.pop());
        }
      }
      if (card.effect.opponentDiscardCount || card.effect.forceDiscard) {
        const count = card.effect.opponentDiscardCount || 1;
        for (let c = 0; c < count; c++) {
          if (opponent.hand.length > 0) {
            const rIdx = Math.floor(Math.random() * opponent.hand.length);
            opponent.graveyard.push(opponent.hand.splice(rIdx, 1)[0]);
          }
        }
      }
      if (card.effect.directDamage) {
        opponent.lp = Math.max(0, opponent.lp - card.effect.directDamage);
      }
      if (card.effect.destroyEquipment) {
        this.destroyRandomOpponentArmor(opponent);
      }
      if (card.effect.destroySpellTrap && opponent.spellsTraps.length > 0) {
        opponent.spellsTraps.forEach((st) => opponent.graveyard.push(st.card));
        opponent.spellsTraps = [];
      }
      if (card.effect.reviveArmor && player.graveyard.length > 0) {
        const armorInGrave = player.graveyard.filter((c) => c.type === "Armor/Equipment");
        if (armorInGrave.length > 0) {
          const rev = armorInGrave[0];
          player.graveyard.splice(player.graveyard.indexOf(rev), 1);
          player.hand.push(rev);
        }
      }
    }

    if (this._checkMatchEnd()) return;

    this.waitingForReaction = true;
    this.reactionPlayer = opponentKey;
    this._emitChange();
  }

  destroyRandomOpponentArmor(opponent) {
    const equippedSlots = ARMOR_SLOTS.filter((s) => opponent.equippedArmor[s]);
    if (equippedSlots.length === 0) return;
    const slot = equippedSlots[Math.floor(Math.random() * equippedSlots.length)];
    const destroyed = opponent.equippedArmor[slot];
    opponent.equippedArmor[slot] = null;
    opponent.graveyard.push(destroyed);
    this._log(`Destroyed [${destroyed.name}] from ${opponent.name}'s ${slot.toUpperCase()} slot.`);

    opponent.spellsTraps.forEach((st) => {
      if (!st.isSet && st.card && st.card.effect && st.card.effect.burnOnOwnDestroy) {
        const actor = opponent.id === "P1" ? this.p2 : this.p1;
        actor.lp = Math.max(0, actor.lp - st.card.effect.burnOnOwnDestroy);
      }
    });
  }

  // ── SPELL / TRAP ─────────────────────────────────────────────────────
  activateSpellCard(playerKey, cardIndex, fromField = false, fieldIndex = -1) {
    const player = playerKey === "P1" ? this.p1 : this.p2;
    const opponentKey = playerKey === "P1" ? "P2" : "P1";
    const card = fromField ? player.spellsTraps[fieldIndex].card : player.hand[cardIndex];
    if (!card) return;

    const cost = card.activation_cost ? card.activation_cost.energy : 20;
    if (player.energy < cost) return this._log(`[${card.name}] requires ${cost} Energy.`);

    player.energy -= cost;
    if (fromField) player.spellsTraps.splice(fieldIndex, 1);
    else player.hand.splice(cardIndex, 1);

    if (card.type === "Spell/Continuous") {
      player.spellsTraps.push({ card, isSet: false });
      this._log(`[CONTINUOUS] ${player.name} activated [${card.name}].`);
      this._emitChange();
      return;
    }

    this.chainStack.push({ playerKey, card });
    this._log(`[CHAIN LINK ${this.chainStack.length}] ${player.name} activated [${card.name}].`);

    this.waitingForReaction = true;
    this.reactionPlayer = opponentKey;
    this._emitChange();
  }

  setSpellTrap(playerKey, cardIndex) {
    if (this.currentPhase !== "MAIN1" && this.currentPhase !== "MAIN2") {
      return this._log("Can only set Spells/Traps during a Main Phase.");
    }
    const player = playerKey === "P1" ? this.p1 : this.p2;
    const card = player.hand[cardIndex];
    if (!card) return;
    if (player.spellsTraps.length >= 3) return this._log("Spell/Trap zone full (max 3).");

    player.hand.splice(cardIndex, 1);
    player.spellsTraps.push({ card, isSet: true });
    this._log(`${player.name} set [${card.name}] face-down.`);
    this._emitChange();
  }

  activateSetCard(playerKey, fieldIndex) {
    const player = playerKey === "P1" ? this.p1 : this.p2;
    const slot = player.spellsTraps[fieldIndex];
    if (!slot || !slot.isSet) return;

    const card = slot.card;
    const cost = card.activation_cost ? card.activation_cost.energy : 20;
    if (player.energy < cost) return this._log(`Insufficient Energy to activate [${card.name}].`);

    player.energy -= cost;
    player.spellsTraps.splice(fieldIndex, 1);

    if (card.type === "Trap/Continuous") {
      player.spellsTraps.push({ card, isSet: false });
      this._emitChange();
      return;
    }

    player.graveyard.push(card);
    this.chainStack.push({ playerKey, card });
    this._log(`[CHAIN LINK ${this.chainStack.length}] ${player.name} flipped [${card.name}].`);
    this._emitChange();
  }

  passReaction(playerKey) {
    if (!this.waitingForReaction) return;
    if (this.reactionPlayer && this.reactionPlayer !== playerKey) return this._log("Not your reaction window.");

    this._log(`${(playerKey === "P1" ? this.p1 : this.p2).name} passed.`);
    this.waitingForReaction = false;
    this.reactionPlayer = null;

    if (this.chainStack.length > 0) this.resolveChain();
    else if (this.pendingAttack) this.resolveDamageStep();
    else this._emitChange();
  }

  // ── LIFO CHAIN RESOLUTION ────────────────────────────────────────────
  async resolveChain() {
    this.isResolving = true;
    this._emitChange();

    let chainNegated = false;

    while (this.chainStack.length > 0) {
      await sleep(300);
      const linkObj = this.chainStack.pop();
      const actor = linkObj.playerKey === "P1" ? this.p1 : this.p2;
      const target = linkObj.playerKey === "P1" ? this.p2 : this.p1;
      const card = linkObj.card;
      const eff = card.effect || {};

      if (chainNegated) {
        this._log(`[NEGATED] ${actor.name}'s [${card.name}] was negated.`);
        chainNegated = false;
        this._emitChange();
        continue;
      }

      this._log(`${actor.name} resolves [${card.name}].`);

      if (eff.negate || eff.counterNegate || eff.handTrapNegate) {
        chainNegated = true;
        if (eff.costLP) actor.lp = Math.max(0, actor.lp - eff.costLP);
      }
      if (eff.energyRefund) actor.energy = Math.min(actor.maxEnergy, actor.energy + eff.energyRefund);
      if (eff.directDamage) target.lp = Math.max(0, target.lp - eff.directDamage);
      if (eff.drawCards) {
        for (let d = 0; d < eff.drawCards; d++) if (actor.deck.length) actor.hand.push(actor.deck.pop());
      }
      if (eff.heal) actor.lp = Math.min(actor.maxLp, actor.lp + eff.heal);
      if (eff.haltAttack && this.pendingAttack) this.pendingAttack = null;
      if (eff.reflectAtkDamage && this.pendingAttack) {
        const strikeDmg = target.totalAtk;
        target.lp = Math.max(0, target.lp - strikeDmg);
        this.pendingAttack = null;
      }
      if (eff.destroyEquipment || eff.destroyTargetArmor) this.destroyRandomOpponentArmor(target);
      if (eff.destroySpellTrap && target.spellsTraps.length > 0) {
        target.spellsTraps.forEach((st) => target.graveyard.push(st.card));
        target.spellsTraps = [];
      }
      if (eff.reflectDestroyArmor && this.pendingAttack) {
        this.destroyRandomOpponentArmor(target);
        this.pendingAttack = null;
      }
      if (eff.reviveArmor && actor.graveyard.length > 0) {
        const armorInGrave = actor.graveyard.filter((c) => c.type === "Armor/Equipment");
        if (armorInGrave.length > 0) {
          const rev = armorInGrave[0];
          actor.graveyard.splice(actor.graveyard.indexOf(rev), 1);
          actor.hand.push(rev);
        }
      }

      this._emitChange();
      if (this._checkMatchEnd()) return;
    }

    this.isResolving = false;
    if (this.pendingAttack) await this.resolveDamageStep();
    this._emitChange();
  }

  // ── DAMAGE STEP ──────────────────────────────────────────────────────
  async resolveDamageStep() {
    if (!this.pendingAttack) return;
    const { attackerKey, defenderKey } = this.pendingAttack;
    this.pendingAttack = null;

    const attacker = attackerKey === "P1" ? this.p1 : this.p2;
    const defender = defenderKey === "P1" ? this.p1 : this.p2;

    await sleep(300);
    const atkVal = attacker.totalAtk;
    const defVal = defender.totalDef;

    if (atkVal > defVal) {
      const dmg = atkVal - defVal;
      defender.lp = Math.max(0, defender.lp - dmg);
      this._log(`[HIT] ${defender.name} takes ${dmg} LP damage.`);
    } else if (atkVal < defVal) {
      const rebound = defVal - atkVal;
      attacker.lp = Math.max(0, attacker.lp - rebound);
      this._log(`[REBOUND] ${attacker.name} takes ${rebound} LP damage.`);
    } else {
      this._log("[CLASH] ATK equals DEF — no damage.");
    }

    if (this._checkMatchEnd()) return;
    this._emitChange();
  }

  peekFaceDown(playerKey, fieldIndex) {
    // Server can safely reveal this only to the requesting player's own socket —
    // the room handler is responsible for sending this as a targeted message,
    // not a broadcast. The engine just returns the data.
    const player = playerKey === "P1" ? this.p1 : this.p2;
    const slot = player.spellsTraps[fieldIndex];
    if (!slot || !slot.isSet) return null;
    return slot.card;
  }

  // ── MATCH END ────────────────────────────────────────────────────────
  _checkMatchEnd() {
    if (this.p1.lp > 0 && this.p2.lp > 0) return false;
    this.isResolving = false;
    this.waitingForReaction = false;
    const winner = this.p1.lp > 0 ? this.p1.name : this.p2.name;
    const loser = this.p1.lp > 0 ? this.p2.name : this.p1.name;
    this._log(`DUEL CONCLUDED! ${winner.toUpperCase()} WINS!`);
    this.isDuelActive = false;
    this._emitChange();
    this.onMatchEnd({ winner, loser, rounds: this.turnCount });
    return true;
  }

  _active() {
    return this.activeTurn === "P1" ? this.p1 : this.p2;
  }
  _opponentOf(playerKey) {
    return playerKey === "P1" ? this.p2 : this.p1;
  }
}

module.exports = { DuelEngine, createOperative };
