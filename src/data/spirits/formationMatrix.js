/**
 * 3x3 Tactical Formation Grid Specifications
 * Layout: 3 Columns x 3 Rows
 * - Backline (Column 0): Max 1 spirit (Furthest back - Sniper / Main DPS / Healer Anchor)
 * - Midline (Column 1): 2 to 3 spirits (Middle flex - Sub-DPS, Supports)
 * - Frontline (Column 2): 1 to 2 spirits (Front vanguard - Tanks, Bruisers)
 */
export const FORMATION_SLOTS = {
  b1: { id: 'b1', col: 'back', row: 0, label: 'Backline Top', defaultRole: 'HEALER' },
  b2: { id: 'b2', col: 'back', row: 1, label: 'Backline Center', defaultRole: 'MAIN_DPS' },
  b3: { id: 'b3', col: 'back', row: 2, label: 'Backline Bottom', defaultRole: 'HEALER' },

  m1: { id: 'm1', col: 'mid', row: 0, label: 'Midline Top', defaultRole: 'SUB_DPS' },
  m2: { id: 'm2', col: 'mid', row: 1, label: 'Midline Center', defaultRole: 'SUPPORT' },
  m3: { id: 'm3', col: 'mid', row: 2, label: 'Midline Bottom', defaultRole: 'SUB_DPS' },

  f1: { id: 'f1', col: 'front', row: 0, label: 'Frontline Top', defaultRole: 'TANK' },
  f2: { id: 'f2', col: 'front', row: 1, label: 'Frontline Center', defaultRole: 'TANK' },
  f3: { id: 'f3', col: 'front', row: 2, label: 'Frontline Bottom', defaultRole: 'TANK' }
};

export const FORMATION_COLUMNS = {
  back: {
    id: 'back',
    name: 'Backline',
    icon: '🎯',
    slots: ['b1', 'b2', 'b3'],
    minUnits: 0,
    maxUnits: 1,
    threatMultiplier: 0.5,
    perkName: 'Sanctuary Perk',
    perkDesc: '+15% ATK & Healing Potency, -50% threat footprint',
    atkBonusPercent: 15,
    healBonusPercent: 15,
    defBonusPercent: 0
  },
  mid: {
    id: 'mid',
    name: 'Midline',
    icon: '⚡',
    slots: ['m1', 'm2', 'm3'],
    minUnits: 0,
    maxUnits: 3,
    threatMultiplier: 1.0,
    perkName: 'Flank Perk',
    perkDesc: 'Balanced cadence & flexible synergy',
    atkBonusPercent: 0,
    healBonusPercent: 0,
    defBonusPercent: 0
  },
  front: {
    id: 'front',
    name: 'Frontline',
    icon: '🛡️',
    slots: ['f1', 'f2', 'f3'],
    minUnits: 0,
    maxUnits: 2,
    threatMultiplier: 2.0,
    perkName: 'Vanguard Perk',
    perkDesc: '+15% Armor/DEF, 2.0x threat aggro draw',
    atkBonusPercent: 0,
    healBonusPercent: 0,
    defBonusPercent: 15
  }
};

/**
 * Validates a formation slot mapping object { b1: id, b2: null, ... }
 */
export function validateFormationGrid(formation) {
  if (!formation || typeof formation !== 'object') {
    return { valid: false, error: 'Invalid formation object' };
  }

  let backCount = 0;
  let midCount = 0;
  let frontCount = 0;
  let totalCount = 0;
  const seenSpirits = new Set();

  for (const [slotId, spiritId] of Object.entries(formation)) {
    if (!spiritId) continue;
    if (seenSpirits.has(spiritId)) {
      return { valid: false, error: `Duplicate spirit ${spiritId} positioned in multiple slots` };
    }
    seenSpirits.add(spiritId);
    totalCount++;

    const slotDef = FORMATION_SLOTS[slotId];
    if (!slotDef) {
      return { valid: false, error: `Unknown formation slot "${slotId}"` };
    }

    if (slotDef.col === 'back') backCount++;
    else if (slotDef.col === 'mid') midCount++;
    else if (slotDef.col === 'front') frontCount++;
  }

  if (backCount > 1) {
    return { valid: false, error: `Backline can only hold at most 1 spirit (currently ${backCount})` };
  }
  if (frontCount > 2) {
    return { valid: false, error: `Frontline can only hold at most 2 spirits (currently ${frontCount})` };
  }
  if (midCount > 3) {
    return { valid: false, error: `Midline can only hold at most 3 spirits (currently ${midCount})` };
  }

  // Full squad check (when party has 5 members)
  if (totalCount === 5) {
    if (backCount !== 1) {
      return { valid: false, error: 'Full 5-member party requires exactly 1 spirit in the Backline' };
    }
    if (midCount < 2 || midCount > 3) {
      return { valid: false, error: `Full 5-member party requires 2 or 3 in Midline (currently ${midCount})` };
    }
    if (frontCount < 1 || frontCount > 2) {
      return { valid: false, error: `Full 5-member party requires 1 or 2 in Frontline (currently ${frontCount})` };
    }
  }

  return {
    valid: true,
    counts: { back: backCount, mid: midCount, front: frontCount, total: totalCount }
  };
}

/**
 * Elemental Affinity Matrix:
 * Fire beats Earth, Earth beats Wind, Wind beats Water, Water beats Fire.
 * Light and Void (Dark) have mutual celestial opposition (+30%).
 */
