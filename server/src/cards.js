// Lifted verbatim from the client's script.js (DEFAULT_CARDS / ARCHETYPE_INFO).
// This is pure data — zero DOM coupling — so it ports over unchanged.
// TODO: once decks.json / cards.json settle, load those the same way script.js does
// (fetch → require/fs.readFile here) instead of hardcoding DEFAULT_CARDS.

const ARMOR_SLOTS = ["helm", "torso", "arms", "legs", "back"];

const DEFAULT_CARDS = [
  { id: "ARMOR_001", name: "Seraph Blade Gauntlets",          type: "Armor/Equipment", slot: "arms",  tier: 1, atkBonus: 400, defBonus: 150, activation_cost: { energy: 20 }, resolution_payload: "Arms Slot: Dual radiant energy blades (+400 ATK / +150 DEF).",       effect: { equipSlot: "arms",  atkBonus: 400, defBonus: 150 } },
  { id: "ARMOR_002", name: "Apophis Stone Vanguard Plate",    type: "Armor/Equipment", slot: "torso", tier: 1, atkBonus: 200, defBonus: 600, activation_cost: { energy: 25 }, resolution_payload: "Torso Slot: Ancient stone chest plate (+200 ATK / +600 DEF).",        effect: { equipSlot: "torso", atkBonus: 200, defBonus: 600 } },
  { id: "ARMOR_003", name: "Cybernetic Archangel Wings",      type: "Armor/Equipment", slot: "back",  tier: 2, atkBonus: 700, defBonus: 500, activation_cost: { energy: 40 }, resolution_payload: "Back Slot: Titanium ceramic wings (+700 ATK / +500 DEF).",          effect: { equipSlot: "back",  atkBonus: 700, defBonus: 500 } },
  { id: "ARMOR_004", name: "Solaris Seraph Crown",            type: "Armor/Equipment", slot: "helm",  tier: 3, atkBonus: 900, defBonus: 700, activation_cost: { energy: 50 }, resolution_payload: "Helm Slot: Solar sovereign crown (+900 ATK / +700 DEF).",           effect: { equipSlot: "helm",  atkBonus: 900, defBonus: 700 } },
  { id: "ARMOR_005", name: "Void Stalker Stealth Cloak",      type: "Armor/Equipment", slot: "back",  tier: 1, atkBonus: 550, defBonus: 200, activation_cost: { energy: 20 }, resolution_payload: "Back Slot: Dark matter infiltration cloak (+550 ATK / +200 DEF).", effect: { equipSlot: "back",  atkBonus: 550, defBonus: 200 } },
  { id: "ARMOR_006", name: "Cryo Sentry Leg Guards",          type: "Armor/Equipment", slot: "legs",  tier: 1, atkBonus: 150, defBonus: 650, activation_cost: { energy: 20 }, resolution_payload: "Legs Slot: Sub-zero cryo-alloy plating (+150 ATK / +650 DEF).",   effect: { equipSlot: "legs",  atkBonus: 150, defBonus: 650 } },
  { id: "ARMOR_007", name: "Dark Matter Shoulderplates",      type: "Armor/Equipment", slot: "arms",  tier: 2, atkBonus: 800, defBonus: 550, activation_cost: { energy: 40 }, resolution_payload: "Arms Slot: Void-forged titanite pauldrons (+800 ATK / +550 DEF).", effect: { equipSlot: "arms",  atkBonus: 800, defBonus: 550 } },
  { id: "ARMOR_008", name: "Abyssal Dragon Scale Chestplate", type: "Armor/Equipment", slot: "torso", tier: 3, atkBonus: 600, defBonus: 900, activation_cost: { energy: 50 }, resolution_payload: "Torso Slot: Void-dragon scale plating (+600 ATK / +900 DEF).",    effect: { equipSlot: "torso", atkBonus: 600, defBonus: 900 } },
  { id: "SPELL_001", name: "Aether Inversion Protocol", type: "Spell/Quick-Play", spell_speed: 2, activation_cost: { energy: 25 }, resolution_payload: "Negate active chain link and refund 20 energy.", effect: { negate: true, energyRefund: 20 } },
  { id: "SPELL_002", name: "Solaris Flare Burst",       type: "Spell/Normal",     spell_speed: 1, activation_cost: { energy: 30 }, resolution_payload: "Deal 800 direct LP damage.",                    effect: { directDamage: 800 } },
  { id: "SPELL_003", name: "Mystical Space Typhoon",    type: "Spell/Quick-Play", spell_speed: 2, activation_cost: { energy: 20 }, resolution_payload: "Destroy 1 equipped Armor piece on opponent.",   effect: { destroyEquipment: true } },
  { id: "SPELL_004", name: "Pot of Aether Greed",       type: "Spell/Normal",     spell_speed: 1, activation_cost: { energy: 25 }, resolution_payload: "Draw 2 cards from deck.",                      effect: { drawCards: 2 } },
  { id: "SPELL_005", name: "Synaptic Echo Anchor",      type: "Spell/Continuous", spell_speed: 1, activation_cost: { energy: 20 }, resolution_payload: "+300 LP and +20 Energy each Standby Phase.",   effect: { standbyHeal: 300, standbyEnergy: 20 } },
  { id: "SPELL_006", name: "Power Bond Sync",           type: "Spell/Normal",     spell_speed: 1, activation_cost: { energy: 35 }, resolution_payload: "Double ATK bonus of one equipped Armor piece this turn.", effect: { doubleEquipAtk: true } },
  { id: "TRAP_001", name: "Cryo-Armor Directive",     type: "Trap/Normal",       spell_speed: 2, activation_cost: { energy: 25 }, resolution_payload: "When attacked: Halt attack and grant +600 LP.",                  effect: { haltAttack: true, heal: 600 } },
  { id: "TRAP_002", name: "Armor Shatter Collapse",   type: "Trap/Normal",       spell_speed: 2, activation_cost: { energy: 30 }, resolution_payload: "Destroy target Armor piece on opponent operative.",             effect: { destroyTargetArmor: true } },
  { id: "TRAP_003", name: "Mirror Force Radiance",    type: "Trap/Normal",       spell_speed: 2, activation_cost: { energy: 35 }, resolution_payload: "When attacked: Destroy 1 random opponent equipped Armor piece!", effect: { reflectDestroyArmor: true } },
  { id: "TRAP_004", name: "Skill Drain Matrix",       type: "Trap/Continuous",   spell_speed: 2, activation_cost: { energy: 30 }, resolution_payload: "Drain 40 Energy from opponent each turn.",                      effect: { energyDrain: 40 } },
  { id: "TRAP_005", name: "Solemn Sentinel Barrier",  type: "Trap/Counter",      spell_speed: 3, activation_cost: { energy: 40 }, resolution_payload: "Pay 500 LP: Negate opponent action and destroy it.",           effect: { counterNegate: true, costLP: 500 } },
  { id: "TRAP_006", name: "Effect Veiler Pulse",      type: "Hand-Trap/Reaction",spell_speed: 2, activation_cost: { energy: 20 }, resolution_payload: "Discard: Negate opponent equipment activation or attack.",  effect: { handTrapNegate: true } }
];

const ARCHETYPE_INFO = {
  ABYSSAL_TIDE:   { title: "Abyssal Tide Corps (WATER)",       color: "#38bdf8" },
  INFERNAL_FORGE: { title: "Infernal Forge Corps (FIRE)",      color: "#f87171" },
  ZEPHYR_AVIAN:   { title: "Zephyr Sky-Reign Aviary (WIND)",   color: "#34d399" },
  TERRA_MAGNET:   { title: "Terra-Magnet Bastion (EARTH)",     color: "#fbbf24" },
  DEFAULT:        { title: "Tactical Default Hybrid",          color: "#94a3b8" }
};

let archetypeDecks = {};
let allCardsPool = [...DEFAULT_CARDS];

try {
  const fs = require('fs');
  const path = require('path');
  const decksPath = path.resolve(__dirname, '../../decks.json');
  if (fs.existsSync(decksPath)) {
    const raw = JSON.parse(fs.readFileSync(decksPath, 'utf8'));
    if (raw && Array.isArray(raw.decks)) {
      raw.decks.forEach(d => { archetypeDecks[d.id] = d; });
    }
  }
  const cardsPath = path.resolve(__dirname, '../../cards.json');
  if (fs.existsSync(cardsPath)) {
    const rawCards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
    if (Array.isArray(rawCards) && rawCards.length > 0) {
      allCardsPool = rawCards;
    }
  }
} catch (err) {
  console.warn("Could not load external decks.json / cards.json:", err.message);
}

function getDeckCards(deckId) {
  if (archetypeDecks[deckId] && Array.isArray(archetypeDecks[deckId].cards) && archetypeDecks[deckId].cards.length > 0) {
    return [...archetypeDecks[deckId].cards];
  }
  if (deckId === "ABYSSAL_TIDE") {
    const cards = allCardsPool.filter(c => c.id && c.id.startsWith("AT_"));
    if (cards.length > 0) return cards;
  }
  if (deckId === "INFERNAL_FORGE") {
    const cards = allCardsPool.filter(c => c.id && c.id.startsWith("IF_"));
    if (cards.length > 0) return cards;
  }
  if (deckId === "ZEPHYR_AVIAN") {
    const cards = allCardsPool.filter(c => c.id && c.id.startsWith("ZA_"));
    if (cards.length > 0) return cards;
  }
  if (deckId === "TERRA_MAGNET") {
    const cards = allCardsPool.filter(c => c.id && c.id.startsWith("TM_"));
    if (cards.length > 0) return cards;
  }
  return [...DEFAULT_CARDS];
}

module.exports = { ARMOR_SLOTS, DEFAULT_CARDS, ARCHETYPE_INFO, getDeckCards };

