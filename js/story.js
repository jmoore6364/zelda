// ============================================================
// story.js — quest flags, NPC dialogue, cutscenes, the plot.
//
// THE SHARDS OF TWILIGHT
// A generation after the fall of Ganon, the land is kept safe by
// the Sunstone, a relic forged from the light of the Triforce.
// A shadow sorcerer — the Shade — has shattered it into three
// shards and scattered them into the wild places, letting an
// endless dusk creep across the land. A young hero of Elden
// Village must recover the shards and end the Shade.
// ============================================================
'use strict';

const Story = {
  get flags() { return Game.data.flags; },

  flag(k) { return !!Game.data.flags[k]; },
  set(k, v = true) { Game.data.flags[k] = v; },

  // ---------------- INTRO ----------------
  INTRO_PAGES: [
    'A generation has passed since the Hero of Legend cast down the Great Evil...',
    'From the light of that victory the sages forged the SUNSTONE, and its warmth kept every shadow from the land of Hyrule.',
    'But nothing golden stays. On the night of the black moon, a sorcerer wrapped in darkness — THE SHADE — struck the Sunstone and shattered it into three shards.',
    'He hurled the shards into the deep forest, beneath the burning mountain, and into the drowned crypt of kings. Then he took the old castle for his throne.',
    'Now an endless dusk creeps over the fields, and monsters walk the roads at noon.',
    'In the small village of Elden, an elder calls for the child of a hero\'s bloodline...'
  ],

  ENDING_PAGES: [
    'The Shade\'s darkness unravels like smoke in the wind...',
    'In your hands, the three shards blaze — emerald, ruby, sapphire — and melt together into a single golden light.',
    'The SUNSTONE is whole once more.',
    'Across Hyrule the dusk lifts. Flowers open at midnight, mistaking the new light for dawn. In Elden Village, the elder weeps, and does not hide it.',
    'They will sing of you, hero. Not for the sword you carried...',
    '...but because you walked into the dark, and brought back the sun.'
  ],

  // ---------------- boss defeat hooks ----------------
  onBossDefeated(boss, x, y) {
    this.set('boss:' + boss);
    switch (boss) {
      case 'gloomspore':
        this.set('d1_done');
        Game.pickups.push(new Pickup(x, y, 'shard_emerald'));
        Game.pickups.push(new Pickup(x + 14, y + 6, 'heart_container'));
        break;
      case 'magmadon':
        this.set('d2_done');
        Game.pickups.push(new Pickup(x, y, 'shard_ruby'));
        Game.pickups.push(new Pickup(x + 14, y + 6, 'heart_container'));
        break;
      case 'wraithlord':
        this.set('d3_done');
        Game.pickups.push(new Pickup(x, y, 'shard_sapphire'));
        Game.pickups.push(new Pickup(x + 14, y + 6, 'heart_container'));
        break;
      case 'pharaghast':
        this.set('d5_done');
        Game.pickups.push(new Pickup(x, y, 'heart_container'));
        Game.pickups.push(new Pickup(x - 12, y + 6, 'rupee20'));
        Game.pickups.push(new Pickup(x + 14, y + 6, 'rupee20'));
        setTimeout(() => {
          if (Game.state === 'play') {
            Dialogue.start({ pages: ['The Hollow King crumbles to still sand. Somewhere far above, the wind over the dunes softens to a whisper... and sounds almost grateful.'] });
          }
        }, 900);
        break;
      case 'karstag':
        this.set('d6_done');
        Game.pickups.push(new Pickup(x, y, 'heart_container'));
        Game.pickups.push(new Pickup(x - 12, y + 6, 'rupee20'));
        Game.pickups.push(new Pickup(x + 14, y + 6, 'rupee20'));
        Game.pickups.push(new Pickup(x + 2, y + 14, 'fairy'));
        setTimeout(() => {
          if (Game.state === 'play') {
            Dialogue.start({ pages: ['The Seventh Stone crumbles to gravel and quiet. Far above, six stones stand a little easier in the earth.'] });
          }
        }, 900);
        break;
      case 'frostmaw':
        this.set('d4_done');
        Game.pickups.push(new Pickup(x, y, 'heart_container'));
        Game.pickups.push(new Pickup(x - 12, y + 6, 'rupee20'));
        Game.pickups.push(new Pickup(x + 14, y + 6, 'rupee20'));
        Game.pickups.push(new Pickup(x + 2, y + 14, 'fairy'));
        setTimeout(() => {
          if (Game.state === 'play') {
            Dialogue.start({ pages: ['The glacier groans... and settles. The unnatural cold is broken. Frostpeak Hollow will see spring again.'] });
          }
        }, 900);
        break;
      case 'shade':
        this.set('game_complete');
        Game.startEnding();
        break;
    }
  },

  onShardCollected() {
    if (Items.shardCount() >= 3 && !this.flag('gate_hint')) {
      this.set('gate_hint');
      setTimeout(() => {
        if (Game.state === 'play') {
          Dialogue.start({
            pages: ['The three shards pull toward each other like living things... and toward the ruined castle in the north-west.'],
          });
        }
      }, 600);
    }
  },

  // ---------------- NPC dialogue ----------------
  // returns {speaker, pages, portrait?, choices?, onEnd?}
  npcDialogue(id) {
    const F = this, p = Game.data.player;
    switch (id) {
      case 'elder':
        if (!F.flag('got_sword')) {
          return {
            speaker: 'Elder Rowan', portrait: 'npc_elder',
            pages: [
              'So you came. Good. Your grandmother stood where you stand now, the night she left to face the Great Evil.',
              'The Shade has shattered the Sunstone. Three shards lie hidden: in the VERDANT TEMPLE east through the woods, under MT. CINDERTOP in the north-east, and in the SUNKEN CRYPT amid the southern marsh.',
              'Take this. It was hers. It is yours now.'
            ],
            onEnd: () => {
              F.set('got_sword');
              Game.data.player.hasSword = true;
              Items.grant({ type: 'sword_given' }, { silent: true });
              Dialogue.start({
                pages: ['You got the HERO\'S SWORD! Press SPACE to swing it. Hold SPACE to charge a spin attack!'],
                itemSprite: 'sword',
                onEnd: () => Dialogue.start({
                  speaker: 'Elder Rowan', portrait: 'npc_elder',
                  pages: ['Start with the Verdant Temple, east beyond the crossroads. And visit Rusl\'s shop in Bramblewick Town — a sword alone will not crack the mountain.']
                })
              });
            }
          };
        }
        if (F.flag('game_complete')) return { speaker: 'Elder Rowan', portrait: 'npc_elder', pages: ['The sun is back, and so are you. In my long life I have never been so glad to be wrong about how a story ends.'] };
        if (Items.shardCount() >= 3) return { speaker: 'Elder Rowan', portrait: 'npc_elder', pages: ['Three shards! The castle gate in the north-west will yield to them. End this, hero. And come home after.'] };
        if (F.flag('d2_done')) return { speaker: 'Elder Rowan', portrait: 'npc_elder', pages: ['Two shards... The last lies in the Sunken Crypt, south in Whisper Marsh. Its gate answers only to a crystal struck from afar — and inside, the dark is absolute. Bring your lantern.'] };
        if (F.flag('d1_done')) return { speaker: 'Elder Rowan', portrait: 'npc_elder', pages: ['The forest breathes easier already. Mt. Cindertop is next — its rock face hides a hollow wall. Bombs, child. Rusl sells them in town.'] };
        return { speaker: 'Elder Rowan', portrait: 'npc_elder', pages: ['The Verdant Temple lies east: follow the road through the crossroads and into the woods. The forest\'s guardian has... changed. Be ready.'] };

      case 'marin':
        if (!F.flag('marin_letter') ) {
          return {
            speaker: 'Marin', portrait: 'npc_woman',
            pages: [
              'Oh! You\'re the elder\'s hero, aren\'t you? Everyone\'s talking about it.',
              'Could I ask something small? My Finn is staying at the Drowsy Cucco Inn in Bramblewick, too scared of the roads to come home. Would you carry him this letter?'
            ],
            onEnd: () => {
              F.set('marin_letter');
              Items.grant({ type: 'letter' });
            }
          };
        }
        if (F.flag('letter_delivered')) return { speaker: 'Marin', portrait: 'npc_woman', pages: ['Finn came home this morning! He walked the whole road in the dark, the fool. Thank you — truly.'] };
        return { speaker: 'Marin', portrait: 'npc_woman', pages: ['The letter is for FINN, at the inn in Bramblewick Town. Tell him the tomatoes are doing fine without him. They are not.'] };

      case 'traveler_finn':
        if (F.flag('marin_letter') && !F.flag('letter_delivered') && p.letter) {
          return {
            speaker: 'Finn', portrait: 'npc_man',
            pages: [
              'A letter? From MARIN? Give it here—',
              '...She says the tomatoes are fine. She\'s lying, she always says they\'re fine when she misses me.',
              'That settles it, monsters or no. Here — I won this off a knight who drank too much. It\'ll serve you better than me.'
            ],
            onEnd: () => {
              F.set('letter_delivered');
              Game.data.player.letter = false;
              Items.grant({ type: 'shield' });
            }
          };
        }
        if (F.flag('letter_delivered')) return { speaker: 'Finn', portrait: 'npc_man', pages: ['I\'m leaving for Elden at first light. Or... second light. Third at the latest.'] };
        return { speaker: 'Finn', portrait: 'npc_man', pages: ['The roads? Full of monsters. The inn? Full of soup. I know where I\'m staying.'] };

      case 'shopkeep':
        return { speaker: 'Rusl', portrait: 'npc_shopkeep', pages: ['Welcome! Walk up to anything on the counter and press E to buy. No refunds — the economy\'s bad enough with all this eternal dusk.'] };

      case 'innkeep': {
        const choices = [
          { label: 'Rest (10r)', cb: () => {
            const pd = Game.data.player;
            if (pd.rupees >= 10) {
              pd.rupees -= 10;
              pd.hearts = pd.maxHearts;
              AudioSys.sfx('heal');
              Dialogue.start({ pages: ['You sleep like a stone. All hearts restored!'] });
            } else {
              AudioSys.sfx('error');
              Dialogue.start({ speaker: 'Innkeeper', pages: ['Sweetheart, that\'s not 10 rupees. Come back when your pockets jingle.'] });
            }
          } }
        ];
        if (F.flag('hermit_wants_soup') && !F.flag('hermit_fed') && !p.soup) {
          choices.push({ label: 'Hermit\'s soup', cb: () => {
            Dialogue.start({
              speaker: 'Innkeeper', portrait: 'npc_woman',
              pages: ['Old Yeta, up in the snows? Bless her stubborn bones — she used to wash dishes here, you know. This one\'s on the house. Keep it under your cloak so it stays warm!'],
              onEnd: () => Items.grant({ type: 'soup' })
            });
          } });
        }
        choices.push({ label: 'No thanks', cb: () => {} });
        return {
          speaker: 'Innkeeper', portrait: 'npc_woman',
          pages: ['Welcome to the Drowsy Cucco! A warm bed is 10 rupees. Interested?'],
          choices
        };
      }

      case 'guard_bex':
        if (F.flag('game_complete')) return { speaker: 'Guard Bex', portrait: 'npc_guard', pages: ['Sky\'s clear, roads are clear, and I\'m due a nap. You did that. Don\'t let it go to your head.'] };
        return { speaker: 'Guard Bex', portrait: 'npc_guard', pages: [
          'Stay sharp out there. Octoroks on the roads, Moblins in the woods, and something worse in the marsh. I\'d help, but... someone must guard this gate. Yes. Guard it.',
          'Oh — and travelers say the road south past the woods now ends in DUNES. Sand, in Hyrule! Vultures circling something buried. Not my jurisdiction, thankfully.'
        ] };

      case 'oldman_sage':
        if (!F.flag('d1_done')) return { speaker: 'Old Sage', portrait: 'npc_elder', pages: ['A word of wisdom, free of charge: cut the tall grass and lift the pots. This land hides its kindness in small places.'] };
        if (!F.flag('d2_done')) return { speaker: 'Old Sage', portrait: 'npc_elder', pages: ['Cracked walls sound hollow when you strike them. The mountain north-east is full of such lies. Bombs tell the truth.'] };
        if (!F.flag('d3_done')) return { speaker: 'Old Sage', portrait: 'npc_elder', pages: ['The crypt gate in the marsh? Struck by nothing but a flying thing. An arrow, boy. The crystal on the little island.'] };
        return { speaker: 'Old Sage', portrait: 'npc_elder', pages: ['The old castle... I remember when its windows had light in them. Go give it some.'] };

      case 'scholar_ivo':
        return {
          speaker: 'Scholar Ivo', portrait: 'npc_man',
          pages: [
            'Fascinating, the Sunstone. Not a gem at all — crystallized daylight! My notes suggest the shards actively resist darkness. Carry all three and even the Shade\'s own hall will not dim your sight.',
            'Also my notes suggest I should exercise more. Notes can be cruel.'
          ]
        };

      case 'townwoman_ella':
        if (F.flag('game_complete')) return { speaker: 'Ella', portrait: 'npc_woman', pages: ['Real sunlight! I\'d forgotten it has a smell. Like warm bread, I think.'] };
        return { speaker: 'Ella', portrait: 'npc_woman', pages: ['The dusk never lifts anymore. My flowers bloom confused and my rooster crows at midnight. Someone ought to do something.'] };

      case 'townman_dole':
        if (F.flag('d4_done')) return { speaker: 'Dole', portrait: 'npc_man', pages: ['You broke the glacier\'s curse? Huh. Maybe the fountain DOES grant wishes. I\'m wishing for that boat again.'] };
        return { speaker: 'Dole', portrait: 'npc_man', pages: [
          'Heard the fountain granted wishes once. I wished for a boat. Got rained on. Close enough, I say.',
          'And another thing — the hollow west of Elden has gone white with snow that never melts. Wolves in it too. Unnatural, I say.'
        ] };

      case 'kid_pip':
        return { speaker: 'Pip', portrait: 'npc_kid', pages: ['I saw a FAIRY once! West edge of the big woods, under a bush! Nobody believes me but I SAW it!'] };

      case 'kid_nell':
        return { speaker: 'Nell', portrait: 'npc_kid', pages: ['Mama says if I\'m bad the Poes in the marsh will get me. So I\'m only MOSTLY bad.'] };

      case 'mother_ana':
        return { speaker: 'Ana', portrait: 'npc_woman', pages: ['Keep clear of the marsh, dear. The dead down there stopped resting when the Shade came. My grandmother is among them, and she was difficult enough alive.'] };

      case 'granny_lu':
        return { speaker: 'Granny Lu', portrait: 'npc_woman', pages: ['In my day the monsters had the decency to stay in dungeons! Now they loiter on the roads like they pay taxes.'] };

      case 'villager_meg':
        if (Items.shardCount() >= 1) return { speaker: 'Meg', portrait: 'npc_woman', pages: ['Is that a Sunstone shard glowing in your pack?! It\'s beautiful... like a piece of morning.'] };
        return { speaker: 'Meg', portrait: 'npc_woman', pages: ['Elder Rowan hasn\'t slept since the black moon. Whatever he asks of you — it matters.'] };

      case 'villager_tomm':
        return { speaker: 'Tomm', portrait: 'npc_man', pages: ['My field\'s crawling with Octoroks. You know what Octoroks don\'t respect? Fences. You know what I build? Fences. It\'s been a bad year.'] };

      case 'hermit_yeta':
        if (p.soup && !F.flag('hermit_fed')) {
          return {
            speaker: 'Hermit Yeta', portrait: 'npc_hermit',
            pages: [
              'Is that... is that the Cucco\'s barley soup? Child, come IN, sit DOWN, you\'re letting the warm out.',
              '...Mmm. She still puts too much pepper in it. Perfect.',
              'You\'ve done an old woman a kindness, so hear an old woman\'s secret: my strength isn\'t all gone. Take some. I\'ve carried it far enough.'
            ],
            onEnd: () => {
              Game.data.player.soup = false;
              F.set('hermit_fed');
              Items.grant({ type: 'heart_container' });
            }
          };
        }
        if (F.flag('hermit_fed')) {
          if (F.flag('d4_done')) return { speaker: 'Hermit Yeta', portrait: 'npc_hermit', pages: ['The glacier\'s stopped its growling. First quiet night in years. You did that, didn\'t you? Thought so. The soup was still the braver deed.'] };
          return { speaker: 'Hermit Yeta', portrait: 'npc_hermit', pages: ['That thing under the ice — FROSTMAW, the old maps called it. It\'s why the snow won\'t melt. Its den is north of here, in the glacier\'s mouth. Mind its charge; even the walls flinch.'] };
        }
        if (F.flag('hermit_wants_soup')) {
          return { speaker: 'Hermit Yeta', portrait: 'npc_hermit', pages: ['The Drowsy Cucco, in Bramblewick. Barley soup. Tell them it\'s for Yeta and they\'ll know. My knees remember every step of that road, which is why they refuse to walk it.'] };
        }
        return {
          speaker: 'Hermit Yeta', portrait: 'npc_hermit',
          pages: [
            'A visitor? In THIS snow? Either you\'re lost or you\'re brave, and lost people knock softer.',
            'I\'ve lived in this hollow since before it froze. Something sleeps under the glacier and breathes winter, and I\'m too old to care and too stubborn to leave.',
            'But oh, what I\'d give for a bowl of hot barley soup from the Drowsy Cucco. If your road ever passes through Bramblewick... an old woman can dream, can\'t she?'
          ],
          onEnd: () => F.set('hermit_wants_soup')
        };

      case 'fisherman_odon':
        if (p.lure && F.flag('lure_quest') && !F.flag('flippers_given')) {
          return {
            speaker: 'Odon', portrait: 'npc_fisher',
            pages: [
              'My LURE! Ha HA! Painted her myself — see the little face? She\'s smiling because she catches everything.',
              'A deal\'s a deal. These flippers were my grandfather\'s — real Zora make. The lake\'s yours now, friend. Mind the deep water; even Zora-craft has limits.'
            ],
            onEnd: () => {
              Game.data.player.lure = false;
              F.set('flippers_given');
              Items.grant({ type: 'flippers' });
            }
          };
        }
        if (F.flag('flippers_given')) {
          if (F.flag('lorelei_met')) return { speaker: 'Odon', portrait: 'npc_fisher', pages: ['So you\'ve met HER. The lady in the lake. Grandfather swore she was real and everyone laughed at him. Nobody\'s laughing now, are they.'] };
          return { speaker: 'Odon', portrait: 'npc_fisher', pages: ['Swim out to the island sometime. On still nights I\'ve seen a light out there — not a lantern. Softer. Like the lake is dreaming.'] };
        }
        if (F.flag('lure_quest')) return { speaker: 'Odon', portrait: 'npc_fisher', pages: ['The lure snagged and snapped off somewhere along the east river — check the shallows past the bridge. Red and white, smiling face. You\'ll know her.'] };
        return {
          speaker: 'Odon', portrait: 'npc_fisher',
          pages: [
            'Twenty years I\'ve fished this lake, and one bad cast took my Lucky Lure down the east river. Snagged in the shallows somewhere past the bridge.',
            'Fetch her back and I\'ll give you something better than any fish: my grandfather\'s ZORA FLIPPERS. With those you could swim this whole lake.'
          ],
          onEnd: () => F.set('lure_quest')
        };

      case 'lorelei': {
        const heal = () => {
          const pd = Game.data.player;
          pd.hearts = pd.maxHearts;
          AudioSys.sfx('heal');
          Particles.burst(Game.player.cx(), Game.player.cy(), 20, { color: ['#a8e8f8', '#e8f6fc', '#fff'], life: 1 });
        };
        if (!F.flag('lorelei_met')) {
          return {
            speaker: 'Lorelei', portrait: 'npc_spirit',
            pages: [
              'So the flippers found a worthy pair of feet at last. I am Lorelei. This lake and I have been keeping each other company for a very long time.',
              'You carry hard roads in your eyes, little swimmer. Rest. The water remembers every hero it has ever carried, and it will remember you kindly.'
            ],
            onEnd: () => { F.set('lorelei_met'); heal(); }
          };
        }
        let hint = 'The dusk sits heavy on the water. Finish what you began, hero.';
        if (F.flag('game_complete')) hint = 'The sun on the water... I had forgotten. Thank you for giving the lake back its mirror.';
        else if (!F.flag('d5_done') && F.flag('d4_done')) hint = 'The sand to the south-east whispers of a king who refused to stay buried. Bring flame, if you go. The dead there remember fearing it.';
        else if (Items.shardCount() >= 3) hint = 'Three lights in your pack, bright enough to see from the lakebed. The old castle is waiting.';
        return {
          speaker: 'Lorelei', portrait: 'npc_spirit',
          pages: [hint],
          onEnd: heal
        };
      }

      case 'nomad_zaffa':
        if (F.flag('d5_done')) return { speaker: 'Zaffa', portrait: 'npc_nomad', pages: ['The night after you went below, the dunes went QUIET. First time in years. My cousin says the oasis is coming back. I say: drinks are free for you, forever, anywhere my caravan stops.'] };
        return {
          speaker: 'Zaffa', portrait: 'npc_nomad',
          pages: [
            'Welcome to the last camp before the sand takes over. Zaffa — caravans, curiosities, and unsolicited advice.',
            'The advice: that tomb east of here belongs to PHARAGHAST, a king so greedy he was buried with his whole court. The dead in there hate fire above all things. Make of that what you will.',
            'The doors answer to the crystal past the broken ground — something thrown or shot might reach where feet cannot.'
          ]
        };

      case 'digger_dan':
        if (F.flag('d5_done')) return { speaker: 'Digger Dan', portrait: 'npc_man', pages: ['You beat the Hollow King?! I\'ve been digging for his treasury for six years! ...Was there gold down there? Don\'t tell me. TELL me. No — don\'t.'] };
        return { speaker: 'Digger Dan', portrait: 'npc_man', pages: ['Careful where you step — sandwurms hunt by feel. When the ground starts churning, MOVE. I lost a boot learning that. The boot had my lunch in it. Long story.'] };

      case 'rancher_elda':
        if (F.flag('cucco_home')) return { speaker: 'Elda', portrait: 'npc_rancher', pages: ['Pella\'s back on her roost like nothing happened, the little tyrant. That quiver was my husband\'s — he\'d be glad it\'s getting used.'] };
        if (F.flag('cucco_carried')) {
          return {
            speaker: 'Elda', portrait: 'npc_rancher',
            pages: [
              'PELLA! Oh, you found her — and she LET you carry her? She pecks everyone. You must be all right.',
              'Here, this is for you. My husband\'s old stitching. Fits more arrows than any store-bought thing.'
            ],
            onEnd: () => {
              F.set('cucco_home');
              Items.grant({ type: 'big_quiver' });
            }
          };
        }
        if (F.flag('ranch_quest')) return { speaker: 'Elda', portrait: 'npc_rancher', pages: ['Pella went WEST, toward the snow, the absolute fool of a bird. White feathers in white snow. Listen for the clucking.'] };
        return {
          speaker: 'Elda', portrait: 'npc_rancher',
          pages: [
            'Welcome to Meadowbrook. Don\'t mind the quiet — half my cuccos won\'t lay since the dusk came, and my prize hen PELLA has run off entirely.',
            'She bolted west when the wolves started howling. If you ever pass through the snows and find a very angry white bird... bring her home?'
          ],
          onEnd: () => F.set('ranch_quest')
        };

      case 'cucco_pella':
        if (F.flag('ranch_quest')) {
          return {
            speaker: 'Pella', portrait: 'npc_cucco',
            pages: ['Bwok?! ...The cucco eyes you, decides you are marginally warmer than a snowdrift, and climbs into your pack.'],
            onEnd: () => {
              F.set('cucco_carried');
              F.set('npcgone:cucco_pella');
              AudioSys.sfx('secret');
              // she leaves the world — carried home in your pack
              Game.npcs = Game.npcs.filter(n => n.id !== 'cucco_pella');
            }
          };
        }
        return { speaker: 'Pella', portrait: 'npc_cucco', pages: ['BWOK. The cucco stares through you with the confidence of a creature that has never once been wrong.'] };

      case 'fisher_bjorn':
        if (F.flag('d4_done')) return { speaker: 'Bjorn', portrait: 'npc_fisher', pages: ['Pond\'s thawing at the edges since the glacier went quiet. The fish are confused. So am I. Good work, probably!'] };
        return {
          speaker: 'Bjorn', portrait: 'npc_fisher',
          pages: [
            'Odon fishes the lake, I fish the ICE. We do not speak of which is harder. (It is mine.)',
            'A tip for you: things drop through the ice and just... sit there. I\'ve seen a glint out on the pond for weeks. My auger\'s too short and my courage shorter.'
          ]
        };

      case 'trader_sami':
        return {
          speaker: 'Sami', portrait: 'npc_nomad',
          pages: ['Zaffa\'s cousin, best prices in the sand — which is easy, being the ONLY prices in the sand. Step to the counter and press E on what you fancy. The big bomb bag? Dug it out of a dune myself. Barely haunted.']
        };

      case 'harbor_brine':
        if (F.flag('beacon_lit')) return { speaker: 'Brine', portrait: 'npc_man', pages: ['The Light\'s burning again! First time in three years I can see the end of my own pier at night. When the dusk lifts for good, the trade ships will find their way back. I can feel it.'] };
        return {
          speaker: 'Brine', portrait: 'npc_man',
          pages: [
            'Harbormaster Brine — harbormaster of no ships, lately. The dusk swallowed the trade routes and the Light went cold, and no captain sails toward a dark shore.',
            'Old Elio still keeps the tower. If anyone could get a true flame up there again, the sea roads would open. Flint won\'t do it. It wants REAL fire.'
          ]
        };

      case 'salt_nan':
        if (Items.shardCount() >= 1) return { speaker: 'Nan', portrait: 'npc_woman', pages: ['That glow in your pack — sunstone, isn\'t it? My gran used to say the sea remembers the sun better than the sky does. Go show the water. See if it doesn\'t shine back.'] };
        return { speaker: 'Nan', portrait: 'npc_woman', pages: ['Mind the tide, dear. It comes in faster than it used to. Everything\'s in a hurry since the dusk — everything except the fish.'] };

      case 'salt_tide':
        return {
          speaker: 'Old Tide', portrait: 'npc_man',
          pages: [
            'Forty years on the water, and I\'ll tell you the sea\'s one true secret: gulls never circle nothing.',
            'They\'ve been wheeling over a sandbar east of the pier for a month now. If you can swim like a Zora, there\'s something out there worth getting wet for.'
          ]
        };

      case 'keeper_elio':
        if (F.flag('beacon_lit')) return { speaker: 'Keeper Elio', portrait: 'npc_elder', pages: ['Hear it? That soft roar up top — that\'s her burning. Three years I climbed those stairs to polish a cold lamp, because a keeper keeps. Tonight I\'ll climb them just to watch her shine.'] };
        if (p.hasFireRod) {
          return {
            speaker: 'Keeper Elio', portrait: 'npc_elder',
            pages: [
              'Three years the lamp\'s been cold. Flint, oil, prayers — the dusk drinks every spark before it catches.',
              '...Wait. That rod on your belt. That\'s TRUE flame, that is — old flame, tomb flame. Child, would you? Would you light her?',
              'You raise the Fire Rod... the lamp catches with a WHUMP, and gold light rolls out across the water for the first time in three years!'
            ],
            onEnd: () => {
              F.set('beacon_lit');
              AudioSys.sfx('secret');
              Game.shake(3, 0.4);
              Items.grant({ type: 'rupees', amount: 100 });
            }
          };
        }
        return {
          speaker: 'Keeper Elio', portrait: 'npc_elder',
          pages: [
            'Saltmere Light\'s been dark three years. The dusk drinks any spark I strike before the wick catches. Flint\'s no good. Lantern\'s no good.',
            'It wants a TRUE flame — the old kind. They say the desert kings were buried with fire that never dies. Fat lot of good it does anyone down there.'
          ]
        };

      case 'kid_shell':
        if (p.hasFlippers) return { speaker: 'Shell', portrait: 'npc_kid', pages: ['You can SWIM?! In the actual SEA?! Okay okay okay — if you find a shell bigger than my head, I saw it first. That\'s the rule. I made it up but it\'s still the rule.'] };
        return { speaker: 'Shell', portrait: 'npc_kid', pages: ['I\'ve got sixty-one shells! Mama says stop bringing them inside so now they live in the pots. Don\'t tell her. Don\'t SMASH them either!!'] };

      case 'druid_ash':
        if (F.flag('d6_done')) return { speaker: 'Ash', portrait: 'npc_hermit', pages: ['The wood is lighter since the Barrow went still. Six stones keeping honest watch, and the seventh finally sleeping. You did a green and gentle thing down there, whatever it looked like at the time.'] };
        return {
          speaker: 'Ash', portrait: 'npc_hermit',
          pages: [
            'I keep the old ways for the Elderwood — someone has to remember which trees are listening.',
            'You\'ve seen the Standing Stones on the high moor? Six above, and the SEVENTH buried beneath, and it does not lie quiet. The barrow beneath the stones has been grinding at night.',
            'They say the Seventh guards a pearl the sea gave the mountains as a promise. If you go down for it... go loud. Stone respects thunder.'
          ]
        };

      case 'herbalist_fern':
        return {
          speaker: 'Fern', portrait: 'npc_woman',
          pages: ['Welcome to the Hollow. I grow what the wood allows and sell what I can spare — walk up to the counter goods and press E. Everything\'s fresher than that town shop, and I\'ll hear nothing further on the matter.']
        };

      case 'ferryman_wake': {
        const stops = [
          { label: 'Saltmere Pier', x: 37, y: 81 },
          { label: 'Isle of Winds', x: 44, y: 112 },
          { label: 'Ember Isle', x: 134, y: 127 },
          { label: 'Gull Rocks', x: 84, y: 151 }
        ];
        const pl = Game.player;
        const here = pl ? stops.reduce((a, s) =>
          U.dist(pl.cx(), pl.cy(), s.x * 16, s.y * 16) < U.dist(pl.cx(), pl.cy(), a.x * 16, a.y * 16) ? s : a) : stops[0];
        const choices = stops.filter(s => s !== here).map(s => ({
          label: `${s.label} (5r)`,
          cb: () => {
            const pd = Game.data.player;
            if (pd.rupees >= 5) {
              pd.rupees -= 5;
              AudioSys.sfx('buy');
              Game.ferryTo(s.x, s.y);
            } else {
              AudioSys.sfx('error');
              Dialogue.start({ speaker: 'Wake', portrait: 'npc_fisher', pages: ['Five rupees, friend. The sea takes her toll and so do I — she\'s just less polite about it.'] });
            }
          }
        }));
        choices.push({ label: 'Stay ashore', cb: () => {} });
        return {
          speaker: 'Wake the Ferryman', portrait: 'npc_fisher',
          pages: [`Only boat on the Shattered Sea, and you're looking at her captain. Where to from ${here.label}?`],
          choices
        };
      }

      case 'waykeeper_rosa':
        if (F.flag('d5_done') && F.flag('d4_done')) return { speaker: 'Rosa', portrait: 'npc_rancher', pages: ['Glacier quiet, dunes quiet — the highland wind\'s the loudest thing left out here, and I intend to keep it that way. Broth\'s on. Sit before it isn\'t.'] };
        return {
          speaker: 'Rosa', portrait: 'npc_rancher',
          pages: [
            'Rosa. This is my waystation, and those are my rules on the wall — there\'s one rule and it\'s "wipe your boots."',
            'Directions? East road runs to the crags — something hollow in the far rock, if you\'ve powder to spend. South through the Elderwood the road forgets itself, so don\'t you forget it too. And the Standing Stones... leave them be after dark. They count you.'
          ]
        };

      case 'mayor_palm':
        if (F.flag('beacon_lit') && !F.flag('mayor_thanks')) {
          return {
            speaker: 'Mayor Palm', portrait: 'npc_man',
            pages: [
              'You\'re the one who relit Saltmere Light! Friend, our whole fishing fleet steers home by that flame. Three boats we\'d have lost to the fog this season alone.',
              'Windfall pays its debts. My grandmother\'s strength charm — the whole village insists. No arguing with a village.'
            ],
            onEnd: () => {
              F.set('mayor_thanks');
              Items.grant({ type: 'heart_container' });
            }
          };
        }
        if (F.flag('mayor_thanks')) return { speaker: 'Mayor Palm', portrait: 'npc_man', pages: ['The Light still burns and the boats still come home. You\'ll never buy your own drink on this island, hero.'] };
        return { speaker: 'Mayor Palm', portrait: 'npc_man', pages: ['Welcome to Windfall! Mayor Palm — elected by everyone, opposed by no one, which my wife says should worry me. The mainland\'s lighthouse went dark years back. Our boats miss it sorely.'] };

      case 'isle_lila':
        if (Items.shardCount() >= 3) return { speaker: 'Lila', portrait: 'npc_woman', pages: ['Three sunstone shards in one pack! When you\'ve finished saving the world, come back — I want to weave that light into a sail. First one\'s yours.'] };
        return { speaker: 'Lila', portrait: 'npc_woman', pages: ['I weave sailcloth. Or I did, when there were ships worth the thread. Wake\'s little ferry doesn\'t need sails — she needs luck, mostly. We all chip in.'] };

      case 'isle_koa':
        if (F.flag('d5_done')) return { speaker: 'Koa', portrait: 'npc_kid', pages: ['You went INSIDE the dead king\'s tomb? On PURPOSE? You\'re officially the coolest person to ever visit this island. The bar was low but STILL.'] };
        return { speaker: 'Koa', portrait: 'npc_kid', pages: ['I\'ve been to the mainland TWICE. There\'s a mountain that BREATHES SMOKE east of here — Wake sails past it! He says nobody\'s ever cracked the rock open. Somebody should crack the rock open.'] };

      case 'fairy':
        return {
          speaker: 'Great Fairy', portrait: 'npc_fairy',
          pages: ['Weary child of the bloodline... let the spring mend you.'],
          onEnd: () => {
            const pd = Game.data.player;
            pd.hearts = pd.maxHearts;
            AudioSys.sfx('heal');
            Particles.burst(Game.player.cx(), Game.player.cy(), 20, { color: ['#f8b8d8', '#a8e8f8', '#fff'], life: 1 });
          }
        };

      default:
        return { pages: ['...'] };
    }
  }
};
