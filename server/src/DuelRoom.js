const { Room } = require("colyseus");
const { DuelEngine } = require("./DuelEngine");

/**
 * One DuelRoom = one duel = exactly two connected clients (P1 and P2).
 * The room owns the authoritative DuelEngine instance; clients never run
 * game logic locally, they only send action messages and render whatever
 * state comes back.
 */
class DuelRoom extends Room {
  maxClients = 2;

  onCreate(options) {
    this.engine = new DuelEngine({
      onChange: (state) => this.broadcast("state", state),
      onMatchEnd: (result) => {
        this.broadcast("match-end", result);
        // TODO: persist result to Firestore here (match history, win/loss record)
      }
    });

    this.seatAssignments = {}; // sessionId -> "P1" | "P2"

    // --- Setup / matchmaking messages ---
    this.onMessage("select-deck", (client, deckId) => {
      const seat = this.seatAssignments[client.sessionId];
      if (!seat) return;
      this.engine.selectDeck(seat, deckId);
    });

    this.onMessage("start-match", (client) => {
      // Either seat can trigger match start once both are present;
      // add a "ready" handshake here later if you want both players to confirm.
      if (this.clients.length < 2) return;
      this.engine.startMatch();
    });

    // --- In-duel action messages, one per DuelEngine method players can trigger ---
    this.onMessage("declare-strike", (client) => {
      this._withSeat(client, (seat) => this.engine.declareStrike(seat));
    });

    this.onMessage("start-battle-phase", (client) => {
      this._withSeat(client, (seat) => {
        if (this.engine.activeTurn === seat) this.engine.startBattlePhase();
      });
    });

    this.onMessage("start-main-phase-2", (client) => {
      this._withSeat(client, (seat) => {
        if (this.engine.activeTurn === seat) this.engine.startMainPhase2();
      });
    });

    this.onMessage("end-turn", (client) => {
      this._withSeat(client, (seat) => {
        if (this.engine.activeTurn === seat) this.engine.startEndPhase();
      });
    });

    this.onMessage("equip-armor", (client, { cardIndex }) => {
      this._withSeat(client, (seat) => this.engine.equipArmor(seat, cardIndex));
    });

    this.onMessage("activate-spell", (client, { cardIndex, fromField, fieldIndex }) => {
      this._withSeat(client, (seat) =>
        this.engine.activateSpellCard(seat, cardIndex, fromField, fieldIndex)
      );
    });

    this.onMessage("set-spell-trap", (client, { cardIndex }) => {
      this._withSeat(client, (seat) => this.engine.setSpellTrap(seat, cardIndex));
    });

    this.onMessage("activate-set-card", (client, { fieldIndex }) => {
      this._withSeat(client, (seat) => this.engine.activateSetCard(seat, fieldIndex));
    });

    this.onMessage("pass-reaction", (client) => {
      this._withSeat(client, (seat) => this.engine.passReaction(seat));
    });

    this.onMessage("peek-face-down", (client, { fieldIndex }) => {
      this._withSeat(client, (seat) => {
        const card = this.engine.peekFaceDown(seat, fieldIndex);
        // Targeted send — only the requesting client sees their own set card.
        client.send("peek-result", card);
      });
    });
  }

  _withSeat(client, fn) {
    const seat = this.seatAssignments[client.sessionId];
    if (!seat) return;
    fn(seat);
  }

  onJoin(client, options) {
    const seat = this.clients.length === 1 ? "P1" : "P2";
    this.seatAssignments[client.sessionId] = seat;
    client.send("seat-assigned", { seat });

    if (this.clients.length === 2) {
      // Atomic Lock: Enforce strict 2-player capacity so a third player cannot enter
      this.lock();
      this.setMetadata({ status: "in_progress", players: 2 });
    } else {
      this.setMetadata({
        status: "waiting",
        players: 1,
        hostName: options.username || "Operative Alpha",
        archetype: options.archetype || "ABYSSAL_TIDE"
      });
    }

    // Let both clients know current state (covers reconnect / late join before match start)
    client.send("state", this.engine.getPublicState());
  }

  onLeave(client, consented) {
    delete this.seatAssignments[client.sessionId];
    if (this.clients.length < 2) {
      this.unlock();
      this.setMetadata({ status: "waiting", players: this.clients.length });
    }
    this.broadcast("player-left", { sessionId: client.sessionId });
  }

  onDispose() {
    // Room is torn down when both players leave. Nothing to clean up manually —
    // the DuelEngine instance goes with it.
  }
}

module.exports = { DuelRoom };
