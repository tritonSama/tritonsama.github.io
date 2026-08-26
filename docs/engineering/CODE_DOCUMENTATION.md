# Code Documentation: Seraphim Unbound
**Version:** 2.4 | **Target Files:** `script.js`, `cards.json`, `Code.gs`, `style.css`

---

## 1. Source Architecture & File Breakdown

```text
/
├── index.html                  # Main tactical entry point & dashboard UI
├── style.css                   # Cyber-celestial theme stylesheets
├── script.js                   # Client-side rules engine & LIFO chain manager
├── cards.json                  # Structured card data assets
├── google-apps-script/
│   └── Code.gs                 # Google Apps Script backend script
└── docs/                       # Comprehensive documentation suite
```

---

## 2. Client-Side Engine (`script.js`)

### 2.1 `GameEngine` Singleton Object
The `GameEngine` object encapsulates the proprietary rules engine and LIFO stack:

```javascript
const GameEngine = {
    chainStack: [],      // LIFO Array storing active chained cards
    toggleState: "AUTO", // Current mode: AUTO, ON, or OFF
    
    setToggle(state) {
        this.toggleState = state;
        document.getElementById('toggle-status').innerText = state;
    },

    triggerEvent(eventType, cardData) {
        console.log(`[EVENT HOOK] Trigger fired: ${eventType}`);
        // Evaluates whether current mode or event window warrants opening a chain
        if (this.toggleState === "ON" || (this.toggleState === "AUTO" && this.isLogicalWindow(eventType))) {
            this.openChainLink(cardData);
        } else {
            document.getElementById('terminal-log').innerText = 
              `[SYSTEM] Toggle set to ${this.toggleState}. Bypassing optional prompt for: ${cardData.name}`;
        }
    },

    isLogicalWindow(type) {
        // High-priority encounter types that trigger automatic chain evaluation
        return type === "ATTACK_INCOMING" || type === "VAULT_BREACH";
    },

    openChainLink(cardData) {
        this.chainStack.push(cardData); // Push to top of stack (CL_n)
        document.getElementById('terminal-log').innerText = 
          `[CHAIN LINK ${this.chainStack.length}] Opened by: ${cardData.name}. Resolving LIFO...`;
        this.resolveChain();
    },

    resolveChain() {
        // Pops cards in reverse order (Last-In, First-Out)
        while (this.chainStack.length > 0) {
            let resolvingCard = this.chainStack.pop();
            console.log(`Resolving payload for: ${resolvingCard.name}`);
        }
    }
};
```

### 2.2 Astrological Anchor Calculator (`getZodiacSign`)
Calculates the operative's Western Zodiac sign via standard astrological date boundaries:

```javascript
function getZodiacSign(month, day) {
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "Aquarius";
    if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "Pisces";
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "Aries";
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "Taurus";
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "Gemini";
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "Cancer";
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "Leo";
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "Virgo";
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "Libra";
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "Scorpio";
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "Sagittarius";
    return "Capricorn";
}
```

---

## 3. Backend Persistence (`Code.gs`)

### Concurrency Locking & Row Append
```javascript
function doPost(e) {
    var lock = LockService.getScriptLock();
    var hasLock = lock.tryLock(15000); // Prevents write race conditions
    if (!hasLock) {
        return jsonError("Database busy, transaction locked.");
    }

    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var payload = JSON.parse(e.postData.contents);
        var sheet = ss.getSheetByName("Pilgrims");

        sheet.appendRow([
            payload.player_id || "Anonymous", 
            payload.zodiac || "N/A", 
            payload.action, 
            payload.card || payload.result || "None", 
            new Date().toISOString()
        ]);

        return jsonResponse({ status: "success", shards: 120 });
    } finally {
        lock.releaseLock();
    }
}
```
