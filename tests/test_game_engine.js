import { 
  SPIRIT_SPECIES, 
  CONTRACT_POOLS_BY_RARITY,
  rollContractSpirit,
  rollAstralContractSpirit,
  getXpRequiredForLevel, 
  calculateSpiritPower,
  ROLES,
  calculateSpiritStats,
  getRoleInfo,
  getSpiritRole,
  REBIRTH_CONFIG,
  getScalingProfile
} from '../src/data/index.js';
import { enhanceRelicData } from '../src/data/equipmentData.js';
import { getEnemyForStage } from '../src/data/index.js';
import { SPRITE_MANIFEST, SpriteAnimator, getSheetKeyForSpecies, createAnimatedRelicHtml, createAnimatedWeaponHtml, getSheetKeyForWeapon } from '../src/render/spriteAnimator.js';
import { audioManager } from '../src/audio/audioManager.js';
import fs from 'fs';
import path from 'path';

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

  // 8. Test Equipment, Greek God Relics, Set Bonuses, and Pantheon Trials Dungeon
  console.log('\n[TEST 8] Testing Equipment, Relics & Pantheon Trials Artifact Dungeon:');
  const { GREEK_GOD_SETS, PANTHEON_CHAMBERS, PANTHEON_DIFFICULTY_TIERS, createRelicInstance } = await import('../src/data/index.js');
  console.log(`  Greek God Sets catalog count: ${Object.keys(GREEK_GOD_SETS).length} (Expected >= 8)`);
  if (Object.keys(GREEK_GOD_SETS).length < 8) throw new Error('Expected at least 8 Greek God Sets');

  // Verify starter equipment and 2-pc Hades set bonus on starter spirit
  const activeStarterBonuses = gameState.getSpiritActiveSetBonuses(starter);
  console.log(`  Starter Spirit active set bonuses: ${activeStarterBonuses.map(b => b.name).join(', ')}`);
  const hasHades2pc = activeStarterBonuses.some(b => b.setId === 'hades' && b.tier === '2pc');
  if (!hasHades2pc) throw new Error('Starter should have active 2-pc Hades set bonus');

  // Test 4-pc Hades bonus activation by equipping 2 more Hades relics
  const hadesRing = createRelicInstance({ setId: 'hades', slotTypeId: 'ring', rarity: 'RARE', level: 1 });
  const hadesNecklace = createRelicInstance({ setId: 'hades', slotTypeId: 'necklace', rarity: 'RARE', level: 1 });
  gameState.state.inventory.equipment.push(hadesRing, hadesNecklace);

  gameState.equipItem(starter.id, hadesRing.uid);
  gameState.equipItem(starter.id, hadesNecklace.uid);

  const updatedBonuses = gameState.getSpiritActiveSetBonuses(starter);
  console.log(`  After equipping 4 Hades relics -> Bonuses: ${updatedBonuses.map(b => b.name).join(', ')}`);
  const hasHades4pc = updatedBonuses.some(b => b.setId === 'hades' && b.tier === '4pc');
  if (!hasHades4pc) throw new Error('4-pc Hades bonus (Underworld Flames) should be active with 4 Hades relics equipped');

  // Test Pantheon Trials Artifact Dungeon execution
  console.log(`  Pantheon Chambers count: ${PANTHEON_CHAMBERS.length} (Expected >= 8)`);
  if (PANTHEON_CHAMBERS.length < 8) throw new Error('Expected at least 8 Pantheon Chambers');

  const initialEnergy = gameState.state.resources.energy;
  const initialEquipCount = gameState.state.inventory.equipment.length;
  console.log(`  Before Dungeon run -> Energy: ${initialEnergy} ⚡ | Inventory items: ${initialEquipCount}`);

  // Run Underworld Crypt Tier 1 (Cost: 10 ⚡)
  const dungeonResult = gameState.runPantheonTrial('underworld_crypt', 1);
  console.log(`  Cleared "${dungeonResult.chamber.name}" [${dungeonResult.tier.name}]!`);
  console.log(`  Loot Earned: ${dungeonResult.relics.length} Relics (${dungeonResult.relics.map(r => r.name).join(', ')}), +${dungeonResult.shardsGained} Shards, +${dungeonResult.essenceGained} Essence`);

  if (gameState.state.resources.energy !== initialEnergy - 10) throw new Error('Dungeon run did not deduct 10 Energy');
  if (gameState.state.inventory.equipment.length < initialEquipCount + 2) throw new Error('Dungeon relics not added to inventory');
  if (dungeonResult.relics.some(r => r.setId !== 'hades')) throw new Error('Underworld Crypt should only drop Hades relics');

  // Test The Divine Forge (Weapon Dungeon)
  console.log('\n[TEST 9] Testing The Divine Forge (Dedicated Weapon Dungeon):');
  const forgeResult = gameState.runForgeDungeon('bladesmith_sanctum', 1);
  console.log(`  Cleared "${forgeResult.chamber.name}" [${forgeResult.tier.name}]!`);
  console.log(`  Weapons Dropped: ${forgeResult.weapons.map(w => w.name).join(', ')}`);
  if (forgeResult.weapons.length === 0) throw new Error('Forge Dungeon should drop targeted weapons');
  if (forgeResult.weapons.some(w => w.weaponTypeId !== 'sword')) throw new Error('Bladesmith Sanctum should only drop swords');

  // Test 3-Wave Combat Trial Runner
  console.log('\n[TEST 10] Testing 3-Wave Combat Trial System:');
  const trialBattle = gameState.startDungeonTrial('pantheon', 'underworld_crypt', 1);
  console.log(`  Trial initiated: Wave ${trialBattle.currentWave}/${trialBattle.maxWaves} with ${trialBattle.currentSwarm.length} enemies`);
  if (trialBattle.currentWave !== 1) throw new Error('Trial should start at Wave 1');
  if (trialBattle.maxWaves !== 3) throw new Error('Trial should have exactly 3 waves');

  // Manual strike
  gameState.manualDungeonStrike();
  // Clear Wave 1
  trialBattle.currentSwarm.forEach(e => { e.hp = 0; e.isDefeated = true; });
  gameState.tickDungeonBattle(0.1);
  console.log(`  After clearing Wave 1 -> Current Wave: ${trialBattle.currentWave}/${trialBattle.maxWaves}`);
  if (trialBattle.currentWave !== 2) throw new Error('Trial should advance to Wave 2');

  // Clear Wave 2
  trialBattle.currentSwarm.forEach(e => { e.hp = 0; e.isDefeated = true; });
  gameState.tickDungeonBattle(0.1);
  console.log(`  After clearing Wave 2 -> Current Wave: ${trialBattle.currentWave}/${trialBattle.maxWaves}`);
  if (trialBattle.currentWave !== 3) throw new Error('Trial should advance to Wave 3 (Boss)');

  // Clear Wave 3 (Boss)
  trialBattle.currentSwarm.forEach(e => { e.hp = 0; e.isDefeated = true; });
  gameState.tickDungeonBattle(0.1);
  console.log(`  After clearing Wave 3 -> Battle Status: ${trialBattle.status}`);
  if (trialBattle.status !== 'victory') throw new Error('Trial should achieve victory after Wave 3');
  if (!trialBattle.loot || trialBattle.loot.relics.length === 0) throw new Error('Trial victory should award relics');

  // Test Madness Zone Engagement Toggle
  console.log('\n[TEST 11] Testing Madness Zone Manual Battle / Standby Toggle:');
  const isEngaged1 = gameState.state.madnessZone.isEngaged;
  gameState.toggleMadnessEngagement();
  console.log(`  Toggled engagement: ${isEngaged1} -> ${gameState.state.madnessZone.isEngaged}`);
  if (gameState.state.madnessZone.isEngaged === isEngaged1) throw new Error('Toggle should flip isEngaged state');

  // Test 12: Relic Stars (3★-6★), Substats, Essences of the Gods, and Ascension
  console.log('\n[TEST 12] Testing Relic Star Tiers (3★-6★), Substats, Essences of the Gods & Ascension:');
  const relic3Star = createRelicInstance({ setId: 'zeus', slotTypeId: 'ring', stars: 3, level: 1 });
  const relic4Star = createRelicInstance({ setId: 'poseidon', slotTypeId: 'headgear', stars: 4, level: 1 });
  const relic5Star = createRelicInstance({ setId: 'ares', slotTypeId: 'totem', stars: 5, level: 15 });

  console.log(`  3★ Relic: ${relic3Star.name} | Subs: ${relic3Star.substats.length} (Max capacity: 3)`);
  console.log(`  4★ Relic: ${relic4Star.name} | Subs: ${relic4Star.substats.length} (3-4 expected)`);
  console.log(`  5★ Relic: ${relic5Star.name} | Subs: ${relic5Star.substats.length} (4 expected)`);

  if (relic3Star.stars !== 3 || relic3Star.substats.length > 3) throw new Error('3★ Relic invalid substats capacity');
  if (relic4Star.stars !== 4 || relic4Star.substats.length < 3) throw new Error('4★ Relic should have 3-4 initial substats');
  if (relic5Star.stars !== 5 || relic5Star.substats.length !== 4) throw new Error('5★ Relic should have exactly 4 initial substats');

  // Test dismantle producing Essences of the Gods
  gameState.state.inventory.equipment.push(relic3Star);
  const dismantleResult = gameState.dismantleEquipment(relic3Star.uid);
  console.log(`  Dismantled 3★ Relic -> Gained ${dismantleResult.shardsGained} Shards & ${dismantleResult.essencesGained} Essences of the Gods`);
  if (!dismantleResult.essencesGained || dismantleResult.essencesGained < 5) throw new Error('Dismantling relic must award Essences of the Gods');
  if ((gameState.state.resources.essencesOfTheGods || 0) < 5) throw new Error('essencesOfTheGods resource not updated');

  // Test 5★ to 6★ Ascension
  gameState.state.inventory.equipment.push(relic5Star);
  gameState.state.resources.essencesOfTheGods = 200;
  gameState.state.resources.soulEssence = 20;
  const ascendResult = gameState.ascendRelic(relic5Star.uid);
  console.log(`  Ascended Relic to 6★: ${ascendResult.item.name} | Stars: ${ascendResult.item.stars}★ | Subs count: ${ascendResult.item.substats.length}`);
  if (ascendResult.item.stars !== 6) throw new Error('Relic should have 6 stars after ascension');
  if (ascendResult.item.substats.length !== 5) throw new Error('6★ Relic should have 5 substats');

  // Test Energy Capacity upgrade (Cap 500)
  const initialCap = gameState.state.resources.maxEnergy;
  gameState.upgradeEnergyCapacity();
  console.log(`  Energy Capacity upgraded: ${initialCap} ➔ ${gameState.state.resources.maxEnergy} (Cap: 500)`);
  if (gameState.state.resources.maxEnergy !== initialCap + 20) throw new Error('Energy cap upgrade failed');

  // Test 13: Elemental Affinity Matrix & Matchups
  console.log('\n[TEST 13] Testing Elemental Affinity Matrix, Matchups & Party Resonance:');
  const { getElementalMultiplier, calculatePartyResonance } = await import('../src/data/index.js');
  const fireVsEarth = getElementalMultiplier('FIRE', 'EARTH');
  const waterVsFire = getElementalMultiplier('WATER', 'FIRE');
  const lightVsDark = getElementalMultiplier('LIGHT', 'DARK');
  const darkVsLight = getElementalMultiplier('DARK', 'LIGHT');
  const earthVsFire = getElementalMultiplier('EARTH', 'FIRE');

  console.log(`  Fire vs Earth: ${fireVsEarth}x (+25% expected)`);
  console.log(`  Water vs Fire: ${waterVsFire}x (+25% expected)`);
  console.log(`  Light vs Dark: ${lightVsDark}x (+30% celestial expected)`);
  console.log(`  Earth vs Fire: ${earthVsFire}x (-15% disadvantage expected)`);

  if (fireVsEarth !== 1.25) throw new Error('Fire should deal 1.25x against Earth');
  if (waterVsFire !== 1.25) throw new Error('Water should deal 1.25x against Fire');
  if (lightVsDark !== 1.30) throw new Error('Light vs Dark should be 1.30x');
  if (earthVsFire !== 0.85) throw new Error('Earth vs Fire should be 0.85x');

  // Verify all 37 spirits have valid element
  let missingElement = 0;
  for (const [id, sp] of Object.entries(SPIRIT_SPECIES)) {
    if (!sp.element) {
      missingElement++;
      console.error(`  Missing element on spirit: ${id}`);
    }
  }
  if (missingElement > 0) throw new Error(`Found ${missingElement} spirits with missing element`);
  console.log(`  Verified all ${Object.keys(SPIRIT_SPECIES).length} Spirit species have explicit elements (0 missing).`);

  // Test 14: Sanctuary of the Gods & Mystical Realm Features
  console.log('\n[TEST 14] Testing Sanctuary of the Gods & Mystical Realm:');
  const { ESSENCE_CHAMBERS, ESSENCE_DIFFICULTY_TIERS } = await import('../src/data/index.js');
  console.log(`  Essence Chambers count: ${ESSENCE_CHAMBERS.length} (Expected 4)`);
  if (ESSENCE_CHAMBERS.length !== 4) throw new Error('Expected 4 Essence Chambers');

  gameState.state.resources.energy = 50;
  const essenceDungeonResult = gameState.runEssenceDungeon('olympian_nexus', 1);
  console.log(`  Cleared "Olympian Nexus" [Tier 1]! Gained ${essenceDungeonResult.essencesAwarded} Essences of the Gods & ${essenceDungeonResult.soulEssenceAwarded} Soul Essence.`);
  if (essenceDungeonResult.essencesAwarded <= 0) throw new Error('Should award Essences of the Gods');

  // Test EXP Potions (0 Shards, consumes 1 Astral Essence + 5 God Essences)
  const testSpirit = gameState.state.spirits[0];
  const preXp = testSpirit.xp;
  gameState.state.resources.spiritShards = 1000;
  gameState.state.resources.essencesOfTheGods = 50;
  gameState.state.resources.soulEssence = 20;
  const initialShards = gameState.state.resources.spiritShards;
  const initialAstral = gameState.state.resources.soulEssence;
  gameState.buyExpPotion(testSpirit.id, 'lesser_elixir');
  console.log(`  Used Lesser Astral Elixir on ${testSpirit.customName}: XP ${preXp} -> ${testSpirit.xp} (+10,000 XP)`);
  if (testSpirit.xp < preXp + 10000 && testSpirit.level === 1) throw new Error('EXP potion failed to grant XP');
  if (gameState.state.resources.spiritShards !== initialShards) throw new Error('EXP potion should NOT consume regular shards!');
  if (gameState.state.resources.soulEssence !== initialAstral - 1) throw new Error('EXP potion should consume 1 Astral Essence!');

  // Test Combat Blessings
  gameState.applyTemporaryBlessing('blessing_ares');
  const activeBlessings = gameState.getActiveBlessings();
  const activeCount = Object.keys(activeBlessings).length;
  console.log(`  Applied "Blessing of Ares": Active blessings count = ${activeCount}`);
  if (activeCount === 0 || !activeBlessings.blessing_ares) throw new Error('Ares blessing not active');

  // Test 15: Celestial Spirits, Multi-Banner Summoning & Milestones
  console.log('\n[TEST 15] Testing Multi-Banner Summoning, 30x Bulk Contracts & Milestones:');
  const { BANNER_CONFIGS } = await import('../src/data/index.js');
  console.log(`  Banner catalog count: ${BANNER_CONFIGS.length} (Expected >= 3)`);
  if (BANNER_CONFIGS.length < 3) throw new Error('Expected at least 3 banner configurations');

  gameState.state.resources.spiritShards = 5000;
  const initialSpiritCount = gameState.state.spirits.length;
  const pullResult = gameState.contractSpirit(30, 'solaris_rate_up');
  console.log(`  Performed 30x Contract on Solaris Rate-Up! Received ${pullResult.length} spirits.`);
  if (pullResult.length !== 30) throw new Error('Expected 30 spirits from 30x pull');
  if (gameState.state.spirits.length !== initialSpiritCount + 30) throw new Error('Spirit collection count mismatch');
  console.log(`  Summon Level: ${gameState.state.stats.summonLevel} | Summon XP: ${gameState.state.stats.summonXp}`);
  if (gameState.state.stats.summonLevel < 2) throw new Error('Summon Level should have increased');

  // Test 16: Spirit Annulment & Bulk Annulment System
  console.log('\n[TEST 16] Testing Spirit Annulment & Bulk Annulment System:');
  const nonPartySpirits = gameState.state.spirits.filter(s => !gameState.state.party.includes(s.id));
  if (nonPartySpirits.length >= 2) {
    const spiritToAnnul = nonPartySpirits[0];
    const prevShards = gameState.state.resources.spiritShards;
    const annulShards = gameState.annulContract(spiritToAnnul.id);
    console.log(`  Annulled contract with "${spiritToAnnul.customName}": Gained +${annulShards} Shards`);
    if (gameState.state.resources.spiritShards !== prevShards + annulShards) {
      throw new Error('Spirit shards balance mismatch after annulment');
    }

    // Test bulk annulment with favorite and party protection
    const remainingNonParty = gameState.state.spirits.filter(s => !gameState.state.party.includes(s.id));
    if (remainingNonParty.length >= 2) {
      remainingNonParty[0].favorite = true; // Mark one as favorite
      const targetIds = [remainingNonParty[0].id, remainingNonParty[1].id, gameState.state.party[0]];
      const bulkRes = gameState.bulkAnnulContracts(targetIds);
      console.log(`  Bulk annul attempted on 3 targets (1 fav, 1 party, 1 normal) -> Annulled: ${bulkRes.annulledCount}, Shards: +${bulkRes.totalShardsGained}`);
      if (bulkRes.annulledCount !== 1) throw new Error('Bulk annul should skip favorite and active party spirits');
      if (bulkRes.totalShardsGained <= 0) throw new Error('Bulk annul should award shards for valid spirits');
    }
  }

  // Test 17: Dynamic Wave Progression & Floor Anti-Skip Integrity
  console.log('\n[TEST 17] Testing Dynamic Wave Progression & Floor Anti-Skip Integrity:');
  const mz = gameState.state.madnessZone;
  mz.stage = 1;
  mz.subStage = 1;
  mz.unlockedStages = [1];
  mz.highestStageUnlocked = 1;
  mz.highestStageCleared = 0;
  gameState.spawnMadnessEnemy();

  console.log(`  Initial State: Floor ${mz.stage}, Wave ${mz.subStage}/5, Cleared: ${mz.highestStageCleared}`);

  // Test that player CANNOT unlock Floor 2 before clearing Floor 1
  let unlockBlocked = false;
  try {
    gameState.unlockAndEnterStage(2);
  } catch (err) {
    unlockBlocked = true;
    console.log(`  [PASS] Blocked premature Floor 2 unlock: "${err.message}"`);
  }
  if (!unlockBlocked) throw new Error('Should not allow unlocking Floor 2 before clearing Floor 1');

  // Test dynamic wave progression (Wave 1 -> Wave 2)
  mz.currentSwarm.forEach(e => { e.hp = 0; e.isDefeated = true; });
  gameState.onSwarmCleared();
  console.log(`  After clearing Wave 1 -> Current Wave: ${mz.subStage}/5 (Expected 2)`);
  if (mz.subStage !== 2) throw new Error('Wave should have advanced to 2');

  // Advance through remaining waves to Boss
  mz.subStage = 5;
  gameState.spawnMadnessEnemy();
  mz.currentSwarm.forEach(e => { e.hp = 0; e.isDefeated = true; });
  gameState.onSwarmCleared();
  console.log(`  After defeating Boss -> highestStageCleared: ${mz.highestStageCleared} (Expected 1)`);
  if (mz.highestStageCleared !== 1) throw new Error('highestStageCleared should be 1 after boss kill');

  // Now unlock Floor 2 with Energy
  gameState.state.resources.energy = 50;
  const unlockRes = gameState.unlockAndEnterStage(2);
  console.log(`  Unlocked Floor 2: Stage is now ${mz.stage}, Wave ${mz.subStage}/5, Energy remaining: ${unlockRes.remainingEnergy}`);
  if (mz.stage !== 2 || mz.highestStageUnlocked !== 2) throw new Error('Floor 2 should be unlocked and active');

  // Test that player on Floor 1 CANNOT skip to Floor 3
  gameState.setStage(1);
  let skipBlocked = false;
  try {
    gameState.unlockAndEnterStage(3);
  } catch (err) {
    skipBlocked = true;
    console.log(`  [PASS] Blocked floor skip to Floor 3 while Floor 2 is uncleared: "${err.message}"`);
  }
  if (!skipBlocked) throw new Error('Should block skipping Floor 2 to unlock Floor 3');

  // Test 18: Spirit Ascension System (★1 to ★7) with Duplicates & Astral Essence
  console.log('\n[TEST 18] Testing Spirit Ascension System (★1 to ★7):');
  const baseCat = gameState.state.spirits.find(s => s.speciesId === 'cat_spirit');
  if (!baseCat) throw new Error('Base cat spirit not found for ascension test');

  // Create a duplicate cat spirit
  const dupCatId = gameState.generateId();
  const dupCat = {
    id: dupCatId,
    speciesId: 'cat_spirit',
    customName: 'Duplicate Cat',
    level: 1,
    xp: 0,
    tier: 1,
    rarity: 'COMMON',
    element: 'EARTH',
    power: 10,
    maxHp: 100,
    currentHp: 100,
    isFallen: false,
    isEquipped: false,
    favorite: false
  };
  gameState.state.spirits.push(dupCat);

  // Check eligible duplicates
  const eligibleDups = gameState.getEligibleAscensionDuplicates(baseCat.id);
  console.log(`  Found ${eligibleDups.length} eligible duplicate(s) for ${baseCat.customName}`);
  if (eligibleDups.length === 0) throw new Error('Should find at least 1 eligible duplicate');

  // Verify failure when insufficient Astral Essence
  gameState.state.resources.soulEssence = 0;
  let essenceBlocked = false;
  try {
    gameState.ascendSpirit(baseCat.id, [dupCatId]);
  } catch (err) {
    essenceBlocked = true;
    console.log(`  [PASS] Blocked ascension without Astral Essence: "${err.message}"`);
  }
  if (!essenceBlocked) throw new Error('Should block ascension when lacking Astral Essence');

  // Now fund Astral Essence and perform Ascension ★1
  gameState.state.resources.soulEssence = 10;
  const preAscPower = baseCat.power;
  const ascRes = gameState.ascendSpirit(baseCat.id, [dupCatId]);
  console.log(`  Ascended ${baseCat.customName} to ★${ascRes.newTier}! Power: ${preAscPower} -> ${baseCat.power} (+${ascRes.bonusPercent}% stats)`);
  if (baseCat.ascensionLevel !== 1) throw new Error('Ascension level should be 1');
  if (baseCat.power <= preAscPower) throw new Error('Ascension should boost spirit power');
  if (gameState.state.spirits.some(s => s.id === dupCatId)) throw new Error('Duplicate spirit should be consumed upon ascension');
  if (gameState.state.resources.soulEssence !== 9) throw new Error('Should deduct 1 Astral Essence');

  // 19. Test Celestial Constellations (Zodiac Tree)
  console.log('\n[TEST 19] Testing Celestial Constellations (Zodiac Tree):');
  gameState.state.resources.soulEssence = 20;
  const initialPower = gameState.getTotalPartyPower();
  const dracoUnlock = gameState.unlockConstellationStar('draco');
  console.log(`  Unlocked Draco Node 1: ${dracoUnlock.star.name} (${dracoUnlock.star.desc})`);
  if (gameState.state.constellations.draco !== 1) throw new Error('Draco should be level 1');
  if (gameState.state.resources.soulEssence !== 18) throw new Error('Should deduct 2 Astral Essences');
  
  const bonuses = gameState.getConstellationBonuses();
  console.log(`  Active Constellation Bonuses:`, bonuses);
  if (bonuses.partyAtkPercent !== 4) throw new Error('Draco node 1 should give 4% party ATK');

  const powerAfterDraco = gameState.getTotalPartyPower();
  console.log(`  Party Power: ${initialPower} -> ${powerAfterDraco} (+4% ATK boost reflected)`);
  if (powerAfterDraco <= initialPower) throw new Error('Party power should increase with constellation ATK bonus');

  // Pegasus Node 1 & 2 for Max Energy boost
  gameState.unlockConstellationStar('pegasus'); // Node 1 (cost 2)
  const prevMaxEnergy = gameState.state.resources.maxEnergy;
  gameState.unlockConstellationStar('pegasus'); // Node 2 (cost 3, +20 Max Energy)
  console.log(`  Unlocked Pegasus Node 2 -> Max Energy: ${prevMaxEnergy} -> ${gameState.state.resources.maxEnergy} (+20 boost)`);
  if (gameState.state.resources.maxEnergy !== prevMaxEnergy + 20) throw new Error('Pegasus node 2 should increase maxEnergy by 20');

  // 20. Test Astral Transmutation & Astral Expeditions
  console.log('\n[TEST 20] Testing Astral Transmutation & Astral Expeditions:');
  // Fund resources for transmutation
  gameState.state.resources.spiritShards = 5000;
  gameState.state.resources.essencesOfTheGods = 50;
  gameState.state.resources.soulEssence = 5;

  const preTransmuteAstral = gameState.state.resources.soulEssence;
  const transRes = gameState.transmuteShardsToAstralEssence();
  console.log(`  Transmutation 1: Cost ${transRes.shardCost} Shards + ${transRes.godCost} Gods -> Gained +${transRes.astralGained} Astral Essence (Total: ${gameState.state.resources.soulEssence})`);
  if (gameState.state.resources.soulEssence !== preTransmuteAstral + 1) throw new Error('Should gain 1 Astral Essence');
  if (transRes.shardCost !== 1000) throw new Error('First transmutation should cost 1000 shards');
  
  // Anti-oversaturation test: second transmutation costs 1,250 shards
  const transRes2 = gameState.transmuteShardsToAstralEssence();
  console.log(`  Transmutation 2 (Anti-Oversaturation): Cost ${transRes2.shardCost} Shards (Scaled up by +250 today)`);
  if (transRes2.shardCost !== 1250) throw new Error('Second transmutation should cost 1250 shards');

  // Test Astral Expeditions
  // Create 2 test non-party spirits for expedition
  const expSp1 = { id: 'exp_spirit_1', speciesId: 'cat_spirit', level: 10, element: 'WATER', rarity: 'COMMON', isEquipped: false };
  const expSp2 = { id: 'exp_spirit_2', speciesId: 'dog_spirit', level: 10, element: 'EARTH', rarity: 'COMMON', isEquipped: false };
  gameState.state.spirits.push(expSp1, expSp2);

  const eligibleExpSpirits = gameState.getEligibleExpeditionSpirits();
  console.log(`  Eligible idle spirits for dispatch: ${eligibleExpSpirits.length}`);

  // Test dispatching to Starlight Fissure (requires 1 spirit)
  const dispatchRes = gameState.dispatchExpedition('starlight_fissure', ['exp_spirit_1']);
  console.log(`  Dispatched expedition to Starlight Fissure: active = ${dispatchRes.expedition.active}`);
  if (!gameState.state.expeditions.starlight_fissure?.active) throw new Error('Expedition should be active');

  // Verify non-party spirit cannot be double-dispatched (nebula_abyss requires 2 spirits)
  let doubleDispatchBlocked = false;
  try {
    gameState.dispatchExpedition('nebula_abyss', ['exp_spirit_1', 'exp_spirit_2']);
  } catch (e) {
    doubleDispatchBlocked = true;
    console.log(`  [PASS] Blocked double dispatch: "${e.message}"`);
  }
  if (!doubleDispatchBlocked) throw new Error('Should block already-dispatched spirits');

  // Fast-forward expedition time for claim
  gameState.state.expeditions.starlight_fissure.startTime = Date.now() - (7200 * 1000 + 1000);
  const claimRes = gameState.claimExpeditionRewards('starlight_fissure');
  console.log(`  Claimed Starlight Fissure rewards: +${claimRes.astralGained} 🔮 Astral, +${claimRes.godsGained} 💠 Gods, +${claimRes.shardsGained} 💎 Shards (Element Match: ${claimRes.hasElementMatch})`);
  if (gameState.state.expeditions.starlight_fissure !== null) throw new Error('Expedition fissure should be cleared after claim');

  // 21. Test Bulk Dismantle for Artifacts (Relics) and Weapons
  console.log('\n[TEST 21] Testing Bulk Dismantle for Artifacts (Relics) and Weapons:');
  const dummyRelic3 = { uid: 'relic_bulk_3star', type: 'relic', stars: 3, level: 1, name: 'Bronze Helm' };
  const dummyRelic4 = { uid: 'relic_bulk_4star', type: 'relic', stars: 4, level: 2, name: 'Silver Aegis' };
  const dummyRelicEquipped = { uid: 'relic_bulk_eq', type: 'relic', stars: 3, level: 1, equippedToSpiritId: 'starter_spirit_1' };
  const dummyRelicFav = { uid: 'relic_bulk_fav', type: 'relic', stars: 3, level: 1, favorite: true };

  const dummyWeaponCommon = { uid: 'wep_bulk_com', type: 'weapon', rarity: 'COMMON', level: 1, name: 'Iron Sword' };
  const dummyWeaponEquipped = { uid: 'wep_bulk_eq', type: 'weapon', rarity: 'COMMON', level: 1, equippedToSpiritId: 'starter_spirit_1' };
  const dummyWeaponFav = { uid: 'wep_bulk_fav', type: 'weapon', rarity: 'COMMON', level: 1, favorite: true };

  gameState.state.inventory.equipment.push(
    dummyRelic3, dummyRelic4, dummyRelicEquipped, dummyRelicFav,
    dummyWeaponCommon, dummyWeaponEquipped, dummyWeaponFav
  );

  const prevShards = gameState.state.resources.spiritShards;
  const prevGodEssences = gameState.state.resources.essencesOfTheGods;

  // Attempt to bulk dismantle all 7 items
  const bulkRes = gameState.bulkDismantleEquipment([
    'relic_bulk_3star', 'relic_bulk_4star', 'relic_bulk_eq', 'relic_bulk_fav',
    'wep_bulk_com', 'wep_bulk_eq', 'wep_bulk_fav'
  ]);

  console.log(`  Bulk Dismantled: ${bulkRes.count} items, +${bulkRes.shardsGained} Shards, +${bulkRes.essencesGained} Gods Essences`);

  // Only 3 items should have been dismantled (the non-equipped, non-favorited ones)
  if (bulkRes.count !== 3) throw new Error(`Expected 3 items dismantled, got ${bulkRes.count}`);
  
  // Verify inventory removal and safety retention
  const eqUids = gameState.state.inventory.equipment.map(e => e.uid);
  if (eqUids.includes('relic_bulk_3star') || eqUids.includes('relic_bulk_4star') || eqUids.includes('wep_bulk_com')) {
    throw new Error('Dismantled items were not removed from equipment inventory');
  }
  if (!eqUids.includes('relic_bulk_eq') || !eqUids.includes('relic_bulk_fav')) {
    throw new Error('Equipped or favorited relics should NOT have been dismantled');
  }
  if (!eqUids.includes('wep_bulk_eq') || !eqUids.includes('wep_bulk_fav')) {
    throw new Error('Equipped or favorited weapons should NOT have been dismantled');
  }

  // Verify resource gains
  if (gameState.state.resources.spiritShards !== prevShards + bulkRes.shardsGained) {
    throw new Error('Spirit shards were not accurately updated after bulk dismantle');
  }
  if (gameState.state.resources.essencesOfTheGods !== prevGodEssences + bulkRes.essencesGained) {
    throw new Error('God essences were not accurately updated after bulk dismantle');
  }

  // Verify alias function gameState.bulkDismantle()
  const aliasRes = gameState.bulkDismantle([]);
  if (aliasRes.count !== 0) throw new Error('bulkDismantle alias failed');
  console.log('  [PASS] Bulk dismantle equipment successfully validated!');

  // Test 22: Weapon Enhancement System & Scaling (+1 to +15)
  console.log('\n[TEST 22] Testing Weapon Enhancement System & Stat Scaling (+1 to +15):');
  const { createWeaponInstance } = await import('../src/data/equipmentData.js');
  const testWpn = createWeaponInstance({ weaponTypeId: 'sword', rarity: 'RARE', level: 1 });
  gameState.state.inventory.equipment.push(testWpn);
  gameState.state.resources.spiritShards = 100000;
  gameState.state.resources.essencesOfTheGods = 2000;

  const initPower = testWpn.atkPower;
  const initLevel = testWpn.level;
  const enhance1 = gameState.enhanceWeapon(testWpn.uid);
  console.log(`  Enhanced weapon to +${testWpn.level}: ATK ${initPower} -> ${testWpn.atkPower} (Cost: ${enhance1.shardCost} Shards)`);
  if (testWpn.level !== 2) throw new Error(`Expected level 2, got ${testWpn.level}`);
  if (testWpn.atkPower <= initPower) throw new Error('Weapon ATK power did not increase upon enhancement');

  // Enhance up to max level +15
  while (testWpn.level < 15) {
    const nextLvl = testWpn.level + 1;
    const res = gameState.enhanceWeapon(testWpn.uid);
    if (nextLvl % 3 === 0 && res.essenceCost <= 0) {
      throw new Error(`Milestone +${nextLvl} should require Essences of the Gods`);
    }
  }

  console.log(`  Enhanced weapon to MAX level +${testWpn.level}: Final ATK Power: ${testWpn.atkPower}, Crit: ${testWpn.critRate}%, Ult Amp: ${testWpn.ultAmp}%`);
  if (testWpn.level !== 15) throw new Error('Expected weapon level 15');

  // Verify max level cap error
  let blockedOverMax = false;
  try {
    gameState.enhanceWeapon(testWpn.uid);
  } catch (err) {
    blockedOverMax = true;
    console.log(`  [PASS] Blocked enhancement beyond max: "${err.message}"`);
  }
  if (!blockedOverMax) throw new Error('Expected error when enhancing weapon past max level');

  // Verify generic enhanceEquipment helper
  const testWpn2 = createWeaponInstance({ weaponTypeId: 'bow', rarity: 'EPIC', level: 1 });
  gameState.state.inventory.equipment.push(testWpn2);
  const genRes = gameState.enhanceEquipment(testWpn2.uid);
  if (testWpn2.level !== 2) throw new Error('enhanceEquipment failed for weapon');
  console.log('  [PASS] Generic gameState.enhanceEquipment validated for weapons!');

  // Test 23: Spirit Combat Roles, Stats Scaling & Threat System (Phase 1)
  console.log('\n[TEST 23] Testing Spirit Combat Roles, Detailed Stats Scaling & Threat System (Phase 1):');
  const validRoleIds = Object.keys(ROLES);
  const speciesList = Object.values(SPIRIT_SPECIES);
  console.log(`  Total spirit species count: ${speciesList.length} (Expected 47)`);
  if (speciesList.length < 47) throw new Error(`Expected at least 47 species, found ${speciesList.length}`);

  const roleCounts = { MAIN_DPS: 0, SUB_DPS: 0, TANK: 0, SUPPORT: 0, HEALER: 0 };
  for (const sp of speciesList) {
    if (!sp.role) throw new Error(`Species "${sp.id}" is missing a combat role!`);
    if (!validRoleIds.includes(sp.role)) throw new Error(`Species "${sp.id}" has invalid role "${sp.role}"!`);
    roleCounts[sp.role]++;
  }

  console.log('  Role distribution across catalog:');
  for (const [rKey, count] of Object.entries(roleCounts)) {
    const roleInfo = getRoleInfo(rKey);
    console.log(`    ${roleInfo.icon} ${roleInfo.name}: ${count} spirits (Base Threat: ${roleInfo.baseThreat}, Favored Line: ${roleInfo.optimalColumnLabel})`);
  }

  // Verify getSpiritRole helper
  if (getSpiritRole('bull_spirit') !== 'TANK') throw new Error('Expected bull_spirit to have TANK role');
  if (getSpiritRole('solaris_lion_pride') !== 'MAIN_DPS') throw new Error('Expected solaris_lion_pride to have MAIN_DPS role');
  if (getSpiritRole({ speciesId: 'bear_of_dreams' }) !== 'HEALER') throw new Error('Expected bear_of_dreams to have HEALER role');

  // Verify calculateSpiritStats for Tank vs DPS vs Healer
  const tankStats = calculateSpiritStats('bull_spirit', 1, 'RARE');
  const dpsStats = calculateSpiritStats('shark_spirit', 1, 'RARE');
  const healerStats = calculateSpiritStats('wisp_spirit', 1, 'RARE');

  console.log(`  Tank (bull_spirit RARE Lv1): HP=${tankStats.maxHp}, DEF=${tankStats.def}, ATK=${tankStats.atk}, Threat=${tankStats.threat}`);
  console.log(`  DPS (shark_spirit RARE Lv1): HP=${dpsStats.maxHp}, DEF=${dpsStats.def}, ATK=${dpsStats.atk}, Threat=${dpsStats.threat}`);
  console.log(`  Healer (wisp_spirit RARE Lv1): HP=${healerStats.maxHp}, DEF=${healerStats.def}, ATK=${healerStats.atk}, Threat=${healerStats.threat}`);

  if (tankStats.threat <= dpsStats.threat) throw new Error('Tank should have higher innate threat than DPS');
  if (tankStats.maxHp <= dpsStats.maxHp) throw new Error('Tank should have higher HP than DPS');
  if (dpsStats.atk <= tankStats.atk) throw new Error('DPS should have higher ATK than Tank');
  if (healerStats.threat > 60) throw new Error('Healer should maintain minimal threat footprint');

  // Verify backward compatibility
  const catStats = calculateSpiritStats('cat_spirit', 1, 'COMMON');
  const expectedCatPower = calculateSpiritPower(SPIRIT_SPECIES.cat_spirit, 1, 'COMMON');
  if (catStats.power !== expectedCatPower) throw new Error(`Power mismatch: got ${catStats.power}, expected ${expectedCatPower}`);
  if (catStats.maxHp < 80) throw new Error(`Cat Spirit HP should be >= 80, got ${catStats.maxHp}`);

  console.log('  [PASS] Phase 1 spirit combat roles, stats formulas, and threat baselines fully validated!');

  // Test 24: 3x3 Tactical Grid Formation State, Auto-Format & Constraints (Phase 2)
  console.log('\n[TEST 24] Testing 3x3 Tactical Grid Formation State & Constraints (Phase 2):');
  
  // 1. Initial starter formation check
  const initForm = gameState.getPartyFormation();
  console.log('  Initial Formation Slots count:', Object.keys(initForm.slots).length, '(Expected 9)');
  if (Object.keys(initForm.slots).length !== 9) throw new Error('Formation grid must have exactly 9 slots (3x3)');
  if (!initForm.isValid) throw new Error(`Initial formation should be valid: ${initForm.validationError}`);
  console.log(`  Initial squad counts: Back=${initForm.counts.back}, Mid=${initForm.counts.mid}, Front=${initForm.counts.front}, Total=${initForm.counts.total}`);

  // 2. Setup full 5-spirit party (1 Tank, 1 Healer, 2 DPS, 1 Support)
  // Ensure distinct role composition: Cat (Sub-DPS), Bull (Tank), Caterpillar (Healer), Shark (Main DPS), Astraea (Support)
  let starterUnit = gameState.state.spirits.find(s => s.speciesId === 'cat_spirit');
  if (!starterUnit) {
    starterUnit = {
      id: 'starter_cat_unit',
      speciesId: 'cat_spirit',
      customName: 'Nimble Cat Spirit',
      level: 1, xp: 0, tier: 1, rarity: 'COMMON', element: 'WIND',
      power: 50, maxHp: 300, currentHp: 300, maxMp: 100, currentMp: 0, shieldHp: 0,
      isFallen: false, isEquipped: false
    };
    gameState.state.spirits.push(starterUnit);
  }
  const testTank = {
    id: 'test_tank_unit',
    speciesId: 'bull_spirit',
    customName: 'Iron Vanguard Bull',
    level: 1, xp: 0, tier: 1, rarity: 'EPIC', element: 'EARTH',
    power: 100, maxHp: 1000, currentHp: 1000, maxMp: 100, currentMp: 0, shieldHp: 0,
    isFallen: false, isEquipped: false
  };
  const testHealer = {
    id: 'test_healer_unit',
    speciesId: 'caterpillar_spirit',
    customName: 'Lepidopteran Vitality Healer',
    level: 1, xp: 0, tier: 1, rarity: 'EPIC', element: 'EARTH',
    power: 80, maxHp: 600, currentHp: 600, maxMp: 100, currentMp: 0, shieldHp: 0,
    isFallen: false, isEquipped: false
  };
  const testMainDps = {
    id: 'test_main_dps_unit',
    speciesId: 'shark_spirit',
    customName: 'Abyssal Apex Shark',
    level: 1, xp: 0, tier: 1, rarity: 'EPIC', element: 'WATER',
    power: 150, maxHp: 700, currentHp: 700, maxMp: 100, currentMp: 0, shieldHp: 0,
    isFallen: false, isEquipped: false
  };
  const testSupport = {
    id: 'test_support_unit',
    speciesId: 'astraea_valkyrie',
    customName: 'Star Valkyrie Astraea',
    level: 1, xp: 0, tier: 1, rarity: 'EPIC', element: 'WIND',
    power: 90, maxHp: 650, currentHp: 650, maxMp: 100, currentMp: 0, shieldHp: 0,
    isFallen: false, isEquipped: false
  };

  gameState.state.spirits.push(testTank, testHealer, testMainDps, testSupport);
  gameState.state.party = [starterUnit.id, testTank.id, testHealer.id, testMainDps.id, testSupport.id];
  starterUnit.isEquipped = true;
  testTank.isEquipped = true;
  testHealer.isEquipped = true;
  testMainDps.isEquipped = true;
  testSupport.isEquipped = true;

  // 3. Test autoFormatParty
  const autoForm = gameState.autoFormatParty();
  console.log(`  Auto-formatted 5-member party: Back=${autoForm.counts.back}, Mid=${autoForm.counts.mid}, Front=${autoForm.counts.front}`);
  if (!autoForm.isValid) throw new Error(`Auto-formatted party should be valid: ${autoForm.validationError}`);
  if (autoForm.counts.back !== 1) throw new Error(`Full party requires exactly 1 in Backline, got ${autoForm.counts.back}`);
  if (autoForm.counts.mid < 2 || autoForm.counts.mid > 3) throw new Error(`Full party requires 2 or 3 in Midline, got ${autoForm.counts.mid}`);
  if (autoForm.counts.front < 1 || autoForm.counts.front > 2) throw new Error(`Full party requires 1 or 2 in Frontline, got ${autoForm.counts.front}`);

  // Tank should be in Frontline (f1, f2, or f3)
  const tankSlot = gameState.getSpiritFormationSlot(testTank.id);
  console.log(`  Tank positioned at: ${tankSlot} (Role: TANK, Column: ${initForm.slots[tankSlot]?.col})`);
  if (!['f1', 'f2', 'f3'].includes(tankSlot)) throw new Error(`Expected Tank to be seated in Frontline, got ${tankSlot}`);

  // Healer should be in Backline (b1, b2, or b3)
  const healerSlot = gameState.getSpiritFormationSlot(testHealer.id);
  console.log(`  Healer positioned at: ${healerSlot} (Role: HEALER, Column: ${initForm.slots[healerSlot]?.col})`);
  if (!['b1', 'b2', 'b3'].includes(healerSlot)) throw new Error(`Expected Healer to be seated in Backline, got ${healerSlot}`);

  // 4. Test constraint enforcement: Moving a 2nd unit to Backline MUST fail
  let blockedBacklineOverflow = false;
  try {
    // Attempt to move Tank into Backline top (b1) when Healer is in Backline (b2)
    gameState.setSpiritPosition(testTank.id, 'b1');
  } catch (err) {
    blockedBacklineOverflow = true;
    console.log(`  [PASS] Blocked Backline overflow (>1 unit): "${err.message}"`);
  }
  if (!blockedBacklineOverflow) throw new Error('Should reject placing more than 1 spirit into Backline');

  // 5. Test legal move: Move tank within Frontline
  const oldFrontSlot = gameState.getSpiritFormationSlot(testTank.id);
  const targetFrontSlot = oldFrontSlot === 'f2' ? 'f1' : 'f2';
  gameState.setSpiritPosition(testTank.id, targetFrontSlot);
  if (gameState.getSpiritFormationSlot(testTank.id) !== targetFrontSlot) {
    throw new Error('Failed to move Tank to open frontline slot');
  }
  console.log(`  [PASS] Legal repositioning to ${targetFrontSlot} succeeded!`);

  // 6. Test swapFormationSlots
  gameState.swapFormationSlots(targetFrontSlot, oldFrontSlot);
  if (gameState.getSpiritFormationSlot(testTank.id) !== oldFrontSlot) {
    throw new Error('swapFormationSlots failed to return unit to original slot');
  }
  console.log(`  [PASS] Slot swap between ${targetFrontSlot} and ${oldFrontSlot} validated!`);

  // 7. Verify getPartySpiritsByFormation returns enriched metadata
  const formationParty = gameState.getPartySpiritsByFormation();
  console.log('  Annotated party spirits:');
  for (const s of formationParty) {
    console.log(`    ${s.customName}: Slot=${s.formationSlot} (${s.formationColumn.toUpperCase()}) | ThreatMult=${s.threatMultiplier}x | Perk="${s.columnPerk}"`);
    if (!s.formationSlot) throw new Error(`Missing formationSlot for spirit ${s.customName}`);
    if (!['back', 'mid', 'front'].includes(s.formationColumn)) throw new Error(`Invalid formationColumn for spirit ${s.customName}`);
  }

  console.log('  [PASS] Phase 2 3x3 tactical grid formation state, auto-layout and constraints fully validated!');

  // =========================================================================
  // [TEST 25] Testing Aggro, Threat Targeting, Tank Taunt Lock & DEF Mitigation (Phase 3)
  // =========================================================================
  console.log('\n[TEST 25] Testing Aggro, Threat Targeting, Tank Taunt Lock & DEF Mitigation (Phase 3):');

  // 1. Verify getSpiritCombatStats calculates perks and effective threat
  const phase3TankStats = gameState.getSpiritCombatStats(testTank);
  const phase3HealerStats = gameState.getSpiritCombatStats(testHealer);
  const phase3DpsStats = gameState.getSpiritCombatStats(testMainDps);

  console.log(`  Frontline Tank: Role=${phase3TankStats.role}, DEF=${phase3TankStats.def} (Vanguard Perk +15%), Threat=${phase3TankStats.effectiveThreat} (Base: ${phase3TankStats.baseThreat} * 2.0x)`);
  console.log(`  Backline Healer: Role=${phase3HealerStats.role}, HealAmp=${phase3HealerStats.healAmp} (Sanctuary Perk +15%), Threat=${phase3HealerStats.effectiveThreat} (Base: ${phase3HealerStats.baseThreat} * 0.5x)`);
  console.log(`  Midline DPS: Role=${phase3DpsStats.role}, ATK=${phase3DpsStats.atk}, Threat=${phase3DpsStats.effectiveThreat} (Base: ${phase3DpsStats.baseThreat} * 1.0x)`);

  if (phase3TankStats.threatMultiplier !== 2.0) throw new Error(`Frontline tank should have 2.0x threat multiplier, got ${phase3TankStats.threatMultiplier}`);
  if (phase3HealerStats.threatMultiplier !== 0.5) throw new Error(`Backline healer should have 0.5x threat multiplier, got ${phase3HealerStats.threatMultiplier}`);
  if (phase3HealerStats.healAmp !== 1.15) throw new Error(`Backline healer should receive 1.15x healAmp, got ${phase3HealerStats.healAmp}`);

  // 2. Test DEF Damage Mitigation Formula: DamageTaken = RawDamage * (350 / (350 + DEF))
  const zeroDefMit = gameState.calculateDamageMitigation(100, 0);
  const def350Mit = gameState.calculateDamageMitigation(100, 350);
  const def700Mit = gameState.calculateDamageMitigation(100, 700);

  console.log(`  DEF Mitigation (Raw 100): DEF 0 -> ${zeroDefMit.mitigatedDamage} dmg | DEF 350 -> ${def350Mit.mitigatedDamage} dmg (-50%) | DEF 700 -> ${def700Mit.mitigatedDamage} dmg (-67%)`);
  if (zeroDefMit.mitigatedDamage !== 100) throw new Error(`0 DEF should take 100 dmg, got ${zeroDefMit.mitigatedDamage}`);
  if (def350Mit.mitigatedDamage !== 50) throw new Error(`350 DEF should take 50 dmg, got ${def350Mit.mitigatedDamage}`);
  if (def700Mit.mitigatedDamage !== 33) throw new Error(`700 DEF should take 33 dmg, got ${def700Mit.mitigatedDamage}`);

  // 3. Test Threat-Weighted Targeting Distribution
  const livingParty = gameState.getPartySpirits().filter(s => !s.isFallen);
  const targetCounts = {};
  livingParty.forEach(s => targetCounts[s.id] = 0);

  const SIMULATION_ROUNDS = 1000;
  for (let i = 0; i < SIMULATION_ROUNDS; i++) {
    const picked = gameState.selectCombatTarget(livingParty);
    targetCounts[picked.id] = (targetCounts[picked.id] || 0) + 1;
  }

  const tankHits = targetCounts[testTank.id] || 0;
  const healerHits = targetCounts[testHealer.id] || 0;
  console.log(`  Targeting Simulation (1000 strikes): Frontline Tank: ${tankHits} hits (${(tankHits/10).toFixed(1)}%) vs Backline Healer: ${healerHits} hits (${(healerHits/10).toFixed(1)}%)`);

  if (tankHits <= healerHits) {
    throw new Error(`Frontline Tank (${tankHits}) should receive significantly more attacks than Backline Healer (${healerHits})`);
  }
  if (tankHits < 350) {
    throw new Error(`Frontline Tank should draw at least 35% of attacks in 5-man party, got ${tankHits}`);
  }

  // 4. Test Tank Taunt Lock (100% targeting draw)
  gameState.setSpiritTauntLock(testTank.id, 6.0);
  if (!testTank.tauntTimer || testTank.tauntTimer <= 0) throw new Error('setSpiritTauntLock should set tauntTimer');

  let tauntLockHits = 0;
  for (let i = 0; i < 100; i++) {
    const picked = gameState.selectCombatTarget(livingParty);
    if (picked.id === testTank.id) tauntLockHits++;
  }
  console.log(`  Taunt Lock Active: Frontline Tank intercepted ${tauntLockHits}/100 attacks (100% expected)`);
  if (tauntLockHits !== 100) throw new Error(`Active Taunt Lock MUST intercept 100% of attacks, got ${tauntLockHits}/100`);

  // 5. Test Tank Ultimate execution applying shields and Taunt Lock
  testTank.currentHp = testTank.maxHp;
  testTank.shieldHp = 0;
  testTank.tauntTimer = 0;
  gameState.procSpiritUltimate(testTank);

  if (testTank.tauntTimer <= 0) throw new Error('Tank ultimate MUST activate Taunt Lock');
  const livingAlliesWithShield = livingParty.filter(s => s.shieldHp > 0);
  console.log(`  Tank Ultimate: Activated ${testTank.tauntTimer}s Taunt Lock & shielded ${livingAlliesWithShield.length}/${livingParty.length} allies`);
  if (livingAlliesWithShield.length !== livingParty.length) throw new Error('Tank ultimate should grant shield to all living party members');

  // Clear taunt timer for cleanup
  testTank.tauntTimer = 0;

  console.log('  [PASS] Phase 3 Threat targeting, Tank Taunt Lock, DEF mitigation, and role ultimates fully validated!');

  // =========================================================================
  // [TEST 26] Testing Sprite Animation Pipeline, Manifest & Controller (Phase 4)
  // =========================================================================
  console.log('\n[TEST 26] Testing Sprite Animation Pipeline, Manifest & Controller (Phase 4):');

  // 1. Verify Manifest Configurations and Species Mappings
  const mappedCount = Object.keys(SPRITE_MANIFEST.speciesMapping).length;
  console.log(`  Species mapped to spritesheets: ${mappedCount} (Expected >= 40)`);
  if (mappedCount < 40) throw new Error(`Expected at least 40 species mapped, got ${mappedCount}`);

  const sampleSpecies = [
    { id: 'cat_spirit', expected: 'feline_shadow' },
    { id: 'bull_spirit', expected: 'bovine_earth' },
    { id: 'chicken_spirit', expected: 'avian_blaze' },
    { id: 'caterpillar_spirit', expected: 'insect_chrysalis' },
    { id: 'shark_spirit', expected: 'draconic_leviathan' },
    { id: 'solaris_the_one', expected: 'celestial_sun' },
    { id: 'dog_spirit', expected: 'canine_guardian' }
  ];

  for (const s of sampleSpecies) {
    const sheetKey = getSheetKeyForSpecies(s.id);
    if (sheetKey !== s.expected) {
      throw new Error(`Species "${s.id}" mapped to "${sheetKey}", expected "${s.expected}"`);
    }
    console.log(`  Mapped: ${s.id} ➔ ${sheetKey} (48x48)`);
  }

  // 2. Verify Physical Existence of All SVG Spritesheets
  const requiredSheets = Object.keys(SPRITE_MANIFEST.sheets);
  console.log(`  Total creature & relic spritesheets defined: ${requiredSheets.length} (Expected >= 7)`);
  if (requiredSheets.length < 7) throw new Error(`Expected at least 7 sheets, got ${requiredSheets.length}`);

  for (const sheetKey of requiredSheets) {
    const sheetDef = SPRITE_MANIFEST.sheets[sheetKey];
    const fullPath = path.resolve(process.cwd(), 'public', sheetDef.path.replace(/^\//, ''));
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Spritesheet file missing on disk: ${fullPath}`);
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('<svg') || !content.includes('viewBox="0 0 384 48"')) {
      throw new Error(`Invalid SVG spritesheet format in ${sheetDef.path}`);
    }
  }
  console.log(`  [PASS] All ${requiredSheets.length} SVG spritesheet asset files verified on disk!`);

  // 3. Test SpriteAnimator Controller State Machine
  const animator = new SpriteAnimator('feline_shadow');
  if (animator.currentAnim !== 'idle') throw new Error(`Initial anim should be idle, got ${animator.currentAnim}`);
  if (animator.getCurrentFrame() !== 0) throw new Error(`Initial frame should be 0, got ${animator.getCurrentFrame()}`);

  // Test frame stepping
  animator.update(0.25); // 0.25s at 5 fps = step forward ~1 frame
  const currentFrame = animator.getCurrentFrame();
  console.log(`  SpriteAnimator frame stepped: 0 ➔ ${currentFrame} (Idle loop active)`);
  if (currentFrame === 0) throw new Error('Frame should advance with delta time');

  // Test attack trigger and auto-return to idle
  let attackCompleted = false;
  animator.triggerAttack(() => {
    attackCompleted = true;
  });
  if (animator.currentAnim !== 'attack') throw new Error(`Expected attack anim, got ${animator.currentAnim}`);

  // Step through attack frames
  animator.update(0.5); // Fast forward attack
  if (!attackCompleted || animator.currentAnim !== 'idle') {
    throw new Error('Attack animation should complete and return to idle state');
  }
  console.log('  [PASS] Attack animation executed and smoothly transitioned back to idle loop!');

  // Test hurt trigger
  animator.triggerHurt();
  if (animator.currentAnim !== 'hurt') throw new Error(`Expected hurt anim, got ${animator.currentAnim}`);
  animator.update(0.5); // Complete hurt
  if (animator.currentAnim !== 'idle') throw new Error('Hurt animation should complete back to idle');
  console.log('  [PASS] Hurt animation executed and returned to idle!');

  console.log('  [PASS] Phase 4 Free Animated Sprites Pipeline & Animation Controller fully validated!');

  // 27. Test Animated Equipment Assets, Relic Essence Dismantle & Audio Throttling
  console.log('\n[TEST 27] Testing Animated Equipment Assets, Relic Essence Dismantle & Audio Throttling:');
  const weaponHtml = createAnimatedWeaponHtml({ weaponType: 'bow' });
  if (!weaponHtml.includes('animated-weapon-sprite') || !weaponHtml.includes('weapon_celestial_bow')) {
    throw new Error('Weapon animated HTML generation failed for bow');
  }
  const relicHtml = createAnimatedRelicHtml({ setId: 'zeus' }, 'headgear');
  if (!relicHtml.includes('animated-relic-sprite') || !relicHtml.includes('relic_crown_zeus')) {
    throw new Error('Relic animated HTML generation failed for zeus crown');
  }
  console.log('  [PASS] createAnimatedWeaponHtml and createAnimatedRelicHtml verified!');

  // Test relic dismantle awards Essences of the Gods
  const initialEssences = gameState.state.resources.essencesOfTheGods || 0;
  const testRelic = {
    uid: 'test_relic_essence_uid_999',
    type: 'relic',
    stars: 3,
    level: 1,
    setId: 'zeus',
    slotTypeId: 'headgear',
    name: 'Test Zeus Crown'
  };
  gameState.state.inventory.equipment.push(testRelic);
  const dismantleRes = gameState.dismantleEquipment('test_relic_essence_uid_999');
  if (dismantleRes.essencesGained < 5) {
    throw new Error(`Expected at least 5 essences on 3-star relic dismantle, got ${dismantleRes.essencesGained}`);
  }
  if ((gameState.state.resources.essencesOfTheGods || 0) < initialEssences + 5) {
    throw new Error('GameState resources did not reflect gained essences of the gods');
  }
  console.log(`  [PASS] Single relic dismantle granted +${dismantleRes.essencesGained} Essences of the Gods!`);

  // Test Audio Manager Ultimate SFX throttle
  const initialUltTime = Date.now();
  audioManager.lastUltSfxTime = initialUltTime;
  audioManager.playSfx('ult');
  // Since within 1400ms, lastUltSfxTime must remain unchanged
  if (audioManager.lastUltSfxTime !== initialUltTime) {
    throw new Error('Ultimate SFX was not throttled within cooldown window');
  }
  console.log('  [PASS] Audio Manager ultimate SFX throttling validated!');

  // [TEST 28] Testing Phase 2 Economy Rebalance (24h Nerfed Offline, Currency Nerfs & Substat Reroll)
  console.log('\n[TEST 28] Testing Phase 2 Economy Rebalance & Soul Essence Substat Reroll:');
  const offline24hRes = gameState.applyOfflineGains(100000);
  if (offline24hRes.elapsedSeconds !== 86400) {
    throw new Error(`Expected offline duration capped at 86400s (24h), got ${offline24hRes.elapsedSeconds}`);
  }
  if (offline24hRes.energyGained > 35) {
    throw new Error(`Expected offline energy accumulation capped at <= 35, got ${offline24hRes.energyGained}`);
  }
  if (offline24hRes.offlineEssence > 3) {
    throw new Error(`Expected offline soul essence capped at <= 3 in 24h, got ${offline24hRes.offlineEssence}`);
  }
  console.log(`  24h Offline Gains: Capped at ${offline24hRes.elapsedSeconds}s | Energy: +${offline24hRes.energyGained} (<=35) | Essence: +${offline24hRes.offlineEssence} (<=3)`);
  console.log('  [PASS] 24h Offline progression nerf & diminishing curve fully validated!');

  // Test Soul Essence Substat Reroll
  const rerollRelic = {
    uid: 'test_reroll_relic_uid_888',
    type: 'relic',
    stars: 4,
    level: 6,
    setId: 'hades',
    slotTypeId: 'ring',
    name: "Hades's Ring",
    mainStatName: 'Bonus ATK Power',
    mainStatValue: 60,
    substats: [
      { typeId: 'flat_hp', name: 'Bonus Max HP', value: 120, rolls: 1 },
      { typeId: 'flat_shield', name: 'Shield Strength', value: 50, rolls: 1 }
    ]
  };
  gameState.state.inventory.equipment.push(rerollRelic);

  gameState.state.resources.soulEssence = 2;
  let blockedLowEssence = false;
  try {
    gameState.rerollRelicSubstats('test_reroll_relic_uid_888');
  } catch (err) {
    blockedLowEssence = err.message.includes('Insufficient Soul Essence');
  }
  if (!blockedLowEssence) {
    throw new Error('Failed to block substat reroll with insufficient Soul Essence');
  }
  console.log('  [PASS] Blocked substat reroll when Soul Essence < 5!');

  gameState.state.resources.soulEssence = 10;
  const rerollRes = gameState.rerollRelicSubstats('test_reroll_relic_uid_888');
  if (gameState.state.resources.soulEssence !== 5) {
    throw new Error(`Expected 5 Soul Essence remaining after 5 spent, got ${gameState.state.resources.soulEssence}`);
  }
  if (!Array.isArray(rerollRes.item.substats) || rerollRes.item.substats.length === 0) {
    throw new Error('Rerolled relic has empty or invalid substats');
  }
  console.log(`  Rerolled Hades Ring Substats for 5 🔮: Count=${rerollRes.item.substats.length}, Remaining 🔮=${gameState.state.resources.soulEssence}`);
  console.log('  [PASS] Soul Essence Substat Reroll successfully validated!');

  // 29. Test Phase 3: Relic Enhancement Revamp, Divine Scripture & 4 New Greek God Sets
  console.log('\n[TEST 29] Testing Phase 3: Relic Enhancement Revamp, Divine Scripture & Greek God Sets:');

  // Verify Greek God Sets definitions
  const greekSets = ['athena', 'hermes', 'artemis', 'hephaestus'];
  for (const sId of greekSets) {
    const sDef = GREEK_GOD_SETS[sId];
    if (!sDef || !sDef.bonus2pc || !sDef.bonus4pc) {
      throw new Error(`Greek God Set "${sId}" definition missing or incomplete!`);
    }
  }
  console.log('  [PASS] Greek God sets (Athena, Hermes, Artemis, Hephaestus) verified in GREEK_GOD_SETS!');

  // Test Relic Substat Roll Tracking
  const trackRelic = {
    uid: 'test_roll_track_relic',
    type: 'relic',
    setId: 'hephaestus',
    slotTypeId: 'ring',
    name: "Hephaestus's Ring",
    stars: 4,
    level: 0,
    mainStatName: 'Bonus ATK Power',
    mainStatValue: 40,
    substats: [
      { typeId: 'crit_rate', name: 'Crit Rate %', isPercent: true, value: 3.5, rolls: 1 },
      { typeId: 'crit_dmg', name: 'Crit DMG %', isPercent: true, value: 7.0, rolls: 1 },
      { typeId: 'flat_hp', name: 'Bonus Max HP', isPercent: false, value: 150, rolls: 1 },
      { typeId: 'flat_shield', name: 'Shield Strength', isPercent: false, value: 80, rolls: 1 }
    ]
  };
  gameState.state.inventory.equipment.push(trackRelic);

  // Enhance relic to milestone +3
  enhanceRelicData(trackRelic);
  enhanceRelicData(trackRelic);
  enhanceRelicData(trackRelic);
  if (trackRelic.level !== 3) throw new Error(`Expected level 3, got ${trackRelic.level}`);
  const hasUpgradedRoll = trackRelic.substats.some(s => s.rolls === 2);
  if (!hasUpgradedRoll) throw new Error('Expected at least one substat to have rolls === 2 after +3 milestone upgrade');
  console.log('  [PASS] Relic substat upgrade roll tracking verified: a substat reached [★2 Rolls]!');

  // Test Buying Divine Relic Scripture
  gameState.state.resources.soulEssence = 30;
  const initialScriptures = gameState.state.resources.divineScriptures || 0;
  const buyRes = gameState.buyDivineScripture(1);
  if (gameState.state.resources.divineScriptures !== initialScriptures + 1) {
    throw new Error('Divine scripture count did not increment');
  }
  if (gameState.state.resources.soulEssence !== 15) {
    throw new Error(`Expected 15 Soul Essence left, got ${gameState.state.resources.soulEssence}`);
  }
  console.log(`  [PASS] Bought Divine Scripture for 15 🔮: Remaining 🔮=${gameState.state.resources.soulEssence}, Total 📜=${gameState.state.resources.divineScriptures}`);

  // Test Applying Divine Relic Scripture (select 2 guaranteed substats)
  const scriptureRelic = {
    uid: 'test_scripture_target_relic',
    type: 'relic',
    setId: 'athena',
    slotTypeId: 'headgear',
    name: "Athena's Helm",
    stars: 5,
    level: 6,
    mainStatName: 'Bonus Max HP',
    mainStatValue: 120,
    substats: [
      { typeId: 'flat_atk', name: 'Bonus ATK Power', value: 20, rolls: 1 },
      { typeId: 'evasion', name: 'Evasion %', value: 3.0, rolls: 1 }
    ]
  };
  gameState.state.inventory.equipment.push(scriptureRelic);

  const prevScriptures = gameState.state.resources.divineScriptures;
  const scriptRes = gameState.applyDivineScripture('test_scripture_target_relic', 'crit_rate', 'crit_dmg');
  if (gameState.state.resources.divineScriptures !== prevScriptures - 1) {
    throw new Error('Divine scripture not consumed');
  }
  const hasCritRate = scriptRes.item.substats.some(s => s.typeId === 'crit_rate');
  const hasCritDmg = scriptRes.item.substats.some(s => s.typeId === 'crit_dmg');
  if (!hasCritRate || !hasCritDmg) {
    throw new Error('Guaranteed substats (crit_rate & crit_dmg) were not both inscribed onto relic!');
  }
  console.log(`  [PASS] Divine Relic Scripture applied! Guaranteed: Crit Rate & Crit DMG present in inscribed relic!`);

  // Test Hephaestus 2-pc Weapon ATK boost in getSpiritTotalPower
  const testWpnHeph = {
    uid: 'test_wpn_hephaestus',
    type: 'weapon',
    name: 'Godly Blade',
    atkPower: 100,
    equippedToSpiritId: null
  };
  const testRelicH1 = {
    uid: 'test_relic_h1',
    type: 'relic',
    setId: 'hephaestus',
    slotTypeId: 'ring',
    name: "Hephaestus Ring",
    equippedToSpiritId: null
  };
  const testRelicH2 = {
    uid: 'test_relic_h2',
    type: 'relic',
    setId: 'hephaestus',
    slotTypeId: 'totem',
    name: "Hephaestus Totem",
    equippedToSpiritId: null
  };
  gameState.state.inventory.equipment.push(testWpnHeph, testRelicH1, testRelicH2);

  const testSpiritHeph = {
    id: 'test_spirit_hephaestus',
    speciesId: 'cat_spirit',
    customName: 'Forge Cat',
    power: 100,
    level: 1,
    rarity: 'COMMON',
    weapon: testWpnHeph.uid,
    relics: { ring: testRelicH1.uid, totem: testRelicH2.uid }
  };
  testWpnHeph.equippedToSpiritId = testSpiritHeph.id;
  testRelicH1.equippedToSpiritId = testSpiritHeph.id;
  testRelicH2.equippedToSpiritId = testSpiritHeph.id;
  gameState.state.spirits.push(testSpiritHeph);

  gameState.invalidateCaches();
  const calculatedPower = gameState.getSpiritTotalPower(testSpiritHeph);
  // Base power 100 + weapon power 100 * (1 + 0.25 Hephaestus weapon bonus) = 100 + 125 = 225 (* constellation multiplier if unlocked)
  const constBonus = (gameState.getConstellationBonuses?.().partyAtkPercent || 0) / 100;
  const expectedPower = Math.round(225 * (1 + constBonus));
  if (calculatedPower !== expectedPower) {
    throw new Error(`Expected Hephaestus 2-pc power ${expectedPower}, got ${calculatedPower}`);
  }
  console.log(`  [PASS] Hephaestus 2-pc set bonus (+25% Weapon ATK) correctly calculated: Power = ${calculatedPower}!`);

  // Test proc4PieceSetBonus for the 4 sets
  gameState.state.madnessZone.currentSwarm = [
    { id: 'mob1', name: 'Void Goblin', hp: 1000, maxHp: 1000, power: 100, isDefeated: false }
  ];
  gameState.proc4PieceSetBonus(testSpiritHeph, GREEK_GOD_SETS.athena);
  gameState.proc4PieceSetBonus(testSpiritHeph, GREEK_GOD_SETS.hermes);
  gameState.proc4PieceSetBonus(testSpiritHeph, GREEK_GOD_SETS.artemis);
  gameState.proc4PieceSetBonus(testSpiritHeph, GREEK_GOD_SETS.hephaestus);
  console.log('  [PASS] proc4PieceSetBonus successfully fired for Athena, Hermes, Artemis, and Hephaestus!');

  // Test 30: Phase 4 Zodiac Constellations, New Spirit Evolution Lines & Abyssal Rift Banner
  console.log('\n[TEST 30] Testing Phase 4 Zodiac Constellations, 3 Spirit Lines & Abyssal Rift Banner:');
  const { CONSTELLATIONS_CONFIG, BANNER_CONFIGS: bannersList } = await import('../src/data/index.js');
  
  // 1. Verify 8 Zodiac Constellations (40 stars total)
  const constellationKeys = Object.keys(CONSTELLATIONS_CONFIG);
  console.log(`  Total Constellations: ${constellationKeys.length} (Expected >= 8)`);
  if (constellationKeys.length < 8) throw new Error(`Expected at least 8 constellations, got ${constellationKeys.length}`);
  const requiredNewConstellations = ['leo', 'taurus', 'scorpio', 'aquarius', 'sagittarius'];
  for (const cKey of requiredNewConstellations) {
    if (!CONSTELLATIONS_CONFIG[cKey]) throw new Error(`Missing zodiac constellation: ${cKey}`);
    if (CONSTELLATIONS_CONFIG[cKey].stars.length !== 5) throw new Error(`Constellation ${cKey} does not have 5 stars`);
  }
  console.log('  [PASS] Verified Leo, Taurus, Scorpio, Aquarius, and Sagittarius constellations with 5 stars each.');

  // Test unlocking a Leo star
  gameState.state.resources.soulEssence = 20;
  const leoRes = gameState.unlockConstellationStar('leo');
  if (gameState.state.constellations.leo !== 1) throw new Error('Leo constellation should be level 1');
  const cBonuses = gameState.getConstellationBonuses();
  if (!cBonuses.bossDmgPercent || cBonuses.bossDmgPercent < 5) {
    throw new Error('Expected bossDmgPercent bonus from leo star 1');
  }
  console.log(`  [PASS] Unlocked Leo star (Lionheart Strike): +${cBonuses.bossDmgPercent}% Boss Damage active!`);

  // 2. Verify 3 New Spirit Evolution Lines in Catalog
  const requiredNewSpecies = [
    'baphomet_initiate', 'baphomet_voidbinder', 'baphomet_archdemon_lord',
    'chrono_hatchling', 'chrono_drake', 'ouroboros_time_sovereign',
    'dawn_herald', 'seraph_guardian', 'archangel_uriel'
  ];
  for (const spId of requiredNewSpecies) {
    if (!SPIRIT_SPECIES[spId]) throw new Error(`Missing species in catalog: ${spId}`);
  }
  console.log('  [PASS] Verified all 9 species forms across Baphomet, Chrono, and Seraphic lines in catalog.');

  // Verify UNCOMMON pool has base forms
  const uncomPool = CONTRACT_POOLS_BY_RARITY.UNCOMMON;
  if (!uncomPool.includes('baphomet_initiate') || !uncomPool.includes('chrono_hatchling') || !uncomPool.includes('dawn_herald')) {
    throw new Error('CONTRACT_POOLS_BY_RARITY.UNCOMMON missing new base spirits');
  }
  console.log('  [PASS] Verified baphomet_initiate, chrono_hatchling, and dawn_herald in UNCOMMON contract pool.');

  // Test Evolution flow
  const testBaph = {
    id: 'test_baph_1',
    speciesId: 'baphomet_initiate',
    customName: 'Baphomet Initiate',
    tier: 1,
    level: 20,
    xp: 0,
    rarity: 'UNCOMMON',
    canEvolve: true,
    evolutionHistory: ['Baphomet Initiate'],
    power: 50,
    maxHp: 200,
    currentHp: 200
  };
  gameState.state.spirits.push(testBaph);
  gameState.evolveSpirit('test_baph_1');
  if (testBaph.speciesId !== 'baphomet_voidbinder') {
    throw new Error(`Expected evolution to baphomet_voidbinder, got ${testBaph.speciesId}`);
  }
  console.log(`  [PASS] Successfully evolved test spirit to: ${testBaph.customName} (Tier ${testBaph.tier})!`);

  // 3. Verify Abyssal Rift Banner
  const abyssalBanner = bannersList.find(b => b.id === 'abyssal_rift');
  if (!abyssalBanner) throw new Error('abyssal_rift banner configuration missing!');
  if (abyssalBanner.featuredSpeciesId !== 'baphomet_voidbinder') {
    throw new Error(`Unexpected featured species for Abyssal Rift: ${abyssalBanner.featuredSpeciesId}`);
  }
  console.log(`  [PASS] Abyssal Rift banner verified (Featured: ${abyssalBanner.characterName})!`);

  // Test summon on Abyssal Rift banner
  gameState.state.resources.spiritShards = 2000;
  const abyssalSummons = gameState.contractSpirit(10, 'abyssal_rift');
  if (abyssalSummons.length !== 10) throw new Error('Expected 10 summons from Abyssal Rift banner');
  console.log(`  [PASS] Performed 10x Contract on Abyssal Rift banner (${abyssalSummons.length} spirits received)!`);

  // Test 31: Phase 5 Tab Switching Offline Progression, Permanent Banners & Animated Chamber Sprites
  console.log('\n[TEST 31] Testing Phase 5 Tab Switching Offline Progression & Permanent Banners:');
  
  // 1. Verify all banners have timerText set to 'Permanent'
  for (const banner of bannersList) {
    if (banner.timerText !== 'Permanent') {
      throw new Error(`Banner ${banner.id} timerText is "${banner.timerText}", expected "Permanent"`);
    }
  }
  console.log(`  [PASS] Verified all ${bannersList.length} rate-up banners have timerText set to "Permanent"!`);

  // 2. Verify Tab Switching Departure & Refocus Simulation
  const preDepartureTime = Date.now() - 120000; // Left 2 minutes ago
  gameState._isTabHidden = true;
  gameState._tabHiddenTimestamp = preDepartureTime;
  gameState.state.last_saved = preDepartureTime;

  // Simulate tab focus return
  const nowFocus = Date.now();
  const awaySeconds = Math.floor((nowFocus - gameState._tabHiddenTimestamp) / 1000);
  console.log(`  Simulated away duration: ${awaySeconds}s (Expected >= 120s)`);
  if (awaySeconds < 120) throw new Error(`Unexpected awaySeconds: ${awaySeconds}`);

  const focusReport = gameState.applyOfflineGains(awaySeconds);
  gameState._isTabHidden = false;
  gameState._tabHiddenTimestamp = null;
  gameState.state.last_saved = nowFocus;

  if (focusReport.elapsedSeconds !== awaySeconds) {
    throw new Error(`Expected report elapsedSeconds ${awaySeconds}, got ${focusReport.elapsedSeconds}`);
  }
  if (focusReport.xpGainedPerSpirit <= 0) {
    throw new Error('Expected positive XP gained during tab away simulation');
  }
  console.log(`  [PASS] Simulated tab switch away for 2m: Gained +${focusReport.xpGainedPerSpirit} XP per spirit!`);

  // 3. Verify Animated Relic and Weapon HTML generation for chambers
  const testChamberRelicHtml = createAnimatedRelicHtml('zeus', 'headgear');
  if (!testChamberRelicHtml.includes('animated-relic-sprite') || !testChamberRelicHtml.includes('relic_crown_zeus')) {
    throw new Error('createAnimatedRelicHtml failed to generate valid sprite HTML for Zeus chamber');
  }
  const testChamberWeaponHtml = createAnimatedWeaponHtml('sword');
  if (!testChamberWeaponHtml.includes('animated-weapon-sprite') || !testChamberWeaponHtml.includes('weapon_spectral_blade')) {
    throw new Error('createAnimatedWeaponHtml failed to generate valid sprite HTML for sword forge');
  }
  console.log('  [PASS] Animated chamber sprite HTML successfully generated for Pantheon Trials and Divine Forge!');

  // =========================================================================
  // [TEST 32] Testing 7-Core Dual Attributes Breakdown & Rebirth System (⭐1 to ⭐7)
  // =========================================================================
  console.log('\n[TEST 32] Testing 7-Core Dual Attributes Breakdown & Rebirth System:');

  // 1. Verify REBIRTH_CONFIG (⭐1 to ⭐7)
  if (!REBIRTH_CONFIG || REBIRTH_CONFIG.length !== 7) {
    throw new Error(`Expected REBIRTH_CONFIG to contain 7 tiers, got ${REBIRTH_CONFIG ? REBIRTH_CONFIG.length : 0}`);
  }
  for (let t = 1; t <= 7; t++) {
    const tierConfig = REBIRTH_CONFIG.find(c => c.tier === t);
    if (!tierConfig) throw new Error(`Missing Rebirth configuration for Tier ${t}`);
    if (!tierConfig.name.includes(`Rebirth`)) throw new Error(`Rebirth tier ${t} name should include 'Rebirth', got ${tierConfig.name}`);
    if (tierConfig.bonusPercent !== t * 12) throw new Error(`Tier ${t} bonusPercent expected ${t * 12}%, got ${tierConfig.bonusPercent}%`);
    if (!tierConfig.uniqueAddition) throw new Error(`Tier ${t} missing uniqueAddition description`);
  }
  console.log('  [PASS] Verified REBIRTH_CONFIG with 7 distinct tiers, +12% to +84% multipliers, and unique additions!');

  // 2. Test Dual-Tier 7 Core Attributes on calculateSpiritStats
  const dualStatTestSpirit = {
    id: 'test_spirit_dual_stat',
    speciesId: 'solaris_lion_pride',
    customName: 'Solaris Test',
    level: 30,
    rarity: 'MYTHICAL',
    ascensionLevel: 2,
    rebirthLevel: 2
  };
  const detailedStats = calculateSpiritStats(dualStatTestSpirit);
  if (!detailedStats.attributes) throw new Error('calculateSpiritStats must return structured .attributes object');

  const requiredAttributes = ['hp', 'atk', 'def', 'critRate', 'critDmg', 'ultAmp', 'manaReplenish'];
  for (const attrKey of requiredAttributes) {
    const attr = detailedStats.attributes[attrKey];
    if (!attr) throw new Error(`Missing core attribute "${attrKey}" in detailedStats.attributes`);
    if (typeof attr.base !== 'number' || typeof attr.total !== 'number') {
      throw new Error(`Attribute ${attrKey} must have numeric base and total`);
    }
  }
  console.log('  Attributes summary for Solaris Lv.30 (Rebirth II):');
  console.log(`    💚 HP: ${detailedStats.attributes.hp.base} (Base) = ${detailedStats.attributes.hp.total} (Total)`);
  console.log(`    ⚔️ ATK: ${detailedStats.attributes.atk.base} (Base) = ${detailedStats.attributes.atk.total} (Total)`);
  console.log(`    🛡️ DEF: ${detailedStats.attributes.def.base} (Base) = ${detailedStats.attributes.def.total} (Total)`);
  console.log(`    🎯 Crit Rate: ${detailedStats.attributes.critRate.total}% | 💥 Crit DMG: ${detailedStats.attributes.critDmg.total}%`);
  console.log(`    🔮 Ult Amp: ${detailedStats.attributes.ultAmp.total}% | ⚡ Mana Replenish: ${detailedStats.attributes.manaReplenish.total}%`);
  console.log('  [PASS] 7-Core Dual Attributes breakdown successfully calculated!');

  // 3. Test getSpiritCombatStats integration with equipment and Rebirth
  const combatStats = gameState.getSpiritCombatStats(testTank);
  if (!combatStats.attributes) throw new Error('getSpiritCombatStats must return structured .attributes breakdown');
  if (combatStats.attributes.hp.total !== combatStats.maxHp) {
    throw new Error(`Mismatch between attributes.hp.total (${combatStats.attributes.hp.total}) and combatStats.maxHp (${combatStats.maxHp})`);
  }
  if (combatStats.attributes.atk.total !== combatStats.atk) {
    throw new Error(`Mismatch between attributes.atk.total (${combatStats.attributes.atk.total}) and combatStats.atk (${combatStats.atk})`);
  }
  console.log(`  Combat stats dual attributes verified: Tank HP=${combatStats.attributes.hp.total}, DEF=${combatStats.attributes.def.total}`);
  console.log('  [PASS] gameState.getSpiritCombatStats dual-tier calculation verified!');

  // 4. Test Rebirth ascension process via gameState.rebirthSpirit
  const testBaseHound = {
    id: 'test_rebirth_target',
    speciesId: 'dog_spirit',
    customName: 'Rebirth Dog',
    level: 10,
    rarity: 'COMMON',
    ascensionLevel: 0,
    rebirthLevel: 0
  };
  const testDupHound = {
    id: 'test_rebirth_dup_1',
    speciesId: 'dog_spirit',
    customName: 'Rebirth Dup Dog',
    level: 1,
    rarity: 'COMMON'
  };
  gameState.state.spirits.push(testBaseHound, testDupHound);
  gameState.state.resources.soulEssence = 20;

  const rebirthResult = gameState.rebirthSpirit('test_rebirth_target', ['test_rebirth_dup_1']);
  if (!rebirthResult.success) throw new Error('rebirthSpirit failed');
  if (testBaseHound.rebirthLevel !== 1 || testBaseHound.ascensionLevel !== 1) {
    throw new Error(`Expected rebirthLevel 1, got rebirth=${testBaseHound.rebirthLevel}, asc=${testBaseHound.ascensionLevel}`);
  }
  console.log(`  Rebirthed spirit to ${rebirthResult.newTier} (Bonus: +${rebirthResult.bonusPercent}%): ${rebirthResult.uniqueAddition}`);
  console.log('  [PASS] gameState.rebirthSpirit execution, duplicate consumption & event dispatch validated!');

  // =========================================================================
  // [TEST 33] Testing 54-Spirit Dynamic Scaling Profiles Matrix & Role Formulas
  // =========================================================================
  console.log('\n[TEST 33] Testing 54-Spirit Dynamic Scaling Profiles Matrix & Role Formulas:');

  const allCatalogSpecies = Object.keys(SPIRIT_SPECIES);
  console.log(`  Verifying all ${allCatalogSpecies.length} catalog species have configured scaling profiles...`);
  if (allCatalogSpecies.length !== 54) throw new Error(`Expected 54 species in catalog, found ${allCatalogSpecies.length}`);

  let healerCount = 0;
  let tankCount = 0;
  let dpsCount = 0;
  let subDpsCount = 0;
  let supportCount = 0;

  for (const sId of allCatalogSpecies) {
    const profile = getScalingProfile(sId);
    if (!profile) throw new Error(`Missing scaling profile for species: ${sId}`);
    if (!profile.primaryStat || !profile.secondaryStat) {
      throw new Error(`Profile for ${sId} missing primary/secondary stat`);
    }
    if (profile.archetype === 'HEALER') healerCount++;
    else if (profile.archetype === 'TANK') tankCount++;
    else if (profile.archetype === 'MAIN_DPS') dpsCount++;
    else if (profile.archetype === 'SUB_DPS') subDpsCount++;
    else if (profile.archetype === 'SUPPORT') supportCount++;
  }
  console.log(`  Profile distribution: Healers=${healerCount}, Tanks=${tankCount}, MainDPS=${dpsCount}, SubDPS=${subDpsCount}, Supports=${supportCount}`);
  if (healerCount !== 6) throw new Error(`Expected 6 Healers with scaling profiles, got ${healerCount}`);
  if (tankCount !== 12) throw new Error(`Expected 12 Tanks with scaling profiles, got ${tankCount}`);
  if (dpsCount !== 18) throw new Error(`Expected 18 Main DPS with scaling profiles, got ${dpsCount}`);
  if (subDpsCount !== 11) throw new Error(`Expected 11 Sub-DPS with scaling profiles, got ${subDpsCount}`);
  if (supportCount !== 7) throw new Error(`Expected 7 Supports with scaling profiles, got ${supportCount}`);

  // Test dynamic healing formula distinction: Vitality (% Max HP) vs Radiant (% ATK)
  const caterpillarProfile = getScalingProfile('caterpillar_spirit');
  const dawnHeraldProfile = getScalingProfile('dawn_herald');
  if (caterpillarProfile.primaryStat !== 'hp') throw new Error(`Caterpillar primaryStat expected 'hp', got ${caterpillarProfile.primaryStat}`);
  if (dawnHeraldProfile.primaryStat !== 'atk') throw new Error(`Dawn Herald primaryStat expected 'atk', got ${dawnHeraldProfile.primaryStat}`);
  if (!dawnHeraldProfile.canCrit) throw new Error('Dawn Herald should be able to critically strike heals');
  console.log(`  Vitality Healer (${caterpillarProfile.title}): Primary=${caterpillarProfile.primaryStat}, Ratio=${caterpillarProfile.healRatio * 100}% HP`);
  console.log(`  Radiant Healer (${dawnHeraldProfile.title}): Primary=${dawnHeraldProfile.primaryStat}, Ratio=${dawnHeraldProfile.healRatio * 100}% ATK, CanCrit=${dawnHeraldProfile.canCrit}`);

  // Test dynamic tank shield formula distinction: Iron Bastion (% DEF) vs Primal Behemoth (% HP)
  const bullProfile = getScalingProfile('bull_spirit');
  const dogProfile = getScalingProfile('dog_spirit');
  if (bullProfile.primaryStat !== 'def') throw new Error(`Bull primaryStat expected 'def', got ${bullProfile.primaryStat}`);
  if (dogProfile.primaryStat !== 'hp') throw new Error(`Dog primaryStat expected 'hp', got ${dogProfile.primaryStat}`);
  console.log(`  Iron Bastion Tank (${bullProfile.title}): Primary=${bullProfile.primaryStat}, ShieldRatio=${bullProfile.shieldRatio}x DEF`);
  console.log(`  Primal Behemoth Tank (${dogProfile.title}): Primary=${dogProfile.primaryStat}, ShieldRatio=${dogProfile.shieldRatio * 100}% HP`);

  console.log('  [PASS] All 54 spirits verified in dynamic scaling matrix and role formulas successfully validated!');

  // =========================================================================
  // [TEST 34] Testing Idle Spoils 1-Hour Minimum Claim Requirement
  // =========================================================================
  console.log('\n[TEST 34] Testing Idle Spoils 1-Hour Minimum Claim Requirement:');

  // Case 1: Under 1 hour (e.g. 1,800 seconds = 30 minutes)
  gameState.state.offlineSpoils = null;
  gameState.state.last_saved = Date.now() - (1800 * 1000);
  gameState.state.lastSaveTime = gameState.state.last_saved;
  const underHourReport = gameState.applyOfflineGains();
  if (underHourReport.canClaim !== false) {
    throw new Error(`Expected underHourReport.canClaim to be false, got ${underHourReport.canClaim}`);
  }
  if (underHourReport.elapsedSeconds < 1790 || underHourReport.elapsedSeconds > 1810) {
    throw new Error(`Unexpected elapsedSeconds in underHourReport: ${underHourReport.elapsedSeconds}`);
  }

  // Attempting to claim before 1 hour must throw an error
  let blockedUnderHour = false;
  try {
    gameState.claimIdleSpoils();
  } catch (err) {
    blockedUnderHour = true;
    console.log(`  [PASS] Blocked claim under 1 hour as expected: "${err.message}"`);
  }
  if (!blockedUnderHour) {
    throw new Error('gameState.claimIdleSpoils() should have thrown an error when elapsed time is under 1 hour');
  }

  // Case 2: At or over 1 hour (e.g. 3,660 seconds = 1 hour 1 minute)
  gameState.state.offlineSpoils = null;
  gameState.state.last_saved = Date.now() - (3660 * 1000);
  gameState.state.lastSaveTime = gameState.state.last_saved;
  const overHourReport = gameState.applyOfflineGains();
  if (overHourReport.canClaim !== true) {
    throw new Error(`Expected overHourReport.canClaim to be true for >=3600s, got ${overHourReport.canClaim}`);
  }
  const prevEssence = gameState.state.resources.soulEssence;
  const claimedSpoils = gameState.claimIdleSpoils();
  if (!claimedSpoils || !claimedSpoils.claimed) {
    throw new Error('gameState.claimIdleSpoils() failed to claim when >= 3600 seconds');
  }
  if (gameState.state.offlineSpoils !== null) {
    throw new Error('Pending offline spoils were not cleared after successful claim');
  }
  if (gameState.state.resources.soulEssence < prevEssence) {
    throw new Error('Resources were not awarded upon claiming idle spoils');
  }
  console.log(`  [PASS] Idle spoils claimed successfully after 1 hour: +${claimedSpoils.soulEssence} Soul Essence, +${claimedSpoils.gold} Gold`);

  // =========================================================================
  // [TEST 35] Testing Expanded Creature and Enemy Animated Sprites
  // =========================================================================
  console.log('\n[TEST 35] Testing Expanded Creature and Enemy Animated Sprites:');
  const requiredSpriteFiles = [
    'celestial_angel.svg',
    'spectral_undead.svg',
    'enemy_void_wraith.svg',
    'enemy_infernal_demon.svg',
    'enemy_colossus_titan.svg',
    'enemy_frost_lich.svg',
    'baphomet_nether.svg',
    'chrono_drake.svg',
    'seraph_valkyrie.svg'
  ];

  const creaturesDir = path.resolve('./public/assets/sprites/creatures');
  for (const filename of requiredSpriteFiles) {
    const fullPath = path.join(creaturesDir, filename);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Required creature/enemy sprite missing on disk: ${fullPath}`);
    }
    const stat = fs.statSync(fullPath);
    if (stat.size < 1000) {
      throw new Error(`Sprite file suspiciously small (${stat.size} bytes): ${filename}`);
    }
  }
  console.log(`  All ${requiredSpriteFiles.length} creature and enemy sprite SVG sheets physically verified on disk!`);

  // Verify manifest & routing
  const rawManifest = JSON.parse(fs.readFileSync('./public/assets/sprites/manifest.json', 'utf8'));
  for (const sheetName of [
    'spectral_undead', 'celestial_angel', 'seraph_valkyrie', 'baphomet_nether', 
    'chrono_drake', 'enemy_void_wraith', 'enemy_infernal_demon', 'enemy_colossus_titan', 'enemy_frost_lich'
  ]) {
    if (!rawManifest.sheets[sheetName]) {
      throw new Error(`Manifest missing sheet: ${sheetName}`);
    }
    if (!SPRITE_MANIFEST.sheets[sheetName]) {
      throw new Error(`SPRITE_MANIFEST in code missing sheet: ${sheetName}`);
    }
  }

  // Verify getSheetKeyForSpecies mappings
  if (getSheetKeyForSpecies('fallen_warrior') !== 'spectral_undead') {
    throw new Error(`Expected fallen_warrior to map to spectral_undead, got ${getSheetKeyForSpecies('fallen_warrior')}`);
  }
  if (getSheetKeyForSpecies('archangel_uriel') !== 'celestial_angel') {
    throw new Error(`Expected archangel_uriel to map to celestial_angel, got ${getSheetKeyForSpecies('archangel_uriel')}`);
  }
  if (getSheetKeyForSpecies('baphomet_archdemon_lord') !== 'baphomet_nether') {
    throw new Error(`Expected baphomet_archdemon_lord to map to baphomet_nether, got ${getSheetKeyForSpecies('baphomet_archdemon_lord')}`);
  }

  // Verify getSheetKeyForEnemy mappings
  const { getSheetKeyForEnemy } = await import('../src/render/spriteAnimator.js');
  if (getSheetKeyForEnemy({ name: 'Void Phantom Lord' }) !== 'enemy_void_wraith') {
    throw new Error('Enemy with "Void" failed to map to enemy_void_wraith');
  }
  if (getSheetKeyForEnemy({ name: 'Infernal Demon Prince' }) !== 'enemy_infernal_demon') {
    throw new Error('Enemy with "Infernal" failed to map to enemy_infernal_demon');
  }
  if (getSheetKeyForEnemy({ name: 'Colossus of the Deep Earth' }) !== 'enemy_colossus_titan') {
    throw new Error('Enemy with "Colossus" failed to map to enemy_colossus_titan');
  }
  if (getSheetKeyForEnemy({ name: 'Glacial Frost Lich' }) !== 'enemy_frost_lich') {
    throw new Error('Enemy with "Frost" failed to map to enemy_frost_lich');
  }
  console.log('  [PASS] Animated creature and enemy sprites, manifest declarations, and routing verified!');

  // =========================================================================
  // [TEST 36] Testing Spirit Sanctum Hub Dedicated View & 5 Sub-Hubs Architecture
  // =========================================================================
  console.log('\n[TEST 36] Testing Spirit Sanctum Hub Dedicated View & 5 Sub-Hubs Architecture:');
  const { renderCharacterHubView } = await import('../src/ui/views/characterHubView.js');

  const mockContainer = {
    innerHTML: '',
    querySelector(sel) { return null; },
    querySelectorAll(sel) { return []; }
  };

  // 1. Render default (Attributes sub-hub)
  renderCharacterHubView(mockContainer, { spiritId: 'test_rebirth_target', subHub: 'attributes' });
  if (!mockContainer.innerHTML.includes('SPIRIT SANCTUM HUB')) {
    throw new Error('Sanctum Hub header missing in rendered output');
  }
  if (!mockContainer.innerHTML.includes('7-CORE ATTRIBUTES TOTAL & PERCENTAGE BREAKDOWN')) {
    throw new Error('Attributes sub-hub 7-Core dual attributes breakdown missing');
  }
  if (!mockContainer.innerHTML.includes('Max HP') || !mockContainer.innerHTML.includes('Attack (ATK)') || !mockContainer.innerHTML.includes('CRIT Rate')) {
    throw new Error('Specific core attributes missing from rendered attributes table');
  }
  console.log('  [PASS] Attributes Sub-Hub and 7-Core dual attributes breakdown verified!');

  // 2. Render Weapons sub-hub
  renderCharacterHubView(mockContainer, { spiritId: 'test_rebirth_target', subHub: 'weapons' });
  if (!mockContainer.innerHTML.includes('EQUIPPED ARMAMENT') && !mockContainer.innerHTML.includes('No Weapon Equipped')) {
    throw new Error('Weapons sub-hub failed to render');
  }
  console.log('  [PASS] Weapons Sub-Hub rendering verified!');

  // 3. Render Relics sub-hub
  renderCharacterHubView(mockContainer, { spiritId: 'test_rebirth_target', subHub: 'relics' });
  if (!mockContainer.innerHTML.includes('GREEK GOD CONSECRATED SET BONUSES')) {
    throw new Error('Relics sub-hub Greek God sets missing in rendered output');
  }
  console.log('  [PASS] Relics Sub-Hub and Greek God sets tracking verified!');

  // 4. Render Rebirths sub-hub
  renderCharacterHubView(mockContainer, { spiritId: 'test_rebirth_target', subHub: 'rebirths' });
  if (!mockContainer.innerHTML.includes('CELESTIAL REBIRTH NEXUS (REBIRTH I TO VII)')) {
    throw new Error('Rebirths sub-hub celestial constellation nexus missing');
  }
  if (!mockContainer.innerHTML.includes('Tier 1') || !mockContainer.innerHTML.includes('Tier 7')) {
    throw new Error('Rebirth tiers 1 through 7 missing from Rebirths sub-hub');
  }
  console.log('  [PASS] Rebirths Sub-Hub and 7-Tier constellation progression verified!');

  // 5. Render Talents sub-hub
  renderCharacterHubView(mockContainer, { spiritId: 'test_rebirth_target', subHub: 'talents' });
  if (!mockContainer.innerHTML.includes('COMBAT TALENTS & SACRED ARTS')) {
    throw new Error('Talents sub-hub missing from rendered output');
  }
  if (!mockContainer.innerHTML.includes('Ultimate Art')) {
    throw new Error('Ultimate ability talent missing from Talents sub-hub');
  }
  // 6. Test Detailed Attributes Breakdown Modal
  const { showDetailedAttributesModal } = await import('../src/ui/components/modals.js');
  const modalMock = { innerHTML: '', querySelector() { return null; } };
  const prevGetEl = global.document?.getElementById;
  if (!global.document) global.document = {};
  global.document.getElementById = (id) => id === 'modal-root' ? modalMock : null;
  showDetailedAttributesModal(gameState.state.spirits[0]);
  if (!modalMock.innerHTML.includes('COMBAT ATTRIBUTE DOSSIER')) {
    throw new Error('Detailed Attributes modal failed to render dossier');
  }
  if (!modalMock.innerHTML.includes('OFFENSIVE CAPABILITIES') || !modalMock.innerHTML.includes('DEFENSIVE MITIGATION')) {
    throw new Error('Dossier categories missing from modal');
  }
  global.document.getElementById = prevGetEl;
  console.log('  [PASS] Detailed Attributes Dossier Modal verified (16 Parameters)!');

  console.log('  [PASS] Dedicated Spirit Sanctum Hub fully verified across all 5 sub-hubs!');

  if (gameState.saveTimer) clearInterval(gameState.saveTimer);
  if (gameState.rafId && global.cancelAnimationFrame) global.cancelAnimationFrame(gameState.rafId);

  console.log('\nALL TESTS PASSED SUCCESSFULLY! ✅');
});





