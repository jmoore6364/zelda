// ============================================================
// utils.js — math, RNG, input, helpers
// ============================================================
'use strict';

const U = {
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  angle: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
  rand: (a, b) => a + Math.random() * (b - a),
  irand: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  chance: p => Math.random() < p,
  // deterministic hash for tile variants
  hash2: (x, y) => {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >> 13)) * 1274126177 | 0;
    return ((h ^ (h >> 16)) >>> 0) / 4294967296;
  },
  // AABB overlap
  overlap: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
  sign: v => v > 0 ? 1 : v < 0 ? -1 : 0,
  // approach current toward target by step
  approach: (cur, target, step) => {
    if (cur < target) return Math.min(cur + step, target);
    if (cur > target) return Math.max(cur - step, target);
    return cur;
  },
  wrapText: (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
};

// Seeded RNG (mulberry32) — used by MapBuilder for reproducible scatter
function RNG(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ============================================================
// Input
// ============================================================
const Input = {
  keys: {},
  pressed: {},   // true only on the frame the key went down
  mouse: { x: 0, y: 0, down: false, clicked: false, rclicked: false, wheel: 0 },

  init(canvas) {
    window.addEventListener('keydown', e => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab'].includes(e.key)) e.preventDefault();
      if (!this.keys[e.code]) this.pressed[e.code] = true;
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });

    const rect = () => canvas.getBoundingClientRect();
    canvas.addEventListener('mousemove', e => {
      const r = rect();
      this.mouse.x = (e.clientX - r.left) / r.width * 384;
      this.mouse.y = (e.clientY - r.top) / r.height * 240;
    });
    canvas.addEventListener('mousedown', e => {
      if (e.button === 0) { this.mouse.down = true; this.mouse.clicked = true; }
      if (e.button === 2) this.mouse.rclicked = true;
    });
    canvas.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.down = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => { this.mouse.wheel = Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  },

  // called at end of each frame
  flush() {
    this.pressed = {};
    this.mouse.clicked = false;
    this.mouse.rclicked = false;
    this.mouse.wheel = 0;
  },

  // ---- semantic queries ----
  left()  { return this.keys['ArrowLeft'] || this.keys['KeyA']; },
  right() { return this.keys['ArrowRight'] || this.keys['KeyD']; },
  up()    { return this.keys['ArrowUp'] || this.keys['KeyW']; },
  down()  { return this.keys['ArrowDown'] || this.keys['KeyS']; },
  attack()   { return this.pressed['Space'] || this.pressed['KeyZ']; },
  attackHeld(){ return this.keys['Space'] || this.keys['KeyZ']; },
  item()     { return this.pressed['KeyX']; },
  bomb()     { return this.pressed['KeyC']; },
  boomerang(){ return this.pressed['KeyR'] || this.pressed['KeyV']; },
  firerod()  { return this.pressed['KeyF']; },
  interact() { return this.pressed['KeyE'] || this.pressed['Enter']; },
  confirm()  { return this.pressed['Enter'] || this.pressed['Space'] || this.pressed['KeyZ'] || this.pressed['KeyE']; },
  cancel()   { return this.pressed['Escape'] || this.pressed['KeyX']; },
  pause()    { return this.pressed['Escape']; },
  inventory(){ return this.pressed['KeyI'] || this.pressed['Tab']; },
  mapKey()   { return this.pressed['KeyM']; },
  journal()  { return this.pressed['KeyJ']; },
  menuUp()   { return this.pressed['ArrowUp'] || this.pressed['KeyW']; },
  menuDown() { return this.pressed['ArrowDown'] || this.pressed['KeyS']; },
  menuLeft() { return this.pressed['ArrowLeft'] || this.pressed['KeyA']; },
  menuRight(){ return this.pressed['ArrowRight'] || this.pressed['KeyD']; }
};

// ============================================================
// Particles — lightweight pooled particle system
// ============================================================
const Particles = {
  list: [],
  spawn(x, y, opts = {}) {
    this.list.push({
      x, y,
      vx: opts.vx !== undefined ? opts.vx : U.rand(-30, 30),
      vy: opts.vy !== undefined ? opts.vy : U.rand(-50, -10),
      g: opts.g !== undefined ? opts.g : 90,
      life: opts.life || 0.5,
      t: 0,
      size: opts.size || 2,
      color: opts.color || '#fff',
      fade: opts.fade !== false,
      shrink: opts.shrink || false
    });
  },
  burst(x, y, n, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = U.rand(0, Math.PI * 2);
      const sp = U.rand(opts.speedMin || 20, opts.speedMax || 70);
      this.spawn(x, y, {
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        g: opts.g !== undefined ? opts.g : 0,
        life: U.rand((opts.life || 0.4) * 0.6, (opts.life || 0.4) * 1.4),
        size: opts.size || 2,
        color: Array.isArray(opts.color) ? U.pick(opts.color) : (opts.color || '#fff'),
        shrink: opts.shrink
      });
    }
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.t += dt;
      if (p.t >= p.life) { this.list.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  },
  draw(ctx) {
    for (const p of this.list) {
      const k = 1 - p.t / p.life;
      ctx.globalAlpha = p.fade ? k : 1;
      ctx.fillStyle = p.color;
      const s = p.shrink ? Math.max(1, p.size * k) : p.size;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  },
  clear() { this.list = []; }
};

// Floating combat text
const FloatText = {
  list: [],
  add(x, y, text, color = '#fff') {
    this.list.push({ x, y, text, color, t: 0, life: 0.8 });
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i];
      f.t += dt;
      f.y -= 20 * dt;
      if (f.t >= f.life) this.list.splice(i, 1);
    }
  },
  draw(ctx) {
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    for (const f of this.list) {
      ctx.globalAlpha = 1 - (f.t / f.life) * 0.7;
      ctx.fillStyle = '#000';
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  },
  clear() { this.list = []; }
};
