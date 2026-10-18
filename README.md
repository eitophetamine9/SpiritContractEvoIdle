# Spirit Contract Evo | Idle

> A mobile-first, dark fantasy Idle RPG built with vanilla JavaScript (ES2022+), Pixi.js 2.5D viewports, and reactive state management.

[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Pixi.js](https://img.shields.io/badge/Pixi.js-8.x-E72264?style=flat-square&logo=webgl&logoColor=white)](https://pixijs.com/)
[![GSAP](https://img.shields.io/badge/GSAP-3.x-88CE02?style=flat-square&logo=greensock&logoColor=white)](https://greensock.com/gsap/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-5A0FC8?style=flat-square)](#quick-start)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Cloud%20Sync-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

---

## Overview

Spirit Contract Evo | Idle blends deep tactical party building with automated AFK progression. Summon mythical spirits, evolve them along branching paths, equip divine Greek God relics and forged armaments, and conquer corrupted biome towers across a 3x3 tactical grid with seamless cloud save synchronization and tactile combat animations.

---

## Core Features

- **Dynamic Combat Animation Engine**: Real-time physical attack lunges (`.lunge-attack`) and weapon swing frames synced with recoil hit-flashes (`.enemy-hit-flash`, `.spirit-hit-flinch`) and hurt frames across Madness Zone, Pantheon Trials, Divine Forge, and Sanctuary of the Gods.
- **Singapore UTC+8 Reset Engine & Purified Soul Economy**: Deterministic daily (00:00 SGT) and weekly Sunday resets; sovereign Purified Soul Essence contract summoning, 0/10 daily shard exchange, +50 Shards Bestiary discovery bounties, and compendium milestones.
- **Interactive 3-Card Sliding Carousel Engine**: Luxury sliding carousel with peek preview cards, touch swipe, and gold indicator pills across Pantheon Trials (10 Greek God Chambers), The Divine Forge (12 Weapon Dungeons), and The Astral Realm (8 Celestial Sanctums).
- **Summon Banner Overhaul & Probability Rates**: Dual showcase hero + relic pedestal with vertical creature breathing animations, plus an interactive Rates modal displaying live animated rate-up sprites, base rarity odds, and guaranteed tier shares.
- **Pure Defensive Tank Archetype & Atlas Relic Set**: Dedicated 10th Olympian Deity relic set (Celestial Pillar of Atlas) granting `+25% Max HP`, `+20% DEF`, and *Guardian Interception* aura alongside custom 8-frame animated SVG relic artifacts.
- **Contextual Area Unlock Tutorials & Celestial Summon Vortex**: Automatic guided modals featuring the Cat Spirit Familiar mascot guide upon feature unlocks, plus an interactive runic summoning vortex with persistent skip animation toggle.
- **Supabase Cloud Sync & Authentication**: Seamless cross-device gameplay. Play as a guest or create an account with email/password; automatic background cloud saves with client/cloud conflict resolution modals.
- **Contractor Account Leveling & Feature Gating**: Account progression from Level 1 to 50 with EXP curves, milestone rewards, and level-gated unlocks (e.g. 3x3 Formation at Lv. 2, Pantheon Trials & Forge at Lv. 3, Bestiary at Lv. 4, Spirit Rebirth at Lv. 16).
- **Spirit Sanctum Hub**: Dedicated portrait-first character dashboard. Features uncluttered high-level combat metrics by default, an expandable breakdown for 7-Core dual attributes and scaling formulas, and a 16-parameter inspection dossier.
- **7-Core Dual Attributes**: Every spirit calculates Base, Gear Bonus, and Percentage scalings across Max HP, ATK, DEF, CRIT Rate, CRIT DMG, Ultimate Amplification, and Mana Replenishment.
- **54-Spirit Dynamic Scaling Matrix**: Role-specific formulas for all 54 spirits in the catalog. Healers scale through HP or ATK; Tanks project shields from DEF or Max HP; DPS scale single-target or AOE damage with Crit compatibility.
- **Celestial Rebirth System (Tier 1 to 7)**: Duplicate spirit contracts unlock Rebirth tiers granting stacking +12% base stat bonuses (up to +84%) and combat milestones (bonus starting MP, ultimate damage amplification, crit upgrades, and golden borders).
- **3x3 Tactical Formation Grid**: 9-slot positioning (Frontline, Midline, Backline) enforcing role constraints, line aggro threat multipliers, tank taunt locks, and defense mitigation curves.
- **Greek God Relic Sets & Divine Forge**: 10 Olympian deity sets with 2-piece and 4-piece set bonuses, plus 12 specialized weapon classes forged in dedicated dungeons.
- **Madness Zone & Biome Tower**: 100+ floors spanning 6 distinct biomes with wave encounters, overlord bosses, 2X battle speed gated to Floor 10, and an infinite looping progression cycle.
- **Balanced Idle Economy**: Offline training capped at 24 hours with fair diminishing returns. Idle meditation requires a minimum of 1 hour to claim, rewarding deliberate check-ins. Permanent summon banners ensure equal access to featured spirits.
- **Developer & Admin Tooling**: Dedicated, secure dev console and cheat suite for authorized administrative testing, floor skipping, level scaling, and currency testing.

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm, pnpm, or yarn

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/eitophetamine9/SpiritContractEvoIdle.git
cd SpiritContractEvoIdle

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser. Mobile viewport mode in DevTools is recommended for the portrait layout.

### Production Build & Preview

```bash
# Compile optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Testing

```bash
# Run all automated tests (Core engine + UI components)
npm test

# Run core engine tests individually (52 tests passing)
node tests/test_game_engine.js

# Run UI, carousel, modal & dev console component tests
node tests/test_ui_components.js

# Run Monte Carlo RNG verification tests
npm run test:prob
```

---

## Project Structure

```
SpiritContractEvoIdle/
|-- docs/
|   `-- DOCUMENTATION.md       # Comprehensive systems, math, and balance specifications
|-- tests/
|   |-- test_game_engine.js    # Core engine, attributes, combat, and scaling unit tests (48 tests)
|   |-- test_ui_components.js  # UI rendering, modals, and combat animation tests (34 tests)
|   `-- run_probability_tests.js # Gacha and evolution probability verification
|-- public/                    # Static icons, web app manifest, audio assets
|-- src/
|   |-- audio/                 # Web Audio API engine and volume throttler
|   |-- data/                  # 54-spirit catalog, scaling matrix, equipment, dungeons
|   |-- render/                # Sprite animator, combat animator, and arena renderer
|   |-- services/              # Supabase authentication and cloud save synchronization
|   |-- state/                 # Reactive GameStateManager and offline progression engine
|   `-- ui/
|       |-- components/        # Modals, drawer controls, title gateway, tutorial engine
|       `-- views/             # Sanctum Hub, Madness Zone, Trials, Forge, Astral Realm, Vault
|-- index.html                 # Mobile-first shell and 8-tab dock navigation
|-- package.json               # Scripts and dependencies
`-- vite.config.js             # Vite build and Workbox PWA service worker setup
```

---

## Future Roadmap

- **Guild & Cooperative Raids**: Form contractor covenants, summon guild monoliths, and challenge multi-phase raid overlords with synchronized rewards.
- **PVP Arena & Asynchronous Duels**: Tactical 3x3 formation clashes against other contractors' defense rosters with ranked seasonal leaderboards.
- **Endless Abyssal Tower**: Procedurally generated infinite labyrinth with rotating elemental afflictions and exclusive mythic spoils.
- **Spirit Familiar Companions**: Passive cosmetic & tactical familiars that accompany the party, granting global auras and auto-strike perks.
- **Native Mobile Deployment**: Packaging via Capacitor / Tauri for App Store and Google Play distribution alongside the existing PWA.

---

## Documentation

For full mathematical formulas, 54-spirit scaling profiles, drop rate matrices, and technical schemas, consult the system documentation:

- [System & Technical Documentation](docs/DOCUMENTATION.md)
