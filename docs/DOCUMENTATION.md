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
  1. **Crown**: Grants Bonus Max HP and Mana capacity.
  2. **Goblet**: Grants Shield Strength and incoming healing amplification.
  3. **Feather**: Grants Evasion Rating and attack cadence.
  4. **Ring**: Grants Bonus ATK Power and Critical Strike damage.
  5. **Pendant**: Grants Mana Replenishment and energy recovery rate.
  6. **Aegis**: Grants Ultimate Amplification and physical mitigation.

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

### 8.3 The Pantheon Trials (Artifact Dungeon)
The Pantheon Trials provide a dedicated dungeon instance for targeted relic farming:
- **Chambers**: 8 dedicated god chambers corresponding to each Olympian deity (Crypt of the Underworld, Sky Sanctum of Olympus, Abyssal Trench, Crossroads of the Wind, Colosseum of War, Temple of the Sun, Citadel of Wisdom, Silver Woods).
- **Difficulty Tiers & Energy Costs**:
  - **Disciple Trial (Tier 1)**: Costs 10 Energy. Recommended Power: 150 PWR. Drops 2 targeted Uncommon/Rare relics + 25 Madness Shards + 1 Soul Essence.
  - **Champion Trial (Tier 2)**: Costs 12 Energy. Recommended Power: 800 PWR. Drops 3 targeted Rare/Epic relics + 50 Madness Shards + 2 Soul Essence.
  - **Sovereign Trial (Tier 3)**: Costs 15 Energy. Recommended Power: 3,500 PWR. Drops 3 targeted Epic/Legendary relics + 100 Madness Shards + 4 Soul Essence.
  - **Divine Trial (Tier 4)**: Costs 18 Energy. Recommended Power: 12,000 PWR. Drops 4 targeted Legendary/Mythical relics + 250 Madness Shards + 8 Soul Essence.
- **Madness Tower Overlord Boss Caches**:
  - Overlord Bosses (Wave 5 of every floor) have a 35% chance to drop a random Relic Cache upon defeat, providing supplemental relic drops during idle tower progression.

### 8.4 Equipment Management & Dismantling
- **Equipping**: Players can tap any weapon or relic socket in the Party View to inspect the equipped item, unequip it, or swap with any compatible equipment item from inventory.
- **Dismantling**: Unequipped weapons and relics can be dismantled in the equipment modal to yield bonus Spirit Shards ($20 \times \text{Item Level}$), providing recycling utility for surplus gear.

---

## 9. High-Fantasy UI-Kit Architecture & Hero Pedestal Showcase

### 9.1 Visual Design System & UI-Kit Tokens
The interface employs a high-fantasy mobile aesthetic inspired by classical RPG UI-Kits:
- **Typography**: Dual-font typography utilizing Cinzel serif for headings, banners, and deity titles, alongside Outfit sans-serif for numbers, statistics, and tactical gameplay elements.
- **Metallic Gold Gradients**: Curated linear gradients representing divine craftsmanship (`linear-gradient(135deg, #fff2ad 0%, #d4af37 50%, #99741e 100%)`) with warm specular highlights.
- **Regal Banner Ribbons**: Deep royal purple and obsidian ribbon containers with cut-corner borders and swallowtail contours.
- **Segmented Stat Gauges**: Ten-segment micro-meters visualizing Attack Power, Health Points (red-orange glow), and Mana charge (cyan-blue glow).

### 9.2 Hero Pedestal Showcase
The Party View incorporates a dual-mode layout (Hero Pedestal and Full Roster):
- **Team Switcher Column**: Vertical stack of five party member medallions featuring active gold borders, level indicators, and evolution alert pips.
- **Three-Dimensional Glowing Pedestal**: An illuminated isometric stage featuring concentric runic rotation, light ray emanations, and dynamic spirit sprite hovering animation. Ready-to-evolve spirits emit a radiant golden aura.
- **Spirit Dossier**: Detailed character breakdown showcasing species lineage, total combat power with equipment bonus attribution, and segmented attribute meters.
- **Rapid Equipment Drawer**: Direct 4x2 gear inspection drawer allowing one-tap equipping, unequipping, and dismantling without navigating away from the party showcase.

### 9.3 Diamond Fast-Travel Hub
In the Madness Zone combat screen, a diamond-oriented quad-cluster navigation widget enables immediate transitions between Combat, Hero Pedestal, Astral Summons, and the Pantheon Trials.

---

## 10. Audio Engine Architecture & Sound Events

### 10.1 Hybrid Audio Architecture
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

### 10.2 Lifecycle & User Gesture Compliance
In accordance with modern browser autoplay policies, audio context initialization and track playback automatically unlock upon the player's first user interaction (touch or click). User audio preferences (mute state, music volume, SFX volume) are persisted in local storage.



