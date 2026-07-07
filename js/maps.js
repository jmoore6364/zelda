// ============================================================
// maps.js — the entire world, authored with the MapBuilder API.
// ============================================================
'use strict';

const WORLD = {}; // id -> map data

function registerMap(m) { WORLD[m.id] = m; }

// ------------------------------------------------------------
// OVERWORLD — 192 x 184. The familiar lands are the north-west
// quarter; east through the spine passes lie the Auran Highlands,
// the Elderwood and the Gilded Meadow, and the whole south is the
// Shattered Sea — ferry country.
// ------------------------------------------------------------
function buildOverworld() {
  const b = new MapBuilder('overworld', 240, 184, T.GRASS, {
    name: 'Hyrule Field', music: 'overworld', ambient: 'day', seed: 42,
    respawn: { x: 16, y: 57 }
  });

  // --- outer mountain ring ---
  b.border(T.MOUNTAIN, 2);
  b.scatter(T.MOUNTAIN, 0.35, { x: 2, y: 2, w: 92, h: 1 }, [T.GRASS]);
  b.scatter(T.PINE, 0.3, { x: 2, y: 2, w: 2, h: 68 }, [T.GRASS]);
  b.scatter(T.PINE, 0.3, { x: 92, y: 2, w: 2, h: 68 }, [T.GRASS]);

  // --- base texture: flowers, tallgrass, bushes, rocks ---
  b.scatter(T.FLOWERS, 0.045, null, [T.GRASS]);
  b.scatter(T.TALLGRASS, 0.05, null, [T.GRASS]);
  b.scatter(T.BUSH, 0.02, null, [T.GRASS]);
  b.scatter(T.ROCK, 0.008, null, [T.GRASS]);

  // ============ CENTER: lake + river ============
  b.lake(47, 41, 7);
  // sandy beach south of lake
  b.blob(47, 49, 5, T.SAND, [T.GRASS, T.FLOWERS, T.TALLGRASS, T.BUSH]);
  // river east from lake to forest
  b.hline(54, 70, 41, T.WATER, 2);
  b.hline(54, 70, 40, T.SHALLOWS, 1);
  b.hline(54, 70, 43, T.SHALLOWS, 1);

  // ============ ROADS ============
  // village (SW) -> central crossroads
  b.path([[16, 56], [16, 46], [30, 46], [30, 34], [38, 34]], T.PATH, 2);
  // crossroads -> town (N)
  b.path([[38, 34], [46, 34], [46, 26], [46, 18]], T.PATH, 2);
  // crossroads -> east forest (bridge over river)
  b.path([[38, 34], [60, 34], [60, 41], [60, 46], [74, 46]], T.PATH, 2);
  // bridge where road crosses river
  b.rect(60, 40, 2, 4, T.BRIDGE);
  // crossroads -> south marsh
  b.path([[40, 36], [40, 54], [46, 54], [46, 58]], T.PATH, 2);
  // village -> NW keep
  b.path([[16, 46], [16, 26], [15, 26], [15, 18]], T.PATH, 2);

  // ============ SW: ELDEN VILLAGE ============
  b.rect(8, 48, 22, 18, T.GRASS);
  b.scatter(T.FLOWERS, 0.09, { x: 8, y: 48, w: 22, h: 18 }, [T.GRASS]);
  b.path([[16, 56], [16, 62], [22, 62]], T.PATH, 2);
  b.hline(10, 26, 56, T.PATH, 2);
  // houses — cozy cottages with smoking chimneys and window boxes
  b.house(11, 51, 5, 4, { to: 'elder_house', tx: 7, ty: 8, flowers: true });   // door (13/14?,54) -> set below
  b.house(20, 52, 5, 4, { to: 'marin_house', tx: 6, ty: 7, flowers: true });
  b.house(11, 59, 5, 4, { to: 'kid_house', tx: 6, ty: 7 });
  // fences and decor
  b.hline(9, 14, 65, T.FENCE); b.hline(18, 28, 65, T.FENCE);
  b.vline(28, 58, 64, T.FENCE);
  b.object('sign', 17, 58, { text: 'Elden Village.  Peace at the edge of the wild.' });
  b.object('sign', 30, 45, { text: 'NORTH: Castle Ruins    EAST: Crossroads' });
  b.object('pot', 17, 54); b.object('pot', 18, 54);
  b.npc('villager_meg', 22, 60);
  b.npc('villager_tomm', 13, 57);

  // ============ N-CENTER: BRAMBLEWICK TOWN ============
  b.rect(37, 7, 26, 20, T.GRASS);
  b.scatter(T.FLOWERS, 0.06, { x: 37, y: 7, w: 26, h: 20 }, [T.GRASS]);
  // plaza
  b.rect(43, 16, 9, 7, T.FLOOR_STONE);
  // fountain
  b.rect(46, 18, 3, 3, T.SHALLOWS);
  b.outline(45, 17, 5, 5, T.FLOOR_STONE);
  // buildings — the town wears slate-blue roofs and iron balconies
  b.house(39, 10, 6, 4, { to: 'shop', tx: 8, ty: 9, style: 'blue', balcony: 'left' });
  b.object('sign', 38, 13, { text: 'RUSL\'S GOODS — bombs, arrows, and more!' });
  b.house(50, 10, 7, 4, { to: 'inn', tx: 8, ty: 9, style: 'blue', balcony: true, flowers: true });
  b.object('sign', 58, 13, { text: 'The Drowsy Cucco Inn. Rest your weary bones!' });
  b.house(39, 20, 5, 4, { to: 'town_house1', tx: 7, ty: 8, flowers: true });
  b.house(53, 20, 5, 4, { to: 'town_house2', tx: 7, ty: 8, style: 'blue' });
  // town walls + gate
  b.hline(37, 44, 26, T.FENCE); b.hline(48, 62, 26, T.FENCE);
  b.vline(37, 8, 26, T.FENCE); b.vline(62, 8, 26, T.FENCE);
  b.hline(38, 61, 7, T.FENCE);
  b.rect(45, 26, 3, 1, T.PATH); // gate gap
  b.path([[46, 26], [46, 23]], T.PATH, 2);
  // re-stamp fountain (roads must not cut through it)
  b.rect(45, 17, 5, 5, T.FLOOR_STONE);
  b.rect(46, 18, 3, 3, T.SHALLOWS);
  b.npc('guard_bex', 44, 25);
  b.npc('townwoman_ella', 49, 19);
  b.npc('townman_dole', 43, 21);
  b.npc('kid_pip', 52, 17);
  b.npc('oldman_sage', 59, 22);
  b.object('sign', 47, 27, { text: 'Bramblewick Town — All travelers welcome.' });

  // ============ NW: CASTLE RUINS / SHADOW KEEP ============
  b.rect(6, 4, 22, 16, T.GRASS);
  b.scatter(T.ROCK, 0.03, { x: 6, y: 4, w: 22, h: 4 }, [T.GRASS]);
  b.rect(9, 5, 14, 11, T.FLOOR_STONE);
  b.outline(9, 5, 14, 11, T.DUNGEON_WALL);
  b.outline(10, 6, 12, 9, T.DUNGEON_WALL);
  b.rect(11, 7, 10, 7, T.FLOOR_STONE);
  // gate opening (sealed by shard gate object)
  b.set(15, 15, T.FLOOR_STONE); b.set(16, 15, T.FLOOR_STONE);
  b.set(15, 14, T.FLOOR_STONE); b.set(16, 14, T.FLOOR_STONE);
  b.set(15, 16, T.PATH); b.set(16, 16, T.PATH);
  b.object('shard_gate', 15, 14, { w: 2, h: 1 });
  // entrance stairs inside courtyard
  b.set(15, 8, T.STAIRS_UP); b.set(16, 8, T.STAIRS_UP);
  b.portal(15, 8, 2, 1, 'keep', 17, 26, 'up', { sfx: 'stairs' });
  b.enemy('armos', 13, 17); b.enemy('armos', 18, 17);
  b.object('sign', 13, 18, { text: 'The old castle... sealed since the Twilight fell. Three shards shall open the way.' });
  b.object('torch', 14, 16); b.object('torch', 17, 16);

  // ============ NE: MOUNTAINS + EMBER DEPTHS ============
  b.rect(64, 3, 30, 16, T.MOUNTAIN);
  b.blob(70, 10, 4, T.MOUNTAIN);
  b.blob(84, 12, 5, T.MOUNTAIN);
  // carved pass from town side
  b.path([[58, 18], [66, 18], [66, 12], [74, 12]], T.DIRT, 2);
  b.rect(64, 12, 12, 3, T.DIRT);
  b.rect(74, 10, 6, 5, T.DIRT);
  b.scatter(T.ROCK, 0.1, { x: 60, y: 14, w: 20, h: 6 }, [T.GRASS, T.DIRT]);
  // Ember Depths entrance — cracked wall in mountain face
  b.set(77, 9, T.CRACKED_WALL);
  b.set(77, 10, T.DIRT);
  b.portal(77, 9, 1, 1, 'dungeon2', 20, 30, 'up', { sfx: 'stairs', hidden: true });
  b.object('sign', 74, 11, { text: 'Mt. Cindertop. The rock here sounds... hollow.' });
  // rupee cave — second cracked wall
  b.set(66, 11, T.CRACKED_WALL);
  b.portal(66, 11, 1, 1, 'cave_rupee', 6, 8, 'up', { sfx: 'stairs', hidden: true });
  b.enemy('keese', 70, 14); b.enemy('keese', 75, 13); b.enemy('octorok', 62, 16);
  b.path([[46, 18], [52, 18], [58, 18]], T.PATH, 2);

  // ============ E: VERDANT WOODS + FOREST TEMPLE ============
  b.scatter(T.TREE, 0.42, { x: 66, y: 24, w: 27, h: 34 }, [T.GRASS, T.FLOWERS, T.TALLGRASS, T.BUSH]);
  b.scatter(T.PINE, 0.12, { x: 66, y: 24, w: 27, h: 34 }, [T.GRASS, T.FLOWERS]);
  // winding clearing to the temple
  b.path([[74, 46], [80, 46], [80, 38], [84, 38]], T.PATH, 2);
  b.rect(82, 34, 7, 6, T.GRASS);
  b.scatter(T.FLOWERS, 0.2, { x: 82, y: 34, w: 7, h: 6 }, [T.GRASS]);
  // temple facade
  b.rect(83, 34, 5, 2, T.WALL_BRICK);
  b.set(85, 35, T.STAIRS_DOWN);
  b.set(85, 36, T.PATH);
  b.portal(85, 35, 1, 1, 'dungeon1', 20, 30, 'up', { sfx: 'stairs' });
  b.set(84, 36, T.PILLAR); b.set(86, 36, T.PILLAR);
  b.object('sign', 82, 37, { text: 'Verdant Temple. The forest itself grew sick when the Shade came.' });
  b.enemy('moblin', 72, 40); b.enemy('moblin', 78, 50); b.enemy('moblin', 70, 30);
  b.enemy('octorok', 68, 46); b.enemy('peahat', 76, 34);
  // fairy cave hidden under a bush west of the woods
  b.set(64, 28, T.BUSH);
  b.portal(64, 28, 1, 1, 'cave_fairy', 6, 8, 'up', { sfx: 'stairs', hidden: true, underBush: true });
  // heart cave in a rock outcrop south of the river
  b.blob(68, 54, 3, T.MOUNTAIN, [T.GRASS, T.TREE, T.PINE, T.FLOWERS, T.TALLGRASS, T.BUSH]);
  b.set(68, 56, T.CRACKED_WALL);
  b.set(68, 57, T.GRASS);
  b.portal(68, 56, 1, 1, 'cave_heart', 6, 8, 'up', { sfx: 'stairs', hidden: true });

  // ============ S: WHISPER MARSH + SUNKEN CRYPT ============
  b.rect(32, 58, 28, 12, T.MARSH);
  b.scatter(T.MARSH, 0.5, { x: 30, y: 56, w: 32, h: 3 }, [T.GRASS, T.FLOWERS, T.TALLGRASS]);
  b.scatter(T.DEADTREE, 0.07, { x: 32, y: 58, w: 28, h: 11 }, [T.MARSH]);
  b.scatter(T.GRAVE, 0.05, { x: 40, y: 60, w: 18, h: 9 }, [T.MARSH]);
  b.path([[46, 58], [46, 62]], T.DIRT, 2);
  // crypt structure
  b.rect(43, 63, 8, 4, T.WALL_STONE);
  b.rect(46, 64, 2, 3, T.FLOOR_STONE);
  b.set(46, 64, T.STAIRS_DOWN); b.set(47, 64, T.STAIRS_DOWN);
  b.portal(46, 64, 2, 1, 'dungeon3', 20, 30, 'up', { sfx: 'stairs' });
  b.object('crypt_gate', 46, 66, { w: 2, h: 1 });
  // crystal switch on an island in marsh water — must be shot with an arrow
  b.blob(53, 65, 2, T.WATER);
  b.set(53, 65, T.FLOOR_STONE);
  b.object('switch_crystal', 53, 65, { id: 'crypt_switch' });
  b.object('sign', 44, 62, { text: 'The Sunken Crypt. Its door answers only to a crystal\'s song.' });
  b.enemy('poe', 38, 62); b.enemy('poe', 50, 60); b.enemy('poe', 56, 66); b.enemy('poe', 34, 66);
  b.enemy('chu', 42, 66);

  // ============ LAKE HYLIA: spirit island + fisherman ============
  // becalm the deep center and raise a small island (flippers required)
  b.blob(47, 41, 5, T.WATER, [T.DEEPWATER]);
  b.blob(47, 41, 2, T.SAND);
  b.npc('lorelei', 47, 41);
  b.chest(48, 42, { type: 'heart_container' }, { big: true });
  // fisherman on the south beach
  b.set(44, 48, T.PALM); b.set(50, 48, T.PALM);
  b.npc('fisherman_odon', 45, 49);
  b.object('sign', 43, 50, { text: 'Lake Hylia. No swimming without proper equipment. — O.' });
  // the lucky lure, snagged in the river shallows far east
  b.chest(69, 43, { type: 'lure' });

  // ============ CENTER-W: MEADOWBROOK RANCH ============
  b.rect(20, 28, 8, 8, T.GRASS);
  b.scatter(T.FLOWERS, 0.12, { x: 20, y: 28, w: 8, h: 8 }, [T.GRASS]);
  b.outline(20, 28, 8, 8, T.FENCE);
  b.rect(23, 35, 2, 1, T.PATH); // gate gap
  b.house(21, 29, 4, 3, { to: 'ranch_house', tx: 6, ty: 8, flowers: true });
  b.npc('rancher_elda', 24, 32);
  b.object('pot', 26, 30);
  b.object('sign', 25, 36, { text: 'Meadowbrook Ranch — eggs, feathers, and one (1) escaped cucco.' });
  b.path([[24, 36], [24, 40], [17, 40]], T.PATH, 1);

  // ============ SE: SUNSPEAR DUNES ============
  b.rect(62, 59, 32, 11, T.SAND);
  // the woods thin into drifting sand — a wide, walkable transition band
  b.scatter(T.SAND, 0.72, { x: 62, y: 55, w: 32, h: 4 }, [T.GRASS, T.TREE, T.PINE, T.FLOWERS, T.TALLGRASS, T.BUSH]);
  b.scatter(T.DEADTREE, 0.03, { x: 62, y: 55, w: 32, h: 4 }, [T.SAND]);
  b.scatter(T.CACTUS, 0.05, { x: 62, y: 55, w: 32, h: 15 }, [T.SAND]);
  b.scatter(T.PALM, 0.03, { x: 62, y: 59, w: 32, h: 11 }, [T.SAND]);
  b.scatter(T.ROCK, 0.02, { x: 62, y: 55, w: 32, h: 15 }, [T.SAND]);
  b.enemy('vulture', 68, 57); b.enemy('leever', 88, 56);
  // road south from the woods
  b.path([[74, 47], [74, 62]], T.PATH, 2);
  b.object('sign', 72, 57, { text: 'SOUTH: Sunspear Dunes. Travel by shade. Respect the sand.' });
  // nomad camp — sun-baked adobe with striped awnings
  b.house(64, 60, 5, 4, { to: 'nomad_tent', tx: 6, ty: 8, style: 'adobe' });
  b.house(70, 59, 4, 3, { to: 'adobe_house', tx: 6, ty: 8, style: 'adobe' });
  b.npc('digger_dan', 70, 63);
  b.object('pot', 63, 65); b.object('pot', 69, 61);
  b.object('sign', 67, 64, { text: 'Zaffa\'s Caravan Rest. Water, shade, gossip — in that order.' });
  b.object('sign', 74, 60, { text: 'SAMI\'S TRADING POST — everything the desert buried, dug up and priced.' });
  // the oasis — a real spring, and something older living in it
  b.blob(78, 66, 3, T.SHALLOWS, [T.SAND]);
  b.set(75, 64, T.PALM); b.set(81, 64, T.PALM); b.set(76, 68, T.PALM); b.set(80, 68, T.PALM);
  b.npc('fairy', 78, 66);
  b.chest(75, 63, { type: 'potion' });
  b.object('sign', 81, 67, { text: 'The Last Oasis. Drink deep, speak softly.' });
  // the Sandsear Tomb
  b.rect(82, 61, 8, 4, T.WALL_STONE);
  b.rect(85, 62, 2, 3, T.FLOOR_STONE);
  b.set(85, 62, T.STAIRS_DOWN); b.set(86, 62, T.STAIRS_DOWN);
  b.portal(85, 62, 2, 1, 'dungeon5', 20, 30, 'up', { sfx: 'stairs' });
  b.object('tomb_gate', 85, 64, { w: 2, h: 1 });
  b.object('sign', 83, 66, { text: 'The Sandsear Tomb. Here sleeps the Hollow King. Let him.' });
  // the crystal across the broken ground (boomerang or arrow)
  b.rect(89, 66, 3, 3, T.HOLE);
  b.set(90, 67, T.FLOOR_STONE);
  b.object('switch_crystal', 90, 67, { id: 'tomb_switch' });
  // dunes dwellers
  b.enemy('vulture', 78, 62); b.enemy('vulture', 88, 60);
  b.enemy('sandwurm', 72, 66); b.enemy('sandwurm', 84, 68); b.enemy('sandwurm', 79, 60);
  b.enemy('dunetyrant', 90, 57); // the Dune Tyrant patrols the eastern sands
  b.enemy('leever', 66, 67); b.enemy('gibdo', 84, 66);

  // ============ W: FROSTPEAK HOLLOW ============
  // the snow that never melts — home of the hermit and the Glacier Hollow
  b.rect(2, 20, 13, 27, T.SNOWY);
  // northern reaches — a wind-scoured shelf beneath the castle crags
  b.rect(2, 6, 4, 14, T.SNOWY);
  b.scatter(T.PINE, 0.16, { x: 2, y: 6, w: 4, h: 14 }, [T.SNOWY]);
  b.scatter(T.ROCK, 0.06, { x: 2, y: 6, w: 4, h: 14 }, [T.SNOWY]);
  b.rect(3, 8, 2, 3, T.SNOWY); // clearing around the prize
  b.chest(3, 8, { type: 'heart_container' }, { big: true });
  b.enemy('wolfos', 3, 11); b.enemy('wolfos', 4, 16);
  b.object('sign', 4, 19, { text: 'The Northern Reaches. Whatever you\'re looking for up there, the wolves found it first.' });
  b.scatter(T.PINE, 0.16, { x: 2, y: 20, w: 13, h: 27 }, [T.SNOWY]);
  b.scatter(T.ROCK, 0.05, { x: 2, y: 20, w: 13, h: 27 }, [T.SNOWY]);
  b.scatter(T.DEADTREE, 0.03, { x: 2, y: 20, w: 13, h: 27 }, [T.SNOWY]);
  // the frozen pond + Bjorn's ice-fishing hut
  b.blob(11, 33, 3, T.ICE, [T.SNOWY, T.PINE, T.ROCK, T.DEADTREE]);
  b.chest(11, 33, { type: 'rupees', amount: 50 });
  b.house(3, 29, 4, 3, { to: 'ice_hut', tx: 6, ty: 8, style: 'snow' });
  b.set(5, 32, T.SNOWY);
  b.object('sign', 6, 31, { text: 'Bjorn\'s Ice Hole. The fish are biting. The frostbite, more so.' });
  // trail in from the village road
  b.path([[14, 44], [8, 44], [8, 34]], T.DIRT, 2);
  // glacier mouth — entrance to the Glacier Hollow
  b.rect(4, 22, 7, 4, T.MOUNTAIN);
  b.set(7, 25, T.STAIRS_DOWN);
  b.set(7, 26, T.SNOWY); b.set(8, 26, T.SNOWY);
  b.portal(7, 25, 1, 1, 'dungeon4', 20, 30, 'up', { sfx: 'stairs' });
  b.object('sign', 8, 27, { text: 'Glacier Hollow. The winter that would not end begins here.' });
  // Yeta's cabin — steep slate roof shrugging off the snow
  b.house(9, 38, 5, 4, { to: 'hermit_cabin', tx: 6, ty: 8, style: 'snow' });
  b.set(11, 42, T.SNOWY);
  b.object('sign', 13, 42, { text: 'Smoke from the chimney. Someone still lives out here.' });
  b.object('sign', 18, 44, { text: 'WEST: Frostpeak Hollow — the snow that never melts.' });
  b.enemy('wolfos', 5, 33); b.enemy('wolfos', 12, 30); b.enemy('wolfos', 6, 43);
  b.enemy('freezard', 11, 26); b.enemy('keese', 4, 28);
  // Pella, Meadowbrook's escaped prize cucco, sulking in the snow
  b.npc('cucco_pella', 6, 36);

  // ============ S: SALTMERE STRAND (now running the full width of the world) ============
  // the old border ridge, breached in five places
  b.rect(2, 70, 234, 2, T.MOUNTAIN);
  b.rect(15, 70, 3, 2, T.PATH);   // west pass, below Elden
  b.rect(53, 70, 3, 2, T.MARSH);  // center pass, out of the marsh
  b.rect(74, 70, 2, 2, T.PATH);   // pass below the dunes
  b.rect(120, 70, 3, 2, T.PATH);  // Gilded Meadow pass
  b.rect(160, 70, 3, 2, T.PATH);  // far-east pass
  // the strand: meadow, beach, shallows, open sea
  b.rect(2, 72, 234, 6, T.GRASS);
  b.scatter(T.FLOWERS, 0.05, { x: 2, y: 72, w: 234, h: 6 }, [T.GRASS]);
  b.scatter(T.TALLGRASS, 0.06, { x: 2, y: 72, w: 234, h: 6 }, [T.GRASS]);
  b.scatter(T.BUSH, 0.02, { x: 2, y: 72, w: 234, h: 6 }, [T.GRASS]);
  b.rect(2, 78, 234, 4, T.SAND);
  b.rect(2, 82, 234, 2, T.SHALLOWS);
  b.rect(2, 84, 234, 3, T.WATER);
  b.rect(2, 87, 234, 3, T.DEEPWATER);
  // a ragged, natural waterline
  b.scatter(T.SAND, 0.4, { x: 2, y: 82, w: 234, h: 1 }, [T.SHALLOWS]);
  b.scatter(T.SHALLOWS, 0.4, { x: 2, y: 84, w: 234, h: 1 }, [T.WATER]);
  b.scatter(T.PALM, 0.04, { x: 2, y: 78, w: 234, h: 3 }, [T.SAND]);
  b.scatter(T.ROCK, 0.02, { x: 2, y: 78, w: 234, h: 3 }, [T.SAND]);
  // roads down through the passes
  b.path([[16, 62], [16, 74], [28, 74]], T.PATH, 2);
  b.path([[54, 68], [54, 74]], T.DIRT, 2);
  b.path([[74, 62], [74, 75]], T.PATH, 2);

  // --- SALTMERE hamlet: blue slate, balconies, salt wind ---
  b.house(26, 72, 5, 4, { to: 'salt_house1', tx: 6, ty: 8, style: 'blue', flowers: true });
  b.house(34, 72, 6, 5, { to: 'salt_house2', tx: 6, ty: 8, style: 'blue', balcony: true });
  b.object('sign', 32, 77, { text: 'Saltmere Strand — where Hyrule runs out of land and keeps going anyway.' });
  b.npc('kid_shell', 30, 78);
  b.npc('harbor_brine', 34, 79);
  b.object('pot', 25, 76); b.object('pot', 41, 76);
  // the pier
  b.rect(37, 80, 2, 6, T.DOCK);
  b.object('sign', 35, 80, { text: 'Saltmere pier. Watch for Zoras. They watch for you.' });
  // the lighthouse — dark since the dusk came
  b.rect(60, 73, 4, 5, T.WALL_STONE);
  b.set(61, 77, T.HOUSE_DOOR);
  b.portal(61, 77, 1, 1, 'lighthouse', 6, 8, 'up', { sfx: 'door' });
  b.object('beacon', 61, 72); b.object('beacon', 62, 72);
  b.object('sign', 58, 78, { text: 'Saltmere Light. Cold these three years. The keeper still climbs the stairs anyway.' });
  // a sandbar for strong swimmers — ringed by open water, no wading out
  b.rect(81, 83, 7, 5, T.WATER);
  b.blob(84, 85, 2, T.SAND, [T.WATER, T.SHALLOWS, T.DEEPWATER]);
  b.chest(84, 85, { type: 'rupees', amount: 100 });
  // Wake's ferry — the only boat on the Shattered Sea
  b.npc('ferryman_wake', 39, 80);
  b.object('sign', 40, 79, { text: 'FERRY: Isle of Winds — Ember Isle — Gull Rocks. Speak to Wake. Mind the wake.' });
  // shore dwellers
  b.enemy('octorok', 20, 75); b.enemy('octorok', 48, 74); b.enemy('chu', 44, 78);
  b.enemy('leever', 56, 79); b.enemy('leever', 68, 79); b.enemy('leever', 12, 79);
  b.enemy('zora', 42, 84); b.enemy('zora', 28, 85); b.enemy('zora', 70, 84); b.enemy('zora', 84, 83);
  b.enemy('peahat', 80, 75); b.enemy('vulture', 88, 77);

  // ============ E: THE SPINE ============
  // the mountain wall that hid half of Hyrule, breached in two places
  b.rect(94, 2, 3, 68, T.MOUNTAIN);
  b.path([[80, 12], [99, 12]], T.DIRT, 2);   // highland pass, through Mt. Cindertop
  b.path([[88, 40], [99, 40]], T.PATH, 2);   // Elderwood pass, out of the Verdant Woods

  // ============ NE-BEYOND: AURAN HIGHLANDS (x97-189, y2-24) ============
  b.rect(97, 2, 92, 23, T.GRASS);
  b.scatter(T.MOUNTAIN, 0.1, { x: 97, y: 2, w: 92, h: 23 }, [T.GRASS]);
  b.scatter(T.ROCK, 0.08, { x: 97, y: 2, w: 92, h: 23 }, [T.GRASS]);
  b.scatter(T.TALLGRASS, 0.12, { x: 97, y: 2, w: 92, h: 23 }, [T.GRASS]);
  b.scatter(T.PINE, 0.05, { x: 97, y: 2, w: 92, h: 23 }, [T.GRASS]);
  b.blob(110, 6, 4, T.MOUNTAIN); b.blob(175, 5, 5, T.MOUNTAIN); b.blob(140, 20, 4, T.MOUNTAIN);
  // the high road
  b.path([[99, 12], [120, 12], [120, 17], [150, 17], [150, 10], [186, 10]], T.DIRT, 2);
  b.object('sign', 100, 14, { text: 'The Auran Highlands. Thin air, long views, short tempers among the wildlife.' });
  // Rosa's waystation — last warm bed before the wild east
  b.rect(118, 14, 8, 6, T.GRASS);
  b.house(119, 14, 5, 4, { to: 'waystation', tx: 6, ty: 8, style: 'blue', flowers: true });
  b.object('sign', 125, 17, { text: 'ROSA\'S WAYSTATION — beds, broth, and directions given grudgingly.' });
  // the Standing Stones — older than the kingdom, and hollow beneath
  b.rect(148, 5, 7, 6, T.GRASS);
  b.set(149, 6, T.PILLAR); b.set(153, 6, T.PILLAR);
  b.set(148, 8, T.PILLAR); b.set(154, 8, T.PILLAR);
  b.set(149, 10, T.PILLAR); b.set(153, 10, T.PILLAR);
  b.set(151, 7, T.STAIRS_DOWN);
  b.portal(151, 7, 1, 1, 'dungeon6', 20, 30, 'up', { sfx: 'stairs' });
  b.chest(151, 10, { type: 'rupees', amount: 100 });
  b.object('sign', 151, 11, { text: 'Six stones stand. A SEVENTH lies buried — and lately, the ground here grinds its teeth at night.' });
  // highland cave — a cracked wall in the eastern crags
  b.blob(172, 15, 4, T.MOUNTAIN, [T.GRASS, T.TALLGRASS, T.ROCK, T.PINE]);
  b.set(172, 17, T.CRACKED_WALL);
  b.set(172, 18, T.GRASS);
  b.portal(172, 17, 1, 1, 'cave_highland', 6, 8, 'up', { sfx: 'stairs', hidden: true });
  b.object('sign', 174, 18, { text: 'The crag here rings hollow when the wind hits it. Or when anything else does.' });
  // a prospector's trail from the high road to the crag face
  b.path([[150, 18], [170, 18]], T.DIRT, 1);
  b.rect(170, 18, 4, 2, T.GRASS);
  b.enemy('vulture', 104, 8); b.enemy('vulture', 160, 14); b.enemy('octorok', 112, 18);
  b.enemy('moblin', 130, 8); b.enemy('moblin', 155, 20); b.enemy('armos', 150, 7);
  b.enemy('peahat', 168, 6); b.enemy('wolfos', 182, 16);
  b.enemy('ogre', 163, 20); // the Highland Ogre haunts the road to the crag

  // ============ E-BEYOND: THE ELDERWOOD (x97-189, y25-52) ============
  b.rect(97, 25, 92, 28, T.GRASS);
  b.scatter(T.TREE, 0.52, { x: 97, y: 25, w: 92, h: 28 }, [T.GRASS]);
  b.scatter(T.PINE, 0.14, { x: 97, y: 25, w: 92, h: 28 }, [T.GRASS]);
  b.scatter(T.DEADTREE, 0.03, { x: 97, y: 25, w: 92, h: 28 }, [T.GRASS]);
  b.scatter(T.TALLGRASS, 0.06, { x: 97, y: 25, w: 92, h: 28 }, [T.GRASS]);
  // one winding road through the deep wood
  b.path([[99, 40], [130, 40], [130, 30], [160, 30], [160, 45], [186, 45]], T.PATH, 2);
  b.object('sign', 100, 41, { text: 'The Elderwood. The trees here were old when the castle was young. Stay on the road. The road stays on you.' });
  // the Elder Shrine — a mossy clearing
  b.rect(157, 27, 8, 7, T.GRASS);
  b.scatter(T.FLOWERS, 0.25, { x: 157, y: 27, w: 8, h: 7 }, [T.GRASS]);
  b.rect(159, 28, 4, 2, T.WALL_BRICK);
  b.set(160, 29, T.FLOOR_STONE); b.set(161, 29, T.FLOOR_STONE);
  b.chest(160, 30, { type: 'potion' });
  b.object('torch', 159, 30); b.object('torch', 162, 30);
  b.object('sign', 161, 32, { text: 'The Elder Shrine. Travelers leave what they can spare and take what they cannot live without.' });
  // GLADEHOLLOW — the woodfolk's clearing on the Elderwood road
  b.rect(106, 30, 15, 9, T.GRASS);
  b.scatter(T.FLOWERS, 0.15, { x: 106, y: 30, w: 15, h: 9 }, [T.GRASS]);
  b.house(107, 31, 5, 4, { to: 'herb_shop', tx: 7, ty: 9, flowers: true });
  b.house(114, 31, 5, 4, { to: 'druid_house', tx: 6, ty: 8 });
  b.object('sign', 112, 36, { text: 'GLADEHOLLOW. The wood permits us. Mind your axe-talk.' });
  b.object('pot', 106, 36); b.object('pot', 120, 36);
  b.path([[112, 38], [112, 41]], T.PATH, 2); // down to the road

  // a fairy glade hidden under a bush, deep off the road —
  // a faint deer-trail leads to it, if you're looking down
  b.path([[131, 41], [139, 41], [139, 47], [140, 47]], T.GRASS, 1);
  b.set(140, 48, T.BUSH);
  b.set(141, 48, T.GRASS);
  b.portal(140, 48, 1, 1, 'cave_glade', 6, 8, 'up', { sfx: 'stairs', hidden: true, underBush: true });
  b.enemy('moblin', 110, 35); b.enemy('moblin', 145, 28); b.enemy('moblin', 170, 48);
  b.enemy('wolfos', 120, 45); b.enemy('wolfos', 150, 38);
  b.enemy('keese', 135, 32); b.enemy('poe', 165, 50); b.enemy('peahat', 105, 28);
  b.enemy('direwolf', 176, 36); // the Alpha stalks the deep east wood

  // ============ SE-BEYOND: GILDED MEADOW (x97-189, y53-69) ============
  b.rect(97, 53, 92, 17, T.GRASS);
  b.scatter(T.TALLGRASS, 0.3, { x: 97, y: 53, w: 92, h: 17 }, [T.GRASS]);
  b.scatter(T.FLOWERS, 0.15, { x: 97, y: 53, w: 92, h: 17 }, [T.GRASS]);
  b.scatter(T.BUSH, 0.03, { x: 97, y: 53, w: 92, h: 17 }, [T.GRASS]);
  b.path([[121, 53], [121, 74]], T.PATH, 2);  // down to the coast
  b.path([[161, 45], [161, 74]], T.PATH, 2);  // far-east road, wood to sea
  b.object('sign', 123, 55, { text: 'The Gilded Meadow. In the old light it shone like a second sun. Give it time.' });
  // a ring of bushes hiding gold
  b.set(149, 60, T.BUSH); b.set(151, 60, T.BUSH); b.set(148, 61, T.BUSH); b.set(152, 61, T.BUSH);
  b.set(148, 62, T.BUSH); b.set(152, 62, T.BUSH); b.set(149, 63, T.BUSH); b.set(151, 63, T.BUSH);
  b.set(150, 60, T.BUSH); b.set(150, 63, T.BUSH);
  b.chest(150, 61, { type: 'rupees', amount: 50 });
  b.enemy('leever', 110, 60); b.enemy('leever', 140, 56); b.enemy('peahat', 130, 64);
  b.enemy('octorok', 100, 56); b.enemy('octorok', 170, 60); b.enemy('chu', 155, 66);

  // ============ THE SHATTERED SEA (y90-181) ============
  b.rect(2, 90, 234, 92, T.DEEPWATER);
  b.rect(2, 90, 234, 2, T.WATER); // near-shore swimming strip

  // --- ISLE OF WINDS — the village across the water ---
  b.blob(45, 120, 14, T.WATER, [T.DEEPWATER]);
  b.blob(45, 120, 11, T.SAND);
  b.blob(45, 119, 8, T.GRASS, [T.SAND]);
  b.scatter(T.FLOWERS, 0.1, { x: 36, y: 112, w: 18, h: 15 }, [T.GRASS]);
  b.scatter(T.PALM, 0.06, { x: 34, y: 110, w: 22, h: 20 }, [T.SAND]);
  b.rect(44, 108, 2, 6, T.DOCK);
  b.npc('ferryman_wake', 46, 112);
  b.house(39, 115, 5, 4, { to: 'isle_house1', tx: 6, ty: 8, style: 'blue', flowers: true });
  b.house(47, 115, 5, 4, { to: 'isle_house2', tx: 6, ty: 8, style: 'wood', flowers: true });
  b.house(42, 121, 6, 4, { to: 'isle_mayor', tx: 6, ty: 8, style: 'blue', balcony: true });
  b.object('sign', 41, 119, { text: 'Windfall Village, Isle of Winds. Population: enough. Weather: yes.' });
  b.npc('isle_koa', 46, 120);
  b.object('pot', 38, 119); b.object('pot', 52, 119);
  b.chest(52, 124, { type: 'rupees', amount: 30 });
  b.enemy('octorok', 38, 126); b.enemy('chu', 51, 113);

  // --- EMBER ISLE — the smoking rock ---
  b.blob(135, 135, 13, T.WATER, [T.DEEPWATER]);
  b.blob(135, 135, 10, T.SAND);
  b.blob(135, 134, 5, T.MOUNTAIN, [T.SAND]);
  b.rect(135, 132, 2, 2, T.LAVA);
  b.rect(134, 124, 2, 5, T.DOCK);
  b.npc('ferryman_wake', 136, 127);
  b.set(133, 138, T.CRACKED_WALL);
  b.set(133, 139, T.SAND);
  b.portal(133, 138, 1, 1, 'cave_ember', 6, 8, 'up', { sfx: 'stairs', hidden: true });
  b.object('sign', 136, 129, { text: 'Ember Isle. The mountain grumbles but rarely commits. Rich pickings for the brave.' });
  b.object('sign', 135, 139, { text: 'The rock face here is scorched... and cracked.' });
  b.enemy('keese', 130, 132); b.enemy('keese', 140, 138); b.enemy('armos', 138, 140);
  b.enemy('sandwurm', 130, 140); b.enemy('vulture', 141, 130);

  // --- THE DROWNED CATHEDRAL — a spire breaking the deep swell (Pearl required) ---
  b.blob(100, 150, 4, T.WATER, [T.DEEPWATER]);
  b.blob(100, 150, 2, T.FLOOR_STONE, [T.WATER, T.DEEPWATER]);
  b.set(100, 149, T.PILLAR); b.set(99, 151, T.PILLAR); b.set(101, 151, T.PILLAR);
  b.set(100, 150, T.STAIRS_DOWN);
  b.portal(100, 150, 1, 1, 'dungeon7', 20, 30, 'up', { sfx: 'stairs' });
  b.object('sign', 100, 152, { text: 'A bell tolls below, slow as a sleeping heart. The steps are worn by feet that never came back up.' });

  // --- deep-sea secrets, for those who hold the Pearl ---
  b.blob(170, 155, 2, T.SAND, [T.WATER, T.SHALLOWS, T.DEEPWATER]);
  b.chest(170, 155, { type: 'rupees', amount: 200 });
  b.blob(15, 148, 2, T.SAND, [T.WATER, T.SHALLOWS, T.DEEPWATER]);
  b.npc('fairy', 15, 148);

  // --- GULL ROCKS — where the gulls circle ---
  b.blob(85, 155, 7, T.WATER, [T.DEEPWATER]);
  b.blob(85, 155, 4, T.SAND);
  b.scatter(T.ROCK, 0.15, { x: 81, y: 151, w: 9, h: 9 }, [T.SAND]);
  b.rect(84, 149, 2, 4, T.DOCK);
  b.npc('ferryman_wake', 86, 151);
  b.chest(83, 155, { type: 'rupees', amount: 100 });
  b.chest(87, 156, { type: 'potion' });
  b.object('sign', 85, 153, { text: 'Gull Rocks. The gulls found it first. The gulls share reluctantly.' });
  b.enemy('zora', 78, 155); b.enemy('zora', 92, 154); b.enemy('vulture', 85, 158);

  // ============ FAR EAST: THE GLOAMWOOD ============
  // where the dusk went to grow teeth — trees that watch, and worse
  b.rect(189, 2, 49, 68, T.GRASS);
  b.scatter(T.GLOOMTREE, 0.42, { x: 189, y: 2, w: 49, h: 68 }, [T.GRASS]);
  b.scatter(T.DEADTREE, 0.1, { x: 189, y: 2, w: 49, h: 68 }, [T.GRASS]);
  b.scatter(T.TALLGRASS, 0.05, { x: 189, y: 2, w: 49, h: 68 }, [T.GRASS]);
  b.scatter(T.GRAVE, 0.015, { x: 189, y: 2, w: 49, h: 68 }, [T.GRASS]);
  // one pale road through the dark
  b.path([[186, 45], [200, 45], [200, 20], [220, 20], [220, 50], [232, 50]], T.DIRT, 2);
  b.object('sign', 190, 44, { text: 'The GLOAMWOOD. The trees here are hungry and the dark has teeth. Walk loud, stranger.' });
  // Vey the vampire hunter's lodge
  b.rect(197, 15, 9, 7, T.GRASS);
  b.house(198, 16, 5, 4, { to: 'hunter_cabin', tx: 6, ty: 8, style: 'snow', chimney: true });
  b.object('sign', 204, 19, { text: 'VEY\'S LODGE. Garlic on the sill, stakes by the door. Knock like you mean it.' });
  // the gloam hoard, hidden under a bush off the road
  b.path([[221, 20], [226, 20], [226, 35]], T.GRASS, 1);
  b.set(226, 36, T.BUSH);
  b.set(226, 37, T.GRASS); b.set(225, 36, T.GRASS);
  b.portal(226, 36, 1, 1, 'cave_gloam', 6, 8, 'up', { sfx: 'stairs', hidden: true, underBush: true });
  // waystone by the crossroads
  b.object('waystone', 201, 21, { id: 'gloamwood', label: 'The Gloamwood', tx: 201, ty: 22 });
  // the wood's teeth
  b.enemy('grimroot', 195, 40); b.enemy('grimroot', 205, 30); b.enemy('grimroot', 214, 22);
  b.enemy('grimroot', 218, 44); b.enemy('grimroot', 228, 52);
  b.enemy('vampire', 198, 25); b.enemy('vampire', 212, 40); b.enemy('vampire', 224, 28);
  b.enemy('poe', 206, 50); b.enemy('poe', 226, 12); b.enemy('wolfos', 192, 12);
  b.enemy('keese', 210, 8); b.enemy('keese', 230, 60);

  // ============ THE WAYSTONE NETWORK ============
  // nine sleeping stones; touch one to wake it, then walk the old roads
  b.object('waystone', 19, 60, { id: 'elden', label: 'Elden Village', tx: 19, ty: 61 });
  b.object('waystone', 52, 22, { id: 'bramblewick', label: 'Bramblewick Town', tx: 52, ty: 23 });
  b.object('waystone', 12, 42, { id: 'frostpeak', label: 'Frostpeak Hollow', tx: 12, ty: 43 });
  b.object('waystone', 72, 66, { id: 'dunes', label: 'Sunspear Dunes', tx: 72, ty: 67 });
  b.object('waystone', 32, 73, { id: 'saltmere', label: 'Saltmere Strand', tx: 32, ty: 74 });
  b.object('waystone', 118, 37, { id: 'gladehollow', label: 'Gladehollow', tx: 118, ty: 38 });
  b.object('waystone', 126, 16, { id: 'highlands', label: 'The Auran Highlands', tx: 126, ty: 17 });
  b.object('waystone', 50, 122, { id: 'windfall', label: 'Windfall Village', tx: 50, ty: 123 });

  // ============ field enemies ============
  b.enemy('octorok', 34, 40); b.enemy('octorok', 26, 42); b.enemy('octorok', 52, 30);
  b.enemy('octorok', 36, 24); b.enemy('octorok', 24, 44);
  b.enemy('peahat', 30, 28); b.enemy('peahat', 54, 48); b.enemy('peahat', 40, 44);
  b.enemy('leever', 44, 50); b.enemy('leever', 50, 50); b.enemy('leever', 47, 52);
  b.enemy('zora', 46, 41); b.enemy('zora', 49, 40);
  b.enemy('chu', 28, 50); b.enemy('chu', 58, 28);

  registerMap(b.build());
}

// ------------------------------------------------------------
// INTERIORS
// ------------------------------------------------------------
function interior(id, name, w, h, fn, opts = {}) {
  const b = new MapBuilder(id, w, h, T.FLOOR_WOOD, Object.assign({
    name, music: 'village', ambient: 'day', indoor: true, seed: 5,
    respawn: { x: Math.floor(w / 2), y: h - 3 }
  }, opts));
  b.room(0, 0, w, h, T.FLOOR_WOOD, T.WALL_BRICK);
  fn(b);
  registerMap(b.build());
}

function buildInteriors() {
  // Elder's house — story start
  interior('elder_house', 'Elder\'s House', 15, 11, b => {
    b.set(7, 10, T.HOUSE_DOOR);
    b.portal(7, 10, 1, 1, 'overworld', 13, 56, 'down', { sfx: 'door' });
    b.rect(6, 3, 3, 1, T.CARPET); b.rect(6, 4, 3, 2, T.CARPET);
    b.set(2, 2, T.SHELF); b.set(3, 2, T.SHELF); b.set(11, 2, T.SHELF);
    b.set(12, 5, T.TABLE);
    b.object('torch', 2, 6); b.object('torch', 12, 8);
    b.npc('elder', 7, 3);
    b.chest(2, 8, { type: 'rupees', amount: 20 });
  });

  // Marin's house — letter side quest
  interior('marin_house', 'Marin\'s House', 13, 10, b => {
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 22, 56, 'down', { sfx: 'door' });
    b.set(2, 2, T.TABLE); b.set(10, 2, T.SHELF); b.set(9, 2, T.SHELF);
    b.rect(5, 4, 3, 2, T.CARPET);
    b.object('pot', 2, 7); b.object('pot', 10, 7);
    b.npc('marin', 6, 4);
  });

  // Kid's house
  interior('kid_house', 'Cottage', 13, 10, b => {
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 13, 64, 'down', { sfx: 'door' });
    b.set(3, 2, T.SHELF); b.set(9, 3, T.TABLE);
    b.object('pot', 10, 7);
    b.npc('granny_lu', 5, 3);
  });

  // Shop
  interior('shop', 'Rusl\'s Goods', 17, 12, b => {
    b.map.music = 'town';
    b.set(8, 11, T.HOUSE_DOOR);
    b.portal(8, 11, 1, 1, 'overworld', 42, 15, 'down', { sfx: 'door' });
    b.hline(3, 13, 4, T.COUNTER);
    b.set(8, 4, T.FLOOR_WOOD); // gap in counter? no — keep sealed, items sold over counter
    b.hline(3, 13, 4, T.COUNTER);
    b.set(2, 2, T.SHELF); b.set(3, 2, T.SHELF); b.set(13, 2, T.SHELF); b.set(14, 2, T.SHELF);
    b.npc('shopkeep', 8, 2);
    b.object('shopitem', 5, 6, { item: 'bombs', price: 30, label: 'Bombs x5' });
    b.object('shopitem', 7, 6, { item: 'arrows', price: 20, label: 'Arrows x10' });
    b.object('shopitem', 9, 6, { item: 'potion', price: 40, label: 'Red Potion' });
    b.object('shopitem', 11, 6, { item: 'heart_container', price: 150, label: 'Heart Vessel' });
    b.object('torch', 2, 8); b.object('torch', 14, 8);
  });

  // Inn
  interior('inn', 'The Drowsy Cucco', 17, 12, b => {
    b.map.music = 'town';
    b.set(8, 11, T.HOUSE_DOOR);
    b.portal(8, 11, 1, 1, 'overworld', 53, 15, 'down', { sfx: 'door' });
    b.set(3, 3, T.TABLE); b.set(6, 3, T.TABLE); b.set(3, 6, T.TABLE);
    b.rect(11, 2, 4, 3, T.CARPET);
    b.npc('innkeep', 12, 3);
    b.npc('traveler_finn', 5, 5);
    b.object('torch', 2, 2); b.object('torch', 14, 8);
  });

  // Town houses
  interior('town_house1', 'Sage\'s Study', 15, 11, b => {
    b.map.music = 'town';
    b.set(7, 10, T.HOUSE_DOOR);
    b.portal(7, 10, 1, 1, 'overworld', 41, 24, 'down', { sfx: 'door' });
    b.set(2, 2, T.SHELF); b.set(3, 2, T.SHELF); b.set(4, 2, T.SHELF);
    b.set(11, 2, T.SHELF); b.set(12, 2, T.SHELF);
    b.set(7, 4, T.TABLE);
    b.npc('scholar_ivo', 7, 6);
    b.object('torch', 2, 7); b.object('torch', 12, 7);
  });

  // Zaffa's caravan rest — Sunspear Dunes
  interior('nomad_tent', 'Zaffa\'s Rest', 13, 10, b => {
    b.map.music = 'town';
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 66, 64, 'down', { sfx: 'door' });
    b.set(2, 2, T.SHELF); b.set(3, 2, T.SHELF); b.set(10, 2, T.SHELF);
    b.rect(5, 3, 3, 3, T.CARPET);
    b.object('pot', 2, 7); b.object('pot', 10, 7);
    b.npc('nomad_zaffa', 6, 4);
    b.chest(9, 7, { type: 'rupees', amount: 20 });
  });

  // Meadowbrook ranch house
  interior('ranch_house', 'Meadowbrook Ranch', 13, 10, b => {
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 23, 32, 'down', { sfx: 'door' });
    b.set(2, 2, T.SHELF); b.set(9, 3, T.TABLE);
    b.rect(5, 4, 3, 2, T.CARPET);
    b.object('pot', 2, 7); b.object('pot', 10, 7);
    b.chest(10, 2, { type: 'rupees', amount: 15 });
  });

  // Bjorn's ice-fishing hut — Frostpeak Hollow
  interior('ice_hut', 'Bjorn\'s Hut', 13, 10, b => {
    b.map.music = 'cave';
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 5, 32, 'down', { sfx: 'door' });
    b.set(2, 2, T.SHELF); b.set(9, 3, T.TABLE);
    b.rect(5, 4, 3, 2, T.CARPET);
    b.object('torch', 2, 6); b.object('torch', 10, 6);
    b.object('pot', 10, 7);
    b.npc('fisher_bjorn', 6, 4);
    b.chest(2, 7, { type: 'arrows', amount: 10 });
  });

  // Sami's Trading Post — Sunspear Dunes (the desert's own shop)
  interior('adobe_house', 'Sami\'s Trading Post', 15, 11, b => {
    b.map.music = 'town';
    b.set(7, 10, T.HOUSE_DOOR);
    b.portal(7, 10, 1, 1, 'overworld', 72, 62, 'down', { sfx: 'door' });
    b.hline(3, 11, 4, T.COUNTER);
    b.set(2, 2, T.SHELF); b.set(3, 2, T.SHELF); b.set(11, 2, T.SHELF); b.set(12, 2, T.SHELF);
    b.npc('trader_sami', 7, 2);
    b.object('shopitem', 4, 6, { item: 'potion', price: 30, label: 'Red Potion', vendor: 'Sami', vendorPortrait: 'npc_nomad' });
    b.object('shopitem', 6, 6, { item: 'bombs', price: 25, label: 'Bombs x5', vendor: 'Sami', vendorPortrait: 'npc_nomad' });
    b.object('shopitem', 8, 6, { item: 'arrows', price: 15, label: 'Arrows x10', vendor: 'Sami', vendorPortrait: 'npc_nomad' });
    b.object('shopitem', 10, 6, { item: 'bomb_bag', price: 120, label: 'Big Bomb Bag', vendor: 'Sami', vendorPortrait: 'npc_nomad' });
    b.object('torch', 2, 8); b.object('torch', 12, 8);
    b.object('pot', 2, 5);
  });

  // Saltmere Strand — the fishing hamlet
  interior('salt_house1', 'Nan\'s Cottage', 13, 10, b => {
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 28, 76, 'down', { sfx: 'door' });
    b.set(2, 2, T.SHELF); b.set(9, 3, T.TABLE);
    b.rect(5, 4, 3, 2, T.CARPET);
    b.npc('salt_nan', 6, 4);
    b.object('pot', 2, 7); b.object('pot', 10, 7);
  });

  interior('salt_house2', 'The Gull\'s Rest', 13, 10, b => {
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 37, 77, 'down', { sfx: 'door' });
    b.set(2, 2, T.SHELF); b.set(3, 2, T.SHELF); b.set(9, 2, T.SHELF);
    b.set(3, 5, T.TABLE); b.set(9, 5, T.TABLE);
    b.npc('salt_tide', 8, 4);
    b.chest(10, 2, { type: 'rupees', amount: 25 });
    b.object('torch', 2, 6); b.object('torch', 10, 6);
  });

  // Saltmere Light — the keeper's lonely tower
  interior('lighthouse', 'Saltmere Light', 11, 12, b => {
    b.map.music = 'cave';
    b.set(5, 11, T.HOUSE_DOOR);
    b.portal(5, 11, 1, 1, 'overworld', 61, 78, 'down', { sfx: 'door' });
    b.set(2, 2, T.STAIRS_UP); b.set(8, 2, T.STAIRS_UP); // the long climb (scenery)
    b.set(5, 2, T.TABLE);
    b.rect(4, 4, 3, 2, T.CARPET);
    b.npc('keeper_elio', 5, 5);
    b.chest(2, 8, { type: 'rupees', amount: 30 });
    b.object('torch', 2, 5); b.object('torch', 8, 5);
    b.object('pot', 8, 9);
  });

  // Gladehollow — Fern's herb shop
  interior('herb_shop', 'Fern\'s Herbs', 15, 11, b => {
    b.map.music = 'village';
    b.set(7, 10, T.HOUSE_DOOR);
    b.portal(7, 10, 1, 1, 'overworld', 109, 35, 'down', { sfx: 'door' });
    b.hline(3, 11, 4, T.COUNTER);
    b.set(2, 2, T.SHELF); b.set(3, 2, T.SHELF); b.set(11, 2, T.SHELF); b.set(12, 2, T.SHELF);
    b.npc('herbalist_fern', 7, 2);
    b.object('shopitem', 5, 6, { item: 'potion', price: 25, label: 'Red Potion', vendor: 'Fern', vendorPortrait: 'npc_woman' });
    b.object('shopitem', 7, 6, { item: 'arrows', price: 15, label: 'Arrows x10', vendor: 'Fern', vendorPortrait: 'npc_woman' });
    b.object('shopitem', 9, 6, { item: 'bombs', price: 25, label: 'Bombs x5', vendor: 'Fern', vendorPortrait: 'npc_woman' });
    b.object('torch', 2, 8); b.object('torch', 12, 8);
  });

  // Gladehollow — Ash the druid's home
  interior('druid_house', 'Ash\'s Hollow', 13, 10, b => {
    b.map.music = 'village';
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 116, 35, 'down', { sfx: 'door' });
    b.set(2, 2, T.SHELF); b.set(9, 2, T.SHELF); b.set(3, 5, T.TABLE);
    b.rect(5, 3, 3, 2, T.CARPET);
    b.npc('druid_ash', 6, 4);
    b.object('torch', 2, 6); b.object('torch', 10, 6);
    b.chest(10, 7, { type: 'rupees', amount: 20 });
  });

  // Vey's lodge — the Gloamwood
  interior('hunter_cabin', 'Vey\'s Lodge', 13, 10, b => {
    b.map.music = 'cave';
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 200, 20, 'down', { sfx: 'door' });
    b.set(2, 2, T.SHELF); b.set(3, 2, T.SHELF); b.set(9, 2, T.SHELF);
    b.set(9, 5, T.TABLE);
    b.rect(5, 3, 3, 2, T.CARPET);
    b.npc('hunter_vey', 6, 4);
    b.object('torch', 2, 6); b.object('torch', 10, 6);
    b.chest(10, 7, { type: 'arrows', amount: 15 });
  });

  // Rosa's waystation — Auran Highlands
  interior('waystation', 'Rosa\'s Waystation', 15, 11, b => {
    b.map.music = 'town';
    b.set(7, 10, T.HOUSE_DOOR);
    b.portal(7, 10, 1, 1, 'overworld', 121, 18, 'down', { sfx: 'door' });
    b.set(2, 2, T.SHELF); b.set(3, 2, T.SHELF); b.set(11, 2, T.SHELF);
    b.set(4, 5, T.TABLE); b.set(10, 5, T.TABLE);
    b.rect(6, 3, 3, 2, T.CARPET);
    b.npc('waykeeper_rosa', 7, 3);
    b.object('torch', 2, 7); b.object('torch', 12, 7);
    b.chest(12, 8, { type: 'arrows', amount: 10 });
  });

  // Isle of Winds — Windfall Village
  interior('isle_house1', 'Lila\'s Loomhouse', 13, 10, b => {
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 41, 119, 'down', { sfx: 'door' });
    b.set(2, 2, T.SHELF); b.set(9, 3, T.TABLE); b.set(3, 5, T.TABLE);
    b.rect(5, 3, 3, 2, T.CARPET);
    b.npc('isle_lila', 6, 4);
    b.object('pot', 10, 7);
  });

  interior('isle_house2', 'Shorehouse', 13, 10, b => {
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 49, 119, 'down', { sfx: 'door' });
    b.set(3, 2, T.SHELF); b.set(9, 2, T.SHELF); b.set(6, 4, T.TABLE);
    b.chest(10, 2, { type: 'rupees', amount: 20 });
    b.object('pot', 2, 7); b.object('pot', 10, 7);
  });

  interior('isle_mayor', 'Mayor Palm\'s Hall', 15, 11, b => {
    b.map.music = 'town';
    b.set(7, 10, T.HOUSE_DOOR);
    b.portal(7, 10, 1, 1, 'overworld', 45, 125, 'down', { sfx: 'door' });
    b.rect(5, 3, 5, 3, T.CARPET);
    b.set(2, 2, T.SHELF); b.set(12, 2, T.SHELF);
    b.npc('mayor_palm', 7, 4);
    b.object('torch', 2, 6); b.object('torch', 12, 6);
    b.object('pot', 2, 8);
  });

  // Hermit Yeta's cabin — Frostpeak Hollow
  interior('hermit_cabin', 'Yeta\'s Cabin', 13, 10, b => {
    b.set(6, 9, T.HOUSE_DOOR);
    b.portal(6, 9, 1, 1, 'overworld', 11, 42, 'down', { sfx: 'door' });
    b.set(2, 2, T.SHELF); b.set(9, 2, T.SHELF); b.set(3, 5, T.TABLE);
    b.rect(5, 3, 3, 2, T.CARPET);
    b.object('torch', 2, 6); b.object('torch', 10, 6);
    b.object('pot', 10, 7);
    b.npc('hermit_yeta', 6, 4);
  });

  interior('town_house2', 'Family Home', 15, 11, b => {
    b.map.music = 'town';
    b.set(7, 10, T.HOUSE_DOOR);
    b.portal(7, 10, 1, 1, 'overworld', 55, 24, 'down', { sfx: 'door' });
    b.set(3, 3, T.TABLE); b.rect(10, 2, 3, 2, T.CARPET);
    b.npc('mother_ana', 5, 4);
    b.npc('kid_nell', 10, 6);
    b.object('pot', 2, 8); b.object('pot', 12, 8);
  });
}

// ------------------------------------------------------------
// CAVES
// ------------------------------------------------------------
function cave(id, name, w, h, fn, opts = {}) {
  const b = new MapBuilder(id, w, h, T.CAVE_FLOOR, Object.assign({
    name, music: 'cave', ambient: 'cave', seed: 11,
    respawn: { x: 6, y: h - 3 }
  }, opts));
  b.border(T.CAVE_WALL, 1);
  fn(b);
  registerMap(b.build());
}

function buildCaves() {
  cave('cave_heart', 'Hidden Grotto', 13, 11, b => {
    b.set(6, 9, T.STAIRS_UP);
    b.portal(6, 9, 1, 1, 'overworld', 68, 57, 'down', { sfx: 'stairs' });
    b.scatter(T.CAVE_WALL, 0.08, { x: 2, y: 2, w: 9, h: 6 }, [T.CAVE_FLOOR]);
    b.chest(6, 3, { type: 'heart_container' }, { big: true });
    b.object('torch', 4, 4); b.object('torch', 8, 4);
    b.enemy('keese', 3, 5); b.enemy('keese', 9, 6);
  });

  cave('cave_rupee', 'Glittering Hollow', 13, 11, b => {
    b.set(6, 9, T.STAIRS_UP);
    b.portal(6, 9, 1, 1, 'overworld', 66, 12, 'down', { sfx: 'stairs' });
    b.chest(4, 3, { type: 'rupees', amount: 50 });
    b.chest(8, 3, { type: 'rupees', amount: 30 });
    b.object('pot', 3, 6); b.object('pot', 9, 6); b.object('pot', 6, 5);
    b.enemy('chu', 6, 6);
  });

  cave('cave_fairy', 'Fairy Spring', 13, 12, b => {
    b.map.music = 'village';
    b.set(6, 10, T.STAIRS_UP);
    b.portal(6, 10, 1, 1, 'overworld', 64, 29, 'down', { sfx: 'stairs' });
    b.blob(6, 4, 3, T.SHALLOWS, [T.CAVE_FLOOR]);
    b.set(6, 4, T.FLOOR_STONE);
    b.npc('fairy', 6, 4);
    b.object('torch', 2, 3); b.object('torch', 10, 3);
  });

  // Auran Highlands — behind the cracked crag
  cave('cave_highland', 'Crag Hollow', 13, 11, b => {
    b.set(6, 9, T.STAIRS_UP);
    b.portal(6, 9, 1, 1, 'overworld', 172, 18, 'down', { sfx: 'stairs' });
    b.scatter(T.CAVE_WALL, 0.08, { x: 2, y: 2, w: 9, h: 6 }, [T.CAVE_FLOOR]);
    b.chest(6, 3, { type: 'heart_container' }, { big: true });
    b.object('torch', 4, 4); b.object('torch', 8, 4);
    b.enemy('keese', 3, 5); b.enemy('keese', 9, 6); b.enemy('chu', 6, 6);
  });

  // Elderwood — the hidden fairy glade
  cave('cave_glade', 'Elder Glade', 13, 12, b => {
    b.map.music = 'village';
    b.set(6, 10, T.STAIRS_UP);
    b.portal(6, 10, 1, 1, 'overworld', 140, 49, 'down', { sfx: 'stairs' });
    b.blob(6, 4, 3, T.SHALLOWS, [T.CAVE_FLOOR]);
    b.set(6, 4, T.FLOOR_STONE);
    b.npc('fairy', 6, 4);
    b.object('torch', 2, 3); b.object('torch', 10, 3);
  });

  // Gloamwood — the hoard under the hungry trees
  cave('cave_gloam', 'Gloam Hoard', 13, 11, b => {
    b.set(6, 9, T.STAIRS_UP);
    b.portal(6, 9, 1, 1, 'overworld', 226, 37, 'down', { sfx: 'stairs' });
    b.scatter(T.CAVE_WALL, 0.07, { x: 2, y: 2, w: 9, h: 6 }, [T.CAVE_FLOOR]);
    b.chest(4, 3, { type: 'rupees', amount: 100 });
    b.chest(8, 3, { type: 'potion' });
    b.object('torch', 4, 5); b.object('torch', 8, 5);
    b.enemy('keese', 3, 6); b.enemy('poe', 9, 6);
  });

  // Ember Isle — the smoking mountain's hoard
  cave('cave_ember', 'Cinder Vault', 15, 12, b => {
    b.set(7, 10, T.STAIRS_UP);
    b.portal(7, 10, 1, 1, 'overworld', 133, 139, 'down', { sfx: 'stairs' });
    b.rect(3, 3, 4, 1, T.LAVA); b.rect(9, 6, 4, 1, T.LAVA);
    b.chest(5, 5, { type: 'rupees', amount: 100 });
    b.chest(9, 3, { type: 'bombs', amount: 10 });
    b.chest(11, 8, { type: 'rupees', amount: 50 });
    b.object('torch', 2, 8); b.object('torch', 12, 3);
    b.enemy('keese', 4, 7); b.enemy('keese', 10, 4); b.enemy('chu', 7, 7);
  });
}

// ------------------------------------------------------------
// DUNGEON 1 — VERDANT TEMPLE  (bow, Gloomspore, Emerald Shard)
// ------------------------------------------------------------
function buildDungeon1() {
  const b = new MapBuilder('dungeon1', 42, 34, T.DUNGEON_WALL, {
    name: 'Verdant Temple', music: 'dungeon', ambient: 'dungeon', seed: 101,
    respawn: { x: 20, y: 30 }
  });

  // entrance room
  b.rect(16, 25, 9, 7, T.DUNGEON_FLOOR);
  b.set(20, 31, T.STAIRS_UP);
  b.portal(20, 31, 1, 1, 'overworld', 85, 36, 'down', { sfx: 'stairs' });
  b.object('torch', 17, 26); b.object('torch', 23, 26);
  b.object('sign', 18, 30, { text: 'Verdant Temple. The forest\'s guardian sleeps below no more.' });

  // central hall
  b.rect(14, 14, 14, 8, T.DUNGEON_FLOOR);
  b.set(16, 16, T.PILLAR); b.set(25, 16, T.PILLAR);
  b.set(16, 19, T.PILLAR); b.set(25, 19, T.PILLAR);
  b.enemy('chu', 18, 17); b.enemy('chu', 23, 18); b.enemy('keese', 20, 15);

  // corridor entrance->hall
  b.rect(20, 22, 2, 3, T.DUNGEON_FLOOR);

  // west room — small key + moblins
  b.rect(4, 14, 8, 8, T.DUNGEON_FLOOR);
  b.rect(12, 17, 2, 2, T.DUNGEON_FLOOR); // corridor
  b.enemy('moblin', 7, 16); b.enemy('moblin', 8, 19);
  b.chest(6, 15, { type: 'key' });
  b.object('pot', 5, 20); b.object('pot', 10, 20);

  // east room — map + second key
  b.rect(30, 14, 8, 8, T.DUNGEON_FLOOR);
  b.rect(28, 17, 2, 2, T.DUNGEON_FLOOR); // corridor
  b.enemy('keese', 33, 16); b.enemy('keese', 35, 19); b.enemy('chu', 32, 19);
  b.chest(35, 15, { type: 'dungeon_map' });
  b.chest(31, 15, { type: 'key' });

  // north-west — BOW room (locked)
  b.rect(5, 3, 8, 8, T.DUNGEON_FLOOR);
  b.rect(8, 11, 2, 3, T.DUNGEON_FLOOR); // corridor down to west room
  b.object('locked_door', 8, 12, { w: 2, h: 1 });
  b.enemy('moblin', 7, 5); b.enemy('moblin', 10, 7);
  b.chest(8, 4, { type: 'bow' }, { big: true });
  b.object('torch', 6, 4); b.object('torch', 11, 4);

  // north-east — compass + boss key (locked)
  b.rect(29, 3, 8, 8, T.DUNGEON_FLOOR);
  b.rect(32, 11, 2, 3, T.DUNGEON_FLOOR);
  b.object('locked_door', 32, 12, { w: 2, h: 1 });
  b.enemy('chu', 31, 6); b.enemy('chu', 34, 8); b.enemy('keese', 33, 4);
  b.chest(34, 4, { type: 'compass' });
  b.chest(30, 4, { type: 'bosskey' });

  // boss room — Gloomspore
  b.rect(17, 3, 8, 8, T.DUNGEON_FLOOR);
  b.rect(20, 11, 2, 3, T.DUNGEON_FLOOR);
  b.object('boss_door', 20, 12, { w: 2, h: 1 });
  b.object('boss_trigger', 17, 3, { w: 8, h: 8, boss: 'gloomspore' });
  b.object('torch', 18, 4); b.object('torch', 23, 4);

  registerMap(b.build());
}

// ------------------------------------------------------------
// DUNGEON 2 — EMBER DEPTHS  (lantern, Magmadon, Ruby Shard)
// ------------------------------------------------------------
function buildDungeon2() {
  const b = new MapBuilder('dungeon2', 42, 34, T.CAVE_WALL, {
    name: 'Ember Depths', music: 'dungeon', ambient: 'cave', seed: 202,
    respawn: { x: 20, y: 30 }
  });

  // entrance
  b.rect(16, 25, 9, 7, T.CAVE_FLOOR);
  b.set(20, 31, T.STAIRS_UP);
  b.portal(20, 31, 1, 1, 'overworld', 77, 10, 'down', { sfx: 'stairs' });
  b.object('torch', 17, 26); b.object('torch', 23, 26);

  // grand cavern with lava moat
  b.rect(12, 13, 18, 9, T.CAVE_FLOOR);
  b.rect(14, 15, 14, 2, T.LAVA);
  b.rect(20, 15, 2, 2, T.BRIDGE);
  b.rect(20, 22, 2, 3, T.CAVE_FLOOR); // corridor from entrance
  b.enemy('keese', 15, 19); b.enemy('keese', 26, 19); b.enemy('chu', 18, 20);
  b.object('pot', 13, 20); b.object('pot', 28, 20);

  // west wing — key room across stepping bridge
  b.rect(3, 13, 7, 9, T.CAVE_FLOOR);
  b.rect(10, 17, 2, 2, T.CAVE_FLOOR);
  b.rect(4, 15, 5, 1, T.LAVA);
  b.set(6, 15, T.BRIDGE);
  b.enemy('stalfos', 5, 18); b.enemy('stalfos', 8, 19);
  b.chest(5, 14, { type: 'key' });
  b.chest(8, 14, { type: 'dungeon_map' });

  // east wing — boss key, wizzrobe
  b.rect(32, 13, 7, 9, T.CAVE_FLOOR);
  b.rect(30, 17, 2, 2, T.CAVE_FLOOR);
  b.rect(33, 15, 5, 1, T.LAVA);
  b.set(35, 15, T.BRIDGE);
  b.enemy('wizzrobe', 35, 19); b.enemy('keese', 33, 20);
  b.chest(36, 14, { type: 'bosskey' });
  b.chest(34, 14, { type: 'compass' });

  // north-west — LANTERN room (locked)
  b.rect(5, 3, 8, 7, T.CAVE_FLOOR);
  b.rect(8, 10, 2, 3, T.CAVE_FLOOR);
  b.object('locked_door', 8, 11, { w: 2, h: 1 });
  b.enemy('stalfos', 7, 5); b.enemy('chu', 10, 7);
  b.chest(8, 4, { type: 'lantern' }, { big: true });
  b.object('torch', 6, 4); b.object('torch', 11, 4);

  // north-east — secret rupees behind cracked wall
  b.rect(30, 3, 7, 7, T.CAVE_FLOOR);
  b.rect(32, 10, 2, 3, T.CAVE_FLOOR);
  b.enemy('chu', 33, 6);
  b.chest(33, 4, { type: 'rupees', amount: 50 });
  b.set(36, 6, T.CRACKED_WALL);
  b.rect(37, 5, 3, 3, T.CAVE_FLOOR);
  b.chest(38, 6, { type: 'rupees', amount: 100 });

  // second key — hidden south-west pot room
  b.rect(6, 25, 6, 5, T.CAVE_FLOOR);
  b.rect(12, 27, 4, 2, T.CAVE_FLOOR);
  b.object('pot', 7, 26); b.object('pot', 9, 26); b.object('pot', 7, 28);
  b.chest(10, 28, { type: 'key' });
  b.enemy('chu', 8, 27);

  // boss room — Magmadon
  b.rect(16, 3, 9, 8, T.CAVE_FLOOR);
  b.rect(18, 4, 2, 1, T.LAVA); b.rect(22, 9, 2, 1, T.LAVA);
  b.rect(20, 11, 2, 2, T.CAVE_FLOOR);
  b.object('boss_door', 20, 12, { w: 2, h: 1 });
  b.object('boss_trigger', 16, 3, { w: 9, h: 8, boss: 'magmadon' });
  b.object('torch', 17, 4); b.object('torch', 23, 4);

  registerMap(b.build());
}

// ------------------------------------------------------------
// DUNGEON 3 — SUNKEN CRYPT  (master sword, Wraithlord, Sapphire Shard)
// ------------------------------------------------------------
function buildDungeon3() {
  const b = new MapBuilder('dungeon3', 42, 34, T.WALL_STONE, {
    name: 'Sunken Crypt', music: 'dungeon', ambient: 'dungeon', dark: true, seed: 303,
    respawn: { x: 20, y: 30 }
  });

  // entrance
  b.rect(16, 25, 9, 7, T.FLOOR_STONE);
  b.set(20, 31, T.STAIRS_UP);
  b.portal(20, 31, 1, 1, 'overworld', 46, 65, 'down', { sfx: 'stairs' });
  b.object('torch', 17, 26); b.object('torch', 23, 26);
  b.object('sign', 18, 30, { text: 'Here lie the kings of old. The dark is deep — bring your own light.' });

  // flooded central chamber
  b.rect(13, 13, 16, 9, T.FLOOR_STONE);
  b.rect(15, 15, 12, 3, T.SHALLOWS);
  b.rect(20, 15, 2, 3, T.BRIDGE);
  b.rect(20, 22, 2, 3, T.FLOOR_STONE);
  b.enemy('poe', 16, 19); b.enemy('poe', 25, 16); b.enemy('stalfos', 22, 20);
  b.set(14, 14, T.PILLAR); b.set(27, 14, T.PILLAR);

  // west catacomb — graves, key
  b.rect(3, 13, 8, 9, T.FLOOR_STONE);
  b.rect(11, 17, 2, 2, T.FLOOR_STONE);
  b.set(4, 14, T.GRAVE); b.set(6, 14, T.GRAVE); b.set(8, 14, T.GRAVE);
  b.set(4, 17, T.GRAVE); b.set(8, 17, T.GRAVE);
  b.enemy('stalfos', 6, 19); b.enemy('poe', 8, 16);
  b.chest(5, 20, { type: 'key' });
  b.chest(9, 20, { type: 'dungeon_map' });

  // east reliquary — boss key + wizzrobes
  b.rect(31, 13, 8, 9, T.FLOOR_STONE);
  b.rect(29, 17, 2, 2, T.FLOOR_STONE);
  b.enemy('wizzrobe', 34, 16); b.enemy('wizzrobe', 36, 19);
  b.chest(36, 14, { type: 'bosskey' });
  b.chest(32, 14, { type: 'compass' });
  b.object('pot', 32, 20); b.object('pot', 37, 20);

  // north-west — MASTER SWORD shrine (locked)
  b.rect(5, 3, 8, 7, T.FLOOR_STONE);
  b.rect(8, 10, 2, 3, T.FLOOR_STONE);
  b.object('locked_door', 8, 11, { w: 2, h: 1 });
  b.rect(7, 4, 4, 1, T.CARPET);
  b.enemy('darknut', 8, 6);
  b.chest(8, 4, { type: 'master_sword' }, { big: true });
  b.object('torch', 6, 4); b.object('torch', 11, 4);

  // north-east — second key + poes
  b.rect(29, 3, 8, 7, T.FLOOR_STONE);
  b.rect(32, 10, 2, 3, T.FLOOR_STONE);
  b.enemy('poe', 31, 5); b.enemy('poe', 35, 7);
  b.chest(33, 4, { type: 'key' });
  b.object('pot', 30, 8); b.object('pot', 36, 8);

  // boss room — Wraithlord
  b.rect(17, 3, 8, 8, T.FLOOR_STONE);
  b.rect(20, 11, 2, 2, T.FLOOR_STONE);
  b.object('boss_door', 20, 12, { w: 2, h: 1 });
  b.object('boss_trigger', 17, 3, { w: 8, h: 8, boss: 'wraithlord' });
  b.object('torch', 18, 4); b.object('torch', 23, 4);

  registerMap(b.build());
}

// ------------------------------------------------------------
// DUNGEON 4 — GLACIER HOLLOW  (boomerang, Frostmaw — optional)
// ------------------------------------------------------------
function buildDungeon4() {
  const b = new MapBuilder('dungeon4', 42, 34, T.ICE_WALL, {
    name: 'Glacier Hollow', music: 'glacier', ambient: 'dungeon', seed: 505,
    respawn: { x: 20, y: 30 }
  });

  // entrance
  b.rect(16, 25, 9, 7, T.ICE);
  b.set(20, 31, T.STAIRS_UP);
  b.portal(20, 31, 1, 1, 'overworld', 7, 26, 'down', { sfx: 'stairs' });
  b.object('torch', 17, 26); b.object('torch', 23, 26);
  b.object('sign', 18, 30, { text: 'The heart of the glacier. Every breath here belongs to FROSTMAW.' });

  // frozen central hall
  b.rect(13, 13, 16, 9, T.ICE);
  b.set(14, 14, T.PILLAR); b.set(27, 14, T.PILLAR);
  b.set(14, 20, T.PILLAR); b.set(27, 20, T.PILLAR);
  b.rect(20, 22, 2, 3, T.ICE); // corridor from entrance
  b.enemy('blade_trap', 17, 17); b.enemy('blade_trap', 24, 18);
  b.enemy('wolfos', 20, 15);
  b.chest(25, 20, { type: 'key' });

  // west wing — freezards guard key + map
  b.rect(4, 13, 8, 8, T.ICE);
  b.rect(12, 17, 2, 2, T.ICE);
  b.enemy('freezard', 6, 15); b.enemy('freezard', 9, 19);
  b.chest(5, 14, { type: 'key' });
  b.chest(10, 14, { type: 'dungeon_map' });
  b.object('pot', 5, 20);

  // east wing — boss key + compass
  b.rect(30, 13, 8, 8, T.ICE);
  b.rect(28, 17, 2, 2, T.ICE);
  b.enemy('wolfos', 33, 16); b.enemy('freezard', 35, 19);
  b.chest(36, 14, { type: 'bosskey' });
  b.chest(32, 14, { type: 'compass' });
  b.object('pot', 31, 20); b.object('pot', 36, 20);

  // north-west — BOOMERANG vault (locked)
  b.rect(5, 3, 8, 8, T.ICE);
  b.rect(8, 11, 2, 3, T.ICE);
  b.object('locked_door', 8, 12, { w: 2, h: 1 });
  b.enemy('blade_trap', 6, 5); b.enemy('blade_trap', 11, 7);
  b.chest(8, 4, { type: 'boomerang' }, { big: true });
  b.object('torch', 6, 4); b.object('torch', 11, 4);

  // north-east — frozen larder (locked)
  b.rect(29, 3, 8, 8, T.ICE);
  b.rect(32, 11, 2, 3, T.ICE);
  b.object('locked_door', 32, 12, { w: 2, h: 1 });
  b.enemy('freezard', 33, 7); b.enemy('keese', 31, 5);
  b.chest(34, 4, { type: 'rupees', amount: 100 });
  b.chest(30, 4, { type: 'potion' });
  b.object('pot', 30, 8); b.object('pot', 36, 8);

  // boss den — FROSTMAW
  b.rect(17, 3, 8, 8, T.ICE);
  b.rect(20, 11, 2, 2, T.ICE);
  b.object('boss_door', 20, 12, { w: 2, h: 1 });
  b.object('boss_trigger', 17, 3, { w: 8, h: 8, boss: 'frostmaw' });
  b.object('torch', 18, 4); b.object('torch', 23, 4);

  registerMap(b.build());
}

// ------------------------------------------------------------
// DUNGEON 5 — SANDSEAR TOMB  (fire rod, Pharaghast — optional)
// ------------------------------------------------------------
function buildDungeon5() {
  const b = new MapBuilder('dungeon5', 42, 34, T.WALL_BRICK, {
    name: 'Sandsear Tomb', music: 'tomb', ambient: 'dungeon', seed: 606,
    respawn: { x: 20, y: 30 }
  });

  // entrance
  b.rect(16, 25, 9, 7, T.FLOOR_STONE);
  b.set(20, 31, T.STAIRS_UP);
  b.portal(20, 31, 1, 1, 'overworld', 85, 63, 'down', { sfx: 'stairs' });
  b.object('torch', 17, 26); b.object('torch', 23, 26);
  b.object('sign', 18, 30, { text: 'The court of the Hollow King. They were buried with him. They did not agree to be.' });

  // grand burial hall — drifted sand, graves, pits
  b.rect(13, 13, 16, 9, T.FLOOR_STONE);
  b.scatter(T.SAND, 0.2, { x: 13, y: 13, w: 16, h: 9 }, [T.FLOOR_STONE]);
  b.set(14, 14, T.PILLAR); b.set(27, 14, T.PILLAR);
  b.set(14, 20, T.PILLAR); b.set(27, 20, T.PILLAR);
  b.set(16, 14, T.GRAVE); b.set(25, 14, T.GRAVE);
  b.set(17, 18, T.HOLE); b.set(24, 16, T.HOLE);
  b.rect(20, 22, 2, 3, T.FLOOR_STONE); // corridor from entrance
  b.enemy('gibdo', 18, 16); b.enemy('gibdo', 23, 19);
  b.enemy('sandwurm', 20, 17);
  b.chest(26, 20, { type: 'key' });

  // west wing — servants' crypt: key + map
  b.rect(4, 13, 8, 8, T.FLOOR_STONE);
  b.rect(12, 17, 2, 2, T.FLOOR_STONE);
  b.set(5, 14, T.GRAVE); b.set(7, 14, T.GRAVE); b.set(9, 14, T.GRAVE);
  b.enemy('gibdo', 7, 17); b.enemy('keese', 5, 19);
  b.chest(5, 20, { type: 'key' });
  b.chest(10, 20, { type: 'dungeon_map' });

  // east wing — treasury guard: boss key + compass
  b.rect(30, 13, 8, 8, T.FLOOR_STONE);
  b.rect(28, 17, 2, 2, T.FLOOR_STONE);
  b.scatter(T.SAND, 0.25, { x: 30, y: 13, w: 8, h: 8 }, [T.FLOOR_STONE]);
  b.enemy('sandwurm', 33, 16); b.enemy('sandwurm', 35, 19);
  b.chest(36, 14, { type: 'bosskey' });
  b.chest(32, 14, { type: 'compass' });
  b.object('pot', 31, 20); b.object('pot', 36, 20);

  // north-west — FIRE ROD reliquary (locked)
  b.rect(5, 3, 8, 8, T.FLOOR_STONE);
  b.rect(8, 11, 2, 3, T.FLOOR_STONE);
  b.object('locked_door', 8, 12, { w: 2, h: 1 });
  b.rect(7, 4, 4, 1, T.CARPET);
  b.enemy('gibdo', 6, 6); b.enemy('gibdo', 11, 7);
  b.chest(8, 4, { type: 'fire_rod' }, { big: true });
  b.object('torch', 6, 4); b.object('torch', 11, 4);

  // north-east — royal treasury (locked)
  b.rect(29, 3, 8, 8, T.FLOOR_STONE);
  b.rect(32, 11, 2, 3, T.FLOOR_STONE);
  b.object('locked_door', 32, 12, { w: 2, h: 1 });
  b.enemy('gibdo', 33, 7); b.enemy('keese', 31, 5);
  b.chest(34, 4, { type: 'rupees', amount: 100 });
  b.chest(30, 4, { type: 'arrows', amount: 15 });
  b.object('pot', 30, 8); b.object('pot', 36, 8);

  // throne of the Hollow King
  b.rect(17, 3, 8, 8, T.FLOOR_STONE);
  b.rect(19, 4, 4, 6, T.CARPET);
  b.rect(20, 11, 2, 2, T.FLOOR_STONE);
  b.object('boss_door', 20, 12, { w: 2, h: 1 });
  b.object('boss_trigger', 17, 3, { w: 8, h: 8, boss: 'pharaghast' });
  b.object('torch', 18, 4); b.object('torch', 23, 4);

  registerMap(b.build());
}

// ------------------------------------------------------------
// DUNGEON 6 — THE SEVENTH BARROW  (pearl of the deep, Karstag — optional)
// ------------------------------------------------------------
function buildDungeon6() {
  const b = new MapBuilder('dungeon6', 42, 34, T.WALL_STONE, {
    name: 'The Seventh Barrow', music: 'tomb', ambient: 'dungeon', seed: 707,
    respawn: { x: 20, y: 30 }
  });

  // entrance
  b.rect(16, 25, 9, 7, T.FLOOR_STONE);
  b.set(20, 31, T.STAIRS_UP);
  b.portal(20, 31, 1, 1, 'overworld', 151, 8, 'down', { sfx: 'stairs' });
  b.object('torch', 17, 26); b.object('torch', 23, 26);
  b.object('sign', 18, 30, { text: 'The Seventh Barrow. The stone below never agreed to be buried. It is still arguing.' });

  // the gallery of stones — pit-riddled central hall
  b.rect(13, 13, 16, 9, T.FLOOR_STONE);
  b.set(14, 14, T.PILLAR); b.set(27, 14, T.PILLAR);
  b.set(14, 20, T.PILLAR); b.set(27, 20, T.PILLAR);
  b.set(17, 15, T.GRAVE); b.set(24, 15, T.GRAVE);
  b.set(16, 18, T.HOLE); b.set(17, 18, T.HOLE);
  b.set(24, 19, T.HOLE); b.set(25, 19, T.HOLE);
  b.rect(20, 22, 2, 3, T.FLOOR_STONE); // corridor from entrance
  b.enemy('armos', 19, 16); b.enemy('armos', 23, 17);
  b.enemy('blade_trap', 21, 19);
  b.chest(26, 20, { type: 'key' });

  // west gallery — poes among the cairns
  b.rect(4, 13, 8, 8, T.FLOOR_STONE);
  b.rect(12, 17, 2, 2, T.FLOOR_STONE);
  b.set(5, 14, T.GRAVE); b.set(7, 14, T.GRAVE); b.set(9, 14, T.GRAVE);
  b.set(6, 17, T.HOLE); b.set(9, 18, T.HOLE);
  b.enemy('poe', 6, 16); b.enemy('poe', 9, 19); b.enemy('keese', 5, 19);
  b.chest(5, 20, { type: 'key' });
  b.chest(10, 20, { type: 'dungeon_map' });

  // east gallery — wizzrobes in the reliquary
  b.rect(30, 13, 8, 8, T.FLOOR_STONE);
  b.rect(28, 17, 2, 2, T.FLOOR_STONE);
  b.set(31, 14, T.GRAVE); b.set(36, 14, T.GRAVE);
  b.enemy('wizzrobe', 33, 16); b.enemy('wizzrobe', 35, 19);
  b.chest(36, 14, { type: 'bosskey' });
  b.chest(32, 20, { type: 'compass' });
  b.object('pot', 31, 20); b.object('pot', 37, 20);

  // north-west — the PEARL vault (locked)
  b.rect(5, 3, 8, 8, T.FLOOR_STONE);
  b.rect(8, 11, 2, 3, T.FLOOR_STONE);
  b.object('locked_door', 8, 12, { w: 2, h: 1 });
  b.rect(7, 4, 4, 1, T.CARPET);
  b.enemy('darknut', 7, 6); b.enemy('blade_trap', 10, 8);
  b.chest(8, 4, { type: 'pearl' }, { big: true });
  b.object('torch', 6, 4); b.object('torch', 11, 4);

  // north-east — the tithe room (locked)
  b.rect(29, 3, 8, 8, T.FLOOR_STONE);
  b.rect(32, 11, 2, 3, T.FLOOR_STONE);
  b.object('locked_door', 32, 12, { w: 2, h: 1 });
  b.enemy('gibdo', 33, 6); b.enemy('poe', 31, 5);
  b.chest(34, 4, { type: 'rupees', amount: 100 });
  b.chest(30, 4, { type: 'potion' });
  b.object('pot', 30, 8); b.object('pot', 36, 8);

  // the Seventh's chamber
  b.rect(17, 3, 8, 8, T.FLOOR_STONE);
  b.set(18, 4, T.GRAVE); b.set(23, 4, T.GRAVE);
  b.rect(20, 11, 2, 2, T.FLOOR_STONE);
  b.object('boss_door', 20, 12, { w: 2, h: 1 });
  b.object('boss_trigger', 17, 3, { w: 8, h: 8, boss: 'karstag' });
  b.object('torch', 18, 5); b.object('torch', 23, 5);

  registerMap(b.build());
}

// ------------------------------------------------------------
// DUNGEON 7 — THE DROWNED CATHEDRAL  (tideplate, Thalassa — optional,
// reachable only by swimming the deep sea with the Pearl)
// ------------------------------------------------------------
function buildDungeon7() {
  const b = new MapBuilder('dungeon7', 42, 34, T.WALL_STONE, {
    name: 'The Drowned Cathedral', music: 'sea', ambient: 'dungeon', dark: true, seed: 808,
    respawn: { x: 20, y: 30 }
  });

  // narthex
  b.rect(16, 25, 9, 7, T.FLOOR_STONE);
  b.set(20, 31, T.STAIRS_UP);
  b.portal(20, 31, 1, 1, 'overworld', 100, 151, 'down', { sfx: 'stairs' });
  b.object('torch', 17, 26); b.object('torch', 23, 26);
  b.object('sign', 18, 30, { text: 'The Drowned Cathedral. The congregation never left. Mind the flooded aisles.' });

  // the flooded nave — pews of stone, aisles of seawater
  b.rect(13, 13, 16, 9, T.FLOOR_STONE);
  b.rect(14, 15, 14, 2, T.SHALLOWS);
  b.rect(14, 19, 14, 1, T.SHALLOWS);
  b.set(14, 14, T.PILLAR); b.set(27, 14, T.PILLAR);
  b.set(14, 20, T.PILLAR); b.set(27, 20, T.PILLAR);
  b.set(18, 18, T.GRAVE); b.set(23, 18, T.GRAVE);
  b.rect(20, 22, 2, 3, T.FLOOR_STONE); // corridor from the narthex
  b.enemy('zora', 16, 15); b.enemy('zora', 25, 16);
  b.enemy('gibdo', 19, 17); b.enemy('poe', 23, 20);
  b.chest(26, 21, { type: 'key' });

  // west transept — the choir stalls
  b.rect(4, 13, 8, 8, T.FLOOR_STONE);
  b.rect(12, 17, 2, 2, T.FLOOR_STONE);
  b.rect(5, 14, 6, 1, T.SHALLOWS);
  b.enemy('poe', 6, 16); b.enemy('wizzrobe', 9, 18);
  b.chest(5, 20, { type: 'key' });
  b.chest(10, 20, { type: 'dungeon_map' });

  // east transept — the reliquary
  b.rect(30, 13, 8, 8, T.FLOOR_STONE);
  b.rect(28, 17, 2, 2, T.FLOOR_STONE);
  b.rect(31, 14, 6, 1, T.SHALLOWS);
  b.enemy('wizzrobe', 33, 16); b.enemy('gibdo', 35, 19);
  b.chest(36, 14, { type: 'bosskey' });
  b.chest(32, 20, { type: 'compass' });
  b.object('pot', 31, 20); b.object('pot', 37, 20);

  // north-west — the TIDEPLATE sacristy (locked)
  b.rect(5, 3, 8, 8, T.FLOOR_STONE);
  b.rect(8, 11, 2, 3, T.FLOOR_STONE);
  b.object('locked_door', 8, 12, { w: 2, h: 1 });
  b.rect(7, 4, 4, 1, T.CARPET);
  b.enemy('darknut', 7, 6); b.enemy('blade_trap', 10, 8);
  b.chest(8, 4, { type: 'tideplate' }, { big: true });
  b.object('torch', 6, 4); b.object('torch', 11, 4);

  // north-east — the offertory (locked)
  b.rect(29, 3, 8, 8, T.FLOOR_STONE);
  b.rect(32, 11, 2, 3, T.FLOOR_STONE);
  b.object('locked_door', 32, 12, { w: 2, h: 1 });
  b.enemy('poe', 33, 6); b.enemy('keese', 31, 5);
  b.chest(34, 4, { type: 'rupees', amount: 100 });
  b.chest(30, 4, { type: 'potion' });
  b.object('pot', 30, 8); b.object('pot', 36, 8);

  // the bell chamber — Thalassa sings here
  b.rect(17, 3, 8, 8, T.FLOOR_STONE);
  b.rect(18, 5, 6, 1, T.SHALLOWS);
  b.rect(20, 11, 2, 2, T.FLOOR_STONE);
  b.object('boss_door', 20, 12, { w: 2, h: 1 });
  b.object('boss_trigger', 17, 3, { w: 8, h: 8, boss: 'thalassa' });
  b.object('torch', 18, 4); b.object('torch', 23, 4);

  registerMap(b.build());
}

// ------------------------------------------------------------
// SHADOW KEEP — final dungeon
// ------------------------------------------------------------
function buildKeep() {
  const k = new MapBuilder('keep', 36, 30, T.DUNGEON_WALL, {
    name: 'Shadow Keep', music: 'dungeon', ambient: 'dungeon', seed: 404,
    respawn: { x: 17, y: 26 }
  });

  // entry hall
  k.rect(14, 22, 8, 6, T.FLOOR_STONE);
  k.set(17, 27, T.STAIRS_DOWN); k.set(18, 27, T.STAIRS_DOWN);
  k.portal(17, 27, 2, 1, 'overworld', 15, 10, 'down', { sfx: 'stairs' });
  k.rect(15, 23, 6, 1, T.CARPET);
  k.object('torch', 15, 23); k.object('torch', 20, 23);

  // long throne approach
  k.rect(16, 12, 4, 10, T.FLOOR_STONE);
  k.rect(16, 12, 4, 10, T.CARPET);
  k.rect(15, 12, 1, 10, T.FLOOR_STONE); k.rect(20, 12, 1, 10, T.FLOOR_STONE);
  k.enemy('darknut', 17, 19); k.enemy('darknut', 18, 15);
  k.object('torch', 15, 18); k.object('torch', 20, 18);
  k.object('torch', 15, 14); k.object('torch', 20, 14);

  // west guard room
  k.rect(5, 14, 8, 6, T.FLOOR_STONE);
  k.rect(13, 16, 3, 2, T.FLOOR_STONE);
  k.enemy('wizzrobe', 8, 16); k.enemy('stalfos', 6, 18); k.enemy('stalfos', 10, 18);
  k.chest(6, 15, { type: 'rupees', amount: 50 });
  k.object('pot', 11, 15); k.object('pot', 11, 19);

  // east guard room
  k.rect(23, 14, 8, 6, T.FLOOR_STONE);
  k.rect(20, 16, 3, 2, T.FLOOR_STONE);
  k.enemy('wizzrobe', 27, 16); k.enemy('darknut', 25, 18);
  k.chest(29, 15, { type: 'potion' });
  k.object('pot', 24, 15); k.object('pot', 24, 19);

  // throne room — The Shade
  k.rect(13, 3, 10, 9, T.FLOOR_STONE);
  k.rect(15, 4, 6, 7, T.CARPET);
  k.set(14, 4, T.PILLAR); k.set(21, 4, T.PILLAR);
  k.object('boss_trigger', 13, 3, { w: 10, h: 9, boss: 'shade' });
  k.object('torch', 14, 6); k.object('torch', 21, 6);
  k.object('torch', 14, 9); k.object('torch', 21, 9);

  registerMap(k.build());
}

// ------------------------------------------------------------
function buildWorld() {
  buildOverworld();
  buildInteriors();
  buildCaves();
  buildDungeon1();
  buildDungeon2();
  buildDungeon3();
  buildDungeon4();
  buildDungeon5();
  buildDungeon6();
  buildDungeon7();
  buildKeep();
}
