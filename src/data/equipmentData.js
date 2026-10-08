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
      description: 'Procs an AOE dark flame dealing 5% enemy Max HP as DoT for 7s (15s CD).',
      type: 'DOT_AOE',
      percentEnemyMaxHpPerSec: 0.05,
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
      description: 'Strikes all enemies with an instant lightning blast dealing 15% Max HP (45s CD).',
      type: 'BURST_AOE',
      percentEnemyMaxHp: 0.15,
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
      name: 'Zephyr Step',
      description: '+15% Evasion Rate',
      evasionBonus: 0.15
    },
    bonus4pc: {
      name: 'Swift Support',
      description: 'Restores 3% Max HP per second to all party members for 7s (45s CD).',
      type: 'HOT_AOE',
      healPercentPerSec: 0.03,
      durationSec: 7,
      cooldownSec: 45
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
      name: 'Phalanx Discipline',
      description: '+15% Max HP & +10% Armor',
      maxHpBonus: 0.15,
      armorBonus: 0.10
    },
    bonus4pc: {
      name: 'Aegis of Olympus',
      description: 'Negates next fatal blow and reflects 25% incoming damage back to attackers for 6s (60s CD).',
      type: 'DEATH_PREVENTION',
      damageReflect: 0.25,
      durationSec: 6,
      cooldownSec: 60
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
      name: 'Hunter Instinct',
      description: '+15% Crit DMG',
      critDmgBonus: 0.15
    },
    bonus4pc: {
      name: 'Lunar Piercer',
      description: 'Locks onto highest HP enemy, firing an astral arrow dealing 25% true Max HP damage (35s CD).',
      type: 'SNIPER_BURST',
      percentEnemyMaxHp: 0.25,
      cooldownSec: 35
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
 * Relic Substat Catalog
 */
export const RELIC_SUBSTAT_TYPES = [
  { id: 'flat_atk', name: 'Bonus ATK', isPercent: false, min: 15, max: 45, icon: '⚔️' },
  { id: 'flat_hp', name: 'Bonus Max HP', isPercent: false, min: 80, max: 220, icon: '❤️' },
  { id: 'flat_shield', name: 'Shield Strength', isPercent: false, min: 40, max: 120, icon: '🛡️' },
  { id: 'percent_atk', name: 'ATK %', isPercent: true, min: 3.0, max: 7.0, icon: '💥' },
  { id: 'percent_hp', name: 'HP %', isPercent: true, min: 3.5, max: 8.0, icon: '💚' },
  { id: 'crit_rate', name: 'Crit Rate %', isPercent: true, min: 2.0, max: 5.0, icon: '🎯' },
  { id: 'crit_dmg', name: 'Crit DMG %', isPercent: true, min: 6.0, max: 14.0, icon: '⚡' },
  { id: 'mana_regen', name: 'Mana Replenish %', isPercent: true, min: 3.0, max: 6.5, icon: '🔮' },
  { id: 'ult_amp', name: 'Ult Amp %', isPercent: true, min: 4.0, max: 8.5, icon: '✨' },
  { id: 'evasion', name: 'Evasion %', isPercent: true, min: 2.0, max: 4.5, icon: '💨' },
  { id: 'pierce', name: 'Armor Pierce %', isPercent: true, min: 3.0, max: 6.0, icon: '🗡️' }
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
 * Calculates Relic main stat based on slot, stars, and level
 */
export function calculateRelicMainStat(slotTypeId, stars = 3, level = 1) {
  const tier = RELIC_STAR_TIERS[stars] || RELIC_STAR_TIERS[3];
  const baseStatVal = Math.round(18 * tier.multiplier * (1 + (level - 1) * 0.12));

  switch (slotTypeId) {
    case 'headgear': return baseStatVal * 8; // Bonus Max HP
    case 'totem': return baseStatVal * 5;    // Shield Strength
    case 'ring': return baseStatVal * 4;     // Bonus ATK Power
    case 'necklace': return Math.min(45, Math.round(baseStatVal * 0.5)); // Mana Replenish %
    case 'orb': return Math.min(50, Math.round(baseStatVal * 0.6));      // Ult Amp %
    case 'charm': return Math.min(35, Math.round(baseStatVal * 0.4));    // Evasion %
    default: return baseStatVal * 4;
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
