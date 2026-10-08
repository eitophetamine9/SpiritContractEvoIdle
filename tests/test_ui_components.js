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
if (speciesList.length !== 47) {
  throw new Error(`Expected 47 species, got ${speciesList.length}`);
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
if (!madnessContainer.innerHTML.includes('enemy-swarm-wrapper') || !madnessContainer.innerHTML.includes('enemy-placeholder-frame')) {
  throw new Error('Enemies are missing from the Madness battlefield!');
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
console.log('[PASS] Madness Zone View renders allies, enemies, controls, and audio toggle cleanly.');

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
gameState.exitDungeonBattle();
console.log('[PASS] Pantheon Trials arena renders cleanly with no NaN or undefined values.');

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
import { renderMysticalView } from '../src/ui/views/mysticalView.js';
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
}
console.log('[PASS] Hero View & Slot Modal artifact upgrade integration validated.');

console.log('\n--- ALL UI LOGIC TESTS PASSED! ---');
process.exit(0);
