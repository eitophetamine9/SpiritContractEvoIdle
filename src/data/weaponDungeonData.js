/**
 * The Divine Forge (Weapon Dungeon)
 * Dedicated chambers for forging weapons of 6 distinct archetypes:
 * Blades, Bows, Staves, Claws, Daggers, and Mallets across 4 difficulty tiers.
 */

import { WEAPON_TYPES, createWeaponInstance } from './equipmentData.js';
import { rollRarityFromWeights } from './artifactDungeonData.js';

export const FORGE_CHAMBERS = [
  {
    id: 'bladesmith_sanctum',
    weaponTypeId: 'sword',
    name: 'Bladesmith Sanctum',
    title: 'Sanctum of the Astral Blade',
    desc: 'Ancient smelting shrine where celestial spectral blades are folded in starfire.',
    icon: '⚔️',
    bossName: 'Vulcan Blade Titan',
    bossIcon: '🗡️',
    color: '#e74c3c',
    accentColor: '#ff7675'
  },
  {
    id: 'archers_grove',
    weaponTypeId: 'bow',
    name: "Archer's Hollow",
    title: 'Hollow of Celestial String',
    desc: 'Sacred silverwood grove where bows tuned to lunar winds are strung.',
    icon: '🏹',
    bossName: 'Apollo Solar Archer',
    bossIcon: '🎯',
    color: '#2ecc71',
    accentColor: '#55efc4'
  },
  {
    id: 'arcane_spire',
    weaponTypeId: 'staff',
    name: 'Arcane Spire',
    title: 'Spire of Prismatic Scepters',
    desc: 'Towering obelisk channeling pure mana leylines into conduits and scepters.',
    icon: '🪄',
    bossName: 'Aether Arch-Mage',
    bossIcon: '🔮',
    color: '#9b59b6',
    accentColor: '#a29bfe'
  },
  {
    id: 'behemoth_den',
    weaponTypeId: 'claw',
    name: 'Behemoth Den',
    title: 'Den of Primordial Claws',
    desc: 'Subterranean cavern where fossilized beast talons and obsidian claws are forged.',
    icon: '🐾',
    bossName: 'Colossal Behemoth Alpha',
    bossIcon: '🦁',
    color: '#e67e22',
    accentColor: '#ffeaa7'
  },
  {
    id: 'shadow_armory',
    weaponTypeId: 'dagger',
    name: 'Shadow Armory',
    title: 'Armory of Abyssal Edge',
    desc: 'Veiled labyrinth hidden between dimensions where silent twin daggers are tempered.',
    icon: '🗡️',
    bossName: 'Thanatos Shadow Reaper',
    bossIcon: '👤',
    color: '#34495e',
    accentColor: '#636e72'
  },
  {
    id: 'titans_anvil',
    weaponTypeId: 'hammer',
    name: "Titan's Anvil",
    title: 'Anvil of the Earthshaker',
    desc: 'Molten forge basin atop volcanic vents where earth-shattering war mallets are cast.',
    icon: '🔨',
    bossName: 'Hephaestus Grand Automaton',
    bossIcon: '🌋',
    color: '#d35400',
    accentColor: '#fab1a0'
  },
  {
    id: 'void_ossuary',
    weaponTypeId: 'scythe',
    name: 'Void Ossuary',
    title: 'Ossuary of the Void Scythe',
    desc: 'Grim crypt veiled in soul-ice where dark curved scythes reap corrupted life essence.',
    icon: '🌾',
    bossName: 'Nether Harvester Prime',
    bossIcon: '💀',
    color: '#8e44ad',
    accentColor: '#be2edd'
  },
  {
    id: 'bastion_citadel',
    weaponTypeId: 'shield',
    name: 'Bastion Citadel',
    title: 'Citadel of the Aegis Bulwark',
    desc: 'Impenetrable fortress foundry where divine tower shields and heavy aegises are forged.',
    icon: '🛡️',
    bossName: 'Atlas Iron Sentinel',
    bossIcon: '🏛️',
    color: '#2980b9',
    accentColor: '#3498db'
  },
  {
    id: 'eldritch_library',
    weaponTypeId: 'grimoire',
    name: 'Eldritch Library',
    title: 'Archive of Abyssal Grimoires',
    desc: 'Subterranean scriptorium binding forbidden astrological grimoires and hexing tomes.',
    icon: '📖',
    bossName: 'Voidbinder Arch-Lich',
    bossIcon: '👁️',
    color: '#6c5ce7',
    accentColor: '#a29bfe'
  },
  {
    id: 'volcanic_crucible',
    weaponTypeId: 'warhammer',
    name: 'Volcanic Crucible',
    title: 'Crucible of the Magma Warhammer',
    desc: 'Bubbling caldera forge where magma-infused warhammers strike with earthquake force.',
    icon: '🌋',
    bossName: 'Magma Eruption Colossus',
    bossIcon: '💥',
    color: '#c0392b',
    accentColor: '#e17055'
  },
  {
    id: 'frostfang_peaks',
    weaponTypeId: 'halberd',
    name: 'Frostfang Peaks',
    title: 'Peaks of the Glacial Halberd',
    desc: 'Glacial mountain peak forge where icy polearms that chill foes upon strike are tempered.',
    icon: '❄️',
    bossName: 'Boreal Frost Drake',
    bossIcon: '🐉',
    color: '#00cec9',
    accentColor: '#81ecec'
  },
  {
    id: 'verdant_sanctuary',
    weaponTypeId: 'tome',
    name: 'Verdant Sanctuary',
    title: 'Sanctuary of the Living Tome',
    desc: 'Overgrown botanical arboretum where ancient restorative tomes bloom with life magic.',
    icon: '🌿',
    bossName: 'Elder Sylvan Keeper',
    bossIcon: '🌱',
    color: '#27ae60',
    accentColor: '#00b894'
  }
];

export const FORGE_DIFFICULTY_TIERS = [
  {
    tier: 1,
    name: 'Apprentice Forge',
    subtitle: 'Novice Smelting',
    energyCost: 10,
    minPartyPower: 2000,
    recommendedPower: 2000,
    weaponDropCount: 1,
    shardsReward: 40,
    essenceReward: 1,
    rarityWeights: { COMMON: 55, UNCOMMON: 35, RARE: 10, EPIC: 0, LEGENDARY: 0, MYTHICAL: 0 }
  },
  {
    tier: 2,
    name: 'Journeyman Forge',
    subtitle: 'Heated Crucible',
    energyCost: 12,
    minPartyPower: 10000,
    recommendedPower: 10000,
    weaponDropCount: 1,
    shardsReward: 90,
    essenceReward: 1,
    rarityWeights: { COMMON: 20, UNCOMMON: 50, RARE: 25, EPIC: 5, LEGENDARY: 0, MYTHICAL: 0 }
  },
  {
    tier: 3,
    name: 'Master Forge',
    subtitle: 'Molten Core',
    energyCost: 15,
    minPartyPower: 45000,
    recommendedPower: 45000,
    weaponDropCount: 2,
    shardsReward: 190,
    essenceReward: 1,
    rarityWeights: { COMMON: 5, UNCOMMON: 25, RARE: 45, EPIC: 20, LEGENDARY: 5, MYTHICAL: 0 }
  },
  {
    tier: 4,
    name: 'Grandmaster Forge',
    subtitle: 'Divine Ignition',
    energyCost: 18,
    minPartyPower: 140000,
    recommendedPower: 140000,
    weaponDropCount: 2,
    shardsReward: 400,
    essenceReward: 2,
    rarityWeights: { COMMON: 0, UNCOMMON: 10, RARE: 35, EPIC: 35, LEGENDARY: 16, MYTHICAL: 4 }
  }
];

/**
 * Generate targeted weapon loot for clearing a Forge Chamber
 */
export function generateForgeLoot(chamberId, tierNum = 1) {
  const chamber = FORGE_CHAMBERS.find(c => c.id === chamberId) || FORGE_CHAMBERS[0];
  const tierObj = FORGE_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || FORGE_DIFFICULTY_TIERS[0];

  const weapons = [];
  for (let i = 0; i < tierObj.weaponDropCount; i++) {
    const rarity = rollRarityFromWeights(tierObj.rarityWeights);
    const weapon = createWeaponInstance({
      weaponTypeId: chamber.weaponTypeId,
      rarity,
      level: tierNum
    });
    weapons.push(weapon);
  }

  return {
    chamber,
    tier: tierObj,
    weapons,
    shardsGained: tierObj.shardsReward,
    essenceGained: tierObj.essenceReward
  };
}
