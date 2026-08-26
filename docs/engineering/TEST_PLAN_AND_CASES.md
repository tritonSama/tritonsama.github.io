# Test Plan & Test Cases: Seraphim Unbound
**Document Identifier:** TP-SERAPHIM-003 | **Version:** 2.4 | **Date:** August 2026

---

## 1. Test Strategy & Objectives

The primary objective of the testing strategy is to guarantee:
1. **Zodiac Calculation Accuracy:** Correct astrological sign mapping for all 365 calendar days.
2. **Rules Engine Toggle Consistency:** Proper event filtering across `AUTO`, `ON`, and `OFF` states.
3. **LIFO Stack Integrity:** Strict Last-In, First-Out order execution when multiple chain links are queued.
4. **Data Bridge Fault Tolerance:** Graceful degradation when network is disconnected or backend endpoint is unconfigured.
5. **Mobile Viewport Usability:** Interactive elements conform to $\ge 44\text{px}$ touch targets.

---

## 2. Test Cases Matrix

| Test Case ID | Feature / Component | Test Scenario / Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-001** | Operative Onboarding | 1. Enter handle: `Pilgrim-1` <br>2. Select birthdate: `1998-10-25` <br>3. Click "Initialize Grid Link" | Zodiac calculated as `Scorpio`; auth panel hides; Outie Sanctum dashboard displays `Scorpio`. | **PASS** |
| **TC-AUTH-002** | Zodiac Boundary Test | 1. Enter `03-21` (Aries boundary) <br>2. Enter `04-20` (Taurus boundary) <br>3. Enter `12-22` (Capricorn) | `03-21` $\to$ Aries <br>`04-20` $\to$ Taurus <br>`12-22` $\to$ Capricorn. | **PASS** |
| **TC-AUTH-003** | Empty Input Validation | 1. Leave handle or date empty <br>2. Click "Initialize Grid Link" | Browser alerts operative to provide both handle and birthday; dashboard remains hidden. | **PASS** |
| **TC-ENG-001** | Mode Cycling | 1. Click "Cycle Toggle" button repeatedly | Mode cycles sequentially: `AUTO` $\to$ `ON` $\to$ `OFF` $\to$ `AUTO`. | **PASS** |
| **TC-ENG-002** | Event Hook: Mode ON | 1. Set mode to `ON` <br>2. Click "Simulate Incursion Action" | Terminal logs `[CHAIN LINK 1] Opened by: Cryo-Armor Directive` and resolves payload. | **PASS** |
| **TC-ENG-003** | Event Hook: Mode OFF | 1. Set mode to `OFF` <br>2. Click "Simulate Incursion Action" | Terminal logs `[SYSTEM] Toggle set to OFF. Bypassing optional prompt`. | **PASS** |
| **TC-LIFO-001** | Multi-Chain LIFO Resolution | 1. Push Card A (CL1), Card B (CL2), Card C (CL3) to `chainStack` <br>2. Execute `resolveChain()` | Stack pops and resolves in reverse order: Card C $\to$ Card B $\to$ Card A. | **PASS** |
| **TC-DATA-001** | `cards.json` Schema Integrity | 1. Validate `cards.json` using Node.js JSON parser | Successfully parses 4 structured cards with valid `grammar_role` and `activation_cost`. | **PASS** |
| **TC-SYNC-001** | Apps Script Sync (Offline/Mock) | 1. Execute action with default `APPS_SCRIPT_URL` | Sync safely returns without unhandled console errors. | **PASS** |
| **TC-MOB-001** | Mobile Touch Targets | 1. Emulate iPhone 14 Pro ($393 \times 852$) in DevTools <br>2. Tap inputs and buttons | All interactive touch elements measure $\ge 44\text{px}$ height with zero content clipping. | **PASS** |

---

## 3. Automated Validation Commands

Run the following automated syntax and asset verification commands in terminal:

```bash
# 1. Validate JavaScript syntax
node -c script.js

# 2. Validate cards.json data asset
node -e "JSON.parse(require('fs').readFileSync('cards.json'))"

# 3. Test HTTP local server
curl -I http://localhost:8000/index.html
```
