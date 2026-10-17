import { createSpiritPlaceholderBox, createUnknownSpiritPlaceholderBox } from '../components/pixelBox.js';
import { SPIRIT_SPECIES, getRarityInfo, getRoleInfo } from '../../data/spiritsData.js';
import { gameState } from '../../state/gameState.js';
import { safePlaySfx } from '../../audio/audioManager.js';
import { closeActiveModal } from './modalBase.js';

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
    const roleInfo = getRoleInfo(species.role || 'MAIN_DPS');
    const isClaimed = (gameState.state.bestiaryRewards?.claimedSpecies || []).includes(species.id);

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
                <div style="display: flex; gap: 6px; align-items: center;">
                  <span class="rarity-pill ${species.baseRarity.toLowerCase()}" style="color: ${rarity.color}; border-color: ${rarity.border}; background: ${rarity.bg};">
                    ${rarity.name.toUpperCase()}
                  </span>
                  <span style="font-size: 10px; font-weight: 800; color: ${roleInfo.color}; background: ${roleInfo.bg}; border: 1px solid ${roleInfo.border}; padding: 1px 6px; border-radius: 4px;" title="${roleInfo.name}: ${roleInfo.desc}">
                    ${roleInfo.icon} ${roleInfo.name}
                  </span>
                </div>
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

            <!-- Bestiary Discovery Bounty Chamber -->
            <div class="bestiary-discovery-bounty-box" style="margin-top: 10px; padding: 10px 12px; background: rgba(15, 23, 42, 0.7); border: 1px solid ${isClaimed ? 'rgba(74, 222, 128, 0.3)' : 'rgba(251, 191, 36, 0.4)'}; border-radius: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 11px; font-weight: 800; color: #f3e8ff; display: flex; align-items: center; gap: 4px;">
                  <span>🎁</span> Discovery Bounty
                </span>
                <span style="font-size: 11px; font-weight: 800; color: #38bdf8;">
                  +50 💎 Spirit Shards
                </span>
              </div>
              <p style="font-size: 10px; color: var(--text-muted); line-height: 1.35; margin: 0 0 8px 0;">
                Documenting unique spirit species into your compendium awards sacred Spirit Shards.
              </p>
              ${isClaimed ? `
                <div style="width: 100%; min-height: 32px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #4ade80; background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 8px;">
                  ✓ Discovery Bounty Claimed (+50 💎)
                </div>
              ` : `
                <button id="btn-claim-bestiary-bounty" class="modal-btn-confirm" style="width: 100%; min-height: 34px; font-size: 11px; font-weight: 800; border-radius: 8px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border: 1px solid #fbbf24; cursor: pointer; box-shadow: 0 0 10px rgba(245, 158, 11, 0.35);">
                  ✨ Claim Discovery Bounty (+50 💎 Spirit Shards)
                </button>
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
  document.getElementById('btn-claim-bestiary-bounty')?.addEventListener('click', () => {
    try {
      const res = gameState.claimBestiarySpeciesReward(species.id);
      safePlaySfx('summon');
      alert(`🎉 Discovery Bounty Claimed!\nReceived +${res.shardsGranted} Spirit Shards!`);
      showBestiaryInspectModal(species, isDiscovered, bestiaryNum);
    } catch (err) {
      alert(err.message);
    }
  });
}

/**
 * Modal to inspect and equip weapons or relics for a spirit
 */
