// ============================================================
// audio.js — WebAudio sfx synth + chiptune music sequencer
// ============================================================
'use strict';

const AudioSys = {
  ctx: null,
  sfxGain: null,
  musicGain: null,
  sfxVolume: 0.7,
  musicVolume: 0.5,
  currentTrack: null,
  seq: null,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.ctx.destination);
    } catch (e) { console.warn('WebAudio unavailable', e); }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  setSfxVolume(v) { this.sfxVolume = v; if (this.sfxGain) this.sfxGain.gain.value = v; },
  setMusicVolume(v) { this.musicVolume = v; if (this.musicGain) this.musicGain.gain.value = v; },

  // ---- SFX synth ---------------------------------------------------
  // tone(freq, dur, type, vol, slide, delay)
  tone(freq, dur, type = 'square', vol = 0.3, slide = 0, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  },

  noise(dur, vol = 0.3, freq = 1000, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t);
  },

  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'sword':
        this.noise(0.12, 0.25, 3500);
        this.tone(700, 0.08, 'sawtooth', 0.12, -400);
        break;
      case 'spin':
        this.noise(0.3, 0.3, 3000);
        this.tone(400, 0.3, 'sawtooth', 0.15, 500);
        break;
      case 'hit':
        this.noise(0.1, 0.35, 900);
        this.tone(180, 0.1, 'square', 0.2, -80);
        break;
      case 'hurt':
        this.tone(300, 0.2, 'square', 0.3, -180);
        this.noise(0.15, 0.2, 600);
        break;
      case 'kill':
        this.tone(500, 0.08, 'square', 0.2, -200);
        this.tone(300, 0.15, 'square', 0.2, -200, 0.06);
        this.noise(0.2, 0.25, 1200, 0.05);
        break;
      case 'rupee':
        this.tone(1320, 0.07, 'square', 0.2);
        this.tone(1760, 0.12, 'square', 0.2, 0, 0.06);
        break;
      case 'heart':
        this.tone(880, 0.1, 'sine', 0.3);
        this.tone(1320, 0.15, 'sine', 0.3, 0, 0.08);
        break;
      case 'key':
        this.tone(988, 0.09, 'square', 0.2);
        this.tone(1319, 0.09, 'square', 0.2, 0, 0.08);
        this.tone(1760, 0.15, 'square', 0.2, 0, 0.16);
        break;
      case 'chest': {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => this.tone(f, 0.14, 'square', 0.22, 0, i * 0.11));
        break;
      }
      case 'item': {
        const n2 = [659, 784, 988, 1319, 1568];
        n2.forEach((f, i) => this.tone(f, 0.16, 'square', 0.22, 0, i * 0.12));
        break;
      }
      case 'secret': {
        const n3 = [784, 740, 698, 659, 831, 784, 1046, 1318];
        n3.forEach((f, i) => this.tone(f, 0.1, 'square', 0.2, 0, i * 0.09));
        break;
      }
      case 'bow':
        this.noise(0.08, 0.2, 4000);
        this.tone(900, 0.15, 'sawtooth', 0.12, 600);
        break;
      case 'bomb_place':
        this.tone(220, 0.1, 'square', 0.2, -60);
        break;
      case 'explosion':
        this.noise(0.5, 0.5, 400);
        this.tone(80, 0.4, 'sawtooth', 0.4, -50);
        break;
      case 'menu':
        this.tone(880, 0.05, 'square', 0.12);
        break;
      case 'select':
        this.tone(660, 0.06, 'square', 0.15);
        this.tone(990, 0.1, 'square', 0.15, 0, 0.05);
        break;
      case 'error':
        this.tone(200, 0.15, 'square', 0.2, -50);
        break;
      case 'text':
        this.tone(U.rand(700, 900), 0.02, 'square', 0.04);
        break;
      case 'stairs':
        [400, 350, 300, 250].forEach((f, i) => this.tone(f, 0.1, 'triangle', 0.2, 0, i * 0.08));
        break;
      case 'door':
        this.noise(0.2, 0.3, 500);
        this.tone(150, 0.2, 'square', 0.15, -50);
        break;
      case 'unlock':
        this.tone(500, 0.08, 'square', 0.2);
        this.noise(0.1, 0.2, 2000, 0.08);
        this.tone(750, 0.12, 'square', 0.2, 0, 0.1);
        break;
      case 'switch':
        this.tone(1200, 0.1, 'sine', 0.25, 400);
        this.tone(1600, 0.15, 'sine', 0.2, 0, 0.08);
        break;
      case 'splash':
        this.noise(0.25, 0.25, 800);
        break;
      case 'fire':
        this.noise(0.3, 0.2, 600);
        break;
      case 'boss_roar':
        this.tone(90, 0.6, 'sawtooth', 0.4, -30);
        this.tone(120, 0.5, 'square', 0.3, -40, 0.1);
        this.noise(0.6, 0.3, 300);
        break;
      case 'boss_hurt':
        this.tone(200, 0.3, 'sawtooth', 0.35, -120);
        this.noise(0.25, 0.3, 700);
        break;
      case 'charge':
        this.tone(300, 0.4, 'sine', 0.15, 500);
        break;
      case 'heal': {
        const n4 = [523, 659, 784, 1047, 1319];
        n4.forEach((f, i) => this.tone(f, 0.2, 'sine', 0.2, 0, i * 0.07));
        break;
      }
      case 'buy':
        this.tone(1047, 0.08, 'square', 0.2);
        this.tone(1319, 0.08, 'square', 0.2, 0, 0.07);
        this.tone(1568, 0.14, 'square', 0.2, 0, 0.14);
        break;
      case 'thunder':
        this.noise(0.8, 0.5, 250);
        this.tone(60, 0.7, 'sawtooth', 0.4, -20);
        break;
      case 'warp': {
        for (let i = 0; i < 8; i++) this.tone(400 + i * 150, 0.1, 'triangle', 0.15, 200, i * 0.05);
        break;
      }
      case 'boomerang':
        this.noise(0.18, 0.18, 3000);
        this.tone(520, 0.12, 'triangle', 0.15, 260);
        this.tone(640, 0.12, 'triangle', 0.12, -200, 0.1);
        break;
    }
  },

  // ---- Music sequencer ---------------------------------------------
  // Tracks are defined as {bpm, loop, channels:[{type,vol,notes:[[note,beats],...]}]}
  // note = semitone offset from A4 (null = rest)
  play(trackName) {
    if (!this.ctx) return;
    if (this.currentTrack === trackName) return;
    this.stop();
    const track = MUSIC[trackName];
    if (!track) return;
    this.currentTrack = trackName;
    this.seq = { track, name: trackName, nextTime: this.ctx.currentTime + 0.1, pos: track.channels.map(() => 0), beat: track.channels.map(() => 0) };
    this._tick();
  },

  stop() {
    this.currentTrack = null;
    if (this.seq && this.seq.timer) clearTimeout(this.seq.timer);
    this.seq = null;
  },

  _noteFreq(n) { return 440 * Math.pow(2, n / 12); },

  _tick() {
    if (!this.seq) return;
    const s = this.seq, t = s.track;
    const beatDur = 60 / t.bpm;
    const ahead = this.ctx.currentTime + 0.6; // schedule 600ms ahead
    // schedule per channel independently
    for (let c = 0; c < t.channels.length; c++) {
      const ch = t.channels[c];
      let chTime = s.nextTime + s.beat[c] * beatDur;
      while (chTime < ahead) {
        const note = ch.notes[s.pos[c] % ch.notes.length];
        const [n, beats] = note;
        const dur = beats * beatDur;
        if (n !== null) {
          if (ch.type === 'noise') {
            this._noiseAt(chTime, Math.min(dur * 0.5, 0.09), ch.vol, n > 0 ? 6000 : 2500);
          } else {
            this._toneAt(this._noteFreq(n), chTime, dur * (ch.stac || 0.85), ch.type, ch.vol);
          }
        }
        s.beat[c] += beats;
        s.pos[c]++;
        chTime = s.nextTime + s.beat[c] * beatDur;
      }
    }
    s.timer = setTimeout(() => this._tick(), 250);
  },

  _toneAt(freq, t, dur, type, vol) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + Math.max(0.01, dur - 0.04));
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.musicGain);
    o.start(t); o.stop(t + dur + 0.05);
  },

  _noiseAt(t, dur, vol, freq) {
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.musicGain);
    src.start(t);
  }
};

// ============================================================
// Music data — note = semitones from A4 (A=0, C5=3, etc.)
// ============================================================
// helper offsets: C4=-9 D4=-7 E4=-5 F4=-4 G4=-2 A4=0 B4=2 C5=3 D5=5 E5=7 F5=8 G5=10 A5=12
const MUSIC = {
  title: {
    bpm: 76,
    channels: [
      { type: 'triangle', vol: 0.16, notes: [ // slow noble melody
        [-9, 2], [-2, 1], [3, 1], [7, 2], [5, 1], [3, 1],
        [-2, 2], [0, 1], [3, 1], [5, 4],
        [-9, 2], [-2, 1], [3, 1], [8, 2], [7, 1], [5, 1],
        [3, 2], [5, 1], [-2, 1], [3, 4]
      ] },
      { type: 'sine', vol: 0.12, notes: [ // bass
        [-21, 4], [-16, 4], [-19, 4], [-14, 4],
        [-21, 4], [-13, 4], [-16, 4], [-21, 4]
      ] }
    ]
  },
  overworld: {
    bpm: 132,
    channels: [
      { type: 'square', vol: 0.09, notes: [ // heroic melody
        [3, 1.5], [-2, 0.5], [-2, 0.5], [3, 0.5], [5, 0.5], [7, 0.5],
        [8, 1.5], [8, 0.5], [8, 0.5], [10, 0.5], [12, 0.5], [10, 0.5],
        [8, 1], [7, 1], [8, 0.5], [7, 0.5], [5, 1],
        [3, 2], [null, 2],
        [3, 1.5], [-2, 0.5], [-2, 0.5], [3, 0.5], [5, 0.5], [7, 0.5],
        [8, 1], [12, 1], [10, 0.5], [8, 0.5], [7, 0.5], [8, 0.5],
        [10, 1], [7, 1], [3, 1], [5, 0.5], [-2, 0.5],
        [3, 2], [null, 2]
      ] },
      { type: 'triangle', vol: 0.14, notes: [ // bass
        [-21, 1], [-14, 1], [-21, 1], [-14, 1],
        [-16, 1], [-9, 1], [-16, 1], [-9, 1],
        [-19, 1], [-12, 1], [-19, 1], [-12, 1],
        [-21, 1], [-14, 1], [-21, 1], [-14, 1]
      ] },
      { type: 'noise', vol: 0.05, notes: [
        [1, 1], [0, 0.5], [1, 0.5], [1, 1], [0, 0.5], [1, 0.5]
      ] }
    ]
  },
  town: {
    bpm: 108,
    channels: [
      { type: 'square', vol: 0.08, notes: [
        [3, 1], [5, 1], [7, 1.5], [5, 0.5],
        [3, 1], [0, 1], [-2, 2],
        [0, 1], [3, 1], [5, 1.5], [3, 0.5],
        [0, 1], [-2, 1], [-9+12, 2],
        [7, 1], [8, 1], [10, 1.5], [8, 0.5],
        [7, 1], [5, 1], [3, 2],
        [5, 1], [3, 1], [0, 1], [-2, 1],
        [3, 3], [null, 1]
      ] },
      { type: 'triangle', vol: 0.13, notes: [
        [-21, 1], [-14, 0.5], [-14, 0.5], [-16, 1], [-9, 0.5], [-9, 0.5],
        [-19, 1], [-12, 0.5], [-12, 0.5], [-14, 1], [-14, 1]
      ] }
    ]
  },
  village: {
    bpm: 96,
    channels: [
      { type: 'triangle', vol: 0.15, notes: [
        [-2, 1.5], [0, 0.5], [3, 1], [0, 1],
        [-2, 1], [-4, 1], [-9, 2],
        [-4, 1.5], [-2, 0.5], [0, 1], [3, 1],
        [0, 1], [-2, 1], [-2, 2],
        [-2, 1.5], [0, 0.5], [3, 1], [5, 1],
        [7, 1], [5, 1], [3, 2],
        [0, 1], [3, 1], [-2, 1], [-4, 1],
        [-9, 3], [null, 1]
      ] },
      { type: 'sine', vol: 0.11, notes: [
        [-21, 2], [-16, 2], [-19, 2], [-14, 2]
      ] }
    ]
  },
  dungeon: {
    bpm: 100,
    channels: [
      { type: 'square', vol: 0.07, notes: [
        [-9, 1], [-8, 1], [-9, 1], [-4, 1],
        [-9, 1], [-8, 1], [-9, 2],
        [-6, 1], [-5, 1], [-6, 1], [-1, 1],
        [-6, 1], [-5, 1], [-6, 2]
      ] },
      { type: 'triangle', vol: 0.14, notes: [
        [-21, 2], [-20, 2], [-21, 2], [-18, 1], [-20, 1]
      ] },
      { type: 'noise', vol: 0.03, notes: [
        [0, 2], [1, 2]
      ] }
    ]
  },
  cave: {
    bpm: 80,
    channels: [
      { type: 'triangle', vol: 0.12, notes: [
        [-9, 2], [-6, 2], [-4, 2], [-6, 2],
        [-9, 2], [-11, 2], [-13, 4]
      ] },
      { type: 'sine', vol: 0.1, notes: [
        [-21, 4], [-18, 4], [-25, 8]
      ] }
    ]
  },
  boss: {
    bpm: 150,
    channels: [
      { type: 'sawtooth', vol: 0.07, notes: [
        [-9, 0.5], [-9, 0.5], [-8, 0.5], [-9, 0.5], [-4, 1], [-5, 0.5], [-4, 0.5],
        [-9, 0.5], [-9, 0.5], [-8, 0.5], [-9, 0.5], [-1, 1], [-3, 0.5], [-1, 0.5],
        [0, 0.5], [-1, 0.5], [0, 0.5], [-1, 0.5], [-4, 1], [-6, 1],
        [-8, 0.5], [-9, 0.5], [-8, 0.5], [-6, 0.5], [-9, 2]
      ] },
      { type: 'square', vol: 0.09, notes: [
        [-21, 0.5], [-21, 0.5], [-20, 0.5], [-21, 0.5],
        [-21, 0.5], [-21, 0.5], [-16, 0.5], [-18, 0.5]
      ] },
      { type: 'noise', vol: 0.06, notes: [
        [1, 0.5], [0, 0.5], [1, 0.5], [1, 0.5]
      ] }
    ]
  },
  finalboss: {
    bpm: 160,
    channels: [
      { type: 'sawtooth', vol: 0.08, notes: [
        [-6, 0.5], [-6, 0.5], [-5, 0.5], [-6, 0.5], [0, 1], [-1, 0.5], [0, 0.5],
        [2, 0.5], [0, 0.5], [-1, 0.5], [0, 0.5], [-6, 1], [-8, 1],
        [-6, 0.5], [-1, 0.5], [0, 0.5], [2, 0.5], [3, 1], [2, 0.5], [0, 0.5],
        [-1, 0.5], [0, 0.5], [-1, 0.5], [-3, 0.5], [-6, 2]
      ] },
      { type: 'square', vol: 0.1, notes: [
        [-18, 0.5], [-18, 0.5], [-17, 0.5], [-18, 0.5],
        [-13, 0.5], [-13, 0.5], [-18, 0.5], [-16, 0.5]
      ] },
      { type: 'noise', vol: 0.07, notes: [
        [1, 0.5], [1, 0.5], [0, 0.25], [0, 0.25], [1, 0.5]
      ] }
    ]
  },
  ending: {
    bpm: 84,
    channels: [
      { type: 'triangle', vol: 0.15, notes: [
        [3, 2], [5, 1], [7, 1], [8, 2], [7, 1], [5, 1],
        [7, 2], [5, 1], [3, 1], [0, 4],
        [3, 2], [5, 1], [7, 1], [12, 2], [10, 1], [8, 1],
        [7, 2], [8, 1], [10, 1], [15, 4]
      ] },
      { type: 'sine', vol: 0.12, notes: [
        [-21, 4], [-16, 4], [-19, 4], [-14, 4],
        [-21, 4], [-13, 4], [-16, 2], [-14, 2], [-9, 4]
      ] }
    ]
  },
  gameover: {
    bpm: 60,
    channels: [
      { type: 'triangle', vol: 0.15, notes: [
        [-9, 2], [-11, 2], [-13, 2], [-16, 4], [null, 4]
      ] }
    ]
  },
  sea: {
    bpm: 100,
    channels: [
      { type: 'triangle', vol: 0.13, notes: [ // rolling shanty swell
        [-2, 1.5], [0, 0.5], [3, 1], [5, 1],
        [7, 1.5], [5, 0.5], [3, 1], [0, 1],
        [-2, 1.5], [0, 0.5], [3, 1], [7, 1],
        [5, 2], [3, 2],
        [0, 1.5], [3, 0.5], [5, 1], [7, 1],
        [8, 1.5], [7, 0.5], [5, 1], [3, 1],
        [5, 1], [3, 1], [0, 1], [-2, 1],
        [-2, 2], [null, 2]
      ] },
      { type: 'sine', vol: 0.11, notes: [ // tide bass
        [-21, 3], [-14, 1], [-16, 3], [-9, 1],
        [-19, 3], [-12, 1], [-14, 2], [-21, 2]
      ] },
      { type: 'noise', vol: 0.025, notes: [ // spray on the rocks
        [0, 3.5], [1, 0.5]
      ] }
    ]
  },
  highlands: {
    bpm: 112,
    channels: [
      { type: 'square', vol: 0.07, notes: [ // wind-worn reel
        [0, 1], [3, 0.5], [5, 0.5], [7, 1], [5, 1],
        [3, 1], [5, 0.5], [3, 0.5], [0, 2],
        [-2, 1], [0, 0.5], [3, 0.5], [5, 1], [7, 1],
        [10, 1], [7, 0.5], [5, 0.5], [3, 2],
        [0, 1], [3, 0.5], [5, 0.5], [7, 1], [10, 1],
        [12, 1.5], [10, 0.5], [7, 1], [5, 1],
        [3, 1], [5, 1], [0, 1], [-2, 1],
        [0, 3], [null, 1]
      ] },
      { type: 'triangle', vol: 0.13, notes: [ // stride bass
        [-21, 1], [-16, 1], [-14, 1], [-16, 1],
        [-19, 1], [-14, 1], [-12, 1], [-14, 1]
      ] }
    ]
  },
  elderwood: {
    bpm: 84,
    channels: [
      { type: 'triangle', vol: 0.12, notes: [ // old roots, slow turning
        [-4, 2], [-2, 1], [0, 1], [-2, 2], [-4, 1], [-7, 1],
        [-4, 2], [0, 1], [3, 1], [0, 2], [-2, 2],
        [-4, 2], [-2, 1], [0, 1], [5, 2], [3, 1], [0, 1],
        [-2, 2], [-4, 2], [-7, 4]
      ] },
      { type: 'sine', vol: 0.1, notes: [ // deep loam
        [-23, 4], [-19, 4], [-21, 4], [-16, 2], [-19, 2]
      ] },
      { type: 'square', vol: 0.025, notes: [ // something watching, politely
        [null, 6], [8, 0.5], [7, 0.5], [null, 7], [12, 1]
      ] }
    ]
  },
  tomb: {
    bpm: 96,
    channels: [
      { type: 'square', vol: 0.07, notes: [ // serpentine phrygian line
        [-9, 1], [-8, 0.5], [-9, 0.5], [-5, 1], [-4, 1],
        [-5, 0.5], [-4, 0.5], [-5, 1], [-9, 2],
        [-2, 1], [-4, 0.5], [-5, 0.5], [-4, 1], [-8, 1],
        [-9, 1], [-8, 1], [-9, 2]
      ] },
      { type: 'triangle', vol: 0.13, notes: [ // dry march bass
        [-21, 1.5], [-21, 0.5], [-16, 1], [-21, 1],
        [-20, 1.5], [-20, 0.5], [-16, 1], [-20, 1]
      ] },
      { type: 'noise', vol: 0.035, notes: [ // sand shaker
        [0, 0.5], [1, 0.5], [0, 0.5], [0, 0.25], [1, 0.25]
      ] }
    ]
  },
  glacier: {
    bpm: 92,
    channels: [
      { type: 'triangle', vol: 0.12, notes: [ // crystalline falling figure
        [7, 1], [3, 1], [0, 1], [3, 1],
        [5, 1], [2, 1], [-2, 1], [2, 1],
        [3, 1], [0, 1], [-4, 1], [0, 1],
        [-2, 2], [-9, 2],
        [7, 1], [3, 1], [0, 1], [3, 1],
        [8, 1], [5, 1], [2, 1], [5, 1],
        [7, 1], [3, 1], [0, 1], [-4, 1],
        [-2, 2], [-2, 2]
      ] },
      { type: 'sine', vol: 0.11, notes: [ // deep still bass
        [-21, 4], [-19, 4], [-16, 4], [-14, 2], [-19, 2],
        [-21, 4], [-16, 4], [-19, 4], [-14, 4]
      ] },
      { type: 'square', vol: 0.03, notes: [ // distant sparkle
        [null, 3], [15, 0.5], [12, 0.5],
        [null, 3.5], [10, 0.5],
        [null, 3], [15, 0.5], [19, 0.5],
        [null, 4]
      ] }
    ]
  }
};
