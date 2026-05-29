'use strict';
window.SA = window.SA || {};

// ─── GAME CONTROLLER ──────────────────────────────────────────────────────────
// Manages screen routing and top-level game state.

SA.Game = class Game {
  constructor() {
    this.saveData = null;
    this.currentScreen = null;

    // Active battle state
    this._battleEnemy     = null;
    this._battleEnemyDef  = null;
    this._battleEngine    = null;
    this._battleView      = null;

    // Map state
    this._mapView      = null;
    this._guildView    = null;
    this._currentMapId = 'bog';

    // View instances (reused)
    this.views = {};

    this._init();
  }

  _init() {
    // Wire up single-screen container
    this.screenEl = document.getElementById('game-screen');
    if (!this.screenEl) {
      console.error('Missing #game-screen element!');
      return;
    }

    // Subscribe to global events
    SA.EventBus.on('battle:end', (result) => this._onBattleEnd(result));

    // Start background music on first user interaction (browser autoplay policy)
    this._setupMusic();

    this._showTitle();
  }

  _setupMusic() {
    const music = document.getElementById('bg-music');
    if (!music) return;
    music.volume = 0.45;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      music.play().catch(() => {});
    };
    document.addEventListener('pointerdown', start, { once: true });
    document.addEventListener('keydown',     start, { once: true });
  }

  // ── SCREEN ROUTING ─────────────────────────────────────────────────────────
  _clearScreen(className) {
    this.screenEl.className = 'game-screen ' + (className || '');
    this.screenEl.innerHTML = '';
    if (this._battleView) { this._battleView.cleanup(); this._battleView = null; }
    if (this._mapView)    { this._mapView.cleanup();    this._mapView    = null; }
    if (this._guildView)  { this._guildView.cleanup();  this._guildView  = null; }
  }

  _showTitle() {
    this._clearScreen('screen-title');
    const view = new SA.TitleView(this.screenEl);
    view.show({
      onNewGame:  () => this._showCharacterSelect(),
      onContinue: () => {
        this.saveData = SA.SaveManager.load();
        if (this.saveData) this._showWorld();
        else this._showCharacterSelect();
      }
    });
  }

  _showCharacterSelect() {
    this._clearScreen('screen-charselect');
    const view = new SA.CharacterSelectView(this.screenEl);
    view.show({
      onSelect: (charClass) => this._showNameEntry(charClass)
    });
  }

  _showNameEntry(charClass) {
    this._clearScreen('screen-name');
    const view = new SA.NameEntryView(this.screenEl);
    view.show({
      charClass,
      onConfirm: (name) => {
        const charDef = SA.CHARACTERS_MAP?.[charClass] || SA.CHARACTERS?.[0];
        this.saveData = SA.SaveManager.defaultSave();
        this.saveData.heroName = name;
        this.saveData.charClass = charClass || 'pyromancer';
        // Apply class-specific base stats and starter spells
        if (charDef) {
          this.saveData.baseStats = { ...charDef.baseStats };
          this.saveData.maxMana   = charDef.maxMana || 5;
          // mana_surge collected but NOT equipped — player can equip from grimoire
          this.saveData.collectedSpellIds = ['mana_surge', ...(charDef.starterSpells || [])];
          this.saveData.equippedSpellIds  = [...(charDef.starterSpells || [])];
        }
        SA.SaveManager.save(this.saveData);
        this._showWorld();
      }
    });
  }

  _showWorld() {
    if (!this.saveData) { this._showTitle(); return; }
    // HP is fully restored when returning to world
    this.saveData = SA.SaveManager.load() || this.saveData;
    this._showMap(this._currentMapId || 'bog');
  }

  _showMap(mapId, entryPos) {
    if (!this.saveData) { this._showTitle(); return; }
    this._currentMapId = mapId;

    if (this._mapView) {
      this._mapView.cleanup();
      this._mapView = null;
    }

    this._clearScreen('screen-map');

    const view = new SA.MapView(this.screenEl);

    // Override hero start position if entering from another map
    if (entryPos && SA.MAPS[mapId]) {
      SA.MAPS[mapId].heroStart = entryPos;
    }

    view.show(mapId, this.saveData, {
      onBattle:    (enemyDef, level)    => this._startBattle(enemyDef, level),
      onSpellbook: ()                   => this._showSpellbook(),
      onHero:      ()                   => this._showHeroProfile(),
      onMapChange: (targetMap, entry)   => this._showMap(targetMap, entry),
      onGuild:     ()                   => this._showGuild()
    });
    this._mapView = view;
  }

  _showSpellbook() {
    if (!this.saveData) return;
    this._clearScreen('screen-spellbook');
    const view = new SA.SpellBookView(this.screenEl);

    // Back button — inject it
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back fixed-back';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', () => {
      view.hide();
      this._showWorld();
    });
    this.screenEl.appendChild(backBtn);

    view.show(this.saveData);
  }

  _showHeroProfile() {
    if (!this.saveData) return;
    this._clearScreen('screen-hero');
    const view = new SA.HeroView(this.screenEl);
    view.show({ saveData: this.saveData, onBack: () => this._showWorld() });
  }

  _showGuild() {
    if (!this.saveData) return;
    this._clearScreen('screen-guild');
    const view = new SA.GuildView(this.screenEl);
    this._guildView = view;
    view.show({
      saveData: this.saveData,
      onLeave: () => this._showWorld()
    });
  }

  _startBattle(enemyDef, enemyLevel) {
    if (!this.saveData) return;
    this._clearScreen('screen-battle');

    this._battleEnemyDef = enemyDef;
    this._battleEnemyLevel = enemyLevel;

    const hero  = new SA.Hero(this.saveData);
    const enemy = new SA.Enemy(enemyDef, enemyLevel);

    this._battleView   = new SA.BattleView(this.screenEl);
    this._battleEngine = new SA.BattleEngine(hero, enemy);

    // Set battle background theme
    this.screenEl.dataset.theme = enemyDef.zone;

    this._battleView.startBattle(this._battleEngine);

    // Small delay before starting so sprites load
    setTimeout(() => this._battleEngine.start(), 500);
  }

  // ── BATTLE END ─────────────────────────────────────────────────────────────
  _onBattleEnd(result) {
    if (!this.saveData) return;

    const { winner, xpGained, spellDrop } = result;
    const enemy = this._battleEngine.enemy;

    if (winner === 'hero') {
      const levelBefore = SA.getLevelFromXP(this.saveData.xp);
      this.saveData.xp        += xpGained;
      this.saveData.battlesWon = (this.saveData.battlesWon || 0) + 1;

      // Gold reward: 5–15 base + (enemy level × 2)
      const goldBase  = 5 + Math.floor(Math.random() * 11);
      const goldBonus = (enemy.level || 1) * 2;
      const goldGained = goldBase + goldBonus;
      this.saveData.gold = (this.saveData.gold || 0) + goldGained;
      result.goldGained = goldGained;

      const levelAfter = SA.getLevelFromXP(this.saveData.xp);

      // Add spell drop to collection if new
      if (spellDrop && !this.saveData.collectedSpellIds.includes(spellDrop.id)) {
        this.saveData.collectedSpellIds.push(spellDrop.id);
        // Auto-equip if < 6 equipped
        if (this.saveData.equippedSpellIds.length < 6) {
          this.saveData.equippedSpellIds.push(spellDrop.id);
        }
      }

      SA.SaveManager.save(this.saveData);

      // Show victory screen
      setTimeout(() => {
        this._clearScreen('screen-victory');
        const view = new SA.VictoryView(this.screenEl);
        view.show({
          enemy,
          xpGained,
          goldGained: result.goldGained || 0,
          levelBefore,
          levelAfter,
          spellDrop,
          onContinue: () => {
            // Handle level-up if needed
            if (levelAfter > levelBefore) {
              this._showLevelUp(levelAfter);
            } else {
              this._showWorld();
            }
          }
        });
      }, 800);
    } else {
      this.saveData.battlesLost = (this.saveData.battlesLost || 0) + 1;
      SA.SaveManager.save(this.saveData);

      setTimeout(() => {
        this._clearScreen('screen-defeat');
        const view = new SA.DefeatView(this.screenEl);
        view.show({
          enemy,
          onRetry: () => this._startBattle(this._battleEnemyDef, this._battleEnemyLevel),
          onWorld: () => this._showWorld()
        });
      }, 800);
    }
  }

  _showLevelUp(newLevel) {
    this._clearScreen('screen-levelup');
    const view = new SA.LevelUpView(this.screenEl);
    view.show({
      newLevel,
      onChoice: (choice) => {
        this.saveData.statChoices.push(choice);
        SA.SaveManager.save(this.saveData);
        this._showWorld();
      }
    });
  }
};

// ─── BOOTSTRAP ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.game = new SA.Game();
});
