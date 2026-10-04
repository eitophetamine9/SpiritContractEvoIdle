/**
 * Greek God Relics & Equipment System
 * Defines Weapons, 6 Relic Slots, and 8 Greek God Sets with 2-pc and 4-pc Set Bonuses.
 */

export const RELIC_SLOT_TYPES = [
  { id: 'crown', name: 'Crown', icon: '👑', desc: 'Symbol of divine authority (HP & MP)' },
  { id: 'goblet', name: 'Goblet', icon: '🍷', desc: 'Chalice of primordial life (Shield & Healing)' },
  { id: 'feather', name: 'Feather', icon: '🪶', desc: 'Plume of celestial winds (Evasion & Speed)' },
  { id: 'ring', name: 'Ring', icon: '💍', desc: 'Band of celestial dominance (ATK & Crit)' },
  { id: 'pendant', name: 'Pendant', icon: '📿', desc: 'Amulet of astral vigor (Mana Replenish)' },
  { id: 'aegis', name: 'Aegis', icon: '🛡️', desc: 'Buckler of legendary resolve (Armor & Ult Amp)' }
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
  EPIC: { name: 'Epic', multiplier: 2.1, color: '#9b59b6', border: '#8e44ad' },
  LEGENDARY: { name: 'Legendary', multiplier: 2.8, color: '#f39c12', border: '#d35400' },
  MYTHICAL: { name: 'Mythical', multiplier: 3.8, color: '#e74c3c', border: '#c0392b' }
};

/**
 * Generates a unique Relic instance
 */
export function createRelicInstance({ setId, slotTypeId, rarity = 'COMMON', level = 1 }) {
  const godSet = GREEK_GOD_SETS[setId] || GREEK_GOD_SETS.hades;
  const slotType = RELIC_SLOT_TYPES.find(s => s.id === slotTypeId) || RELIC_SLOT_TYPES[0];
  const rarityObj = EQUIPMENT_RARITIES[rarity] || EQUIPMENT_RARITIES.COMMON;

  // Base stat calculations
  const baseStatVal = Math.round(15 * rarityObj.multiplier * (1 + (level - 1) * 0.15));

  let mainStatName = 'Bonus Power';
  let mainStatValue = baseStatVal;

  switch (slotType.id) {
    case 'crown':
      mainStatName = 'Bonus Max HP';
      mainStatValue = baseStatVal * 8;
      break;
    case 'goblet':
      mainStatName = 'Shield Strength';
      mainStatValue = baseStatVal * 5;
      break;
    case 'feather':
      mainStatName = 'Evasion Rating';
      mainStatValue = Math.min(25, Math.round(baseStatVal * 0.4));
      break;
    case 'ring':
      mainStatName = 'Bonus ATK Power';
      mainStatValue = baseStatVal * 4;
      break;
    case 'pendant':
      mainStatName = 'Mana Gain';
      mainStatValue = Math.min(30, Math.round(baseStatVal * 0.5));
      break;
    case 'aegis':
      mainStatName = 'Ult Amp';
      mainStatValue = Math.min(35, Math.round(baseStatVal * 0.6));
      break;
  }

  return {
    uid: `relic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: 'relic',
    setId: godSet.id,
    setName: godSet.name,
    slotTypeId: slotType.id,
    slotName: slotType.name,
    name: `${godSet.god}'s ${slotType.name}`,
    icon: slotType.icon,
    godIcon: godSet.icon,
    rarity,
    level,
    mainStatName,
    mainStatValue,
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
