# HeavenlyBound Duel Server

Authoritative multiplayer backend for the "Operative Armor Duel Arena" duel found at
tritonsama.github.io. Two clients (P1 / P2) connect via WebSocket to one `DuelRoom`;
the server runs the entire turn/phase/chain-resolution engine and broadcasts state —
clients never compute game logic locally anymore.

## What's here

- `src/cards.js` — card pool + archetype data, lifted unchanged from the client's `script.js`.
- `src/DuelEngine.js` — the `DuelEngine` object from `script.js`, ported to a plain
  class with all DOM/rendering code stripped out and replaced with `onChange`/`onMatchEnd`
  callbacks. Turn order, chain LIFO resolution, and damage-step math are unchanged from
  what's live today.
- `src/DuelRoom.js` — Colyseus room. Assigns the first two connecting clients to P1/P2,
  maps incoming action messages to `DuelEngine` methods, and broadcasts the resulting
  state to both sockets after every change.
- `src/index.js` — Express + Colyseus server entry point. Binds to `process.env.PORT`
  (required for Cloud Run) and exposes `/healthz` and a `/colyseus` room monitor.

## Local run

```bash
npm install
npm start
# server listening on 0.0.0.0:8080
curl http://localhost:8080/healthz
```

## Deploy to Cloud Run

```bash
# from this directory
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud artifacts repositories create heavenlybound \
  --repository-format=docker --location=us-central1

gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/heavenlybound/duel-server

gcloud run deploy duel-server \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/heavenlybound/duel-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances=1

# Required for WebSockets: pin a client's connection to one instance for the
# life of a match.
gcloud run services update duel-server \
  --region us-central1 \
  --session-affinity
```

Point the GitHub Pages client at the resulting `https://duel-server-xxxx.a.run.app`
URL (as `wss://...`) for its Colyseus client connection.

## Still TODO before this is production-ready

- **Persistence**: no Firestore wiring yet. `DuelRoom`'s `onMatchEnd` and `DuelEngine`'s
  card-pool loader both have `// TODO` markers where that plugs in.
- **Reconnection**: `onLeave` currently just broadcasts that a player left. Add
  Colyseus's `allowReconnection()` so a dropped wifi connection doesn't insta-forfeit
  a match.
- **Matchmaking**: rooms are created ad hoc per `joinOrCreate("duel")` call — fine for
  friends sharing a room code, but add a `filterBy`/lobby room if you want random
  matchmaking.
- **Validation hardening**: the engine already rejects most illegal actions (wrong
  turn, wrong phase, insufficient energy), but a determined client could still send
  malformed payloads — add schema validation on the incoming message payloads.
- **decks.json / cards.json**: `cards.js` only ports `DEFAULT_CARDS`. Load the real
  archetype decks server-side the same way the client does with `fetch('decks.json')`.
