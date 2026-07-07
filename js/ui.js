// ============================================================
// ui.js — title, menus, HUD, map screen, settings, credits
// ============================================================
'use strict';

const UI = {
  titleIdx: 0,
  titleT: 0,
  saveIdx: 0,
  saveMode: 'new', // 'new' | 'load' | 'save'
  pauseIdx: 0,
  invIdx: 0,
  setIdx: 0,
  goIdx: 0,
  fade: 0,          // screen fade 0..1
  fadeDir: 0,
  banner: null,     // {name, title, t}
  ending: null,     // {phase, page, t, chars}

  // ---------------- TITLE ----------------
  titleOptions() {
    const opts = [];
    if (SaveSys.info(1) || SaveSys.info(2) || SaveSys.info(3)) opts.push('CONTINUE');
    opts.push('NEW GAME');
    opts.push('SETTINGS');
    opts.push('MAP EDITOR');
    return opts;
  },

  updateTitle(dt) {
    this.titleT += dt;
    const opts = this.titleOptions();
    if (Input.menuUp()) { this.titleIdx = (this.titleIdx + opts.length - 1) % opts.length; AudioSys.sfx('menu'); }
    if (Input.menuDown()) { this.titleIdx = (this.titleIdx + 1) % opts.length; AudioSys.sfx('menu'); }
    if (Input.confirm()) {
      AudioSys.sfx('select');
      const sel = opts[this.titleIdx];
      if (sel === 'CONTINUE') { this.saveMode = 'load'; this.saveIdx = 0; Game.state = 'saveselect'; }
      else if (sel === 'NEW GAME') { this.saveMode = 'new'; this.saveIdx = 0; Game.state = 'saveselect'; }
      else if (sel === 'SETTINGS') { this.setIdx = 0; this.settingsReturn = 'title'; Game.state = 'settings'; }
      else if (sel === 'MAP EDITOR') { Editor.open(); }
    }
  },

  drawTitle(ctx) {
    const W = 384, H = 240;
    // night sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0c0a20');
    g.addColorStop(0.55, '#2a1a4a');
    g.addColorStop(0.8, '#6a3a68');
    g.addColorStop(1, '#c8703a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // stars
    for (let i = 0; i < 60; i++) {
      const x = (U.hash2(i, 7) * W) | 0, y = (U.hash2(i, 13) * H * 0.6) | 0;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(this.titleT * 1.5 + i));
      ctx.globalAlpha = tw;
      ctx.fillStyle = i % 5 === 0 ? '#f8e8c0' : '#c8d0f0';
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // distant mountains silhouette
    ctx.fillStyle = '#1a1030';
    ctx.beginPath();
    ctx.moveTo(0, 190);
    for (let x = 0; x <= W; x += 16) {
      ctx.lineTo(x, 165 + Math.sin(x * 0.05) * 14 + U.hash2(x, 3) * 12);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.fill();
    // ground
    ctx.fillStyle = '#140c24';
    ctx.fillRect(0, 205, W, 35);

    // glowing sunstone (triforce-like triangle trio)
    const cx = W / 2, cy = 66;
    const glow = 0.5 + 0.3 * Math.sin(this.titleT * 2);
    ctx.globalAlpha = glow * 0.5;
    const rg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 44);
    rg.addColorStop(0, '#f8e080');
    rg.addColorStop(1, 'rgba(248,224,128,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(cx - 46, cy - 46, 92, 92);
    ctx.globalAlpha = 1;
    const tri = (x, y, s, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x, y - s); ctx.lineTo(x + s, y + s); ctx.lineTo(x - s, y + s);
      ctx.fill();
    };
    tri(cx, cy - 9, 8, '#f8d030');
    tri(cx - 9, cy + 9, 8, '#f8d030');
    tri(cx + 9, cy + 9, 8, '#f8d030');
    ctx.strokeStyle = '#a87818';
    ctx.lineWidth = 0.6;

    // title text
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#c8a860';
    ctx.fillText('T H E   L E G E N D   O F', cx, 104);
    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = '#181020';
    ctx.fillText('ZELDA II', cx + 2, 134);
    const tg = ctx.createLinearGradient(0, 112, 0, 136);
    tg.addColorStop(0, '#f8e8a0');
    tg.addColorStop(0.5, '#e8b040');
    tg.addColorStop(1, '#a86818');
    ctx.fillStyle = tg;
    ctx.fillText('ZELDA II', cx, 132);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#e8d8f0';
    ctx.fillText('~ SHARDS OF TWILIGHT ~', cx, 148);

    // menu
    const opts = this.titleOptions();
    ctx.font = 'bold 9px monospace';
    opts.forEach((o, i) => {
      const y = 172 + i * 13;
      const sel = i === this.titleIdx;
      ctx.fillStyle = sel ? '#f8e080' : '#9088a8';
      ctx.fillText(o, cx, y);
      if (sel && Math.floor(this.titleT * 3) % 2) {
        ctx.fillText('>', cx - ctx.measureText(o).width / 2 - 10, y);
        ctx.fillText('<', cx + ctx.measureText(o).width / 2 + 10, y);
      }
    });

    ctx.font = '7px monospace';
    ctx.fillStyle = '#605878';
    ctx.fillText('a fan-made homage  •  arrows/WASD move  •  enter select', cx, 233);
    ctx.textAlign = 'left';
  },

  // ---------------- SAVE SELECT ----------------
  updateSaveSelect(dt) {
    if (Input.menuUp()) { this.saveIdx = (this.saveIdx + 3) % 4; AudioSys.sfx('menu'); }
    if (Input.menuDown()) { this.saveIdx = (this.saveIdx + 1) % 4; AudioSys.sfx('menu'); }
    if (Input.cancel()) { Game.state = this.saveMode === 'save' ? 'pause' : 'title'; AudioSys.sfx('menu'); return; }
    if (Input.confirm()) {
      if (this.saveIdx === 3) { // back
        Game.state = this.saveMode === 'save' ? 'pause' : 'title';
        AudioSys.sfx('menu');
        return;
      }
      const slot = this.saveIdx + 1;
      const info = SaveSys.info(slot);
      AudioSys.sfx('select');
      if (this.saveMode === 'load') {
        if (info) Game.loadGame(slot);
        else AudioSys.sfx('error');
      } else if (this.saveMode === 'new') {
        Game.newGame(slot); // overwrites slot on first save
      } else if (this.saveMode === 'save') {
        SaveSys.save(slot);
        AudioSys.sfx('secret');
        FloatText.add(Game.player.cx(), Game.player.y - 8, 'Game saved!', '#80f890');
        Game.state = 'play';
      }
    }
  },

  drawSaveSelect(ctx) {
    const W = 384, H = 240;
    ctx.fillStyle = '#0e0c1e';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#e8c860';
    const titles = { new: 'NEW  QUEST', load: 'CONTINUE  QUEST', save: 'SAVE  QUEST' };
    ctx.fillText(titles[this.saveMode], W / 2, 30);

    for (let i = 0; i < 3; i++) {
      const slot = i + 1;
      const info = SaveSys.info(slot);
      const y = 52 + i * 44;
      const sel = this.saveIdx === i;
      ctx.fillStyle = sel ? 'rgba(90,80,40,0.55)' : 'rgba(40,40,70,0.5)';
      ctx.fillRect(60, y, 264, 36);
      ctx.strokeStyle = sel ? '#f8e080' : '#484868';
      ctx.strokeRect(60.5, y + 0.5, 263, 35);

      ctx.textAlign = 'left';
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = sel ? '#f8e080' : '#a8a8c0';
      ctx.fillText('SLOT ' + slot, 70, y + 14);
      ctx.font = '8px monospace';
      if (info) {
        ctx.fillStyle = '#d0d0e0';
        const hrs = Math.floor(info.playTime / 3600), mins = Math.floor((info.playTime % 3600) / 60);
        ctx.fillText(`${'♥'.repeat(Math.min(10, info.hearts))}  ${info.rupees}r  shards:${info.shards}/3${info.complete ? '  ★CLEAR' : ''}`, 70, y + 26);
        ctx.fillStyle = '#8888a0';
        ctx.textAlign = 'right';
        ctx.fillText(`${hrs}h${String(mins).padStart(2, '0')}m`, 316, y + 14);
        ctx.textAlign = 'left';
        if (this.saveMode === 'new') {
          ctx.fillStyle = '#e08080';
          ctx.textAlign = 'right';
          ctx.fillText('(will overwrite!)', 316, y + 26);
          ctx.textAlign = 'left';
        }
      } else {
        ctx.fillStyle = '#606078';
        ctx.fillText('— empty —', 70, y + 26);
      }
      ctx.textAlign = 'center';
    }

    const backSel = this.saveIdx === 3;
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = backSel ? '#f8e080' : '#9088a8';
    ctx.fillText(backSel ? '> BACK <' : 'BACK', W / 2, 204);
    ctx.font = '7px monospace';
    ctx.fillStyle = '#605878';
    ctx.fillText('enter: choose   esc: back', W / 2, 228);
    ctx.textAlign = 'left';
  },

  // ---------------- HUD ----------------
  drawHUD(ctx) {
    const p = Game.data.player;
    // hearts
    for (let i = 0; i < p.maxHearts; i++) {
      const x = 8 + (i % 8) * 9, y = 7 + Math.floor(i / 8) * 9;
      const fill = U.clamp(p.hearts - i, 0, 1);
      this.drawHeart(ctx, x, y, fill);
    }
    // counters (right side)
    ctx.font = 'bold 8px monospace';
    let cx = 384 - 8;
    const counter = (spriteName, val, dim) => {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#000a';
      ctx.fillText(val, cx + 1, 16);
      ctx.fillStyle = dim ? '#707088' : '#f0f0e8';
      ctx.fillText(val, cx, 15);
      const w = ctx.measureText(val).width;
      const cv = Sprites.get(spriteName, 0);
      if (cv) ctx.drawImage(cv, cx - w - 13, 3, 12, 12);
      cx -= w + 22;
    };
    counter('rupee', String(p.rupees));
    if (p.hasBombs) counter('bomb_item', String(p.bombs), p.bombs === 0);
    if (p.hasBow) counter('arrow_item', String(p.arrows), p.arrows === 0);
    const keys = p.keys[Game.map.id] || 0;
    if (keys > 0) counter('key', String(keys));
    ctx.textAlign = 'left';

    // shards indicator
    const sh = p.shards;
    let sx = 8, sy = 26;
    [['shard_green', sh.emerald], ['shard_red', sh.ruby], ['shard', sh.sapphire]].forEach(([spr, has]) => {
      if (has) {
        const cv = Sprites.get(spr, 0);
        ctx.globalAlpha = 0.9;
        if (cv) ctx.drawImage(cv, sx, sy, 10, 10);
        ctx.globalAlpha = 1;
        sx += 10;
      }
    });

    // minimap (dungeons hide it until you find their map)
    const isDungeon = Game.map.id.startsWith('dungeon') || Game.map.id === 'keep';
    const minimapAllowed = !isDungeon || p.dmaps[Game.map.id];
    if (SaveSys.settings.showMinimap && !Game.map.indoor && minimapAllowed && Game.state === 'play') this.drawMinimap(ctx);

    // boss bar
    if (Game.boss && !Game.boss.dead && Game.state !== 'bossintro') {
      const b = Game.boss;
      const bw = 200, bx = (384 - bw) / 2, by = 224;
      ctx.fillStyle = '#000c';
      ctx.fillRect(bx - 2, by - 2, bw + 4, 10);
      ctx.fillStyle = '#401018';
      ctx.fillRect(bx, by, bw, 6);
      const k = b.hp / b.maxHp;
      const grad = ctx.createLinearGradient(bx, 0, bx + bw * k, 0);
      grad.addColorStop(0, '#c82838');
      grad.addColorStop(1, '#f86048');
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, bw * k, 6);
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f0d0d0';
      ctx.fillText(b.name, 192, by - 4);
      ctx.textAlign = 'left';
    }
  },

  drawHeart(ctx, x, y, fill) {
    // 8px heart: outline + fill portion
    const draw = (col) => {
      ctx.fillStyle = col;
      ctx.fillRect(x + 1, y, 2, 1); ctx.fillRect(x + 5, y, 2, 1);
      ctx.fillRect(x, y + 1, 8, 2);
      ctx.fillRect(x + 1, y + 3, 6, 1);
      ctx.fillRect(x + 2, y + 4, 4, 1);
      ctx.fillRect(x + 3, y + 5, 2, 1);
    };
    draw('#301018');
    if (fill >= 1) draw('#e83048');
    else if (fill >= 0.5) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, 4, 7);
      ctx.clip();
      draw('#e83048');
      ctx.restore();
    }
  },

  drawMinimap(ctx) {
    const map = Game.map;
    const mw = 56, mh = 42;
    const mx = 384 - mw - 6, my = 24;
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = '#101018';
    ctx.fillRect(mx - 1, my - 1, mw + 2, mh + 2);
    // downsample tiles
    const stepX = map.w / mw, stepY = map.h / mh;
    for (let j = 0; j < mh; j++) {
      for (let i = 0; i < mw; i++) {
        const tid = Game.tileAt(Math.floor(i * stepX), Math.floor(j * stepY));
        const d = Tiles.def(tid);
        if (d) {
          ctx.fillStyle = d.minimap;
          ctx.fillRect(mx + i, my + j, 1, 1);
        }
      }
    }
    // player blip
    const px = mx + (Game.player.cx() / (map.w * 16)) * mw;
    const py = my + (Game.player.cy() / (map.h * 16)) * mh;
    if (Math.floor(performance.now() / 300) % 2) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(px - 1, py - 1, 3, 3);
    }
    ctx.globalAlpha = 1;
  },

  // ---------------- BOSS BANNER ----------------
  drawBossBanner(ctx, boss, t) {
    const W = 384;
    const k = U.clamp(t / 0.5, 0, 1); // slide in
    ctx.fillStyle = `rgba(10,4,8,${0.55 * k})`;
    ctx.fillRect(0, 92, W, 56);
    ctx.fillStyle = '#c82838';
    ctx.fillRect(0, 92, W * k, 2);
    ctx.fillRect(W * (1 - k), 146, W * k, 2);
    ctx.textAlign = 'center';
    ctx.globalAlpha = k;
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#f8e8e8';
    ctx.fillText(boss.name, W / 2, 118);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#c88898';
    ctx.fillText('~ ' + boss.title + ' ~', W / 2, 136);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  },

  // ---------------- PAUSE ----------------
  PAUSE_OPTS: ['RESUME', 'QUESTS', 'SAVE GAME', 'SETTINGS', 'QUIT TO TITLE'],

  updatePause(dt) {
    if (Input.pause() || Input.cancel()) { Game.state = 'play'; AudioSys.sfx('menu'); return; }
    const n = this.PAUSE_OPTS.length;
    if (Input.menuUp()) { this.pauseIdx = (this.pauseIdx + n - 1) % n; AudioSys.sfx('menu'); }
    if (Input.menuDown()) { this.pauseIdx = (this.pauseIdx + 1) % n; AudioSys.sfx('menu'); }
    if (Input.confirm()) {
      AudioSys.sfx('select');
      switch (this.pauseIdx) {
        case 0: Game.state = 'play'; break;
        case 1: Game.state = 'journal'; break;
        case 2:
          this.saveMode = 'save';
          this.saveIdx = (Game.data.slot || 1) - 1;
          Game.state = 'saveselect';
          break;
        case 3: this.setIdx = 0; this.settingsReturn = 'pause'; Game.state = 'settings'; break;
        case 4: Game.toTitle(); break;
      }
    }
  },

  drawPause(ctx) {
    ctx.fillStyle = 'rgba(6,6,18,0.78)';
    ctx.fillRect(0, 0, 384, 240);
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#e8c860';
    ctx.fillText('PAUSED', 192, 66);
    ctx.font = 'bold 9px monospace';
    this.PAUSE_OPTS.forEach((o, i) => {
      const sel = i === this.pauseIdx;
      ctx.fillStyle = sel ? '#f8e080' : '#9088a8';
      ctx.fillText((sel ? '> ' : '') + o + (sel ? ' <' : ''), 192, 100 + i * 16);
    });
    ctx.font = '7px monospace';
    ctx.fillStyle = '#605878';
    ctx.fillText('tab: inventory   m: map   j: quests', 192, 196);
    ctx.textAlign = 'left';
  },

  // ---------------- QUEST JOURNAL (+ bestiary tab) ----------------
  journalTab: 0, // 0 = quests, 1 = bestiary

  updateJournal(dt) {
    if (Input.menuLeft() || Input.menuRight()) {
      this.journalTab = 1 - this.journalTab;
      AudioSys.sfx('menu');
      return;
    }
    if (Input.journal() || Input.cancel() || Input.confirm() || Input.pause()) {
      Game.state = 'play';
      AudioSys.sfx('menu');
    }
  },

  ENEMY_NAMES: {
    octorok: 'Octorok', moblin: 'Moblin', keese: 'Keese', stalfos: 'Stalfos',
    chu: 'Chu', leever: 'Leever', wizzrobe: 'Wizzrobe', darknut: 'Darknut',
    peahat: 'Peahat', zora: 'Zora', armos: 'Armos', poe: 'Poe',
    wolfos: 'Wolfos', freezard: 'Freezard', blade_trap: 'Blade Trap',
    gibdo: 'Gibdo', vulture: 'Vulture', sandwurm: 'Sandwurm',
    direwolf: 'Direwolf Alpha', dunetyrant: 'Dune Tyrant', ogre: 'Highland Ogre'
  },

  drawJournal(ctx) {
    ctx.fillStyle = 'rgba(8,8,22,0.92)';
    ctx.fillRect(0, 0, 384, 240);
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = this.journalTab === 0 ? '#e8c860' : '#706848';
    ctx.fillText('QUESTS', 150, 22);
    ctx.fillStyle = this.journalTab === 1 ? '#e8c860' : '#706848';
    ctx.fillText('BESTIARY', 236, 22);
    ctx.textAlign = 'left';

    if (this.journalTab === 0) this.drawQuestList(ctx);
    else this.drawBestiary(ctx);

    ctx.textAlign = 'center';
    ctx.font = '7px monospace';
    ctx.fillStyle = '#605878';
    ctx.fillText('left/right: tab   j/esc: close', 192, 232);
    ctx.textAlign = 'left';
  },

  drawQuestList(ctx) {
    const quests = Story.quests();
    let y = 38;
    for (const q of quests) {
      if (y > 218) break;
      const done = q.status === 'done';
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = done ? '#78b878' : '#f0e0a0';
      ctx.fillText((done ? '✓ ' : '• ') + q.title, 28, y);
      ctx.font = '7px monospace';
      ctx.fillStyle = done ? '#5a7a5a' : '#a8a8c0';
      const lines = U.wrapText(ctx, q.hint, 320);
      ctx.fillText(lines[0] || '', 40, y + 9);
      if (lines[1]) { ctx.fillText(lines[1], 40, y + 17); y += 8; }
      y += 19;
    }
  },

  drawBestiary(ctx) {
    const kills = Game.data.kills || {};
    const keys = Object.keys(this.ENEMY_NAMES);
    const total = keys.reduce((s, k) => s + (kills[k] || 0), 0);
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8a8c0';
    ctx.fillText(`${total} foes felled`, 192, 36);
    ctx.textAlign = 'left';
    const cols = 2, colW = 170, x0 = 26, y0 = 50, rowH = 17;
    keys.forEach((k, i) => {
      const x = x0 + (i % cols) * colW, y = y0 + Math.floor(i / cols) * rowH;
      const n = kills[k] || 0;
      const seen = n > 0;
      const cv = seen ? Sprites.get(k, 0) : null;
      if (cv) ctx.drawImage(cv, x, y - 9, 12, 12);
      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = seen ? '#e8e0d0' : '#484858';
      ctx.fillText(seen ? this.ENEMY_NAMES[k] : '?????', x + 16, y);
      if (seen) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#c8a860';
        ctx.fillText('x' + n, x + colW - 24, y);
        ctx.textAlign = 'left';
      }
    });
  },

  // ---------------- FISHING (Odon's rod, Lake Hylia) ----------------
  updateFishing(dt) {
    const f = Game.fishing;
    if (!f) { Game.state = 'play'; return; }
    f.t += dt;
    if (Input.cancel()) { Game.state = 'play'; AudioSys.sfx('menu'); return; }

    switch (f.phase) {
      case 'cast':
        if (f.t > 0.6) {
          f.phase = 'wait';
          f.t = 0;
          f.waitFor = U.rand(1.2, 3.5);
          AudioSys.sfx('splash');
        }
        break;
      case 'wait':
        if (Input.confirm()) { f.phase = 'early'; f.t = 0; break; } // jumped the gun
        if (f.t >= f.waitFor) {
          f.phase = 'bite';
          f.t = 0;
          AudioSys.sfx('switch');
        }
        break;
      case 'bite':
        if (Input.confirm()) {
          f.phase = 'caught';
          f.t = 0;
          const p = Game.data.player;
          const r = Math.random();
          if (!Story.flag('golden_fish') && r < 0.04) {
            Story.set('golden_fish');
            f.msg = 'THE GOLDEN CARP!! Odon goes pale. "Grandfather chased that fish his whole life." (+100 rupees)';
            p.rupees = Math.min(999, p.rupees + 100);
            AudioSys.sfx('item');
          } else if (r < 0.3) { f.msg = 'A minnow. It looks personally offended. (+5 rupees)'; p.rupees = Math.min(999, p.rupees + 5); AudioSys.sfx('rupee'); }
          else if (r < 0.62) { f.msg = 'A decent perch! Odon nods approvingly. (+10 rupees)'; p.rupees = Math.min(999, p.rupees + 10); AudioSys.sfx('rupee'); }
          else if (r < 0.87) { f.msg = 'A fat lake bass! (+20 rupees)'; p.rupees = Math.min(999, p.rupees + 20); AudioSys.sfx('rupee'); }
          else { f.msg = 'A LUNKER! Odon whistles low. (+40 rupees)'; p.rupees = Math.min(999, p.rupees + 40); AudioSys.sfx('chest'); }
        } else if (f.t > 0.55) {
          f.phase = 'missed';
          f.t = 0;
        }
        break;
      case 'early':
      case 'missed':
      case 'caught':
        if (f.t > 0.8 && Input.confirm()) {
          f.phase = 'cast';
          f.t = 0;
          f.msg = '';
        }
        break;
    }
  },

  drawFishing(ctx) {
    const f = Game.fishing;
    if (!f) return;
    // dusk water
    const g = ctx.createLinearGradient(0, 0, 0, 240);
    g.addColorStop(0, '#1a2a4a');
    g.addColorStop(0.45, '#2a4a7a');
    g.addColorStop(1, '#173a68');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 384, 240);
    // ripple lines
    for (let i = 0; i < 14; i++) {
      const y = 60 + i * 13 + Math.sin(f.t * 1.5 + i) * 2;
      ctx.globalAlpha = 0.12 + 0.05 * Math.sin(f.t + i * 2);
      ctx.fillStyle = '#a8d0f0';
      ctx.fillRect(20 + (i * 37) % 200, y, 60 + (i * 23) % 80, 1);
    }
    ctx.globalAlpha = 1;
    // line + bobber
    const bobY = 120 + Math.sin(f.t * 2.2) * 3 + (f.phase === 'bite' ? Math.sin(f.t * 40) * 4 : 0);
    ctx.strokeStyle = '#d8d8e0';
    ctx.beginPath(); ctx.moveTo(310, 30); ctx.lineTo(192, bobY - 4); ctx.stroke();
    ctx.fillStyle = '#e84848';
    ctx.beginPath(); ctx.arc(192, bobY, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath(); ctx.arc(192, bobY - 3, 2.5, 0, 7); ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#e8c860';
    ctx.fillText('~ LAKE HYLIA ~', 192, 24);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#e8e0d0';
    if (f.phase === 'cast') ctx.fillText('You cast the line...', 192, 200);
    else if (f.phase === 'wait') ctx.fillText('...waiting...', 192, 200);
    else if (f.phase === 'bite') {
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#f8e060';
      ctx.fillText('! ! !   HOOK IT   ! ! !', 192, 200);
    } else if (f.phase === 'early') ctx.fillText('Too eager. The fish laugh quietly.', 192, 200);
    else if (f.phase === 'missed') ctx.fillText('It spat the hook. Odon pretends not to see.', 192, 200);
    else if (f.phase === 'caught') {
      const lines = U.wrapText(ctx, f.msg, 320);
      lines.forEach((l, i) => ctx.fillText(l, 192, 196 + i * 11));
    }
    ctx.font = '7px monospace';
    ctx.fillStyle = '#8898b8';
    ctx.fillText(f.phase === 'bite' ? 'enter/space: hook!' : 'enter/space: cast again   esc: done', 192, 228);
    ctx.textAlign = 'left';
  },

  // ---------------- INVENTORY ----------------
  updateInventory(dt) {
    if (Input.inventory() || Input.cancel()) { Game.state = 'play'; AudioSys.sfx('menu'); return; }
    const items = this.invItems();
    if (items.length) {
      if (Input.menuLeft()) { this.invIdx = (this.invIdx + items.length - 1) % items.length; AudioSys.sfx('menu'); }
      if (Input.menuRight()) { this.invIdx = (this.invIdx + 1) % items.length; AudioSys.sfx('menu'); }
      if (Input.confirm()) {
        const it = items[this.invIdx];
        if (it.use) it.use();
      }
    }
  },

  invItems() {
    const p = Game.data.player;
    const list = [];
    if (p.hasSword) list.push({ spr: p.hasMasterSword ? 'sword_master' : 'sword', name: p.hasMasterSword ? 'Master Sword' : 'Hero\'s Sword', desc: 'SPACE to swing. Hold and release for a spin attack.' });
    if (p.hasBow) list.push({ spr: 'bow', name: 'Hero\'s Bow', desc: `X to shoot. ${p.arrows}/${p.maxArrows} arrows.` });
    if (p.hasBombs) list.push({ spr: 'bomb_item', name: 'Bombs', desc: `C to place. ${p.bombs}/${p.maxBombs} bombs. Opens cracked walls.` });
    if (p.hasBoomerang) list.push({ spr: 'boomerang', name: 'Boomerang', desc: 'R to throw. Stuns foes, rings crystals, fetches trinkets.' });
    if (p.hasFireRod) list.push({ spr: 'fire_rod', name: 'Fire Rod', desc: 'F to cast flame. Burns bushes afar; the dead dread it.' });
    if (p.hasFlippers) list.push({ spr: 'flippers', name: 'Zora Flippers', desc: p.hasPearl ? 'Swim across open water.' : 'Swim across open water. Deep water is still off-limits.' });
    if (p.hasPearl) list.push({ spr: 'pearl', name: 'Pearl of the Deep', desc: 'The open ocean is yours — deep water no longer bars you.' });
    if (p.hasLantern) list.push({ spr: 'lantern', name: 'Lantern', desc: 'Lights dark places automatically.' });
    if (p.hasShield) list.push({ spr: 'shield_item', name: 'Knight\'s Shield', desc: 'Halves all damage taken.' });
    if (p.hasTideplate) list.push({ spr: 'tideplate', name: 'Tideplate', desc: 'Armor of the drowned choir. Halves damage again.' });
    if (p.potions > 0) list.push({
      spr: 'potion', name: `Red Potion x${p.potions}`, desc: 'ENTER to drink: restores all hearts.',
      use: () => {
        if (p.hearts < p.maxHearts) {
          p.potions--; p.hearts = p.maxHearts;
          AudioSys.sfx('heal');
          Game.state = 'play';
        } else AudioSys.sfx('error');
      }
    });
    if (p.letter) list.push({ spr: 'map_item', name: 'Sealed Letter', desc: 'For Finn at the Drowsy Cucco Inn in Bramblewick.' });
    if (p.soup) list.push({ spr: 'soup', name: 'Hot Soup', desc: 'For Hermit Yeta in Frostpeak Hollow. Still warm!' });
    if (p.lure) list.push({ spr: 'lure', name: 'Lucky Lure', desc: 'Odon\'s pride and joy. It is, in fact, smiling.' });
    if (p.hasCharm) list.push({ spr: 'hero_charm', name: 'Hero\'s Charm', desc: 'At full hearts, your sword looses a blade of light.' });
    if (p.tradeItem) {
      const info = Items.INFO[p.tradeItem];
      if (info) list.push({ spr: info.sprite, name: info.name, desc: 'The Great Trade — someone out there needs this. (Check your quests: J)' });
    }
    return list;
  },

  drawInventory(ctx) {
    ctx.fillStyle = 'rgba(8,8,22,0.88)';
    ctx.fillRect(0, 0, 384, 240);
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#e8c860';
    ctx.fillText('INVENTORY', 192, 26);

    const p = Game.data.player;
    const items = this.invItems();
    this.invIdx = Math.min(this.invIdx, Math.max(0, items.length - 1));

    // item grid
    const cols = 6, cell = 34;
    const gx = 192 - (cols * cell) / 2, gy = 44;
    items.forEach((it, i) => {
      const x = gx + (i % cols) * cell, y = gy + Math.floor(i / cols) * cell;
      const sel = i === this.invIdx;
      ctx.fillStyle = sel ? 'rgba(120,100,40,0.6)' : 'rgba(40,40,70,0.6)';
      ctx.fillRect(x, y, cell - 4, cell - 4);
      ctx.strokeStyle = sel ? '#f8e080' : '#484868';
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 5, cell - 5);
      const cv = Sprites.get(it.spr, 0);
      if (cv) ctx.drawImage(cv, x + (cell - 4 - 24) / 2, y + (cell - 4 - 24) / 2, 24, 24);
    });
    if (!items.length) {
      ctx.font = '8px monospace';
      ctx.fillStyle = '#707088';
      ctx.fillText('Your pack is empty. Visit the village elder!', 192, 70);
    }

    // selected desc
    if (items[this.invIdx]) {
      const it = items[this.invIdx];
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#f0f0e8';
      ctx.fillText(it.name, 192, 132);
      ctx.font = '8px monospace';
      ctx.fillStyle = '#a8a8c0';
      ctx.fillText(it.desc, 192, 145);
    }

    // shards + quest status
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#e8c860';
    ctx.fillText('SUNSTONE SHARDS', 192, 170);
    const shardDefs = [['shard_green', p.shards.emerald], ['shard_red', p.shards.ruby], ['shard', p.shards.sapphire]];
    shardDefs.forEach(([spr, has], i) => {
      const x = 192 - 42 + i * 30;
      ctx.globalAlpha = has ? 1 : 0.18;
      const cv = Sprites.get(spr, 0);
      if (cv) ctx.drawImage(cv, x, 178, 24, 24);
      ctx.globalAlpha = 1;
    });

    ctx.font = '7px monospace';
    ctx.fillStyle = '#605878';
    ctx.fillText('arrows: select   enter: use   tab/esc: close', 192, 228);
    ctx.textAlign = 'left';
  },

  // ---------------- MAP SCREEN ----------------
  LOCATIONS: [
    { key: 'elden', name: 'Elden Village', x: 16, y: 57 },
    { key: 'bramblewick', name: 'Bramblewick Town', x: 48, y: 18 },
    { key: 'ranch', name: 'Meadowbrook Ranch', x: 24, y: 32 },
    { key: 'lake', name: 'Lake Hylia', x: 47, y: 45 },
    { key: 'frostpeak', name: 'Frostpeak Hollow', x: 8, y: 34 },
    { key: 'glacier', name: 'Glacier Hollow', x: 7, y: 26 },
    { key: 'temple', name: 'Verdant Temple', x: 85, y: 36 },
    { key: 'cindertop', name: 'Mt. Cindertop', x: 77, y: 11 },
    { key: 'crypt', name: 'Sunken Crypt', x: 46, y: 64 },
    { key: 'keep', name: 'Shadow Keep', x: 16, y: 12 },
    { key: 'dunes', name: 'Sunspear Dunes', x: 67, y: 63 },
    { key: 'tomb', name: 'Sandsear Tomb', x: 86, y: 63 },
    { key: 'saltmere', name: 'Saltmere Strand', x: 32, y: 75 },
    { key: 'lighthouse', name: 'Saltmere Light', x: 61, y: 76 },
    { key: 'gladehollow', name: 'Gladehollow', x: 113, y: 34 },
    { key: 'waystation', name: 'Rosa\'s Waystation', x: 121, y: 16 },
    { key: 'stones', name: 'The Standing Stones', x: 151, y: 8 },
    { key: 'windfall', name: 'Windfall Village', x: 45, y: 119 },
    { key: 'emberisle', name: 'Ember Isle', x: 135, y: 133 },
    { key: 'cathedral', name: 'The Drowned Cathedral', x: 100, y: 150 }
  ],

  updateMapScreen(dt) {
    if (Input.mapKey() || Input.cancel() || Input.confirm()) { Game.state = 'play'; AudioSys.sfx('menu'); }
  },

  drawMapScreen(ctx) {
    ctx.fillStyle = 'rgba(8,8,20,0.94)';
    ctx.fillRect(0, 0, 384, 240);
    const map = Game.map;
    const p = Game.data.player;
    const isDungeon = map.id.startsWith('dungeon') || map.id === 'keep';
    const hasMap = !isDungeon || p.dmaps[map.id];

    ctx.textAlign = 'center';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#e8c860';
    ctx.fillText(map.name.toUpperCase(), 192, 22);

    if (!hasMap) {
      ctx.font = '8px monospace';
      ctx.fillStyle = '#8888a0';
      ctx.fillText('You have not found the map of this place...', 192, 120);
      ctx.font = '7px monospace';
      ctx.fillStyle = '#605878';
      ctx.fillText('m/esc: close', 192, 228);
      ctx.textAlign = 'left';
      return;
    }

    // fit map into 320x180
    const availW = 320, availH = 180;
    const scale = Math.min(availW / map.w, availH / map.h);
    const mw = map.w * scale, mh = map.h * scale;
    const mx = 192 - mw / 2, my = 32 + (availH - mh) / 2;
    ctx.fillStyle = '#06060f';
    ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
    for (let j = 0; j < map.h; j++) {
      for (let i = 0; i < map.w; i++) {
        const d = Tiles.def(Game.tileAt(i, j));
        if (d) {
          ctx.fillStyle = d.minimap;
          ctx.fillRect(mx + i * scale, my + j * scale, Math.ceil(scale), Math.ceil(scale));
        }
      }
    }
    // compass marks: boss + chests
    if (isDungeon && p.dcompass[map.id]) {
      for (const o of Game.objects) {
        if (o.type === 'chest' && !o.opened) {
          ctx.fillStyle = '#f8e060';
          ctx.fillRect(mx + o.x * scale - 1, my + o.y * scale - 1, 3, 3);
        }
        if (o.type === 'boss_trigger' && !Story.flag('boss:' + o.boss)) {
          if (Math.floor(performance.now() / 400) % 2) {
            ctx.fillStyle = '#f83048';
            ctx.fillRect(mx + (o.x + o.w / 2) * scale - 2, my + (o.y + o.h / 2) * scale - 2, 4, 4);
          }
        }
      }
    }
    // discovered places + awakened waystones (overworld chart only)
    if (map.id === 'overworld') {
      let nearest = null, nearestD = 1e9;
      const ptx = Game.player.tileX(), pty = Game.player.tileY();
      for (const L of this.LOCATIONS) {
        if (!Story.flag('seen:' + L.key)) continue;
        ctx.fillStyle = '#f8d030';
        ctx.fillRect(mx + L.x * scale - 1, my + L.y * scale - 1, 3, 3);
        const d = Math.abs(L.x - ptx) + Math.abs(L.y - pty);
        if (d < nearestD) { nearestD = d; nearest = L; }
      }
      for (const o of Game.objects) {
        if (o.type === 'waystone' && o.active) {
          ctx.fillStyle = '#68d8f0';
          ctx.fillRect(mx + o.x * scale - 1, my + o.y * scale - 1, 3, 3);
        }
      }
      if (nearest) {
        ctx.font = '7px monospace';
        ctx.fillStyle = '#e8d8a0';
        ctx.fillText('near: ' + nearest.name, 192, 220);
      }
    }
    // player
    if (Math.floor(performance.now() / 300) % 2) {
      ctx.fillStyle = '#fff';
      const px = mx + (Game.player.cx() / 16) * scale, py = my + (Game.player.cy() / 16) * scale;
      ctx.fillRect(px - 1.5, py - 1.5, 4, 4);
    }
    ctx.font = '7px monospace';
    ctx.fillStyle = '#605878';
    ctx.fillText('m/esc: close   gold: places   blue: waystones', 192, 228);
    ctx.textAlign = 'left';
  },

  // ---------------- SETTINGS ----------------
  SET_OPTS: ['MUSIC VOLUME', 'SOUND VOLUME', 'SCREEN SHAKE', 'MINIMAP', 'BACK'],

  updateSettings(dt) {
    const s = SaveSys.settings;
    if (Input.cancel()) { SaveSys.saveSettings(); Game.state = this.settingsReturn || 'title'; AudioSys.sfx('menu'); return; }
    if (Input.menuUp()) { this.setIdx = (this.setIdx + 4) % 5; AudioSys.sfx('menu'); }
    if (Input.menuDown()) { this.setIdx = (this.setIdx + 1) % 5; AudioSys.sfx('menu'); }
    const adj = (Input.menuRight() ? 1 : 0) - (Input.menuLeft() ? 1 : 0);
    switch (this.setIdx) {
      case 0:
        if (adj) { s.musicVol = U.clamp(s.musicVol + adj, 0, 10); SaveSys.applySettings(); AudioSys.sfx('menu'); }
        break;
      case 1:
        if (adj) { s.sfxVol = U.clamp(s.sfxVol + adj, 0, 10); SaveSys.applySettings(); AudioSys.sfx('select'); }
        break;
      case 2:
        if (adj || Input.confirm()) { s.screenShake = !s.screenShake; AudioSys.sfx('menu'); }
        break;
      case 3:
        if (adj || Input.confirm()) { s.showMinimap = !s.showMinimap; AudioSys.sfx('menu'); }
        break;
      case 4:
        if (Input.confirm()) { SaveSys.saveSettings(); Game.state = this.settingsReturn || 'title'; AudioSys.sfx('select'); }
        break;
    }
  },

  drawSettings(ctx) {
    const s = SaveSys.settings;
    ctx.fillStyle = '#0e0c1e';
    ctx.fillRect(0, 0, 384, 240);
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#e8c860';
    ctx.fillText('SETTINGS', 192, 36);

    const vals = [
      '◀ ' + '■'.repeat(s.musicVol) + '□'.repeat(10 - s.musicVol) + ' ▶',
      '◀ ' + '■'.repeat(s.sfxVol) + '□'.repeat(10 - s.sfxVol) + ' ▶',
      s.screenShake ? 'ON' : 'OFF',
      s.showMinimap ? 'ON' : 'OFF',
      ''
    ];
    this.SET_OPTS.forEach((o, i) => {
      const y = 72 + i * 22;
      const sel = i === this.setIdx;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = sel ? '#f8e080' : '#9088a8';
      ctx.fillText((sel ? '> ' : '  ') + o, 88, y);
      ctx.textAlign = 'right';
      ctx.font = '8px monospace';
      ctx.fillStyle = sel ? '#f0f0e8' : '#8888a0';
      ctx.fillText(vals[i], 300, y);
    });
    ctx.textAlign = 'center';
    ctx.font = '7px monospace';
    ctx.fillStyle = '#605878';
    ctx.fillText('arrows: adjust   esc: back (auto-saves)', 192, 220);
    ctx.textAlign = 'left';
  },

  // ---------------- GAME OVER ----------------
  updateGameOver(dt) {
    this.titleT += dt;
    if (Input.menuUp() || Input.menuDown()) { this.goIdx = 1 - this.goIdx; AudioSys.sfx('menu'); }
    if (Input.confirm()) {
      AudioSys.sfx('select');
      if (this.goIdx === 0) {
        // continue: reload save if exists, else respawn fresh at village
        if (Game.data.slot && SaveSys.info(Game.data.slot)) Game.loadGame(Game.data.slot);
        else Game.respawnFresh();
      } else Game.toTitle();
    }
  },

  drawGameOver(ctx) {
    ctx.fillStyle = '#0c0408';
    ctx.fillRect(0, 0, 384, 240);
    const pulse = 0.7 + 0.3 * Math.sin(this.titleT * 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = `rgba(200,32,48,${pulse})`;
    ctx.fillText('GAME OVER', 192, 96);
    ctx.font = 'bold 9px monospace';
    ['CONTINUE', 'QUIT TO TITLE'].forEach((o, i) => {
      const sel = i === this.goIdx;
      ctx.fillStyle = sel ? '#f8e080' : '#706878';
      ctx.fillText((sel ? '> ' : '') + o + (sel ? ' <' : ''), 192, 140 + i * 16);
    });
    ctx.textAlign = 'left';
  },

  // ---------------- ENDING & CREDITS ----------------
  startEnding() {
    this.ending = { phase: 'pages', page: 0, t: 0, chars: 0 };
    AudioSys.play('ending');
  },

  CREDITS: [
    ['THE LEGEND OF ZELDA II', ''],
    ['SHARDS OF TWILIGHT', ''],
    ['', ''],
    ['A fan-made homage', ''],
    ['', ''],
    ['— CAST —', ''],
    ['The Hero', 'You'],
    ['Elder Rowan', 'Elden Village'],
    ['Marin & Finn', 'A love story'],
    ['Rusl', 'Fair prices, mostly'],
    ['The Old Sage', 'Free advice'],
    ['Hermit Yeta', 'Extra pepper'],
    ['Fisherman Odon', 'One bad cast'],
    ['Zaffa, Sami & Dan', 'Sand in everything'],
    ['Lorelei', 'The lake, dreaming'],
    ['Elda & Pella', 'Bwok'],
    ['Keeper Elio', 'A keeper keeps'],
    ['The Saltmere folk', 'Gulls never circle nothing'],
    ['', ''],
    ['— BESTIARY —', ''],
    ['Octorok · Moblin · Keese', ''],
    ['Stalfos · Chu · Leever', ''],
    ['Wizzrobe · Darknut · Peahat', ''],
    ['Zora · Armos · Poe', ''],
    ['Wolfos · Freezard · Blade Trap', ''],
    ['Gibdo · Vulture · Sandwurm', ''],
    ['', ''],
    ['— TERRORS OF THE WILDS —', ''],
    ['The Direwolf Alpha', 'Elderwood'],
    ['The Dune Tyrant', 'Sunspear'],
    ['The Highland Ogre', 'Auran moor'],
    ['', ''],
    ['— FALLEN TYRANTS —', ''],
    ['Gloomspore', 'Verdant Temple'],
    ['Magmadon', 'Ember Depths'],
    ['Wraithlord', 'Sunken Crypt'],
    ['Frostmaw', 'Glacier Hollow'],
    ['Pharaghast', 'Sandsear Tomb'],
    ['Karstag', 'The Seventh Barrow'],
    ['Thalassa', 'The Drowned Cathedral'],
    ['The Shade', 'Shadow Keep'],
    ['', ''],
    ['Made with the MapBuilder engine', ''],
    ['Every map, sprite and song', 'built from code'],
    ['', ''],
    ['Dedicated to everyone who', ''],
    ['walks into the dark', ''],
    ['and brings back the sun.', ''],
    ['', ''],
    ['', ''],
    ['THE END', '']
  ],

  updateEnding(dt) {
    const e = this.ending;
    if (!e) return;
    e.t += dt;
    if (e.phase === 'pages') {
      const text = Story.ENDING_PAGES[e.page];
      e.chars = Math.min(text.length, Math.floor(e.t * 35));
      if (Input.confirm()) {
        if (e.chars < text.length) { e.chars = text.length; e.t = text.length / 35; }
        else {
          e.page++;
          e.t = 0;
          if (e.page >= Story.ENDING_PAGES.length) {
            e.phase = 'credits';
            e.t = 0;
          }
        }
      }
    } else if (e.phase === 'credits') {
      const totalH = this.CREDITS.length * 16 + 300;
      if (e.t * 18 > totalH || (Input.confirm() && e.t > 4)) {
        e.phase = 'end';
        e.t = 0;
      }
    } else if (e.phase === 'end') {
      if (Input.confirm() && e.t > 1) {
        this.ending = null;
        Game.toTitle();
      }
    }
  },

  drawEnding(ctx) {
    const e = this.ending;
    if (!e) return;
    const W = 384, H = 240;
    // warm sunrise gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2a1a4a');
    g.addColorStop(0.5, '#8a4a58');
    g.addColorStop(1, '#f8b858');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // sun
    const sunY = e.phase === 'pages' ? 200 - e.page * 18 : 90;
    const rg = ctx.createRadialGradient(W / 2, sunY, 4, W / 2, sunY, 60);
    rg.addColorStop(0, 'rgba(255,240,180,0.9)');
    rg.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f8e8a8';
    ctx.beginPath();
    ctx.arc(W / 2, sunY, 14, 0, 7);
    ctx.fill();

    ctx.textAlign = 'center';
    if (e.phase === 'pages') {
      const text = Story.ENDING_PAGES[e.page].slice(0, e.chars);
      ctx.font = '9px monospace';
      ctx.fillStyle = '#fff8ec';
      const lines = U.wrapText(ctx, text, 300);
      lines.forEach((l, i) => {
        ctx.fillStyle = '#20101890';
        ctx.fillText(l, W / 2 + 1, 130 + i * 13 + 1);
        ctx.fillStyle = '#fff8ec';
        ctx.fillText(l, W / 2, 130 + i * 13);
      });
      if (e.chars >= Story.ENDING_PAGES[e.page].length && Math.floor(e.t * 2) % 2) {
        ctx.font = '7px monospace';
        ctx.fillText('▼', W / 2, 210);
      }
    } else if (e.phase === 'credits') {
      const scroll = e.t * 18;
      ctx.font = 'bold 9px monospace';
      this.CREDITS.forEach(([a, b], i) => {
        const y = H + i * 16 - scroll;
        if (y < -20 || y > H + 20) return;
        ctx.fillStyle = '#20101880';
        ctx.fillText(a, W / 2 + 1, y + 1);
        ctx.fillStyle = a.startsWith('—') || a === 'THE END' ? '#f8e080' : '#fff8ec';
        ctx.fillText(a, W / 2, y);
        if (b) {
          ctx.fillStyle = '#e8c8a0';
          ctx.font = '7px monospace';
          ctx.fillText(b, W / 2, y + 9);
          ctx.font = 'bold 9px monospace';
        }
      });
    } else {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#fff8ec';
      ctx.fillText('THE END', W / 2, 116);
      if (Math.floor(e.t * 2) % 2) {
        ctx.font = '8px monospace';
        ctx.fillStyle = '#e8c8a0';
        ctx.fillText('press enter', W / 2, 140);
      }
    }
    ctx.textAlign = 'left';
  }
};
