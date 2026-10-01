/**
 * Madness Zone Combat Configuration & Enemy Generation
 */

export const CORRUPTED_PREFIXES = [
  'Blighted', 'Abyssal', 'Frenzied', 'Twisted', 'Dread', 
  'Eldritch', 'Graveborn', 'Chaotic', 'Maddened', 'Cursed'
];

export const CORRUPTED_TYPES = [
  { name: 'Crawler', baseMultiplier: 0.9, color: '#e74c3c' },
  { name: 'Stalker', baseMultiplier: 1.0, color: '#9b59b6' },
  { name: 'Behemoth', baseMultiplier: 1.35, color: '#c0392b' },
  { name: 'Harpy', baseMultiplier: 0.95, color: '#3498db' },
  { name: 'Specter', baseMultiplier: 1.05, color: '#8e44ad' },
  { name: 'Overlord (BOSS)', baseMultiplier: 2.2, color: '#ff0055' }
];

export function getEnemyForStage(stage, subStage) {
  const isBoss = subStage >= 5;
  const prefix = CORRUPTED_PREFIXES[(stage * 3 + subStage) % CORRUPTED_PREFIXES.length];
  const typeObj = isBoss ? CORRUPTED_TYPES[5] : CORRUPTED_TYPES[(subStage - 1) % 5];
  const name = `${prefix} ${typeObj.name}`;

  // Mathematical scaling for Enemy Power
  // Stage 1 subStage 1: ~30-40 power. Easily matched by 2-3 tier 1 spirits.
  const baseScale = Math.pow(1.22, stage - 1);
  const waveScale = 1 + (subStage - 1) * 0.15;
  const bossScale = isBoss ? 1.7 : 1.0;

  const enemyPower = Math.max(
    25,
    Math.round(28 * baseScale * waveScale * bossScale * typeObj.baseMultiplier)
  );

  // HP is proportionate to power
  const maxHp = Math.round(enemyPower * (isBoss ? 4.5 : 2.5));

  // Shards reward
  const shardReward = Math.round((12 * stage + subStage * 4) * (isBoss ? 3.5 : 1.0));
  const essenceReward = isBoss ? Math.max(1, Math.floor(stage / 2)) : (Math.random() < 0.15 ? 1 : 0);

  return {
    name,
    isBoss,
    power: enemyPower,
    maxHp,
    hp: maxHp,
    shardReward,
    essenceReward,
    color: typeObj.color
  };
}
