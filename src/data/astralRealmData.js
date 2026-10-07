/**
 * Astral Realm Expansion Data
 * Defines:
 * 1) Celestial Constellations (Zodiac Passive Trees)
 * 2) Astral Expeditions (Idle Spirit Dispatch Fissures)
 * 3) Astral Transmutation Configuration (Anti-oversaturation economy conversion)
 */

export const CONSTELLATIONS_CONFIG = {
  draco: {
    id: 'draco',
    name: 'Draco',
    title: 'The Dragon of Fury',
    icon: '🐉',
    themeColor: '#ef4444',
    accentColor: '#f87171',
    description: 'Empowers offensive spirit devastation, critical strikes, and ultimate amplifications.',
    stars: [
      { node: 1, name: 'Dragon Claw', cost: 2, bonus: { partyAtkPercent: 4 }, desc: '+4% All Spirit ATK Power' },
      { node: 2, name: 'Scaled Vigor', cost: 3, bonus: { partyAtkPercent: 6 }, desc: '+6% All Spirit ATK Power' },
      { node: 3, name: 'Draconic Focus', cost: 5, bonus: { critRate: 5 }, desc: '+5% Critical Hit Chance' },
      { node: 4, name: 'Infernal Wrath', cost: 8, bonus: { critDamage: 15 }, desc: '+15% Critical Hit Damage' },
      { node: 5, name: 'Dragon Sovereign', cost: 12, bonus: { ultAmp: 20 }, desc: '+20% Ultimate Skill Amplification' }
    ]
  },
  phoenix: {
    id: 'phoenix',
    name: 'Phoenix',
    title: 'The Immortal Flame',
    icon: '🔥',
    themeColor: '#f97316',
    accentColor: '#fb923c',
    description: 'Blesses spirits with immense vitality, cosmic barriers, and emergency recovery.',
    stars: [
      { node: 1, name: 'Kindled Spark', cost: 2, bonus: { partyHpPercent: 5 }, desc: '+5% All Spirit Max HP' },
      { node: 2, name: 'Blazing Plume', cost: 3, bonus: { partyHpPercent: 8 }, desc: '+8% All Spirit Max HP' },
      { node: 3, name: 'Aegis of Ashes', cost: 5, bonus: { initialShieldPercent: 10 }, desc: '+10% Max HP Initial Shield' },
      { node: 4, name: 'Solar Rebirth', cost: 8, bonus: { healingReceivedPercent: 15 }, desc: '+15% Healing & Regeneration' },
      { node: 5, name: 'Eternal Avatar', cost: 12, bonus: { damageMitigationPercent: 10 }, desc: '+10% Permanent Damage Mitigation' }
    ]
  },
  pegasus: {
    id: 'pegasus',
    name: 'Pegasus',
    title: 'The Harbinger of Starlight',
    icon: '🪽',
    themeColor: '#06b6d4',
    accentColor: '#22d3ee',
    description: 'Hastens astral energy circulation, boss essence extractions, and idle training velocity.',
    stars: [
      { node: 1, name: 'Zephyr Stride', cost: 2, bonus: { energyRegenBonus: 10 }, desc: '+10% Faster Natural Energy Regen' },
      { node: 2, name: 'Aether Hooves', cost: 3, bonus: { maxEnergyBonus: 20 }, desc: '+20 Max Energy Vault Capacity' },
      { node: 3, name: 'Cosmic Siphon', cost: 5, bonus: { bonusAstralDropChance: 25 }, desc: '+25% Chance for Extra 🔮 from Bosses' },
      { node: 4, name: 'Astral Swiftness', cost: 8, bonus: { afkXpBonus: 20 }, desc: '+20% Idle Training Experience' },
      { node: 5, name: 'Celestial Emissary', cost: 12, bonus: { bonusGodEssencesPercent: 25 }, desc: '+25% Bonus 💠 God Essences from Trials' }
    ]
  }
};

export const EXPEDITIONS_CONFIG = [
  {
    id: 'starlight_fissure',
    name: 'Starlight Fissure',
    tier: 'Novice',
    icon: '✨',
    requiredSpirits: 1,
    durationSec: 7200, // 2 Hours (for tests/demo, real seconds)
    durationLabel: '2 Hours',
    recommendedElement: 'WIND',
    description: 'A shallow breach into celestial slipstreams. Yields entry-level Astral catalysts.',
    rewards: {
      minAstral: 1,
      maxAstral: 2,
      minGods: 15,
      maxGods: 25,
      shards: 100
    }
  },
  {
    id: 'nebula_abyss',
    name: 'Nebula Abyss',
    tier: 'Adept',
    icon: '🌌',
    requiredSpirits: 2,
    durationSec: 21600, // 6 Hours
    durationLabel: '6 Hours',
    recommendedElement: 'WATER',
    description: 'Turbulent cosmic ocean dense with gravitational vortexes. Yields relics & rare essences.',
    rewards: {
      minAstral: 3,
      maxAstral: 5,
      minGods: 35,
      maxGods: 55,
      shards: 300,
      dropRelicChance: 0.50
    }
  },
  {
    id: 'primordial_void',
    name: 'Primordial Void',
    tier: 'Master',
    icon: '🕳️',
    requiredSpirits: 3,
    durationSec: 43200, // 12 Hours
    durationLabel: '12 Hours',
    recommendedElement: 'LIGHT',
    description: 'Ancient celestial realm at the edge of creation. Tremendous astral bounty for brave parties.',
    rewards: {
      minAstral: 8,
      maxAstral: 12,
      minGods: 80,
      maxGods: 120,
      shards: 800,
      dropRelicChance: 1.00
    }
  }
];

export const TRANSMUTATION_CONFIG = {
  shardCost: 1000,
  godEssenceCost: 10,
  astralEssenceReward: 1,
  dailyQuota: 5
};
