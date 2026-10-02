import { createSpiritPlaceholderBox, createUnknownSpiritPlaceholderBox } from './pixelBox.js';
import { SPIRIT_SPECIES, getRarityInfo } from '../../data/spiritsData.js';
import { gameState } from '../../state/gameState.js';

export function showOfflineModal(report, onClaim) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const hours = Math.floor(report.elapsedSeconds / 3600);
  const minutes = Math.floor((report.elapsedSeconds % 3600) / 60);
  const seconds = report.elapsedSeconds % 60;
  const timeStr = `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;

  let levelUpsHtml = '';
  if (report.levelUps.length > 0) {
    levelUpsHtml = `
      <div style="font-size: 12px; color: #70a1ff; font-weight: 700; margin-top: 4px;">
        ⬆️ Level Ups:
        ${report.levelUps.map(l => `<div>• ${l.name}: Lv. ${l.oldLevel} ➔ Lv. ${l.newLevel}</div>`).join('')}
      </div>
    `;
  }

  let evoHtml = '';
  if (report.readyToEvolve.length > 0) {
    evoHtml = `
      <div style="font-size: 12px; color: #ffd700; font-weight: 800; margin-top: 4px; padding: 6px; background: rgba(255,215,0,0.1); border-radius: 6px;">
        ⚡ Ready to Evolve (${report.readyToEvolve.length}):
        ${report.readyToEvolve.map(s => `<div>🌟 ${s.customName} hit Level Cap!</div>`).join('')}
      </div>
    `;
  }

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <h2 class="modal-title">⛩️ Welcome Back, Contractor!</h2>
        
        <div style="text-align: center; font-size: 13px; color: var(--text-muted);">
          While you were away for <strong style="color: #ffffff;">${timeStr}</strong>, your ${report.partyCount} equipped Spirit(s) trained tirelessly in the astral plane:
        </div>

        <div class="offline-gains-box">
          <div class="offline-loot-row">
            <span style="color: var(--text-muted);">AFK Training XP / Spirit:</span>
            <span style="color: #70a1ff;">+${report.xpGainedPerSpirit.toLocaleString()} XP</span>
          </div>

          <div class="offline-loot-row">
            <span style="color: var(--text-muted);">Madness Shards Gathered:</span>
            <span style="color: #00d2ff;">+${report.offlineShards.toLocaleString()} 💎</span>
          </div>

          ${report.offlineEssence > 0 ? `
          <div class="offline-loot-row">
            <span style="color: var(--text-muted);">Soul Essence Extracted:</span>
            <span style="color: #e056fd;">+${report.offlineEssence} 🔮</span>
          </div>` : ''}

          ${report.energyGained > 0 ? `
          <div class="offline-loot-row">
            <span style="color: var(--text-muted);">Madness Energy Restored:</span>
            <span style="color: #f1c40f;">+${report.energyGained} ⚡</span>
          </div>` : ''}

          ${levelUpsHtml}
          ${evoHtml}
        </div>

        <button id="btn-claim-offline" class="modal-btn-confirm">
          Claim Idle Spoils
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-claim-offline')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
    if (onClaim) onClaim();
  });
}

export function showEvolutionCeremonyModal(evoResult, onDone) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const isRare = evoResult.isRare;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card" style="border-color: ${isRare ? '#ffd700' : '#70a1ff'};">
        <h2 class="modal-title">⚡ SPIRIT EVOLUTION!</h2>

        <div class="evolution-display-box">
          <div class="evolution-cards-comparison">
            <div class="evolution-card-frame">
              ${createSpiritPlaceholderBox(evoResult.oldSpecies)}
            </div>

            <div class="evolution-arrow">➔</div>

            <div class="evolution-card-frame">
              ${createSpiritPlaceholderBox(evoResult.spirit, { isCapped: false })}
            </div>
          </div>

          <div class="variant-announcement ${isRare ? 'rare' : 'common'}">
            ${isRare ? '🎉 ' + evoResult.variantName.toUpperCase() + ' (LUCKY ROLL!)' : '✨ ' + evoResult.variantName.toUpperCase()}
          </div>

          <div style="font-size: 16px; font-weight: 800; color: #ffffff;">
            ${evoResult.newSpecies.name}
          </div>

          <p style="font-size: 12px; color: var(--text-muted); max-width: 320px;">
            ${evoResult.newSpecies.description}
          </p>

          <div class="evo-power-surge">
            Power: ${evoResult.oldPower} ➔ ${evoResult.newPower} 
            (+${Math.round((evoResult.newPower / Math.max(1, evoResult.oldPower) - 1) * 100)}%)
          </div>

          <div style="font-size: 11px; color: var(--text-muted);">
            Tier ${evoResult.newSpecies.tier} Level Cap unlocked: Lv. ${evoResult.newSpecies.levelCap}
          </div>
        </div>

        <button id="btn-close-evo" class="modal-btn-confirm" style="background: ${isRare ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : 'linear-gradient(135deg, #2ed573, #26af5f)'}">
          Acknowledge Ascension
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-evo')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
    if (onDone) onDone();
  });
}

export function showSummonRevealModal(spirits, onDone) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const count = spirits.length;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <h2 class="modal-title">📜 Spirit Contract Complete!</h2>
        
        <div style="font-size: 12px; color: var(--text-muted); text-align: center;">
          ${count === 1 ? '1 Spirit summoned from the astral realm:' : `${count} Spirits bound by ancient contract:`}
        </div>

        <div style="display: grid; grid-template-columns: ${count > 1 ? 'repeat(auto-fill, minmax(80px, 1fr))' : '1fr'}; gap: 10px; max-height: 50vh; overflow-y: auto; padding: 4px;">
          ${spirits.map(s => `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="width: 76px; height: 76px;">
                ${createSpiritPlaceholderBox(s)}
              </div>
              <div style="font-size: 11px; font-weight: 800; text-align: center; color: #fff;">
                ${s.customName}
              </div>
              <div style="font-size: 10px; font-family: var(--font-mono); color: #2ed573;">
                ⚡ ${s.power} PWR
              </div>
            </div>
          `).join('')}
        </div>

        <button id="btn-close-summon" class="modal-btn-confirm">
          Collect to Vault
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-summon')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
    if (onDone) onDone();
  });
}

/**
 * Interactive Visual Hall of Fame Picker Modal
 * Eliminates browser prompt() completely.
 * Features tabs for Highest Power, Favorites, All Vault, search bar, and interactive cards.
 */
export function showHallOfFamePickerModal(onSelect) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const state = gameState.state;
  const currentHofIds = state.hallOfFame || [];
  const availableSpirits = state.spirits.filter(s => !currentHofIds.includes(s.id));

  let currentTab = 'POWER'; // 'POWER', 'FAVORITES', 'ALL'
  let filterQuery = '';

  function renderModalContent() {
    let filtered = [...availableSpirits];

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      filtered = filtered.filter(s => {
        const nameMatch = (s.customName || '').toLowerCase().includes(q);
        const sp = SPIRIT_SPECIES[s.speciesId];
        const spMatch = sp && sp.name.toLowerCase().includes(q);
        return nameMatch || spMatch;
      });
    }

    if (currentTab === 'POWER') {
      filtered.sort((a, b) => b.power - a.power);
    } else if (currentTab === 'FAVORITES') {
      filtered = filtered.filter(s => !!s.favorite);
      filtered.sort((a, b) => b.power - a.power);
    } else {
      // ALL
      filtered.sort((a, b) => b.power - a.power);
    }

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card hof-picker-modal-card">
          <div class="hof-modal-header">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 18px;">🏛️</span>
              <span style="font-size: 15px; font-weight: 900; color: #ffd152;">Assign Spirit to Hall of Fame</span>
            </div>
            <button id="btn-close-hof-modal" class="modal-close-icon-btn" title="Close">✕</button>
          </div>

          <div style="font-size: 11px; color: var(--text-muted);">
            Select an elite spirit from your collection to showcase on this pedestal.
          </div>

          <!-- Tab Selection & Search -->
          <div class="hof-picker-controls">
            <div class="hof-picker-tabs">
              <button class="hof-tab-btn ${currentTab === 'POWER' ? 'active' : ''}" data-tab="POWER">
                ⚡ Highest Power
              </button>
              <button class="hof-tab-btn ${currentTab === 'FAVORITES' ? 'active' : ''}" data-tab="FAVORITES">
                ⭐ Favorites
              </button>
              <button class="hof-tab-btn ${currentTab === 'ALL' ? 'active' : ''}" data-tab="ALL">
                🎒 All Vault
              </button>
            </div>

            <div class="hof-search-input-wrap">
              <input type="text" id="hof-search-input" class="vault-search-input" placeholder="Search spirit name..." value="${filterQuery}" />
              ${filterQuery ? `<button id="btn-clear-hof-search" class="btn-clear-search">✕</button>` : ''}
            </div>
          </div>

          <!-- Spirits List -->
          <div class="hof-picker-list modal-spirit-picker-scroll">
            ${filtered.length === 0 ? `
              <div class="hof-picker-empty">
                ${availableSpirits.length === 0 
                  ? 'All available spirits are already showcased or your vault is empty.' 
                  : 'No spirits found matching your filter.'}
              </div>
            ` : filtered.map(spirit => {
              const species = SPIRIT_SPECIES[spirit.speciesId];
              const rarity = getRarityInfo(spirit.rarity || (species ? species.baseRarity : 'COMMON'));

              return `
                <div class="hof-candidate-card rarity-${rarity.name.toLowerCase()}">
                  <div style="width: 50px; height: 50px; flex-shrink: 0;">
                    ${createSpiritPlaceholderBox(spirit)}
                  </div>

                  <div class="hof-candidate-details">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span class="hof-candidate-name">${spirit.customName}</span>
                      ${spirit.favorite ? '<span style="font-size: 11px; color: #ffd152;">⭐</span>' : ''}
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px; font-size: 10px;">
                      <span style="color: ${rarity.color}; font-weight: 800;">[${rarity.name.toUpperCase()}]</span>
                      <span style="color: var(--text-muted);">Lv. ${spirit.level}</span>
                    </div>

                    <div style="font-size: 11px; font-family: var(--font-mono); color: #2ed573; font-weight: 800;">
                      ⚡ ${spirit.power.toLocaleString()} Power
                    </div>
                  </div>

                  <button class="btn-assign-hof-spirit" data-id="${spirit.id}">
                    Assign
                  </button>
                </div>
              `;
            }).join('')}
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
            <button id="btn-cancel-hof" class="zone-toggle-btn" style="min-height: 40px; padding: 4px 14px;">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;

    // Attach listeners
    document.getElementById('btn-close-hof-modal')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
    });
    document.getElementById('btn-cancel-hof')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
    });

    modalRoot.querySelectorAll('.hof-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        renderModalContent();
      });
    });

    const searchInput = document.getElementById('hof-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterQuery = e.target.value;
        renderModalContent();
        const reInput = document.getElementById('hof-search-input');
        if (reInput) {
          reInput.focus();
          reInput.setSelectionRange(filterQuery.length, filterQuery.length);
        }
      });
    }

    document.getElementById('btn-clear-hof-search')?.addEventListener('click', () => {
      filterQuery = '';
      renderModalContent();
    });

    modalRoot.querySelectorAll('.btn-assign-hof-spirit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        modalRoot.innerHTML = '';
        if (onSelect) onSelect(id);
      });
    });
  }

  renderModalContent();
}

/**
 * Terraria Bestiary-style Inspect Modal for a specific spirit species
 */
export function showBestiaryInspectModal(species, isDiscovered, bestiaryNum) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const rarity = getRarityInfo(species.baseRarity);
  const numStr = `#${String(bestiaryNum).padStart(3, '0')}`;

  if (!isDiscovered) {
    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card bestiary-inspect-modal">
          <div class="bestiary-inspect-header">
            <div class="bestiary-header-title">
              <span class="bestiary-id-tag">${numStr}</span>
              <span style="font-size: 16px; font-weight: 900; color: var(--text-muted);">??? (Undiscovered)</span>
            </div>
            <button id="btn-close-bestiary" class="modal-close-icon-btn">✕</button>
          </div>

          <div class="bestiary-inspect-body">
            <div class="bestiary-sprite-showcase">
              <div style="width: 80px; height: 80px;">
                ${createUnknownSpiritPlaceholderBox(species)}
              </div>
            </div>

            <div class="bestiary-unknown-notice">
              <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4; text-align: center;">
                This spirit has not yet been discovered in your compendium.
              </p>
              <p style="font-size: 11px; color: var(--text-moon); margin-top: 6px; text-align: center;">
                Contract spirits through summoning or evolve your existing spirits to uncover its identity and evolution branches!
              </p>
            </div>
          </div>

          <button id="btn-done-bestiary" class="modal-btn-confirm" style="margin-top: 8px;">
            Return to Bestiary
          </button>
        </div>
      </div>
    `;
  } else {
    const evolutions = species.evolutions || [];

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card bestiary-inspect-modal rarity-${species.baseRarity.toLowerCase()}">
          <div class="bestiary-inspect-header">
            <div class="bestiary-header-title">
              <span class="bestiary-id-tag">${numStr}</span>
              <span style="font-size: 16px; font-weight: 900; color: #ffffff;">${species.name}</span>
            </div>
            <button id="btn-close-bestiary" class="modal-close-icon-btn">✕</button>
          </div>

          <div class="bestiary-inspect-body">
            <div class="bestiary-sprite-showcase">
              <div style="width: 84px; height: 84px;">
                ${createSpiritPlaceholderBox(species)}
              </div>
              
              <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                <span class="rarity-pill ${species.baseRarity.toLowerCase()}" style="color: ${rarity.color}; border-color: ${rarity.border}; background: ${rarity.bg};">
                  ${rarity.name.toUpperCase()}
                </span>
                <div style="display: flex; gap: 8px; font-size: 11px; color: var(--text-moon); font-weight: 700; margin-top: 2px;">
                  <span>Tier ${species.tier || 1}</span>
                  <span>Max Lv: ${species.levelCap}</span>
                  <span>Base PWR: ${species.basePower}</span>
                </div>
              </div>
            </div>

            <div class="bestiary-lore-box">
              <p style="font-size: 12px; color: var(--text-main); line-height: 1.4;">
                ${species.description || 'A mysterious otherworldly spirit bound by sacred contract.'}
              </p>
            </div>

            <!-- Evolution Lineage -->
            <div class="bestiary-evo-lineage">
              <div class="bestiary-evo-heading">
                <span>🧬 Evolution Lineage (Unlocks at Lv. ${species.levelCap}):</span>
              </div>

              ${evolutions.length > 0 ? `
                <div class="bestiary-evo-grid">
                  ${evolutions.map(evo => {
                    const targetSp = SPIRIT_SPECIES[evo.targetSpeciesId];
                    const targetRarity = getRarityInfo(evo.rarity || (targetSp ? targetSp.baseRarity : 'COMMON'));
                    const isTargetDiscovered = targetSp && gameState.isSpeciesDiscovered(targetSp.id);

                    return `
                      <div class="bestiary-evo-card">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <span style="font-weight: 800; color: ${targetRarity.color}; font-size: 12px;">
                            ${isTargetDiscovered ? (targetSp ? targetSp.name : evo.variant) : '??? (Hidden Branch)'}
                          </span>
                          <span class="evo-weight-tag">${evo.weight}% Chance</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                          <span style="color: ${targetRarity.color}; font-weight: 700;">[${targetRarity.name.toUpperCase()}]</span>
                          <span>PWR Multiplier: x${evo.powerMult || 2.0}</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : `
                <div class="bestiary-terminal-branch">
                  <span>✨ Apex Evolution Form (Max Tier reached in this lineage)</span>
                </div>
              `}
            </div>
          </div>

          <button id="btn-done-bestiary" class="modal-btn-confirm" style="margin-top: 8px;">
            Return to Bestiary
          </button>
        </div>
      </div>
    `;
  }

  document.getElementById('btn-close-bestiary')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
  });
  document.getElementById('btn-done-bestiary')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
  });
}
