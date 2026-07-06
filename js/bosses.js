// ============================================================
// bosses.js — boss base + Gloomspore, Magmadon, Wraithlord, the Shade
// ============================================================
'use strict';

class Boss extends Entity {
  constructor(x, y, opts) {
    super(x, y, opts.w || 28, opts.h || 24);
    this.name = opts.name;
    this.title = opts.title;
    this.sprite = opts.sprite;
    this.hp = opts.hp;
    this.maxHp = opts.hp;
    this.touchDmg = opts.touchDmg || 1;
    this.animT = 0;
    this.hurtT = 0;
    this.stateT = 0;
    this.dying = 0;
    this.introT = 3.2;  // intro cutscene duration
    this.flip = false;
    this.id = opts.id;
  }

  invulnerable() { return false; }

  hurt(dmg, source) {
    if (this.dead || this.dying > 0 || this.hurtT > 0 || Game.state === 'bossintro') return;
    if (this.invulnerable()) {
      AudioSys.sfx('hit');
      FloatText.add(this.cx(), this.y - 6, 'no effect', '#a8b0c8');
      return;
    }
    this.hp -= dmg;
    this.hurtT = 0.3;
    AudioSys.sfx('boss_hurt');
    FloatText.add(this.cx(), this.y - 6, String(dmg), '#f8e080');
    Game.shake(3, 0.15);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dying = 2.2;
      AudioSys.sfx('boss_roar');
      AudioSys.stop();
    }
  }

  baseUpdate(dt) {
    this.animT += dt;
    if (this.hurtT > 0) this.hurtT -= dt;

    if (this.dying > 0) {
      this.dying -= dt;
      if (Math.random() < 0.35) {
        Particles.burst(this.x + U.rand(0, this.w), this.y + U.rand(0, this.h), 8, {
          color: ['#f8a030', '#f8e060', '#fff', '#e85818'], life: 0.5, speedMax: 90
        });
        AudioSys.sfx('explosion');
        Game.shake(4, 0.2);
      }
      if (this.dying <= 0) {
        this.dead = true;
        Particles.burst(this.cx(), this.cy(), 40, { color: ['#fff', '#f8e060', '#f8a030'], life: 1, speedMax: 150 });
        AudioSys.sfx('kill');
        Story.onBossDefeated(this.id, this.cx(), this.cy());
        if (this.id !== 'shade') {
          AudioSys.play(Game.map.music);
        }
      }
      return false; // skip AI while dying
    }

    // touch damage
    const pl = Game.player;
    if (pl && U.overlap(this.rect(), pl.rect())) pl.damage(this.touchDmg, this);
    return true;
  }

  shootRing(count, speed, spriteName, offset = 0) {
    for (let i = 0; i < count; i++) {
      const a = offset + (i / count) * Math.PI * 2;
      Game.projectiles.push(new Projectile(this.cx(), this.cy(), Math.cos(a) * speed, Math.sin(a) * speed, {
        sprite: spriteName, owner: 'enemy', damage: 1, ignoreWalls: true, life: 4
      }));
    }
  }

  shootSpread(count, speed, spriteName, spreadRad = 0.5) {
    const base = U.angle(this.cx(), this.cy(), Game.player.cx(), Game.player.cy());
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * spreadRad;
      Game.projectiles.push(new Projectile(this.cx(), this.cy(), Math.cos(a) * speed, Math.sin(a) * speed, {
        sprite: spriteName, owner: 'enemy', damage: 1, ignoreWalls: true, life: 4
      }));
    }
  }

  angleToPlayer() { return U.angle(this.cx(), this.cy(), Game.player.cx(), Game.player.cy()); }
  distToPlayer() { return U.dist(this.cx(), this.cy(), Game.player.cx(), Game.player.cy()); }

  moveToward(a, speed, dt) {
    Game.moveEntity(this, Math.cos(a) * speed * dt, Math.sin(a) * speed * dt);
  }

  drawSprite(ctx, frame) {
    const flicker = this.dying > 0 && Math.floor(this.dying * 14) % 2 === 0;
    if (this.hurtT > 0.15 || flicker) {
      Sprites.drawFlash(ctx, this.sprite, frame, this.x + (this.w - 32) / 2, this.y + this.h - 30, this.flip);
    } else {
      Sprites.draw(ctx, this.sprite, frame, this.x + (this.w - 32) / 2, this.y + this.h - 30, { flip: this.flip });
    }
  }

  draw(ctx) {
    // shadow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.cx(), this.y + this.h - 2, this.w / 2, 4, 0, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
    this.drawSprite(ctx, Math.floor(this.animT * 3) % 2);
  }
}

// ------------------------------------------------------------
// GLOOMSPORE — Blight of the Verdant Temple
// ------------------------------------------------------------
class Gloomspore extends Boss {
  constructor(x, y) {
    super(x, y, {
      id: 'gloomspore', name: 'GLOOMSPORE', title: 'Blight of the Verdant Temple',
      sprite: 'boss_gloomspore', hp: 18, touchDmg: 1, w: 28, h: 24
    });
    this.mode = 'wander';
    this.stateT = 2;
    this.wanderA = 0;
  }

  update(dt) {
    if (!this.baseUpdate(dt)) return;
    this.stateT -= dt;
    switch (this.mode) {
      case 'wander': {
        if (this.stateT <= 0) {
          const minions = Game.enemies.filter(e => !e.dead).length;
          this.mode = (minions < 3 && Math.random() < 0.4) ? 'summon' : 'burst';
          this.stateT = this.mode === 'summon' ? 0.8 : 1.0;
          AudioSys.sfx('charge');
        } else {
          if (Math.random() < 0.02) this.wanderA = this.angleToPlayer() + U.rand(-0.6, 0.6);
          this.moveToward(this.wanderA, 20, dt);
        }
        break;
      }
      case 'burst':
        if (this.stateT <= 0) {
          this.shootRing(8, 90, 'magic_bolt', this.animT);
          AudioSys.sfx('fire');
          Particles.burst(this.cx(), this.cy(), 10, { color: ['#b05898', '#e8c8e0'], life: 0.5 });
          this.mode = 'wander';
          this.stateT = U.rand(1.8, 2.6);
        }
        break;
      case 'summon':
        if (this.stateT <= 0) {
          for (let i = 0; i < 2; i++) {
            const e = spawnEnemy('chu', Math.floor(this.cx() / 16) + (i ? 1 : -1), Math.floor(this.y / 16) + 1);
            if (e) Game.enemies.push(e);
          }
          Particles.burst(this.cx(), this.y + this.h, 12, { color: ['#58c848', '#a8f098'], life: 0.5 });
          this.mode = 'wander';
          this.stateT = U.rand(2, 3);
        }
        break;
    }
  }
}

// ------------------------------------------------------------
// MAGMADON — Tyrant of the Ember Depths
// ------------------------------------------------------------
class Magmadon extends Boss {
  constructor(x, y) {
    super(x, y, {
      id: 'magmadon', name: 'MAGMADON', title: 'Tyrant of the Ember Depths',
      sprite: 'boss_magmadon', hp: 26, touchDmg: 1.5, w: 30, h: 24
    });
    this.mode = 'stalk';
    this.stateT = 2;
    this.chargeA = 0;
  }

  update(dt) {
    if (!this.baseUpdate(dt)) return;
    this.stateT -= dt;
    switch (this.mode) {
      case 'stalk':
        this.moveToward(this.angleToPlayer(), 18, dt);
        this.flip = Game.player.cx() < this.cx();
        if (this.stateT <= 0) {
          this.mode = Math.random() < 0.5 ? 'windup' : 'spit';
          this.stateT = this.mode === 'windup' ? 0.7 : 0.5;
          if (this.mode === 'windup') AudioSys.sfx('boss_roar');
        }
        break;
      case 'windup': // telegraph charge
        if (Math.floor(this.stateT * 10) % 2) Particles.spawn(this.cx() + U.rand(-10, 10), this.y + this.h, { color: '#f8a030', life: 0.3, vy: -20, g: 0 });
        if (this.stateT <= 0) {
          this.mode = 'charge';
          this.stateT = 1.0;
          this.chargeA = this.angleToPlayer();
        }
        break;
      case 'charge': {
        const ox = this.x, oy = this.y;
        this.moveToward(this.chargeA, 150, dt);
        Particles.spawn(this.cx(), this.y + this.h, { color: U.pick(['#f8a030', '#e85818']), life: 0.4, vy: -15, g: 0, size: 2 });
        if ((this.x === ox && this.y === oy) || this.stateT <= 0) { // hit wall or done
          if (this.x === ox && this.y === oy) { Game.shake(6, 0.3); AudioSys.sfx('explosion'); }
          this.mode = 'stalk';
          this.stateT = U.rand(1.5, 2.5);
        }
        break;
      }
      case 'spit':
        if (this.stateT <= 0) {
          this.shootSpread(3, 110, 'fireball', 0.45);
          AudioSys.sfx('fire');
          this.mode = 'stalk';
          this.stateT = U.rand(1.4, 2.2);
        }
        break;
    }
  }
}

// ------------------------------------------------------------
// WRAITHLORD — Sovereign of the Sunken Crypt
// ------------------------------------------------------------
class Wraithlord extends Boss {
  constructor(x, y) {
    super(x, y, {
      id: 'wraithlord', name: 'WRAITHLORD', title: 'Sovereign of the Sunken Crypt',
      sprite: 'boss_wraithlord', hp: 26, touchDmg: 1, w: 26, h: 26
    });
    this.mode = 'float';
    this.stateT = 2;
    this.alpha = 1;
    this.arena = null; // set on spawn
  }

  invulnerable() { return this.alpha < 0.4; }

  update(dt) {
    if (!this.baseUpdate(dt)) { this.alpha = 1; return; }
    this.stateT -= dt;
    switch (this.mode) {
      case 'float':
        this.alpha = U.approach(this.alpha, 1, dt * 2);
        this.moveToward(this.angleToPlayer(), 24, dt);
        if (this.stateT <= 0) {
          const r = Math.random();
          const poes = Game.enemies.filter(e => !e.dead).length;
          if (r < 0.4) { this.mode = 'spiral'; this.stateT = 0.6; AudioSys.sfx('charge'); }
          else if (r < 0.6 && poes < 2) { this.mode = 'summon'; this.stateT = 0.7; }
          else { this.mode = 'fade'; this.stateT = 2.0; }
        }
        break;
      case 'spiral':
        if (this.stateT <= 0) {
          this.shootRing(6, 80, 'magic_bolt', this.animT * 2);
          this.shootRing(6, 55, 'magic_bolt', this.animT * 2 + 0.5);
          AudioSys.sfx('fire');
          this.mode = 'float';
          this.stateT = U.rand(1.6, 2.4);
        }
        break;
      case 'summon':
        if (this.stateT <= 0) {
          const e = spawnEnemy('poe', Math.floor(this.cx() / 16), Math.floor(this.cy() / 16) + 1);
          if (e) Game.enemies.push(e);
          Particles.burst(this.cx(), this.cy(), 10, { color: ['#d8d8f0', '#8888b0'], life: 0.6 });
          this.mode = 'float';
          this.stateT = U.rand(1.5, 2.5);
        }
        break;
      case 'fade': // vanish + relocate behind player
        this.alpha = U.approach(this.alpha, 0.1, dt * 3);
        if (this.stateT <= 0) {
          const pl = Game.player;
          const a = U.rand(0, Math.PI * 2);
          const nx = pl.cx() + Math.cos(a) * 55 - this.w / 2;
          const ny = pl.cy() + Math.sin(a) * 55 - this.h / 2;
          if (!Game.solidAtRect({ x: nx, y: ny, w: this.w, h: this.h })) { this.x = nx; this.y = ny; }
          this.mode = 'float';
          this.stateT = U.rand(1, 1.6);
          AudioSys.sfx('warp');
        }
        break;
    }
  }

  draw(ctx) {
    ctx.globalAlpha = U.clamp(this.alpha, 0.1, 1);
    this.drawSprite(ctx, Math.floor(this.animT * 3) % 2);
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------
// THE SHADE — final boss, two phases
// ------------------------------------------------------------
class Shade extends Boss {
  constructor(x, y) {
    super(x, y, {
      id: 'shade', name: 'THE SHADE', title: 'Devourer of the Sunstone',
      sprite: 'boss_shade', hp: 40, touchDmg: 1.5, w: 28, h: 26
    });
    this.mode = 'float';
    this.stateT = 2;
    this.phase = 1;
    this.summoned = false;
  }

  update(dt) {
    if (!this.baseUpdate(dt)) return;

    // phase 2 transition
    if (this.phase === 1 && this.hp <= this.maxHp / 2) {
      this.phase = 2;
      AudioSys.sfx('boss_roar');
      AudioSys.play('finalboss');
      Game.shake(8, 0.6);
      Particles.burst(this.cx(), this.cy(), 30, { color: ['#e83048', '#8848c8', '#38284a'], life: 1, speedMax: 120 });
      Dialogue.start({
        speaker: 'The Shade',
        pages: ['ENOUGH. You want the sun so badly, little hero? Then BURN by shadow-fire instead!']
      });
      if (!this.summoned) {
        this.summoned = true;
        const e = spawnEnemy('darknut', Math.floor(this.cx() / 16) - 2, Math.floor(this.cy() / 16) + 2);
        if (e) Game.enemies.push(e);
      }
    }

    const speedMul = this.phase === 2 ? 1.5 : 1;
    this.stateT -= dt;

    switch (this.mode) {
      case 'float':
        this.moveToward(this.angleToPlayer(), 26 * speedMul, dt);
        this.flip = Game.player.cx() < this.cx();
        if (this.stateT <= 0) {
          const r = Math.random();
          if (r < 0.35) { this.mode = 'bolts'; this.stateT = 0.5; AudioSys.sfx('charge'); }
          else if (r < 0.6) { this.mode = 'teleport'; this.stateT = 0.4; }
          else { this.mode = 'dash_windup'; this.stateT = 0.5; AudioSys.sfx('boss_roar'); }
        }
        break;
      case 'bolts':
        if (this.stateT <= 0) {
          if (this.phase === 2) {
            this.shootRing(10, 95, 'magic_bolt', this.animT);
          } else {
            this.shootSpread(3, 120, 'magic_bolt', 0.4);
          }
          AudioSys.sfx('fire');
          this.mode = 'float';
          this.stateT = U.rand(1.2, 2) / speedMul;
        }
        break;
      case 'teleport':
        if (this.stateT <= 0) {
          Particles.burst(this.cx(), this.cy(), 12, { color: ['#38284a', '#8848c8'], life: 0.5 });
          const pl = Game.player;
          const a = U.rand(0, Math.PI * 2);
          const nx = pl.cx() + Math.cos(a) * 60 - this.w / 2;
          const ny = pl.cy() + Math.sin(a) * 60 - this.h / 2;
          if (!Game.solidAtRect({ x: nx, y: ny, w: this.w, h: this.h })) { this.x = nx; this.y = ny; }
          AudioSys.sfx('warp');
          Particles.burst(this.cx(), this.cy(), 12, { color: ['#38284a', '#8848c8'], life: 0.5 });
          this.mode = this.phase === 2 ? 'bolts' : 'float';
          this.stateT = this.phase === 2 ? 0.4 : U.rand(1, 1.6);
        }
        break;
      case 'dash_windup':
        if (this.stateT <= 0) {
          this.mode = 'dash';
          this.stateT = 0.7;
          this.dashA = this.angleToPlayer();
        }
        break;
      case 'dash': {
        const ox = this.x, oy = this.y;
        this.moveToward(this.dashA, 190 * speedMul, dt);
        Particles.spawn(this.cx(), this.cy(), { color: '#8848c8', life: 0.4, vx: 0, vy: 0, g: 0, size: 2 });
        if ((this.x === ox && this.y === oy) || this.stateT <= 0) {
          this.mode = 'float';
          this.stateT = U.rand(1.2, 2) / speedMul;
        }
        break;
      }
    }
  }

  draw(ctx) {
    // dark aura
    ctx.globalAlpha = 0.25 + 0.1 * Math.sin(this.animT * 4);
    ctx.fillStyle = this.phase === 2 ? '#c81838' : '#5a30a0';
    ctx.beginPath();
    ctx.arc(this.cx(), this.cy(), 22 + Math.sin(this.animT * 3) * 3, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
    super.draw(ctx);
  }
}

// ------------------------------------------------------------
// FROSTMAW — Jaws of the Glacier (optional boss, Glacier Hollow)
// ------------------------------------------------------------
class Frostmaw extends Boss {
  constructor(x, y) {
    super(x, y, {
      id: 'frostmaw', name: 'FROSTMAW', title: 'Jaws of the Glacier',
      sprite: 'boss_frostmaw', hp: 30, touchDmg: 1.5, w: 30, h: 24
    });
    this.mode = 'stalk';
    this.stateT = 2;
    this.chargeA = 0;
  }

  update(dt) {
    if (!this.baseUpdate(dt)) return;
    this.stateT -= dt;
    switch (this.mode) {
      case 'stalk':
        this.moveToward(this.angleToPlayer(), 20, dt);
        this.flip = Game.player.cx() < this.cx();
        if (this.stateT <= 0) {
          const r = Math.random();
          const turrets = Game.enemies.filter(e => !e.dead).length;
          if (r < 0.3) { this.mode = 'windup'; this.stateT = 0.7; AudioSys.sfx('boss_roar'); }
          else if (r < 0.55) { this.mode = 'breath'; this.stateT = 0.5; AudioSys.sfx('charge'); }
          else if (r < 0.75 && turrets < 2) { this.mode = 'summon'; this.stateT = 0.7; }
          else { this.mode = 'ring'; this.stateT = 0.6; AudioSys.sfx('charge'); }
        }
        break;
      case 'windup': // telegraph the charge with frost spray
        if (Math.floor(this.stateT * 10) % 2) Particles.spawn(this.cx() + U.rand(-10, 10), this.y + this.h, { color: '#b8e8f8', life: 0.3, vy: -18, g: 0 });
        if (this.stateT <= 0) {
          this.mode = 'charge';
          this.stateT = 1.0;
          this.chargeA = this.angleToPlayer();
        }
        break;
      case 'charge': {
        const ox = this.x, oy = this.y;
        this.moveToward(this.chargeA, 155, dt);
        Particles.spawn(this.cx(), this.y + this.h, { color: U.pick(['#b8e8f8', '#e8f6fc']), life: 0.4, vy: -12, g: 0, size: 2 });
        if ((this.x === ox && this.y === oy) || this.stateT <= 0) {
          if (this.x === ox && this.y === oy) { Game.shake(6, 0.3); AudioSys.sfx('explosion'); }
          this.mode = 'stalk';
          this.stateT = U.rand(1.4, 2.4);
        }
        break;
      }
      case 'breath':
        if (this.stateT <= 0) {
          this.shootSpread(5, 115, 'ice_proj', 0.3);
          AudioSys.sfx('fire');
          this.mode = 'stalk';
          this.stateT = U.rand(1.3, 2.2);
        }
        break;
      case 'ring':
        if (this.stateT <= 0) {
          this.shootRing(8, 85, 'ice_proj', this.animT);
          AudioSys.sfx('fire');
          Particles.burst(this.cx(), this.cy(), 10, { color: ['#b8e8f8', '#88b8d8'], life: 0.5 });
          this.mode = 'stalk';
          this.stateT = U.rand(1.6, 2.4);
        }
        break;
      case 'summon':
        if (this.stateT <= 0) {
          const tx = Math.floor(this.cx() / 16) + (Math.random() < 0.5 ? -2 : 2);
          const ty = Math.floor(this.y / 16) + 1;
          const e = spawnEnemy('freezard', tx, ty);
          if (e && Game.solidAtRect(e.rect())) {
            const spot = Game.findFreeTile(tx, ty, 3);
            if (spot) { e.x = spot.x * 16 + 2; e.y = spot.y * 16 + 2; }
          }
          if (e) Game.enemies.push(e);
          Particles.burst(this.cx(), this.y + this.h, 12, { color: ['#a8d8f0', '#e8f6fc'], life: 0.5 });
          this.mode = 'stalk';
          this.stateT = U.rand(1.8, 2.8);
        }
        break;
    }
  }
}

// ------------------------------------------------------------
// PHARAGHAST — the Hollow King (optional boss, Sandsear Tomb)
// ------------------------------------------------------------
class Pharaghast extends Boss {
  constructor(x, y) {
    super(x, y, {
      id: 'pharaghast', name: 'PHARAGHAST', title: 'The Hollow King',
      sprite: 'boss_pharaghast', hp: 32, touchDmg: 1.5, w: 28, h: 26
    });
    this.mode = 'glide';
    this.stateT = 2;
    this.alpha = 1;
  }

  invulnerable() { return this.alpha < 0.4; }

  hurt(dmg, source) {
    if (source instanceof Projectile && source.burns) {
      // old bandages, dry as tinder
      Particles.burst(this.cx(), this.cy(), 12, { color: ['#f8a030', '#f8e060', '#e85818'], life: 0.6 });
      super.hurt(dmg * 2, source);
      return;
    }
    super.hurt(dmg, source);
  }

  update(dt) {
    if (!this.baseUpdate(dt)) { this.alpha = 1; return; }
    this.stateT -= dt;
    switch (this.mode) {
      case 'glide':
        this.alpha = U.approach(this.alpha, 1, dt * 2);
        this.moveToward(this.angleToPlayer(), 22, dt);
        this.flip = Game.player.cx() < this.cx();
        if (this.stateT <= 0) {
          const r = Math.random();
          const servants = Game.enemies.filter(e => !e.dead).length;
          if (r < 0.3) { this.mode = 'volley'; this.stateT = 0.5; AudioSys.sfx('charge'); }
          else if (r < 0.5) { this.mode = 'ring'; this.stateT = 0.6; AudioSys.sfx('charge'); }
          else if (r < 0.7 && servants < 2) { this.mode = 'summon'; this.stateT = 0.8; }
          else { this.mode = 'sink'; this.stateT = 1.6; }
        }
        break;
      case 'volley':
        if (this.stateT <= 0) {
          this.shootSpread(4, 120, 'rock_proj', 0.35);
          AudioSys.sfx('fire');
          this.mode = 'glide';
          this.stateT = U.rand(1.3, 2.1);
        }
        break;
      case 'ring':
        if (this.stateT <= 0) {
          this.shootRing(9, 80, 'rock_proj', this.animT);
          AudioSys.sfx('fire');
          Particles.burst(this.cx(), this.cy(), 10, { color: ['#d6c082', '#c8a868'], life: 0.5 });
          this.mode = 'glide';
          this.stateT = U.rand(1.5, 2.3);
        }
        break;
      case 'summon':
        if (this.stateT <= 0) {
          const tx = Math.floor(this.cx() / 16) + (Math.random() < 0.5 ? -2 : 2);
          const ty = Math.floor(this.cy() / 16) + 1;
          const e = spawnEnemy('gibdo', tx, ty);
          if (e && Game.solidAtRect(e.rect())) {
            const spot = Game.findFreeTile(tx, ty, 3);
            if (spot) { e.x = spot.x * 16 + 2; e.y = spot.y * 16 + 2; }
          }
          if (e) Game.enemies.push(e);
          Particles.burst(this.cx(), this.y + this.h, 12, { color: ['#d8cca8', '#a89c78'], life: 0.5 });
          this.mode = 'glide';
          this.stateT = U.rand(1.8, 2.6);
        }
        break;
      case 'sink': // dissolve into sand, resurface beside the player
        this.alpha = U.approach(this.alpha, 0.1, dt * 3);
        if (Math.random() < 0.3) Particles.spawn(this.cx() + U.rand(-10, 10), this.y + this.h, { vx: 0, vy: 20, g: 0, life: 0.4, color: '#d6c082', size: 2 });
        if (this.stateT <= 0) {
          const pl = Game.player;
          const a = U.rand(0, Math.PI * 2);
          const nx = pl.cx() + Math.cos(a) * 50 - this.w / 2;
          const ny = pl.cy() + Math.sin(a) * 50 - this.h / 2;
          if (!Game.solidAtRect({ x: nx, y: ny, w: this.w, h: this.h })) { this.x = nx; this.y = ny; }
          Particles.burst(this.cx(), this.y + this.h, 14, { color: ['#d6c082', '#c8a868'], life: 0.5 });
          AudioSys.sfx('warp');
          this.mode = 'volley';
          this.stateT = 0.4;
        }
        break;
    }
  }

  draw(ctx) {
    ctx.globalAlpha = U.clamp(this.alpha, 0.1, 1);
    this.drawSprite(ctx, Math.floor(this.animT * 3) % 2);
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------
const BOSS_TYPES = { gloomspore: Gloomspore, magmadon: Magmadon, wraithlord: Wraithlord, shade: Shade, frostmaw: Frostmaw, pharaghast: Pharaghast };

function spawnBoss(id, arenaRect) {
  const Cls = BOSS_TYPES[id];
  if (!Cls) return null;
  // spawn near top-center of arena
  const x = arenaRect.x + arenaRect.w / 2 - 14;
  const y = arenaRect.y + 24;
  const b = new Cls(x, y);
  b.arena = arenaRect;
  return b;
}
