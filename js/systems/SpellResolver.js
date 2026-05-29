'use strict';
window.SA = window.SA || {};

SA.SpellResolver = {
  // Returns array of battle events describing what happened
  resolve(spell, caster, target, opponent) {
    const events = [];

    for (const effect of spell.effects) {
      switch (effect.type) {
        case 'damage':
          events.push(...this._resolveDamage(effect, spell, caster, target));
          break;
        case 'heal':
          events.push(...this._resolveHeal(effect, caster, target));
          break;
        case 'mana':
          events.push(...this._resolveMana(effect, caster));
          break;
        case 'mana_steal':
          events.push(...this._resolveManasteal(effect, caster, opponent));
          break;
        case 'status':
          events.push(...this._resolveStatus(effect, spell, caster, target, opponent));
          break;
        case 'blood_pact':
          events.push(...this._resolveBloodPact(effect, caster, target));
          break;
      }
    }

    return events;
  },

  _resolveDamage(effect, spell, caster, target) {
    const events = [];
    let baseDmg = caster.stats.atk * effect.power;

    // Element multiplier: use enemy's specific weakTo/resistantTo first, then type chart
    let elemMult;
    if (target instanceof SA.Enemy) {
      elemMult = target.getWeaknessMultiplier(effect.element);
    } else {
      elemMult = SA.getTypeMultiplier(effect.element, target.element || 'physical');
    }

    // Piercing (cyclone ignores 50% of a defense reduction)
    const piercing = effect.piercing || 0;

    // Apply incoming damage multiplier from status effects (shock, curse, ward)
    const statusMult = target.getIncomingDamageMultiplier();

    // Final calc
    let dmg = baseDmg * elemMult * statusMult;
    // Small RNG variance ±10%
    dmg *= 0.90 + Math.random() * 0.20;
    dmg = Math.max(1, Math.floor(dmg));

    // Crit: 10% base chance
    let crit = false;
    if (Math.random() < 0.10) {
      dmg = Math.floor(dmg * 1.5);
      crit = true;
    }

    const dealt = target.takeDamage(dmg);

    const effectText = SA.getTypeEffectivenessText(elemMult);

    events.push({
      type: 'damage',
      amount: dealt,
      element: effect.element,
      target: target.name,
      crit,
      effective: effectText,
      targetDied: !target.isAlive
    });

    return events;
  },

  _resolveHeal(effect, caster, target) {
    let amount;
    if (effect.basedOn === 'maxHp') {
      amount = target.stats.maxHp * effect.power;
    } else {
      amount = caster.stats.atk * (effect.power || 1);
    }
    const healed = target.heal(amount);
    return [{ type: 'heal', amount: healed, target: target.name }];
  },

  _resolveMana(effect, caster) {
    const before = caster.stats.mana;
    caster.gainMana(effect.amount);
    const gained = caster.stats.mana - before;
    return [{ type: 'mana', amount: gained, target: caster.name }];
  },

  _resolveManasteal(effect, caster, victim) {
    const stolen = Math.min(victim.stats.mana, effect.amount);
    victim.spendMana(stolen);
    caster.gainMana(stolen);
    return [{ type: 'mana_steal', amount: stolen, from: victim.name, to: caster.name }];
  },

  _resolveStatus(effect, spell, caster, target, opponent) {
    // Determine the actual target (self vs enemy)
    const actualTarget = effect.applyTo === 'self' ? caster : target;

    if (Math.random() > effect.chance) {
      return [{ type: 'status_miss', statusId: effect.statusId, target: actualTarget.name }];
    }

    // Check immunity
    if (actualTarget.isImmuneTo && actualTarget.isImmuneTo(effect.statusId)) {
      return [{ type: 'status_immune', statusId: effect.statusId, target: actualTarget.name }];
    }

    const def = SA.STATUS_EFFECTS[effect.statusId];
    if (!def) return [];

    actualTarget.applyStatus(effect.statusId, def.defaultDuration);
    return [{ type: 'status_applied', statusId: effect.statusId, target: actualTarget.name, def }];
  },

  _resolveBloodPact(effect, caster, target) {
    const events = [];
    const sacrifice = Math.floor(caster.stats.hp * effect.hpFraction);
    if (sacrifice <= 0) return [{ type: 'blood_pact_fail', msg: 'Not enough HP!' }];

    caster.takeDamage(sacrifice);
    events.push({ type: 'blood_pact_cost', amount: sacrifice, caster: caster.name });

    if (!caster.isAlive) {
      events.push({ type: 'death', target: caster.name, self: true });
      return events;
    }

    const dmg = Math.floor(sacrifice * effect.multiplier);
    const dealt = target.takeDamage(dmg);
    events.push({
      type: 'damage',
      amount: dealt,
      element: effect.element,
      target: target.name,
      crit: false,
      targetDied: !target.isAlive
    });

    return events;
  }
};
