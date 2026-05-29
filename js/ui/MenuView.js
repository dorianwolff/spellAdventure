'use strict';
window.SA = window.SA || {};

// ─── TITLE SCREEN ─────────────────────────────────────────────────────────────
SA.TitleView = class TitleView {
  constructor(containerEl) {
    this.el = containerEl;
  }

  show({ onNewGame, onContinue }) {
    const hasSave = SA.SaveManager.hasSave();

    this.el.innerHTML = `
      <div class="title-screen">
        <div class="title-bg-particles" id="title-particles"></div>

        <div class="title-content">
          <div class="title-spell-book">
            <canvas id="title-book-canvas" class="title-book"></canvas>
          </div>
          <h1 class="title-logo">
            <span class="title-spell">Spell</span>
            <span class="title-adventure">Adventure</span>
          </h1>
          <p class="title-tagline">Collect spells. Defeat orcs. Become legend.</p>

          <div class="title-buttons">
            ${hasSave ? `<button class="btn-title btn-continue" id="title-continue">▶ Continue</button>` : ''}
            <button class="btn-title btn-new-game" id="title-new">
              ${hasSave ? '⚡ New Game' : '▶ New Game'}
            </button>
          </div>

          ${hasSave ? `
            <div class="title-save-info" id="title-save-info">
              <!-- Populated after load -->
            </div>
          ` : ''}
        </div>

        <div class="title-credits">
          <span>Pixel art assets © Craftpix.net</span>
        </div>
      </div>
    `;

    // Animated title book
    const bookCanvas = document.getElementById('title-book-canvas');
    if (bookCanvas) {
      const bookAnim = new SA.BookAnimator(bookCanvas, 140);
      bookAnim.play('open', () => {
        bookAnim.showFrame('open', 11);
      });
    }

    // Particle effect
    this._spawnParticles(document.getElementById('title-particles'));

    // Show save info
    if (hasSave) {
      const save = SA.SaveManager.load();
      if (save) {
        const level = SA.getLevelFromXP(save.xp);
        const info  = document.getElementById('title-save-info');
        if (info) {
          info.innerHTML = `
            <span>🧙 ${save.heroName}</span>
            <span>Lv.${level}</span>
            <span>⚔️ ${save.battlesWon || 0} Victories</span>
          `;
        }
      }
    }

    document.getElementById('title-continue')?.addEventListener('click', () => onContinue?.());
    document.getElementById('title-new')?.addEventListener('click', () => {
      if (hasSave) {
        if (!confirm('Start a new game? Your existing save will be lost.')) return;
        SA.SaveManager.delete();
      }
      onNewGame?.();
    });
  }

  _spawnParticles(container) {
    if (!container) return;
    const symbols = ['✨', '⚡', '🔥', '❄️', '💜', '🌑', '☄️', '🌀'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'title-particle';
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      p.style.left    = Math.random() * 100 + '%';
      p.style.animationDelay    = (Math.random() * 4) + 's';
      p.style.animationDuration = (4 + Math.random() * 6) + 's';
      p.style.fontSize = (12 + Math.random() * 16) + 'px';
      container.appendChild(p);
    }
  }
};

// ─── NAME ENTRY SCREEN ────────────────────────────────────────────────────────
SA.NameEntryView = class NameEntryView {
  constructor(containerEl) {
    this.el = containerEl;
  }

  show({ charClass, onConfirm }) {
    const charDef = SA.CHARACTERS_MAP?.[charClass] || SA.CHARACTERS?.[0] || {};

    this.el.innerHTML = `
      <div class="name-screen">
        <div class="name-card">
          <div class="name-class-badge" style="background:${charDef.bgColor || 'rgba(124,58,237,0.15)'}; border-color:${charDef.color || '#7c3aed'}">
            <span class="name-class-emoji">${charDef.emoji || '⚔️'}</span>
            <span class="name-class-label" style="color:${charDef.color}">${charDef.name || 'Swordsman'}</span>
          </div>
          <h2>What is your name, brave soul?</h2>
          <input
            type="text"
            id="name-input"
            class="name-input"
            placeholder="Enter your name..."
            maxlength="16"
            value="Arcanis"
            autofocus
          >
          <button class="btn-primary" id="name-confirm">Begin Journey ⚔️</button>
        </div>
      </div>
    `;

    const input   = document.getElementById('name-input');
    const confirm = document.getElementById('name-confirm');

    input?.select();

    const submit = () => {
      const name = (input?.value || '').trim() || 'Arcanis';
      onConfirm?.(name);
    };

    confirm?.addEventListener('click', submit);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }
};

// ─── CHARACTER SELECT SCREEN ──────────────────────────────────────────────────
SA.CharacterSelectView = class CharacterSelectView {
  constructor(containerEl) {
    this.el = containerEl;
  }

  show({ onSelect }) {
    this.el.innerHTML = `
      <div class="charselect-screen">
        <div class="charselect-header">
          <h1 class="charselect-title">Choose Your Class</h1>
          <p class="charselect-subtitle">Each class starts with unique spells and stats</p>
        </div>
        <div class="charselect-grid" id="cs-grid"></div>
      </div>
    `;

    const grid = document.getElementById('cs-grid');
    for (const char of SA.CHARACTERS) {
      const spellNames = (char.starterSpells || []).map(id => {
        const sp = SA.SPELLS_MAP?.[id];
        return sp ? `${SA.ELEMENTS[sp.element]?.emoji || ''} ${sp.name}` : id;
      });

      const card = document.createElement('div');
      card.className = 'charselect-card';
      card.style.setProperty('--char-color', char.color);
      card.style.setProperty('--char-bg', char.bgColor);
      card.innerHTML = `
        <div class="cs-card-glow"></div>
        <div class="cs-emoji">${char.emoji}</div>
        <h2 class="cs-name" style="color:${char.color}">${char.name}</h2>
        <p class="cs-desc">${char.description}</p>
        <div class="cs-stats">
          <div class="cs-stat"><span>❤️ HP</span><span>${char.baseStats.hp}</span></div>
          <div class="cs-stat"><span>⚔️ ATK</span><span>${char.baseStats.atk}</span></div>
          <div class="cs-stat"><span>💨 SPD</span><span>${char.baseStats.spd}</span></div>
        </div>
        <div class="cs-spells">
          <div class="cs-spells-label">Starter Spells</div>
          ${spellNames.map(s => `<div class="cs-spell-chip" style="border-color:${char.color}">${s}</div>`).join('')}
        </div>
        <button class="cs-choose-btn" style="background:${char.color}">Choose ${char.name}</button>
      `;

      card.querySelector('.cs-choose-btn').addEventListener('click', () => {
        onSelect?.(char.id);
      });

      grid.appendChild(card);
    }
  }
};

// ─── LEVEL UP SCREEN ──────────────────────────────────────────────────────────
SA.LevelUpView = class LevelUpView {
  constructor(containerEl) {
    this.el = containerEl;
  }

  show({ newLevel, onChoice }) {
    this.el.innerHTML = `
      <div class="levelup-screen">
        <div class="levelup-card">
          <div class="levelup-glow"></div>
          <h2 class="levelup-title">⬆ Level Up!</h2>
          <p class="levelup-level">You reached Level ${newLevel}!</p>
          <p class="levelup-prompt">Choose a permanent stat bonus:</p>
          <div class="levelup-choices">
            <button class="levelup-btn" data-choice="hp">
              <span class="levelup-emoji">❤️</span>
              <span class="levelup-stat">+2 Max HP</span>
              <span class="levelup-stat-desc">Become more durable</span>
            </button>
            <button class="levelup-btn" data-choice="atk">
              <span class="levelup-emoji">⚔️</span>
              <span class="levelup-stat">+1 Attack</span>
              <span class="levelup-stat-desc">Deal more damage</span>
            </button>
            <button class="levelup-btn" data-choice="spd">
              <span class="levelup-emoji">💨</span>
              <span class="levelup-stat">+1 Speed</span>
              <span class="levelup-stat-desc">Act before enemies</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.el.querySelectorAll('.levelup-btn').forEach(btn => {
      btn.addEventListener('click', () => onChoice?.(btn.dataset.choice));
    });
  }
};

// ─── VICTORY SCREEN ───────────────────────────────────────────────────────────
SA.VictoryView = class VictoryView {
  constructor(containerEl) {
    this.el = containerEl;
  }

  show({ enemy, xpGained, goldGained, levelBefore, levelAfter, spellDrop, onContinue }) {
    const leveled = levelAfter > levelBefore;

    this.el.innerHTML = `
      <div class="victory-screen">
        <div class="victory-card">
          <h2 class="victory-title">⚔️ Victory!</h2>
          <p class="victory-enemy">${enemy.name} was defeated!</p>

          <div class="victory-rewards">
            <div class="victory-xp">
              ✨ <strong>+${xpGained} XP</strong>
              ${leveled ? `<span class="victory-level-up">Level Up! → Lv.${levelAfter}</span>` : ''}
            </div>
            ${goldGained ? `<div class="victory-gold">💰 <strong>+${goldGained} Gold</strong></div>` : ''}
            ${spellDrop ? `
              <div class="victory-spell-drop">
                <div class="drop-label">📖 New Spell Acquired!</div>
                <div class="drop-spell">
                  ${spellDrop.iconFile
                    ? `<img src="Assets/Assets_Spells/PNG/Icons/${spellDrop.iconFile}_big.png" class="drop-icon" alt="${spellDrop.name}">`
                    : '<span>⚔️</span>'
                  }
                  <div class="drop-info">
                    <div class="drop-name" style="color:${SA.RARITY[spellDrop.rarity]?.color}">${spellDrop.name}</div>
                    <div class="drop-desc">${spellDrop.description}</div>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>

          <button class="btn-primary victory-continue" id="victory-continue">
            Continue →
          </button>
        </div>
      </div>
    `;

    document.getElementById('victory-continue')?.addEventListener('click', () => onContinue?.());
  }
};

// ─── DEFEAT SCREEN ────────────────────────────────────────────────────────────
SA.DefeatView = class DefeatView {
  constructor(containerEl) {
    this.el = containerEl;
  }

  show({ enemy, onRetry, onWorld }) {
    this.el.innerHTML = `
      <div class="defeat-screen">
        <div class="defeat-card">
          <h2 class="defeat-title">💀 Defeated!</h2>
          <p class="defeat-enemy">You were slain by ${enemy.name}...</p>
          <p class="defeat-tip">Tip: Try adjusting your equipped spells or leveling up!</p>
          <div class="defeat-buttons">
            <button class="btn-primary" id="defeat-retry">⚔️ Fight Again</button>
            <button class="btn-secondary" id="defeat-world">🗺 Return to Map</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('defeat-retry')?.addEventListener('click', () => onRetry?.());
    document.getElementById('defeat-world')?.addEventListener('click', () => onWorld?.());
  }
};

// ─── HERO PROFILE SCREEN ──────────────────────────────────────────────────────
SA.HeroView = class HeroView {
  constructor(containerEl) {
    this.el = containerEl;
  }

  show({ saveData, onBack }) {
    const level   = SA.getLevelFromXP(saveData.xp);
    const stats   = SA.SaveManager.computeStats(saveData);
    const xpCur   = saveData.xp - SA.getXPForLevel(level);
    const xpNxt   = SA.getXPForNextLevel(level) - SA.getXPForLevel(level);
    const animSet = SA.getHeroAnims(level);
    const charDef = SA.CHARACTERS_MAP?.[saveData.charClass] || null;

    this.el.innerHTML = `
      <div class="hero-screen">
        <div class="hero-screen-header">
          <button class="btn-back" id="hp-back">← Back</button>
          <h2 class="hero-screen-title">Hero Profile</h2>
        </div>

        <div class="hero-profile">
          <div class="hero-sprite-panel">
            <canvas id="hp-hero-canvas" class="hero-profile-canvas"></canvas>
            <div class="hero-profile-name">${saveData.heroName}</div>
            <div class="hero-profile-level">Level ${level} ${charDef ? charDef.name : 'Swordsman'}</div>
            <div class="hero-profile-gold">💰 ${saveData.gold || 0} Gold</div>
          </div>

          <div class="hero-stats-panel">
            <div class="stat-group">
              <h3>Statistics</h3>
              <div class="stat-row"><span>❤️ Max HP</span><span>${stats.maxHp}</span></div>
              <div class="stat-row"><span>⚔️ Attack</span><span>${stats.atk}</span></div>
              <div class="stat-row"><span>💨 Speed</span><span>${stats.spd}</span></div>
              <div class="stat-row"><span>💎 Mana</span><span>${saveData.maxMana}</span></div>
            </div>

            <div class="stat-group">
              <h3>Progress</h3>
              <div class="stat-row"><span>📊 Level</span><span>${level}</span></div>
              <div class="stat-row">
                <span>✨ XP</span>
                <span>${saveData.xp}</span>
              </div>
              <div class="xp-progress">
                <div class="xp-track"><div class="xp-fill" style="width:${(xpCur/xpNxt*100).toFixed(1)}%"></div></div>
                <small>${xpCur}/${xpNxt} to Level ${level+1}</small>
              </div>
              <div class="stat-row"><span>🏆 Victories</span><span>${saveData.battlesWon || 0}</span></div>
              <div class="stat-row"><span>💀 Defeats</span><span>${saveData.battlesLost || 0}</span></div>
            </div>

            <div class="stat-group">
              <h3>Equipped Spells (${saveData.equippedSpellIds.length}/6)</h3>
              <div class="hero-equipped-spells">
                ${saveData.equippedSpellIds.map(id => {
                  const sp = SA.SPELLS_MAP[id];
                  if (!sp) return '';
                  const elDef = SA.ELEMENTS[sp.element] || {};
                  return `<div class="equipped-chip" style="border-color:${elDef.color}">
                    ${sp.iconFile
                      ? `<img src="Assets/Assets_Spells/PNG/Icons/${sp.iconFile}_big.png" class="equipped-icon" alt="${sp.name}">`
                      : '⚔️'
                    }
                    <span style="color:${elDef.color}">${sp.name}</span>
                  </div>`;
                }).join('')}
              </div>
            </div>

            <div class="stat-group">
              <h3>⚙️ Settings</h3>
              <div class="settings-row">
                <span class="settings-label">🎵 Music</span>
                <button class="settings-mute-btn" id="hp-mute-btn">🔊</button>
                <input type="range" class="settings-volume" id="hp-volume"
                  min="0" max="100" step="1" value="45">
                <span class="settings-vol-val" id="hp-vol-val">45%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hero sprite idle on profile — bigger scale
    const canvas = document.getElementById('hp-hero-canvas');
    if (canvas) {
      const scale = window.innerWidth < 500 ? 3 : 4;
      const anim = new SA.Animator(canvas, scale);
      anim.play(animSet.anims.idle);
    }

    // Audio controls
    const music    = document.getElementById('bg-music');
    const muteBtn  = document.getElementById('hp-mute-btn');
    const volSlider = document.getElementById('hp-volume');
    const volVal   = document.getElementById('hp-vol-val');

    if (music && muteBtn && volSlider) {
      // Sync initial state
      const syncUI = () => {
        const muted = music.muted || music.volume === 0;
        muteBtn.textContent = muted ? '🔕' : '🔊';
        const pct = Math.round(music.volume * 100);
        volSlider.value = pct;
        if (volVal) volVal.textContent = pct + '%';
      };
      syncUI();

      muteBtn.addEventListener('click', () => {
        music.muted = !music.muted;
        if (music.muted) {
          music.pause();
        } else {
          music.play().catch(() => {});
        }
        syncUI();
      });

      volSlider.addEventListener('input', () => {
        const v = parseInt(volSlider.value) / 100;
        music.volume = v;
        music.muted  = v === 0;
        if (v > 0 && music.paused) music.play().catch(() => {});
        if (volVal) volVal.textContent = volSlider.value + '%';
        muteBtn.textContent = v === 0 ? '🔕' : '🔊';
      });
    }

    document.getElementById('hp-back')?.addEventListener('click', () => onBack?.());
  }
};

// ─── GUILD VIEW ───────────────────────────────────────────────────────────────
SA.GuildView = class GuildView {
  constructor(containerEl) {
    this.el = containerEl;
    this._anims = [];
  }

  show({ saveData, onLeave }) {
    const level    = SA.getLevelFromXP(saveData.xp);
    const charDef  = SA.CHARACTERS_MAP?.[saveData.charClass] || null;
    const className = charDef?.name || 'Adventurer';

    this.el.innerHTML = `
      <div class="guild-screen">

        <!-- Header bar -->
        <div class="guild-header-bar">
          <div class="guild-title-text">⚔ ADVENTURER'S GUILD</div>
          <button class="guild-back-btn" id="guild-back">← Leave</button>
        </div>

        <div class="guild-interior-scene">

          <!-- Interior wall background -->
          <div class="guild-wall-strip"></div>

          <!-- NPC floor row -->
          <div class="guild-floor">
            <div class="guild-npc-wrap">
              <canvas id="guild-npc-citizen" class="guild-npc-canvas"></canvas>
              <div class="guild-npc-name">CITIZEN</div>
            </div>
            <div class="guild-npc-wrap">
              <canvas id="guild-npc-master" class="guild-npc-canvas"></canvas>
              <div class="guild-npc-name">GUILDMASTER</div>
            </div>
            <div class="guild-npc-wrap">
              <canvas id="guild-npc-mage" class="guild-npc-canvas"></canvas>
              <div class="guild-npc-name">MAGE</div>
            </div>
          </div>

          <!-- Guildmaster dialogue -->
          <div class="guild-dialogue">
            <div class="guild-dialogue-avatar">🧙</div>
            <div class="guild-dialogue-body">
              <div class="guild-dialogue-name">Guildmaster Aldric</div>
              <div class="guild-dialogue-text">
                Ah, ${saveData.heroName}! A Level ${level} ${className} — impressive!
                The roads are treacherous lately. Stock up on spells before venturing further.
                Our mages can teach you the arcane arts… for a price. Good hunting!
              </div>
            </div>
          </div>

          <!-- Quest board / stats -->
          <div class="guild-board">
            <div class="guild-board-title">📋 ADVENTURER RECORD</div>
            <div class="guild-stat-row"><span>⚔️ Battles Won</span><span>${saveData.battlesWon || 0}</span></div>
            <div class="guild-stat-row"><span>💀 Defeats</span><span>${saveData.battlesLost || 0}</span></div>
            <div class="guild-stat-row"><span>💰 Gold</span><span>${saveData.gold || 0}</span></div>
            <div class="guild-stat-row"><span>📖 Spells Known</span><span>${saveData.collectedSpellIds?.length || 0}</span></div>
            <div class="guild-stat-row"><span>✨ Total XP</span><span>${saveData.xp}</span></div>
            <div class="guild-stat-row"><span>🗺 Rank</span><span>${this._getRank(saveData)}</span></div>
          </div>

        </div>
      </div>
    `;

    document.getElementById('guild-back')?.addEventListener('click', () => onLeave?.());
    this._initNPCSprites();
  }

  _getRank(saveData) {
    const w = saveData.battlesWon || 0;
    if (w >= 30) return 'S — Legend';
    if (w >= 20) return 'A — Champion';
    if (w >= 10) return 'B — Veteran';
    if (w >= 5)  return 'C — Adventurer';
    return 'D — Rookie';
  }

  _initNPCSprites() {
    // Draw a single frame from each NPC sprite sheet using a helper canvas
    const npcs = [
      { id: 'guild-npc-citizen', src: 'Assets/Assets_Guild/PNG/Citizen1_Idle.png', frameW: 64, frameH: 64, col: 0, row: 0, displaySize: 96 },
      { id: 'guild-npc-master',  src: 'Assets/Assets_Guild/PNG/Guildmaster.png',   frameW: 32, frameH: 32, col: 0, row: 0, displaySize: 96 },
      { id: 'guild-npc-mage',    src: 'Assets/Assets_Guild/PNG/Mage1.png',         frameW: 64, frameH: 64, col: 0, row: 0, displaySize: 96 }
    ];

    npcs.forEach(({ id, src, frameW, frameH, col, row, displaySize }) => {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      canvas.width  = displaySize;
      canvas.height = displaySize;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const img = new Image();
      img.onload = () => {
        const sx = col * frameW;
        const sy = row * frameH;
        ctx.clearRect(0, 0, displaySize, displaySize);
        ctx.drawImage(img, sx, sy, frameW, frameH, 0, 0, displaySize, displaySize);

        // Animate: cycle through frames in a gentle loop
        let frame = 0;
        const totalCols = Math.floor(img.naturalWidth / frameW);
        const totalRows = Math.floor(img.naturalHeight / frameH);
        const totalFrames = totalCols * totalRows;
        const interval = setInterval(() => {
          if (!canvas.isConnected) { clearInterval(interval); return; }
          frame = (frame + 1) % totalFrames;
          const fc = frame % totalCols;
          const fr = Math.floor(frame / totalCols);
          ctx.clearRect(0, 0, displaySize, displaySize);
          ctx.drawImage(img, fc * frameW, fr * frameH, frameW, frameH, 0, 0, displaySize, displaySize);
        }, 200);
        this._anims.push(interval);
      };
      img.onerror = () => {
        // Fallback placeholder
        ctx.fillStyle = 'rgba(124,58,237,0.3)';
        ctx.fillRect(0, 0, displaySize, displaySize);
        ctx.fillStyle = '#a78bfa';
        ctx.font = `${Math.floor(displaySize * 0.5)}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🧙', displaySize / 2, displaySize * 0.7);
      };
      img.src = src;
    });
  }

  cleanup() {
    this._anims.forEach(id => clearInterval(id));
    this._anims = [];
  }
};
