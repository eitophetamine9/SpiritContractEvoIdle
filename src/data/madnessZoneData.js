/**
 * Madness Zone Combat Configuration & Enemy Generation
 * Rebalanced for meaningful idle progression and earned shard economy.
 */

export const CORRUPTED_PREFIXES = [
  'Blighted', 'Abyssal', 'Frenzied', 'Twisted', 'Dread', 
  'Eldritch', 'Graveborn', 'Chaotic', 'Maddened', 'Cursed'
];

export const CORRUPTED_TYPES = [
  { name: 'Crawler', baseMultiplier: 0.9, color: '#e74c3c' },
  { name: 'Stalker', baseMultiplier: 1.05, color: '#9b59b6' },
  { name: 'Behemoth', baseMultiplier: 1.35, color: '#c0392b' },
  { name: 'Harpy', baseMultiplier: 1.0, color: '#3498db' },
  { name: 'Specter', baseMultiplier: 1.15, color: '#8e44ad' },
  { name: 'Overlord (BOSS)', baseMultiplier: 2.2, color: '#ff0055' }
];

import { getBiomeForStage } from './biomesData.js';

export function getEnemyForStage(stage, subStage) {
  const isBoss = subStage >= 5;
  const biome = getBiomeForStage(stage);
  const prefixes = biome.enemyPrefixes && biome.enemyPrefixes.length > 0 
    ? biome.enemyPrefixes 
    : CORRUPTED_PREFIXES;
  const prefix = prefixes[(stage * 3 + subStage) % prefixes.length];
  const typeObj = isBoss ? CORRUPTED_TYPES[5] : CORRUPTED_TYPES[(subStage - 1) % 5];
  const name = isBoss && biome.bossTitle 
    ? `${prefix} ${biome.bossTitle} (BOSS)`
    : `${prefix} ${typeObj.name}`;

  // Rebalanced Mathematical scaling:
  // Enemies now possess robust HP and damage scaling that requires party training & evolutions
  const baseScale = Math.pow(1.28, stage - 1);
  const waveScale = 1 + (subStage - 1) * 0.18;
  const bossScale = isBoss ? 2.0 : 1.0;

  const enemyPower = Math.max(
    32,
    Math.round(35 * baseScale * waveScale * bossScale * typeObj.baseMultiplier)
  );

  // HP scaling: normal mobs take focused strikes, bosses require strategic party strength
  const maxHp = Math.round(enemyPower * (isBoss ? 8.5 : 4.8));

  // Rebalanced Shard Economy:
  // Normal wave: ~3-8 shards. Boss wave: 20-40 shards + guaranteed Soul Essence.
  // 1 full floor clear yields ~35-40 shards (3 full floors = 1 summon).
  const shardReward = isBoss 
    ? Math.round(18 + stage * 5)
    : Math.max(1, Math.round(2 + (stage - 1) * 1.5 + subStage * 0.8));

  // Bosses always drop 1+ Soul Essence for the Essence Sanctum Shop
  const essenceReward = isBoss 
    ? Math.max(1, Math.floor(1 + (stage - 1) * 0.5)) 
    : (Math.random() < 0.05 ? 1 : 0);

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
