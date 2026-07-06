// ============================================================
// mapbuilder.js — programmatic map authoring API.
// Every map in the game is authored with this builder; the in-game
// editor (editor.js) manipulates the same map format.
// ============================================================
'use strict';

class MapBuilder {
  constructor(id, w, h, baseTile, opts = {}) {
    this.map = {
      id, w, h,
      name: opts.name || id,
      tiles: new Array(w * h).fill(baseTile),
      music: opts.music || 'overworld',
      ambient: opts.ambient || 'day',   // day | dusk | cave | dungeon
      dark: !!opts.dark,                 // requires lantern light radius
      indoor: !!opts.indoor,
      enemies: [],
      npcs: [],
      objects: [],
      portals: [],
      respawn: opts.respawn || { x: Math.floor(w / 2), y: Math.floor(h / 2) }
    };
    this.rng = RNG(opts.seed || 7);
  }

  idx(x, y) { return y * this.map.w + x; }
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.map.w && y < this.map.h; }

  get(x, y) { return this.inBounds(x, y) ? this.map.tiles[this.idx(x, y)] : -1; }

  set(x, y, t) {
    if (this.inBounds(x, y)) this.map.tiles[this.idx(x, y)] = t;
    return this;
  }

  fill(t) { this.map.tiles.fill(t); return this; }

  rect(x, y, w, h, t) {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) this.set(i, j, t);
    return this;
  }

  outline(x, y, w, h, t) {
    for (let i = x; i < x + w; i++) { this.set(i, y, t); this.set(i, y + h - 1, t); }
    for (let j = y; j < y + h; j++) { this.set(x, j, t); this.set(x + w - 1, j, t); }
    return this;
  }

  border(t, thickness = 1) {
    for (let k = 0; k < thickness; k++) this.outline(k, k, this.map.w - 2 * k, this.map.h - 2 * k, t);
    return this;
  }

  hline(x1, x2, y, t, width = 1) {
    const [a, b] = x1 <= x2 ? [x1, x2] : [x2, x1];
    for (let i = a; i <= b; i++)
      for (let k = 0; k < width; k++) this.set(i, y + k, t);
    return this;
  }

  vline(x, y1, y2, t, width = 1) {
    const [a, b] = y1 <= y2 ? [y1, y2] : [y2, y1];
    for (let j = a; j <= b; j++)
      for (let k = 0; k < width; k++) this.set(x + k, j, t);
    return this;
  }

  // winding path between waypoints (L-shaped segments)
  path(points, t, width = 2) {
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[i + 1];
      this.hline(x1, x2, y1, t, width);
      this.vline(x2, y1, y2, t, width);
    }
    return this;
  }

  // random scatter of tile t over region, only replacing tiles in `over` list
  scatter(t, density, region, over = null) {
    const { x = 0, y = 0, w = this.map.w, h = this.map.h } = region || {};
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        if (this.rng() < density) {
          const cur = this.get(i, j);
          if (over === null || over.includes(cur)) this.set(i, j, t);
        }
      }
    }
    return this;
  }

  // organic blob of tile t
  blob(cx, cy, r, t, over = null) {
    for (let j = cy - r; j <= cy + r; j++) {
      for (let i = cx - r; i <= cx + r; i++) {
        const d = Math.hypot(i - cx, j - cy);
        if (d <= r - this.rng() * 1.8) {
          const cur = this.get(i, j);
          if (over === null || over.includes(cur)) this.set(i, j, t);
        }
      }
    }
    return this;
  }

  // lake with shallow rim
  lake(cx, cy, r) {
    this.blob(cx, cy, r + 1, T.SHALLOWS);
    this.blob(cx, cy, r, T.WATER);
    this.blob(cx, cy, Math.max(1, r - 2), T.DEEPWATER);
    return this;
  }

  // ---- stamps -------------------------------------------------
  // house: roof rows + wall row with door; door position dx (offset from x)
  house(x, y, w, h, opts = {}) {
    const roofH = Math.max(1, h - 1);
    this.rect(x, y, w, roofH, T.HOUSE_ROOF);
    this.rect(x, y + roofH - 1, w, 1, T.ROOF_EDGE);
    this.rect(x, y + roofH, w, 1, T.HOUSE_WALL);
    const dx = opts.dx !== undefined ? opts.dx : Math.floor(w / 2);
    if (opts.window !== false && w >= 4) {
      this.set(x + 1, y + roofH, T.HOUSE_WINDOW);
      this.set(x + w - 2, y + roofH, T.HOUSE_WINDOW);
    }
    this.set(x + dx, y + roofH, T.HOUSE_DOOR);
    if (opts.to) {
      this.portal(x + dx, y + roofH, 1, 1, opts.to, opts.tx, opts.ty, 'up', { sfx: 'door' });
    }
    return this;
  }

  // interior room: walls + floor; door gap at bottom center
  room(x, y, w, h, floorT, wallT) {
    this.rect(x, y, w, h, floorT);
    this.outline(x, y, w, h, wallT);
    return this;
  }

  // ---- entities & metadata -------------------------------------
  enemy(type, x, y, opts = {}) {
    this.map.enemies.push(Object.assign({ type, x, y }, opts));
    return this;
  }

  npc(id, x, y) { this.map.npcs.push({ id, x, y }); return this; }

  object(type, x, y, props = {}) {
    this.map.objects.push(Object.assign({ type, x, y }, props));
    return this;
  }

  chest(x, y, contents, opts = {}) {
    return this.object('chest', x, y, Object.assign({ contents }, opts));
  }

  portal(x, y, w, h, to, tx, ty, dir = 'down', opts = {}) {
    this.map.portals.push(Object.assign({ x, y, w, h, to, tx, ty, dir }, opts));
    return this;
  }

  respawn(x, y) { this.map.respawn = { x, y }; return this; }

  build() { return this.map; }

  // ---- serialization (used by editor import/export) ------------
  static serialize(map) {
    return JSON.stringify(map);
  }

  static deserialize(json) {
    const m = typeof json === 'string' ? JSON.parse(json) : json;
    if (!m.tiles || !m.w || !m.h) throw new Error('Invalid map data');
    m.enemies = m.enemies || [];
    m.npcs = m.npcs || [];
    m.objects = m.objects || [];
    m.portals = m.portals || [];
    m.respawn = m.respawn || { x: Math.floor(m.w / 2), y: Math.floor(m.h / 2) };
    return m;
  }
}
