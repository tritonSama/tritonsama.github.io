/**
 * ============================================================================
 * 🕊️ HEAVENLYBOUND: Operation: Severed Grid Tactical Core
 * Protocol: SEVERANCE v2.4 (Dual-Consciousness Tactical Engine)
 * ============================================================================
 */

(function(window) {
    'use strict';

    const SeveranceManager = {
        // --- Angel Profile & Auth ---
        angelId: localStorage.getItem('HB_OPERATIVE_ID') || 'PILGRIM-ALPHA',
        angelName: localStorage.getItem('HB_OPERATIVE_NAME') || 'Archon Alpha',
        isAuthenticated: true,

        // --- Dual-Consciousness Balances ---
        titheCredits: 450,
        bankedFavor: 180,
        unbankedFavor: 0,
        titheRating: 2450,
        
        // --- Severance Synaptic Memory Decay Loop ---
        inChronicle: false,
        memoryDecay: 0, // 0% to 100%
        decayTimer: null,
        harvestCooldown: false,

        // --- Passive Modifier Synthesis Matrix ---
        modifiers: {
            aetherShield: true,      // +25% DEF
            kineticOverclock: false, // +30% ATK
            synapticAnchor: false,   // -40% Memory Decay
            favorResonator: false    // +2x Favor
        },

        // --- Innie Ascent 5e Combat & Angel Stats ---
        angelHp: 100,
        angelMaxHp: 100,
        angelStats: {
            str: 14, // +2
            dex: 16, // +3
            con: 14, // +2
            int: 16, // +3
            wis: 12, // +1
            cha: 10  // +0
        },

        // Current Fiend Encounter
        currentFiend: {
            id: 'fiend-1',
            name: '👾 Void-Corruptor Archon',
            type: 'Abyssal Void Cyber-Fiend',
            ac: 13,
            hp: 40,
            maxHp: 40,
            favorBounty: 30,
            titheBounty: 50
        },

        // Chronicle Tactical Grid (6x6)
        gridSize: 6,
        playerPos: { r: 0, c: 0 },
        gridNodes: [],

        // Config & Endpoints
        apiEndpoint: localStorage.getItem('HB_API_ENDPOINT') || 'https://script.google.com/macros/s/AKfycbxM9lthJCoadHZ6WvT37GTXBRcoE_3UOzZtC8kr7EcY6IhSs4lA_SvyzafXvGuIX7Lj/exec',
        currentTheme: localStorage.getItem('HB_THEME') || 'dark',

        init() {
            this.applyTheme(this.currentTheme);
            this.updateHeaderBadge();
            this.updateThe Great ArchiveDisplay();
            this.initChronicleGrid();
            this.fetchArchangel Hierarchy();
            this.startPassiveTithes();
            if (typeof logToTerminal === 'function') {
                logToTerminal('🕊️ [SEVERANCE v2.4] Dual-Consciousness Tactical Grid Initialized.');
                logToTerminal('   Outie The Great Archive online. Innie Ascent Chronicle Portal synchronized.');
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
            const harvested = 35 + (this.modifiers.favorResonator ? 15 : 0);
            this.titheCredits += harvested;
            this.harvestCooldown = true;
            this.updateThe Great ArchiveDisplay();
            if (typeof logToTerminal === 'function') logToTerminal(`🪙 [TITHE HARVEST] Extracted +${harvested} Tithe Credits from The Great Archive Core.`);

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
                this.updateThe Great ArchiveDisplay();
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
            this.updateThe Great ArchiveDisplay();
            if (typeof logToTerminal === 'function') logToTerminal(`⚡ [SYNTHESIS COMPLETE] Passive Modifier [${modKey.toUpperCase()}] mounted to Angel Matrix!`);
        },

        bankExtraction() {
            if (this.unbankedFavor <= 0) {
                if (typeof logToTerminal === 'function') logToTerminal('ℹ️ [SANCTUM] No unbanked Divine Favor in chronicle bag.');
                return;
            }

            const banked = this.unbankedFavor;
            this.bankedFavor += banked;
            this.unbankedFavor = 0;
            this.memoryDecay = 0;
            this.titheRating = Math.floor(this.bankedFavor * 12.5 + this.titheCredits);
            this.updateThe Great ArchiveDisplay();
            this.updateChronicleDisplay();

            if (typeof logToTerminal === 'function') {
                logToTerminal(`💎 [EXTRACTION BANKED] Safely deposited +${banked} Divine Favor into The Great Archive Vault!`);
                logToTerminal(`   ⭐ New Tithe Rating: ${this.titheRating}`);
            }

            // Sync with backend
            this.syncBankToBackend(banked);
        },

        async syncBankToBackend(favor) {
            try {
                if (!this.apiEndpoint) return;
                fetch(this.apiEndpoint, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'bankExtraction',
                        angelId: this.angelId,
                        angelName: this.angelName,
                        favor: favor,
                        titheCredits: this.titheCredits,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (e) {
                console.warn('Backend sync failed, stored locally:', e);
            }
        },

        updateThe Great ArchiveDisplay() {
            const titheEl = document.getElementById('the great archive-tithes');
            const bankedEl = document.getElementById('the great archive-banked-favor');
            const ratingEl = document.getElementById('the great archive-tithe-rating');
            if (titheEl) titheEl.innerText = `${this.titheCredits} 🪙`;
            if (bankedEl) bankedEl.innerText = `${this.bankedFavor} 💎`;
            if (ratingEl) ratingEl.innerText = `${this.titheRating} ⭐`;

            // Update modifier buttons/badges
            ['aetherShield', 'kineticOverclock', 'synapticAnchor', 'favorResonator'].forEach(mod => {
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
        initChronicleGrid() {
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
                        if (rand < 0.25) row.push({ type: 'FIEND', label: '👾 Fiend' });
                        else if (rand < 0.50) row.push({ type: 'FAVOR', label: '💎 Favor' });
                        else row.push({ type: 'EMPTY', label: '◽ Path' });
                    }
                }
                this.gridNodes.push(row);
            }
            this.renderChronicleGrid();
        },

        renderChronicleGrid() {
            const container = document.getElementById('chronicle-hex-grid');
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
                        <div class="hex-icon">${isPlayer ? '🕊️' : (node.type === 'FIEND' ? '👾' : node.type === 'FAVOR' ? '💎' : node.type === 'EXTRACTION' ? '⚡' : '◽')}</div>
                        <div class="hex-title">${isPlayer ? 'YOU' : node.label}</div>
                    `;
                    cell.onclick = () => this.teleportToNode(r, c);
                    rowDiv.appendChild(cell);
                }
                container.appendChild(rowDiv);
            }
        },

        moveChronicle(dr, dc) {
            const newR = Math.max(0, Math.min(this.gridSize - 1, this.playerPos.r + dr));
            const newC = Math.max(0, Math.min(this.gridSize - 1, this.playerPos.c + dc));
            this.teleportToNode(newR, newC);
        },

        teleportToNode(r, c) {
            this.playerPos = { r, c };
            this.renderChronicleGrid();

            const node = this.gridNodes[r][c];
            if (typeof logToTerminal === 'function') logToTerminal(`🧭 [SECTOR TRAVERSAL] Moved to Sector [${r}, ${c}]: ${node.label}`);

            if (node.type === 'FIEND') {
                this.currentFiend.hp = this.currentFiend.maxHp;
                if (typeof logToTerminal === 'function') logToTerminal(`🚨 [FIEND BREACH] ${this.currentFiend.name} engaged! Willpower Class: ${this.currentFiend.ac}`);
                this.updateFiendDisplay();
            } else if (node.type === 'FAVOR') {
                const found = 15 + (this.modifiers.favorResonator ? 15 : 0);
                this.unbankedFavor += found;
                node.type = 'EMPTY';
                node.label = '◽ Cleared';
                this.renderChronicleGrid();
                this.updateChronicleDisplay();
                if (typeof logToTerminal === 'function') logToTerminal(`💎 [FAVORS HARVESTED] Siphoned +${found} Divine Favor into chronicle bag!`);
            } else if (node.type === 'EXTRACTION') {
                if (typeof logToTerminal === 'function') logToTerminal(`⚡ [EXTRACTION GATE REACHED] Ready to extract and bank ${this.unbankedFavor} Favor!`);
            }
        },

        startChronicle() {
            this.inChronicle = true;
            this.memoryDecay = 0;
            this.unbankedFavor = 0;
            this.playerPos = { r: 0, c: 0 };
            this.initChronicleGrid();
            this.updateChronicleDisplay();
            switchAppMode('INNIE');
            document.getElementById('chronicles-section').scrollIntoView({ behavior: 'smooth' });

            if (this.decayTimer) clearInterval(this.decayTimer);
            this.decayTimer = setInterval(() => this.tickDecay(), 3000);

            if (typeof logToTerminal === 'function') {
                logToTerminal('🌀 [INNIE ASCENT] Angel consciousness severed into tactical chronicle plane.');
                logToTerminal('⚠️ Environmental Synaptic Memory Decay is active! Extract before 100% amnesia wipe.');
            }
        },

        tickDecay() {
            if (!this.inChronicle) return;
            const rate = this.modifiers.synapticAnchor ? 1.5 : 2.5;
            this.memoryDecay = Math.min(100, this.memoryDecay + rate);
            this.updateChronicleDisplay();

            if (this.memoryDecay >= 100) {
                this.triggerAmnesiaWipe();
            } else if (this.memoryDecay >= 75) {
                if (typeof logToTerminal === 'function') logToTerminal(`⚠️ [SYNAPTIC WARNING] Memory Decay at ${Math.round(this.memoryDecay)}%! Extract immediately!`);
            }
        },

        triggerAmnesiaWipe() {
            this.inChronicle = false;
            clearInterval(this.decayTimer);
            const lost = this.unbankedFavor;
            this.unbankedFavor = 0;
            this.memoryDecay = 0;
            this.updateChronicleDisplay();
            this.updateThe Great ArchiveDisplay();

            if (typeof logToTerminal === 'function') {
                logToTerminal('💀 ==============================================');
                logToTerminal(`💀 [SYNAPTIC AMNESIA WIPE] Memory Decay reached 100%!`);
                logToTerminal(`💀 Consciousness collapsed. Lost ${lost} unbanked Divine Favor.`);
                logToTerminal('💀 ==============================================');
            }

            switchAppMode('OUTIE');
            document.getElementById('archive-section').scrollIntoView({ behavior: 'smooth' });
        },

        extractFromChronicle() {
            if (!this.inChronicle) return;
            this.inChronicle = false;
            if (this.decayTimer) clearInterval(this.decayTimer);

            const harvested = this.unbankedFavor;
            this.bankExtraction();

            if (typeof logToTerminal === 'function') {
                logToTerminal('🎉 ==============================================');
                logToTerminal(`🎉 [EXTRACTION SUCCESSFUL] Angel returned to Outie The Great Archive!`);
                logToTerminal(`🎉 Successfully banked +${harvested} Favor. Synaptic integrity restored.`);
                logToTerminal('🎉 ==============================================');
            }

            switchAppMode('OUTIE');
            document.getElementById('archive-section').scrollIntoView({ behavior: 'smooth' });
        },

        // --- D&D 5e Combat Dice Roller ---
        rollD20(rollType = 'RADIANCE') {
            const rawD20 = Math.floor(1 + Math.random() * 20);
            let statMod = 0;
            let statName = 'STR/DEX';

            if (rollType === 'RADIANCE') {
                statMod = Math.floor((this.angelStats.dex - 10) / 2) + (this.modifiers.kineticOverclock ? 3 : 0);
                statName = 'DEX';
            } else if (rollType === 'SAVE') {
                statMod = Math.floor((this.angelStats.con - 10) / 2);
                statName = 'CON';
            } else if (rollType === 'BREACH') {
                statMod = Math.floor((this.angelStats.int - 10) / 2);
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

            // Resolve vs Fiend AC
            if (this.currentFiend && this.currentFiend.hp > 0) {
                if (isCrit || total >= this.currentFiend.ac) {
                    const dmg = (isCrit ? 24 : 12) + (this.modifiers.kineticOverclock ? 6 : 0);
                    this.currentFiend.hp = Math.max(0, this.currentFiend.hp - dmg);
                    if (typeof logToTerminal === 'function') {
                        logToTerminal(`⚔️ [D20 ROLL: ${total}] Hit! ${this.angelName} strikes ${this.currentFiend.name} for ${dmg} damage! (Fiend HP: ${this.currentFiend.hp})`);
                    }

                    if (this.currentFiend.hp <= 0) {
                        const bounty = this.currentFiend.favorBounty + (this.modifiers.favorResonator ? 15 : 0);
                        this.unbankedFavor += bounty;
                        this.titheCredits += this.currentFiend.titheBounty;
                        if (typeof logToTerminal === 'function') {
                            logToTerminal(`🏆 [FIEND VANQUISHED] ${this.currentFiend.name} slain! Harvested +${bounty} Divine Favor!`);
                        }
                    }
                } else {
                    if (typeof logToTerminal === 'function') {
                        logToTerminal(`🛡️ [D20 ROLL: ${total}] Miss! Radiance deflected by ${this.currentFiend.name}'s Willpower Class (${this.currentFiend.ac}).`);
                    }
                }
                this.updateFiendDisplay();
            }

            this.updateChronicleDisplay();
        },

        updateChronicleDisplay() {
            const decayBar = document.getElementById('chronicle-decay-bar');
            const decayText = document.getElementById('chronicle-decay-text');
            const bagFavor = document.getElementById('chronicle-bag-favor');

            if (decayBar) {
                decayBar.style.width = `${this.memoryDecay}%`;
                decayBar.className = `decay-progress ${this.memoryDecay > 75 ? 'danger' : this.memoryDecay > 40 ? 'warning' : ''}`;
            }
            if (decayText) decayText.innerText = `${Math.round(this.memoryDecay)}%`;
            if (bagFavor) bagFavor.innerText = `${this.unbankedFavor} 💎`;
        },

        updateFiendDisplay() {
            const dName = document.getElementById('fiend-name');
            const dHp = document.getElementById('fiend-hp');
            const dBar = document.getElementById('fiend-hp-bar');
            if (dName) dName.innerText = this.currentFiend.name;
            if (dHp) dHp.innerText = `${this.currentFiend.hp} / ${this.currentFiend.maxHp} HP`;
            if (dBar) dBar.style.width = `${(this.currentFiend.hp / this.currentFiend.maxHp) * 100}%`;
        },

        // ====================================================================
        // 3. TOP PILGRIMS LEADERBOARD
        // ====================================================================
        async fetchArchangel Hierarchy() {
            const tableBody = document.getElementById('archangel hierarchy-table-body');
            if (!tableBody) return;

            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">⏳ Querying Live Fledgling Matrix...</td></tr>';

            try {
                const res = await fetch(`${this.apiEndpoint}?action=getArchangel Hierarchy`);
                const data = await res.json();
                if (data && data.archangel hierarchy && data.archangel hierarchy.length > 0) {
                    this.renderArchangel Hierarchy(data.archangel hierarchy);
                    return;
                }
            } catch (e) {
                console.warn('Archangel Hierarchy API query fallback to local records:', e);
            }

            // High-fidelity fallback matrix records
            const fallbackRecords = [
                { angelId: 'PILGRIM-ALPHA', name: 'Archon Alpha (You)', bankedFavor: this.bankedFavor, titheRating: this.titheRating, lastActive: 'Active Now' },
                { angelId: 'SERAPH-7', name: 'Seraph Vanguard-7', bankedFavor: 320, titheRating: 4050, lastActive: '10m ago' },
                { angelId: 'INFERNO-9', name: 'Ignis Prime', bankedFavor: 240, titheRating: 3100, lastActive: '1h ago' },
                { angelId: 'ZEPHYR-3', name: 'Aero Scout-3', bankedFavor: 190, titheRating: 2500, lastActive: '3h ago' },
                { angelId: 'TERRA-12', name: 'Bastion-12', bankedFavor: 140, titheRating: 1800, lastActive: '5h ago' }
            ];
            this.renderArchangel Hierarchy(fallbackRecords);
        },

        renderArchangel Hierarchy(records) {
            const tableBody = document.getElementById('archangel hierarchy-table-body');
            if (!tableBody) return;

            tableBody.innerHTML = records.map((rec, idx) => `
                <tr class="${rec.angelId === this.angelId ? 'highlight-me' : ''}">
                    <td style="font-weight:bold; color:${idx === 0 ? '#fcee0a' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#f97316' : '#94a3b8'};">
                        ${idx === 0 ? '👑 #1' : '#' + (idx + 1)}
                    </td>
                    <td style="font-family:monospace; color:#38bdf8;">${rec.angelId}</td>
                    <td><strong>${rec.name}</strong></td>
                    <td style="color:#4ade80; font-weight:bold;">${rec.bankedFavor} 💎</td>
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
            const badge = document.getElementById('auth-angel-badge');
            if (badge) {
                badge.innerText = `🔑 ${this.angelId} (AUTHENTICATED)`;
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
            const opInput = document.getElementById('config-angel-id');
            if (epInput && epInput.value) {
                this.apiEndpoint = epInput.value.trim();
                localStorage.setItem('HB_API_ENDPOINT', this.apiEndpoint);
            }
            if (opInput && opInput.value) {
                this.angelId = opInput.value.trim();
                localStorage.setItem('HB_OPERATIVE_ID', this.angelId);
            }
            this.updateHeaderBadge();
            this.closeConfigModal();
            if (typeof logToTerminal === 'function') logToTerminal('⚙️ [CONFIG SAVED] System endpoint and Angel paladin name updated.');
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
