/**
 * Spirit Species Catalog, Evolution RNG Trees, and Base Stats
 * Configured with the updated Spirit roster and multi-tier Evolution paths.
 */

export const ELEMENTS = {
  FIRE: { name: 'Fire', color: '#ff4438', bg: '#2b0d0c', border: '#ff6b5c', symbol: '🔥' },
  WATER: { name: 'Water', color: '#00c3ff', bg: '#081f2f', border: '#42d4ff', symbol: '💧' },
  EARTH: { name: 'Earth', color: '#2ecc71', bg: '#0b2413', border: '#58d68d', symbol: '🌿' },
  WIND: { name: 'Wind', color: '#e0c93c', bg: '#29250a', border: '#f7dc6f', symbol: '🌪️' },
  DARK: { name: 'Void', color: '#b342ff', bg: '#210c30', border: '#c766ff', symbol: '🔮' },
  LIGHT: { name: 'Solar', color: '#ffb300', bg: '#2f2005', border: '#ffc107', symbol: '✨' },
};

export const RARITIES = {
  COMMON: { name: 'Common', multiplier: 1.0, color: '#bdc3c7' },
  UNCOMMON: { name: 'Uncommon', multiplier: 1.18, color: '#2ecc71' },
  RARE: { name: 'Rare', multiplier: 1.35, color: '#3498db' },
  EPIC: { name: 'Epic', multiplier: 1.6, color: '#9b59b6' },
  LEGENDARY: { name: 'Legendary', multiplier: 2.1, color: '#f39c12' },
  MYTHICAL: { name: 'Mythical', multiplier: 2.8, color: '#e74c3c' },
  TRANSCENDENT: { name: 'Transcendent', multiplier: 4.0, color: '#00ffff' }
};

export const SPIRIT_SPECIES = {
  // ==========================================
  // COMMON BASE SPIRITS (Cap Level 10)
  // ==========================================
  'cat_spirit': {
    id: 'cat_spirit',
    name: 'Cat Spirit',
    baseRarity: 'COMMON',
    element: 'WIND',
    tier: 1,
    levelCap: 10,
    basePower: 12,
    growthRate: 0.18,
    avatarEmoji: '🐱',
    accentColor: '#e0c93c',
    description: 'A nimble feline spirit known for swift claws and cunning instincts.',
    evolutions: [
      { targetSpeciesId: 'furious_cat', weight: 80, variant: 'Furious Cat', rarity: 'UNCOMMON', powerMult: 2.2 },
      { targetSpeciesId: 'elemental_cat', weight: 20, variant: 'Elemental Cat (EPIC)', rarity: 'EPIC', powerMult: 3.5 }
    ]
  },
  'dog_spirit': {
    id: 'dog_spirit',
    name: 'Dog Spirit',
    baseRarity: 'COMMON',
    element: 'EARTH',
    tier: 1,
    levelCap: 10,
    basePower: 13,
    growthRate: 0.18,
    avatarEmoji: '🐶',
    accentColor: '#2ecc71',
    description: 'A loyal hound spirit radiating steady defensive aura and vitality.',
    evolutions: [
      { targetSpeciesId: 'vitality_dog', weight: 80, variant: 'Vitality Dog', rarity: 'UNCOMMON', powerMult: 2.2 },
      { targetSpeciesId: 'guardian_dog', weight: 20, variant: 'Guardian Dog (EPIC)', rarity: 'EPIC', powerMult: 3.5 }
    ]
  },
  'chicken_spirit': {
    id: 'chicken_spirit',
    name: 'Chicken Spirit',
    baseRarity: 'COMMON',
    element: 'FIRE',
    tier: 1,
    levelCap: 10,
    basePower: 11,
    growthRate: 0.17,
    avatarEmoji: '🐔',
    accentColor: '#ff4438',
    description: 'A feisty avian spirit with explosive pecks and unexpected courage.',
    evolutions: [
      { targetSpeciesId: 'battle_chicken', weight: 90, variant: 'Battle Chicken', rarity: 'UNCOMMON', powerMult: 2.2 },
      { targetSpeciesId: 'dino_genus_chicken', weight: 10, variant: 'Dino Genus Chicken (LEGENDARY)', rarity: 'LEGENDARY', powerMult: 5.5 }
    ]
  },
  'caterpillar_spirit': {
    id: 'caterpillar_spirit',
    name: 'Caterpillar Spirit',
    baseRarity: 'COMMON',
    element: 'EARTH',
    tier: 1,
    levelCap: 10,
    basePower: 10,
    growthRate: 0.16,
    avatarEmoji: '🐛',
    accentColor: '#2ecc71',
    description: 'A humble chrysalis spirit patiently incubating ancient lepidopteran secrets.',
    evolutions: [
      { targetSpeciesId: 'elegant_butterfly', weight: 90, variant: 'Elegant Butterfly', rarity: 'UNCOMMON', powerMult: 2.2 },
      { targetSpeciesId: 'mystical_butterfly', weight: 10, variant: 'Mystical Butterfly (LEGENDARY)', rarity: 'LEGENDARY', powerMult: 5.5 }
    ]
  },

  // ==========================================
  // UNCOMMON BASE SPIRITS (Cap Level 15)
  // ==========================================
  'bull_spirit': {
    id: 'bull_spirit',
    name: 'Bull Spirit',
    baseRarity: 'UNCOMMON',
    element: 'EARTH',
    tier: 1,
    levelCap: 15,
    basePower: 20,
    growthRate: 0.20,
    avatarEmoji: '🐂',
    accentColor: '#27ae60',
    description: 'A thunderous bovine spirit capable of trampling corrupted frontlines.',
    evolutions: [
      { targetSpeciesId: 'raging_bull', weight: 80, variant: 'Raging Bull', rarity: 'UNCOMMON', powerMult: 2.0 },
      { targetSpeciesId: 'elemental_bull', weight: 15, variant: 'Elemental Bull (EPIC)', rarity: 'EPIC', powerMult: 3.2 },
      { targetSpeciesId: 'minotaur', weight: 5, variant: 'Minotaur (MYTHICAL)', rarity: 'MYTHICAL', powerMult: 6.2 }
    ]
  },
  'lizard_spirit': {
    id: 'lizard_spirit',
    name: 'Lizard Spirit',
    baseRarity: 'UNCOMMON',
    element: 'WATER',
    tier: 1,
    levelCap: 15,
    basePower: 19,
    growthRate: 0.20,
    avatarEmoji: '🦎',
    accentColor: '#00c3ff',
    description: 'A venom-coated reptilian that regenerates vigor under intense pressure.',
    evolutions: [
      { targetSpeciesId: 'multi_venom_lizard', weight: 80, variant: 'Multi-venom Lizard', rarity: 'UNCOMMON', powerMult: 2.0 },
      { targetSpeciesId: 'komodo_dragon', weight: 15, variant: 'Komodo Dragon (EPIC)', rarity: 'EPIC', powerMult: 3.2 },
      { targetSpeciesId: 'drake', weight: 5, variant: 'Drake (MYTHICAL)', rarity: 'MYTHICAL', powerMult: 6.2 }
    ]
  },
  'python_spirit': {
    id: 'python_spirit',
    name: 'Python Spirit',
    baseRarity: 'UNCOMMON',
    element: 'DARK',
    tier: 1,
    levelCap: 15,
    basePower: 21,
    growthRate: 0.21,
    avatarEmoji: '🐍',
    accentColor: '#b342ff',
    description: 'A constricting serpent wrapped in shadowy miasma that chokes out madness.',
    evolutions: [
      { targetSpeciesId: 'highlord_python', weight: 80, variant: 'HighLord Python', rarity: 'UNCOMMON', powerMult: 2.0 },
      { targetSpeciesId: 'huge_albino_anaconda', weight: 15, variant: 'Huge Albino Anaconda (EPIC)', rarity: 'EPIC', powerMult: 3.2 },
      { targetSpeciesId: 'wyrm', weight: 5, variant: 'Wyrm (MYTHICAL)', rarity: 'MYTHICAL', powerMult: 6.2 }
    ]
  },

  // ==========================================
  // RARE BASE SPIRITS (Cap Level 20)
  // ==========================================
  'shark_spirit': {
    id: 'shark_spirit',
    name: 'Shark Spirit',
    baseRarity: 'RARE',
    element: 'WATER',
    tier: 1,
    levelCap: 20,
    basePower: 32,
    growthRate: 0.24,
    avatarEmoji: '🦈',
    accentColor: '#00b4d8',
    description: 'An apex oceanic predator smelling corruption from across dimensions.',
    evolutions: [
      { targetSpeciesId: 'great_white_shark', weight: 90, variant: 'Great White Shark (EPIC)', rarity: 'EPIC', powerMult: 2.5 },
      { targetSpeciesId: 'megalodon', weight: 8, variant: 'Megalodon (MYTHICAL)', rarity: 'MYTHICAL', powerMult: 4.8 },
      { targetSpeciesId: 'cosmic_oceanic_devourer', weight: 2, variant: 'Cosmic Oceanic Devourer (TRANSCENDENT)', rarity: 'TRANSCENDENT', powerMult: 8.5 }
    ]
  },
  'bear_spirit': {
    id: 'bear_spirit',
    name: 'Bear Spirit',
    baseRarity: 'RARE',
    element: 'EARTH',
    tier: 1,
    levelCap: 20,
    basePower: 34,
    growthRate: 0.24,
    avatarEmoji: '🐻',
    accentColor: '#2e7d32',
    description: 'A colossal ursine guardian whose roars fracture reality and crush foes.',
    evolutions: [
      { targetSpeciesId: 'highlord_bear', weight: 90, variant: 'HighLord Bear (EPIC)', rarity: 'EPIC', powerMult: 2.5 },
      { targetSpeciesId: 'bear_of_dreams', weight: 8, variant: 'Bear of Dreams (MYTHICAL)', rarity: 'MYTHICAL', powerMult: 4.8 },
      { targetSpeciesId: 'cosmic_bear_ursalite', weight: 2, variant: 'Cosmic Bear Ursalite (TRANSCENDENT)', rarity: 'TRANSCENDENT', powerMult: 8.5 }
    ]
  },

  // ==========================================
  // EPIC BASE SPIRITS (Cap Level 25)
  // ==========================================
  'wisp_spirit': {
    id: 'wisp_spirit',
    name: 'Wisp Spirit',
    baseRarity: 'EPIC',
    element: 'LIGHT',
    tier: 1,
    levelCap: 25,
    basePower: 50,
    growthRate: 0.28,
    avatarEmoji: '✨',
    accentColor: '#ffb300',
    description: 'A concentrated orb of stellar luminescence holding royal astral genetics.',
    evolutions: [
      { targetSpeciesId: 'high_elf', weight: 100, variant: 'High Elf (MYTHICAL)', rarity: 'MYTHICAL', powerMult: 3.5 }
    ]
  },

  // ==========================================
  // LEGENDARY BASE SPIRITS (Cap Level 30)
  // ==========================================
  'fallen_warrior_spirit': {
    id: 'fallen_warrior_spirit',
    name: 'Fallen Warrior Spirit',
    baseRarity: 'LEGENDARY',
    element: 'DARK',
    tier: 1,
    levelCap: 30,
    basePower: 95,
    growthRate: 0.35,
    avatarEmoji: '⚔️',
    accentColor: '#b342ff',
    description: 'The indomitable soul of an ancient war god wandering the purgatorial rim.',
    evolutions: [
      { targetSpeciesId: 'sovereign_warrior', weight: 99, variant: 'Sovereign Warrior (MYTHICAL)', rarity: 'MYTHICAL', powerMult: 2.2 },
      { targetSpeciesId: 'dreadlord_warrior', weight: 1, variant: 'DreadLord Warrior (TRANSCENDENT)', rarity: 'TRANSCENDENT', powerMult: 4.5 }
    ]
  },

  // =========================================================================
  // EVOLVED FORMS (Tier 2 / Ascended)
  // =========================================================================

  // Cat Evolutions
  'furious_cat': {
    id: 'furious_cat',
    name: 'Furious Cat',
    baseRarity: 'UNCOMMON',
    element: 'WIND',
    tier: 2,
    levelCap: 35,
    basePower: 32,
    growthRate: 0.24,
    avatarEmoji: '😼',
    accentColor: '#f1c40f',
    description: 'Strikes in relentless flurries faster than corrupted eyes can follow.',
    evolutions: []
  },
  'elemental_cat': {
    id: 'elemental_cat',
    name: 'Elemental Cat',
    baseRarity: 'EPIC',
    element: 'LIGHT',
    tier: 2,
    levelCap: 40,
    basePower: 58,
    growthRate: 0.30,
    avatarEmoji: '✨🐱',
    accentColor: '#ffa502',
    description: 'Channels atmospheric elemental currents into devastating shockwaves.',
    evolutions: []
  },

  // Dog Evolutions
  'vitality_dog': {
    id: 'vitality_dog',
    name: 'Vitality Dog',
    baseRarity: 'UNCOMMON',
    element: 'EARTH',
    tier: 2,
    levelCap: 35,
    basePower: 33,
    growthRate: 0.24,
    avatarEmoji: '🐕',
    accentColor: '#2ecc71',
    description: 'Imbued with boundless vitality that bolsters the entire party line.',
    evolutions: []
  },
  'guardian_dog': {
    id: 'guardian_dog',
    name: 'Guardian Dog',
    baseRarity: 'EPIC',
    element: 'LIGHT',
    tier: 2,
    levelCap: 40,
    basePower: 60,
    growthRate: 0.30,
    avatarEmoji: '🛡️🐶',
    accentColor: '#ffc107',
    description: 'An angelic watch-dog surrounded by impenetrable divine barriers.',
    evolutions: []
  },

  // Chicken Evolutions
  'battle_chicken': {
    id: 'battle_chicken',
    name: 'Battle Chicken',
    baseRarity: 'UNCOMMON',
    element: 'FIRE',
    tier: 2,
    levelCap: 35,
    basePower: 34,
    growthRate: 0.24,
    avatarEmoji: '🐓',
    accentColor: '#ff5722',
    description: 'Spurs hardened with igneous crystal, striking down corruption without fear.',
    evolutions: []
  },
  'dino_genus_chicken': {
    id: 'dino_genus_chicken',
    name: 'Dino Genus Chicken',
    baseRarity: 'LEGENDARY',
    element: 'FIRE',
    tier: 2,
    levelCap: 45,
    basePower: 115,
    growthRate: 0.38,
    avatarEmoji: '🦖',
    accentColor: '#ff1744',
    description: 'Awakened prehistoric apex DNA; its primordial shriek levels mountains.',
    evolutions: []
  },

  // Caterpillar Evolutions
  'elegant_butterfly': {
    id: 'elegant_butterfly',
    name: 'Elegant Butterfly',
    baseRarity: 'UNCOMMON',
    element: 'WIND',
    tier: 2,
    levelCap: 35,
    basePower: 33,
    growthRate: 0.24,
    avatarEmoji: '🦋',
    accentColor: '#26de81',
    description: 'Spreads soothing pollen scales that disorient hostile madness.',
    evolutions: []
  },
  'mystical_butterfly': {
    id: 'mystical_butterfly',
    name: 'Mystical Butterfly',
    baseRarity: 'LEGENDARY',
    element: 'LIGHT',
    tier: 2,
    levelCap: 45,
    basePower: 118,
    growthRate: 0.38,
    avatarEmoji: '✨🦋',
    accentColor: '#fd9644',
    description: 'Weaves the fabric of fate with prismatic dream dust wings.',
    evolutions: []
  },

  // Bull Evolutions
  'raging_bull': {
    id: 'raging_bull',
    name: 'Raging Bull',
    baseRarity: 'UNCOMMON',
    element: 'FIRE',
    tier: 2,
    levelCap: 35,
    basePower: 45,
    growthRate: 0.26,
    avatarEmoji: '🐂🔥',
    accentColor: '#e74c3c',
    description: 'Leaves trails of flaming devastation with every unstoppable charge.',
    evolutions: []
  },
  'elemental_bull': {
    id: 'elemental_bull',
    name: 'Elemental Bull',
    baseRarity: 'EPIC',
    element: 'EARTH',
    tier: 2,
    levelCap: 40,
    basePower: 70,
    growthRate: 0.32,
    avatarEmoji: '⚡🐂',
    accentColor: '#27ae60',
    description: 'Synthesizes tectonic tremors into pulverizing subterranean shockwaves.',
    evolutions: []
  },
  'minotaur': {
    id: 'minotaur',
    name: 'Minotaur',
    baseRarity: 'MYTHICAL',
    element: 'FIRE',
    tier: 2,
    levelCap: 50,
    basePower: 145,
    growthRate: 0.42,
    avatarEmoji: '👹🪓',
    accentColor: '#c0392b',
    description: 'Legendary labyrinth overlord wielding an axe forged in magma rifts.',
    evolutions: []
  },

  // Lizard Evolutions
  'multi_venom_lizard': {
    id: 'multi_venom_lizard',
    name: 'Multi-venom Lizard',
    baseRarity: 'UNCOMMON',
    element: 'EARTH',
    tier: 2,
    levelCap: 35,
    basePower: 44,
    growthRate: 0.26,
    avatarEmoji: '🦎🧪',
    accentColor: '#20bf6b',
    description: 'Exudes lethal corrosive secretions that melt corrupted armor.',
    evolutions: []
  },
  'komodo_dragon': {
    id: 'komodo_dragon',
    name: 'Komodo Dragon',
    baseRarity: 'EPIC',
    element: 'WATER',
    tier: 2,
    levelCap: 40,
    basePower: 68,
    growthRate: 0.32,
    avatarEmoji: '🐊',
    accentColor: '#0fb9b1',
    description: 'An armored behemoth whose bite infects corrupted minds with weakness.',
    evolutions: []
  },
  'drake': {
    id: 'drake',
    name: 'Drake',
    baseRarity: 'MYTHICAL',
    element: 'FIRE',
    tier: 2,
    levelCap: 50,
    basePower: 148,
    growthRate: 0.42,
    avatarEmoji: '🐉',
    accentColor: '#eb3b5a',
    description: 'A winged draconic titan dominating the battlefield with hellfire breath.',
    evolutions: []
  },

  // Python Evolutions
  'highlord_python': {
    id: 'highlord_python',
    name: 'HighLord Python',
    baseRarity: 'UNCOMMON',
    element: 'DARK',
    tier: 2,
    levelCap: 35,
    basePower: 45,
    growthRate: 0.26,
    avatarEmoji: '🐍👑',
    accentColor: '#8854d0',
    description: 'Crowns itself ruler of shadows, crushing foes in shadowy coils.',
    evolutions: []
  },
  'huge_albino_anaconda': {
    id: 'huge_albino_anaconda',
    name: 'Huge Albino Anaconda',
    baseRarity: 'EPIC',
    element: 'LIGHT',
    tier: 2,
    levelCap: 40,
    basePower: 70,
    growthRate: 0.32,
    avatarEmoji: '🤍🐍',
    accentColor: '#a55eea',
    description: 'Glistening white scales reflect darkness while suffocating corrupted horrors.',
    evolutions: []
  },
  'wyrm': {
    id: 'wyrm',
    name: 'Wyrm',
    baseRarity: 'MYTHICAL',
    element: 'DARK',
    tier: 2,
    levelCap: 50,
    basePower: 150,
    growthRate: 0.43,
    avatarEmoji: '🐲',
    accentColor: '#3867d6',
    description: 'An ancient limbless dragon that burrows through dimensional fault lines.',
    evolutions: []
  },

  // Shark Evolutions
  'great_white_shark': {
    id: 'great_white_shark',
    name: 'Great White Shark',
    baseRarity: 'EPIC',
    element: 'WATER',
    tier: 2,
    levelCap: 40,
    basePower: 82,
    growthRate: 0.34,
    avatarEmoji: '🦈⚡',
    accentColor: '#4b7bec',
    description: 'Serrated astral jaws tear through corrupted nightmares with zero effort.',
    evolutions: []
  },
  'megalodon': {
    id: 'megalodon',
    name: 'Megalodon',
    baseRarity: 'MYTHICAL',
    element: 'WATER',
    tier: 2,
    levelCap: 50,
    basePower: 165,
    growthRate: 0.44,
    avatarEmoji: '🦈🌊',
    accentColor: '#0984e3',
    description: 'Prehistoric behemoth of the Mariana rifts; swallowed islands in ancient eras.',
    evolutions: []
  },
  'cosmic_oceanic_devourer': {
    id: 'cosmic_oceanic_devourer',
    name: 'Cosmic Oceanic Devourer',
    baseRarity: 'TRANSCENDENT',
    element: 'WATER',
    tier: 2,
    levelCap: 60,
    basePower: 295,
    growthRate: 0.55,
    avatarEmoji: '🌌🦈',
    accentColor: '#00ffff',
    description: 'A transcendent cosmic entity that swims between galaxies and devours supernovas.',
    evolutions: []
  },

  // Bear Evolutions
  'highlord_bear': {
    id: 'highlord_bear',
    name: 'HighLord Bear',
    baseRarity: 'EPIC',
    element: 'EARTH',
    tier: 2,
    levelCap: 40,
    basePower: 84,
    growthRate: 0.34,
    avatarEmoji: '🐻👑',
    accentColor: '#fa8231',
    description: 'Commands the deep forests and mountains with an iron paw.',
    evolutions: []
  },
  'bear_of_dreams': {
    id: 'bear_of_dreams',
    name: 'Bear of Dreams',
    baseRarity: 'MYTHICAL',
    element: 'LIGHT',
    tier: 2,
    levelCap: 50,
    basePower: 168,
    growthRate: 0.44,
    avatarEmoji: '🐻✨',
    accentColor: '#f7b731',
    description: 'Woven from celestial stardust; its gentle aura shields reality from collapsing.',
    evolutions: []
  },
  'cosmic_bear_ursalite': {
    id: 'cosmic_bear_ursalite',
    name: 'Cosmic Bear Ursalite',
    baseRarity: 'TRANSCENDENT',
    element: 'EARTH',
    tier: 2,
    levelCap: 60,
    basePower: 300,
    growthRate: 0.55,
    avatarEmoji: '🌌🐻',
    accentColor: '#20bf6b',
    description: 'Embodies the celestial constellation Ursa Major; crushing worlds in its paw.',
    evolutions: []
  },

  // Wisp Evolutions
  'high_elf': {
    id: 'high_elf',
    name: 'High Elf',
    baseRarity: 'MYTHICAL',
    element: 'LIGHT',
    tier: 2,
    levelCap: 50,
    basePower: 185,
    growthRate: 0.46,
    avatarEmoji: '🧝‍♂️',
    accentColor: '#fed330',
    description: 'Archon of pure solar nobility, channeling stellar magic to banish darkness.',
    evolutions: []
  },

  // Fallen Warrior Evolutions
  'sovereign_warrior': {
    id: 'sovereign_warrior',
    name: 'Sovereign Warrior',
    baseRarity: 'MYTHICAL',
    element: 'DARK',
    tier: 2,
    levelCap: 50,
    basePower: 210,
    growthRate: 0.48,
    avatarEmoji: '👑⚔️',
    accentColor: '#8854d0',
    description: 'Restores his ancient empire from the grave, wielding blades of pure eclipse.',
    evolutions: []
  },
  'dreadlord_warrior': {
    id: 'dreadlord_warrior',
    name: 'DreadLord Warrior',
    baseRarity: 'TRANSCENDENT',
    element: 'DARK',
    tier: 2,
    levelCap: 60,
    basePower: 360,
    growthRate: 0.60,
    avatarEmoji: '💀⚔️',
    accentColor: '#fc5c65',
    description: 'The supreme conqueror of all madness and realities; all creation kneels before his blade.',
    evolutions: []
  }
};

/**
 * Base Species available through the Spirit Contract altar grouped by rarity
 */
export const CONTRACT_POOLS_BY_RARITY = {
  COMMON: ['cat_spirit', 'dog_spirit', 'chicken_spirit', 'caterpillar_spirit'],
  UNCOMMON: ['bull_spirit', 'lizard_spirit', 'python_spirit'],
  RARE: ['shark_spirit', 'bear_spirit'],
  EPIC: ['wisp_spirit'],
  LEGENDARY: ['fallen_warrior_spirit']
};

export const CONTRACT_RARITY_ODDS = [
  { rarity: 'COMMON', weight: 60.0 },
  { rarity: 'UNCOMMON', weight: 26.0 },
  { rarity: 'RARE', weight: 10.0 },
  { rarity: 'EPIC', weight: 3.5 },
  { rarity: 'LEGENDARY', weight: 0.5 }
];

export function rollContractSpirit() {
  const roll = Math.random() * 100;
  let running = 0;
  let selectedRarity = 'COMMON';

  for (const entry of CONTRACT_RARITY_ODDS) {
    running += entry.weight;
    if (roll <= running) {
      selectedRarity = entry.rarity;
      break;
    }
  }

  const pool = CONTRACT_POOLS_BY_RARITY[selectedRarity];
  const speciesId = pool[Math.floor(Math.random() * pool.length)];
  return { speciesId, rarityTier: selectedRarity };
}

/**
 * Formula to calculate XP required to level up
 */
export function getXpRequiredForLevel(level) {
  return Math.floor(30 * Math.pow(level, 1.65));
}

/**
 * Formula to calculate Spirit combat power
 */
export function calculateSpiritPower(species, level, rarityName) {
  const effectiveRarity = rarityName ? rarityName.toUpperCase() : (species.baseRarity || 'COMMON');
  const rarityObj = RARITIES[effectiveRarity] || RARITIES.COMMON;
  const lvlMult = 1 + (level - 1) * species.growthRate;
  return Math.max(1, Math.round(species.basePower * lvlMult * rarityObj.multiplier));
}
