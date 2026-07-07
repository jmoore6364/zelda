// ============================================================
// sprites.js — procedural pixel-art sprite factory
// All art is defined as character grids and baked to canvases at boot.
// ============================================================
'use strict';

const Sprites = {
  cache: {},      // name -> [canvas per frame]
  flipCache: {},  // name -> [flipped canvas per frame]
  defs: {},

  def(name, palette, frames, scale = 1) {
    this.defs[name] = { palette, frames, scale };
  },

  bake() {
    for (const name in this.defs) {
      const { palette, frames } = this.defs[name];
      this.cache[name] = frames.map(rows => this._bakeFrame(rows, palette));
      this.flipCache[name] = this.cache[name].map(cv => this._flip(cv));
    }
  },

  _bakeFrame(rows, palette) {
    const h = rows.length;
    let w = 0;
    for (const r of rows) w = Math.max(w, r.length);
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const col = palette[ch];
        if (!col) continue;
        c.fillStyle = col;
        c.fillRect(x, y, 1, 1);
      }
    }
    return cv;
  },

  _flip(cv) {
    const f = document.createElement('canvas');
    f.width = cv.width; f.height = cv.height;
    const c = f.getContext('2d');
    c.translate(cv.width, 0);
    c.scale(-1, 1);
    c.drawImage(cv, 0, 0);
    return f;
  },

  get(name, frame = 0) {
    const arr = this.cache[name];
    if (!arr) return null;
    return arr[frame % arr.length];
  },

  draw(ctx, name, frame, x, y, opts = {}) {
    const arr = opts.flip ? this.flipCache[name] : this.cache[name];
    if (!arr) return;
    const cv = arr[frame % arr.length];
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    if (opts.rot) {
      ctx.save();
      ctx.translate(x + cv.width / 2, y + cv.height / 2);
      ctx.rotate(opts.rot);
      ctx.drawImage(cv, -cv.width / 2, -cv.height / 2);
      ctx.restore();
    } else {
      ctx.drawImage(cv, Math.round(x), Math.round(y));
    }
    if (opts.alpha !== undefined) ctx.globalAlpha = 1;
  },

  // white-flash silhouette (for hit feedback)
  drawFlash(ctx, name, frame, x, y, flip) {
    const arr = flip ? this.flipCache[name] : this.cache[name];
    if (!arr) return;
    const cv = arr[frame % arr.length];
    const tmp = document.createElement('canvas');
    tmp.width = cv.width; tmp.height = cv.height;
    const tc = tmp.getContext('2d');
    tc.drawImage(cv, 0, 0);
    tc.globalCompositeOperation = 'source-in';
    tc.fillStyle = '#fff';
    tc.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(tmp, Math.round(x), Math.round(y));
  }
};

// ============================================================
// PLAYER — the Hero (green tunic, blond hair)
// ============================================================
const P_HERO = {
  G: '#3f9e3a', g: '#2c7a2a', // tunic
  Y: '#e8c860', y: '#c09a38', // hair
  S: '#f2c894', s: '#d4a06a', // skin
  E: '#1c1c2e',               // eyes
  B: '#8a5a2b', b: '#5f3d1c', // belt/boots
  W: '#f0f0f0', K: '#d8b830', // buckle
  H: '#2c7a2a'                // hat shade
};

Sprites.def('hero_down', P_HERO, [
  [ // frame 0 — stand
    '.....GGGGG......',
    '....GGGGGGG.....',
    '...GGGGGGGGG....',
    '...gGGGGGGGg....',
    '...YSSSSSSY.....',
    '...YSESSESY.....',
    '....SSSSSS......',
    '.....SssS.......',
    '...GGGGGGGG.....',
    '..GSGGGGGGSG....',
    '..GSGBBBBGSG....',
    '..GsGBKBBGsG....',
    '...GGGGGGGG.....',
    '....GG..GG......',
    '....bb..bb......',
    '...bbb..bbb.....'
  ],
  [ // frame 1 — walk a
    '.....GGGGG......',
    '....GGGGGGG.....',
    '...GGGGGGGGG....',
    '...gGGGGGGGg....',
    '...YSSSSSSY.....',
    '...YSESSESY.....',
    '....SSSSSS......',
    '.....SssS.......',
    '...GGGGGGGG.....',
    '..GSGGGGGGSG....',
    '..GSGBBBBGSG....',
    '..GsGBKBBGsG....',
    '...GGGGGGGG.....',
    '....GG.GG.......',
    '...bb...bb......',
    '..bbb...........'
  ],
  [ // frame 2 — walk b
    '.....GGGGG......',
    '....GGGGGGG.....',
    '...GGGGGGGGG....',
    '...gGGGGGGGg....',
    '...YSSSSSSY.....',
    '...YSESSESY.....',
    '....SSSSSS......',
    '.....SssS.......',
    '...GGGGGGGG.....',
    '..GSGGGGGGSG....',
    '..GSGBBBBGSG....',
    '..GsGBKBBGsG....',
    '...GGGGGGGG.....',
    '.....GG..GG.....',
    '.....bb...bb....',
    '..........bbb...'
  ],
  [ // frame 3 — attack (arm thrust down)
    '.....GGGGG......',
    '....GGGGGGG.....',
    '...GGGGGGGGG....',
    '...gGGGGGGGg....',
    '...YSSSSSSY.....',
    '...YSESSESY.....',
    '....SSSSSS......',
    '.....SssS.......',
    '...GGGGGGGG.....',
    '..GSGGGGGGGG....',
    '..GSGBBBBGSS....',
    '..GsGBKBBGSS....',
    '...GGGGGGGs.....',
    '....GG..GG......',
    '....bb..bb......',
    '...bbb..bbb.....'
  ]
]);

Sprites.def('hero_up', P_HERO, [
  [
    '.....GGGGG......',
    '....GGGGGGG.....',
    '...GGGGGGGGG....',
    '...gGGGGGGGg....',
    '...YYYYYYYY.....',
    '...YYYYYYYY.....',
    '....YYYYYY......',
    '.....yyyy.......',
    '...GGGGGGGG.....',
    '..GSGGGGGGSG....',
    '..GSGGGGGGSG....',
    '..GsGGGGGGsG....',
    '...GGGGGGGG.....',
    '....GG..GG......',
    '....bb..bb......',
    '...bbb..bbb.....'
  ],
  [
    '.....GGGGG......',
    '....GGGGGGG.....',
    '...GGGGGGGGG....',
    '...gGGGGGGGg....',
    '...YYYYYYYY.....',
    '...YYYYYYYY.....',
    '....YYYYYY......',
    '.....yyyy.......',
    '...GGGGGGGG.....',
    '..GSGGGGGGSG....',
    '..GSGGGGGGSG....',
    '..GsGGGGGGsG....',
    '...GGGGGGGG.....',
    '....GG.GG.......',
    '...bb...bb......',
    '..bbb...........'
  ],
  [
    '.....GGGGG......',
    '....GGGGGGG.....',
    '...GGGGGGGGG....',
    '...gGGGGGGGg....',
    '...YYYYYYYY.....',
    '...YYYYYYYY.....',
    '....YYYYYY......',
    '.....yyyy.......',
    '...GGGGGGGG.....',
    '..GSGGGGGGSG....',
    '..GSGGGGGGSG....',
    '..GsGGGGGGsG....',
    '...GGGGGGGG.....',
    '.....GG..GG.....',
    '.....bb...bb....',
    '..........bbb...'
  ],
  [ // attack up
    '.....GGGGG..SS..',
    '....GGGGGGG.SS..',
    '...GGGGGGGGGs...',
    '...gGGGGGGGG....',
    '...YYYYYYYY.....',
    '...YYYYYYYY.....',
    '....YYYYYY......',
    '.....yyyy.......',
    '...GGGGGGGG.....',
    '..GSGGGGGGGG....',
    '..GSGGGGGGGG....',
    '..GsGGGGGGGG....',
    '...GGGGGGGG.....',
    '....GG..GG......',
    '....bb..bb......',
    '...bbb..bbb.....'
  ]
]);

Sprites.def('hero_side', P_HERO, [ // faces RIGHT; flip for left
  [
    '.....GGGGG......',
    '....GGGGGGG.....',
    '...GGGGGGGGG....',
    '...gGGGGGGGg....',
    '....YSSSSSY.....',
    '....YSSESSE.....',
    '.....SSSSSS.....',
    '......Sss.......',
    '....GGGGGGG.....',
    '...GGGGGGGG.....',
    '...GGBBBBGG.....',
    '...GsBBKBsG.....',
    '....GGGGGG......',
    '.....GGGG.......',
    '.....bbbb.......',
    '....bbb.bbb.....'
  ],
  [
    '.....GGGGG......',
    '....GGGGGGG.....',
    '...GGGGGGGGG....',
    '...gGGGGGGGg....',
    '....YSSSSSY.....',
    '....YSSESSE.....',
    '.....SSSSSS.....',
    '......Sss.......',
    '....GGGGGGG.....',
    '...GGGGGGGG.....',
    '...GGBBBBGG.....',
    '...GsBBKBsG.....',
    '....GGGGGG......',
    '....GG..GG......',
    '...bb....bb.....',
    '..bb......bb....'
  ],
  [
    '.....GGGGG......',
    '....GGGGGGG.....',
    '...GGGGGGGGG....',
    '...gGGGGGGGg....',
    '....YSSSSSY.....',
    '....YSSESSE.....',
    '.....SSSSSS.....',
    '......Sss.......',
    '....GGGGGGG.....',
    '...GGGGGGGG.....',
    '...GGBBBBGG.....',
    '...GsBBKBsG.....',
    '....GGGGGG......',
    '.....GGGG.......',
    '.....b..b.......',
    '.....bb.bb......'
  ],
  [ // attack right — arm thrust forward
    '.....GGGGG......',
    '....GGGGGGG.....',
    '...GGGGGGGGG....',
    '...gGGGGGGGg....',
    '....YSSSSSY.....',
    '....YSSESSE.....',
    '.....SSSSSS.....',
    '......Sss.......',
    '....GGGGGGG.....',
    '...GGGGGGGSSS...',
    '...GGBBBBGGss...',
    '...GsBBKBsG.....',
    '....GGGGGG......',
    '.....GGGG.......',
    '.....bbbb.......',
    '....bbb.bbb.....'
  ]
]);

// Sword blade (points up) — rotated during swings
Sprites.def('sword', { W: '#e8f0ff', w: '#a8b8d8', B: '#8a5a2b', K: '#d8b830', O: '#404860' }, [
  [
    '.......W........',
    '......WWw.......',
    '......WWw.......',
    '......WWw.......',
    '......WWw.......',
    '......WWw.......',
    '......WWw.......',
    '......WWw.......',
    '.....KKKKK......',
    '.......B........',
    '.......B........',
    '.......B........'
  ]
]);

Sprites.def('sword_master', { W: '#c8e8ff', w: '#78a8e8', B: '#5a4a9a', K: '#e8e050', O: '#404860' }, [
  [
    '.......W........',
    '......WWw.......',
    '......WWw.......',
    '......WWw.......',
    '......WWw.......',
    '......WWw.......',
    '......WWw.......',
    '......WWw.......',
    '....KKKKKKK.....',
    '.......B........',
    '.......B........',
    '.......B........'
  ]
]);

// ============================================================
// ENEMIES — 12 types, 2 frames each
// ============================================================

// 1. Octorok — red octopus, spits rocks
Sprites.def('octorok', { R: '#d84848', r: '#a83030', W: '#f8e8d8', E: '#1c1c2e', P: '#f0a0a0' }, [
  [
    '....RRRRRRR.....',
    '...RRRRRRRRR....',
    '..RRWWRRRWWRR...',
    '..RRWERRRWERR...',
    '..RRRRRRRRRRR...',
    '..RRRPPPPPRRR...',
    '...RRPPPPPRR....',
    '...rRRRRRRRr....',
    '..rr.RRRRR.rr...',
    '.rr..rRRRr..rr..',
    '.r...r...r...r..',
    '..............  '
  ],
  [
    '....RRRRRRR.....',
    '...RRRRRRRRR....',
    '..RRWWRRRWWRR...',
    '..RRWERRRWERR...',
    '..RRRRRRRRRRR...',
    '..RRRPPPPPRRR...',
    '...RRPPPPPRR....',
    '...rRRRRRRRr....',
    '...r.RRRRR.r....',
    '..rr.rRRRr.rr...',
    '..r..r...r..r...',
    '................'
  ]
]);

// 2. Moblin — bulldog goblin with spear
Sprites.def('moblin', { M: '#c87838', m: '#96562a', W: '#f0e0c0', E: '#c02020', T: '#787888', B: '#5a4030', N: '#e8a868' }, [
  [
    '....MMMMMM..T...',
    '...MMMMMMMM.T...',
    '..MMEMMMMEM.T...',
    '..MMMMMMMMM.T...',
    '..MNNNNNNMM.T...',
    '..MNWWWWNM..T...',
    '...NNNNNN...T...',
    '..BBBBBBBB..T...',
    '.BBBBBBBBBB.T...',
    '.BmBBBBBBmB.....',
    '.Bm.BBBB.mB.....',
    '....BBBB........',
    '....mm.mm.......',
    '...mmm.mmm......'
  ],
  [
    '....MMMMMM......',
    '...MMMMMMMM.T...',
    '..MMEMMMMEM.T...',
    '..MMMMMMMMM.T...',
    '..MNNNNNNMM.T...',
    '..MNWWWWNM..T...',
    '...NNNNNN...T...',
    '..BBBBBBBB..T...',
    '.BBBBBBBBBB.T...',
    '.BmBBBBBBmB.T...',
    '.Bm.BBBB.mB.....',
    '....BBBB........',
    '....mm..mm......',
    '...mm....mm.....'
  ]
]);

// 3. Keese — cave bat
Sprites.def('keese', { K: '#4a3a6a', k: '#332a4a', E: '#f0d030', W: '#6a5a9a' }, [
  [
    '................',
    '.WW..........WW.',
    '.WWWW......WWWW.',
    '..WWWWK..KWWWW..',
    '...WKKKKKKKKW...',
    '....KKEKKEKK....',
    '.....KKKKKK.....',
    '......kKKk......',
    '.......kk.......',
    '................'
  ],
  [
    '................',
    '................',
    '......K..K......',
    '..WWWKKKKKKWWW..',
    '.WWWWKKEKKEWWWW.',
    '.WW...KKKK...WW.',
    '.......kk.......',
    '................',
    '................',
    '................'
  ]
]);

// 4. Stalfos — skeleton warrior
Sprites.def('stalfos', { W: '#e8e8d8', w: '#b8b8a8', E: '#c03030', B: '#787868' }, [
  [
    '....WWWWWW......',
    '...WWWWWWWW.....',
    '...WEWWWWEW.....',
    '...WWWWWWWW.....',
    '...WwWwWwWW.....',
    '....WWWWWW......',
    '.....wWWw.......',
    '..W.WWWWWW.W....',
    '..WWwWWWWwWW....',
    '..W..WWWW..W....',
    '.....wWWw.......',
    '....WW..WW......',
    '....W....W......',
    '...ww....ww.....'
  ],
  [
    '....WWWWWW......',
    '...WWWWWWWW.....',
    '...WEWWWWEW.....',
    '...WWWWWWWW.....',
    '...WwWwWwWW.....',
    '....WWWWWW......',
    '.....wWWw.......',
    '..W.WWWWWW.W....',
    '..WWwWWWWwWW....',
    '..W..WWWW..W....',
    '.....wWWw.......',
    '.....WW.WW......',
    '....WW....W.....',
    '...ww....ww.....'
  ]
]);

// 5. Chu — jelly slime
Sprites.def('chu', { C: '#58c848', c: '#3a9a30', E: '#1c1c2e', H: '#a8f098' }, [
  [
    '................',
    '................',
    '.....CCCCC......',
    '....CCHCCCC.....',
    '...CCHHCCCCC....',
    '...CCCCCCCCC....',
    '..CCECCCCECC....',
    '..CCCCCCCCCC....',
    '..cCCCCCCCCc....',
    '...cccccccc.....',
    '................',
    '................'
  ],
  [
    '................',
    '................',
    '................',
    '....CCCCCCC.....',
    '...CCHHCCCCC....',
    '..CCHCCCCCCCC...',
    '..CCECCCCECCC...',
    '.CCCCCCCCCCCCC..',
    '.cCCCCCCCCCCCc..',
    '..ccccccccccc...',
    '................',
    '................'
  ]
]);

// 6. Leever — sand burrower
Sprites.def('leever', { L: '#3878c8', l: '#2858a0', W: '#88b8f0', E: '#f0d030', S: '#d8c078' }, [
  [
    '................',
    '......LLL.......',
    '....LLLLLLL.....',
    '...LLWLLLWLL....',
    '...LLELLLELL....',
    '..LLLLLLLLLLL...',
    '..LLlLlLlLlLL...',
    '...lLlLlLlLl....',
    '....lllllll.....',
    '...SSSSSSSSS....',
    '................',
    '................'
  ],
  [
    '................',
    '................',
    '......LLL.......',
    '....LLLLLLL.....',
    '...LLWLLLWLL....',
    '...LLELLLELL....',
    '..LLLLLLLLLLL...',
    '...lLlLlLlLl....',
    '....lllllll.....',
    '...SSSSSSSSS....',
    '................',
    '................'
  ]
]);

// 7. Wizzrobe — teleporting mage
Sprites.def('wizzrobe', { R: '#8848c8', r: '#603096', E: '#f0d030', S: '#302850', W: '#c8a8f0' }, [
  [
    '.......RR.......',
    '......RRRR......',
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '....RSSSSSSR....',
    '....RSESSES.....',
    '....RSSSSSS.....',
    '...RRRRRRRRR....',
    '..RRRRRRRRRRR...',
    '..WRRRRRRRRRW...',
    '..W.RRRRRRR.W...',
    '....RRRRRRR.....',
    '....rrrrrrr.....',
    '.....r.r.r......'
  ],
  [
    '.......RR.......',
    '......RRRR......',
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '....RSSSSSSR....',
    '....RSESSES.....',
    '....RSSSSSS.....',
    '...RRRRRRRRR....',
    '..RRRRRRRRRRR...',
    '.WRRRRRRRRRRRW..',
    '.W..RRRRRRR..W..',
    '....RRRRRRR.....',
    '....rrrrrrr.....',
    '....r..r..r.....'
  ]
]);

// 8. Darknut — armored knight
Sprites.def('darknut', { A: '#687088', a: '#485068', E: '#e83030', P: '#a8b0c8', S: '#383848', T: '#9a2828' }, [
  [
    '....AAAAAA......',
    '...APAAAAPA.....',
    '...AAAAAAAA.....',
    '...ASEAAESA.....',
    '...AASSSSAA.....',
    '....AAAAAA......',
    '..TTAAAAAATT....',
    '..TAAAAAAAAT....',
    '..TAaAAAAaAT....',
    '..TAaAAAAaAT....',
    '...AaAAAAaA.....',
    '....AAAAAA......',
    '....AA..AA......',
    '...aaa..aaa.....'
  ],
  [
    '....AAAAAA......',
    '...APAAAAPA.....',
    '...AAAAAAAA.....',
    '...ASEAAESA.....',
    '...AASSSSAA.....',
    '....AAAAAA......',
    '..TTAAAAAATT....',
    '..TAAAAAAAAT....',
    '..TAaAAAAaAT....',
    '..TAaAAAAaAT....',
    '...AaAAAAaA.....',
    '....AAAAAA......',
    '.....AA.AA......',
    '....aaa..aaa....'
  ]
]);

// 9. Peahat — flying propeller plant
Sprites.def('peahat', { P: '#c8a038', p: '#96782a', G: '#58a838', E: '#1c1c2e', W: '#e8d8a8' }, [
  [
    '..GGGGGGGGGGG...',
    '.......G........',
    '....PPPPPPP.....',
    '...PPPPPPPPP....',
    '..PPWPPPPPWPP...',
    '..PPEPPPPPEPP...',
    '..PPPPPPPPPPP...',
    '...PPPPPPPPP....',
    '....pPPPPPp.....',
    '.....ppppp......',
    '......ppp.......',
    '................'
  ],
  [
    '......GGG.......',
    '.GGGG..G..GGGG..',
    '....PPPPPPP.....',
    '...PPPPPPPPP....',
    '..PPWPPPPPWPP...',
    '..PPEPPPPPEPP...',
    '..PPPPPPPPPPP...',
    '...PPPPPPPPP....',
    '....pPPPPPp.....',
    '.....ppppp......',
    '......ppp.......',
    '................'
  ]
]);

// 10. Zora — river spitter
Sprites.def('zora', { Z: '#38a888', z: '#288068', E: '#f0d030', F: '#88e8c8', M: '#186850' }, [
  [
    '......ZZZ.......',
    '..F..ZZZZZ..F...',
    '..FFZZZZZZZFF...',
    '...ZZEZZZEZZ....',
    '...ZZZZZZZZZ....',
    '...ZZZMMMZZZ....',
    '....ZZZZZZZ.....',
    '...zZZZZZZZz....',
    '..zzzZZZZZzzz...',
    '................',
    '................',
    '................'
  ],
  [
    '......ZZZ.......',
    '.FF..ZZZZZ..FF..',
    '..FFZZZZZZZFF...',
    '...ZZEZZZEZZ....',
    '...ZZZZZZZZZ....',
    '...ZZMMMMMZZ....',
    '....ZZZZZZZ.....',
    '...zZZZZZZZz....',
    '..zzzZZZZZzzz...',
    '................',
    '................',
    '................'
  ]
]);

// 11. Armos — awakening stone statue
Sprites.def('armos', { A: '#9a9aa8', a: '#6a6a78', E: '#e84040', S: '#c8c8d0', B: '#50505e' }, [
  [
    '....SAAAAS......',
    '...SAAAAAAS.....',
    '...AABAABAA.....',
    '...AAAAAAAA.....',
    '...AaAAAAaA.....',
    '....AAAAAA......',
    '..AAAAAAAAAA....',
    '..ASAAAAAASA....',
    '..AAaAAAAaAA....',
    '...AaAAAAaA.....',
    '....AAAAAA......',
    '....AA..AA......',
    '....aa..aa......',
    '...aaa..aaa.....'
  ],
  [ // awakened — eyes glow
    '....SAAAAS......',
    '...SAAAAAAS.....',
    '...AEBAABEA.....',
    '...AAAAAAAA.....',
    '...AaAAAAaA.....',
    '....AAAAAA......',
    '..AAAAAAAAAA....',
    '..ASAAAAAASA....',
    '..AAaAAAAaAA....',
    '...AaAAAAaA.....',
    '....AAAAAA......',
    '.....AA.AA......',
    '....aa...aa.....',
    '...aaa...aaa....'
  ]
]);

// 12. Poe — lantern ghost
Sprites.def('poe', { P: '#d8d8f0', p: '#a8a8c8', E: '#3838c8', L: '#f0a030', l: '#c87818', S: '#8888b0' }, [
  [
    '.....PPPPP......',
    '....PPPPPPP.....',
    '...PPEPPPEP.....',
    '...PPPPPPPP.....',
    '...PPPSSPPP.....',
    '....PPPPPP..L...',
    '....PPPPPPPLLL..',
    '.....PPPPP..L...',
    '.....pPPp.......',
    '......pPp.......',
    '.......p........',
    '................'
  ],
  [
    '.....PPPPP......',
    '....PPPPPPP.....',
    '...PPEPPPEP.....',
    '...PPPPPPPP.....',
    '...PPPSSPPP.....',
    '....PPPPPP..l...',
    '....PPPPPPPlLl..',
    '.....PPPPP..l...',
    '......pPPp......',
    '.......pPp......',
    '........p.......',
    '................'
  ]
]);

// ============================================================
// BOSSES — 32x32
// ============================================================

// Boss 1: GLOOMSPORE — giant fungal horror (forest temple)
Sprites.def('boss_gloomspore', { M: '#b05898', m: '#804070', C: '#e8c8e0', E: '#f0d030', e: '#c03030', S: '#d8a8c8', G: '#588048', T: '#f0e8d8' }, [
  [
    '..........MMMMMMMMMMM..........',
    '.......MMMMMMMMMMMMMMMMM.......',
    '.....MMMMSSMMMMMMMMSSMMMMM.....',
    '....MMMSSSSMMMMMMMMSSSSMMMM....',
    '...MMMMSSMMMMMMMMMMMMSSMMMMM...',
    '..MMMMMMMMMMSSSSSSMMMMMMMMMMM..',
    '..MMMMMMMMSSSSSSSSSSMMMMMMMMM..',
    '.MMMMMMMMMSSMMMMMMSSMMMMMMMMMM.',
    '.MMmmmmmmmmmmmmmmmmmmmmmmmmmMM.',
    '..mmCCCCCCCCCCCCCCCCCCCCCCmm...',
    '..mCCCCCCCCCCCCCCCCCCCCCCCCm...',
    '..CCCeeCCCCCCCCCCCCCCCeeCCCC...',
    '..CCeEEeCCCCCCCCCCCCCeEEeCCC...',
    '..CCeEEeCCCCCCCCCCCCCeEEeCCC...',
    '..CCCeeCCCCCCCCCCCCCCCeeCCCC...',
    '..CCCCCCCCCCCCCCCCCCCCCCCCCC...',
    '..CCCCCCCTTTTTTTTTTTCCCCCCCC...',
    '..CCCCCCTTCCTTCCTTCCTTCCCCCC...',
    '...CCCCCCCCCCCCCCCCCCCCCCCC....',
    '...GCCCCCCCCCCCCCCCCCCCCCCG....',
    '..GGCCCCCCCCCCCCCCCCCCCCCCGG...',
    '..GG.CCCCCCCCCCCCCCCCCCCC.GG...',
    '.GG...CCCCCCCCCCCCCCCCCC...GG..',
    '.G.....CCCCCCCCCCCCCCCC.....G..',
    '.......CmCmCmCmCmCmCmCm........',
    '......GG..GG..GG..GG..GG.......',
    '.....GG...GG...GG...GG..G......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
  ],
  [
    '..........MMMMMMMMMMM..........',
    '.......MMMMMMMMMMMMMMMMM.......',
    '.....MMMMSSMMMMMMMMSSMMMMM.....',
    '....MMMSSSSMMMMMMMMSSSSMMMM....',
    '...MMMMSSMMMMMMMMMMMMSSMMMMM...',
    '..MMMMMMMMMMSSSSSSMMMMMMMMMMM..',
    '..MMMMMMMMSSSSSSSSSSMMMMMMMMM..',
    '.MMMMMMMMMSSMMMMMMSSMMMMMMMMMM.',
    '.MMmmmmmmmmmmmmmmmmmmmmmmmmmMM.',
    '..mmCCCCCCCCCCCCCCCCCCCCCCmm...',
    '..mCCCCCCCCCCCCCCCCCCCCCCCCm...',
    '..CCCeeCCCCCCCCCCCCCCCeeCCCC...',
    '..CCeeeeCCCCCCCCCCCCCeeeeCCC...',
    '..CCeeeeCCCCCCCCCCCCCeeeeCCC...',
    '..CCCeeCCCCCCCCCCCCCCCeeCCCC...',
    '..CCCCCCCCCCCCCCCCCCCCCCCCCC...',
    '..CCCCCCTTTTTTTTTTTTTCCCCCCC...',
    '..CCCCCTTCCTTCCTTCCTTTCCCCCC...',
    '...CCCCCCCCCCCCCCCCCCCCCCCC....',
    '...GCCCCCCCCCCCCCCCCCCCCCCG....',
    '..GGCCCCCCCCCCCCCCCCCCCCCCGG...',
    '..GG.CCCCCCCCCCCCCCCCCCCC.GG...',
    '.GG...CCCCCCCCCCCCCCCCCC...GG..',
    '.G.....CCCCCCCCCCCCCCCC.....G..',
    '......CmCmCmCmCmCmCmCmCm.......',
    '.....GG..GG..GG..GG..GG........',
    '....GG...GG...GG...GG..G.......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
  ]
]);

// Boss 2: MAGMADON — molten lizard king (ember depths)
Sprites.def('boss_magmadon', { D: '#c84828', d: '#8a2818', L: '#f8a828', l: '#f8e048', E: '#f8f048', S: '#502018', B: '#682820', W: '#f8f8e8' }, [
  [
    '..........DDDD.......DDDD......',
    '.........DDDDDD.....DDDDDD.....',
    '.........DDLLDDDDDDDDDLLDD.....',
    '..........DDDDDDDDDDDDDDD......',
    '.......DDDDDDDDDDDDDDDDDDDD....',
    '......DDDDDDEEDDDDDDEEDDDDDD...',
    '......DDDDDDEEDDDDDDEEDDDDDD...',
    '.....DDDDDDDDDDDDDDDDDDDDDDD...',
    '.....DDDDSSSSSSSSSSSSSSSDDDD...',
    '.....DDDSWWSWWSWWSWWSWWSSDDD...',
    '......DDSSSSSSSSSSSSSSSSSDD....',
    '.......DDDDDDDDDDDDDDDDDDD.....',
    '....DDDDDDDDDDDDDDDDDDDDDDDD...',
    '...DDDDDLLDDDDDDDDDDDDLLDDDDD..',
    '..DDDDDLLLLDDDDDDDDDDLLLLDDDDD.',
    '..DDDDDLLLLDDDDDDDDDDLLLLDDDDD.',
    '..DdDDDDLLDDDDDDDDDDDDLLDDDDdD.',
    '..Dd.DDDDDDDDDDDDDDDDDDDDDD.dD.',
    '..D..DDDDDDDLLLLLLLLDDDDDDD..D.',
    '.....DDDDDDLLllllllLLDDDDDD....',
    '.....DDDDDDLLllllllLLDDDDDD....',
    '......DDDDDDLLLLLLLLDDDDDD.....',
    '......dDDDDDDDDDDDDDDDDDDd.....',
    '.......dDDDDDDDDDDDDDDDDd......',
    '.......DDDD..DDDD..DDDD........',
    '......DDDD...DDDD...DDDD.......',
    '.....ddd.....ddd.....ddd.......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
  ],
  [
    '..........DDDD.......DDDD......',
    '.........DDDDDD.....DDDDDD.....',
    '.........DDLLDDDDDDDDDLLDD.....',
    '..........DDDDDDDDDDDDDDD......',
    '.......DDDDDDDDDDDDDDDDDDDD....',
    '......DDDDDDEEDDDDDDEEDDDDDD...',
    '......DDDDDDEEDDDDDDEEDDDDDD...',
    '.....DDDDDDDDDDDDDDDDDDDDDDD...',
    '.....DDDDSSSSSSSSSSSSSSSDDDD...',
    '.....DDDSWWSWWSWWSWWSWWSSDDD...',
    '......DDSSSSSSSSSSSSSSSSSDD....',
    '.......DDDDDDDDDDDDDDDDDDD.....',
    '....DDDDDDDDDDDDDDDDDDDDDDDD...',
    '...DDDDDLLDDDDDDDDDDDDLLDDDDD..',
    '..DDDDDLLLLDDDDDDDDDDLLLLDDDDD.',
    '..DDDDDLLLLDDDDDDDDDDLLLLDDDDD.',
    '..DdDDDDLLDDDDDDDDDDDDLLDDDDdD.',
    '..Dd.DDDDDDDDDDDDDDDDDDDDDD.dD.',
    '..D..DDDDDDDLLLLLLLLDDDDDDD..D.',
    '.....DDDDDDLLllllllLLDDDDDD....',
    '.....DDDDDDLLllllllLLDDDDDD....',
    '......DDDDDDLLLLLLLLDDDDDD.....',
    '......dDDDDDDDDDDDDDDDDDDd.....',
    '.......dDDDDDDDDDDDDDDDDd......',
    '........DDDD..DDDD..DDDD.......',
    '.......DDDD...DDDD...DDDD......',
    '......ddd.....ddd.....ddd......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
  ]
]);

// Boss 3: WRAITHLORD — spectral king (sunken crypt)
Sprites.def('boss_wraithlord', { W: '#b8c8e8', w: '#8898c8', E: '#48e8d8', C: '#f0d048', S: '#485878', K: '#283048', R: '#6858a8' }, [
  [
    '...........CCCCCCCC............',
    '..........CC.CC.CC.C...........',
    '..........CCCCCCCCCC...........',
    '.........WWWWWWWWWWWW..........',
    '........WWWWWWWWWWWWWW.........',
    '........WWEEWWWWWWEEWW.........',
    '........WWEEWWWWWWEEWW.........',
    '........WWWWWWWWWWWWWW.........',
    '.........WWWSSSSSSWWW..........',
    '.........WWWWWWWWWWWW..........',
    '......RRWWWWWWWWWWWWWWRR.......',
    '.....RRRWWWWWWWWWWWWWWRRR......',
    '....RRWWWWWWWWWWWWWWWWWWRR.....',
    '....RWWWWWWWWWWWWWWWWWWWWR.....',
    '...WWWWWKKWWWWWWWWWWKKWWWWW....',
    '...WWWWKKKKWWWWWWWWKKKKWWWW....',
    '...WWWWWKKWWWWWWWWWWKKWWWWW....',
    '...WwWWWWWWWWWWWWWWWWWWWWwW....',
    '...Ww.WWWWWWWWWWWWWWWWWW.wW....',
    '...W..WWWWWWWWWWWWWWWWWW..W....',
    '......wWWWWWWWWWWWWWWWWw.......',
    '......wWWWWWWWWWWWWWWWWw.......',
    '.......wWWWWWWWWWWWWWWw........',
    '.......wwWWWWWWWWWWWWww........',
    '........wwWWWWWWWWWWww.........',
    '.........wwWWWwwWWWww..........',
    '..........wWWw..wWWw...........',
    '...........ww....ww............',
    '............w.....w............',
    '................................',
    '................................',
    '................................'
  ],
  [
    '...........CCCCCCCC............',
    '..........CC.CC.CC.C...........',
    '..........CCCCCCCCCC...........',
    '.........WWWWWWWWWWWW..........',
    '........WWWWWWWWWWWWWW.........',
    '........WEEWWWWWWWWEEW.........',
    '........WEEWWWWWWWWEEW.........',
    '........WWWWWWWWWWWWWW.........',
    '.........WWWSSSSSSWWW..........',
    '.........WWWWWWWWWWWW..........',
    '......RRWWWWWWWWWWWWWWRR.......',
    '.....RRRWWWWWWWWWWWWWWRRR......',
    '....RRWWWWWWWWWWWWWWWWWWRR.....',
    '....RWWWWWWWWWWWWWWWWWWWWR.....',
    '...WWWWWKKWWWWWWWWWWKKWWWWW....',
    '...WWWWKKKKWWWWWWWWKKKKWWWW....',
    '...WWWWWKKWWWWWWWWWWKKWWWWW....',
    '...WwWWWWWWWWWWWWWWWWWWWWwW....',
    '...Ww.WWWWWWWWWWWWWWWWWW.wW....',
    '...W..WWWWWWWWWWWWWWWWWW..W....',
    '......wWWWWWWWWWWWWWWWWw.......',
    '......wWWWWWWWWWWWWWWWWw.......',
    '.......wWWWWWWWWWWWWWWw........',
    '.......wwWWWWWWWWWWWWww........',
    '........wwWWWWWWWWWWww.........',
    '..........wWWWwwWWWw...........',
    '...........wWw..wWw............',
    '............w....w.............',
    '................................',
    '................................',
    '................................',
    '................................'
  ]
]);

// Final Boss: THE SHADE — shadow sorcerer / demon form
Sprites.def('boss_shade', { S: '#38284a', s: '#241a34', E: '#e83048', P: '#8848c8', p: '#5a30a0', C: '#c83060', W: '#0e0a18' }, [
  [
    '..........SSSSSSSSSSS..........',
    '........SSSSSSSSSSSSSSS........',
    '.......SSSPPSSSSSSSPPSSS.......',
    '......SSSPPPPSSSSSPPPPSSS......',
    '......SSSSPPSSSSSSSPPSSSS......',
    '......SSSSSSSSSSSSSSSSSSS......',
    '......SSSEESSSSSSSSEESSSS......',
    '......SSSEEESSSSSSEEESSSS......',
    '......SSSSEESSSSSSSEESSSS......',
    '.......SSSSSSCCCCSSSSSSS.......',
    '.......SSSSSSSSSSSSSSSSS.......',
    '....PPSSSSSSSSSSSSSSSSSSPP.....',
    '...PPPSSSSSSSSSSSSSSSSSSPPP....',
    '..PPSSSSSSSSSSSSSSSSSSSSSSPP...',
    '..PSSSSSSSSSSSSSSSSSSSSSSSSP...',
    '.SSSSSSsEEsSSSSSSSSsEEsSSSSSS..',
    '.SSSSSsEEEEsSSSSSSsEEEEsSSSSS..',
    '.SSSSSSsEEsSSSSSSSSsEEsSSSSSS..',
    '.SsSSSSSSSSSSSSSSSSSSSSSSSsS...',
    '.Ss.SSSSSSSSSSSSSSSSSSSSS.sS...',
    '.S..sSSSSSSSSSSSSSSSSSSs...S...',
    '....sSSSSSSSSSSSSSSSSSSs.......',
    '.....sSSSSSSSSSSSSSSSSs........',
    '.....ssSSSSSSSSSSSSSSss........',
    '......ssSSSSSSSSSSSSss.........',
    '.......ssSSSwwsSSSss...........',
    '........sSSw..wSSs.............',
    '.........sw....ws..............',
    '................................',
    '................................',
    '................................',
    '................................'
  ],
  [
    '..........SSSSSSSSSSS..........',
    '........SSSSSSSSSSSSSSS........',
    '.......SSSPPSSSSSSSPPSSS.......',
    '......SSSPPPPSSSSSPPPPSSS......',
    '......SSSSPPSSSSSSSPPSSSS......',
    '......SSSSSSSSSSSSSSSSSSS......',
    '......SSSEEESSSSSSEEESSSS......',
    '......SSSEEESSSSSSEEESSSS......',
    '......SSSSEESSSSSSSEESSSS......',
    '.......SSSSSCCCCCCSSSSSS.......',
    '.......SSSSSSSSSSSSSSSSS.......',
    '...PPSSSSSSSSSSSSSSSSSSSSPP....',
    '..PPPSSSSSSSSSSSSSSSSSSSSPPP...',
    '..PPSSSSSSSSSSSSSSSSSSSSSSPP...',
    '..PSSSSSSSSSSSSSSSSSSSSSSSSP...',
    '.SSSSSSsEEsSSSSSSSSsEEsSSSSSS..',
    '.SSSSSsEEEEsSSSSSSsEEEEsSSSSS..',
    '.SSSSSSsEEsSSSSSSSSsEEsSSSSSS..',
    '.SsSSSSSSSSSSSSSSSSSSSSSSSsS...',
    '.Ss.SSSSSSSSSSSSSSSSSSSSS.sS...',
    '.S..sSSSSSSSSSSSSSSSSSSs...S...',
    '....sSSSSSSSSSSSSSSSSSSs.......',
    '.....sSSSSSSSSSSSSSSSSs........',
    '.....ssSSSSSSSSSSSSSSss........',
    '......ssSSSSSSSSSSSSss.........',
    '........ssSwwsSSSss............',
    '.........sw..wSSs..............',
    '..........w....ws..............',
    '................................',
    '................................',
    '................................',
    '................................'
  ]
]);

// ============================================================
// NPCs
// ============================================================
Sprites.def('npc_elder', { R: '#8a6aaa', r: '#6a4a8a', W: '#e8e8e8', S: '#e8c098', E: '#2c2c3e', B: '#c8a868' }, [
  [
    '.....WWWWW......',
    '....WWWWWWW.....',
    '....SSSSSSS.....',
    '....SESSSES.....',
    '....SSSSSSS.....',
    '....WWWWWWW.....',
    '....WWWWWWW.....',
    '...RRRRRRRRR....',
    '..RRRRRRRRRRR...',
    '..RSRRRRRRRSR...',
    '..RSRRRRRRRSR.B.',
    '...RRRRRRRRR..B.',
    '...RRRRRRRRR..B.',
    '...RRRRRRRRR..B.',
    '...rrrrrrrrr..B.',
    '....r.r.r.r...B.'
  ],
  [
    '.....WWWWW......',
    '....WWWWWWW.....',
    '....SSSSSSS.....',
    '....SESSSES.....',
    '....SSSSSSS.....',
    '....WWWWWWW.....',
    '....WWWWWWW.....',
    '...RRRRRRRRR....',
    '..RRRRRRRRRRR...',
    '..RSRRRRRRRSR...',
    '..RSRRRRRRRSRB..',
    '...RRRRRRRRR.B..',
    '...RRRRRRRRR.B..',
    '...RRRRRRRRR.B..',
    '...rrrrrrrrr.B..',
    '....r.r.r.r..B..'
  ]
]);

Sprites.def('npc_man', { T: '#c86838', t: '#96482a', S: '#e8b888', E: '#2c2c3e', H: '#5a3a20', P: '#5868a0' }, [
  [
    '.....HHHHH......',
    '....HHHHHHH.....',
    '....SSSSSSS.....',
    '....SESSSES.....',
    '....SSSSSSS.....',
    '.....SSSSS......',
    '...TTTTTTTTT....',
    '..TTTTTTTTTTT...',
    '..TSTTTTTTTST...',
    '..TSTTTTTTTST...',
    '...TTTTTTTTT....',
    '...PPPPPPPPP....',
    '....PP...PP.....',
    '....PP...PP.....',
    '...ttt...ttt....',
    '................'
  ],
  [
    '.....HHHHH......',
    '....HHHHHHH.....',
    '....SSSSSSS.....',
    '....SESSSES.....',
    '....SSSSSSS.....',
    '.....SSSSS......',
    '...TTTTTTTTT....',
    '..TTTTTTTTTTT...',
    '..TSTTTTTTTST...',
    '..TSTTTTTTTST...',
    '...TTTTTTTTT....',
    '...PPPPPPPPP....',
    '.....PP.PP......',
    '....PP...PP.....',
    '...ttt...ttt....',
    '................'
  ]
]);

Sprites.def('npc_woman', { D: '#c84878', d: '#a03058', S: '#f0c8a0', E: '#2c2c3e', H: '#d8a030', W: '#f0e8d8' }, [
  [
    '.....HHHHH......',
    '....HHHHHHH.....',
    '...HSSSSSSSH....',
    '...HSESSSESH....',
    '...HSSSSSSSH....',
    '....HSSSSSH.....',
    '....DDDDDDD.....',
    '...DDDDDDDDD....',
    '..DSDDDDDDDS D..',
    '..DSDDDDDDDSD...',
    '..DDDDDDDDDDD...',
    '..DDDDDDDDDDD...',
    '.DDDDDDDDDDDDD..',
    '.ddddddddddddd..',
    '....W.....W.....',
    '................'
  ],
  [
    '.....HHHHH......',
    '....HHHHHHH.....',
    '...HSSSSSSSH....',
    '...HSESSSESH....',
    '...HSSSSSSSH....',
    '....HSSSSSH.....',
    '....DDDDDDD.....',
    '...DDDDDDDDD....',
    '..DSDDDDDDDSD...',
    '..DSDDDDDDDSD...',
    '..DDDDDDDDDDD...',
    '..DDDDDDDDDDD...',
    '.DDDDDDDDDDDDD..',
    '.ddddddddddddd..',
    '.....W...W......',
    '................'
  ]
]);

Sprites.def('npc_shopkeep', { A: '#e0e0d8', a: '#b0b0a8', S: '#d8a878', E: '#2c2c3e', H: '#3a3a48', M: '#4a4a58', G: '#c8a030' }, [
  [
    '.....HHHHH......',
    '....HHHHHHH.....',
    '....SSSSSSS.....',
    '....SESSSES.....',
    '....SSSSSSS.....',
    '....SMMMMMS.....',
    '...MMMMMMMMM....',
    '..MMAAAAAAAM M..',
    '..MSAAAAAAASM...',
    '..MSAAGGGAASM...',
    '...MAAAAAAAM....',
    '...AAAAAAAAA....',
    '...AAAAAAAAA....',
    '....MM...MM.....',
    '...aaa...aaa....',
    '................'
  ],
  [
    '.....HHHHH......',
    '....HHHHHHH.....',
    '....SSSSSSS.....',
    '....SESSSES.....',
    '....SSSSSSS.....',
    '....SMMMMMS.....',
    '...MMMMMMMMM....',
    '..MMAAAAAAAMM...',
    '..MSAAAAAAASM...',
    '..MSAAGGGAASM...',
    '...MAAAAAAAM....',
    '...AAAAAAAAA....',
    '...AAAAAAAAA....',
    '.....MM.MM......',
    '...aaa...aaa....',
    '................'
  ]
]);

Sprites.def('npc_kid', { T: '#d87838', S: '#f0c8a0', E: '#2c2c3e', H: '#6a4828', P: '#4878b8' }, [
  [
    '................',
    '................',
    '.....HHHHH......',
    '....HHHHHHH.....',
    '....SSSSSSS.....',
    '....SESSSES.....',
    '.....SSSSS......',
    '....TTTTTTT.....',
    '...TSTTTTTST....',
    '...TSTTTTTST....',
    '....TTTTTTT.....',
    '....PP...PP.....',
    '....PP...PP.....',
    '...HH.....HH....',
    '................',
    '................'
  ],
  [
    '................',
    '................',
    '.....HHHHH......',
    '....HHHHHHH.....',
    '....SSSSSSS.....',
    '....SESSSES.....',
    '.....SSSSS......',
    '....TTTTTTT.....',
    '...TSTTTTTST....',
    '...TSTTTTTST....',
    '....TTTTTTT.....',
    '.....PP.PP......',
    '....PP...PP.....',
    '...HH.....HH....',
    '................',
    '................'
  ]
]);

Sprites.def('npc_princess', { D: '#e8d8f0', d: '#c0a8d8', S: '#f8d8b0', E: '#2c2c3e', H: '#e8c860', G: '#e8c030', P: '#c060a0' }, [
  [
    '....G.GGG.G.....',
    '....GGGGGGG.....',
    '...HHHHHHHHH....',
    '...HSSSSSSSH....',
    '...HSESSSESH....',
    '...HSSSSSSSH....',
    '...HHSSSSSHH....',
    '...HDDDDDDDH....',
    '..HDDDPPPDDDH...',
    '..HDDPDDDPDDH...',
    '..HDDDDDDDDDH...',
    '..DDDDDDDDDDD...',
    '.DDDDDDDDDDDDD..',
    '.DDDDDDDDDDDDD..',
    '.ddddddddddddd..',
    '................'
  ],
  [
    '....G.GGG.G.....',
    '....GGGGGGG.....',
    '...HHHHHHHHH....',
    '...HSSSSSSSH....',
    '...HSESSSESH....',
    '...HSSSSSSSH....',
    '...HHSSSSSHH....',
    '...HDDDDDDDH....',
    '..HDDDPPPDDDH...',
    '..HDDPDDDPDDH...',
    '..HDDDDDDDDDH...',
    '..DDDDDDDDDDD...',
    '.DDDDDDDDDDDDD..',
    '.DDDDDDDDDDDDD..',
    '.ddddddddddddd..',
    '................'
  ]
]);

Sprites.def('npc_guard', { A: '#7888a8', a: '#586880', S: '#e0b088', E: '#2c2c3e', R: '#a83838', T: '#98a8c0' }, [
  [
    '....TAAAAAT.....',
    '....AAAAAAA.....',
    '....ASSSSSA.....',
    '....ASESES A....',
    '....ASSSSSA.....',
    '.....SSSSS..R...',
    '...AAAAAAAA.R...',
    '..AAAAAAAAAAR...',
    '..ASAAAAAASAR...',
    '..ASARRRRASAR...',
    '...AAARRAAA.R...',
    '...AAAAAAAA.R...',
    '....AA..AA..R...',
    '....AA..AA..R...',
    '...aaa..aaa.....',
    '................'
  ],
  [
    '....TAAAAAT.....',
    '....AAAAAAA.....',
    '....ASSSSSA.....',
    '....ASESESA.....',
    '....ASSSSSA.....',
    '.....SSSSS..R...',
    '...AAAAAAAA.R...',
    '..AAAAAAAAAAR...',
    '..ASAAAAAASAR...',
    '..ASARRRRASAR...',
    '...AAARRAAA.R...',
    '...AAAAAAAA.R...',
    '.....AA.AA..R...',
    '....AA...AA.R...',
    '...aaa...aaa....',
    '................'
  ]
]);

Sprites.def('npc_fairy', { W: '#f8f8ff', P: '#f8b8d8', G: '#a8e8f8' }, [
  [
    '................',
    '....G......G....',
    '...GGG....GGG...',
    '...GGGG..GGGG...',
    '....GGWWWWGG....',
    '.....WWPPWW.....',
    '.....WPPPPW.....',
    '....GGWWWWGG....',
    '...GGGG..GGGG...',
    '...GGG....GGG...',
    '....G......G....',
    '................'
  ],
  [
    '................',
    '................',
    '..GG........GG..',
    '..GGGG....GGGG..',
    '...GGWWWWWWGG...',
    '.....WWPPWW.....',
    '.....WPPPPW.....',
    '...GGWWWWWWGG...',
    '..GGGG....GGGG..',
    '..GG........GG..',
    '................',
    '................'
  ]
]);

// ============================================================
// ITEMS & PICKUPS
// ============================================================
Sprites.def('heart', { R: '#e83048', r: '#b01830', W: '#f8a8b8' }, [
  [
    '................',
    '....RR...RR.....',
    '...RWRR.RRRR....',
    '...RRRRRRRRR....',
    '...RRRRRRRRR....',
    '....RRRRRRR.....',
    '.....RRRRR......',
    '......RRR.......',
    '.......R........',
    '................'
  ]
]);

Sprites.def('heart_container', { R: '#e83048', r: '#a01028', W: '#f8c8d0', G: '#e8c030' }, [
  [
    '...GG.....GG....',
    '..GRRG...GRRG...',
    '..RWWRR.RRRRR...',
    '.GRWRRRRRRRRRG..',
    '.GRRRRRRRRRRRG..',
    '..RRRRRRRRRRR...',
    '..GRRRRRRRRRG...',
    '...GRRRRRRRG....',
    '....RRRRRRR.....',
    '.....RRRRR......',
    '......RRR.......',
    '.......R........'
  ]
]);

Sprites.def('rupee', { G: '#38c848', g: '#289030', W: '#98f0a0' }, [
  [
    '......GG........',
    '.....GWWG.......',
    '....GWWGGG......',
    '....GWGGGG......',
    '....GGGGGG......',
    '....GGGGGG......',
    '....GGGGgg......',
    '....GGGggg......',
    '.....Gggg.......',
    '......gg........'
  ]
]);

Sprites.def('rupee_blue', { G: '#3878e8', g: '#2850a8', W: '#98c0f8' }, [
  [
    '......GG........',
    '.....GWWG.......',
    '....GWWGGG......',
    '....GWGGGG......',
    '....GGGGGG......',
    '....GGGGGG......',
    '....GGGGgg......',
    '....GGGggg......',
    '.....Gggg.......',
    '......gg........'
  ]
]);

Sprites.def('rupee_red', { G: '#e83848', g: '#a82030', W: '#f898a8' }, [
  [
    '......GG........',
    '.....GWWG.......',
    '....GWWGGG......',
    '....GWGGGG......',
    '....GGGGGG......',
    '....GGGGGG......',
    '....GGGGgg......',
    '....GGGggg......',
    '.....Gggg.......',
    '......gg........'
  ]
]);

Sprites.def('key', { K: '#e8c030', k: '#b09018' }, [
  [
    '.....KKK........',
    '....K...K.......',
    '....K...K.......',
    '.....KKK........',
    '......K.........',
    '......K.........',
    '......KK........',
    '......K.........',
    '......KK........',
    '................'
  ]
]);

Sprites.def('bosskey', { K: '#c83048', k: '#881828', G: '#e8c030' }, [
  [
    '....GKKKG.......',
    '...GK...KG......',
    '...K.....K......',
    '...GK...KG......',
    '....GKKKG.......',
    '......K.........',
    '......K.........',
    '......KK........',
    '......K.........',
    '......KK........'
  ]
]);

Sprites.def('bomb_item', { B: '#38384a', b: '#22222e', W: '#8888a0', F: '#f8a030' }, [
  [
    '.......F........',
    '......F.........',
    '......W.........',
    '....BBBBB.......',
    '...BBBBBBB......',
    '..BBWBBBBBB.....',
    '..BWBBBBBBB.....',
    '..BBBBBBBBB.....',
    '..BBBBBBBBB.....',
    '...BBBBBBB......',
    '....BBBBB.......',
    '................'
  ]
]);

Sprites.def('arrow_item', { W: '#e8e8f0', B: '#8a5a2b', F: '#d8d8e0' }, [
  [
    '.......W........',
    '......WWW.......',
    '.....WWWWW......',
    '.......B........',
    '.......B........',
    '.......B........',
    '.......B........',
    '.......B........',
    '......FBF.......',
    '.....F.B.F......',
    '................',
    '................'
  ]
]);

Sprites.def('bow', { B: '#a86828', b: '#7a4818', S: '#e8e8f0' }, [
  [
    '.....BB.........',
    '....B..B........',
    '...B....S.......',
    '...B....S.......',
    '...B....S.......',
    '...B....S.......',
    '...B....S.......',
    '...B....S.......',
    '...B....S.......',
    '....B..B........',
    '.....BB.........',
    '................'
  ]
]);

Sprites.def('lantern', { L: '#e8a030', l: '#b87818', M: '#68686e', F: '#f8e060' }, [
  [
    '.....MMM........',
    '....M...M.......',
    '....MMMMM.......',
    '...ML...LM......',
    '...ML.F.LM......',
    '...MLFFFLM......',
    '...ML.F.LM......',
    '...ML...LM......',
    '....MMMMM.......',
    '.....MMM........',
    '................',
    '................'
  ]
]);

Sprites.def('shard', { S: '#48d8e8', s: '#2898b0', W: '#c8f8ff' }, [
  [
    '.......S........',
    '......SWS.......',
    '.....SWWSS......',
    '.....SWSSS......',
    '....SWSSSSS.....',
    '....SSSSSSs.....',
    '....SSSSSss.....',
    '.....SSSss......',
    '.....SSsss......',
    '......Sss.......',
    '.......s........',
    '................'
  ]
]);

Sprites.def('shard_red', { S: '#e84858', s: '#a82838', W: '#f8c8d0' }, [
  [
    '.......S........',
    '......SWS.......',
    '.....SWWSS......',
    '.....SWSSS......',
    '....SWSSSSS.....',
    '....SSSSSSs.....',
    '....SSSSSss.....',
    '.....SSSss......',
    '.....SSsss......',
    '......Sss.......',
    '.......s........',
    '................'
  ]
]);

Sprites.def('shard_green', { S: '#48e858', s: '#28a838', W: '#c8f8d0' }, [
  [
    '.......S........',
    '......SWS.......',
    '.....SWWSS......',
    '.....SWSSS......',
    '....SWSSSSS.....',
    '....SSSSSSs.....',
    '....SSSSSss.....',
    '.....SSSss......',
    '.....SSsss......',
    '......Sss.......',
    '.......s........',
    '................'
  ]
]);

Sprites.def('potion', { R: '#e83878', r: '#a81848', G: '#c8c8d8', C: '#8a5a2b' }, [
  [
    '......CC........',
    '......GG........',
    '......GG........',
    '.....GGGG.......',
    '....GRRRRG......',
    '...GRRRRRRG.....',
    '...GRRRRRRG.....',
    '...GRRRRRRG.....',
    '....GRRRRG......',
    '.....GGGG.......',
    '................',
    '................'
  ]
]);

Sprites.def('shield_item', { S: '#4868b8', s: '#304888', W: '#c8d8f0', G: '#e8c030' }, [
  [
    '....SSSSSSS.....',
    '...SWSSSSSWS....',
    '...SSSGGSSSS....',
    '...SSGGGGSSS....',
    '...SSSGGSSSS....',
    '...SSSGGSSSS....',
    '....SSSSSSs.....',
    '....sSSSSSs.....',
    '.....sSSSs......',
    '......sSs.......',
    '.......s........',
    '................'
  ]
]);

Sprites.def('sunstone', { G: '#f8d030', g: '#c8a018', W: '#fff8c0' }, [
  [
    '.......GG.......',
    '......GWWG......',
    '.....GWWWWG.....',
    '....GWWWWWWG....',
    '...GGWWWWWWGG...',
    '..GGGGWWWWGGGG..',
    '..GGGGGGGGGGGG..',
    '...GGGGggGGGG...',
    '....GGGggGGG....',
    '.....GGggGG.....',
    '......GggG......',
    '.......gg.......'
  ]
]);

Sprites.def('map_item', { P: '#e8d8a8', p: '#c0a878', R: '#c84838', B: '#3868a8' }, [
  [
    '...PPPPPPPPP....',
    '...PPBPPPPPP....',
    '...PPBBPPPPP....',
    '...PPPBBPPPP....',
    '...PPPPBPPRP....',
    '...PPPPBBPPP....',
    '...PPPPPBPPP....',
    '...PPPPPBBPP....',
    '...PPPPPPPPP....',
    '...ppppppppp....',
    '................',
    '................'
  ]
]);

Sprites.def('compass_item', { G: '#e8c030', g: '#b09018', W: '#f0f0f8', R: '#c83838' }, [
  [
    '.....GGGG.......',
    '....GWWWWG......',
    '...GWWRWWWG.....',
    '...GWWRWWWG.....',
    '...GWWRWWWG.....',
    '...GWWWWWWG.....',
    '....GWWWWG......',
    '.....GGGG.......',
    '................',
    '................',
    '................',
    '................'
  ]
]);

// projectiles
Sprites.def('arrow_proj', { W: '#e8e8f0', B: '#8a5a2b' }, [
  [
    '.......W........',
    '......WWW.......',
    '.......B........',
    '.......B........',
    '.......B........',
    '.......B........',
    '......B.B.......'
  ]
]);

Sprites.def('rock_proj', { R: '#a89078', r: '#786450' }, [
  [
    '..RRR...',
    '.RRRRR..',
    '.RRRrr..',
    '.RRrrr..',
    '..rrr...'
  ]
]);

Sprites.def('fireball', { F: '#f8a030', f: '#e85818', W: '#f8e060' }, [
  [
    '...FF...',
    '..FWWF..',
    '.FWWWWf.',
    '.FWWWWf.',
    '..FWWf..',
    '...ff...'
  ],
  [
    '...ff...',
    '..fFFf..',
    '.fFWWFf.',
    '.fFWWFf.',
    '..fFFf..',
    '...ff...'
  ]
]);

Sprites.def('magic_bolt', { M: '#c858e8', m: '#8830b0', W: '#f0c8f8' }, [
  [
    '...MM...',
    '..MWWM..',
    '.MWWWWm.',
    '.MWWWWm.',
    '..MWWm..',
    '...mm...'
  ],
  [
    '.M..m...',
    '..MWWm..',
    '.MWWWWm.',
    'mWWWWM..',
    '..mWWM..',
    '...m..M.'
  ]
]);

Sprites.def('bomb_placed', { B: '#38384a', b: '#22222e', W: '#8888a0', F: '#f8a030' }, [
  [
    '.......F........',
    '......F.........',
    '......W.........',
    '....BBBBB.......',
    '...BBBBBBB......',
    '..BBWBBBBBB.....',
    '..BWBBBBBBB.....',
    '..BBBBBBBBB.....',
    '..BBBBBBBBB.....',
    '...BBBBBBB......',
    '....BBBBB.......',
    '................'
  ],
  [
    '................',
    '......FW........',
    '......W.........',
    '....BBBBB.......',
    '...BBBBBBB......',
    '..BBWBBBBBB.....',
    '..BWBBBBBBB.....',
    '..BBBBBBBBB.....',
    '..BBBBBBBBB.....',
    '...BBBBBBB......',
    '....BBBBB.......',
    '................'
  ]
]);

// objects
Sprites.def('chest', { B: '#a06828', b: '#784818', G: '#e8c030', D: '#583410' }, [
  [ // closed
    '..BBBBBBBBBBB...',
    '.BBBBBBBBBBBBB..',
    '.BbbbbbbbbbbbB..',
    '.BBBBBGGBBBBBB..',
    '.BBBBBGGBBBBBB..',
    '.BbbbbbbbbbbbB..',
    '.BBBBBBBBBBBBB..',
    '.DDDDDDDDDDDDD..',
    '................'
  ],
  [ // open
    '.DDDDDDDDDDDDD..',
    '.DbbbbbbbbbbbD..',
    '.BBBBBBBBBBBBB..',
    '.BBBBBBBBBBBBB..',
    '.BbbbbbGGbbbbB..',
    '.BBBBBBBBBBBBB..',
    '.BBBBBBBBBBBBB..',
    '.DDDDDDDDDDDDD..',
    '................'
  ]
]);

Sprites.def('pot', { P: '#c88848', p: '#986030', W: '#e8b878' }, [
  [
    '.....PPPP.......',
    '....P....P......',
    '....PPPPPP......',
    '...PWPPPPPP.....',
    '...PWPPPPPP.....',
    '...PPPPPPPP.....',
    '....PPPPPp......',
    '.....pppp.......',
    '................'
  ]
]);

Sprites.def('sign', { W: '#b08850', w: '#886430', D: '#5a4020' }, [
  [
    '..WWWWWWWWWWW...',
    '..WwwwwwwwwwW...',
    '..WwWWwwWWwwW...',
    '..WwwwwwwwwwW...',
    '..WwWWwWWwwwW...',
    '..WWWWWWWWWWW...',
    '.......DD.......',
    '.......DD.......',
    '................'
  ]
]);

Sprites.def('door_locked', { D: '#68482a', d: '#4a3018', K: '#e8c030', S: '#8a8a98' }, [
  [
    '.SSSSSSSSSSSSS..',
    '.SDDDDDDDDDDDS..',
    '.SDdDDDDDDdDDS..',
    '.SDDDDDDDDDDDS..',
    '.SDDDDKKDDDDDS..',
    '.SDDDDKKDDDDDS..',
    '.SDDDDDKDDDDDS..',
    '.SDdDDDDDDdDDS..',
    '.SDDDDDDDDDDDS..',
    '.SDDDDDDDDDDDS..',
    '.SDDDDDDDDDDDS..',
    '.SDDDDDDDDDDDS..',
    '.SDDDDDDDDDDDS..',
    '.SDDDDDDDDDDDS..',
    '.SDDDDDDDDDDDS..',
    '.SSSSSSSSSSSSS..'
  ]
]);

Sprites.def('door_boss', { D: '#3a2848', d: '#281a34', K: '#c83048', S: '#585868' }, [
  [
    '.SSSSSSSSSSSSS..',
    '.SDDDDDDDDDDDS..',
    '.SDdDDDDDDdDDS..',
    '.SDDDKKKKDDDDS..',
    '.SDDKK..KKDDDS..',
    '.SDDK.KK.KDDDS..',
    '.SDDKK..KKDDDS..',
    '.SDDDKKKKDDDDS..',
    '.SDDDDKDDDDDDS..',
    '.SDDDDKDDDDDDS..',
    '.SDDDDKKDDDDDS..',
    '.SDdDDDDDDdDDS..',
    '.SDDDDDDDDDDDS..',
    '.SDDDDDDDDDDDS..',
    '.SDDDDDDDDDDDS..',
    '.SSSSSSSSSSSSS..'
  ]
]);

Sprites.def('switch_crystal', { C: '#4898e8', c: '#2860a8', W: '#b8e0f8', S: '#68687a' }, [
  [ // blue (untriggered)
    '......CC........',
    '.....CWWC.......',
    '....CWWWCC......',
    '....CWWCCC......',
    '....CCCCCc......',
    '.....CCCc.......',
    '....SSSSSS......',
    '...SSSSSSSS.....',
    '................'
  ],
  [ // red (triggered)
    '......RR........',
    '.....RWWR.......',
    '....RWWWRR......',
    '....RWWRRR......',
    '....RRRRRr......',
    '.....RRRr.......',
    '....SSSSSS......',
    '...SSSSSSSS.....',
    '................'
  ]
]);
// patch red palette into frame 2 of switch
Sprites.defs['switch_crystal'].palette.R = '#e84858';
Sprites.defs['switch_crystal'].palette.r = '#a82838';

Sprites.def('torch', { W: '#8a6a3a', F: '#f8a030', f: '#f8e060', D: '#5a4020' }, [
  [
    '......ff........',
    '.....fFFf.......',
    '.....FFFF.......',
    '......FF........',
    '.....WWWW.......',
    '......WW........',
    '......WW........',
    '......WW........',
    '.....DWWD.......',
    '................'
  ],
  [
    '.....f.f........',
    '......fFf.......',
    '.....FFFF.......',
    '......FF........',
    '.....WWWW.......',
    '......WW........',
    '......WW........',
    '......WW........',
    '.....DWWD.......',
    '................'
  ]
]);

Sprites.def('grave_obj', { S: '#8a8a98', s: '#5a5a68', G: '#4a7a3a' }, [
  [
    '.....SSSS.......',
    '....SSSSSS......',
    '....SSssSS......',
    '....SSSSSS......',
    '....SSssSS......',
    '....SSSSSS......',
    '....SSSSSS......',
    '...SSSSSSSS.....',
    '..GGGGGGGGGG....',
    '................'
  ]
]);

// slash arc effect frames (drawn around player during swing)
Sprites.def('slash', { W: '#f8f8ff', w: '#a8c8f0' }, [
  [
    '..........WW....',
    '........WWWw....',
    '......WWWww.....',
    '....WWWww.......',
    '...WWww.........',
    '..WWw...........',
    '..Ww............',
    '..W.............'
  ],
  [
    '................',
    '............W...',
    '..........WWw...',
    '........WWWw....',
    '......WWWww.....',
    '....WWWww.......',
    '..WWWww.........',
    '..Www...........'
  ]
]);

// ============================================================
// FROSTPEAK CONTENT — wolfos, freezard, blade trap, Frostmaw,
// boomerang, soup, ice shard, hermit
// ============================================================

// Wolfos — grey wolf that circles and lunges
Sprites.def('wolfos', { G: '#8a8a9a', g: '#5c5c6c', W: '#e8e8f0', E: '#f0d030', N: '#26262e', T: '#d8d8e0' }, [
  [
    '..GG............',
    '..GGG....GG.....',
    '..GGGG..GGG.....',
    '..gGGGGGGGGG....',
    '...GGGGGGGGGG...',
    '...GGEGGGGGGGg..',
    '...GGGGGGWWGGN..',
    '....gGGGWWWTT...',
    '..gGGGGGWWW.....',
    '..GGGGGGGWW.....',
    '..GGg.gGGg......',
    '..Gg...Gg.......',
    '..g.....g.......'
  ],
  [
    '..GG............',
    '..GGG....GG.....',
    '..GGGG..GGG.....',
    '..gGGGGGGGGG....',
    '...GGGGGGGGGG...',
    '...GGEGGGGGGGg..',
    '...GGGGGGWWGGN..',
    '....gGGGWWWTT...',
    '..gGGGGGWWW.....',
    '..GGGGGGGWW.....',
    '...gGG.GGg......',
    '...Gg...gG......',
    '...g.....g......'
  ]
]);

// Freezard — squat ice turret that breathes shard spreads
Sprites.def('freezard', { I: '#a8d8f0', i: '#6898c8', C: '#4878b0', E: '#2c4c88', W: '#e8f6fc' }, [
  [
    '.....IIIII......',
    '....IIWIIII.....',
    '...IIIIIIIII....',
    '..IIEIIIIIEII...',
    '..IIIIIIIIIII...',
    '..IIiCCCCCiII...',
    '..IIiCCCCCiII...',
    '...IIiiiiiII....',
    '..iIIIIIIIIIi...',
    '..iIIIIIIIIIi...',
    '.iiIIIIIIIIIii..',
    '.ii..iiiii..ii..'
  ],
  [
    '.....IIIII......',
    '....IIIIWII.....',
    '...IIIIIIIII....',
    '..IIEIIIIIEII...',
    '..IIIIiIiIIII...',
    '..IIiCCCCCiII...',
    '..IIiCCCCCiII...',
    '...IIiiiiiII....',
    '..iIIIIIIIIIi...',
    '..iIIIIIIIIIi...',
    '.iiIIIIIIIIIii..',
    '.ii..iiiii..ii..'
  ]
]);

// Blade trap — invulnerable spiked slider
Sprites.def('blade_trap', { S: '#c8c8d8', s: '#8a8a9a', K: '#48485a', R: '#c83048' }, [
  [
    '.......SS.......',
    '...S...SS...S...',
    '...SS.SSSS.SS...',
    '....SSSssSSS....',
    '.....SssssS.....',
    '..SSSsKKKKsSSS..',
    '..SSssKRRKssSS..',
    '..SSssKRRKssSS..',
    '..SSSsKKKKsSSS..',
    '.....SssssS.....',
    '....SSSssSSS....',
    '...SS.SSSS.SS...',
    '...S...SS...S...',
    '.......SS.......'
  ],
  [
    '................',
    '....S..SS..S....',
    '....SS.SS.SS....',
    '....SSSssSSS....',
    '..SSSssssssSSS..',
    '...SssKKKKssS...',
    '...SssKRRKssS...',
    '...SssKRRKssS...',
    '...SssKKKKssS...',
    '..SSSssssssSSS..',
    '....SSSssSSS....',
    '....SS.SS.SS....',
    '....S..SS..S....',
    '................'
  ]
]);

// Boss: FROSTMAW — Jaws of the Glacier (great ice-armored wolf)
Sprites.def('boss_frostmaw', { W: '#e8f0f8', w: '#b0c4d4', I: '#88b8d8', i: '#5484b0', E: '#e83048', T: '#f8f8ff', N: '#2c3444', M: '#802030' }, [
  [
    '....WW....................WW....',
    '...WWWW..................WWWW...',
    '...WIWWW................WWWIW...',
    '...WIIWWWWWWWWWWWWWWWWWWWWIIW...',
    '..WWIIWWWWWWWWWWWWWWWWWWWWIIWW..',
    '..WWWWWWWWWWWWWWWWWWWWWWWWWWWW..',
    '..WWWEEWWWWWWWWWWWWWWWWWWEEWWW..',
    '..WWWEEWWWWWIIIIIIWWWWWWWEEWWW..',
    '..WWWWWWWWIIIIIIIIIIWWWWWWWWWW..',
    '...WWWWWWIIiiiiiiiiIIWWWWWWWW...',
    '...WWWWWWIiWWWWWWWWiIWWWWWWWW...',
    '...wWWWWWWWWWWWWWWWWWWWWWWWWw...',
    '...wWWNNWWWWWWWWWWWWWWWWNNWWw...',
    '...wWNNNNWWWWWWWWWWWWWWNNNNWw...',
    '....WWNNWWWWWWWWWWWWWWWWNNWW....',
    '....wWWWWWMMMMMMMMMMMMWWWWWw....',
    '....wWWWMMMMMMMMMMMMMMMMWWWw....',
    '....wWWMMTMMTMMTTMMTMMTMMWWw....',
    '....wWWMTTMTTMTTTTMTTMTTMWWw....',
    '.....wWMMMMMMMMMMMMMMMMMMWw.....',
    '.....wWWMMMMMMMMMMMMMMMMWWw.....',
    '.....wWWWWWWWWWWWWWWWWWWWWw.....',
    '.....wWWIIWWWWWWWWWWWWIIWWw.....',
    '.....wWIIiIWWWWWWWWWWIiIIWw.....',
    '......wWIiWWWWWWWWWWWWiIWw......',
    '......wWWWWWWWwwWWWWWWWWWw......',
    '......wWWWWWww..wwWWWWWWw.......',
    '......wWWWww......wwWWWw........',
    '.......www..........www.........',
    '................................',
    '................................',
    '................................'
  ],
  [
    '....WW....................WW....',
    '...WWWW..................WWWW...',
    '...WIWWW................WWWIW...',
    '...WIIWWWWWWWWWWWWWWWWWWWWIIW...',
    '..WWIIWWWWWWWWWWWWWWWWWWWWIIWW..',
    '..WWWWWWWWWWWWWWWWWWWWWWWWWWWW..',
    '..WWWEEWWWWWWWWWWWWWWWWWWEEWWW..',
    '..WWWEEWWWWWIIIIIIWWWWWWWEEWWW..',
    '..WWWWWWWWIIIIIIIIIIWWWWWWWWWW..',
    '...WWWWWWIIiiiiiiiiIIWWWWWWWW...',
    '...WWWWWWIiWWWWWWWWiIWWWWWWWW...',
    '...wWWWWWWWWWWWWWWWWWWWWWWWWw...',
    '...wWWNNWWWWWWWWWWWWWWWWNNWWw...',
    '...wWNNNNWWWWWWWWWWWWWWNNNNWw...',
    '....WWNNWWWWWWWWWWWWWWWWNNWW....',
    '....wWWWWMMMMMMMMMMMMMMWWWWw....',
    '....wWWMMMMMMMMMMMMMMMMMMWWw....',
    '....wWWMTTMTTMTTTTMTTMTTMWWw....',
    '....wWWMMTMMTMMTTMMTMMTMMWWw....',
    '.....wWMMMMMMMMMMMMMMMMMMWw.....',
    '.....wWWMMMMMMMMMMMMMMMMWWw.....',
    '.....wWWWWWWWWWWWWWWWWWWWWw.....',
    '.....wWWIIWWWWWWWWWWWWIIWWw.....',
    '.....wWIIiIWWWWWWWWWWIiIIWw.....',
    '......wWIiWWWWWWWWWWWWiIWw......',
    '......wWWWWWWwwWWwWWWWWWWw......',
    '......wWWWww..ww..wwWWWWw.......',
    '......wWWw..........wWWw........',
    '.......ww............ww.........',
    '................................',
    '................................',
    '................................'
  ]
]);

// Boomerang — item + spinning projectile
Sprites.def('boomerang', { B: '#c89858', b: '#96682a', W: '#f0e0c0' }, [
  [
    '..........BB....',
    '.........BBWB...',
    '........BBWB....',
    '.......BBWB.....',
    '......BBWB......',
    '.....BBWB.......',
    '....BBWB........',
    '...BBBB.........',
    '..BBBBb.........',
    '..BBbb..........',
    '..bb............',
    '................'
  ]
]);

// Hot soup — the hermit's favor
Sprites.def('soup', { B: '#b06838', b: '#7c4622', S: '#e8a030', s: '#c87818', W: '#f0f0f0' }, [
  [
    '.....W..W.......',
    '....W..W........',
    '.....W..W.......',
    '................',
    '...SSSSSSSSS....',
    '..BSssSSSssSB...',
    '..BBSSSSSSSBB...',
    '..BBBBBBBBBBB...',
    '...BBBBBBBBB....',
    '....BbbbbbB.....',
    '.....bbbbb......',
    '................'
  ]
]);

// Ice shard projectile
Sprites.def('ice_proj', { I: '#b8e8f8', i: '#68a8e0', W: '#f0fafd' }, [
  [
    '...W....',
    '..WII...',
    '..III...',
    '.IIIIi..',
    '..IIii..',
    '..Iii...',
    '...i....',
    '........'
  ],
  [
    '...I....',
    '..IIW...',
    '..IWI...',
    '.iIIIi..',
    '..IIii..',
    '..iii...',
    '...i....',
    '........'
  ]
]);

// Hermit of Frostpeak — bundled in furs
Sprites.def('npc_hermit', { F: '#b8a488', f: '#8a765a', S: '#e8bc8a', E: '#1c1c2e', W: '#d8d8e0', H: '#6a5a44' }, [
  [
    '....FFFFFF......',
    '...FFFFFFFF.....',
    '..FFFFFFFFFF....',
    '..FFfSSSSfFF....',
    '..FFSSESSESF....',
    '..FFSSSSSSFF....',
    '..FFSWWWWSFF....',
    '...FFSWWSFF.....',
    '..FFFFFFFFFF....',
    '..FfFFFFFFfF....',
    '..FfFFFFFFfF....',
    '..FFFFFFFFFF....',
    '...HHH..HHH.....',
    '...HHH..HHH.....'
  ],
  [
    '....FFFFFF......',
    '...FFFFFFFF.....',
    '..FFFFFFFFFF....',
    '..FFfSSSSfFF....',
    '..FFSSESSESF....',
    '..FFSSSSSSFF....',
    '..FFSWWWWSFF....',
    '...FFSWWSFF.....',
    '..FFFFFFFFFF....',
    '..FfFFFFFFfF....',
    '..FfFFFFFFfF....',
    '..FFFFFFFFFF....',
    '....HHHHHH......',
    '...HHH..HHH.....'
  ]
]);

// ============================================================
// SANDS & DEPTHS CONTENT — gibdo, vulture, sandwurm, Pharaghast,
// fire rod, flippers, lure, quiver, fisherman, nomad, spirit,
// rancher, cucco
// ============================================================

// Gibdo — bandaged mummy; hates fire
Sprites.def('gibdo', { W: '#d8cca8', w: '#a89c78', E: '#c03030', K: '#4a4438' }, [
  [
    '....WWWWWW......',
    '...WWwWWwWW.....',
    '...WWWWWWWW.....',
    '...WEwWWwEW.....',
    '...WWWWWWWW.....',
    '...WwWWWWwW.....',
    '....WWwwWW......',
    '...WWWWWWWW.....',
    '..WWwWWWWwWW....',
    '..WwWWwwWWwW....',
    '..WW.WWWW.WW....',
    '.....WwwW.......',
    '....WWW.WWW.....',
    '....www.www.....'
  ],
  [
    '....WWWWWW......',
    '...WWwWWwWW.....',
    '...WWWWWWWW.....',
    '...WEwWWwEW.....',
    '...WWWWWWWW.....',
    '...WwWWWWwW.....',
    '....WWwwWW......',
    '...WWWWWWWW.....',
    '..WWwWWWWwWW....',
    '..WwWWwwWWwW....',
    '..WW.WWWW.WW....',
    '.....WwwW.......',
    '...WWW...WWW....',
    '...www...www....'
  ]
]);

// Vulture — circling dive-bomber of the dunes
Sprites.def('vulture', { V: '#6a5a48', v: '#4c4034', W: '#d8ccb0', E: '#f0d030', B: '#c87838' }, [
  [
    'VV............VV',
    'VVVV........VVVV',
    '.VVVVV....VVVVV.',
    '..VVVVVVVVVVVV..',
    '....VVVVVVVV....',
    '.....VWWWWV.....',
    '.....WEWWEW.....',
    '......WBBW......',
    '.......BB.......',
    '................'
  ],
  [
    '................',
    '................',
    '..VV........VV..',
    '..VVVVVVVVVVVV..',
    '...VVVVVVVVVV...',
    '.....VWWWWV.....',
    '.....WEWWEW.....',
    '......WBBW......',
    '.......BB.......',
    '................'
  ]
]);

// Sandwurm — erupts from the dunes
Sprites.def('sandwurm', { S: '#c8a868', s: '#a08248', M: '#804838', E: '#f0d030', T: '#f0e8d8' }, [
  [
    '.....SSSSS......',
    '....SSSSSSS.....',
    '...SSESSSES.....',
    '...SSSSSSSS.....',
    '...SMMMMMMS.....',
    '...SMTMTMTS.....',
    '...SSMMMMSS.....',
    '....SSSSSSs.....',
    '....sSSSSs......',
    '.....sSSs.......',
    '....sSSSSs......',
    '...sSSSSSSs.....'
  ],
  [
    '.....SSSSS......',
    '....SSSSSSS.....',
    '...SSESSSES.....',
    '...SSSSSSSS.....',
    '...SMMMMMMS.....',
    '...SMTMTMTS.....',
    '...SSMMMMSS.....',
    '....sSSSSSs.....',
    '.....sSSs.......',
    '....sSSSSs......',
    '.....sSSs.......',
    '....sSSSSSs.....'
  ]
]);

// Boss: PHARAGHAST — the Hollow King (regal mummy wreathed in sand)
Sprites.def('boss_pharaghast', { G: '#e8c040', g: '#b08820', W: '#d8cca8', w: '#a89c78', E: '#48d8e0', K: '#28242c', B: '#4878c8', S: '#c8a868' }, [
  [
    '..........GGGGGGGGGGG..........',
    '.........GGGGGGGGGGGGG.........',
    '........GGBGGGGGGGGBGG.........',
    '........GGGGGGGGGGGGGG.........',
    '.........GgGgGgGgGgGg..........',
    '.........WWWWWWWWWWWW..........',
    '........WWwWWWWWWWwWWW.........',
    '........WWEEWWWWWWEEWW.........',
    '........WWEEWWWWWWEEWW.........',
    '........WWWWWWwwWWWWWW.........',
    '.........WWwKKKKKKwWW..........',
    '.........WWWKKKKKKWWW..........',
    '..........WWWWWWWWWW...........',
    '.......GGWWWWWWWWWWWWGG........',
    '......GGWWwWWWWWWWWwWWGG.......',
    '.....GGWWWWWWwwwwWWWWWWGG......',
    '.....GWWwWWWwwwwwwWWWwWWG......',
    '.....GWWWWWWwwwwwwWWWWWWG......',
    '......WWwWWWWwwwwWWWWwWW.......',
    '......WWWWWWWWWWWWWWWWWW.......',
    '.......WWwWWWWWWWWWWwWW........',
    '.......WWWWWwWWWWwWWWWW........',
    '........WwWWWWWWWWWWwW.........',
    '.........SSWWwWWwWWSS..........',
    '........SSSSWWWWWWSSSS.........',
    '.......SSsSSSWWWWSSSsSS........',
    '......SSSSSSSSSSSSSSSSSS.......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
  ],
  [
    '..........GGGGGGGGGGG..........',
    '.........GGGGGGGGGGGGG.........',
    '........GGBGGGGGGGGBGG.........',
    '........GGGGGGGGGGGGGG.........',
    '.........GgGgGgGgGgGg..........',
    '.........WWWWWWWWWWWW..........',
    '........WWwWWWWWWWwWWW.........',
    '........WWEEWWWWWWEEWW.........',
    '........WWEEWWWWWWEEWW.........',
    '........WWWWWWwwWWWWWW.........',
    '.........WWwKKKKKKwWW..........',
    '.........WWWKKKKKKWWW..........',
    '..........WWWWWWWWWW...........',
    '.......GGWWWWWWWWWWWWGG........',
    '......GGWWwWWWWWWWWwWWGG.......',
    '.....GGWWWWWWwwwwWWWWWWGG......',
    '.....GWWwWWWwwwwwwWWWwWWG......',
    '.....GWWWWWWwwwwwwWWWWWWG......',
    '......WWwWWWWwwwwWWWWwWW.......',
    '......WWWWWWWWWWWWWWWWWW.......',
    '.......WWwWWWWWWWWWWwWW........',
    '.......WWWWWwWWWWwWWWWW........',
    '........WwWWWWWWWWWWwW.........',
    '..........SSWwWWwWSS...........',
    '.........SSSSWWWWSSSS..........',
    '........SSsSSWWWWSSsSS.........',
    '.......SSSSSSSSSSSSSSSS........',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
  ]
]);

// Fire Rod — flame at the tip
Sprites.def('fire_rod', { R: '#8a4a28', r: '#6a3418', F: '#f8a030', f: '#f8e060', O: '#e85818' }, [
  [
    '..........fF....',
    '.........fFFO...',
    '.........FFO....',
    '..........O.....',
    '.........RR.....',
    '........RRr.....',
    '.......RRr......',
    '......RRr.......',
    '.....RRr........',
    '....RRr.........',
    '...RRr..........',
    '...rr...........'
  ]
]);

// Zora Flippers
Sprites.def('flippers', { B: '#4878c8', b: '#2c54a0', W: '#a8d0f0' }, [
  [
    '................',
    '..BB......BB....',
    '..BBB....BBB....',
    '..BBBB..BBBB....',
    '..BWBB..BWBB....',
    '..BWBBB.BWBBB...',
    '..BBBBB.BBBBB...',
    '..BBBBBbBBBBB...',
    '..bBBBBbbBBBb...',
    '..bbBBbb.bBbb...',
    '...bbbb..bbb....',
    '................'
  ]
]);

// Lucky Lure — the fisherman's treasure
Sprites.def('lure', { R: '#e84848', W: '#f0f0f0', S: '#c8c8d8', Y: '#f0d030' }, [
  [
    '.......S........',
    '.......S........',
    '.......S........',
    '......RRR.......',
    '.....RRRRR......',
    '.....RWWRR......',
    '.....RWWRR......',
    '.....WWWWW......',
    '.....WWWWW......',
    '......WWW.......',
    '......YSY.......',
    '.......S........'
  ]
]);

// Big Quiver
Sprites.def('quiver', { B: '#a8814e', b: '#7a5830', S: '#c8c8d8', F: '#e84848', W: '#f0e0c0' }, [
  [
    '....S..S..S.....',
    '....F..F..F.....',
    '....W..W..W.....',
    '...BBBBBBBBB....',
    '...BBbBBBbBB....',
    '...BBBBBBBBB....',
    '...BBBBBBBBB....',
    '...BBbBBBbBB....',
    '...BBBBBBBBB....',
    '...bBBBBBBBb....',
    '....bbbbbbb.....',
    '................'
  ]
]);

// Boss: KARSTAG — the Seventh Stone (barrow golem)
Sprites.def('boss_karstag', { S: '#9a9aa8', s: '#6e6e7c', D: '#4a4a58', E: '#68d8f0', M: '#2c2c38', G: '#7a8a6a' }, [
  [
    '..........SSSSSSSSSS............',
    '........SSSSSSSSSSSSSS..........',
    '.......SSSGSSSSSSSSGSSS.........',
    '......SSSSSSSSSSSSSSSSSS........',
    '......SSsEESSSSSSSSEEsSS........',
    '......SSsEESSSSSSSSEEsSS........',
    '......SSSSSSSSssSSSSSSSS........',
    '......sSSSSSsMMMMsSSSSSs........',
    '.......sSSSSSMMMMSSSSSs.........',
    '....SSSSssSSSSSSSSSSssSSSS......',
    '...SSSSSSSssssssssssSSSSSSS.....',
    '..SSSsSSSSSSSSSSSSSSSSSsSSS.....',
    '..SSsSSGSSSSSSSSSSSSGSSsSSS.....',
    '..SSsSSSSSSSsssSSSSSSSSsSSS.....',
    '..sSsSSSSSssDDDssSSSSSSsSs......',
    '..sSsSSSSsDDDDDDDsSSSSSsSs......',
    '..sSsSSSSsDDDDDDDsSSSSSsSs......',
    '...SsSSSSSsDDDDDsSSSSSSsS.......',
    '...ssSSSSSSsssssSSSSSSSss.......',
    '....sSSSSSSSSSSSSSSSSSSs........',
    '.....sSSSSSSSSSSSSSSSSs.........',
    '.....SSSSSssSSSSssSSSSS.........',
    '....SSSSSs..SSSS..sSSSSS........',
    '....SSSSs...SSSS...sSSSS........',
    '...SSSSS...sSSSSs...SSSSS.......',
    '...sssss...ssssss...sssss.......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
  ],
  [
    '..........SSSSSSSSSS............',
    '........SSSSSSSSSSSSSS..........',
    '.......SSSGSSSSSSSSGSSS.........',
    '......SSSSSSSSSSSSSSSSSS........',
    '......SSsEESSSSSSSSEEsSS........',
    '......SSsEESSSSSSSSEEsSS........',
    '......SSSSSSSSssSSSSSSSS........',
    '......sSSSSSsMMMMsSSSSSs........',
    '.......sSSSSSMMMMSSSSSs.........',
    '...SSSSssSSSSSSSSSSssSSSS.......',
    '..SSSSSSSsssssssssssSSSSSSS.....',
    '..SSSsSSSSSSSSSSSSSSSSSsSSSS....',
    '..SSsSSGSSSSSSSSSSSSGSSsSSSS....',
    '..SSsSSSSSSSsssSSSSSSSSsSSSS....',
    '..sSsSSSSSssDDDssSSSSSSsSss.....',
    '..sSsSSSSsDDDDDDDsSSSSSsSs......',
    '..sSsSSSSsDDDDDDDsSSSSSsSs......',
    '...SsSSSSSsDDDDDsSSSSSSsS.......',
    '...ssSSSSSSsssssSSSSSSSss.......',
    '....sSSSSSSSSSSSSSSSSSSs........',
    '.....sSSSSSSSSSSSSSSSSs.........',
    '.....SSSSSssSSSSssSSSSS.........',
    '....SSSSs...SSSS..sSSSSS........',
    '...SSSSs....SSSS...sSSSS........',
    '...SSSS....sSSSSs....SSSS.......',
    '...ssss....ssssss....ssss.......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
  ]
]);

// Pearl of the Deep
Sprites.def('pearl', { P: '#e8f0f8', p: '#b8ccd8', B: '#4878c8', W: '#ffffff', S: '#88b8d8' }, [
  [
    '................',
    '.....SSSSS......',
    '....SPPPPPS.....',
    '...SPPWWPPPS....',
    '...SPWWPPPPS....',
    '...SPPPPPPpS....',
    '...SPPPPPppS....',
    '....SPpppppS....',
    '.....SSSSS......',
    '....BBBBBBB.....',
    '...BBBBBBBBB....',
    '................'
  ]
]);

// Big Bomb Bag
Sprites.def('bombbag', { B: '#6a5038', b: '#4c3824', K: '#26262e', F: '#e8a030', W: '#f0e0c0' }, [
  [
    '......KK........',
    '.....KKKK.......',
    '....F.KK........',
    '...BBBBBBBB.....',
    '..BBBBBBBBBB....',
    '..BBWBBBBBBB....',
    '..BBWBBBBBBB....',
    '..BBBBBBBBBB....',
    '..BBBBBBBBBB....',
    '..bBBBBBBBBb....',
    '...bbBBBBbb.....',
    '.....bbbb.......'
  ]
]);

// Fisherman Odon — bucket hat and better days
Sprites.def('npc_fisher', { H: '#5a8a4a', h: '#3f6a34', S: '#f2c894', E: '#1c1c2e', B: '#4878c8', b: '#2c54a0', W: '#f0f0f0', R: '#8a5a2b' }, [
  [
    '....HHHHHH......',
    '...HHHHHHHH...R.',
    '..HHhhhhhhHH..R.',
    '...hSSSSSSh...R.',
    '...SSESSES....R.',
    '...SSSSSSS..W.R.',
    '....SSSSS...W.R.',
    '...BBBBBBBB.WR..',
    '..BBBBBBBBBB.R..',
    '..BbBBBBBBbB....',
    '..Bb.BBBB.bB....',
    '....BBBB........',
    '....bb.bb.......',
    '...bbb.bbb......'
  ],
  [
    '....HHHHHH......',
    '...HHHHHHHH...R.',
    '..HHhhhhhhHH..R.',
    '...hSSSSSSh...R.',
    '...SSESSES....R.',
    '...SSSSSSS..W.R.',
    '....SSSSS...W.R.',
    '...BBBBBBBB.WR..',
    '..BBBBBBBBBB.R..',
    '..BbBBBBBBbB....',
    '..Bb.BBBB.bB....',
    '....BBBB........',
    '....bb..bb......',
    '...bb....bb.....'
  ]
]);

// Zaffa the caravaneer — desert robes
Sprites.def('npc_nomad', { T: '#c86838', t: '#984e28', S: '#c89468', E: '#1c1c2e', W: '#f0e8d8', P: '#6848a0' }, [
  [
    '....TTTTTT......',
    '...TTTTTTTT.....',
    '..TTTPPPPTTT....',
    '..TTSSSSSSTT....',
    '..TTSESSESTT....',
    '...TSSSSSST.....',
    '....SSSSSS......',
    '...WWWWWWWW.....',
    '..WWWWWWWWWW....',
    '..WtWWWWWWtW....',
    '..Wt.WWWW.tW....',
    '....WWWW........',
    '....tt.tt.......',
    '...ttt.ttt......'
  ],
  [
    '....TTTTTT......',
    '...TTTTTTTT.....',
    '..TTTPPPPTTT....',
    '..TTSSSSSSTT....',
    '..TTSESSESTT....',
    '...TSSSSSST.....',
    '....SSSSSS......',
    '...WWWWWWWW.....',
    '..WWWWWWWWWW....',
    '..WtWWWWWWtW....',
    '..Wt.WWWW.tW....',
    '....WWWW........',
    '....tt..tt......',
    '...tt....tt.....'
  ]
]);

// Lorelei — spirit of Lake Hylia
Sprites.def('npc_spirit', { B: '#78c8e8', b: '#4898c8', W: '#e8f6fc', E: '#2c4c88', G: '#a8e8d8' }, [
  [
    '....BBBBBB......',
    '...BBBBBBBB.....',
    '..BBWWWWWWBB....',
    '..BWWEWWEWWB....',
    '..BWWWWWWWWB....',
    '...WWWGGWWW.....',
    '....WWWWWW......',
    '...BBBBBBBB.....',
    '..GBBBBBBBBG....',
    '..GBBBBBBBBG....',
    '...BBBBBBBB.....',
    '....BBBBBB......',
    '.....BBBB.......',
    '......BB........'
  ],
  [
    '....BBBBBB......',
    '...BBBBBBBB.....',
    '..BBWWWWWWBB....',
    '..BWWEWWEWWB....',
    '..BWWWWWWWWB....',
    '...WWWGGWWW.....',
    '....WWWWWW......',
    '...BBBBBBBB.....',
    '..GBBBBBBBBG....',
    '..GBBBBBBBBG....',
    '...BBBBBBBB.....',
    '....BBBBBB......',
    '.....BBB........',
    '....BB..........'
  ]
]);

// Rancher Elda — straw hat and overalls
Sprites.def('npc_rancher', { H: '#e0c060', h: '#b89838', S: '#f2c894', E: '#1c1c2e', O: '#4878c8', o: '#2c54a0', R: '#c85858', W: '#f0e8d8' }, [
  [
    '....HHHHHH......',
    '..HHHHHHHHHH....',
    '..hhhhhhhhhh....',
    '...SSSSSSSS.....',
    '...SSESSESS.....',
    '...SSSSSSSS.....',
    '....SSSSSS......',
    '...RRROORRR.....',
    '..RRROOOORRR....',
    '..RROOOOOORR....',
    '...OOOOOOOO.....',
    '...OOOOOOOO.....',
    '....oo..oo......',
    '...ooo..ooo.....'
  ],
  [
    '....HHHHHH......',
    '..HHHHHHHHHH....',
    '..hhhhhhhhhh....',
    '...SSSSSSSS.....',
    '...SSESSESS.....',
    '...SSSSSSSS.....',
    '....SSSSSS......',
    '...RRROORRR.....',
    '..RRROOOORRR....',
    '..RROOOOOORR....',
    '...OOOOOOOO.....',
    '...OOOOOOOO.....',
    '...oo....oo.....',
    '..ooo....ooo....'
  ]
]);

// Pella the prize cucco
Sprites.def('npc_cucco', { W: '#f8f8f0', w: '#d8d0c0', R: '#e84848', B: '#f0a030', E: '#1c1c2e' }, [
  [
    '................',
    '................',
    '......R.........',
    '.....WWWW.......',
    '....WWEWWW......',
    '...BWWWWWWW.....',
    '....WWWWWWWW....',
    '.....WWWWWWw....',
    '.....WwWWWw.....',
    '......wWWw......',
    '......B.B.......',
    '................'
  ],
  [
    '................',
    '......R.........',
    '.....WWWW.......',
    '....WWEWWW......',
    '...BWWWWWWW.....',
    '....WWWWWWWW....',
    '...W.WWWWWWw....',
    '....WWwWWWw.....',
    '.....wWWWw......',
    '......wWw.......',
    '......B.B.......',
    '................'
  ]
]);

// ============================================================
// THE GREAT TRADE — seven treasures passed hand to hand
// ============================================================
Sprites.def('shell', { P: '#f0d8e0', p: '#d0a8b8', W: '#f8f0f4', S: '#b08898' }, [
  [
    '................',
    '.....PPPP.......',
    '....PPWWPP......',
    '...PPWWWWPP.....',
    '...PWWPPWWPS....',
    '...PWPPPPWPS....',
    '...PPWPPWPSS....',
    '....PPWWPSS.....',
    '.....PPPSS......',
    '......pSS.......',
    '.......S........',
    '................'
  ]
]);

Sprites.def('toy_boat', { B: '#a8814e', b: '#7a5830', W: '#f0f0f0', M: '#c8b078' }, [
  [
    '.......M........',
    '.......M........',
    '.....WWM........',
    '....WWWM........',
    '...WWWWM........',
    '.......M........',
    '..BBBBBBBBBB....',
    '..bBBBBBBBBb....',
    '...bBBBBBBb.....',
    '....bbbbbb......',
    '................',
    '................'
  ]
]);

Sprites.def('fish', { F: '#88a8c8', f: '#5878a0', W: '#e8f0f8', E: '#1c1c2e' }, [
  [
    '................',
    '................',
    '..........FF....',
    '..FFFFFFF.FF....',
    '.FEFFFFFFFFF....',
    '.FFFFFFFFFFF....',
    '..FFFFFFF.FF....',
    '...fffff..ff....',
    '................',
    '................',
    '................',
    '................'
  ]
]);

Sprites.def('wool', { W: '#f0ece0', w: '#d0c8b8', S: '#b8b0a0' }, [
  [
    '................',
    '....WWWWWW......',
    '...WWwWWWWW.....',
    '..WWWWWwWWWW....',
    '..WwWWWWWWwW....',
    '..WWWwWWWWWW....',
    '..WWWWWWwWWW....',
    '...WWwWWWWW.....',
    '....WWWWWW......',
    '......SS........',
    '.......SS.......',
    '................'
  ]
]);

Sprites.def('sailcloth', { C: '#e8e0d0', c: '#c8bca8', R: '#c85858' }, [
  [
    '................',
    '..CCCCCCCCCC....',
    '..CcCCCCCCcC....',
    '..CCRRRRRRCC....',
    '..CcCCCCCCcC....',
    '..CCCCCCCCCC....',
    '..CcCCCCCCcC....',
    '..CCCCCCCCCC....',
    '...cCCCCCCc.....',
    '....cccccc......',
    '................',
    '................'
  ]
]);

Sprites.def('spyglass', { G: '#c8a030', g: '#96751c', K: '#48485a', L: '#a8d8f0' }, [
  [
    '................',
    '..........KK....',
    '.........KLK....',
    '........KKK.....',
    '.......GGG......',
    '......GGG.......',
    '.....GGG........',
    '....ggG.........',
    '...gGG..........',
    '..ggg...........',
    '................',
    '................'
  ]
]);

Sprites.def('hero_charm', { G: '#f0d030', g: '#c8a018', W: '#f8f8ff', B: '#4878c8' }, [
  [
    '................',
    '.......G........',
    '......GGG.......',
    '.....GGBGG......',
    '....GGBBBGG.....',
    '...GGBBWBBGG....',
    '...GGBBBBBGG....',
    '....GGBBBGG.....',
    '.....GGBGG......',
    '......GgG.......',
    '.......g........',
    '................'
  ]
]);

// sword beam — loosed at full hearts by the Hero's Charm
Sprites.def('sword_beam', { W: '#f8f8ff', B: '#a8c8f8', b: '#6890e0' }, [
  [
    '...W....',
    '..WWW...',
    '..WBW...',
    '..BWB...',
    '..bBb...',
    '...b....',
    '........',
    '........'
  ],
  [
    '...W....',
    '..WBW...',
    '..BWB...',
    '..WBW...',
    '..bbb...',
    '...b....',
    '........',
    '........'
  ]
]);

// Boss: THALASSA — the Drowned Choir (sea-wraith of the cathedral)
Sprites.def('boss_thalassa', { B: '#78b8d8', b: '#4884a8', W: '#e8f6fc', w: '#b0d4e4', E: '#e8f0a0', K: '#1c3444', G: '#a8e8d8' }, [
  [
    '.............WWWWWW.............',
    '...........WWWWWWWWWW...........',
    '..........WWBBBBBBBBWW..........',
    '.........WWBBWWWWWWBBWW.........',
    '.........WBBWEEWWEEWBBW.........',
    '.........WBBWEEWWEEWBBW.........',
    '.........WBBWWWWWWWWBBW.........',
    '.........WBBWWKKKKWWBBW.........',
    '..........WBWWKKKKWWBW..........',
    '.......BBWWBBWWWWWWBBWWBB.......',
    '......BBBBWBBBBBBBBBBWBBBB......',
    '.....BBGBBBBBBBBBBBBBBBBGBB.....',
    '.....BBBBBBBWWBBBBWWBBBBBBB.....',
    '....BBbBBBBWWWWBBWWWWBBBBbBB....',
    '....BBbBBBBWWWWBBWWWWBBBBbBB....',
    '....BbBBBBBBWWBBBBWWBBBBBBbB....',
    '....BbBBBBBBBBBBBBBBBBBBBBbB....',
    '....BbBBGBBBBBBBBBBBBBBGBBbB....',
    '.....BbBBBBBBBBBBBBBBBBBBbB.....',
    '.....BbbBBBBBBBBBBBBBBBBbbB.....',
    '......BbbBBBBBBBBBBBBBBbbB......',
    '......BBbbBBBBBBBBBBBBbbBB......',
    '.......BBbbbBBBBBBBBbbbBB.......',
    '........BBbbbbBBBBbbbbBB........',
    '.........BBbbbbbbbbbbBB.........',
    '..........BB.bb..bb.BB..........',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
  ],
  [
    '.............WWWWWW.............',
    '...........WWWWWWWWWW...........',
    '..........WWBBBBBBBBWW..........',
    '.........WWBBWWWWWWBBWW.........',
    '.........WBBWEEWWEEWBBW.........',
    '.........WBBWEEWWEEWBBW.........',
    '.........WBBWWWWWWWWBBW.........',
    '.........WBBWWKKKKWWBBW.........',
    '..........WBWWKKKKWWBW..........',
    '......BBWWBBWWWWWWWWBBWWBB......',
    '.....BBBBWBBBBBBBBBBBBWBBBB.....',
    '.....BBGBBBBBBBBBBBBBBBBGBB.....',
    '.....BBBBBBBWWBBBBWWBBBBBBB.....',
    '....BBbBBBBWWWWBBWWWWBBBBbBB....',
    '....BBbBBBBWWWWBBWWWWBBBBbBB....',
    '....BbBBBBBBWWBBBBWWBBBBBBbB....',
    '....BbBBBBBBBBBBBBBBBBBBBBbB....',
    '....BbBBGBBBBBBBBBBBBBBGBBbB....',
    '.....BbBBBBBBBBBBBBBBBBBBbB.....',
    '.....BbbBBBBBBBBBBBBBBBBbbB.....',
    '......BbbBBBBBBBBBBBBBBbbB......',
    '......BBbbBBBBBBBBBBBBbbBB......',
    '.......BBbbbBBBBBBBBbbbBB.......',
    '........BBbbbbBBBBbbbbBB........',
    '..........BBbbbbbbbbBB..........',
    '.........BB..bb..bb..BB.........',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................'
  ]
]);

// Tideplate — armor of the drowned choir
Sprites.def('tideplate', { T: '#4884a8', t: '#2c5878', W: '#a8d8e8', G: '#a8e8d8' }, [
  [
    '................',
    '...TT.....TT....',
    '..TTTTTTTTTT....',
    '..TTWTTTTWTT....',
    '..TTTTTTTTTT....',
    '...TTTGGTTT.....',
    '...TTGWWGTT.....',
    '...TTTGGTTT.....',
    '...TTTTTTTT.....',
    '...tTTTTTTt.....',
    '....tttttt......',
    '................'
  ]
]);

// Waystone — the old fast-travel network (frame 1 = awakened)
Sprites.def('waystone', { S: '#8a8a9a', s: '#5c5c6c', R: '#48485a', G: '#68d8f0', g: '#a8ecf8' }, [
  [
    '.....SSSSS......',
    '....SSSSSSS.....',
    '...SSSRRSSS.....',
    '...SSRSSRSS.....',
    '...SSSRRSSS.....',
    '...SSRSSRSS.....',
    '...SSSRRSSS.....',
    '...sSSSSSSs.....',
    '...sSSSSSSs.....',
    '..ssSSSSSSss....',
    '..sssssssss.....',
    '................'
  ],
  [
    '.....SSSSS......',
    '....SSSSSSS.....',
    '...SSSGGSSS.....',
    '...SSGSSGSS.....',
    '...SSSGGSSS.....',
    '...SSGSSgSS.....',
    '...SSSggSSS.....',
    '...sSSSSSSs.....',
    '...sSSSSSSs.....',
    '..ssSSSSSSss....',
    '..sssssssss.....',
    '................'
  ]
]);

// Grimroot — a tree that was always watching (frame 0 = disguised)
Sprites.def('grimroot', { T: '#3a2a50', t: '#241a2e', B: '#4a3662', E: '#e8d040', M: '#802030', W: '#d8c8e8' }, [
  [
    '.....TTTTT......',
    '....TTTTTTT.....',
    '...TTBTTTBTT....',
    '...TTTTTTTTT....',
    '...TBTTTTTBT....',
    '....TTTTTTT.....',
    '.....TTTTT......',
    '......ttt.......',
    '......ttt.......',
    '.....tttt.......',
    '....tt..tt......',
    '...tt....tt.....'
  ],
  [
    '.....TTTTT......',
    '....TTTTTTT.....',
    '...TTETTTETT....',
    '...TTTTTTTTT....',
    '...TBMMMMMBT....',
    '....TMWMWMT.....',
    '.....MMMMM......',
    '......ttt.......',
    '.....ttttt......',
    '....tt.t.tt.....',
    '...tt..t..tt....',
    '..tt...t...tt...'
  ]
]);

// Vampire — arrives on wings, leaves as mist
Sprites.def('vampire', { K: '#1c1424', k: '#2e2438', S: '#e8e0e8', E: '#e83048', W: '#f8f8ff', R: '#802030' }, [
  [
    '....KKKKKK......',
    '...KKKKKKKK.....',
    '...KSSSSSSK.....',
    '...KSESSESK.....',
    '...KSSSSSSK.....',
    '....SSWWSS......',
    '...KKSWWSKK.....',
    '..KKKKKKKKKK....',
    '..KKRKKKKRKK....',
    '..KKKKKKKKKK....',
    '...KKKKKKKK.....',
    '....KK..KK......'
  ],
  [
    '.KK..........KK.',
    '.KKK.KKKKKK.KKK.',
    '..KKKKSSSSKKKK..',
    '...KKSESSESKK...',
    '...KKSSSSSSKK...',
    '....KSSWWSSK....',
    '....KKSWWSKK....',
    '...KKKKKKKKKK...',
    '...KKRKKKKRKK...',
    '....KKKKKKKK....',
    '.....KKKKKK.....',
    '......K..K......'
  ]
]);

// Elite aliases — the editor and tools look sprites up by enemy type name
Sprites.defs.direwolf = Sprites.defs.wolfos;
Sprites.defs.dunetyrant = Sprites.defs.sandwurm;
Sprites.defs.ogre = Sprites.defs.moblin;
