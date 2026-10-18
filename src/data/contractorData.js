import { getGameIcon } from '../ui/icons/gameIcons.js';

/**
 * Contractor Leveling & Feature Pacing Configuration
 * Controls progressive system unlocks from Contractor Lv. 1 to 25.
 */

export const FEATURE_UNLOCKS = {
  FORMATION_3X3: {
    id: 'FORMATION_3X3',
    level: 2,
    name: '3x3 Tactical Grid & Formation Alignment',
    icon: getGameIcon('sword', { size: '14px' }),
    desc: 'Deploy spirits strategically across Frontline, Midline, and Backline.'
  },
  PANTHEON_TRIALS: {
    id: 'PANTHEON_TRIALS',
    level: 3,
    name: 'Pantheon Trials (Artifact Dungeon)',
    icon: getGameIcon('trials', { size: '14px', color: '#38bdf8' }),
    desc: 'Conquer the Olympian Gods to earn 6-piece Greek God Relic sets.'
  },
  DIVINE_FORGE: {
    id: 'DIVINE_FORGE',
    level: 3,
    name: 'Divine Forge (Weapon Armory)',
    icon: getGameIcon('forge', { size: '14px', color: '#fb923c' }),
    desc: 'Forge and upgrade 12 diverse weapon archetypes with unique active passives.'
  },
  BESTIARY_INDEX: {
    id: 'BESTIARY_INDEX',
    level: 4,
    name: 'Spirit Bestiary & Hall of Fame',
    icon: getGameIcon('index', { size: '14px', color: '#34d399' }),
    desc: 'Catalog discovered spirits and honor your greatest warriors in the Hall of Fame.'
  },
  SANCTUARY_ESSENCE: {
    id: 'SANCTUARY_ESSENCE',
    level: 8,
    name: 'Sanctuary of the Gods',
    icon: getGameIcon('godsEssence', { size: '14px', color: '#fb923c' }),
    desc: 'Battle God Avatars to harness Essences of the Gods and Energy Vault enhancements.'
  },
  ASTRAL_REALM: {
    id: 'ASTRAL_REALM',
    level: 12,
    name: 'Astral Realm & Dwarven Forge',
    icon: getGameIcon('realm', { size: '14px', color: '#c084fc' }),
    desc: 'Unlock 8 Zodiac Constellations, Dwarven Smelting, and Astral Expeditions.'
  },
  SPIRIT_REBIRTH: {
    id: 'SPIRIT_REBIRTH',
    level: 16,
    name: 'Spirit Rebirth System (⭐1–7)',
    icon: getGameIcon('sanctum', { size: '14px', color: '#facc15' }),
    desc: 'Transcend maximum level limits and ignite 7-star constellation affinities.'
  }
};

/**
 * Calculates the Contractor EXP required to advance from `level` to `level + 1`.
 * Deliberate progression curve: Lv 1=250, Lv 2=683, Lv 3=1228, Lv 5=2579, Lv 10=7046, Lv 20=19252
 * @param {number} level - Current contractor level
 * @returns {number} Required EXP
 */
export function getContractorXpRequired(level) {
  const lvl = Math.max(1, Math.floor(level || 1));
  return Math.floor(250 * Math.pow(lvl, 1.45));
}

/**
 * Checks if a specific system is unlocked at the given contractor level.
 * @param {string} featureId - One of FEATURE_UNLOCKS keys
 * @param {number} contractorLevel - Current level
 * @returns {boolean}
 */
export function isFeatureUnlocked(featureId, contractorLevel = 1) {
  const feat = FEATURE_UNLOCKS[featureId];
  if (!feat) return true; // Unregistered features default to unlocked
  return (contractorLevel || 1) >= feat.level;
}

/**
 * Gets the unlock milestone object for a feature
 * @param {string} featureId
 * @returns {Object|null}
 */
export function getFeatureConfig(featureId) {
  return FEATURE_UNLOCKS[featureId] || null;
}

/**
 * Returns all features unlocked at exactly this level
 * @param {number} level
 * @returns {Array}
 */
export function getFeaturesUnlockedAtLevel(level) {
  return Object.values(FEATURE_UNLOCKS).filter(f => f.level === level);
}

/**
 * Returns the next upcoming locked feature for the contractor
 * @param {number} currentLevel
 * @returns {Object|null}
 */
export function getNextFeatureUnlock(currentLevel = 1) {
  const upcoming = Object.values(FEATURE_UNLOCKS)
    .filter(f => f.level > (currentLevel || 1))
    .sort((a, b) => a.level - b.level);
  return upcoming[0] || null;
}

/**
 * Returns all feature milestones sorted by level
 * @returns {Array}
 */
export function getAllFeatureMilestones() {
  return Object.values(FEATURE_UNLOCKS).sort((a, b) => a.level - b.level);
}
