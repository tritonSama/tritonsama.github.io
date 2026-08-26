# ADR-004: Hidden Background Synaptic Anchor Process

## Status
**Accepted**

## Context
Operatives require a deterministic thematic anchor that links real-world identity to base Outie Sanctum parameters, without forcing players through lengthy onboarding forms or exposing astrologically explicit "Zodiac" terminology on the futuristic tactical frontend client.

## Decision
1. **Background Obfuscated Computation:** The astrological date calculation (`computeHiddenTemporalAnchor(month, day)`) runs silently in client-side JavaScript without exposing any "Zodiac" wording or labels on the frontend client UI.
2. **Thematic Vector Encodings:** The computed value is formatted into tactical Synaptic Anchor codes (`SYN-SCO-08`, `SYN-ARI-01`, `SYN-CAP-10`) and stored in the Outie Sanctum.
3. **Backend Archiving:** The raw classification and anchor code are transmitted silently in the background synchronization payload to the Google Apps Script `Pilgrims` sheet.

## Consequences
### Positive
- Zero frontend immersion break; maintains pure cyberpunk/tactical aesthetic.
- Zero server computation overhead.
- Instant, deterministic onboarding with underlying astrological mathematical seeds.

### Negative / Trade-offs
- Uses standard calendar day/month mapping under the hood without planetary ephemeris adjustments.
