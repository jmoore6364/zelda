// ============================================================
// editor.js — in-game map editor.
// Operates on the exact same map format as MapBuilder/maps.js.
// Custom maps persist to localStorage; overrides replace game maps.
// ============================================================
'use strict';

const Editor = {
  active: false,
  map: null,
  camX: 0, camY: 0,
  mode: 'tile',            // tile | enemy | npc | object | portal | erase
  tileId: T.GRASS,
  enemyIdx: 0,
  npcIdx: 0,
  objIdx: 0,
  showPalette: false,
  showHelp: false,
  grid: true,
  msg: '', msgT: 0,
  loadIdx: 0,
  brush: 1,

  ENEMY_LIST: ['octorok', 'moblin', 'keese', 'stalfos', 'chu', 'leever', 'wizzrobe', 'darknut', 'peahat', 'zora', 'armos', 'poe', 'wolfos', 'freezard', 'blade_trap', 'gibdo', 'vulture', 'sandwurm'],
  NPC_LIST: ['elder', 'marin', 'shopkeep', 'innkeep', 'traveler_finn', 'guard_bex', 'oldman_sage', 'scholar_ivo', 'townwoman_ella', 'townman_dole', 'kid_pip', 'kid_nell', 'mother_ana', 'granny_lu', 'villager_meg', 'villager_tomm', 'fairy', 'princess', 'hermit_yeta', 'fisherman_odon', 'nomad_zaffa', 'digger_dan', 'lorelei', 'rancher_elda', 'cucco_pella'],
  OBJ_LIST: ['chest', 'pot', 'sign', 'torch', 'locked_door', 'boss_door', 'switch_crystal', 'boss_trigger', 'shard_gate', 'crypt_gate', 'tomb_gate'],
  CUSTOM_KEY: 'zelda2_custom_maps',
  OVERRIDE_KEY: 'zelda2_map_overrides',

  open(mapId) {
    this.active = true;
    Game.state = 'editor';
    AudioSys.stop();
    if (!this.map) this.newMap(40, 30);
    if (mapId && WORLD[mapId]) this.loadFrom(WORLD[mapId]);
    this.toast('MAP EDITOR — press H for help');
  },

  close() {
    this.active = false;
    Game.state = 'title';
  },

  newMap(w, h) {
    const b = new MapBuilder('custom_' + Date.now().toString(36), w, h, T.GRASS, { name: 'Custom Map', seed: (Math.random() * 9999) | 0 });
    b.border(T.MOUNTAIN, 1);
    this.map = b.build();
    this.camX = 0; this.camY = 0;
  },

  loadFrom(src) {
    this.map = MapBuilder.deserialize(JSON.stringify(src));
    this.camX = 0; this.camY = 0;
    this.toast('Loaded: ' + this.map.id);
  },

  toast(m) { this.msg = m; this.msgT = 2.5; },

  customMaps() {
    try { return JSON.parse(localStorage.getItem(this.CUSTOM_KEY) || '{}'); }
    catch (e) { return {}; }
  },

  saveCustom() {
    const all = this.customMaps();
    all[this.map.id] = this.map;
    localStorage.setItem(this.CUSTOM_KEY, JSON.stringify(all));
    this.toast('Saved "' + this.map.id + '" to browser storage');
  },

  overrides() {
    try { return JSON.parse(localStorage.getItem(this.OVERRIDE_KEY) || '{}'); }
    catch (e) { return {}; }
  },

  applyOverride() {
    if (!WORLD[this.map.id]) { this.toast('Map id "' + this.map.id + '" is not a game map — cannot override'); return; }
    const all = this.overrides();
    all[this.map.id] = this.map;
    localStorage.setItem(this.OVERRIDE_KEY, JSON.stringify(all));
    this.toast('Override saved! The game now uses your version of ' + this.map.id);
  },

  clearOverrides() {
    localStorage.removeItem(this.OVERRIDE_KEY);
    this.toast('All overrides cleared — game uses built-in maps');
  },

  allLoadable() {
    const list = Object.keys(WORLD).map(id => ({ id, src: WORLD[id], custom: false }));
    const cust = this.customMaps();
    for (const id in cust) list.push({ id, src: cust[id], custom: true });
    return list;
  },

  export() {
    const json = MapBuilder.serialize(this.map);
    console.log('=== MAP EXPORT: ' + this.map.id + ' ===');
    console.log(json);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(
        () => this.toast('Map JSON copied to clipboard (also in console)'),
        () => this.toast('Map JSON printed to console (F12)')
      );
    } else this.toast('Map JSON printed to console (F12)');
  },

  import() {
    const json = window.prompt('Paste map JSON:');
    if (!json) return;
    try {
      this.map = MapBuilder.deserialize(json);
      this.toast('Imported: ' + this.map.id);
    } catch (e) {
      this.toast('Import failed: ' + e.message);
    }
  },

  // ---------------- update ----------------
  update(dt) {
    if (this.msgT > 0) this.msgT -= dt;

    // help overlay swallows input
    if (this.showHelp) {
      if (Input.pressed['KeyH'] || Input.cancel() || Input.confirm()) this.showHelp = false;
      return;
    }

    if (Input.pressed['Escape']) { this.close(); return; }
    if (Input.pressed['KeyH']) this.showHelp = true;
    if (Input.pressed['KeyG']) this.grid = !this.grid;
    if (Input.pressed['Tab']) this.showPalette = !this.showPalette;

    // mode keys
    if (Input.pressed['Digit1']) { this.mode = 'tile'; this.toast('Mode: paint tiles'); }
    if (Input.pressed['Digit2']) { this.mode = 'enemy'; this.toast('Mode: place enemies (Q/W cycles type)'); }
    if (Input.pressed['Digit3']) { this.mode = 'npc'; this.toast('Mode: place NPCs (Q/W cycles)'); }
    if (Input.pressed['Digit4']) { this.mode = 'object'; this.toast('Mode: place objects (Q/W cycles)'); }
    if (Input.pressed['Digit5']) { this.mode = 'portal'; this.toast('Mode: place portals (click + fill prompts)'); }
    if (Input.pressed['Digit6']) { this.mode = 'erase'; this.toast('Mode: erase entities'); }

    // cycle selections
    const cyc = (Input.pressed['KeyW'] ? 1 : 0) - (Input.pressed['KeyQ'] ? 1 : 0);
    if (cyc) {
      if (this.mode === 'enemy') this.enemyIdx = (this.enemyIdx + cyc + this.ENEMY_LIST.length) % this.ENEMY_LIST.length;
      if (this.mode === 'npc') this.npcIdx = (this.npcIdx + cyc + this.NPC_LIST.length) % this.NPC_LIST.length;
      if (this.mode === 'object') this.objIdx = (this.objIdx + cyc + this.OBJ_LIST.length) % this.OBJ_LIST.length;
      if (this.mode === 'tile') {
        const ids = Object.values(T);
        const i = ids.indexOf(this.tileId);
        this.tileId = ids[(i + cyc + ids.length) % ids.length];
      }
      AudioSys.sfx('menu');
    }
    if (Input.pressed['BracketLeft']) this.brush = Math.max(1, this.brush - 1);
    if (Input.pressed['BracketRight']) this.brush = Math.min(5, this.brush + 1);

    // pan (arrows)
    const pan = 220 * dt;
    if (Input.keys['ArrowLeft']) this.camX -= pan;
    if (Input.keys['ArrowRight']) this.camX += pan;
    if (Input.keys['ArrowUp']) this.camY -= pan;
    if (Input.keys['ArrowDown']) this.camY += pan;
    this.camX = U.clamp(this.camX, 0, Math.max(0, this.map.w * 16 - 384));
    this.camY = U.clamp(this.camY, 0, Math.max(0, this.map.h * 16 - 216));

    // file ops
    if (Input.pressed['KeyS']) this.saveCustom();
    if (Input.pressed['KeyO']) this.applyOverride();
    if (Input.pressed['KeyK']) this.clearOverrides();
    if (Input.pressed['KeyE']) this.export();
    if (Input.pressed['KeyI']) this.import();
    if (Input.pressed['KeyN']) {
      const sz = window.prompt('New map size "width height" (e.g. 40 30):', '40 30');
      if (sz) {
        const [w, h] = sz.split(/[\s,x]+/).map(Number);
        if (w >= 10 && h >= 10 && w <= 200 && h <= 200) this.newMap(w, h);
        else this.toast('Size must be between 10x10 and 200x200');
      }
    }
    if (Input.pressed['KeyL']) {
      const list = this.allLoadable();
      this.loadIdx = (this.loadIdx + 1) % list.length;
      this.loadFrom(list[this.loadIdx].src);
    }
    if (Input.pressed['KeyM']) {
      const name = window.prompt('Map id / name:', this.map.id);
      if (name) { this.map.id = name.trim().replace(/\s+/g, '_'); this.map.name = name; this.toast('Renamed: ' + this.map.id); }
    }
    if (Input.pressed['KeyR']) {
      const t = this.mouseTile();
      if (t) { this.map.respawn = { x: t.x, y: t.y }; this.toast('Respawn point set'); }
    }
    if (Input.pressed['KeyP']) {
      Game.startPlaytest(this.map);
      return;
    }
    if (Input.pressed['KeyF']) {
      const t = this.mouseTile();
      if (t && this.mode === 'tile') this.floodFill(t.x, t.y, this.tileId);
    }

    // painting
    const t = this.mouseTile();
    if (t) {
      if (Input.mouse.down && this.mode === 'tile') {
        const r = Math.floor(this.brush / 2);
        for (let j = t.y - r; j <= t.y + r; j++)
          for (let i = t.x - r; i <= t.x + r; i++)
            this.setTile(i, j, this.tileId);
      }
      if (Input.mouse.clicked) this.click(t);
      if (Input.mouse.rclicked) this.rclick(t);
      if (Input.mouse.wheel) {
        const ids = Object.values(T);
        const i = ids.indexOf(this.tileId);
        this.tileId = ids[(i + Input.mouse.wheel + ids.length) % ids.length];
      }
    }
  },

  mouseTile() {
    const mx = Input.mouse.x, my = Input.mouse.y;
    if (my > 216 && this.showPalette) return null; // over palette
    const x = Math.floor((mx + this.camX) / 16);
    const y = Math.floor((my + this.camY) / 16);
    if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) return null;
    return { x, y };
  },

  setTile(x, y, id) {
    if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) return;
    this.map.tiles[y * this.map.w + x] = id;
  },

  floodFill(x, y, id) {
    const m = this.map;
    const target = m.tiles[y * m.w + x];
    if (target === id) return;
    const stack = [[x, y]];
    let n = 0;
    while (stack.length && n < 40000) {
      const [i, j] = stack.pop();
      if (i < 0 || j < 0 || i >= m.w || j >= m.h) continue;
      if (m.tiles[j * m.w + i] !== target) continue;
      m.tiles[j * m.w + i] = id;
      n++;
      stack.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);
    }
    this.toast('Filled ' + n + ' tiles');
  },

  click(t) {
    switch (this.mode) {
      case 'enemy':
        this.map.enemies.push({ type: this.ENEMY_LIST[this.enemyIdx], x: t.x, y: t.y });
        AudioSys.sfx('select');
        break;
      case 'npc':
        this.map.npcs.push({ id: this.NPC_LIST[this.npcIdx], x: t.x, y: t.y });
        AudioSys.sfx('select');
        break;
      case 'object': {
        const type = this.OBJ_LIST[this.objIdx];
        const obj = { type, x: t.x, y: t.y };
        if (type === 'chest') {
          const c = window.prompt('Chest contents (rupees N | key | bosskey | dungeon_map | compass | bow | lantern | master_sword | heart_container | potion | bombs N | arrows N | shield):', 'rupees 20');
          if (!c) return;
          const [ct, amt] = c.trim().split(/\s+/);
          obj.contents = { type: ct, amount: amt ? Number(amt) : undefined };
        }
        if (type === 'sign') {
          const txt = window.prompt('Sign text:', 'Hello, world!');
          if (txt === null) return;
          obj.text = txt;
        }
        if (type === 'boss_trigger') {
          const bs = window.prompt('Boss (gloomspore | magmadon | wraithlord | shade):', 'gloomspore');
          if (!bs) return;
          obj.boss = bs.trim();
          obj.w = 8; obj.h = 8;
        }
        if (type === 'locked_door' || type === 'boss_door' || type === 'shard_gate' || type === 'crypt_gate') { obj.w = 2; obj.h = 1; }
        if (type === 'switch_crystal') obj.id = 'switch_' + Date.now().toString(36);
        this.map.objects.push(obj);
        AudioSys.sfx('select');
        break;
      }
      case 'portal': {
        const to = window.prompt('Portal destination map id:\n(' + Object.keys(WORLD).join(', ') + ')', 'overworld');
        if (!to) return;
        const dest = window.prompt('Destination tile "x y":', '10 10');
        if (!dest) return;
        const [tx, ty] = dest.split(/[\s,]+/).map(Number);
        this.map.portals.push({ x: t.x, y: t.y, w: 1, h: 1, to: to.trim(), tx, ty, dir: 'down', sfx: 'stairs' });
        AudioSys.sfx('select');
        break;
      }
      case 'erase':
        this.eraseAt(t);
        break;
    }
  },

  rclick(t) {
    if (this.mode === 'tile') {
      // eyedropper
      this.tileId = this.map.tiles[t.y * this.map.w + t.x];
      this.toast('Picked: ' + (Tiles.def(this.tileId) || {}).name);
    } else {
      this.eraseAt(t);
    }
  },

  eraseAt(t) {
    const m = this.map;
    const hit = arr => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const o = arr[i];
        const w = o.w || 1, h = o.h || 1;
        if (t.x >= o.x && t.x < o.x + w && t.y >= o.y && t.y < o.y + h) {
          arr.splice(i, 1);
          return true;
        }
      }
      return false;
    };
    if (hit(m.enemies) || hit(m.npcs) || hit(m.objects) || hit(m.portals)) AudioSys.sfx('hit');
  },

  // ---------------- draw ----------------
  draw(ctx) {
    const m = this.map;
    ctx.fillStyle = '#141420';
    ctx.fillRect(0, 0, 384, 240);

    const x0 = Math.floor(this.camX / 16), y0 = Math.floor(this.camY / 16);
    const x1 = Math.min(m.w - 1, x0 + 25), y1 = Math.min(m.h - 1, y0 + 15);

    ctx.save();
    ctx.translate(-Math.round(this.camX), -Math.round(this.camY));

    for (let j = y0; j <= y1; j++) {
      for (let i = x0; i <= x1; i++) {
        Tiles.draw(ctx, m.tiles[j * m.w + i], i * 16, j * 16, i, j);
      }
    }

    // grid
    if (this.grid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 0.5;
      for (let i = x0; i <= x1 + 1; i++) {
        ctx.beginPath(); ctx.moveTo(i * 16, y0 * 16); ctx.lineTo(i * 16, (y1 + 1) * 16); ctx.stroke();
      }
      for (let j = y0; j <= y1 + 1; j++) {
        ctx.beginPath(); ctx.moveTo(x0 * 16, j * 16); ctx.lineTo((x1 + 1) * 16, j * 16); ctx.stroke();
      }
    }

    // portals
    for (const p of m.portals) {
      ctx.fillStyle = 'rgba(80,140,255,0.4)';
      ctx.fillRect(p.x * 16, p.y * 16, (p.w || 1) * 16, (p.h || 1) * 16);
      ctx.strokeStyle = '#78a8ff';
      ctx.strokeRect(p.x * 16 + 0.5, p.y * 16 + 0.5, (p.w || 1) * 16 - 1, (p.h || 1) * 16 - 1);
      ctx.font = '6px monospace';
      ctx.fillStyle = '#c8e0ff';
      ctx.fillText('→' + p.to, p.x * 16 + 1, p.y * 16 + 7);
    }

    // objects
    for (const o of m.objects) {
      const spr = {
        chest: 'chest', pot: 'pot', sign: 'sign', torch: 'torch',
        locked_door: 'door_locked', boss_door: 'door_boss',
        switch_crystal: 'switch_crystal'
      }[o.type];
      if (spr) Sprites.draw(ctx, spr, 0, o.x * 16, o.y * 16);
      else {
        ctx.fillStyle = o.type === 'boss_trigger' ? 'rgba(255,60,60,0.25)' : 'rgba(255,200,60,0.35)';
        ctx.fillRect(o.x * 16, o.y * 16, (o.w || 1) * 16, (o.h || 1) * 16);
        ctx.font = '6px monospace';
        ctx.fillStyle = '#ffd0d0';
        ctx.fillText(o.type.slice(0, 10), o.x * 16 + 1, o.y * 16 + 7);
      }
    }

    // enemies & npcs
    for (const e of m.enemies) {
      Sprites.draw(ctx, e.type, 0, e.x * 16, e.y * 16);
      ctx.strokeStyle = 'rgba(255,80,80,0.6)';
      ctx.strokeRect(e.x * 16 + 0.5, e.y * 16 + 0.5, 15, 15);
    }
    for (const n of m.npcs) {
      const npc = new NPC(n.id, 0, 0);
      Sprites.draw(ctx, npc.sprite, 0, n.x * 16, n.y * 16);
      ctx.strokeStyle = 'rgba(80,255,120,0.6)';
      ctx.strokeRect(n.x * 16 + 0.5, n.y * 16 + 0.5, 15, 15);
    }

    // respawn
    ctx.strokeStyle = '#f8e080';
    ctx.strokeRect(m.respawn.x * 16 + 2.5, m.respawn.y * 16 + 2.5, 11, 11);
    ctx.font = '6px monospace';
    ctx.fillStyle = '#f8e080';
    ctx.fillText('S', m.respawn.x * 16 + 6, m.respawn.y * 16 + 11);

    // hover cursor
    const t = this.mouseTile();
    if (t) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      const r = this.mode === 'tile' ? Math.floor(this.brush / 2) : 0;
      ctx.strokeRect((t.x - r) * 16 + 0.5, (t.y - r) * 16 + 0.5, (r * 2 + 1) * 16 - 1, (r * 2 + 1) * 16 - 1);
    }

    ctx.restore();

    // ---------- UI chrome ----------
    // top bar
    ctx.fillStyle = 'rgba(8,8,20,0.9)';
    ctx.fillRect(0, 0, 384, 11);
    ctx.font = '7px monospace';
    ctx.fillStyle = '#e8c860';
    const sel = this.mode === 'tile' ? (Tiles.def(this.tileId) || {}).name
      : this.mode === 'enemy' ? this.ENEMY_LIST[this.enemyIdx]
      : this.mode === 'npc' ? this.NPC_LIST[this.npcIdx]
      : this.mode === 'object' ? this.OBJ_LIST[this.objIdx] : '';
    ctx.fillText(`EDITOR  [${this.map.id}] ${this.map.w}x${this.map.h}  mode:${this.mode}${sel ? ' (' + sel + ')' : ''}  brush:${this.brush}`, 4, 8);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8888a0';
    ctx.fillText('H:help  Esc:exit', 380, 8);
    ctx.textAlign = 'left';

    // palette
    if (this.showPalette) this.drawPalette(ctx);

    // toast
    if (this.msgT > 0) {
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(8,8,20,0.9)';
      const w = ctx.measureText(this.msg).width + 16;
      ctx.fillRect(192 - w / 2, 218, w, 14);
      ctx.fillStyle = '#f8e080';
      ctx.fillText(this.msg, 192, 228);
      ctx.textAlign = 'left';
    }

    if (this.showHelp) this.drawHelp(ctx);
  },

  drawPalette(ctx) {
    const ids = Object.values(T);
    const cols = 22;
    const rows = Math.ceil(ids.length / cols);
    const ph = rows * 17 + 6;
    ctx.fillStyle = 'rgba(8,8,20,0.92)';
    ctx.fillRect(0, 240 - ph, 384, ph);
    ids.forEach((id, i) => {
      const x = 6 + (i % cols) * 17, y = 240 - ph + 4 + Math.floor(i / cols) * 17;
      const d = Tiles.def(id);
      if (d) ctx.drawImage(d.canvases[0][0], x, y, 15, 15);
      if (id === this.tileId) {
        ctx.strokeStyle = '#f8e080';
        ctx.strokeRect(x - 0.5, y - 0.5, 16, 16);
      }
      // click to select
      const mx = Input.mouse.x, my = Input.mouse.y;
      if (Input.mouse.clicked && mx >= x && mx < x + 16 && my >= y && my < y + 16) {
        this.tileId = id;
        this.mode = 'tile';
        this.toast((Tiles.def(id) || {}).name);
      }
    });
  },

  drawHelp(ctx) {
    ctx.fillStyle = 'rgba(6,6,16,0.95)';
    ctx.fillRect(0, 0, 384, 240);
    const lines = [
      'MAP EDITOR — the same tool that built this game\'s world',
      '',
      'MODES   1 tiles   2 enemies   3 NPCs   4 objects   5 portals   6 erase',
      '',
      'PAINT   left-drag: paint    right-click: eyedrop / delete entity',
      '        wheel or Q/W: cycle selection    [ ]: brush size    F: flood fill',
      '        Tab: tile palette    G: toggle grid    R: set spawn at cursor',
      '',
      'CAMERA  arrow keys pan the view',
      '',
      'FILE    S: save to browser    L: cycle through all maps (game+custom)',
      '        N: new map    M: rename    E: export JSON    I: import JSON',
      '',
      'PLAY    P: playtest this map right now!',
      '        O: OVERRIDE — replace the real game map with your edit',
      '        K: clear all overrides',
      '',
      'Esc returns to the title screen.',
      '',
      '            press any key to close'
    ];
    ctx.font = '7px monospace';
    lines.forEach((l, i) => {
      ctx.fillStyle = i === 0 ? '#f8e080' : '#d0d0e0';
      ctx.fillText(l, 16, 24 + i * 11);
    });
  }
};
