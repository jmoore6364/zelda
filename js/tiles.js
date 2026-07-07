// ============================================================
// tiles.js — tile definitions, procedural texture baking
// Tile ids are STABLE — maps and the editor reference them by id.
// ============================================================
'use strict';

const TILE_SIZE = 16;

// tiny helper: bake a 16x16 tile canvas with a paint function
function bakeTile(paint, variant = 0, frame = 0) {
  const cv = document.createElement('canvas');
  cv.width = TILE_SIZE; cv.height = TILE_SIZE;
  const c = cv.getContext('2d');
  const rng = RNG(1234 + variant * 7919 + frame * 104729);
  paint(c, rng, frame, variant);
  return cv;
}

function px(c, x, y, col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }

// speckle a base with noise dots
function speckle(c, rng, base, dots, count) {
  c.fillStyle = base;
  c.fillRect(0, 0, 16, 16);
  for (let i = 0; i < count; i++) {
    c.fillStyle = dots[Math.floor(rng() * dots.length)];
    c.fillRect(Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1);
  }
}

const T = {
  GRASS: 0, FLOWERS: 1, PATH: 2, DIRT: 3, SAND: 4,
  WATER: 5, DEEPWATER: 6, TREE: 7, PINE: 8, ROCK: 9,
  MOUNTAIN: 10, BUSH: 11, TALLGRASS: 12, FENCE: 13, HOUSE_WALL: 14,
  HOUSE_ROOF: 15, HOUSE_DOOR: 16, HOUSE_WINDOW: 17, FLOOR_WOOD: 18, FLOOR_STONE: 19,
  WALL_STONE: 20, WALL_BRICK: 21, CAVE_FLOOR: 22, CAVE_WALL: 23, LAVA: 24,
  BRIDGE: 25, STAIRS_DOWN: 26, STAIRS_UP: 27, PILLAR: 28, CARPET: 29,
  MARSH: 30, DEADTREE: 31, GRAVE: 32, CRACKED_WALL: 33, WATERFALL: 34,
  TABLE: 35, SHELF: 36, ROOF_EDGE: 37, DUNGEON_FLOOR: 38, DUNGEON_WALL: 39,
  DUNGEON_BLOCK: 40, HOLE: 41, SHALLOWS: 42, SNOWY: 43, COUNTER: 44,
  ICE: 45, ICE_WALL: 46, CACTUS: 47, PALM: 48,
  SNOW_ROOF: 49, SNOW_ROOF_EDGE: 50, ADOBE_WALL: 51, ADOBE_ROOF: 52, AWNING: 53,
  CHIMNEY: 54, BALCONY: 55, WINDOW_FLOWER: 56, DOCK: 57, ROOF_BLUE: 58, ROOF_BLUE_EDGE: 59,
  GLOOMTREE: 60
};

const TILE_DEFS = {}; // id -> {name, solid, water?, damage?, anim?, variants, canvases[[frame][variant]], minimap}

function defTile(id, name, opts, paint) {
  const variants = opts.variants || 1;
  const frames = opts.frames || 1;
  const canvases = [];
  for (let f = 0; f < frames; f++) {
    canvases[f] = [];
    for (let v = 0; v < variants; v++) canvases[f][v] = bakeTile(paint, v, f);
  }
  TILE_DEFS[id] = {
    id, name,
    solid: !!opts.solid,
    water: !!opts.water,
    damage: opts.damage || 0,
    slow: !!opts.slow,
    hole: !!opts.hole,
    frames, variants, canvases,
    minimap: opts.minimap || '#888',
    animSpeed: opts.animSpeed || 0.35
  };
}

const Tiles = {
  animTime: 0,
  update(dt) { this.animTime += dt; },
  draw(ctx, id, x, y, tx, ty) {
    const d = TILE_DEFS[id];
    if (!d) return;
    const v = d.variants > 1 ? Math.floor(U.hash2(tx, ty) * d.variants) : 0;
    const f = d.frames > 1 ? Math.floor(this.animTime / d.animSpeed) % d.frames : 0;
    ctx.drawImage(d.canvases[f][v], x, y);
  },
  solid(id) { const d = TILE_DEFS[id]; return d ? d.solid : true; },
  isWater(id) { const d = TILE_DEFS[id]; return d ? d.water : false; },
  def(id) { return TILE_DEFS[id]; }
};

// ============================================================
// terrain
// ============================================================
defTile(T.GRASS, 'Grass', { variants: 4, minimap: '#4a8c3a' }, (c, rng) => {
  speckle(c, rng, '#4a8c3a', ['#438034', '#559a44', '#3f7e31', '#559a44'], 26);
  // occasional blade
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(rng() * 15), y = Math.floor(rng() * 14) + 1;
    px(c, x, y, '#5fa84e'); px(c, x, y - 1, '#6ab858');
  }
});

defTile(T.FLOWERS, 'Flowers', { variants: 4, minimap: '#5a9c4a' }, (c, rng, f, v) => {
  speckle(c, rng, '#4a8c3a', ['#559a44', '#3f7e31'], 20);
  const cols = [['#f0e050', '#e8a030'], ['#f08098', '#e84868'], ['#a0b8f8', '#6878e8'], ['#f0f0f0', '#d8d8e0']];
  const n = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < n; i++) {
    const x = 2 + Math.floor(rng() * 12), y = 2 + Math.floor(rng() * 12);
    const [a, b] = cols[Math.floor(rng() * cols.length)];
    px(c, x, y - 1, a); px(c, x - 1, y, a); px(c, x + 1, y, a); px(c, x, y + 1, a); px(c, x, y, b);
  }
});

defTile(T.PATH, 'Path', { variants: 4, minimap: '#c8b078' }, (c, rng) => {
  speckle(c, rng, '#c8b078', ['#bda468', '#d4bc86', '#b89e62'], 30);
  for (let i = 0; i < 3; i++) px(c, Math.floor(rng() * 16), Math.floor(rng() * 16), '#a89058');
});

defTile(T.DIRT, 'Dirt', { variants: 4, minimap: '#9a7648' }, (c, rng) => {
  speckle(c, rng, '#9a7648', ['#8d6a3e', '#a88354', '#816036'], 32);
});

defTile(T.SAND, 'Sand', { variants: 4, minimap: '#e0cc90' }, (c, rng) => {
  speckle(c, rng, '#e0cc90', ['#d6c082', '#eada9e', '#ccb678'], 28);
});

defTile(T.WATER, 'Water', { water: true, solid: true, frames: 4, variants: 2, minimap: '#3868c8', animSpeed: 0.3 }, (c, rng, f) => {
  speckle(c, rng, '#3868c8', ['#3060ba', '#4478d6'], 20);
  // waves
  c.fillStyle = '#6a98e8';
  const off = f * 4;
  for (let i = 0; i < 3; i++) {
    const y = (i * 6 + off) % 16;
    const x = (i * 5 + f * 2) % 12;
    c.fillRect(x, y, 4, 1);
  }
});

defTile(T.DEEPWATER, 'Deep Water', { water: true, solid: true, frames: 4, variants: 2, minimap: '#284898', animSpeed: 0.4 }, (c, rng, f) => {
  speckle(c, rng, '#284898', ['#20408a', '#3050a6'], 18);
  c.fillStyle = '#3868c8';
  const y = (f * 4 + 3) % 16;
  c.fillRect((f * 3) % 10, y, 4, 1);
});

defTile(T.SHALLOWS, 'Shallows', { water: true, frames: 4, variants: 2, minimap: '#68a0d8', animSpeed: 0.3, slow: true }, (c, rng, f) => {
  speckle(c, rng, '#68a0d8', ['#5c94cc', '#78ace2', '#88b8e8'], 22);
  c.fillStyle = '#a8d0f0';
  c.fillRect((f * 4) % 12, (f * 5 + 2) % 16, 3, 1);
});

defTile(T.TREE, 'Tree', { solid: true, variants: 3, minimap: '#2a6428' }, (c, rng) => {
  speckle(c, rng, '#4a8c3a', ['#559a44', '#3f7e31'], 12);
  // canopy
  c.fillStyle = '#2f7030';
  c.beginPath(); c.arc(8, 6, 6.5, 0, 7); c.fill();
  c.fillStyle = '#3d8a3c';
  c.beginPath(); c.arc(6, 5, 4, 0, 7); c.fill();
  c.fillStyle = '#57a852';
  c.beginPath(); c.arc(5, 4, 2, 0, 7); c.fill();
  for (let i = 0; i < 8; i++) {
    px(c, 2 + Math.floor(rng() * 12), 2 + Math.floor(rng() * 9), rng() < 0.5 ? '#2a6428' : '#4d9a48');
  }
  // trunk
  c.fillStyle = '#6a4a28'; c.fillRect(6, 11, 4, 4);
  c.fillStyle = '#523618'; c.fillRect(6, 11, 1, 4); c.fillRect(9, 11, 1, 4);
});

defTile(T.PINE, 'Pine', { solid: true, variants: 3, minimap: '#1e5030' }, (c, rng) => {
  speckle(c, rng, '#4a8c3a', ['#559a44', '#3f7e31'], 12);
  c.fillStyle = '#1e5c34';
  c.beginPath(); c.moveTo(8, 0); c.lineTo(13, 8); c.lineTo(3, 8); c.fill();
  c.beginPath(); c.moveTo(8, 4); c.lineTo(14, 12); c.lineTo(2, 12); c.fill();
  c.fillStyle = '#2a7444';
  c.beginPath(); c.moveTo(8, 1); c.lineTo(11, 7); c.lineTo(5, 7); c.fill();
  c.fillStyle = '#6a4a28'; c.fillRect(7, 12, 2, 3);
});

defTile(T.ROCK, 'Rock', { solid: true, variants: 3, minimap: '#8a8a90' }, (c, rng) => {
  speckle(c, rng, '#4a8c3a', ['#559a44', '#3f7e31'], 10);
  c.fillStyle = '#7a7a84';
  c.beginPath(); c.arc(8, 9, 6, 0, 7); c.fill();
  c.fillStyle = '#93939c'; c.beginPath(); c.arc(6, 7, 3.5, 0, 7); c.fill();
  c.fillStyle = '#a8a8b0'; c.fillRect(5, 5, 2, 1);
  c.fillStyle = '#5c5c66'; c.fillRect(4, 12, 8, 2);
});

defTile(T.MOUNTAIN, 'Mountain', { solid: true, variants: 3, minimap: '#6a5a4a' }, (c, rng) => {
  speckle(c, rng, '#7a6a55', ['#6d5e4a', '#877661', '#61523f'], 24);
  c.fillStyle = '#8d7c66';
  c.beginPath(); c.moveTo(0, 16); c.lineTo(5, 4); c.lineTo(9, 12); c.lineTo(12, 2); c.lineTo(16, 16); c.fill();
  c.fillStyle = '#a5947c';
  c.beginPath(); c.moveTo(3, 9); c.lineTo(5, 4); c.lineTo(7, 9); c.fill();
  c.fillStyle = '#4e4234'; c.fillRect(0, 14, 16, 2);
});

defTile(T.BUSH, 'Bush', { solid: true, variants: 3, minimap: '#3a7c34' }, (c, rng) => {
  speckle(c, rng, '#4a8c3a', ['#559a44', '#3f7e31'], 12);
  c.fillStyle = '#357c32';
  c.beginPath(); c.arc(8, 10, 5.5, 0, 7); c.fill();
  c.fillStyle = '#469444';
  c.beginPath(); c.arc(6, 9, 3, 0, 7); c.fill();
  px(c, 5, 7, '#5cae57'); px(c, 9, 9, '#5cae57'); px(c, 11, 11, '#2a6428');
});

defTile(T.TALLGRASS, 'Tall Grass', { variants: 4, slow: true, minimap: '#569a42' }, (c, rng) => {
  speckle(c, rng, '#4a8c3a', ['#559a44'], 10);
  c.fillStyle = '#5fae4c';
  for (let i = 0; i < 7; i++) {
    const x = 1 + Math.floor(rng() * 14), h = 4 + Math.floor(rng() * 5);
    c.fillRect(x, 16 - h, 1, h);
    px(c, x, 16 - h, '#79c464');
  }
});

defTile(T.FENCE, 'Fence', { solid: true, minimap: '#8a6a40' }, (c, rng) => {
  speckle(c, rng, '#4a8c3a', ['#559a44', '#3f7e31'], 12);
  c.fillStyle = '#8a6a40';
  c.fillRect(2, 4, 2, 10); c.fillRect(12, 4, 2, 10);
  c.fillRect(0, 6, 16, 2); c.fillRect(0, 10, 16, 2);
  c.fillStyle = '#6a4e2a';
  c.fillRect(2, 12, 2, 2); c.fillRect(12, 12, 2, 2);
  px(c, 3, 5, '#a8845a'); px(c, 13, 5, '#a8845a');
});

// ============================================================
// buildings
// ============================================================
defTile(T.HOUSE_WALL, 'House Wall', { solid: true, variants: 2, minimap: '#c8a878' }, (c, rng) => {
  speckle(c, rng, '#d0b088', ['#c4a47c', '#dcbc94'], 18);
  c.fillStyle = '#a8845c';
  c.fillRect(0, 0, 16, 1); c.fillRect(0, 15, 16, 1);
  c.fillRect(0, 8, 16, 1);
  for (let i = 0; i < 2; i++) px(c, 4 + i * 8, 3 + Math.floor(rng() * 4), '#b89468');
});

defTile(T.HOUSE_ROOF, 'Roof', { solid: true, variants: 2, minimap: '#b04838' }, (c, rng) => {
  speckle(c, rng, '#b85040', ['#ac4636', '#c45c4c'], 16);
  c.fillStyle = '#963a2c';
  c.fillRect(0, 3, 16, 1); c.fillRect(0, 8, 16, 1); c.fillRect(0, 13, 16, 1);
  c.fillStyle = '#d0685a';
  c.fillRect(0, 0, 16, 1);
});

defTile(T.ROOF_EDGE, 'Roof Edge', { solid: true, minimap: '#8a3428' }, (c, rng) => {
  speckle(c, rng, '#963a2c', ['#8a3428', '#a24638'], 14);
  c.fillStyle = '#701f18'; c.fillRect(0, 12, 16, 4);
  c.fillStyle = '#d0685a'; c.fillRect(0, 0, 16, 1);
});

defTile(T.HOUSE_DOOR, 'Door', { minimap: '#6a4828' }, (c, rng) => {
  c.fillStyle = '#d0b088'; c.fillRect(0, 0, 16, 16);
  c.fillStyle = '#6a4828'; c.fillRect(3, 1, 10, 15);
  c.fillStyle = '#523414'; c.fillRect(3, 1, 10, 1); c.fillRect(3, 1, 1, 15); c.fillRect(12, 1, 1, 15);
  c.fillStyle = '#84603a'; c.fillRect(5, 3, 6, 5);
  px(c, 10, 9, '#e8c030');
});

defTile(T.HOUSE_WINDOW, 'Window', { solid: true, minimap: '#a8c8e8' }, (c, rng) => {
  speckle(c, rng, '#d0b088', ['#c4a47c'], 12);
  c.fillStyle = '#5a4630'; c.fillRect(3, 3, 10, 10);
  c.fillStyle = '#88b8e0'; c.fillRect(4, 4, 8, 8);
  c.fillStyle = '#b8d8f0'; c.fillRect(4, 4, 3, 3);
  c.fillStyle = '#5a4630'; c.fillRect(7, 4, 1, 8); c.fillRect(4, 7, 8, 1);
});

// ============================================================
// interiors
// ============================================================
defTile(T.FLOOR_WOOD, 'Wood Floor', { variants: 3, minimap: '#a8814e' }, (c, rng) => {
  speckle(c, rng, '#a8814e', ['#9c7644', '#b48c58'], 14);
  c.fillStyle = '#8a683c';
  c.fillRect(0, 5, 16, 1); c.fillRect(0, 11, 16, 1);
  px(c, 3, 2, '#7a5830'); px(c, 11, 8, '#7a5830'); px(c, 6, 14, '#7a5830');
});

defTile(T.FLOOR_STONE, 'Stone Floor', { variants: 3, minimap: '#909098' }, (c, rng) => {
  speckle(c, rng, '#909098', ['#86868e', '#9c9ca4'], 16);
  c.fillStyle = '#76767e';
  c.fillRect(0, 7, 16, 1); c.fillRect(7, 0, 1, 7); c.fillRect(3, 8, 1, 8); c.fillRect(11, 8, 1, 8);
});

defTile(T.WALL_STONE, 'Stone Wall', { solid: true, variants: 2, minimap: '#5a5a64' }, (c, rng) => {
  speckle(c, rng, '#6a6a76', ['#60606c', '#747482'], 16);
  c.fillStyle = '#4a4a56';
  c.fillRect(0, 0, 16, 1); c.fillRect(0, 5, 16, 1); c.fillRect(0, 10, 16, 1); c.fillRect(0, 15, 16, 1);
  c.fillRect(4, 1, 1, 4); c.fillRect(11, 6, 1, 4); c.fillRect(7, 11, 1, 4);
  c.fillStyle = '#82828e'; c.fillRect(1, 1, 3, 1); c.fillRect(12, 6, 3, 1);
});

defTile(T.WALL_BRICK, 'Brick Wall', { solid: true, variants: 2, minimap: '#7a5548' }, (c, rng) => {
  speckle(c, rng, '#8a6252', ['#7e5848', '#966c5c'], 16);
  c.fillStyle = '#66463a';
  c.fillRect(0, 3, 16, 1); c.fillRect(0, 8, 16, 1); c.fillRect(0, 13, 16, 1);
  c.fillRect(5, 0, 1, 3); c.fillRect(10, 4, 1, 4); c.fillRect(6, 9, 1, 4);
});

defTile(T.CARPET, 'Carpet', { variants: 2, minimap: '#a83848' }, (c, rng) => {
  speckle(c, rng, '#a83848', ['#9c3040', '#b44454'], 14);
  c.fillStyle = '#c8a030';
  c.fillRect(0, 0, 16, 1); c.fillRect(0, 15, 16, 1); c.fillRect(0, 0, 1, 16); c.fillRect(15, 0, 1, 16);
});

defTile(T.TABLE, 'Table', { solid: true, minimap: '#9a7040' }, (c, rng) => {
  c.fillStyle = '#a8814e'; c.fillRect(0, 0, 16, 16);
  c.fillStyle = '#b8905c'; c.fillRect(1, 2, 14, 10);
  c.fillStyle = '#8a683c'; c.fillRect(1, 2, 14, 1);
  c.fillStyle = '#6a4e2a'; c.fillRect(2, 12, 2, 3); c.fillRect(12, 12, 2, 3);
});

defTile(T.SHELF, 'Shelf', { solid: true, minimap: '#7a5a34' }, (c, rng) => {
  c.fillStyle = '#7a5a34'; c.fillRect(0, 0, 16, 16);
  c.fillStyle = '#5c4224'; c.fillRect(0, 4, 16, 1); c.fillRect(0, 10, 16, 1);
  const cols = ['#c84848', '#4878c8', '#48a848', '#c8a030', '#a858c8'];
  for (let i = 0; i < 4; i++) {
    c.fillStyle = cols[Math.floor(rng() * cols.length)];
    c.fillRect(1 + i * 4, 1, 2, 3);
    c.fillStyle = cols[Math.floor(rng() * cols.length)];
    c.fillRect(2 + i * 4, 6, 2, 4);
  }
});

defTile(T.COUNTER, 'Counter', { solid: true, minimap: '#b89058' }, (c, rng) => {
  c.fillStyle = '#c8a068'; c.fillRect(0, 0, 16, 8);
  c.fillStyle = '#e0c090'; c.fillRect(0, 0, 16, 2);
  c.fillStyle = '#9a7644'; c.fillRect(0, 8, 16, 8);
  c.fillStyle = '#84623a'; c.fillRect(0, 8, 16, 1); c.fillRect(4, 9, 1, 7); c.fillRect(11, 9, 1, 7);
});

// ============================================================
// caves & dungeons
// ============================================================
defTile(T.CAVE_FLOOR, 'Cave Floor', { variants: 4, minimap: '#5a5048' }, (c, rng) => {
  speckle(c, rng, '#5e544c', ['#544a42', '#685e56', '#4e443c'], 26);
});

defTile(T.CAVE_WALL, 'Cave Wall', { solid: true, variants: 3, minimap: '#33291f' }, (c, rng) => {
  speckle(c, rng, '#3c3228', ['#342a20', '#463c30'], 22);
  c.fillStyle = '#2a2018';
  c.beginPath(); c.arc(4, 4, 3, 0, 7); c.fill();
  c.beginPath(); c.arc(12, 10, 4, 0, 7); c.fill();
  c.fillStyle = '#50443655';
  c.fillRect(0, 0, 16, 2);
});

defTile(T.DUNGEON_FLOOR, 'Dungeon Floor', { variants: 3, minimap: '#6a6a78' }, (c, rng) => {
  speckle(c, rng, '#63636f', ['#5b5b67', '#6d6d79'], 18);
  c.fillStyle = '#52525e';
  c.fillRect(0, 0, 16, 1); c.fillRect(0, 0, 1, 16);
  px(c, 8, 8, '#747480');
});

defTile(T.DUNGEON_WALL, 'Dungeon Wall', { solid: true, variants: 2, minimap: '#38384a' }, (c, rng) => {
  speckle(c, rng, '#44445a', ['#3c3c50', '#4c4c64'], 16);
  c.fillStyle = '#2c2c3c';
  c.fillRect(0, 0, 16, 1); c.fillRect(0, 5, 16, 1); c.fillRect(0, 10, 16, 1); c.fillRect(0, 15, 16, 1);
  c.fillRect(5, 1, 1, 4); c.fillRect(10, 6, 1, 4); c.fillRect(3, 11, 1, 4);
  c.fillStyle = '#5c5c74'; c.fillRect(1, 1, 3, 1);
});

defTile(T.DUNGEON_BLOCK, 'Block', { solid: true, minimap: '#50506a' }, (c, rng) => {
  c.fillStyle = '#63636f'; c.fillRect(0, 0, 16, 16);
  c.fillStyle = '#585874'; c.fillRect(1, 1, 14, 14);
  c.fillStyle = '#6e6e8e'; c.fillRect(1, 1, 14, 2);
  c.fillStyle = '#42425a'; c.fillRect(1, 13, 14, 2);
  c.fillStyle = '#7e7ea2'; c.fillRect(3, 4, 3, 3);
});

defTile(T.CRACKED_WALL, 'Cracked Wall', { solid: true, minimap: '#4a4038' }, (c, rng) => {
  speckle(c, rng, '#3c3228', ['#342a20', '#463c30'], 22);
  c.fillStyle = '#1c140c';
  px(c, 8, 3, '#1c140c'); px(c, 7, 4, '#1c140c'); px(c, 8, 5, '#1c140c');
  px(c, 9, 6, '#1c140c'); px(c, 8, 7, '#1c140c'); px(c, 7, 8, '#1c140c');
  px(c, 6, 9, '#1c140c'); px(c, 7, 10, '#1c140c'); px(c, 8, 11, '#1c140c');
  px(c, 5, 8, '#1c140c'); px(c, 10, 5, '#1c140c'); px(c, 11, 7, '#1c140c');
});

defTile(T.LAVA, 'Lava', { solid: true, damage: 1, frames: 4, variants: 2, minimap: '#d84818', animSpeed: 0.25 }, (c, rng, f) => {
  speckle(c, rng, '#d84818', ['#c83808', '#e85828'], 20);
  c.fillStyle = '#f8a030';
  const y1 = (f * 4 + 2) % 16;
  c.fillRect((f * 3) % 10, y1, 5, 2);
  c.fillStyle = '#f8e060';
  px(c, (f * 5 + 3) % 16, (f * 7 + 6) % 16, '#f8e060');
  px(c, (f * 9 + 10) % 16, (f * 3 + 12) % 16, '#f8e060');
});

defTile(T.HOLE, 'Pit', { hole: true, minimap: '#101018' }, (c, rng) => {
  c.fillStyle = '#14141c'; c.fillRect(0, 0, 16, 16);
  c.fillStyle = '#22222e'; c.fillRect(0, 0, 16, 2); c.fillRect(0, 0, 2, 16);
  c.fillStyle = '#0a0a10'; c.fillRect(4, 4, 10, 10);
});

defTile(T.BRIDGE, 'Bridge', { variants: 2, minimap: '#a07848' }, (c, rng) => {
  speckle(c, rng, '#a07848', ['#946c3e', '#ac8454'], 12);
  c.fillStyle = '#7c5830';
  c.fillRect(0, 0, 16, 1); c.fillRect(0, 15, 16, 1);
  c.fillRect(0, 4, 16, 1); c.fillRect(0, 9, 16, 1);
  c.fillStyle = '#c09868'; c.fillRect(0, 1, 16, 1);
});

defTile(T.STAIRS_DOWN, 'Stairs Down', { minimap: '#3a3a44' }, (c, rng) => {
  const shades = ['#6a6a76', '#5a5a66', '#4a4a56', '#3a3a46', '#2a2a36', '#1c1c26'];
  for (let i = 0; i < 6; i++) {
    c.fillStyle = shades[i];
    c.fillRect(0, i * 3, 16, 3);
  }
  c.fillStyle = '#14141c'; c.fillRect(0, 15, 16, 1);
});

defTile(T.STAIRS_UP, 'Stairs Up', { minimap: '#c8c8d0' }, (c, rng) => {
  const shades = ['#1c1c26', '#3a3a46', '#54545e', '#6e6e78', '#888892', '#a2a2ac'];
  for (let i = 0; i < 6; i++) {
    c.fillStyle = shades[i];
    c.fillRect(0, i * 3, 16, 3);
  }
});

defTile(T.PILLAR, 'Pillar', { solid: true, minimap: '#88889a' }, (c, rng) => {
  c.fillStyle = '#63636f'; c.fillRect(0, 0, 16, 16);
  c.fillStyle = '#8a8aa0'; c.fillRect(4, 1, 8, 14);
  c.fillStyle = '#a2a2b8'; c.fillRect(4, 1, 3, 14);
  c.fillStyle = '#5a5a70'; c.fillRect(10, 1, 2, 14);
  c.fillStyle = '#b2b2c8'; c.fillRect(3, 0, 10, 2); c.fillRect(3, 14, 10, 2);
});

// ============================================================
// marsh / graveyard
// ============================================================
defTile(T.MARSH, 'Marsh', { slow: true, variants: 3, minimap: '#4a6a48' }, (c, rng) => {
  speckle(c, rng, '#4e6a4a', ['#446040', '#587656', '#3a563a'], 24);
  c.fillStyle = '#38504066';
  c.fillRect(2, 6, 6, 3); c.fillRect(9, 11, 5, 3);
  px(c, 4, 3, '#68885c'); px(c, 12, 7, '#68885c');
});

defTile(T.DEADTREE, 'Dead Tree', { solid: true, variants: 2, minimap: '#4a4038' }, (c, rng) => {
  speckle(c, rng, '#4e6a4a', ['#446040', '#3a563a'], 16);
  c.fillStyle = '#4a3828';
  c.fillRect(7, 5, 2, 10);
  c.fillRect(5, 6, 2, 1); c.fillRect(4, 4, 1, 3);
  c.fillRect(9, 4, 2, 1); c.fillRect(11, 2, 1, 3);
  c.fillRect(7, 2, 1, 3);
  c.fillStyle = '#382a1c';
  c.fillRect(6, 14, 4, 1);
});

defTile(T.GRAVE, 'Grave', { solid: true, variants: 2, minimap: '#6a6a72' }, (c, rng) => {
  speckle(c, rng, '#4e6a4a', ['#446040', '#3a563a'], 14);
  c.fillStyle = '#787882';
  c.fillRect(5, 4, 6, 10);
  c.fillStyle = '#8e8e98';
  c.fillRect(5, 4, 6, 2); c.fillRect(5, 4, 2, 10);
  c.fillStyle = '#5a5a64';
  c.fillRect(6, 8, 4, 1); c.fillRect(6, 10, 4, 1);
  c.fillStyle = '#464650'; c.fillRect(4, 13, 8, 1);
});

defTile(T.WATERFALL, 'Waterfall', { solid: true, water: true, frames: 3, minimap: '#78a8e8', animSpeed: 0.12 }, (c, rng, f) => {
  c.fillStyle = '#4878d0'; c.fillRect(0, 0, 16, 16);
  c.fillStyle = '#78a8e8';
  for (let i = 0; i < 5; i++) {
    const x = (i * 4 + 1) % 16;
    const y = (i * 6 + f * 5) % 16;
    c.fillRect(x, y, 2, 5);
  }
  c.fillStyle = '#b8d8f8';
  for (let i = 0; i < 3; i++) px(c, (i * 6 + 2) % 16, (i * 8 + f * 5 + 3) % 16, '#b8d8f8');
});

defTile(T.GLOOMTREE, 'Gloomtree', { solid: true, variants: 3, minimap: '#2a1e38' }, (c, rng) => {
  speckle(c, rng, '#2e2438', ['#282034', '#342a42'], 16);
  // twisted violet-black canopy
  c.fillStyle = '#3a2a50';
  c.beginPath(); c.arc(8, 6, 6.5, 0, 7); c.fill();
  c.fillStyle = '#4a3662';
  c.beginPath(); c.arc(6, 5, 3.5, 0, 7); c.fill();
  px(c, 5, 4, '#5c4478'); px(c, 10, 7, '#5c4478');
  // pale watching knots
  px(c, 7, 6, '#c8b8d8'); px(c, 10, 5, '#c8b8d8');
  // gnarled trunk
  c.fillStyle = '#241a2e'; c.fillRect(6, 11, 4, 4);
  c.fillStyle = '#100a18'; c.fillRect(6, 11, 1, 4); c.fillRect(9, 11, 1, 4);
});

defTile(T.SNOWY, 'Snowy Grass', { variants: 3, minimap: '#d8e0e8' }, (c, rng) => {
  speckle(c, rng, '#d8e0e8', ['#ccd6e0', '#e4ecf2', '#c2ccd8'], 22);
  px(c, 4, 6, '#a8c0a8'); px(c, 11, 12, '#a8c0a8');
});

// ============================================================
// regional architecture
// ============================================================
defTile(T.SNOW_ROOF, 'Snow Roof', { solid: true, variants: 2, minimap: '#8a98b0' }, (c, rng) => {
  speckle(c, rng, '#4a5468', ['#414a5c', '#535e74'], 14);
  c.fillStyle = '#38404e';
  c.fillRect(0, 4, 16, 1); c.fillRect(0, 9, 16, 1); c.fillRect(0, 14, 16, 1);
  // snow drifts caught on the slates
  c.fillStyle = '#e8eef4';
  c.fillRect(0, 0, 16, 2);
  c.fillRect(2, 5, 5, 1); c.fillRect(10, 5, 4, 1);
  c.fillRect(5, 10, 6, 1); c.fillRect(1, 10, 2, 1);
  c.fillStyle = '#c8d4e0';
  c.fillRect(0, 2, 16, 1);
});

defTile(T.SNOW_ROOF_EDGE, 'Snow Eave', { solid: true, minimap: '#6a7488' }, (c, rng) => {
  speckle(c, rng, '#4a5468', ['#414a5c'], 10);
  c.fillStyle = '#2c3440'; c.fillRect(0, 11, 16, 5);
  c.fillStyle = '#e8eef4'; c.fillRect(0, 0, 16, 2);
  // icicles
  c.fillStyle = '#b8d8f0';
  c.fillRect(2, 11, 1, 4); c.fillRect(6, 11, 1, 3); c.fillRect(9, 11, 1, 5); c.fillRect(13, 11, 1, 3);
  c.fillStyle = '#e8f6fc';
  px(c, 2, 11, '#e8f6fc'); px(c, 9, 11, '#e8f6fc');
});

defTile(T.ADOBE_WALL, 'Adobe Wall', { solid: true, variants: 2, minimap: '#d0a878' }, (c, rng) => {
  speckle(c, rng, '#dcb488', ['#d0a878', '#e6c098'], 16);
  // protruding beam ends
  c.fillStyle = '#8a5a30';
  c.fillRect(2, 2, 3, 2); c.fillRect(11, 2, 3, 2);
  c.fillStyle = '#6a4222';
  c.fillRect(2, 3, 3, 1); c.fillRect(11, 3, 3, 1);
  c.fillStyle = '#c09468';
  c.fillRect(0, 14, 16, 2);
});

defTile(T.ADOBE_ROOF, 'Adobe Roof', { solid: true, variants: 2, minimap: '#c89060' }, (c, rng) => {
  speckle(c, rng, '#c89868', ['#bc8c5c', '#d4a474'], 18);
  c.fillStyle = '#a87848';
  c.fillRect(0, 0, 16, 1); c.fillRect(0, 15, 16, 1);
  c.fillStyle = '#dcb488';
  c.fillRect(1, 1, 14, 1);
  px(c, 4, 6, '#a87848'); px(c, 11, 10, '#a87848');
});

defTile(T.AWNING, 'Awning', { solid: true, minimap: '#c86848' }, (c, rng) => {
  // striped canopy with scalloped hem
  for (let i = 0; i < 16; i += 4) {
    c.fillStyle = '#d86848'; c.fillRect(i, 0, 2, 12);
    c.fillStyle = '#f0e0c0'; c.fillRect(i + 2, 0, 2, 12);
  }
  c.fillStyle = '#b04c30';
  for (let i = 0; i < 16; i += 4) c.fillRect(i, 10, 2, 2);
  c.fillStyle = '#00000033';
  c.fillRect(0, 12, 16, 1);
  c.fillStyle = '#dcb488';
  c.fillRect(0, 13, 16, 3);
});

defTile(T.CHIMNEY, 'Chimney', { solid: true, minimap: '#8a8a96' }, (c, rng) => {
  speckle(c, rng, '#5a4444', ['#523c3c', '#63504c'], 12);
  // stone stack
  c.fillStyle = '#8a8a96';
  c.fillRect(4, 3, 8, 12);
  c.fillStyle = '#a2a2ae';
  c.fillRect(3, 1, 10, 3);
  c.fillStyle = '#6a6a76';
  c.fillRect(4, 4, 8, 1); c.fillRect(7, 5, 1, 9); c.fillRect(4, 9, 8, 1);
  // dark flue
  c.fillStyle = '#1c1c26';
  c.fillRect(5, 1, 6, 2);
});

defTile(T.BALCONY, 'Balcony', { solid: true, minimap: '#a8845a' }, (c, rng) => {
  speckle(c, rng, '#d0b088', ['#c4a47c', '#dcbc94'], 12);
  // shuttered door behind the railing
  c.fillStyle = '#6a4828';
  c.fillRect(5, 0, 6, 9);
  c.fillStyle = '#84603a';
  c.fillRect(6, 1, 4, 3);
  // wooden railing
  c.fillStyle = '#a8845a';
  c.fillRect(1, 8, 14, 2);
  c.fillRect(1, 14, 14, 2);
  c.fillStyle = '#8a6a40';
  c.fillRect(2, 10, 1, 4); c.fillRect(5, 10, 1, 4); c.fillRect(8, 10, 1, 4); c.fillRect(11, 10, 1, 4); c.fillRect(13, 10, 1, 4);
});

defTile(T.WINDOW_FLOWER, 'Flower Window', { solid: true, minimap: '#a8c8e8' }, (c, rng) => {
  speckle(c, rng, '#d0b088', ['#c4a47c'], 12);
  c.fillStyle = '#5a4630'; c.fillRect(3, 1, 10, 9);
  c.fillStyle = '#88b8e0'; c.fillRect(4, 2, 8, 7);
  c.fillStyle = '#b8d8f0'; c.fillRect(4, 2, 3, 3);
  c.fillStyle = '#5a4630'; c.fillRect(7, 2, 1, 7); c.fillRect(4, 5, 8, 1);
  // window box with flowers
  c.fillStyle = '#8a5a30'; c.fillRect(2, 10, 12, 3);
  c.fillStyle = '#4a8c3a';
  c.fillRect(3, 9, 2, 1); c.fillRect(7, 9, 2, 1); c.fillRect(11, 9, 2, 1);
  px(c, 3, 8, '#e84848'); px(c, 8, 8, '#f0d030'); px(c, 12, 8, '#e88ab8');
});

defTile(T.DOCK, 'Dock', { variants: 2, minimap: '#9a7850' }, (c, rng) => {
  // weathered planks over the sea
  speckle(c, rng, '#9a7850', ['#8e6c46', '#a6845c'], 14);
  c.fillStyle = '#3868c8';
  c.fillRect(0, 3, 16, 1); c.fillRect(0, 11, 16, 1);
  c.fillStyle = '#7a5c38';
  c.fillRect(0, 4, 16, 1); c.fillRect(0, 12, 16, 1);
  // mooring posts
  c.fillStyle = '#5c4224';
  c.fillRect(1, 6, 2, 4); c.fillRect(13, 13, 2, 3);
});

defTile(T.ROOF_BLUE, 'Slate Roof', { solid: true, variants: 2, minimap: '#4868a8' }, (c, rng) => {
  speckle(c, rng, '#4868a8', ['#40609c', '#5474b4'], 16);
  c.fillStyle = '#38538a';
  c.fillRect(0, 3, 16, 1); c.fillRect(0, 8, 16, 1); c.fillRect(0, 13, 16, 1);
  c.fillStyle = '#6a8cc8';
  c.fillRect(0, 0, 16, 1);
});

defTile(T.ROOF_BLUE_EDGE, 'Slate Eave', { solid: true, minimap: '#324a78' }, (c, rng) => {
  speckle(c, rng, '#38538a', ['#324a78', '#40609c'], 14);
  c.fillStyle = '#243858'; c.fillRect(0, 12, 16, 4);
  c.fillStyle = '#6a8cc8'; c.fillRect(0, 0, 16, 1);
});

// ============================================================
// glacier
// ============================================================
defTile(T.ICE, 'Ice Floor', { variants: 3, minimap: '#a8ccec' }, (c, rng) => {
  speckle(c, rng, '#b4d4ee', ['#a6c8e6', '#c2def4', '#9cbede'], 20);
  // hairline cracks
  c.fillStyle = '#8ab0d8';
  const x = 2 + Math.floor(rng() * 10), y = 2 + Math.floor(rng() * 10);
  px(c, x, y, '#8ab0d8'); px(c, x + 1, y + 1, '#8ab0d8'); px(c, x + 2, y + 1, '#8ab0d8');
  c.fillStyle = '#e8f4fc';
  c.fillRect(3, 3, 2, 1);
});

// ============================================================
// desert
// ============================================================
defTile(T.CACTUS, 'Cactus', { solid: true, variants: 3, minimap: '#4a8a4a' }, (c, rng) => {
  speckle(c, rng, '#e0cc90', ['#d6c082', '#eada9e'], 20);
  c.fillStyle = '#3f8a44';
  c.fillRect(6, 3, 4, 12);
  c.fillRect(2, 5, 2, 4); c.fillRect(3, 8, 3, 2);
  c.fillRect(12, 6, 2, 3); c.fillRect(10, 8, 3, 2);
  c.fillStyle = '#57a85c';
  c.fillRect(6, 3, 1, 12); c.fillRect(2, 5, 1, 4);
  c.fillStyle = '#2c6430';
  c.fillRect(9, 4, 1, 11);
  px(c, 7, 2, '#e8a8c8'); px(c, 8, 2, '#f0c0d8'); // little flower
  c.fillStyle = '#f0f0e0';
  px(c, 5, 6, '#f0f0e0'); px(c, 10, 10, '#f0f0e0'); px(c, 7, 12, '#f0f0e0'); // spines
});

defTile(T.PALM, 'Palm', { solid: true, variants: 2, minimap: '#5a9a4a' }, (c, rng) => {
  speckle(c, rng, '#e0cc90', ['#d6c082', '#eada9e'], 18);
  // fronds
  c.fillStyle = '#3f8a44';
  c.fillRect(2, 3, 5, 2); c.fillRect(9, 3, 5, 2);
  c.fillRect(4, 1, 3, 2); c.fillRect(9, 1, 3, 2);
  c.fillRect(1, 5, 3, 2); c.fillRect(12, 5, 3, 2);
  c.fillStyle = '#57a85c';
  c.fillRect(6, 2, 4, 2);
  // trunk (leaning)
  c.fillStyle = '#a8814e';
  c.fillRect(7, 4, 2, 3); c.fillRect(8, 7, 2, 4); c.fillRect(9, 11, 2, 4);
  c.fillStyle = '#84623a';
  px(c, 7, 5, '#84623a'); px(c, 8, 9, '#84623a'); px(c, 9, 13, '#84623a');
});

defTile(T.ICE_WALL, 'Ice Wall', { solid: true, variants: 2, minimap: '#4870a0' }, (c, rng) => {
  speckle(c, rng, '#5880b0', ['#4c74a4', '#6890c0'], 18);
  c.fillStyle = '#38598a';
  c.fillRect(0, 0, 16, 1); c.fillRect(0, 5, 16, 1); c.fillRect(0, 10, 16, 1); c.fillRect(0, 15, 16, 1);
  c.fillRect(4, 1, 1, 4); c.fillRect(11, 6, 1, 4); c.fillRect(7, 11, 1, 4);
  c.fillStyle = '#a8d0f0'; c.fillRect(1, 1, 3, 1); c.fillRect(12, 6, 2, 1);
});
