/**
 * Madness Zone Combat Configuration & Enemy Generation
 * Rebalanced for meaningful idle progression and earned shard economy.
 * Phase 2: Scaled-down enemy progression, polynomial curves & heavy swarms on designated floors.
 */

export const CORRUPTED_PREFIXES = [
  'Blighted', 'Abyssal', 'Frenzied', 'Twisted', 'Dread', 
  'Eldritch', 'Graveborn', 'Chaotic', 'Maddened', 'Cursed',
  'Voidborn', 'Shadow', 'Cataclysmic', 'Venomous'
];

export const CORRUPTED_TYPES = [
  { name: 'Crawler', baseMultiplier: 0.85, color: '#e74c3c' },
  { name: 'Stalker', baseMultiplier: 1.0, color: '#9b59b6' },
  { name: 'Behemoth', baseMultiplier: 1.25, color: '#c0392b' },
  { name: 'Harpy', baseMultiplier: 0.95, color: '#3498db' },
  { name: 'Specter', baseMultiplier: 1.1, color: '#8e44ad' },
  { name: 'Void Sprite', baseMultiplier: 0.75, color: '#1abc9c' },
  { name: 'Shadow Hound', baseMultiplier: 0.9, color: '#e67e22' },
  { name: 'Abyssal Bat', baseMultiplier: 0.7, color: '#34495e' },
  { name: 'Brood Horror', baseMultiplier: 1.2, color: '#d35400' },
  { name: 'Overlord (BOSS)', baseMultiplier: 1.85, color: '#ff0055' }
];

import { getBiomeForStage } from './biomesData.js';

/**
 * Scaled-down enemy progression curve:
 * Soft polynomial scaling replacing steep exponential compounding.
 * Avoids 1-shot player wipes on floors 20-50+ while keeping challenge intact.
 */
export function getEnemyBaseScale(stage) {
  if (stage <= 1) return 1.0;
  if (stage <= 5) return 1.0 + (stage - 1) * 0.18;
  if (stage <= 15) return 1.72 + (stage - 5) * 0.22;
  return 3.92 + (stage - 15) * 0.28 + Math.pow(stage - 15, 1.22) * 0.10;
}

/**
 * Checks whether a stage is designated as a heavy Swarm Floor.
 * Floors ending in 3 or 7 (e.g. Floors 3, 7, 13, 17, 23, 27, 33, 37, 43, 47)
 * feature swarms of 4 to 6 rapid enemies for tactical challenge.
 */
export function isSwarmFloor(stage) {
  const lastDigit = stage % 10;
  return lastDigit === 3 || lastDigit === 7;
}

export function getSwarmForStage(stage, subStage) {
  const isBossWave = subStage >= 5;
  const biome = getBiomeForStage(stage);
  const prefixes = biome.enemyPrefixes && biome.enemyPrefixes.length > 0 
    ? biome.enemyPrefixes 
    : CORRUPTED_PREFIXES;

  const baseScale = getEnemyBaseScale(stage);
  const waveScale = 1 + (subStage - 1) * 0.12;
  const isSwarm = isSwarmFloor(stage);

  // Rebalanced total shard & essence rewards
  const rawShardReward = isBossWave 
    ? (stage === 1 
        ? 12 
        : Math.round(12 + Math.min(stage - 1, 15) * 1.5 + Math.sqrt(Math.max(0, stage - 16)) * 3))
    : (stage === 1
        ? Math.max(1, Math.round((2 + subStage * 0.8) * 0.40))
        : Math.max(1, Math.round((2 + Math.min(stage - 1, 15) * 1.0 + Math.sqrt(Math.max(0, stage - 16)) * 1.5 + subStage * 0.8) * 0.40)));
  const totalShardReward = Math.max(1, rawShardReward);

  // Normal mob essence drops removed completely (0%). Milestone floor bosses drop 1.
  const totalEssenceReward = isBossWave 
    ? (stage === 1 || stage % 5 === 0 ? 1 : 0)
    : 0;

  if (isBossWave) {
    // Boss wave: 1 Overlord Boss + 2-3 Guards (3 guards on Swarm Floors)
    const bossPrefix = prefixes[(stage * 3 + subStage) % prefixes.length];
    const bossTitle = biome.bossTitle ? `${bossPrefix} ${biome.bossTitle} (BOSS)` : `${bossPrefix} Overlord (BOSS)`;
    const bossPower = Math.max(35, Math.round(28 * baseScale * waveScale * 1.85));
    const bossMaxHp = Math.round(bossPower * 7.5);

    const guardCount = isSwarm ? 3 : 2;
    const guardPower = Math.max(18, Math.round(18 * baseScale * waveScale * 0.95));
    const guardMaxHp = Math.round(guardPower * 3.6);

    const bossEnemy = {
      id: `boss_${stage}_${subStage}_0`,
      name: bossTitle,
      isBoss: true,
      element: biome.element || 'EARTH',
      power: bossPower,
      maxHp: bossMaxHp,
      hp: bossMaxHp,
      shardReward: Math.round(totalShardReward * (guardCount === 3 ? 0.60 : 0.70)),
      essenceReward: totalEssenceReward,
      color: '#ff0055',
      attackCooldown: 2.2,
      attackTimer: 1.2
    };

    const guards = [];
    const shardFraction = Math.floor((totalShardReward - bossEnemy.shardReward) / guardCount);
    for (let g = 0; g < guardCount; g++) {
      const gPrefix = prefixes[(stage * 2 + 1 + g) % prefixes.length];
      const gTitle = g === 0 ? `${gPrefix} Royal Sentinel` : g === 1 ? `${gPrefix} Void Vanguard` : `${gPrefix} Dread Warden`;
      guards.push({
        id: `guard_${stage}_${subStage}_${g + 1}`,
        name: gTitle,
        isBoss: false,
        element: biome.element || 'EARTH',
        power: guardPower,
        maxHp: guardMaxHp,
        hp: guardMaxHp,
        shardReward: Math.max(1, shardFraction),
        essenceReward: 0,
        color: g % 2 === 0 ? '#c0392b' : '#9b59b6',
        attackCooldown: 2.4 + (g * 0.3),
        attackTimer: 1.6 + (g * 0.4)
      });
    }

    return [bossEnemy, ...guards];
  }

  // Normal waves (1-4):
  // On Swarm Floors: Wave 1: 3, Wave 2: 4, Wave 3: 5, Wave 4: 5-6
  // On Standard Floors: Wave 1: 1-2, Wave 2: 2, Wave 3: 3, Wave 4: 3-4
  let swarmCount = 1;
  if (isSwarm) {
    if (subStage === 1) swarmCount = 3;
    else if (subStage === 2) swarmCount = 4;
    else if (subStage === 3) swarmCount = 5;
    else if (subStage === 4) swarmCount = (stage >= 7) ? 6 : 5;
  } else {
    if (subStage === 1) swarmCount = (stage % 2 === 0) ? 2 : 1;
    else if (subStage === 2) swarmCount = 2;
    else if (subStage === 3) swarmCount = 3;
    else if (subStage === 4) swarmCount = (stage > 2) ? 4 : 3;
  }

  const enemies = [];
  const shardPerMob = Math.max(1, Math.floor(totalShardReward / swarmCount));
  let remainingShards = totalShardReward;

  for (let i = 0; i < swarmCount; i++) {
    const typeIndex = (subStage - 1 + i) % (CORRUPTED_TYPES.length - 1);
    const typeObj = CORRUPTED_TYPES[typeIndex];
    const prefix = prefixes[(stage * 3 + subStage + i) % prefixes.length];
    const name = `${prefix} ${typeObj.name}`;

    const mobPower = Math.max(
      14,
      Math.round(20 * baseScale * waveScale * typeObj.baseMultiplier * (0.75 + 0.35 / Math.sqrt(swarmCount)))
    );
    const mobMaxHp = Math.round(mobPower * (swarmCount >= 4 ? 3.4 : 4.0));
    const shards = (i === swarmCount - 1) ? remainingShards : shardPerMob;
    remainingShards = Math.max(0, remainingShards - shards);

    enemies.push({
      id: `mob_${stage}_${subStage}_${i}`,
      name,
      isBoss: false,
      element: biome.element || 'EARTH',
      power: mobPower,
      maxHp: mobMaxHp,
      hp: mobMaxHp,
      shardReward: shards,
      essenceReward: (i === 0) ? totalEssenceReward : 0,
      color: typeObj.color,
      attackCooldown: Math.max(1.5, 2.2 - (swarmCount >= 4 ? 0.4 : 0) + (i * 0.12)),
      attackTimer: 0.8 + (i * 0.28)
    });
  }

  return enemies;
}

export function getEnemyForStage(stage, subStage) {
  const swarm = getSwarmForStage(stage, subStage);
  return swarm[0];
}
