/**
 * Artifact Dungeon: The Pantheon Trials Data
 * 8 God Chambers for targeted Greek God Relic & Weapon farming.
 */

import { GREEK_GOD_SETS, RELIC_SLOT_TYPES, WEAPON_TYPES, createRelicInstance, createWeaponInstance } from './equipmentData.js';

export const PANTHEON_DIFFICULTY_TIERS = [
  {
    tier: 1,
    name: 'Disciple Trial',
    energyCost: 10,
    recommendedPower: 1500,
    relicCount: 2,
    rarityWeights: { COMMON: 60, UNCOMMON: 40, RARE: 0, EPIC: 0, LEGENDARY: 0, MYTHICAL: 0 },
    shardsReward: 25,
    essenceReward: 1
  },
  {
    tier: 2,
    name: 'Champion Trial',
    energyCost: 12,
    recommendedPower: 6000,
    relicCount: 2,
    rarityWeights: { COMMON: 20, UNCOMMON: 55, RARE: 22, EPIC: 3, LEGENDARY: 0, MYTHICAL: 0 },
    shardsReward: 60,
    essenceReward: 2
  },
  {
    tier: 3,
    name: 'Sovereign Trial',
    energyCost: 15,
    recommendedPower: 25000,
    relicCount: 3,
    rarityWeights: { COMMON: 0, UNCOMMON: 25, RARE: 45, EPIC: 25, LEGENDARY: 5, MYTHICAL: 0 },
    shardsReward: 150,
    essenceReward: 5
  },
  {
    tier: 4,
    name: 'Divine Trial',
    energyCost: 18,
    recommendedPower: 100000,
    relicCount: 3,
    rarityWeights: { COMMON: 0, UNCOMMON: 0, RARE: 20, EPIC: 45, LEGENDARY: 30, MYTHICAL: 5 },
    shardsReward: 350,
    essenceReward: 12
  }
];

export const PANTHEON_CHAMBERS = [
  {
    id: 'underworld_crypt',
    name: 'Crypt of the Underworld',
    godId: 'hades',
    godTitle: 'Hades, Master of Shades',
    sigil: '🔱',
    color: '#8e44ad',
    accentColor: '#9b59b6',
    lore: 'A realm of stygian shadows where ancient souls forge Relics infused with dark underworld flames.',
    bossName: 'Hades Avatar: Tartarus Sovereign',
    bossPowerMultiplier: 1.25,
    bossMaxHpMultiplier: 2.2
  },
  {
    id: 'olympus_peak',
    name: 'Peak of Mount Olympus',
    godId: 'zeus',
    godTitle: 'Zeus, Stormfather',
    sigil: '⚡',
    color: '#f1c40f',
    accentColor: '#ffd32a',
    lore: 'Crackling summit perpetually struck by divine lightning, empowering conduits with astral mana.',
    bossName: 'Zeus Avatar: Thunder Overlord',
    bossPowerMultiplier: 1.3,
    bossMaxHpMultiplier: 2.0
  },
  {
    id: 'sunken_trench',
    name: 'Sunken Abyss of the Deep',
    godId: 'poseidon',
    godTitle: 'Poseidon, Earth-Shaker',
    sigil: '🌊',
    color: '#3498db',
    accentColor: '#00d2d3',
    lore: 'Submerged coral depths guarded by primeval leviathans, granting oceanic armor and tidal surge.',
    bossName: 'Poseidon Avatar: Abyssal Leviathan',
    bossPowerMultiplier: 1.2,
    bossMaxHpMultiplier: 2.5
  },
  {
    id: 'colosseum_blood',
    name: 'Colosseum of Eternal War',
    godId: 'ares',
    godTitle: 'Ares, Warlord of Olympus',
    sigil: '⚔️',
    color: '#e74c3c',
    accentColor: '#ff4757',
    lore: 'Blood-stained arena where gladiators prove their ruthlessness for unbridled combat power.',
    bossName: 'Ares Avatar: Primordial Warmonger',
    bossPowerMultiplier: 1.45,
    bossMaxHpMultiplier: 1.9
  },
  {
    id: 'sanctum_sun',
    name: 'Sanctum of the Solar Chariot',
    godId: 'apollo',
    godTitle: 'Apollo, The Radiant Dawn',
    sigil: '☀️',
    color: '#e67e22',
    accentColor: '#ffa801',
    lore: 'Blazing temple bathed in celestial golden fire, blessing seekers with solar radiance and insight.',
    bossName: 'Apollo Avatar: Solar Archon',
    bossPowerMultiplier: 1.35,
    bossMaxHpMultiplier: 2.1
  },
  {
    id: 'citadel_wisdom',
    name: 'Citadel of Strategic Aegis',
    godId: 'athena',
    godTitle: 'Athena, Champion of Wisdom',
    sigil: '🛡️',
    color: '#95a5a6',
    accentColor: '#dfe4ea',
    lore: 'Marble fortress fortified with divine phalanxes, bestowing unbreakable shields and death prevention.',
    bossName: 'Athena Avatar: Aegis Sentinel',
    bossPowerMultiplier: 1.15,
    bossMaxHpMultiplier: 2.8
  },
  {
    id: 'silver_forest',
    name: 'Glade of the Silver Moon',
    godId: 'artemis',
    godTitle: 'Artemis, Huntress of the Wilds',
    sigil: '🏹',
    color: '#2ed573',
    accentColor: '#7bed9f',
    lore: 'Moonlit forest patrolled by astral beasts, rewarding stealthy snipers with lethal critical precision.',
    bossName: 'Artemis Avatar: Moonlit Behemoth',
    bossPowerMultiplier: 1.4,
    bossMaxHpMultiplier: 1.85
  },
  {
    id: 'zephyr_spire',
    name: 'Spire of the Zephyr Winds',
    godId: 'hermes',
    godTitle: 'Hermes, Celestial Courier',
    sigil: '🪽',
    color: '#1abc9c',
    accentColor: '#2ecc71',
    lore: 'Skyward pinnacle where gale-force winds grant supernatural evasion and rejuvenation.',
    bossName: 'Hermes Avatar: Zephyr Tempest',
    bossPowerMultiplier: 1.25,
    bossMaxHpMultiplier: 2.0
  }
];

/**
 * Rolls random rarity according to difficulty tier weights
 */
function rollRarityFromWeights(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(weights)) {
    if (roll < weight) return rarity;
    roll -= weight;
  }
  return 'COMMON';
}

/**
 * Rolls loot rewards when clearing an Artifact Dungeon Chamber
 */
export function generateDungeonLoot(chamberId, tierNum = 1) {
  const chamber = PANTHEON_CHAMBERS.find(c => c.id === chamberId) || PANTHEON_CHAMBERS[0];
  const tierObj = PANTHEON_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || PANTHEON_DIFFICULTY_TIERS[0];

  const relics = [];
  // Guaranteed 2 to 3 targeted Relics from this God's Set!
  for (let i = 0; i < tierObj.relicCount; i++) {
    // Pick random slot (Crown, Goblet, Feather, Ring, Pendant, Aegis)
    const slotObj = RELIC_SLOT_TYPES[Math.floor(Math.random() * RELIC_SLOT_TYPES.length)];
    const rarity = rollRarityFromWeights(tierObj.rarityWeights);
    const relic = createRelicInstance({
      setId: chamber.godId,
      slotTypeId: slotObj.id,
      rarity,
      level: tierNum
    });
    relics.push(relic);
  }

  // 45% chance to roll a Weapon
  const weapons = [];
  if (Math.random() < 0.45) {
    const wType = WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)];
    const rarity = rollRarityFromWeights(tierObj.rarityWeights);
    const weapon = createWeaponInstance({
      weaponTypeId: wType.id,
      rarity,
      level: tierNum
    });
    weapons.push(weapon);
  }

  return {
    chamber,
    tier: tierObj,
    relics,
    weapons,
    shardsGained: tierObj.shardsReward,
    essenceGained: tierObj.essenceReward
  };
}
