/**
 * Greek God Relics & Equipment System
 * Defines Weapons, 6 Relic Slots, and 8 Greek God Sets with 2-pc and 4-pc Set Bonuses.
 */

export const RELIC_SLOT_TYPES = [
  { id: 'headgear', name: 'Headgear', icon: '👑', desc: 'Divine crown granting massive life force (Bonus Max HP)' },
  { id: 'totem', name: 'Totem', icon: '🗿', desc: 'Ancestral idol granting barrier wards (Shield Strength)' },
  { id: 'ring', name: 'Ring', icon: '💍', desc: 'Band of celestial dominance (Bonus ATK Power)' },
  { id: 'necklace', name: 'Necklace', icon: '📿', desc: 'Spiritual choker accelerating mana flow (Mana Replenish)' },
  { id: 'orb', name: 'Orb', icon: '🔮', desc: 'Arcane sphere magnifying skill power (Ultimate Amplification)' },
  { id: 'charm', name: 'Charm', icon: '🧿', desc: 'Lucky talisman granting agile evasion (Evasion Rating)' }
];

export const WEAPON_TYPES = [
  { id: 'sword', name: 'Spectral Blade', icon: '⚔️', primaryStat: 'atkPower' },
  { id: 'bow', name: 'Celestial Bow', icon: '🏹', primaryStat: 'critRate' },
  { id: 'staff', name: 'Astral Scepter', icon: '🪄', primaryStat: 'ultAmp' },
  { id: 'claw', name: 'Primordial Claws', icon: '🐾', primaryStat: 'atkPower' },
  { id: 'dagger', name: 'Shadow Dagger', icon: '🗡️', primaryStat: 'evasion' },
  { id: 'hammer', name: 'Titan Mallet', icon: '🔨', primaryStat: 'armorPierce' }
];

export const GREEK_GOD_SETS = {
  hades: {
    id: 'hades',
    name: 'Hades Relic Set',
    god: 'Hades',
    title: 'Lord of the Underworld',
    color: '#8e44ad',
    accentColor: '#9b59b6',
    icon: '🔱',
    bonus2pc: {
      name: 'Underworld Vigor',
      description: '+10% DMG & +5% Mana Replenish',
      damageBonus: 0.10,
      manaReplenishBonus: 0.05
    },
    bonus4pc: {
      name: 'Underworld Flames',
      description: 'Procs an AOE dark flame dealing 2.5% enemy Max HP as DoT for 7s (15s CD).',
      type: 'DOT_AOE',
      percentEnemyMaxHpPerSec: 0.025,
      durationSec: 7,
      cooldownSec: 15
    }
  },

  zeus: {
    id: 'zeus',
    name: 'Zeus Relic Set',
    god: 'Zeus',
    title: 'King of the Heavens',
    color: '#f1c40f',
    accentColor: '#ffd32a',
    icon: '⚡',
    bonus2pc: {
      name: 'Heavenly Conduit',
      description: '+20% Mana Replenish Rate',
      manaReplenishBonus: 0.20
    },
    bonus4pc: {
      name: 'Divine Retribution',
      description: 'Strikes all enemies with an instant lightning blast dealing 8% Max HP (45s CD).',
      type: 'BURST_AOE',
      percentEnemyMaxHp: 0.08,
      cooldownSec: 45
    }
  },

  poseidon: {
    id: 'poseidon',
    name: 'Poseidon Relic Set',
    god: 'Poseidon',
    title: 'Ruler of the Abyssal Seas',
    color: '#3498db',
    accentColor: '#00d2d3',
    icon: '🌊',
    bonus2pc: {
      name: 'Abyssal Might',
      description: '+10% DMG & +5% Ult Amp',
      damageBonus: 0.10,
      ultAmpBonus: 0.05
    },
    bonus4pc: {
      name: 'Oceanic Surge',
      description: 'Buffs team DMG by +15% and grants all spirits a 15% Max HP Water Shield (45s CD).',
      type: 'BUFF_AND_SHIELD',
      teamDamageBuff: 0.15,
      shieldPercentMaxHp: 0.15,
      cooldownSec: 45
    }
  },

  hermes: {
    id: 'hermes',
    name: 'Hermes Relic Set',
    god: 'Hermes',
    title: 'The Winged Messenger',
    color: '#1abc9c',
    accentColor: '#2ecc71',
    icon: '🪽',
    bonus2pc: {
      name: 'Zephyr Stride',
      description: '+15% Atk Spd & +10% Evasion',
      atkSpdBonus: 0.15,
      evasionBonus: 0.10
    },
    bonus4pc: {
      name: 'Caduceus Zephyr',
      description: 'Restores 3% Max HP per sec and 25 MP to all party members for 7s (40s CD).',
      type: 'HOT_AOE',
      healPercentPerSec: 0.03,
      mpRestore: 25,
      durationSec: 7,
      cooldownSec: 40
    }
  },

  ares: {
    id: 'ares',
    name: 'Ares Relic Set',
    god: 'Ares',
    title: 'God of Brutal War',
    color: '#e74c3c',
    accentColor: '#ff4757',
    icon: '⚔️',
    bonus2pc: {
      name: 'Bloodlust Edge',
      description: '+15% DMG',
      damageBonus: 0.15
    },
    bonus4pc: {
      name: 'War of Olympus',
      description: 'Grants +10% DMG and +3% Ult Amp to all spirits, while reducing foe DMG by 10% for 10s (60s CD).',
      type: 'WAR_CRY',
      teamDamageBuff: 0.10,
      teamUltAmpBuff: 0.03,
      enemyDamageReduction: 0.10,
      durationSec: 10,
      cooldownSec: 60
    }
  },

  apollo: {
    id: 'apollo',
    name: 'Apollo Relic Set',
    god: 'Apollo',
    title: 'Bearer of the Solar Chariot',
    color: '#e67e22',
    accentColor: '#ffa801',
    icon: '☀️',
    bonus2pc: {
      name: 'Solar Focus',
      description: '+12% Crit Rate & +5% Mana Replenish',
      critRateBonus: 0.12,
      manaReplenishBonus: 0.05
    },
    bonus4pc: {
      name: 'Solar Radiance',
      description: 'Critical hits emit radiant rays healing the lowest ally for 8% Max HP and blinding foes for 4s (30s CD).',
      type: 'SOLAR_BURST',
      healLowestAllyPercent: 0.08,
      blindDurationSec: 4,
      cooldownSec: 30
    }
  },

  athena: {
    id: 'athena',
    name: 'Athena Relic Set',
    god: 'Athena',
    title: 'Goddess of Strategic Aegis',
    color: '#95a5a6',
    accentColor: '#dfe4ea',
    icon: '🛡️',
    bonus2pc: {
      name: 'Parthenon Phalanx',
      description: '+15% Team Shield & +12% DEF',
      shieldBonus: 0.15,
      defenseBonus: 0.12,
      maxHpBonus: 0.15,
      armorBonus: 0.12
    },
    bonus4pc: {
      name: 'Parthenon Bulwark',
      description: 'Negates next fatal blow, granting all allies a 20% Max HP Aegis shield and reflecting 25% damage (45s CD).',
      type: 'SHIELD_AND_INVULN',
      shieldPercentMaxHp: 0.20,
      damageReflect: 0.25,
      durationSec: 6,
      cooldownSec: 45
    }
  },

  artemis: {
    id: 'artemis',
    name: 'Artemis Relic Set',
    god: 'Artemis',
    title: 'Huntress of the Silver Moon',
    color: '#2ed573',
    accentColor: '#7bed9f',
    icon: '🏹',
    bonus2pc: {
      name: 'Silver Artemis Focus',
      description: '+12% Crit Rate & +15% Crit DMG',
      critRateBonus: 0.12,
      critDmgBonus: 0.15
    },
    bonus4pc: {
      name: 'Lunar Piercer',
      description: 'Locks onto highest HP enemy, firing an astral arrow dealing 12% Max HP damage (35s CD).',
      type: 'SNIPER_BURST',
      percentEnemyMaxHp: 0.12,
      cooldownSec: 35
    }
  },

  hephaestus: {
    id: 'hephaestus',
    name: 'Hephaestus Relic Set',
    god: 'Hephaestus',
    title: 'Master of the Divine Forge (Offensive Tank)',
    color: '#e67e22',
    accentColor: '#d35400',
    icon: '🌋',
    bonus2pc: {
      name: 'Molten Carapace',
      description: '+15% DEF & converts 25% of DEF into bonus ATK Power',
      defBonus: 0.15,
      defPercentBonus: 15,
      defToAtkRatio: 0.25
    },
    bonus4pc: {
      name: 'Magma Eruption',
      description: 'When struck or every 12s, erupts with a molten volcanic shockwave dealing (200% DEF + 10% Max HP) fire damage to all enemies and taunts for 4s (15s CD).',
      type: 'OFFENSIVE_TANK_ERUPTION',
      defRatio: 2.0,
      hpRatio: 0.10,
      tauntDurationSec: 4,
      cooldownSec: 15
    }
  },

  atlas: {
    id: 'atlas',
    name: 'Atlas Relic Set',
    god: 'Atlas',
    title: 'Titan of the Celestial Heavens (Defensive Tank)',
    color: '#7f8c8d',
    accentColor: '#bdc3c7',
    icon: '🏛️',
    bonus2pc: {
      name: 'Celestial Pillar',
      description: '+25% Max HP & +20% DEF',
      hpBonus: 0.25,
      hpPercentBonus: 25,
      defBonus: 0.20,
      defPercentBonus: 20
    },
    bonus4pc: {
      name: 'Weight of the Heavens',
      description: '-12% party damage taken. Intercepts all attacks directed at allies below 50% HP for 8s and gains a 30% Max HP shield (30s CD).',
      type: 'GUARDIAN_INTERCEPTION',
      teamDamageReduction: 0.12,
      shieldPercentMaxHp: 0.30,
      interceptionDurationSec: 8,
      cooldownSec: 30
    }
  }
};

export const EQUIPMENT_RARITIES = {
  COMMON: { name: 'Common', multiplier: 1.0, color: '#bdc3c7', border: '#7f8c8d' },
  UNCOMMON: { name: 'Uncommon', multiplier: 1.25, color: '#2ecc71', border: '#27ae60' },
  RARE: { name: 'Rare', multiplier: 1.6, color: '#3498db', border: '#2980b9' },
  EPIC: { name: 'Epic', multiplier: 2.2, color: '#9b59b6', border: '#8e44ad' },
  LEGENDARY: { name: 'Legendary', multiplier: 3.2, color: '#f39c12', border: '#d35400' },
  MYTHICAL: { name: 'Mythical', multiplier: 4.5, color: '#00ffff', border: '#00d2d3' }
};

/**
 * 3★ to 6★ Relic Star Tiers
 */
export const RELIC_STAR_TIERS = {
  3: {
    stars: 3,
    label: 'Adept',
    multiplier: 1.5,
    maxLevel: 9,
    minInitialSubs: 1,
    maxInitialSubs: 2,
    maxSubCapacity: 3,
    color: '#3498db',
    dismantleEssences: 5,
    dismantleShards: 50
  },
  4: {
    stars: 4,
    label: 'Master',
    multiplier: 2.2,
    maxLevel: 12,
    minInitialSubs: 3,
    maxInitialSubs: 4,
    maxSubCapacity: 4,
    color: '#9b59b6',
    dismantleEssences: 15,
    dismantleShards: 150
  },
  5: {
    stars: 5,
    label: 'Divine',
    multiplier: 3.2,
    maxLevel: 15,
    minInitialSubs: 4,
    maxInitialSubs: 4,
    maxSubCapacity: 4,
    color: '#f39c12',
    dismantleEssences: 40,
    dismantleShards: 400
  },
  6: {
    stars: 6,
    label: 'Ascended',
    multiplier: 4.5,
    maxLevel: 15,
    minInitialSubs: 5,
    maxInitialSubs: 5,
    maxSubCapacity: 5,
    color: '#00ffff',
    dismantleEssences: 100,
    dismantleShards: 1000
  }
};

/**
 * Relic Substat Catalog (Rebalanced)
 */
export const RELIC_SUBSTAT_TYPES = [
  { id: 'flat_atk', name: 'Bonus ATK', isPercent: false, min: 6, max: 16, icon: '⚔️' },
  { id: 'flat_hp', name: 'Bonus Max HP', isPercent: false, min: 25, max: 65, icon: '❤️' },
  { id: 'flat_shield', name: 'Shield Strength', isPercent: false, min: 20, max: 50, icon: '🛡️' },
  { id: 'percent_atk', name: 'ATK %', isPercent: true, min: 2.0, max: 4.5, icon: '💥' },
  { id: 'percent_hp', name: 'HP %', isPercent: true, min: 2.0, max: 4.5, icon: '💚' },
  { id: 'crit_rate', name: 'Crit Rate %', isPercent: true, min: 1.0, max: 2.5, icon: '🎯' },
  { id: 'crit_dmg', name: 'Crit DMG %', isPercent: true, min: 4.0, max: 8.0, icon: '⚡' },
  { id: 'mana_regen', name: 'Mana Replenish %', isPercent: true, min: 2.0, max: 5.0, icon: '🔮' },
  { id: 'ult_amp', name: 'Ult Amp %', isPercent: true, min: 2.5, max: 6.0, icon: '✨' },
  { id: 'evasion', name: 'Evasion %', isPercent: true, min: 1.5, max: 3.5, icon: '💨' },
  { id: 'pierce', name: 'Armor Pierce %', isPercent: true, min: 2.0, max: 4.5, icon: '🗡️' }
];

/**
 * Rolls a random single substat instance
 */
function rollSingleSubstat(subType) {
  const raw = subType.min + Math.random() * (subType.max - subType.min);
  const value = subType.isPercent ? parseFloat(raw.toFixed(1)) : Math.round(raw);
  return {
    typeId: subType.id,
    name: subType.name,
    isPercent: subType.isPercent,
    icon: subType.icon,
    value,
    rolls: 1
  };
}

/**
 * Generates initial substats based on star tier (3★ to 6★)
 */
export function generateRelicSubstats({ stars = 3, mainStatName = '' } = {}) {
  const tier = RELIC_STAR_TIERS[stars] || RELIC_STAR_TIERS[3];
  const targetCount = tier.minInitialSubs === tier.maxInitialSubs
    ? tier.minInitialSubs
    : tier.minInitialSubs + Math.floor(Math.random() * (tier.maxInitialSubs - tier.minInitialSubs + 1));

  // Filter out substats that duplicate the main stat
  const availablePool = RELIC_SUBSTAT_TYPES.filter(s => {
    if (mainStatName.includes('HP') && (s.id === 'flat_hp' || s.id === 'percent_hp')) return false;
    if (mainStatName.includes('ATK') && (s.id === 'flat_atk' || s.id === 'percent_atk')) return false;
    if (mainStatName.includes('Shield') && s.id === 'flat_shield') return false;
    if (mainStatName.includes('Mana') && s.id === 'mana_regen') return false;
    if (mainStatName.includes('Ult') && s.id === 'ult_amp') return false;
    if (mainStatName.includes('Evasion') && s.id === 'evasion') return false;
    return true;
  });

  const shuffled = [...availablePool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(targetCount, tier.maxSubCapacity));
  return picked.map(rollSingleSubstat);
}

/**
 * Rerolls all substats on a relic for 5 Soul Essences.
 * Preserves level, stars, and set, while rolling fresh substats and re-applying upgrades for milestones (+3, +6, +9, +12, +15).
 */
export function rerollRelicSubstatsData(relic, { lockedSubTypes = [] } = {}) {
  const stars = relic.stars || 3;
  const tier = RELIC_STAR_TIERS[stars] || RELIC_STAR_TIERS[3];

  const targetCount = tier.minInitialSubs === tier.maxInitialSubs
    ? tier.minInitialSubs
    : tier.minInitialSubs + Math.floor(Math.random() * (tier.maxInitialSubs - tier.minInitialSubs + 1));

  const mainStatName = relic.mainStatName || '';
  const availablePool = RELIC_SUBSTAT_TYPES.filter(s => {
    if (mainStatName.includes('HP') && (s.id === 'flat_hp' || s.id === 'percent_hp')) return false;
    if (mainStatName.includes('ATK') && (s.id === 'flat_atk' || s.id === 'percent_atk')) return false;
    if (mainStatName.includes('Shield') && s.id === 'flat_shield') return false;
    if (mainStatName.includes('Mana') && s.id === 'mana_regen') return false;
    if (mainStatName.includes('Ult') && s.id === 'ult_amp') return false;
    if (mainStatName.includes('Evasion') && s.id === 'evasion') return false;
    return true;
  });

  const newSubstats = [];

  // Lock in guaranteed substats if provided (e.g. Divine Relic Scripture)
  if (Array.isArray(lockedSubTypes)) {
    for (const lockedId of lockedSubTypes) {
      const subType = RELIC_SUBSTAT_TYPES.find(s => s.id === lockedId);
      if (subType && !newSubstats.some(s => s.typeId === lockedId)) {
        newSubstats.push(rollSingleSubstat(subType));
      }
    }
  }

  // Fill remaining slots
  const remainingPool = availablePool.filter(s => !newSubstats.some(ns => ns.typeId === s.id));
  const shuffled = [...remainingPool].sort(() => Math.random() - 0.5);
  while (newSubstats.length < targetCount && shuffled.length > 0) {
    newSubstats.push(rollSingleSubstat(shuffled.pop()));
  }

  // Re-apply milestone upgrades for existing level (+3, +6, +9, +12, +15)
  const currentLevel = relic.level || 0;
  const milestones = Math.floor(currentLevel / 3);
  for (let m = 0; m < milestones; m++) {
    if (newSubstats.length < tier.maxSubCapacity) {
      const usedIds = newSubstats.map(s => s.typeId);
      const unpickedPool = RELIC_SUBSTAT_TYPES.filter(s => !usedIds.includes(s.id));
      if (unpickedPool.length > 0) {
        const picked = unpickedPool[Math.floor(Math.random() * unpickedPool.length)];
        newSubstats.push(rollSingleSubstat(picked));
      }
    } else {
      const idx = Math.floor(Math.random() * newSubstats.length);
      const targetSub = newSubstats[idx];
      const subType = RELIC_SUBSTAT_TYPES.find(s => s.id === targetSub.typeId);
      if (subType) {
        const addRaw = subType.min + Math.random() * (subType.max - subType.min);
        const addVal = subType.isPercent ? parseFloat(addRaw.toFixed(1)) : Math.round(addRaw);
        targetSub.value = subType.isPercent ? parseFloat((targetSub.value + addVal).toFixed(1)) : targetSub.value + addVal;
        targetSub.rolls = (targetSub.rolls || 1) + 1;
      }
    }
  }

  relic.substats = newSubstats;
  return relic;
}

/**
 * Enhances a relic by 1 level (up to maxLevel), unlocking or upgrading substats at milestone levels
 */
export function enhanceRelicData(relic) {
  const stars = relic.stars || 3;
  const tier = RELIC_STAR_TIERS[stars] || RELIC_STAR_TIERS[3];
  if (relic.level >= tier.maxLevel) {
    throw new Error(`Relic is already at maximum enhancement level (+${tier.maxLevel})!`);
  }

  relic.level += 1;

  // Milestone triggers at +3, +6, +9, +12, +15
  if (relic.level % 3 === 0) {
    if (!Array.isArray(relic.substats)) relic.substats = [];

    if (relic.substats.length < tier.maxSubCapacity) {
      // Unlock new substat
      const usedIds = relic.substats.map(s => s.typeId);
      const remainingPool = RELIC_SUBSTAT_TYPES.filter(s => !usedIds.includes(s.id));
      if (remainingPool.length > 0) {
        const picked = remainingPool[Math.floor(Math.random() * remainingPool.length)];
        relic.substats.push(rollSingleSubstat(picked));
      }
    } else {
      // Upgrade random existing substat
      const idx = Math.floor(Math.random() * relic.substats.length);
      const targetSub = relic.substats[idx];
      const subType = RELIC_SUBSTAT_TYPES.find(s => s.id === targetSub.typeId);
      if (subType) {
        const addRaw = subType.min + Math.random() * (subType.max - subType.min);
        const addVal = subType.isPercent ? parseFloat(addRaw.toFixed(1)) : Math.round(addRaw);
        targetSub.value = subType.isPercent ? parseFloat((targetSub.value + addVal).toFixed(1)) : targetSub.value + addVal;
        targetSub.rolls = (targetSub.rolls || 1) + 1;
      }
    }
  }

  // Recalculate main stat
  relic.mainStatValue = calculateRelicMainStat(relic.slotTypeId, stars, relic.level);
  return relic;
}

/**
 * Calculates Relic main stat based on slot, stars, and level (Rebalanced Supportive Curve)
 */
export function calculateRelicMainStat(slotTypeId, stars = 3, level = 1) {
  const tier = RELIC_STAR_TIERS[stars] || RELIC_STAR_TIERS[3];
  const baseStatVal = Math.round(10 * tier.multiplier * (1 + (level - 1) * 0.08));

  switch (slotTypeId) {
    case 'headgear': return baseStatVal * 4; // Bonus Max HP (+60 to +280 HP)
    case 'totem': return Math.round(baseStatVal * 2.5); // Shield Strength (+30 to +140 Shield)
    case 'ring': return baseStatVal * 2; // Bonus ATK Power (+18 to +84 ATK)
    case 'necklace': return Math.min(18, Math.max(5, Math.round(baseStatVal * 0.25))); // Mana Replenish % (+5% to +18%)
    case 'orb': return Math.min(20, Math.max(6, Math.round(baseStatVal * 0.3))); // Ult Amp % (+6% to +20%)
    case 'charm': return Math.min(10, Math.max(3, Math.round(baseStatVal * 0.15))); // Evasion % (+3% to +10%)
    default: return baseStatVal * 2;
  }
}

/**
 * Ascends a 5★ Relic to 6★
 */
export function ascendRelicData(relic) {
  if (relic.stars !== 5) {
    throw new Error('Only 5★ Relics can be ascended to 6★!');
  }
  if (relic.level < 15) {
    throw new Error('Relic must be enhanced to +15 before ascending!');
  }

  relic.stars = 6;
  relic.rarity = 'MYTHICAL';
  relic.name = `Ascended ${relic.name.replace(/^Ascended\s+/, '')}`;

  // Unlock 5th substat slot
  if (!Array.isArray(relic.substats)) relic.substats = [];
  const usedIds = relic.substats.map(s => s.typeId);
  const remainingPool = RELIC_SUBSTAT_TYPES.filter(s => !usedIds.includes(s.id));
  if (remainingPool.length > 0) {
    const picked = remainingPool[Math.floor(Math.random() * remainingPool.length)];
    relic.substats.push(rollSingleSubstat(picked));
  }

  // Recalculate main stat with 6★ multiplier
  relic.mainStatValue = calculateRelicMainStat(relic.slotTypeId, 6, relic.level);
  return relic;
}

/**
 * Generates a unique Relic instance (3★ to 6★)
 */
export function createRelicInstance({ setId, slotTypeId, rarity = 'COMMON', stars, level = 1 }) {
  const godSet = GREEK_GOD_SETS[setId] || GREEK_GOD_SETS.hades;
  const slotType = RELIC_SLOT_TYPES.find(s => s.id === slotTypeId) || RELIC_SLOT_TYPES[0];

  // Resolve star rating (3★ base, up to 6★)
  let resolvedStars = stars;
  if (!resolvedStars) {
    const rUpper = (rarity || 'COMMON').toUpperCase();
    if (rUpper === 'MYTHICAL' || rUpper === 'TRANSCENDENT') resolvedStars = 6;
    else if (rUpper === 'LEGENDARY') resolvedStars = 5;
    else if (rUpper === 'EPIC') resolvedStars = 4;
    else resolvedStars = 3;
  }
  resolvedStars = Math.max(3, Math.min(6, resolvedStars));

  const starTier = RELIC_STAR_TIERS[resolvedStars];
  let mainStatName = 'Bonus Power';
  switch (slotType.id) {
    case 'headgear': mainStatName = 'Bonus Max HP'; break;
    case 'totem': mainStatName = 'Shield Strength'; break;
    case 'ring': mainStatName = 'Bonus ATK Power'; break;
    case 'necklace': mainStatName = 'Mana Replenish'; break;
    case 'orb': mainStatName = 'Ult Amp'; break;
    case 'charm': mainStatName = 'Evasion Rating'; break;
  }

  const mainStatValue = calculateRelicMainStat(slotType.id, resolvedStars, level);
  const substats = generateRelicSubstats({ stars: resolvedStars, mainStatName });

  const rarityName = resolvedStars === 6 ? 'Mythical'
    : resolvedStars === 5 ? 'Legendary'
    : resolvedStars === 4 ? 'Epic'
    : 'Rare';

  return {
    uid: `relic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: 'relic',
    setId: godSet.id,
    setName: godSet.name,
    slotTypeId: slotType.id,
    slotName: slotType.name,
    name: resolvedStars === 6 ? `Ascended ${godSet.god}'s ${slotType.name}` : `${godSet.god}'s ${slotType.name}`,
    icon: slotType.icon,
    godIcon: godSet.icon,
    stars: resolvedStars,
    rarity: rarityName.toUpperCase(),
    level,
    mainStatName,
    mainStatValue,
    substats,
    color: godSet.color,
    accentColor: godSet.accentColor,
    equippedToSpiritId: null
  };
}

/**
 * Generates a unique Weapon instance
 */
export function createWeaponInstance({ weaponTypeId, rarity = 'COMMON', level = 1 }) {
  const wType = WEAPON_TYPES.find(w => w.id === weaponTypeId) || WEAPON_TYPES[0];
  const rarityObj = EQUIPMENT_RARITIES[rarity] || EQUIPMENT_RARITIES.COMMON;
  const basePower = Math.round(25 * rarityObj.multiplier * (1 + (level - 1) * 0.2));

  return {
    uid: `wpn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: 'weapon',
    weaponTypeId: wType.id,
    name: `${rarityObj.name} ${wType.name}`,
    icon: wType.icon,
    rarity,
    level,
    atkPower: basePower,
    critRate: Math.min(30, Math.round(5 * rarityObj.multiplier)),
    ultAmp: Math.min(40, Math.round(8 * rarityObj.multiplier)),
    color: rarityObj.color,
    equippedToSpiritId: null
  };
}

export const MAX_WEAPON_LEVEL = 15;

/**
 * Calculates the resource cost to enhance a weapon to the next level
 */
export function getWeaponEnhanceCost(weapon) {
  const currentLevel = weapon.level || 1;
  if (currentLevel >= MAX_WEAPON_LEVEL) return null;
  const nextLevel = currentLevel + 1;
  const rarityObj = EQUIPMENT_RARITIES[weapon.rarity] || EQUIPMENT_RARITIES.COMMON;
  const mult = rarityObj.multiplier || 1.0;

  const shardCost = Math.round(45 * nextLevel * (mult * 0.5));
  const isMilestone = nextLevel % 3 === 0;
  const essenceCost = isMilestone ? Math.round(nextLevel * 1.5 + mult) : 0;

  return { nextLevel, shardCost, essenceCost, isMilestone };
}

/**
 * Enhances a weapon by 1 level (up to MAX_WEAPON_LEVEL), scaling ATK Power and milestone secondary stats
 */
export function enhanceWeaponData(weapon) {
  const currentLevel = weapon.level || 1;
  if (currentLevel >= MAX_WEAPON_LEVEL) {
    throw new Error(`Weapon is already at maximum enhancement level (+${MAX_WEAPON_LEVEL})!`);
  }

  weapon.level = currentLevel + 1;
  const rarityObj = EQUIPMENT_RARITIES[weapon.rarity] || EQUIPMENT_RARITIES.COMMON;
  const mult = rarityObj.multiplier || 1.0;

  // Enhance primary ATK Power
  const growth = Math.max(6, Math.round(25 * mult * 0.22));
  weapon.atkPower = (weapon.atkPower || Math.round(25 * mult)) + growth;

  // Milestone triggers at +3, +6, +9, +12, +15 for Crit Rate and Ult Amp
  if (weapon.level % 3 === 0) {
    weapon.critRate = Math.min(35, (weapon.critRate || Math.round(5 * mult)) + 1);
    weapon.ultAmp = Math.min(45, (weapon.ultAmp || Math.round(8 * mult)) + 2);
  }

  return weapon;
}
