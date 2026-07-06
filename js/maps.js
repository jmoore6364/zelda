// ============================================================
// maps.js — the entire world, authored with the MapBuilder API.
// ============================================================
'use strict';

const WORLD = {}; // id -> map data

function registerMap(m) { WORLD[m.id] = m; }

// ------------------------------------------------------------
// OVERWORLD — 96 x 72
// ------------------------------------------------------------
function buildOverworld() {
  const b = new MapBuilder('overworld', 96, 72, T.GRASS, {
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
  // houses
  b.house(11, 51, 5, 4, { to: 'elder_house', tx: 7, ty: 8 });   // door (13/14?,54) -> set below
  b.house(20, 52, 5, 4, { to: 'marin_house', tx: 6, ty: 7 });
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
  // buildings
  b.house(39, 10, 6, 4, { to: 'shop', tx: 8, ty: 9 });
  b.object('sign', 38, 13, { text: 'RUSL\'S GOODS — bombs, arrows, and more!' });
  b.house(50, 10, 7, 4, { to: 'inn', tx: 8, ty: 9 });
  b.object('sign', 58, 13, { text: 'The Drowsy Cucco Inn. Rest your weary bones!' });
  b.house(39, 20, 5, 4, { to: 'town_house1', tx: 7, ty: 8 });
  b.house(53, 20, 5, 4, { to: 'town_house2', tx: 7, ty: 8 });
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
  b.house(21, 29, 4, 3, { to: 'ranch_house', tx: 6, ty: 8 });
  b.npc('rancher_elda', 24, 32);
  b.object('pot', 26, 30);
  b.object('sign', 25, 36, { text: 'Meadowbrook Ranch — eggs, feathers, and one (1) escaped cucco.' });
  b.path([[24, 36], [24, 40], [17, 40]], T.PATH, 1);

  // ============ SE: SUNSPEAR DUNES ============
  b.rect(62, 59, 32, 11, T.SAND);
  b.scatter(T.CACTUS, 0.05, { x: 62, y: 59, w: 32, h: 11 }, [T.SAND]);
  b.scatter(T.PALM, 0.03, { x: 62, y: 59, w: 32, h: 11 }, [T.SAND]);
  b.scatter(T.ROCK, 0.02, { x: 62, y: 59, w: 32, h: 11 }, [T.SAND]);
  // road south from the woods
  b.path([[74, 47], [74, 62]], T.PATH, 2);
  b.object('sign', 72, 57, { text: 'SOUTH: Sunspear Dunes. Travel by shade. Respect the sand.' });
  // nomad camp
  b.house(64, 60, 5, 4, { to: 'nomad_tent', tx: 6, ty: 8 });
  b.npc('digger_dan', 70, 63);
  b.object('pot', 63, 65); b.object('pot', 69, 61);
  b.object('sign', 67, 64, { text: 'Zaffa\'s Caravan Rest. Water, shade, gossip — in that order.' });
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
  b.enemy('sandwurm', 72, 65); b.enemy('sandwurm', 80, 66); b.enemy('sandwurm', 86, 68);
  b.enemy('leever', 66, 67); b.enemy('gibdo', 84, 66);

  // ============ W: FROSTPEAK HOLLOW ============
  // the snow that never melts — home of the hermit and the Glacier Hollow
  b.rect(2, 20, 13, 27, T.SNOWY);
  b.scatter(T.PINE, 0.16, { x: 2, y: 20, w: 13, h: 27 }, [T.SNOWY]);
  b.scatter(T.ROCK, 0.05, { x: 2, y: 20, w: 13, h: 27 }, [T.SNOWY]);
  b.scatter(T.DEADTREE, 0.03, { x: 2, y: 20, w: 13, h: 27 }, [T.SNOWY]);
  // trail in from the village road
  b.path([[14, 44], [8, 44], [8, 34]], T.DIRT, 2);
  // glacier mouth — entrance to the Glacier Hollow
  b.rect(4, 22, 7, 4, T.MOUNTAIN);
  b.set(7, 25, T.STAIRS_DOWN);
  b.set(7, 26, T.SNOWY); b.set(8, 26, T.SNOWY);
  b.portal(7, 25, 1, 1, 'dungeon4', 20, 30, 'up', { sfx: 'stairs' });
  b.object('sign', 8, 27, { text: 'Glacier Hollow. The winter that would not end begins here.' });
  // Yeta's cabin
  b.house(9, 38, 5, 4, { to: 'hermit_cabin', tx: 6, ty: 8 });
  b.set(11, 42, T.SNOWY);
  b.object('sign', 13, 42, { text: 'Smoke from the chimney. Someone still lives out here.' });
  b.object('sign', 18, 44, { text: 'WEST: Frostpeak Hollow — the snow that never melts.' });
  b.enemy('wolfos', 5, 33); b.enemy('wolfos', 12, 30); b.enemy('wolfos', 6, 43);
  b.enemy('freezard', 11, 26); b.enemy('keese', 4, 28);
  // Pella, Meadowbrook's escaped prize cucco, sulking in the snow
  b.npc('cucco_pella', 6, 36);

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
  buildKeep();
}
