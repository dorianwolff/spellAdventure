'use strict';
window.SA = window.SA || {};

// ─── STATUS EFFECT DEFINITIONS ───────────────────────────────────────────────
SA.STATUS_EFFECTS = {
  burn: {
    id: 'burn', name: 'Burn', emoji: '🔥', color: '#ff6b35', bgColor: 'rgba(255,107,53,0.2)',
    defaultDuration: 3,
    onTurnStart(affected) {
      const dmg = Math.max(1, Math.floor(affected.stats.atk * 0.25));
      return { type: 'damage', amount: dmg, element: 'fire', msg: `${affected.name} burns for ${dmg} damage!` };
    }
  },
  freeze: {
    id: 'freeze', name: 'Freeze', emoji: '❄️', color: '#7dd3fc', bgColor: 'rgba(125,211,252,0.2)',
    defaultDuration: 1,
    skipsTurn: true
  },
  poison: {
    id: 'poison', name: 'Poison', emoji: '☠️', color: '#86efac', bgColor: 'rgba(134,239,172,0.2)',
    defaultDuration: 3,
    onTurnStart(affected) {
      const dmg = Math.max(1, Math.floor(affected.stats.maxHp * 0.08));
      return { type: 'damage', amount: dmg, element: 'poison', msg: `${affected.name} writhes in poison for ${dmg} damage!` };
    }
  },
  bleed: {
    id: 'bleed', name: 'Bleed', emoji: '🩸', color: '#f87171', bgColor: 'rgba(248,113,113,0.2)',
    defaultDuration: 2,
    onTurnStart(affected) {
      const dmg = Math.max(1, Math.floor(affected.stats.atk * 0.18));
      return { type: 'damage', amount: dmg, element: 'physical', msg: `${affected.name} bleeds for ${dmg} damage!` };
    }
  },
  shock: {
    id: 'shock', name: 'Shock', emoji: '⚡', color: '#fde68a', bgColor: 'rgba(253,230,138,0.2)',
    defaultDuration: 2,
    damageAmplifier: 0.20   // target takes 20% more damage
  },
  curse: {
    id: 'curse', name: 'Curse', emoji: '💀', color: '#c084fc', bgColor: 'rgba(192,132,252,0.2)',
    defaultDuration: 3,
    damageAmplifier: 0.25
  },
  slow: {
    id: 'slow', name: 'Slow', emoji: '🐌', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.2)',
    defaultDuration: 1,
    speedMod: -999
  },
  ward: {
    id: 'ward', name: 'Ward', emoji: '🛡️', color: '#e2e8f0', bgColor: 'rgba(226,232,240,0.2)',
    defaultDuration: 2,
    damageReduction: 0.40   // target takes 40% less damage
  },
  haste: {
    id: 'haste', name: 'Haste', emoji: '💨', color: '#67e8f9', bgColor: 'rgba(103,232,249,0.2)',
    defaultDuration: 1,
    speedMod: 6
  },
  regen: {
    id: 'regen', name: 'Regen', emoji: '💚', color: '#4ade80', bgColor: 'rgba(74,222,128,0.2)',
    defaultDuration: 2,
    onTurnStart(affected) {
      const amt = Math.max(1, Math.floor(affected.stats.maxHp * 0.08));
      return { type: 'heal', amount: amt, msg: `${affected.name} regenerates ${amt} HP!` };
    }
  }
};

// ─── SPELL DEFINITIONS ────────────────────────────────────────────────────────
SA.SPELLS = [
  // ── BASIC ──────────────────────────────────────────────────────────────────
  {
    id: 'strike',
    name: 'Strike',
    iconFile: null,
    element: 'physical',
    rarity: 'common',
    manaCost: 0,
    cooldown: 0,
    target: 'enemy',
    animType: 'attack',
    description: 'A basic attack. Deals 100% ATK as physical damage.',
    effects: [{ type: 'damage', power: 1.0, element: 'physical' }],
    starter: true
  },

  // ── CLASS STARTER SPELLS ───────────────────────────────────────────────────
  {
    id: 'flame_strike',
    name: 'Flame Strike',
    iconFile: 'Icon1',
    element: 'fire',
    rarity: 'common',
    manaCost: 0,
    cooldown: 0,
    target: 'enemy',
    animType: 'attack',
    description: 'A burning slash. Deals 100% ATK as fire damage.',
    effects: [{ type: 'damage', power: 1.0, element: 'fire' }],
    starter: true
  },
  {
    id: 'frost_strike',
    name: 'Frost Strike',
    iconFile: 'Icon7',
    element: 'ice',
    rarity: 'common',
    manaCost: 0,
    cooldown: 0,
    target: 'enemy',
    animType: 'attack',
    description: 'A chilling slash. Deals 100% ATK as ice damage.',
    effects: [{ type: 'damage', power: 1.0, element: 'ice' }],
    starter: true
  },
  {
    id: 'thorn_whip',
    name: 'Thorn Whip',
    iconFile: 'Icon6',
    element: 'poison',
    rarity: 'common',
    manaCost: 0,
    cooldown: 0,
    target: 'enemy',
    animType: 'attack',
    description: 'A lashing vine. Deals 100% ATK as poison damage.',
    effects: [{ type: 'damage', power: 1.0, element: 'poison' }],
    starter: true
  },
  {
    id: 'ember_barrage',
    name: 'Ember Barrage',
    iconFile: 'Icon2',
    element: 'fire',
    rarity: 'uncommon',
    manaCost: 2,
    cooldown: 1,
    target: 'enemy',
    animType: 'cast',
    description: 'A rapid volley of embers. 160% ATK fire. 25% chance to Burn.',
    effects: [
      { type: 'damage', power: 1.6, element: 'fire' },
      { type: 'status', statusId: 'burn', chance: 0.25, applyTo: 'enemy' }
    ],
    starter: true
  },
  {
    id: 'ice_lance',
    name: 'Ice Lance',
    iconFile: 'Icon8',
    element: 'ice',
    rarity: 'uncommon',
    manaCost: 2,
    cooldown: 1,
    target: 'enemy',
    animType: 'cast',
    description: 'A piercing lance of ice. 160% ATK ice. 40% chance to Freeze.',
    effects: [
      { type: 'damage', power: 1.6, element: 'ice' },
      { type: 'status', statusId: 'freeze', chance: 0.40, applyTo: 'enemy' }
    ],
    starter: true
  },
  {
    id: 'poison_spores',
    name: 'Poison Spores',
    iconFile: 'Icon4',
    element: 'poison',
    rarity: 'uncommon',
    manaCost: 2,
    cooldown: 1,
    target: 'enemy',
    animType: 'cast',
    description: 'Release toxic spores. 80% ATK + 80% Poison + 30% Bleed.',
    effects: [
      { type: 'damage', power: 0.8, element: 'poison' },
      { type: 'status', statusId: 'poison', chance: 0.80, applyTo: 'enemy' },
      { type: 'status', statusId: 'bleed',  chance: 0.30, applyTo: 'enemy' }
    ],
    starter: true
  },

  // ── ARCANE ─────────────────────────────────────────────────────────────────
  {
    id: 'mana_surge',
    name: 'Mana Surge',
    iconFile: 'Icon5',
    element: 'arcane',
    rarity: 'common',
    manaCost: 0,
    cooldown: 3,
    target: 'self',
    animType: 'cast',
    description: 'Channel arcane energy to restore 3 mana.',
    effects: [{ type: 'mana', amount: 3 }],
    starter: true
  },
  {
    id: 'mana_font',
    name: 'Mana Font',
    iconFile: 'Icon5',
    element: 'arcane',
    rarity: 'epic',
    manaCost: 0,
    cooldown: 5,
    target: 'self',
    animType: 'cast',
    description: 'Restore all mana and gain Haste for 1 turn.',
    effects: [
      { type: 'mana', amount: 99 },
      { type: 'status', statusId: 'haste', chance: 1.0, applyTo: 'self' }
    ]
  },

  // ── FIRE ───────────────────────────────────────────────────────────────────
  {
    id: 'ember_bolt',
    name: 'Ember Bolt',
    iconFile: 'Icon1',
    element: 'fire',
    rarity: 'common',
    manaCost: 1,
    cooldown: 0,
    target: 'enemy',
    animType: 'cast',
    description: 'Hurl a bolt of fire. 80% ATK fire damage.',
    effects: [{ type: 'damage', power: 0.8, element: 'fire' }]
  },
  {
    id: 'fireball',
    name: 'Fireball',
    iconFile: 'Icon2',
    element: 'fire',
    rarity: 'uncommon',
    manaCost: 2,
    cooldown: 2,
    target: 'enemy',
    animType: 'cast',
    description: 'Launch a blazing fireball. 150% ATK fire damage. 30% chance to Burn.',
    effects: [
      { type: 'damage', power: 1.5, element: 'fire' },
      { type: 'status', statusId: 'burn', chance: 0.30, applyTo: 'enemy' }
    ]
  },
  {
    id: 'inferno',
    name: 'Inferno',
    iconFile: 'Icon3',
    element: 'fire',
    rarity: 'rare',
    manaCost: 3,
    cooldown: 3,
    target: 'enemy',
    animType: 'cast',
    description: 'Engulf the enemy in searing flames. 200% ATK fire. 80% chance to Burn.',
    effects: [
      { type: 'damage', power: 2.0, element: 'fire' },
      { type: 'status', statusId: 'burn', chance: 0.80, applyTo: 'enemy' }
    ]
  },

  // ── ICE ────────────────────────────────────────────────────────────────────
  {
    id: 'frost_shard',
    name: 'Frost Shard',
    iconFile: 'Icon7',
    element: 'ice',
    rarity: 'common',
    manaCost: 1,
    cooldown: 0,
    target: 'enemy',
    animType: 'cast',
    description: 'Launch a shard of ice. 80% ATK ice damage. 30% chance to Slow.',
    effects: [
      { type: 'damage', power: 0.8, element: 'ice' },
      { type: 'status', statusId: 'slow', chance: 0.30, applyTo: 'enemy' }
    ]
  },
  {
    id: 'blizzard',
    name: 'Blizzard',
    iconFile: 'Icon8',
    element: 'ice',
    rarity: 'rare',
    manaCost: 3,
    cooldown: 3,
    target: 'enemy',
    animType: 'cast',
    description: 'Summon a blizzard. 180% ATK ice damage. 70% chance to Freeze.',
    effects: [
      { type: 'damage', power: 1.8, element: 'ice' },
      { type: 'status', statusId: 'freeze', chance: 0.70, applyTo: 'enemy' }
    ]
  },

  // ── LIGHTNING ──────────────────────────────────────────────────────────────
  {
    id: 'shock',
    name: 'Shock',
    iconFile: 'Icon9',
    element: 'lightning',
    rarity: 'common',
    manaCost: 1,
    cooldown: 0,
    target: 'enemy',
    animType: 'cast',
    description: 'Strike with a bolt of lightning. 90% ATK lightning damage.',
    effects: [{ type: 'damage', power: 0.9, element: 'lightning' }]
  },
  {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    iconFile: 'Icon10',
    element: 'lightning',
    rarity: 'uncommon',
    manaCost: 2,
    cooldown: 2,
    target: 'enemy',
    animType: 'cast',
    description: 'Lightning that weakens armor. 130% ATK lightning. 50% chance to Shock.',
    effects: [
      { type: 'damage', power: 1.3, element: 'lightning' },
      { type: 'status', statusId: 'shock', chance: 0.50, applyTo: 'enemy' }
    ]
  },

  // ── POISON ─────────────────────────────────────────────────────────────────
  {
    id: 'venom_strike',
    name: 'Venom Strike',
    iconFile: 'Icon6',
    element: 'poison',
    rarity: 'uncommon',
    manaCost: 2,
    cooldown: 2,
    target: 'enemy',
    animType: 'attack',
    description: 'A strike laced with poison. 70% ATK. 60% chance to Poison.',
    effects: [
      { type: 'damage', power: 0.7, element: 'poison' },
      { type: 'status', statusId: 'poison', chance: 0.60, applyTo: 'enemy' }
    ]
  },
  {
    id: 'toxic_cloud',
    name: 'Toxic Cloud',
    iconFile: 'Icon4',
    element: 'poison',
    rarity: 'rare',
    manaCost: 3,
    cooldown: 3,
    target: 'enemy',
    animType: 'cast',
    description: 'A cloud of toxins. 80% chance Poison and 60% chance Bleed.',
    effects: [
      { type: 'damage', power: 0.5, element: 'poison' },
      { type: 'status', statusId: 'poison', chance: 0.80, applyTo: 'enemy' },
      { type: 'status', statusId: 'bleed', chance: 0.60, applyTo: 'enemy' }
    ]
  },

  // ── HOLY ───────────────────────────────────────────────────────────────────
  {
    id: 'smite',
    name: 'Smite',
    iconFile: 'Icon12',
    element: 'holy',
    rarity: 'uncommon',
    manaCost: 2,
    cooldown: 2,
    target: 'enemy',
    animType: 'cast',
    description: 'Call divine wrath. 120% ATK holy damage. Extra effective vs Shadow.',
    effects: [{ type: 'damage', power: 1.2, element: 'holy' }]
  },
  {
    id: 'healing_light',
    name: 'Healing Light',
    iconFile: 'Icon13',
    element: 'holy',
    rarity: 'common',
    manaCost: 2,
    cooldown: 3,
    target: 'self',
    animType: 'cast',
    description: 'Bathe in healing light. Restore 30% of max HP.',
    effects: [{ type: 'heal', power: 0.30, basedOn: 'maxHp' }]
  },
  {
    id: 'divine_shield',
    name: 'Divine Shield',
    iconFile: 'Icon14',
    element: 'holy',
    rarity: 'rare',
    manaCost: 3,
    cooldown: 4,
    target: 'self',
    animType: 'cast',
    description: 'Invoke a divine barrier. Gain Ward and Regen for 2 turns.',
    effects: [
      { type: 'status', statusId: 'ward', chance: 1.0, applyTo: 'self' },
      { type: 'status', statusId: 'regen', chance: 1.0, applyTo: 'self' }
    ]
  },

  // ── SHADOW ─────────────────────────────────────────────────────────────────
  {
    id: 'soul_drain',
    name: 'Soul Drain',
    iconFile: 'Icon16',
    element: 'shadow',
    rarity: 'uncommon',
    manaCost: 2,
    cooldown: 2,
    target: 'enemy',
    animType: 'cast',
    description: "Drain the enemy's life force. 100% ATK shadow damage, steal 2 mana.",
    effects: [
      { type: 'damage', power: 1.0, element: 'shadow' },
      { type: 'mana_steal', amount: 2 }
    ]
  },
  {
    id: 'curse',
    name: 'Curse',
    iconFile: 'Icon15',
    element: 'shadow',
    rarity: 'rare',
    manaCost: 2,
    cooldown: 3,
    target: 'enemy',
    animType: 'cast',
    description: 'Curse the enemy. They take 25% more damage for 3 turns.',
    effects: [
      { type: 'status', statusId: 'curse', chance: 1.0, applyTo: 'enemy' }
    ]
  },
  {
    id: 'blood_pact',
    name: 'Blood Pact',
    iconFile: 'Icon11',
    element: 'shadow',
    rarity: 'epic',
    manaCost: 1,
    cooldown: 4,
    target: 'enemy',
    animType: 'cast',
    description: 'Sacrifice 25% of current HP to deal 4x that amount as shadow damage.',
    effects: [{ type: 'blood_pact', hpFraction: 0.25, multiplier: 4.0, element: 'shadow' }]
  },

  // ── EARTH ──────────────────────────────────────────────────────────────────
  {
    id: 'rock_throw',
    name: 'Rock Throw',
    iconFile: 'Icon17',
    element: 'earth',
    rarity: 'common',
    manaCost: 1,
    cooldown: 0,
    target: 'enemy',
    animType: 'attack',
    description: 'Hurl a heavy boulder. 110% ATK earth damage.',
    effects: [{ type: 'damage', power: 1.1, element: 'earth' }]
  },
  {
    id: 'earthquake',
    name: 'Earthquake',
    iconFile: 'Icon18',
    element: 'earth',
    rarity: 'epic',
    manaCost: 3,
    cooldown: 4,
    target: 'enemy',
    animType: 'cast',
    description: 'Trigger a devastating earthquake. 250% ATK earth damage.',
    effects: [{ type: 'damage', power: 2.5, element: 'earth' }]
  },

  // ── WIND ───────────────────────────────────────────────────────────────────
  {
    id: 'gust',
    name: 'Gust',
    iconFile: 'Icon19',
    element: 'wind',
    rarity: 'common',
    manaCost: 1,
    cooldown: 0,
    target: 'enemy',
    animType: 'cast',
    description: 'Blast with wind. 80% ATK wind damage. Gain Haste this turn.',
    effects: [
      { type: 'damage', power: 0.8, element: 'wind' },
      { type: 'status', statusId: 'haste', chance: 1.0, applyTo: 'self' }
    ]
  },
  {
    id: 'cyclone',
    name: 'Cyclone',
    iconFile: 'Icon20',
    element: 'wind',
    rarity: 'rare',
    manaCost: 3,
    cooldown: 3,
    target: 'enemy',
    animType: 'cast',
    description: 'Unleash a cyclone. 170% ATK wind damage. Ignores 50% of defense.',
    effects: [{ type: 'damage', power: 1.7, element: 'wind', piercing: 0.5 }]
  },

  // ── BONUS WARD (enemy/player acquirable) ───────────────────────────────────
  {
    id: 'ward',
    name: 'Ward',
    iconFile: 'Icon14',
    element: 'holy',
    rarity: 'uncommon',
    manaCost: 1,
    cooldown: 3,
    target: 'self',
    animType: 'cast',
    description: 'Create a protective barrier. Reduce incoming damage by 40% for 2 turns.',
    effects: [{ type: 'status', statusId: 'ward', chance: 1.0, applyTo: 'self' }]
  }
];

// Build a fast lookup map
SA.SPELLS_MAP = Object.fromEntries(SA.SPELLS.map(s => [s.id, s]));
