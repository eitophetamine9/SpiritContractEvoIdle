# ⛩️ Spirit Contract Evo | Idle

> A mobile-first, dark fantasy Idle RPG where you bind ancient Spirits, train them AFK in the astral plane, evolve them through weighted RNG tables, and pit your party against corrupted horrors in the Madness Zone.

---

## 🎮 Game Core Loop & Mechanics

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
5. **The Madness Zone**: Pit your party against corrupted beasts. Features both continuous math comparison DPS (Party Total Power vs. Enemy Power) and an interactive **"⚔️ Attack Enemy"** tap action using your party's combined power.

---

## 📐 Mathematical Models & Scaling

### 1. XP Progression & Level Caps
$$\text{XP}_{\text{required}}(L) = \lfloor 30 \times L^{1.65} \rfloor$$

| Tier | Classification | Level Cap | Evolution Paths |
| :--- | :--- | :---: | :--- |
| **Tier 1** | Base Spirits (*Wisp, Sprout, Pebble, etc.*) | **Lv. 10** | 80% Common Variant, 20% Rare Variant |
| **Tier 2** | Evolved Familiars (*Hound, Serpent, Drake*) | **Lv. 25** | 75-85% Apex, 15-25% Mythic / Supreme |
| **Tier 3** | Primordial Deities (*Cerberus, Leviathan*) | **Lv. 50** | Final Apex Form |

### 2. Combat Power Formula
$$\text{Power} = \lfloor \text{BasePower} \times (1 + (L - 1) \times \text{GrowthRate}) \times \text{RarityMultiplier} \rfloor$$
- **Common Variant**: $1.0\times$ multiplier
- **Rare Variant**: $1.25\times$ to $1.35\times$ multiplier + unique titles

### 3. AFK Training & Offline Progression
$$\text{XP/sec} = 3.0 \times \left(1 + 0.08 \times (\text{Highest Zone Cleared} - 1)\right)$$
$$\text{Offline XP} = \min(\Delta t, 604800) \times \text{XP/sec}$$
- On launch, if $\Delta t \ge 4\text{s}$, the **"Welcome Back, Contractor!"** modal itemizes time away, earned XP, level-ups, evolution alerts, and harvested shards.

### 4. Madness Zone Combat Scaling
$$\text{Enemy Power} = \lfloor 28 \times 1.22^{\text{Zone} - 1} \times (1 + 0.15 \times (\text{Wave} - 1)) \times \text{BossMultiplier} \rfloor$$
- **Power Ratio**: $\text{Party Power} / \text{Enemy Power}$
  - $\ge 1.25$: **Dominating** (rapid clears)
  - $0.85 - 1.24$: **Even Match**
  - $< 0.85$: **Underpowered** (grind previous zones with *Farm Mode*)

---

## 🎨 Asset Integration: Manual Pixel Art Drop-In

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

## 📱 Mobile-First UI Constraints

- **Viewport**: Mobile-first layout container (max 480px, responsive, zero horizontal scrolling).
- **Strict Touch Standard**: Zero `:hover` states to prevent mobile sticky states. Replaced with snappy, tactile `:active` tap feedback (`transform: scale(0.95)`).
- **Minimum Touch Targets**: Every button is at least **44px** to **52px** tall for effortless single-hand thumb reach.
- **5-Tab Navigation**:
  - ⚔️ **Madness**: Stage progression, click-to-fight enemy, power gauge, and party line.
  - ⛩️ **Party (5)**: 5 active training slots, XP progress bars, and glowing Evolve triggers.
  - 📜 **Contract**: Astral summon circle (1x and 10x contracts).
  - 🎒 **Vault**: Full collection storage, element filters, equip, and shard dispel.
  - ⚙️ **Stats**: Lifetime records, manual force save, and reset options.

---

## 💾 Architecture & State Management

- **Central Game State Manager** ([`src/state/gameState.js`](src/state/gameState.js)):
  - Reactive pub/sub event system (`subscribe`/`emit`).
  - Auto-saves to `localStorage` every 5 seconds, on page blur (`visibilitychange`), and before window close (`beforeunload`).
- **Core Loop**: Driven by `requestAnimationFrame` for buttery-smooth 60fps UI ticks and accurate 1-second AFK XP pulses.

---

## 📁 Project Structure

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

## 🚀 Getting Started

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
