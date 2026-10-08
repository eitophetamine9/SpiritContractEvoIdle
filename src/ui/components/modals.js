import { createSpiritPlaceholderBox, createUnknownSpiritPlaceholderBox } from './pixelBox.js';
import { SPIRIT_SPECIES, getRarityInfo, getXpRequiredForLevel, ASCENSION_CONFIG } from '../../data/spiritsData.js';
import { gameState } from '../../state/gameState.js';
import { GREEK_GOD_SETS, RELIC_SLOT_TYPES } from '../../data/equipmentData.js';

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

/**
 * Modal to inspect and equip weapons or relics for a spirit
 */
export function showEquipmentSlotModal({ spiritId, slotType, onUpdate }) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  function renderModal() {
    const spirit = gameState.state.spirits.find(s => s.id === spiritId);
    if (!spirit) {
      modalRoot.innerHTML = '';
      return;
    }

    const { weapon, relics } = gameState.getSpiritEquippedItems(spirit);
    const currentItem = slotType === 'weapon' ? weapon : (relics ? relics[slotType] : null);
    const slotInfo = slotType === 'weapon' 
      ? { id: 'weapon', name: 'Weapon', icon: '⚔️', desc: 'Main weapon providing raw ATK Power & offensive multipliers' }
      : (RELIC_SLOT_TYPES.find(s => s.id === slotType) || { id: slotType, name: slotType, icon: '✨', desc: 'Relic slot' });

    const allEquipment = (gameState.state.inventory && gameState.state.inventory.equipment) || [];
    const availableItems = allEquipment.filter(item => {
      if (slotType === 'weapon') return item.type === 'weapon';
      return item.type === 'relic' && item.slotTypeId === slotType;
    });

    const isCurrentEquipped = !!currentItem;
    const isRelic = currentItem && currentItem.type === 'relic';
    const stars = isRelic ? (currentItem.stars || 3) : 3;
    const starColors = { 3: '#b2bec3', 4: '#00cec9', 5: '#ffd32a', 6: '#ff4757' };
    const starColor = starColors[stars] || '#ffd32a';
    const nextLevel = isRelic ? ((currentItem.level || 0) + 1) : 0;
    const shardCost = isRelic ? Math.round(50 * nextLevel * (stars * 0.4)) : 0;
    const isMilestone = isRelic && (nextLevel % 3 === 0);
    const essenceCost = isMilestone ? Math.round(stars * 2 + nextLevel * 0.5) : 0;
    const canEnhance = isRelic && (currentItem.level || 0) < 15;
    const canAscend = isRelic && stars === 5 && (currentItem.level || 0) >= 15;

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card modal-card-equipment">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 22px;">${slotInfo.icon}</span>
              <div>
                <h3 class="modal-title" style="margin: 0; font-size: 15px;">Equip ${slotInfo.name}</h3>
                <span style="font-size: 11px; color: var(--text-muted);">${spirit.customName} • Lv. ${spirit.level}</span>
              </div>
            </div>
            <button id="btn-close-equip-modal" class="modal-btn-close">✕</button>
          </div>

          <div style="font-size: 11px; color: var(--text-muted); margin: 6px 0 10px 0; line-height: 1.3;">
            ${slotInfo.desc}
          </div>

          <!-- Currently Equipped Item Section -->
          <div class="equip-section-title">CURRENTLY EQUIPPED</div>
          ${isCurrentEquipped ? `
            <div class="equipped-item-card" style="border-color: ${currentItem.color || '#4cd137'};">
              <div class="equip-card-left" style="width: 100%;">
                <span class="equip-icon-large">${currentItem.icon}</span>
                <div class="equip-card-info" style="flex: 1;">
                  <div class="equip-item-name" style="color: ${currentItem.color || '#fff'};">
                    <span>${currentItem.name}</span>
                    ${isRelic ? `
                      <span style="font-size: 11px; font-weight: 900; color: ${starColor}; letter-spacing: 1px;">
                        ${'★'.repeat(stars)}
                      </span>
                      <span style="font-size: 10px; font-weight: 800; color: #ffd32a; background: rgba(0,0,0,0.5); padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(255,211,42,0.4);">
                        +${currentItem.level || 0}/15
                      </span>
                    ` : `
                      <span class="equip-rarity-pill" style="border-color: ${currentItem.color || '#fff'}; color: ${currentItem.color || '#fff'};">${currentItem.rarity}</span>
                    `}
                  </div>
                  <div class="equip-item-stat">
                    ${currentItem.type === 'weapon' ? `⚡ +${currentItem.atkPower} ATK Power • +${currentItem.critRate}% Crit` : `⚡ +${currentItem.mainStatValue} ${currentItem.mainStatName}`}
                  </div>
                  ${currentItem.setId && GREEK_GOD_SETS[currentItem.setId] ? `
                    <div class="equip-set-tag" style="color: ${GREEK_GOD_SETS[currentItem.setId].accentColor};">
                      ${GREEK_GOD_SETS[currentItem.setId].icon} ${GREEK_GOD_SETS[currentItem.setId].name} (2pc/4pc Set)
                    </div>
                  ` : ''}
                  ${isRelic && currentItem.substats && currentItem.substats.length > 0 ? `
                    <div class="equip-card-substats-row" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                      ${currentItem.substats.map(sub => `
                        <span style="font-size: 9px; font-weight: 700; color: #a4b0be; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; padding: 1px 4px;">
                          ${sub.name} <strong style="color: #2ed573;">+${sub.value}${sub.isPercent ? '%' : ''}</strong>
                        </span>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Action Controls Row for Equipped Item -->
              <div class="equip-card-actions-row" style="display: flex; gap: 6px; align-items: center; justify-content: flex-end; margin-top: 6px; flex-wrap: wrap; width: 100%;">
                ${isRelic ? `
                  ${canEnhance ? `
                    <button class="btn-modal-enhance-slot" id="btn-modal-enhance" data-relic-uid="${currentItem.uid}">
                      <span>⚡ Enhance (+${nextLevel})</span>
                      <span class="enhance-cost-sub">${shardCost} 💎${essenceCost > 0 ? ` • ${essenceCost} ✨` : ''}</span>
                    </button>
                  ` : `
                    <div class="badge-max-enhance">
                      ✓ +15 MAX
                    </div>
                  `}
                  ${canAscend ? `
                    <button class="btn-modal-ascend-slot" id="btn-modal-ascend" data-relic-uid="${currentItem.uid}">
                      <span>👑 Ascend to 6★</span>
                      <span class="enhance-cost-sub">100 ✨ • 10 🔮</span>
                    </button>
                  ` : ''}
                  <button class="btn-modal-inspect-slot" id="btn-modal-inspect-item" data-relic-uid="${currentItem.uid}" title="View Details, Lore & Reassign">
                    🔍 Details
                  </button>
                ` : ''}
                <button class="btn-unequip-slot" id="btn-modal-unequip" data-slot="${slotType}">
                  Unequip
                </button>
              </div>
            </div>
          ` : `
            <div class="empty-slot-banner">
              <span>(No ${slotInfo.name} equipped on ${spirit.customName})</span>
            </div>
          `}

          <!-- Available Inventory Items -->
          <div class="equip-section-title" style="margin-top: 14px;">
            AVAILABLE IN BAG (${availableItems.length})
          </div>

          <div class="equip-inventory-scroll">
            ${availableItems.length === 0 ? `
              <div class="empty-bag-notice">
                <p>No other ${slotInfo.name} items in your equipment inventory.</p>
                <button id="btn-modal-goto-trials" class="btn-goto-dungeon-action">
                  🏛️ Challenge Pantheon Trials
                </button>
              </div>
            ` : `
              <div class="equip-items-grid">
                ${availableItems.map(item => {
                  const isEquippedToThis = currentItem && currentItem.uid === item.uid;
                  const equippedToOther = item.equippedToSpiritId && item.equippedToSpiritId !== spirit.id
                    ? gameState.state.spirits.find(s => s.id === item.equippedToSpiritId)
                    : null;
                  const godSet = item.setId ? GREEK_GOD_SETS[item.setId] : null;

                  return `
                    <div class="inventory-equip-card ${isEquippedToThis ? 'item-active' : ''}" style="border-color: ${item.color || 'var(--border-color)'};">
                      <div class="equip-card-left">
                        <span class="equip-icon-box">${item.icon}</span>
                        <div class="equip-card-info">
                          <div class="equip-item-name" style="color: ${item.color || '#fff'};">
                            ${item.name}
                            ${item.type === 'relic' ? `<span style="font-size: 10px; font-weight: 800; color: #ffd32a;">+${item.level || 0}</span>` : ''}
                            <span class="equip-rarity-pill" style="border-color: ${item.color}; color: ${item.color}; font-size: 9px;">${item.rarity}</span>
                          </div>
                          <div class="equip-item-stat">
                            ${item.type === 'weapon' ? `⚡ +${item.atkPower} ATK Power • +${item.critRate}% Crit` : `⚡ +${item.mainStatValue} ${item.mainStatName}`}
                          </div>
                          ${godSet ? `
                            <div class="equip-set-tag" style="color: ${godSet.accentColor}; font-size: 10px;">
                              ${godSet.icon} ${godSet.name}
                            </div>
                          ` : ''}
                          ${equippedToOther ? `
                            <div style="font-size: 10px; color: #f39c12; font-style: italic;">
                              Equipped to ${equippedToOther.customName} (will transfer)
                            </div>
                          ` : ''}
                        </div>
                      </div>

                      <div class="equip-card-actions">
                        ${isEquippedToThis ? `
                          <span class="badge-equipped-tag">EQUIPPED</span>
                        ` : `
                          <button class="btn-action-equip" data-equip-uid="${item.uid}">
                            Equip
                          </button>
                          ${item.type === 'relic' ? `
                            <button class="btn-action-upgrade" data-inspect-uid="${item.uid}" title="Upgrade Artifact">
                              ⚡
                            </button>
                          ` : ''}
                          ${!item.equippedToSpiritId ? `
                            <button class="btn-action-dismantle" data-dismantle-uid="${item.uid}" title="Dismantle for Spirit Shards">
                              ♻️
                            </button>
                          ` : ''}
                        `}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <button id="btn-modal-done" class="modal-btn-confirm" style="margin-top: 12px;">
            Done
          </button>
        </div>
      </div>
    `;

    // Bind event listeners
    document.getElementById('btn-close-equip-modal')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      if (onUpdate) onUpdate();
    });

    document.getElementById('btn-modal-done')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      if (onUpdate) onUpdate();
    });

    document.getElementById('btn-modal-unequip')?.addEventListener('click', () => {
      try {
        gameState.unequipItem(spiritId, slotType);
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    modalRoot.querySelector('#btn-modal-enhance')?.addEventListener('click', () => {
      try {
        const res = gameState.enhanceRelic(currentItem.uid);
        audioManager.playSfx('levelup');
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    modalRoot.querySelector('#btn-modal-ascend')?.addEventListener('click', () => {
      try {
        const res = gameState.ascendRelic(currentItem.uid);
        audioManager.playSfx('evolution');
        alert(`🌟 Ascended ${currentItem.name} to 6★! Unlocked 5th Substat slot!`);
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    modalRoot.querySelector('#btn-modal-inspect-item')?.addEventListener('click', () => {
      showItemInspectModal({
        item: currentItem,
        onUpdate: () => {
          renderModal();
          if (onUpdate) onUpdate();
        }
      });
    });

    modalRoot.querySelectorAll('[data-inspect-uid]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.currentTarget.getAttribute('data-inspect-uid');
        const itemToInspect = allEquipment.find(i => i.uid === uid);
        if (itemToInspect) {
          showItemInspectModal({
            item: itemToInspect,
            onUpdate: () => {
              renderModal();
              if (onUpdate) onUpdate();
            }
          });
        }
      });
    });

    modalRoot.querySelectorAll('[data-equip-uid]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.currentTarget.getAttribute('data-equip-uid');
        try {
          gameState.equipItem(spiritId, uid);
          renderModal();
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      });
    });

    modalRoot.querySelectorAll('[data-dismantle-uid]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.currentTarget.getAttribute('data-dismantle-uid');
        if (confirm('Dismantle this equipment item for Spirit Shards?')) {
          try {
            const res = gameState.dismantleEquipment(uid);
            alert(`Dismantled equipment! Gained +${res.shardsGained} Spirit Shards.`);
            renderModal();
            if (onUpdate) onUpdate();
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });

    document.getElementById('btn-modal-goto-trials')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      document.querySelector('[data-tab="trials"]')?.click();
    });
  }

  renderModal();
}

/**
 * Universal Item Inspection & Equip Modal for Vault
 */
/**
 * Universal Item Inspection, Enhance & Equip Modal for Vault
 */
export function showItemInspectModal({ item, onUpdate }) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot || !item) return;

  function renderModal() {
    const currentItem = (gameState.state.inventory?.equipment || []).find(e => e.uid === item.uid) || item;
    const spirits = gameState.state.spirits || [];
    const partyIds = gameState.state.party || [];
    const partySpirits = spirits.filter(s => partyIds.includes(s.id));
    const equippedSpirit = spirits.find(s => s.id === currentItem.equippedToSpiritId);

    const isRelic = currentItem.type === 'relic';
    const stars = currentItem.stars || 3;
    const godSet = isRelic ? GREEK_GOD_SETS[currentItem.setId] : null;

    const starColors = {
      3: '#b2bec3',
      4: '#00cec9',
      5: '#ffd32a',
      6: '#ff4757'
    };
    const starLabel = '★'.repeat(stars);
    const starColor = starColors[stars] || '#ffd32a';

    const nextLevel = (currentItem.level || 0) + 1;
    const shardCost = Math.round(50 * nextLevel * (stars * 0.4));
    const isMilestone = nextLevel % 3 === 0;
    const essenceCost = isMilestone ? Math.round(stars * 2 + nextLevel * 0.5) : 0;
    const canEnhance = isRelic && (currentItem.level || 0) < 15;
    const canAscend = isRelic && stars === 5 && (currentItem.level || 0) >= 15;

    const dismantleEssences = isRelic ? (stars === 3 ? 5 : stars === 4 ? 15 : stars === 5 ? 40 : 100) : 0;
    const dismantleShards = Math.round(20 * (currentItem.level || 1) + stars * 10);

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card modal-card-equipment" style="max-width: 450px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 26px;">${currentItem.icon}</span>
              <div>
                <h3 class="modal-title" style="margin: 0; font-size: 16px; color: ${currentItem.color || '#ffd32a'};">
                  ${currentItem.name}
                </h3>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                  <span style="font-size: 13px; font-weight: 900; color: ${starColor}; letter-spacing: 1px;">
                    ${starLabel}
                  </span>
                  <span style="font-size: 11px; color: var(--text-muted);">
                    • +${currentItem.level || 0}/15 ${isRelic ? `• ${currentItem.slotName || 'Relic'}` : '• Weapon'}
                  </span>
                </div>
              </div>
            </div>
            <button id="btn-close-item-inspect" class="modal-close-btn">&times;</button>
          </div>

          <div class="modal-body" style="padding: 14px 16px;">
            
            <!-- Primary Stats Section -->
            <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 12px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.08);">
              <div style="font-size: 11px; font-weight: 800; color: #ffd32a; margin-bottom: 6px;">PRIMARY ATTRIBUTES</div>
              ${isRelic ? `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; font-weight: 700; color: #fff;">${currentItem.mainStatName}</span>
                  <span style="font-size: 15px; font-weight: 900; color: #2ed573;">+${currentItem.mainStatValue}</span>
                </div>
              ` : `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; font-weight: 700; color: #fff;">ATK Power</span>
                  <span style="font-size: 15px; font-weight: 900; color: #ff4757;">+${currentItem.atkPower}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                  Crit Rate: +${currentItem.critRate || 5}% • Ult Amp: +${currentItem.ultAmp || 8}%
                </div>
              `}
            </div>

            <!-- Substats Section (For Relics) -->
            ${isRelic && currentItem.substats && currentItem.substats.length > 0 ? `
              <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="font-size: 11px; font-weight: 800; color: #70a1ff; margin-bottom: 6px;">
                  SUBSTATS (${currentItem.substats.length}/${stars === 6 ? 5 : stars === 5 ? 4 : stars === 4 ? 4 : 3})
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  ${currentItem.substats.map(sub => `
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 3px 6px; background: rgba(255,255,255,0.04); border-radius: 4px;">
                      <span style="color: #dfe4ea;">• ${sub.name}</span>
                      <span style="font-weight: 800; color: #2ed573;">+${sub.value}${sub.isPercent ? '%' : ''}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Set Bonus Details if Relic -->
            ${godSet ? `
              <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px; margin-bottom: 10px; border-left: 3px solid ${godSet.color};">
                <div style="font-size: 11px; font-weight: 800; color: ${godSet.accentColor}; margin-bottom: 4px;">
                  ${godSet.name} (${godSet.god})
                </div>
                <div style="font-size: 11px; color: #ccc; margin-bottom: 3px;">
                  <strong>2-pc:</strong> ${godSet.bonus2pc.description}
                </div>
                <div style="font-size: 11px; color: #ccc;">
                  <strong>4-pc:</strong> ${godSet.bonus4pc.description}
                </div>
              </div>
            ` : ''}

            <!-- Relic Enhancement & Ascension Buttons -->
            ${isRelic ? `
              <div style="display: flex; gap: 6px; margin-bottom: 12px;">
                ${canEnhance ? `
                  <button id="btn-enhance-relic" class="btn-drawer-action" style="flex: 1; background: linear-gradient(135deg, #f39c12, #d35400); color: #fff; font-weight: 800; min-height: 42px;">
                    ⚡ Enhance (+${nextLevel})<br>
                    <span style="font-size: 10px; opacity: 0.9;">${shardCost} 💎${essenceCost > 0 ? ` • ${essenceCost} ✨` : ''}</span>
                  </button>
                ` : `
                  <div style="flex: 1; text-align: center; font-size: 11px; font-weight: 800; color: #2ecc71; padding: 10px; background: rgba(46,204,113,0.1); border-radius: 6px;">
                    ✓ Max Enhancement (+15)
                  </div>
                `}

                ${canAscend ? `
                  <button id="btn-ascend-relic" class="btn-drawer-action" style="flex: 1; background: linear-gradient(135deg, #e74c3c, #8e44ad); color: #fff; font-weight: 900; min-height: 42px;">
                    👑 Ascend to 6★<br>
                    <span style="font-size: 10px; opacity: 0.9;">100 ✨ • 10 🔮</span>
                  </button>
                ` : ''}
              </div>
            ` : ''}

            <!-- Equipped Status & Reassign to Spirit -->
            <div style="margin-bottom: 12px;">
              <div style="font-size: 12px; font-weight: 800; color: #fff; margin-bottom: 6px;">
                ${equippedSpirit ? `Equipped To: <span style="color: #2ecc71;">${equippedSpirit.customName}</span>` : 'Status: <span style="color: var(--text-muted);">In Vault (Unequipped)</span>'}
              </div>

              <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">Quick Equip to Active Party Spirit:</div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${partySpirits.map(sp => {
                  const isEquippedHere = equippedSpirit && equippedSpirit.id === sp.id;
                  return `
                    <button class="btn-preset-sm btn-equip-to-spirit ${isEquippedHere ? 'active' : ''}" data-target-spirit="${sp.id}" style="${isEquippedHere ? 'background: #27ae60; color: #fff;' : ''}">
                      ${isEquippedHere ? '✓ ' : ''}${sp.customName}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Actions: Unequip / Dismantle -->
            <div style="display: flex; gap: 8px; margin-top: 14px;">
              ${equippedSpirit ? `
                <button id="btn-unequip-item" class="btn-drawer-action" style="flex: 1; background: rgba(241, 196, 15, 0.2); border-color: #f1c40f; color: #ffd32a;">
                  Unequip
                </button>
              ` : `
                <button id="btn-dismantle-item" class="btn-drawer-action" style="flex: 1; background: rgba(231, 76, 60, 0.2); border-color: #e74c3c; color: #ff7675;">
                  Dismantle (+${dismantleShards} 💎${dismantleEssences > 0 ? ` +${dismantleEssences} ✨` : ''})
                </button>
              `}
              <button id="btn-close-item-done" class="btn-drawer-action" style="flex: 1; background: #34495e; color: #fff;">
                Done
              </button>
            </div>

          </div>
        </div>
      </div>
    `;

    const closeModal = () => {
      modalRoot.innerHTML = '';
      if (onUpdate) onUpdate();
    };

    modalRoot.querySelector('#btn-close-item-inspect')?.addEventListener('click', closeModal);
    modalRoot.querySelector('#btn-close-item-done')?.addEventListener('click', closeModal);

    // Enhance Relic
    modalRoot.querySelector('#btn-enhance-relic')?.addEventListener('click', () => {
      try {
        const res = gameState.enhanceRelic(currentItem.uid);
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    // Ascend Relic
    modalRoot.querySelector('#btn-ascend-relic')?.addEventListener('click', () => {
      try {
        const res = gameState.ascendRelic(currentItem.uid);
        alert(`🌟 Ascended ${currentItem.name} to 6★! Unlocked 5th Substat slot!`);
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    // Equip to spirit buttons
    modalRoot.querySelectorAll('.btn-equip-to-spirit').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSpiritId = btn.getAttribute('data-target-spirit');
        try {
          gameState.equipItem(targetSpiritId, currentItem.uid);
          closeModal();
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      });
    });

    // Unequip button
    modalRoot.querySelector('#btn-unequip-item')?.addEventListener('click', () => {
      if (equippedSpirit) {
        try {
          gameState.unequipItem(equippedSpirit.id, isRelic ? currentItem.slotTypeId : 'weapon');
          closeModal();
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    // Dismantle button
    modalRoot.querySelector('#btn-dismantle-item')?.addEventListener('click', () => {
      if (confirm(`Dismantle ${currentItem.name}?\nYou will gain +${dismantleShards} Spirit Shards${dismantleEssences > 0 ? ` and +${dismantleEssences} Essences of the Gods` : ''}.`)) {
        try {
          const res = gameState.dismantleEquipment(currentItem.uid);
          alert(`Dismantled ${currentItem.name}!\nGained +${res.shardsGained} Shards${res.essencesOfTheGodsGained ? ` and +${res.essencesOfTheGodsGained} Essences of the Gods` : ''}.`);
          closeModal();
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }

  renderModal();
}

/**
 * Universal Spirit Management Modal for Vault
 */
export function showSpiritModal(spirit, onUpdate) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot || !spirit) return;

  function render() {
    const currentSpirit = gameState.state.spirits.find(s => s.id === spirit.id);
    if (!currentSpirit) {
      modalRoot.innerHTML = '';
      if (onUpdate) onUpdate();
      return;
    }

    const species = SPIRIT_SPECIES[currentSpirit.speciesId];
    const rarity = getRarityInfo(currentSpirit.rarity || (species ? species.baseRarity : 'COMMON'));
    const partyIds = gameState.state.party || [];
    const isInParty = partyIds.includes(currentSpirit.id);
    const reqXp = getXpRequiredForLevel(currentSpirit.level);
    const isCapped = currentSpirit.level >= (species ? species.levelCap : 99);
    const xpPercent = isCapped ? 100 : Math.min(100, Math.floor((currentSpirit.xp / reqXp) * 100));
    const canEvolve = isCapped && species && species.evolutions && species.evolutions.length > 0;
    const refundShards = 40 * (currentSpirit.tier || 1) + Math.floor((currentSpirit.level || 1) * 3);

    const currentAscLevel = currentSpirit.ascensionLevel || 0;
    const eligibleDups = gameState.getEligibleAscensionDuplicates(currentSpirit.id);
    const nextAscTier = currentAscLevel + 1;
    const ascConfig = ASCENSION_CONFIG.find(c => c.tier === nextAscTier);
    const userAstralEssence = gameState.state.resources.soulEssence || 0;
    const canAscend = currentAscLevel < 7 && !!ascConfig && 
      eligibleDups.length >= ascConfig.duplicates && 
      userAstralEssence >= ascConfig.astralCost;

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card modal-card-equipment" style="max-width: 440px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">⛩️</span>
              <div>
                <h3 class="modal-title" style="margin: 0; font-size: 16px; color: ${rarity.color};">
                  ${currentSpirit.customName} ${currentSpirit.favorite ? '⭐' : ''}
                </h3>
                <span style="font-size: 11px; color: var(--text-muted);">
                  ${species ? species.name : 'Unknown Species'} • Tier ${currentSpirit.tier || 1}
                </span>
              </div>
            </div>
            <button id="btn-close-spirit-modal" class="modal-close-btn">&times;</button>
          </div>

          <div class="modal-body" style="padding: 14px 16px;">
            <!-- Spirit Visual & Basic Stats -->
            <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 14px;">
              <div style="width: 72px; height: 72px; flex-shrink: 0;">
                ${createSpiritPlaceholderBox(currentSpirit)}
              </div>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                  <span class="rarity-pill ${rarity.name.toLowerCase()}" style="color: ${rarity.color}; border-color: ${rarity.border}; background: ${rarity.bg};">
                    ${rarity.name.toUpperCase()}
                  </span>
                  ${isInParty ? '<span style="font-size: 10px; font-weight: 800; background: #27ae60; color: #fff; padding: 2px 6px; border-radius: 4px;">IN PARTY</span>' : '<span style="font-size: 10px; color: var(--text-muted); background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px;">VAULT RESERVES</span>'}
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #fff;">
                  Level ${currentSpirit.level} / ${species ? species.levelCap : 99}
                </div>
                <div style="font-size: 12px; font-weight: 800; color: #2ed573; margin-top: 2px;">
                  ⚡ ${currentSpirit.power.toLocaleString()} Power
                </div>
                <div style="font-size: 11px; font-weight: 900; color: #ffd32a; margin-top: 3px;">
                  ${'★'.repeat(currentAscLevel)}${'☆'.repeat(7 - currentAscLevel)} (★${currentAscLevel}/7)
                </div>
              </div>
            </div>

            <!-- XP Progress Bar -->
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">
                <span>Training Experience</span>
                <span>${isCapped ? 'MAX LEVEL' : `${Math.floor(currentSpirit.xp)} / ${reqXp} XP (${xpPercent}%)`}</span>
              </div>
              <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
                <div style="width: ${xpPercent}%; height: 100%; background: linear-gradient(90deg, #70a1ff, #00d2ff); border-radius: 4px; transition: width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Ascension (★1 to ★7) Section -->
            <div style="margin-bottom: 14px; padding: 10px; background: rgba(147, 51, 234, 0.12); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 800; color: #e9d5ff; display: flex; align-items: center; gap: 4px;">
                  <span>⭐</span> Spirit Ascension
                </span>
                <span style="font-size: 11px; font-weight: 900; color: #ffd32a;">
                  ${currentAscLevel >= 7 ? '★7 (MAX)' : `★${currentAscLevel} ➔ ★${nextAscTier}`}
                </span>
              </div>

              ${currentAscLevel >= 7 ? `
                <div style="font-size: 11px; color: #d8b4fe; line-height: 1.4;">
                  🏆 <strong>Ascended Divinity Active:</strong> +84% all stats, +10% Crit Rate, +25% Crit Damage!
                </div>
              ` : `
                <div style="font-size: 10px; color: #cbd5e1; margin-bottom: 6px; line-height: 1.4;">
                  Perk: <span style="color: #c084fc; font-weight: 700;">${ascConfig.perk}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--text-muted); margin-bottom: 8px;">
                  <span>Duplicates: <strong style="color: ${eligibleDups.length >= ascConfig.duplicates ? '#4cd137' : '#ff7675'}; font-size: 11px;">${eligibleDups.length}/${ascConfig.duplicates} available</strong></span>
                  <span>Astral: <strong style="color: ${userAstralEssence >= ascConfig.astralCost ? '#e056fd' : '#ff7675'}; font-size: 11px;">${userAstralEssence}/${ascConfig.astralCost} 🔮</strong></span>
                </div>
                <button id="btn-modal-ascend-spirit" style="width: 100%; min-height: 38px; background: ${canAscend ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'rgba(255,255,255,0.08)'}; color: ${canAscend ? '#fff' : '#64748b'}; font-weight: 800; font-size: 12px; border: 1px solid ${canAscend ? '#c084fc' : 'rgba(255,255,255,0.1)'}; border-radius: 8px; cursor: ${canAscend ? 'pointer' : 'not-allowed'}; box-shadow: ${canAscend ? '0 0 12px rgba(168,85,247,0.4)' : 'none'};" ${canAscend ? '' : 'disabled'}>
                  ${canAscend ? `⭐ Ascend to ★${nextAscTier} (+12% Stats)` : (eligibleDups.length < ascConfig.duplicates ? `Need ${ascConfig.duplicates - eligibleDups.length} more duplicate copy(ies)` : `Need ${ascConfig.astralCost} 🔮 Astral Essence`)}
                </button>
              `}
            </div>

            <!-- Rename Nickname Input -->
            <div style="display: flex; gap: 6px; margin-bottom: 14px;">
              <input type="text" id="input-spirit-rename" value="${currentSpirit.customName}" maxlength="24" style="flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; padding: 6px 10px; font-size: 12px;" />
              <button id="btn-save-rename" class="btn-preset-sm" style="background: #2f3542; color: #fff; padding: 0 12px; font-size: 11px; font-weight: 700; min-height: 32px;">
                Rename
              </button>
            </div>

            <!-- Evolve Button (if ready) -->
            ${canEvolve ? `
              <div style="margin-bottom: 14px; text-align: center;">
                <button id="btn-modal-evolve" style="width: 100%; min-height: 44px; background: linear-gradient(135deg, #f1c40f, #e67e22); color: #000; font-weight: 900; font-size: 13px; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 0 15px rgba(241,196,15,0.5);">
                  ⚡ ASCEND & EVOLVE SPIRIT ⚡
                </button>
              </div>
            ` : ''}

            <!-- Quick Action Grid: Equip / Unequip, Favorite -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              ${isInParty ? `
                <button id="btn-toggle-party-equip" class="btn-drawer-action" style="background: rgba(241, 196, 15, 0.2); border-color: #f1c40f; color: #ffd32a; min-height: 44px;">
                  Remove from Party
                </button>
              ` : `
                <button id="btn-toggle-party-equip" class="btn-drawer-action" style="background: rgba(46, 204, 113, 0.2); border-color: #2ecc71; color: #2ecc71; min-height: 44px;">
                  Equip to Party
                </button>
              `}

              <button id="btn-toggle-favorite-spirit" class="btn-drawer-action" style="background: rgba(255, 215, 0, 0.15); border-color: #ffd700; color: #ffd700; min-height: 44px;">
                ${currentSpirit.favorite ? '★ Unfavorite' : '☆ Favorite'}
              </button>
            </div>

            <!-- Annul Contract (Release) Button -->
            <div>
              <button id="btn-modal-annul-spirit" class="btn-drawer-action" style="width: 100%; min-height: 40px; background: rgba(231, 76, 60, 0.15); border-color: #e74c3c; color: #ff7675; font-size: 11px;">
                Annul Contract (+${refundShards} Spirit Shards)
              </button>
            </div>

          </div>
        </div>
      </div>
    `;

    // Event handlers
    const closeModal = () => {
      modalRoot.innerHTML = '';
      if (onUpdate) onUpdate();
    };

    modalRoot.querySelector('#btn-close-spirit-modal')?.addEventListener('click', closeModal);

    // Save rename
    modalRoot.querySelector('#btn-save-rename')?.addEventListener('click', () => {
      const input = modalRoot.querySelector('#input-spirit-rename');
      if (input && input.value) {
        gameState.renameSpirit(currentSpirit.id, input.value);
        render();
      }
    });

    // Ascend Spirit
    modalRoot.querySelector('#btn-modal-ascend-spirit')?.addEventListener('click', () => {
      if (!canAscend) return;
      const dupIdsToSacrifice = eligibleDups.slice(0, ascConfig.duplicates).map(d => d.id);
      if (confirm(`Sacrifice ${ascConfig.duplicates} duplicate copy(ies) of ${currentSpirit.customName} and ${ascConfig.astralCost} 🔮 Astral Essence to ascend to ★${nextAscTier}?`)) {
        try {
          const res = gameState.ascendSpirit(currentSpirit.id, dupIdsToSacrifice);
          alert(`🎉 Ascension Complete!\n${res.spirit.customName} attained ★${res.newTier} Ascension!\nBonus: +${res.bonusPercent}% Stats (${res.perk})`);
          render();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    // Toggle Party Equip
    modalRoot.querySelector('#btn-toggle-party-equip')?.addEventListener('click', () => {
      try {
        if (isInParty) {
          gameState.unequipSpirit(currentSpirit.id);
        } else {
          gameState.equipSpirit(currentSpirit.id);
        }
        render();
      } catch (err) {
        alert(err.message);
      }
    });

    // Toggle Favorite
    modalRoot.querySelector('#btn-toggle-favorite-spirit')?.addEventListener('click', () => {
      gameState.toggleFavoriteSpirit(currentSpirit.id);
      render();
    });

    // Annul Spirit
    modalRoot.querySelector('#btn-modal-annul-spirit')?.addEventListener('click', () => {
      if (isInParty) {
        alert('Cannot annul contract with an active party Spirit. Unequip it first.');
        return;
      }
      if (currentSpirit.favorite) {
        alert('This Spirit is marked as Favorite. Remove favorite status first.');
        return;
      }
      if (confirm(`Annul contract with ${currentSpirit.customName}? You will receive +${refundShards} Spirit Shards.`)) {
        try {
          const shardsGained = gameState.annulContract(currentSpirit.id);
          alert(`Annulled contract with ${currentSpirit.customName}! Gained +${shardsGained} Spirit Shards.`);
          closeModal();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    // Evolve Spirit
    modalRoot.querySelector('#btn-modal-evolve')?.addEventListener('click', () => {
      try {
        const evoResult = gameState.evolveSpirit(currentSpirit.id);
        showEvolutionCeremonyModal(evoResult, () => {
          render();
        });
      } catch (err) {
        alert(err.message);
      }
    });
  }

  render();
}



