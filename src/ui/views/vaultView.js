import { gameState } from '../../state/gameState.js';
import { SPIRIT_SPECIES } from '../../data/spiritsData.js';
import { createSpiritPlaceholderBox } from '../components/pixelBox.js';

let currentFilter = 'ALL';

export function renderVaultView(container) {
  const state = gameState.state;
  const spirits = state.spirits;
  const partyIds = state.party;

  const filteredSpirits = spirits.filter(s => {
    if (currentFilter === 'ALL') return true;
    const species = SPIRIT_SPECIES[s.speciesId];
    return species && species.element === currentFilter;
  });

  // Sort: Equipped first, then highest power
  filteredSpirits.sort((a, b) => {
    const aEq = partyIds.includes(a.id) ? 1 : 0;
    const bEq = partyIds.includes(b.id) ? 1 : 0;
    if (aEq !== bEq) return bEq - aEq;
    return b.power - a.power;
  });

  const filterElements = [
    { id: 'ALL', label: 'All' },
    { id: 'FIRE', label: '🔥 Fire' },
    { id: 'WATER', label: '💧 Water' },
    { id: 'EARTH', label: '🌿 Earth' },
    { id: 'WIND', label: '🌪️ Wind' },
    { id: 'DARK', label: '🔮 Void' },
    { id: 'LIGHT', label: '✨ Solar' }
  ];

  container.innerHTML = `
    <div class="vault-container">
      
      <div class="vault-header-stats">
        <span>Vault Storage: <strong style="color: #fff;">${spirits.length}</strong> Spirits</span>
        <span>Active Party: <strong style="color: #2ed573;">${partyIds.length} / 5</strong></span>
      </div>

      <!-- Element Filter Bar (Touch-friendly horizontal scroll) -->
      <div class="vault-filter-bar">
        ${filterElements.map(f => `
          <button class="filter-btn ${currentFilter === f.id ? 'active' : ''}" data-filter="${f.id}">
            ${f.label}
          </button>
        `).join('')}
      </div>

      <!-- Spirit Cards Grid / List -->
      <div class="vault-grid">
        ${filteredSpirits.length === 0 ? `
          <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;">
            No spirits found in this category. Contract more at the Astral Altar!
          </div>
        ` : filteredSpirits.map(spirit => {
          const species = SPIRIT_SPECIES[spirit.speciesId];
          const isEquipped = partyIds.includes(spirit.id);

          return `
            <div class="vault-item-card ${isEquipped ? 'in-party' : ''}">
              
              <!-- Bright CSS Placeholder Box -->
              <div style="width: 68px; height: 68px;">
                ${createSpiritPlaceholderBox(spirit, { isCapped: spirit.canEvolve })}
              </div>

              <!-- Spirit Info -->
              <div style="display: flex; flex-direction: column; gap: 3px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 14px; font-weight: 800; color: #fff;">${spirit.customName}</span>
                  ${isEquipped ? '<span style="font-size: 10px; background: #2ed573; color: #000; font-weight: 800; padding: 1px 6px; border-radius: 4px;">EQUIPPED</span>' : ''}
                </div>

                <div style="font-size: 11px; color: var(--text-muted);">
                  Tier ${species ? species.tier : 1} • Lv. ${spirit.level} / ${species ? species.levelCap : '??'}
                </div>

                <div style="font-size: 12px; font-family: var(--font-mono); font-weight: 700; color: #2ed573;">
                  ⚡ ${spirit.power.toLocaleString()} Power
                </div>
              </div>

              <!-- Action Buttons (min 44px touch) -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${isEquipped ? `
                  <button class="btn-release-action" data-action="unequip" data-id="${spirit.id}" style="color: #ff9ff3; border-color: #ff9ff3;">
                    Unequip
                  </button>
                ` : `
                  <button class="btn-equip-action" data-action="equip" data-id="${spirit.id}" ${partyIds.length >= 5 ? 'title="Party is full (5/5)"' : ''}>
                    Equip (Party)
                  </button>
                  <button class="btn-release-action" data-action="release" data-id="${spirit.id}">
                    Dispel
                  </button>
                `}
              </div>

            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;

  // Attach filter buttons
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentFilter = e.currentTarget.getAttribute('data-filter');
      renderVaultView(container);
    });
  });

  // Attach Equip buttons
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

  // Attach Unequip buttons
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

  // Attach Dispel/Release buttons
  container.querySelectorAll('[data-action="release"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('Dispel this Spirit to recover Spirit Shards?')) {
        const shards = gameState.releaseSpirit(id);
        renderVaultView(container);
      }
    });
  });
}
