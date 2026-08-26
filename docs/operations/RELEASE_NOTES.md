# Release Notes: Seraphim Unbound / HeavenlyBound

---

## [v2.6.0] — Official 6-Phase TCG Duel Engine & Resource Dice Roll (August 2026)

### 🌟 New Features & Enhancements
- **Official 6-Phase Turn State Machine:** Implemented the complete competitive TCG turn progression:
  1. `Draw Phase` (First turn skip rule + $d6$ resource dice rolling for $+25 \text{ to } +50$ Energy/Shards).
  2. `Standby Phase` (Continuous effect evaluations).
  3. `Main Phase 1` (Normal Summon, Set, Spell activations, Trap settings).
  4. `Battle Phase` (Attack declarations, Battle Step fast effects, Damage Step LP calculation).
  5. `Main Phase 2` (Post-combat Spells, Sets, Summons).
  6. `End Phase` (Hand limit enforcement $>6$ cards and turn passing).
- **10+ Card Randomized Decks:** Each player draws from a balanced 10–12 card deck containing Level 1–8 Monsters (ATK/DEF), Spells (Normal, Quick-Play, Equip, Continuous), and Traps (Normal, Continuous, Counter Speed 3, Hand-Traps).
- **Tribute Summoning System:** Level 5–6 monsters require 1 Tribute from the field; Level 7+ monsters require 2 Tributes.
- **Damage Step Calculations:** Accurate ATK vs ATK (battle damage + destruction), ATK vs DEF (defense break / rebound damage), and direct LP attacks.
- **Life Points System (4000 LP):** High-stakes TCG life points tracked on interactive player command decks.

---

## [v2.5.0] — 2-Player Tactical Sample Deck Duel Mode (August 2026)
- 2-Player Local & Hotseat Duel Arena with split command decks.
- Real-time reaction windows and LIFO chain resolution.

---

## [v2.4.0] — Stage 1 Tactical Core & Hidden Synaptic Anchor (August 2026)
- Hidden background astrological calibration.
- Rules Engine mode cycler (`AUTO`, `ON`, `OFF`).
- Scrolling combat terminal.

---

## [v2.0.0] — Operation: Severed Grid Tabletop Beta (August 2026)
- Yu-Gi-Oh Trap Mapping (Normal, Continuous, Counter, Trap Monsters).
- YGOPRODeck API v7 live card metadata search and CDN images.

---

## [v1.0.0] — Initial Prototype (August 2026)
- Initial serverless static prototype deployed to GitHub Pages.
