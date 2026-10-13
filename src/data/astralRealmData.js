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
  },
  leo: {
    id: 'leo',
    name: 'Leo',
    title: 'The Golden Lion of Valor',
    icon: '🦁',
    themeColor: '#eab308',
    accentColor: '#facc15',
    description: 'Empowers boss damage amplification, critical ferocity, and merciless execution strikes.',
    stars: [
      { node: 1, name: 'Lionheart Strike', cost: 2, bonus: { bossDmgPercent: 5 }, desc: '+5% Boss & Elite Damage' },
      { node: 2, name: 'Solar Mane', cost: 3, bonus: { critDamage: 8 }, desc: '+8% Critical Hit Damage' },
      { node: 3, name: 'Apex Predator', cost: 5, bonus: { bossDmgPercent: 10 }, desc: '+10% Boss & Elite Damage' },
      { node: 4, name: 'Roar of Domination', cost: 8, bonus: { bossDmgPercent: 10 }, desc: '+10% Boss & Elite Damage' },
      { node: 5, name: 'Sovereign Executioner', cost: 12, bonus: { executionerDmgPercent: 15 }, desc: '+15% Damage against targets below 30% HP' }
    ]
  },
  taurus: {
    id: 'taurus',
    name: 'Taurus',
    title: 'The Iron Bastion',
    icon: '🐂',
    themeColor: '#84cc16',
    accentColor: '#a3e635',
    description: 'Reinforces guardian aggro, barrier capacitance, and frontline impenetrable fortitude.',
    stars: [
      { node: 1, name: 'Colossus Stance', cost: 2, bonus: { tankThreatPercent: 10 }, desc: '+10% Tank Aggro & Threat Multiplier' },
      { node: 2, name: 'Bastion Horns', cost: 3, bonus: { initialShieldPercent: 12 }, desc: '+12% Team Shielding Capacity' },
      { node: 3, name: 'Unyielding Hide', cost: 5, bonus: { frontlineMitigationPercent: 10 }, desc: '+10% Frontline Damage Mitigation' },
      { node: 4, name: 'Earthshaker Vitality', cost: 8, bonus: { tankThreatPercent: 20 }, desc: '+20% Tank Aggro & Threat Multiplier' },
      { node: 5, name: 'Primordial Bulwark', cost: 12, bonus: { frontlineMitigationPercent: 15 }, desc: '+15% Frontline Damage Mitigation' }
    ]
  },
  scorpio: {
    id: 'scorpio',
    name: 'Scorpio',
    title: 'The Venom Sovereign',
    icon: '🦂',
    themeColor: '#a855f7',
    accentColor: '#c084fc',
    description: 'Afflicts enemies with caustic armor sundering, amplified toxic burns, and vampiric lifesteal.',
    stars: [
      { node: 1, name: 'Piercing Stinger', cost: 2, bonus: { armorPiercePercent: 5 }, desc: '+5% Team Armor Penetration' },
      { node: 2, name: 'Neurotoxin Potency', cost: 3, bonus: { dotAmpPercent: 10 }, desc: '+10% Damage-over-Time Amplification' },
      { node: 3, name: 'Carapace Breaker', cost: 5, bonus: { armorPiercePercent: 10 }, desc: '+10% Team Armor Penetration' },
      { node: 4, name: 'Vampiric Siphon', cost: 8, bonus: { lifeStealPercent: 8 }, desc: '+8% Life Steal on Spirit Attacks' },
      { node: 5, name: 'Abyssal Envenom', cost: 12, bonus: { dotAmpPercent: 15 }, desc: '+15% Damage-over-Time Amplification' }
    ]
  },
  aquarius: {
    id: 'aquarius',
    name: 'Aquarius',
    title: 'The Cosmic Waterbearer',
    icon: '🏺',
    themeColor: '#3b82f6',
    accentColor: '#60a5fa',
    description: 'Accelerates combat mana regeneration, starting reserves, and hastens relic ability cooldowns.',
    stars: [
      { node: 1, name: 'Astral Spring', cost: 2, bonus: { combatMpRegenPercent: 10 }, desc: '+10% Combat MP Generation' },
      { node: 2, name: 'Tidal Reservoir', cost: 3, bonus: { startingMpBonus: 20 }, desc: '+20 Starting MP at Battle Outset' },
      { node: 3, name: 'Celestial Torrent', cost: 5, bonus: { combatMpRegenPercent: 15 }, desc: '+15% Combat MP Generation' },
      { node: 4, name: 'Chrono Conduit', cost: 8, bonus: { relicCooldownReductionPercent: 15 }, desc: '-15% Relic 4-pc Ability Cooldown' },
      { node: 5, name: 'Fountain of Eternity', cost: 12, bonus: { combatMpRegenPercent: 25 }, desc: '+25% Combat MP Generation & Quick Cast' }
    ]
  },
  sagittarius: {
    id: 'sagittarius',
    name: 'Sagittarius',
    title: 'The Astral Centaur Archer',
    icon: '🏹',
    themeColor: '#10b981',
    accentColor: '#34d399',
    description: 'Quickens attack cadence, critical accuracy, and grants devastating double-strike procs.',
    stars: [
      { node: 1, name: 'Swift Quiver', cost: 2, bonus: { atkSpdBonusPercent: 10 }, desc: '+10% Basic Attack Speed' },
      { node: 2, name: 'Sharpshooter Precision', cost: 3, bonus: { critRate: 8 }, desc: '+8% Critical Hit Chance' },
      { node: 3, name: 'Twin Arrow Flight', cost: 5, bonus: { doubleStrikeChance: 12 }, desc: '+12% Double-Strike Hit Chance' },
      { node: 4, name: 'Galeforce Stride', cost: 8, bonus: { atkSpdBonusPercent: 15 }, desc: '+15% Basic Attack Speed' },
      { node: 5, name: 'Celestial Arrow Barrage', cost: 12, bonus: { doubleStrikeChance: 15 }, desc: '+15% Double-Strike Hit Chance' }
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
