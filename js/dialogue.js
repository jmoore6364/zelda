// ============================================================
// dialogue.js — dialogue boxes, typewriter text, choices
// ============================================================
'use strict';

const Dialogue = {
  active: false,
  pages: [],
  page: 0,
  chars: 0,        // typewriter progress
  speaker: null,
  portrait: null,  // sprite name
  itemSprite: null,
  choices: null,   // [{label, cb}]
  choiceIdx: 0,
  onEnd: null,
  charTimer: 0,
  SPEED: 40,       // chars per second

  start(opts) {
    this.active = true;
    this.pages = Array.isArray(opts.pages) ? opts.pages : [opts.pages];
    this.page = 0;
    this.chars = 0;
    this.charTimer = 0;
    this.speaker = opts.speaker || null;
    this.portrait = opts.portrait || null;
    this.itemSprite = opts.itemSprite || null;
    this.choices = opts.choices || null;
    this.choiceIdx = 0;
    this.onEnd = opts.onEnd || null;
    if (Game.state === 'play') Game.state = 'dialogue';
  },

  update(dt) {
    if (!this.active) return;
    const text = this.pages[this.page] || '';
    if (this.chars < text.length) {
      this.charTimer += dt * this.SPEED;
      const prev = this.chars;
      this.chars = Math.min(text.length, Math.floor(this.charTimer));
      if (this.chars > prev && this.chars % 3 === 0) AudioSys.sfx('text');
      if (Input.confirm()) { // skip typewriter
        this.chars = text.length;
        this.charTimer = text.length;
      }
      return;
    }
    // page complete
    const onLast = this.page >= this.pages.length - 1;
    if (onLast && this.choices) {
      if (Input.menuUp()) { this.choiceIdx = (this.choiceIdx + this.choices.length - 1) % this.choices.length; AudioSys.sfx('menu'); }
      if (Input.menuDown()) { this.choiceIdx = (this.choiceIdx + 1) % this.choices.length; AudioSys.sfx('menu'); }
      if (Input.confirm()) {
        const c = this.choices[this.choiceIdx];
        this.close();
        if (c.cb) c.cb();
      }
      return;
    }
    if (Input.confirm()) {
      if (onLast) this.close();
      else {
        this.page++;
        this.chars = 0;
        this.charTimer = 0;
        AudioSys.sfx('menu');
      }
    }
  },

  close() {
    this.active = false;
    const cb = this.onEnd;
    this.onEnd = null;
    if (Game.state === 'dialogue') Game.state = 'play';
    if (cb) cb();
  },

  draw(ctx) {
    if (!this.active) return;
    const W = 384, boxH = 62, boxY = 240 - boxH - 6;
    const boxX = 8, boxW = W - 16;

    // box
    ctx.fillStyle = 'rgba(10, 12, 28, 0.92)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#c8b060';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 1.5, boxY + 1.5, boxW - 3, boxH - 3);
    ctx.strokeStyle = '#6a5a30';
    ctx.strokeRect(boxX + 3.5, boxY + 3.5, boxW - 7, boxH - 7);

    let textX = boxX + 10, textW = boxW - 20;

    // portrait
    if (this.portrait) {
      ctx.fillStyle = 'rgba(40,44,80,0.8)';
      ctx.fillRect(boxX + 8, boxY + 8, 40, boxH - 16);
      ctx.strokeStyle = '#c8b060';
      ctx.strokeRect(boxX + 8.5, boxY + 8.5, 39, boxH - 17);
      const cv = Sprites.get(this.portrait, 0);
      if (cv) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(cv, boxX + 12, boxY + boxH / 2 - 16, 32, 32);
      }
      textX = boxX + 56; textW = boxW - 66;
    }

    // item sprite (item-get)
    if (this.itemSprite) {
      const cv = Sprites.get(this.itemSprite, 0);
      if (cv) {
        ctx.drawImage(cv, boxX + 14, boxY + boxH / 2 - 16, 32, 32);
      }
      textX = boxX + 56; textW = boxW - 66;
    }

    // speaker name
    let ty = boxY + 16;
    if (this.speaker) {
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#e8c860';
      ctx.fillText(this.speaker, textX, boxY + 13);
      ty = boxY + 25;
    }

    // text (typewriter)
    const text = (this.pages[this.page] || '').slice(0, this.chars);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#f0f0e8';
    const lines = U.wrapText(ctx, text, textW);
    for (let i = 0; i < lines.length && i < 4; i++) {
      ctx.fillText(lines[i], textX, ty + i * 10);
    }

    const full = this.chars >= (this.pages[this.page] || '').length;

    // choices
    if (full && this.page >= this.pages.length - 1 && this.choices) {
      const chY = boxY - this.choices.length * 12 - 8;
      const chW = 110;
      ctx.fillStyle = 'rgba(10, 12, 28, 0.92)';
      ctx.fillRect(W - chW - 10, chY, chW, this.choices.length * 12 + 8);
      ctx.strokeStyle = '#c8b060';
      ctx.strokeRect(W - chW - 9.5, chY + 0.5, chW - 1, this.choices.length * 12 + 7);
      ctx.font = '8px monospace';
      this.choices.forEach((c, i) => {
        ctx.fillStyle = i === this.choiceIdx ? '#f8e080' : '#b8b8c0';
        ctx.fillText((i === this.choiceIdx ? '> ' : '  ') + c.label, W - chW - 2, chY + 10 + i * 12);
      });
    } else if (full) {
      // continue arrow
      if (Math.floor(performance.now() / 400) % 2) {
        ctx.fillStyle = '#e8c860';
        const ax = boxX + boxW - 14, ay = boxY + boxH - 10;
        ctx.beginPath();
        ctx.moveTo(ax, ay); ctx.lineTo(ax + 6, ay); ctx.lineTo(ax + 3, ay + 4);
        ctx.fill();
      }
    }
  }
};
