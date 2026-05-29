'use strict';
window.SA = window.SA || {};

SA.Hero = class Hero extends SA.Combatant {
  constructor(saveData) {
    const level = SA.getLevelFromXP(saveData.xp);
    const stats = SA.SaveManager.computeStats(saveData);
    const charDef = SA.CHARACTERS_MAP[saveData.charClass] || SA.CHARACTERS[0];

    super({
      name: saveData.heroName,
      stats: { ...stats, hp: stats.maxHp },
      spellIds: saveData.equippedSpellIds,
      element: charDef.element || 'physical'
    });

    this.saveData = saveData;
    this.level = level;
    this.xp = saveData.xp;
    this.charClass = saveData.charClass || 'pyromancer';
    this.gold = saveData.gold || 0;
  }

  get animData() {
    return SA.getHeroAnims(this.level);
  }
};
