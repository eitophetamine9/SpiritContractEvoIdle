# Spirit Contract Evo | Idle - System & Technical Documentation

This document contains detailed system specifications, mathematical formulations, economy balancing curves, evolution horizon tables, and architecture references for Spirit Contract Evo Idle.

---

## 1. System Architecture & State Machine

### 1.1 State Architecture
The game operates on a single reactive state manager (`GameStateManager`) implemented in `src/state/gameState.js`.
- **Pub/Sub System**: Subscriptions allow UI views to respond reactively to ticks, saves, level caps, stage unlocks, and combat events without tight coupling.
- **Tick Interval**: Active simulation ticks every 250ms (4 ticks per second).
- **Save Engine**: State automatically saves to `localStorage` every 15 seconds, during floor unlocks, summons, evolutions, and on page unload (`beforeunload` / `visibilitychange`).

### 1.2 State Schema
```typescript
interface GameState {
  version: number;
  last_saved: number;
  resources: {
    spiritShards: number;
    soulEssence: number;
    energy: number;
    maxEnergy: number;
    energySecondsAccumulator: number;
    resonanceTier: number;
  };
  spirits: SpiritInstance[];
  party: string[];               // IDs of active party (max 5)
  hallOfFame: string[];          // IDs of showcase spirits (max 5)
  discoveredSpeciesIds: string[]; // Bestiary discovery registry
  madnessZone: {
    currentStage: number;
    highestStageCleared: number;
    currentWave: number;
    unlockedStages: number[];
    isAutoCombat: boolean;
    combatSpeed: number;         // 1 or 2
  };
  stats: {
    totalSpiritsContracted: number;
    totalEvolutions: number;
    totalEnemiesDefeated: number;
    shardsEarnedTotal: number;
    totalOfflineTimeSec: number;
  };
}
```

---

## 2. 7-Tier Rarity Hierarchy & Power Formulas

### 2.1 Rarity Multipliers
Rarity acts as a core stat multiplier across base power and level progression:

| Rarity Tier | Identifier | Multiplier | Accent Hex | Border Flare |
| :--- | :--- | :---: | :---: | :--- |
| Tier 1 | COMMON | 1.00x | `#bdc3c7` | Slate grey border |
| Tier 2 | UNCOMMON | 1.18x | `#2ecc71` | Emerald border |
| Tier 3 | RARE | 1.35x | `#3498db` | Sapphire border |
| Tier 4 | EPIC | 1.60x | `#9b59b6` | Amethyst border |
| Tier 5 | LEGENDARY | 2.10x | `#f39c12` | Amber flame border |
| Tier 6 | MYTHICAL | 2.80x | `#e74c3c` | Pulsing ruby glow |
| Tier 7 | TRANSCENDENT | 4.00x | `#00ffff` | Cyan starlight flare |

### 2.2 Power Calculation Formula
For any spirit at Level $L$:
$$\text{Power} = \lfloor \text{BasePower} \times (1 + (L - 1) \times \text{GrowthRate}) \times \text{RarityMultiplier} \rfloor \times (1 + \text{ResonanceTier} \times 0.05)$$

---

## 3. Spirit Species & Evolution Horizons

### 3.1 Base Contract Spirits (Level Cap & Branch Horizons)

| Base Spirit | Rarity | Cap | Evolution Branches & Odds |
| :--- | :--- | :---: | :--- |
| **Cat Spirit** | Common | Lv. 10 | 80% Furious Cat (Uncommon, 2.2x), 20% Elemental Cat (Epic, 3.5x) |
| **Dog Spirit** | Common | Lv. 10 | 80% Vitality Dog (Uncommon, 2.2x), 20% Guardian Dog (Epic, 3.5x) |
| **Chicken Spirit** | Common | Lv. 10 | 90% Battle Chicken (Uncommon, 2.0x), 10% Dino Genus Chicken (Legendary, 4.0x) |
| **Caterpillar Spirit** | Common | Lv. 10 | 90% Elegant Butterfly (Uncommon, 2.0x), 10% Mystical Butterfly (Legendary, 4.0x) |
| **Bull Spirit** | Uncommon | Lv. 15 | 80% Raging Bull (Uncommon, 2.2x), 15% Elemental Bull (Epic, 3.2x), 5% Minotaur (Mythical, 4.5x) |
| **Lizard Spirit** | Uncommon | Lv. 15 | 80% Multi-venom Lizard (Uncommon, 2.2x), 15% Komodo Dragon (Epic, 3.2x), 5% Drake (Mythical, 4.5x) |
| **Python Spirit** | Uncommon | Lv. 15 | 80% HighLord Python (Uncommon, 2.2x), 15% Huge Albino Anaconda (Epic, 3.2x), 5% Wyrm (Mythical, 4.5x) |
| **Shark Spirit** | Rare | Lv. 20 | 90% Great White Shark (Epic, 2.5x), 8% Megalodon (Mythical, 3.8x), 2% Cosmic Oceanic Devourer (Transcendent, 5.5x) |
| **Bear Spirit** | Rare | Lv. 20 | 90% HighLord Bear (Epic, 2.5x), 8% Bear of Dreams (Mythical, 3.8x), 2% Cosmic Bear Ursalite (Transcendent, 5.5x) |
| **Wisp Spirit** | Epic | Lv. 25 | 100% High Elf (Mythical, 3.5x) |
| **Fallen Warrior Spirit** | Legendary | Lv. 30 | 99% Sovereign Warrior (Mythical, 3.0x), 1% DreadLord Warrior (Transcendent, 6.0x) |

---

## 4. Tower Biomes & Madness Zone Progression

The tower features 100 base floors spanning 6 biomes, looping infinitely with the "Enchanted" prefix past Floor 100:

| Floors | Biome Name | Identifier | Environmental Visuals |
| :--- | :--- | :--- | :--- |
| **1 to 10** | Mystical Swamp | `mystical_swamp` | Murky waters, bioluminescent spores, toxic crawlers |
| **11 to 20** | Mystical Winterland | `mystical_winterland` | Frost-covered crags, crystalline auroras, frost stalkers |
| **21 to 40** | Dark Castle | `dark_castle` | Gothic spires, iron gargoyles, shadowed knights |
| **41 to 60** | Abyssal Sunken Depths | `abyssal_depths` | Submerged coral ruins, luminescent leviathans |
| **61 to 80** | Volcanic Hellfire Caldera | `volcanic_caldera` | Molten obsidian veins, ash clouds, infernal drakes |
| **81 to 100** | Celestial Primordial Sanctum | `primordial_sanctum` | Astral spires, cosmic constellations, ethereal sovereigns |
| **101+** | Enchanted Cycle (Looping) | Prefix: `enchanted_` | Infinite repetition with 1.4x stat scaling per 100 floors |

---

## 5. Offline Progression & Economy Math

### 5.1 24-Hour Offline Engine
Offline progress is calculated upon session initialization:
- **Elapsed Duration**: $\Delta t = \min(t_{\text{current}} - t_{\text{last\_saved}}, 86400)$ seconds.
- **Active Training Rate**:
  $$\text{Active XP/sec} = 3.0 \times \left(1 + 0.08 \times (\text{Highest Floor} - 1)\right)$$
- **Offline XP Rate**: 20% of active training rate:
  $$\text{Offline XP} = \Delta t \times (\text{Active XP/sec} \times 0.20)$$
- **Offline Shards**: 25% of active rate based on the player's highest unlocked floor.
- **Offline Soul Essence**: 1 Essence granted per 2 hours offline (maximum 12 Essence per full 24-hour cycle).

### 5.2 Energy Engine
- Base Cap: 60 Energy.
- Regeneration: +1 Energy every 30 seconds.
- Cost: 10 Energy to unlock each new floor. Completed floors are permanently free to replay (0 Energy).
- Essence Expansion: Permanently adds +10 to Max Energy per upgrade.

---

## 6. Testing & Quality Assurance

The codebase includes automated test suites covering all game subsystems:
- `test_game_engine.js`: Validates contract roster distribution, 1,000-pull astral contract probabilities, shard drop economy curves, energy regeneration, biome tier assignment, Spirit HP and Ultimates, Swarm formations, and Two-Way Combat simulation.
- `run_probability_tests.js`: Executes 100-pull simulations on Normal and Astral summons, plus 100 simulated evolutions for every base spirit species to verify RNG tables.
- `test_ui_components.js`: Validates Bestiary tile grid generation, Bestiary inspect modal markup, and visual Hall of Fame assignment logic.

---

## 7. Two-Way Combat Engine & Ultimates System

### 7.1 Allied Spirit Stats (HP, MP, Shields)
- **Max HP Calculation**:
  $$\text{Max HP} = \max(80, \text{round}(\text{basePower} \times 12 \times (1 + (\text{level} - 1) \times 0.22) \times \text{rarityMultiplier}))$$
- **Mana (MP) Accumulation**:
  - Maximum MP: 100.
  - Automatic Battle Accumulation: +20 MP/sec during active combat.
  - Active Tapping: Manual party attack clicks award +10 MP to all living party spirits.
- **Shields**:
  - Granted by Support Ultimates (e.g. Dog Spirit).
  - Shields absorb incoming enemy damage before health deduction.

### 7.2 Ultimates Catalog
At 100 MP, spirits unleash their species-specific Ultimate skill:
- **AOE_DAMAGE**: Deals heavy multi-target damage across all living enemies in the swarm (e.g. Cat Spirit, Bull Spirit, Wyrm).
- **DAMAGE / EXECUTE**: Deals concentrated damage to the lead enemy or executes the lowest-health enemy (e.g. Chicken Spirit, Minotaur).
- **SUPPORT**: Restores HP to living allies, grants team shields, and revives 1 fallen ally if any are knocked out (e.g. Dog Spirit).
- **HEAL**: Large party heal and fallen ally revival (e.g. Caterpillar Spirit, Elegant Butterfly).
- **AOE_DAMAGE_AND_HEAL**: Hybrid burst dealing swarm damage while restoring party health (e.g. Mystical Butterfly, Bear of Dreams, High Elf).

### 7.3 Enemy Swarms & Counter-Attacks
- **Wave Formation**:
  - Waves 1 to 4: Swarms of 1 to 4 corrupted minions with staggered attack timers.
  - Wave 5 (Boss Wave): 1 Overlord Boss accompanied by 2 Royal Guard Sentinels.
- **Counter-Attacks**:
  - Each enemy attacks on an individual cooldown (2.2s to 2.8s), targeting the frontline living spirit.
  - Knocked-out spirits enter the KO state until revived by support spirits, floor victory, or party regrouping.
- **Victory and Wipeout Rules**:
  - **Floor Victory**: Defeating the wave 5 boss revives all fallen and damaged spirits to 100% Max HP.
  - **Party Wipeout**: If all active party members fall in combat, the party safely resets to Wave 1 of the current floor with 100% Max HP restored and zero loss of progression, items, or currency.

---

## 8. Equipment, Greek God Relics & The Pantheon Trials

### 8.1 Equipment Sockets
Each contracted spirit possesses seven dedicated equipment slots:
- **1 Weapon Slot**: Main offensive armament providing raw ATK Power, Critical Rate, and Ultimate Amplification. Weapon archetypes include Spectral Blade, Celestial Bow, Astral Scepter, Primordial Claws, Shadow Dagger, and Titan Mallet.
- **6 Relic Slots**:
  1. **Headgear**: Grants Maximum Health Points (HP).
  2. **Totem**: Grants Defensive Shield Capacity.
  3. **Ring**: Grants Bonus ATK Power and Critical Strike damage.
  4. **Necklace**: Grants Mana Replenishment and energy recovery rate.
  5. **Orb**: Grants Ultimate Amplification and magical mitigation.
  6. **Charm**: Grants Evasion Rating and attack cadence.

### 8.2 Greek God Relic Sets & Set Bonuses
Relics belong to one of eight Olympian God sets. Equipping matching set pieces activates two-piece (2pc) and four-piece (4pc) passive blessings:

| God Set | 2-Piece Set Bonus | 4-Piece Set Bonus |
| :--- | :--- | :--- |
| **Hades** | +10% Damage, +5% Mana Replenish | **Underworld Flames**: Unleashes dark flames dealing 5% enemy Max HP as damage-over-time for 7 seconds (15s cooldown). |
| **Zeus** | +20% Mana Replenish Rate | **Divine Retribution**: Strikes all enemies with instant lightning dealing 15% enemy Max HP (45s cooldown). |
| **Poseidon** | +10% Damage, +5% Ultimate Amplification | **Oceanic Surge**: Grants +15% team damage buff and 15% Max HP water shield to all spirits (45s cooldown). |
| **Hermes** | +15% Evasion, +5% Mana Replenish | **Swift Support**: Every 30 seconds, automatically cleanses debuffs and charges the Ultimate gauges of living spirits by +25 MP. |
| **Ares** | +15% Damage Bonus | **War of Olympus**: Enters a berserk battle trance granting +35% Attack Power for 10 seconds (25s cooldown). |
| **Apollo** | +10% Damage, +10% Mana Replenish | **Sun Radiance**: Emits solar light that heals all allies for 20% Max HP and burns enemies for 10% current HP (35s cooldown). |
| **Athena** | +15% Shield Strength, +5% Damage | **Aegis Bulwark**: Grants an impenetrable defensive barrier absorbing up to 25% team Max HP (40s cooldown). |
| **Artemis** | +10% Critical Strike Chance, +10% Damage | **Hunters True Strike**: Fires focused arrows targeting the highest-health enemy dealing 25% single-target burst damage (20s cooldown). |

### 8.3 The Pantheon Trials (Artifact Dungeon & 3-Wave Combat Arena)
The Pantheon Trials provide a dedicated dungeon instance for targeted relic farming with a 3-wave combat arena:
- **Chambers**: 8 dedicated god chambers corresponding to each Olympian deity (Crypt of the Underworld, Sky Sanctum of Olympus, Abyssal Trench, Crossroads of the Wind, Colosseum of War, Temple of the Sun, Citadel of Wisdom, Silver Woods).
- **3-Wave Combat Encounters**:
  - **Wave 1**: 2 Divine Sentinels.
  - **Wave 2**: 2 Sacred Temple Guardians.
  - **Wave 3 (Boss)**: Olympian God Avatar Boss flanked by Royal Temple Protectors.
- **Combat Mechanics**: Living spirits automatically attack and charge Mana. Reaching 100 MP triggers team Ultimates. Players can execute manual Divine Strikes to accelerate boss decimation. Defeat allows regrouping with zero penalty; victory yields targeted God Relics.
- **Difficulty Tiers & Energy Costs**:
  - **Disciple Trial (Tier 1)**: Costs 10 Energy. Recommended Power: 150 PWR. Drops 2 targeted relics + 25 Madness Shards + 1 Soul Essence.
  - **Champion Trial (Tier 2)**: Costs 12 Energy. Recommended Power: 800 PWR. Drops 3 targeted relics + 50 Madness Shards + 2 Soul Essence.
  - **Sovereign Trial (Tier 3)**: Costs 15 Energy. Recommended Power: 3,500 PWR. Drops 3 targeted relics + 100 Madness Shards + 4 Soul Essence.
  - **Divine Trial (Tier 4)**: Costs 18 Energy. Recommended Power: 12,000 PWR. Drops 4 targeted relics + 250 Madness Shards + 8 Soul Essence.
- **Madness Tower Overlord Boss Caches**:
  - Overlord Bosses (Wave 5 of every floor) have a 35% chance to drop a random Relic Cache upon defeat, providing supplemental relic drops during idle tower progression.

### 8.4 The Divine Forge (Dedicated Weapon Dungeon)
The Divine Forge provides a standalone dungeon instance dedicated to forging specialized spirit weapons:
- **Forge Chambers**:
  1. **Bladesmith Sanctum**: Forges Spectral Blades, Astral Greatswords, and Katana armaments.
  2. **Archers Grove**: Forges Celestial Recurves, Astral Longbows, and Crossbow armaments.
  3. **Arcane Spire**: Forges Astral Staves, Mystic Wands, and Spellbound Rods.
  4. **Behemoth Den**: Forges Primordial Claws, Beast Gauntlets, and Spiked Knuckles.
  5. **Shadow Armory**: Forges Shadow Daggers, Twin Blades, and Nether Stilettos.
  6. **Titans Anvil**: Forges Titan Mallets, Warhammers, and Earthshaker Maces.
- **Difficulty Tiers**:
  - **Apprentice Forge (Tier 1)**: Costs 8 Energy. Recommended Power: 120 PWR. Drops 1-2 targeted weapons.
  - **Artisan Forge (Tier 2)**: Costs 12 Energy. Recommended Power: 650 PWR. Drops 2 targeted weapons.
  - **Master Forge (Tier 3)**: Costs 15 Energy. Recommended Power: 2,800 PWR. Drops 2-3 targeted weapons.
  - **Celestial Forge (Tier 4)**: Costs 18 Energy. Recommended Power: 10,000 PWR. Drops 3 targeted weapons.
- **Combat Arena**: Features 3 waves of combat (Forge Minions, Elite Automatons, and the Colossus Forge Master) before awarding weapon loot.

### 8.5 Relic Star Tiers (3★-6★), Substats & Ascension
- **Star Ratings (3★ to 6★)**:
  - **3★ Relics**: Drop with 1-2 random substats (max capacity: 3).
  - **4★ Relics**: Drop with 2-3 random substats (max capacity: 4).
  - **5★ Relics**: Drop with 3-4 random substats (max capacity: 4).
  - **6★ Ascended Relics**: Attainable only via Ascension at Level 15; unlocks a 5th empowered substat slot with divine multiplier.
- **Random Substat Pool**:
  - `Crit Chance` (+1.5% to +4.0%)
  - `Crit Damage` (+8.0% to +20.0%)
  - `Attack Power %` (+3.0% to +8.0%)
  - `Health %` (+4.0% to +10.0%)
  - `Attack Speed %` (+2.0% to +6.0%)
  - `Flat ATK` (+15 to +50)
  - `Flat HP` (+80 to +250)
- **Enhancement & Ascension Engine**:
  - Relics enhance from +1 to +15 using Spirit Shards and Essences of the Gods. Every 3 levels (+3, +6, +9, +12, +15), an existing substat is rolled for a major enhancement upgrade.
  - At +15, 5★ relics can undergo **Divine Ascension** consuming 50 Essences of the Gods, elevating them to 6★ with golden prismatic borders and unlocking the 5th substat.
- **Dismantling**: Unequipped relics and weapons can be dismantled to reclaim Spirit Shards and Essences of the Gods.

---

## 9. The Sanctuary of the Gods & Mystical Realm

The Mystical Realm (`mysticalView.js`) represents the celestial core for essence harvesting, elixir consumption, and divine favor:
- **Essence Chambers**:
  1. **Olympian Nexus**: Drops Essences of the Gods with lightning affinity.
  2. **Titan Depths**: Drops Essences of the Gods with primordial stone affinity.
  3. **Celestial Core**: Drops high-yield Essences of the Gods and bonus Soul Essence.
  4. **Primordial Abyss**: High-difficulty chamber yielding massive quantities of Essences of the Gods.
- **Astral EXP Potions**:
  - **Lesser Astral Elixir**: Grants +10,000 XP (Costs 100 Shards & 5 Essences).
  - **Greater Astral Elixir**: Grants +50,000 XP (Costs 400 Shards & 20 Essences).
  - **Supreme Astral Elixir**: Grants +200,000 XP (Costs 1,200 Shards & 50 Essences).
  - **Transcendent Astral Elixir**: Grants +1,000,000 XP (Costs 4,500 Shards & 150 Essences).
- **Timed 1-Hour Combat Blessings**:
  - Players can activate divine blessings that persist across all game modes for 1 hour:
    - **Blessing of Ares**: +20% Total Party Damage.
    - **Blessing of Athena**: +25% Shield Strength & +10% Damage.
    - **Blessing of Hermes**: +15% Party Attack Speed & Evasion.
    - **Blessing of Apollo**: +20% Healing & Ultimate Power.
    - **Blessing of Zeus**: +25% Mana Replenish Rate & Lightning Shock.
    - **Blessing of Poseidon**: +15% Damage & Tidal Water Shield.
    - **Blessing of Hades**: +15% Critical Damage & Lifesteal.
    - **Blessing of Artemis**: +15% Critical Strike Chance.

---

## 10. Multi-Banner Gacha Altar & Milestones

The Contract Altar (`contractView.js`) features multi-banner rate-ups and milestone rewards:
- **Multi-Banner Carousel**:
  - **Solaris Rate-Up Banner**: Elevated odds for Light/Solar celestial spirits.
  - **Primordial Sanctum Banner**: Rate-up for Earth & Dark behemoths.
  - **Olympian Pantheon Banner**: Rate-up for mythological and warrior spirits.
  - **Standard Astral Banner**: Balanced collection pool across all 47 spirit species.
- **Bulk Summoning**: Instant 1x, 10x, and 30x multi-pulls with celebratory rare fanfare.
- **Summoner Level & Milestone Tracks**: Every contract grants Summoner XP. Achieving summon count milestones (10, 20, 30, 50, 100 pulls) awards bonus Shards, Essences, and Astral Elixirs.

---

## 11. High-Fantasy UI Architecture & 2.5D Viewports

### 11.1 Pixi.js 2.5D Isometric Rendering Engine
The arena viewport engine (`arenaRenderer.js`) is integrated across the Madness Zone, Pantheon Trials, The Divine Forge, and the Mystical Realm:
- **Pixi.js (v8.x) WebGL Canvas**: Hardware-accelerated rendering featuring dynamic isometric planes, runic circles, elemental weather effects (embers, rain, leaves, lightning), and grounded character shadows.
- **GSAP Tweens & Camera Dynamics**: Smooth combat lunges, ultimate activation pulses, screen-shake transients, and floating combat text.

### 11.2 The Divine Vault (TCG Card Collection)
The Vault (`vaultView.js`) implements a collectible card layout:
- **3 Distinct Categories**: Dedicated tabs for ⛩️ Spirits, 🔱 Relics, and ⚔️ Weapons.
- **Custom Filter Sliders**: Utilizes `.index-filter-scroll` matching the Bestiary Index, featuring the signature glowing green scrollbar thumb (`#27ae60`), mouse-wheel horizontal scrolling, and horizontal scroll position retention across re-renders.
- **Bulk Annulment**: Multi-select mode with visual red checkbox indicators (`✓`), Commons/Uncommons quick-select buttons, and a "Select All (Filtered)" action with favorite and party protection.
- **In-Line Customization**: Instant star favorite locking and custom spirit renaming.

### 11.3 Unified 8-Column Mobile Navigation Dock
The primary bottom navigation bar is constructed as a responsive 8-column single-line dock fitting mobile screens with zero horizontal overflow:
- **Hero**: Active party formation, pedestal showcase, and equipment sockets.
- **Tower**: Madness Zone 2.5D tower combat and wave progression.
- **Trials**: The Pantheon Trials relic dungeon and 3-wave god battles.
- **Forge**: The Divine Forge weapon dungeon and chamber selection.
- **Realm**: The Sanctuary of the Gods, essence chambers, EXP potions, and blessings.
- **Summon**: Multi-banner contract altar and summoner milestones.
- **Vault**: TCG Card Collection for Spirits, Relics, and Weapons.
- **Index**: Terraria-style Spirit Bestiary Compendium.

---

## 12. Audio Engine Architecture & Sound Events

### 12.1 Hybrid Audio Architecture
The audio engine (`audioManager.js`) provides zero-latency playback using HTML5 Audio and the Web Audio API:
- **Background Music (BGM)**:
  - `sanctum_ambient.wav`: Atmospheric minor-key pad with ethereal harmonic arpeggios for Sanctum and Vault navigation.
  - `battle_madness.wav`: Rhythmic 120 BPM combat pulse with synth bass drive for the Madness Tower.
  - `trials_pantheon.wav`: Solemn brass and orchestral progression for the Pantheon Trials dungeon.
- **Sound Effects (SFX)**:
  - `attack_hit.wav`: Melee impact transient on manual and automated party strikes.
  - `crit_hit.wav`: Resonant sub-bass critical blow when set bonus passives trigger.
  - `ultimate_cast.wav`: Ascending energy vortex burst on full 100 MP ultimate release.
  - `level_up.wav`: Four-note ascending celestial chime.
  - `evolution_fanfare.wav`: Regal four-chord victory fanfare on successful spirit evolution.
  - `dungeon_reward.wav`: Sparkling bell chime on artifact dungeon clearance.
  - `button_tap.wav`: Crisp tactile click on navigation and gear equip.

### 12.2 Lifecycle & User Gesture Compliance
In accordance with modern browser autoplay policies, audio context initialization and track playback automatically unlock upon the player's first user interaction (touch or click). User audio preferences (mute state, music volume, SFX volume) are persisted in local storage.

---

## 13. Spirit Ascension System (★1 to ★7)

### 13.1 Overview & Mathematical Scaling
The Spirit Ascension System allows players to utilize duplicate copies of spirits obtained from contract pulls to permanently augment a target spirit's stats and unlock milestone combat traits.

Base stat scaling follows:
$$\text{Effective Base Stat} = \text{Base Stat} \times (1 + \text{Ascension Level} \times 0.12)$$

| Ascension Tier | Duplicates Required | Astral Essence Cost | Stat Multiplier | Combat Trait Unlocked | Visual Treatment |
| :---: | :---: | :---: | :---: | :--- | :--- |
| ★1 | 1 Copy | 1 🔮 | +12% Total Stats | — | Bronze Star Badge (`★1`) |
| ★2 | 1 Copy | 1 🔮 | +24% Total Stats | — | Silver Star Badge (`★2`) |
| ★3 | 2 Copies | 2 🔮 | +36% Total Stats | **Celestial Quickening**: Spirit enters combat with +15 starting MP | Gold Star Badge (`★3`) |
| ★4 | 2 Copies | 3 🔮 | +48% Total Stats | — | Gold Star Badge (`★4`) |
| ★5 | 3 Copies | 4 🔮 | +60% Total Stats | **Divine Surge**: Ultimate Skill damage/effect amplified by +20% | Emerald Star Badge (`★5`) |
| ★6 | 3 Copies | 5 🔮 | +72% Total Stats | — | Amethyst Star Badge (`★6`) |
| ★7 (MAX) | 4 Copies | 8 🔮 | +84% Total Stats | **Sovereign Focus**: +10% Critical Hit Chance, +25% Critical Hit Damage | Glowing Golden Frame + (`★7 MAX`) |

### 13.2 Ascension Rules & Evolution Preservation
1. **Species Match**: Duplicate spirits must belong to the exact same species identifier (e.g. `cat_spirit`).
2. **Locking Protections**: Spirits marked as favorites or currently equipped in the active 5-slot combat party are protected and ineligible for sacrifice.
3. **Evolution Horizon Inheritance**: When a spirit evolves, its `ascensionLevel` and all associated combat perks are permanently carried forward to the evolved species form.

---

## 14. Astral Realm Overhaul & Expansion

### 14.1 Pure Astral Currency Economy
The Astral Realm has been decoupled from standard Spirit Shards:
- **🔮 Astral Essences (`soulEssence`)**: Rare catalysts harvested from Essence Dungeons, Constellation milestones, Expeditions, and the Transmutation Circle.
- **💠 Essences of the Gods (`essencesOfTheGods`)**: Divine reagents awarded from Pantheon Trials, Sanctuary Dungeons, and relic dismantling.
- **Zero-Shard Rule**: Upgrading Energy Capacity, brewing Astral EXP Elixirs, and invoking Divine Blessings require exclusively 🔮 and 💠, completely eliminating shard sink pressure in the sanctum.

### 14.2 Celestial Constellations (Zodiac Passive Trees)
Players can permanently illuminate 5 star nodes across 3 Zodiac Constellations using 🔮 Astral Essences:

#### 1. Draco (The Dragon of Fury - Offensive Tree)
- **Node 1 (Dragon Claw)**: +4% All Spirit ATK Power (Cost: 2 🔮)
- **Node 2 (Scaled Vigor)**: +6% All Spirit ATK Power (Cost: 3 🔮)
- **Node 3 (Draconic Focus)**: +5% Critical Hit Chance (Cost: 5 🔮)
- **Node 4 (Infernal Wrath)**: +15% Critical Hit Damage (Cost: 8 🔮)
- **Node 5 (Dragon Sovereign)**: +20% Ultimate Skill Amplification (Cost: 12 🔮)

#### 2. Phoenix (The Immortal Flame - Vitality & Defense Tree)
- **Node 1 (Kindled Spark)**: +5% All Spirit Max HP (Cost: 2 🔮)
- **Node 2 (Blazing Plume)**: +8% All Spirit Max HP (Cost: 3 🔮)
- **Node 3 (Aegis of Ashes)**: +10% Max HP Initial Shield on combat start/wave clear (Cost: 5 🔮)
- **Node 4 (Solar Rebirth)**: +15% Healing & Regeneration (Cost: 8 🔮)
- **Node 5 (Eternal Avatar)**: +10% Permanent Damage Mitigation (Cost: 12 🔮)

#### 3. Pegasus (The Harbinger of Starlight - Velocity & Utility Tree)
- **Node 1 (Zephyr Stride)**: +10% Faster Natural Energy Regen Interval (Cost: 2 🔮)
- **Node 2 (Aether Hooves)**: +20 Max Energy Vault Capacity (Cost: 3 🔮)
- **Node 3 (Cosmic Siphon)**: +25% Chance for Extra 🔮 Astral Drop from Overlord Bosses (Cost: 5 🔮)
- **Node 4 (Astral Swiftness)**: +20% Idle AFK Training Experience (Cost: 8 🔮)
- **Node 5 (Celestial Emissary)**: +25% Bonus 💠 God Essences from Trials (Cost: 12 🔮)

### 14.3 Astral Expeditions (Idle Spirit Dispatch)
Idle spirits not in the active combat party can be dispatched into cosmic rifts for idle foraging:

| Fissure ID | Name | Duration | Team Size | Element Affinity | Base Loot Yields |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `starlight_fissure` | Starlight Fissure | 2 Hours | 1 Spirit | WIND | 1–2 🔮 Astral, 15–25 💠 Gods, 100 💎 Shards |
| `nebula_abyss` | Nebula Abyss | 6 Hours | 2 Spirits | WATER | 3–5 🔮 Astral, 35–55 💠 Gods, 300 💎 Shards, 50% Relic Drop |
| `primordial_void` | Primordial Void | 12 Hours | 3 Spirits | LIGHT | 8–12 🔮 Astral, 80–120 💠 Gods, 800 💎 Shards, 100% Relic Drop |

- **Elemental Synergy**: Including at least 1 spirit matching the fissure's recommended affinity applies a **1.25x (+25%) multiplier** to all generated rewards.

### 14.4 Astral Transmutation Circle (Anti-Oversaturation Protocol)
To ensure late-game economy health and prevent hyper-inflation of Spirit Shards:
$$\text{Shard Cost} = 1,000 + (\text{Transmutations Today} \times 250) \text{ 💎}$$
$$\text{God Essence Cost} = 10 \text{ 💠}$$
$$\text{Reward} = 1 \text{ 🔮 Astral Essence}$$
The escalation counter resets daily at midnight.

---

## 15. The Divine Vault: Bulk Management & Dismantle Engine

### 15.1 Unified Collection Management
The Divine Vault provides streamlined bulk operations across all three collectible item categories:
- **⛩️ Spirits (Bulk Annul)**: Release unwanted spirits back into the ether to reclaim Spirit Shards.
- **🔱 Relics (Bulk Dismantle)**: Deconstruct excess Greek God relics into Spirit Shards and Essences of the Gods.
- **⚔️ Weapons (Bulk Dismantle)**: Smelt obsolete forged weapons into Spirit Shards.

### 15.2 Bulk Filter Profiles & Safety Protocols
- **Contextual Filtering**:
  - **Spirits**: Quick-select `Commons` and `Uncommons`.
  - **Relics**: Quick-select `3★ Stars` and `4★ Stars`.
  - **Weapons**: Quick-select `Commons` and `Uncommons`.
  - **Global Filters**: `Select All` (respects current rarity and slot/element filters) and `Clear`.
- **Locking Safety Guarantees**:
  - **Active Party & Equipped Gear**: Spirits in the 5-member party or equipment currently worn by any spirit (`equippedToSpiritId`) cannot be selected for bulk operations.
  - **Favorite Locking**: Any item with `favorite: true` is permanently protected from bulk actions; toggling a favorite immediately purges the item from the selection set.
- **Dynamic Yield Preview**: Displays real-time estimated returns (💎 Spirit Shards and 💠 Essences of the Gods) prior to confirming the transaction.





