'use strict';
window.SA = window.SA || {};

SA.WorldView = class WorldView {
  constructor(containerEl) {
    this.el = containerEl;
    this._build();
  }

  _build() {
    this.el.innerHTML = `
      <div class="world-screen">
        <div class="world-header">
          <div class="hero-status-bar" id="wv-hero-bar">
            <span class="hero-status-name" id="wv-hero-name"></span>
            <span class="hero-status-level" id="wv-hero-level"></span>
            <div class="hero-status-xp">
              <span>XP</span>
              <div class="xp-track"><div class="xp-fill" id="wv-xp-fill"></div></div>
              <span id="wv-xp-val"></span>
            </div>
            <div class="hero-hp-mini">
              <span>HP</span>
              <div class="bar-track mini"><div class="bar-fill hp-fill" id="wv-hp-fill"></div></div>
            </div>
          </div>
          <div class="world-actions">
            <button class="btn-world-action" id="wv-btn-spellbook">📖 Grimoire</button>
            <button class="btn-world-action" id="wv-btn-hero">🧙 Hero</button>
          </div>
        </div>

        <h1 class="world-title">Spell Adventure</h1>
        <p class="world-subtitle">Choose an area to explore</p>

        <div class="zone-grid" id="wv-zone-grid"></div>
      </div>
    `;
  }

  show(saveData, { onZoneSelect, onSpellbook, onHero }) {
    this.saveData = saveData;
    this._onZoneSelect = onZoneSelect;
    this._onSpellbook  = onSpellbook;
    this._onHero       = onHero;

    this._updateHeroBar(saveData);
    this._renderZones(saveData);

    document.getElementById('wv-btn-spellbook')?.addEventListener('click', () => onSpellbook?.());
    document.getElementById('wv-btn-hero')?.addEventListener('click', () => onHero?.());
  }

  refresh(saveData) {
    this.saveData = saveData;
    this._updateHeroBar(saveData);
    this._renderZones(saveData);
  }

  _updateHeroBar(saveData) {
    const level = SA.getLevelFromXP(saveData.xp);
    const xpCur = saveData.xp - SA.getXPForLevel(level);
    const xpNxt = SA.getXPForNextLevel(level) - SA.getXPForLevel(level);
    const xpPct = Math.min(100, (xpCur / xpNxt) * 100);

    const stats  = SA.SaveManager.computeStats(saveData);

    document.getElementById('wv-hero-name').textContent  = saveData.heroName;
    document.getElementById('wv-hero-level').textContent = `Lv.${level}`;
    document.getElementById('wv-xp-val').textContent     = `${xpCur}/${xpNxt}`;
    document.getElementById('wv-xp-fill').style.width    = xpPct + '%';

    // HP is full on world map (restored after battle)
    document.getElementById('wv-hp-fill').style.width = '100%';
  }

  _renderZones(saveData) {
    const grid = document.getElementById('wv-zone-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const level = SA.getLevelFromXP(saveData.xp);

    for (const zone of SA.ZONES) {
      const locked = level < zone.requiredLevel;
      const progress = (saveData.zoneProgress || {})[zone.id] || 0;

      const card = document.createElement('div');
      card.className = `zone-card ${locked ? 'zone-locked' : 'zone-unlocked'} zone-theme-${zone.bgTheme}`;

      const enemyNames = zone.enemyIds.map(id => {
        const e = SA.ENEMIES_MAP[id];
        return e ? e.name : id;
      }).join(', ');

      card.innerHTML = `
        <div class="zone-card-bg"></div>
        <div class="zone-card-content">
          ${locked ? '<div class="zone-lock-badge">🔒</div>' : ''}
          <h3 class="zone-name">${zone.name}</h3>
          <p class="zone-desc">${zone.description}</p>
          <div class="zone-enemies">
            <span class="zone-enemy-label">Enemies:</span>
            <span class="zone-enemy-names">${enemyNames}</span>
          </div>
          <div class="zone-req">
            ${locked
              ? `<span class="zone-req-locked">Requires Level ${zone.requiredLevel}</span>`
              : `<span class="zone-req-ok">✓ Available</span>`
            }
          </div>
          ${!locked ? `
            <button class="btn-enter-zone" data-zone="${zone.id}">
              ⚔️ Enter Zone
            </button>
          ` : ''}
        </div>
        ${locked ? '<div class="zone-lock-overlay"></div>' : ''}
      `;

      if (!locked) {
        card.querySelector('.btn-enter-zone').addEventListener('click', (e) => {
          e.stopPropagation();
          this._selectEnemy(zone, saveData);
        });
      }

      grid.appendChild(card);
    }
  }

  _selectEnemy(zone, saveData) {
    // Show enemy selection modal
    const level = SA.getLevelFromXP(saveData.xp);
    const modal = document.createElement('div');
    modal.className = 'zone-enemy-modal';
    modal.innerHTML = `
      <div class="zone-enemy-modal-inner">
        <h3>${zone.name}</h3>
        <p>Choose your opponent:</p>
        <div class="zone-enemy-list" id="zel-list"></div>
        <button class="btn-cancel-zone" id="zel-cancel">Cancel</button>
      </div>
    `;

    const list = modal.querySelector('#zel-list');
    for (const enemyId of zone.enemyIds) {
      const def = SA.ENEMIES_MAP[enemyId];
      if (!def) continue;
      const enemyLevel = Math.max(def.levelRange[0], Math.min(def.levelRange[1], level));

      const elDef = SA.ELEMENTS[def.element] || {};
      const btn   = document.createElement('button');
      btn.className = 'zone-enemy-btn';
      btn.innerHTML = `
        <span class="ze-name">${def.name}</span>
        <span class="ze-level" style="color:${elDef.color}">Lv.${enemyLevel} ${elDef.emoji} ${elDef.name}</span>
        <span class="ze-lore">${def.lore}</span>
      `;
      btn.addEventListener('click', () => {
        modal.remove();
        this._onZoneSelect?.(def, enemyLevel);
      });
      list.appendChild(btn);
    }

    modal.querySelector('#zel-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    this.el.appendChild(modal);
  }
};
