import { gameState } from '../../state/gameState.js';
import { SPIRIT_SPECIES, getRarityInfo } from '../../data/spiritsData.js';
import { createSpiritPlaceholderBox } from '../components/pixelBox.js';

let currentFilter = 'ALL';
let searchQuery = '';
let isBulkMode = false;
let selectedForBulk = new Set();

export function renderVaultView(container) {
  const state = gameState.state;
  const spirits = state.spirits;
  const partyIds = state.party;

  // Filter by search query & rarity/favorite
  const query = searchQuery.toLowerCase().trim();
  const filteredSpirits = spirits.filter(s => {
    // Search match
    if (query) {
      const customMatch = (s.customName || '').toLowerCase().includes(query);
      const species = SPIRIT_SPECIES[s.speciesId];
      const speciesMatch = species && species.name.toLowerCase().includes(query);
      if (!customMatch && !speciesMatch) return false;
    }

    // Filter match
    if (currentFilter === 'ALL') return true;
    if (currentFilter === 'FAVORITES') return !!s.favorite;

    const spRarity = (s.rarity || 'COMMON').toUpperCase();
    return spRarity === currentFilter;
  });

  // Sort: Favorited & Equipped first, then highest power
  filteredSpirits.sort((a, b) => {
    const aFav = a.favorite ? 1 : 0;
    const bFav = b.favorite ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;

    const aEq = partyIds.includes(a.id) ? 1 : 0;
    const bEq = partyIds.includes(b.id) ? 1 : 0;
    if (aEq !== bEq) return bEq - aEq;

    return b.power - a.power;
  });

  const filterOptions = [
    { id: 'ALL', label: 'All' },
    { id: 'FAVORITES', label: '⭐ Favorites' },
    { id: 'COMMON', label: 'Common' },
    { id: 'UNCOMMON', label: 'Uncommon' },
    { id: 'RARE', label: 'Rare' },
    { id: 'EPIC', label: 'Epic' },
    { id: 'LEGENDARY', label: 'Legendary' },
    { id: 'MYTHICAL', label: 'Mythical' },
    { id: 'TRANSCENDENT', label: 'Transcendent' }
  ];

  // Bulk stats
  let bulkShardsRefund = 0;
  selectedForBulk.forEach(id => {
    const sp = spirits.find(s => s.id === id);
    if (sp) {
      bulkShardsRefund += 40 * (sp.tier || 1) + Math.floor((sp.level || 1) * 3);
    }
  });

  container.innerHTML = `
    <div class="vault-container">
      
      <!-- Vault Header Banner -->
      <div class="vault-header-stats">
        <div>
          <span>Vault: <strong style="color: #fff;">${spirits.length}</strong> Spirits</span>
          <span style="margin-left: 8px;">Party: <strong style="color: #2ed573;">${partyIds.length} / 5</strong></span>
        </div>

        <button id="btn-toggle-bulk" class="btn-bulk-toggle ${isBulkMode ? 'active' : ''}">
          ${isBulkMode ? 'Done Selecting' : '📦 Bulk Annul'}
        </button>
      </div>

      <!-- Live Search Bar -->
      <div class="vault-search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="vault-search-input" class="vault-search-input" 
               placeholder="Search by name or species..." 
               value="${searchQuery}" />
        ${searchQuery ? `<button id="btn-clear-search" class="btn-clear-search">✕</button>` : ''}
      </div>

      <!-- Bulk Actions Bar (Visible when in Bulk Mode) -->
      ${isBulkMode ? `
        <div class="bulk-action-bar">
          <div class="bulk-select-presets">
            <button id="btn-select-commons" class="btn-preset-sm">Select Unequipped Commons</button>
            <button id="btn-select-uncommons" class="btn-preset-sm">Select Unequipped Uncommons</button>
            <button id="btn-clear-selection" class="btn-preset-sm">Clear</button>
          </div>

          <div class="bulk-confirm-row">
            <span>Selected: <strong>${selectedForBulk.size}</strong> (+${bulkShardsRefund.toLocaleString()} 💎)</span>
            <button id="btn-confirm-bulk-annul" class="btn-bulk-confirm" ${selectedForBulk.size === 0 ? 'disabled' : ''}>
              Annul Selected (${selectedForBulk.size})
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Rarity / Favorite Filter Bar -->
      <div class="vault-filter-bar">
        ${filterOptions.map(f => {
          const isActive = currentFilter === f.id;
          const info = f.id !== 'ALL' && f.id !== 'FAVORITES' ? getRarityInfo(f.id) : null;
          return `
            <button class="filter-btn ${isActive ? 'active' : ''}" 
                    data-filter="${f.id}"
                    style="${isActive && info ? `border-color: ${info.color}; color: ${info.color};` : ''}">
              ${f.label}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Spirit Cards Grid / List -->
      <div class="vault-grid">
        ${filteredSpirits.length === 0 ? `
          <div style="text-align: center; padding: 40px 16px; color: var(--text-muted); font-size: 13px;">
            No spirits found matching the current search & filter.
          </div>
        ` : filteredSpirits.map(spirit => {
          const species = SPIRIT_SPECIES[spirit.speciesId];
          const isEquipped = partyIds.includes(spirit.id);
          const rarity = getRarityInfo(spirit.rarity || (species ? species.baseRarity : 'COMMON'));
          const isSelected = selectedForBulk.has(spirit.id);
          const isHallOfFame = Array.isArray(state.hallOfFame) && state.hallOfFame.includes(spirit.id);

          return `
            <div class="vault-item-card ${isEquipped ? 'in-party' : ''} ${spirit.favorite ? 'is-fav' : ''} ${isSelected ? 'selected-bulk' : ''}">
              
              <!-- Bulk Checkbox Mode -->
              ${isBulkMode ? `
                <div class="bulk-checkbox-col">
                  <input type="checkbox" class="bulk-check" data-id="${spirit.id}" 
                         ${isSelected ? 'checked' : ''} 
                         ${isEquipped || spirit.favorite ? 'disabled title="Equipped or Favorited spirits cannot be bulk annulled"' : ''} />
                </div>
              ` : ''}

              <!-- CSS Placeholder Box -->
              <div style="width: 68px; height: 68px; position: relative;">
                ${createSpiritPlaceholderBox(spirit, { isCapped: spirit.canEvolve })}
                ${isHallOfFame ? '<span class="hall-of-fame-crown" title="Showcased in Hall of Fame">👑</span>' : ''}
              </div>

              <!-- Spirit Info -->
              <div style="display: flex; flex-direction: column; gap: 3px; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="spirit-card-title">${spirit.customName}</span>
                  <button class="btn-rename-spirit" data-id="${spirit.id}" title="Rename Spirit">✏️</button>
                  <button class="btn-fav-spirit ${spirit.favorite ? 'active' : ''}" data-id="${spirit.id}" title="${spirit.favorite ? 'Favorited' : 'Add to Favorites'}">
                    ${spirit.favorite ? '⭐' : '☆'}
                  </button>
                </div>

                <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
                  <span class="rarity-badge-txt" style="color: ${rarity.color}; font-weight: 800;">[${rarity.name.toUpperCase()}]</span>
                  <span style="color: var(--text-muted);">Lv. ${spirit.level}/${species ? species.levelCap : '??'}</span>
                </div>

                <div style="font-size: 12px; font-family: var(--font-mono); font-weight: 800; color: #2ed573;">
                  ⚡ ${spirit.power.toLocaleString()} Power
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${isEquipped ? `
                  <button class="btn-release-action" data-action="unequip" data-id="${spirit.id}">
                    Unequip
                  </button>
                ` : `
                  <button class="btn-equip-action" data-action="equip" data-id="${spirit.id}" ${partyIds.length >= 5 ? 'title="Party is full (5/5)"' : ''}>
                    Equip
                  </button>
                  <button class="btn-release-action" data-action="annul" data-id="${spirit.id}" ${spirit.favorite ? 'disabled title="Favorited spirits cannot be annulled"' : ''}>
                    Annul
                  </button>
                `}
              </div>

            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;

  // Search input binding
  const searchInput = container.querySelector('#vault-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderVaultView(container);
      const reInput = container.querySelector('#vault-search-input');
      if (reInput) {
        reInput.focus();
        reInput.setSelectionRange(searchQuery.length, searchQuery.length);
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

  // Filter buttons
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentFilter = e.currentTarget.getAttribute('data-filter');
      renderVaultView(container);
    });
  });

  // Toggle Bulk Mode
  const btnToggleBulk = container.querySelector('#btn-toggle-bulk');
  if (btnToggleBulk) {
    btnToggleBulk.addEventListener('click', () => {
      isBulkMode = !isBulkMode;
      if (!isBulkMode) selectedForBulk.clear();
      renderVaultView(container);
    });
  }

  // Bulk Checkboxes
  container.querySelectorAll('.bulk-check').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        selectedForBulk.add(id);
      } else {
        selectedForBulk.delete(id);
      }
      renderVaultView(container);
    });
  });

  // Select Unequipped Commons Preset
  const btnSelCommons = container.querySelector('#btn-select-commons');
  if (btnSelCommons) {
    btnSelCommons.addEventListener('click', () => {
      spirits.forEach(s => {
        if (!partyIds.includes(s.id) && !s.favorite && (s.rarity || 'COMMON').toUpperCase() === 'COMMON') {
          selectedForBulk.add(s.id);
        }
      });
      renderVaultView(container);
    });
  }

  // Select Unequipped Uncommons Preset
  const btnSelUncommons = container.querySelector('#btn-select-uncommons');
  if (btnSelUncommons) {
    btnSelUncommons.addEventListener('click', () => {
      spirits.forEach(s => {
        if (!partyIds.includes(s.id) && !s.favorite && (s.rarity || 'COMMON').toUpperCase() === 'UNCOMMON') {
          selectedForBulk.add(s.id);
        }
      });
      renderVaultView(container);
    });
  }

  // Clear Selection
  const btnClearSel = container.querySelector('#btn-clear-selection');
  if (btnClearSel) {
    btnClearSel.addEventListener('click', () => {
      selectedForBulk.clear();
      renderVaultView(container);
    });
  }

  // Confirm Bulk Annul
  const btnConfirmBulk = container.querySelector('#btn-confirm-bulk-annul');
  if (btnConfirmBulk) {
    btnConfirmBulk.addEventListener('click', () => {
      if (selectedForBulk.size === 0) return;
      if (confirm(`Are you sure you want to annul contracts with ${selectedForBulk.size} selected spirits? You will receive ${bulkShardsRefund.toLocaleString()} 💎 Shards.`)) {
        const res = gameState.bulkAnnulSpirits(Array.from(selectedForBulk));
        selectedForBulk.clear();
        isBulkMode = false;
        alert(`Successfully annulled contracts with ${res.count} spirits and gathered ${res.shardsGained.toLocaleString()} 💎 Shards!`);
        renderVaultView(container);
      }
    });
  }

  // Favorite toggle
  container.querySelectorAll('.btn-fav-spirit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      gameState.toggleFavoriteSpirit(id);
      renderVaultView(container);
    });
  });

  // Rename prompt
  container.querySelectorAll('.btn-rename-spirit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const spirit = spirits.find(s => s.id === id);
      if (!spirit) return;
      const newName = prompt(`Enter custom nickname for ${spirit.customName}:`, spirit.customName);
      if (newName && newName.trim()) {
        gameState.renameSpirit(id, newName.trim());
        renderVaultView(container);
      }
    });
  });

  // Equip
  container.querySelectorAll('[data-action="equip"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      try {
        gameState.equipSpirit(id);
        renderVaultView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Unequip
  container.querySelectorAll('[data-action="unequip"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      try {
        gameState.unequipSpirit(id);
        renderVaultView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Annul Single
  container.querySelectorAll('[data-action="annul"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const spirit = spirits.find(s => s.id === id);
      if (!spirit) return;
      const shardsRefund = 40 * (spirit.tier || 1) + Math.floor((spirit.level || 1) * 3);
      if (confirm(`Annul contract with ${spirit.customName}? You will receive ${shardsRefund} 💎 Shards.`)) {
        try {
          gameState.annulContract(id);
          renderVaultView(container);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });
}
