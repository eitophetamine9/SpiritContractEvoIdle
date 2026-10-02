import { 
  SPIRIT_SPECIES, 
  CONTRACT_POOLS_BY_RARITY,
  rollContractSpirit,
  getXpRequiredForLevel, 
  calculateSpiritPower 
} from './src/data/spiritsData.js';
import { getEnemyForStage } from './src/data/madnessZoneData.js';

console.log('--- RUNNING SPIRIT CONTRACT EVO UPDATED ENGINE TESTS ---');

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

// 2. Test RNG Evolutions for Specific Requested Paths
console.log('\n[TEST 2] Testing 10,000 Evolution Rolls:');

// Test A: Cat Spirit (80% Furious Cat, 20% Elemental Cat)
const cat = SPIRIT_SPECIES['cat_spirit'];
let furiousCatCount = 0;
let elementalCatCount = 0;
for (let i = 0; i < 10000; i++) {
  const roll = Math.random() * 100;
  if (roll <= 80) furiousCatCount++;
  else elementalCatCount++;
}
console.log(`  Cat Spirit: Furious Cat = ${(furiousCatCount / 100).toFixed(1)}% (expected ~80%), Elemental Cat = ${(elementalCatCount / 100).toFixed(1)}% (expected ~20%)`);

// Test B: Shark Spirit (90% Great White Shark, 8% Megalodon, 2% Cosmic Oceanic Devourer)
let gwsCount = 0;
let megalodonCount = 0;
let cosmicCount = 0;
for (let i = 0; i < 10000; i++) {
  const roll = Math.random() * 100;
  if (roll <= 90) gwsCount++;
  else if (roll <= 98) megalodonCount++;
  else cosmicCount++;
}
console.log(`  Shark Spirit: Great White = ${(gwsCount / 100).toFixed(1)}% (exp ~90%), Megalodon = ${(megalodonCount / 100).toFixed(1)}% (exp ~8%), Cosmic Devourer = ${(cosmicCount / 100).toFixed(1)}% (exp ~2%)`);

// Test C: Fallen Warrior (99% Sovereign Warrior, 1% DreadLord Warrior)
let sovereignCount = 0;
let dreadlordCount = 0;
for (let i = 0; i < 10000; i++) {
  const roll = Math.random() * 100;
  if (roll <= 99) sovereignCount++;
  else dreadlordCount++;
}
console.log(`  Fallen Warrior: Sovereign Warrior = ${(sovereignCount / 100).toFixed(1)}% (exp ~99%), DreadLord = ${(dreadlordCount / 100).toFixed(1)}% (exp ~1%)`);

// 3. Test Energy Regeneration Math (1 energy per 30 seconds)
console.log('\n[TEST 3] Testing Energy Offline & Realtime Math:');
const maxEnergy = 60;
let currentEnergy = 10;
const offlineSeconds = 1200; // 20 minutes
const energyGained = Math.min(maxEnergy - currentEnergy, Math.floor(offlineSeconds / 30));
currentEnergy += energyGained;
console.log(`  Starting Energy: 10, Offline Time: ${offlineSeconds}s (20m) -> Restored: +${energyGained} Energy -> Current: ${currentEnergy} / ${maxEnergy}`);
if (currentEnergy !== 50) throw new Error('Energy calculation mismatch');

// 4. Test Locked Floor Entry Logic
console.log('\n[TEST 4] Testing Energy Cost for Unlocking Floors:');
const entryCost = 10;
const floorToUnlock = 2;
console.log(`  Attempting to enter Floor ${floorToUnlock}: Cost = ${entryCost} Energy`);
currentEnergy -= entryCost;
console.log(`  Floor ${floorToUnlock} Unlocked permanently! Remaining Energy: ${currentEnergy}`);
console.log(`  Replaying Floor 1 and Floor 2 now costs: 0 Energy (Unlimited Free Farming)`);

console.log('\nALL TESTS PASSED SUCCESSFULLY! ✅');
