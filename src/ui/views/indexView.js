import { gameState } from '../../state/gameState.js';
import { SPIRIT_SPECIES, RARITIES, getRarityInfo } from '../../data/spiritsData.js';
import { createSpiritPlaceholderBox, createUnknownSpiritPlaceholderBox } from '../components/pixelBox.js';

let activeRarityFilter = 'ALL';

export function renderIndexView(container) {
  const allSpecies = Object.values(SPIRIT_SPECIES);
  const totalCount = allSpecies.length;
  const discoveredCount = allSpecies.filter(sp => gameState.isSpeciesDiscovered(sp.id)).length;
  const progressPercent = Math.round((discoveredCount / totalCount) * 100);

  // Filter species
  const filteredSpecies = allSpecies.filter(sp => {
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
            <span class="index-main-title">📖 Spirit Index</span>
            <span class="index-subtitle">Contractor's Ancient Compendium & Evolution Lineage</span>
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

      <!-- Species Cards List -->
      <div class="index-species-list">
        ${filteredSpecies.map(sp => {
          const isDiscovered = gameState.isSpeciesDiscovered(sp.id);
          const rarity = getRarityInfo(sp.baseRarity);

          if (!isDiscovered) {
            return `
              <div class="index-card unknown-card">
                <div class="index-card-thumb">
                  ${createUnknownSpiritPlaceholderBox(sp, { boxClass: 'index-box' })}
                </div>
                <div class="index-card-info">
                  <div class="index-card-header">
                    <span class="index-species-name unknown-name">??? (Undiscovered)</span>
                    <span class="rarity-pill unknown">UNKNOWN</span>
                  </div>
                  <div class="index-desc unknown-desc">
                    Contract or evolve new Spirits to unlock this species and view its evolution branches.
                  </div>
                </div>
              </div>
            `;
          }

          // Discovered card with full lore and evolution branches
          const evolutions = sp.evolutions || [];

          return `
            <div class="index-card discovered-card rarity-${sp.baseRarity.toLowerCase()}">
              <div class="index-card-top-row">
                <div class="index-card-thumb">
                  ${createSpiritPlaceholderBox(sp, { boxClass: 'index-box' })}
                </div>

                <div class="index-card-info">
                  <div class="index-card-header">
                    <span class="index-species-name">${sp.name}</span>
                    <span class="rarity-pill ${sp.baseRarity.toLowerCase()}" style="color: ${rarity.color}; border-color: ${rarity.border}; background: ${rarity.bg};">
                      ${rarity.name}
                    </span>
                  </div>

                  <div class="index-meta-row">
                    <span>Tier ${sp.tier || 1}</span>
                    <span>Max Lv: ${sp.levelCap}</span>
                    <span>Base PWR: ${sp.basePower}</span>
                  </div>

                  <p class="index-desc">${sp.description || 'A mysterious otherworldly spirit.'}</p>
                </div>
              </div>

              <!-- Evolution Branches (Relocated exclusively from summon to index) -->
              ${evolutions.length > 0 ? `
                <div class="index-evo-section">
                  <div class="index-evo-title">
                    <span>🧬 Evolution Branches (Unlocks at Lv. ${sp.levelCap}):</span>
                  </div>
                  <div class="index-evo-branches">
                    ${evolutions.map(evo => {
                      const targetSp = SPIRIT_SPECIES[evo.targetSpeciesId];
                      const targetRarity = getRarityInfo(evo.rarity || (targetSp ? targetSp.baseRarity : 'COMMON'));
                      const isTargetDiscovered = targetSp && gameState.isSpeciesDiscovered(targetSp.id);

                      return `
                        <div class="index-evo-branch-card ${targetRarity.name.toLowerCase()}">
                          <div class="evo-branch-header">
                            <span class="evo-name" style="color: ${targetRarity.color}; font-weight: 800;">
                              ${isTargetDiscovered ? (targetSp ? targetSp.name : evo.variant) : '??? (Hidden Branch)'}
                            </span>
                            <span class="evo-weight-tag">${evo.weight}% Chance</span>
                          </div>

                          <div class="evo-meta-sub">
                            <span style="color: ${targetRarity.color};">[${targetRarity.name.toUpperCase()}]</span>
                            <span>PWR Multiplier: x${evo.powerMult || 2.0}</span>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : `
                <div class="index-evo-section terminal-branch">
                  <span style="font-size: 11px; color: var(--text-muted);">✨ Apex Evolution Form (Max Tier reached)</span>
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;

  // Attach filter event listeners
  container.querySelectorAll('.index-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeRarityFilter = btn.dataset.tier;
      renderIndexView(container);
    });
  });
}
