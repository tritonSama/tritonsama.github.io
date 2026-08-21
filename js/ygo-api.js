/**
 * ============================================================================
 * HeavenlyBound - Yu-Gi-Oh Database & Card Rules Engine (YGOPRODeck API v7)
 * ============================================================================
 * Connects to https://db.ygoprodeck.com/api/v7/cardinfo.php
 * Maps Yu-Gi-Oh card primitives (Normal Traps, Continuous Traps, Counter Traps,
 * Trap Monsters, Quick-Play Spells, Equip Spells, Hand Traps) into physical
 * defense architecture, chain link logic, and FPS/tabletop infiltration tools.
 * ============================================================================
 */

(function(window) {
  'use strict';

  const YGOPRODECK_API_BASE = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
  const CARD_IMAGE_BASE = 'https://images.ygoprodeck.com/images/cards/';

  // Canonical Starter Arsenal (Pre-cached for instant offline / mobile speed)
  const CANONICAL_CARDS = {
    // --- NORMAL TRAPS (Single Trigger Hazards) ---
    29401950: {
      id: 29401950,
      name: 'Bottomless Trap Hole',
      type: 'Trap Card',
      category: 'Normal Trap',
      spellSpeed: 2,
      attribute: 'EARTH',
      archetype: 'Hole',
      desc: 'When an infiltrator enters the tile: Triggers a localized gravity collapse, dropping them into a spike pit (50 Physical Damage + 30% Grace Drain).',
      mechanicType: 'NORMAL_TRAP',
      cost: { earth: 30, tithes: 40 },
      triggerEffect: { damage: 50, graceDrain: 30, status: 'TRAPPED', log: 'Gravity Collapse Pit triggered!' }
    },
    77414722: {
      id: 77414722,
      name: 'Compulsory Evacuation Device',
      type: 'Trap Card',
      category: 'Normal Trap',
      spellSpeed: 2,
      attribute: 'WIND',
      desc: 'When an infiltrator steps on the pressure plate: Emits a violent kinetic shockwave bouncing the intruder back to the previous sector.',
      mechanicType: 'NORMAL_TRAP',
      cost: { wind: 25, tithes: 35 },
      triggerEffect: { damage: 20, knockback: true, log: 'Kinetic Evacuation Blast forced infiltrator back!' }
    },
    44095762: {
      id: 44095762,
      name: 'Mirror Force',
      type: 'Trap Card',
      category: 'Normal Trap',
      spellSpeed: 2,
      attribute: 'LIGHT',
      desc: 'When an intruder attacks in the room: Reflects all offensive energy into a radiant barrier dealing 60 explosive damage.',
      mechanicType: 'NORMAL_TRAP',
      cost: { light: 35, tithes: 50 },
      triggerEffect: { damage: 60, blind: true, log: 'Radiant Mirror Force barrier reflected back at infiltrator!' }
    },

    // --- CONTINUOUS TRAPS (Field Buffs / Auras) ---
    82732705: {
      id: 82732705,
      name: 'Skill Drain',
      type: 'Trap Card',
      category: 'Continuous Trap',
      spellSpeed: 2,
      attribute: 'DARK',
      desc: 'Glowing ceiling/wall rune. Emits an ethereal dampening aura silencing all active infiltrator abilities & sprint until physically destroyed.',
      mechanicType: 'CONTINUOUS_TRAP',
      cost: { dark: 40, tithes: 60 },
      auraEffect: { silenceAbilities: true, speedPenalty: 0.5, log: 'Skill Drain Aura active: Abilities and Dash SILENCED!' }
    },
    61740673: {
      id: 61740673,
      name: 'Imperial Order',
      type: 'Trap Card',
      category: 'Continuous Trap',
      spellSpeed: 2,
      attribute: 'EARTH',
      desc: 'Indestructible antimagic pillar. Completely neutralizes Quick-Play Spells and Suit modifications in this room until rune core is broken.',
      mechanicType: 'CONTINUOUS_TRAP',
      cost: { earth: 45, tithes: 65 },
      auraEffect: { nullifySpells: true, log: 'Imperial Order active: All Quick-Play Spells negated!' }
    },

    // --- COUNTER TRAPS (Reflex Nullifiers - Spell Speed 3) ---
    41420027: {
      id: 41420027,
      name: 'Solemn Judgment',
      type: 'Trap Card',
      category: 'Counter Trap',
      spellSpeed: 3,
      attribute: 'LIGHT',
      desc: 'Spell Speed 3 automated divine sentinel. Automatically negates the intruder\'s first movement ability or spell cast upon entering the room.',
      mechanicType: 'COUNTER_TRAP',
      cost: { light: 50, tithes: 80 },
      counterEffect: { negateAction: true, priority: 3, log: 'Solemn Sentinel triggered (Spell Speed 3): Action NEGATED!' }
    },
    18036057: {
      id: 18036057,
      name: 'Dark Bribe',
      type: 'Trap Card',
      category: 'Counter Trap',
      spellSpeed: 3,
      attribute: 'DARK',
      desc: 'Spell Speed 3 interceptor turret. Intercepts and negates enemy hand-traps or Quick-Play spells during Chain Link resolutions.',
      mechanicType: 'COUNTER_TRAP',
      cost: { dark: 35, tithes: 50 },
      counterEffect: { negateChain: true, priority: 3, log: 'Dark Bribe interceptor canceled infiltrator reaction!' }
    },

    // --- TRAP MONSTERS (Garrison Guardians) ---
    28649820: {
      id: 28649820,
      name: 'Embodiment of Apophis',
      type: 'Trap Card',
      category: 'Trap Monster',
      spellSpeed: 2,
      attribute: 'EARTH',
      desc: 'Disguised stone serpent statue. When room locks are breached, animates into a heavy elite guardian (ATK 1600 / DEF 1800, 80 HP).',
      mechanicType: 'TRAP_MONSTER',
      atk: 1600,
      def: 1800,
      hp: 80,
      cost: { earth: 40, tithes: 55 },
      guardianEffect: { spawnGuardian: true, hp: 80, atk: 16, log: 'Apophis Statue animated into heavy guardian!' }
    },
    31444249: {
      id: 31444249,
      name: 'Conquistador of the Golden Land',
      type: 'Trap Card',
      category: 'Trap Monster',
      spellSpeed: 2,
      attribute: 'LIGHT',
      desc: 'Golden armor sentinel. Awakens when intruders step within 2 tiles, charging with an ethereal halberd (ATK 1800 / DEF 1500).',
      mechanicType: 'TRAP_MONSTER',
      atk: 1800,
      def: 1500,
      hp: 90,
      cost: { light: 45, tithes: 60 },
      guardianEffect: { spawnGuardian: true, hp: 90, atk: 18, log: 'Golden Conquistador awakened to defend the hallway!' }
    },

    // --- QUICK-PLAY SPELLS (Infiltrator Hand Tools) ---
    5318639: {
      id: 5318639,
      name: 'Mystical Space Typhoon',
      type: 'Spell Card',
      category: 'Quick-Play Spell',
      spellSpeed: 2,
      attribute: 'WIND',
      desc: 'Targeted plasma beam. Fires instantly at an environmental Continuous Trap rune to shatter it and end its room aura.',
      mechanicType: 'QUICK_PLAY_SPELL',
      infiltratorSpell: { destroysRune: true, targetType: 'CONTINUOUS_TRAP', log: 'Mystical Space Typhoon shattered the trap rune!' }
    },
    24094653: {
      id: 24094653,
      name: 'Forbidden Droplet',
      type: 'Spell Card',
      category: 'Quick-Play Spell',
      spellSpeed: 2,
      attribute: 'WATER',
      desc: 'Quick-reaction hand spell. Halves enemy guardian attack power and negates their counter-attack during Chain Link resolution.',
      mechanicType: 'QUICK_PLAY_SPELL',
      infiltratorSpell: { weakenGuardian: true, breaksChain: true, log: 'Forbidden Droplet neutralized guardian defenses!' }
    },

    // --- EQUIP SPELLS (Weapon Modifications) ---
    56747793: {
      id: 56747793,
      name: 'United We Stand',
      type: 'Spell Card',
      category: 'Equip Spell',
      spellSpeed: 1,
      attribute: 'LIGHT',
      desc: 'Equip modification. Overcharges infiltrator kinetic blaster damage by +800 for each synchronized club operative active in the sector.',
      mechanicType: 'EQUIP_SPELL',
      infiltratorSpell: { buffWeaponDamage: 25, buffShield: 20, log: 'United We Stand overcharged blaster damage!' }
    },

    // --- HAND TRAPS (Real-Time Chain Breakers) ---
    97268402: {
      id: 97268402,
      name: 'Effect Veiler',
      type: 'Monster Card',
      category: 'Hand Trap',
      spellSpeed: 2,
      attribute: 'LIGHT',
      desc: 'Fast-effect hand discard. Cast during the 3-second Chain Link countdown to immediately negate and interrupt the active trap chain!',
      mechanicType: 'HAND_TRAP',
      infiltratorSpell: { breaksChain: true, negatesTarget: true, log: 'Effect Veiler discarded: TRAP CHAIN INTERRUPTED & BROKEN!' }
    }
  };

  class YgoCardManager {
    constructor() {
      this.cardCache = new Map();
      this.initCanonical();
    }

    initCanonical() {
      for (const key in CANONICAL_CARDS) {
        this.cardCache.set(Number(key), CANONICAL_CARDS[key]);
      }
    }

    /**
     * Get Card Image URL (High quality or fallback)
     */
    getCardImageUrl(cardId) {
      return `${CARD_IMAGE_BASE}${cardId}.jpg`;
    }

    /**
     * Get Card by ID
     */
    getCard(cardId) {
      return this.cardCache.get(Number(cardId)) || CANONICAL_CARDS[cardId] || null;
    }

    /**
     * Get All Available Defense Traps
     */
    getDefenseTraps() {
      const traps = [];
      this.cardCache.forEach(card => {
        if (card.type === 'Trap Card' || card.mechanicType === 'TRAP_MONSTER') {
          traps.push(card);
        }
      });
      return traps;
    }

    /**
     * Get Infiltrator Hand Deck
     */
    getInfiltratorHand() {
      const hand = [];
      this.cardCache.forEach(card => {
        if (card.mechanicType === 'QUICK_PLAY_SPELL' || card.mechanicType === 'EQUIP_SPELL' || card.mechanicType === 'HAND_TRAP') {
          hand.push(card);
        }
      });
      return hand;
    }

    /**
     * Live Search Cards from YGOPRODeck API v7
     */
    async searchCards(query, typeFilter = null) {
      try {
        let url = `${YGOPRODECK_API_BASE}?fname=${encodeURIComponent(query)}&num=15&offset=0`;
        if (typeFilter) {
          url += `&type=${encodeURIComponent(typeFilter)}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          return this.searchLocal(query, typeFilter);
        }

        const json = await res.json();
        if (json && json.data) {
          return json.data.map(c => this.adaptYgoCard(c));
        }
      } catch (err) {
        console.warn('YGOPRODeck API query failed, using local cache:', err);
      }
      return this.searchLocal(query, typeFilter);
    }

    searchLocal(query, typeFilter) {
      const q = query.toLowerCase();
      const results = [];
      this.cardCache.forEach(card => {
        if (card.name.toLowerCase().includes(q) || card.desc.toLowerCase().includes(q)) {
          if (!typeFilter || card.type.toLowerCase().includes(typeFilter.toLowerCase())) {
            results.push(card);
          }
        }
      });
      return results;
    }

    /**
     * Adapt external YGOPRODeck card object into game mechanics
     */
    adaptYgoCard(raw) {
      const isTrap = raw.type.includes('Trap');
      const isSpell = raw.type.includes('Spell');
      const race = raw.race || 'Normal';

      let category = isTrap ? `${race} Trap` : (isSpell ? `${race} Spell` : raw.type);
      let mechanicType = 'NORMAL_TRAP';
      let spellSpeed = 1;

      if (isTrap) {
        if (race === 'Continuous') {
          mechanicType = 'CONTINUOUS_TRAP';
          spellSpeed = 2;
        } else if (race === 'Counter') {
          mechanicType = 'COUNTER_TRAP';
          spellSpeed = 3;
        } else {
          mechanicType = 'NORMAL_TRAP';
          spellSpeed = 2;
        }
      } else if (isSpell) {
        if (race === 'Quick-Play') {
          mechanicType = 'QUICK_PLAY_SPELL';
          spellSpeed = 2;
        } else if (race === 'Equip') {
          mechanicType = 'EQUIP_SPELL';
          spellSpeed = 1;
        }
      } else if (raw.desc && (raw.desc.includes('hand') || raw.desc.includes('Quick Effect'))) {
        mechanicType = 'HAND_TRAP';
        spellSpeed = 2;
      }

      const adapted = {
        id: raw.id,
        name: raw.name,
        type: raw.type,
        category: category,
        spellSpeed: spellSpeed,
        attribute: raw.attribute || 'DARK',
        archetype: raw.archetype || 'General',
        desc: raw.desc,
        mechanicType: mechanicType,
        atk: raw.atk || 0,
        def: raw.def || 0,
        cost: {
          dark: raw.attribute === 'DARK' ? 30 : 0,
          light: raw.attribute === 'LIGHT' ? 30 : 0,
          earth: raw.attribute === 'EARTH' ? 30 : 0,
          fire: raw.attribute === 'FIRE' ? 30 : 0,
          water: raw.attribute === 'WATER' ? 30 : 0,
          wind: raw.attribute === 'WIND' ? 30 : 0,
          tithes: 40
        }
      };

      this.cardCache.set(raw.id, adapted);
      return adapted;
    }
  }

  // Export singleton to window
  window.YgoApi = new YgoCardManager();

})(window);
