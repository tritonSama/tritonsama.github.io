# Release Notes: Seraphim Unbound / HeavenlyBound

---

## [v2.5.0] — 2-Player Tactical Sample Deck Duel Mode (August 2026)

### 🌟 New Features & Enhancements
- **2-Player Local & Hotseat Duel Arena:** Added full 2-player tactical card dueling mode allowing two operatives to battle on the same screen with balanced sample decks.
- **Sample Deck Distributer (`cards.json`):**
  - **Player 1 (Operative Alpha - Sanctum Deck):** *Cryo-Armor Directive*, *Aether Inversion Protocol*, *Solaris Flare Overcharge*, *Synaptic Echo Anchor*, *Kinetic Breaker Railgun*, *Effect Veiler Pulse*.
  - **Player 2 (Operative Omega - Void Deck):** *Bottomless Void Collapse*, *Skill Drain Matrix*, *Plasma Ray Surge*, *Solemn Sentinel Barrier*, *Mystical Space Typhoon*, *Apophis Guardian Summon*.
- **Interactive Reaction Window & LIFO Resolution:** Real-time chaining ($CL1 \to CL2 \to \dots$) and automatic reverse resolution ($CL_n \to \dots \to CL1$) calculating kinetic damage, shields, energy refunds, and direct negations.
- **Dual Player Split Command Dashboard:** Live tracking for HP, Energy, and Kinetic Shields with visual card playable states.
- **App Mode Switcher:** Tabbed interface switching between **[⚔️ 2-PLAYER DUEL]** and **[🛡️ SOLO ASCENT]**.

---

## [v2.4.0] — Stage 1 Tactical Core & Hidden Synaptic Anchor (August 2026)
- Astrological anchor calculated silently in the background.
- Rules Engine mode cycler (`AUTO`, `ON`, `OFF`).
- Scrolling combat terminal with asynchronous resolution steps.
- Backend synchronization to Google Apps Script `Pilgrims` sheet.

---

## [v2.0.0] — Operation: Severed Grid Tabletop Beta (August 2026)
- Yu-Gi-Oh Trap Mapping (Normal, Continuous, Counter, Trap Monsters).
- YGOPRODeck API v7 live card metadata search and CDN images.

---

## [v1.0.0] — Initial Prototype (August 2026)
- Initial serverless static prototype deployed to GitHub Pages.
