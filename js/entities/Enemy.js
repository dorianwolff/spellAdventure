'use strict';
window.SA = window.SA || {};

SA.Enemy = class Enemy extends SA.Combatant {
  constructor(enemyDef, level) {
    // Scale stats by level
    const base = enemyDef.baseStats;
    const scale = 1 + (level - 1) * 0.15;
    const stats = {
      maxHp:    Math.floor(base.hp  * scale),
      hp:       Math.floor(base.hp  * scale),
      atk:      Math.floor(base.atk * scale),
      spd:      base.spd,
      mana:     base.mana,
      maxMana:  base.maxMana
    };

    super({
      name: enemyDef.name,
      stats,
      spellIds: enemyDef.spellIds,
      element: enemyDef.element
    });

    this.def = enemyDef;
    this.level = level;
    this.weakTo      = enemyDef.weakTo || [];
    this.resistantTo = enemyDef.resistantTo || [];
    this.immuneTo    = enemyDef.immuneTo || [];
    this.animKey     = enemyDef.sprite;
    this.animData    = SA.ENEMY_ANIMS[enemyDef.sprite];
  }

  isImmuneTo(statusId) {
    return this.immuneTo.includes(statusId);
  }

  getWeaknessMultiplier(element) {
    if (this.weakTo.includes(element))      return 1.5;
    if (this.resistantTo.includes(element)) return 0.5;
    // Also check the global type chart
    const chartMult = SA.getTypeMultiplier(element, this.element);
    return chartMult;
  }
};
