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
  const rewardStatus = gameState.getBestiaryRewardStatus ? gameState.getBestiaryRewardStatus() : { unclaimedSpeciesCount: 0, milestones: [] };

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

        <!-- Milestone Rewards Track (Awards Purified Soul Essence) -->
        <div class="index-milestones-track" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255, 255, 255, 0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; color: #ffd152; display: flex; align-items: center; gap: 4px;">
              <span>🏆</span> Milestone Rewards (Purified Soul Essence)
            </span>
            ${rewardStatus.unclaimedSpeciesCount > 0 ? `
              <button id="btn-claim-all-bestiary-shards" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; font-size: 10px; font-weight: 800; border: 1px solid #fbbf24; border-radius: 6px; padding: 2px 8px; cursor: pointer;">
                🎁 Claim ${rewardStatus.unclaimedSpeciesCount} Bounties (+${rewardStatus.unclaimedSpeciesCount * 50} 💎)
              </button>
            ` : ''}
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(75px, 1fr)); gap: 6px;">
            ${rewardStatus.milestones.map(m => {
              if (m.isClaimed) {
                return `
                  <div style="padding: 4px 6px; background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 6px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 800; color: #4ade80;">${m.percent}% ✓</div>
                    <div style="font-size: 9px; color: #86efac;">+${m.purifiedReward} ✨</div>
                  </div>
                `;
              }
              if (m.canClaim) {
                return `
                  <button class="btn-claim-milestone" data-percent="${m.percent}" style="padding: 4px 6px; background: linear-gradient(135deg, #a855f7, #6366f1); border: 1px solid #c084fc; border-radius: 6px; text-align: center; cursor: pointer; box-shadow: 0 0 8px rgba(168, 85, 247, 0.4);">
                    <div style="font-size: 10px; font-weight: 900; color: #fff;">${m.percent}% Claim!</div>
                    <div style="font-size: 9px; color: #fde047; font-weight: 800;">+${m.purifiedReward} ✨</div>
                  </button>
                `;
              }
              return `
                <div style="padding: 4px 6px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; text-align: center; opacity: 0.65;">
                  <div style="font-size: 10px; font-weight: 700; color: var(--text-muted);">${m.percent}%</div>
                  <div style="font-size: 9px; color: var(--text-moon);">+${m.purifiedReward} ✨</div>
                </div>
              `;
            }).join('')}
          </div>
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

  // Attach claim all discovery shards listener
  container.querySelector?.('#btn-claim-all-bestiary-shards')?.addEventListener('click', () => {
    try {
      const res = gameState.claimAllBestiarySpeciesRewards();
      alert(`🎉 Claimed ${res.count} Discovery Bounties!\nReceived +${res.shardsGranted} Spirit Shards!`);
      renderIndexView(container);
    } catch (err) {
      alert(err.message);
    }
  });

  // Attach milestone claim listeners
  container.querySelectorAll('.btn-claim-milestone').forEach(btn => {
    btn.addEventListener('click', () => {
      const pct = parseInt(btn.dataset.percent, 10);
      try {
        const res = gameState.claimBestiaryMilestoneReward(pct);
        alert(`🏆 ${pct}% Bestiary Milestone Reached!\nReceived +${res.purifiedGranted} Purified Soul Essence!`);
        renderIndexView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });
}
