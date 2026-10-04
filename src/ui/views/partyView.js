import { gameState } from '../../state/gameState.js';
import { SPIRIT_SPECIES, getXpRequiredForLevel, getRarityInfo } from '../../data/spiritsData.js';
import { RELIC_SLOT_TYPES } from '../../data/equipmentData.js';
import { createSpiritPlaceholderBox } from '../components/pixelBox.js';
import { showEvolutionCeremonyModal, showEquipmentSlotModal } from '../components/modals.js';

export function renderPartyView(container) {
  const partySpirits = gameState.getPartySpirits();
  const xpRate = gameState.getXpGainRate();
  const totalPower = gameState.getTotalPartyPower();
  const bagCount = (gameState.state.inventory && gameState.state.inventory.equipment && gameState.state.inventory.equipment.length) || 0;

  container.innerHTML = `
    <div class="party-container">
      
      <!-- AFK Training Status Banner -->
      <div class="afk-training-banner">
        <div class="afk-banner-left">
          <div class="afk-title">
            <span>⛩️ AFK Training Chamber</span>
          </div>
          <div class="afk-subtitle">
            Equipped Spirits continuously gain XP (even while offline)
          </div>
        </div>

        <div class="afk-rate-pill">
          +${xpRate.toFixed(1)} XP/s
        </div>
      </div>

      <!-- Party Summary Bar -->
      <div class="party-summary-strip">
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="color: var(--text-muted); font-size: 13px;">Equipped: <strong style="color: #ffffff;">${partySpirits.length} / 5</strong></span>
          <span class="bag-count-pill" title="Total weapons & relics in your equipment inventory">🎒 ${bagCount} Relics/Weapons</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span style="font-size: 13px; font-weight: 800; color: #2ed573;">Party PWR: ⚡ ${totalPower.toLocaleString()}</span>
          <button id="btn-party-trials-link" class="trials-link-pill" title="Jump to Pantheon Trials">
            🏛️ Trials
          </button>
        </div>
      </div>

      <!-- 5 Party Slots List -->
      <div class="party-slots-list">
        ${Array.from({ length: 5 }).map((_, index) => {
          const spirit = partySpirits[index];
          if (!spirit) {
            return `
              <div class="empty-party-card">
                <span>+ Empty Slot ${index + 1} (Equip from Vault)</span>
              </div>
            `;
          }

          const species = SPIRIT_SPECIES[spirit.speciesId];
          const rarity = getRarityInfo(spirit.rarity || (species ? species.baseRarity : 'COMMON'));
          const reqXp = getXpRequiredForLevel(spirit.level);
          const isCapped = spirit.level >= (species ? species.levelCap : 99);
          const xpPercent = isCapped ? 100 : Math.min(100, Math.floor((spirit.xp / reqXp) * 100));

          const { weapon, relics } = gameState.getSpiritEquippedItems(spirit);
          const activeSets = gameState.getSpiritActiveSetBonuses(spirit);
          const totalSpiritPower = gameState.getSpiritTotalPower(spirit);
          const equipBonusPower = totalSpiritPower - spirit.power;

          return `
            <div class="party-card-expanded ${spirit.canEvolve ? 'evolvable' : ''}" id="party-card-${spirit.id}">
              
              <!-- Upper Row: Spirit Portrait, Info, Actions -->
              <div class="party-card-main-row">
                <!-- Bright CSS Placeholder Box -->
                <div class="spirit-thumb-box">
                  ${createSpiritPlaceholderBox(spirit, { isCapped: spirit.canEvolve })}
                </div>

                <!-- Spirit Details & Progress -->
                <div class="party-card-info">
                  <div class="party-card-name-row">
                    <span class="party-card-name">${spirit.customName}</span>
                    <span class="party-card-level-badge">
                      Lv. ${spirit.level}/${species ? species.levelCap : '??'} ${isCapped ? '[CAP]' : ''}
                    </span>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="color: ${rarity.color}; font-weight: 800; font-size: 11px;">[${rarity.name.toUpperCase()}]</span>
                    <span class="party-card-power" title="Base: ${spirit.power.toLocaleString()} | Relics/Weapon: +${equipBonusPower.toLocaleString()}">
                      ⚡ ${totalSpiritPower.toLocaleString()} PWR ${equipBonusPower > 0 ? `<span style="font-size: 10px; color: #7bed9f;">(+${equipBonusPower})</span>` : ''}
                    </span>
                  </div>

                  <!-- Real-time XP Bar -->
                  <div class="xp-bar-track">
                    <div class="xp-bar-fill" style="width: ${xpPercent}%;"></div>
                    <div class="xp-bar-text">
                      ${isCapped ? 'LEVEL CAP REACHED' : `${Math.floor(spirit.xp)} / ${reqXp} XP (${xpPercent}%)`}
                    </div>
                  </div>
                </div>

                <!-- Action Buttons (min 44px) -->
                <div class="party-card-actions">
                  ${spirit.canEvolve ? `
                    <button class="btn-evolve" data-action="evolve" data-id="${spirit.id}">
                      ⚡ EVOLVE (RNG)
                    </button>
                  ` : `
                    <button class="btn-unequip" data-action="unequip" data-id="${spirit.id}">
                      Unequip
                    </button>
                  `}
                </div>
              </div>

              <!-- Lower Row: 1 Weapon + 6 Greek God Relics Rack -->
              <div class="spirit-equipment-section">
                <div class="equipment-section-header">
                  <span class="equip-rack-title">⚔️ Divine Arsenal & 6 Relics</span>
                  <span class="equip-rack-sub">Tap socket to Equip/Unequip</span>
                </div>

                <div class="equipment-sockets-row">
                  <!-- Weapon Slot -->
                  <button class="equip-socket-btn weapon-socket ${weapon ? 'socket-equipped' : 'socket-empty'}"
                          data-action="open-equip"
                          data-spirit-id="${spirit.id}"
                          data-slot="weapon"
                          style="${weapon ? `border-color: ${weapon.color || '#f1c40f'};` : ''}"
                          title="${weapon ? `${weapon.name} (${weapon.rarity})\n+${weapon.atkPower} ATK Power` : 'Weapon Socket (Tap to equip)'}">
                    <span class="socket-icon">${weapon ? weapon.icon : '⚔️'}</span>
                    <span class="socket-tag" style="${weapon ? `color: ${weapon.color};` : ''}">${weapon ? 'WPN' : '+WPN'}</span>
                  </button>

                  <!-- 6 Greek God Relic Slots -->
                  ${RELIC_SLOT_TYPES.map(slot => {
                    const relic = relics && relics[slot.id];
                    return `
                      <button class="equip-socket-btn relic-socket ${relic ? 'socket-equipped' : 'socket-empty'}"
                              data-action="open-equip"
                              data-spirit-id="${spirit.id}"
                              data-slot="${slot.id}"
                              style="${relic ? `border-color: ${relic.color || 'var(--primary-color)'};` : ''}"
                              title="${relic ? `${relic.name} (${relic.rarity})\n+${relic.mainStatValue} ${relic.mainStatName}\nSet: ${relic.setName}` : `Empty ${slot.name} (Tap to equip)`}">
                        <span class="socket-icon">${relic ? relic.icon : slot.icon}</span>
                        <span class="socket-tag" style="${relic ? `color: ${relic.accentColor || relic.color};` : ''}">${relic ? relic.setId.slice(0, 3).toUpperCase() : slot.name.slice(0, 3).toUpperCase()}</span>
                      </button>
                    `;
                  }).join('')}
                </div>

                <!-- Active Set Bonuses -->
                ${activeSets.length > 0 ? `
                  <div class="active-set-bonuses-strip">
                    ${activeSets.map(sb => `
                      <div class="set-bonus-badge-chip" style="border-color: ${sb.color}; color: ${sb.color}; background: rgba(0, 0, 0, 0.4);" title="${sb.description}">
                        <span class="sb-god-tag">${sb.icon} ${sb.godName} [${sb.tier}]</span>
                        <span class="sb-desc-tag">${sb.description}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div class="no-sets-active-note">
                    <span>Equip 2pc or 4pc matching Greek God relics to awaken set bonuses</span>
                  </div>
                `}
              </div>

            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;

  // Attach button event listeners
  container.querySelectorAll('[data-action="evolve"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const spiritId = e.currentTarget.getAttribute('data-id');
      try {
        const result = gameState.evolveSpirit(spiritId);
        showEvolutionCeremonyModal(result, () => {
          renderPartyView(container);
        });
      } catch (err) {
        alert(err.message);
      }
    });
  });

  container.querySelectorAll('[data-action="unequip"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const spiritId = e.currentTarget.getAttribute('data-id');
      try {
        gameState.unequipSpirit(spiritId);
        renderPartyView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Open Equipment Slot Modal
  container.querySelectorAll('[data-action="open-equip"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const spiritId = e.currentTarget.getAttribute('data-spirit-id');
      const slotType = e.currentTarget.getAttribute('data-slot');
      showEquipmentSlotModal({
        spiritId,
        slotType,
        onUpdate: () => renderPartyView(container)
      });
    });
  });

  // Jump to Trials tab button
  document.getElementById('btn-party-trials-link')?.addEventListener('click', () => {
    document.querySelector('[data-tab="trials"]')?.click();
  });
}

