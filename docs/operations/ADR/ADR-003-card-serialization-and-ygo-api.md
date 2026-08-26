# ADR-003: Card Asset Serialization (`cards.json`) & YGOPRODeck API Bridge

## Status
**Accepted**

## Context
As the game scales from a GitHub Pages static web app to native mobile (Flutter) and 3D game engines (Unity), card definitions, rules grammar, and targeting vectors must remain standardized without engine-specific code duplication.

## Decision
1. **Pre-Serialization (`cards.json`):** Store all baseline tactical cards in a standardized, engine-agnostic JSON schema specifying `grammar_role` (`trigger`, `reaction`, `action`, `continuous`), `activation_cost`, and `resolution_payload`.
2. **Live Card Database Bridge (`js/ygo-api.js`):** Integrate with the public **YGOPRODeck API v7** (`https://db.ygoprodeck.com/api/v7/cardinfo.php`) and CDN for live card search, artwork streaming, and rulings.

## Consequences
### Positive
- Cross-platform data parity across Web, Flutter, and Unity clients.
- Zero asset hosting costs by streaming card artwork directly from the YGOPRODeck CDN.

### Negative / Trade-offs
- External API calls depend on third-party uptime (mitigated by embedding canonical fallback cards in memory).
