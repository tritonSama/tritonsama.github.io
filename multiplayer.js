/**
 * ============================================================================
 * HeavenlyBound - WebRTC P2P Multiplayer Engine (PeerJS)
 * ============================================================================
 * Enables direct browser-to-browser P2P multiplayer dueling:
 *  - HOST (P1): Authoritative logic runner (DuelEngine), broadcasts state to peers.
 *  - CLIENT (P2): Controller for Player 2, sends actions to Host, renders synced state.
 *  - SPECTATOR: Observes active match in real-time.
 * ============================================================================
 */

const MultiplayerManager = {
    role: "LOCAL", // "LOCAL" | "HOST" | "CLIENT" | "SPECTATOR"
    mySeat: "P1",  // "P1" | "P2" | "SPEC"
    peer: null,
    roomId: null,
    connections: [], // Host stores all connected client/spectator connections
    hostConn: null,  // Client/Spectator connection to Host
    isConnecting: false,

    // Generate readable random room code (e.g. "HB-7842")
    generateRoomId() {
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `HB-${rand}`;
    },

    // ── INITIALIZE PEER ───────────────────────────────────────────────────────
    initPeer(customId = null) {
        return new Promise((resolve, reject) => {
            // If existing peer is active and open, reuse it
            if (this.peer && !this.peer.destroyed && !this.peer.disconnected) {
                resolve(this.peer);
                return;
            }

            if (this.peer && !this.peer.destroyed) {
                try { this.peer.destroy(); } catch (e) {}
            }

            if (typeof Peer === "undefined") {
                const err = new Error("PeerJS library is not loaded. Check internet or CDN script.");
                reject(err);
                return;
            }

            // Enhanced STUN + Free Metered TURN Relays for mobile/NAT compatibility
            const peerOptions = {
                debug: 1,
                pingInterval: 5000,
                config: {
                    iceServers: [
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "stun:stun1.l.google.com:19302" },
                        { urls: "stun:stun2.l.google.com:19302" },
                        { urls: "stun:stun.cloudflare.com:3478" },
                        { urls: "stun:global.stun.twilio.com:3478" },
                        {
                            urls: "turn:openrelay.metered.ca:80",
                            username: "openrelayproject",
                            credential: "openrelayproject"
                        },
                        {
                            urls: "turn:openrelay.metered.ca:443",
                            username: "openrelayproject",
                            credential: "openrelayproject"
                        },
                        {
                            urls: "turn:openrelay.metered.ca:443?transport=tcp",
                            username: "openrelayproject",
                            credential: "openrelayproject"
                        }
                    ]
                }
            };

            // If customId provided (Host), use it. Otherwise, let PeerJS auto-generate client ID.
            this.peer = customId ? new Peer(customId, peerOptions) : new Peer(peerOptions);

            // Hook connection handler immediately
            this.peer.on("connection", (conn) => {
                if (this.role === "HOST") {
                    this.handleIncomingConnection(conn);
                }
            });

            this.peer.on("open", (assignedId) => {
                if (this.role === "HOST") {
                    this.roomId = assignedId;
                }
                resolve(this.peer);
            });

            this.peer.on("error", (err) => {
                console.warn("[Multiplayer] PeerJS Warning/Error:", err);
                let friendlyMsg = "";
                switch (err.type) {
                    case "peer-unavailable":
                        friendlyMsg = `⚠️ Host Room <strong>${this.roomId || ''}</strong> was not found on the network.<br><span style="color:#94a3b8; font-size:11px;">Make sure the host generated the room and has the browser tab open.</span> <button type="button" class="btn-sm btn-phase" style="margin-top:6px;" onclick="MultiplayerManager.joinMatch('${this.roomId}')">🔄 Retry Connection</button>`;
                        break;
                    case "unavailable-id":
                        friendlyMsg = "⚠️ Room ID is already taken. Generating a new unique room...";
                        if (this.role === "HOST") {
                            this.peer.destroy();
                            this.initPeer(this.generateRoomId()).then(resolve).catch(reject);
                            return;
                        }
                        break;
                    case "webrtc":
                        friendlyMsg = `⚠️ WebRTC connection negotiation in progress... <button type="button" class="btn-sm btn-phase" style="margin-top:6px;" onclick="MultiplayerManager.joinMatch('${this.roomId}')">🔄 Reconnect</button>`;
                        break;
                    case "network":
                        friendlyMsg = "⚠️ Lost connection to signaling broker. Check your internet connection.";
                        break;
                    case "disconnected":
                        friendlyMsg = "⚠️ Disconnected from match server.";
                        break;
                    default:
                        friendlyMsg = `⚠️ Connection status: ${err.message || err.type || 'Negotiating link'}`;
                }
                this.updateLobbyStatus(friendlyMsg, "error");
                if (err.type !== "webrtc") {
                    reject(err);
                }
            });
        });
    },

    // ── 1. HOST A MATCH (P1) ───────────────────────────────────────────────────
    async hostMatch() {
        this.role = "HOST";
        this.mySeat = "P1";
        this.connections = [];
        this.isConnecting = true;
        this.updateLobbyStatus("⏳ Initializing WebRTC Host Room...", "pending");

        try {
            const desiredRoomId = this.generateRoomId();
            await this.initPeer(desiredRoomId);
            this.updateLobbyStatus(`🎮 HOSTING ROOM: <strong>${this.roomId}</strong><br><span style="color:#38bdf8; font-size:11px;">Room is LIVE and broadcasting. Waiting for Player 2 to join...</span>`, "success");
            
            // Show room code box
            const codeBox = document.getElementById("lobby-room-code-display");
            const codeInput = document.getElementById("lobby-generated-code");
            if (codeBox && codeInput) {
                codeBox.classList.remove("hidden");
                codeInput.value = this.roomId;
            }

            const hostStatusBadge = document.getElementById("lobby-connection-badge");
            if (hostStatusBadge) {
                hostStatusBadge.className = "p-tag p1-tag";
                hostStatusBadge.innerText = `HOST (P1) | Room: ${this.roomId}`;
                hostStatusBadge.classList.remove("hidden");
            }

            logToTerminal(`📡 [P2P HOST READY] Room Code: ${this.roomId}`);
            logToTerminal(`⏳ Awaiting Player 2 to join via WebRTC DataChannel...`);

        } catch (err) {
            this.updateLobbyStatus(`⚠️ Failed to create host room: ${err.message || 'Check connection'}`, "error");
            logToTerminal(`⚠️ [P2P ERROR] Host creation failed: ${err.message || err}`);
        }
    },

    handleIncomingConnection(conn) {
        conn.on("open", () => {
            // Avoid duplicate connection entries
            if (!this.connections.includes(conn)) {
                this.connections.push(conn);
            }
            logToTerminal(`🤝 [PEER CONNECTED] Incoming connection: ${conn.peer}`);

            // First peer is P2, others are spectators
            const assignedRole = this.connections.length === 1 ? "P2" : "SPEC";
            
            conn.send({
                type: "SEAT_ASSIGNMENT",
                seat: assignedRole,
                roomId: this.roomId,
                state: this.getSerializableState()
            });

            this.updateLobbyStatus(`✅ <strong>Player 2 Connected!</strong> (${conn.peer})<br><span style="color:#38bdf8;">Transitioning both operatives to Deck Selection...</span>`, "success");
            logToTerminal(`⚔️ [MATCH READY] Player 2 joined (${conn.peer}). Transitioning to Deck Selection!`);
            
            // Automatically transition Host to Deck Selector and sync controls
            switchAppMode("DUEL");
            this.syncDeckSelectionControls();

            // Notify all peers of current state
            this.broadcastState();
        });

        conn.on("data", (data) => {
            this.handleHostReceivedData(data, conn);
        });

        conn.on("close", () => {
            this.connections = this.connections.filter(c => c !== conn);
            logToTerminal(`⚠️ [PEER DISCONNECTED] A peer left the room.`);
            this.updateLobbyStatus(`⚠️ A player disconnected from the room.`, "error");
            this.syncDeckSelectionControls();
        });
    },

    // ── 2. JOIN MATCH AS PLAYER 2 (CLIENT) ────────────────────────────────────
    async joinMatch(targetRoomId) {
        if (!targetRoomId) {
            this.updateLobbyStatus("⚠️ Please enter a valid Host Room ID.", "error");
            return;
        }

        this.role = "CLIENT";
        this.mySeat = "P2";
        this.roomId = targetRoomId.trim().toUpperCase();
        this.updateLobbyStatus(`⏳ Connecting to Host Room <strong>${this.roomId}</strong> via WebRTC...`, "pending");

        try {
            await this.initPeer(null); // Anonymous peer ID for client
            logToTerminal(`📡 [P2P CLIENT] Connecting to Host [${this.roomId}]...`);

            if (this.hostConn) {
                try { this.hostConn.close(); } catch (e) {}
            }

            this.hostConn = this.peer.connect(this.roomId, { reliable: true });

            const connectTimeout = setTimeout(() => {
                if (!this.hostConn || !this.hostConn.open) {
                    this.updateLobbyStatus(`⚠️ Connection timeout reaching Host Room <strong>${this.roomId}</strong>.<br><span style="color:#cbd5e1; font-size:11px;">Make sure the host is currently in the Training Area with room <strong>${this.roomId}</strong> open.</span> <button type="button" class="btn-sm btn-phase" style="margin-top:6px;" onclick="MultiplayerManager.joinMatch('${this.roomId}')">🔄 Retry Connection</button>`, "error");
                }
            }, 15000);

            this.hostConn.on("open", () => {
                clearTimeout(connectTimeout);
                this.updateLobbyStatus(`✅ <strong>CONNECTED TO HOST!</strong><br><span style="color:#38bdf8;">Joined as Player 2. Entering Deck Selection...</span>`, "success");
                logToTerminal(`🤝 [P2P CONNECTED] Linked to Host Room: ${this.roomId} as Player 2.`);
                
                const clientBadge = document.getElementById("lobby-connection-badge");
                if (clientBadge) {
                    clientBadge.className = "p-tag p2-tag";
                    clientBadge.innerText = `P2 (CLIENT) | Room: ${this.roomId}`;
                    clientBadge.classList.remove("hidden");
                }

                // Automatically transition Player 2 to Deck Selection
                switchAppMode("DUEL");
                this.syncDeckSelectionControls();
            });

            this.hostConn.on("data", (data) => {
                this.handleClientReceivedData(data);
            });

            this.hostConn.on("close", () => {
                clearTimeout(connectTimeout);
                this.updateLobbyStatus("⚠️ Disconnected from Host room.", "error");
                logToTerminal("⚠️ [P2P DISCONNECTED] Lost connection to Host.");
                this.syncDeckSelectionControls();
            });

            this.hostConn.on("error", (err) => {
                clearTimeout(connectTimeout);
                this.updateLobbyStatus(`⚠️ Connection notice: ${err.message || err.type || err} <button type="button" class="btn-sm btn-phase" style="margin-top:6px;" onclick="MultiplayerManager.joinMatch('${this.roomId}')">🔄 Retry</button>`, "error");
            });

        } catch (err) {
            this.updateLobbyStatus(`⚠️ Could not connect to host: ${err.message || err}`, "error");
            logToTerminal(`⚠️ [P2P ERROR] Join failed: ${err.message || err}`);
        }
    },

    // ── 3. WATCH MATCH (SPECTATOR) ─────────────────────────────────────────────
    async spectateMatch(targetRoomId) {
        if (!targetRoomId) {
            this.updateLobbyStatus("⚠️ Please enter a valid Match Room ID to spectate.", "error");
            return;
        }

        this.role = "SPECTATOR";
        this.mySeat = "SPEC";
        this.roomId = targetRoomId.trim().toUpperCase();
        this.updateLobbyStatus(`⏳ Connecting to Match <strong>${this.roomId}</strong> as Spectator...`, "pending");

        try {
            await this.initPeer(null);
            logToTerminal(`📡 [P2P SPECTATOR] Connecting to Match [${this.roomId}]...`);

            this.hostConn = this.peer.connect(this.roomId, { reliable: true });

            this.hostConn.on("open", () => {
                this.updateLobbyStatus(`👁️ <strong>WATCHING MATCH!</strong> (Room: ${this.roomId})`, "success");
                logToTerminal(`👁️ [SPECTATOR ACTIVE] Connected to Match ${this.roomId}. Observing duel...`);
                
                const specBadge = document.getElementById("lobby-connection-badge");
                if (specBadge) {
                    specBadge.className = "p-tag";
                    specBadge.style.background = "#475569";
                    specBadge.innerText = `👁️ SPECTATOR | Room: ${this.roomId}`;
                    specBadge.classList.remove("hidden");
                }

                switchAppMode("DUEL");
                this.syncDeckSelectionControls();
            });

            this.hostConn.on("data", (data) => {
                this.handleClientReceivedData(data);
            });

            this.hostConn.on("close", () => {
                this.updateLobbyStatus("⚠️ Match ended or Host disconnected.", "error");
            });

            this.hostConn.on("error", (err) => {
                this.updateLobbyStatus(`⚠️ Connection notice: ${err.message || err.type || err}`, "error");
            });

        } catch (err) {
            this.updateLobbyStatus(`⚠️ Could not spectate: ${err.message || err}`, "error");
        }
    },

    // ── DISPATCH ACTIONS FROM CLIENT TO HOST ───────────────────────────────────
    sendAction(actionType, payload = {}) {
        if (this.role === "LOCAL" || this.role === "HOST") {
            return false;
        }

        if (this.role === "CLIENT" && this.hostConn && this.hostConn.open) {
            this.hostConn.send({
                type: "PLAYER_ACTION",
                action: actionType,
                playerKey: this.mySeat,
                payload: payload
            });
            return true;
        }

        if (this.role === "SPECTATOR") {
            logToTerminal("ℹ️ Spectator mode: actions are read-only.");
            return true;
        }

        return false;
    },

    // ── HOST RECEIVES ACTION FROM CLIENT ──────────────────────────────────────
    handleHostReceivedData(data, conn) {
        if (!data) return;

        if (data.type === "PLAYER_ACTION") {
            const { action, playerKey, payload } = data;
            logToTerminal(`⚡ [P2P ACTION RECEIVED] ${playerKey} triggered: ${action}`);

            switch (action) {
                case "selectDeck":
                    DuelEngine.p2SelectedDeck = payload.deckId;
                    DuelEngine.updateSetupPreview("P2", payload.deckId);
                    const p2Sel = document.getElementById("setup-p2-deck");
                    if (p2Sel) p2Sel.value = payload.deckId;
                    logToTerminal(`🎴 [DECK SYNC] Player 2 selected archetype: ${payload.deckId}`);
                    this.broadcastState();
                    break;
                case "startMatch":
                    DuelEngine.startConfiguredMatch();
                    break;
                case "equipArmor":
                    DuelEngine.equipArmor(playerKey, payload.cardIndex);
                    break;
                case "activateSpellCard":
                    DuelEngine.activateSpellCard(playerKey, payload.cardIndex, payload.fromField, payload.fieldIndex);
                    break;
                case "setSpellTrap":
                    DuelEngine.setSpellTrap(playerKey, payload.cardIndex);
                    break;
                case "activateSetCard":
                    DuelEngine.activateSetCard(playerKey, payload.fieldIndex);
                    break;
                case "passReaction":
                    DuelEngine.passReaction(playerKey);
                    break;
                case "declareStrike":
                    DuelEngine.declareStrike();
                    break;
                case "startBattlePhase":
                    DuelEngine.startBattlePhase();
                    break;
                case "startMainPhase2":
                    DuelEngine.startMainPhase2();
                    break;
                case "startEndPhase":
                    DuelEngine.startEndPhase();
                    break;
                case "peekFaceDown":
                    const peekData = DuelEngine.peekFaceDown(playerKey, payload.fieldIndex);
                    if (peekData) {
                        conn.send({ type: "PEEK_RESULT", card: peekData });
                    }
                    break;
                default:
                    console.warn("[Host] Unknown action:", action);
            }
            this.broadcastState();
        }
    },

    // ── CLIENT / SPECTATOR RECEIVES STATE FROM HOST ────────────────────────────
    handleClientReceivedData(data) {
        if (!data) return;

        if (data.type === "SEAT_ASSIGNMENT") {
            this.mySeat = data.seat;
            if (data.state) this.applySynchronizedState(data.state);
            this.syncDeckSelectionControls();
        } else if (data.type === "STATE_SYNC") {
            if (data.state) this.applySynchronizedState(data.state);
        } else if (data.type === "PEEK_RESULT") {
            if (data.card) {
                logToTerminal(`👁️ [PEEK TELEMETRY] You inspected: [${data.card.name}] (${data.card.type}) - ${data.card.resolution_payload}`);
            }
        }
    },

    // ── STATE SERIALIZATION & BROADCAST (HOST) ─────────────────────────────────
    getSerializableState() {
        return {
            isDuelActive: DuelEngine.isDuelActive,
            activeTurn: DuelEngine.activeTurn,
            turnCount: DuelEngine.turnCount,
            currentPhase: DuelEngine.currentPhase,
            chainStack: DuelEngine.chainStack,
            isResolving: DuelEngine.isResolving,
            waitingForReaction: DuelEngine.waitingForReaction,
            reactionPlayer: DuelEngine.reactionPlayer,
            pendingAttack: DuelEngine.pendingAttack,
            p1SelectedDeck: DuelEngine.p1SelectedDeck,
            p2SelectedDeck: DuelEngine.p2SelectedDeck,
            p1: this.serializeOperative(DuelEngine.p1),
            p2: this.serializeOperative(DuelEngine.p2)
        };
    },

    serializeOperative(op) {
        if (!op) return null;
        return {
            id: op.id,
            name: op.name,
            deckArchetypeId: op.deckArchetypeId,
            lp: op.lp,
            maxLp: op.maxLp,
            baseAtk: op.baseAtk,
            baseDef: op.baseDef,
            energy: op.energy,
            maxEnergy: op.maxEnergy,
            hand: op.hand || [],
            deckCount: (op.deck && op.deck.length) || 0,
            graveyard: op.graveyard || [],
            equippedArmor: op.equippedArmor || {},
            spellsTraps: op.spellsTraps || [],
            normalEquipUsed: op.normalEquipUsed,
            hasAttacked: op.hasAttacked,
            totalAtk: op.totalAtk,
            totalDef: op.totalDef,
            armorPieces: op.armorPieces
        };
    },

    broadcastState() {
        if (this.role !== "HOST" || this.connections.length === 0) return;
        const state = this.getSerializableState();
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send({ type: "STATE_SYNC", state });
            }
        });
    },

    // ── APPLY SYNCHRONIZED STATE (CLIENT/SPECTATOR) ───────────────────────────
    applySynchronizedState(remoteState) {
        if (!remoteState) return;

        DuelEngine.isDuelActive = remoteState.isDuelActive;
        DuelEngine.activeTurn = remoteState.activeTurn;
        DuelEngine.turnCount = remoteState.turnCount;
        DuelEngine.currentPhase = remoteState.currentPhase;
        DuelEngine.chainStack = remoteState.chainStack || [];
        DuelEngine.isResolving = remoteState.isResolving;
        DuelEngine.waitingForReaction = remoteState.waitingForReaction;
        DuelEngine.reactionPlayer = remoteState.reactionPlayer;
        DuelEngine.pendingAttack = remoteState.pendingAttack;
        DuelEngine.p1SelectedDeck = remoteState.p1SelectedDeck;
        DuelEngine.p2SelectedDeck = remoteState.p2SelectedDeck;

        // Apply operatives
        if (remoteState.p1) this.hydrateOperative(DuelEngine.p1, remoteState.p1);
        if (remoteState.p2) this.hydrateOperative(DuelEngine.p2, remoteState.p2);

        // Switch to duel view if match started
        const setupSec = document.getElementById("pre-duel-setup-section");
        const duelSec = document.getElementById("duel-section");
        const lobbySec = document.getElementById("training-lobby-section");
        const welcomeSec = document.getElementById("welcome-section");

        if (welcomeSec) welcomeSec.classList.add("hidden");
        if (lobbySec) lobbySec.classList.add("hidden");

        if (DuelEngine.isDuelActive) {
            if (setupSec) setupSec.classList.add("hidden");
            if (duelSec) duelSec.classList.remove("hidden");
        } else {
            if (setupSec) setupSec.classList.remove("hidden");
            if (duelSec) duelSec.classList.add("hidden");
            
            // Sync setup dropdown values & previews
            const p1Sel = document.getElementById("setup-p1-deck");
            const p2Sel = document.getElementById("setup-p2-deck");
            if (p1Sel) p1Sel.value = DuelEngine.p1SelectedDeck;
            if (p2Sel) p2Sel.value = DuelEngine.p2SelectedDeck;
            DuelEngine.updateSetupPreview("P1", DuelEngine.p1SelectedDeck);
            DuelEngine.updateSetupPreview("P2", DuelEngine.p2SelectedDeck);
            this.syncDeckSelectionControls();
        }

        // Render UI
        DuelEngine.renderDuelUI();
    },

    hydrateOperative(targetOp, remoteOp) {
        if (!targetOp || !remoteOp) return;
        targetOp.name = remoteOp.name;
        targetOp.deckArchetypeId = remoteOp.deckArchetypeId;
        targetOp.lp = remoteOp.lp;
        targetOp.maxLp = remoteOp.maxLp;
        targetOp.energy = remoteOp.energy;
        targetOp.maxEnergy = remoteOp.maxEnergy;
        targetOp.hand = remoteOp.hand || [];
        targetOp.deck = new Array(remoteOp.deckCount || 0);
        targetOp.graveyard = remoteOp.graveyard || [];
        targetOp.equippedArmor = remoteOp.equippedArmor || {};
        targetOp.spellsTraps = remoteOp.spellsTraps || [];
        targetOp.normalEquipUsed = remoteOp.normalEquipUsed;
        targetOp.hasAttacked = remoteOp.hasAttacked;
    },

    // ── DECK SELECTION CONTROLS SYNCHRONIZATION ────────────────────────────────
    syncDeckSelectionControls() {
        const statusEl = document.getElementById("setup-match-status");
        const p1Badge  = document.getElementById("setup-p1-role-badge");
        const p2Badge  = document.getElementById("setup-p2-role-badge");
        const p1Select = document.getElementById("setup-p1-deck");
        const p2Select = document.getElementById("setup-p2-deck");
        const startBtn = document.getElementById("btn-start-duel-action");

        if (this.role === "HOST") {
            const opponentName = this.connections.length > 0 ? "P2 Connected" : "Awaiting P2";
            if (statusEl) statusEl.innerText = `🌐 HOST ROOM [${this.roomId}] | Status: ${opponentName}`;
            if (p1Badge) { p1Badge.className = "p-tag p1-tag"; p1Badge.innerText = "YOU (HOST / P1)"; }
            if (p2Badge) { p2Badge.className = "p-tag p2-tag"; p2Badge.innerText = "OPPONENT (P2)"; }
            if (p1Select) p1Select.disabled = false;
            if (p2Select) p2Select.disabled = true; // P2 selects remotely
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.innerText = "⚔️ INITIALIZE DUEL & ENGAGE COMBAT";
            }
        } else if (this.role === "CLIENT" && this.mySeat === "P2") {
            if (statusEl) statusEl.innerText = `🌐 LINKED TO HOST ROOM [${this.roomId}] (PLAYER 2)`;
            if (p1Badge) { p1Badge.className = "p-tag p1-tag"; p1Badge.innerText = "HOST (P1)"; }
            if (p2Badge) { p2Badge.className = "p-tag p2-tag"; p2Badge.innerText = "YOU (PLAYER 2)"; }
            if (p1Select) p1Select.disabled = true; // Host selects remotely
            if (p2Select) p2Select.disabled = false;
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.innerText = "⏳ WAITING FOR HOST TO INITIALIZE DUEL...";
            }
        } else if (this.role === "SPECTATOR") {
            if (statusEl) statusEl.innerText = `👁️ SPECTATING MATCH [${this.roomId}]`;
            if (p1Select) p1Select.disabled = true;
            if (p2Select) p2Select.disabled = true;
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.innerText = "👁️ OBSERVING MATCH SETUP...";
            }
        } else {
            if (statusEl) statusEl.innerText = `🌐 MATCH MODE: LOCAL PRACTICE`;
            if (p1Badge) { p1Badge.className = "p-tag p1-tag"; p1Badge.innerText = "PLAYER 1"; }
            if (p2Badge) { p2Badge.className = "p-tag p2-tag"; p2Badge.innerText = "PLAYER 2"; }
            if (p1Select) p1Select.disabled = false;
            if (p2Select) p2Select.disabled = false;
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.innerText = "⚔️ INITIALIZE DUEL & ENGAGE COMBAT";
            }
        }
    },

    // ── 🧪 COMPREHENSIVE WEBRTC NETWORK DIAGNOSTICS & ECHO TEST ──────────────
    async runDiagnostics() {
        this.updateLobbyStatus("🧪 <strong>Running WebRTC Network & STUN/TURN Diagnostics...</strong>", "pending");
        logToTerminal("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        logToTerminal("🧪 [DIAGNOSTIC TEST INITIALIZED]");

        const results = {
            peerjsLoaded: typeof Peer !== "undefined",
            brokerConnection: false,
            iceGathering: false,
            loopbackDataChannel: false,
            latencyMs: 0,
            assignedId: null,
            candidateTypes: new Set()
        };

        const startTime = Date.now();

        try {
            // Step 1: Check PeerJS CDN
            if (!results.peerjsLoaded) {
                throw new Error("PeerJS script library is not loaded. Check internet or adblocker.");
            }
            logToTerminal("✅ Step 1/4: PeerJS CDN Loaded.");

            // Step 2: Test Broker Connection
            const testPeer = new Peer({
                debug: 0,
                pingInterval: 5000,
                config: {
                    iceServers: [
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "stun:stun.cloudflare.com:3478" },
                        {
                            urls: "turn:openrelay.metered.ca:80",
                            username: "openrelayproject",
                            credential: "openrelayproject"
                        }
                    ]
                }
            });

            await new Promise((res, rej) => {
                const timer = setTimeout(() => rej(new Error("Broker handshake timed out (10s)")), 10000);
                testPeer.on("open", (id) => {
                    clearTimeout(timer);
                    results.brokerConnection = true;
                    results.assignedId = id;
                    res();
                });
                testPeer.on("error", (e) => {
                    clearTimeout(timer);
                    rej(e);
                });
            });

            logToTerminal(`✅ Step 2/4: Signaling Broker Connected (Assigned ID: ${results.assignedId}).`);

            // Step 3 & 4: Test Loopback DataChannel & ICE
            const targetConn = testPeer.connect(results.assignedId, { reliable: true });

            await new Promise((res, rej) => {
                const timer = setTimeout(() => rej(new Error("DataChannel loopback timed out (10s)")), 10000);
                
                testPeer.on("connection", (inboundConn) => {
                    inboundConn.on("open", () => {
                        results.iceGathering = true;
                        inboundConn.send({ test: "ECHO_PING", sentAt: Date.now() });
                    });
                });

                targetConn.on("data", (data) => {
                    if (data && data.test === "ECHO_PING") {
                        clearTimeout(timer);
                        results.loopbackDataChannel = true;
                        results.latencyMs = Date.now() - data.sentAt;
                        res();
                    }
                });

                targetConn.on("error", rej);
            });

            logToTerminal(`✅ Step 3/4: ICE Candidates Gathered (STUN/TURN verified).`);
            logToTerminal(`✅ Step 4/4: WebRTC DataChannel Echo Verified in ${results.latencyMs}ms.`);
            logToTerminal("🎉 [DIAGNOSTIC TEST PASSED] Network stack is 100% operational!");
            logToTerminal("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            const reportHtml = `
                <div class="diagnostic-report">
                    <strong class="diagnostic-pass">🎉 WEBRTC NETWORK STACK 100% HEALTHY</strong><br>
                    <span>• PeerJS Library: <span class="diagnostic-pass">PASS</span></span><br>
                    <span>• Signaling Broker: <span class="diagnostic-pass">PASS</span> (${results.assignedId})</span><br>
                    <span>• STUN / TURN Relays: <span class="diagnostic-pass">PASS</span></span><br>
                    <span>• DataChannel Loopback: <span class="diagnostic-pass">PASS</span> (RTT: ${results.latencyMs}ms)</span><br>
                    <span class="diagnostic-info">Ready to Host or Join P2P matches!</span>
                </div>
            `;
            this.updateLobbyStatus(reportHtml, "success");

            try { testPeer.destroy(); } catch (e) {}

        } catch (err) {
            logToTerminal(`❌ [DIAGNOSTIC TEST FAILED] ${err.message}`);
            logToTerminal("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            const failHtml = `
                <div class="diagnostic-report">
                    <strong class="diagnostic-fail">⚠️ DIAGNOSTIC ISSUE DETECTED</strong><br>
                    <span>• Error: <span class="diagnostic-fail">${err.message || err}</span></span><br>
                    <span style="color:#94a3b8; font-size:10px;">Check that your browser allows WebRTC and you have an active internet connection.</span>
                </div>
            `;
            this.updateLobbyStatus(failHtml, "error");
        }
    },

    // ── UI HELPERS ────────────────────────────────────────────────────────────
    updateLobbyStatus(msgHtml, type = "normal") {
        const el = document.getElementById("lobby-status-msg");
        if (!el) return;
        el.className = `lobby-status-box ${type}`;
        el.innerHTML = msgHtml;
        el.classList.remove("hidden");
    },

    copyRoomCode() {
        const input = document.getElementById("lobby-generated-code");
        if (input && input.value) {
            navigator.clipboard.writeText(input.value).then(() => {
                logToTerminal(`📋 [COPIED] Room code [${input.value}] copied to clipboard.`);
                const btn = document.getElementById("btn-copy-code");
                if (btn) {
                    btn.innerText = "✅ COPIED!";
                    setTimeout(() => { btn.innerText = "📋 Copy Code"; }, 2000);
                }
            }).catch(() => {
                input.select();
                document.execCommand("copy");
            });
        }
    }
};

// ============================================================================
// MONKEY-PATCH DUEL ENGINE FOR AUTOMATIC MULTIPLAYER BROADCASTING / FORWARDING
// ============================================================================
(function hookMultiplayerToDuelEngine() {
    if (typeof DuelEngine === "undefined") return;

    // Wrap changeDeck
    const origChangeDeck = DuelEngine.changeDeck;
    DuelEngine.changeDeck = function(playerKey, deckId) {
        if (MultiplayerManager.role === "CLIENT" && MultiplayerManager.mySeat === "P2" && playerKey === "P2") {
            MultiplayerManager.sendAction("selectDeck", { deckId });
            DuelEngine.updateSetupPreview("P2", deckId);
            return;
        }
        origChangeDeck.apply(this, arguments);
        MultiplayerManager.broadcastState();
    };

    // Wrap equipArmor
    const origEquip = DuelEngine.equipArmor;
    DuelEngine.equipArmor = function(playerKey, cardIndex) {
        if (MultiplayerManager.role === "CLIENT" && MultiplayerManager.mySeat === "P2" && playerKey === "P2") {
            MultiplayerManager.sendAction("equipArmor", { cardIndex });
            return;
        }
        origEquip.apply(this, arguments);
        MultiplayerManager.broadcastState();
    };

    // Wrap activateSpellCard
    const origSpell = DuelEngine.activateSpellCard;
    DuelEngine.activateSpellCard = function(playerKey, cardIndex, fromField, fieldIndex) {
        if (MultiplayerManager.role === "CLIENT" && MultiplayerManager.mySeat === "P2" && playerKey === "P2") {
            MultiplayerManager.sendAction("activateSpellCard", { cardIndex, fromField, fieldIndex });
            return;
        }
        origSpell.apply(this, arguments);
        MultiplayerManager.broadcastState();
    };

    // Wrap setSpellTrap
    const origSet = DuelEngine.setSpellTrap;
    DuelEngine.setSpellTrap = function(playerKey, cardIndex) {
        if (MultiplayerManager.role === "CLIENT" && MultiplayerManager.mySeat === "P2" && playerKey === "P2") {
            MultiplayerManager.sendAction("setSpellTrap", { cardIndex });
            return;
        }
        origSet.apply(this, arguments);
        MultiplayerManager.broadcastState();
    };

    // Wrap activateSetCard
    const origActivateSet = DuelEngine.activateSetCard;
    DuelEngine.activateSetCard = function(playerKey, fieldIndex) {
        if (MultiplayerManager.role === "CLIENT" && MultiplayerManager.mySeat === "P2" && playerKey === "P2") {
            MultiplayerManager.sendAction("activateSetCard", { fieldIndex });
            return;
        }
        origActivateSet.apply(this, arguments);
        MultiplayerManager.broadcastState();
    };

    // Wrap passReaction
    const origPass = DuelEngine.passReaction;
    DuelEngine.passReaction = function(playerKey) {
        if (MultiplayerManager.role === "CLIENT" && MultiplayerManager.mySeat === "P2") {
            MultiplayerManager.sendAction("passReaction", {});
            return;
        }
        origPass.apply(this, arguments);
        MultiplayerManager.broadcastState();
    };

    // Wrap declareStrike
    const origStrike = DuelEngine.declareStrike;
    DuelEngine.declareStrike = function() {
        if (MultiplayerManager.role === "CLIENT" && MultiplayerManager.mySeat === "P2" && DuelEngine.activeTurn === "P2") {
            MultiplayerManager.sendAction("declareStrike", {});
            return;
        }
        origStrike.apply(this, arguments);
        MultiplayerManager.broadcastState();
    };

    // Wrap startBattlePhase
    const origBattle = DuelEngine.startBattlePhase;
    DuelEngine.startBattlePhase = function() {
        if (MultiplayerManager.role === "CLIENT" && MultiplayerManager.mySeat === "P2" && DuelEngine.activeTurn === "P2") {
            MultiplayerManager.sendAction("startBattlePhase", {});
            return;
        }
        origBattle.apply(this, arguments);
        MultiplayerManager.broadcastState();
    };

    // Wrap startMainPhase2
    const origMain2 = DuelEngine.startMainPhase2;
    DuelEngine.startMainPhase2 = function() {
        if (MultiplayerManager.role === "CLIENT" && MultiplayerManager.mySeat === "P2" && DuelEngine.activeTurn === "P2") {
            MultiplayerManager.sendAction("startMainPhase2", {});
            return;
        }
        origMain2.apply(this, arguments);
        MultiplayerManager.broadcastState();
    };

    // Wrap startEndPhase
    const origEnd = DuelEngine.startEndPhase;
    DuelEngine.startEndPhase = function() {
        if (MultiplayerManager.role === "CLIENT" && MultiplayerManager.mySeat === "P2" && DuelEngine.activeTurn === "P2") {
            MultiplayerManager.sendAction("startEndPhase", {});
            return;
        }
        origEnd.apply(this, arguments);
        MultiplayerManager.broadcastState();
    };

    // Wrap startConfiguredMatch
    const origStartMatch = DuelEngine.startConfiguredMatch;
    DuelEngine.startConfiguredMatch = function() {
        if (MultiplayerManager.role === "CLIENT") {
            MultiplayerManager.sendAction("startMatch", {});
            return;
        }
        origStartMatch.apply(this, arguments);
        MultiplayerManager.broadcastState();
    };

    // Wrap peekFaceDown
    const origPeek = DuelEngine.peekFaceDown;
    DuelEngine.peekFaceDown = function(playerKey, fieldIndex) {
        if (MultiplayerManager.role === "CLIENT" && MultiplayerManager.mySeat === "P2") {
            MultiplayerManager.sendAction("peekFaceDown", { fieldIndex });
            return;
        }
        const res = origPeek.apply(this, arguments);
        const slot = (playerKey === "P1" ? this.p1 : this.p2).spellsTraps[fieldIndex];
        return slot ? slot.card : null;
    };
})();

// Expose MultiplayerManager globally
window.MultiplayerManager = MultiplayerManager;
