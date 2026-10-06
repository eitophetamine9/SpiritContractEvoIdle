import { gameState } from '../../state/gameState.js';
import { SPIRIT_SPECIES, getRarityInfo } from '../../data/spiritsData.js';
import { createSpiritPlaceholderBox, createUnknownSpiritPlaceholderBox } from '../components/pixelBox.js';
import { showBestiaryInspectModal } from '../components/modals.js';

let activeRarityFilter = 'ALL';

export function renderIndexView(container) {
  const allSpecies = Object.values(SPIRIT_SPECIES);
  const totalCount = allSpecies.length;
  const discoveredCount = allSpecies.filter(sp => gameState.isSpeciesDiscovered(sp.id)).length;
  const progressPercent = Math.round((discoveredCount / totalCount) * 100);

  // Map each species to its deterministic Bestiary ID number (1-based index)
  const speciesWithIndex = allSpecies.map((sp, idx) => ({
    ...sp,
    bestiaryNum: idx + 1
  }));

  // Filter species by rarity
  const filteredSpecies = speciesWithIndex.filter(sp => {
    if (activeRarityFilter === 'ALL') return true;
    return sp.baseRarity === activeRarityFilter;
  });

  const rarityTiers = ['ALL', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHICAL', 'TRANSCENDENT'];

  container.innerHTML = `
    <div class="index-container">
      
      <!-- Compendium Header & Discovery Progress -->
      <div class="index-header-banner">
        <div class="index-header-top">
          <div class="index-title-group">
            <span class="index-main-title">📖 Spirit Bestiary</span>
            <span class="index-subtitle">Contractor's Ancient Bestiary & Evolution Lineage</span>
          </div>

          <div class="index-score-badge">
            <span class="score-num">${discoveredCount}/${totalCount}</span>
            <span class="score-lbl">Discovered</span>
          </div>
        </div>

        <div class="index-progress-track">
          <div class="index-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <div class="index-progress-text">
          <span>Completion: ${progressPercent}%</span>
          <span>${totalCount - discoveredCount} Unknown Spirits Awaiting Discovery</span>
        </div>
      </div>

      <!-- Rarity Filter Chips -->
      <div class="index-filter-scroll">
        ${rarityTiers.map(tier => {
          const info = tier === 'ALL' ? { color: '#ffffff' } : getRarityInfo(tier);
          const isActive = activeRarityFilter === tier;
          return `
            <button class="index-filter-btn ${isActive ? 'active' : ''}" 
                    data-tier="${tier}"
                    style="${isActive && tier !== 'ALL' ? `border-color: ${info.color}; color: ${info.color};` : ''}">
              ${tier}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Terraria-Style Compact Bestiary Grid -->
      <div class="bestiary-grid">
        ${filteredSpecies.map(sp => {
          const isDiscovered = gameState.isSpeciesDiscovered(sp.id);
          const rarity = getRarityInfo(sp.baseRarity);
          const numStr = `#${String(sp.bestiaryNum).padStart(3, '0')}`;

          if (!isDiscovered) {
            return `
              <div class="bestiary-tile locked" data-species-id="${sp.id}" data-num="${sp.bestiaryNum}" title="Undiscovered Spirit">
                <span class="bestiary-tile-num">${numStr}</span>
                <div class="bestiary-tile-art">
                  <div class="bestiary-silhouette-box">?</div>
                </div>
                <span class="bestiary-tile-name">???</span>
              </div>
            `;
          }

          return `
            <div class="bestiary-tile discovered rarity-${sp.baseRarity.toLowerCase()}" 
                 data-species-id="${sp.id}" 
                 data-num="${sp.bestiaryNum}" 
                 title="${sp.name} [${rarity.name}]">
              <span class="bestiary-tile-num">${numStr}</span>
              <div class="bestiary-tile-art">
                ${createSpiritPlaceholderBox(sp, { boxClass: 'bestiary-mini-box' })}
              </div>
              <span class="bestiary-tile-name">${sp.name}</span>
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;

  // Enable mouse wheel horizontal scrolling on filter slider
  container.querySelectorAll('.index-filter-scroll').forEach(slider => {
    slider.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        slider.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  });

  // Attach filter event listeners
  container.querySelectorAll('.index-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeRarityFilter = btn.dataset.tier;
      renderIndexView(container);
    });
  });

  // Attach Bestiary tile click listeners to open inspect modal
  container.querySelectorAll('.bestiary-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const speciesId = tile.dataset.speciesId;
      const bestiaryNum = parseInt(tile.dataset.num, 10);
      const sp = SPIRIT_SPECIES[speciesId];
      if (sp) {
        const isDiscovered = gameState.isSpeciesDiscovered(speciesId);
        showBestiaryInspectModal(sp, isDiscovered, bestiaryNum);
      }
    });
  });
}
