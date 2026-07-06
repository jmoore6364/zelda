// ============================================================
// touch.js — virtual controls for mobile / touch play.
// Feeds Input.keys / Input.pressed directly, so every game
// system (menus, dialogue, combat, editor prompts) just works.
// ============================================================
'use strict';

const TouchUI = {
  active: false,
  padTouchId: null,

  init() {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const touchable = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (coarse && touchable) this.enable();
    // fallback: any real touch enables the controls
    window.addEventListener('touchstart', () => this.enable(), { once: true, passive: true });
  },

  enable() {
    if (this.active) return;
    this.active = true;
    this.build();
  },

  press(code) {
    if (!Input.keys[code]) Input.pressed[code] = true;
    Input.keys[code] = true;
  },
  release(code) { Input.keys[code] = false; },

  build() {
    const ui = document.createElement('div');
    ui.id = 'touch-ui';

    // ---------- D-pad (left) ----------
    const pad = document.createElement('div');
    pad.id = 'tpad';
    pad.innerHTML = '<div id="tpad-nub"></div>';
    ui.appendChild(pad);

    const DIR_CODES = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    const nub = () => pad.firstChild;

    const updatePad = (touch) => {
      const r = pad.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = touch.clientX - cx, dy = touch.clientY - cy;
      const dead = r.width * 0.14;
      this.release('ArrowLeft'); this.release('ArrowRight');
      this.release('ArrowUp'); this.release('ArrowDown');
      if (dx < -dead) this.press('ArrowLeft');
      if (dx > dead) this.press('ArrowRight');
      if (dy < -dead) this.press('ArrowUp');
      if (dy > dead) this.press('ArrowDown');
      // move the nub (clamped)
      const max = r.width * 0.28;
      const len = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, max / len);
      nub().style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    };

    const releasePad = () => {
      this.padTouchId = null;
      DIR_CODES.forEach(c => this.release(c));
      nub().style.transform = 'translate(0,0)';
    };

    pad.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.padTouchId = t.identifier;
      updatePad(t);
    }, { passive: false });
    pad.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.padTouchId) updatePad(t);
      }
    }, { passive: false });
    pad.addEventListener('touchend', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.padTouchId) releasePad();
      }
    }, { passive: false });
    pad.addEventListener('touchcancel', releasePad, { passive: true });

    // ---------- action buttons (right) ----------
    // [label, key code, css class]
    const buttons = [
      ['⚔', 'Space', 'tbtn-sword'],   // sword / confirm
      ['E',  'KeyE',  'tbtn-talk'],    // talk / open / buy
      ['🏹', 'KeyX',  'tbtn-bow'],
      ['💣', 'KeyC',  'tbtn-bomb'],
      ['⟳',  'KeyR',  'tbtn-rang'],    // boomerang
      ['🔥', 'KeyF',  'tbtn-rod'],
      ['☰',  'Escape','tbtn-menu'],    // pause
      ['🎒', 'Tab',   'tbtn-bag'],     // inventory
      ['🗺',  'KeyM',  'tbtn-map']
    ];

    for (const [label, code, cls] of buttons) {
      const el = document.createElement('div');
      el.className = 'tbtn ' + cls;
      el.textContent = label;
      el.addEventListener('touchstart', e => {
        e.preventDefault();
        this.press(code);
        el.classList.add('held');
      }, { passive: false });
      const up = e => {
        if (e.cancelable) e.preventDefault();
        this.release(code);
        el.classList.remove('held');
      };
      el.addEventListener('touchend', up, { passive: false });
      el.addEventListener('touchcancel', up, { passive: true });
      el.addEventListener('contextmenu', e => e.preventDefault());
      ui.appendChild(el);
    }

    document.body.appendChild(ui);

    // keep stray touches from scrolling / zooming the page
    document.addEventListener('touchmove', e => {
      if (e.target === document.body || e.target.id === 'wrap' || e.target.id === 'game') e.preventDefault();
    }, { passive: false });
  }
};

window.addEventListener('load', () => TouchUI.init());
