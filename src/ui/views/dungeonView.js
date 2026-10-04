/**
 * Artifact Dungeon: The Pantheon Trials View
 * Dedicated UI for farming Greek God Relics & Weapons
 */

import { gameState } from '../../state/gameState.js';
import { PANTHEON_CHAMBERS, PANTHEON_DIFFICULTY_TIERS } from '../../data/artifactDungeonData.js';
import { GREEK_GOD_SETS, EQUIPMENT_RARITIES } from '../../data/equipmentData.js';

let selectedChamberId = 'underworld_crypt';
let selectedTierNum = 1;

export function renderDungeonView(container) {
  const state = gameState.state;
  const res = state.resources;
  const partyPower = gameState.getTotalPartyPower();
  const selectedChamber = PANTHEON_CHAMBERS.find(c => c.id === selectedChamberId) || PANTHEON_CHAMBERS[0];
  const selectedTier = PANTHEON_DIFFICULTY_TIERS.find(t => t.tier === selectedTierNum) || PANTHEON_DIFFICULTY_TIERS[0];
  const godSet = GREEK_GOD_SETS[selectedChamber.godId];

  const canAfford = res.energy >= selectedTier.energyCost;
  const powerRatio = partyPower / Math.max(1, selectedTier.recommendedPower);
  let powerClass = 'even';
  let powerText = '⚖️ Matched Strength';
  if (powerRatio >= 1.25) {
    powerClass = 'strong';
    powerText = '⚡ Overwhelming Advantage';
  } else if (powerRatio < 0.85) {
    powerClass = 'under';
    powerText = '⚠️ High Difficulty';
  }

  container.innerHTML = `
    <div class="pantheon-container">
      
      <!-- Top Dungeon Hero Banner -->
      <div class="pantheon-hero-banner" style="border-bottom: 2px solid ${selectedChamber.color};">
        <div class="pantheon-title-col">
          <div class="pantheon-header-tag">THE PANTHEON TRIALS</div>
          <h2 class="pantheon-title">Divine Artifact Chambers</h2>
          <p class="pantheon-subtitle">Challenge Greek God Avatars to earn targeted 6-piece Relic Sets & Weapons.</p>
        </div>

        <div class="pantheon-energy-badge">
          <span class="energy-icon">⚡</span>
          <span class="energy-numbers">${res.energy} / ${res.maxEnergy} Energy</span>
        </div>
      </div>

      <!-- Chamber Selection Carousel / Grid -->
      <div class="pantheon-chambers-grid">
        ${PANTHEON_CHAMBERS.map(c => {
          const isSelected = c.id === selectedChamberId;
          const gSet = GREEK_GOD_SETS[c.godId];
          return `
            <button class="chamber-card ${isSelected ? 'selected' : ''}" data-chamber="${c.id}" style="--chamber-color: ${c.color};">
              <div class="chamber-sigil" style="background: ${c.color}22; border-color: ${c.color};">
                ${c.sigil}
              </div>
              <div class="chamber-info">
                <span class="chamber-name">${c.name}</span>
                <span class="chamber-god">${gSet ? gSet.god : ''} Set</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Active Selected Chamber Detail Stage -->
      <div class="chamber-active-stage" style="border: 2px solid ${selectedChamber.color}; background: linear-gradient(180deg, ${selectedChamber.color}15 0%, rgba(10, 15, 20, 0.95) 100%);">
        
        <div class="stage-header-row">
          <div class="stage-sigil-large">${selectedChamber.sigil}</div>
          <div class="stage-text-block">
            <h3 class="stage-name" style="color: ${selectedChamber.accentColor};">${selectedChamber.name}</h3>
            <span class="stage-god-title">${selectedChamber.godTitle}</span>
            <p class="stage-lore">${selectedChamber.lore}</p>
          </div>
        </div>

        <!-- Relic Set Bonus Preview Pill -->
        ${godSet ? `
          <div class="god-bonuses-preview-box">
            <div class="bonus-preview-pill">
              <span class="bonus-tag">2-PC BONUS</span>
              <span class="bonus-desc"><strong>${godSet.bonus2pc.name}:</strong> ${godSet.bonus2pc.description}</span>
            </div>
            <div class="bonus-preview-pill">
              <span class="bonus-tag four-pc">4-PC BONUS</span>
              <span class="bonus-desc"><strong>${godSet.bonus4pc.name}:</strong> ${godSet.bonus4pc.description}</span>
            </div>
          </div>
        ` : ''}

        <!-- Tier Selector Row -->
        <div class="pantheon-tier-selector">
          <span class="tier-label">TRIAL DIFFICULTY:</span>
          <div class="tier-buttons-row">
            ${PANTHEON_DIFFICULTY_TIERS.map(t => {
              const isTierActive = t.tier === selectedTierNum;
              return `
                <button class="btn-tier-select ${isTierActive ? 'active' : ''}" data-tier="${t.tier}">
                  <span class="tier-btn-name">${t.name}</span>
                  <span class="tier-btn-cost">${t.energyCost} ⚡</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Trial Action Strip -->
        <div class="trial-launch-strip">
          <div class="trial-power-info">
            <span class="rec-power-tag">Recommended Power: ⚡ ${selectedTier.recommendedPower.toLocaleString()}</span>
            <span class="party-power-tag ${powerClass}">Party Power: ⚡ ${partyPower.toLocaleString()} (${powerText})</span>
          </div>

          <button id="btn-enter-trial" class="btn-enter-trial" ${canAfford ? '' : 'disabled'} style="background: linear-gradient(135deg, ${selectedChamber.color}, ${selectedChamber.accentColor});">
            <span>Challenge ${selectedChamber.sigil} ${selectedTier.name} (${selectedTier.energyCost} ⚡)</span>
          </button>
        </div>

      </div>

      <!-- Loot Preview & Guaranteed Drops Strip -->
      <div class="pantheon-loot-preview-strip">
        <span class="loot-preview-title">GUARANTEED SPOILS:</span>
        <div class="loot-pills-list">
          <span class="loot-badge">🏆 ${selectedTier.relicCount}x Targeted ${godSet ? godSet.god : ''} Relics</span>
          <span class="loot-badge">⚔️ 45% Weapon Chance</span>
          <span class="loot-badge">💎 +${selectedTier.shardsReward} Shards</span>
          <span class="loot-badge">🔮 +${selectedTier.essenceReward} Soul Essence</span>
        </div>
      </div>

    </div>
  `;

  // Attach Chamber Card Selection listeners
  container.querySelectorAll('.chamber-card').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedChamberId = btn.dataset.chamber;
      renderDungeonView(container);
    });
  });

  // Attach Tier Selection listeners
  container.querySelectorAll('.btn-tier-select').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedTierNum = parseInt(btn.dataset.tier, 10);
      renderDungeonView(container);
    });
  });

  // Attach Enter Trial Battle listener
  const btnEnter = container.querySelector('#btn-enter-trial');
  if (btnEnter) {
    btnEnter.addEventListener('click', () => {
      try {
        const loot = gameState.runPantheonTrial(selectedChamberId, selectedTierNum);
        showDungeonVictoryModal(loot, () => renderDungeonView(container));
      } catch (err) {
        alert(err.message);
      }
    });
  }
}

/**
 * Shows interactive victory modal displaying awarded Relics & Weapons
 */
export function showDungeonVictoryModal(loot, onClose) {
  const modalRoot = document.querySelector('#modal-root');
  if (!modalRoot) return;

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';

  modalEl.innerHTML = `
    <div class="pantheon-victory-modal" style="border: 2px solid ${loot.chamber.color};">
      
      <div class="victory-header" style="background: linear-gradient(135deg, ${loot.chamber.color}33, #000);">
        <div class="victory-sigil">${loot.chamber.sigil}</div>
        <div class="victory-title-col">
          <span class="victory-sub">TRIAL VICTORIOUS</span>
          <h3 class="victory-name">${loot.chamber.name} Cleared!</h3>
          <span class="victory-tier-tag">${loot.tier.name}</span>
        </div>
      </div>

      <div class="victory-body">
        <div class="spoils-section-header">RELICS & WEAPONS ACQUIRED:</div>

        <div class="awarded-items-grid">
          ${loot.relics.map(r => {
            const rColor = r.color || '#9b59b6';
            const rarObj = EQUIPMENT_RARITIES[r.rarity] || EQUIPMENT_RARITIES.COMMON;
            return `
              <div class="awarded-item-card" style="border: 1px solid ${rarObj.border}; background: rgba(15, 20, 25, 0.95);">
                <div class="item-header-row">
                  <span class="item-icon-frame">${r.icon}</span>
                  <div class="item-name-col">
                    <span class="item-name" style="color: ${r.accentColor || '#fff'};">${r.name}</span>
                    <span class="item-rarity-pill" style="color: ${rarObj.color};">${rarObj.name}</span>
                  </div>
                </div>
                <div class="item-stat-row">
                  <span class="stat-name">${r.mainStatName}:</span>
                  <span class="stat-val">+${r.mainStatValue}</span>
                </div>
                <div class="item-set-tag" style="background: ${rColor}22; color: ${rColor};">
                  ${r.setName} (1/6)
                </div>
              </div>
            `;
          }).join('')}

          ${loot.weapons.map(w => {
            const rarObj = EQUIPMENT_RARITIES[w.rarity] || EQUIPMENT_RARITIES.COMMON;
            return `
              <div class="awarded-item-card weapon-card" style="border: 1px solid ${rarObj.border}; background: rgba(20, 15, 25, 0.95);">
                <div class="item-header-row">
                  <span class="item-icon-frame">${w.icon}</span>
                  <div class="item-name-col">
                    <span class="item-name" style="color: #ffd32a;">${w.name}</span>
                    <span class="item-rarity-pill" style="color: ${rarObj.color};">${rarObj.name} Weapon</span>
                  </div>
                </div>
                <div class="item-stat-row">
                  <span class="stat-name">ATK Power:</span>
                  <span class="stat-val">+${w.atkPower} PWR</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="victory-resources-row">
          <span class="res-reward-pill">💎 +${loot.shardsGained} Shards</span>
          <span class="res-reward-pill">🔮 +${loot.essenceGained} Soul Essence</span>
        </div>
      </div>

      <div class="victory-actions">
        <button id="btn-close-victory" class="btn-claim-loot" style="background: linear-gradient(135deg, ${loot.chamber.color}, ${loot.chamber.accentColor});">
          Claim & Stash in Vault
        </button>
      </div>

    </div>
  `;

  modalRoot.appendChild(modalEl);

  const btnClose = modalEl.querySelector('#btn-close-victory');
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      modalRoot.removeChild(modalEl);
      if (onClose) onClose();
    });
  }
}
