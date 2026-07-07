// ============================================================
// enemies.js — 12 enemy types, each with distinct AI
// ============================================================
'use strict';

class Enemy extends Entity {
  constructor(x, y, opts) {
    super(x, y, opts.w || 12, opts.h || 12);
    this.hp = opts.hp || 2;
    this.maxHp = this.hp;
    this.touchDmg = opts.touchDmg || 0.5;
    this.sprite = opts.sprite;
    this.speed = opts.speed || 30;
    this.flying = !!opts.flying;
    this.animT = U.rand(0, 5);
    this.hurtT = 0;
    this.stunT = 0;      // boomerang stun — frozen in place while > 0
    this.kbx = 0; this.kby = 0;
    this.flip = false;
    this.noContact = false; // set true to skip touch damage (e.g. buried leever)
  }

  hurt(dmg, source) {
    if (this.dead || this.hurtT > 0) return;
    if (this.invulnerable && this.invulnerable()) {
      AudioSys.sfx('hit');
      FloatText.add(this.cx(), this.y - 4, 'CLANK', '#a8b0c8');
      return;
    }
    this.hp -= dmg;
    this.hurtT = 0.25;
    AudioSys.sfx('hit');
    FloatText.add(this.cx(), this.y - 4, String(dmg), '#f8e080');
    if (source) {
      const sx = source.cx ? source.cx() : source.x;
      const sy = source.cy ? source.cy() : source.y;
      const a = U.angle(sx, sy, this.cx(), this.cy());
      this.kbx = Math.cos(a) * 150;
      this.kby = Math.sin(a) * 150;
    }
    if (this.hp <= 0) this.die();
  }

  die() {
    this.dead = true;
    AudioSys.sfx('kill');
    Particles.burst(this.cx(), this.cy(), 12, {
      color: ['#f8f8ff', '#8888a0', '#38384a'], life: 0.5, speedMax: 80
    });
    rollDrop(this.cx(), this.cy());
    // bestiary
    if (this.typeName && Game.data) {
      Game.data.kills = Game.data.kills || {};
      Game.data.kills[this.typeName] = (Game.data.kills[this.typeName] || 0) + 1;
    }
  }

  baseUpdate(dt) {
    this.animT += dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    // knockback
    if (Math.abs(this.kbx) > 1 || Math.abs(this.kby) > 1) {
      if (this.flying) { this.x += this.kbx * dt; this.y += this.kby * dt; }
      else Game.moveEntity(this, this.kbx * dt, this.kby * dt);
      this.kbx = U.approach(this.kbx, 0, 500 * dt);
      this.kby = U.approach(this.kby, 0, 500 * dt);
    }
    // touch damage
    if (!this.noContact) {
      const pl = Game.player;
      if (pl && U.overlap(this.rect(), pl.rect())) pl.damage(this.touchDmg, this);
    }
  }

  move(dx, dy, dt) {
    if (this.flying) {
      this.x += dx; this.y += dy;
      this.x = U.clamp(this.x, 8, Game.map.w * 16 - 20);
      this.y = U.clamp(this.y, 8, Game.map.h * 16 - 20);
    } else {
      Game.moveEntity(this, dx, dy);
    }
    if (dx !== 0) this.flip = dx < 0;
  }

  distToPlayer() {
    const pl = Game.player;
    return pl ? U.dist(this.cx(), this.cy(), pl.cx(), pl.cy()) : 9999;
  }

  angleToPlayer() {
    const pl = Game.player;
    return U.angle(this.cx(), this.cy(), pl.cx(), pl.cy());
  }

  drawSprite(ctx, frame, opts = {}) {
    const ox = opts.ox !== undefined ? opts.ox : -2;
    const oy = opts.oy !== undefined ? opts.oy : -3;
    if (this.hurtT > 0.12) {
      Sprites.drawFlash(ctx, this.sprite, frame, this.x + ox, this.y + oy, this.flip);
    } else {
      Sprites.draw(ctx, this.sprite, frame, this.x + ox, this.y + oy, { flip: this.flip, alpha: opts.alpha });
    }
  }

  draw(ctx) {
    this.drawSprite(ctx, Math.floor(this.animT * 5) % 2);
  }
}

// ------------------------------------------------------------
// 1. OCTOROK — wanders on a grid, spits rocks
// ------------------------------------------------------------
class Octorok extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 2, touchDmg: 0.5, sprite: 'octorok', speed: 28 });
    this.dir = U.pick(['down', 'up', 'left', 'right']);
    this.walkT = U.rand(0.5, 2);
    this.shootT = U.rand(1, 3);
  }
  update(dt) {
    this.baseUpdate(dt);
    this.walkT -= dt;
    this.shootT -= dt;
    if (this.walkT <= 0) {
      this.walkT = U.rand(0.8, 2.2);
      this.dir = U.pick(['down', 'up', 'left', 'right']);
    }
    const v = DIRS[this.dir];
    const ox = this.x, oy = this.y;
    this.move(v.x * this.speed * dt, v.y * this.speed * dt, dt);
    if (this.x === ox && this.y === oy && (v.x || v.y)) this.walkT = 0; // bumped a wall
    if (this.shootT <= 0 && this.distToPlayer() < 130) {
      this.shootT = U.rand(1.8, 3.2);
      // shoot along facing
      Game.projectiles.push(new Projectile(this.cx(), this.cy(), v.x * 130, v.y * 130, {
        sprite: 'rock_proj', owner: 'enemy', damage: 0.5
      }));
    }
  }
}

// ------------------------------------------------------------
// 2. MOBLIN — patrols, charges the player on sight
// ------------------------------------------------------------
class Moblin extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 3, touchDmg: 1, sprite: 'moblin', speed: 34, w: 12, h: 13 });
    this.wanderA = U.rand(0, 7);
    this.turnT = U.rand(1, 3);
  }
  update(dt) {
    this.baseUpdate(dt);
    const d = this.distToPlayer();
    if (d < 90) {
      const a = this.angleToPlayer();
      this.move(Math.cos(a) * this.speed * 1.5 * dt, Math.sin(a) * this.speed * 1.5 * dt, dt);
    } else {
      this.turnT -= dt;
      if (this.turnT <= 0) { this.turnT = U.rand(1, 3); this.wanderA = U.rand(0, Math.PI * 2); }
      this.move(Math.cos(this.wanderA) * this.speed * 0.5 * dt, Math.sin(this.wanderA) * this.speed * 0.5 * dt, dt);
    }
  }
}

// ------------------------------------------------------------
// 3. KEESE — erratic bat, swoops at player
// ------------------------------------------------------------
class Keese extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 1, touchDmg: 0.5, sprite: 'keese', speed: 55, flying: true, w: 12, h: 8 });
    this.resting = true;
    this.restT = U.rand(0.5, 2);
    this.wave = U.rand(0, 7);
  }
  update(dt) {
    this.baseUpdate(dt);
    this.wave += dt * 6;
    this.restT -= dt;
    if (this.resting) {
      if ((this.restT <= 0 && this.distToPlayer() < 130) || this.distToPlayer() < 60) { this.resting = false; this.restT = U.rand(2, 4); }
    } else {
      if (this.restT <= 0) { this.resting = true; this.restT = U.rand(0.8, 2); }
      // swoop at the player when near; flutter aimlessly when far
      const a = this.distToPlayer() < 130
        ? this.angleToPlayer() + Math.sin(this.wave) * 0.8
        : this.wave;
      this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt, dt);
    }
  }
  draw(ctx) {
    const frame = this.resting ? 1 : Math.floor(this.animT * 10) % 2;
    this.drawSprite(ctx, frame, { oy: -1 });
  }
}

// ------------------------------------------------------------
// 4. STALFOS — relentless skeleton
// ------------------------------------------------------------
class Stalfos extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 4, touchDmg: 1, sprite: 'stalfos', speed: 30, w: 12, h: 13 });
    this.jinkT = 0;
    this.jink = 0;
  }
  update(dt) {
    this.baseUpdate(dt);
    this.jinkT -= dt;
    if (this.jinkT <= 0) { this.jinkT = U.rand(0.6, 1.4); this.jink = U.rand(-0.9, 0.9); }
    if (this.distToPlayer() < 150) {
      const a = this.angleToPlayer() + this.jink;
      this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt, dt);
    }
  }
}

// ------------------------------------------------------------
// 5. CHU — hopping slime
// ------------------------------------------------------------
class Chu extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 2, touchDmg: 0.5, sprite: 'chu', speed: 90 });
    this.hopT = U.rand(0.5, 1.5);
    this.hopping = 0;
    this.hopA = 0;
  }
  update(dt) {
    this.baseUpdate(dt);
    if (this.hopping > 0) {
      this.hopping -= dt;
      this.move(Math.cos(this.hopA) * this.speed * dt, Math.sin(this.hopA) * this.speed * dt, dt);
    } else {
      this.hopT -= dt;
      if (this.hopT <= 0) {
        this.hopT = U.rand(0.7, 1.6);
        this.hopping = 0.35;
        this.hopA = this.distToPlayer() < 110 ? this.angleToPlayer() + U.rand(-0.3, 0.3) : U.rand(0, Math.PI * 2);
      }
    }
  }
  draw(ctx) {
    this.drawSprite(ctx, this.hopping > 0 ? 0 : 1);
  }
}

// ------------------------------------------------------------
// 6. LEEVER — burrows, surfaces near the player
// ------------------------------------------------------------
class Leever extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 2, touchDmg: 1, sprite: 'leever', speed: 40 });
    this.state = 'buried';
    this.stateT = U.rand(1, 3);
  }
  invulnerable() { return this.state === 'buried'; }
  update(dt) {
    this.animT += dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    this.stateT -= dt;
    this.noContact = this.state === 'buried';
    this.baseUpdate(0); // touch check only (dt consumed above)
    if (this.state === 'buried') {
      if (this.stateT <= 0 && this.distToPlayer() < 120) {
        // surface near player
        const pl = Game.player;
        const a = U.rand(0, Math.PI * 2);
        const nx = pl.cx() + Math.cos(a) * 50 - this.w / 2;
        const ny = pl.cy() + Math.sin(a) * 50 - this.h / 2;
        if (!Game.solidAtRect({ x: nx, y: ny, w: this.w, h: this.h })) { this.x = nx; this.y = ny; }
        this.state = 'surfacing';
        this.stateT = 0.5;
        Particles.burst(this.cx(), this.cy(), 8, { color: ['#d8c078', '#b89e62'], life: 0.4 });
      }
    } else if (this.state === 'surfacing') {
      if (this.stateT <= 0) { this.state = 'up'; this.stateT = U.rand(2, 3.5); }
    } else { // up — chase
      const a = this.angleToPlayer();
      this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt, dt);
      if (this.stateT <= 0) {
        this.state = 'buried';
        this.stateT = U.rand(1.5, 3);
        Particles.burst(this.cx(), this.cy(), 6, { color: ['#d8c078'], life: 0.3 });
      }
    }
  }
  draw(ctx) {
    if (this.state === 'buried') return;
    if (this.state === 'surfacing') {
      ctx.globalAlpha = 0.6;
      this.drawSprite(ctx, 1);
      ctx.globalAlpha = 1;
      return;
    }
    this.drawSprite(ctx, Math.floor(this.animT * 6) % 2);
  }
}

// ------------------------------------------------------------
// 7. WIZZROBE — teleports and casts magic bolts
// ------------------------------------------------------------
class Wizzrobe extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 3, touchDmg: 1, sprite: 'wizzrobe', speed: 0 });
    this.state = 'hidden';
    this.stateT = U.rand(0.5, 1.5);
    this.homeX = x; this.homeY = y;
  }
  invulnerable() { return this.state === 'hidden'; }
  update(dt) {
    this.animT += dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    this.stateT -= dt;
    this.noContact = this.state === 'hidden';
    this.baseUpdate(0);
    if (this.state === 'hidden') {
      if (this.stateT <= 0 && this.distToPlayer() < 160) {
        // teleport somewhere near home / player
        for (let tries = 0; tries < 8; tries++) {
          const a = U.rand(0, Math.PI * 2);
          const r = U.rand(40, 80);
          const nx = Game.player.cx() + Math.cos(a) * r - 6;
          const ny = Game.player.cy() + Math.sin(a) * r - 6;
          if (!Game.solidAtRect({ x: nx, y: ny, w: this.w, h: this.h })) {
            this.x = nx; this.y = ny;
            break;
          }
        }
        this.state = 'appearing';
        this.stateT = 0.4;
        Particles.burst(this.cx(), this.cy(), 8, { color: ['#c858e8', '#8830b0'], life: 0.4 });
      }
    } else if (this.state === 'appearing') {
      if (this.stateT <= 0) { this.state = 'visible'; this.stateT = 1.4; this.shot = false; }
    } else { // visible: shoot once mid-window then vanish
      if (!this.shot && this.stateT < 0.9) {
        this.shot = true;
        const a = this.angleToPlayer();
        Game.projectiles.push(new Projectile(this.cx(), this.cy(), Math.cos(a) * 120, Math.sin(a) * 120, {
          sprite: 'magic_bolt', owner: 'enemy', damage: 1, ignoreWalls: true
        }));
        AudioSys.sfx('charge');
      }
      if (this.stateT <= 0) {
        this.state = 'hidden';
        this.stateT = U.rand(1, 2.2);
        Particles.burst(this.cx(), this.cy(), 8, { color: ['#c858e8'], life: 0.4 });
      }
    }
  }
  draw(ctx) {
    if (this.state === 'hidden') return;
    const alpha = this.state === 'appearing' ? 0.5 : 1;
    if (alpha < 1) ctx.globalAlpha = alpha;
    this.drawSprite(ctx, Math.floor(this.animT * 4) % 2);
    if (alpha < 1) ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------
// 8. DARKNUT — armored juggernaut; arrows bounce off
// ------------------------------------------------------------
class Darknut extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 6, touchDmg: 1.5, sprite: 'darknut', speed: 22, w: 13, h: 14 });
  }
  hurt(dmg, source) {
    if (source instanceof Projectile) {
      AudioSys.sfx('hit');
      FloatText.add(this.cx(), this.y - 4, 'CLANK', '#a8b0c8');
      return;
    }
    super.hurt(dmg, source);
  }
  update(dt) {
    this.baseUpdate(dt);
    if (this.distToPlayer() < 140) {
      const a = this.angleToPlayer();
      this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt, dt);
    }
  }
}

// ------------------------------------------------------------
// 9. PEAHAT — flies in loops; vulnerable only when landed
// ------------------------------------------------------------
class Peahat extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 2, touchDmg: 0.5, sprite: 'peahat', speed: 50, flying: true });
    this.state = 'fly';
    this.stateT = U.rand(2, 4);
    this.a = U.rand(0, 7);
    this.turn = U.rand(-1.5, 1.5);
  }
  invulnerable() { return this.state === 'fly'; }
  update(dt) {
    this.baseUpdate(dt);
    this.stateT -= dt;
    if (this.state === 'fly') {
      this.a += this.turn * dt;
      const spd = Math.min(1, this.stateT) * this.speed; // slow before landing
      this.move(Math.cos(this.a) * spd * dt, Math.sin(this.a) * spd * dt, dt);
      if (this.stateT <= 0) { this.state = 'rest'; this.stateT = U.rand(1.5, 2.5); }
    } else {
      if (this.stateT <= 0) { this.state = 'fly'; this.stateT = U.rand(2.5, 4.5); this.turn = U.rand(-1.5, 1.5); }
    }
  }
  draw(ctx) {
    const frame = this.state === 'fly' ? Math.floor(this.animT * 12) % 2 : 0;
    this.drawSprite(ctx, frame);
  }
}

// ------------------------------------------------------------
// 10. ZORA — surfaces in water, spits fireballs
// ------------------------------------------------------------
class Zora extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 2, touchDmg: 1, sprite: 'zora', speed: 0 });
    this.state = 'under';
    this.stateT = U.rand(1, 3);
    this.homeX = x; this.homeY = y;
  }
  invulnerable() { return this.state === 'under'; }
  update(dt) {
    this.animT += dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    this.stateT -= dt;
    this.noContact = true; // in water, player can't touch
    if (this.state === 'under') {
      if (this.stateT <= 0 && this.distToPlayer() < 150) {
        // pop up at a random water tile near home
        for (let tries = 0; tries < 10; tries++) {
          const nx = this.homeX + U.rand(-40, 40);
          const ny = this.homeY + U.rand(-40, 40);
          const tid = Game.tileAt(Math.floor(nx / 16), Math.floor(ny / 16));
          if (Tiles.isWater(tid)) { this.x = nx; this.y = ny; break; }
        }
        this.state = 'up';
        this.stateT = 2;
        this.shot = false;
        AudioSys.sfx('splash');
        Particles.burst(this.cx(), this.cy(), 6, { color: ['#78a8e8', '#b8d8f8'], life: 0.4 });
      }
    } else {
      if (!this.shot && this.stateT < 1.4) {
        this.shot = true;
        const a = this.angleToPlayer();
        Game.projectiles.push(new Projectile(this.cx(), this.cy(), Math.cos(a) * 110, Math.sin(a) * 110, {
          sprite: 'fireball', owner: 'enemy', damage: 1, ignoreWalls: true
        }));
        AudioSys.sfx('fire');
      }
      if (this.stateT <= 0) {
        this.state = 'under';
        this.stateT = U.rand(1.5, 3);
        Particles.burst(this.cx(), this.cy(), 6, { color: ['#78a8e8'], life: 0.4 });
      }
    }
  }
  draw(ctx) {
    if (this.state === 'under') return;
    this.drawSprite(ctx, Math.floor(this.animT * 3) % 2);
  }
}

// ------------------------------------------------------------
// 11. ARMOS — dormant statue that awakens
// ------------------------------------------------------------
class Armos extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 3, touchDmg: 1, sprite: 'armos', speed: 48, w: 13, h: 14 });
    this.awake = false;
  }
  hurt(dmg, source) {
    if (!this.awake) { this.wake(); return; }
    super.hurt(dmg, source);
  }
  wake() {
    if (this.awake) return;
    this.awake = true;
    AudioSys.sfx('secret');
    Game.shake(3, 0.2);
    Particles.burst(this.cx(), this.cy(), 8, { color: ['#9a9aa8', '#6a6a78'], life: 0.4 });
  }
  update(dt) {
    this.baseUpdate(dt);
    if (!this.awake) {
      if (this.distToPlayer() < 22) this.wake();
      return;
    }
    const a = this.angleToPlayer();
    this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt, dt);
  }
  draw(ctx) {
    this.drawSprite(ctx, this.awake ? 1 : 0);
  }
}

// ------------------------------------------------------------
// 12. POE — circling ghost, fades in and out
// ------------------------------------------------------------
class Poe extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 3, touchDmg: 1, sprite: 'poe', speed: 42, flying: true });
    this.phase = U.rand(0, 7);
    this.orbit = U.rand(30, 50);
  }
  visible() { return (Math.sin(this.animT * 1.2 + this.phase) + 1) / 2 > 0.25; }
  invulnerable() { return !this.visible(); }
  update(dt) {
    this.baseUpdate(dt);
    this.noContact = !this.visible();
    const pl = Game.player;
    if (this.distToPlayer() < 160 && pl) {
      // spiral in toward player
      const a = this.angleToPlayer();
      const tangent = a + Math.PI / 2;
      const d = this.distToPlayer();
      const inward = d > this.orbit ? 0.8 : -0.3;
      this.move(
        (Math.cos(a) * inward + Math.cos(tangent) * 0.7) * this.speed * dt,
        (Math.sin(a) * inward + Math.sin(tangent) * 0.7) * this.speed * dt, dt);
    }
  }
  draw(ctx) {
    const vis = (Math.sin(this.animT * 1.2 + this.phase) + 1) / 2;
    const alpha = U.clamp(vis * 1.4, 0.06, 1);
    const bob = Math.sin(this.animT * 3) * 2;
    ctx.globalAlpha = alpha;
    if (this.hurtT > 0.12) Sprites.drawFlash(ctx, this.sprite, 0, this.x - 2, this.y - 3 + bob, this.flip);
    else Sprites.draw(ctx, this.sprite, Math.floor(this.animT * 4) % 2, this.x - 2, this.y - 3 + bob, { flip: this.flip });
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------
// 13. WOLFOS — circles its prey, then lunges
// ------------------------------------------------------------
class Wolfos extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 3, touchDmg: 1, sprite: 'wolfos', speed: 46, w: 13, h: 12 });
    this.state = 'prowl';
    this.stateT = U.rand(1.5, 3);
    this.lungeA = 0;
    this.wanderA = U.rand(0, Math.PI * 2);
  }
  update(dt) {
    this.baseUpdate(dt);
    this.stateT -= dt;
    const d = this.distToPlayer();
    if (this.state === 'prowl') {
      if (d < 130) {
        // circle the player, drifting inward
        const a = this.angleToPlayer();
        const tangent = a + Math.PI / 2;
        const inward = d > 60 ? 0.6 : -0.2;
        this.move(
          (Math.cos(a) * inward + Math.cos(tangent) * 0.8) * this.speed * dt,
          (Math.sin(a) * inward + Math.sin(tangent) * 0.8) * this.speed * dt, dt);
        if (this.stateT <= 0 && d < 110) {
          this.state = 'lunge';
          this.stateT = 0.45;
          this.lungeA = this.angleToPlayer();
          AudioSys.sfx('charge');
        }
      } else {
        if (Math.random() < 0.01) this.wanderA = U.rand(0, Math.PI * 2);
        this.move(Math.cos(this.wanderA) * this.speed * 0.4 * dt, Math.sin(this.wanderA) * this.speed * 0.4 * dt, dt);
        if (this.stateT <= 0) this.stateT = U.rand(1.5, 3);
      }
    } else if (this.state === 'lunge') {
      const ox = this.x, oy = this.y;
      this.move(Math.cos(this.lungeA) * 165 * dt, Math.sin(this.lungeA) * 165 * dt, dt);
      if ((this.x === ox && this.y === oy) || this.stateT <= 0) { this.state = 'rest'; this.stateT = 0.6; }
    } else { // rest — catch breath
      if (this.stateT <= 0) { this.state = 'prowl'; this.stateT = U.rand(1.2, 2.4); }
    }
  }
  draw(ctx) {
    const frame = this.state === 'lunge' ? 1 : Math.floor(this.animT * 6) % 2;
    this.drawSprite(ctx, frame);
  }
}

// ------------------------------------------------------------
// 14. FREEZARD — stationary ice turret, breathes shard spreads
// ------------------------------------------------------------
class Freezard extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 4, touchDmg: 1, sprite: 'freezard', speed: 0, w: 13, h: 12 });
    this.shootT = U.rand(1, 2.2);
  }
  update(dt) {
    this.baseUpdate(dt);
    this.shootT -= dt;
    if (this.shootT <= 0 && this.distToPlayer() < 150) {
      this.shootT = U.rand(1.8, 2.8);
      const base = this.angleToPlayer();
      for (let i = -1; i <= 1; i++) {
        const a = base + i * 0.32;
        Game.projectiles.push(new Projectile(this.cx(), this.cy(), Math.cos(a) * 105, Math.sin(a) * 105, {
          sprite: 'ice_proj', owner: 'enemy', damage: 0.5
        }));
      }
      AudioSys.sfx('fire');
      Particles.burst(this.cx(), this.cy() - 3, 5, { color: ['#b8e8f8', '#e8f6fc'], life: 0.35 });
    }
  }
  draw(ctx) {
    this.drawSprite(ctx, Math.floor(this.animT * 2) % 2);
  }
}

// ------------------------------------------------------------
// 15. BLADE TRAP — invulnerable slider; dodge it, don't fight it
// ------------------------------------------------------------
class BladeTrap extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 99, touchDmg: 1, sprite: 'blade_trap', speed: 175, w: 13, h: 13 });
    this.homeX = x; this.homeY = y;
    this.state = 'idle';
    this.ax = 0; this.ay = 0;
    this.pauseT = 0;
  }
  invulnerable() { return true; }
  update(dt) {
    this.baseUpdate(dt);
    const pl = Game.player;
    if (!pl) return;
    if (this.state === 'idle') {
      const dx = pl.cx() - this.cx(), dy = pl.cy() - this.cy();
      if (Math.abs(dy) < 7 && Math.abs(dx) < 110) { this.state = 'attack'; this.ax = Math.sign(dx); this.ay = 0; AudioSys.sfx('sword'); }
      else if (Math.abs(dx) < 7 && Math.abs(dy) < 110) { this.state = 'attack'; this.ax = 0; this.ay = Math.sign(dy); AudioSys.sfx('sword'); }
    } else if (this.state === 'attack') {
      const ox = this.x, oy = this.y;
      this.move(this.ax * this.speed * dt, this.ay * this.speed * dt, dt);
      if (this.x === ox && this.y === oy) { this.state = 'pause'; this.pauseT = 0.5; Game.shake(2, 0.1); AudioSys.sfx('hit'); }
    } else if (this.state === 'pause') {
      this.pauseT -= dt;
      if (this.pauseT <= 0) this.state = 'return';
    } else { // return home slowly
      const a = U.angle(this.x, this.y, this.homeX, this.homeY);
      this.x = U.approach(this.x, this.homeX, Math.abs(Math.cos(a)) * 40 * dt);
      this.y = U.approach(this.y, this.homeY, Math.abs(Math.sin(a)) * 40 * dt);
      if (Math.abs(this.x - this.homeX) < 1 && Math.abs(this.y - this.homeY) < 1) {
        this.x = this.homeX; this.y = this.homeY;
        this.state = 'idle';
      }
    }
  }
  draw(ctx) {
    const frame = this.state === 'attack' ? Math.floor(this.animT * 16) % 2 : 0;
    this.drawSprite(ctx, frame, { oy: -1 });
  }
}

// ------------------------------------------------------------
// 16. GIBDO — shambling mummy; flame unravels it
// ------------------------------------------------------------
class Gibdo extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 6, touchDmg: 1.5, sprite: 'gibdo', speed: 18, w: 12, h: 13 });
  }
  hurt(dmg, source) {
    if (source instanceof Projectile && source.burns) {
      // bandages catch fire
      Particles.burst(this.cx(), this.cy(), 10, { color: ['#f8a030', '#f8e060', '#e85818'], life: 0.5 });
      super.hurt(dmg * 3, source);
      return;
    }
    super.hurt(dmg, source);
  }
  update(dt) {
    this.baseUpdate(dt);
    if (this.distToPlayer() < 150) {
      const a = this.angleToPlayer();
      this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt, dt);
    }
  }
  draw(ctx) {
    this.drawSprite(ctx, Math.floor(this.animT * 3) % 2);
  }
}

// ------------------------------------------------------------
// 17. VULTURE — circles high, then dives at the player
// ------------------------------------------------------------
class Vulture extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 2, touchDmg: 1, sprite: 'vulture', speed: 60, flying: true, w: 13, h: 9 });
    this.state = 'circle';
    this.stateT = U.rand(1.5, 3);
    this.a = U.rand(0, Math.PI * 2);
    this.diveA = 0;
  }
  update(dt) {
    this.baseUpdate(dt);
    this.stateT -= dt;
    if (this.state === 'circle') {
      this.a += 1.3 * dt;
      const d = this.distToPlayer();
      const drift = d > 90 ? 0.5 : 0;
      const pa = this.angleToPlayer();
      this.move(
        (Math.cos(this.a) + Math.cos(pa) * drift) * this.speed * 0.7 * dt,
        (Math.sin(this.a) + Math.sin(pa) * drift) * this.speed * 0.7 * dt, dt);
      if (this.stateT <= 0 && d < 120) {
        this.state = 'dive';
        this.stateT = 0.6;
        this.diveA = this.angleToPlayer();
        AudioSys.sfx('charge');
      } else if (this.stateT <= 0) this.stateT = U.rand(1, 2);
    } else if (this.state === 'dive') {
      this.move(Math.cos(this.diveA) * 150 * dt, Math.sin(this.diveA) * 150 * dt, dt);
      if (this.stateT <= 0) { this.state = 'climb'; this.stateT = 0.8; }
    } else { // climb away
      this.move(-Math.cos(this.diveA) * 45 * dt, -Math.sin(this.diveA) * 45 * dt, dt);
      if (this.stateT <= 0) { this.state = 'circle'; this.stateT = U.rand(1.5, 3); }
    }
  }
  draw(ctx) {
    const frame = this.state === 'dive' ? 1 : Math.floor(this.animT * 6) % 2;
    this.drawSprite(ctx, frame, { oy: -1 });
  }
}

// ------------------------------------------------------------
// 18. SANDWURM — burrows under the dunes, erupts with a telegraph
// ------------------------------------------------------------
class Sandwurm extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 4, touchDmg: 1.5, sprite: 'sandwurm', speed: 46, w: 12, h: 12 });
    this.state = 'buried';
    this.stateT = U.rand(1, 3);
  }
  invulnerable() { return this.state === 'buried' || this.state === 'rising'; }
  update(dt) {
    this.animT += dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    this.stateT -= dt;
    this.noContact = this.state !== 'up';
    this.baseUpdate(0);
    if (this.state === 'buried') {
      if (this.stateT <= 0 && this.distToPlayer() < 140) {
        // surface ahead of the player's position
        const pl = Game.player;
        const nx = pl.cx() + U.rand(-30, 30) - this.w / 2;
        const ny = pl.cy() + U.rand(-30, 30) - this.h / 2;
        if (!Game.solidAtRect({ x: nx, y: ny, w: this.w, h: this.h })) { this.x = nx; this.y = ny; }
        this.state = 'rising';
        this.stateT = 0.7;
      }
    } else if (this.state === 'rising') {
      // telegraph: churning sand
      if (Math.floor(this.stateT * 12) % 2) {
        Particles.spawn(this.cx() + U.rand(-6, 6), this.y + this.h, { vx: U.rand(-15, 15), vy: -25, g: 60, life: 0.4, color: U.pick(['#d6c082', '#c8a868']), size: 2 });
      }
      if (this.stateT <= 0) { this.state = 'up'; this.stateT = U.rand(1.8, 2.8); AudioSys.sfx('hit'); }
    } else { // up — snap toward the player
      const a = this.angleToPlayer();
      this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt, dt);
      if (this.stateT <= 0) {
        this.state = 'buried';
        this.stateT = U.rand(1.5, 3);
        Particles.burst(this.cx(), this.cy(), 8, { color: ['#d6c082', '#c8a868'], life: 0.4 });
      }
    }
  }
  draw(ctx) {
    if (this.state === 'buried' || this.state === 'rising') return;
    this.drawSprite(ctx, Math.floor(this.animT * 5) % 2);
  }
}

// ------------------------------------------------------------
// 19. GRIMROOT — a tree that was always watching; rooted, spits seeds
// ------------------------------------------------------------
class Grimroot extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 5, touchDmg: 1, sprite: 'grimroot', speed: 0, w: 13, h: 14 });
    this.awake = false;
    this.seedT = U.rand(1, 2);
  }
  hurt(dmg, source) {
    if (!this.awake) this.wake();
    super.hurt(dmg, source);
  }
  wake() {
    if (this.awake) return;
    this.awake = true;
    AudioSys.sfx('boss_roar');
    Game.shake(2, 0.2);
    Particles.burst(this.cx(), this.y + this.h, 10, { color: ['#3a2a50', '#241a2e', '#5c4478'], life: 0.5 });
  }
  update(dt) {
    this.noContact = !this.awake;
    this.baseUpdate(dt);
    if (!this.awake) {
      if (this.distToPlayer() < 26) this.wake();
      return;
    }
    this.seedT -= dt;
    if (this.seedT <= 0 && this.distToPlayer() < 140) {
      this.seedT = U.rand(1.6, 2.6);
      const base = this.angleToPlayer();
      for (let i = -1; i <= 1; i += 2) {
        const a = base + i * 0.18;
        Game.projectiles.push(new Projectile(this.cx(), this.cy() - 2, Math.cos(a) * 115, Math.sin(a) * 115, {
          sprite: 'rock_proj', owner: 'enemy', damage: 1
        }));
      }
      AudioSys.sfx('hit');
    }
  }
  draw(ctx) {
    this.drawSprite(ctx, this.awake ? 1 : 0, { oy: -2 });
  }
}

// ------------------------------------------------------------
// 20. VAMPIRE — materializes from bats, bites, dissolves to mist.
// Feeding on the hero knits its wounds closed.
// ------------------------------------------------------------
class Vampire extends Enemy {
  constructor(x, y) {
    super(x, y, { hp: 5, touchDmg: 1.5, sprite: 'vampire', speed: 78, flying: true, w: 12, h: 13 });
    this.state = 'hidden';
    this.stateT = U.rand(0.8, 2);
    this.homeX = x; this.homeY = y;
  }
  invulnerable() { return this.state !== 'hunt'; }
  update(dt) {
    this.animT += dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    this.stateT -= dt;
    this.noContact = this.state !== 'hunt';
    this.baseUpdate(0);
    const pl = Game.player;
    if (this.state === 'hidden') {
      if (this.stateT <= 0 && this.distToPlayer() < 170) {
        // wings out of the dark
        const a = U.rand(0, Math.PI * 2);
        const nx = pl.cx() + Math.cos(a) * U.rand(45, 70) - this.w / 2;
        const ny = pl.cy() + Math.sin(a) * U.rand(45, 70) - this.h / 2;
        if (!Game.solidAtRect({ x: nx, y: ny, w: this.w, h: this.h })) { this.x = nx; this.y = ny; }
        this.state = 'materialize';
        this.stateT = 0.45;
        Particles.burst(this.cx(), this.cy(), 12, { color: ['#1c1424', '#2e2438', '#802030'], life: 0.5, speedMax: 60 });
        AudioSys.sfx('charge');
      }
    } else if (this.state === 'materialize') {
      if (this.stateT <= 0) { this.state = 'hunt'; this.stateT = 1.7; }
    } else if (this.state === 'hunt') {
      const a = this.angleToPlayer();
      this.move(Math.cos(a) * this.speed * dt, Math.sin(a) * this.speed * dt, dt);
      // feeding closes old wounds
      if (pl && U.overlap(this.rect(), pl.rect()) && this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + 2 * dt);
      }
      if (this.stateT <= 0) {
        this.state = 'mist';
        this.stateT = 0.4;
        Particles.burst(this.cx(), this.cy(), 10, { color: ['#c8c8d8', '#8888a0'], life: 0.6, speedMax: 30 });
      }
    } else { // mist
      if (this.stateT <= 0) { this.state = 'hidden'; this.stateT = U.rand(1.2, 2.4); }
    }
  }
  draw(ctx) {
    if (this.state === 'hidden') return;
    const alpha = this.state === 'materialize' ? 0.5 : this.state === 'mist' ? 0.25 : 1;
    if (alpha < 1) ctx.globalAlpha = alpha;
    this.drawSprite(ctx, this.state === 'materialize' ? 1 : Math.floor(this.animT * 4) % 2);
    if (alpha < 1) ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------
// ELITES — named minibosses that roam the wilds. Bigger, meaner,
// and they always pay out.
// ------------------------------------------------------------
function eliteDraw(e, ctx, frame, scale) {
  const arr = e.flip ? Sprites.flipCache[e.sprite] : Sprites.cache[e.sprite];
  if (!arr) return;
  const cv = arr[frame % arr.length];
  if (e.hurtT > 0.12) ctx.globalAlpha = 0.55;
  ctx.drawImage(cv, Math.round(e.cx() - cv.width * scale / 2), Math.round(e.y + e.h - cv.height * scale + 2), cv.width * scale, cv.height * scale);
  ctx.globalAlpha = 1;
  // name banner when close
  if (e.distToPlayer() < 100) {
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000a';
    ctx.fillText(e.elite, e.cx() + 1, e.y - 5 + 1);
    ctx.fillStyle = '#f8b8b8';
    ctx.fillText(e.elite, e.cx(), e.y - 5);
    ctx.textAlign = 'left';
  }
}

function eliteDrops(e) {
  Game.pickups.push(new Pickup(e.cx(), e.cy(), 'fairy'));
  Game.pickups.push(new Pickup(e.cx() - 10, e.cy() + 4, 'rupee20'));
  Game.pickups.push(new Pickup(e.cx() + 10, e.cy() + 4, 'rupee20'));
}

// DIREWOLF ALPHA — the pack answers to it
class Direwolf extends Wolfos {
  constructor(x, y) {
    super(x, y);
    this.hp = this.maxHp = 10;
    this.touchDmg = 1.5;
    this.speed = 56;
    this.w = 15; this.h = 14;
    this.elite = 'DIREWOLF ALPHA';
  }
  die() { super.die(); eliteDrops(this); }
  draw(ctx) {
    const frame = this.state === 'lunge' ? 1 : Math.floor(this.animT * 6) % 2;
    eliteDraw(this, ctx, frame, 1.45);
  }
}

// DUNE TYRANT — the wurm the other wurms fear
class Dunetyrant extends Sandwurm {
  constructor(x, y) {
    super(x, y);
    this.hp = this.maxHp = 12;
    this.touchDmg = 2;
    this.speed = 55;
    this.w = 15; this.h = 15;
    this.elite = 'DUNE TYRANT';
  }
  die() { super.die(); eliteDrops(this); }
  draw(ctx) {
    if (this.state === 'buried' || this.state === 'rising') return;
    eliteDraw(this, ctx, Math.floor(this.animT * 5) % 2, 1.5);
  }
}

// HIGHLAND OGRE — a moblin that never stopped growing
class Ogre extends Moblin {
  constructor(x, y) {
    super(x, y);
    this.hp = this.maxHp = 14;
    this.touchDmg = 2;
    this.speed = 26;
    this.w = 16; this.h = 16;
    this.elite = 'HIGHLAND OGRE';
    this.rockT = U.rand(1.5, 2.5);
  }
  update(dt) {
    super.update(dt);
    this.rockT -= dt;
    if (this.rockT <= 0 && this.distToPlayer() < 150) {
      this.rockT = U.rand(1.8, 2.8);
      const a = this.angleToPlayer();
      Game.projectiles.push(new Projectile(this.cx(), this.cy() - 4, Math.cos(a) * 120, Math.sin(a) * 120, {
        sprite: 'rock_proj', owner: 'enemy', damage: 1
      }));
      AudioSys.sfx('bow');
    }
  }
  die() { super.die(); eliteDrops(this); }
  draw(ctx) {
    eliteDraw(this, ctx, Math.floor(this.animT * 4) % 2, 1.5);
  }
}

// ------------------------------------------------------------
const ENEMY_TYPES = {
  octorok: Octorok, moblin: Moblin, keese: Keese, stalfos: Stalfos,
  chu: Chu, leever: Leever, wizzrobe: Wizzrobe, darknut: Darknut,
  peahat: Peahat, zora: Zora, armos: Armos, poe: Poe,
  wolfos: Wolfos, freezard: Freezard, blade_trap: BladeTrap,
  gibdo: Gibdo, vulture: Vulture, sandwurm: Sandwurm,
  direwolf: Direwolf, dunetyrant: Dunetyrant, ogre: Ogre,
  grimroot: Grimroot, vampire: Vampire
};

function spawnEnemy(type, tx, ty) {
  const Cls = ENEMY_TYPES[type];
  if (!Cls) return null;
  const e = new Cls(tx * 16 + 2, ty * 16 + 2);
  e.typeName = type;
  return e;
}
