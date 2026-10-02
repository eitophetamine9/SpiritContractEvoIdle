import { gameState } from '../../state/gameState.js';
import { SPIRIT_SPECIES, getXpRequiredForLevel, getRarityInfo } from '../../data/spiritsData.js';
import { createSpiritPlaceholderBox } from '../components/pixelBox.js';
import { showEvolutionCeremonyModal } from '../components/modals.js';

export function renderPartyView(container) {
  const partySpirits = gameState.getPartySpirits();
  const xpRate = gameState.getXpGainRate();
  const totalPower = gameState.getTotalPartyPower();

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
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 0 4px;">
        <span style="color: var(--text-muted);">Equipped: <strong style="color: #ffffff;">${partySpirits.length} / 5</strong></span>
        <span style="font-size: 13px; font-weight: 800; color: #2ed573;">Total Power: ⚡ ${totalPower.toLocaleString()} PWR</span>
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

          return `
            <div class="party-card ${spirit.canEvolve ? 'evolvable' : ''}" id="party-card-${spirit.id}">
              
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

                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="color: ${rarity.color}; font-weight: 800; font-size: 11px;">[${rarity.name.toUpperCase()}]</span>
                  <span class="party-card-power">⚡ ${spirit.power.toLocaleString()} PWR</span>
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
}
