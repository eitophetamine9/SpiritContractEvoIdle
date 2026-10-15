import { SPIRIT_SPECIES } from './speciesCatalog.js';
import { RARITIES } from './elementsAndRoles.js';

export const CONTRACT_POOLS_BY_RARITY = {
  COMMON: ['cat_spirit', 'dog_spirit', 'chicken_spirit', 'caterpillar_spirit'],
  UNCOMMON: ['bull_spirit', 'lizard_spirit', 'python_spirit', 'baphomet_initiate', 'chrono_hatchling', 'dawn_herald'],
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
 * Astral Contract (Purchased with Soul Essence) - 0% Commons!
 */
export const ASTRAL_CONTRACT_RARITY_ODDS = [
  { rarity: 'UNCOMMON', weight: 65.0 },
  { rarity: 'RARE', weight: 25.0 },
  { rarity: 'EPIC', weight: 8.0 },
  { rarity: 'LEGENDARY', weight: 2.0 }
];

export function rollAstralContractSpirit() {
  const roll = Math.random() * 100;
  let running = 0;
  let selectedRarity = 'UNCOMMON';

  for (const entry of ASTRAL_CONTRACT_RARITY_ODDS) {
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
 * Multi-Banner Summon Altars (Dedicated Rate-Up Hero Banners)
 * Modeled after high-tier hero summon parchments
 */
export const BANNER_CONFIGS = [
  {
    id: 'solaris_rate_up',
    name: 'The Lion Sin of Pride Solaris Rate-Up',
    shortName: 'Solaris Rate-Up',
    subtitle: 'Instantly summon a Mythical Hero: Solaris, Lion Sin of Pride!',
    characterName: 'Solaris, Lion Sin of Pride',
    characterTitle: 'Sun Deity of Unyielding Splendor',
    featuredSpeciesId: 'solaris_lion_pride',
    featuredRelic: {
      id: 'relic_crown_zeus',
      name: 'Crown of Celestial Splendor',
      slot: 'headgear',
      god: 'Zeus Divine Set',
      color: '#f1c40f'
    },
    element: 'LIGHT',
    icon: '🦁',
    bannerTheme: 'solar',
    accentColor: '#f39c12',
    bgGradient: 'radial-gradient(circle at 50% 35%, rgba(243, 156, 18, 0.45) 0%, rgba(20, 10, 5, 0.95) 75%)',
    timerText: 'Permanent',
    odds: [
      { rarity: 'COMMON', weight: 54.0 },
      { rarity: 'UNCOMMON', weight: 28.0 },
      { rarity: 'RARE', weight: 11.0 },
      { rarity: 'EPIC', weight: 4.5 },
      { rarity: 'LEGENDARY', weight: 1.7 },
      { rarity: 'MYTHICAL', weight: 0.8 }
    ],
    rateUpBonus: {
      MYTHICAL: 'solaris_lion_pride',
      rateUpShare: 0.60
    }
  },
  {
    id: 'gelda_rate_up',
    name: 'Thousand Ashes Gelda Rate-Up',
    shortName: 'Gelda Rate-Up',
    subtitle: 'Instantly summon a Mythical Hero: Gelda, Thousand Ashes Empress!',
    characterName: 'Gelda, Thousand Ashes Empress',
    characterTitle: 'Empress of Blood & Cinder',
    featuredSpeciesId: 'gelda_ashes_empress',
    featuredRelic: {
      id: 'relic_blade_ares',
      name: 'Sanguine Cinder Warblade',
      slot: 'weapon',
      god: 'Ares War Set',
      color: '#e74c3c'
    },
    element: 'DARK',
    icon: '👑',
    bannerTheme: 'void',
    accentColor: '#9b59b6',
    bgGradient: 'radial-gradient(circle at 50% 35%, rgba(155, 89, 182, 0.45) 0%, rgba(15, 5, 25, 0.95) 75%)',
    timerText: 'Permanent',
    odds: [
      { rarity: 'COMMON', weight: 54.0 },
      { rarity: 'UNCOMMON', weight: 28.0 },
      { rarity: 'RARE', weight: 11.0 },
      { rarity: 'EPIC', weight: 4.5 },
      { rarity: 'LEGENDARY', weight: 1.7 },
      { rarity: 'MYTHICAL', weight: 0.8 }
    ],
    rateUpBonus: {
      MYTHICAL: 'gelda_ashes_empress',
      rateUpShare: 0.60
    }
  },
  {
    id: 'celestial_conflux',
    name: 'Celestial Conflux: Astraea & Leviathan',
    shortName: 'Celestial Conflux',
    subtitle: 'High rate-up for Astraea Valkyrie and Leviathan Behemoth!',
    characterName: 'Astraea & Leviathan',
    characterTitle: 'Guardians of Heaven & Deepsea',
    featuredSpeciesId: 'astraea_valkyrie',
    featuredRelic: {
      id: 'relic_trident_poseidon',
      name: 'Abyssal Trident of the Deep',
      slot: 'necklace',
      god: 'Poseidon Ocean Set',
      color: '#00d2d3'
    },
    element: 'WIND',
    icon: '🪽',
    bannerTheme: 'astral',
    accentColor: '#00d2d3',
    bgGradient: 'radial-gradient(circle at 50% 35%, rgba(0, 210, 211, 0.35) 0%, rgba(5, 15, 25, 0.95) 75%)',
    timerText: 'Permanent',
    odds: [
      { rarity: 'COMMON', weight: 54.0 },
      { rarity: 'UNCOMMON', weight: 27.5 },
      { rarity: 'RARE', weight: 11.0 },
      { rarity: 'EPIC', weight: 4.5 },
      { rarity: 'LEGENDARY', weight: 2.5 },
      { rarity: 'MYTHICAL', weight: 0.5 }
    ],
    rateUpBonus: {
      LEGENDARY: ['astraea_valkyrie', 'leviathan_behemoth'],
      rateUpShare: 0.65
    }
  },
  {
    id: 'standard',
    name: 'Holy Knight Astral Altar',
    shortName: 'Standard Altar',
    subtitle: 'Permanent Astral Summon Altar with all wandering spirits.',
    characterName: 'Wandering Astral Spirits',
    characterTitle: 'Permanent Pantheon Pool',
    featuredSpeciesId: 'fallen_warrior_spirit',
    featuredRelic: {
      id: 'relic_orb_arcane',
      name: 'Orb of Eternal Constellations',
      slot: 'orb',
      god: 'Apollo Solar Set',
      color: '#ffd152'
    },
    element: 'LIGHT',
    icon: '⚔️',
    bannerTheme: 'standard',
    accentColor: '#f1c40f',
    bgGradient: 'radial-gradient(circle at 50% 35%, rgba(241, 196, 15, 0.3) 0%, rgba(20, 20, 20, 0.95) 75%)',
    timerText: 'Permanent',
    odds: [
      { rarity: 'COMMON', weight: 56.0 },
      { rarity: 'UNCOMMON', weight: 27.0 },
      { rarity: 'RARE', weight: 11.0 },
      { rarity: 'EPIC', weight: 4.5 },
      { rarity: 'LEGENDARY', weight: 1.2 },
      { rarity: 'MYTHICAL', weight: 0.3 }
    ]
  },
  {
    id: 'abyssal_rift',
    name: 'Abyssal Nether Rift: Baphomet Rate-Up',
    shortName: 'Abyssal Rift',
    subtitle: 'High rate-up for Nether Voidbinder Baphomet & Bow of Artemis!',
    characterName: 'Baphomet, Voidbinder Archdemon',
    characterTitle: 'Sovereign of the Nether Void',
    featuredSpeciesId: 'baphomet_voidbinder',
    featuredRelic: {
      id: 'relic_bow_artemis',
      name: 'Moonlight Bow of Artemis',
      slot: 'weapon',
      god: 'Artemis Hunt Set',
      color: '#a29bfe'
    },
    element: 'DARK',
    icon: '🔮',
    bannerTheme: 'abyssal',
    accentColor: '#9b59b6',
    bgGradient: 'radial-gradient(circle at 50% 35%, rgba(142, 68, 173, 0.45) 0%, rgba(10, 5, 20, 0.95) 75%)',
    timerText: 'Permanent',
    odds: [
      { rarity: 'COMMON', weight: 52.0 },
      { rarity: 'UNCOMMON', weight: 28.0 },
      { rarity: 'RARE', weight: 12.0 },
      { rarity: 'EPIC', weight: 5.0 },
      { rarity: 'LEGENDARY', weight: 2.2 },
      { rarity: 'MYTHICAL', weight: 0.8 }
    ],
    rateUpBonus: {
      EPIC: 'baphomet_voidbinder',
      LEGENDARY: 'baphomet_archdemon_lord',
      rateUpShare: 0.65
    }
  }
];

export function rollBannerContractSpirit(bannerId = 'solaris_rate_up') {
  const banner = BANNER_CONFIGS.find(b => b.id === bannerId) || BANNER_CONFIGS[0];
  const roll = Math.random() * 100;
  let running = 0;
  let selectedRarity = 'COMMON';

  for (const entry of banner.odds) {
    running += entry.weight;
    if (roll <= running) {
      selectedRarity = entry.rarity;
      break;
    }
  }

  // Rate-up check
  if (banner.rateUpBonus && banner.rateUpBonus[selectedRarity]) {
    const rateUpTarget = banner.rateUpBonus[selectedRarity];
    if (Math.random() < banner.rateUpBonus.rateUpShare) {
      if (Array.isArray(rateUpTarget)) {
        const picked = rateUpTarget[Math.floor(Math.random() * rateUpTarget.length)];
        return { speciesId: picked, rarityTier: selectedRarity };
      } else {
        return { speciesId: rateUpTarget, rarityTier: selectedRarity };
      }
    }
  }

  // Standard pool for rarity
  const pool = CONTRACT_POOLS_BY_RARITY[selectedRarity];
  if (pool && pool.length > 0) {
    const speciesId = pool[Math.floor(Math.random() * pool.length)];
    return { speciesId, rarityTier: selectedRarity };
  }

  if (selectedRarity === 'MYTHICAL') {
    const mythicals = ['solaris_lion_pride', 'gelda_ashes_empress'];
    return { speciesId: mythicals[Math.floor(Math.random() * mythicals.length)], rarityTier: 'MYTHICAL' };
  }

  return { speciesId: 'fallen_warrior_spirit', rarityTier: 'LEGENDARY' };
}

/**
 * Formula to calculate XP required to level up
 */
export function getXpRequiredForLevel(level) {
  return Math.floor(30 * Math.pow(level, 1.65));
}

/**
 * Spirit Rebirth & Ascension Configuration (⭐1 through ⭐7 / Rebirth I to VII)
 * Consumes duplicate copies of the same spirit species + Soul Essences (🔮)
 */
export const REBIRTH_CONFIG = [
  {
    tier: 1,
    name: 'Rebirth I: Soul Awakening',
    duplicates: 1,
    astralCost: 1,
    bonusPercent: 12,
    perk: 'Astral Resonance (+12% all stats)',
    uniqueAddition: 'Starts combat with +20 MP. Primary scaling stat boosted by +5%.'
  },
  {
    tier: 2,
    name: 'Rebirth II: Cadence Mastery',
    duplicates: 1,
    astralCost: 1,
    bonusPercent: 24,
    perk: 'Cosmic Attunement (+24% all stats)',
    uniqueAddition: 'Attack speed +10%. Skill and Taunt cooldowns reduced by 15%.'
  },
  {
    tier: 3,
    name: 'Rebirth III: Skill Surge',
    duplicates: 2,
    astralCost: 2,
    bonusPercent: 36,
    perk: 'Cosmic Surge (+36% all stats)',
    uniqueAddition: 'Ultimate Burst base damage/heal multiplier increased by +25%.'
  },
  {
    tier: 4,
    name: 'Rebirth IV: Resonance Harmony',
    duplicates: 2,
    astralCost: 3,
    bonusPercent: 48,
    perk: 'Celestial Fortitude (+48% all stats)',
    uniqueAddition: 'Team elemental resonance stat buffs amplified by +50%.'
  },
  {
    tier: 5,
    name: 'Rebirth V: Apex Potency',
    duplicates: 3,
    astralCost: 4,
    bonusPercent: 60,
    perk: 'Astral Amp (+60% all stats)',
    uniqueAddition: 'Primary scaling attribute ratio increased by +20%.'
  },
  {
    tier: 6,
    name: 'Rebirth VI: Zenith Archetype',
    duplicates: 3,
    astralCost: 5,
    bonusPercent: 72,
    perk: 'Supernal Aura (+72% all stats)',
    uniqueAddition: 'Signature Role Awakening (Healer auto-revives 1 ally; Tank reflects 40% dmg; DPS +35% execute; Sub-DPS armor shred; Support +15 MP).'
  },
  {
    tier: 7,
    name: 'Rebirth VII: Transcendent Soul',
    duplicates: 4,
    astralCost: 8,
    bonusPercent: 84,
    perk: 'Ascended Divinity (+84% stats, +10% Crit, +30% Crit DMG, Golden Frame)',
    uniqueAddition: 'Cosmic Supremacy: +10% CRIT Rate, +30% CRIT DMG, +20% Max Energy, Golden Celestial Border.'
  }
];

export const ASCENSION_CONFIG = REBIRTH_CONFIG;
