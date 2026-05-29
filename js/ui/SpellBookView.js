'use strict';
window.SA = window.SA || {};

SA.SpellBookView = class SpellBookView {
  constructor(containerEl) {
    this.el = containerEl;
    this.saveData = null;
    this.bookAnim = null;
    this.currentPage = 0;
    this.spellsPerPage = 6;
    this._build();
  }

  _build() {
    this.el.innerHTML = `
      <div class="spellbook-screen">
        <!-- Book cover / animation -->
        <div class="book-wrapper">
          <canvas id="sb-book-canvas" class="book-canvas"></canvas>
        </div>

        <!-- Spell list (overlaid on book) -->
        <div class="spellbook-content">
          <div class="sb-header">
            <h2 class="sb-title">📖 Grimoire</h2>
            <div class="sb-tabs">
              <button class="sb-tab active" data-tab="collected">Collected</button>
              <button class="sb-tab" data-tab="equipped">Equipped</button>
            </div>
          </div>

          <div class="sb-spell-list" id="sb-spell-list"></div>

          <div class="sb-pagination">
            <button class="sb-page-btn" id="sb-prev">◀ Prev</button>
            <span class="sb-page-info" id="sb-page-info">Page 1/1</span>
            <button class="sb-page-btn" id="sb-next">Next ▶</button>
          </div>

          <div class="sb-equip-hint" id="sb-equip-hint">
            Click a spell to equip/unequip it (max 6 equipped)
          </div>
        </div>
      </div>
    `;
  }

  show(saveData) {
    this.saveData    = saveData;
    this.currentTab  = 'collected';
    this.currentPage = 0;

    // Book animation
    const canvas = document.getElementById('sb-book-canvas');
    if (canvas) {
      this.bookAnim = new SA.BookAnimator(canvas, 220);
      this.bookAnim.play('open', () => {
        this.bookAnim.showFrame('open', 11); // stay on last open frame
      });
    }

    // Bind tabs
    this.el.querySelectorAll('.sb-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.el.querySelectorAll('.sb-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentTab  = tab.dataset.tab;
        this.currentPage = 0;
        this._renderSpells();
      });
    });

    // Pagination
    document.getElementById('sb-prev')?.addEventListener('click', () => {
      if (this.currentPage > 0) { this.currentPage--; this._renderSpells(); }
    });
    document.getElementById('sb-next')?.addEventListener('click', () => {
      const total = this._getSpells().length;
      const pages = Math.ceil(total / this.spellsPerPage);
      if (this.currentPage < pages - 1) { this.currentPage++; this._renderSpells(); }
    });

    this._renderSpells();
  }

  _getSpells() {
    if (this.currentTab === 'equipped') {
      return (this.saveData.equippedSpellIds || []).map(id => SA.SPELLS_MAP[id]).filter(Boolean);
    }
    return (this.saveData.collectedSpellIds || []).map(id => SA.SPELLS_MAP[id]).filter(Boolean);
  }

  _renderSpells() {
    const list   = document.getElementById('sb-spell-list');
    const info   = document.getElementById('sb-page-info');
    if (!list) return;

    const spells = this._getSpells();
    const pages  = Math.max(1, Math.ceil(spells.length / this.spellsPerPage));
    this.currentPage = Math.min(this.currentPage, pages - 1);

    const start  = this.currentPage * this.spellsPerPage;
    const page   = spells.slice(start, start + this.spellsPerPage);

    list.innerHTML = '';
    info.textContent = `Page ${this.currentPage + 1}/${pages}`;

    if (page.length === 0) {
      list.innerHTML = '<div class="sb-empty">No spells yet. Defeat enemies to collect spells!</div>';
      return;
    }

    for (const spell of page) {
      const elDef  = SA.ELEMENTS[spell.element] || {};
      const rarDef = SA.RARITY[spell.rarity]    || {};
      const isEquipped = this.saveData.equippedSpellIds.includes(spell.id);

      const card = document.createElement('div');
      card.className = `sb-spell-card ${isEquipped ? 'sb-equipped' : ''}`;
      card.style.setProperty('--rarity-color', rarDef.color || '#9ca3af');
      card.style.setProperty('--el-color',     elDef.color  || '#ccc');

      const iconHtml = spell.iconFile
        ? `<img src="Assets/Assets_Spells/PNG/Icons/${spell.iconFile}_big.png" class="sb-spell-icon" alt="${spell.name}">`
        : `<div class="sb-spell-icon-fallback">⚔️</div>`;

      card.innerHTML = `
        <div class="sb-spell-icon-wrap">${iconHtml}</div>
        <div class="sb-spell-details">
          <div class="sb-spell-name">
            ${spell.name}
            <span class="sb-rarity-badge" style="color:${rarDef.color}">${rarDef.name || 'Common'}</span>
          </div>
          <div class="sb-spell-element" style="color:${elDef.color}">${elDef.emoji || ''} ${elDef.name || ''}</div>
          <div class="sb-spell-desc">${spell.description}</div>
          <div class="sb-spell-stats">
            <span class="sb-cost">💎 ${spell.manaCost === 0 ? 'Free' : spell.manaCost + ' MP'}</span>
            <span class="sb-cd">⏱ ${spell.cooldown === 0 ? 'No CD' : spell.cooldown + ' turn CD'}</span>
            <span class="sb-target">${spell.target === 'self' ? '🧙 Self' : '⚔️ Enemy'}</span>
          </div>
        </div>
        ${isEquipped ? '<div class="sb-equipped-badge">EQUIPPED</div>' : ''}
      `;

      // Equip/unequip toggle
      card.addEventListener('click', () => this._toggleEquip(spell.id, card));
      list.appendChild(card);
    }

    // Update equip hint
    const equippedCount = this.saveData.equippedSpellIds.length;
    const hint = document.getElementById('sb-equip-hint');
    if (hint) {
      hint.textContent = `Equipped: ${equippedCount}/6 spells`;
      hint.style.color = equippedCount >= 6 ? 'var(--rarity-rare)' : 'var(--text-secondary)';
    }
  }

  _toggleEquip(spellId, cardEl) {
    const equipped = this.saveData.equippedSpellIds;
    const isEquipped = equipped.includes(spellId);

    if (isEquipped) {
      // Unequip — but keep at least 1 spell (strike)
      if (equipped.length <= 1) {
        this._showToast('You must keep at least one spell equipped!');
        return;
      }
      this.saveData.equippedSpellIds = equipped.filter(id => id !== spellId);
    } else {
      if (equipped.length >= 6) {
        this._showToast('Already 6 spells equipped! Unequip one first.');
        return;
      }
      this.saveData.equippedSpellIds = [...equipped, spellId];
    }

    SA.SaveManager.save(this.saveData);
    this._renderSpells();
  }

  _showToast(msg) {
    const t = document.createElement('div');
    t.className = 'sb-toast';
    t.textContent = msg;
    this.el.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  hide() {
    if (this.bookAnim) {
      this.bookAnim.destroy();
      this.bookAnim = null;
    }
  }
};
