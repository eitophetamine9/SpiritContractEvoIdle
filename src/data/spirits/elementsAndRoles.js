import { getElementIcon, getRoleIcon, getGameIcon } from '../../ui/icons/gameIcons.js';

export const ELEMENTS = {
  FIRE: { name: 'Fire', color: '#ff4438', bg: '#2b0d0c', border: '#ff6b5c', iconKey: 'elementFire', symbol: getElementIcon('FIRE', { size: '13px' }) },
  WATER: { name: 'Water', color: '#00c3ff', bg: '#081f2f', border: '#42d4ff', iconKey: 'elementWater', symbol: getElementIcon('WATER', { size: '13px' }) },
  EARTH: { name: 'Earth', color: '#2ecc71', bg: '#0b2413', border: '#58d68d', iconKey: 'elementEarth', symbol: getElementIcon('EARTH', { size: '13px' }) },
  WIND: { name: 'Wind', color: '#e0c93c', bg: '#29250a', border: '#f7dc6f', iconKey: 'elementWind', symbol: getElementIcon('WIND', { size: '13px' }) },
  DARK: { name: 'Void', color: '#b342ff', bg: '#210c30', border: '#c766ff', iconKey: 'elementDark', symbol: getElementIcon('DARK', { size: '13px' }) },
  LIGHT: { name: 'Solar', color: '#ffb300', bg: '#2f2005', border: '#ffc107', iconKey: 'elementLight', symbol: getElementIcon('LIGHT', { size: '13px' }) },
};

export const RARITIES = {
  COMMON: { name: 'Common', order: 1, multiplier: 1.0, color: '#bdc3c7', bg: '#1c2226', border: '#5a6268', glow: 'rgba(189,195,199,0.3)' },
  UNCOMMON: { name: 'Uncommon', order: 2, multiplier: 1.18, color: '#2ecc71', bg: '#0b2413', border: '#27ae60', glow: 'rgba(46,204,113,0.35)' },
  RARE: { name: 'Rare', order: 3, multiplier: 1.35, color: '#3498db', bg: '#0a1d2e', border: '#2980b9', glow: 'rgba(52,152,219,0.4)' },
  EPIC: { name: 'Epic', order: 4, multiplier: 1.6, color: '#9b59b6', bg: '#220d2e', border: '#8e44ad', glow: 'rgba(155,89,182,0.45)' },
  LEGENDARY: { name: 'Legendary', order: 5, multiplier: 2.1, color: '#f39c12', bg: '#2b1b04', border: '#e67e22', glow: 'rgba(243,156,18,0.5)' },
  MYTHICAL: { name: 'Mythical', order: 6, multiplier: 2.8, color: '#e74c3c', bg: '#2d0909', border: '#c0392b', glow: 'rgba(231,76,60,0.6)' },
  TRANSCENDENT: { name: 'Transcendent', order: 7, multiplier: 4.0, color: '#00ffff', bg: '#04272b', border: '#00d2d3', glow: 'rgba(0,255,255,0.7)' }
};

export function getRarityInfo(rarity) {
  const key = (rarity || 'COMMON').toUpperCase();
  return RARITIES[key] || RARITIES.COMMON;
}

/**
 * 5 Tactical Spirit Roles & Targeting Profiles
 */
export const ROLES = {
  MAIN_DPS: {
    id: 'MAIN_DPS',
    name: 'Main DPS',
    title: 'Executioner & Frontline Cleaver',
    iconKey: 'roleMainDps',
    icon: getRoleIcon('MAIN_DPS', { size: '14px' }),
    color: '#ff4757',
    bg: 'rgba(255, 71, 87, 0.15)',
    border: '#ff4757',
    optimalColumn: 'back_or_mid',
    optimalColumnLabel: 'Backline / Midline',
    baseThreat: 50,
    desc: 'High ATK, Crit Rate & execution burst. Deals devastating boss and single-target damage.'
  },
  SUB_DPS: {
    id: 'SUB_DPS',
    name: 'Sub-DPS',
    title: 'Elemental Flanker & Cleaver',
    iconKey: 'roleSubDps',
    icon: getRoleIcon('SUB_DPS', { size: '14px' }),
    color: '#ffa502',
    bg: 'rgba(255, 165, 2, 0.15)',
    border: '#ffa502',
    optimalColumn: 'mid',
    optimalColumnLabel: 'Midline',
    baseThreat: 85,
    desc: 'High Attack Cadence, multi-target cleaves, poison/DoT, and armor shred.'
  },
  TANK: {
    id: 'TANK',
    name: 'Tank (Guardian)',
    title: 'Vanguard Bulwark & Protector',
    iconKey: 'roleTank',
    icon: getRoleIcon('TANK', { size: '14px' }),
    color: '#1e90ff',
    bg: 'rgba(30, 144, 255, 0.15)',
    border: '#1e90ff',
    optimalColumn: 'front',
    optimalColumnLabel: 'Frontline',
    baseThreat: 220,
    desc: 'Massive HP, high Armor, and innate Taunt. Intercepts incoming blows to protect the squad.'
  },
  SUPPORT: {
    id: 'SUPPORT',
    name: 'Support',
    title: 'Tactical Buffer & Energy Battery',
    iconKey: 'roleSupport',
    icon: getRoleIcon('SUPPORT', { size: '14px' }),
    color: '#9b59b6',
    bg: 'rgba(155, 89, 182, 0.15)',
    border: '#9b59b6',
    optimalColumn: 'mid_or_back',
    optimalColumnLabel: 'Midline / Backline',
    baseThreat: 60,
    desc: 'Accelerates party Mana replenishment, amplifies damage, and bestows squad shields.'
  },
  HEALER: {
    id: 'HEALER',
    name: 'Healer',
    title: 'Restorer of Vitality & Life Bloom',
    iconKey: 'roleHealer',
    icon: getRoleIcon('HEALER', { size: '14px' }),
    color: '#2ed573',
    bg: 'rgba(46, 213, 115, 0.15)',
    border: '#2ed573',
    optimalColumn: 'back',
    optimalColumnLabel: 'Backline',
    baseThreat: 35,
    desc: 'Sustained party regeneration, emergency burst heals, revives, and protective barriers.'
  }
};


/**
 * Normalized stat weighting multipliers per role
 */
export const ROLE_STAT_WEIGHTS = {
  MAIN_DPS: { atkMult: 1.35, defMult: 0.75, hpMult: 0.85, spdBase: 1.05, critRate: 14, critDmg: 165, threat: 50 },
  SUB_DPS:  { atkMult: 1.15, defMult: 0.85, hpMult: 0.95, spdBase: 1.25, critRate: 10, critDmg: 150, threat: 85 },
  TANK:     { atkMult: 0.65, defMult: 1.60, hpMult: 1.55, spdBase: 0.85, critRate: 5,  critDmg: 130, threat: 220 },
  SUPPORT:  { atkMult: 0.85, defMult: 1.00, hpMult: 1.05, spdBase: 1.15, critRate: 6,  critDmg: 140, threat: 60 },
  HEALER:   { atkMult: 0.75, defMult: 1.10, hpMult: 1.15, spdBase: 1.00, critRate: 5,  critDmg: 140, threat: 35 }
};

export function getRoleInfo(roleKey) {
  const key = (roleKey || 'MAIN_DPS').toUpperCase();
  return ROLES[key] || ROLES.MAIN_DPS;
}

export const ELEMENTAL_MATCHUPS = {
  FIRE: { strongAgainst: 'EARTH', weakAgainst: 'WATER' },
  EARTH: { strongAgainst: 'WIND', weakAgainst: 'FIRE' },
  WIND: { strongAgainst: 'WATER', weakAgainst: 'EARTH' },
  WATER: { strongAgainst: 'FIRE', weakAgainst: 'WIND' },
  LIGHT: { strongAgainst: 'DARK', weakAgainst: null, mutualWith: 'DARK' },
  DARK: { strongAgainst: 'LIGHT', weakAgainst: null, mutualWith: 'LIGHT' }
};

export function getElementalMultiplier(atkElement, defElement) {
  if (!atkElement || !defElement) return 1.0;
  const atk = (atkElement || '').toUpperCase();
  const def = (defElement || '').toUpperCase();
  if (atk === def) return 1.0;

  if ((atk === 'LIGHT' && def === 'DARK') || (atk === 'DARK' && def === 'LIGHT')) {
    return 1.30; // +30% celestial burst
  }

  const matchup = ELEMENTAL_MATCHUPS[atk];
  if (matchup && matchup.strongAgainst === def) {
    return 1.25; // +25% advantage
  }
  if (matchup && matchup.weakAgainst === def) {
    return 0.85; // -15% disadvantage
  }
  return 1.0;
}

/**
 * Calculates Elemental Team Resonance Buffs from the active 5-spirit party
 */
export function calculatePartyResonance(spirits = []) {
  const counts = { FIRE: 0, WATER: 0, EARTH: 0, WIND: 0, LIGHT: 0, DARK: 0 };
  spirits.forEach(s => {
    if (s && s.element) {
      const key = s.element.toUpperCase();
      if (counts[key] !== undefined) counts[key]++;
    }
  });

  const buffs = {
    atkPercent: 0,
    maxHpPercent: 0,
    shieldPercent: 0,
    evasionFlat: 0,
    critDmgPercent: 0,
    piercePercent: 0,
    allStatsPercent: 0,
    activeLabels: []
  };

  if (counts.FIRE >= 2) {
    buffs.atkPercent += 0.12;
    buffs.activeLabels.push(`${getElementIcon('FIRE', { size: '14px' })} Blaze Resonance (+12% ATK)`);
  }
  if (counts.WATER >= 2) {
    buffs.maxHpPercent += 0.15;
    buffs.activeLabels.push(`${getElementIcon('WATER', { size: '14px' })} Ocean Resonance (+15% HP)`);
  }
  if (counts.EARTH >= 2) {
    buffs.shieldPercent += 0.15;
    buffs.activeLabels.push(`${getElementIcon('EARTH', { size: '14px' })} Gaia Resonance (+15% Shield)`);
  }
  if (counts.WIND >= 2) {
    buffs.evasionFlat += 0.10;
    buffs.activeLabels.push(`${getElementIcon('WIND', { size: '14px' })} Zephyr Resonance (+10% Evasion)`);
  }
  if (counts.LIGHT >= 2) {
    buffs.critDmgPercent += 0.15;
    buffs.activeLabels.push(`${getElementIcon('LIGHT', { size: '14px' })} Solar Resonance (+15% Crit DMG)`);
  }
  if (counts.DARK >= 2) {
    buffs.piercePercent += 0.10;
    buffs.activeLabels.push(`${getElementIcon('DARK', { size: '14px' })} Nether Resonance (+10% Pierce)`);
  }

  const distinctElements = Object.values(counts).filter(c => c > 0).length;
  if (distinctElements >= 5) {
    buffs.allStatsPercent += 0.10;
    buffs.activeLabels.push(`${getGameIcon('sparkle', { size: '14px', color: '#facc15' })} Prismatic Resonance (+10% All Stats)`);
  }

  return buffs;
}

