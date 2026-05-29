'use strict';
window.SA = window.SA || {};

SA.AIBrain = {
  // Choose a spell for the AI enemy to use
  chooseSpell(enemy, hero) {
    const usable = enemy.spells.filter(s => enemy.canUseSpell(s));
    if (!usable.length) return null;

    const hpFraction = enemy.hpFraction;

    // PRIORITY 1: Heal if critically low HP
    if (hpFraction < 0.25) {
      const heal = usable.find(s => s.effects.some(e => e.type === 'heal'));
      if (heal) return heal;
    }

    // PRIORITY 2: Use mana restoration if out of mana and have expensive spells
    if (enemy.mana <= 1) {
      const manaSpell = usable.find(s => s.effects.some(e => e.type === 'mana'));
      if (manaSpell) return manaSpell;
    }

    // PRIORITY 3: Use a curse/debuff on hero if hero has no debuffs yet
    if (!hero.hasStatus('curse') && !hero.hasStatus('shock')) {
      const debuff = usable.find(s =>
        s.effects.some(e => e.type === 'status' && e.applyTo !== 'self')
        && s.manaCost <= enemy.mana
      );
      if (debuff && Math.random() < 0.4) return debuff;
    }

    // PRIORITY 4: Use the highest-damage spell available
    const damageSpells = usable
      .filter(s => s.effects.some(e => e.type === 'damage' || e.type === 'blood_pact'))
      .sort((a, b) => this._estimateDamage(b, enemy) - this._estimateDamage(a, enemy));

    if (damageSpells.length) {
      // 70% chance to use best damage spell, 30% chance to use any usable spell
      if (Math.random() < 0.70) return damageSpells[0];
    }

    // Fallback: random usable spell
    return usable[Math.floor(Math.random() * usable.length)];
  },

  _estimateDamage(spell, caster) {
    const dmgEffect = spell.effects.find(e => e.type === 'damage');
    if (!dmgEffect) return 0;
    return caster.stats.atk * (dmgEffect.power || 1);
  }
};
