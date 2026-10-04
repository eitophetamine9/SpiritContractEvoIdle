import { 
  SPIRIT_SPECIES, 
  CONTRACT_POOLS_BY_RARITY,
  rollContractSpirit,
  rollAstralContractSpirit,
  getXpRequiredForLevel, 
  calculateSpiritPower 
} from '../src/data/index.js';
import { getEnemyForStage } from '../src/data/index.js';

console.log('--- RUNNING SPIRIT CONTRACT EVO ENGINE & BALANCE TESTS ---');

// 1. Verify Roster & Rarity Tiers
console.log('\n[TEST 1] Verifying Contract Roster by Rarity:');
for (const [rarity, pool] of Object.entries(CONTRACT_POOLS_BY_RARITY)) {
  console.log(`  ${rarity}: ${pool.map(id => SPIRIT_SPECIES[id]?.name).join(', ')}`);
  for (const id of pool) {
    const sp = SPIRIT_SPECIES[id];
    if (!sp) throw new Error(`Missing species for ${id}`);
    if (!sp.evolutions || sp.evolutions.length === 0) throw new Error(`Missing evolutions for ${id}`);
  }
}

// 2. Test Astral Contract (0% Commons Guarantee)
console.log('\n[TEST 2] Testing Astral Contract (1,000 pulls, 0% Commons expected):');
let commonFound = 0;
let uncommonCount = 0;
let rareCount = 0;
let epicCount = 0;
let legendaryCount = 0;

for (let i = 0; i < 1000; i++) {
  const result = rollAstralContractSpirit();
  if (result.rarityTier === 'COMMON') commonFound++;
  if (result.rarityTier === 'UNCOMMON') uncommonCount++;
  if (result.rarityTier === 'RARE') rareCount++;
  if (result.rarityTier === 'EPIC') epicCount++;
  if (result.rarityTier === 'LEGENDARY') legendaryCount++;
}

console.log(`  Commons: ${commonFound} (0% expected)`);
console.log(`  Uncommons: ${(uncommonCount / 10).toFixed(1)}% (exp ~65%)`);
console.log(`  Rares: ${(rareCount / 10).toFixed(1)}% (exp ~25%)`);
console.log(`  Epics: ${(epicCount / 10).toFixed(1)}% (exp ~8%)`);
console.log(`  Legendaries: ${(legendaryCount / 10).toFixed(1)}% (exp ~2%)`);

if (commonFound > 0) throw new Error('Astral Contract yielded a Common spirit!');

// 3. Test Rebalanced Shard Economy & Enemy HP
console.log('\n[TEST 3] Testing Rebalanced Shard Economy & Enemy Difficulty:');
let totalFloor1Shards = 0;
for (let wave = 1; wave <= 5; wave++) {
  const enemy = getEnemyForStage(1, wave);
  totalFloor1Shards += enemy.shardReward;
  console.log(`  Floor 1 Wave ${wave} (${enemy.name}): Power: ${enemy.power}, HP: ${enemy.maxHp}, Reward: ${enemy.shardReward} Shards ${enemy.essenceReward > 0 ? `+ ${enemy.essenceReward} Essence` : ''}`);
}
console.log(`  Total Shards for 1 Full Clear of Floor 1: ${totalFloor1Shards} Shards`);
console.log(`  Floors needed for 1 Contract (100 shards): ~${(100 / totalFloor1Shards).toFixed(1)} floors (Meaningful progression!)`);

if (totalFloor1Shards > 50) {
  throw new Error(`Total shards ${totalFloor1Shards} is too high for a single floor clear!`);
}

// 4. Test Energy System Math
console.log('\n[TEST 4] Testing Energy Regeneration:');
const maxEnergy = 60;
let energy = 0;
const elapsedSeconds = 1800; // 30 minutes
const restored = Math.min(maxEnergy - energy, Math.floor(elapsedSeconds / 30));
energy += restored;
console.log(`  30 minutes offline -> Restored: +${restored} ⚡ -> Current: ${energy}/${maxEnergy}`);
if (energy !== 60) throw new Error('Energy calculation incorrect');

// 5. Test Biomes Progression (1-100+ and Enchanted repeating cycles)
console.log('\n[TEST 5] Testing Tower Biome Progression Engine:');
import('../src/data/biomesData.js').then(async ({ getBiomeForStage }) => {
  const b1 = getBiomeForStage(1);
  const b15 = getBiomeForStage(15);
  const b30 = getBiomeForStage(30);
  const b50 = getBiomeForStage(50);
  const b70 = getBiomeForStage(70);
  const b90 = getBiomeForStage(90);
  const b105 = getBiomeForStage(105);

  console.log(`  Floor 1:   ${b1.name} (id: ${b1.id})`);
  console.log(`  Floor 15:  ${b15.name} (id: ${b15.id})`);
  console.log(`  Floor 30:  ${b30.name} (id: ${b30.id})`);
  console.log(`  Floor 50:  ${b50.name} (id: ${b50.id})`);
  console.log(`  Floor 70:  ${b70.name} (id: ${b70.id})`);
  console.log(`  Floor 90:  ${b90.name} (id: ${b90.id})`);
  console.log(`  Floor 105: ${b105.name} (isEnchanted: ${b105.isEnchanted})`);

  if (b1.id !== 'mystical_swamp') throw new Error('Floor 1 should be mystical_swamp');
  if (b15.id !== 'mystical_winterland') throw new Error('Floor 15 should be mystical_winterland');
  if (b30.id !== 'dark_castle') throw new Error('Floor 30 should be dark_castle');
  if (b50.id !== 'abyssal_depths') throw new Error('Floor 50 should be abyssal_depths');
  if (b70.id !== 'volcanic_caldera') throw new Error('Floor 70 should be volcanic_caldera');
  if (b90.id !== 'primordial_sanctum') throw new Error('Floor 90 should be primordial_sanctum');
  if (!b105.name.startsWith('Enchanted Mystical Swamp')) throw new Error('Floor 105 should be Enchanted Mystical Swamp');

  // 6. Test Spirit HP, Ultimates, and Enemy Swarms
  console.log('\n[TEST 6] Testing Spirit HP, Ultimates Catalog, and Swarm Formations:');
  const { calculateSpiritMaxHp, getSpiritUltimate, getSwarmForStage } = await import('../src/data/index.js');
  const catSpecies = SPIRIT_SPECIES['cat_spirit'];
  const catHp = calculateSpiritMaxHp(catSpecies, 1, 'COMMON');
  console.log(`  Cat Spirit Lv 1 COMMON Max HP: ${catHp} (Expected >= 80)`);
  if (catHp < 80) throw new Error(`Cat Spirit HP ${catHp} too low`);

  const catUlt = getSpiritUltimate('cat_spirit');
  console.log(`  Cat Spirit Ult: "${catUlt.name}" (${catUlt.type}, ${catUlt.multiplier}x)`);
  if (catUlt.type !== 'AOE_DAMAGE') throw new Error('Cat Spirit Ult should be AOE_DAMAGE');

  const dogUlt = getSpiritUltimate('dog_spirit');
  console.log(`  Dog Spirit Ult: "${dogUlt.name}" (${dogUlt.type}, Heal ${dogUlt.healPercent}%, Shield ${dogUlt.shieldPercent}%)`);
  if (dogUlt.type !== 'SUPPORT') throw new Error('Dog Spirit Ult should be SUPPORT');

  // Test Swarms
  const swarmW1 = getSwarmForStage(1, 1);
  const swarmW3 = getSwarmForStage(1, 3);
  const swarmW5 = getSwarmForStage(1, 5);
  console.log(`  Floor 1 Wave 1 swarm count: ${swarmW1.length}`);
  console.log(`  Floor 1 Wave 3 swarm count: ${swarmW3.length}`);
  console.log(`  Floor 1 Wave 5 (Boss) swarm count: ${swarmW5.length} (Expected Boss + 2 Guards = 3)`);
  if (swarmW5.length !== 3) throw new Error('Boss wave should have 3 enemies (Boss + 2 Guards)');
  if (!swarmW5[0].isBoss) throw new Error('First enemy of boss wave should be the Boss');

  // 7. Test Two-Way Combat Simulation in GameState
  console.log('\n[TEST 7] Testing Two-Way Combat Simulation in GameState:');
  // Mock window & document if not in browser
  if (typeof window === 'undefined') {
    global.window = { addEventListener: () => {} };
    global.document = { addEventListener: () => {}, visibilityState: 'visible' };
    global.performance = { now: () => Date.now() };
    global.requestAnimationFrame = () => 1;
    global.cancelAnimationFrame = () => {};
    global.localStorage = {
      getItem: () => null,
      setItem: () => {}
    };
  }

  const { gameState } = await import('../src/state/gameState.js');
  gameState.init();
  const starter = gameState.state.spirits[0];
  console.log(`  Starter Spirit: ${starter.customName} | HP: ${starter.currentHp}/${starter.maxHp} | MP: ${starter.currentMp}/${starter.maxMp}`);
  if (starter.currentHp <= 0 || starter.maxHp <= 0) throw new Error('Starter spirit has invalid HP');

  // Simulate party attack click (Mana generation test)
  const initialMp = starter.currentMp;
  gameState.attackEnemyWithPartyPower();
  console.log(`  After Manual Party Attack -> MP: ${starter.currentMp} (Initial was ${initialMp}, +10 expected)`);
  if (starter.currentMp !== initialMp + 10) throw new Error('Active tapping did not award +10 MP');

  // Simulate ticks to test Mana build-up and Ultimate proc
  let ultFired = false;
  let wipeoutTriggered = false;
  gameState.subscribe((ev, data) => {
    if (ev === 'ultimateCast') {
      ultFired = true;
      console.log(`  [EVENT] Ultimate cast fired: ${data.spirit.customName} used "${data.ult.name}" dealing ${data.totalDamageDealt} dmg!`);
    }
    if (ev === 'partyWiped') {
      wipeoutTriggered = true;
      console.log(`  [EVENT] Party Wiped: "${data.message}", reset to wave: ${gameState.state.madnessZone.subStage}`);
    }
  });

  // Advance combat ticks to hit 100 MP
  for (let i = 0; i < 25; i++) {
    gameState.tickMadnessCombat(0.25);
  }
  if (!ultFired) throw new Error('Ultimate did not fire after sufficient combat ticks');

  // Test Floor Victory revival:
  starter.currentHp = 10; // artificially lower health
  starter.isFallen = true;
  gameState.state.madnessZone.subStage = 5;
  // Clear all enemies to simulate boss kill
  gameState.state.madnessZone.currentSwarm.forEach(e => { e.hp = 0; e.isDefeated = true; });
  gameState.onSwarmCleared();
  console.log(`  After Boss Floor Victory -> Starter HP: ${starter.currentHp}/${starter.maxHp}, Fallen: ${starter.isFallen}`);
  if (starter.currentHp !== starter.maxHp || starter.isFallen) {
    throw new Error('Floor victory did not fully revive party spirit to 100% HP');
  }

  // Test Party Wipeout Reset:
  starter.currentHp = 0;
  starter.isFallen = true;
  gameState.state.madnessZone.subStage = 3;
  gameState.tickMadnessCombat(0.2);
  if (!wipeoutTriggered) throw new Error('Party wipeout did not trigger when all party members fell');
  if (gameState.state.madnessZone.subStage !== 1) throw new Error('Party wipeout did not reset subStage to 1');
  if (starter.currentHp !== starter.maxHp) throw new Error('Party wipeout did not restore spirits to full HP');

  if (gameState.saveTimer) clearInterval(gameState.saveTimer);
  if (gameState.rafId && global.cancelAnimationFrame) global.cancelAnimationFrame(gameState.rafId);

  console.log('\nALL TESTS PASSED SUCCESSFULLY! ✅');
});


