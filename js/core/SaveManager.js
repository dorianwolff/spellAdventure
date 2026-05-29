'use strict';
window.SA = window.SA || {};

SA.SaveManager = {
  KEY: 'spellAdventure_save',

  // Default new-game state
  defaultSave() {
    return {
      version: 2,
      heroName: 'Arcanis',
      charClass: 'pyromancer',
      xp: 0,
      gold: 0,
      // Permanent stats (base values, grow with level-up choices)
      baseStats: { hp: 100, atk: 10, spd: 5 },
      // Level-up history: array of 'hp'|'atk'|'spd' choices
      statChoices: [],
      // Mana is always 5 (restored at end of each battle)
      maxMana: 5,
      // Spells in the player's collection (spell IDs)
      collectedSpellIds: ['mana_surge', 'flame_strike', 'ember_barrage'],
      // Spells currently equipped for battle (up to 6)
      equippedSpellIds: ['flame_strike', 'ember_barrage'],
      // Records which enemies have been fought and which spell drop was obtained
      spellDropsReceived: {},
      // Zone completion (how many encounters done)
      zoneProgress: {},
      // Map exploration state: which objects have been collected
      mapState: { bog: { collected: [] }, cursed: { collected: [] } },
      // Total battles won/lost
      battlesWon: 0,
      battlesLost: 0,
      totalDamageDealt: 0,
      // Creation timestamp
      createdAt: Date.now(),
      lastSavedAt: Date.now()
    };
  },

  hasSave() {
    return !!localStorage.getItem(this.KEY);
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Migrate / fill missing fields from defaults
      return Object.assign({}, this.defaultSave(), data);
    } catch {
      return null;
    }
  },

  save(data) {
    data.lastSavedAt = Date.now();
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },

  delete() {
    localStorage.removeItem(this.KEY);
  },

  // Calculate derived stats from save data
  computeStats(saveData) {
    const base = saveData.baseStats;
    let bonusHp = 0, bonusAtk = 0, bonusSpd = 0;
    for (const choice of saveData.statChoices) {
      if (choice === 'hp')  bonusHp  += 2;
      if (choice === 'atk') bonusAtk += 1;
      if (choice === 'spd') bonusSpd += 1;
    }
    const maxHp  = base.hp  + bonusHp;
    const atk    = base.atk + bonusAtk;
    const spd    = base.spd + bonusSpd;
    return { maxHp, atk, spd, mana: saveData.maxMana, maxMana: saveData.maxMana };
  },

  computeLevel(saveData) {
    return SA.getLevelFromXP(saveData.xp);
  }
};
