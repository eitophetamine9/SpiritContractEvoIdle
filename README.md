# Spirit Contract Evo | Idle

> **A mobile-first, dark fantasy Idle RPG built with vanilla JavaScript, Pixi.js 2.5D viewports, and reactive state management.**

[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Pixi.js](https://img.shields.io/badge/Pixi.js-8.x-E72264?style=for-the-badge&logo=webgl&logoColor=white)](https://pixijs.com/)
[![GSAP](https://img.shields.io/badge/GSAP-3.x-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com/gsap/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#production-build--pwa-preview)
[![Architecture](https://img.shields.io/badge/Architecture-Reactive%20Pub%2FSub-blueviolet?style=for-the-badge)](#technology-stack)
[![Tests](https://img.shields.io/badge/Tests-21%20Passed-2ED573?style=for-the-badge)](#running-test-suites)

---

## What to Expect

- **Tactical Idle Progression**: Your equipped spirits meditate and gain experience in real time, whether you are actively battling or away from the game.
- **RNG-Driven Evolution Branches**: Every spirit species has multiple evolutionary branches. When a spirit reaches its level cap, its evolution ceremony rolls against weighted probability tables for rare and high-tier ascensions.
- **Spirit Ascension System (★1 to ★7)**: Duplicate spirit copies can be ascended up to ★7 using Astral Essences, granting stacking +12% stat bonuses per tier (up to +84%) along with high-impact milestone perks (+15 starting MP, +20% ultimate DMG, +10% Crit Rate, +25% Crit DMG, and golden card borders).
- **Celestial Constellations (Zodiac Trees)**: Spend 🔮 Astral Essences to permanently illuminate star nodes in Draco, Phoenix, and Pegasus constellations, boosting offense, defenses, energy capacity, and essence yields.
- **Astral Expeditions & Transmutation**: Dispatch idle spirits into cosmic fissures for passive resource foraging with +25% elemental synergy bonuses, and utilize the anti-oversaturation Transmutation Circle to convert excess shards into pure Astral Essence.
- **Bulk Annul & Bulk Dismantle**: Batch-manage your card collection in the Divine Vault with one-click filtering (Commons, Uncommons, 3★/4★ stars) to bulk-annul spirits or bulk-dismantle relics and weapons for Spirit Shards and Essences of the Gods, protected by active-party and favorite locking.
- **Isometric Combat Arena**: Staggered allied party formations face off against corrupted beasts with real-time health bars, damage popups, dynamic attack lunges, and adjustable battle speeds.
- **Tower Biome Climbs**: Progress through over 100 floors spanning distinct environments, from mystical swamps and frozen crags to dark gothic castles, before entering looping enchanted tiers.
- **Bestiary Discovery Compendium**: Inspired by classic bestiary grids, track every discovered spirit species, inspect their lore, and uncover mystery silhouettes as you expand your collection.
- **Hall of Fame & Contractor Records**: Immortalize your most powerful or cherished spirits on showcase pedestals with custom nicknames and power ratings.

---

## Technology Stack

- **Core Engine & Architecture**: Vanilla JavaScript (ES2022+ Modules) built upon an asynchronous, reactive EventEmitter state machine (`GameStateManager`) with zero external runtime framework overhead.
- **2.5D Graphics & Viewport Rendering**:
  - **Pixi.js (v8.x)**: Powers real-time 2.5D isometric viewports with WebGL hardware acceleration, dynamic atmospheric layers, elemental particle emitters, floating holographic altars, and staggered combat shadows.
  - **GSAP (GreenSock Animation Platform)**: Procedural combat tweens, ultimate impact shockwaves, screen shakes, and floating combat text physics.
  - **HTML5 Canvas & 3D CSS**: Smooth isometric perspective grids and multi-depth visual layering.
- **Styling & Design System**:
  - **Vanilla CSS**: Custom dark fantasy design tokens (`style.css`), Terraria-inspired bestiary frames, and `.index-filter-scroll` glowing emerald scrollbars (`#27ae60`).
  - **TailwindCSS**: Glassmorphic UI containers (`backdrop-blur`), high-density responsive grids, and flexible layouts.
- **Audio Engine**: Web Audio API & HTML5 Audio (`audioManager.js`) delivering zero-latency procedural SFX triggers, multi-channel BGM crossfading, user-gesture autoplay compliance, and persisted volume preferences.
- **Build & Development Tooling**: Vite with PWA plugin (`vite-plugin-pwa`) supporting offline caching, instant Hot Module Replacement (HMR), and lightweight tree-shaken bundles.
- **Storage & Offline Engine**: Local persistence with auto-saving every 15s, import/export backup tooling, and offline progress simulation capped at 24 hours.

---

## Getting Started & Local Setup

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm, pnpm, or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/eitophetamine9/SpiritContractEvoIdle.git
cd SpiritContractEvoIdle

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Once started, navigate to http://localhost:5173 in your browser. Mobile viewport simulation (e.g., iPhone or Pixel dimensions in Developer Tools) is recommended for optimal mobile-first presentation.

### Production Build & PWA Preview

```bash
# Build the production bundle
npm run build

# Preview the production build locally
npm run preview
```

### Running Test Suites

```bash
# Run all core engine, balance, and UI component tests
npm test

# Run individual test suites
node tests/test_game_engine.js
node tests/test_ui_components.js

# Run probability verification tests (100 pulls and 100 evolutions)
npm run test:prob
```

---

## Current Working Features

### 1. Contract Altar & Multi-Banner Summoning
- **Multi-Banner Carousel**: Cycle across Solaris Rate-Up, Primordial Sanctum, Olympian Pantheon, and Standard Astral banners.
- **Bulk Contracts**: Pull 1x, 10x, or 30x contracts simultaneously with rare pull animations.
- **Summoner Level & Milestone Tracks**: Earn Summon XP with every pull to unlock tiered reward milestones (shards, god essences, and astral elixirs).

### 2. Active Party & AFK Training
- **5-Slot Formation**: Equip up to 5 spirits from your vault to fight together and share training experience.
- **24-Hour Offline Engine**: Offline gains capped at 24 hours with balanced diminishing return curves, rewarding active play while preventing progression breaks.
- **Elemental Affinities**: 6-element matrix (Fire, Water, Earth, Wind, Light, Dark) with damage advantages and party elemental resonance bonuses.
- **Evolution Ceremony**: Weighted branching evolutions at level caps with real-time badge alerts.

### 3. Madness Zone & Biome Tower
- **2.5D Isometric Viewport**: Pixi.js WebGL canvas rendering dynamic biome environments, atmospheric weather, and particle effects.
- **Wave-Based Encounters**: 5 waves per floor with corrupted enemies, elite champions, and floor overlord bosses.
- **Dynamic Floor Progression**: Defeating the wave 5 boss dynamically clears the floor; previous floors are permanently free to replay.
- **Anti-Skip Protection**: Enforces legitimate progression—higher floors cannot be unlocked without defeating previous floor bosses.
- **Tactical Speed**: Toggle between 1X and 2X combat speeds.

### 4. The Divine Vault (TCG Card Collection)
- **3 Distinct Sections**: Dedicated tabs for ⛩️ Spirits, 🔱 Relics, and ⚔️ Weapons presented in a card collection aesthetic.
- **Custom Filter Sliders**: Identical `.index-filter-scroll` sliders matching the Bestiary Index with emerald glowing scrollbars, mouse-wheel panning, and scroll retention.
- **Bulk Annulment**: Multi-select mode with checkmark badges (`✓`), Commons/Uncommons presets, and a "Select All (Filtered)" batch action.
- **Safety & Customization**: Star favorite locking prevents accidental releases; in-line spirit renaming customizes cards on the fly.

### 5. Terraria-Style Spirit Bestiary Index
- **Compact Tile Grid**: Numbered tiles (#001 to #047) with rarity borders.
- **Mystery Silhouettes**: Undiscovered creatures remain masked until contracted or evolved.
- **Inspect Modal**: Click any tile to inspect full creature art, base statistics, lore, and discoverable evolution trees.
- **Omnipresent Navigation**: Dedicated tab on the 8-column bottom dock, top header, and vault view.

### 6. Relic System (3★-6★), Substats & Ascension
- **Seven Equipment Sockets**: 1 Weapon and 6 Relics (Headgear, Totem, Ring, Necklace, Orb, Charm).
- **Relic Star Tiers**: 3★ through 6★ star ratings rolling 1 to 4 randomized substats (Crit Chance, Crit Damage, ATK%, HP%, Speed, Flat Stats).
- **Enhancement & Ascension**: Upgrade relics up to +15 and ascend maxed 5★ relics into glowing 6★ relics using Essences of the Gods.
- **Eight Olympian God Sets**: Complete 2-piece and 4-piece set bonuses for Hades, Zeus, Poseidon, Hermes, Ares, Apollo, Athena, and Artemis.

### 7. The Pantheon Trials (Artifact Dungeon)
- **8 Deity Chambers**: Dedicated Olympian chambers across 4 difficulty tiers featuring 3-wave encounters (Sentinels, Guardians, and Olympian God Avatar Bosses).
- **Loot Yields**: Targeted god relics, spirit shards, and god essences.

### 8. The Divine Forge (Weapon Dungeon)
- **Six Weapon Chambers**: Dedicated forge instances for Blades, Bows, Staves, Claws, Daggers, and Mallets.
- **Four Difficulty Tiers**: Apprentice, Artisan, Master, and Celestial forges with 3-wave battles dropping specialized weapons.

### 9. The Sanctuary of the Gods & Astral Realm Expansion
- **Primary Astral Currencies**: The Astral Realm runs entirely on **🔮 Astral Essences** and **💠 Essences of the Gods**—zero regular shards required for Sanctum upgrades, energy expansion, or elixirs.
- **Essence Dungeon (Sanctuary of the Gods)**: 4 chambers (Olympian Nexus, Titan Depths, Celestial Core, Primordial Abyss) across 4 tiers with 2.5D Arena Viewport battles yielding guaranteed 🔮 and 💠 drops.
- **Celestial Constellations (Zodiac Trees)**: Spend 🔮 Astral Essences to permanently unlock nodes in Draco (ATK/Crit/Ult), Phoenix (HP/Shield/Mitigation), and Pegasus (Speed/Energy/Loot) constellation trees.
- **Astral Expeditions (Idle Spirit Dispatch)**: Dispatch non-party idle spirits into Starlight Fissure (2h), Nebula Abyss (6h), and Primordial Void (12h) for passive resource harvesting with a +25% elemental synergy bonus.
- **Astral Transmutation Circle (Anti-Oversaturation)**: Convert 1,000 Spirit Shards + 10 Essences of the Gods into 1 Astral Essence, with daily escalating costs (+250 shards/use per day, resetting at midnight) to prevent economic hyper-inflation.
- **Astral EXP Potions**: Lesser, Grand, and Divine Ambrosia elixirs for rapid spirit power leveling.
- **Timed Combat Blessings**: 1-hour divine blessings from Olympian deities for high-impact party buffs.

### 10. Spirit Ascension System (★1 to ★7)
- **Duplicate Spirit Consumption**: Consume duplicate copies of the same species + 🔮 Astral Essences to ascend spirits from ★1 to ★7.
- **Stacking Stat Multipliers**: Each ascension star grants a permanent +12% base stat bonus (up to +84% at ★7).
- **Combat Milestone Perks**:
  - **★3**: +15 Starting Mana Points (instant early ultimate readiness).
  - **★5**: +20% Ultimate Skill Damage amplification.
  - **★7 (MAX)**: +10% Critical Hit Chance, +25% Critical Hit Damage, and an illustrious Golden Card Frame.
- **Evolution Preservation**: Ascension tiers and perk bonuses persist across all evolutionary transformations.

### 11. Unified 8-Column Mobile Navigation Dock
- **Single-Line High-Density Dock**: `Hero`, `Madness`, `Trials`, `Forge`, `Realm`, `Summon`, `Vault`, and `Index` built specifically for mobile screens with zero horizontal overflow or wrapping.
- **Manual Battle Engagement Controls**: Standby and Engaged combat states prevent screen-forcing or hijacking when viewing other menus.

### 12. Integrated Audio Engine
- **Background Music**: Dynamic looping atmospheric themes for Astral Sanctum, Madness Tower combat, Pantheon Trials, and The Divine Forge.
- **Tactile Sound Effects**: Impact transients, critical blow booms, ultimate release bursts, level-up chimes, and victory fanfares.
- **Autoplay & Unmute Compliance**: Reliable one-tap unmuting, AudioContext resumption, and synchronized audio controls across combat and top navigation bars.

---

## Future Roadmap

The following features and enhancements are planned for upcoming releases:

- **Guild Raids & World Bosses**: Cooperative community milestones facing off against colossal primordial beasts.
- **Custom Pixel Art Asset Packs**: Upgrading CSS placeholder frames to full animated pixel sprites for all 37 spirit species and enemies.
- **Cloud Account Synchronization**: Optional cloud save synchronization across multiple mobile and desktop devices.


---

## Project Structure

```
SpiritContractEvoIdle/
|-- docs/                        # In-depth system and technical documentation
|   `-- DOCUMENTATION.md
|-- tests/                       # Automated test suites
|   |-- test_game_engine.js      # Core math, economy, and balance tests
|   |-- run_probability_tests.js # 100-pull and 100-evolution verification
|   `-- test_ui_components.js    # UI components and Bestiary inspect modal tests
|-- public/                      # Vite static assets (favicon, theme backdrops)
|-- src/                         # All application source code
|   |-- data/                    # Species catalog, evolution tables, biomes
|   |-- state/                   # Reactive state manager and offline engine
|   `-- ui/                      # Components, modals, and screen views
|-- index.html                   # Mobile-first shell and entry point
|-- package.json                 # Project dependencies and npm scripts
|-- vite.config.js               # Build & PWA configuration
|-- .gitignore                   # Git ignore patterns
`-- README.md                    # High-level overview and setup guide
```

---

## Detailed Documentation

For complete mathematical formulations, economy balancing sheets, full evolution horizon tables, and internal state machine schemas, consult the system documentation:

- [System & Technical Documentation](docs/DOCUMENTATION.md)
