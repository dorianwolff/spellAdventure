'use strict';
window.SA = window.SA || {};

// ─── BATTLE ENGINE ────────────────────────────────────────────────────────────
// Orchestrates turn-based combat between Hero and Enemy.
// Communicates with the UI through SA.EventBus events.

SA.BattleEngine = class BattleEngine {
  constructor(hero, enemy) {
    this.hero  = hero;
    this.enemy = enemy;
    this.turn  = 0;       // 0 = not started
    this.phase = 'idle';  // idle | hero_turn | enemy_turn | finished

    // Whose turn is it currently
    this.activeFirst = null;  // 'hero' | 'enemy'
    this.currentActor = null; // 'hero' | 'enemy'

    // Log of battle messages
    this.log = [];

    // Whether we're waiting for player input
    this.awaitingInput = false;

    // Battle result
    this.result = null;  // null | { winner: 'hero'|'enemy', xpGained, spellDrop }
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────────
  start() {
    this.phase = 'active';
    this.turn  = 1;
    this.hero.resetForBattle();
    this.enemy.resetForBattle();
    this._determineTurnOrder();
    this._emit('battle:start', { hero: this.hero, enemy: this.enemy, firstActor: this.currentActor });
    this._addLog(`⚔️ ${this.enemy.name} appeared!`);
    if (this.currentActor === 'hero') {
      this._addLog('🧙 Your turn!');
    } else {
      this._addLog(`💀 ${this.enemy.name} moves first!`);
    }
    this._startTurn();
  }

  // Called by UI when player selects a spell
  heroAction(spellId) {
    if (!this.awaitingInput || this.currentActor !== 'hero') return;
    const spell = SA.SPELLS_MAP[spellId];
    if (!spell || !this.hero.canUseSpell(spell)) return;

    this.awaitingInput = false;
    this._performAction(this.hero, this.enemy, spell);
  }

  // ── TURN FLOW ──────────────────────────────────────────────────────────────
  _determineTurnOrder() {
    const heroSpd  = this.hero.getEffectiveSpeed();
    const enemySpd = this.enemy.getEffectiveSpeed();
    if (heroSpd > enemySpd) {
      this.currentActor = 'hero';
    } else if (enemySpd > heroSpd) {
      this.currentActor = 'enemy';
    } else {
      this.currentActor = Math.random() < 0.5 ? 'hero' : 'enemy';
    }
    this.activeFirst = this.currentActor;
  }

  _startTurn() {
    if (this.phase !== 'active') return;

    const actor = this.currentActor === 'hero' ? this.hero : this.enemy;

    // Tick cooldowns
    actor.tickCooldowns();

    // Process status effects at start of turn
    const statusResults = actor.tickStatusEffects();
    for (const r of statusResults) {
      if (r.type === 'damage') {
        this._addLog(r.msg || `${actor.name} takes ${r.amount} ${r.statusId} damage!`);
        this._emit('battle:status_damage', { target: this.currentActor, amount: r.amount, statusId: r.statusId });
      } else if (r.type === 'heal') {
        this._addLog(r.msg || `${actor.name} regenerates ${r.amount} HP!`);
        this._emit('battle:heal', { target: this.currentActor, amount: r.amount });
      }
    }

    // Check if status damage killed the actor
    if (!actor.isAlive) {
      this._addLog(`💀 ${actor.name} fell from their wounds!`);
      this._endBattle(this.currentActor === 'hero' ? 'enemy' : 'hero');
      return;
    }

    // Check for freeze (skip turn)
    if (actor.hasStatus('freeze')) {
      actor.removeStatus('freeze');
      this._addLog(`❄️ ${actor.name} is frozen and cannot move!`);
      this._emit('battle:frozen', { target: this.currentActor });
      setTimeout(() => this._endTurn(), 1200);
      return;
    }

    // Now take action
    if (this.currentActor === 'hero') {
      this.awaitingInput = true;
      this._emit('battle:await_input', { hero: this.hero });
    } else {
      // Enemy AI picks spell
      setTimeout(() => {
        const spell = SA.AIBrain.chooseSpell(this.enemy, this.hero);
        if (spell) {
          this._performAction(this.enemy, this.hero, spell);
        } else {
          // No usable spell – skip turn
          this._addLog(`${this.enemy.name} has no usable spells and braces!`);
          this._emit('battle:skip', { actor: 'enemy' });
          setTimeout(() => this._endTurn(), 1000);
        }
      }, 600);
    }
  }

  _performAction(caster, target, spell) {
    // Spend mana
    caster.spendMana(spell.manaCost);

    // Trigger cooldown
    caster.triggerCooldown(spell);

    const actorKey = caster === this.hero ? 'hero' : 'enemy';
    const targetKey = target === this.hero ? 'hero' : 'enemy';

    this._addLog(`✨ ${caster.name} uses ${spell.name}!`);
    this._emit('battle:cast', {
      actor: actorKey,
      target: targetKey,
      spell,
      animType: spell.animType
    });

    // Resolve after animation delay
    setTimeout(() => {
      const events = SA.SpellResolver.resolve(spell, caster, target, target === this.hero ? this.enemy : this.hero);
      this._processEvents(events, actorKey, targetKey, spell);
    }, 700);
  }

  _processEvents(events, actorKey, targetKey, spell) {
    for (const ev of events) {
      switch (ev.type) {
        case 'damage':
          this._addLog(this._buildDamageMsg(ev, spell));
          this._emit('battle:damage', { target: ev.target === this.hero.name ? 'hero' : 'enemy', amount: ev.amount, crit: ev.crit, element: ev.element });
          if (ev.targetDied) {
            const loserKey = ev.target === this.hero.name ? 'hero' : 'enemy';
            this._emit('battle:die', { target: loserKey });
          }
          break;
        case 'heal':
          this._addLog(`💚 ${ev.target} recovered ${ev.amount} HP!`);
          this._emit('battle:heal', { target: ev.target === this.hero.name ? 'hero' : 'enemy', amount: ev.amount });
          break;
        case 'mana':
          this._addLog(`🔷 ${ev.target} restored ${ev.amount} MP!`);
          this._emit('battle:mana', { target: ev.target === this.hero.name ? 'hero' : 'enemy', amount: ev.amount });
          break;
        case 'mana_steal':
          this._addLog(`💜 ${ev.to} stole ${ev.amount} MP from ${ev.from}!`);
          this._emit('battle:mana', { target: ev.to === this.hero.name ? 'hero' : 'enemy', amount: ev.amount });
          break;
        case 'status_applied':
          this._addLog(`${ev.def.emoji} ${ev.target} is now ${ev.def.name}!`);
          this._emit('battle:status', { target: ev.target === this.hero.name ? 'hero' : 'enemy', statusId: ev.statusId });
          break;
        case 'status_immune':
          this._addLog(`🛡️ ${ev.target} is immune to ${ev.statusId}!`);
          break;
        case 'status_miss':
          // Silently fail
          break;
        case 'blood_pact_cost':
          this._addLog(`🩸 ${ev.caster} sacrifices ${ev.amount} HP!`);
          this._emit('battle:damage', { target: ev.caster === this.hero.name ? 'hero' : 'enemy', amount: ev.amount, self: true });
          break;
        case 'death':
          this._emit('battle:die', { target: ev.target === this.hero.name ? 'hero' : 'enemy' });
          break;
      }
    }

    // Check battle end
    setTimeout(() => {
      if (!this.hero.isAlive) {
        this._endBattle('enemy');
      } else if (!this.enemy.isAlive) {
        this._endBattle('hero');
      } else {
        this._emit('battle:update_ui', { hero: this.hero, enemy: this.enemy });
        setTimeout(() => this._endTurn(), 300);
      }
    }, 400);
  }

  _buildDamageMsg(ev, spell) {
    let msg = `💥 ${ev.target} takes ${ev.amount}${ev.element !== 'physical' ? ' ' + ev.element : ''} damage!`;
    if (ev.crit) msg += ' Critical hit!';
    if (ev.effective) msg += ` ${ev.effective}`;
    return msg;
  }

  _endTurn() {
    if (this.phase !== 'active') return;
    this.turn++;
    this.currentActor = this.currentActor === 'hero' ? 'enemy' : 'hero';

    if (this.currentActor === 'hero') {
      this._addLog('━━━ Your Turn ━━━');
    } else {
      this._addLog(`━━━ ${this.enemy.name}'s Turn ━━━`);
    }

    this._emit('battle:turn_change', { actor: this.currentActor, turn: this.turn });
    setTimeout(() => this._startTurn(), 300);
  }

  _endBattle(winner) {
    if (this.phase === 'finished') return;
    this.phase = 'finished';

    let xpGained = 0;
    let spellDrop = null;

    if (winner === 'hero') {
      this._addLog(`🏆 Victory! ${this.enemy.name} was defeated!`);
      xpGained = this.enemy.def.expReward + this.enemy.level * 3;
      // Spell drop
      const drop = this.enemy.def.spellDrop;
      if (drop && Math.random() <= drop.chance) {
        spellDrop = SA.SPELLS_MAP[drop.id];
      }
    } else {
      this._addLog(`💀 You were defeated by ${this.enemy.name}...`);
    }

    this.result = { winner, xpGained, spellDrop };

    setTimeout(() => {
      this._emit('battle:end', this.result);
    }, 1500);
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  _addLog(msg) {
    this.log.push(msg);
    this._emit('battle:log', { msg, log: this.log });
  }

  _emit(event, data) {
    SA.EventBus.emit(event, data);
  }
};
