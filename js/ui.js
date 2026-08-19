/**
 * ============================================================================
 * HeavenlyBound - UI Controller & Canvas Renderer
 * ============================================================================
 */

(function(window) {
  'use strict';

  class HeavenlyUIManager {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.hoverGrid = { r: -1, c: -1 };
      this.logEntries = [];
      this.cellSize = 48;
    }

    init() {
      this.canvas = document.getElementById('sanctumCanvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvasListeners();
        this.renderCanvas();
      }

      this.setupPaletteListeners();
      this.setupSyncListener();
      this.updateResourceDisplays();
      this.renderIncursion();
      this.setupAudioTrigger();
    }

    setupAudioTrigger() {
      document.addEventListener('click', () => {
        if (window.HeavenlyEngine && window.HeavenlyEngine.sound) {
          window.HeavenlyEngine.sound.initCtx();
        }
      }, { once: true });
    }

    setupSyncListener() {
      if (window.HeavenlyApi) {
        window.HeavenlyApi.onSyncStateChange((event) => {
          const syncBadge = document.getElementById('syncStatusBadge');
          if (!syncBadge) return;

          if (event.status === 'syncing') {
            syncBadge.innerHTML = '⚡ Syncing...';
            syncBadge.className = 'panel-badge badge-outie';
          } else if (event.status === 'synced') {
            syncBadge.innerHTML = '☁️ Synced';
            syncBadge.className = 'panel-badge badge-innie';
          } else if (event.status === 'local_buffered') {
            syncBadge.innerHTML = '💾 Local Buffer';
            syncBadge.className = 'panel-badge';
          }
        });
      }
    }

    setupPaletteListeners() {
      const cards = document.querySelectorAll('.building-card');
      cards.forEach(card => {
        card.addEventListener('click', () => {
          const type = card.getAttribute('data-building');
          if (window.HeavenlyEngine.selectedBuildTool === type) {
            window.HeavenlyEngine.selectedBuildTool = null;
            card.classList.remove('active');
          } else {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            window.HeavenlyEngine.selectedBuildTool = type;
            window.HeavenlyEngine.sound.playClick();
          }
          this.renderCanvas();
        });
      });
    }

    setupCanvasListeners() {
      if (!this.canvas) return;

      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const c = Math.floor(x / this.cellSize);
        const r = Math.floor(y / this.cellSize);

        if (r >= 0 && r < window.HeavenlyEngine.gridRows && c >= 0 && c < window.HeavenlyEngine.gridCols) {
          this.hoverGrid = { r, c };
        } else {
          this.hoverGrid = { r: -1, c: -1 };
        }
        this.renderCanvas();
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.hoverGrid = { r: -1, c: -1 };
        this.renderCanvas();
      });

      this.canvas.addEventListener('click', () => {
        const { r, c } = this.hoverGrid;
        if (r >= 0 && c >= 0) {
          if (window.HeavenlyEngine.selectedBuildTool) {
            window.HeavenlyEngine.placeStructure(r, c, window.HeavenlyEngine.selectedBuildTool);
          } else {
            const struct = window.HeavenlyEngine.baseGrid[r][c];
            if (struct) {
              window.HeavenlyEngine.log(`Sector (${c + 1}, ${r + 1}): [${struct.name}] active. ${struct.buffDesc}`, 'info');
              window.HeavenlyEngine.sound.playClick();
            }
          }
        }
      });

      this.canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const { r, c } = this.hoverGrid;
        if (r >= 0 && c >= 0) {
          window.HeavenlyEngine.demolishStructure(r, c);
        }
      });
    }

    renderCanvas() {
      if (!this.canvas || !this.ctx) return;
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;
      const engine = window.HeavenlyEngine;

      // Clear Screen
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid Matrix
      ctx.lineWidth = 1;
      for (let r = 0; r < engine.gridRows; r++) {
        for (let c = 0; c < engine.gridCols; c++) {
          const x = c * this.cellSize;
          const y = r * this.cellSize;

          ctx.strokeStyle = '#162238';
          ctx.strokeRect(x, y, this.cellSize, this.cellSize);

          // Subtle dot center
          ctx.fillStyle = '#1e2f4a';
          ctx.fillRect(x + this.cellSize / 2 - 1, y + this.cellSize / 2 - 1, 2, 2);

          const struct = engine.baseGrid[r][c];
          if (struct) {
            // Draw Building Floor Aura
            ctx.fillStyle = struct.color + '22';
            ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);

            ctx.strokeStyle = struct.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 3, y + 3, this.cellSize - 6, this.cellSize - 6);

            // Icon
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(struct.icon || '🏛️', x + this.cellSize / 2, y + this.cellSize / 2);
          }
        }
      }

      // Draw Hover Ghost
      const { r, c } = this.hoverGrid;
      if (r >= 0 && c >= 0) {
        const x = c * this.cellSize;
        const y = r * this.cellSize;

        if (engine.selectedBuildTool) {
          const tool = window.HeavenlyEngine.baseGrid[r][c] ? '#ff2a55' : '#00f0ff';
          ctx.fillStyle = tool + '33';
          ctx.fillRect(x, y, this.cellSize, this.cellSize);
          ctx.strokeStyle = tool;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, this.cellSize, this.cellSize);
        } else {
          ctx.strokeStyle = '#ffd70088';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, this.cellSize, this.cellSize);
        }
      }
    }

    updateResourceDisplays() {
      const engine = window.HeavenlyEngine;
      if (!engine) return;

      const creditsEl = document.getElementById('resCredits');
      const shardsEl = document.getElementById('resShards');
      const energyEl = document.getElementById('resEnergy');
      const floorEl = document.getElementById('resFloor');
      const scoreEl = document.getElementById('resHighScore');

      if (creditsEl) creditsEl.innerText = engine.credits;
      if (shardsEl) shardsEl.innerText = engine.aetherShards;
      if (energyEl) energyEl.innerText = `${engine.energy}/${engine.maxEnergy}`;
      if (floorEl) floorEl.innerText = engine.dungeonFloor;
      if (scoreEl) scoreEl.innerText = engine.highScore;

      // Update Grace Integrity Bar
      const graceFill = document.getElementById('graceIntegrityFill');
      const graceVal = document.getElementById('graceIntegrityVal');
      if (graceFill && graceVal) {
        const integrity = engine.operative.graceIntegrity;
        graceFill.style.width = `${integrity}%`;
        graceVal.innerText = `${integrity}%`;

        graceFill.classList.remove('warning', 'critical');
        document.body.classList.remove('glitch-moderate', 'glitch-severe');

        if (integrity <= 25) {
          graceFill.classList.add('critical');
          document.body.classList.add('glitch-severe');
        } else if (integrity <= 50) {
          graceFill.classList.add('warning');
          document.body.classList.add('glitch-moderate');
        }
      }

      // Update Operative HP
      const hpVal = document.getElementById('operativeHpVal');
      if (hpVal) {
        hpVal.innerText = `${engine.operative.hp}/${engine.operative.maxHp}`;
      }
    }

    renderIncursion() {
      const engine = window.HeavenlyEngine;
      const incursionContainer = document.getElementById('incursionDungeonView');
      if (!incursionContainer) return;

      if (!engine.inRun) {
        incursionContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
            <div style="font-size: 2.5rem; color: var(--color-gold);">🕊️</div>
            <h3 style="font-size: 1.1rem; color: var(--color-gold);">Ascent Incursion Portal Ready</h3>
            <p style="color: var(--text-secondary); max-width: 360px; font-size: 0.85rem;">
              Deploy your Operative into the ethereal sub-level to harvest rare Aether Shards. Beware of memory decay!
            </p>
            <button class="btn btn-cyan" onclick="window.HeavenlyEngine.startIncursion()">
              🚀 INITIATE ASCENT RUN (FLOOR ${engine.dungeonFloor})
            </button>
          </div>
        `;
        return;
      }

      // Render 5x5 Dungeon Grid & Active Room Encounter
      let gridHtml = '<div class="dungeon-grid">';
      engine.incursionGrid.forEach((node, idx) => {
        const isCurrent = engine.currentNode && engine.currentNode.id === node.id;
        let nodeClasses = 'grid-node';
        if (node.fogged) nodeClasses += ' fogged';
        if (isCurrent) nodeClasses += ' active-node';
        if (node.cleared) nodeClasses += ' cleared';

        const content = node.fogged ? '❓' : (node.icon || '▪️');
        gridHtml += `
          <div class="${nodeClasses}" onclick="window.HeavenlyEngine.moveToNode(${idx})">
            <span>${content}</span>
          </div>
        `;
      });
      gridHtml += '</div>';

      // Render Current Room Encounter
      const current = engine.currentNode;
      let encounterHtml = '';

      if (current) {
        if (current.isExit) {
          encounterHtml = `
            <div class="encounter-card">
              <div class="encounter-title">
                <span>🚪 ${current.title}</span>
                <span class="panel-badge badge-outie">EXTRACTION READY</span>
              </div>
              <p class="encounter-desc">
                Harvested Loot: <strong>+${engine.incursionShardsLooted} Shards</strong>, <strong>+${engine.incursionCreditsLooted} Credits</strong>.
                Bank your findings back into the Sanctum storage before severance amnesia wipes your operative.
              </p>
              <button class="btn btn-gold" onclick="window.HeavenlyEngine.extractFromIncursion()">
                💎 SECURE & EXTRACT TO SANCTUM
              </button>
            </div>
          `;
        } else if (current.cleared) {
          encounterHtml = `
            <div class="encounter-card">
              <div class="encounter-title">
                <span>✅ ${current.title} [CLEARED]</span>
              </div>
              <p class="encounter-desc">Sector stabilized. Traverse to an adjacent room to continue incursion.</p>
            </div>
          `;
        } else {
          encounterHtml = `
            <div class="encounter-card">
              <div class="encounter-title">
                <span>${current.icon || '⚠️'} ${current.title}</span>
                <span class="panel-badge badge-innie">DC ${current.dc || 10}</span>
              </div>
              <p class="encounter-desc">${current.desc}</p>
              <div class="action-buttons-row">
                <button class="btn btn-cyan" onclick="window.HeavenlyEngine.executeD20Check('${current.statCheck}')">
                  🎲 Roll ${current.statName}
                </button>
                ${current.altCheck ? `
                  <button class="btn btn-outline" onclick="window.HeavenlyEngine.executeD20Check('${current.altCheck}')">
                    🎲 Roll ${current.altName}
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }
      }

      incursionContainer.innerHTML = `
        <div class="dungeon-container">
          ${gridHtml}
          ${encounterHtml}
        </div>
      `;
    }

    animateDiceRoll() {
      const dieEl = document.getElementById('d20DieDisplay');
      if (dieEl) {
        dieEl.classList.add('rolling');
        let counter = 0;
        const interval = setInterval(() => {
          dieEl.innerText = Math.floor(1 + Math.random() * 20);
          counter++;
          if (counter > 8) {
            clearInterval(interval);
            dieEl.classList.remove('rolling');
          }
        }, 80);
      }
    }

    appendLog(entry) {
      this.logEntries.push(entry);
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
