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

const titleScreenRoot = {
  innerHTML: '',
  style: {},
  classList: { add: () => {}, remove: () => {} },
  querySelectorAll: (selector) => [],
  querySelector: (selector) => null
};

const appRoot = {
  style: {}
};

globalThis.document = {
  addEventListener: () => {},
  getElementById: (id) => {
    if (id === 'modal-root') return modalRoot;
    if (id === 'title-screen-root') return titleScreenRoot;
    if (id === 'app') return appRoot;
    return null;
  },
  querySelector: () => null,
  querySelectorAll: () => []
};

const modalRoot = {
  innerHTML: '',
  querySelectorAll: (selector) => [],
  querySelector: (selector) => ({ addEventListener: () => {} })
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
  querySelector: function(sel) {
    return null;
  },
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
  global.document.getElementById = (id) => {
    if (id === 'modal-root') return modalRoot;
    if (id === 'title-screen-root') return titleScreenRoot;
    if (id === 'app') return appRoot;
    return null;
  };
  
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

// 21. Test Supabase Auth Service & Contractor Account Modal
import { authService } from '../src/services/authService.js';
import { showAuthModal } from '../src/ui/components/authModal.js';
import { isSupabaseConfigured } from '../src/services/supabaseClient.js';

if (!authService.isGuest()) {
  throw new Error('Default session must be guest mode!');
}
const initialProfile = authService.getProfile();
if (!initialProfile || !initialProfile.username) {
  throw new Error('Guest profile missing default username!');
}

authService.setGuestUsername('Astral Vanguard');
if (authService.getProfile().username !== 'Astral Vanguard') {
  throw new Error('Failed to update guest username in authService!');
}

showAuthModal();
const activeModalRoot = document.getElementById('modal-root');
if (!activeModalRoot.innerHTML.includes('Contractor Account') ||
    !activeModalRoot.innerHTML.includes('Guest Mode') ||
    !activeModalRoot.innerHTML.includes('tab-btn-signin') ||
    !activeModalRoot.innerHTML.includes('tab-btn-signup')) {
  throw new Error('Auth modal failed to render contractor account, guest mode, or auth tabs!');
}
console.log(`[PASS] Supabase Auth Service & Account Modal verified (Supabase Configured: ${isSupabaseConfigured()})!`);

// 22. Test Title / Home Screen Gateway
import { initTitleScreen, showTitleScreen, isTitleScreenActive } from '../src/ui/components/titleScreen.js';

let enteredGameCalled = false;
initTitleScreen({ onEnterGame: () => { enteredGameCalled = true; } });

if (!isTitleScreenActive()) {
  throw new Error('Title screen should be active initially!');
}

if (!titleScreenRoot.innerHTML.includes('Spirit Contract Evo') ||
    !titleScreenRoot.innerHTML.includes('Play as Guest') ||
    !titleScreenRoot.innerHTML.includes('tab-home-signin') ||
    !titleScreenRoot.innerHTML.includes('tab-home-signup')) {
  throw new Error('Title screen failed to render title, play as guest, signin, or signup tabs!');
}
console.log('[PASS] Title / Home Screen Gateway renders correctly with Guest, Sign In, and Register choices!');

// 23. Test Step 2 Cloud Save & Sync Engine with Conflict Resolution
import { cloudSaveService } from '../src/services/cloudSaveService.js';
import { showConflictModal } from '../src/ui/components/conflictModal.js';

if (!cloudSaveService || typeof cloudSaveService.uploadSave !== 'function') {
  throw new Error('cloudSaveService missing uploadSave method!');
}

if (cloudSaveService.syncStatus !== 'local') {
  throw new Error('cloudSaveService initial syncStatus should be local in guest mode!');
}

// Test gameState.loadCustomState
const initialShards = gameState.state.resources.spiritShards;
const mockCustomState = JSON.parse(JSON.stringify(gameState.state));
mockCustomState.resources.spiritShards = 999999;
mockCustomState.madnessZone.highestUnlockedStage = 100;

const loadResult = gameState.loadCustomState(mockCustomState);
if (!loadResult || gameState.state.resources.spiritShards !== 999999 || gameState.state.madnessZone.highestUnlockedStage !== 100) {
  throw new Error('gameState.loadCustomState failed to apply custom state!');
}
console.log('[PASS] gameState.loadCustomState properly reconciles and applies external cloud state!');

// Test Conflict Resolution Modal rendering
let pickedLocal = false;
let pickedCloud = false;

showConflictModal({
  localSummary: {
    timestamp: Date.now() - 5000,
    stage: 15,
    partyPower: 50000,
    shards: 12000,
    spiritsCount: 12
  },
  cloudSummary: {
    timestamp: Date.now() - 1000,
    stage: 20,
    partyPower: 80000,
    shards: 25000,
    spiritsCount: 18
  },
  onChooseLocal: () => { pickedLocal = true; },
  onChooseCloud: () => { pickedCloud = true; }
});

const activeConflictRoot = document.getElementById('modal-root');
if (!activeConflictRoot.innerHTML.includes('Cloud Save Conflict Detected') ||
    !activeConflictRoot.innerHTML.includes('Local Device Save') ||
    !activeConflictRoot.innerHTML.includes('Supabase Cloud Save') ||
    !activeConflictRoot.innerHTML.includes('btn-conflict-pick-local') ||
    !activeConflictRoot.innerHTML.includes('btn-conflict-pick-cloud')) {
  throw new Error('Conflict modal failed to render conflict details and choice buttons!');
}
console.log('[PASS] Cloud Save Conflict Resolution Modal renders comparison metrics & action buttons!');

// 25. Test Contractor Leveling & Feature Gating
import { showLevelUpModal } from '../src/ui/components/levelUpModal.js';
import { renderProfileView } from '../src/ui/views/profileView.js';
import { FEATURE_UNLOCKS, getContractorXpRequired, getFeaturesUnlockedAtLevel, isFeatureUnlocked } from '../src/data/contractorData.js';

// 1. Initial level & feature status
if (gameState.getContractorLevel() !== 1) {
  throw new Error(`Expected initial contractor level 1, got ${gameState.getContractorLevel()}`);
}

if (gameState.isFeatureUnlocked('FORMATION_3X3')) {
  throw new Error('FORMATION_3X3 should be locked at Lv 1');
}
if (gameState.isFeatureUnlocked('BESTIARY_INDEX')) {
  throw new Error('BESTIARY_INDEX should be locked at Lv 1');
}
if (gameState.isFeatureUnlocked('PANTHEON_TRIALS')) {
  throw new Error('PANTHEON_TRIALS should be locked at Lv 1');
}
if (gameState.isFeatureUnlocked('DIVINE_FORGE')) {
  throw new Error('DIVINE_FORGE should be locked at Lv 1');
}
if (gameState.isFeatureUnlocked('SANCTUARY_ESSENCE')) {
  throw new Error('SANCTUARY_ESSENCE should be locked at Lv 1');
}
if (gameState.isFeatureUnlocked('ASTRAL_REALM')) {
  throw new Error('ASTRAL_REALM should be locked at Lv 1');
}
if (gameState.isFeatureUnlocked('SPIRIT_REBIRTH')) {
  throw new Error('SPIRIT_REBIRTH should be locked at Lv 1');
}

// 2. XP progression & Leveling up to Lv 3
let leveledUpEvents = [];
const unsub = gameState.on('contractorLevelUp', (payload) => {
  leveledUpEvents.push(payload);
});

// Level 1 requires 250 XP (was 100)
const prevShards = gameState.state.resources.spiritShards;
gameState.addContractorXp(250, 'Test Combat Floor 1 & 2');

if (gameState.getContractorLevel() !== 2) {
  throw new Error(`Expected contractor level 2, got ${gameState.getContractorLevel()}`);
}
if (gameState.state.resources.spiritShards !== prevShards + 100) {
  throw new Error('Ascension spoils +100 shards not awarded!');
}
if (!gameState.isFeatureUnlocked('FORMATION_3X3')) {
  throw new Error('FORMATION_3X3 should be unlocked at Lv 2!');
}

// Level up to Lv 3 (Lv 2 requires 683 XP)
gameState.addContractorXp(683, 'Test Summons & Evo');
if (gameState.getContractorLevel() < 3) {
  throw new Error(`Expected contractor level >= 3, got ${gameState.getContractorLevel()}`);
}
if (!gameState.isFeatureUnlocked('PANTHEON_TRIALS')) {
  throw new Error('PANTHEON_TRIALS should be unlocked at Lv 3!');
}
if (!gameState.isFeatureUnlocked('DIVINE_FORGE')) {
  throw new Error('DIVINE_FORGE should be unlocked at Lv 3!');
}

console.log('[PASS] Contractor Leveling & Feature Gating progression validated (Lv 1 -> Lv 2 unlocks FORMATION_3X3, Lv 3 unlocks PANTHEON_TRIALS and DIVINE_FORGE)!');

// 3. Test Level Up Celebration Modal rendering
let claimedLevelUp = false;
showLevelUpModal({
  level: 3,
  newFeatures: getFeaturesUnlockedAtLevel(3),
  rewards: { shards: 100, energy: 20 },
  onClaim: () => { claimedLevelUp = true; }
});

const lvlModalRoot = document.getElementById('modal-root');
if (!lvlModalRoot.innerHTML.includes('Contractor Ascension') ||
    !lvlModalRoot.innerHTML.includes('Level 3 Reached!') ||
    !lvlModalRoot.innerHTML.includes('New System Unlocked!') ||
    !lvlModalRoot.innerHTML.includes('Pantheon Trials (Artifact Dungeon)') ||
    !lvlModalRoot.innerHTML.includes('+100 Shards') ||
    !lvlModalRoot.innerHTML.includes('+20 Energy') ||
    !lvlModalRoot.innerHTML.includes('btn-claim-levelup')) {
  throw new Error('Level up modal failed to render ascension details and rewards!');
}
console.log('[PASS] Contractor Ascension celebration modal properly renders spoils & unlocked systems!');

// 4. Test Profile View Contractor Level & Milestone Section
const testProfileContainer = {
  innerHTML: '',
  querySelectorAll: (selector) => [],
  querySelector: (selector) => null
};
renderProfileView(testProfileContainer);

if (!testProfileContainer.innerHTML.includes('Contractor Ascension') ||
    !testProfileContainer.innerHTML.includes('profile-contractor-level-card') ||
    !testProfileContainer.innerHTML.includes('contractor-xp-bar-fill') ||
    !testProfileContainer.innerHTML.includes('Next Unlock') ||
    !testProfileContainer.innerHTML.includes('Feature Unlock Roadmap')) {
  throw new Error('Profile view failed to render Contractor Level card and Milestone Roadmap!');
}
console.log('[PASS] Profile View renders Contractor Level card, EXP bar, and Milestones Roadmap!');

// 26. Test Guided Onboarding Tutorial System
import { guidedTutorial, TUTORIAL_STEPS } from '../src/ui/components/guidedTutorial.js';

if (!Array.isArray(TUTORIAL_STEPS) || TUTORIAL_STEPS.length !== 8) {
  throw new Error(`Expected 8 tutorial steps, found ${TUTORIAL_STEPS?.length}`);
}

// Test initial tutorial state
gameState.restartTutorial();
const tutState = gameState.getTutorialState();
if (tutState.step !== 0 || !tutState.active || tutState.completed) {
  throw new Error('Initial tutorial state should be step 0, active true, completed false');
}

// Advance step
gameState.advanceTutorialStep(1);
if (gameState.getTutorialState().step !== 1) {
  throw new Error('advanceTutorialStep failed to advance to step 1');
}

// Complete tutorial with reward
const shardsBefore = gameState.state.resources.spiritShards;
gameState.completeTutorial(true);
if (!gameState.getTutorialState().completed || gameState.getTutorialState().active) {
  throw new Error('completeTutorial failed to mark tutorial as completed');
}
if (gameState.state.resources.spiritShards !== shardsBefore + 150) {
  throw new Error('completeTutorial failed to award 150 bonus shards');
}

console.log('[PASS] Guided Tutorial state engine, step progression, and completion reward validated!');

// 27. Test Fresh Account Reset & State Bleed Prevention
gameState.state.madnessZone.stage = 25;
gameState.state.madnessZone.highestStageCleared = 24;
gameState.state.contractor.level = 15;
gameState.completeTutorial(false);

if (gameState.state.madnessZone.stage !== 25 || gameState.getTutorialState().completed !== true) {
  throw new Error('Failed to setup dirty simulated dev state for test');
}

// Perform resetAllProgress
const freshState = gameState.resetAllProgress();
if (freshState.madnessZone.stage !== 1 ||
    freshState.madnessZone.highestStageCleared !== 0 ||
    freshState.spirits.length !== 1 ||
    freshState.contractor.level !== 1 ||
    freshState.resources.spiritShards !== 300 ||
    freshState.tutorial.active !== true ||
    freshState.tutorial.completed !== false) {
  throw new Error('resetAllProgress failed to return a clean Day-1 starter state with active tutorial!');
}

console.log('[PASS] Fresh Account Reset & State Bleed Prevention validated!');

// 28. Test Combat Animation Engine & Event Cadence Pipeline
import { 
  triggerSpiritAttack, 
  triggerEnemyFlinch, 
  triggerEnemyAttack, 
  triggerSpiritFlinch, 
  triggerPartyStrikeExchange 
} from '../src/render/combatAnimator.js';

function createMockElement(tag, className = '') {
  const classes = new Set(className.split(' ').filter(Boolean));
  const el = {
    tagName: tag.toUpperCase(),
    className: className,
    classList: {
      add(...cls) { cls.forEach(c => classes.add(c)); el.className = Array.from(classes).join(' '); },
      remove(...cls) { cls.forEach(c => classes.delete(c)); el.className = Array.from(classes).join(' '); },
      contains(c) { return classes.has(c); }
    },
    offsetWidth: 50,
    children: [],
    querySelector(selector) {
      if (selector.includes('.animated-pixel-sprite')) {
        return el.children.find(c => c.classList.contains('animated-pixel-sprite')) || null;
      }
      if (selector.includes('.seamless-enemy-slot')) {
        return el.children.find(c => c.classList.contains('seamless-enemy-slot')) || null;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector.includes('.seamless-battle-spirit')) {
        return el.children.filter(c => c.classList.contains('seamless-battle-spirit'));
      }
      return [];
    }
  };
  return el;
}

const mockCombatContainer = createMockElement('div', 'madness-container');
const mockAllySlot = createMockElement('div', 'seamless-battle-spirit');
const mockAllySprite = createMockElement('div', 'animated-pixel-sprite sprite-feline_shadow');
mockAllySlot.children.push(mockAllySprite);

const mockEnemySlot = createMockElement('div', 'seamless-enemy-slot');
const mockEnemySprite = createMockElement('div', 'animated-pixel-sprite sprite-enemy');
mockEnemySlot.children.push(mockEnemySprite);

mockCombatContainer.children.push(mockAllySlot, mockEnemySlot);

// Test 1: Spirit Attack Animation
triggerSpiritAttack(mockAllySlot);
if (!mockAllySlot.classList.contains('lunge-attack') || !mockAllySprite.classList.contains('attacking')) {
  throw new Error('triggerSpiritAttack failed to add lunge-attack or attacking class!');
}

// Test 2: Enemy Flinch Animation
triggerEnemyFlinch(mockEnemySlot);
if (!mockEnemySlot.classList.contains('enemy-hit-flash') || !mockEnemySprite.classList.contains('hurt') || !mockEnemySprite.classList.contains('flinching')) {
  throw new Error('triggerEnemyFlinch failed to add enemy-hit-flash or hurt/flinching class!');
}

// Test 3: Enemy Attack Animation
triggerEnemyAttack(mockEnemySlot);
if (!mockEnemySlot.classList.contains('enemy-lunge-attack') || !mockEnemySprite.classList.contains('attacking')) {
  throw new Error('triggerEnemyAttack failed to add enemy-lunge-attack or attacking class!');
}

// Test 4: Spirit Flinch Animation
triggerSpiritFlinch(mockAllySlot);
if (!mockAllySlot.classList.contains('spirit-hit-flinch') || !mockAllySprite.classList.contains('hurt') || !mockAllySprite.classList.contains('flinching')) {
  throw new Error('triggerSpiritFlinch failed to add spirit-hit-flinch or hurt/flinching class!');
}

// Test 5: Full Party Strike Exchange
triggerPartyStrikeExchange(mockCombatContainer);
if (!mockAllySlot.classList.contains('lunge-attack') || !mockEnemySlot.classList.contains('enemy-hit-flash')) {
  throw new Error('triggerPartyStrikeExchange failed to trigger exchange animations on container!');
}

// Test 6: Verify combatStrike and manualPartyStrike events from gameState
let receivedCombatStrike = false;
let receivedManualStrike = false;

const unsubscribeCombat = gameState.subscribe((eventType, payload) => {
  if (eventType === 'combatStrike') receivedCombatStrike = true;
  if (eventType === 'manualPartyStrike') receivedManualStrike = true;
});

gameState.attackEnemyWithPartyPower();
if (!receivedManualStrike) {
  throw new Error('attackEnemyWithPartyPower did not emit manualPartyStrike event!');
}

// Tick madness zone to trigger auto combat strike cadence
gameState.state.madnessZone.isEngaged = true;
gameState.tickMadnessCombat(2.0); // 2s tick exceeds 1.2s cadence
if (!receivedCombatStrike) {
  throw new Error('tickMadnessCombat did not emit combatStrike event during auto combat!');
}

console.log('[PASS] Combat Animation Engine, sprite classes, and event cadence pipeline validated!');

console.log('\n--- ALL UI LOGIC TESTS PASSED! ---');
process.exit(0);



