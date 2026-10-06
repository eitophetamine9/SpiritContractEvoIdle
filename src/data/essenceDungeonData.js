/**
 * Sanctuary of the Gods: Dedicated Essence Farming Dungeon
 * 4 God Domain Chambers across 4 difficulty tiers to farm Essences of the Gods and Soul Essence.
 */

export const ESSENCE_CHAMBERS = [
  {
    id: 'olympian_nexus',
    name: 'Olympian Sky Nexus',
    title: 'Nexus of Heavenly Storms',
    domain: 'Sky & Thunder',
    desc: 'Surging lightning leylines where the primeval essence of Zeus and the heavens condenses.',
    icon: '⚡',
    element: 'LIGHT',
    bossName: 'Aetherial Sky Primordial',
    bossIcon: '🌩️',
    color: '#f1c40f',
    accentColor: '#ffd32a'
  },
  {
    id: 'abyssal_chasm',
    name: 'Abyssal Trench Chasm',
    title: 'Chasm of Primordial Tides',
    domain: 'Abyssal Seas',
    desc: 'Bioluminescent deepsea chasms where Poseidon’s oceanic tidal energies pool.',
    icon: '🌊',
    element: 'WATER',
    bossName: 'Leviathan Core Sentinel',
    bossIcon: '🦑',
    color: '#3498db',
    accentColor: '#00d2d3'
  },
  {
    id: 'nether_catacombs',
    name: 'Stygian Nether Catacombs',
    title: 'Catacombs of Shades',
    domain: 'Underworld & Souls',
    desc: 'Crystalline underworld tombs vibrating with dark Stygian flames and ancient soul quintessence.',
    icon: '🔱',
    element: 'DARK',
    bossName: 'Thanatos Soul Arbiter',
    bossIcon: '💀',
    color: '#8e44ad',
    accentColor: '#9b59b6'
  },
  {
    id: 'solar_acropolis',
    name: 'Solar Citadel Acropolis',
    title: 'Acropolis of Solar Radiance',
    domain: 'Sun & War',
    desc: 'Blazing golden plateau bathed in perpetual solar flare radiation and raw divine might.',
    icon: '☀️',
    element: 'FIRE',
    bossName: 'Helios Sun Colossus',
    bossIcon: '🦁',
    color: '#e67e22',
    accentColor: '#ffa801'
  }
];

export const ESSENCE_DIFFICULTY_TIERS = [
  {
    tier: 1,
    name: 'Disciple Sanctum',
    subtitle: 'Novice Awakening',
    energyCost: 10,
    minPartyPower: 2500,
    recommendedPower: 2500,
    minGodEssences: 15,
    maxGodEssences: 25,
    soulEssenceReward: 0,
    shardsReward: 120
  },
  {
    tier: 2,
    name: 'Adept Sanctum',
    subtitle: 'Resonant Crucible',
    energyCost: 12,
    minPartyPower: 10000,
    recommendedPower: 10000,
    minGodEssences: 40,
    maxGodEssences: 60,
    soulEssenceReward: 1,
    shardsReward: 250
  },
  {
    tier: 3,
    name: 'Sovereign Sanctum',
    subtitle: 'Divine Conflux',
    energyCost: 15,
    minPartyPower: 45000,
    recommendedPower: 45000,
    minGodEssences: 100,
    maxGodEssences: 140,
    soulEssenceReward: 3,
    shardsReward: 600
  },
  {
    tier: 4,
    name: 'Titan Sanctum',
    subtitle: 'Primordial Overlord',
    energyCost: 18,
    minPartyPower: 160000,
    recommendedPower: 160000,
    minGodEssences: 250,
    maxGodEssences: 350,
    soulEssenceReward: 8,
    shardsReward: 1500
  }
];

/**
 * Generates loot rewards for clearing an Essence Dungeon Chamber
 */
export function generateEssenceLoot(chamberId, tierNum = 1) {
  const chamber = ESSENCE_CHAMBERS.find(c => c.id === chamberId) || ESSENCE_CHAMBERS[0];
  const tierObj = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || ESSENCE_DIFFICULTY_TIERS[0];

  const godEssences = Math.floor(
    tierObj.minGodEssences + Math.random() * (tierObj.maxGodEssences - tierObj.minGodEssences + 1)
  );

  return {
    chamber,
    tier: tierObj,
    godEssencesGained: godEssences,
    soulEssenceGained: tierObj.soulEssenceReward,
    shardsGained: tierObj.shardsReward
  };
}
