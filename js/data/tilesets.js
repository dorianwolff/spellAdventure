'use strict';
window.SA = window.SA || {};

// ─── TILESET DEFINITIONS ──────────────────────────────────────────────────────
// Shared between map-editor.html and MapView.js for tile layer rendering.
//
// Tile source size: 16×16 px. Game display: 48×48 px (3× upscale).
// Editor picker display: 32×32 px (2× upscale).
//
// Animated tilesets (water/acid):
//   The source image stacks frameCount animation frames vertically.
//   Each frame is frameRows rows tall (frameRows × tileH pixels).
//   Frame N source Y offset = N * frameRows * tileH pixels.
//   tileId encodes position within a SINGLE frame: row ∈ [0, frameRows).
//   The picker shows only frame 0 so the user selects clean tile indices.

SA.TILESETS = {

  // ── Bog / Undead ─────────────────────────────────────────────────────────
  bog_ground: {
    id: 'bog_ground', label: 'Bog — Ground',
    src: 'Assets/Assets_Maps/PNG/Ground_rocks.png',
    tileW: 16, tileH: 16, cols: 31, rows: 37,
    animated: false
  },
  bog_detail: {
    id: 'bog_detail', label: 'Bog — Details',
    src: 'Assets/Assets_Maps/PNG/Details.png',
    tileW: 16, tileH: 16, cols: 36, rows: 11,
    animated: false
  },
  bog_coast: {
    id: 'bog_coast', label: 'Bog — Coast',
    src: 'Assets/Assets_Maps/PNG/Water_coasts.png',
    tileW: 16, tileH: 16, cols: 66, rows: 16,
    animated: false
  },
  bog_water: {
    id: 'bog_water', label: 'Bog — Acid Water',
    src: 'Assets/Assets_Maps/Tiled_files/water_detilazation.png',
    tileW: 16, tileH: 16, cols: 37, rows: 78,
    animated: true, frameCount: 6, frameRows: 13, frameDuration: 150
  },
  bog_water2: {
    id: 'bog_water2', label: 'Bog — Acid v2',
    src: 'Assets/Assets_Maps/Tiled_files/water_detilazation_v2.png',
    tileW: 16, tileH: 16, cols: 37, rows: 78,
    animated: true, frameCount: 6, frameRows: 13, frameDuration: 150
  },

  // ── Cursed Wastes ─────────────────────────────────────────────────────────
  cur_ground: {
    id: 'cur_ground', label: 'Cursed — Ground',
    src: 'Assets/Assets_Maps2/PNG/Ground.png',
    tileW: 16, tileH: 16, cols: 45, rows: 35,
    animated: false
  },
  cur_detail: {
    id: 'cur_detail', label: 'Cursed — Details',
    src: 'Assets/Assets_Maps2/PNG/details.png',
    tileW: 16, tileH: 16, cols: 11, rows: 9,
    animated: false
  },
  cur_spots: {
    id: 'cur_spots', label: 'Cursed — Spots',
    src: 'Assets/Assets_Maps2/PNG/spots.png',
    tileW: 16, tileH: 16, cols: 21, rows: 10,
    animated: false
  },
  cur_coast: {
    id: 'cur_coast', label: 'Cursed — Coast',
    src: 'Assets/Assets_Maps2/PNG/Water_coasts.png',
    tileW: 16, tileH: 16, cols: 26, rows: 60,
    animated: false
  },
  cur_water: {
    id: 'cur_water', label: 'Cursed — Acid',
    src: 'Assets/Assets_Maps2/Tiled_files/water_detilazation.png',
    tileW: 16, tileH: 16, cols: 37, rows: 78,
    animated: true, frameCount: 6, frameRows: 13, frameDuration: 150
  },
  cur_bridges: {
    id: 'cur_bridges', label: 'Cursed — Bridges',
    src: 'Assets/Assets_Maps2/PNG/bridges.png',
    tileW: 16, tileH: 16, cols: 42, rows: 19,
    animated: false
  },
};
