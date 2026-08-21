/**
 * ============================================================================
 * HeavenlyBound - UI Controller & Tabletop Dashboard Manager
 * ============================================================================
 * Features:
 *   - Mobile-First Responsive Layout & Touch Targets (min 44px)
 *   - Mode Switcher: [DEFENSE ARCHITECT], [INFILTRATION RAID], [CARD VAULT]
 *   - Chain Link Visualizer (LIFO Reverse Resolution Animation)
 *   - Attribute Stance Switcher (DARK, LIGHT, FIRE, WATER, EARTH, WIND)
 *   - Perception Sonar Overlay (Magenta wireframes on face-down traps)
 *   - Real-Time "Breaking the Chain" Bullet-Time Modal
 *   - YGOPRODeck Live Card Search & Inspection Modal
 * ============================================================================
 */

(function(window) {
  'use strict';

  class HeavenlyUIManager {
    constructor() {
      this.currentTab = 'DEFENSE'; // 'DEFENSE', 'INFILTRATION', 'VAULT'
      this.selectedDefenseTile = null;
      this.activeSearchCards = [];
    }

    init() {
      this.setupTabListeners();
      this.setupStanceListeners();
      this.setupDefensePalette();
      this.setupSearchListeners();
      this.updateResourceDisplays();
      this.renderDefenseGrid();
      this.renderInfiltration();
      this.renderCardVault();

      // Sync indicator listener
      if (window.HeavenlyApi) {
        window.HeavenlyApi.onSyncStateChange((e) => {
          const badge = document.getElementById('syncStatusBadge');
          if (!badge) return;
          if (e.status === 'syncing') {
            badge.innerText = '⚡ Syncing...';
            badge.className = 'panel-badge badge-outie';
          } else if (e.status === 'synced') {
            badge.innerText = '☁️ Synced';
            badge.className = 'panel-badge badge-innie';
          } else {
            badge.innerText = '💾 Local Buffer';
            badge.className = 'panel-badge';
          }
        });
      }
    }

    // --------------------------------------------------------------------------
    // TAB MANAGEMENT (Mobile Dashboard)
    // --------------------------------------------------------------------------

    setupTabListeners() {
      const tabs = document.querySelectorAll('.mode-tab-btn');
      tabs.forEach(btn => {
        btn.addEventListener('click', () => {
          tabs.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.switchTab(btn.getAttribute('data-tab'));
        });
      });
    }

    switchTab(tabKey) {
      this.currentTab = tabKey;
      const defView = document.getElementById('defenseViewSection');
      const infilView = document.getElementById('infiltrationViewSection');
      const vaultView = document.getElementById('vaultViewSection');

      if (defView) defView.style.display = tabKey === 'DEFENSE' ? 'grid' : 'none';
      if (infilView) infilView.style.display = tabKey === 'INFILTRATION' ? 'grid' : 'none';
      if (vaultView) vaultView.style.display = tabKey === 'VAULT' ? 'flex' : 'none';

      if (tabKey === 'DEFENSE') this.renderDefenseGrid();
      if (tabKey === 'INFILTRATION') this.renderInfiltration();
      if (tabKey === 'VAULT') this.renderCardVault();

      if (window.HeavenlyEngine) {
        window.HeavenlyEngine.sound.playClick();
      }
    }

    // --------------------------------------------------------------------------
    // PHASE 1: TOP-DOWN DEFENSE ARCHITECT RENDERER
    // --------------------------------------------------------------------------

    setupDefensePalette() {
      const container = document.getElementById('defensePaletteList');
      if (!container || !window.YgoApi) return;

      const traps = window.YgoApi.getDefenseTraps();
      container.innerHTML = traps.map((card, idx) => {
        const attrColor = this.getAttributeColor(card.attribute);
        const costStr = `${card.cost.tithes} Tithes + ${card.cost[card.attribute.toLowerCase()] || 0} ${card.attribute}`;
        return `
          <div class="card-item-pill ${idx === 0 ? 'selected' : ''}" data-card-id="${card.id}" onclick="window.HeavenlyUI.selectTrapCard(${card.id}, this)">
            <img src="${window.YgoApi.getCardImageUrl(card.id)}" class="card-mini-thumb" alt="${card.name}">
            <div class="card-info">
              <div class="card-name" style="color: ${attrColor};">${card.name}</div>
              <div class="card-type-badge ${this.getCardClass(card)}">${card.category}</div>
              <div class="card-cost">${costStr}</div>
            </div>
          </div>
        `;
      }).join('');

      if (traps.length > 0) {
        window.HeavenlyEngine.selectedTrapCard = traps[0];
      }
    }

    selectTrapCard(cardId, element) {
      document.querySelectorAll('.card-item-pill').forEach(el => el.classList.remove('selected'));
      if (element) element.classList.add('selected');
      const card = window.YgoApi.getCard(cardId);
      window.HeavenlyEngine.selectedTrapCard = card;
      if (window.HeavenlyEngine) window.HeavenlyEngine.sound.playClick();
    }

    renderDefenseGrid() {
      const gridEl = document.getElementById('tabletopDefenseGrid');
      if (!gridEl || !window.HeavenlyEngine) return;

      const engine = window.HeavenlyEngine;
      let html = '';

      for (let r = 0; r < engine.defRows; r++) {
        for (let c = 0; c < engine.defCols; c++) {
          const tile = engine.defenseGrid[r][c];
          let content = '';
          let tileClass = 'tabletop-tile';

          if (tile) {
            tileClass += ' has-trap';
            const card = tile.card;
            const chainCount = tile.chain ? tile.chain.length : 1;

            if (card.mechanicType === 'NORMAL_TRAP') {
              content = `
                <div class="tile-trap-icon normal-trap">🕳️</div>
                <div class="tile-trap-name">${card.name}</div>
                ${chainCount > 1 ? `<span class="chain-badge">CL${chainCount}</span>` : ''}
              `;
            } else if (card.mechanicType === 'CONTINUOUS_TRAP') {
              content = `
                <div class="tile-trap-icon continuous-trap">⚡</div>
                <div class="tile-trap-name">${card.name}</div>
                ${chainCount > 1 ? `<span class="chain-badge">CL${chainCount}</span>` : ''}
              `;
            } else if (card.mechanicType === 'COUNTER_TRAP') {
              content = `
                <div class="tile-trap-icon counter-trap">👁️</div>
                <div class="tile-trap-name">${card.name}</div>
                ${chainCount > 1 ? `<span class="chain-badge">CL${chainCount}</span>` : ''}
              `;
            } else if (card.mechanicType === 'TRAP_MONSTER') {
              content = `
                <div class="tile-trap-icon trap-monster">🗿</div>
                <div class="tile-trap-name">${card.name}</div>
                ${chainCount > 1 ? `<span class="chain-badge">CL${chainCount}</span>` : ''}
              `;
            }
          } else {
            content = `<span class="empty-coord">${c + 1},${r + 1}</span>`;
          }

          html += `
            <div class="${tileClass}" onclick="window.HeavenlyUI.handleTileClick(${r}, ${c})" oncontextmenu="event.preventDefault(); window.HeavenlyEngine.removeTrap(${r}, ${c});">
              ${content}
            </div>
          `;
        }
      }

      gridEl.innerHTML = html;
    }

    handleTileClick(r, c) {
      const engine = window.HeavenlyEngine;
      if (engine.selectedTrapCard) {
        engine.placeTrap(r, c, engine.selectedTrapCard);
      } else {
        const tile = engine.defenseGrid[r][c];
        if (tile) {
          this.inspectCard(tile.card);
        }
      }
    }

    // --------------------------------------------------------------------------
    // PHASE 2: INFILTRATION RAID RENDERER (Mobile Tabletop)
    // --------------------------------------------------------------------------

    setupStanceListeners() {
      const buttons = document.querySelectorAll('.stance-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const stance = btn.getAttribute('data-stance');
          if (window.HeavenlyEngine) {
            window.HeavenlyEngine.setStance(stance);
          }
        });
      });
    }

    updateStanceDisplay() {
      const stance = window.HeavenlyEngine.operative.stance;
      document.querySelectorAll('.stance-btn').forEach(btn => {
        if (btn.getAttribute('data-stance') === stance) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      const stanceLabel = document.getElementById('activeStanceLabel');
      if (stanceLabel) {
        stanceLabel.innerText = `${stance} STANCE`;
        stanceLabel.style.color = this.getAttributeColor(stance);
      }
    }

    renderInfiltration() {
      const engine = window.HeavenlyEngine;
      const infilContainer = document.getElementById('infilSectorGrid');
      const actionDeck = document.getElementById('infilHandCards');
      if (!infilContainer) return;

      if (!engine.inRun) {
        infilContainer.innerHTML = `
          <div class="infil-ready-card">
            <div style="font-size: 2.75rem;">⚔️</div>
            <h3 style="color: var(--color-gold); font-size: 1.15rem;">Enemy Territory Raid Ready</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; max-width: 340px; margin: 0 auto;">
              Infiltrate rival club sectors. Toggle attribute stances, scan face-down traps with your Perception sonar, and break chain links to extinguish the Master Core!
            </p>
            <button class="btn btn-gold btn-large" onclick="window.HeavenlyEngine.startInfiltrationRaid()">
              🚀 INITIATE RAID ON SECTOR ${engine.raidFloor}
            </button>
          </div>
        `;
        if (actionDeck) actionDeck.innerHTML = '';
        return;
      }

      // Render 6x6 Infiltration Grid with Perception Highlights
      let gridHtml = '<div class="infil-grid-matrix">';
      const playerPos = engine.infilPlayerPos;
      const perception = engine.operative.stats.perception || 15;

      engine.infilGrid.forEach((node, idx) => {
        const isPlayerHere = playerPos.r === node.r && playerPos.c === node.c;
        const isAdjacent = Math.abs(playerPos.r - node.r) + Math.abs(playerPos.c - node.c) === 1;
        let classes = 'infil-node';

        if (node.fogged) classes += ' fogged';
        if (isPlayerHere) classes += ' player-node';
        if (node.cleared) classes += ' cleared';

        // PERCEPTION SONAR: Highlight face-down traps in MAGENTA if adjacent and perception is high!
        const isTrapDetected = !node.fogged && !node.cleared && node.chain && node.chain.length > 0 && (isAdjacent || perception >= 15);
        if (isTrapDetected) classes += ' perception-trap-detected';

        let icon = '▪️';
        if (node.type === 'ENTRY') icon = '🚪';
        else if (node.type === 'MASTER_CORE') icon = '💠';
        else if (isTrapDetected) icon = '⚠️🕳️';
        else if (node.cleared) icon = '✅';

        if (isPlayerHere) icon = '🎯';

        gridHtml += `
          <div class="${classes}" onclick="window.HeavenlyEngine.moveInfiltrator(${node.r}, ${node.c})">
            <span>${node.fogged ? '❓' : icon}</span>
          </div>
        `;
      });
      gridHtml += '</div>';

      // Current Sector Encounter / Master Core Card
      const currentIdx = playerPos.r * engine.infilCols + playerPos.c;
      const currentNode = engine.infilGrid[currentIdx];
      let encounterHtml = '';

      if (currentNode && currentNode.type === 'MASTER_CORE') {
        const core = engine.masterCore;
        encounterHtml = `
          <div class="core-boss-card">
            <div class="core-header">
              <span style="color: var(--color-cyan); font-weight: 700;">💠 MASTER TERRITORY CORE</span>
              <span class="panel-badge badge-outie">HP ${core.hp}/${core.maxHp}</span>
            </div>
            <div class="grace-track" style="margin: 0.5rem 0;">
              <div class="grace-fill" style="width: ${(core.hp / core.maxHp) * 100}%; background: var(--color-cyan);"></div>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary);">
              Fire your kinetic blaster. <strong>FIRE Stance</strong> deals +75% breach damage against core matrix!
            </p>
            ${core.destroyed ? `
              <div style="color: var(--color-emerald); font-weight: 700; padding: 0.5rem; text-align: center;">
                🎉 SECTOR LIBERATED! Harvested +${engine.raidLoot.spl} SPL & +${engine.raidLoot.shards} Shards!
              </div>
            ` : `
              <button class="btn btn-crimson btn-large" onclick="window.HeavenlyEngine.attackMasterCore()">
                💥 FIRE KINETIC PLASMA BLASTER
              </button>
            `}
          </div>
        `;
      } else {
        encounterHtml = `
          <div class="sector-info-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: var(--color-cyan);">${currentNode ? currentNode.title : 'Sector'}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Sector (${playerPos.c + 1}, ${playerPos.r + 1})</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.3rem 0;">
              ${currentNode ? currentNode.desc : 'Exploring sector.'}
            </p>
            <div style="font-size: 0.75rem; color: var(--color-gold);">
              Raid Loot Bank: +${engine.raidLoot.spl} SPL | +${engine.raidLoot.shards} Shards
            </div>
          </div>
        `;
      }

      infilContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${gridHtml}
          ${encounterHtml}
        </div>
      `;

      // Render Infiltrator Active Hand Deck
      if (actionDeck) {
        actionDeck.innerHTML = engine.operative.hand.map(card => `
          <div class="hand-card-pill" onclick="window.HeavenlyUI.inspectCardById(${card.id})">
            <img src="${window.YgoApi.getCardImageUrl(card.id)}" class="card-mini-thumb" alt="${card.name}">
            <div style="flex: 1;">
              <div style="font-weight: 700; font-size: 0.8rem; color: var(--color-gold);">${card.name}</div>
              <div style="font-size: 0.65rem; color: var(--color-cyan);">${card.category}</div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); window.HeavenlyUI.useHandSpell(${card.id})">CAST</button>
          </div>
        `).join('');
      }

      this.updateStanceDisplay();
    }

    useHandSpell(cardId) {
      const card = window.YgoApi.getCard(cardId);
      if (!card || !window.HeavenlyEngine) return;

      const engine = window.HeavenlyEngine;
      engine.sound.playCardActivate();
      engine.log(`Cast [${card.name}]: ${card.desc}`, 'success');

      if (card.id === 5318639) { // Mystical Space Typhoon
        // Disarm adjacent trap
        const pos = engine.infilPlayerPos;
        engine.infilGrid.forEach(node => {
          if (Math.abs(node.r - pos.r) + Math.abs(node.c - pos.c) === 1 && node.chain && node.chain.length > 0) {
            node.chain = [];
            node.cleared = true;
            engine.log('Mystical Space Typhoon destroyed adjacent trap mechanisms!', 'success');
          }
        });
        this.renderInfiltration();
      }
    }

    // --------------------------------------------------------------------------
    // "BREAKING THE CHAIN" REAL-TIME BULLET-TIME MODAL
    // --------------------------------------------------------------------------

    showChainLinkModal(chainObj) {
      const modal = document.getElementById('chainLinkModal');
      const stackList = document.getElementById('chainStackVisualizer');
      const timerFill = document.getElementById('chainTimerBar');
      if (!modal || !stackList) return;

      // Render Chain Links stack: CL1, CL2, CL3...
      stackList.innerHTML = chainObj.links.map((trap, idx) => `
        <div class="chain-step-card">
          <span class="chain-step-num">CL${idx + 1}</span>
          <img src="${window.YgoApi.getCardImageUrl(trap.id)}" style="width: 32px; height: 46px; border-radius: 2px;" alt="${trap.name}">
          <div>
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-crimson);">${trap.name}</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">${trap.category} (${trap.desc})</div>
          </div>
        </div>
      `).join('');

      // Render Infiltrator Hand Reaction Options
      const reactionContainer = document.getElementById('chainReactionCards');
      if (reactionContainer) {
        const reactions = window.HeavenlyEngine.operative.hand.filter(c => c.mechanicType === 'HAND_TRAP' || c.mechanicType === 'QUICK_PLAY_SPELL');
        reactionContainer.innerHTML = reactions.map(c => `
          <button class="btn btn-gold btn-large" style="flex: 1;" onclick="window.HeavenlyEngine.castReactionCard(${c.id})">
            ⚡ CHAIN [${c.name}] (${c.category})
          </button>
        `).join('');
      }

      if (timerFill) timerFill.style.width = '100%';
      modal.classList.add('open');
    }

    updateChainTimer(secondsLeft) {
      const timerFill = document.getElementById('chainTimerBar');
      const timerLabel = document.getElementById('chainTimerLabel');
      if (timerFill) {
        const pct = Math.max(0, (secondsLeft / 3.5) * 100);
        timerFill.style.width = `${pct}%`;
      }
      if (timerLabel) {
        timerLabel.innerText = `${secondsLeft.toFixed(1)}s`;
      }
    }

    updateChainBrokenDisplay(card) {
      const statusEl = document.getElementById('chainResolutionStatus');
      if (statusEl) {
        statusEl.innerHTML = `
          <div style="color: var(--color-emerald); font-weight: 700; text-align: center; font-size: 1rem;">
            ✨ CHAIN BROKEN BY ${card.name.toUpperCase()}!
          </div>
        `;
      }
    }

    closeChainModal() {
      const modal = document.getElementById('chainLinkModal');
      if (modal) modal.classList.remove('open');
    }

    // --------------------------------------------------------------------------
    // PHASE 3: CARD VAULT & LIVE YGOPRODECK SEARCH
    // --------------------------------------------------------------------------

    setupSearchListeners() {
      const searchBtn = document.getElementById('searchYgoBtn');
      const searchInput = document.getElementById('searchYgoInput');
      if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => this.performCardSearch());
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.performCardSearch();
        });
      }
    }

    async performCardSearch() {
      const query = document.getElementById('searchYgoInput').value;
      if (!query || !query.trim()) return;

      const container = document.getElementById('vaultCardGrid');
      if (container) container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--color-cyan);">Searching YGOPRODeck Database...</div>';

      const results = await window.YgoApi.searchCards(query.trim());
      this.activeSearchCards = results;
      this.renderCardVaultResults(results);
    }

    renderCardVault() {
      if (this.activeSearchCards.length === 0) {
        // Show starter cards
        const starters = window.YgoApi.getDefenseTraps().concat(window.YgoApi.getInfiltratorHand());
        this.renderCardVaultResults(starters);
      } else {
        this.renderCardVaultResults(this.activeSearchCards);
      }
    }

    renderCardVaultResults(cards) {
      const container = document.getElementById('vaultCardGrid');
      if (!container) return;

      if (!cards || cards.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No matching cards found.</div>';
        return;
      }

      container.innerHTML = cards.map(c => `
        <div class="ygo-card-frame ${this.getCardClass(c)}" onclick="window.HeavenlyUI.inspectCard(${JSON.stringify(c).replace(/"/g, '&quot;')})">
          <img src="${window.YgoApi.getCardImageUrl(c.id)}" class="ygo-card-image" alt="${c.name}" loading="lazy">
          <div class="ygo-card-title">${c.name}</div>
          <div class="ygo-card-tag">${c.category}</div>
        </div>
      `).join('');
    }

    inspectCardById(cardId) {
      const card = window.YgoApi.getCard(cardId);
      if (card) this.inspectCard(card);
    }

    inspectCard(card) {
      const modal = document.getElementById('cardDetailModal');
      if (!modal) return;

      document.getElementById('modalCardImg').src = window.YgoApi.getCardImageUrl(card.id);
      document.getElementById('modalCardName').innerText = card.name;
      document.getElementById('modalCardCategory').innerText = `${card.category} | ${card.attribute} | Spell Speed ${card.spellSpeed}`;
      document.getElementById('modalCardDesc').innerText = card.desc;

      const physicalEl = document.getElementById('modalCardPhysical');
      if (physicalEl) {
        physicalEl.innerHTML = `
          <strong>Physical In-Game Mechanism:</strong> ${this.getPhysicalDescription(card)}
        `;
      }

      modal.classList.add('open');
    }

    closeDetailModal() {
      const modal = document.getElementById('cardDetailModal');
      if (modal) modal.classList.remove('open');
    }

    getPhysicalDescription(card) {
      if (card.mechanicType === 'NORMAL_TRAP') return 'Face-down floor pressure plate. Triggers high physical spike / gravity collapse hazard.';
      if (card.mechanicType === 'CONTINUOUS_TRAP') return 'Wall/Ceiling indestructible rune. Emits permanent field silencing aura until physically shot.';
      if (card.mechanicType === 'COUNTER_TRAP') return 'Spell Speed 3 automated eye turret. Negates intruder movement abilities upon entering room.';
      if (card.mechanicType === 'TRAP_MONSTER') return 'Disguised stone statue. Animates into elite heavy guardian when room locks are breached.';
      if (card.mechanicType === 'QUICK_PLAY_SPELL') return 'Targeted energy beam ability to dismantle trap runes and interrupt chain links.';
      if (card.mechanicType === 'HAND_TRAP') return 'Fast-reaction discard to negate and break active Chain Links during bullet-time.';
      return card.desc;
    }

    getCardClass(card) {
      if (card.type && card.type.includes('Trap')) return 'trap-frame';
      if (card.type && card.type.includes('Spell')) return 'spell-frame';
      return 'monster-frame';
    }

    getAttributeColor(attr) {
      switch (attr) {
        case 'DARK': return '#a855f7';
        case 'LIGHT': return '#ffd700';
        case 'FIRE': return '#ff3366';
        case 'WATER': return '#00f0ff';
        case 'EARTH': return '#eab308';
        case 'WIND': return '#00ff88';
        default: return '#94a3b8';
      }
    }

    updateResourceDisplays() {
      const engine = window.HeavenlyEngine;
      if (!engine) return;

      const creditsEl = document.getElementById('resCredits');
      const shardsEl = document.getElementById('resShards');
      const splEl = document.getElementById('resSPL');
      const scoreEl = document.getElementById('resHighScore');

      if (creditsEl) creditsEl.innerText = engine.credits;
      if (shardsEl) shardsEl.innerText = engine.aetherShards;
      if (splEl) splEl.innerText = engine.splTokens;
      if (scoreEl) scoreEl.innerText = engine.highScore;

      // Essence Tokens
      const darkEl = document.getElementById('essDark');
      const lightEl = document.getElementById('essLight');
      const earthEl = document.getElementById('essEarth');
      const fireEl = document.getElementById('essFire');
      const waterEl = document.getElementById('essWater');
      const windEl = document.getElementById('essWind');

      if (darkEl) darkEl.innerText = engine.essence.DARK;
      if (lightEl) lightEl.innerText = engine.essence.LIGHT;
      if (earthEl) earthEl.innerText = engine.essence.EARTH;
      if (fireEl) fireEl.innerText = engine.essence.FIRE;
      if (waterEl) waterEl.innerText = engine.essence.WATER;
      if (windEl) windEl.innerText = engine.essence.WIND;

      // Operative HP & Grace
      const hpEl = document.getElementById('operativeHpVal');
      const graceFill = document.getElementById('graceIntegrityFill');
      const graceVal = document.getElementById('graceIntegrityVal');

      if (hpEl) hpEl.innerText = `${engine.operative.hp}/${engine.operative.maxHp}`;
      if (graceFill && graceVal) {
        const val = engine.operative.graceIntegrity;
        graceFill.style.width = `${val}%`;
        graceVal.innerText = `${val}%`;
      }
    }

    appendLog(entry) {
      const logContainer = document.getElementById('terminalLogContainer');
      if (!logContainer) return;

      const row = document.createElement('div');
      row.className = 'log-entry';
      row.innerHTML = `
        <span class="log-time">[${entry.time}]</span>
        <span class="log-msg ${entry.type}">${entry.msg}</span>
      `;
      logContainer.appendChild(row);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }

  // Export singleton to window
  window.HeavenlyUI = new HeavenlyUIManager();

})(window);
