# API Documentation: Seraphim Unbound
**Version:** 2.4 | **Protocol:** REST JSON | **Date:** August 2026

---

## 1. Google Apps Script Web App API Bridge

### Base URL
```text
https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```

---

### Endpoint 1: Health Check (Ping)
- **Method:** `GET`
- **Query Parameter:** `action=ping`
- **Description:** Verifies whether the Apps Script web app endpoint and Google Sheet connection are active.

#### Request Example
```bash
curl -L "https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec?action=ping"
```

#### Response Example (`200 OK`)
```json
{
  "status": "success",
  "system": "Seraphim Unbound Core API",
  "timestamp": "2026-08-26T19:45:00.000Z",
  "message": "Pilgrim Tactical Protocol Operational."
}
```

---

### Endpoint 2: Synchronize Pilgrim Tactical Action
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Description:** Records an operative initialization, tactical d20 action, or vault breach directly into the `Pilgrims` sheet.

#### Request Payload Schema
```json
{
  "player_id": "string (Required)",
  "zodiac": "string (Optional, e.g. 'Aries')",
  "action": "string (Required, e.g. 'initialize', 'vault_breach')",
  "card": "string (Optional, e.g. 'Cryo-Armor Directive')",
  "result": "string | number (Optional, e.g. 21)"
}
```

#### Request Example
```json
{
  "player_id": "OPERATIVE-7741",
  "zodiac": "Scorpio",
  "action": "vault_breach",
  "card": "Cryo-Armor Directive",
  "result": 23
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success",
  "shards": 120,
  "timestamp": "2026-08-26T19:45:10.123Z"
}
```

#### Client `fetch()` Implementation
```javascript
fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors', // Enables execution across all static cross-origin environments
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        player_id: "OPERATIVE-7741",
        zodiac: "Scorpio",
        action: "vault_breach",
        card: "Cryo-Armor Directive",
        result: 23
    })
});
```

---

## 2. YGOPRODeck API v7 (Card Database & CDN)

### Base URL
```text
https://db.ygoprodeck.com/api/v7/cardinfo.php
```

---

### Endpoint 1: Search Card Metadata
- **Method:** `GET`
- **Query Parameters:**
  - `fname`: Fuzzy name search (e.g. `Bottomless Trap Hole`)
  - `type`: Filter by card classification (`Normal Trap`, `Continuous Trap`, `Counter Trap`, `Spell Card`)
  - `num`: Limit results (e.g. `15`)

#### Request Example
```text
GET https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=Bottomless&type=Trap%20Card
```

#### Response Structure (Truncated)
```json
{
  "data": [
    {
      "id": 29401950,
      "name": "Bottomless Trap Hole",
      "type": "Trap Card",
      "humanReadableCardType": "Normal Trap",
      "race": "Normal",
      "archetype": "Hole",
      "desc": "When an opponent summons a monster with 1500+ ATK: Destroy and banish it.",
      "card_images": [
        {
          "id": 29401950,
          "image_url": "https://images.ygoprodeck.com/images/cards/29401950.jpg"
        }
      ]
    }
  ]
}
```

---

### Endpoint 2: Direct Card Artwork CDN
- **Format:** `https://images.ygoprodeck.com/images/cards/{id}.jpg`
- **Example:** `https://images.ygoprodeck.com/images/cards/29401950.jpg`
- **Usage:** Loaded directly by the client `<img loading="lazy">` elements for high-performance rendering.
