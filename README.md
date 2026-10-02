# Spirit Contract Evo | Idle

> A mobile-first, dark fantasy Idle RPG where you bind ancient Spirits, train them AFK in the astral plane, evolve them through weighted RNG tables, and pit your party against corrupted horrors in the Madness Zone.

---

## Game Core Loop & Mechanics

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Contract Spirit │ ───► │  AFK Training   │ ───► │  RNG Evolution  │
│ (Astral Altar)  │      │ (5-Slot Party)  │      │ (80% Com / 20% R)│
└─────────────────┘      └─────────────────┘      └─────────────────┘
        ▲                                                  │
        │             ┌─────────────────┐                  │
        └──────────── │  Madness Zone   │ ◄────────────────┘
       (Shards Loot)  │ (Click-to-Fight)│ (Power Surge)
                      └─────────────────┘
```

1. **The Contract Altar**: Spend Spirit Shards harvested from battle to contract random Level 1 Spirits across 6 primordial elements (*Fire, Water, Earth, Wind, Void, Solar*).
2. **The 5-Slot Active Party**: Players can collect an unlimited number of Spirits in their **Vault**, but can only equip a maximum of **5 Spirits** to their Active Party to train and fight simultaneously.
3. **AFK Training & Idle Engine**: Equipped Spirits continuously gain XP over time using a smooth `requestAnimationFrame` loop. When returning to the app, the engine retroactively awards offline XP and farm loot based on `last_saved` timestamp.
4. **80/20 RNG Evolution**: When a Spirit reaches its Level Cap (Tier 1 cap: Lv. 10; Tier 2 cap: Lv. 25), it unlocks the **Evolution Ceremony**, rolling against a weighted RNG table (80% Common Variant, 20% Rare Variant) for a massive power surge.
5. **The Madness Zone**: Pit your party against corrupted beasts. Features both continuous math comparison DPS (Party Total Power vs. Enemy Power) and an interactive **"Attack Enemy"** tap action using your party's combined power.

---

## Mathematical Models & Scaling

### 1. Spirit Contract Roster & Evolution Paths

| Rarity | Base Spirit | Level Cap | Evolution Paths & Odds |
| :--- | :--- | :---: | :--- |
| **Common** | Cat Spirit | Lv. 10 | 80% Furious Cat, 20% Elemental Cat (EPIC) |
| **Common** | Dog Spirit | Lv. 10 | 80% Vitality Dog, 20% Guardian Dog (EPIC) |
| **Common** | Chicken Spirit | Lv. 10 | 90% Battle Chicken, 10% Dino Genus Chicken (LEGENDARY) |
| **Common** | Caterpillar Spirit | Lv. 10 | 90% Elegant Butterfly, 10% Mystical Butterfly (LEGENDARY) |
| **Uncommon** | Bull Spirit | Lv. 15 | 80% Raging Bull, 15% Elemental Bull (EPIC), 5% Minotaur (MYTHICAL) |
| **Uncommon** | Lizard Spirit | Lv. 15 | 80% Multi-venom Lizard, 15% Komodo Dragon (EPIC), 5% Drake (MYTHICAL) |
| **Uncommon** | Python Spirit | Lv. 15 | 80% HighLord Python, 15% Huge Albino Anaconda (EPIC), 5% Wyrm (MYTHICAL) |
| **Rare** | Shark Spirit | Lv. 20 | 90% Great White Shark (EPIC), 8% Megalodon (MYTHICAL), 2% Cosmic Oceanic Devourer (TRANSCENDENT) |
| **Rare** | Bear Spirit | Lv. 20 | 90% HighLord Bear (EPIC), 8% Bear of Dreams (MYTHICAL), 2% Cosmic Bear Ursalite (TRANSCENDENT) |
| **Epic** | Wisp Spirit | Lv. 25 | 100% High Elf (MYTHICAL) |
| **Legendary** | Fallen Warrior Spirit | Lv. 30 | 99% Sovereign Warrior (MYTHICAL), 1% DreadLord Warrior (TRANSCENDENT) |

### 2. Madness Zone Entry & Energy System
- **Time-Gated Floor Unlocking**: Tackling a new, locked floor costs **10 Energy**.
- **Permanent Free Repeats**: Once a floor is unlocked, it can be replayed and farmed indefinitely for **0 Energy**.
- **Energy Regeneration**: Accumulates at 1 Energy per 30 seconds (even while offline, up to maximum 60 Energy).

### 3. Combat Power Formula
$$\text{Power} = \lfloor \text{BasePower} \times (1 + (L - 1) \times \text{GrowthRate}) \times \text{RarityMultiplier} \rfloor$$
- Multipliers: Common (1.0x), Uncommon (1.18x), Rare (1.35x), Epic (1.6x), Legendary (2.1x), Mythical (2.8x), Transcendent (4.0x).

### 4. AFK Training & Offline Progression
$$\text{XP/sec} = 3.0 \times \left(1 + 0.08 \times (\text{Highest Zone Cleared} - 1)\right)$$
$$\text{Offline XP} = \min(\Delta t, 604800) \times \text{XP/sec}$$
- On launch, the offline report itemizes earned XP, level-ups, evolution alerts, harvested shards, and offline Energy restored.

### 5. Madness Zone Combat Scaling
$$\text{Enemy Power} = \lfloor 28 \times 1.22^{\text{Zone} - 1} \times (1 + 0.15 \times (\text{Wave} - 1)) \times \text{BossMultiplier} \rfloor$$
- **Power Ratio**: $\text{Party Power} / \text{Enemy Power}$
  - $\ge 1.25$: **Dominating** (rapid clears)
  - $0.85 - 1.24$: **Even Match**
  - $< 0.85$: **Underpowered** (grind previous zones with *Farm Mode*)

---

## Asset Integration: Manual Pixel Art Drop-In

The UI features brightly colored, distinct CSS placeholder boxes with pixelated borders for all Spirits, Enemies, and UI buttons.

To drop in your own manual pixel art sprites:

```html
<!-- Inside each Spirit / Enemy frame -->
<div class="pixel-art-slot" data-art-target="spirit-{speciesId}">
  <!-- Simply insert your image: -->
  <img class="pixel-art" src="/sprites/ignis_wisp.png" alt="Ignis Wisp" />
</div>
```

The stylesheet (`src/style.css`) automatically applies:
```css
.pixel-art-slot img.pixel-art {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```
All sprites cleanly scale and fit into their elemental neon frames without blurring.

---

## Mobile-First UI Constraints

- **Viewport**: Mobile-first layout container (max 480px, responsive, zero horizontal scrolling).
- **Strict Touch Standard**: Zero `:hover` states to prevent mobile sticky states. Replaced with snappy, tactile `:active` tap feedback (`transform: scale(0.95)`).
- **Minimum Touch Targets**: Every button is at least **44px** to **52px** tall for effortless single-hand thumb reach.
- **5-Tab Navigation**:
  - **Madness**: Stage progression, click-to-fight enemy, power gauge, and party line.
  - **Party (5)**: 5 active training slots, XP progress bars, and glowing Evolve triggers.
  - **Contract**: Astral summon circle (1x and 10x contracts).
  - **Vault**: Full collection storage, element filters, equip, and shard dispel.
  - **Stats**: Lifetime records, manual force save, and reset options.

---

## Architecture & State Management

- **Central Game State Manager** ([`src/state/gameState.js`](src/state/gameState.js)):
  - Reactive pub/sub event system (`subscribe`/`emit`).
  - Auto-saves to `localStorage` every 5 seconds, on page blur (`visibilitychange`), and before window close (`beforeunload`).
- **Core Loop**: Driven by `requestAnimationFrame` for buttery-smooth 60fps UI ticks and accurate 1-second AFK XP pulses.

---

## Project Structure

```
SpiritContractEvoIdle/
├── index.html                   # Mobile-first shell, meta tags, and root layouts
├── package.json                 # Vite + vite-plugin-pwa setup
├── vite.config.js               # PWA Service Worker & manifest config
├── test_game_engine.js          # Math & RNG unit/integration verification
├── public/
│   ├── favicon.svg              # App icon
│   └── manifest.json            # PWA manifest
└── src/
    ├── main.js                  # App bootstrap, tab router & event subscriptions
    ├── style.css                # Mobile-first design system & pixel-box aesthetics
    ├── data/
    │   ├── spiritsData.js       # Species catalog, RNG evolution trees & formulas
    │   └── madnessZoneData.js   # Corrupted enemy generation & zone scaling
    ├── state/
    │   └── gameState.js         # Game State Manager, save/load, offline math
    └── ui/
        ├── components/
        │   ├── pixelBox.js      # CSS pixel art frames & elemental themes
        │   └── modals.js        # Offline Welcome, Evolution Ceremony, Summons
        └── views/
            ├── madnessView.js   # Madness Zone arena & click-to-fight
            ├── partyView.js     # 5-slot AFK Training Chamber
            ├── contractView.js  # Astral Summoning Circle
            ├── vaultView.js     # Spirit Inventory & elemental filters
            └── statsView.js     # Lifetime metrics & save controls
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Installation & Run

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

### Running Math Engine Tests

```bash
node test_game_engine.js
```
Validates the 80/20 RNG evolution distribution across 1,000 rolls, XP leveling curves, offline formulas, and zone scaling.
