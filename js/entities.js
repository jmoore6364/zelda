// ============================================================
// entities.js — Entity base, Player (movement, combat, weapons),
// projectiles and bombs
// ============================================================
'use strict';

class Entity {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.dead = false;
  }
  cx() { return this.x + this.w / 2; }
  cy() { return this.y + this.h / 2; }
  rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  tileX() { return Math.floor(this.cx() / TILE_SIZE); }
  tileY() { return Math.floor(this.cy() / TILE_SIZE); }
}

const DIRS = {
  down: { x: 0, y: 1 }, up: { x: 0, y: -1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
};

// ============================================================
// PLAYER
// ============================================================
class Player extends Entity {
  constructor(x, y) {
    super(x, y, 11, 11);
    this.facing = 'down';
    this.moving = false;
    this.animT = 0;
    this.speed = 72;

    // combat
    this.attackT = 0;        // >0 while swinging
    this.ATTACK_DUR = 0.24;
    this.charging = false;
    this.chargeT = 0;
    this.spinT = 0;          // >0 while spin attacking
    this.SPIN_DUR = 0.45;
    this.hitEnemies = new Set();

    this.invuln = 0;
    this.kbx = 0; this.kby = 0;

    this.falling = 0;        // hole fall animation
    this.lastSafe = { x, y };
    this.bowCooldown = 0;
    this.rodCooldown = 0;
  }

  get data() { return Game.data.player; }

  swordDamage() { return this.data.hasMasterSword ? 2 : 1; }

  update(dt) {
    if (this.falling > 0) {
      this.falling -= dt;
      if (this.falling <= 0) {
        this.x = this.lastSafe.x; this.y = this.lastSafe.y;
        this.damage(0.5, null);
      }
      return;
    }

    if (this.invuln > 0) this.invuln -= dt;
    if (this.bowCooldown > 0) this.bowCooldown -= dt;
    if (this.rodCooldown > 0) this.rodCooldown -= dt;

    // knockback decay
    if (Math.abs(this.kbx) > 1 || Math.abs(this.kby) > 1) {
      Game.moveEntity(this, this.kbx * dt, this.kby * dt);
      this.kbx = U.approach(this.kbx, 0, 600 * dt);
      this.kby = U.approach(this.kby, 0, 600 * dt);
    }

    // spin attack in progress
    if (this.spinT > 0) {
      this.spinT -= dt;
      this.spinHitCheck();
      return;
    }

    // sword swing in progress
    if (this.attackT > 0) {
      this.attackT -= dt;
      if (this.charging && Input.attackHeld()) this.chargeT += dt;
      this.swingHitCheck();
      return;
    }

    // ---- movement ----
    let dx = 0, dy = 0;
    if (Input.left()) dx -= 1;
    if (Input.right()) dx += 1;
    if (Input.up()) dy -= 1;
    if (Input.down()) dy += 1;

    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      // facing priority: last pressed axis
      if (dy !== 0 && dx === 0) this.facing = dy > 0 ? 'down' : 'up';
      else if (dx !== 0 && dy === 0) this.facing = dx > 0 ? 'right' : 'left';
      else if (dx !== 0) this.facing = dx > 0 ? 'right' : 'left';

      const len = Math.hypot(dx, dy);
      let spd = this.speed;
      const tid = Game.tileAt(this.tileX(), this.tileY());
      const tdef = Tiles.def(tid);
      if (tdef && tdef.slow) spd *= 0.6;
      if (tid === T.WATER) spd *= 0.55; // swimming (flippers)
      Game.moveEntity(this, dx / len * spd * dt, dy / len * spd * dt);
      this.animT += dt;
      // footstep grass particles
      if (Math.random() < 0.06 && tdef && (tid === T.GRASS || tid === T.TALLGRASS || tid === T.FLOWERS)) {
        Particles.spawn(this.cx(), this.y + this.h, { vx: U.rand(-8, 8), vy: -12, g: 40, life: 0.35, color: '#5fae4c', size: 1.5 });
      }
      // swim ripples
      if (Math.random() < 0.12 && tid === T.WATER) {
        Particles.spawn(this.cx() + U.rand(-5, 5), this.y + this.h - 2, { vx: U.rand(-10, 10), vy: -4, g: 0, life: 0.4, color: U.pick(['#a8d0f0', '#6a98e8']), size: 1.5 });
      }
    } else {
      this.animT = 0;
    }

    // hole check
    const curTile = Tiles.def(Game.tileAt(this.tileX(), this.tileY()));
    if (curTile && curTile.hole) {
      this.falling = 0.6;
      AudioSys.sfx('hurt');
      return;
    } else if (!this.moving || Math.floor(this.animT * 10) % 4 === 0) {
      // track safe spot on solid, non-hole ground
      this.lastSafe = { x: this.x, y: this.y };
    }

    // ---- combat inputs ----
    if (this.data.hasSword) {
      if (Input.attack() && this.attackT <= 0) {
        this.startSwing();
      } else if (this.charging) {
        if (Input.attackHeld()) {
          this.chargeT += dt;
          if (this.chargeT > 0.55 && Math.random() < 0.3) {
            const col = this.data.hasMasterSword ? '#78a8e8' : '#f8f8ff';
            Particles.spawn(this.cx() + U.rand(-8, 8), this.cy() + U.rand(-8, 8), { vx: 0, vy: -10, g: 0, life: 0.25, color: col, size: 1.5 });
          }
        } else {
          // release
          if (this.chargeT > 0.55) this.startSpin();
          this.charging = false;
          this.chargeT = 0;
        }
      }
    }

    if (Input.item() && this.data.hasBow) this.shootArrow();
    if (Input.bomb() && this.data.hasBombs) this.placeBomb();
    if (Input.boomerang() && this.data.hasBoomerang) this.throwBoomerang();
    if (Input.firerod() && this.data.hasFireRod) this.shootFire();
    if (Input.interact()) Game.tryInteract();
  }

  startSwing() {
    this.attackT = this.ATTACK_DUR;
    this.hitEnemies.clear();
    this.charging = true;
    this.chargeT = 0;
    AudioSys.sfx('sword');
    // cut tiles immediately
    this.cutTiles();
  }

  startSpin() {
    this.spinT = this.SPIN_DUR;
    this.hitEnemies.clear();
    AudioSys.sfx('spin');
    // cut all around
    for (const d of ['down', 'up', 'left', 'right']) {
      const v = DIRS[d];
      this.cutTileAt(this.tileX() + v.x, this.tileY() + v.y);
    }
  }

  swordHitbox() {
    const v = DIRS[this.facing];
    const r = 15;
    return {
      x: this.cx() + v.x * r - (v.x === 0 ? 10 : 7),
      y: this.cy() + v.y * r - (v.y === 0 ? 10 : 7),
      w: v.x === 0 ? 20 : 14,
      h: v.y === 0 ? 20 : 14
    };
  }

  swingHitCheck() {
    const hb = this.swordHitbox();
    this.hitCheck(hb, this.swordDamage());
  }

  spinHitCheck() {
    const hb = { x: this.cx() - 20, y: this.cy() - 20, w: 40, h: 40 };
    this.hitCheck(hb, this.swordDamage() * 1.5);
  }

  hitCheck(hb, dmg) {
    for (const e of Game.enemies) {
      if (e.dead || this.hitEnemies.has(e)) continue;
      if (U.overlap(hb, e.rect())) {
        this.hitEnemies.add(e);
        e.hurt(dmg, this);
      }
    }
    if (Game.boss && !Game.boss.dead && !this.hitEnemies.has(Game.boss) && U.overlap(hb, Game.boss.rect())) {
      this.hitEnemies.add(Game.boss);
      Game.boss.hurt(dmg, this);
    }
    // smash pots
    for (const o of Game.objects) {
      if (o.type === 'pot' && !o.smashed && U.overlap(hb, { x: o.x * 16 + 2, y: o.y * 16 + 2, w: 12, h: 12 })) {
        Game.smashPot(o);
      }
      if (o.type === 'switch_crystal' && !o.hit && U.overlap(hb, { x: o.x * 16, y: o.y * 16, w: 16, h: 16 })) {
        Game.triggerSwitch(o);
      }
    }
    // deflect enemy projectiles
    for (const pr of Game.projectiles) {
      if (pr.owner === 'enemy' && U.overlap(hb, pr.rect())) pr.dead = true;
    }
  }

  cutTiles() {
    const v = DIRS[this.facing];
    this.cutTileAt(this.tileX() + v.x, this.tileY() + v.y);
  }

  cutTileAt(tx, ty) {
    const tid = Game.tileAt(tx, ty);
    if (tid === T.BUSH || tid === T.TALLGRASS) {
      Game.setTile(tx, ty, T.GRASS);
      Particles.burst(tx * 16 + 8, ty * 16 + 8, 8, { color: ['#4a8c3a', '#5fae4c', '#2f7030'], life: 0.45, g: 100 });
      AudioSys.sfx('hit');
      if (tid === T.BUSH) {
        // reveal hidden portal under this bush?
        const portal = Game.map.portals.find(p => p.underBush && tx >= p.x && tx < p.x + p.w && ty >= p.y && ty < p.y + p.h);
        if (portal) {
          Game.setTile(tx, ty, T.STAIRS_DOWN);
          AudioSys.sfx('secret');
        } else if (Math.random() < 0.35) {
          rollDrop(tx * 16 + 8, ty * 16 + 8);
        }
      }
    }
  }

  shootArrow() {
    if (this.attackT > 0 || this.spinT > 0 || this.bowCooldown > 0) return;
    if (this.data.arrows <= 0) { AudioSys.sfx('error'); FloatText.add(this.cx(), this.y - 4, 'No arrows!', '#f08080'); return; }
    this.data.arrows--;
    this.bowCooldown = 0.4;
    const v = DIRS[this.facing];
    Game.projectiles.push(new Projectile(this.cx() + v.x * 8, this.cy() + v.y * 8, v.x * 220, v.y * 220, {
      sprite: 'arrow_proj', owner: 'player', damage: 1, rotate: true
    }));
    AudioSys.sfx('bow');
  }

  placeBomb() {
    if (this.data.bombs <= 0) { AudioSys.sfx('error'); FloatText.add(this.cx(), this.y - 4, 'No bombs!', '#f08080'); return; }
    this.data.bombs--;
    const v = DIRS[this.facing];
    Game.bombs.push(new Bomb(this.cx() + v.x * 14 - 8, this.cy() + v.y * 14 - 8));
    AudioSys.sfx('bomb_place');
  }

  throwBoomerang() {
    if (Game.boomerang || this.attackT > 0 || this.spinT > 0) return;
    Game.boomerang = new Boomerang(this.cx(), this.cy(), this.facing);
    AudioSys.sfx('boomerang');
  }

  shootFire() {
    if (this.attackT > 0 || this.spinT > 0 || this.rodCooldown > 0) return;
    this.rodCooldown = 0.7;
    const v = DIRS[this.facing];
    Game.projectiles.push(new Projectile(this.cx() + v.x * 8, this.cy() + v.y * 8, v.x * 170, v.y * 170, {
      sprite: 'fireball', owner: 'player', damage: 1.5, burns: true, life: 1.2
    }));
    AudioSys.sfx('fire');
    Particles.burst(this.cx() + v.x * 10, this.cy() + v.y * 10, 4, { color: ['#f8a030', '#f8e060'], life: 0.3 });
  }

  damage(amount, source) {
    if (this.invuln > 0 || this.falling > 0 || Game.state !== 'play') return;
    if (this.data.hasShield) amount = Math.max(0.5, amount * 0.5);
    this.data.hearts -= amount;
    this.invuln = 1.0;
    AudioSys.sfx('hurt');
    Game.shake(4, 0.25);
    Particles.burst(this.cx(), this.cy(), 6, { color: '#e83048', life: 0.4 });
    if (source) {
      const a = U.angle(source.cx ? source.cx() : source.x, source.cy ? source.cy() : source.y, this.cx(), this.cy());
      this.kbx = Math.cos(a) * 180;
      this.kby = Math.sin(a) * 180;
    }
    if (this.data.hearts <= 0) {
      this.data.hearts = 0;
      Game.gameOver();
    }
  }

  draw(ctx) {
    if (this.falling > 0) {
      // shrink into hole
      const k = this.falling / 0.6;
      const cv = Sprites.get('hero_down', 0);
      const s = 16 * k;
      ctx.drawImage(cv, this.cx() - s / 2, this.cy() - s / 2, s, s);
      return;
    }

    const blink = this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.4;

    let sprite, flip = false, frame = 0;
    if (this.facing === 'down') sprite = 'hero_down';
    else if (this.facing === 'up') sprite = 'hero_up';
    else { sprite = 'hero_side'; flip = this.facing === 'left'; }

    const spinning = this.spinT > 0;
    const attacking = this.attackT > 0;

    if (spinning) {
      // cycle facings for spin
      const seq = ['down', 'left', 'up', 'right'];
      const idx = Math.floor((1 - this.spinT / this.SPIN_DUR) * 8) % 4;
      const f = seq[idx];
      if (f === 'down') { sprite = 'hero_down'; flip = false; }
      else if (f === 'up') { sprite = 'hero_up'; flip = false; }
      else { sprite = 'hero_side'; flip = f === 'left'; }
      frame = 3;
      this.drawSword(ctx, f, 1);
    } else if (attacking) {
      frame = 3;
      const prog = 1 - this.attackT / this.ATTACK_DUR;
      this.drawSword(ctx, this.facing, prog);
    } else if (this.moving) {
      frame = 1 + (Math.floor(this.animT * 8) % 2);
    } else if (this.charging && this.chargeT > 0.55) {
      frame = 3;
      this.drawSword(ctx, this.facing, 0.6);
    }

    const dx = this.x - 2.5, dy = this.y - 5;
    Sprites.draw(ctx, sprite, frame, dx, dy, { flip });
    if (blink) ctx.globalAlpha = 1;
  }

  // draw sword rotated by facing & swing progress (arc sweep)
  drawSword(ctx, facing, prog) {
    const base = { down: Math.PI, up: 0, left: -Math.PI / 2, right: Math.PI / 2 }[facing];
    // sweep from -70° to +70° across the swing
    const sweep = (prog - 0.5) * (140 * Math.PI / 180);
    const ang = base + sweep;
    const dist = 11;
    const sx = this.cx() + Math.sin(ang) * dist;
    const sy = this.cy() - Math.cos(ang) * dist;
    const spr = this.data.hasMasterSword ? 'sword_master' : 'sword';
    Sprites.draw(ctx, spr, 0, sx - 8, sy - 6, { rot: ang });
    // slash trail
    if (prog > 0.2 && prog < 0.9) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = this.data.hasMasterSword ? '#a8c8f8' : '#f8f8ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.cx(), this.cy(), 14, ang - Math.PI / 2 - 0.7, ang - Math.PI / 2 + 0.1);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

// ============================================================
// Projectile — arrows, rocks, fireballs, magic bolts
// ============================================================
class Projectile extends Entity {
  constructor(x, y, vx, vy, opts = {}) {
    super(x - 4, y - 4, 8, 8);
    this.vx = vx; this.vy = vy;
    this.sprite = opts.sprite || 'rock_proj';
    this.owner = opts.owner || 'enemy';
    this.dmg = opts.damage || 0.5;
    this.rotate = !!opts.rotate;
    this.pierce = !!opts.pierce;
    this.burns = !!opts.burns;
    this.ignoreWalls = !!opts.ignoreWalls;
    this.life = opts.life || 3;
    this.animT = 0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.animT += dt;
    if (this.life <= 0) { this.dead = true; return; }

    // wall collision
    if (!this.ignoreWalls) {
      const tid = Game.tileAt(this.tileX(), this.tileY());
      if (Tiles.solid(tid) && !Tiles.isWater(tid)) {
        if (this.burns && tid === T.BUSH && Game.player) {
          // flame consumes the bush (reveals what hides beneath)
          Game.player.cutTileAt(this.tileX(), this.tileY());
          Particles.burst(this.cx(), this.cy(), 8, { color: ['#f8a030', '#f8e060', '#e85818'], life: 0.4 });
        } else {
          Particles.burst(this.cx(), this.cy(), 4, { color: this.burns ? '#f8a030' : '#c8c8d0', life: 0.25 });
        }
        this.dead = true;
        return;
      }
    }

    if (this.owner === 'player') {
      for (const e of Game.enemies) {
        if (e.dead) continue;
        if (U.overlap(this.rect(), e.rect())) {
          e.hurt(this.dmg, this);
          if (!this.pierce) { this.dead = true; return; }
        }
      }
      if (Game.boss && !Game.boss.dead && U.overlap(this.rect(), Game.boss.rect())) {
        Game.boss.hurt(this.dmg, this);
        this.dead = true;
        return;
      }
      // crystal switches
      for (const o of Game.objects) {
        if (o.type === 'switch_crystal' && !o.hit && U.overlap(this.rect(), { x: o.x * 16, y: o.y * 16, w: 16, h: 16 })) {
          Game.triggerSwitch(o);
          this.dead = true;
          return;
        }
      }
    } else {
      const pl = Game.player;
      if (pl && U.overlap(this.rect(), pl.rect())) {
        pl.damage(this.dmg, this);
        this.dead = true;
      }
    }
  }

  draw(ctx) {
    const frame = Math.floor(this.animT * 8) % 2;
    if (this.rotate) {
      const ang = Math.atan2(this.vy, this.vx) + Math.PI / 2;
      Sprites.draw(ctx, this.sprite, frame, this.x, this.y, { rot: ang });
    } else {
      Sprites.draw(ctx, this.sprite, frame, this.x, this.y);
    }
  }
}

// ============================================================
// Boomerang — flies out, stuns, fetches, returns
// ============================================================
class Boomerang extends Entity {
  constructor(x, y, facing) {
    super(x - 5, y - 5, 10, 10);
    const v = DIRS[facing];
    this.vx = v.x * 195; this.vy = v.y * 195;
    this.state = 'out';
    this.t = 0;
    this.animT = 0;
    this.hitSet = new Set();
  }

  update(dt) {
    this.t += dt;
    this.animT += dt;
    const pl = Game.player;

    if (this.state === 'out') {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const tid = Game.tileAt(this.tileX(), this.tileY());
      if (this.t > 0.42 || (Tiles.solid(tid) && !Tiles.isWater(tid))) this.state = 'back';
    } else {
      if (!pl) { this.dead = true; return; }
      const a = U.angle(this.cx(), this.cy(), pl.cx(), pl.cy());
      this.x += Math.cos(a) * 235 * dt;
      this.y += Math.sin(a) * 235 * dt;
      if (U.dist(this.cx(), this.cy(), pl.cx(), pl.cy()) < 10) { this.dead = true; return; }
    }

    // stun enemies
    for (const e of Game.enemies) {
      if (e.dead || this.hitSet.has(e)) continue;
      if (U.overlap(this.rect(), e.rect())) {
        this.hitSet.add(e);
        e.hurt(0.5, this);
        if (!e.dead && !(e.invulnerable && e.invulnerable())) {
          e.stunT = Math.max(e.stunT, 1.8);
          Particles.burst(e.cx(), e.cy(), 6, { color: ['#a8e8f8', '#f8f8ff'], life: 0.4 });
        }
        if (this.state === 'out') this.state = 'back';
      }
    }
    // chip the boss (no stun)
    if (Game.boss && !Game.boss.dead && !this.hitSet.has(Game.boss) && U.overlap(this.rect(), Game.boss.rect())) {
      this.hitSet.add(Game.boss);
      Game.boss.hurt(0.5, this);
      this.state = 'back';
    }
    // ring crystal switches
    for (const o of Game.objects) {
      if (o.type === 'switch_crystal' && !o.hit && U.overlap(this.rect(), { x: o.x * 16, y: o.y * 16, w: 16, h: 16 })) {
        Game.triggerSwitch(o);
        this.state = 'back';
      }
    }
    // fetch pickups — drag them along
    for (const pk of Game.pickups) {
      if (!pk.dead && U.overlap(this.rect(), { x: pk.x - 5, y: pk.y - 5, w: 10, h: 10 })) {
        pk.x = this.cx(); pk.y = this.cy();
        pk.grounded = true;
      }
    }
  }

  draw(ctx) {
    Sprites.draw(ctx, 'boomerang', 0, this.x - 3, this.y - 3, { rot: this.animT * 16 });
  }
}

// ============================================================
// Bomb
// ============================================================
class Bomb extends Entity {
  constructor(x, y) {
    super(x, y, 16, 16);
    this.timer = 1.8;
    this.exploded = false;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0 && !this.exploded) this.explode();
  }

  explode() {
    this.exploded = true;
    this.dead = true;
    const cx = this.cx(), cy = this.cy();
    const R = 30;
    AudioSys.sfx('explosion');
    Game.shake(6, 0.4);
    Particles.burst(cx, cy, 24, { color: ['#f8a030', '#f8e060', '#e85818', '#68686e'], life: 0.6, speedMax: 120 });
    Particles.burst(cx, cy, 10, { color: '#38384a', life: 0.9, speedMax: 60, g: -20 });

    // damage enemies
    for (const e of Game.enemies) {
      if (!e.dead && U.dist(cx, cy, e.cx(), e.cy()) < R + 8) e.hurt(2, this);
    }
    if (Game.boss && !Game.boss.dead && U.dist(cx, cy, Game.boss.cx(), Game.boss.cy()) < R + 20) {
      Game.boss.hurt(2, this);
    }
    // damage player
    const pl = Game.player;
    if (pl && U.dist(cx, cy, pl.cx(), pl.cy()) < R) pl.damage(1, this);

    // break cracked walls
    const tx = Math.floor(cx / 16), ty = Math.floor(cy / 16);
    for (let j = ty - 2; j <= ty + 2; j++) {
      for (let i = tx - 2; i <= tx + 2; i++) {
        if (Game.tileAt(i, j) === T.CRACKED_WALL && U.dist(cx, cy, i * 16 + 8, j * 16 + 8) < R + 10) {
          Game.breakCrackedWall(i, j);
        }
      }
    }
    // smash pots
    for (const o of Game.objects) {
      if (o.type === 'pot' && !o.smashed && U.dist(cx, cy, o.x * 16 + 8, o.y * 16 + 8) < R + 6) {
        Game.smashPot(o);
      }
    }
  }

  draw(ctx) {
    const frame = Math.floor((1.8 - this.timer) * 6) % 2;
    // flash red when about to blow
    if (this.timer < 0.5 && Math.floor(this.timer * 12) % 2 === 0) {
      Sprites.drawFlash(ctx, 'bomb_placed', frame, this.x, this.y);
    } else {
      Sprites.draw(ctx, 'bomb_placed', frame, this.x, this.y);
    }
  }
}

// ============================================================
// NPC entity — wanders a tile or two, faces player when talking
// ============================================================
class NPC extends Entity {
  constructor(id, x, y) {
    super(x * 16 + 2, y * 16 + 3, 12, 12);
    this.id = id;
    this.homeX = this.x; this.homeY = this.y;
    this.animT = U.rand(0, 5);
    this.moveT = U.rand(1, 4);
    this.vx = 0; this.vy = 0;
    this.sprite = {
      elder: 'npc_elder', marin: 'npc_woman', shopkeep: 'npc_shopkeep',
      innkeep: 'npc_woman', traveler_finn: 'npc_man', guard_bex: 'npc_guard',
      oldman_sage: 'npc_elder', scholar_ivo: 'npc_man', townwoman_ella: 'npc_woman',
      townman_dole: 'npc_man', kid_pip: 'npc_kid', kid_nell: 'npc_kid',
      mother_ana: 'npc_woman', granny_lu: 'npc_woman', villager_meg: 'npc_woman',
      villager_tomm: 'npc_man', fairy: 'npc_fairy', princess: 'npc_princess',
      hermit_yeta: 'npc_hermit',
      fisherman_odon: 'npc_fisher', nomad_zaffa: 'npc_nomad', digger_dan: 'npc_man',
      lorelei: 'npc_spirit', rancher_elda: 'npc_rancher', cucco_pella: 'npc_cucco',
      fisher_bjorn: 'npc_fisher', trader_sami: 'npc_nomad', harbor_brine: 'npc_man',
      salt_nan: 'npc_woman', salt_tide: 'npc_man', keeper_elio: 'npc_elder', kid_shell: 'npc_kid'
    }[id] || 'npc_man';
    this.wanders = !['shopkeep', 'innkeep', 'elder', 'fairy', 'guard_bex', 'princess', 'hermit_yeta', 'lorelei', 'fisherman_odon', 'trader_sami', 'keeper_elio'].includes(id);
  }

  update(dt) {
    this.animT += dt;
    if (!this.wanders) return;
    this.moveT -= dt;
    if (this.moveT <= 0) {
      this.moveT = U.rand(1.5, 4);
      if (Math.random() < 0.6) {
        const a = U.rand(0, Math.PI * 2);
        this.vx = Math.cos(a) * 18;
        this.vy = Math.sin(a) * 18;
        setTimeout(() => { this.vx = 0; this.vy = 0; }, 700);
      } else { this.vx = 0; this.vy = 0; }
    }
    if (this.vx || this.vy) {
      // stay near home
      if (U.dist(this.x, this.y, this.homeX, this.homeY) > 40) {
        const a = U.angle(this.x, this.y, this.homeX, this.homeY);
        this.vx = Math.cos(a) * 18; this.vy = Math.sin(a) * 18;
      }
      Game.moveEntity(this, this.vx * dt, this.vy * dt);
    }
  }

  interact() {
    const d = Story.npcDialogue(this.id);
    if (d) Dialogue.start({
      speaker: d.speaker, pages: d.pages, portrait: d.portrait,
      choices: d.choices, onEnd: d.onEnd
    });
  }

  draw(ctx) {
    const frame = (this.vx || this.vy || this.id === 'fairy') ? Math.floor(this.animT * 5) % 2 : 0;
    const bob = this.id === 'fairy' ? Math.sin(this.animT * 3) * 2 : 0;
    Sprites.draw(ctx, this.sprite, frame, this.x - 2, this.y - 5 + bob);
  }
}
