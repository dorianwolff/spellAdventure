'use strict';
window.SA = window.SA || {};

// ─── MAP SYSTEM ───────────────────────────────────────────────────────────────
// Tile-based exploration maps with interactive objects and enemy encounters.
// Tile size: 48px display. Map dimensions: tiles × tile size = pixel dimensions.
// Object positions are in tile coords (tx, ty); origin = top-left.

const MAP1 = 'Assets/Assets_Maps/PNG/';
const MAP2 = 'Assets/Assets_Maps2/PNG/';

SA.MAPS = {
  bog: {
    id: 'bog',
    name: 'The Murky Bog',
    zone: 'bog',
    cols: 40,
    rows: 28,
    tileSize: 48,
    groundImage: MAP1 + 'Ground_rocks.png',
    groundImageSize: { w: 496, h: 592 },
    bgColor: '#1a2e1a',
    ambientColor: 'rgba(20,40,10,0.3)',
    heroStart: { tx: 4, ty: 14 },
    nextMap: 'cursed',
    nextMapEntry: { tx: 1, ty: 14 },
    musicHint: 'bog',

    objects: [
      // ── Spell pickups (crystals) ───────────────────────────────────────────
      {
        id: 'bog_crystal_1', type: 'spell', tx: 10, ty: 6,
        image: MAP1 + 'Objects_separately/Crystal_shadow1_1.png',
        imageSize: 64,
        spellId: 'ember_bolt', label: 'Ember Bolt',
        sparkColor: '#f97316'
      },
      {
        id: 'bog_crystal_2', type: 'spell', tx: 28, ty: 9,
        image: MAP1 + 'Objects_separately/Crystal_shadow2_1.png',
        imageSize: 64,
        spellId: 'shock', label: 'Shock',
        sparkColor: '#fde68a'
      },
      {
        id: 'bog_crystal_3', type: 'spell', tx: 18, ty: 22,
        image: MAP1 + 'Objects_separately/Crystal_shadow3_1.png',
        imageSize: 64,
        spellId: 'venom_strike', label: 'Venom Strike',
        sparkColor: '#86efac'
      },
      {
        id: 'bog_crystal_4', type: 'spell', tx: 34, ty: 18,
        image: MAP1 + 'Objects_separately/Crystal_shadow1_2.png',
        imageSize: 64,
        spellId: 'frost_shard', label: 'Frost Shard',
        sparkColor: '#7dd3fc'
      },

      // ── Gold pickups (bones) ───────────────────────────────────────────────
      {
        id: 'bog_bones_1', type: 'gold', tx: 7, ty: 10,
        image: MAP1 + 'Objects_separately/Bones_shadow1_1.png',
        imageSize: 64,
        gold: 12, label: '12 Gold'
      },
      {
        id: 'bog_bones_2', type: 'gold', tx: 22, ty: 5,
        image: MAP1 + 'Objects_separately/Bones_shadow2_1.png',
        imageSize: 64,
        gold: 18, label: '18 Gold'
      },
      {
        id: 'bog_bones_3', type: 'gold', tx: 33, ty: 24,
        image: MAP1 + 'Objects_separately/Bones_shadow1_2.png',
        imageSize: 64,
        gold: 8, label: '8 Gold'
      },
      {
        id: 'bog_arm_1', type: 'gold', tx: 15, ty: 17,
        image: MAP1 + 'Objects_separately/Dead_arm_shadow1_1.png',
        imageSize: 64,
        gold: 22, label: '22 Gold'
      },

      // ── Enemy encounters ───────────────────────────────────────────────────
      {
        id: 'bog_enc_1', type: 'encounter', tx: 14, ty: 8,
        image: MAP1 + 'Objects_separately/Broken_tree_shadow1_1.png',
        imageSize: 64,
        enemyZone: 'bog', label: '⚠ Orc Patrol'
      },
      {
        id: 'bog_enc_2', type: 'encounter', tx: 25, ty: 14,
        image: MAP1 + 'Objects_separately/Broken_tree_shadow2_1.png',
        imageSize: 64,
        enemyZone: 'bog', label: '⚠ Orc Camp'
      },
      {
        id: 'bog_enc_3', type: 'encounter', tx: 8, ty: 21,
        image: MAP1 + 'Objects_separately/Broken_ tree_shadow3_1.png',
        imageSize: 64,
        enemyZone: 'bog', label: '⚠ Dark Grove'
      },
      {
        id: 'bog_enc_4', type: 'encounter', tx: 36, ty: 11,
        image: MAP1 + 'Objects_separately/Broken_tree_shadow1_3.png',
        imageSize: 64,
        enemyZone: 'bog', label: '⚠ Orc Ambush'
      },
      {
        id: 'bog_enc_5', type: 'encounter', tx: 20, ty: 25,
        image: MAP1 + 'Objects_separately/Broken_tree_shadow2_3.png',
        imageSize: 64,
        enemyZone: 'bog', label: '⚠ Shaman Ritual'
      },

      // ── Portal to next area ────────────────────────────────────────────────
      {
        id: 'bog_portal', type: 'portal', tx: 38, ty: 14,
        image: MAP1 + 'Objects_separately/Crystal_shadow3_1.png',
        imageSize: 64,
        targetMap: 'cursed', label: '→ Cursed Wastes',
        sparkColor: '#c084fc'
      }
    ]
  },

  cursed: {
    id: 'cursed',
    name: 'Cursed Wastes',
    zone: 'shadow',
    cols: 40,
    rows: 28,
    tileSize: 48,
    groundImage: MAP2 + 'Ground.png',
    groundImageSize: { w: 720, h: 560 },
    bgColor: '#1a0a2e',
    ambientColor: 'rgba(40,10,60,0.4)',
    heroStart: { tx: 2, ty: 14 },
    nextMap: 'bog',
    nextMapEntry: { tx: 4, ty: 14 },
    musicHint: 'shadow',

    objects: [
      // ── Spell pickups (veins/tentacles = arcane objects) ───────────────────
      {
        id: 'cur_vein_1', type: 'spell', tx: 12, ty: 7,
        image: MAP2 + 'Objects_separetely/Veins_shadow1_1.png',
        imageSize: 64,
        spellId: 'soul_drain', label: 'Soul Drain',
        sparkColor: '#c084fc'
      },
      {
        id: 'cur_vein_2', type: 'spell', tx: 30, ty: 12,
        image: MAP2 + 'Objects_separetely/Veins_shadow2_1.png',
        imageSize: 64,
        spellId: 'curse', label: 'Curse',
        sparkColor: '#c084fc'
      },
      {
        id: 'cur_vein_3', type: 'spell', tx: 20, ty: 20,
        image: MAP2 + 'Objects_separetely/Tubular_plant_shadow1_1.png',
        imageSize: 64,
        spellId: 'fireball', label: 'Fireball',
        sparkColor: '#f97316'
      },
      {
        id: 'cur_vein_4', type: 'spell', tx: 36, ty: 22,
        image: MAP2 + 'Objects_separetely/Meat_flower_shadow1_1.png',
        imageSize: 64,
        spellId: 'blizzard', label: 'Blizzard',
        sparkColor: '#7dd3fc'
      },

      // ── Gold pickups (bones in cursed realm) ──────────────────────────────
      {
        id: 'cur_bones_1', type: 'gold', tx: 8, ty: 5,
        image: MAP2 + 'Objects_separetely/Bones_shadow1_1.png',
        imageSize: 64,
        gold: 20, label: '20 Gold'
      },
      {
        id: 'cur_bones_2', type: 'gold', tx: 25, ty: 8,
        image: MAP2 + 'Objects_separetely/Bones_shadow2_1.png',
        imageSize: 64,
        gold: 15, label: '15 Gold'
      },
      {
        id: 'cur_bones_3', type: 'gold', tx: 16, ty: 24,
        image: MAP2 + 'Objects_separetely/Bones_shadow1_5.png',
        imageSize: 64,
        gold: 30, label: '30 Gold'
      },
      {
        id: 'cur_fetus_1', type: 'gold', tx: 34, ty: 6,
        image: MAP2 + 'Objects_separetely/Fetus_shadow1_1.png',
        imageSize: 64,
        gold: 25, label: '25 Gold'
      },

      // ── Enemy encounters (eye plants = lurking monsters) ───────────────────
      {
        id: 'cur_enc_1', type: 'encounter', tx: 10, ty: 14,
        image: MAP2 + 'Objects_separetely/Eye_plant_shadow1_1.png',
        imageSize: 64,
        enemyZone: 'shadow', label: '⚠ Shadow Lurker'
      },
      {
        id: 'cur_enc_2', type: 'encounter', tx: 22, ty: 10,
        image: MAP2 + 'Objects_separetely/Jaws_plant_shadow1_1.png',
        imageSize: 64,
        enemyZone: 'shadow', label: '⚠ Void Maw'
      },
      {
        id: 'cur_enc_3', type: 'encounter', tx: 18, ty: 17,
        image: MAP2 + 'Objects_separetely/Many_eyes_plant_shadow1_1.png',
        imageSize: 64,
        enemyZone: 'shadow', label: '⚠ Many-Eyed Horror'
      },
      {
        id: 'cur_enc_4', type: 'encounter', tx: 33, ty: 17,
        image: MAP2 + 'Objects_separetely/Eye_plant_shadow2_1.png',
        imageSize: 64,
        enemyZone: 'shadow', label: '⚠ Cursed Guardian'
      },
      {
        id: 'cur_enc_5', type: 'encounter', tx: 6, ty: 22,
        image: MAP2 + 'Objects_separetely/Tentacle_plant_shadow1_1.png',
        imageSize: 64,
        enemyZone: 'shadow', label: '⚠ Tentacle Horror'
      },

      // ── Portal back ────────────────────────────────────────────────────────
      {
        id: 'cursed_portal', type: 'portal', tx: 0, ty: 14,
        image: MAP2 + 'Objects_separetely/Veins_shadow1_4.png',
        imageSize: 64,
        targetMap: 'bog', label: '← Back to the Bog',
        sparkColor: '#4ade80'
      }
    ]
  }
};
