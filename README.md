# The Legend of Zelda II: Shards of Twilight

A complete top-down action-adventure fan game — pure HTML5/JavaScript, zero dependencies,
runs offline. **Just open `index.html` in any browser.**

Every map, sprite, tile texture, and song is generated from code. There are no asset files.

## The Story

A generation after the Hero of Legend cast down the Great Evil, the sages forged the
**Sunstone** to keep the land safe. On the night of the black moon, a sorcerer called
**THE SHADE** shattered it into three shards and scattered them — into the deep forest,
beneath the burning mountain, and into the drowned crypt of kings. An endless dusk creeps
over the land. You are the child of the hero's bloodline.

**Recover the three shards. Open the castle gate. End the Shade.**

**Play in your browser:** https://jmoore6364.github.io/zelda/

On phones and tablets a virtual D-pad and action buttons appear automatically —
sword, talk, bow, bomb, boomerang, fire rod, plus pause/inventory/map up top.

## Controls

| Key | Action |
|---|---|
| Arrows / WASD | Move |
| Space / Z | Sword (hold + release = **spin attack**) |
| X | Bow |
| C | Bomb |
| R / V | Boomerang (stuns enemies, rings crystals, fetches drops) |
| F | Fire Rod (hurls flame; burns bushes at range) |
| E / Enter | Talk / read / open / buy |
| Tab / I | Inventory (use potions here) |
| M | Map screen |
| Esc | Pause (save game from here) |

## The World

- **Elden Village** — your home; Elder Rowan starts your quest and gives you the sword
- **Bramblewick Town** — shop (bombs, arrows, potions, a heart vessel), inn (rest 10r), NPCs with hints
- **Verdant Temple** (east woods) — keys, locked doors, the **Hero's Bow** → boss: **GLOOMSPORE**
- **Ember Depths** (NE mountain, bomb the cracked wall) — lava, the **Lantern** → boss: **MAGMADON**
- **Sunken Crypt** (south marsh, shoot the crystal switch) — pitch dark, the **Master Sword** → boss: **WRAITHLORD**
- **Frostpeak Hollow** (west, past Elden) — an optional snowbound region where the winter
  never ends: wolves in the pines, a hermit's cabin, and the **Glacier Hollow** dungeon —
  blade traps, the **Boomerang** → boss: **FROSTMAW**
- **Sunspear Dunes** (south past the woods) — an optional desert: vultures, sandwurms,
  a nomad camp, and the **Sandsear Tomb** (ring the crystal across the pit field to enter) —
  gibdos that fear flame, the **Fire Rod** → boss: **PHARAGHAST, the Hollow King**
- **Lake Hylia** — help Fisherman Odon recover his Lucky Lure and earn the
  **Zora Flippers**: swim open water out to the spirit Lorelei's island shrine
- **Meadowbrook Ranch** (center-west) — Rancher Elda's prize cucco fled into the
  snows; carry her home for the **Big Quiver** (50 arrows)
- **Shadow Keep** (NW ruins, needs all 3 shards) — final boss: **THE SHADE** (two phases)
- Plus: a fairy spring under a bush, secret rupee caves behind cracked walls, a heart
  vessel grotto, a love-letter side quest that earns you the Knight's Shield, and a
  bowl of hot soup that means more to one old hermit than any sword…

18 enemy types: Octorok, Moblin, Keese, Stalfos, Chu, Leever, Wizzrobe, Darknut,
Peahat, Zora, Armos, Poe, Wolfos, Freezard, Blade Trap, Gibdo, Vulture, Sandwurm —
each with its own AI.

## Features

- 3 save slots (localStorage), settings (music/sfx volume, screen shake, minimap)
- Procedural chiptune soundtrack (title, overworld, town, village, cave, dungeon, glacier, tomb, boss, final boss, ending, game over)
- Dynamic lighting (lantern + torches in dark dungeons), day/dusk world tinting, falling snow in Frostpeak, swimming with ripple trails, particles, screen shake
- Full story arc: intro, boss cutscene banners, ending + credits

## Map Editor

Choose **MAP EDITOR** on the title screen. It's the same `MapBuilder` map format the
entire game world was authored with.

- `1–6` switch modes (tiles / enemies / NPCs / objects / portals / erase), `Tab` tile palette
- Left-drag paint, right-click eyedrop/delete, `F` flood fill, `[` `]` brush size
- `P` **playtest instantly** with a full test kit
- `S` save to browser, `E`/`I` export/import JSON
- `O` **override a real game map with your edit** (the game will load your version), `K` clear overrides
- `H` in-editor help

## Code layout

| File | Purpose |
|---|---|
| `js/mapbuilder.js` | The map-authoring API — used by `maps.js` *and* the editor |
| `js/maps.js` | The whole world, built with MapBuilder calls |
| `js/sprites.js` | All pixel art, defined as character grids |
| `js/tiles.js` | ~45 procedurally textured, animated tiles |
| `js/enemies.js` / `js/bosses.js` | 12 enemy AIs, 4 bosses |
| `js/story.js` | Quest flags, NPC dialogue, intro/ending |
| `js/audio.js` | WebAudio synth + chiptune sequencer |
| `js/game.js` | State machine, collision, camera, lighting, rendering |

*A fan-made homage. Not affiliated with Nintendo.*
