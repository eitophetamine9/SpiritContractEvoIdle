# Spirit Contract Evo | Idle - System & Technical Documentation

This document provides system specifications, mathematical formulations, economy balancing curves, evolution horizon tables, combat engine rules, and architecture references for Spirit Contract Evo | Idle.

---

## 1. System Architecture & Reactive State Machine

### 1.1 State Architecture
The engine operates on a single reactive state manager (`GameStateManager`) defined in `src/state/gameState.js`.
- **Pub/Sub Dispatch**: Components and view renderers register listeners via `gameState.on(event, handler)` and `gameState.subscribe(handler)`. Updates emit selectively on ticks, floor unlocks, summons, evolutions, gear changes, and rebirth events.
- **Simulation Loop**: Active combat and AFK timers tick every 250ms (4 ticks per second).
- **Tab Switching & Visibility Tracking**: The engine tracks window focus via `visibilitychange` events. Time spent away from the active tab is computed precisely and credited toward passive XP without interrupting background timers.
- **Persistence Engine**: State auto-saves to `localStorage` every 15 seconds, immediately upon floor clears, summon ceremonies, evolutions, and on page unload (`beforeunload` and `visibilitychange`).

### 1.2 State Schema
```typescript
interface GameState {
  version: number;
  last_saved: number;
  resources: {
    spiritShards: number;
    soulEssence: number;
    essencesOfTheGods: number;
    energy: number;
    maxEnergy: number;
    energySecondsAccumulator: number;
    resonanceTier: number;
  };
  spirits: SpiritInstance[];
  party: string[];               // IDs of active combat party (max 5)
  formation: {                   // 3x3 Tactical Grid placement
    [slotKey: string]: string;   // e.g., 'f1', 'f2', 'f3', 'm1', 'm2', 'm3', 'b1', 'b2', 'b3'
  };
  hallOfFame: string[];          // IDs of showcase pedestal spirits (max 5)
  discoveredSpeciesIds: string[]; // Bestiary discovery registry
  madnessZone: {
    currentStage: number;
    highestStageCleared: number;
    currentWave: number;
    unlockedStages: number[];
    isAutoCombat: boolean;
    combatSpeed: number;         // 1 or 2
    lastSpoilClaimTimestamp: number; // Idle meditation claim timer
  };
  constellations: {
    [constellationId: string]: {
      unlockedStars: number[];
    };
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

| Rarity Tier | Identifier | Multiplier | Accent Hex | Border Visual |
| :--- | :--- | :---: | :---: | :--- |
| Tier 1 | COMMON | 1.00x | `#bdc3c7` | Slate grey border |
| Tier 2 | UNCOMMON | 1.18x | `#2ecc71` | Emerald border |
| Tier 3 | RARE | 1.35x | `#3498db` | Sapphire border |
| Tier 4 | EPIC | 1.60x | `#9b59b6` | Amethyst border |
| Tier 5 | LEGENDARY | 2.10x | `#f39c12` | Amber flame border |
| Tier 6 | MYTHICAL | 2.80x | `#e74c3c` | Pulsing ruby glow |
| Tier 7 | TRANSCENDENT | 4.00x | `#00ffff` | Cyan starlight flare |

### 2.2 Base Power Calculation
For any spirit instance at Level $L$:
$$\text{Power} = \lfloor \text{BasePower} \times (1 + (L - 1) \times \text{GrowthRate}) \times \text{RarityMultiplier} \rfloor \times (1 + \text{ResonanceTier} \times 0.05)$$

---

## 3. 7-Core Dual Attributes System

Every spirit computes two-tier attributes combining base values, equipment flat bonuses, and percentage modifiers.

### 3.1 Dual Attributes Mathematical Model
For any attribute $A \in \{\text{HP}, \text{ATK}, \text{DEF}\}$:
$$\text{Total}(A) = \lfloor (\text{Base}(A) + \text{BonusFlat}(A)) \times (1 + \frac{\text{PercentMod}(A)}{100}) \times (1 + \text{RebirthMult}) \rfloor$$

For percentage attributes $A \in \{\text{CritRate}, \text{CritDMG}, \text{UltAmp}, \text{ManaReplenish}\}$:
$$\text{Total}(A) = \text{Base}(A) + \text{GearBonus}(A) + \text{SetBonus}(A) + \text{RebirthBonus}(A)$$

### 3.2 7-Core Attributes Summary

1. **Max Health (HP)**:
   - Primary survivability metric. Supports Tank absorption and Healer HP-based restorations.
   - Base Formula: $\max(80, \text{round}(\text{basePower} \times 12 \times (1 + (L - 1) \times 0.22) \times \text{rarityMultiplier}))$.
2. **Attack Power (ATK)**:
   - Dictates regular damage dealt, weapon power scaling, and offensive healer output.
   - Base Formula: $\max(12, \text{round}(\text{basePower} \times 1.2 \times (1 + (L - 1) \times 0.16) \times \text{rarityMultiplier}))$.
3. **Defense (DEF)**:
   - Mitigates incoming damage across all combat modes.
   - Base Formula: $\max(8, \text{round}(\text{basePower} \times 0.65 \times (1 + (L - 1) \times 0.14) \times \text{rarityMultiplier}))$.
4. **Critical Rate (CRIT Rate)**:
   - Base value: 5.0%. Scaled via weapon upgrades, relic substats, and Rebirth perks. Hard cap: 100.0%.
5. **Critical Damage (CRIT DMG)**:
   - Base value: 150.0%. Amplifies critical strikes upon trigger. Hard cap: 500.0%.
6. **Ultimate Amplification (Ult Amp)**:
   - Base value: 0.0%. Directly increases ultimate skill damage and shield/heal magnitude.
7. **Mana Replenishment (Mana Replenish)**:
   - Base value: 100.0%. Modulates natural combat mana generation rate (Base: +20 MP/sec).

---

## 4. 54-Spirit Dynamic Scaling Profiles Matrix

All 54 species in the catalog are mapped to distinct dynamic scaling profiles that dictate how their skills and ultimates interact with the 7-Core attributes.

### 4.1 Archetype Categories & Formulas

| Archetype | Primary Stat | Scaling Formula | Secondary Scaling |
| :--- | :--- | :--- | :--- |
| **Vitality Healer** | Max HP | $\text{Heal} = \text{Max HP} \times 0.12 \times (1 + \frac{\text{UltAmp}}{100})$ | Team Shield = 15% Max HP |
| **Radiant Healer** | ATK | $\text{Heal} = \text{ATK} \times 1.40 \times (1 + \frac{\text{UltAmp}}{100})$ | Can Critically Heal (CRIT Rate/DMG) |
| **Iron Bastion Tank** | DEF | $\text{Shield} = \text{DEF} \times 2.0 \times (1 + \frac{\text{UltAmp}}{100})$ | Taunt Lock: Intercepts 100% of single-target attacks |
| **Primal Behemoth Tank**| Max HP | $\text{Shield} = \text{Max HP} \times 0.22 \times (1 + \frac{\text{UltAmp}}{100})$ | Vanguard Counter-Attack: 8% Max HP physical |
| **Burst DPS** | ATK | $\text{Damage} = \text{ATK} \times 3.20 \times (1 + \frac{\text{UltAmp}}{100})$ | CRIT Enabled, Single-Target / Boss Shred |
| **AOE Swarm DPS** | ATK | $\text{Damage} = \text{ATK} \times 1.85 \times (1 + \frac{\text{UltAmp}}{100})$ | Hits all living swarm targets simultaneously |
| **Tactical Support** | Mana / ATK | Grants Team Shields + Energy Charge (+25 MP) | Cleanses debuffs, boosts ally ATK by 20% |

### 4.2 Species Catalog & Role Distribution (54 Spirits)
The complete 54-spirit roster is distributed across 5 tactical combat roles:
- **Healers (6)**: Lepidopteran Vitality Healer, Radiant Seraphic Herald, High Elf Luminary, Bear of Dreams, Mystical Butterfly, Wisp Initiate.
- **Tanks (12)**: Iron Vanguard Bull, Primal Earth Hound, Bovine Colossus, Drake Bastion, Minotaur Sovereign, Wyrm Guardian, Komodo Bulwark, and related evolutions.
- **Main DPS (18)**: Abyssal Apex Shark, Solaris The One Ultimate, Baphomet Voidbinder Archdemon, DreadLord Warrior, Star Valkyrie Astraea, Dino Genus Chicken, Sovereign Warrior, and related forms.
- **Sub DPS (11)**: Shadow Feline, Battle Cockatrice, Nether Stiletto Drake, Flame Avian, Multi-venom Lurker, and related forms.
- **Supports (7)**: Canine Aegis, Chrono Temporal Guardian, Dawn Herald, Guardian Hound, and allied buffer forms.

---

## 5. Celestial Rebirth System (Tier 1 to Tier 7)

The Rebirth System allows players to sacrifice duplicate copies of spirits along with Soul Essences to elevate a spirit through 7 Celestial Rebirth tiers.

### 5.1 Rebirth Progression Table

| Rebirth Tier | Duplicates Required | Soul Essence Cost | Stat Multiplier | Combat Trait Unlocked |
| :---: | :---: | :---: | :---: | :--- |
| Tier 1 | 1 Copy | 1 Essence | +12% Base Stats | Starts combat with +20 MP; primary scaling stat boosted by +5%. |
| Tier 2 | 1 Copy | 1 Essence | +24% Base Stats | Basic strike cooldown reduced by 10%. |
| Tier 3 | 2 Copies | 2 Essence | +36% Base Stats | Celestial Quickening: Starts combat with +15 bonus MP. |
| Tier 4 | 2 Copies | 3 Essence | +48% Base Stats | Defensive barrier absorbing 10% Max HP on wave start. |
| Tier 5 | 3 Copies | 4 Essence | +60% Base Stats | Divine Surge: Ultimate skill damage and potency amplified by +20%. |
| Tier 6 | 3 Copies | 5 Essence | +72% Base Stats | Critical Hit Chance increased by +5%. |
| Tier 7 | 4 Copies | 8 Essence | +84% Base Stats | Sovereign Focus: +10% Crit Rate, +25% Crit DMG, and Golden Card Border. |

### 5.2 Rebirth Invariants
1. **Species Uniformity**: Duplicates must share the exact `speciesId` of the base spirit.
2. **Locking Safeguards**: Spirits currently placed in the active 5-member party or marked as favorites are strictly protected from sacrifice.
3. **Evolution Persistence**: Rebirth tier and all unlocked traits persist permanently across evolutionary transformations.

---

## 6. Spirit Sanctum Hub Architecture

The Spirit Sanctum Hub serves as the dedicated character management dashboard. Designed with a portrait-first layout, it keeps primary views uncluttered while offering depth on demand.

### 6.1 Layout & Component Structure
- **Hero Carousel Strip**: Horizontally scrollable top strip displaying all contracted spirits with role icons, levels, and Rebirth stars. Includes collapsible search and role filtering chips (DPS, Sub-DPS, Tank, Support, Healer).
- **Hero Stage Viewport**: Renders the active spirit's animated pixel sprite, elemental affinity, role badge, combat power, and manual Strike/Flinch test controls.
- **Uncluttered Attributes Card**: Displays a clean 2x2 grid of essential metrics (Max HP, ATK, DEF, CRIT Rate / DMG) alongside an interactive level progression bar.
- **More Info Expander**: Toggling the "More Info" button expands an inline panel revealing the full 7-Core dual attributes breakdown and the spirit's active scaling matrix formula.
- **16-Parameter Dossier**: A dedicated modal accessible from the hub displaying categorized statistics: Primary Offense, Survivability, Tactical Flow, and Divine Multipliers.
- **5 Sub-Hub Navigation**:
  1. **Attributes**: Core stats, level-up controls, evolution ceremony triggers, and scaling details.
  2. **Weapons**: Equipped armament socket, forge stats, and quick enhancement (+1 to +15).
  3. **Relics**: 6 relic sockets (Headgear, Totem, Ring, Necklace, Orb, Charm), star tiers, and Greek God set bonus trackers.
  4. **Rebirths**: Interactive 7-tier celestial node tree showing required materials and stat gains.
  5. **Talents**: Detailed combat role traits, ultimate skill breakdowns, and positioning perks.

---

## 7. 3x3 Tactical Grid & Combat Engine

### 7.1 Formation Layout & Rules
Party placement uses a 9-slot grid structured as 3 columns:
- **Frontline (`f1`, `f2`, `f3`)**: Vanguard position. Preferred by Tanks. Units gain +15% DEF and a 2.0x Threat multiplier.
- **Midline (`m1`, `m2`, `m3`)**: Core combat line. Preferred by DPS and Supports. Units gain standard 1.0x Threat.
- **Backline (`b1`, `b2`, `b3`)**: Sanctuary position. Preferred by Healers. Units gain +15% Healing potency and a 0.5x Threat multiplier. **Constraint**: Maximum 1 spirit may be positioned in the Backline simultaneously.

### 7.2 Threat Footprint & Aggro Targeting
Enemies select targets using weighted probability based on effective Threat:
$$P(\text{Target}_i) = \frac{\text{Threat}_i}{\sum_{j} \text{Threat}_j}$$
- Frontline Tanks typically possess over 65% of the total party threat footprint.
- **Taunt Lock**: When a Tank unleashes their Ultimate, they activate a 6-second Taunt Lock, intercepting 100% of enemy single-target strikes.

### 7.3 Defense Mitigation Curve
Incoming raw physical and magical damage is mitigated by Defense according to:
$$\text{Mitigation Factor} = \frac{100}{100 + \text{DEF} \times 0.2857}$$
$$\text{Damage Taken} = \lfloor \text{Raw Damage} \times \text{Mitigation Factor} \rfloor$$
- 0 DEF: 0% mitigation (1.00x damage taken).
- 350 DEF: 50% mitigation (0.50x damage taken).
- 700 DEF: 67% mitigation (0.33x damage taken).

---

## 8. Equipment, Greek God Relics & The Divine Forge

### 8.1 Equipment Sockets
Every spirit can equip 1 Weapon and 6 Relics:
- **1 Weapon**: Spectral Blade, Celestial Bow, Astral Staff, Primordial Claws, Shadow Dagger, or Titan Mallet.
- **6 Relics**: Headgear (HP), Totem (Shield/DEF), Ring (ATK/Crit), Necklace (Mana Replenish), Orb (Ult Amp), Charm (Evasion/Speed).

### 8.2 8 Olympian God Relic Sets

| God Set | 2-Piece Set Bonus | 4-Piece Set Bonus |
| :--- | :--- | :--- |
| **Hades** | +10% Damage, +5% Mana Replenish | Underworld Flames: Deals 5% enemy Max HP as DoT for 7s (15s CD). |
| **Zeus** | +20% Mana Replenish Rate | Divine Retribution: Instant lightning striking all enemies for 15% Max HP (45s CD). |
| **Poseidon** | +10% Damage, +5% Ult Amp | Oceanic Surge: +15% team damage buff and 15% Max HP water shield (45s CD). |
| **Hermes** | +15% Evasion, +5% Mana Replenish | Swift Support: Cleanses debuffs and charges living allies by +25 MP every 30s. |
| **Ares** | +15% Damage Bonus | War of Olympus: Trance granting +35% ATK for 10s (25s CD). |
| **Apollo** | +10% Damage, +10% Mana Replenish | Sun Radiance: Heals team for 20% Max HP and burns enemies for 10% current HP (35s CD). |
| **Athena** | +15% Shield Strength, +5% Damage | Aegis Bulwark: Impenetrable barrier absorbing up to 25% team Max HP (40s CD). |
| **Artemis** | +10% Crit Rate, +10% Damage | Hunters True Strike: Fires focused arrows dealing 25% single-target burst (20s CD). |

### 8.3 Substat Rerolling
Using 5 Soul Essences, players can reroll all randomized substats on any relic or weapon to optimize stat distributions.

---

## 9. Offline Progression, Tab Switching & Idle Spoils

### 9.1 24-Hour Diminishing Engine
Offline training simulates gains up to a 24-hour cap (86,400s) with balanced progression curves:
- **Offline XP**: 20% of active training rate based on the player's highest unlocked floor.
- **Offline Shards**: 25% of active shard rate.
- **Offline Soul Essence**: 1 Essence per 2 hours (up to 12 Essence per full 24-hour period).

### 9.2 1-Hour Minimum Idle Spoils Rule
To prevent rapid-fire claim abuse and encourage deliberate play sessions:
- Idle meditation spoils can only be claimed if at least 1 hour (3,600 seconds) has elapsed since the last claim or session initialization.
- If less than 3,600 seconds have accumulated, the claim button is disabled with a real-time countdown timer.

### 9.3 Tab-Switching Compensation
When switching browser tabs, the engine calculates the duration away via document visibility timestamps. Accumulated XP is distributed across all active party members immediately upon returning.

---

## 10. Multi-Banner Summon Altar

The Contract Altar features multi-banner rate-ups with permanent availability:
- **Featured Banners**:
  - Solaris Rate-Up (Light / Solar celestial affinity).
  - Primordial Sanctum (Earth / Dark behemoths).
  - Olympian Pantheon (Mythological warriors).
  - Abyssal Rift (Nether void and oceanic leviathans).
  - Standard Astral (Universal 54-spirit pool).
- **Banner Permanence**: All rate-up banners are permanently available, allowing players to target preferred spirits without artificial time pressure.
- **Bulk Contracts**: Supports 1x, 10x, and 30x multi-pulls with celebratory rare fanfare.

---

## 11. Animated Pixel Sprite Pipeline

### 11.1 Sprite Specifications
- **Format**: Lightweight vector SVG spritesheets.
- **Layout**: 384x48px sheets containing eight 48x48px frames (4 Idle, 3 Attack, 1 Hurt/Reaction).
- **Total Manifest**: 33 active spritesheet assets:
  - 9 Creature families (Feline, Canine, Avian, Bovine, Insect, Leviathan, Sun Celestial, Nether Voidbinder, Chrono Temporal).
  - 6 Enemy champions and overlords.
  - 6 Divine forged weapon archetypes.
  - 12 Greek God relics and chamber insignia.

---

## 12. Verification & Automated Test Suites

The codebase is protected by extensive automated test suites validating engine mechanics, balance curves, and UI components:
- `tests/test_game_engine.js`: 42 comprehensive tests covering contract rosters, Monte Carlo RNG, 7-Core dual attributes, 54-spirit scaling matrix, Rebirth progression, 3x3 tactical grid rules, threat aggro, defense mitigation, 1-hour idle spoils threshold, Spirit Sanctum Hub, polynomial enemy scaling, 4–6 enemy swarms on floors ending in 3 or 7, 12 weapon archetypes, Dwarven's Forge weekly quotas, 5x daily transmutation limits, Tier 4 dungeon mechanics (Overlord attendants, 25% Divine Boss Barrier, 45s Cataclysm Enrage), animated Overlord boss spritesheets, 2.5D ambient structures, and Single-Focus Constellation star-chart progression.
- `tests/test_ui_components.js`: 28 comprehensive tests validating Bestiary grid & inspection, Hall of Fame picker, Madness 3x3 tactical grid, floor navigation, trial battle arenas, bottom dock labels, Astral Realm 8-tab dock, Single-Focus Constellation selector & active star-chart stage, Dwarven's Forge animated Vulcan master & items, large-swarm 2-column grid layout, Tier 4 combat HUD with Overlords and Divine Barrier, Hephaestus and Atlas tank set declarations, 12 weapon archetypes, Supabase authentication & account management, Title screen gateway, Cloud conflict resolution modal, Contractor leveling & feature gating progression, Guided tutorial engine, Fresh account reset, and Combat Animation Engine (lunge, recoil, flinch, strike cadences).
- `tests/run_probability_tests.js`: Monte Carlo verification across 100-pull and 100-evolution iterations.

---

## 13. Combat Animation Engine & Dynamic Visual Cadence

### 13.1 Architecture & Animation Pipeline (`combatAnimator.js`)
Tactile visual feedback is coordinated via `src/render/combatAnimator.js`, bridging state events with CSS keyframe transitions:
- **`triggerSpiritAttack(slotEl)`**: Appends `.lunge-attack` to the spirit formation slot and `.attacking` to `.animated-pixel-sprite`. Cycles sprite frames 4, 5, 6, 4 with forward translation (`translateX(20px)` and `scale(1.14)`).
- **`triggerEnemyFlinch(enemySlotEl)`**: Appends `.enemy-hit-flash` to the enemy slot and `.hurt.flinching` to `.animated-pixel-sprite`. Holds Frame 7 with a bright crimson/white drop shadow (`drop-shadow(0 0 24px #ff0055)`) and backward recoil (`translateX(12px) scale(0.88)`).
- **`triggerEnemyAttack(enemySlotEl)`**: Appends `.enemy-lunge-attack` (lunges -20px left toward contractor party) and cycles attack frames.
- **`triggerSpiritFlinch(spiritSlotEl)`**: Appends `.spirit-hit-flinch` (recoils -12px left) and displays spirit hurt frame.
- **`triggerPartyStrikeExchange(container)`**: Triggers synchronized squad strike and frontline enemy flinch.

### 13.2 Discrete Combat Cadence
Auto-combat in the Madness Zone and Dungeon battles ticks on a staggered cadence (~1.1s to 1.5s per spirit) rather than silent continuous DPS, emitting:
- `combatStrike`: `{ attackerType: 'spirit' | 'enemy', spirit, enemy, targetEnemy, targetSpirit, isUltimate, zone: 'madness' | 'dungeon' }`
- `manualPartyStrike`: Emitted instantly on manual tap/click commands across all 4 combat arenas.

---

## 14. Cloud Synchronization & Supabase Authentication

### 14.1 Authentication Engine (`authService.js`)
- **Dual Mode Operation**: Supports seamless anonymous Guest mode with immediate local storage persistence and optional Supabase account registration.
- **Credential Storage**: Secure session tokens stored via Supabase client with automatic token refreshing and session restoration on page reload.
- **Safe State Reset**: User sign-out triggers a clean local wipe, ensuring zero state bleeding between accounts.

### 14.2 Cloud Save & Conflict Resolution Engine (`cloudSaveService.js`)
- **Automatic Sync**: Saves are automatically synchronized to `game_saves` table on floor clearances, summon ceremonies, and contractor level-ups.
- **Conflict Resolution Modal**: When a cloud timestamp differs from local storage upon signing in on a new device, a comparison modal is rendered displaying:
  - Save Timestamps
  - Highest Floor / Stage
  - Total Combat Power
  - Spirit Shards & Spirit Roster Count
  - Interactive "Keep Local Device Save" vs "Load Cloud Save" choices.

---

## 15. Contractor Account Progression & Feature Gating

### 15.1 Progression Schema
- **Contractor Level**: 1 to 50, requiring scaling Account EXP awarded through floor clearances, spirit evolutions, and gacha contracts:
  $$\text{Required EXP}(L) = \lfloor 100 \times L^{1.45} \rfloor$$
- **Milestone Rewards**: Shard bundles, Soul Essence, Divine Relic Reshapers, and summon tickets awarded on level thresholds.

### 15.2 Feature Gating Architecture
To ensure a smooth onboarding curve for new contractors, features unlock systematically:
- **Contractor Lv. 1**: Tutorial & Madness Floors 1–5
- **Contractor Lv. 3**: 3x3 Tactical Formation Grid
- **Contractor Lv. 5**: Artifact Dungeons (Pantheon Trials)
- **Contractor Lv. 8**: The Divine Forge (Weapon Trials)
- **Contractor Lv. 10**: Astral Realm & Zodiac Constellations
- **Contractor Lv. 15**: Dwarven's Forge & Relic Transmutation

---

## 16. Modular Architecture & Refactoring Roadmap (Completed in `ref/overhaulv0.1`)

All 5 phases of modular decomposition have been completed with 100% test coverage and zero breaking changes:

| Phase | Target Monolith | Completed Status | Final Modular Structure |
| :---: | :--- | :---: | :--- |
| **Phase 1** | `gameState.js` (5,342 &rarr; 187 lines) | ✅ Completed | Decomposed into 9 modules in `src/state/modules/`: `contractorModule.js`, `formationModule.js`, `summonModule.js`, `equipmentModule.js`, `spiritModule.js`, `combatModule.js`, `dungeonModule.js`, `astralModule.js`, `persistenceModule.js`. |
| **Phase 2** | `style.css` (9,553 &rarr; 22 lines) | ✅ Completed | Decomposed into `src/styles/`: `tokens.css`, `base.css`, `combat.css`, `modals.css`, and `views/` (`madness.css`, `vault.css`, `astral.css`, `sanctum.css`, `profile.css`). |
| **Phase 3** | `modals.js` (1,956 &rarr; 6 lines) | ✅ Completed | Decomposed into `src/ui/modals/`: `modalBase.js`, `offlineModal.js`, `ceremonyModal.js`, `bestiaryModal.js`, `equipmentModal.js`, `spiritModal.js`, and `index.js`. |
| **Phase 4** | `mysticalView.js` (1,627 &rarr; 223 lines) | ✅ Completed | Decomposed into `src/ui/views/astral/`: `zodiacTab.js`, `expeditionsTab.js`, `dwarvenForgeTab.js`, `transmuteTab.js`, `blessingsTab.js`, `energyTab.js`, `sanctuaryTab.js`. |
| **Phase 5** | `spiritsData.js` (2,241 &rarr; 5 lines) | ✅ Completed | Decomposed into `src/data/spirits/`: `elementsAndRoles.js`, `formationMatrix.js`, `speciesCatalog.js`, `progressionConfig.js`, `scalingProfiles.js`, `ultimatesCatalog.js`. |

---

## 17. HyperFeature v0.4 Polish, Economy Overhaul & Developer Tooling

### 17.1 Singapore (UTC+8) Time-Boundary Engine
All daily and weekly reset systems operate strictly on the Singapore (UTC+8) time zone to maintain deterministic synchronization regardless of client local time:
- **Daily Reset**: 00:00 SGT (UTC+8). Tracked via key generation `getSingaporeDayKey()` producing format `YYYY-MM-DD-SGT`. Resets:
  - Daily Shard Exchange (starts clean at `0/10`).
  - Dwarven's Forge daily transmutation counter (0/5).
- **Weekly Reset**: 00:00 SGT (UTC+8) every Sunday. Tracked via `getSingaporeWeekKey()` producing format `YYYY-Www-SGT`. Resets:
  - Weekly purchase caps on Divine Scripture (3/3) and Relic Reshapers (12/12).

### 17.2 Purified Soul Essence Economy & Summon Costs
Purified Soul Essence (✨) serves as the primary currency for contract summoning:
- **Summon Pricing**:
  - **1x Summon**: 1 Purified Soul Essence.
  - **10x Summon**: 10 Purified Soul Essence.
  - **30x Bulk Summon**: 25 Purified Soul Essence (bulk discount saving 5).
- **Daily Shard Exchange**:
  - Conversion rate: **500 Spirit Shards : 1 Purified Soul Essence**.
  - Daily limit: 10 exchanges per day, strictly enforced and reset at 00:00 UTC+8.
- **Bestiary Discovery & Milestones**:
  - Discovering any new spirit species awards an immediate **+50 Spirit Shards** bounty.
  - Reaching Bestiary completion milestones (10%, 25%, 50%, 75%, 100%) awards **Purified Soul Essence**.
- **Boss & Idle Drops**:
  - Madness Zone floor bosses drop Purified Soul Essence at guaranteed milestones.
  - Offline progression earns Purified Soul Essence at balanced diminishing rates.

### 17.3 Evolution & Ascension Gating Rules
- **Early Exact Duplicate Ascension**: Contractors may ascend spirits immediately using exact duplicate copies of the same species at any Contractor Level.
- **Pre-Evolution Ascension**: Using a pre-evolved base species to ascend a higher-tier evolution is locked until **Contractor Level 16 (Spirit Rebirth)**.

### 17.4 Gated Progression & Starter Equipment
- **Madness 2X Combat Speed**: Locked prior to Floor 10. Unlocks upon clearing Floor 10, actively doubling combat tick cadence.
- **Starter Equipment Grant**: New contractors begin with 0 starter equipment. Upon ascending to **Contractor Level 3** (unlocking Pantheon Trials), the game automatically grants:
  - 1x Spectral Blade (Weapon)
  - 2x Hades Relics (Headgear & Armor)

### 17.5 Screen-Wide UI & Navigation Overhaul
- **Generous Spacing & Padding**: Enhanced breathing room across Level Up Celebration modal (widescreen card with 24px padding), Offline modal, Party formation, Vault, and Bestiary.
- **Carousel Dropdowns & Slide Pagers**:
  - **Pantheon Trials**: Dropdown chamber selector + animated `< Prev` / `Next >` carousel pagers.
  - **The Divine Forge**: Dropdown forge chamber selector + animated pagers.
  - **Astral Realm**: Dropdown realm area selector + animated `< Prev` / `Next >` sliding pagers.
- **Borderless Hall of Fame**: Pedestals present spirits without box borders, featuring floating sprites, rarity tags, spirit names, and elemental emblems.
- **Celestial Summoning Animation**: Full runic vortex animation sequence with counter-rotating celestial circles, core flare, and a persistent "Skip Animation" checkbox (`localStorage['spirit_skip_summon_anim']`).
- **Contextual Area Unlock Tutorials**: Automatic guided modals featuring the Cat Spirit Familiar mascot guide triggered the first time a player opens any newly unlocked feature (Formation, Trials, Forge, Bestiary, Astral Realm, Rebirth).

### 17.6 Developer / Admin Account & Cheat Console
- **Credentials**:
  - **Email**: `admin@email.com`
  - **Password**: `x@DM1N`
- **Access Gating**:
  - Gated via `authService.isAdmin()` and `devCheatMethods.isDevAuthorized()`. All cheat methods verify authorization before mutating state.
- **Dev Console Interface**:
  - Accessible via the glowing **`⚡ DEV`** header button (only visible to `admin@email.com`) or keyboard shortcuts **`~`** (tilde) / **`F2`**.
  - **Command Bar**:
    - `floor <n>` / `skip <n>`: Jump to any floor.
    - `levelup <n>` / `maxlevel`: Instant contractor level up with feature unlocks.
    - `purified <n>`: Boost Purified Soul Essence.
    - `shards <n>`, `soul <n>`, `gods <n>`, `energy <n>`, `scriptures <n>`, `reshapers <n>`.
    - `rich` / `boostall`: Max out all currencies simultaneously.
    - `maxspirits`: Max all active party spirits to Lv. 100 ★5.
    - `unlockall`: Unlock all features, bestiary entries, and currencies.
    - `godmode`: Complete god mode activation.
  - **Quick Buttons & Custom Dropdown**: One-click boost buttons for all currencies and customizable amount inputs.
- **Supabase Account Provisioning**:
  - Standalone SQL script: `supabase/migrations/20261017_create_dev_admin_account.sql`.
  - Automated verification script: `scripts/push_dev_account.js`.


