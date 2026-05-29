'use strict';
window.SA = window.SA || {};

SA.Combatant = class Combatant {
  constructor({ name, stats, spellIds, element = 'physical' }) {
    this.name = name;
    this.element = element;
    this.stats = {
      maxHp: stats.maxHp || stats.hp,
      hp: stats.maxHp || stats.hp,
      atk: stats.atk,
      spd: stats.spd,
      mana: stats.mana || 0,
      maxMana: stats.maxMana || stats.mana || 0
    };
    this.spellIds = [...spellIds];
    this.spells = spellIds.map(id => SA.SPELLS_MAP[id]).filter(Boolean);

    // Cooldown tracking: { spellId: turnsRemaining }
    this.cooldowns = {};
    this.spellIds.forEach(id => { this.cooldowns[id] = 0; });

    // Active status effects: [{ id, turnsLeft, ...effectData }]
    this.statusEffects = [];

    // Battle-time flags
    this.isAlive = true;
    this.tookActionThisTurn = false;
  }

  // ── HP ─────────────────────────────────────────────────────────────────────
  get hp() { return this.stats.hp; }
  get maxHp() { return this.stats.maxHp; }
  get hpFraction() { return this.stats.hp / this.stats.maxHp; }

  takeDamage(amount) {
    const clamped = Math.max(0, Math.floor(amount));
    this.stats.hp = Math.max(0, this.stats.hp - clamped);
    if (this.stats.hp === 0) this.isAlive = false;
    return clamped;
  }

  heal(amount) {
    const clamped = Math.max(0, Math.floor(amount));
    const before = this.stats.hp;
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + clamped);
    return this.stats.hp - before;
  }

  // ── MANA ───────────────────────────────────────────────────────────────────
  get mana() { return this.stats.mana; }
  get maxMana() { return this.stats.maxMana; }

  spendMana(amount) {
    this.stats.mana = Math.max(0, this.stats.mana - amount);
  }

  gainMana(amount) {
    this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + amount);
  }

  canAffordSpell(spell) {
    return this.stats.mana >= spell.manaCost;
  }

  // ── COOLDOWNS ──────────────────────────────────────────────────────────────
  isOnCooldown(spellId) {
    return (this.cooldowns[spellId] || 0) > 0;
  }

  getCooldown(spellId) {
    return this.cooldowns[spellId] || 0;
  }

  triggerCooldown(spell) {
    if (spell.cooldown > 0) {
      this.cooldowns[spell.id] = spell.cooldown;
    }
  }

  tickCooldowns() {
    for (const id in this.cooldowns) {
      if (this.cooldowns[id] > 0) this.cooldowns[id]--;
    }
  }

  canUseSpell(spell) {
    if (!this.isAlive) return false;
    if (this.isOnCooldown(spell.id)) return false;
    if (!this.canAffordSpell(spell)) return false;
    return true;
  }

  // ── STATUS EFFECTS ─────────────────────────────────────────────────────────
  hasStatus(statusId) {
    return this.statusEffects.some(s => s.id === statusId);
  }

  getStatus(statusId) {
    return this.statusEffects.find(s => s.id === statusId);
  }

  applyStatus(statusId, duration) {
    const def = SA.STATUS_EFFECTS[statusId];
    if (!def) return false;
    // If already has status, refresh duration
    const existing = this.getStatus(statusId);
    if (existing) {
      existing.turnsLeft = Math.max(existing.turnsLeft, duration || def.defaultDuration);
      return true;
    }
    this.statusEffects.push({ id: statusId, turnsLeft: duration || def.defaultDuration });
    return true;
  }

  removeStatus(statusId) {
    this.statusEffects = this.statusEffects.filter(s => s.id !== statusId);
  }

  // Returns array of { msg, type, amount } from status ticks
  tickStatusEffects() {
    const results = [];
    const toRemove = [];

    for (const status of this.statusEffects) {
      const def = SA.STATUS_EFFECTS[status.id];
      if (!def) { toRemove.push(status.id); continue; }

      if (def.onTurnStart) {
        const result = def.onTurnStart(this);
        if (result) {
          if (result.type === 'damage') {
            const dealt = this.takeDamage(result.amount);
            results.push({ ...result, amount: dealt, statusId: status.id });
          } else if (result.type === 'heal') {
            const gained = this.heal(result.amount);
            results.push({ ...result, amount: gained, statusId: status.id });
          }
        }
      }

      status.turnsLeft--;
      if (status.turnsLeft <= 0) toRemove.push(status.id);
    }

    toRemove.forEach(id => this.removeStatus(id));
    return results;
  }

  // Get effective speed (modified by status effects)
  getEffectiveSpeed() {
    let spd = this.stats.spd;
    for (const status of this.statusEffects) {
      const def = SA.STATUS_EFFECTS[status.id];
      if (def && def.speedMod) spd += def.speedMod;
    }
    return spd;
  }

  // Get total incoming damage modifier from status effects
  getIncomingDamageMultiplier() {
    let mult = 1.0;
    for (const status of this.statusEffects) {
      const def = SA.STATUS_EFFECTS[status.id];
      if (def && def.damageAmplifier) mult += def.damageAmplifier;
      if (def && def.damageReduction)  mult -= def.damageReduction;
    }
    return Math.max(0, mult);
  }

  // Restore mana to full (called end of battle for hero)
  restoreMana() {
    this.stats.mana = this.stats.maxMana;
  }

  resetForBattle() {
    this.stats.hp = this.stats.maxHp;
    this.stats.mana = this.stats.maxMana;
    this.cooldowns = {};
    this.spellIds.forEach(id => { this.cooldowns[id] = 0; });
    this.statusEffects = [];
    this.isAlive = true;
  }

  isImmuneTo(statusId) { return false; }  // Overridden in Enemy
};
