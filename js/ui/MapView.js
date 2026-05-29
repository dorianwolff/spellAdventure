'use strict';
window.SA = window.SA || {};

// ─── MAP EXPLORER VIEW ────────────────────────────────────────────────────────
// Pokemon-style top-down map with tile movement, sprite animation, camera.

SA.MapView = class MapView {
  constructor(containerEl) {
    this.el = containerEl;
    this._anim         = null;
    this._loopId       = null;
    this._moveInterval = null;
    this._moveRepeat   = null;
    this._keysDown     = {};
    this._moving       = false;
    this._facing       = 'down';
    this._notifTimer   = null;
  }

  show(mapId, saveData, { onBattle, onSpellbook, onHero, onMapChange }) {
    this.mapId     = mapId;
    this.mapDef    = SA.MAPS[mapId];
    this.saveData  = saveData;
    this.onBattle  = onBattle;
    this.onSpellbook = onSpellbook;
    this.onHero    = onHero;
    this.onMapChange = onMapChange;

    if (!this.mapDef) { console.error('Unknown map:', mapId); return; }

    this._heroTx = this.mapDef.heroStart.tx;
    this._heroTy = this.mapDef.heroStart.ty;

    this._build();
    this._initHeroSprite();
    this._updateCamera(true);
    this._bindControls();
  }

  cleanup() {
    this._unbindControls();
    if (this._anim)        { this._anim.destroy(); this._anim = null; }
    if (this._moveInterval){ clearInterval(this._moveInterval); this._moveInterval = null; }
    if (this._moveRepeat)  { clearTimeout(this._moveRepeat);   this._moveRepeat = null; }
    if (this._notifTimer)  { clearTimeout(this._notifTimer);   this._notifTimer = null; }
  }

  // ── DOM CONSTRUCTION ───────────────────────────────────────────────────────
  _build() {
    const { mapDef, saveData } = this;
    const TILE = mapDef.tileSize;
    const worldW = mapDef.cols * TILE;
    const worldH = mapDef.rows * TILE;
    const level  = SA.getLevelFromXP(saveData.xp);

    // Build object HTML
    const objectsHtml = mapDef.objects.map(obj => {
      const isCollected = (saveData.mapState?.[mapDef.id]?.collected || []).includes(obj.id);
      if (isCollected && obj.type !== 'encounter' && obj.type !== 'portal') return '';

      const px = obj.tx * TILE;
      const py = obj.ty * TILE;
      const sz = obj.imageSize || 64;
      const cls = `map-obj map-obj-${obj.type}${isCollected ? ' map-obj-done' : ''}`;

      return `<div class="${cls}" data-id="${obj.id}"
        style="left:${px}px; top:${py}px; width:${sz}px; height:${sz}px;">
        <img src="${obj.image}" alt="${obj.label}" style="width:${sz}px;height:${sz}px;" draggable="false">
        <div class="map-obj-label">${obj.label}</div>
      </div>`;
    }).join('');

    this.el.innerHTML = `
      <div class="map-screen">
        <!-- HUD overlay -->
        <div class="map-hud">
          <div class="map-hud-left">
            <div class="map-zone-name">${mapDef.name}</div>
            <div class="map-hero-info">
              <span class="map-hero-name">${saveData.heroName}</span>
              <span class="map-hero-level">Lv.${level}</span>
            </div>
          </div>
          <div class="map-hud-right">
            <div class="map-gold">💰 <span id="mv-gold">${saveData.gold || 0}</span></div>
            <button class="map-btn" id="mv-spellbook">📖</button>
            <button class="map-btn" id="mv-hero">🧙</button>
          </div>
        </div>

        <!-- Notification popup -->
        <div class="map-notification" id="mv-notif"></div>

        <!-- Interaction prompt -->
        <div class="map-interact-prompt" id="mv-prompt" style="display:none">
          <span id="mv-prompt-text"></span>
          <kbd>E</kbd>
        </div>

        <!-- Scrollable world viewport -->
        <div class="map-viewport" id="mv-viewport">
          <div class="map-world" id="mv-world"
            style="width:${worldW}px; height:${worldH}px; background-color:${mapDef.bgColor}; background-image:url('${mapDef.groundImage}');">

            <!-- Map objects -->
            ${objectsHtml}

            <!-- Hero canvas -->
            <canvas id="mv-hero-canvas" class="map-hero-canvas"></canvas>
          </div>
        </div>

        <!-- Mobile D-pad -->
        <div class="map-dpad" id="mv-dpad">
          <button class="dpad-btn dpad-up"    data-dir="up">▲</button>
          <button class="dpad-btn dpad-left"  data-dir="left">◀</button>
          <button class="dpad-btn dpad-down"  data-dir="down">▼</button>
          <button class="dpad-btn dpad-right" data-dir="right">▶</button>
          <button class="dpad-btn dpad-act"   id="mv-act-btn">⚡</button>
        </div>
      </div>
    `;

    // Wire HUD buttons
    document.getElementById('mv-spellbook')?.addEventListener('click', () => this.onSpellbook?.());
    document.getElementById('mv-hero')?.addEventListener('click',      () => this.onHero?.());

    // Wire D-pad
    this._bindDpad();
  }

  // ── HERO SPRITE ────────────────────────────────────────────────────────────
  _initHeroSprite() {
    const canvas = document.getElementById('mv-hero-canvas');
    if (!canvas) return;

    const level = SA.getLevelFromXP(this.saveData.xp);
    const animSet = SA.getHeroAnims(level);
    const folder  = animSet.folder;

    const base = 'Assets/Assets_Hero/PNG/';
    // Walk sheet: 384×256, 6 cols × 4 rows
    const walkSheet = `${base}${folder}/With_shadow/${folder}_Walk_with_shadow.png`;

    this._walkAnims = {
      down:  { sheet: walkSheet, w: 384, h: 256, cols: 6, row: 0, fps: 8, loop: true },
      left:  { sheet: walkSheet, w: 384, h: 256, cols: 6, row: 1, fps: 8, loop: true },
      right: { sheet: walkSheet, w: 384, h: 256, cols: 6, row: 2, fps: 8, loop: true },
      up:    { sheet: walkSheet, w: 384, h: 256, cols: 6, row: 3, fps: 8, loop: true }
    };
    this._idleAnim = { sheet: walkSheet, w: 384, h: 256, cols: 6, row: 0, fps: 4, loop: true };

    const TILE = this.mapDef.tileSize;
    this._anim = new SA.Animator(canvas, 2);

    // Position hero canvas
    this._positionHeroCanvas();
    this._anim.play(this._idleAnim);
  }

  _positionHeroCanvas() {
    const canvas = document.getElementById('mv-hero-canvas');
    if (!canvas) return;
    const TILE = this.mapDef.tileSize;
    // Hero canvas is 128×128 (64px × scale 2), center on tile
    const offset = (canvas.width - TILE) / 2;
    canvas.style.left = (this._heroTx * TILE - offset) + 'px';
    canvas.style.top  = (this._heroTy * TILE - offset) + 'px';
  }

  // ── CAMERA ─────────────────────────────────────────────────────────────────
  _updateCamera(instant) {
    const viewport = document.getElementById('mv-viewport');
    const world    = document.getElementById('mv-world');
    if (!viewport || !world) return;

    const TILE = this.mapDef.tileSize;
    const vW   = viewport.clientWidth;
    const vH   = viewport.clientHeight;
    const wW   = this.mapDef.cols * TILE;
    const wH   = this.mapDef.rows * TILE;

    // Center camera on hero
    const heroPixelX = this._heroTx * TILE + TILE / 2;
    const heroPixelY = this._heroTy * TILE + TILE / 2;

    let camX = heroPixelX - vW / 2;
    let camY = heroPixelY - vH / 2;
    camX = Math.max(0, Math.min(camX, wW - vW));
    camY = Math.max(0, Math.min(camY, wH - vH));

    world.style.transition = instant ? 'none' : 'transform 0.12s linear';
    world.style.transform  = `translate(${-camX}px, ${-camY}px)`;
  }

  // ── MOVEMENT ───────────────────────────────────────────────────────────────
  _tryMove(dir) {
    if (this._moving) return;

    const DIRS = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
    const [dx, dy] = DIRS[dir] || [0,0];
    const newTx = this._heroTx + dx;
    const newTy = this._heroTy + dy;

    // Bounds check
    if (newTx < 0 || newTx >= this.mapDef.cols) return;
    if (newTy < 0 || newTy >= this.mapDef.rows) return;

    // Set facing direction
    this._facing = dir;
    this._moving = true;

    // Play walk animation
    if (this._anim && this._walkAnims) {
      this._anim.play(this._walkAnims[dir]);
    }

    this._heroTx = newTx;
    this._heroTy = newTy;
    this._positionHeroCanvas();
    this._updateCamera(false);

    // Check interactions at new position
    this._checkInteraction();

    setTimeout(() => {
      this._moving = false;
      // Return to idle if no key held
      if (!Object.values(this._keysDown).some(Boolean)) {
        if (this._anim && this._idleAnim) this._anim.play(this._idleAnim);
      }
    }, 140);
  }

  // ── INTERACTION ────────────────────────────────────────────────────────────
  _checkInteraction() {
    const { mapDef, saveData } = this;
    const collected = saveData.mapState?.[mapDef.id]?.collected || [];

    let nearObj = null;
    let nearDist = 99;

    for (const obj of mapDef.objects) {
      // Skip collected non-repeatable objects
      if (collected.includes(obj.id) && obj.type !== 'encounter' && obj.type !== 'portal') continue;

      const dx = Math.abs(obj.tx - this._heroTx);
      const dy = Math.abs(obj.ty - this._heroTy);
      const dist = Math.max(dx, dy);

      if (dist === 0) {
        // Auto-trigger on same tile for portals
        if (obj.type === 'portal') {
          this._triggerObject(obj);
          return;
        }
        nearObj  = obj;
        nearDist = 0;
      } else if (dist === 1 && dist < nearDist) {
        nearObj  = obj;
        nearDist = dist;
      }
    }

    const prompt = document.getElementById('mv-prompt');
    const promptText = document.getElementById('mv-prompt-text');
    if (nearObj) {
      if (prompt) prompt.style.display = 'flex';
      if (promptText) promptText.textContent = nearObj.label;
      this._nearObj = nearObj;
    } else {
      if (prompt) prompt.style.display = 'none';
      this._nearObj = null;
    }
  }

  _triggerInteract() {
    if (this._nearObj) this._triggerObject(this._nearObj);
  }

  _triggerObject(obj) {
    const { mapDef, saveData } = this;
    if (!saveData.mapState) saveData.mapState = {};
    if (!saveData.mapState[mapDef.id]) saveData.mapState[mapDef.id] = { collected: [] };
    const collected = saveData.mapState[mapDef.id].collected;

    if (obj.type === 'spell') {
      if (collected.includes(obj.id)) return;
      collected.push(obj.id);
      this._markObjectCollected(obj.id);

      if (!saveData.collectedSpellIds.includes(obj.spellId)) {
        saveData.collectedSpellIds.push(obj.spellId);
        if (saveData.equippedSpellIds.length < 6) {
          saveData.equippedSpellIds.push(obj.spellId);
        }
        const sp = SA.SPELLS_MAP?.[obj.spellId];
        this._showNotification(`✨ Learned: ${sp?.name || obj.label}!`, '#a78bfa');
      } else {
        this._showNotification(`Already know ${obj.label}.`, '#64748b');
      }
      SA.SaveManager.save(saveData);

    } else if (obj.type === 'gold') {
      if (collected.includes(obj.id)) return;
      collected.push(obj.id);
      this._markObjectCollected(obj.id);

      saveData.gold = (saveData.gold || 0) + obj.gold;
      document.getElementById('mv-gold').textContent = saveData.gold;
      this._showNotification(`💰 Found ${obj.gold} Gold!`, '#fbbf24');
      SA.SaveManager.save(saveData);

    } else if (obj.type === 'encounter') {
      this._hidePrompt();
      // Pick random enemy from zone
      const zoneEnemies = SA.ENEMIES.filter(e => e.zone === obj.enemyZone);
      if (!zoneEnemies.length) return;
      const enemyDef = zoneEnemies[Math.floor(Math.random() * zoneEnemies.length)];
      const level = SA.getLevelFromXP(saveData.xp);
      const enemyLevel = Math.max(1, level + Math.floor(Math.random() * 3) - 1);
      this.cleanup();
      this.onBattle?.(enemyDef, enemyLevel);

    } else if (obj.type === 'portal') {
      this._hidePrompt();
      this.cleanup();
      this.onMapChange?.(obj.targetMap, obj.targetEntry);
    }
  }

  _markObjectCollected(objId) {
    const el = this.el.querySelector(`.map-obj[data-id="${objId}"]`);
    if (el) el.classList.add('map-obj-done');
    this._hidePrompt();
    this._nearObj = null;
  }

  _hidePrompt() {
    const prompt = document.getElementById('mv-prompt');
    if (prompt) prompt.style.display = 'none';
    this._nearObj = null;
  }

  _showNotification(msg, color) {
    const el = document.getElementById('mv-notif');
    if (!el) return;
    el.textContent = msg;
    el.style.color = color || '#fff';
    el.classList.add('visible');
    if (this._notifTimer) clearTimeout(this._notifTimer);
    this._notifTimer = setTimeout(() => el.classList.remove('visible'), 2200);
  }

  // ── CONTROLS ───────────────────────────────────────────────────────────────
  _bindControls() {
    const DIR_KEYS = {
      ArrowUp: 'up',    w: 'up',    W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right'
    };

    this._onKeyDown = (e) => {
      const dir = DIR_KEYS[e.key];
      if (dir) {
        e.preventDefault();
        if (!this._keysDown[dir]) {
          this._keysDown[dir] = true;
          this._tryMove(dir);
          // Repeat movement while key held
          this._moveRepeat = setTimeout(() => {
            this._moveInterval = setInterval(() => {
              const activeDir = Object.keys(this._keysDown).find(k => this._keysDown[k]);
              if (activeDir) this._tryMove(activeDir);
            }, 150);
          }, 220);
        }
        return;
      }
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        e.preventDefault();
        this._triggerInteract();
      }
    };

    this._onKeyUp = (e) => {
      const dir = Object.keys({ ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right' })
        .find(k => k === e.key);
      if (dir) {
        const dirName = { ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right' }[e.key];
        delete this._keysDown[dirName];
        if (!Object.values(this._keysDown).some(Boolean)) {
          clearTimeout(this._moveRepeat);
          clearInterval(this._moveInterval);
          this._moveRepeat   = null;
          this._moveInterval = null;
          if (this._anim && this._idleAnim) this._anim.play(this._idleAnim);
        }
      }
    };

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup',   this._onKeyUp);
  }

  _bindDpad() {
    const dpad = document.getElementById('mv-dpad');
    if (!dpad) return;

    dpad.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => {
      const dir = btn.dataset.dir;

      const start = (e) => {
        e.preventDefault();
        if (!this._keysDown[dir]) {
          this._keysDown[dir] = true;
          this._tryMove(dir);
          this._moveRepeat = setTimeout(() => {
            this._moveInterval = setInterval(() => {
              if (this._keysDown[dir]) this._tryMove(dir);
            }, 150);
          }, 220);
        }
      };
      const end = (e) => {
        e.preventDefault();
        delete this._keysDown[dir];
        clearTimeout(this._moveRepeat);
        clearInterval(this._moveInterval);
        this._moveRepeat   = null;
        this._moveInterval = null;
        if (!Object.values(this._keysDown).some(Boolean)) {
          if (this._anim && this._idleAnim) this._anim.play(this._idleAnim);
        }
      };

      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend',   end,   { passive: false });
      btn.addEventListener('mousedown',  start);
      btn.addEventListener('mouseup',    end);
      btn.addEventListener('mouseleave', end);
    });

    document.getElementById('mv-act-btn')?.addEventListener('click', () => this._triggerInteract());
  }

  _unbindControls() {
    if (this._onKeyDown) document.removeEventListener('keydown', this._onKeyDown);
    if (this._onKeyUp)   document.removeEventListener('keyup',   this._onKeyUp);
    this._onKeyDown = null;
    this._onKeyUp   = null;
    clearTimeout(this._moveRepeat);
    clearInterval(this._moveInterval);
    this._keysDown = {};
  }
};
