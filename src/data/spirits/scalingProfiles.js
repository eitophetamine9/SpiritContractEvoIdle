import { SPIRIT_SPECIES } from './speciesCatalog.js';
import { RARITIES, ROLES, ROLE_STAT_WEIGHTS } from './elementsAndRoles.js';
import { REBIRTH_CONFIG } from './progressionConfig.js';
export const SCALING_PROFILES = {
  // Healers (6 Spirits)
  'caterpillar_spirit': { archetype: 'HEALER', primaryStat: 'hp', secondaryStat: 'manaReplenish', healRatio: 0.12, healBase: 60, shieldRatio: 0.15, title: 'Vitality Bloom' },
  'vitality_dog': { archetype: 'HEALER', primaryStat: 'hp', secondaryStat: 'def', healRatio: 0.14, healBase: 120, shieldRatio: 0.20, title: 'Guardian Vitality' },
  'elegant_butterfly': { archetype: 'HEALER', primaryStat: 'hp', secondaryStat: 'manaReplenish', healRatio: 0.16, healBase: 180, cleanse: true, title: 'Lepidopteran Grace' },
  'mystical_butterfly': { archetype: 'HEALER', primaryStat: 'hp', secondaryStat: 'ultAmp', healRatio: 0.22, healBase: 450, regenRatio: 0.05, title: 'Celestial Metamorphosis' },
  'bear_of_dreams': { archetype: 'HEALER', primaryStat: 'hp', secondaryStat: 'def', healRatio: 0.25, healBase: 800, shieldRatio: 0.30, title: 'Dream Ward' },
  'high_elf': { archetype: 'HEALER', primaryStat: 'hp', secondaryStat: 'manaReplenish', healRatio: 0.26, healBase: 950, mpGrant: 25, title: 'Elven Rejuvenation' },

  // Tanks / Guardians (12 Spirits)
  'dog_spirit': { archetype: 'TANK', primaryStat: 'hp', secondaryStat: 'def', attackRatio: 0.18, shieldRatio: 0.22, title: 'Primal Hound' },
  'guardian_dog': { archetype: 'TANK', primaryStat: 'hp', secondaryStat: 'def', attackRatio: 0.24, shieldRatio: 0.30, title: 'Celestial Vanguard' },
  'bull_spirit': { archetype: 'TANK', primaryStat: 'def', secondaryStat: 'hp', attackRatio: 1.60, shieldRatio: 2.00, title: 'Iron Bastion' },
  'raging_bull': { archetype: 'TANK', primaryStat: 'def', secondaryStat: 'atk', attackRatio: 1.90, shieldRatio: 2.20, title: 'Berserk Bulwark' },
  'elemental_bull': { archetype: 'TANK', primaryStat: 'def', secondaryStat: 'hp', attackRatio: 2.20, shieldRatio: 2.60, title: 'Tectonic Granite' },
  'bear_spirit': { archetype: 'TANK', primaryStat: 'hp', secondaryStat: 'def', attackRatio: 0.20, shieldRatio: 0.24, mitigation: 0.15, title: 'Ursine Fortitude' },
  'highlord_bear': { archetype: 'TANK', primaryStat: 'hp', secondaryStat: 'def', attackRatio: 0.26, shieldRatio: 0.25, title: 'Highlord Rampart' },
  'cosmic_bear_ursalite': { archetype: 'TANK', primaryStat: 'hp', secondaryStat: 'def', attackRatio: 0.35, shieldRatio: 0.40, title: 'Nebula Colossus' },
  'komodo_dragon': { archetype: 'TANK', primaryStat: 'def', secondaryStat: 'hp', attackRatio: 1.75, shieldRatio: 2.20, reflectRatio: 0.20, title: 'Caustic Carapace' },
  'huge_albino_anaconda': { archetype: 'TANK', primaryStat: 'hp', secondaryStat: 'def', attackRatio: 0.25, shieldRatio: 0.28, selfHealRatio: 0.10, title: 'Gilded Coil' },
  'leviathan_behemoth': { archetype: 'TANK', primaryStat: 'hp', secondaryStat: 'def', attackRatio: 0.30, shieldRatio: 0.35, title: 'Abyssal Tidal Wall' },
  'leviathan_abyssal_primordial': { archetype: 'TANK', primaryStat: 'hp', secondaryStat: 'ultAmp', attackRatio: 0.42, shieldRatio: 0.45, drainEnergy: true, title: 'Primordial Ocean' },

  // Main DPS Executioners (18 Spirits)
  'minotaur': { archetype: 'MAIN_DPS', primaryStat: 'def', secondaryStat: 'critRate', attackRatio: 2.80, shieldRatio: 3.00, stunOnCrit: true, title: 'Labyrinth Dominator' },
  'chicken_spirit': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critRate', burstRatio: 2.40, executeRatio: 0.15, title: 'Avian Blitz' },
  'battle_chicken': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critRate', burstRatio: 3.20, executeRatio: 0.25, title: 'Roost Cleaver' },
  'dino_genus_chicken': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critDmg', burstRatio: 5.80, firstHitCrit: true, title: 'Apex Raptor' },
  'furious_cat': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critRate', burstRatio: 3.10, cadenceBoost: 0.15, title: 'Frenzy Claws' },
  'shark_spirit': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'hp', burstRatio: 2.60, hpRatio: 0.06, bleed: true, title: 'Bloodfang' },
  'great_white_shark': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critRate', burstRatio: 3.80, hpRatio: 0.08, vsBleedBonus: 0.30, title: 'Apex Predator' },
  'megalodon': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critDmg', burstRatio: 6.20, hpRatio: 0.12, resetOnKill: true, title: 'Abyssal Maw' },
  'cosmic_oceanic_devourer': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'ultAmp', burstRatio: 9.50, hpRatio: 0.18, defPierce: 0.40, title: 'Cosmic Devourer' },
  'drake': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critDmg', burstRatio: 6.50, burnAoe: 0.30, title: 'Draconic Inferno' },
  'fallen_warrior_spirit': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critRate', burstRatio: 4.50, missingHpAmp: true, title: 'Cursed Blade' },
  'sovereign_warrior': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critDmg', burstRatio: 7.20, thresholdExecute: 0.20, title: 'Ruination Sovereign' },
  'dreadlord_warrior': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critDmg', burstRatio: 11.00, lifesteal: 0.30, title: 'Dreadlord Execution' },
  'solaris_lion_pride': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critDmg', burstRatio: 8.50, selfBuffAtk: 0.20, title: 'Solar Flare' },
  'solaris_the_one': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critDmg', burstRatio: 14.50, ccImmune: true, title: 'The One Ultimate' },
  'chrono_hatchling': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'manaReplenish', burstRatio: 2.80, actionBoost: 0.10, title: 'Temporal Spurt' },
  'chrono_drake': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'manaReplenish', burstRatio: 4.80, teamSpeedBuff: 0.15, title: 'Chronos Distortion' },
  'ouroboros_time_sovereign': { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'ultAmp', burstRatio: 9.20, cdrGrant: 3.0, title: 'Ouroboros Loop' },

  // Sub-DPS Flankers (11 Spirits)
  'cat_spirit': { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'critRate', burstRatio: 1.80, bonusCritRate: 10, title: 'Nimble Pounce' },
  'lizard_spirit': { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'hp', burstRatio: 1.60, hpRatio: 0.04, defShred: 0.10, title: 'Caustic Dart' },
  'multi_venom_lizard': { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'def', burstRatio: 2.40, poisonStack: true, title: 'Venom Hydra' },
  'python_spirit': { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'critRate', burstRatio: 2.00, slowPercent: 0.20, title: 'Constrictor Coil' },
  'highlord_python': { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'critRate', burstRatio: 2.90, vsPoisonBonus: 0.30, title: 'Serpentine Wither' },
  'wyrm': { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'ultAmp', burstRatio: 5.80, defShred: 0.25, title: 'Nether Wyrm Breath' },
  'gelda_ashes_empress': { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'critRate', burstRatio: 5.40, teamHealOnHit: 0.15, title: 'Ashen Siphon' },
  'gelda_blood_sovereign': { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'critDmg', burstRatio: 8.80, drainMaxHp: 0.10, title: 'Sanguine Sovereign' },
  'baphomet_initiate': { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'manaReplenish', burstRatio: 2.10, mpGainOnHit: 15, title: 'Nether Pact' },
  'baphomet_voidbinder': { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'ultAmp', burstRatio: 4.20, pullBackline: true, title: 'Void Gravitation' },
  'baphomet_archdemon_lord': { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'critDmg', burstRatio: 7.60, defShred: 0.25, title: 'Archdemon Cataclysm' },

  // Supports & Energy Batteries (7 Spirits)
  'wisp_spirit': { archetype: 'SUPPORT', primaryStat: 'manaReplenish', secondaryStat: 'hp', shieldRatio: 0.15, mpBuffPercent: 0.20, title: 'Aether Luminescence' },
  'elemental_cat': { archetype: 'SUPPORT', primaryStat: 'manaReplenish', secondaryStat: 'atk', burstRatio: 2.60, dmgReduction: 0.15, title: 'Prismatic Melody' },
  'astraea_valkyrie': { archetype: 'SUPPORT', primaryStat: 'manaReplenish', secondaryStat: 'ultAmp', shieldRatio: 2.50, critDmgBuff: 0.25, title: 'Star-Forged Aegis' },
  'astraea_celestial_queen': { archetype: 'SUPPORT', primaryStat: 'manaReplenish', secondaryStat: 'ultAmp', burstRatio: 6.20, ultAmpBuff: 0.40, title: 'Celestial Zenith' },
  'dawn_herald': { archetype: 'SUPPORT', primaryStat: 'atk', secondaryStat: 'critRate', healRatio: 1.40, healBase: 80, canCrit: true, title: 'Radiant Faith' },
  'seraph_guardian': { archetype: 'SUPPORT', primaryStat: 'atk', secondaryStat: 'critRate', healRatio: 1.90, healBase: 250, canCrit: true, atkBuffPercent: 0.15, title: 'Seraphic Blessing' },
  'archangel_uriel': { archetype: 'SUPPORT', primaryStat: 'atk', secondaryStat: 'critDmg', healRatio: 2.80, healBase: 850, canCrit: true, critHealMult: 2.5, title: 'Archangel Miracle' }
};

export function getScalingProfile(speciesOrId) {
  if (!speciesOrId) {
    return { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critRate', burstRatio: 3.0, title: 'Striker' };
  }
  const id = typeof speciesOrId === 'object' ? (speciesOrId.speciesId || speciesOrId.id) : speciesOrId;
  if (SCALING_PROFILES[id]) return SCALING_PROFILES[id];
  const role = getSpiritRole(speciesOrId);
  if (role === 'HEALER') return { archetype: 'HEALER', primaryStat: 'hp', secondaryStat: 'manaReplenish', healRatio: 0.15, healBase: 100, shieldRatio: 0.18, title: 'Vitality Bloom' };
  if (role === 'TANK') return { archetype: 'TANK', primaryStat: 'def', secondaryStat: 'hp', attackRatio: 1.80, shieldRatio: 2.20, title: 'Iron Bastion' };
  if (role === 'SUPPORT') return { archetype: 'SUPPORT', primaryStat: 'manaReplenish', secondaryStat: 'ultAmp', shieldRatio: 1.50, mpBuffPercent: 0.20, title: 'Aether Battery' };
  if (role === 'SUB_DPS') return { archetype: 'SUB_DPS', primaryStat: 'atk', secondaryStat: 'critRate', burstRatio: 2.50, defShred: 0.15, title: 'Shadow Flanker' };
  return { archetype: 'MAIN_DPS', primaryStat: 'atk', secondaryStat: 'critDmg', burstRatio: 4.0, executeRatio: 0.25, title: 'Executioner' };
}

/**
 * Formula to calculate Spirit combat power (scales with level, rarity, and rebirth)
 * Harmonized growth curve prevents runaway blitz while rewarding leveling.
 */
export function calculateSpiritPower(species, level, rarityName, ascensionLevel = 0) {
  const effectiveRarity = rarityName ? rarityName.toUpperCase() : (species.baseRarity || 'COMMON');
  const rarityObj = RARITIES[effectiveRarity] || RARITIES.COMMON;
  const baseGrowth = (species.growthRate || 0.18);
  const effectiveGrowth = Math.min(0.24, Math.max(0.10, baseGrowth * 0.75));
  const lvlMult = 1 + (level - 1) * effectiveGrowth;
  const ascMult = 1 + (ascensionLevel || 0) * 0.12;
  return Math.max(1, Math.round(species.basePower * lvlMult * rarityObj.multiplier * ascMult));
}

/**
 * Formula to calculate Spirit Maximum Health Points (HP)
 * Robust scaling to ensure survivability in two-way battles
 */
export function calculateSpiritMaxHp(species, level, rarityName, ascensionLevel = 0) {
  const effectiveRarity = rarityName ? rarityName.toUpperCase() : (species.baseRarity || 'COMMON');
  const rarityObj = RARITIES[effectiveRarity] || RARITIES.COMMON;
  const lvlMult = 1 + (level - 1) * 0.18;
  const ascMult = 1 + (ascensionLevel || 0) * 0.12;
  return Math.max(80, Math.round(species.basePower * 12 * lvlMult * rarityObj.multiplier * ascMult));
}

/**
 * Calculates in-depth combat attributes (ATK, DEF, HP, SPD, CRIT%, Threat) based on role and progression.
 * Returns both flat top-level numbers and a structured 7-Core-Attribute dual breakdown (Base + Bonus = Total).
 */
export function calculateSpiritStats(speciesOrSpirit, level = 1, rarityName = null, ascensionLevel = 0) {
  if (!speciesOrSpirit) return null;
  const species = typeof speciesOrSpirit === 'string'
    ? SPIRIT_SPECIES[speciesOrSpirit]
    : (speciesOrSpirit.speciesId ? SPIRIT_SPECIES[speciesOrSpirit.speciesId] : speciesOrSpirit);
  if (!species) return null;

  const actualLevel = typeof speciesOrSpirit === 'object' && speciesOrSpirit.level ? speciesOrSpirit.level : level;
  const actualAscension = typeof speciesOrSpirit === 'object' && speciesOrSpirit.ascensionLevel !== undefined
    ? speciesOrSpirit.ascensionLevel
    : (typeof speciesOrSpirit === 'object' && speciesOrSpirit.rebirthLevel !== undefined ? speciesOrSpirit.rebirthLevel : ascensionLevel);
  const rawRarity = (typeof speciesOrSpirit === 'object' && speciesOrSpirit.rarity)
    ? speciesOrSpirit.rarity
    : (rarityName || species.baseRarity || 'COMMON');

  const rarityObj = RARITIES[rawRarity.toUpperCase()] || RARITIES.COMMON;
  const roleKey = species.role || 'MAIN_DPS';
  const roleInfo = ROLES[roleKey] || ROLES.MAIN_DPS;
  const weights = ROLE_STAT_WEIGHTS[roleKey] || ROLE_STAT_WEIGHTS.MAIN_DPS;
  const scalingProfile = getScalingProfile(species);

  const baseGrowth = (species.growthRate || 0.18);
  const effectiveGrowth = Math.min(0.24, Math.max(0.10, baseGrowth * 0.75));
  const lvlMult = 1 + (actualLevel - 1) * effectiveGrowth;
  const ascMult = 1 + (actualAscension || 0) * 0.12;

  const baseAtk = Math.max(5, Math.round(species.basePower * weights.atkMult * lvlMult * rarityObj.multiplier * ascMult));
  const baseDef = Math.max(3, Math.round((species.basePower * 0.75) * weights.defMult * (1 + (actualLevel - 1) * 0.14) * rarityObj.multiplier * ascMult));
  const baseMaxHp = Math.max(80, Math.round(species.basePower * 12 * weights.hpMult * (1 + (actualLevel - 1) * 0.18) * rarityObj.multiplier * ascMult));
  const spd = parseFloat((weights.spdBase * (1 + (actualLevel - 1) * 0.005)).toFixed(2));
  const critRate = Math.min(60, weights.critRate + Math.floor(actualLevel / 10));
  const critDmg = weights.critDmg + Math.floor(actualLevel / 5);
  const threat = Math.round(weights.threat * (1 + (actualLevel - 1) * 0.02));
  const power = Math.max(1, Math.round(species.basePower * lvlMult * rarityObj.multiplier * ascMult));
  const ultAmp = (actualAscension >= 5) ? 20 : 0;
  const manaReplenish = 100;

  // Dual-tier 7 core attributes structure
  const attributes = {
    hp: {
      name: 'Max HP',
      symbol: '💚',
      base: baseMaxHp,
      bonus: 0,
      total: baseMaxHp,
      percent: 0,
      unit: ''
    },
    atk: {
      name: 'ATK Power',
      symbol: '⚔️',
      base: baseAtk,
      bonus: 0,
      total: baseAtk,
      percent: 0,
      unit: ''
    },
    def: {
      name: 'Defense',
      symbol: '🛡️',
      base: baseDef,
      bonus: 0,
      total: baseDef,
      percent: 0,
      unit: ''
    },
    critRate: {
      name: 'CRIT Rate',
      symbol: '🎯',
      base: weights.critRate,
      bonus: Math.floor(actualLevel / 10),
      total: critRate,
      percent: critRate,
      unit: '%'
    },
    critDmg: {
      name: 'CRIT DMG',
      symbol: '💥',
      base: 150,
      bonus: Math.max(0, critDmg - 150),
      total: critDmg,
      percent: critDmg,
      unit: '%'
    },
    ultAmp: {
      name: 'Ult Amp',
      symbol: '🔮',
      base: 0,
      bonus: ultAmp,
      total: ultAmp,
      percent: ultAmp,
      unit: '%'
    },
    manaReplenish: {
      name: 'Mana Replenish',
      symbol: '⚡',
      base: 100,
      bonus: 0,
      total: manaReplenish,
      percent: manaReplenish,
      unit: '%'
    }
  };

  return {
    role: roleKey,
    roleInfo,
    scalingProfile,
    rebirthLevel: actualAscension,
    ascensionLevel: actualAscension,
    atk: baseAtk,
    def: baseDef,
    maxHp: baseMaxHp,
    spd,
    critRate,
    critDmg,
    ultAmp,
    manaReplenish,
    threat,
    power,
    attributes
  };
}

/**
 * Spirit Ultimates (Ults) Catalog
 * Procs at 100% Mana (MP) during two-way combat
 */
