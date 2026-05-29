'use strict';
window.SA = window.SA || {};

// ─── MAP EXPLORER VIEW ────────────────────────────────────────────────────────
// Pokemon-style top-down map: tile movement, sprite animation, camera,
// animated orc encounter markers, portal transitions, guild entry.

SA.MapView = class MapView {
  constructor(containerEl) {
    this.el = containerEl;
    this._anim              = null;
    this._encounterAnims    = [];   // one Animator per encounter marker
    this._moveInterval      = null;
    this._moveRepeat        = null;
    this._keysDown          = {};
    this._moving            = false;
    this._facing            = 'down';
    this._notifTimer        = null;
    this._nearObj           = null;
  }

  show(mapId, saveData, { onBattle, onSpellbook, onHero, onMapChange, onGuild }) {
    this.mapId      = mapId;
    this.mapDef     = SA.MAPS[mapId];
    this.saveData   = saveData;
    this.onBattle   = onBattle;
    this.onSpellbook = onSpellbook;
    this.onHero     = onHero;
    this.onMapChange = onMapChange;
    this.onGuild    = onGuild;

    if (!this.mapDef) { console.error('Unknown map:', mapId); return; }

    this._heroTx = this.mapDef.heroStart.tx;
    this._heroTy = this.mapDef.heroStart.ty;

    this._build();
    this._initTileLayers();
    this._initHeroSprite();
    this._initEncounterSprites();
    this._updateCamera(true);
    this._bindControls();
  }

  cleanup() {
    this._unbindControls();
    if (this._anim)             { this._anim.destroy(); this._anim = null; }
    this._encounterAnims.forEach(a => a.destroy());
    this._encounterAnims = [];
    if (this._moveInterval)     { clearInterval(this._moveInterval); this._moveInterval = null; }
    if (this._moveRepeat)       { clearTimeout(this._moveRepeat);    this._moveRepeat = null; }
    if (this._notifTimer)       { clearTimeout(this._notifTimer);    this._notifTimer = null; }
    if (this._waterTicker)      { clearInterval(this._waterTicker);  this._waterTicker = null; }
  }

  // ── DOM CONSTRUCTION ───────────────────────────────────────────────────────
  _build() {
    const { mapDef, saveData } = this;
    const TILE   = mapDef.tileSize;
    const worldW = mapDef.cols * TILE;
    const worldH = mapDef.rows * TILE;
    const level  = SA.getLevelFromXP(saveData.xp);
    const collected = saveData.mapState?.[mapDef.id]?.collected || [];

    const objectsHtml = mapDef.objects.map(obj => {
      const isDone = collected.includes(obj.id);

      // Non-collectible types never get "done" state
      if (isDone && obj.type !== 'encounter' && obj.type !== 'portal' && obj.type !== 'building') return '';

      const px = obj.tx * TILE;
      const py = obj.ty * TILE;

      // ── Encounter markers — canvas element (animated orc sprite) ──────────
      if (obj.type === 'encounter') {
        const sz = obj.imageSize || 64;
        const cls = `map-obj map-obj-encounter${isDone ? ' map-obj-done' : ''}`;
        // Offset so sprite is centred on tile (canvas is 64×64, tile is 48px)
        const ox = Math.round((sz - TILE) / 2);
        return `<div class="${cls}" data-id="${obj.id}"
          style="left:${px - ox}px; top:${py - ox}px; width:${sz}px; height:${sz}px;">
          <canvas class="map-enc-canvas" data-orc="${obj.orcType || 'orc1'}"
            data-zone="${obj.enemyZone || 'bog'}" style="display:block;image-rendering:pixelated;"></canvas>
          <div class="map-obj-label">${obj.label}</div>
        </div>`;
      }

      // ── Guild door — invisible interaction trigger ─────────────────────────
      if (obj.type === 'guild') {
        return `<div class="map-obj map-obj-guild" data-id="${obj.id}"
          style="left:${px}px; top:${py}px; width:${TILE}px; height:${TILE}px;">
          <div class="map-obj-label">${obj.label}</div>
        </div>`;
      }

      // ── Building (non-interactive decoration) ─────────────────────────────
      if (obj.type === 'building') {
        const w = obj.imageW || obj.imageSize || 64;
        const h = obj.imageH || obj.imageSize || 64;
        return `<div class="map-obj map-obj-building" data-id="${obj.id}"
          style="left:${px}px; top:${py}px; width:${w}px; height:${h}px; pointer-events:none; z-index:6;">
          <img src="${obj.image}" alt="${obj.label || ''}"
            style="width:${w}px;height:${h}px;image-rendering:pixelated;" draggable="false">
        </div>`;
      }

      // ── Standard objects (spell, gold, portal) ────────────────────────────
      const sz  = obj.imageSize || 64;
      const w   = obj.imageW || sz;
      const h   = obj.imageH || sz;
      const cls = `map-obj map-obj-${obj.type}${isDone ? ' map-obj-done' : ''}`;

      return `<div class="${cls}" data-id="${obj.id}"
        style="left:${px}px; top:${py}px; width:${w}px; height:${h}px;">
        <img src="${obj.image}" alt="${obj.label}"
          style="width:${w}px;height:${h}px;image-rendering:pixelated;" draggable="false">
        <div class="map-obj-label">${obj.label}</div>
      </div>`;
    }).join('');

    this.el.innerHTML = `
      <div class="map-screen">
        <!-- HUD -->
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
            <button class="map-btn" id="mv-spellbook" title="Grimoire">📖</button>
            <button class="map-btn" id="mv-hero"      title="Hero Profile">🧙</button>
          </div>
        </div>

        <!-- Notification popup -->
        <div class="map-notification" id="mv-notif"></div>

        <!-- Interaction prompt -->
        <div class="map-interact-prompt" id="mv-prompt" style="display:none">
          <span id="mv-prompt-text"></span>
          <kbd>E</kbd>
        </div>

        <!-- World viewport -->
        <div class="map-viewport" id="mv-viewport">
          <div class="map-world" id="mv-world"
            style="width:${worldW}px;height:${worldH}px;
                   background-color:${mapDef.bgColor};
                   background-image:url('${mapDef.groundImage}');">
            <canvas id="mv-tile-canvas"
              style="position:absolute;top:0;left:0;z-index:1;pointer-events:none;image-rendering:pixelated;"></canvas>
            ${objectsHtml}
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

    document.getElementById('mv-spellbook')?.addEventListener('click', () => this.onSpellbook?.());
    document.getElementById('mv-hero')?.addEventListener('click',      () => this.onHero?.());
    this._bindDpad();
  }

  // ── TILE LAYERS — animated background tiles (water, acid, detail) ─────────
  _initTileLayers() {
    const canvas = document.getElementById('mv-tile-canvas');
    if (!canvas) return;

    const layers  = this.mapDef.tileLayers;
    if (!layers || !layers.length) return;   // no tile layers, nothing to do

    const tilesets = SA.TILESETS;
    if (!tilesets) return;                   // tilesets.js not loaded

    const { cols, rows, tileSize: T } = this.mapDef;
    canvas.width  = cols * T;
    canvas.height = rows * T;
    // Explicit CSS size so the world div sees it at the right pixel size
    canvas.style.width  = (cols * T) + 'px';
    canvas.style.height = (rows * T) + 'px';

    this._tileCtx    = canvas.getContext('2d');
    this._tileCtx.imageSmoothingEnabled = false;
    this._waterFrame = 0;
    this._tileImgs   = {};   // tilesetId → HTMLImageElement | null | 'error'

    // Preload all referenced tileset images
    const usedIds = [...new Set(layers.map(l => l.tilesetId))];
    for (const tsId of usedIds) {
      const ts = tilesets[tsId];
      if (!ts) continue;
      const img = new Image();
      this._tileImgs[tsId] = null;   // loading
      img.onload = () => {
        this._tileImgs[tsId] = img;
        this._renderTileLayers();
      };
      img.onerror = () => {
        this._tileImgs[tsId] = 'error';
      };
      img.src = ts.src;
    }

    // Start water animation ticker if any animated layer is present
    const hasAnim = layers.some(l => tilesets[l.tilesetId]?.animated);
    if (hasAnim) {
      this._waterTicker = setInterval(() => {
        this._waterFrame = (this._waterFrame + 1) % 6;
        this._renderTileLayers();
      }, 150);
    }

    // Initial render (images may still be loading)
    this._renderTileLayers();
  }

  _renderTileLayers() {
    if (!this._tileCtx) return;
    const ctx      = this._tileCtx;
    const tilesets = SA.TILESETS;
    if (!tilesets) return;

    const { cols, rows, tileSize: T, tileLayers } = this.mapDef;
    ctx.clearRect(0, 0, cols * T, rows * T);

    for (const layer of tileLayers) {
      if (!layer.visible) continue;
      const ts = tilesets[layer.tilesetId];
      if (!ts) continue;
      const img = this._tileImgs[layer.tilesetId];
      if (!img || img === 'error') continue;

      ctx.globalAlpha = layer.alpha ?? 1;
      const frameOffsetY = ts.animated ? (this._waterFrame * ts.frameRows * ts.tileH) : 0;

      for (let ty = 0; ty < rows; ty++) {
        for (let tx = 0; tx < cols; tx++) {
          const tileId = layer.tiles[ty * cols + tx];
          if (tileId < 0) continue;
          const srcX = (tileId % ts.cols) * ts.tileW;
          const srcY = Math.floor(tileId / ts.cols) * ts.tileH + frameOffsetY;
          ctx.drawImage(img, srcX, srcY, ts.tileW, ts.tileH, tx * T, ty * T, T, T);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  // ── HERO SPRITE ────────────────────────────────────────────────────────────
  _initHeroSprite() {
    const canvas = document.getElementById('mv-hero-canvas');
    if (!canvas) return;

    const level    = SA.getLevelFromXP(this.saveData.xp);
    const animSet  = SA.getHeroAnims(level);
    const base     = 'Assets/Assets_Hero/PNG/';
    const walkSheet = `${base}${animSet.folder}/With_shadow/${animSet.folder}_Walk_with_shadow.png`;

    // Walk anims — 384×256, 6 cols × 4 rows (row 0=down,1=left,2=right,3=up)
    const mkWalk = row => ({ sheet: walkSheet, w: 384, h: 256, cols: 6, row, fps: 8, loop: true });
    this._walkAnims = {
      down:  mkWalk(0), left: mkWalk(1), right: mkWalk(2), up: mkWalk(3)
    };
    // Per-direction idle: same sheet, slow fps so it barely moves
    const mkIdle = row => ({ sheet: walkSheet, w: 384, h: 256, cols: 6, row, fps: 3, loop: true });
    this._dirIdleAnims = {
      down:  mkIdle(0), left: mkIdle(1), right: mkIdle(2), up: mkIdle(3)
    };

    this._anim = new SA.Animator(canvas, 2);
    this._positionHeroCanvas();
    this._anim.play(this._dirIdleAnims.down);
  }

  _positionHeroCanvas() {
    const canvas = document.getElementById('mv-hero-canvas');
    if (!canvas) return;
    const TILE   = this.mapDef.tileSize;
    // Canvas is 128×128 (64×2). Centre it over the tile.
    const offset = (canvas.width - TILE) / 2;
    canvas.style.left = (this._heroTx * TILE - offset) + 'px';
    canvas.style.top  = (this._heroTy * TILE - offset) + 'px';
  }

  // ── ENCOUNTER SPRITE MARKERS ───────────────────────────────────────────────
  _initEncounterSprites() {
    const canvases = this.el.querySelectorAll('.map-enc-canvas');
    canvases.forEach(canvas => {
      const orcKey  = canvas.dataset.orc  || 'orc1';
      const zone    = canvas.dataset.zone || 'bog';
      const animDef = SA.ENEMY_ANIMS?.[orcKey];
      if (!animDef) return;

      // Scale 1 → 64×64 canvas matching tile visual weight
      const anim = new SA.Animator(canvas, 1);

      // On the top-down map, orcs face south (row 0) — looking toward the camera.
      // In battle they use row 1 (west). Use a modified animDef for map idle.
      const mapIdle = { ...animDef.idle, row: 0, fps: 4 };

      // Cursed zone: purple shadow tint
      if (zone === 'shadow') {
        canvas.style.filter = 'hue-rotate(260deg) saturate(1.5) brightness(0.75)';
      }

      anim.play(mapIdle);
      this._encounterAnims.push(anim);
    });
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

    if (newTx < 0 || newTx >= this.mapDef.cols) return;
    if (newTy < 0 || newTy >= this.mapDef.rows) return;

    this._facing = dir;
    this._moving = true;

    if (this._anim && this._walkAnims) this._anim.play(this._walkAnims[dir]);

    this._heroTx = newTx;
    this._heroTy = newTy;
    this._positionHeroCanvas();
    this._updateCamera(false);
    this._checkInteraction();

    setTimeout(() => {
      this._moving = false;
      // If no keys held, idle in the direction we were facing
      if (!Object.values(this._keysDown).some(Boolean)) {
        if (this._anim && this._dirIdleAnims) {
          this._anim.play(this._dirIdleAnims[this._facing]);
        }
      }
    }, 140);
  }

  // ── INTERACTION ────────────────────────────────────────────────────────────
  _checkInteraction() {
    const { mapDef, saveData } = this;
    const collected = saveData.mapState?.[mapDef.id]?.collected || [];

    let nearObj  = null;
    let nearDist = 99;

    for (const obj of mapDef.objects) {
      // Buildings are not interactive
      if (obj.type === 'building') continue;
      if (collected.includes(obj.id) && obj.type !== 'encounter' && obj.type !== 'portal' && obj.type !== 'guild') continue;

      const dx   = Math.abs(obj.tx - this._heroTx);
      const dy   = Math.abs(obj.ty - this._heroTy);
      const dist = Math.max(dx, dy);

      if (dist === 0) {
        // Auto-trigger portals when stepped on
        if (obj.type === 'portal') { this._triggerObject(obj); return; }
        nearObj = obj; nearDist = 0;
      } else if (dist === 1 && dist < nearDist) {
        nearObj = obj; nearDist = dist;
      }
    }

    const prompt     = document.getElementById('mv-prompt');
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
    if (!saveData.mapState)                saveData.mapState = {};
    if (!saveData.mapState[mapDef.id])     saveData.mapState[mapDef.id] = { collected: [] };
    const collected = saveData.mapState[mapDef.id].collected;

    if (obj.type === 'spell') {
      if (collected.includes(obj.id)) return;
      collected.push(obj.id);
      this._markObjectCollected(obj.id);

      if (!saveData.collectedSpellIds.includes(obj.spellId)) {
        saveData.collectedSpellIds.push(obj.spellId);
        if (saveData.equippedSpellIds.length < 6) saveData.equippedSpellIds.push(obj.spellId);
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
      const goldEl = document.getElementById('mv-gold');
      if (goldEl) goldEl.textContent = saveData.gold;
      this._showNotification(`💰 Found ${obj.gold} Gold!`, '#fbbf24');
      SA.SaveManager.save(saveData);

    } else if (obj.type === 'encounter') {
      this._hidePrompt();
      const zoneEnemies = SA.ENEMIES.filter(e => e.zone === obj.enemyZone);
      if (!zoneEnemies.length) return;
      const enemyDef   = zoneEnemies[Math.floor(Math.random() * zoneEnemies.length)];
      const level      = SA.getLevelFromXP(saveData.xp);
      const enemyLevel = Math.max(1, level + Math.floor(Math.random() * 3) - 1);
      this.cleanup();
      this.onBattle?.(enemyDef, enemyLevel);

    } else if (obj.type === 'guild') {
      this._hidePrompt();
      this.cleanup();
      this.onGuild?.();

    } else if (obj.type === 'portal') {
      this._hidePrompt();
      // targetEntry on the portal object takes priority; otherwise use this map's
      // nextMapEntry so the hero arrives near the portal on the other side.
      const entryPos = obj.targetEntry || this.mapDef.nextMapEntry;
      this._startPortalTransition(obj.targetMap, obj.label, entryPos);
    }
  }

  // ── PORTAL TRANSITION ──────────────────────────────────────────────────────
  _startPortalTransition(targetMap, label, targetEntry) {
    // Create full-screen overlay
    const overlay = document.createElement('div');
    overlay.className = 'map-transition-overlay';
    overlay.innerHTML = `
      <div class="map-transition-icon">🌀</div>
      <div class="map-transition-text">${label || 'Travelling…'}</div>
    `;
    document.body.appendChild(overlay);

    // Trigger fade-in on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('active'));
    });

    // At peak darkness: switch map
    setTimeout(() => {
      this.cleanup();
      this.onMapChange?.(targetMap, targetEntry);
    }, 700);

    // Overlay fades out after map loads, then removes itself
    setTimeout(() => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 700);
    }, 1100);
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
    this._notifTimer = setTimeout(() => el.classList.remove('visible'), 2400);
  }

  // ── CONTROLS ───────────────────────────────────────────────────────────────
  _bindControls() {
    const DIR_MAP = {
      ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
      w:'up', s:'down', a:'left', d:'right',
      W:'up', S:'down', A:'left', D:'right'
    };

    this._onKeyDown = (e) => {
      const dir = DIR_MAP[e.key];
      if (dir) {
        e.preventDefault();
        if (!this._keysDown[dir]) {
          this._keysDown[dir] = true;
          this._tryMove(dir);
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
      const dirName = DIR_MAP[e.key];
      if (dirName) {
        delete this._keysDown[dirName];
        if (!Object.values(this._keysDown).some(Boolean)) {
          clearTimeout(this._moveRepeat);
          clearInterval(this._moveInterval);
          this._moveRepeat   = null;
          this._moveInterval = null;
          // ← Hero keeps facing the last direction when idle
          if (this._anim && this._dirIdleAnims) {
            this._anim.play(this._dirIdleAnims[this._facing]);
          }
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
          if (this._anim && this._dirIdleAnims) {
            this._anim.play(this._dirIdleAnims[this._facing]);
          }
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
