'use strict';
window.SA = window.SA || {};

SA.BattleView = class BattleView {
  constructor(containerEl) {
    this.el = containerEl;
    this.engine = null;
    this.heroAnim  = null;
    this.enemyAnim = null;
    this._subs = [];  // EventBus unsubscribers

    this._build();
  }

  // ── DOM CONSTRUCTION ───────────────────────────────────────────────────────
  _build() {
    this.el.innerHTML = `
      <div class="battle-arena">
        <!-- ENEMY SECTION (top-right) -->
        <div class="battle-enemy-section">
          <div class="entity-hud enemy-hud">
            <div class="hud-name-row">
              <span class="hud-name" id="b-enemy-name">Enemy</span>
              <span class="hud-level" id="b-enemy-level">Lv.1</span>
              <span class="hud-element" id="b-enemy-element"></span>
            </div>
            <div class="hud-bar-row">
              <span class="bar-label">HP</span>
              <div class="bar-track"><div class="bar-fill hp-fill" id="b-enemy-hp-bar"></div></div>
              <span class="bar-value" id="b-enemy-hp-val">??/??</span>
            </div>
            <div class="status-effects" id="b-enemy-statuses"></div>
          </div>
          <div class="sprite-container enemy-sprite-container">
            <canvas id="b-enemy-canvas" class="battle-sprite enemy-canvas"></canvas>
          </div>
        </div>

        <!-- ARENA GROUND -->
        <div class="arena-ground">
          <div class="arena-bg-layer"></div>
        </div>

        <!-- HERO SECTION (bottom-left) -->
        <div class="battle-hero-section">
          <div class="sprite-container hero-sprite-container">
            <canvas id="b-hero-canvas" class="battle-sprite hero-canvas"></canvas>
          </div>
          <div class="entity-hud hero-hud">
            <div class="hud-name-row">
              <span class="hud-name" id="b-hero-name">Hero</span>
              <span class="hud-level" id="b-hero-level">Lv.1</span>
            </div>
            <div class="hud-bar-row">
              <span class="bar-label">HP</span>
              <div class="bar-track"><div class="bar-fill hp-fill" id="b-hero-hp-bar"></div></div>
              <span class="bar-value" id="b-hero-hp-val">100/100</span>
            </div>
            <div class="hud-bar-row">
              <span class="bar-label">MP</span>
              <div class="bar-track"><div class="bar-fill mp-fill" id="b-hero-mp-bar"></div></div>
              <span class="bar-value" id="b-hero-mp-val">5/5</span>
            </div>
            <div class="status-effects" id="b-hero-statuses"></div>
          </div>
        </div>
      </div>

      <!-- BATTLE UI BOTTOM -->
      <div class="battle-ui">
        <div class="battle-log-panel">
          <div class="battle-log" id="b-log"></div>
        </div>
        <div class="battle-action-panel">
          <div class="action-header" id="b-action-header">Select a spell</div>
          <div class="spell-grid" id="b-spell-grid"></div>
        </div>
      </div>

      <!-- DAMAGE NUMBER OVERLAY -->
      <div class="damage-overlay" id="b-damage-overlay"></div>

      <!-- GLOBAL SPELL TOOLTIP (fixed, never clipped) -->
      <div id="b-tooltip"></div>
    `;
  }

  // ── PUBLIC ─────────────────────────────────────────────────────────────────
  startBattle(engine) {
    this.engine = engine;
    this._subscribeEvents();

    const { hero, enemy } = engine;

    // Init animators
    const heroScale  = window.innerWidth < 500 ? 3 : 4;
    const enemyScale = window.innerWidth < 500 ? 3 : 4;

    this.heroAnim  = new SA.Animator(document.getElementById('b-hero-canvas'),  heroScale);
    this.enemyAnim = new SA.Animator(document.getElementById('b-enemy-canvas'), enemyScale);

    // Initial display
    this._updateHeroHUD(hero);
    this._updateEnemyHUD(enemy);
    this._buildSpellGrid(hero);
    this._setActionHeader('Waiting...', false);

    // Start idle animations
    this.heroAnim.play(hero.animData.anims.idle);
    this.enemyAnim.play(enemy.animData.idle);

    // Disable spell grid until hero's turn
    this._setSpellGridEnabled(false);
  }

  cleanup() {
    this._subs.forEach(fn => fn());
    this._subs = [];
    if (this.heroAnim)  { this.heroAnim.destroy();  this.heroAnim  = null; }
    if (this.enemyAnim) { this.enemyAnim.destroy(); this.enemyAnim = null; }
  }

  // ── EVENT SUBSCRIPTIONS ────────────────────────────────────────────────────
  _subscribeEvents() {
    const on = (ev, fn) => { this._subs.push(SA.EventBus.on(ev, fn)); };

    on('battle:log', ({ msg }) => this._appendLog(msg));

    on('battle:await_input', ({ hero }) => {
      this._buildSpellGrid(hero);
      this._setSpellGridEnabled(true);
      this._setActionHeader('⚔️ Choose your spell!', true);
    });

    on('battle:cast', ({ actor, spell, animType }) => {
      this._setSpellGridEnabled(false);
      this._setActionHeader(`✨ ${spell.name}!`, false);
      const anim = actor === 'hero' ? this.heroAnim : this.enemyAnim;
      const animSet = actor === 'hero' ? this.engine.hero.animData.anims : this.engine.enemy.animData;
      const animKey = animType === 'attack' ? 'attack' : (animSet.cast ? 'cast' : 'attack');
      anim.play(animSet[animKey] || animSet.attack, () => {
        // Return to idle after action
        anim.play(animSet.idle);
      });
    });

    on('battle:damage', ({ target, amount, crit, element }) => {
      const isHero = target === 'hero';
      this._showDamageNumber(amount, crit, element, isHero);
      if (isHero) {
        this._shakeElement(document.querySelector('.hero-hud'));
        this._updateHeroHUD(this.engine.hero);
        // Play hurt animation
        if (this.engine.hero.isAlive && this.heroAnim) {
          const anims = this.engine.hero.animData.anims;
          this.heroAnim.play(anims.hurt, () => this.heroAnim.play(anims.idle));
        }
      } else {
        this._shakeElement(document.querySelector('.enemy-hud'));
        this._updateEnemyHUD(this.engine.enemy);
        if (this.engine.enemy.isAlive && this.enemyAnim) {
          const ad = this.engine.enemy.animData;
          this.enemyAnim.play(ad.hurt, () => this.enemyAnim.play(ad.idle));
        }
      }
    });

    on('battle:heal', ({ target, amount }) => {
      this._showHealNumber(amount, target === 'hero');
      if (target === 'hero') this._updateHeroHUD(this.engine.hero);
      else this._updateEnemyHUD(this.engine.enemy);
    });

    on('battle:mana', ({ target }) => {
      if (target === 'hero') this._updateHeroHUD(this.engine.hero);
    });

    on('battle:status', ({ target }) => {
      if (target === 'hero') this._updateHeroHUD(this.engine.hero);
      else this._updateEnemyHUD(this.engine.enemy);
    });

    on('battle:status_damage', ({ target, amount, statusId }) => {
      const isHero = target === 'hero';
      const def = SA.STATUS_EFFECTS[statusId];
      this._showDamageNumber(amount, false, def?.color || '#ff6b35', isHero);
      if (isHero) this._updateHeroHUD(this.engine.hero);
      else this._updateEnemyHUD(this.engine.enemy);
    });

    on('battle:die', ({ target }) => {
      const isHero = target === 'hero';
      const anim = isHero ? this.heroAnim : this.enemyAnim;
      const anims = isHero ? this.engine.hero.animData.anims : this.engine.enemy.animData;
      if (anim) anim.play(anims.death);
    });

    on('battle:turn_change', ({ actor }) => {
      if (actor !== 'hero') {
        this._setSpellGridEnabled(false);
        this._setActionHeader(`${this.engine.enemy.name} is thinking...`, false);
      }
    });

    on('battle:update_ui', ({ hero, enemy }) => {
      this._updateHeroHUD(hero);
      this._updateEnemyHUD(enemy);
    });
  }

  // ── HUD UPDATES ────────────────────────────────────────────────────────────
  _updateHeroHUD(hero) {
    document.getElementById('b-hero-name').textContent  = hero.name;
    document.getElementById('b-hero-level').textContent = `Lv.${hero.level}`;
    this._setBar('b-hero-hp-bar',  'b-hero-hp-val',  hero.stats.hp,   hero.stats.maxHp, 'HP');
    this._setBar('b-hero-mp-bar',  'b-hero-mp-val',  hero.stats.mana, hero.stats.maxMana, 'MP');
    this._renderStatuses(document.getElementById('b-hero-statuses'), hero.statusEffects);
  }

  _updateEnemyHUD(enemy) {
    document.getElementById('b-enemy-name').textContent    = enemy.name;
    document.getElementById('b-enemy-level').textContent   = `Lv.${enemy.level}`;
    const elDef = SA.ELEMENTS[enemy.element] || {};
    const elSpan = document.getElementById('b-enemy-element');
    elSpan.textContent = `${elDef.emoji || ''} ${elDef.name || ''}`;
    elSpan.style.color = elDef.color || '#ccc';
    this._setBar('b-enemy-hp-bar', 'b-enemy-hp-val', enemy.stats.hp, enemy.stats.maxHp, 'HP');
    this._renderStatuses(document.getElementById('b-enemy-statuses'), enemy.statusEffects);
  }

  _setBar(barId, valId, current, max, label) {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    const bar  = document.getElementById(barId);
    const val  = document.getElementById(valId);
    if (bar) {
      bar.style.width = pct + '%';
      if (label === 'HP') {
        if (pct > 60) bar.style.background = 'var(--hp-high)';
        else if (pct > 25) bar.style.background = 'var(--hp-mid)';
        else bar.style.background = 'var(--hp-low)';
      }
    }
    if (val) val.textContent = `${Math.max(0, current)}/${max}`;
  }

  _renderStatuses(container, statuses) {
    if (!container) return;
    container.innerHTML = '';
    for (const status of statuses) {
      const def = SA.STATUS_EFFECTS[status.id];
      if (!def) continue;
      const chip = document.createElement('span');
      chip.className = 'status-chip';
      chip.style.setProperty('--status-color', def.color);
      chip.style.background = def.bgColor;
      chip.style.borderColor = def.color;
      chip.title = `${def.name} (${status.turnsLeft} turns)`;
      chip.innerHTML = `${def.emoji}<span class="status-turns">${status.turnsLeft}</span>`;
      container.appendChild(chip);
    }
  }

  // ── SPELL GRID ─────────────────────────────────────────────────────────────
  _buildSpellGrid(hero) {
    const grid = document.getElementById('b-spell-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Hide tooltip when rebuilding
    const tip = document.getElementById('b-tooltip');
    if (tip) tip.classList.remove('visible');

    for (const spell of hero.spells) {
      const canUse  = hero.canUseSpell(spell);
      const cd      = hero.getCooldown(spell.id);
      const elDef   = SA.ELEMENTS[spell.element] || {};
      const rarDef  = SA.RARITY[spell.rarity]   || {};
      const fxLine  = this._getSpellEffectLine(spell);

      const card = document.createElement('button');
      card.className = `spell-card ${canUse ? '' : 'spell-disabled'}`;
      card.dataset.spellId = spell.id;
      card.style.setProperty('--rarity-color', rarDef.color || '#9ca3af');
      card.style.setProperty('--rarity-glow',  rarDef.glow  || 'transparent');
      card.style.setProperty('--el-color', elDef.color || '#ccc');

      const iconHtml = spell.iconFile
        ? `<img src="Assets/Assets_Spells/PNG/Icons/${spell.iconFile}_big.png" class="spell-icon-img" alt="${spell.name}">`
        : `<div class="spell-icon-fallback">⚔️</div>`;

      card.innerHTML = `
        <div class="spell-card-inner">
          <div class="spell-icon">${iconHtml}</div>
          <div class="spell-info">
            <div class="spell-name">${spell.name}</div>
            <div class="spell-effect-line">${fxLine}</div>
            <div class="spell-meta">
              <span class="spell-element" style="color:${elDef.color}">${elDef.emoji || ''} ${elDef.name || ''}</span>
              <span class="spell-cost">${spell.manaCost > 0 ? `💎${spell.manaCost}` : 'Free'}</span>
            </div>
          </div>
          ${cd > 0 ? `<div class="spell-cooldown-overlay"><span>CD: ${cd}</span></div>` : ''}
          ${!hero.canAffordSpell(spell) && cd === 0 ? '<div class="spell-nomana-overlay"><span>No MP</span></div>' : ''}
        </div>
      `;

      if (canUse) {
        card.addEventListener('click', () => {
          if (this.engine && this.engine.awaitingInput) {
            this.engine.heroAction(spell.id);
          }
        });
      }

      // Global fixed tooltip — no overflow issues
      card.addEventListener('mouseenter', (e) => {
        if (!tip) return;
        const cdText = spell.cooldown === 0 ? 'None' : spell.cooldown + ' turns';
        tip.innerHTML = `<strong style="color:${rarDef.color}">${spell.name}</strong> · ${rarDef.name || 'Common'}<br>
          <span style="color:${elDef.color}">${elDef.emoji || ''} ${elDef.name || ''}</span><br>
          ${spell.description}<br>
          <small style="color:#64748b">Cooldown: ${cdText}</small>`;
        tip.style.borderColor = rarDef.color || '#7c3aed';
        tip.classList.add('visible');
        this._positionTooltip(tip, card);
      });
      card.addEventListener('mouseleave', () => {
        if (tip) tip.classList.remove('visible');
      });

      grid.appendChild(card);
    }
  }

  _positionTooltip(tip, card) {
    const rect = card.getBoundingClientRect();
    const tipW = 210;
    const tipH = 120; // estimate
    let left = rect.left + rect.width / 2 - tipW / 2;
    let top  = rect.top - tipH - 8;

    // Clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
    if (top < 8) top = rect.bottom + 8;

    tip.style.left = left + 'px';
    tip.style.top  = top + 'px';
  }

  _getSpellEffectLine(spell) {
    const parts = [];
    for (const e of spell.effects) {
      if (e.type === 'damage') {
        parts.push(`${Math.round(e.power * 100)}% ATK`);
      } else if (e.type === 'status') {
        const def = SA.STATUS_EFFECTS[e.statusId];
        const pct = Math.round((e.chance || 1) * 100);
        parts.push(`${pct < 100 ? pct + '% ' : ''}${def?.emoji || ''}${def?.name || e.statusId}`);
      } else if (e.type === 'heal') {
        if (e.basedOn === 'maxHp') parts.push(`Heal ${Math.round(e.power * 100)}% HP`);
        else if (e.amount) parts.push(`+${e.amount} HP`);
      } else if (e.type === 'mana') {
        parts.push(`+${e.amount} MP`);
      } else if (e.type === 'mana_steal') {
        parts.push(`Steal ${e.amount} MP`);
      } else if (e.type === 'blood_pact') {
        parts.push(`HP×${e.multiplier} shadow`);
      }
    }
    return parts.join(' · ');
  }

  _setSpellGridEnabled(enabled) {
    const grid = document.getElementById('b-spell-grid');
    if (!grid) return;
    grid.classList.toggle('spell-grid-disabled', !enabled);
    grid.querySelectorAll('.spell-card').forEach(c => {
      c.disabled = !enabled || c.classList.contains('spell-disabled');
    });
  }

  _setActionHeader(text, active) {
    const el = document.getElementById('b-action-header');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('header-active', !!active);
  }

  // ── FLOATING NUMBERS ───────────────────────────────────────────────────────
  _showDamageNumber(amount, crit, element, isHero) {
    const overlay = document.getElementById('b-damage-overlay');
    if (!overlay) return;

    const el = document.createElement('div');
    el.className = `float-num ${isHero ? 'float-hero-side' : 'float-enemy-side'} ${crit ? 'float-crit' : ''}`;

    const elDef = SA.ELEMENTS[element];
    el.style.color = elDef?.color || (crit ? '#fde68a' : '#f87171');
    el.textContent = `-${amount}`;
    if (crit) el.textContent = `⚡-${amount}`;

    overlay.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  _showHealNumber(amount, isHero) {
    const overlay = document.getElementById('b-damage-overlay');
    if (!overlay) return;
    const el = document.createElement('div');
    el.className = `float-num float-heal ${isHero ? 'float-hero-side' : 'float-enemy-side'}`;
    el.textContent = `+${amount}`;
    overlay.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  // ── VISUAL FX ──────────────────────────────────────────────────────────────
  _shakeElement(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;  // reflow to restart animation
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }

  // ── LOG ────────────────────────────────────────────────────────────────────
  _appendLog(msg) {
    const log = document.getElementById('b-log');
    if (!log) return;
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = msg;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;

    // Keep only last 30 lines
    while (log.children.length > 30) log.removeChild(log.firstChild);
  }
};
