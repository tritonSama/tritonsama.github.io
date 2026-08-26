# User Guide & Operative Manual: Seraphim Unbound
**Game Title:** Seraphim Unbound / HeavenlyBound | **Version:** 2.5 (2-Player Duel Beta)

---

## 1. Quick Start Guide

### Step 1: Accessing the Grid
Open your web browser on mobile or desktop and navigate to:
```text
https://tritonsama.github.io/
```
*(Or `http://localhost:8000/` for local testing).*

---

### Step 2: Operative Authentication & Synaptic Anchor
1. Enter your **Operative Handle** (e.g. `ALPHA-7`) and select your **Clearance Timestamp**.
2. Click **Initialize Grid Link**.
3. The system silently calibrates your **Synaptic Anchor** in the background and unlocks the tactical arena.

---

## 2. ⚔️ 2-Player Tactical Sample Deck Duel Mode

The **2-Player Tactical Duel Mode** allows two operatives to duel each other on the same screen (pass-and-play / hotseat or dual command) using pre-built sample decks!

### Decks Breakdown
- **Player 1 (Operative Alpha - Sanctum Deck):**
  - *Cryo-Armor Directive* (Trap: +30 Shield)
  - *Aether Inversion Protocol* (Quick-Play: Negate chain link & refund 20 Energy)
  - *Solaris Flare Overcharge* (Action: 40 Thermal Damage)
  - *Synaptic Echo Anchor* (Continuous: +15 HP & +25 Energy)
  - *Kinetic Breaker Railgun* (Action: 35 Piercing Damage)
  - *Effect Veiler Pulse* (Hand-Trap: Fast-reaction attack negation)
- **Player 2 (Operative Omega - Void Deck):**
  - *Bottomless Void Collapse* (Trap: 35 Gravity Damage)
  - *Skill Drain Matrix* (Continuous: Drain 30 Energy from opponent)
  - *Plasma Ray Surge* (Action: 45 Plasma Damage)
  - *Solemn Sentinel Barrier* (Counter Trap/Speed 3: Negate & reflect 20 damage)
  - *Mystical Space Typhoon* (Quick-Play: Shatter opponent's Kinetic Shield)
  - *Apophis Guardian Summon* (Trap Monster: +40 Shield & +15 Counter strike)

---

### Duel Gameplay Loop
1. **Turn Start:** Active player regenerates $+30\text{ Energy}$ and draws $1\text{ card}$.
2. **Playing a Card (Chain Link 1):** Click an eligible card in your hand (costs Energy) to initiate **Chain Link 1**.
3. **Reaction Window:** The opponent receives an active **Reaction Window** prompt to respond with a Quick-Play Spell, Trap, or Hand-Trap ($\to \text{Chain Link 2}$).
   - Opponent can chain back or click **⏭️ Pass Reaction Window**.
4. **LIFO Chain Resolution:** When both players pass, the stack resolves in **Reverse Order** ($CL_n \to \dots \to CL1$).
   - Negations, kinetic damage, shield absorption, energy drains, and heals execute step-by-step in the live combat terminal.
5. **Turn End & Victory:** Click **🔄 End Active Turn** to pass the turn to the other player. First player to reduce opponent to $0\text{ HP}$ wins the match!

---

## 3. 🛡️ Solo Ascent Incursion Mode
- Tap the **🛡️ SOLO ASCENT (VAULT BREACH)** tab.
- Set the Rules Engine mode (`AUTO` / `ON` / `OFF`).
- Click **Simulate Incursion Action (Vault Breach)** to roll a $d20$ and trigger procedural single-player chain resolutions.
