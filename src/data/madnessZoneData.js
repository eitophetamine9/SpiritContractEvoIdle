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

export function getSwarmForStage(stage, subStage) {
  const isBossWave = subStage >= 5;
  const biome = getBiomeForStage(stage);
  const prefixes = biome.enemyPrefixes && biome.enemyPrefixes.length > 0 
    ? biome.enemyPrefixes 
    : CORRUPTED_PREFIXES;

  const baseScale = stage <= 5 
    ? Math.pow(1.28, stage - 1) 
    : Math.pow(1.28, 4) * Math.pow(1.18, stage - 5);
  const waveScale = 1 + (subStage - 1) * 0.18;

  // Rebalanced total shard & essence rewards for the wave (curbed late-stage inflation)
  const totalShardReward = isBossWave 
    ? (stage === 1 
        ? 23 
        : Math.round(23 + Math.min(stage - 1, 15) * 3 + Math.sqrt(Math.max(0, stage - 16)) * 6))
    : (stage === 1
        ? Math.max(2, Math.round(2 + subStage * 0.8))
        : Math.max(2, Math.round(2 + Math.min(stage - 1, 15) * 1.0 + Math.sqrt(Math.max(0, stage - 16)) * 1.5 + subStage * 0.8)));

  const totalEssenceReward = isBossWave 
    ? Math.max(1, Math.floor(1 + (stage - 1) * 0.5)) 
    : (Math.random() < 0.05 ? 1 : 0);

  if (isBossWave) {
    // Boss wave: 1 Overlord Boss + 2 Royal Guards
    const bossPrefix = prefixes[(stage * 3 + subStage) % prefixes.length];
    const bossTitle = biome.bossTitle ? `${bossPrefix} ${biome.bossTitle} (BOSS)` : `${bossPrefix} Overlord (BOSS)`;
    const bossPower = Math.max(45, Math.round(40 * baseScale * waveScale * 2.2));
    const bossMaxHp = Math.round(bossPower * 9.5);

    const guardPrefix = prefixes[(stage * 2 + 1) % prefixes.length];
    const guardPower = Math.max(25, Math.round(26 * baseScale * waveScale * 1.1));
    const guardMaxHp = Math.round(guardPower * 4.2);

    const bossEnemy = {
      id: `boss_${stage}_${subStage}_0`,
      name: bossTitle,
      isBoss: true,
      element: biome.element || 'EARTH',
      power: bossPower,
      maxHp: bossMaxHp,
      hp: bossMaxHp,
      shardReward: Math.round(totalShardReward * 0.7),
      essenceReward: totalEssenceReward,
      color: '#ff0055',
      attackCooldown: 2.2,
      attackTimer: 1.2
    };

    const guard1 = {
      id: `guard_${stage}_${subStage}_1`,
      name: `${guardPrefix} Royal Sentinel`,
      isBoss: false,
      element: biome.element || 'EARTH',
      power: guardPower,
      maxHp: guardMaxHp,
      hp: guardMaxHp,
      shardReward: Math.floor(totalShardReward * 0.15),
      essenceReward: 0,
      color: '#c0392b',
      attackCooldown: 2.5,
      attackTimer: 1.8
    };

    const guard2 = {
      id: `guard_${stage}_${subStage}_2`,
      name: `${guardPrefix} Void Vanguard`,
      isBoss: false,
      element: biome.element || 'EARTH',
      power: guardPower,
      maxHp: guardMaxHp,
      hp: guardMaxHp,
      shardReward: Math.ceil(totalShardReward * 0.15),
      essenceReward: 0,
      color: '#9b59b6',
      attackCooldown: 2.8,
      attackTimer: 2.4
    };

    return [bossEnemy, guard1, guard2];
  }

  // Normal waves (1-4): Swarm of 1 to 4 enemies
  // Wave 1: 1-2 mobs, Wave 2: 2 mobs, Wave 3: 3 mobs, Wave 4: 3-4 mobs
  let swarmCount = 1;
  if (subStage === 1) swarmCount = (stage % 2 === 0) ? 2 : 1;
  else if (subStage === 2) swarmCount = 2;
  else if (subStage === 3) swarmCount = 3;
  else if (subStage === 4) swarmCount = (stage > 2) ? 4 : 3;

  const enemies = [];
  const shardPerMob = Math.max(1, Math.floor(totalShardReward / swarmCount));
  let remainingShards = totalShardReward;

  for (let i = 0; i < swarmCount; i++) {
    const typeIndex = (subStage - 1 + i) % 5;
    const typeObj = CORRUPTED_TYPES[typeIndex];
    const prefix = prefixes[(stage * 3 + subStage + i) % prefixes.length];
    const name = `${prefix} ${typeObj.name}`;

    const mobPower = Math.max(
      20,
      Math.round(28 * baseScale * waveScale * typeObj.baseMultiplier * (0.85 + 0.3 / swarmCount))
    );
    const mobMaxHp = Math.round(mobPower * 4.6);
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
      attackCooldown: 2.2 + (i * 0.3),
      attackTimer: 1.0 + (i * 0.4) // staggered initial timers
    });
  }

  return enemies;
}

export function getEnemyForStage(stage, subStage) {
  const swarm = getSwarmForStage(stage, subStage);
  return swarm[0];
}

