# ADR-002: LIFO Chain Link Resolution Engine

## Status
**Accepted**

## Context
Standard turn-based RPG encounters resolve actions immediately or in FIFO (First-In, First-Out) sequence. This eliminates counterplay, reactive negations, and tactical depth common in competitive trading card games (such as Yu-Gi-Oh's Spell Speed / Chain Link systems).

## Decision
Implement a client-side **Last-In, First-Out (LIFO) Stack Manager**:
1. When an event fires (`ATTACK_INCOMING`, `VAULT_BREACH`), players or automated defense sentinels can append cards to the `chainStack` ($CL1 \to CL2 \to \dots \to CL_n$).
2. During the resolution phase, the engine pops cards from the stack in reverse order ($CL_n \to \dots \to CL1$).
3. Support Spell Speed priorities:
   - **Spell Speed 1 (Actions / Normal Spells):** Can only initiate a chain.
   - **Spell Speed 2 (Traps / Quick-Play Spells):** Can chain to Speed 1 or 2.
   - **Spell Speed 3 (Counter Traps):** Can only be countered by another Speed 3 card.

## Consequences
### Positive
- Deep strategic counterplay and authentic tactical chain execution.
- Enables the real-time "Breaking the Chain" reaction mechanic.

### Negative / Trade-offs
- Requires careful state validation to ensure cards popped during resolution do not reference invalidated targets.
