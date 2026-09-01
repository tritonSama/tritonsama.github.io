/**
 * ============================================================================
 * 🕊️ HEAVENLYBOUND: Operation: Severed Grid Tactical Core
 * Protocol: SEVERANCE v2.4 (Dual-Consciousness Tactical Engine)
 * ============================================================================
 */

(function(window) {
    'use strict';

    const SeveranceManager = {
        // --- Operative Profile & Auth ---
        operativeId: localStorage.getItem('HB_OPERATIVE_ID') || 'PILGRIM-ALPHA',
        operativeName: localStorage.getItem('HB_OPERATIVE_NAME') || 'Archon Alpha',
        isAuthenticated: true,

        // --- Dual-Consciousness Balances ---
        titheCredits: 450,
        bankedShards: 180,
        unbankedShards: 0,
        titheRating: 2450,
        
        // --- Severance Synaptic Memory Decay Loop ---
        inIncursion: false,
        memoryDecay: 0, // 0% to 100%
        decayTimer: null,
        harvestCooldown: false,

        // --- Passive Modifier Synthesis Matrix ---
        modifiers: {
            aetherShield: true,      // +25% DEF
            kineticOverclock: false, // +30% ATK
            synapticAnchor: false,   // -40% Memory Decay
            shardResonator: false    // +2x Shards
        },

        // --- Innie Ascent 5e Combat & Operative Stats ---
        operativeHp: 100,
        operativeMaxHp: 100,
        operativeStats: {
            str: 14, // +2
            dex: 16, // +3
            con: 14, // +2
            int: 16, // +3
            wis: 12, // +1
            cha: 10  // +0
        },

        // Current Daemon Encounter
        currentDaemon: {
            id: 'daemon-1',
            name: '👾 Void-Corruptor Archon',
            type: 'Abyssal Void Cyber-Daemon',
            ac: 13,
            hp: 40,
            maxHp: 40,
            shardBounty: 30,
            titheBounty: 50
        },

        // Incursion Tactical Grid (6x6)
        gridSize: 6,
        playerPos: { r: 0, c: 0 },
        gridNodes: [],

        // Config & Endpoints
        apiEndpoint: localStorage.getItem('HB_API_ENDPOINT') || 'https://script.google.com/macros/s/AKfycbxM9lthJCoadHZ6WvT37GTXBRcoE_3UOzZtC8kr7EcY6IhSs4lA_SvyzafXvGuIX7Lj/exec',
        currentTheme: localStorage.getItem('HB_THEME') || 'dark',

        init() {
            this.applyTheme(this.currentTheme);
            this.updateHeaderBadge();
            this.updateSanctumDisplay();
            this.initIncursionGrid();
            this.fetchLeaderboard();
            this.startPassiveTithes();
            if (typeof logToTerminal === 'function') {
                logToTerminal('🕊️ [SEVERANCE v2.4] Dual-Consciousness Tactical Grid Initialized.');
                logToTerminal('   Outie Sanctum online. Innie Ascent Incursion Portal synchronized.');
            }
        },

        // ====================================================================
        // 1. OUTIE SANCTUM (C&C MANAGEMENT & SYNTHESIS)
        // ====================================================================
        harvestTithes() {
            if (this.harvestCooldown) {
                if (typeof logToTerminal === 'function') logToTerminal('⏳ [COOLDOWN] Celestial tithe capacitors are recharging...');
                return;
            }
            const harvested = 35 + (this.modifiers.shardResonator ? 15 : 0);
            this.titheCredits += harvested;
            this.harvestCooldown = true;
            this.updateSanctumDisplay();
            if (typeof logToTerminal === 'function') logToTerminal(`🪙 [TITHE HARVEST] Extracted +${harvested} Tithe Credits from Sanctum Core.`);

            const btn = document.getElementById('btn-harvest-tithes');
            if (btn) {
                btn.disabled = true;
                btn.innerText = '⏳ RECHARGING (5s)...';
                setTimeout(() => {
                    this.harvestCooldown = false;
                    btn.disabled = false;
                    btn.innerText = '🪙 HARVEST CELESTIAL TITHES';
                }, 5000);
            }
        },

        startPassiveTithes() {
            setInterval(() => {
                this.titheCredits += 2;
                this.updateSanctumDisplay();
            }, 4000);
        },

        synthesizeModifier(modKey, cost) {
            if (this.modifiers[modKey]) {
                if (typeof logToTerminal === 'function') logToTerminal(`⚠️ [MODIFIER ACTIVE] Modifier [${modKey.toUpperCase()}] is already synthesized.`);
                return;
            }
            if (this.titheCredits < cost) {
                if (typeof logToTerminal === 'function') logToTerminal(`⚠️ [INSUFFICIENT TITHES] Requires ${cost} Tithe Credits (Current: ${this.titheCredits}).`);
                return;
            }

            this.titheCredits -= cost;
            this.modifiers[modKey] = true;
            this.updateSanctumDisplay();
            if (typeof logToTerminal === 'function') logToTerminal(`⚡ [SYNTHESIS COMPLETE] Passive Modifier [${modKey.toUpperCase()}] mounted to Operative Matrix!`);
        },

        bankExtraction() {
            if (this.unbankedShards <= 0) {
                if (typeof logToTerminal === 'function') logToTerminal('ℹ️ [SANCTUM] No unbanked Aether Shards in incursion bag.');
                return;
            }

            const banked = this.unbankedShards;
            this.bankedShards += banked;
            this.unbankedShards = 0;
            this.memoryDecay = 0;
            this.titheRating = Math.floor(this.bankedShards * 12.5 + this.titheCredits);
            this.updateSanctumDisplay();
            this.updateIncursionDisplay();

            if (typeof logToTerminal === 'function') {
                logToTerminal(`💎 [EXTRACTION BANKED] Safely deposited +${banked} Aether Shards into Sanctum Vault!`);
                logToTerminal(`   ⭐ New Tithe Rating: ${this.titheRating}`);
            }

            // Sync with backend
            this.syncBankToBackend(banked);
        },

        async syncBankToBackend(shards) {
            try {
                if (!this.apiEndpoint) return;
                fetch(this.apiEndpoint, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'bankExtraction',
                        operativeId: this.operativeId,
                        operativeName: this.operativeName,
                        shards: shards,
                        titheCredits: this.titheCredits,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (e) {
                console.warn('Backend sync failed, stored locally:', e);
            }
        },

        updateSanctumDisplay() {
            const titheEl = document.getElementById('sanctum-tithes');
            const bankedEl = document.getElementById('sanctum-banked-shards');
            const ratingEl = document.getElementById('sanctum-tithe-rating');
            if (titheEl) titheEl.innerText = `${this.titheCredits} 🪙`;
            if (bankedEl) bankedEl.innerText = `${this.bankedShards} 💎`;
            if (ratingEl) ratingEl.innerText = `${this.titheRating} ⭐`;

            // Update modifier buttons/badges
            ['aetherShield', 'kineticOverclock', 'synapticAnchor', 'shardResonator'].forEach(mod => {
                const btn = document.getElementById(`mod-btn-${mod}`);
                if (btn) {
                    if (this.modifiers[mod]) {
                        btn.className = 'btn-sm btn-action';
                        btn.innerText = '✅ ACTIVE';
                    }
                }
            });
        },

        // ====================================================================
        // 2. INNIE ASCENT (5e INCURSION & D20 COMBAT DICE ROLLER)
        // ====================================================================
        initIncursionGrid() {
            this.gridNodes = [];
            for (let r = 0; r < this.gridSize; r++) {
                const row = [];
                for (let c = 0; c < this.gridSize; c++) {
                    if (r === 0 && c === 0) {
                        row.push({ type: 'START', label: '🚀 Insertion' });
                    } else if (r === this.gridSize - 1 && c === this.gridSize - 1) {
                        row.push({ type: 'EXTRACTION', label: '⚡ Gate' });
                    } else {
                        const rand = Math.random();
                        if (rand < 0.25) row.push({ type: 'DAEMON', label: '👾 Daemon' });
                        else if (rand < 0.50) row.push({ type: 'SHARD', label: '💎 Shards' });
                        else row.push({ type: 'EMPTY', label: '◽ Path' });
                    }
                }
                this.gridNodes.push(row);
            }
            this.renderIncursionGrid();
        },

        renderIncursionGrid() {
            const container = document.getElementById('incursion-hex-grid');
            if (!container) return;

            container.innerHTML = '';
            for (let r = 0; r < this.gridSize; r++) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'hex-grid-row';
                for (let c = 0; c < this.gridSize; c++) {
                    const node = this.gridNodes[r][c];
                    const isPlayer = this.playerPos.r === r && this.playerPos.c === c;
                    const cell = document.createElement('div');
                    cell.className = `hex-cell ${node.type.toLowerCase()} ${isPlayer ? 'player-here' : ''}`;
                    cell.innerHTML = `
                        <div class="hex-icon">${isPlayer ? '🕊️' : (node.type === 'DAEMON' ? '👾' : node.type === 'SHARD' ? '💎' : node.type === 'EXTRACTION' ? '⚡' : '◽')}</div>
                        <div class="hex-title">${isPlayer ? 'YOU' : node.label}</div>
                    `;
                    cell.onclick = () => this.teleportToNode(r, c);
                    rowDiv.appendChild(cell);
                }
                container.appendChild(rowDiv);
            }
        },

        moveIncursion(dr, dc) {
            const newR = Math.max(0, Math.min(this.gridSize - 1, this.playerPos.r + dr));
            const newC = Math.max(0, Math.min(this.gridSize - 1, this.playerPos.c + dc));
            this.teleportToNode(newR, newC);
        },

        teleportToNode(r, c) {
            this.playerPos = { r, c };
            this.renderIncursionGrid();

            const node = this.gridNodes[r][c];
            if (typeof logToTerminal === 'function') logToTerminal(`🧭 [SECTOR TRAVERSAL] Moved to Sector [${r}, ${c}]: ${node.label}`);

            if (node.type === 'DAEMON') {
                this.currentDaemon.hp = this.currentDaemon.maxHp;
                if (typeof logToTerminal === 'function') logToTerminal(`🚨 [DAEMON BREACH] ${this.currentDaemon.name} engaged! Armor Class: ${this.currentDaemon.ac}`);
                this.updateDaemonDisplay();
            } else if (node.type === 'SHARD') {
                const found = 15 + (this.modifiers.shardResonator ? 15 : 0);
                this.unbankedShards += found;
                node.type = 'EMPTY';
                node.label = '◽ Cleared';
                this.renderIncursionGrid();
                this.updateIncursionDisplay();
                if (typeof logToTerminal === 'function') logToTerminal(`💎 [SHARDS HARVESTED] Siphoned +${found} Aether Shards into incursion bag!`);
            } else if (node.type === 'EXTRACTION') {
                if (typeof logToTerminal === 'function') logToTerminal(`⚡ [EXTRACTION GATE REACHED] Ready to extract and bank ${this.unbankedShards} Shards!`);
            }
        },

        startIncursion() {
            this.inIncursion = true;
            this.memoryDecay = 0;
            this.unbankedShards = 0;
            this.playerPos = { r: 0, c: 0 };
            this.initIncursionGrid();
            this.updateIncursionDisplay();
            switchAppMode('INNIE');

            if (this.decayTimer) clearInterval(this.decayTimer);
            this.decayTimer = setInterval(() => this.tickDecay(), 3000);

            if (typeof logToTerminal === 'function') {
                logToTerminal('🌀 [INNIE ASCENT] Operative consciousness severed into tactical incursion plane.');
                logToTerminal('⚠️ Environmental Synaptic Memory Decay is active! Extract before 100% amnesia wipe.');
            }
        },

        tickDecay() {
            if (!this.inIncursion) return;
            const rate = this.modifiers.synapticAnchor ? 1.5 : 2.5;
            this.memoryDecay = Math.min(100, this.memoryDecay + rate);
            this.updateIncursionDisplay();

            if (this.memoryDecay >= 100) {
                this.triggerAmnesiaWipe();
            } else if (this.memoryDecay >= 75) {
                if (typeof logToTerminal === 'function') logToTerminal(`⚠️ [SYNAPTIC WARNING] Memory Decay at ${Math.round(this.memoryDecay)}%! Extract immediately!`);
            }
        },

        triggerAmnesiaWipe() {
            this.inIncursion = false;
            clearInterval(this.decayTimer);
            const lost = this.unbankedShards;
            this.unbankedShards = 0;
            this.memoryDecay = 0;
            this.updateIncursionDisplay();
            this.updateSanctumDisplay();

            if (typeof logToTerminal === 'function') {
                logToTerminal('💀 ==============================================');
                logToTerminal(`💀 [SYNAPTIC AMNESIA WIPE] Memory Decay reached 100%!`);
                logToTerminal(`💀 Consciousness collapsed. Lost ${lost} unbanked Aether Shards.`);
                logToTerminal('💀 ==============================================');
            }

            switchAppMode('OUTIE');
        },

        extractFromIncursion() {
            if (!this.inIncursion) return;
            this.inIncursion = false;
            if (this.decayTimer) clearInterval(this.decayTimer);

            const harvested = this.unbankedShards;
            this.bankExtraction();

            if (typeof logToTerminal === 'function') {
                logToTerminal('🎉 ==============================================');
                logToTerminal(`🎉 [EXTRACTION SUCCESSFUL] Operative returned to Outie Sanctum!`);
                logToTerminal(`🎉 Successfully banked +${harvested} Shards. Synaptic integrity restored.`);
                logToTerminal('🎉 ==============================================');
            }

            switchAppMode('OUTIE');
        },

        // --- D&D 5e Combat Dice Roller ---
        rollD20(rollType = 'ATTACK') {
            const rawD20 = Math.floor(1 + Math.random() * 20);
            let statMod = 0;
            let statName = 'STR/DEX';

            if (rollType === 'ATTACK') {
                statMod = Math.floor((this.operativeStats.dex - 10) / 2) + (this.modifiers.kineticOverclock ? 3 : 0);
                statName = 'DEX';
            } else if (rollType === 'SAVE') {
                statMod = Math.floor((this.operativeStats.con - 10) / 2);
                statName = 'CON';
            } else if (rollType === 'BREACH') {
                statMod = Math.floor((this.operativeStats.int - 10) / 2);
                statName = 'INT';
            }

            const total = rawD20 + statMod;
            const isCrit = rawD20 === 20;
            const isFumble = rawD20 === 1;

            // Render Dice Roll in UI
            const resultBox = document.getElementById('dice-result-display');
            if (resultBox) {
                resultBox.className = `dice-roller-box ${isCrit ? 'crit' : isFumble ? 'fumble' : 'normal'}`;
                resultBox.innerHTML = `
                    <div style="font-size:26px;">🎲 ${rawD20}</div>
                    <div style="font-size:12px; margin-top:2px;">
                        d20 (${rawD20}) + ${statName} (${statMod >= 0 ? '+' + statMod : statMod}) = <strong style="font-size:16px; color:#38bdf8;">${total}</strong>
                        ${isCrit ? ' 💥 CRITICAL HIT!' : isFumble ? ' 💀 CRITICAL FUMBLE!' : ''}
                    </div>
                `;
            }

            // Resolve vs Daemon AC
            if (this.currentDaemon && this.currentDaemon.hp > 0) {
                if (isCrit || total >= this.currentDaemon.ac) {
                    const dmg = (isCrit ? 24 : 12) + (this.modifiers.kineticOverclock ? 6 : 0);
                    this.currentDaemon.hp = Math.max(0, this.currentDaemon.hp - dmg);
                    if (typeof logToTerminal === 'function') {
                        logToTerminal(`⚔️ [D20 ROLL: ${total}] Hit! ${this.operativeName} strikes ${this.currentDaemon.name} for ${dmg} damage! (Daemon HP: ${this.currentDaemon.hp})`);
                    }

                    if (this.currentDaemon.hp <= 0) {
                        const bounty = this.currentDaemon.shardBounty + (this.modifiers.shardResonator ? 15 : 0);
                        this.unbankedShards += bounty;
                        this.titheCredits += this.currentDaemon.titheBounty;
                        if (typeof logToTerminal === 'function') {
                            logToTerminal(`🏆 [DAEMON VANQUISHED] ${this.currentDaemon.name} slain! Harvested +${bounty} Aether Shards!`);
                        }
                    }
                } else {
                    if (typeof logToTerminal === 'function') {
                        logToTerminal(`🛡️ [D20 ROLL: ${total}] Miss! Attack deflected by ${this.currentDaemon.name}'s Armor Class (${this.currentDaemon.ac}).`);
                    }
                }
                this.updateDaemonDisplay();
            }

            this.updateIncursionDisplay();
        },

        updateIncursionDisplay() {
            const decayBar = document.getElementById('incursion-decay-bar');
            const decayText = document.getElementById('incursion-decay-text');
            const bagShards = document.getElementById('incursion-bag-shards');

            if (decayBar) {
                decayBar.style.width = `${this.memoryDecay}%`;
                decayBar.className = `decay-progress ${this.memoryDecay > 75 ? 'danger' : this.memoryDecay > 40 ? 'warning' : ''}`;
            }
            if (decayText) decayText.innerText = `${Math.round(this.memoryDecay)}%`;
            if (bagShards) bagShards.innerText = `${this.unbankedShards} 💎`;
        },

        updateDaemonDisplay() {
            const dName = document.getElementById('daemon-name');
            const dHp = document.getElementById('daemon-hp');
            const dBar = document.getElementById('daemon-hp-bar');
            if (dName) dName.innerText = this.currentDaemon.name;
            if (dHp) dHp.innerText = `${this.currentDaemon.hp} / ${this.currentDaemon.maxHp} HP`;
            if (dBar) dBar.style.width = `${(this.currentDaemon.hp / this.currentDaemon.maxHp) * 100}%`;
        },

        // ====================================================================
        // 3. TOP PILGRIMS LEADERBOARD
        // ====================================================================
        async fetchLeaderboard() {
            const tableBody = document.getElementById('leaderboard-table-body');
            if (!tableBody) return;

            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">⏳ Querying Live Pilgrim Matrix...</td></tr>';

            try {
                const res = await fetch(`${this.apiEndpoint}?action=getLeaderboard`);
                const data = await res.json();
                if (data && data.leaderboard && data.leaderboard.length > 0) {
                    this.renderLeaderboard(data.leaderboard);
                    return;
                }
            } catch (e) {
                console.warn('Leaderboard API query fallback to local records:', e);
            }

            // High-fidelity fallback matrix records
            const fallbackRecords = [
                { operativeId: 'PILGRIM-ALPHA', name: 'Archon Alpha (You)', bankedShards: this.bankedShards, titheRating: this.titheRating, lastActive: 'Active Now' },
                { operativeId: 'SERAPH-7', name: 'Seraph Vanguard-7', bankedShards: 320, titheRating: 4050, lastActive: '10m ago' },
                { operativeId: 'INFERNO-9', name: 'Ignis Prime', bankedShards: 240, titheRating: 3100, lastActive: '1h ago' },
                { operativeId: 'ZEPHYR-3', name: 'Aero Scout-3', bankedShards: 190, titheRating: 2500, lastActive: '3h ago' },
                { operativeId: 'TERRA-12', name: 'Bastion-12', bankedShards: 140, titheRating: 1800, lastActive: '5h ago' }
            ];
            this.renderLeaderboard(fallbackRecords);
        },

        renderLeaderboard(records) {
            const tableBody = document.getElementById('leaderboard-table-body');
            if (!tableBody) return;

            tableBody.innerHTML = records.map((rec, idx) => `
                <tr class="${rec.operativeId === this.operativeId ? 'highlight-me' : ''}">
                    <td style="font-weight:bold; color:${idx === 0 ? '#fcee0a' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#f97316' : '#94a3b8'};">
                        ${idx === 0 ? '👑 #1' : '#' + (idx + 1)}
                    </td>
                    <td style="font-family:monospace; color:#38bdf8;">${rec.operativeId}</td>
                    <td><strong>${rec.name}</strong></td>
                    <td style="color:#4ade80; font-weight:bold;">${rec.bankedShards} 💎</td>
                    <td style="color:#fcee0a; font-weight:bold;">${rec.titheRating} ⭐</td>
                </tr>
            `).join('');
        },

        // ====================================================================
        // 4. THEME & SYSTEM CONFIGURATION
        // ====================================================================
        toggleTheme() {
            this.currentTheme = this.currentTheme === 'dark' ? 'solar' : 'dark';
            localStorage.setItem('HB_THEME', this.currentTheme);
            this.applyTheme(this.currentTheme);
        },

        applyTheme(theme) {
            if (theme === 'solar') {
                document.body.classList.add('theme-solar');
            } else {
                document.body.classList.remove('theme-solar');
            }
            const btn = document.getElementById('btn-theme-toggle');
            if (btn) btn.innerText = theme === 'solar' ? '🌙 Dark Obsidian' : '☀️ Solar Light';
        },

        updateHeaderBadge() {
            const badge = document.getElementById('auth-operative-badge');
            if (badge) {
                badge.innerText = `🔑 ${this.operativeId} (AUTHENTICATED)`;
            }
        },

        openConfigModal() {
            const modal = document.getElementById('system-config-modal');
            if (modal) modal.classList.remove('hidden');
        },

        closeConfigModal() {
            const modal = document.getElementById('system-config-modal');
            if (modal) modal.classList.add('hidden');
        },

        saveConfig() {
            const epInput = document.getElementById('config-api-endpoint');
            const opInput = document.getElementById('config-operative-id');
            if (epInput && epInput.value) {
                this.apiEndpoint = epInput.value.trim();
                localStorage.setItem('HB_API_ENDPOINT', this.apiEndpoint);
            }
            if (opInput && opInput.value) {
                this.operativeId = opInput.value.trim();
                localStorage.setItem('HB_OPERATIVE_ID', this.operativeId);
            }
            this.updateHeaderBadge();
            this.closeConfigModal();
            if (typeof logToTerminal === 'function') logToTerminal('⚙️ [CONFIG SAVED] System endpoint and Operative callsign updated.');
        }
    };

    // Expose globally
    window.SeveranceManager = SeveranceManager;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SeveranceManager.init());
    } else {
        SeveranceManager.init();
    }
})(window);
