/**
 * Unified Bestiary-Style Vault & Inventory View
 * High-density compact tile grid for:
 * 1) Owned Spirits (Level, Power, Evolution, Favorite, Annul)
 * 2) Greek God Relics (Headgear, Totem, Ring, Necklace, Orb, Charm)
 * 3) Weapons (Blades, Bows, Staves, Claws, Daggers, Mallets)
 */

import { gameState } from '../../state/gameState.js';
import { SPIRIT_SPECIES, getRarityInfo } from '../../data/spiritsData.js';
import { EQUIPMENT_RARITIES, GREEK_GOD_SETS } from '../../data/equipmentData.js';
import { showSpiritModal, showItemInspectModal } from '../components/modals.js';

let activeCategory = 'spirits'; // 'spirits' | 'relics' | 'weapons'
let activeRarityFilter = 'ALL';
let searchQuery = '';
let isBulkMode = false;
let selectedForBulk = new Set();

export function renderVaultView(container) {
  const state = gameState.state;
  const spirits = state.spirits || [];
  const partyIds = state.party || [];
  const allEquipment = (state.inventory && state.inventory.equipment) || [];
  const relics = allEquipment.filter(e => e.type === 'relic');
  const weapons = allEquipment.filter(e => e.type === 'weapon');

  const query = searchQuery.toLowerCase().trim();

  // 1. Filter Spirits
  const filteredSpirits = spirits.filter(s => {
    if (query) {
      const customMatch = (s.customName || '').toLowerCase().includes(query);
      const species = SPIRIT_SPECIES[s.speciesId];
      const speciesMatch = species && species.name.toLowerCase().includes(query);
      if (!customMatch && !speciesMatch) return false;
    }
    if (activeRarityFilter === 'ALL') return true;
    if (activeRarityFilter === 'FAVORITES') return !!s.favorite;
    return (s.rarity || 'COMMON').toUpperCase() === activeRarityFilter;
  });

  filteredSpirits.sort((a, b) => {
    const aFav = a.favorite ? 1 : 0;
    const bFav = b.favorite ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    const aEq = partyIds.includes(a.id) ? 1 : 0;
    const bEq = partyIds.includes(b.id) ? 1 : 0;
    if (aEq !== bEq) return bEq - aEq;
    return b.power - a.power;
  });

  // 2. Filter Relics
  const filteredRelics = relics.filter(r => {
    if (query) {
      const nameMatch = (r.name || '').toLowerCase().includes(query);
      const setMatch = (r.setName || '').toLowerCase().includes(query);
      if (!nameMatch && !setMatch) return false;
    }
    if (activeRarityFilter === 'ALL') return true;
    if (activeRarityFilter === 'FAVORITES') return !!r.equippedToSpiritId;
    return (r.rarity || 'COMMON').toUpperCase() === activeRarityFilter;
  });

  filteredRelics.sort((a, b) => {
    const aEq = a.equippedToSpiritId ? 1 : 0;
    const bEq = b.equippedToSpiritId ? 1 : 0;
    if (aEq !== bEq) return bEq - aEq;
    return (b.mainStatValue || 0) - (a.mainStatValue || 0);
  });

  // 3. Filter Weapons
  const filteredWeapons = weapons.filter(w => {
    if (query) {
      const nameMatch = (w.name || '').toLowerCase().includes(query);
      if (!nameMatch) return false;
    }
    if (activeRarityFilter === 'ALL') return true;
    if (activeRarityFilter === 'FAVORITES') return !!w.equippedToSpiritId;
    return (w.rarity || 'COMMON').toUpperCase() === activeRarityFilter;
  });

  filteredWeapons.sort((a, b) => {
    const aEq = a.equippedToSpiritId ? 1 : 0;
    const bEq = b.equippedToSpiritId ? 1 : 0;
    if (aEq !== bEq) return bEq - aEq;
    return (b.atkPower || 0) - (a.atkPower || 0);
  });

  const rarityTiers = ['ALL', 'FAVORITES', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHICAL', 'TRANSCENDENT'];

  // Bulk stats for spirits
  let bulkShardsRefund = 0;
  selectedForBulk.forEach(id => {
    const sp = spirits.find(s => s.id === id);
    if (sp) {
      bulkShardsRefund += 40 * (sp.tier || 1) + Math.floor((sp.level || 1) * 3);
    }
  });

  container.innerHTML = `
    <div class="index-container vault-bestiary-container">
      
      <!-- Top Bestiary Inventory Header -->
      <div class="index-header-banner">
        <div class="index-header-top">
          <div class="index-title-group">
            <span class="index-main-title">📜 Vault & Bestiary</span>
            <span class="index-subtitle">High-Density Arcane Vault: Owned Spirits, Olympian Relics & Weapons</span>
          </div>

          <div class="index-score-badge">
            <span class="score-num">${spirits.length}</span>
            <span class="score-lbl">Spirits Owned</span>
          </div>
        </div>

        <!-- 3-Category Navigation Switcher -->
        <div class="vault-category-switcher" style="display: flex; gap: 6px; margin-top: 12px;">
          <button class="vault-cat-btn ${activeCategory === 'spirits' ? 'active' : ''}" data-cat="spirits">
            ⛩️ Spirits (${spirits.length})
          </button>
          <button class="vault-cat-btn ${activeCategory === 'relics' ? 'active' : ''}" data-cat="relics">
            🔱 Relics (${relics.length})
          </button>
          <button class="vault-cat-btn ${activeCategory === 'weapons' ? 'active' : ''}" data-cat="weapons">
            ⚔️ Weapons (${weapons.length})
          </button>
        </div>
      </div>

      <!-- Live Search & Bulk Toggle Controls -->
      <div style="display: flex; gap: 8px; margin: 10px 0;">
        <div class="vault-search-box" style="flex: 1; margin: 0;">
          <span class="search-icon">🔍</span>
          <input type="text" id="vault-search-input" class="vault-search-input" 
                 placeholder="Search ${activeCategory}..." 
                 value="${searchQuery}" />
          ${searchQuery ? `<button id="btn-clear-search" class="btn-clear-search">✕</button>` : ''}
        </div>

        ${activeCategory === 'spirits' ? `
          <button id="btn-toggle-bulk" class="btn-bulk-toggle ${isBulkMode ? 'active' : ''}" style="white-space: nowrap;">
            ${isBulkMode ? 'Done' : '📦 Bulk Annul'}
          </button>
        ` : ''}
      </div>

      <!-- Rarity Filter Chips -->
      <div class="index-filter-scroll">
        ${rarityTiers.map(tier => {
          const info = tier === 'ALL' || tier === 'FAVORITES' ? { color: '#ffffff' } : getRarityInfo(tier);
          const isActive = activeRarityFilter === tier;
          return `
            <button class="index-filter-btn ${isActive ? 'active' : ''}" 
                    data-tier="${tier}"
                    style="${isActive && tier !== 'ALL' && tier !== 'FAVORITES' ? `border-color: ${info.color}; color: ${info.color};` : ''}">
              ${tier === 'FAVORITES' ? (activeCategory === 'spirits' ? '⭐ Favorites' : '✓ Equipped') : tier}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Bulk Actions Bar (Spirits only) -->
      ${isBulkMode && activeCategory === 'spirits' ? `
        <div class="bulk-action-bar">
          <div class="bulk-select-presets">
            <button id="btn-select-commons" class="btn-preset-sm">Select Unequipped Commons</button>
            <button id="btn-select-uncommons" class="btn-preset-sm">Select Unequipped Uncommons</button>
            <button id="btn-clear-selection" class="btn-preset-sm">Clear</button>
          </div>

          <div class="bulk-confirm-row">
            <span class="bulk-count-text">Selected: <strong>${selectedForBulk.size}</strong></span>
            <button id="btn-execute-bulk" class="btn-execute-bulk" ${selectedForBulk.size === 0 ? 'disabled' : ''}>
              Annul Selected (+${bulkShardsRefund} 💎)
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Grid Content Section -->
      <div class="bestiary-grid">
        
        <!-- Category 1: Owned Spirits -->
        ${activeCategory === 'spirits' ? (
          filteredSpirits.length === 0 ? `
            <div class="vault-empty-state" style="grid-column: 1 / -1;">
              <span>No spirits match your filter criteria.</span>
            </div>
          ` : filteredSpirits.map(s => {
            const isEquipped = partyIds.includes(s.id);
            const isSelected = selectedForBulk.has(s.id);
            const rarity = getRarityInfo(s.rarity || 'COMMON');

            return `
              <div class="bestiary-tile discovered rarity-${(s.rarity || 'common').toLowerCase()} ${isSelected ? 'bulk-selected' : ''}" 
                   data-spirit-id="${s.id}"
                   style="border-color: ${rarity.color}; cursor: pointer;">
                
                <div style="position: absolute; top: 4px; left: 4px; display: flex; gap: 2px; z-index: 2;">
                  ${isEquipped ? `<span style="font-size: 10px; background: rgba(39, 174, 96, 0.85); padding: 1px 3px; border-radius: 2px;">⛩️</span>` : ''}
                  ${s.favorite ? `<span style="font-size: 10px; color: #ffd32a;">⭐</span>` : ''}
                </div>

                <span class="bestiary-tile-num" style="color: ${rarity.color};">Lv.${s.level}</span>

                <div class="bestiary-tile-art" style="background: radial-gradient(circle, ${rarity.color}22 0%, transparent 70%);">
                  <span style="font-size: 26px;">${s.speciesId === 'cat_spirit' ? '🐱' : '🐾'}</span>
                </div>

                <span class="bestiary-tile-name" style="color: #fff;">${s.customName}</span>
                <span style="font-size: 9px; color: #ffd32a; font-weight: 800;">⚡${s.power.toLocaleString()}</span>
              </div>
            `;
          }).join('')
        ) : ''}

        <!-- Category 2: Greek God Relics -->
        ${activeCategory === 'relics' ? (
          filteredRelics.length === 0 ? `
            <div class="vault-empty-state" style="grid-column: 1 / -1;">
              <span>No relics found. Clear Pantheon Trials to earn Greek God relics!</span>
            </div>
          ` : filteredRelics.map(r => {
            const rarObj = EQUIPMENT_RARITIES[r.rarity] || EQUIPMENT_RARITIES.COMMON;
            const isEquipped = !!r.equippedToSpiritId;
            const equippedSpirit = isEquipped ? spirits.find(s => s.id === r.equippedToSpiritId) : null;

            return `
              <div class="bestiary-tile discovered rarity-${r.rarity.toLowerCase()}" 
                   data-relic-uid="${r.uid}"
                   style="border-color: ${rarObj.color}; cursor: pointer; background: linear-gradient(180deg, ${r.color || '#8e44ad'}18 0%, rgba(15, 20, 25, 0.95) 100%);">
                
                <div style="position: absolute; top: 4px; left: 4px; display: flex; gap: 2px; z-index: 2;">
                  <span style="font-size: 11px;">${r.godIcon || '🔱'}</span>
                  ${isEquipped ? `<span style="font-size: 9px; background: rgba(39, 174, 96, 0.85); padding: 1px 3px; border-radius: 2px; color: #fff;">✓</span>` : ''}
                </div>

                <span class="bestiary-tile-num" style="color: ${rarObj.color};">${r.slotName || 'Relic'}</span>

                <div class="bestiary-tile-art">
                  <span style="font-size: 26px;">${r.icon}</span>
                </div>

                <span class="bestiary-tile-name" style="color: ${r.accentColor || '#fff'}; font-size: 10px;">${r.name}</span>
                <span style="font-size: 9px; color: #2ed573; font-weight: 800;">+${r.mainStatValue}</span>
                ${isEquipped && equippedSpirit ? `<span style="font-size: 8px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 90%;">${equippedSpirit.customName}</span>` : ''}
              </div>
            `;
          }).join('')
        ) : ''}

        <!-- Category 3: Weapons -->
        ${activeCategory === 'weapons' ? (
          filteredWeapons.length === 0 ? `
            <div class="vault-empty-state" style="grid-column: 1 / -1;">
              <span>No weapons found. Smelt weapons in The Divine Forge!</span>
            </div>
          ` : filteredWeapons.map(w => {
            const rarObj = EQUIPMENT_RARITIES[w.rarity] || EQUIPMENT_RARITIES.COMMON;
            const isEquipped = !!w.equippedToSpiritId;
            const equippedSpirit = isEquipped ? spirits.find(s => s.id === w.equippedToSpiritId) : null;

            return `
              <div class="bestiary-tile discovered rarity-${w.rarity.toLowerCase()}" 
                   data-weapon-uid="${w.uid}"
                   style="border-color: ${rarObj.color}; cursor: pointer; background: linear-gradient(180deg, rgba(230, 126, 34, 0.15) 0%, rgba(15, 20, 25, 0.95) 100%);">
                
                <div style="position: absolute; top: 4px; left: 4px; display: flex; gap: 2px; z-index: 2;">
                  ${isEquipped ? `<span style="font-size: 9px; background: rgba(39, 174, 96, 0.85); padding: 1px 3px; border-radius: 2px; color: #fff;">✓</span>` : ''}
                </div>

                <span class="bestiary-tile-num" style="color: ${rarObj.color};">Lv.${w.level || 1}</span>

                <div class="bestiary-tile-art">
                  <span style="font-size: 26px;">${w.icon}</span>
                </div>

                <span class="bestiary-tile-name" style="color: ${rarObj.color}; font-size: 10px;">${w.name}</span>
                <span style="font-size: 9px; color: #ff4757; font-weight: 800;">⚡+${w.atkPower}</span>
                ${isEquipped && equippedSpirit ? `<span style="font-size: 8px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 90%;">${equippedSpirit.customName}</span>` : ''}
              </div>
            `;
          }).join('')
        ) : ''}

      </div>

    </div>
  `;

  // Attach Category Switcher listeners
  container.querySelectorAll('.vault-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-cat');
      isBulkMode = false;
      selectedForBulk.clear();
      renderVaultView(container);
    });
  });

  // Attach Search listeners
  const searchInput = container.querySelector('#vault-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderVaultView(container);
      const newInput = container.querySelector('#vault-search-input');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(searchQuery.length, searchQuery.length);
      }
    });
  }

  const btnClearSearch = container.querySelector('#btn-clear-search');
  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      searchQuery = '';
      renderVaultView(container);
    });
  }

  // Attach Rarity Filter listeners
  container.querySelectorAll('.index-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeRarityFilter = btn.dataset.tier;
      renderVaultView(container);
    });
  });

  // Attach Spirit Tile click listeners
  container.querySelectorAll('[data-spirit-id]').forEach(tile => {
    tile.addEventListener('click', () => {
      const spId = tile.dataset.spiritId;
      if (isBulkMode) {
        if (partyIds.includes(spId)) {
          alert('Cannot select an active party spirit for annulment.');
          return;
        }
        if (selectedForBulk.has(spId)) {
          selectedForBulk.delete(spId);
        } else {
          selectedForBulk.add(spId);
        }
        renderVaultView(container);
        return;
      }

      const spirit = spirits.find(s => s.id === spId);
      if (spirit) {
        showSpiritModal(spirit, () => renderVaultView(container));
      }
    });
  });

  // Attach Relic Tile click listeners
  container.querySelectorAll('[data-relic-uid]').forEach(tile => {
    tile.addEventListener('click', () => {
      const uid = tile.dataset.relicUid;
      const relic = relics.find(r => r.uid === uid);
      if (relic) {
        showItemInspectModal({ item: relic, onUpdate: () => renderVaultView(container) });
      }
    });
  });

  // Attach Weapon Tile click listeners
  container.querySelectorAll('[data-weapon-uid]').forEach(tile => {
    tile.addEventListener('click', () => {
      const uid = tile.dataset.weaponUid;
      const weapon = weapons.find(w => w.uid === uid);
      if (weapon) {
        showItemInspectModal({ item: weapon, onUpdate: () => renderVaultView(container) });
      }
    });
  });

  // Bulk Mode buttons
  const btnToggleBulk = container.querySelector('#btn-toggle-bulk');
  if (btnToggleBulk) {
    btnToggleBulk.addEventListener('click', () => {
      isBulkMode = !isBulkMode;
      selectedForBulk.clear();
      renderVaultView(container);
    });
  }

  const btnSelectCommons = container.querySelector('#btn-select-commons');
  if (btnSelectCommons) {
    btnSelectCommons.addEventListener('click', () => {
      spirits.forEach(s => {
        if (!partyIds.includes(s.id) && !s.favorite && (s.rarity || 'COMMON').toUpperCase() === 'COMMON') {
          selectedForBulk.add(s.id);
        }
      });
      renderVaultView(container);
    });
  }

  const btnSelectUncommons = container.querySelector('#btn-select-uncommons');
  if (btnSelectUncommons) {
    btnSelectUncommons.addEventListener('click', () => {
      spirits.forEach(s => {
        if (!partyIds.includes(s.id) && !s.favorite && (s.rarity || 'COMMON').toUpperCase() === 'UNCOMMON') {
          selectedForBulk.add(s.id);
        }
      });
      renderVaultView(container);
    });
  }

  const btnClearSelection = container.querySelector('#btn-clear-selection');
  if (btnClearSelection) {
    btnClearSelection.addEventListener('click', () => {
      selectedForBulk.clear();
      renderVaultView(container);
    });
  }

  const btnExecuteBulk = container.querySelector('#btn-execute-bulk');
  if (btnExecuteBulk) {
    btnExecuteBulk.addEventListener('click', () => {
      if (selectedForBulk.size === 0) return;
      if (confirm(`Annul contract with ${selectedForBulk.size} selected Spirits? You will receive +${bulkShardsRefund} Spirit Shards.`)) {
        try {
          const res = gameState.bulkAnnulContracts(Array.from(selectedForBulk));
          alert(`Successfully annulled contracts with ${res.annulledCount} Spirits! Gained +${res.totalShardsGained} Spirit Shards.`);
          selectedForBulk.clear();
          isBulkMode = false;
          renderVaultView(container);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }
}
