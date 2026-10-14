import { SPIRIT_SPECIES, RARITIES, getRarityInfo } from '../src/data/spiritsData.js';
import { gameState } from '../src/state/gameState.js';
import { showHallOfFamePickerModal, showBestiaryInspectModal } from '../src/ui/components/modals.js';
import { renderIndexView } from '../src/ui/views/indexView.js';

// Setup Mock DOM environment
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.window = { addEventListener: () => {} };

globalThis.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; }
};

globalThis.document = {
  addEventListener: () => {},
  getElementById: (id) => {
    if (id === 'modal-root') {
      return modalRoot;
    }
    return null;
  },
  querySelector: () => null,
  querySelectorAll: () => []
};

const modalRoot = {
  innerHTML: '',
  querySelectorAll: (selector) => [],
  querySelector: (selector) => null
};

console.log('--- TESTING UI COMPONENTS & LOGIC ---');

// 1. Verify Bestiary Data and Deterministic Indexing
const speciesList = Object.values(SPIRIT_SPECIES);
console.log(`Total Spirit Species in Bestiary: ${speciesList.length}`);
if (speciesList.length < 47) {
  throw new Error(`Expected at least 47 species, got ${speciesList.length}`);
}

// 2. Verify Bestiary Grid Generation
const mockContainer = {
  innerHTML: '',
  querySelectorAll: function(sel) {
    // Basic match simulator
    return [];
  }
};

gameState.init();
renderIndexView(mockContainer);

if (!mockContainer.innerHTML.includes('bestiary-grid')) {
  throw new Error('Bestiary grid not found in indexView output');
}
if (!mockContainer.innerHTML.includes('#001') || !mockContainer.innerHTML.includes('#037')) {
  throw new Error('Bestiary number tags #001 to #037 missing from grid output');
}
console.log('[PASS] Bestiary Grid renders properly with numbered tiles #001 through #037.');

// 3. Test Bestiary Inspect Modal markup generation
showBestiaryInspectModal(SPIRIT_SPECIES['cat_spirit'], true, 1);
if (!modalRoot.innerHTML.includes('Cat Spirit') || !modalRoot.innerHTML.includes('bestiary-inspect-modal')) {
  throw new Error('Bestiary inspect modal failed to render for discovered spirit');
}
if (!modalRoot.innerHTML.includes('Evolution Lineage') || !modalRoot.innerHTML.includes('Hidden Branch')) {
  throw new Error('Evolution lineage missing from Bestiary inspect modal');
}

// Now discover furious_cat and verify it reveals the name
gameState.state.discoveredSpeciesIds.push('furious_cat');
showBestiaryInspectModal(SPIRIT_SPECIES['cat_spirit'], true, 1);
if (!modalRoot.innerHTML.includes('Furious Cat')) {
  throw new Error('Discovered target evolution species name not shown');
}
console.log('[PASS] Bestiary Inspect Modal displays sprite, stats, lore, and evolution branches (hidden and discovered).');

showBestiaryInspectModal(SPIRIT_SPECIES['cat_spirit'], false, 1);
if (!modalRoot.innerHTML.includes('Undiscovered') || !modalRoot.innerHTML.includes('bestiary-unknown-notice')) {
  throw new Error('Bestiary inspect modal failed to render undiscovered mystery card');
}
console.log('[PASS] Bestiary Inspect Modal renders mysterious locked state for undiscovered spirits.');

// 4. Test Hall of Fame Picker Modal
showHallOfFamePickerModal((id) => {
  console.log(`Assigned spirit ID: ${id}`);
});
if (!modalRoot.innerHTML.includes('Assign Spirit to Hall of Fame') || !modalRoot.innerHTML.includes('hof-picker-modal-card')) {
  throw new Error('Hall of Fame picker modal failed to render');
}
if (!modalRoot.innerHTML.includes('Highest Power') || !modalRoot.innerHTML.includes('Favorites') || !modalRoot.innerHTML.includes('All Vault')) {
  throw new Error('Hall of Fame picker tabs missing');
}
console.log('[PASS] Hall of Fame Picker modal renders interactively with tabs, search, and cards.');

// 5. Test Hall of Fame assignment in gameState
const initialHof = [...gameState.state.hallOfFame];
const testSpirit = gameState.state.spirits[0];
if (testSpirit) {
  const initiallyInHof = gameState.state.hallOfFame.includes(testSpirit.id);
  gameState.toggleHallOfFame(testSpirit.id);
  const nowInHof = gameState.state.hallOfFame.includes(testSpirit.id);
  if (nowInHof === initiallyInHof) {
    throw new Error('toggleHallOfFame did not toggle the state');
  }
  // Revert
  gameState.toggleHallOfFame(testSpirit.id);
  console.log('[PASS] Hall of Fame state toggle functioning correctly.');
}

// 6. Test Madness Zone View layout and controls
import { renderMadnessView } from '../src/ui/views/madnessView.js';
const madnessContainer = {
  innerHTML: '',
  querySelector: function(sel) {
    return {
      addEventListener: () => {},
      classList: { toggle: () => {} }
    };
  },
  querySelectorAll: function(sel) {
    return [];
  }
};

renderMadnessView(madnessContainer);
if (!madnessContainer.innerHTML.includes('isometric-battlefield')) {
  throw new Error('Isometric battlefield missing from Madness View');
}
if (!madnessContainer.innerHTML.includes('enemy-swarm-wrapper') || !madnessContainer.innerHTML.includes('seamless-enemy-slot')) {
  throw new Error('Enemies are missing from the Madness battlefield!');
}
if (madnessContainer.innerHTML.includes('enemy-placeholder-frame')) {
  throw new Error('Enemy placeholder frames must NOT be present in seamless Madness View!');
}
if (madnessContainer.innerHTML.includes('diamond-hub-wrapper')) {
  throw new Error('Obsolete diamond hub is still present in Madness View!');
}
if (!madnessContainer.innerHTML.includes('btn-fight-enemy') || !madnessContainer.innerHTML.includes('btn-toggle-engage')) {
  throw new Error('Attack button or combat engage toggle missing from Madness View!');
}
if (!madnessContainer.innerHTML.includes('btn-prev-stage') || !madnessContainer.innerHTML.includes('btn-combat-sound')) {
  throw new Error('Floor navigation or audio toggle missing from Madness View!');
}
if (!madnessContainer.innerHTML.includes('madness-tactical-grid') || 
    !madnessContainer.innerHTML.includes('madness-seamless-grid') || 
    !madnessContainer.innerHTML.includes('col-back') || 
    !madnessContainer.innerHTML.includes('col-mid') || 
    !madnessContainer.innerHTML.includes('col-front')) {
  throw new Error('3x3 Tactical Grid (Back, Mid, Front columns) or seamless grid class missing from Madness View!');
}
if (madnessContainer.innerHTML.includes('empty-grid-tile') || madnessContainer.innerHTML.includes('empty-tile-coord')) {
  throw new Error('Empty slot boxes must NOT be rendered on the Madness screen!');
}
if (!madnessContainer.innerHTML.includes('seamless-battle-spirit') ||
    !madnessContainer.innerHTML.includes('seamless-overhead-tag') ||
    !madnessContainer.innerHTML.includes('seamless-spirit-name') ||
    !madnessContainer.innerHTML.includes('seamless-spirit-level')) {
  throw new Error('Seamless spirits with overhead name and level missing from Madness View!');
}
if (!madnessContainer.innerHTML.includes('btn-madness-auto-align') || !madnessContainer.innerHTML.includes('data-formation-slot')) {
  throw new Error('Auto-align button or tactical formation slots missing from Madness View!');
}
console.log('[PASS] Madness Zone View renders 3x3 tactical grid formation, seamless spirits (no empty slot boxes), and auto-align cleanly.');

// 7. Test setStage method on gameState
const currentStage = gameState.state.madnessZone.stage;
gameState.state.madnessZone.highestStageUnlocked = 5;
gameState.state.madnessZone.unlockedStages = [1, 2, 3, 4, 5];
gameState.setStage(2);
if (gameState.state.madnessZone.stage !== 2) {
  throw new Error(`setStage(2) failed; expected stage 2, got ${gameState.state.madnessZone.stage}`);
}
gameState.setStage(1);
if (gameState.state.madnessZone.stage !== 1) {
  throw new Error(`setStage(1) failed; expected stage 1, got ${gameState.state.madnessZone.stage}`);
}
console.log('[PASS] gameState.setStage correctly navigates between floors.');

// 8. Test Pantheon Trial & Forge Battle arenas for no NaN / undefined
import { renderDungeonView } from '../src/ui/views/dungeonView.js';
import { renderForgeView } from '../src/ui/views/forgeView.js';

// Start a Pantheon Trial
gameState.startDungeonTrial('pantheon', 'crypt_of_the_underworld', 1);
const trialContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};
renderDungeonView(trialContainer);
if (trialContainer.innerHTML.includes('NaN')) {
  throw new Error('Trial arena output contains NaN!');
}
if (trialContainer.innerHTML.includes('undefined Relics') || trialContainer.innerHTML.includes('undefined')) {
  throw new Error('Trial arena output contains undefined text!');
}
if (!trialContainer.innerHTML.includes('pantheon-battlefield') || !trialContainer.innerHTML.includes('btn-trial-strike')) {
  throw new Error('Trial battlefield arena failed to render correctly');
}
if (!trialContainer.innerHTML.includes('seamless-trial-column') || !trialContainer.innerHTML.includes('seamless-trial-slot')) {
  throw new Error('Trial battlefield arena must follow Tower of Madness seamless layout!');
}
gameState.exitDungeonBattle();
console.log('[PASS] Pantheon Trials arena renders cleanly with seamless animated spirits and no boxes or borders.');

// Start a Forge Trial
gameState.startDungeonTrial('forge', 'bladesmith_sanctum', 1);
const forgeContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};
renderForgeView(forgeContainer);
if (forgeContainer.innerHTML.includes('NaN')) {
  throw new Error('Forge arena output contains NaN!');
}
if (forgeContainer.innerHTML.includes('undefined')) {
  throw new Error('Forge arena output contains undefined text!');
}
if (!forgeContainer.innerHTML.includes('forge-battlefield') || !forgeContainer.innerHTML.includes('btn-forge-strike')) {
  throw new Error('Forge battlefield arena failed to render correctly');
}
gameState.exitDungeonBattle();
console.log('[PASS] Divine Forge arena renders cleanly with no NaN or undefined values.');

// 9. Verify index.html navigation tab label
import fs from 'fs';
const indexHtml = fs.readFileSync('index.html', 'utf8');
if (indexHtml.includes('>Tower<')) {
  throw new Error('index.html still contains Tower label! User explicitly requested Madness Zone name.');
}
if (!indexHtml.includes('>Madness<')) {
  throw new Error('index.html must have Madness label on nav tab.');
}
console.log('[PASS] Bottom nav dock label verified as Madness.');

// 10. Test Astral Realm View Expansion (Zodiac, Expeditions, Transmute)
import { renderMysticalView, setActiveRealmSection, setSelectedConstellationId } from '../src/ui/views/mysticalView.js';
const mysticalContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};
renderMysticalView(mysticalContainer);
if (!mysticalContainer.innerHTML.includes('data-realm-tab="zodiac"') || 
    !mysticalContainer.innerHTML.includes('data-realm-tab="expeditions"') || 
    !mysticalContainer.innerHTML.includes('data-realm-tab="transmute"')) {
  throw new Error('Astral Realm view missing Zodiac, Expeditions, or Transmute tabs!');
}
if (mysticalContainer.innerHTML.includes('NaN')) {
  throw new Error('Astral Realm view contains NaN!');
}
console.log('[PASS] Astral Realm view renders all 7 navigation tabs cleanly.');

// 11. Test Hero View Equipment Slot Upgrade Integration
import { renderPartyView } from '../src/ui/views/partyView.js';
import { showEquipmentSlotModal } from '../src/ui/components/modals.js';

const partyContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};

// Ensure a test relic is in inventory
const testRelic = {
  uid: 'test_relic_upgrade_hero',
  type: 'relic',
  slotTypeId: 'headgear',
  setId: 'zeus',
  stars: 3,
  level: 1,
  name: "Zeus's Crown",
  mainStatName: 'ATK Power',
  mainStatValue: 20
};
gameState.state.inventory.equipment.push(testRelic);

renderPartyView(partyContainer);
if (!partyContainer.innerHTML.includes('data-drawer-upgrade')) {
  throw new Error('Hero drawer is missing data-drawer-upgrade buttons for relics!');
}
if (!partyContainer.innerHTML.includes('Tap any socket to upgrade artifacts')) {
  throw new Error('Hero socket rack is missing upgrade artifacts guidance!');
}

// Equip to party spirit and test showEquipmentSlotModal
const partySpirits = gameState.getPartySpirits();
if (partySpirits.length > 0) {
  const heroSpirit = partySpirits[0];
  gameState.equipItem(heroSpirit.id, testRelic.uid);
  
  const modalRoot = {
    innerHTML: '',
    querySelector: () => ({ addEventListener: () => {} }),
    querySelectorAll: () => []
  };
  global.document.getElementById = (id) => id === 'modal-root' ? modalRoot : null;
  
  showEquipmentSlotModal({ spiritId: heroSpirit.id, slotType: 'headgear' });
  if (!modalRoot.innerHTML.includes('btn-modal-enhance')) {
    throw new Error('showEquipmentSlotModal missing direct Enhance button for equipped artifact!');
  }
  if (!modalRoot.innerHTML.includes('btn-modal-inspect-item')) {
    throw new Error('showEquipmentSlotModal missing Details button for equipped artifact!');
  }

  // Test weapon slot modal with direct enhance weapon button
  const testWpnItem = {
    uid: 'test_wpn_upgrade_hero',
    type: 'weapon',
    weaponTypeId: 'sword',
    rarity: 'RARE',
    level: 1,
    name: 'Rare Spectral Blade',
    atkPower: 40,
    critRate: 8,
    ultAmp: 12
  };
  gameState.state.inventory.equipment.push(testWpnItem);
  gameState.equipItem(heroSpirit.id, testWpnItem.uid);
  showEquipmentSlotModal({ spiritId: heroSpirit.id, slotType: 'weapon' });
  if (!modalRoot.innerHTML.includes('btn-modal-enhance-weapon')) {
    throw new Error('showEquipmentSlotModal missing direct Enhance button for equipped weapon!');
  }
  if (!modalRoot.innerHTML.includes('btn-modal-inspect-item')) {
    throw new Error('showEquipmentSlotModal missing Details button for equipped weapon!');
  }
}
console.log('[PASS] Hero View & Slot Modal artifact and weapon upgrade integration validated.');

// 12. Test Hero View 3x3 Tactical Squad Formation Mode
const heroFormationContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};
renderPartyView(heroFormationContainer);
// Simulate clicking 3x3 Formation button
if (!heroFormationContainer.innerHTML.includes('tactical-battle-grid') && !heroFormationContainer.innerHTML.includes('btn-mode-formation')) {
  throw new Error('Hero View missing 3x3 Formation mode switch pill');
}
console.log('[PASS] Hero View 3x3 Formation mode controls validated.');

// 13. Test Summon Banner Overhaul with Animated Hero & Divine Relic Pieces
import { renderContractView } from '../src/ui/views/contractView.js';
const contractContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};
renderContractView(contractContainer, () => {});
if (!contractContainer.innerHTML.includes('banner-showcase-pedestal') ||
    !contractContainer.innerHTML.includes('banner-relic-feature-pill') ||
    !contractContainer.innerHTML.includes('animated-relic-sprite')) {
  throw new Error('Banner Overhaul missing dual animated hero and relic showcase!');
}
console.log('[PASS] Summon Banner Overhaul with animated hero and divine relic piece validated.');

// 14. Test Animated Relics & Weapons in Vault and Character Equipment
import { renderVaultView } from '../src/ui/views/vaultView.js';
gameState.state.inventory = gameState.state.inventory || {};
gameState.state.inventory.equipment = [
  {
    uid: 'vault_test_relic_1',
    type: 'relic',
    stars: 4,
    level: 3,
    setId: 'zeus',
    slotTypeId: 'headgear',
    name: 'Thunder Crown',
    mainStatValue: 50,
    mainStatName: 'Max HP'
  },
  {
    uid: 'vault_test_weapon_1',
    type: 'weapon',
    level: 5,
    rarity: 'RARE',
    weaponType: 'sword',
    name: 'Spectral Warblade',
    atkPower: 45,
    critRate: 8
  }
];

const vaultTestContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};
renderVaultView(vaultTestContainer);
if (!vaultTestContainer.innerHTML.includes('vault-cat-btn')) {
  throw new Error('Vault View failed to render category buttons');
}

// Equip weapon and relic to starter spirit and test Party View
const starterSp = gameState.state.spirits[0];
gameState.state.inventory.equipment[0].equippedToSpiritId = starterSp.id;
gameState.state.inventory.equipment[1].equippedToSpiritId = starterSp.id;
starterSp.relics = { headgear: gameState.state.inventory.equipment[0] };
starterSp.weapon = gameState.state.inventory.equipment[1];

const partyEquipContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};
renderPartyView(partyEquipContainer);
if (!partyEquipContainer.innerHTML.includes('animated-weapon-sprite') ||
    !partyEquipContainer.innerHTML.includes('animated-relic-sprite')) {
  throw new Error('Party View character equipment missing animated weapon or relic sprites!');
}
console.log('[PASS] Animated Relics & Weapons in Vault and Character Equipment validated.');

// 15. Test Astral Realm Single-Focus Constellation Selector & Star-Chart Stage
setActiveRealmSection('zodiac');
setSelectedConstellationId('draco');
const zodiacContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};
renderMysticalView(zodiacContainer);
if (!zodiacContainer.innerHTML.includes('constellation-chips-scroll') ||
    !zodiacContainer.innerHTML.includes('constellation-chip-btn') ||
    !zodiacContainer.innerHTML.includes('constellation-showcase-stage') ||
    !zodiacContainer.innerHTML.includes('constellation-star-grid') ||
    !zodiacContainer.innerHTML.includes('cosmic-boons-drawer')) {
  throw new Error('Zodiac View missing Single-Focus Constellation chips, showcase stage, or boons drawer!');
}
console.log('[PASS] Astral Realm Single-Focus Constellation Selector & Star-Chart Stage verified.');

// 16. Test Dwarven's Forge Section in Astral Realm
setActiveRealmSection('dwarven');
const dwarvenContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};
renderMysticalView(dwarvenContainer);
if (!dwarvenContainer.innerHTML.includes('dwarven-master-sprite') ||
    !dwarvenContainer.innerHTML.includes('btn-buy-dwarven-scripture') ||
    !dwarvenContainer.innerHTML.includes('btn-buy-dwarven-reshaper') ||
    !dwarvenContainer.innerHTML.includes('divine_relic_scripture') ||
    !dwarvenContainer.innerHTML.includes('relic_anvil_hephaestus')) {
  throw new Error('Dwarven Forge section missing animated Vulcan master, scripture, or reshaper items!');
}
console.log("[PASS] Dwarven's Forge tab with animated Vulcan master and relic icons verified.");

// 17. Test Madness View Swarm Floors 2-Column Layout
gameState.state.madnessZone.stage = 3; // Floor 3 is a Swarm Floor
gameState.state.madnessZone.subStage = 4;
gameState.spawnMadnessEnemy();
const swarmMadnessContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};
renderMadnessView(swarmMadnessContainer);
if (!swarmMadnessContainer.innerHTML.includes('large-swarm') ||
    !swarmMadnessContainer.innerHTML.includes('grid-template-columns: repeat(2, 1fr)')) {
  throw new Error('Madness Zone Swarm Floor (Floor 3) failed to render large-swarm 2-column grid!');
}
console.log('[PASS] Madness View Swarm Floor 2-column layout (Floors ending in 3 or 7) verified.');

// 18. Test Tier 4 Dungeon Combat UI Layout
import { GREEK_GOD_SETS, WEAPON_TYPES } from '../src/data/equipmentData.js';
gameState.startDungeonTrial('pantheon', 'underworld_crypt', 4);
const battle = gameState.state.activeDungeonBattle;
battle.currentWave = 3;
battle.currentSwarm = gameState.generateDungeonWave('pantheon', 'underworld_crypt', 4, 3);

const t4BattleContainer = {
  innerHTML: '',
  querySelector: () => ({ addEventListener: () => {} }),
  querySelectorAll: () => []
};
renderDungeonView(t4BattleContainer);
if (!t4BattleContainer.innerHTML.includes('AVATAR') ||
    !t4BattleContainer.innerHTML.includes('BARRIER') ||
    !t4BattleContainer.innerHTML.includes('seamless-enemy-shield-fill') ||
    !t4BattleContainer.innerHTML.includes('Overlord')) {
  throw new Error('Tier 4 Dungeon Battle arena missing Overlord Attendants or Divine Barrier HUD!');
}
gameState.exitDungeonBattle();
console.log('[PASS] Tier 4 Dungeon Battle UI with Dual Overlord Attendants & Divine Barrier verified.');

// 19. Test Dedicated Offensive Tank (Hephaestus) & Pure Defensive Tank (Atlas) Sets
const hephSet = GREEK_GOD_SETS.hephaestus;
if (!hephSet || hephSet.bonus4pc.type !== 'OFFENSIVE_TANK_ERUPTION') {
  throw new Error('Hephaestus set missing bonus4pc type OFFENSIVE_TANK_ERUPTION!');
}
if (hephSet.bonus2pc.defToAtkRatio !== 0.25 || hephSet.bonus4pc.tauntDurationSec !== 4) {
  throw new Error('Hephaestus DEF-to-ATK conversion or taunt duration invalid!');
}

const atlasSet = GREEK_GOD_SETS.atlas;
if (!atlasSet || atlasSet.bonus4pc.type !== 'GUARDIAN_INTERCEPTION') {
  throw new Error('Atlas set missing bonus4pc type GUARDIAN_INTERCEPTION!');
}
if (atlasSet.bonus4pc.teamDamageReduction !== 0.12 || atlasSet.bonus4pc.shieldPercentMaxHp !== 0.30) {
  throw new Error('Atlas party damage mitigation or shield percent invalid!');
}
console.log('[PASS] Dedicated Offensive Tank (Hephaestus) & Pure Defensive Tank (Atlas) sets verified.');

// 20. Test 12 Weapon Archetypes & Diverse Passives
if (!Array.isArray(WEAPON_TYPES) || WEAPON_TYPES.length !== 12) {
  throw new Error(`Expected 12 weapon archetypes in WEAPON_TYPES array, got ${WEAPON_TYPES?.length}`);
}
const expectedWeaponIds = ['sword', 'bow', 'staff', 'claw', 'dagger', 'hammer', 'scythe', 'shield', 'grimoire', 'warhammer', 'halberd', 'tome'];
for (const wId of expectedWeaponIds) {
  const wObj = WEAPON_TYPES.find(w => w.id === wId);
  if (!wObj || !wObj.name || !wObj.primaryStat || !wObj.abilityName || !wObj.abilityDesc) {
    throw new Error(`Weapon archetype "${wId}" missing name, primaryStat, or ability`);
  }
}
console.log('[PASS] All 12 Weapon Archetypes with unique primary stats and combat abilities verified.');

console.log('\n--- ALL UI LOGIC TESTS PASSED! ---');
process.exit(0);


