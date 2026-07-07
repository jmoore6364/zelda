// ============================================================
// save.js — save slots + settings persistence (localStorage)
// ============================================================
'use strict';

const SaveSys = {
  KEY: 'zelda2_save_',
  SETTINGS_KEY: 'zelda2_settings',

  defaultPlayer() {
    return {
      maxHearts: 3, hearts: 3, rupees: 0,
      bombs: 0, maxBombs: 20, arrows: 0, maxArrows: 30,
      hasSword: false, hasMasterSword: false, hasBow: false,
      hasLantern: false, hasShield: false, hasBombs: false,
      hasBoomerang: false, hasFireRod: false, hasFlippers: false, hasPearl: false,
      potions: 0, letter: false, soup: false, lure: false,
      tradeItem: null, hasCharm: false,
      shards: { emerald: false, ruby: false, sapphire: false },
      keys: {}, bosskeys: {}, dmaps: {}, dcompass: {}
    };
  },

  defaultData() {
    return {
      player: this.defaultPlayer(),
      flags: {},
      mapId: 'overworld',
      px: 16 * 16, py: 57 * 16,
      playTime: 0,
      slot: null
    };
  },

  save(slot) {
    try {
      const d = Game.data;
      d.mapId = Game.map.id;
      d.px = Game.player.x;
      d.py = Game.player.y;
      d.savedAt = new Date().toISOString();
      d.slot = slot;
      localStorage.setItem(this.KEY + slot, JSON.stringify(d));
      return true;
    } catch (e) {
      console.error('save failed', e);
      return false;
    }
  },

  load(slot) {
    try {
      const raw = localStorage.getItem(this.KEY + slot);
      if (!raw) return null;
      const d = JSON.parse(raw);
      // merge with defaults so older saves stay compatible
      const def = this.defaultData();
      d.player = Object.assign(def.player, d.player);
      d.player.shards = Object.assign({ emerald: false, ruby: false, sapphire: false }, d.player.shards);
      d.flags = d.flags || {};
      d.slot = slot;
      return d;
    } catch (e) {
      console.error('load failed', e);
      return null;
    }
  },

  info(slot) {
    const d = this.load(slot);
    if (!d) return null;
    const shards = (d.player.shards.emerald ? 1 : 0) + (d.player.shards.ruby ? 1 : 0) + (d.player.shards.sapphire ? 1 : 0);
    return {
      hearts: d.player.maxHearts,
      rupees: d.player.rupees,
      shards,
      complete: !!d.flags.game_complete,
      playTime: d.playTime || 0,
      savedAt: d.savedAt
    };
  },

  remove(slot) { localStorage.removeItem(this.KEY + slot); },

  // ---- settings ----
  settings: {
    musicVol: 5, sfxVol: 7, screenShake: true, showMinimap: true
  },

  loadSettings() {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (raw) Object.assign(this.settings, JSON.parse(raw));
    } catch (e) { /* defaults */ }
    this.applySettings();
  },

  saveSettings() {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    this.applySettings();
  },

  applySettings() {
    AudioSys.setMusicVolume(this.settings.musicVol / 10 * 0.8);
    AudioSys.setSfxVolume(this.settings.sfxVol / 10);
  }
};
