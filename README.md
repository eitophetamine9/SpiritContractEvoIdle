# Spirit Contract Evo | Idle

A mobile-first, dark fantasy Idle RPG built with vanilla JavaScript, modern CSS, and Vite. Players bind ancient spirits through sacred contracts, train them continuously in the astral plane, unlock branching evolutions, and challenge corrupted horrors across procedural tower biomes in the Madness Zone.

---

## What to Expect

- **Tactical Idle Progression**: Your equipped spirits meditate and gain experience in real time, whether you are actively battling or away from the game.
- **RNG-Driven Evolution Branches**: Every spirit species has multiple evolutionary branches. When a spirit reaches its level cap, its evolution ceremony rolls against weighted probability tables for rare and high-tier ascensions.
- **Isometric Combat Arena**: Staggered allied party formations face off against corrupted beasts with real-time health bars, damage popups, dynamic attack lunges, and adjustable battle speeds.
- **Tower Biome Climbs**: Progress through over 100 floors spanning distinct environments, from mystical swamps and frozen crags to dark gothic castles, before entering looping enchanted tiers.
- **Bestiary Discovery Compendium**: Inspired by classic bestiary grids, track every discovered spirit species, inspect their lore, and uncover mystery silhouettes as you expand your collection.
- **Hall of Fame & Contractor Records**: Immortalize your most powerful or cherished spirits on showcase pedestals with custom nicknames and power ratings.

---

## Technology Stack

- **Core**: Vanilla JavaScript (ES modules) with a decoupled reactive pub/sub state manager.
- **Styling**: Vanilla CSS utilizing dark fantasy design tokens, responsive viewport constraints, and custom-styled scrollbars.
- **Build & Development Tooling**: Vite with PWA plugin support (vite-plugin-pwa).
- **Storage**: Local persistence engine with automatic periodic saving and JSON backup export/import capabilities.
- **Testing**: Native Node.js test runners validating mathematical balancing, summon probability curves, and UI components.
- **Mobile Constraints**: Strict touch-first architecture (minimum 44px touch targets, zero sticky hover states, tactile active transforms).

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

### 1. Contract Altar & Summoning
- **Spirit Shard Contracts**: Harvest shards from battle to contract base spirits across multiple rarity tiers.
- **Soul Essence Astral Contracts**: Premium contracts funded by boss victories, guaranteeing higher-tier summons.
- **Sanctum Upgrades**: Rebalanced shop offering permanent party resonance, energy cap expansions, and training elixirs.

### 2. Active Party & AFK Training
- **5-Slot Formation**: Equip up to 5 spirits from your vault to fight together and share training experience.
- **24-Hour Offline Engine**: Offline gains capped at 24 hours with balanced diminishing return curves, rewarding active play while preventing overnight progression breaks.
- **Evolution Alerts**: Real-time visual badge indicators when equipped spirits reach their level cap.

### 3. Madness Zone & Biome Tower
- **Wave-Based Encounters**: 5 waves per floor with corrupted enemies, elite champions, and floor overlord bosses.
- **Energy System**: Floor unlocking costs 10 Energy; completed floors are permanently free to replay.
- **Tactical Speed**: Toggle between 1X and 2X combat speeds.
- **Biome Scaling**: Dynamic enemy power, health, and shard rewards scaling across 6 distinct environmental biomes and looping enchanted tiers.

### 4. Vault Management
- **Live Search**: Instant keyword filtering by species name or custom nickname.
- **Bulk Annulment**: Multi-select mode with quick presets to release duplicate spirits for shard refunds.
- **Favorite Locking**: Protect high-value spirits from accidental annulment.
- **Custom Nicknaming**: Personalize individual spirits across all views.
- **Custom Scrollbars**: Dark fantasy emerald-and-obsidian scrollbars replacing raw browser bars.

### 5. Terraria-Style Spirit Bestiary
- **Compact Tile Grid**: Numbered tiles (#001 to #037) with rarity borders.
- **Mystery Silhouettes**: Undiscovered creatures remain masked until contracted or evolved.
- **Inspect Modal**: Click any tile to inspect full creature art, base statistics, lore, and discoverable evolution trees.

### 6. Contractor Profile & Hall of Fame
- **Top-Right Header Access**: One-tap contractor profile button from any screen.
- **5-Slot Showcase**: Interactive visual spirit picker modal with tabs for Highest Power, Favorites, and All Vault.
- **Lifetime Statistics**: Detailed tracking of total contracts, evolutions, enemies slain, shards harvested, and offline time.
- **Save Management**: Manual save triggers, JSON backup clipboard export, and file import.

---

## Future Roadmap

The following features and enhancements are planned for upcoming releases:

- **Spirit Equipment & Relics**: Collect ancient artifacts and accessories to equip on individual spirits for stat bonuses and elemental effects.
- **Synergy Combos & Party Perks**: Specialized bonuses for fielding specific species combinations or rarity lineups.
- **Guild Raids & World Bosses**: Cooperative community milestones facing off against colossal primordial beasts.
- **Custom Pixel Art Asset Packs**: Upgrading CSS placeholder frames to full animated pixel sprites for all 37 spirit species and enemies.
- **Audio & Sound Design**: Dark fantasy ambient background tracks and tactile sound effects for combat hits, summons, and evolution ascensions.
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
