# Software Design Document (SDD)
**Project Title:** Seraphim Unbound / HeavenlyBound: Tactical Architecture  
**Document Identifier:** SDD-SERAPHIM-002 | **Version:** 2.4 | **Date:** August 2026

---

## 1. Architectural Blueprint & Component Decomposition

The system is decomposed into four modular layers:
1. **Presentation Layer (DOM & CSS Engine):**
   - Stage 1: `index.html` + `style.css` (Terminal Interface & Zodiac Dashboard).
   - Stage 2: `game.html` + `css/styles.css` (Tabletop Grid, Stance Wheel, Bullet-Time Modal).
2. **Rules & Chaining Layer (`script.js` / `js/engine.js`):**
   - LIFO Stack Manager (`chainStack`, `openChainLink`, `resolveChain`).
   - Event Hook Evaluator (`triggerEvent`, `isLogicalWindow`).
   - Astrological Anchor Calculator (`getZodiacSign`).
3. **External Data Bridge Layer (`js/ygo-api.js` & `cards.json`):**
   - Structured card asset parser adhering to JSON schemas.
   - REST bridge to `https://db.ygoprodeck.com/api/v7/cardinfo.php`.
4. **Cloud Persistence Bridge (`google-apps-script/Code.gs` & `js/api.js`):**
   - Asynchronous HTTP POST payload transmitter to Google Apps Script.

```mermaid
graph TB
    subgraph UI ["Presentation Layer"]
        Index["index.html (Tactical Landing)"]
        Game["game.html (Tabletop Beta)"]
        CSS["style.css / styles.css (Cyber-Celestial Theming)"]
    end

    subgraph Core ["Rules & Logic Layer"]
        GE["GameEngine (script.js)"]
        HE["HeavenlyEngine (js/engine.js)"]
        Zodiac["Zodiac Calculator (getZodiacSign)"]
        LIFO["LIFO Chain Link Stack Manager"]
    end

    subgraph Assets ["Data & Asset Layer"]
        Cards["cards.json (Pre-Serialized Data Assets)"]
        YgoApi["YgoCardManager (js/ygo-api.js)"]
        YGOCDN["YGOPRODeck CDN Images"]
    end

    subgraph Backend ["Serverless Cloud Persistence"]
        Bridge["Sync Bridge (fetch POST no-cors)"]
        GAS["Google Apps Script (Code.gs)"]
        Sheets[("Google Sheets: HeavenlyBound_GameDB<br/>• Pilgrims<br/>• Users<br/>• GameStates")]
    end

    Index --> GE
    Game --> HE
    GE --> Zodiac
    GE --> LIFO
    HE --> LIFO
    HE --> YgoApi
    YgoApi --> YGOCDN
    GE --> Cards
    GE --> Bridge
    HE --> Bridge
    Bridge --> GAS
    GAS --> Sheets
```

---

## 2. Sequence Diagrams

### 2.1 Operative Authentication & Zodiac Calculation

```mermaid
sequenceDiagram
    autonumber
    actor Operative as User / Player
    participant UI as index.html
    participant Script as script.js
    participant GAS as Google Apps Script (Code.gs)
    participant Sheet as Google Sheet (Pilgrims)

    Operative->>UI: Enter Handle (UUID) & Date of Birth
    Operative->>UI: Click "Initialize Grid Link"
    UI->>Script: initializeOperative()
    Script->>Script: getZodiacSign(month, day)
    Script->>UI: Display Zodiac Sign & Unhide Dashboard
    Script->>GAS: fetch(APPS_SCRIPT_URL, { action: 'initialize', player_id, zodiac })
    GAS->>Sheet: appendRow([player_id, zodiac, 'initialize', 'None', Date])
    GAS-->>Script: Return { status: 'success', shards: 120 }
```

### 2.2 Tactical Event Trigger & LIFO Chain Link Resolution

```mermaid
sequenceDiagram
    autonumber
    actor Operative as Player Action
    participant Engine as GameEngine / Rules Engine
    participant Stack as chainStack (LIFO Array)
    participant UI as Terminal Log Display

    Operative->>Engine: executeTacticalAction() [Simulate d20 Vault Breach]
    Engine->>Engine: roll = d20 + 3
    Engine->>Engine: triggerEvent("VAULT_BREACH", sampleCard)
    
    alt toggleState == "ON" or (toggleState == "AUTO" and isLogicalWindow)
        Engine->>Stack: openChainLink(sampleCard) -> push(card)
        Stack-->>UI: "[CHAIN LINK 1] Opened by: Cryo-Armor Directive"
        Engine->>Stack: resolveChain() -> pop() [LIFO reverse order]
        Stack-->>UI: "Resolving payload for: Cryo-Armor Directive"
    else toggleState == "OFF"
        Engine-->>UI: "[SYSTEM] Toggle set to OFF. Bypassing prompt."
    end
```

---

## 3. Data Models & Schemas

### 3.1 `cards.json` Asset Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "type": { "type": "string" },
    "grammar_role": { "type": "string", "enum": ["trigger", "reaction", "action", "continuous"] },
    "activation_cost": {
      "type": "object",
      "properties": { "energy": { "type": "number" } },
      "required": ["energy"]
    },
    "targeting_vector": { "type": "string" },
    "resolution_payload": { "type": "string" }
  },
  "required": ["id", "name", "type", "grammar_role", "activation_cost", "targeting_vector", "resolution_payload"]
}
```

### 3.2 Google Sheets `Pilgrims` Table Schema
| Column Index | Field Name | Data Type | Description |
| :---: | :--- | :--- | :--- |
| **A** | `player_id` | `String` | Unique operative handle / UUID. |
| **B** | `zodiac_sign` | `String` | Computed astrological anchor (e.g. "Aries", "Scorpio"). |
| **C** | `action_type` | `String` | Action trigger (e.g. "initialize", "vault_breach"). |
| **D** | `result` | `String` | Card payload name or numeric d20 check result. |
| **E** | `timestamp` | `ISO 8601 Date` | Exact server commitment timestamp. |
