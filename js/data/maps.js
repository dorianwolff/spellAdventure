'use strict';
window.SA = window.SA || {};

// ─── MAP SYSTEM ───────────────────────────────────────────────────────────────
// Tile-based exploration maps with interactive objects and enemy encounters.
// Tile size: 48px display.  Map: 40 cols × 28 rows = 1920 × 1344 px.
// Object positions: tile coords (tx, ty), origin = top-left.
// Encounter markers use animated orc sprites (orcType field + canvas in MapView).

const MAP1 = 'Assets/Assets_Maps/PNG/';
const MAP2 = 'Assets/Assets_Maps2/PNG/';
const ORC  = 'Assets/Assets_Enemy/PNG/';
const GUILD = 'Assets/Assets_Guild/PNG/';

SA.MAPS = {
  // ════════════════════════════════════════════════════════════════════════════
  bog: {
    id: 'bog',
    name: 'The Murky Bog',
    zone: 'bog',
    cols: 40,
    rows: 28,
    tileSize: 48,
    groundImage: MAP1 + 'Ground_rocks.png',
    groundImageSize: { w: 496, h: 592 },
    bgColor: '#111e0f',
    ambientColor: 'rgba(20,40,10,0.3)',
    heroStart: { tx: 20, ty: 14 },   // ← spawn at map centre
    nextMap: 'cursed',
    nextMapEntry: { tx: 4, ty: 14 },
    musicHint: 'bog',

    objects: [

      // ── Guild (Adventurer's Guild exterior + door trigger) ─────────────────
      // Exterior.png is 448×144. Display at 336×108 (0.75x), 7 tiles × 2.25 tiles.
      // Placed at tile (3,6): spans cols 3–10, rows 6–8.
      {
        id: 'bog_guild_building', type: 'building',
        tx: 3, ty: 6,
        imageW: 336, imageH: 108,
        image: GUILD + 'Exterior.png',
        label: ''
      },
      {
        id: 'bog_guild_door', type: 'guild',
        tx: 7, ty: 9,       // door tile: centre-bottom of the building image
        imageW: 0, imageH: 0,
        image: '',
        label: '⚔ Enter Guild'
      },

      // ── Spell pickups (crystals) — one per quadrant ────────────────────────
      {
        id: 'bog_crystal_1', type: 'spell',
        tx: 5, ty: 3,
        image: MAP1 + 'Objects_separately/Crystal_shadow1_1.png', imageSize: 64,
        spellId: 'ember_bolt', label: 'Ember Bolt', sparkColor: '#f97316'
      },
      {
        id: 'bog_crystal_2', type: 'spell',
        tx: 33, ty: 6,
        image: MAP1 + 'Objects_separately/Crystal_shadow2_1.png', imageSize: 64,
        spellId: 'shock', label: 'Shock', sparkColor: '#fde68a'
      },
      {
        id: 'bog_crystal_3', type: 'spell',
        tx: 10, ty: 23,
        image: MAP1 + 'Objects_separately/Crystal_shadow3_1.png', imageSize: 64,
        spellId: 'venom_strike', label: 'Venom Strike', sparkColor: '#86efac'
      },
      {
        id: 'bog_crystal_4', type: 'spell',
        tx: 31, ty: 22,
        image: MAP1 + 'Objects_separately/Crystal_shadow1_2.png', imageSize: 64,
        spellId: 'frost_shard', label: 'Frost Shard', sparkColor: '#7dd3fc'
      },

      // ── Gold pickups (bones / dead arm) ───────────────────────────────────
      {
        id: 'bog_bones_1', type: 'gold',
        tx: 15, ty: 4,
        image: MAP1 + 'Objects_separately/Bones_shadow1_1.png', imageSize: 64,
        gold: 14, label: '14 Gold'
      },
      {
        id: 'bog_bones_2', type: 'gold',
        tx: 27, ty: 10,
        image: MAP1 + 'Objects_separately/Bones_shadow2_1.png', imageSize: 64,
        gold: 20, label: '20 Gold'
      },
      {
        id: 'bog_arm_1', type: 'gold',
        tx: 7, ty: 18,
        image: MAP1 + 'Objects_separately/Dead_arm_shadow1_1.png', imageSize: 64,
        gold: 25, label: '25 Gold'
      },
      {
        id: 'bog_bones_3', type: 'gold',
        tx: 23, ty: 25,
        image: MAP1 + 'Objects_separately/Bones_shadow1_2.png', imageSize: 64,
        gold: 10, label: '10 Gold'
      },

      // ── Enemy encounters (animated orc sprites) ────────────────────────────
      {
        id: 'bog_enc_1', type: 'encounter',
        tx: 14, ty: 7,
        orcType: 'orc1', imageSize: 64,
        enemyZone: 'bog', label: '⚔ Orc Patrol'
      },
      {
        id: 'bog_enc_2', type: 'encounter',
        tx: 24, ty: 6,
        orcType: 'orc2', imageSize: 64,
        enemyZone: 'bog', label: '⚔ Orc Shaman'
      },
      {
        id: 'bog_enc_3', type: 'encounter',
        tx: 17, ty: 19,
        orcType: 'orc1', imageSize: 64,
        enemyZone: 'bog', label: '⚔ Orc Grunt'
      },
      {
        id: 'bog_enc_4', type: 'encounter',
        tx: 35, ty: 12,
        orcType: 'orc3', imageSize: 64,
        enemyZone: 'bog', label: '⚔ Orc Brute'
      },
      {
        id: 'bog_enc_5', type: 'encounter',
        tx: 29, ty: 24,
        orcType: 'orc2', imageSize: 64,
        enemyZone: 'bog', label: '⚔ Shaman Ritual'
      },

      // ── Portal to Cursed Wastes ────────────────────────────────────────────
      {
        id: 'bog_portal', type: 'portal',
        tx: 38, ty: 14,
        image: MAP1 + 'Objects_separately/Crystal_shadow3_1.png', imageSize: 64,
        targetMap: 'cursed', label: '→ Cursed Wastes', sparkColor: '#c084fc'
      }
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  cursed: {
    id: 'cursed',
    name: 'Cursed Wastes',
    zone: 'shadow',
    cols: 40,
    rows: 28,
    tileSize: 48,
    groundImage: MAP2 + 'Ground.png',
    groundImageSize: { w: 720, h: 560 },
    bgColor: '#0f0720',
    ambientColor: 'rgba(40,10,60,0.4)',
    heroStart: { tx: 4, ty: 14 },    // ← arrive from bog portal
    nextMap: 'bog',
    nextMapEntry: { tx: 38, ty: 14 },
    musicHint: 'shadow',

    objects: [

      // ── Spell pickups (veins / plants) ─────────────────────────────────────
      {
        id: 'cur_vein_1', type: 'spell',
        tx: 9, ty: 6,
        image: MAP2 + 'Objects_separetely/Veins_shadow1_1.png', imageSize: 64,
        spellId: 'soul_drain', label: 'Soul Drain', sparkColor: '#c084fc'
      },
      {
        id: 'cur_vein_2', type: 'spell',
        tx: 32, ty: 9,
        image: MAP2 + 'Objects_separetely/Veins_shadow2_1.png', imageSize: 64,
        spellId: 'curse', label: 'Curse', sparkColor: '#c084fc'
      },
      {
        id: 'cur_vein_3', type: 'spell',
        tx: 13, ty: 22,
        image: MAP2 + 'Objects_separetely/Tubular_plant_shadow1_1.png', imageSize: 64,
        spellId: 'fireball', label: 'Fireball', sparkColor: '#f97316'
      },
      {
        id: 'cur_vein_4', type: 'spell',
        tx: 34, ty: 21,
        image: MAP2 + 'Objects_separetely/Meat_flower_shadow1_1.png', imageSize: 64,
        spellId: 'blizzard', label: 'Blizzard', sparkColor: '#7dd3fc'
      },

      // ── Gold pickups (bones) ───────────────────────────────────────────────
      {
        id: 'cur_bones_1', type: 'gold',
        tx: 20, ty: 4,
        image: MAP2 + 'Objects_separetely/Bones_shadow1_1.png', imageSize: 64,
        gold: 22, label: '22 Gold'
      },
      {
        id: 'cur_bones_2', type: 'gold',
        tx: 11, ty: 14,
        image: MAP2 + 'Objects_separetely/Bones_shadow2_1.png', imageSize: 64,
        gold: 18, label: '18 Gold'
      },
      {
        id: 'cur_bones_3', type: 'gold',
        tx: 28, ty: 24,
        image: MAP2 + 'Objects_separetely/Bones_shadow1_5.png', imageSize: 64,
        gold: 30, label: '30 Gold'
      },
      {
        id: 'cur_fetus_1', type: 'gold',
        tx: 37, ty: 8,
        image: MAP2 + 'Objects_separetely/Fetus_shadow1_1.png', imageSize: 64,
        gold: 28, label: '28 Gold'
      },

      // ── Enemy encounters (animated orc sprites, darker zone) ───────────────
      {
        id: 'cur_enc_1', type: 'encounter',
        tx: 15, ty: 9,
        orcType: 'orc2', imageSize: 64,
        enemyZone: 'shadow', label: '⚔ Shadow Lurker'
      },
      {
        id: 'cur_enc_2', type: 'encounter',
        tx: 25, ty: 13,
        orcType: 'orc3', imageSize: 64,
        enemyZone: 'shadow', label: '⚔ Void Walker'
      },
      {
        id: 'cur_enc_3', type: 'encounter',
        tx: 10, ty: 20,
        orcType: 'orc1', imageSize: 64,
        enemyZone: 'shadow', label: '⚔ Cursed Guard'
      },
      {
        id: 'cur_enc_4', type: 'encounter',
        tx: 33, ty: 17,
        orcType: 'orc3', imageSize: 64,
        enemyZone: 'shadow', label: '⚔ Shadow Beast'
      },
      {
        id: 'cur_enc_5', type: 'encounter',
        tx: 21, ty: 25,
        orcType: 'orc2', imageSize: 64,
        enemyZone: 'shadow', label: '⚔ Void Horror'
      },

      // ── Portal back to the Bog ─────────────────────────────────────────────
      {
        id: 'cursed_portal', type: 'portal',
        tx: 1, ty: 14,
        image: MAP2 + 'Objects_separetely/Veins_shadow1_4.png', imageSize: 64,
        targetMap: 'bog', label: '← Back to the Bog', sparkColor: '#4ade80'
      }
    ]
  }
};
