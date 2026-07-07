// ============================================================
// game.js — main loop, state machine, world runtime, rendering
// ============================================================
'use strict';

const VIEW_W = 384, VIEW_H = 240, SCALE = 3;

const Game = {
  canvas: null, ctx: null,
  state: 'title', // title saveselect settings intro play pause dialogue inventory map gameover bossintro ending editor
  data: null,
  map: null,          // runtime map instance
  player: null,
  enemies: [], npcs: [], objects: [], pickups: [], projectiles: [], bombs: [],
  boomerang: null,
  boss: null,
  bossIntroT: 0,
  camX: 0, camY: 0,
  shakeAmt: 0, shakeT: 0,
  transition: null,   // {t, dur, mid}
  intro: null,        // {page, t}
  playtest: false,
  darkCanvas: null,
  audioReady: false,
  lastTime: 0,

  // ---------------- boot ----------------
  boot() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    Sprites.bake();
    buildWorld();
    Input.init(this.canvas);
    SaveSys.loadSettings();
    this.data = SaveSys.defaultData();

    // audio needs a user gesture
    const initAudio = () => {
      if (this.audioReady) return;
      AudioSys.init();
      AudioSys.resume();
      SaveSys.applySettings();
      this.audioReady = true;
      if (this.state === 'title') AudioSys.play('title');
    };
    window.addEventListener('keydown', initAudio, { once: false });
    window.addEventListener('mousedown', initAudio, { once: false });
    window.addEventListener('touchstart', initAudio, { once: false });

    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  },

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    Input.flush();
    requestAnimationFrame(t => this.loop(t));
  },

  // ---------------- game lifecycle ----------------
  newGame(slot) {
    this.data = SaveSys.defaultData();
    this.data.slot = slot;
    this.playtest = false;
    this.intro = { page: 0, t: 0 };
    this.state = 'intro';
    AudioSys.stop();
    AudioSys.play('cave');
  },

  loadGame(slot) {
    const d = SaveSys.load(slot);
    if (!d) return;
    this.data = d;
    this.playtest = false;
    this.loadMap(d.mapId, null, null, { px: d.px, py: d.py });
    this.state = 'play';
  },

  respawnFresh() {
    this.data.player.hearts = this.data.player.maxHearts;
    this.loadMap('overworld', 16, 57);
    this.state = 'play';
  },

  startGameProper() {
    this.intro = null;
    this.loadMap('overworld', 16, 57);
    this.state = 'play';
    setTimeout(() => {
      if (this.state === 'play') {
        Dialogue.start({
          pages: ['Elden Village, at the edge of the twilight. Elder Rowan is waiting in his house to the north — the one with the pots by the door. (E to talk, doors are entered by walking into them.)']
        });
      }
    }, 700);
  },

  toTitle() {
    if (this.playtest) { this.playtest = false; Editor.open(); return; }
    this.state = 'title';
    this.boss = null;
    AudioSys.play('title');
  },

  startPlaytest(mapData) {
    this.playtest = true;
    this.data = SaveSys.defaultData();
    const p = this.data.player;
    p.hasSword = true; p.hasMasterSword = true; p.hasBow = true; p.hasBombs = true; p.hasLantern = true; p.hasShield = true;
    p.hasBoomerang = true; p.hasFireRod = true; p.hasFlippers = true; p.hasPearl = true; p.hasCharm = true;
    p.bombs = 20; p.arrows = 30; p.maxHearts = 10; p.hearts = 10; p.rupees = 100; p.potions = 2;
    const copy = MapBuilder.deserialize(JSON.stringify(mapData));
    this.loadMap(copy, copy.respawn.x, copy.respawn.y);
    this.state = 'play';
  },

  gameOver() {
    this.state = 'gameover';
    UI.goIdx = 0;
    UI.titleT = 0;
    AudioSys.play('gameover');
  },

  startEnding() {
    this.state = 'ending';
    this.boss = null;
    UI.startEnding();
  },

  // ---------------- map runtime ----------------
  loadMap(idOrMap, tx, ty, opts = {}) {
    let src;
    if (typeof idOrMap === 'string') {
      src = WORLD[idOrMap];
      // editor overrides
      try {
        const ov = JSON.parse(localStorage.getItem('zelda2_map_overrides') || '{}');
        if (ov[idOrMap]) src = ov[idOrMap];
      } catch (e) { /* ignore */ }
      if (!src) { console.error('no map', idOrMap); return; }
    } else {
      src = idOrMap;
    }

    const m = {
      id: src.id, name: src.name, w: src.w, h: src.h,
      music: src.music, ambient: src.ambient, dark: src.dark, indoor: src.indoor,
      tiles: src.tiles.slice(),
      portals: src.portals.map(p => Object.assign({}, p)),
      respawn: src.respawn
    };
    this.map = m;

    // apply persistent world changes from flags
    for (let j = 0; j < m.h; j++) {
      for (let i = 0; i < m.w; i++) {
        if (m.tiles[j * m.w + i] === T.CRACKED_WALL && Story.flag(`crack:${m.id}:${i},${j}`)) {
          m.tiles[j * m.w + i] = this.crackFloorTile();
        }
      }
    }
    // hidden under-bush stairs already found?
    for (const p of m.portals) {
      if (p.underBush && Story.flag(`bushportal:${m.id}:${p.x},${p.y}`)) {
        m.tiles[p.y * m.w + p.x] = T.STAIRS_DOWN;
      }
    }

    // objects (runtime copies with state)
    this.objects = src.objects.map(o => {
      const r = Object.assign({}, o);
      if (r.type === 'chest') r.opened = Story.flag(`chest:${m.id}:${r.x},${r.y}`);
      if (r.type === 'locked_door' || r.type === 'boss_door') r.open = Story.flag(`door:${m.id}:${r.x},${r.y}`);
      if (r.type === 'switch_crystal') r.hit = Story.flag(`switch:${r.id}`);
      if (r.type === 'shard_gate') r.open = Story.flag('gate_open');
      if (r.type === 'crypt_gate') r.open = Story.flag('crypt_open');
      if (r.type === 'tomb_gate') r.open = Story.flag('tomb_open');
      if (r.type === 'shopitem' && r.item === 'heart_container') r.soldOut = Story.flag('shop_hc_bought');
      if (r.type === 'shopitem' && r.item === 'bomb_bag') r.soldOut = Story.flag('shop_bb_bought');
      return r;
    });

    // enemies (nudge grounded ones out of solid spawn tiles)
    this.enemies = [];
    for (const e of src.enemies) {
      const en = spawnEnemy(e.type, e.x, e.y);
      if (!en) continue;
      if (!en.flying && e.type !== 'zora' && this.solidAtRect(en.rect())) {
        const spot = this.findFreeTile(e.x, e.y, 4);
        if (spot) { en.x = spot.x * 16 + 2; en.y = spot.y * 16 + 2; }
      }
      this.enemies.push(en);
    }

    // npcs (some leave the world when their story moves on)
    this.npcs = src.npcs.filter(n => !Story.flag('npcgone:' + n.id)).map(n => {
      const npc = new NPC(n.id, n.x, n.y);
      if (this.solidAtRectTiles(npc.rect())) {
        const spot = this.findFreeTile(n.x, n.y, 3);
        if (spot) { npc.x = spot.x * 16 + 2; npc.y = spot.y * 16 + 3; npc.homeX = npc.x; npc.homeY = npc.y; }
      }
      return npc;
    });

    this.pickups = [];
    this.projectiles = [];
    this.bombs = [];
    this.boomerang = null;
    this.boss = null;
    Particles.clear();
    FloatText.clear();

    // player position
    if (!this.player) this.player = new Player(0, 0);
    if (opts.px !== undefined) {
      this.player.x = opts.px; this.player.y = opts.py;
    } else {
      this.player.x = (tx !== null && tx !== undefined ? tx : m.respawn.x) * 16 + 2;
      this.player.y = (ty !== null && ty !== undefined ? ty : m.respawn.y) * 16 + 3;
    }
    this.player.lastSafe = { x: this.player.x, y: this.player.y };
    this.player.kbx = 0; this.player.kby = 0;

    this.updateCamera(true);
    if (this.audioReady) AudioSys.play(m.id === 'overworld' ? this.overworldTrack() : m.music);
  },

  // which song fits where the player is standing on the overworld
  overworldTrack() {
    if (!this.player) return 'overworld';
    const px = this.player.tileX(), py = this.player.tileY();
    if (py >= 70) return 'sea';                            // coast, ocean, isles
    if (px < 15 && py >= 5 && py < 47) return 'glacier';   // Frostpeak Hollow
    if (px >= 94 && py < 25) return 'highlands';           // Auran Highlands
    if (px >= 94 && py < 53) return 'elderwood';           // the Elderwood
    return 'overworld';
  },

  crackFloorTile() {
    const amb = this.map.ambient;
    return (amb === 'cave' || amb === 'dungeon') ? T.CAVE_FLOOR : T.DIRT;
  },

  tileAt(tx, ty) {
    const m = this.map;
    if (!m || tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return T.MOUNTAIN;
    return m.tiles[ty * m.w + tx];
  },

  setTile(tx, ty, id) {
    const m = this.map;
    if (!m || tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return;
    m.tiles[ty * m.w + tx] = id;
  },

  objectSolid(o) {
    switch (o.type) {
      case 'chest': return true;
      case 'sign': return true;
      case 'pot': return !o.smashed;
      case 'locked_door': return !o.open;
      case 'boss_door': return !o.open || (this.boss && !this.boss.dead);
      case 'shard_gate': return !o.open;
      case 'crypt_gate': return !o.open;
      case 'tomb_gate': return !o.open;
      case 'switch_crystal': return true;
      default: return false;
    }
  },

  // tile-only solidity (ignores objects) — used for spawn checks
  solidAtRectTiles(r) {
    const x0 = Math.floor(r.x / 16), y0 = Math.floor(r.y / 16);
    const x1 = Math.floor((r.x + r.w - 0.01) / 16), y1 = Math.floor((r.y + r.h - 0.01) / 16);
    for (let j = y0; j <= y1; j++)
      for (let i = x0; i <= x1; i++)
        if (Tiles.solid(this.tileAt(i, j))) return true;
    return false;
  },

  findFreeTile(tx, ty, radius) {
    for (let r = 1; r <= radius; r++) {
      for (let j = ty - r; j <= ty + r; j++) {
        for (let i = tx - r; i <= tx + r; i++) {
          if (!Tiles.solid(this.tileAt(i, j)) && !Tiles.def(this.tileAt(i, j)).hole) return { x: i, y: j };
        }
      }
    }
    return null;
  },

  // swim: 0/false = none, 1/true = open water, 2 = deep water too (pearl)
  solidAtRect(r, swim = false) {
    const x0 = Math.floor(r.x / 16), y0 = Math.floor(r.y / 16);
    const x1 = Math.floor((r.x + r.w - 0.01) / 16), y1 = Math.floor((r.y + r.h - 0.01) / 16);
    for (let j = y0; j <= y1; j++) {
      for (let i = x0; i <= x1; i++) {
        const tid = this.tileAt(i, j);
        if (Tiles.solid(tid) && !(swim >= 1 && tid === T.WATER) && !(swim >= 2 && tid === T.DEEPWATER)) return true;
      }
    }
    for (const o of this.objects) {
      if (this.objectSolid(o)) {
        const ow = (o.w || 1) * 16, oh = (o.h || 1) * 16;
        if (U.overlap(r, { x: o.x * 16, y: o.y * 16, w: ow, h: oh })) return true;
      }
    }
    return false;
  },

  moveEntity(e, dx, dy) {
    const pd = this.data && this.data.player;
    const swim = (e === this.player && pd && pd.hasFlippers) ? (pd.hasPearl ? 2 : 1) : 0;
    if (dx !== 0) {
      const r = { x: e.x + dx, y: e.y, w: e.w, h: e.h };
      if (!this.solidAtRect(r, swim)) e.x += dx;
    }
    if (dy !== 0) {
      const r = { x: e.x, y: e.y + dy, w: e.w, h: e.h };
      if (!this.solidAtRect(r, swim)) e.y += dy;
    }
  },

  // ---------------- world interactions ----------------
  tryInteract() {
    const pl = this.player;
    const v = DIRS[pl.facing];
    const box = {
      x: pl.cx() + v.x * 12 - 8, y: pl.cy() + v.y * 12 - 8,
      w: 16, h: 16
    };

    // npcs first
    for (const n of this.npcs) {
      if (U.overlap(box, n.rect())) { n.interact(); return; }
    }

    // objects
    for (const o of this.objects) {
      const or = { x: o.x * 16, y: o.y * 16, w: (o.w || 1) * 16, h: (o.h || 1) * 16 };
      if (!U.overlap(box, or)) continue;
      switch (o.type) {
        case 'sign':
          AudioSys.sfx('menu');
          Dialogue.start({ pages: [o.text || '...'] });
          return;
        case 'chest':
          if (!o.opened) {
            o.opened = true;
            Story.set(`chest:${this.map.id}:${o.x},${o.y}`);
            AudioSys.sfx('chest');
            Particles.burst(o.x * 16 + 8, o.y * 16 + 4, 8, { color: ['#f8e060', '#fff'], life: 0.5, g: -30 });
            Items.grant(o.contents || { type: 'rupees', amount: 1 });
          }
          return;
        case 'locked_door': {
          const keys = this.data.player.keys[this.map.id] || 0;
          if (o.open) return;
          if (keys > 0) {
            this.data.player.keys[this.map.id] = keys - 1;
            o.open = true;
            Story.set(`door:${this.map.id}:${o.x},${o.y}`);
            AudioSys.sfx('unlock');
          } else {
            AudioSys.sfx('error');
            Dialogue.start({ pages: ['Locked tight. You need a small key.'] });
          }
          return;
        }
        case 'boss_door':
          if (o.open) return;
          if (this.data.player.bosskeys[this.map.id]) {
            o.open = true;
            Story.set(`door:${this.map.id}:${o.x},${o.y}`);
            AudioSys.sfx('unlock');
            this.shake(3, 0.3);
          } else {
            AudioSys.sfx('error');
            Dialogue.start({ pages: ['A great door, sealed by dark power. Only the BOSS KEY of this place will open it.'] });
          }
          return;
        case 'shard_gate':
          if (o.open) return;
          if (Items.shardCount() >= 3) {
            o.open = true;
            Story.set('gate_open');
            AudioSys.sfx('secret');
            this.shake(6, 0.8);
            Particles.burst(o.x * 16 + 16, o.y * 16 + 8, 30, { color: ['#f8d030', '#48e858', '#e84858', '#48d8e8'], life: 1, speedMax: 100 });
            Dialogue.start({ pages: ['The three shards rise from your pack and blaze like small suns! The ancient gate grinds open...'] });
          } else {
            AudioSys.sfx('error');
            Dialogue.start({ pages: [`The gate is sealed by old magic. Three hollows in the stone await the Sunstone shards. (${Items.shardCount()}/3)`] });
          }
          return;
        case 'crypt_gate':
          if (!o.open) {
            AudioSys.sfx('error');
            Dialogue.start({ pages: ['Sealed stone doors. An inscription: "I open for the crystal\'s song, struck from afar."'] });
          }
          return;
        case 'tomb_gate':
          if (!o.open) {
            AudioSys.sfx('error');
            Dialogue.start({ pages: ['Great sandstone doors, carved with a hollow crown. An inscription: "Sing to the crystal across the broken ground, and the king shall receive you."'] });
          }
          return;
        case 'shopitem':
          this.tryBuy(o);
          return;
      }
    }
  },

  tryBuy(o) {
    const vendor = o.vendor || 'Rusl';
    const portrait = o.vendorPortrait || 'npc_shopkeep';
    if (o.soldOut) {
      Dialogue.start({ speaker: vendor, portrait, pages: ['Sold out, friend! You bought my only one.'] });
      return;
    }
    const p = this.data.player;
    Dialogue.start({
      speaker: vendor, portrait,
      pages: [`${o.label} — ${o.price} rupees. A fine choice. Buying?`],
      choices: [
        { label: `Buy (${o.price}r)`, cb: () => {
          if (p.rupees >= o.price) {
            p.rupees -= o.price;
            AudioSys.sfx('buy');
            if (o.item === 'bombs') Items.grant({ type: 'bombs', amount: 5 });
            else if (o.item === 'arrows') {
              if (!p.hasBow) { Items.grant({ type: 'arrows', amount: 10 }); Dialogue.start({ speaker: vendor, pages: ['...You do know these need a bow, yes? Rumor says one lies in the Verdant Temple.'] }); }
              else Items.grant({ type: 'arrows', amount: 10 });
            }
            else if (o.item === 'potion') Items.grant({ type: 'potion' });
            else if (o.item === 'heart_container') {
              o.soldOut = true;
              Story.set('shop_hc_bought');
              Items.grant({ type: 'heart_container' });
            }
            else if (o.item === 'bomb_bag') {
              o.soldOut = true;
              Story.set('shop_bb_bought');
              Items.grant({ type: 'bomb_bag' });
            }
          } else {
            AudioSys.sfx('error');
            Dialogue.start({ speaker: vendor, portrait, pages: ['Your purse says otherwise, friend. Come back richer.'] });
          }
        } },
        { label: 'Cancel', cb: () => {} }
      ]
    });
  },

  smashPot(o) {
    o.smashed = true;
    AudioSys.sfx('hit');
    Particles.burst(o.x * 16 + 8, o.y * 16 + 8, 10, { color: ['#c88848', '#986030', '#e8b878'], life: 0.5, g: 120 });
    if (Math.random() < 0.5) rollDrop(o.x * 16 + 8, o.y * 16 + 8);
  },

  triggerSwitch(o) {
    if (o.hit) return;
    o.hit = true;
    Story.set(`switch:${o.id}`);
    AudioSys.sfx('switch');
    this.shake(3, 0.3);
    Particles.burst(o.x * 16 + 8, o.y * 16 + 4, 12, { color: ['#e84858', '#f8c8d0'], life: 0.6 });
    if (o.id === 'crypt_switch') {
      Story.set('crypt_open');
      for (const g of this.objects) if (g.type === 'crypt_gate') g.open = true;
      AudioSys.sfx('secret');
      Dialogue.start({ pages: ['A deep rumble rolls across the marsh... The crypt doors have opened!'] });
    }
    if (o.id === 'tomb_switch') {
      Story.set('tomb_open');
      for (const g of this.objects) if (g.type === 'tomb_gate') g.open = true;
      AudioSys.sfx('secret');
      Dialogue.start({ pages: ['Sand pours from the seams of the great doors... The Sandsear Tomb stands open!'] });
    }
  },

  breakCrackedWall(i, j) {
    this.setTile(i, j, this.crackFloorTile());
    Story.set(`crack:${this.map.id}:${i},${j}`);
    AudioSys.sfx('secret');
    this.shake(3, 0.3);
    Particles.burst(i * 16 + 8, j * 16 + 8, 14, { color: ['#5a4a3a', '#3c3228', '#8a7a6a'], life: 0.6, speedMax: 80 });
  },

  // ---------------- per-frame update ----------------
  update(dt) {
    Tiles.update(dt);

    switch (this.state) {
      case 'title': UI.updateTitle(dt); break;
      case 'saveselect': UI.updateSaveSelect(dt); break;
      case 'settings': UI.updateSettings(dt); break;
      case 'pause': UI.updatePause(dt); break;
      case 'inventory': UI.updateInventory(dt); break;
      case 'journal': UI.updateJournal(dt); break;
      case 'map': UI.updateMapScreen(dt); break;
      case 'gameover': UI.updateGameOver(dt); break;
      case 'ending': UI.updateEnding(dt); break;
      case 'editor': Editor.update(dt); break;
      case 'intro': this.updateIntro(dt); break;
      case 'dialogue':
        Dialogue.update(dt);
        Particles.update(dt);
        FloatText.update(dt);
        break;
      case 'bossintro':
        this.bossIntroT += dt;
        Particles.update(dt);
        if (this.bossIntroT > 0.5 && !this._roared) { this._roared = true; AudioSys.sfx('boss_roar'); this.shake(5, 0.5); }
        if (this.bossIntroT >= 3.0) {
          this._roared = false;
          this.state = 'play';
          AudioSys.play(this.boss.id === 'shade' ? 'finalboss' : 'boss');
        }
        break;
      case 'transition': {
        const tr = this.transition;
        tr.t += dt;
        if (!tr.midDone && tr.t >= tr.dur / 2) {
          tr.midDone = true;
          if (tr.mid) tr.mid();
        }
        if (tr.t >= tr.dur) {
          this.transition = null;
          this.state = 'play';
        }
        break;
      }
      case 'play': this.updatePlay(dt); break;
    }
  },

  updateIntro(dt) {
    const it = this.intro;
    it.t += dt;
    const text = Story.INTRO_PAGES[it.page];
    const chars = Math.min(text.length, Math.floor(it.t * 38));
    if (Input.confirm()) {
      if (chars < text.length) it.t = text.length / 38;
      else {
        it.page++;
        it.t = 0;
        AudioSys.sfx('menu');
        if (it.page >= Story.INTRO_PAGES.length) this.startGameProper();
      }
    }
    if (Input.cancel()) this.startGameProper(); // skip intro
  },

  updatePlay(dt) {
    this.data.playTime += dt;

    if (this.playtest && Input.pause()) { Editor.open(); return; }
    if (!this.playtest && Input.pause()) { UI.pauseIdx = 0; this.state = 'pause'; AudioSys.sfx('menu'); return; }
    if (Input.inventory()) { this.state = 'inventory'; AudioSys.sfx('menu'); return; }
    if (Input.mapKey()) { this.state = 'map'; AudioSys.sfx('menu'); return; }
    if (Input.journal()) { this.state = 'journal'; AudioSys.sfx('menu'); return; }

    this.player.update(dt);

    // portals
    const ptx = this.player.tileX(), pty = this.player.tileY();
    for (const p of this.map.portals) {
      if (ptx >= p.x && ptx < p.x + (p.w || 1) && pty >= p.y && pty < p.y + (p.h || 1)) {
        // hidden portals require their covering tile to be gone
        if (p.hidden) {
          const tid = this.tileAt(p.x, p.y);
          if (tid === T.CRACKED_WALL || tid === T.BUSH) continue;
          if (p.underBush) Story.set(`bushportal:${this.map.id}:${p.x},${p.y}`);
        }
        this.goThroughPortal(p);
        return;
      }
    }

    // boss triggers
    if (!this.boss) {
      for (const o of this.objects) {
        if (o.type === 'boss_trigger' && !Story.flag('boss:' + o.boss)) {
          const r = { x: o.x * 16, y: o.y * 16, w: o.w * 16, h: o.h * 16 };
          if (U.overlap(this.player.rect(), r)) {
            this.boss = spawnBoss(o.boss, r);
            this.bossIntroT = 0;
            this.state = 'bossintro';
            AudioSys.stop();
            return;
          }
        }
      }
    }

    // entities (stunned enemies stand frozen but can still be hit)
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.stunT > 0) {
        e.stunT -= dt;
        if (e.hurtT > 0) e.hurtT -= dt;
        if (Math.random() < 0.15) Particles.spawn(e.cx() + U.rand(-6, 6), e.y - 2, { vx: 0, vy: -10, g: 0, life: 0.3, color: '#a8e8f8', size: 1.5 });
        continue;
      }
      e.update(dt);
    }
    this.enemies = this.enemies.filter(e => !e.dead);
    for (const n of this.npcs) n.update(dt);
    if (this.boss && !this.boss.dead) this.boss.update(dt);
    if (this.boss && this.boss.dead) this.boss = null;
    for (const pr of this.projectiles) pr.update(dt);
    this.projectiles = this.projectiles.filter(p => !p.dead);
    if (this.boomerang) {
      this.boomerang.update(dt);
      if (this.boomerang.dead) this.boomerang = null;
    }
    for (const b of this.bombs) b.update(dt);
    this.bombs = this.bombs.filter(b => !b.dead);
    for (const pk of this.pickups) pk.update(dt);
    this.pickups = this.pickups.filter(p => !p.dead);

    Particles.update(dt);
    FloatText.update(dt);

    // ambient motes in dusk overworld
    if (this.map.id === 'overworld' && Math.random() < 0.08) {
      Particles.spawn(this.camX + U.rand(0, VIEW_W), this.camY + U.rand(0, VIEW_H), {
        vx: U.rand(-6, 6), vy: U.rand(-10, -3), g: 0, life: U.rand(1.5, 3),
        color: Story.flag('game_complete') ? '#f8e8a0' : '#b8a0e8', size: 1
      });
    }
    // falling snow in Frostpeak Hollow (west overworld)
    if (this.map.id === 'overworld' && this.player.cx() < 15 * 16 && this.player.cy() > 5 * 16 && this.player.cy() < 47 * 16 && Math.random() < 0.3) {
      Particles.spawn(this.camX + U.rand(0, VIEW_W), this.camY - 4, {
        vx: U.rand(-10, 4), vy: U.rand(16, 30), g: 0, life: U.rand(2, 3.5),
        color: U.pick(['#eef4fa', '#d8e4f0']), size: U.rand(1, 2)
      });
    }

    // regional music — the song follows you across the overworld
    this._musT = (this._musT || 0) - dt;
    if (this._musT <= 0) {
      this._musT = 0.5;
      if (this.map.id === 'overworld' && this.audioReady) AudioSys.play(this.overworldTrack());
    }

    // chimney smoke — every hearth on screen breathes
    this._smokeT = (this._smokeT || 0) - dt;
    if (this._smokeT <= 0) {
      this._smokeT = 0.12;
      const sx0 = Math.max(0, Math.floor(this.camX / 16) - 1), sy0 = Math.max(0, Math.floor(this.camY / 16) - 1);
      const sx1 = Math.min(this.map.w - 1, sx0 + 26), sy1 = Math.min(this.map.h - 1, sy0 + 17);
      for (let j = sy0; j <= sy1; j++) {
        for (let i = sx0; i <= sx1; i++) {
          if (this.map.tiles[j * this.map.w + i] === T.CHIMNEY && Math.random() < 0.35) {
            Particles.spawn(i * 16 + 8 + U.rand(-2, 2), j * 16 + 2, {
              vx: U.rand(2, 9), vy: U.rand(-14, -7), g: -8,
              life: U.rand(1.2, 2.2), color: U.pick(['#b0b0b8', '#9a9aa4', '#c4c4cc']), size: U.rand(1.5, 2.5)
            });
          }
        }
      }
    }

    this.updateCamera();
    if (this.shakeT > 0) this.shakeT -= dt;
  },

  goThroughPortal(p) {
    if (p.sfx) AudioSys.sfx(p.sfx);
    this.state = 'transition';
    this.transition = {
      t: 0, dur: 0.6, midDone: false,
      mid: () => this.loadMap(p.to, p.tx, p.ty)
    };
  },

  // Wake's ferry — sail (fade) to another dock on the same map
  ferryTo(tx, ty) {
    AudioSys.sfx('splash');
    this.state = 'transition';
    this.transition = {
      t: 0, dur: 1.0, midDone: false,
      mid: () => {
        this.player.x = tx * 16 + 2;
        this.player.y = ty * 16 + 3;
        this.player.lastSafe = { x: this.player.x, y: this.player.y };
        this.player.kbx = 0; this.player.kby = 0;
        this.updateCamera(true);
        AudioSys.sfx('splash');
      }
    };
  },

  shake(amt, dur) {
    if (!SaveSys.settings.screenShake) return;
    this.shakeAmt = amt;
    this.shakeT = Math.max(this.shakeT, dur);
  },

  updateCamera(snap = false) {
    const m = this.map;
    if (!m || !this.player) return;
    const mapW = m.w * 16, mapH = m.h * 16;
    let targetX, targetY;
    if (mapW <= VIEW_W) targetX = (mapW - VIEW_W) / 2;
    else targetX = U.clamp(this.player.cx() - VIEW_W / 2, 0, mapW - VIEW_W);
    if (mapH <= VIEW_H) targetY = (mapH - VIEW_H) / 2;
    else targetY = U.clamp(this.player.cy() - VIEW_H / 2, 0, mapH - VIEW_H);
    if (snap) { this.camX = targetX; this.camY = targetY; }
    else {
      this.camX = U.lerp(this.camX, targetX, 0.18);
      this.camY = U.lerp(this.camY, targetY, 0.18);
    }
  },

  // ---------------- rendering ----------------
  draw() {
    const ctx = this.ctx;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.imageSmoothingEnabled = false;

    switch (this.state) {
      case 'title': UI.drawTitle(ctx); return;
      case 'saveselect': UI.drawSaveSelect(ctx); return;
      case 'settings': UI.drawSettings(ctx); return;
      case 'gameover': UI.drawGameOver(ctx); return;
      case 'ending': UI.drawEnding(ctx); return;
      case 'editor': Editor.draw(ctx); return;
      case 'intro': this.drawIntro(ctx); return;
    }

    // ---- world states (play, pause, dialogue, inventory, map, bossintro, transition) ----
    this.drawWorld(ctx);

    switch (this.state) {
      case 'pause': UI.drawPause(ctx); break;
      case 'inventory': UI.drawInventory(ctx); break;
      case 'journal': UI.drawJournal(ctx); break;
      case 'map': UI.drawMapScreen(ctx); break;
      case 'bossintro':
        if (this.boss) UI.drawBossBanner(ctx, this.boss, this.bossIntroT);
        break;
      case 'transition': {
        const tr = this.transition;
        const k = tr.t < tr.dur / 2 ? tr.t / (tr.dur / 2) : 1 - (tr.t - tr.dur / 2) / (tr.dur / 2);
        ctx.fillStyle = `rgba(0,0,0,${U.clamp(k, 0, 1)})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        break;
      }
    }

    if (Dialogue.active) Dialogue.draw(ctx);
  },

  drawWorld(ctx) {
    const m = this.map;
    if (!m) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); return; }

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    let sx = 0, sy = 0;
    if (this.shakeT > 0) {
      sx = U.rand(-this.shakeAmt, this.shakeAmt);
      sy = U.rand(-this.shakeAmt, this.shakeAmt);
    }

    ctx.save();
    ctx.translate(-Math.round(this.camX + sx), -Math.round(this.camY + sy));

    // tiles
    const x0 = Math.max(0, Math.floor(this.camX / 16) - 1), y0 = Math.max(0, Math.floor(this.camY / 16) - 1);
    const x1 = Math.min(m.w - 1, x0 + Math.ceil(VIEW_W / 16) + 2), y1 = Math.min(m.h - 1, y0 + Math.ceil(VIEW_H / 16) + 2);
    for (let j = y0; j <= y1; j++)
      for (let i = x0; i <= x1; i++)
        Tiles.draw(ctx, m.tiles[j * m.w + i], i * 16, j * 16, i, j);

    // objects
    const animF = Math.floor(Tiles.animTime / 0.2);
    for (const o of this.objects) {
      const ox = o.x * 16, oy = o.y * 16;
      switch (o.type) {
        case 'chest': Sprites.draw(ctx, 'chest', o.opened ? 1 : 0, ox, oy + 4); break;
        case 'pot': if (!o.smashed) Sprites.draw(ctx, 'pot', 0, ox, oy + 4); break;
        case 'sign': Sprites.draw(ctx, 'sign', 0, ox, oy + 4); break;
        case 'torch': {
          Sprites.draw(ctx, 'torch', animF % 2, ox, oy + 3);
          // warm glow
          const g = ctx.createRadialGradient(ox + 8, oy + 6, 1, ox + 8, oy + 6, 18 + Math.sin(Tiles.animTime * 7 + o.x) * 2);
          g.addColorStop(0, 'rgba(255,170,60,0.28)');
          g.addColorStop(1, 'rgba(255,170,60,0)');
          ctx.fillStyle = g;
          ctx.fillRect(ox - 16, oy - 16, 48, 48);
          break;
        }
        case 'locked_door':
          if (!o.open) for (let i = 0; i < (o.w || 1); i++) Sprites.draw(ctx, 'door_locked', 0, ox + i * 16, oy);
          break;
        case 'boss_door':
          if (!o.open || (this.boss && !this.boss.dead)) for (let i = 0; i < (o.w || 1); i++) Sprites.draw(ctx, 'door_boss', 0, ox + i * 16, oy);
          break;
        case 'shard_gate':
        case 'crypt_gate':
        case 'tomb_gate':
          if (!o.open) for (let i = 0; i < (o.w || 1); i++) Sprites.draw(ctx, 'door_boss', 0, ox + i * 16, oy);
          break;
        case 'switch_crystal': Sprites.draw(ctx, 'switch_crystal', o.hit ? 1 : 0, ox, oy + 3); break;
        case 'beacon': {
          // the lighthouse flame — burns only once the keeper's beacon is lit
          if (!Story.flag('beacon_lit')) break;
          Sprites.draw(ctx, 'torch', animF % 2, ox, oy + 3);
          const bg = ctx.createRadialGradient(ox + 8, oy + 6, 2, ox + 8, oy + 6, 30 + Math.sin(Tiles.animTime * 5 + o.x) * 3);
          bg.addColorStop(0, 'rgba(255,200,80,0.35)');
          bg.addColorStop(1, 'rgba(255,200,80,0)');
          ctx.fillStyle = bg;
          ctx.fillRect(ox - 24, oy - 24, 64, 64);
          break;
        }
        case 'shopitem': {
          if (o.soldOut) break;
          const spr = { bombs: 'bomb_item', arrows: 'arrow_item', potion: 'potion', heart_container: 'heart_container', bomb_bag: 'bombbag' }[o.item];
          if (spr) Sprites.draw(ctx, spr, 0, ox, oy);
          ctx.font = '6px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#f8e080';
          ctx.fillText(o.price + 'r', ox + 8, oy + 20);
          ctx.textAlign = 'left';
          break;
        }
      }
    }

    // pickups, bombs
    for (const pk of this.pickups) pk.draw(ctx);
    for (const b of this.bombs) b.draw(ctx);

    // enemies, npcs, boss, player (rough y-sort: npcs/enemies then player)
    for (const e of this.enemies) if (!e.dead) e.draw(ctx);
    for (const n of this.npcs) n.draw(ctx);
    if (this.boss && !this.boss.dead) this.boss.draw(ctx);
    if (this.player) this.player.draw(ctx);

    // projectiles + fx
    for (const pr of this.projectiles) pr.draw(ctx);
    if (this.boomerang) this.boomerang.draw(ctx);
    Particles.draw(ctx);
    FloatText.draw(ctx);

    ctx.restore();

    // ---- ambient & lighting ----
    this.drawAmbient(ctx);

    UI.drawHUD(ctx);
  },

  drawAmbient(ctx) {
    const m = this.map;
    if (m.dark) {
      // darkness with light holes
      if (!this.darkCanvas) {
        this.darkCanvas = document.createElement('canvas');
        this.darkCanvas.width = VIEW_W;
        this.darkCanvas.height = VIEW_H;
      }
      const dc = this.darkCanvas.getContext('2d');
      dc.globalCompositeOperation = 'source-over';
      dc.clearRect(0, 0, VIEW_W, VIEW_H);
      dc.fillStyle = 'rgba(2,2,12,0.94)';
      dc.fillRect(0, 0, VIEW_W, VIEW_H);
      dc.globalCompositeOperation = 'destination-out';

      const hole = (wx, wy, r, strength = 1) => {
        const x = wx - this.camX, y = wy - this.camY;
        if (x < -r || y < -r || x > VIEW_W + r || y > VIEW_H + r) return;
        const g = dc.createRadialGradient(x, y, 1, x, y, r);
        g.addColorStop(0, `rgba(0,0,0,${strength})`);
        g.addColorStop(0.7, `rgba(0,0,0,${strength * 0.8})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        dc.fillStyle = g;
        dc.fillRect(x - r, y - r, r * 2, r * 2);
      };

      const p = this.data.player;
      const flick = Math.sin(Tiles.animTime * 9) * 3;
      let radius = p.hasLantern ? 85 : 34;
      if (Items.shardCount() >= 3) radius = 120;
      if (this.player) hole(this.player.cx(), this.player.cy(), radius + flick);
      for (const o of this.objects) {
        if (o.type === 'torch') hole(o.x * 16 + 8, o.y * 16 + 6, 34 + flick * 0.5);
      }
      for (const b of this.bombs) hole(b.cx(), b.cy(), 20);
      ctx.drawImage(this.darkCanvas, 0, 0);
    } else {
      // tint by ambient
      let tint = null;
      if (m.id === 'overworld') {
        tint = Story.flag('game_complete') ? 'rgba(255,214,120,0.08)' : 'rgba(66,44,110,0.16)';
      } else if (m.ambient === 'cave') tint = 'rgba(18,14,38,0.30)';
      else if (m.ambient === 'dungeon') tint = 'rgba(14,12,42,0.26)';
      else if (m.indoor) tint = 'rgba(255,190,110,0.06)';
      if (tint) {
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    }
  },

  drawIntro(ctx) {
    const it = this.intro;
    const W = VIEW_W, H = VIEW_H;
    ctx.fillStyle = '#06060f';
    ctx.fillRect(0, 0, W, H);
    // stars
    for (let i = 0; i < 40; i++) {
      const x = (U.hash2(i, 3) * W) | 0, y = (U.hash2(i, 9) * H) | 0;
      ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(it.t + i));
      ctx.fillStyle = '#c8d0f0';
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    const text = Story.INTRO_PAGES[it.page];
    const chars = Math.min(text.length, Math.floor(it.t * 38));
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e0d0';
    const lines = U.wrapText(ctx, text.slice(0, chars), 290);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 100 + i * 14));

    ctx.font = '7px monospace';
    ctx.fillStyle = '#585870';
    ctx.fillText(`${it.page + 1} / ${Story.INTRO_PAGES.length}   —   enter: next   esc: skip`, W / 2, 226);
    ctx.textAlign = 'left';
  }
};

window.addEventListener('load', () => Game.boot());
