'use strict';
window.SA = window.SA || {};

// ─── SPRITE SHEET METADATA ────────────────────────────────────────────────────
// All enemy sprites: 64×64 px frames, 4 directional rows
// Row 0=South(down), 1=West(left), 2=East(right), 3=North(up)
// In battle enemy faces LEFT → use row 1

const ORC_SPRITE_BASE = 'Assets/Assets_Enemy/PNG/';

const ORC_ANIMS = {
  orc1: {
    idle:   { sheet: ORC_SPRITE_BASE+'Orc1/With_shadow/orc1_idle_with_shadow.png',   w:256,  h:256, cols:4,  row:2, fps:6,  loop:true  },
    attack: { sheet: ORC_SPRITE_BASE+'Orc1/With_shadow/orc1_attack_with_shadow.png', w:512,  h:256, cols:8,  row:2, fps:12, loop:false },
    hurt:   { sheet: ORC_SPRITE_BASE+'Orc1/With_shadow/orc1_hurt_with_shadow.png',   w:384,  h:256, cols:6,  row:2, fps:10, loop:false },
    death:  { sheet: ORC_SPRITE_BASE+'Orc1/With_shadow/orc1_death_with_shadow.png',  w:512,  h:256, cols:8,  row:2, fps:8,  loop:false }
  },
  orc2: {
    idle:   { sheet: ORC_SPRITE_BASE+'Orc2/With_shadow/orc2_idle_with_shadow.png',   w:256,  h:256, cols:4,  row:2, fps:6,  loop:true  },
    attack: { sheet: ORC_SPRITE_BASE+'Orc2/With_shadow/orc2_attack_with_shadow.png', w:512,  h:256, cols:8,  row:2, fps:12, loop:false },
    hurt:   { sheet: ORC_SPRITE_BASE+'Orc2/With_shadow/orc2_hurt_with_shadow.png',   w:384,  h:256, cols:6,  row:2, fps:10, loop:false },
    death:  { sheet: ORC_SPRITE_BASE+'Orc2/With_shadow/orc2_death_with_shadow.png',  w:512,  h:256, cols:8,  row:2, fps:8,  loop:false }
  },
  orc3: {
    idle:   { sheet: ORC_SPRITE_BASE+'Orc3/With_shadow/orc3_idle_with_shadow.png',   w:256,  h:256, cols:4,  row:2, fps:6,  loop:true  },
    attack: { sheet: ORC_SPRITE_BASE+'Orc3/With_shadow/orc3_attack_with_shadow.png', w:512,  h:256, cols:8,  row:2, fps:12, loop:false },
    hurt:   { sheet: ORC_SPRITE_BASE+'Orc3/With_shadow/orc3_hurt_with_shadow.png',   w:384,  h:256, cols:6,  row:2, fps:10, loop:false },
    death:  { sheet: ORC_SPRITE_BASE+'Orc3/With_shadow/orc3_death_with_shadow.png',  w:512,  h:256, cols:8,  row:2, fps:8,  loop:false }
  }
};

SA.ENEMY_ANIMS = ORC_ANIMS;

// ─── ENEMY DEFINITIONS ────────────────────────────────────────────────────────
SA.ENEMIES = [
  // ── ZONE 1: THE BOG ─────────────────────────────────────────────────────────
  {
    id: 'orc_grunt',
    name: 'Orc Grunt',
    sprite: 'orc1',
    element: 'earth',
    weakTo: ['fire', 'wind', 'ice'],
    resistantTo: ['earth', 'physical'],
    immuneTo: [],
    zone: 'bog',
    baseStats: { hp: 60, atk: 8, spd: 3, mana: 2, maxMana: 2 },
    levelRange: [1, 3],
    spellIds: ['strike', 'rock_throw'],
    expReward: 15,
    spellDrop: { id: 'rock_throw', chance: 1.0 },
    portrait: '🪨 Orc Grunt',
    lore: 'A brutish orc warrior. Not smart, but hits hard.'
  },
  {
    id: 'orc_shaman',
    name: 'Orc Shaman',
    sprite: 'orc2',
    element: 'poison',
    weakTo: ['holy', 'fire', 'wind'],
    resistantTo: ['poison', 'shadow', 'earth'],
    immuneTo: [],
    zone: 'bog',
    baseStats: { hp: 50, atk: 7, spd: 5, mana: 4, maxMana: 4 },
    levelRange: [2, 4],
    spellIds: ['strike', 'venom_strike', 'mana_surge', 'toxic_cloud'],
    expReward: 22,
    spellDrop: { id: 'venom_strike', chance: 1.0 },
    portrait: '☠️ Orc Shaman',
    lore: 'A cunning orc who brews deadly toxins from swamp herbs.'
  },

  // ── ZONE 2: EMBER WASTES ───────────────────────────────────────────────────
  {
    id: 'fire_orc',
    name: 'Fire Orc',
    sprite: 'orc1',
    element: 'fire',
    weakTo: ['ice', 'earth', 'wind'],
    resistantTo: ['fire', 'physical'],
    immuneTo: ['burn'],
    zone: 'ember',
    baseStats: { hp: 90, atk: 12, spd: 4, mana: 3, maxMana: 3 },
    levelRange: [4, 7],
    spellIds: ['strike', 'ember_bolt', 'rock_throw', 'inferno'],
    expReward: 32,
    spellDrop: { id: 'ember_bolt', chance: 1.0 },
    portrait: '🔥 Fire Orc',
    lore: 'An orc warrior bathed in the fires of the Ember Wastes.'
  },
  {
    id: 'orc_sorcerer',
    name: 'Orc Sorcerer',
    sprite: 'orc2',
    element: 'shadow',
    weakTo: ['holy', 'lightning', 'fire'],
    resistantTo: ['shadow', 'poison', 'ice'],
    immuneTo: [],
    zone: 'ember',
    baseStats: { hp: 75, atk: 11, spd: 6, mana: 5, maxMana: 5 },
    levelRange: [5, 8],
    spellIds: ['strike', 'curse', 'soul_drain', 'mana_surge', 'blood_pact'],
    expReward: 42,
    spellDrop: { id: 'curse', chance: 1.0 },
    portrait: '🌑 Orc Sorcerer',
    lore: 'A dark arts practitioner who drains life from the living.'
  },

  // ── ZONE 3: FROZEN PEAKS ──────────────────────────────────────────────────
  {
    id: 'frost_orc',
    name: 'Frost Orc',
    sprite: 'orc1',
    element: 'ice',
    weakTo: ['fire', 'lightning', 'earth'],
    resistantTo: ['ice', 'wind'],
    immuneTo: ['freeze', 'slow'],
    zone: 'frozen',
    baseStats: { hp: 120, atk: 14, spd: 3, mana: 3, maxMana: 3 },
    levelRange: [7, 10],
    spellIds: ['strike', 'frost_shard', 'blizzard', 'rock_throw'],
    expReward: 55,
    spellDrop: { id: 'blizzard', chance: 1.0 },
    portrait: '❄️ Frost Orc',
    lore: 'A mountain orc who has mastered the arts of ice and cold.'
  },
  {
    id: 'orc_warlord',
    name: 'Orc Warlord',
    sprite: 'orc3',
    element: 'earth',
    weakTo: ['wind', 'ice', 'lightning'],
    resistantTo: ['earth', 'physical', 'fire'],
    immuneTo: [],
    zone: 'frozen',
    baseStats: { hp: 160, atk: 18, spd: 4, mana: 4, maxMana: 4 },
    levelRange: [8, 12],
    spellIds: ['strike', 'rock_throw', 'earthquake', 'ward', 'chain_lightning'],
    expReward: 85,
    spellDrop: { id: 'earthquake', chance: 1.0 },
    portrait: '🪨 Orc Warlord',
    lore: 'The fearsome Warlord commands armies with iron-fisted brutality.'
  },

  // ── ZONE 4: SHADOW REALM ──────────────────────────────────────────────────
  {
    id: 'shadow_orc',
    name: 'Shadow Orc',
    sprite: 'orc2',
    element: 'shadow',
    weakTo: ['holy', 'lightning'],
    resistantTo: ['shadow', 'poison', 'ice', 'physical'],
    immuneTo: [],
    zone: 'shadow',
    baseStats: { hp: 140, atk: 16, spd: 7, mana: 5, maxMana: 5 },
    levelRange: [10, 15],
    spellIds: ['strike', 'soul_drain', 'curse', 'blood_pact', 'mana_surge'],
    expReward: 75,
    spellDrop: { id: 'soul_drain', chance: 1.0 },
    portrait: '🌑 Shadow Orc',
    lore: 'A creature of pure shadow. Its touch drains the very soul.'
  },
  {
    id: 'orc_high_shaman',
    name: 'High Shaman',
    sprite: 'orc3',
    element: 'poison',
    weakTo: ['holy', 'fire', 'wind'],
    resistantTo: ['poison', 'shadow', 'earth', 'ice'],
    immuneTo: ['poison'],
    zone: 'shadow',
    baseStats: { hp: 190, atk: 20, spd: 5, mana: 6, maxMana: 6 },
    levelRange: [12, 18],
    spellIds: ['strike', 'toxic_cloud', 'venom_strike', 'curse', 'healing_light', 'mana_font'],
    expReward: 110,
    spellDrop: { id: 'mana_font', chance: 1.0 },
    portrait: '☠️ High Shaman',
    lore: 'The supreme orc shaman who communes with ancient shadow entities.'
  }
];

SA.ENEMIES_MAP = Object.fromEntries(SA.ENEMIES.map(e => [e.id, e]));

// ─── HERO SPRITE METADATA ─────────────────────────────────────────────────────
// Frame size: 64×64px, 4 directional rows
// Row 2 (East/Right) used in battle — hero faces the enemy on the right
const HERO_BASE = 'Assets/Assets_Hero/PNG/';

SA.HERO_SPRITE_LEVELS = [
  {
    minLevel: 1,
    maxLevel: 5,
    key: 'lvl1',
    folder: 'Swordsman_lvl1',
    anims: {
      idle:   { sheet: HERO_BASE+'Swordsman_lvl1/With_shadow/Swordsman_lvl1_Idle_with_shadow.png',         w:768, h:256, cols:12, row:2, fps:8,  loop:true  },
      attack: { sheet: HERO_BASE+'Swordsman_lvl1/With_shadow/Swordsman_lvl1_attack_with_shadow.png',       w:512, h:256, cols:8,  row:2, fps:12, loop:false },
      cast:   { sheet: HERO_BASE+'Swordsman_lvl1/With_shadow/Swordsman_lvl1_Run_Attack_with_shadow.png',   w:512, h:256, cols:8,  row:2, fps:12, loop:false },
      hurt:   { sheet: HERO_BASE+'Swordsman_lvl1/With_shadow/Swordsman_lvl1_Hurt_with_shadow.png',         w:320, h:256, cols:5,  row:2, fps:10, loop:false },
      death:  { sheet: HERO_BASE+'Swordsman_lvl1/With_shadow/Swordsman_lvl1_Death_with_shadow.png',        w:448, h:256, cols:7,  row:2, fps:8,  loop:false }
    }
  },
  {
    minLevel: 6,
    maxLevel: 12,
    key: 'lvl2',
    folder: 'Swordsman_lvl2',
    anims: {
      idle:   { sheet: HERO_BASE+'Swordsman_lvl2/With_shadow/Swordsman_lvl2_Idle_with_shadow.png',         w:768, h:256, cols:12, row:2, fps:8,  loop:true  },
      attack: { sheet: HERO_BASE+'Swordsman_lvl2/With_shadow/Swordsman_lvl2_attack_with_shadow.png',       w:512, h:256, cols:8,  row:2, fps:12, loop:false },
      cast:   { sheet: HERO_BASE+'Swordsman_lvl2/With_shadow/Swordsman_lvl2_Run_Attack_with_shadow.png',   w:512, h:256, cols:8,  row:2, fps:12, loop:false },
      hurt:   { sheet: HERO_BASE+'Swordsman_lvl2/With_shadow/Swordsman_lvl2_Hurt_with_shadow.png',         w:320, h:256, cols:5,  row:2, fps:10, loop:false },
      death:  { sheet: HERO_BASE+'Swordsman_lvl2/With_shadow/Swordsman_lvl2_Death_with_shadow.png',        w:448, h:256, cols:7,  row:2, fps:8,  loop:false }
    }
  },
  {
    minLevel: 13,
    maxLevel: 99,
    key: 'lvl3',
    folder: 'Swordsman_lvl3',
    anims: {
      idle:   { sheet: HERO_BASE+'Swordsman_lvl3/With_shadow/Swordsman_lvl3_Idle_with_shadow.png',         w:768, h:256, cols:12, row:2, fps:8,  loop:true  },
      attack: { sheet: HERO_BASE+'Swordsman_lvl3/With_shadow/Swordsman_lvl3_attack_with_shadow.png',       w:512, h:256, cols:8,  row:2, fps:12, loop:false },
      cast:   { sheet: HERO_BASE+'Swordsman_lvl3/With_shadow/Swordsman_lvl3_Run_Attack_with_shadow.png',   w:512, h:256, cols:8,  row:2, fps:12, loop:false },
      hurt:   { sheet: HERO_BASE+'Swordsman_lvl3/With_shadow/Swordsman_lvl3_Hurt_with_shadow.png',         w:320, h:256, cols:5,  row:2, fps:10, loop:false },
      death:  { sheet: HERO_BASE+'Swordsman_lvl3/With_shadow/Swordsman_lvl3_Death_with_shadow.png',        w:448, h:256, cols:7,  row:2, fps:8,  loop:false }
    }
  }
];

SA.getHeroAnims = function(level) {
  return SA.HERO_SPRITE_LEVELS.find(l => level >= l.minLevel && level <= l.maxLevel) || SA.HERO_SPRITE_LEVELS[0];
};

// ─── BOOK SPRITE METADATA ─────────────────────────────────────────────────────
// Open_book.png: 1088×816, 4 cols × 3 rows = 12 frames of 272×272
SA.BOOK_ANIMS = {
  open:  {
    sheet: 'Assets/Assets_Spells/PNG/Open_book.png',
    w: 1088, h: 816, cols: 4, rows: 3, frameW: 272, frameH: 272
  },
  close: {
    sheet: 'Assets/Assets_Spells/PNG/Close_book.png',
    w: 1088, h: 816, cols: 4, rows: 3, frameW: 272, frameH: 272
  },
  pageLeft: {
    sheet: 'Assets/Assets_Spells/PNG/Turning_pages_left.png',
    w: 1088, h: 1088, cols: 4, rows: 4, frameW: 272, frameH: 272
  },
  pageRight: {
    sheet: 'Assets/Assets_Spells/PNG/Turning_pages_right.png',
    w: 1088, h: 1088, cols: 4, rows: 4, frameW: 272, frameH: 272
  }
};
