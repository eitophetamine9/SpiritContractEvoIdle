import { 
  SPIRIT_SPECIES, 
  CONTRACT_RARITY_ODDS, 
  ASTRAL_CONTRACT_RARITY_ODDS,
  rollContractSpirit, 
  rollAstralContractSpirit 
} from '../src/data/spiritsData.js';

console.log('===============================================================');
console.log('      SPIRIT CONTRACT EVO | IDLE - PROBABILITY TEST RUN        ');
console.log('===============================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: NORMAL SHARDS SUMMON (100 PULLS)
// -----------------------------------------------------------------------------
console.log('---------------------------------------------------------------');
console.log('[TEST 1] NORMAL SHARDS SUMMON (100 PULLS SIMULATION)');
console.log('Expected Odds: Common 60% | Uncommon 26% | Rare 10% | Epic 3.5% | Legendary 0.5%');
console.log('---------------------------------------------------------------');

const normalPulls = { COMMON: 0, UNCOMMON: 0, RARE: 0, EPIC: 0, LEGENDARY: 0 };
const normalSpecies = {};

for (let i = 0; i < 100; i++) {
  const pull = rollContractSpirit();
  normalPulls[pull.rarityTier] = (normalPulls[pull.rarityTier] || 0) + 1;
  const spName = SPIRIT_SPECIES[pull.speciesId]?.name || pull.speciesId;
  normalSpecies[spName] = (normalSpecies[spName] || 0) + 1;
}

for (const [rarity, count] of Object.entries(normalPulls)) {
  const bar = '█'.repeat(Math.round(count / 2));
  console.log(`  ${rarity.padEnd(11)} : ${count.toString().padStart(3)}%  ${bar}`);
}
console.log('\n  Species Sample Pulled:');
for (const [name, count] of Object.entries(normalSpecies)) {
  console.log(`    • ${name.padEnd(24)} : ${count} pulled`);
}

// -----------------------------------------------------------------------------
// TEST 2: SOUL ESSENCE ASTRAL CONTRACT (100 PULLS)
// -----------------------------------------------------------------------------
console.log('\n---------------------------------------------------------------');
console.log('[TEST 2] SOUL ESSENCE ASTRAL CONTRACT (100 PULLS SIMULATION)');
console.log('Expected Odds: Common 0% | Uncommon 65% | Rare 25% | Epic 8% | Legendary 2%');
console.log('---------------------------------------------------------------');

const astralPulls = { COMMON: 0, UNCOMMON: 0, RARE: 0, EPIC: 0, LEGENDARY: 0 };
const astralSpecies = {};

for (let i = 0; i < 100; i++) {
  const pull = rollAstralContractSpirit();
  astralPulls[pull.rarityTier] = (astralPulls[pull.rarityTier] || 0) + 1;
  const spName = SPIRIT_SPECIES[pull.speciesId]?.name || pull.speciesId;
  astralSpecies[spName] = (astralSpecies[spName] || 0) + 1;
}

for (const [rarity, count] of Object.entries(astralPulls)) {
  const bar = '█'.repeat(Math.round(count / 2));
  console.log(`  ${rarity.padEnd(11)} : ${count.toString().padStart(3)}%  ${bar}`);
}
console.log('\n  Species Sample Pulled:');
for (const [name, count] of Object.entries(astralSpecies)) {
  console.log(`    • ${name.padEnd(24)} : ${count} pulled`);
}

// -----------------------------------------------------------------------------
// TEST 3: 100 EVOLUTIONS ON EVERY SPIRIT WITH EVOLUTION BRANCHES
// -----------------------------------------------------------------------------
console.log('\n---------------------------------------------------------------');
console.log('[TEST 3] 100 EVOLUTIONS SIMULATION ON EACH SPIRIT SPECIES');
console.log('Testing RNG branch weights & rare/mythical/transcendent outcomes');
console.log('---------------------------------------------------------------');

const evolvableSpecies = Object.values(SPIRIT_SPECIES).filter(
  sp => sp.evolutions && sp.evolutions.length > 0
);

for (const species of evolvableSpecies) {
  console.log(`\n🐾 Base: ${species.name.toUpperCase()} (Base Rarity: ${species.baseRarity})`);
  const totalWeight = species.evolutions.reduce((acc, ev) => acc + ev.weight, 0);
  
  // Simulation counts
  const branchCounts = {};
  species.evolutions.forEach(ev => {
    branchCounts[ev.variant || ev.targetSpeciesId] = 0;
  });

  for (let i = 0; i < 100; i++) {
    const roll = Math.random() * totalWeight;
    let running = 0;
    let chosen = species.evolutions[0];

    for (const evo of species.evolutions) {
      running += evo.weight;
      if (roll <= running) {
        chosen = evo;
        break;
      }
    }
    const key = chosen.variant || chosen.targetSpeciesId;
    branchCounts[key]++;
  }

  // Display results
  species.evolutions.forEach(ev => {
    const key = ev.variant || ev.targetSpeciesId;
    const targetSp = SPIRIT_SPECIES[ev.targetSpeciesId];
    const targetRarity = ev.rarity || (targetSp ? targetSp.baseRarity : 'COMMON');
    const actual = branchCounts[key];
    const expected = (ev.weight / totalWeight) * 100;
    const bar = '▓'.repeat(Math.round(actual / 4));
    console.log(`    ↳ [${targetRarity.padEnd(12)}] ${key.padEnd(35)} : ${actual.toString().padStart(3)}% (exp: ${expected.toFixed(0)}%) ${bar}`);
  });
}

console.log('\n===============================================================');
console.log('                 ALL SIMULATIONS COMPLETED                     ');
console.log('===============================================================');
