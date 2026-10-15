import { createSpiritPlaceholderBox } from '../components/pixelBox.js';
import {
  SPIRIT_SPECIES,
  getRarityInfo,
  getXpRequiredForLevel,
  ASCENSION_CONFIG,
  REBIRTH_CONFIG,
  getRoleInfo,
  getScalingProfile
} from '../../data/spiritsData.js';
import { gameState } from '../../state/gameState.js';
import { safePlaySfx } from '../../audio/audioManager.js';
import { closeActiveModal } from './modalBase.js';

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
    const roleKey = currentSpirit.role || (species ? species.role : 'MAIN_DPS') || 'MAIN_DPS';
    const roleInfo = getRoleInfo(roleKey);
    const combatStats = gameState.getSpiritCombatStats(currentSpirit);
    const slotId = gameState.getSpiritFormationSlot(currentSpirit.id);

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
                  <span style="font-size: 10px; font-weight: 800; color: ${roleInfo.color}; background: ${roleInfo.bg}; border: 1px solid ${roleInfo.border}; padding: 1px 6px; border-radius: 4px;" title="${roleInfo.name}: ${roleInfo.desc}">
                    ${roleInfo.icon} ${roleInfo.name}
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

            <!-- Tactical Role & Combat Attributes Card (Phase 5) -->
            <div style="margin-bottom: 14px; padding: 10px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 11px; font-weight: 800; color: ${roleInfo.color};">
                    ${roleInfo.icon} ${roleInfo.name}
                  </span>
                  <span style="font-size: 10px; color: var(--text-muted);">
                    ${slotId ? `Grid [${slotId.toUpperCase()}] • ${combatStats ? combatStats.columnPerk || 'Neutral' : ''}` : 'No Formation Slot'}
                  </span>
                </div>
                <span style="font-size: 10px; color: var(--text-moon); font-weight: 700;">
                  Aggro: ${combatStats ? combatStats.effectiveThreat : 50} (${combatStats ? combatStats.threatMultiplier : 1.0}x)
                </span>
              </div>

              <div style="font-size: 10px; color: #cbd5e1; margin-bottom: 8px; line-height: 1.3;">
                ${roleInfo.desc}
              </div>

              <!-- Stat Strip Grid -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-size: 11px; font-weight: 800;">
                <div style="padding: 4px 6px; background: rgba(0,0,0,0.3); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                  <div style="font-size: 9px; color: var(--text-muted);">HIT POINTS</div>
                  <div style="color: #ff6b81;">❤️ ${combatStats ? combatStats.maxHp.toLocaleString() : currentSpirit.maxHp}</div>
                </div>
                <div style="padding: 4px 6px; background: rgba(0,0,0,0.3); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                  <div style="font-size: 9px; color: var(--text-muted);">ARMOR / DEF</div>
                  <div style="color: #70a1ff;">🛡️ ${combatStats ? combatStats.def : 20}</div>
                </div>
                <div style="padding: 4px 6px; background: rgba(0,0,0,0.3); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                  <div style="font-size: 9px; color: var(--text-muted);">ATK POWER</div>
                  <div style="color: #ffd32a;">⚔️ ${combatStats ? combatStats.atk : currentSpirit.power}</div>
                </div>
                <div style="padding: 4px 6px; background: rgba(0,0,0,0.3); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                  <div style="font-size: 9px; color: var(--text-muted);">CRITICAL RATE</div>
                  <div style="color: #ff9ff3;">🎯 ${combatStats ? combatStats.critRate : 5}%</div>
                </div>
                <div style="padding: 4px 6px; background: rgba(0,0,0,0.3); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                  <div style="font-size: 9px; color: var(--text-muted);">CRIT DAMAGE</div>
                  <div style="color: #feca57;">💥 ${combatStats ? combatStats.critDmg : 150}%</div>
                </div>
                <div style="padding: 4px 6px; background: rgba(0,0,0,0.3); border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                  <div style="font-size: 9px; color: var(--text-muted);">HEAL AMPLIFY</div>
                  <div style="color: #2ed573;">💚 ${combatStats ? Math.round(combatStats.healAmp * 100) : 100}%</div>
                </div>
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

/**
 * Interactive Modal for Divine Relic Scripture Inscription
 * Allows player to select 2 guaranteed substats and roll remaining with milestone redistribution
 */

export function showDetailedAttributesModal(spirit) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot || !spirit) return;

  const species = SPIRIT_SPECIES[spirit.speciesId] || {};
  const rarityInfo = getRarityInfo(spirit.rarity);
  const roleInfo = getRoleInfo(spirit.speciesId);
  const scaling = getScalingProfile(spirit.speciesId);
  const combatStats = gameState.getSpiritCombatStats(spirit);
  const attrs = combatStats?.attributes || {};
  const rebirthTier = spirit.rebirthLevel || 0;

  // Compute damage mitigation
  const defVal = attrs.def?.total || combatStats.def || 10;
  const mitigationPct = ((defVal / (defVal + 350)) * 100).toFixed(1);

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-box detailed-stats-modal" style="max-width: 620px; width: 95%; max-height: 90vh; overflow-y: auto;">
        
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-icon">📜</span>
            <div>
              <h3 style="margin: 0; font-family: var(--font-fantasy); color: #ffd32a;">
                ${spirit.customName || species.name} — COMBAT ATTRIBUTE DOSSIER
              </h3>
              <span style="font-size: 11px; color: var(--text-muted);">
                ${rarityInfo.name} • ${species.element} • ${roleInfo.name} • Tier ${rebirthTier > 0 ? `⭐${rebirthTier}` : '⭐0'}
              </span>
            </div>
          </div>
          <button class="modal-close-btn" id="btn-close-detailed-stats">✕</button>
        </div>

        <div class="detailed-stats-body" style="display: flex; flex-direction: column; gap: 14px; padding: 12px 0;">
          
          <!-- Category 1: Offensive Parameters -->
          <div class="detailed-stat-category" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,71,87,0.25); border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 11.5px; font-weight: 800; color: #ff4757; margin-bottom: 8px;">
              ⚔️ OFFENSIVE CAPABILITIES & CRITICAL RATINGS
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 6px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Total Attack Potency:</span>
                <strong style="color: #ff6b81;">${(attrs.atk?.total || combatStats.atk).toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Base Attack:</span>
                <span>${(attrs.atk?.base || 0).toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Gear & Buff Bonus:</span>
                <span style="color: #2ed573;">+${(attrs.atk?.bonus || 0).toLocaleString()} (+${attrs.atk?.percent || 0}%)</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Critical Strike Rate:</span>
                <strong style="color: #ffd32a;">${(attrs.critRate?.total || combatStats.critRate || 5).toFixed(1)}%</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Critical Strike Damage:</span>
                <strong style="color: #ffa502;">${(attrs.critDmg?.total || combatStats.critDmg || 150).toFixed(1)}%</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Ultimate Amplification:</span>
                <strong style="color: #e056fd;">+${(attrs.ultAmp?.total || combatStats.ultAmp || 0).toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          <!-- Category 2: Defensive & Survival Parameters -->
          <div class="detailed-stat-category" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(30,144,255,0.25); border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 11.5px; font-weight: 800; color: #1e90ff; margin-bottom: 8px;">
              🛡️ DEFENSIVE MITIGATION & VITALITY
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 6px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Maximum Vitality (HP):</span>
                <strong style="color: #2ed573;">${(attrs.hp?.total || combatStats.maxHp).toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Base Vitality:</span>
                <span>${(attrs.hp?.base || 0).toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Armor / Defense (DEF):</span>
                <strong style="color: #70a1ff;">${(attrs.def?.total || combatStats.def).toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Damage Mitigation:</span>
                <strong style="color: #2ed573;">${mitigationPct}% Reduced Damage</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Gear Vitality Bonus:</span>
                <span style="color: #2ed573;">+${(attrs.hp?.bonus || 0).toLocaleString()} (+${attrs.hp?.percent || 0}%)</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Gear Armor Bonus:</span>
                <span style="color: #2ed573;">+${(attrs.def?.bonus || 0).toLocaleString()} (+${attrs.def?.percent || 0}%)</span>
              </div>
            </div>
          </div>

          <!-- Category 3: Energy, Cadence & Rebirth -->
          <div class="detailed-stat-category" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(241,196,15,0.25); border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 11.5px; font-weight: 800; color: #ffd32a; margin-bottom: 8px;">
              ⚡ ENERGY REPLENISHMENT & REBIRTH MULTIPLIERS
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 6px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Mana Replenish Cadence:</span>
                <strong>${(attrs.manaReplenish?.total || combatStats.manaReplenish || 100).toFixed(1)}% (10 MP/s)</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Combat Starting MP:</span>
                <span>${rebirthTier >= 1 ? '+20 MP (Rebirth I)' : '0 MP'}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Current Rebirth Tier:</span>
                <strong style="color: #ffd32a;">Tier ${rebirthTier > 0 ? `⭐${rebirthTier}` : '⭐0'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Rebirth All-Stat Multiplier:</span>
                <strong style="color: #ffd32a;">+${rebirthTier > 0 ? (REBIRTH_CONFIG[rebirthTier - 1]?.bonusPercent || 0) : 0}%</strong>
              </div>
            </div>
          </div>

          <!-- Category 4: Dynamic Archetype Scaling Profile -->
          <div class="detailed-stat-category" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(168,85,247,0.25); border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 11.5px; font-weight: 800; color: #a855f7; margin-bottom: 8px;">
              🔮 54-SPIRIT DYNAMIC SCALING ARCHETYPE
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
              <div><strong>Archetype Title:</strong> ${scaling.title} (${roleInfo.name})</div>
              <div><strong>Primary Scaling Stat:</strong> % ${scaling.primaryStat.toUpperCase()}</div>
              <div><strong>Secondary Scaling Stat:</strong> % ${scaling.secondaryStat.toUpperCase()}${scaling.canCrit ? ' (Can Critically Strike)' : ''}</div>
              <div><strong>Scaling Formula:</strong> ${scaling.formulaDesc}</div>
              <div><strong>Tactical Footprint:</strong> Base Threat ${roleInfo.baseThreat} • Optimal ${roleInfo.optimalColumnLabel}</div>
            </div>
          </div>

        </div>

        <div style="display: flex; justify-content: flex-end; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08);">
          <button class="btn-sanctum-action" id="btn-close-detailed-stats-footer" style="max-width: 120px;">
            Close
          </button>
        </div>

      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-close-detailed-stats')?.addEventListener('click', closeActiveModal);
  modalRoot.querySelector('#btn-close-detailed-stats-footer')?.addEventListener('click', closeActiveModal);
}






