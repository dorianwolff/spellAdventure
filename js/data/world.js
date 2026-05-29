'use strict';
window.SA = window.SA || {};

// ─── ELEMENT TYPE CHART ───────────────────────────────────────────────────────
// multiplier = how much damage type deals to enemy element
// 2.0 = super effective, 0.5 = not very effective, 0 = immune
SA.TYPE_CHART = {
  //        vs: earth  fire   ice    lightning poison  holy   shadow wind   physical arcane
  physical: { earth:1.0, fire:1.0, ice:1.0, lightning:1.0, poison:1.0, holy:1.0, shadow:1.0, wind:1.0, physical:1.0, arcane:1.0 },
  fire:     { earth:1.5, fire:0.5, ice:2.0, lightning:1.0, poison:1.0, holy:1.0, shadow:1.5, wind:0.5, physical:1.0, arcane:1.0 },
  ice:      { earth:1.5, fire:0.5, ice:0.5, lightning:1.5, poison:1.0, holy:1.0, shadow:1.0, wind:1.0, physical:1.0, arcane:1.0 },
  lightning:{ earth:0.5, fire:1.0, ice:1.0, lightning:0.5, poison:1.5, holy:1.0, shadow:1.5, wind:2.0, physical:1.0, arcane:1.0 },
  poison:   { earth:1.0, fire:0.5, ice:1.0, lightning:1.0, poison:0.5, holy:0.5, shadow:1.5, wind:1.0, physical:1.0, arcane:1.0 },
  holy:     { earth:1.0, fire:1.0, ice:1.0, lightning:1.0, poison:2.0, holy:0.5, shadow:2.0, wind:1.0, physical:1.0, arcane:1.5 },
  shadow:   { earth:1.0, fire:0.5, ice:1.0, lightning:1.0, poison:1.5, holy:0.5, shadow:0.5, wind:1.0, physical:1.0, arcane:2.0 },
  wind:     { earth:2.0, fire:1.5, ice:1.0, lightning:0.5, poison:1.0, holy:1.0, shadow:1.0, wind:0.5, physical:1.0, arcane:1.0 },
  earth:    { earth:0.5, fire:1.0, ice:1.5, lightning:2.0, poison:1.0, holy:1.0, shadow:1.0, wind:0.5, physical:1.0, arcane:1.0 },
  arcane:   { earth:1.0, fire:1.0, ice:1.0, lightning:1.0, poison:1.0, holy:1.0, shadow:1.0, wind:1.0, physical:1.0, arcane:1.0 }
};

SA.getTypeMultiplier = function(spellElement, targetElement) {
  const row = SA.TYPE_CHART[spellElement];
  if (!row) return 1.0;
  return row[targetElement] ?? 1.0;
};

SA.getTypeEffectivenessText = function(mult) {
  if (mult >= 2.0) return 'Super effective!';
  if (mult >= 1.5) return 'Effective!';
  if (mult <= 0.0) return 'No effect!';
  if (mult <= 0.5) return 'Not very effective...';
  return null;
};

// ─── ELEMENT METADATA ─────────────────────────────────────────────────────────
SA.ELEMENTS = {
  physical:  { name: 'Physical',  color: '#94a3b8', emoji: '⚔️'  },
  fire:      { name: 'Fire',      color: '#f97316', emoji: '🔥'  },
  ice:       { name: 'Ice',       color: '#7dd3fc', emoji: '❄️'  },
  lightning: { name: 'Lightning', color: '#fde68a', emoji: '⚡'  },
  poison:    { name: 'Poison',    color: '#86efac', emoji: '☠️'  },
  holy:      { name: 'Holy',      color: '#fef9c3', emoji: '✨'  },
  shadow:    { name: 'Shadow',    color: '#c084fc', emoji: '🌑'  },
  wind:      { name: 'Wind',      color: '#67e8f9', emoji: '💨'  },
  earth:     { name: 'Earth',     color: '#a3835b', emoji: '🪨'  },
  arcane:    { name: 'Arcane',    color: '#a78bfa', emoji: '🔮'  }
};

// ─── ZONES ───────────────────────────────────────────────────────────────────
SA.ZONES = [
  {
    id: 'bog',
    name: 'The Murky Bog',
    description: 'A fetid swamp where orc tribes lurk beneath twisted roots.',
    enemyIds: ['orc_grunt', 'orc_shaman'],
    requiredLevel: 1,
    bgTheme: 'bog',
    encounterCount: 5
  },
  {
    id: 'ember',
    name: 'Ember Wastes',
    description: 'Scorched earth where the heat shimmer hides fire-touched warriors.',
    enemyIds: ['fire_orc', 'orc_sorcerer'],
    requiredLevel: 4,
    bgTheme: 'ember',
    encounterCount: 5
  },
  {
    id: 'frozen',
    name: 'Frozen Peaks',
    description: 'Ice-capped mountains where frost giants and their orc servants roam.',
    enemyIds: ['frost_orc', 'orc_warlord'],
    requiredLevel: 7,
    bgTheme: 'frozen',
    encounterCount: 5
  },
  {
    id: 'shadow',
    name: 'Shadow Realm',
    description: 'A dimension of pure darkness where ancient spells fester and grow.',
    enemyIds: ['shadow_orc', 'orc_high_shaman'],
    requiredLevel: 11,
    bgTheme: 'shadow',
    encounterCount: 5
  }
];

SA.ZONES_MAP = Object.fromEntries(SA.ZONES.map(z => [z.id, z]));

// ─── CHARACTER CLASSES ────────────────────────────────────────────────────────
SA.CHARACTERS = [
  {
    id: 'pyromancer',
    name: 'Pyromancer',
    element: 'fire',
    description: 'A battle-hardened warrior who channels fire magic. High attack, lower HP.',
    lore: 'Born in the embers of the Volcano Wastes, this warrior burns with righteous fury.',
    baseStats: { hp: 90, atk: 12, spd: 5 },
    maxMana: 5,
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.15)',
    emoji: '🔥',
    starterSpells: ['flame_strike', 'ember_barrage'],
    sprite: 'lvl1'
  },
  {
    id: 'cryomancer',
    name: 'Cryomancer',
    element: 'ice',
    description: 'A resilient warrior who commands the power of frost. Highest HP, strong CC.',
    lore: 'Hardened by blizzards atop the Frozen Peaks, nothing can break this warrior\'s resolve.',
    baseStats: { hp: 110, atk: 10, spd: 5 },
    maxMana: 5,
    color: '#7dd3fc',
    bgColor: 'rgba(125,211,252,0.15)',
    emoji: '❄️',
    starterSpells: ['frost_strike', 'ice_lance'],
    sprite: 'lvl1'
  },
  {
    id: 'druid',
    name: 'Druid',
    element: 'poison',
    description: 'A swift warrior attuned to nature\'s deadly power. Fastest, great at DoT.',
    lore: 'Raised in the Murky Bog, this warrior communes with the ancient spirits of the swamp.',
    baseStats: { hp: 100, atk: 10, spd: 7 },
    maxMana: 5,
    color: '#4ade80',
    bgColor: 'rgba(74,222,128,0.15)',
    emoji: '🌿',
    starterSpells: ['thorn_whip', 'poison_spores'],
    sprite: 'lvl1'
  }
];
SA.CHARACTERS_MAP = Object.fromEntries(SA.CHARACTERS.map(c => [c.id, c]));

// ─── RARITY CONFIG ────────────────────────────────────────────────────────────
SA.RARITY = {
  common:    { name: 'Common',    color: '#9ca3af', glow: 'rgba(156,163,175,0.3)',  order: 1 },
  uncommon:  { name: 'Uncommon',  color: '#4ade80', glow: 'rgba(74,222,128,0.3)',   order: 2 },
  rare:      { name: 'Rare',      color: '#60a5fa', glow: 'rgba(96,165,250,0.3)',   order: 3 },
  epic:      { name: 'Epic',      color: '#c084fc', glow: 'rgba(192,132,252,0.4)',  order: 4 },
  legendary: { name: 'Legendary', color: '#fbbf24', glow: 'rgba(251,191,36,0.5)',   order: 5 }
};

// ─── XP TABLE ─────────────────────────────────────────────────────────────────
// XP required to reach each level (index = level, value = cumulative XP)
SA.XP_TABLE = [
  0,      // level 1
  50,     // level 2
  130,    // level 3
  260,    // level 4
  450,    // level 5
  700,    // level 6
  1020,   // level 7
  1420,   // level 8
  1910,   // level 9
  2500,   // level 10
  3200,   // level 11
  4020,   // level 12
  4980,   // level 13
  6100,   // level 14
  7400,   // level 15
  9000,   // level 16
  11000,  // level 17
  13500,  // level 18
  16500,  // level 19
  20000   // level 20
];

SA.getLevelFromXP = function(xp) {
  for (let i = SA.XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= SA.XP_TABLE[i]) return i + 1;
  }
  return 1;
};

SA.getXPForLevel = function(level) {
  return SA.XP_TABLE[Math.min(level - 1, SA.XP_TABLE.length - 1)] || 0;
};

SA.getXPForNextLevel = function(level) {
  return SA.XP_TABLE[Math.min(level, SA.XP_TABLE.length - 1)] || SA.XP_TABLE[SA.XP_TABLE.length - 1];
};
