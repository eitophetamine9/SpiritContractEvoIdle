# Spirit Contract Evo | Idle

> A mobile-first, dark fantasy Idle RPG where you bind ancient Spirits, train them AFK in the astral plane, evolve them through weighted RNG tables, and pit your party against corrupted horrors in the Madness Zone.

---

## Game Core Loop and Mechanics

```
+-----------------+      +-----------------+      +-----------------+
| Contract Spirit | ---> |  AFK Training   | ---> |  RNG Evolution  |
| (Astral Altar)  |      | (5-Slot Party)  |      | (To Transcendent)
+-----------------+      +-----------------+      +-----------------+
        ^                                                  |
        |             +-----------------+                  |
        +------------ |  Madness Zone   | <----------------+
       (Shards Loot)  | (Click-to-Fight)| (Power Surge)
                      +-----------------+
```

1. **The Contract Altar**: Spend Spirit Shards harvested from battle to contract random Level 1 Spirits across 7 distinct Rarity tiers (Common, Uncommon, Rare, Epic, Legendary, Mythical, and Transcendent).
2. **The 5-Slot Active Party**: Players can collect an unlimited number of Spirits in their **Vault**, but can equip a maximum of **5 Spirits** to their Active Party to train and fight simultaneously.
3. **AFK Training and 24-Hour Offline Engine**: Equipped Spirits continuously gain XP over time. When offline, rewards accumulate for up to **24 hours** at a balanced 20% meditation rate for XP, 25% for Shards, and capped Soul Essence (1 per 2 hours), preventing overnight progression breaks while rewarding active play.
4. **Weighted RNG Evolution**: When a Spirit reaches its Level Cap, it unlocks the **Evolution Ceremony**, rolling against weighted RNG tables for advanced branches that reach up to **Mythical** and **Transcendent** god-tier forms.
5. **The Madness Zone and Tower Biomes**: Battle through 100+ floors across distinct thematic environments:
   - Floors 1 to 10: Mystical Swamp
   - Floors 11 to 20: Mystical Winterland
   - Floors 21 to 40: Dark Castle
   - Floors 41 to 60: Abyssal Sunken Depths
   - Floors 61 to 80: Volcanic Hellfire Caldera
   - Floors 81 to 100: Celestial Primordial Sanctum
   - Floors 101+: Infinite repeating cycles prefixed with "Enchanted" (e.g. Enchanted Mystical Swamp) with heightened challenge and scaled rewards.
6. **Terraria Bestiary-Style Spirit Index**: Compact numbered tile grid (#001 through #037). Undiscovered spirits appear as darkened mystery silhouettes with locked status. Clicking any tile opens an interactive Inspect Modal revealing the sprite showcase, base stats, lore, and complete evolution branching lineage.
7. **Contractor Profile and 5-Slot Hall of Fame**: Showcase your 5 proudest spirits on grand stone pedestals with custom nicknames, power metrics, and rarity flairs. Features an interactive visual spirit picker modal (with tabs for Highest Power, Favorites, and All Vault) that completely replaces browser prompts.

---

## Unified 7-Tier Rarity System

Elements have been replaced by a streamlined, rarity-first hierarchy:

| Tier | Name | Base Multiplier | Color Token | Description |
| :--- | :--- | :---: | :---: | :--- |
| **1** | **Common** | 1.0x | `#bdc3c7` | Starter forms (Cat, Dog, Chicken, Caterpillar) |
| **2** | **Uncommon** | 1.18x | `#2ecc71` | Intermediate beasts (Bull, Lizard, Python) |
| **3** | **Rare** | 1.35x | `#3498db` | Apex predators (Shark, Bear) and rare evolutions |
| **4** | **Epic** | 1.6x | `#9b59b6` | High-tier summons (Wisp) and evolved forms |
| **5** | **Legendary** | 2.1x | `#f39c12` | Apex summons (Fallen Warrior) and master evolutions |
| **6** | **Mythical** | 2.8x | `#e74c3c` | Secret evolution outcomes with blazing ruby flare |
| **7** | **Transcendent** | 4.0x | `#00ffff` | God-tier pinnacle evolutions with prismatic cyan aura |

---

## Mathematical Models and Economy

### 1. Spirit Contract Roster and Evolution Horizons

| Base Spirit | Base Rarity | Cap | Evolution Horizons and Odds |
| :--- | :--- | :---: | :--- |
| **Cat Spirit** | Common | Lv. 10 | 80% Furious Cat (Uncommon), 20% Elemental Cat (Epic) |
| **Dog Spirit** | Common | Lv. 10 | 80% Vitality Dog (Uncommon), 20% Guardian Dog (Epic) |
| **Chicken Spirit** | Common | Lv. 10 | 90% Battle Chicken (Uncommon), 10% Dino Genus Chicken (Legendary) |
| **Caterpillar Spirit** | Common | Lv. 10 | 90% Elegant Butterfly (Uncommon), 10% Mystical Butterfly (Legendary) |
| **Bull Spirit** | Uncommon | Lv. 15 | 80% Raging Bull (Uncommon), 15% Elemental Bull (Epic), 5% Minotaur (Mythical) |
| **Lizard Spirit** | Uncommon | Lv. 15 | 80% Multi-venom Lizard (Uncommon), 15% Komodo Dragon (Epic), 5% Drake (Mythical) |
| **Python Spirit** | Uncommon | Lv. 15 | 80% HighLord Python (Uncommon), 15% Huge Albino Anaconda (Epic), 5% Wyrm (Mythical) |
| **Shark Spirit** | Rare | Lv. 20 | 90% Great White Shark (Epic), 8% Megalodon (Mythical), 2% Cosmic Oceanic Devourer (Transcendent) |
| **Bear Spirit** | Rare | Lv. 20 | 90% HighLord Bear (Epic), 8% Bear of Dreams (Mythical), 2% Cosmic Bear Ursalite (Transcendent) |
| **Wisp Spirit** | Epic | Lv. 25 | 100% High Elf (Mythical) |
| **Fallen Warrior Spirit** | Legendary | Lv. 30 | 99% Sovereign Warrior (Mythical), 1% DreadLord Warrior (Transcendent) |

### 2. Soul Essence Sanctum Shop (Rebalanced)
- **Soul Essence Currency**: Earned from defeating Floor Bosses (Wave 5) and milestone achievements.
- **Astral Contract (8 Essence)**: Guaranteed Uncommon+ summon (0% chance of Commons: 65% Uncommon, 25% Rare, 8% Epic, 2% Legendary).
- **Ancient Party EXP Elixir (10 Essence)**: Grants +500 AFK Training XP to all active party members (preventing instant level-cap skips while providing a meaningful progression boost).
- **Expand Max Energy (Scaling Cost)**: Permanently expands Max Energy by +10 (8 + purchases * 4 Essence).
- **Instant Energy Surge (3 Essence)**: Instantly restores +30 Energy to tackle locked floors.
- **Party Resonance (Scaling Cost)**: Permanently boosts all Spirits' power by +5% per tier (6 + tier * 4 Essence).

### 3. Rebalanced Shard Economy
- Normal Waves: Yield 3 to 8 Shards.
- Boss Waves: Yield 18 to 40 Shards + guaranteed 1+ Soul Essence.
- A full 5-wave clear of Floor 1 yields ~39 Shards (~2.6 full floors per 100-shard contract).
- Enemy HP and damage scale dynamically based on the current Biome and Floor.

### 4. Madness Zone Entry and Energy System
- **Locked Floor Unlocking**: Tackling a new locked floor costs **10 Energy**.
- **Permanent Free Repeats**: Once a floor is unlocked, it can be farmed indefinitely for **0 Energy**.
- **Energy Regeneration**: 1 Energy per 30 seconds (up to base 60 Energy cap, expandable via Essence).

### 5. Combat Power Formula
Power = floor(BasePower * (1 + (L - 1) * GrowthRate) * RarityMultiplier) * (1 + ResonanceTier * 0.05)

### 6. 24-Hour Offline Progression Formula
Active XP/sec = 3.0 * (1 + 0.08 * (Highest Zone Cleared - 1))
Offline XP = min(ElapsedSeconds, 86400) * (Active XP/sec * 0.20)
- Offline Shards: 25% of active farming calculation.
- Offline Soul Essence: 1 Essence per 2 hours (maximum 12 Essence per full 24-hour cycle).

---

## Tactical Isometric Battle Sequence

The combat screen features an angled isometric perspective:
- **Top Tactical HUD**: Pause, sound toggle, center VS clash banner (Contractor vs Corrupted Foe / Overlord), and **1X / 2X Battle Speed** toggle.
- **Staggered Allied Formation**: 5 active party spirits positioned on the left with grounding drop-shadows and overhead Rarity/Level badges ([RARITY] Lv.X).
- **Corrupted Enemy Vanguard**: Foes confronting the team on the right with real-time health bars and Overlord Boss flares.
- **Dynamic Floating Damage Text**: Animated bouncing damage numbers on hit (217, CRIT 480!) with tactile attack lunges and impact flashes.
- **Modular CSS Placeholders**: Standardized aspect ratio frames ready for seamless sprite image drop-ins.

---

## Vault Quality-of-Life Upgrades

- **Real-Time Search Bar**: Instantly filter spirits by custom nickname or species name.
- **Bulk Annul Contract**: Multi-selection mode with presets to "Select Unequipped Commons" and "Select Unequipped Uncommons", showing total Shards returned before confirming.
- **Custom Dark Fantasy Scrollbar**: Custom styled horizontal scrollbar (#27ae60 emerald thumb on dark translucent track) eliminating default raw browser scrollbars.
- **Direct Hall of Fame Toggle**: Quick crown button on each vault card to assign or remove spirits directly from the Hall of Fame.
- **Favorite System**: Star toggle pins spirits to the top of the vault and protects them from accidental annulment.
- **Custom Renaming**: Rename any spirit with a personalized nickname that persists across all views.
- **Rarity Filters**: Filter by Favorites and each of the 7 Rarity tiers.

---

## Streamlined UI and Navigation Architecture

- **Header Profile Button**: Placed in the top-right header for direct, one-tap access to Contractor statistics, Hall of Fame, and save data management.
- **Fixed Bottom Navigation Docks**:
  - **Main Core Dock**:
    - **Party** (left): 5 active training slots, XP progress bars, and glowing Evolve triggers.
    - **Madness** (center, prominent highlight): Stage progression, isometric combat arena, speed toggle, and click-to-fight.
    - **Contract** (right): Sacred Elder Spirit Tree summon altar and Soul Essence Sanctum shop.
    - **More** (side toggle): Clean arrow toggle opening the secondary drawer dock.
  - **Secondary Drawer Dock**:
    - **Back** (side toggle): Returns directly to the main dock.
    - **Vault**: Search, bulk annul, favorites, custom renaming, and rarity filters.
    - **Index**: Terraria Bestiary-style grid of numbered tiles (#001 to #037) with interactive inspect popups.
- **Strict Touch Standard**: Zero hover states anywhere in the interface. Interactive elements utilize tactile active state transforms (transform: scale(0.95)).
- **Minimum Touch Targets**: Every button and interactive element satisfies the mobile standard (minimum 44px height).

---

## Project Structure

```
SpiritContractEvoIdle/
|-- index.html                   # Mobile-first shell, header profile button, and dock navigation
|-- package.json                 # Vite and PWA configuration
|-- vite.config.js               # Service Worker and asset pipeline
|-- test_game_engine.js          # Core math and engine test suite
|-- run_probability_tests.js      # 100-pull and 100-evolution verification suite
|-- test_ui_components.js        # UI components and Bestiary inspect modal test suite
|-- public/
|   |-- favicon.svg              # App icon
|   |-- manifest.json            # PWA manifest
|   `-- theme/                   # Dark fantasy backdrop images
|       |-- spirit_tree.png      # Sacred Elder Spirit Tree (Contract & Altar)
|       |-- moonlit_swamp.png    # Moonlit Swamp Ruins (Combat Arena)
|       `-- gothic_spire.jpg     # Gothic Spire Crag (Boss Arena & Training)
`-- src/
    |-- main.js                  # App bootstrap, tab router, and dock visibility manager
    |-- style.css                # Mobile-first design system, custom scrollbars, and bestiary CSS
    |-- data/
    |   |-- index.js             # Data barrel export
    |   |-- spiritsData.js       # 7-tier rarity catalog, evolution trees, and formulas
    |   |-- biomesData.js        # Tower biomes (1-100+) and enchanted repeating cycles
    |   `-- madnessZoneData.js   # Biome-aware corrupted enemy generation
    |-- state/
    |   |-- index.js             # State barrel export
    |   `-- gameState.js         # Central manager, 24h offline cap, vault QoL, Hall of Fame
    `-- ui/
        |-- index.js             # UI module barrel export
        |-- components/
        |   |-- index.js         # Components barrel export
        |   |-- pixelBox.js      # Rarity-first CSS frames and unknown silhouettes
        |   `-- modals.js        # Bestiary inspect, Hall of Fame visual picker, summons
        `-- views/
            |-- index.js         # Views barrel export
            |-- madnessView.js   # Isometric combat arena with speed and damage text
            |-- partyView.js     # 5-slot AFK Training Chamber
            |-- contractView.js  # Sacred Spirit Tree and Essence Sanctum shop
            |-- vaultView.js     # Search, bulk annul, favorites, rename, and custom scrollbar
            |-- indexView.js     # Terraria Bestiary compact numbered grid (#001 to #037)
            `-- profileView.js   # Contractor card, 5-slot Hall of Fame, backup
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Installation and Run

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in browser (or mobile simulator)
# -> http://localhost:5173
```

### Build for Production (PWA)

```bash
npm run build
npm run preview
```

### Running Verification Tests

```bash
# 1. Core Engine and Balance Tests
node test_game_engine.js

# 2. Probability and Evolution Verification Tests (100 pulls & 100 evolutions)
node run_probability_tests.js

# 3. UI Components and Bestiary Grid Tests
node test_ui_components.js
```
