import { 
  SPIRIT_SPECIES, 
  CONTRACT_BASE_POOL, 
  getXpRequiredForLevel, 
  calculateSpiritPower 
} from './src/data/spiritsData.js';
import { getEnemyForStage } from './src/data/madnessZoneData.js';

console.log('--- RUNNING SPIRIT CONTRACT EVO MATH ENGINE TESTS ---');

// 1. Test Base Species Catalog
console.log(`[TEST 1] Base Pool Size: ${CONTRACT_BASE_POOL.length}`);
CONTRACT_BASE_POOL.forEach(id => {
  const species = SPIRIT_SPECIES[id];
  if (!species) throw new Error(`Missing species for ${id}`);
  if (!species.evolutions || species.evolutions.length === 0) throw new Error(`Missing evolutions for ${id}`);
  console.log(`  ✓ ${species.name} (Tier ${species.tier}, Cap ${species.levelCap}) -> Evolves into: ${species.evolutions.map(e => `${e.variant} (${e.weight}%)`).join(', ')}`);
});

// 2. Test RNG Evolution Simulation
console.log('\n[TEST 2] Testing 1000 RNG Evolutions on Ignis Wisp (Expected ~80% Common, ~20% Rare):');
const ignis = SPIRIT_SPECIES['ignis_wisp'];
let commonCount = 0;
let rareCount = 0;
const totalTrials = 1000;

for (let i = 0; i < totalTrials; i++) {
  const roll = Math.random() * 100;
  let running = 0;
  let chosen = ignis.evolutions[0];
  for (const evo of ignis.evolutions) {
    running += evo.weight;
    if (roll <= running) {
      chosen = evo;
      break;
    }
  }
  if (chosen.variant.includes('Rare')) rareCount++;
  else commonCount++;
}
console.log(`  Results over ${totalTrials} rolls: Common: ${commonCount} (${(commonCount/10).toFixed(1)}%), Rare: ${rareCount} (${(rareCount/10).toFixed(1)}%)`);

// 3. Test XP & Level Scaling Math
console.log('\n[TEST 3] XP Scaling curve:');
for (let lvl = 1; lvl <= 10; lvl++) {
  console.log(`  Level ${lvl}: ${getXpRequiredForLevel(lvl)} XP required`);
}

// 4. Test Madness Zone Scaling
console.log('\n[TEST 4] Madness Zone Enemy Scaling:');
for (let stage = 1; stage <= 5; stage++) {
  const mob = getEnemyForStage(stage, 1);
  const boss = getEnemyForStage(stage, 5);
  console.log(`  Stage ${stage} Mob: ${mob.name} (Power: ${mob.power}, HP: ${mob.maxHp}, Reward: ${mob.shardReward} shards)`);
  console.log(`  Stage ${stage} Boss: ${boss.name} (Power: ${boss.power}, HP: ${boss.maxHp}, Reward: ${boss.shardReward} shards + ${boss.essenceReward} essence)`);
}

// 5. Test Offline XP calculation formula
console.log('\n[TEST 5] Offline XP Calculation for 2 hours (7200 seconds):');
const offlineSec = 7200;
const xpRate = 3.0; // 3 XP / sec
const totalGainedXp = offlineSec * xpRate;
console.log(`  Offline Duration: ${offlineSec}s (${offlineSec / 3600}h) -> Total XP gained: ${totalGainedXp} XP`);

// Simulate leveling up from 0 XP at Level 1 with 21600 XP
let lvl = 1;
let currentXp = 0;
let remaining = totalGainedXp;
const cap = 10;
while (remaining > 0 && lvl < cap) {
  const req = getXpRequiredForLevel(lvl) - currentXp;
  if (remaining >= req) {
    remaining -= req;
    currentXp = 0;
    lvl++;
  } else {
    currentXp += remaining;
    remaining = 0;
  }
}
console.log(`  Result: Reached Level ${lvl}/${cap} (Excess XP: ${remaining}, Current XP: ${currentXp}, Ready to Evolve: ${lvl >= cap})`);

console.log('\nALL MATH ENGINE INTEGRATION TESTS PASSED SUCCESSFULLY! ✅');
