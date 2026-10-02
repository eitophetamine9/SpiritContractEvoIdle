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
- `test_game_engine.js`: Validates contract roster distribution, 1,000-pull astral contract probabilities, shard drop economy curves, energy regeneration, and biome tier assignment up to Floor 105.
- `run_probability_tests.js`: Executes 100-pull simulations on Normal and Astral summons, plus 100 simulated evolutions for every base spirit species to verify RNG tables.
- `test_ui_components.js`: Validates Bestiary tile grid generation, Bestiary inspect modal markup, and visual Hall of Fame assignment logic.
