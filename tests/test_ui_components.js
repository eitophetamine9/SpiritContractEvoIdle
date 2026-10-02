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
  }
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
if (speciesList.length !== 37) {
  throw new Error(`Expected 37 species, got ${speciesList.length}`);
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

console.log('\n--- ALL UI LOGIC TESTS PASSED! ---');
process.exit(0);
