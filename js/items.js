// ============================================================
// items.js — inventory, item grants, drops & pickups
// ============================================================
'use strict';

const Items = {
  // ---- item metadata ----
  INFO: {
    rupees:          { name: 'Rupees', sprite: 'rupee' },
    key:             { name: 'Small Key', sprite: 'key', msg: 'A small key! It opens one locked door in this place.' },
    bosskey:         { name: 'Boss Key', sprite: 'bosskey', msg: 'The Boss Key! Something terrible waits behind the great door...' },
    dungeon_map:     { name: 'Dungeon Map', sprite: 'map_item', msg: 'The Dungeon Map! The layout of this place is revealed on your map (M).' },
    compass:         { name: 'Compass', sprite: 'compass_item', msg: 'The Compass! Treasure and the lair of the beast are marked.' },
    bow:             { name: 'Hero\'s Bow', sprite: 'bow', msg: 'You got the Hero\'s Bow! Press X to loose arrows at distant foes.' },
    lantern:         { name: 'Lantern', sprite: 'lantern', msg: 'You got the Lantern! Its steady flame pushes back the deepest dark.' },
    master_sword:    { name: 'Master Sword', sprite: 'sword_master', msg: 'The blade of evil\'s bane! Your sword strikes twice as hard, and its spin attack is devastating.' },
    heart_container: { name: 'Heart Vessel', sprite: 'heart_container', msg: 'A Heart Vessel! Your life force grows by one full heart.' },
    potion:          { name: 'Red Potion', sprite: 'potion', msg: 'A Red Potion! Use it from the inventory (Tab) to restore all hearts.' },
    bombs:           { name: 'Bombs', sprite: 'bomb_item', msg: 'Bombs! Press C to set one down. Cracked walls fear you now.' },
    arrows:          { name: 'Arrows', sprite: 'arrow_item' },
    shield:          { name: 'Knight\'s Shield', sprite: 'shield_item', msg: 'The Knight\'s Shield! You take only half damage from enemies.' },
    shard_emerald:   { name: 'Emerald Shard', sprite: 'shard_green', msg: 'The EMERALD SHARD! One of the three shards of the shattered Sunstone. Its light warms your hands.' },
    shard_ruby:      { name: 'Ruby Shard', sprite: 'shard_red', msg: 'The RUBY SHARD! Two shards now hum in your pack, yearning to be whole.' },
    shard_sapphire:  { name: 'Sapphire Shard', sprite: 'shard', msg: 'The SAPPHIRE SHARD! All three shards blaze as one. The old castle gate will open now!' },
    letter:          { name: 'Sealed Letter', sprite: 'map_item', msg: 'Marin\'s letter to Finn at the Drowsy Cucco Inn. It smells faintly of wildflowers.' },
    boomerang:       { name: 'Boomerang', sprite: 'boomerang', msg: 'You got the BOOMERANG! Press R to throw it — it stuns enemies, rings crystals, and fetches whatever it touches.' },
    soup:            { name: 'Hot Soup', sprite: 'soup', msg: 'A bowl of the Drowsy Cucco\'s famous soup, wrapped tight. Still warm! Best delivered before it isn\'t.' },
    fire_rod:        { name: 'Fire Rod', sprite: 'fire_rod', msg: 'You got the FIRE ROD! Press F to hurl flame — it burns bushes from afar, and the restless dead fear it.' },
    flippers:        { name: 'Zora Flippers', sprite: 'flippers', msg: 'You got the ZORA FLIPPERS! You can now swim across open water. Deep water is still too treacherous.' },
    lure:            { name: 'Lucky Lure', sprite: 'lure', msg: 'The Lucky Lure! Hand-painted, twice-blessed, and lost exactly once. Odon will want this back.' },
    big_quiver:      { name: 'Big Quiver', sprite: 'quiver', msg: 'A BIG QUIVER stitched from ranch leather! You can now carry 50 arrows.' },
    bomb_bag:        { name: 'Big Bomb Bag', sprite: 'bombbag', msg: 'A BIG BOMB BAG of oiled desert hide! You can now carry 30 bombs.' },
    pearl:           { name: 'Pearl of the Deep', sprite: 'pearl', msg: 'The PEARL OF THE DEEP! The open ocean holds its breath for you — you can now swim across deep water.' },
    // — the Great Trade —
    shell:           { name: 'Spiral Shell', sprite: 'shell', msg: 'A SPIRAL SHELL bigger than your fist! Somewhere, a boy on an island needs to see this.' },
    toy_boat:        { name: 'Whittled Boat', sprite: 'toy_boat', msg: 'A WHITTLED BOAT with a real cloth sail. Koa says it wants "someone who misses the water."' },
    fish:            { name: 'Smoked Fish', sprite: 'fish', msg: 'A SMOKED FISH, Bjorn\'s finest. "For someone who remembers what fish are supposed to taste like."' },
    wool:            { name: 'Soft Wool', sprite: 'wool', msg: 'A skein of SOFT WOOL, spun by Granny Lu. "For hands that still work a loom."' },
    sailcloth:       { name: 'Fine Sailcloth', sprite: 'sailcloth', msg: 'FINE SAILCLOTH with a red stripe, woven by Lila. "For an old man who dreams in canvas."' },
    spyglass:        { name: 'Captain\'s Spyglass', sprite: 'spyglass', msg: 'The CAPTAIN\'S SPYGLASS, polished by forty years of squinting. "For the fellow who watches the sea for all of us."' },
    hero_charm:      { name: 'Hero\'s Charm', sprite: 'hero_charm', msg: 'The HERO\'S CHARM! While your hearts are full, your sword looses a blade of light with every swing!' },
    mirror_shield:   { name: 'Mirror Shield', sprite: 'mirror_shield', msg: 'The MIRROR SHIELD! Enemy bolts that strike you are hurled back at their senders.' },
    tideplate:       { name: 'Tideplate', sprite: 'tideplate', msg: 'The TIDEPLATE! Armor of the drowned choir — the sea\'s own scales turn half of every blow.' }
  },

  // grant an item to the player. contents: {type, amount}
  grant(contents, opts = {}) {
    const p = Game.data.player;
    const t = contents.type;
    const info = this.INFO[t] || { name: t };
    let msg = info.msg;

    switch (t) {
      case 'rupees':
        p.rupees = Math.min(999, p.rupees + (contents.amount || 1));
        msg = `You got ${contents.amount} Rupees!`;
        AudioSys.sfx('rupee');
        break;
      case 'key':
        p.keys[Game.map.id] = (p.keys[Game.map.id] || 0) + 1;
        AudioSys.sfx('key');
        break;
      case 'bosskey':
        p.bosskeys[Game.map.id] = true;
        AudioSys.sfx('key');
        break;
      case 'dungeon_map':
        p.dmaps[Game.map.id] = true;
        AudioSys.sfx('chest');
        break;
      case 'compass':
        p.dcompass[Game.map.id] = true;
        AudioSys.sfx('chest');
        break;
      case 'bow':
        p.hasBow = true;
        p.arrows = Math.max(p.arrows, 15);
        AudioSys.sfx('item');
        break;
      case 'lantern':
        p.hasLantern = true;
        AudioSys.sfx('item');
        break;
      case 'master_sword':
        p.hasMasterSword = true;
        AudioSys.sfx('item');
        break;
      case 'heart_container':
        p.maxHearts = Math.min(16, p.maxHearts + 1);
        p.hearts = p.maxHearts;
        AudioSys.sfx('heal');
        break;
      case 'potion':
        if (p.potions >= 4) { msg = 'Your bottle rack is full! The potion is wasted...'; }
        else p.potions++;
        AudioSys.sfx('item');
        break;
      case 'bombs':
        p.hasBombs = true;
        p.bombs = Math.min(p.maxBombs, p.bombs + (contents.amount || 5));
        msg = p.bombs <= 5 ? info.msg : `You got ${contents.amount || 5} bombs!`;
        AudioSys.sfx('chest');
        break;
      case 'arrows':
        p.arrows = Math.min(p.maxArrows, p.arrows + (contents.amount || 10));
        msg = `You got ${contents.amount || 10} arrows!`;
        AudioSys.sfx('chest');
        break;
      case 'shield':
        p.hasShield = true;
        AudioSys.sfx('item');
        break;
      case 'shard_emerald': p.shards.emerald = true; AudioSys.sfx('item'); break;
      case 'shard_ruby': p.shards.ruby = true; AudioSys.sfx('item'); break;
      case 'shard_sapphire': p.shards.sapphire = true; AudioSys.sfx('item'); break;
      case 'letter': p.letter = true; AudioSys.sfx('chest'); break;
      case 'boomerang': p.hasBoomerang = true; AudioSys.sfx('item'); break;
      case 'soup': p.soup = true; AudioSys.sfx('chest'); break;
      case 'fire_rod': p.hasFireRod = true; AudioSys.sfx('item'); break;
      case 'flippers': p.hasFlippers = true; AudioSys.sfx('item'); break;
      case 'lure': p.lure = true; AudioSys.sfx('chest'); break;
      case 'big_quiver':
        p.maxArrows = 50;
        p.arrows = p.maxArrows;
        AudioSys.sfx('item');
        break;
      case 'bomb_bag':
        p.maxBombs = 30;
        p.bombs = p.maxBombs;
        AudioSys.sfx('item');
        break;
      case 'pearl': p.hasPearl = true; AudioSys.sfx('item'); break;
      case 'shell': case 'toy_boat': case 'fish': case 'wool': case 'sailcloth': case 'spyglass':
        p.tradeItem = t;
        AudioSys.sfx('chest');
        break;
      case 'hero_charm':
        p.tradeItem = null;
        p.hasCharm = true;
        AudioSys.sfx('item');
        break;
      case 'tideplate': p.hasTideplate = true; AudioSys.sfx('item'); break;
      case 'mirror_shield': p.hasMirror = true; AudioSys.sfx('item'); break;
    }

    if (msg && !opts.silent) {
      Dialogue.start({ pages: [msg], itemSprite: info.sprite, onEnd: opts.onEnd });
    } else if (opts.onEnd) opts.onEnd();
  },

  shardCount() {
    const s = Game.data.player.shards;
    return (s.emerald ? 1 : 0) + (s.ruby ? 1 : 0) + (s.sapphire ? 1 : 0);
  }
};

// ============================================================
// Pickup — physical drop in the world (hearts, rupees, ammo)
// ============================================================
class Pickup {
  constructor(x, y, kind) {
    this.x = x; this.y = y;
    this.kind = kind; // heart, rupee, rupee5, rupee20, bomb, arrow, fairy, shard_*, heart_container
    this.w = 10; this.h = 10;
    this.t = 0;
    this.life = (kind.startsWith('shard') || kind === 'heart_container') ? Infinity : 10;
    this.vy = -40; this.vx = U.rand(-15, 15);
    this.grounded = false;
    this.dead = false;
  }

  update(dt) {
    this.t += dt;
    if (!this.grounded) {
      this.vy += 200 * dt;
      this.y += this.vy * dt;
      this.x += this.vx * dt;
      if (this.vy > 0 && this.t > 0.3) this.grounded = true;
    }
    if (this.t > this.life) this.dead = true;
    // magnet toward player when close
    const pl = Game.player;
    if (pl) {
      const d = U.dist(this.x, this.y, pl.cx(), pl.cy());
      if (d < 24 && this.t > 0.4) {
        this.x = U.approach(this.x, pl.cx(), 80 * dt);
        this.y = U.approach(this.y, pl.cy(), 80 * dt);
      }
      if (d < 10 && this.t > 0.3) this.collect();
    }
  }

  collect() {
    if (this.dead) return;
    const p = Game.data.player;
    switch (this.kind) {
      case 'heart':
        p.hearts = Math.min(p.maxHearts, p.hearts + 1);
        AudioSys.sfx('heart');
        break;
      case 'rupee': p.rupees = Math.min(999, p.rupees + 1); AudioSys.sfx('rupee'); break;
      case 'rupee5': p.rupees = Math.min(999, p.rupees + 5); AudioSys.sfx('rupee'); break;
      case 'rupee20': p.rupees = Math.min(999, p.rupees + 20); AudioSys.sfx('rupee'); break;
      case 'bomb':
        if (p.hasBombs) p.bombs = Math.min(p.maxBombs, p.bombs + 1);
        AudioSys.sfx('chest');
        break;
      case 'arrow':
        p.arrows = Math.min(p.maxArrows, p.arrows + 3);
        AudioSys.sfx('chest');
        break;
      case 'fairy':
        p.hearts = Math.min(p.maxHearts, p.hearts + 4);
        AudioSys.sfx('heal');
        Particles.burst(this.x, this.y, 14, { color: ['#f8b8d8', '#a8e8f8', '#fff'], life: 0.8 });
        break;
      case 'heart_container':
        Items.grant({ type: 'heart_container' });
        break;
      default:
        if (this.kind.startsWith('shard_')) {
          Items.grant({ type: this.kind });
          Story.onShardCollected();
        }
    }
    Particles.burst(this.x, this.y, 6, { color: '#fff', life: 0.3, speedMax: 40 });
    this.dead = true;
  }

  draw(ctx) {
    if (this.life !== Infinity && this.life - this.t < 3 && Math.floor(this.t * 8) % 2) return; // blink before despawn
    const bob = Math.sin(this.t * 4) * 1.5;
    const spr = {
      heart: 'heart', rupee: 'rupee', rupee5: 'rupee_blue', rupee20: 'rupee_red',
      bomb: 'bomb_item', arrow: 'arrow_item', fairy: 'npc_fairy',
      heart_container: 'heart_container',
      shard_emerald: 'shard_green', shard_ruby: 'shard_red', shard_sapphire: 'shard'
    }[this.kind] || 'rupee';
    const frame = this.kind === 'fairy' ? Math.floor(this.t * 6) % 2 : 0;
    if (this.kind.startsWith('shard') || this.kind === 'heart_container') {
      // glow
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(this.t * 5);
      ctx.fillStyle = '#fff8c0';
      ctx.beginPath();
      ctx.arc(this.x, this.y + bob, 10, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    Sprites.draw(ctx, spr, frame, this.x - 8, this.y - 8 + bob);
  }
}

// standard enemy drop table
function rollDrop(x, y) {
  const r = Math.random();
  const p = Game.data.player;
  if (r < 0.22) Game.pickups.push(new Pickup(x, y, 'heart'));
  else if (r < 0.42) Game.pickups.push(new Pickup(x, y, 'rupee'));
  else if (r < 0.50) Game.pickups.push(new Pickup(x, y, 'rupee5'));
  else if (r < 0.56 && p.hasBombs) Game.pickups.push(new Pickup(x, y, 'bomb'));
  else if (r < 0.64 && p.hasBow) Game.pickups.push(new Pickup(x, y, 'arrow'));
  // else nothing
}
