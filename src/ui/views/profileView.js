import { gameState } from '../../state/gameState.js';
import { SPIRIT_SPECIES, getRarityInfo, ELEMENTS } from '../../data/spiritsData.js';
import { getSheetKeyForSpecies } from '../../render/spriteAnimator.js';
import { createSpiritPlaceholderBox } from '../components/pixelBox.js';
import { showHallOfFamePickerModal } from '../components/modals.js';
import { getNextFeatureUnlock, getAllFeatureMilestones } from '../../data/contractorData.js';
import { authService } from '../../services/authService.js';
import { cloudSaveService } from '../../services/cloudSaveService.js';

export function renderProfileView(container) {
  const state = gameState.state;
  const stats = state.stats;
  const mz = state.madnessZone;
  const spirits = state.spirits;
  const totalPower = gameState.getTotalPartyPower();
  const allSpecies = Object.values(SPIRIT_SPECIES);
  const discoveredCount = allSpecies.filter(sp => gameState.isSpeciesDiscovered(sp.id)).length;
  const compendiumPercent = Math.round((discoveredCount / allSpecies.length) * 100);

  const contractorLvl = gameState.getContractorLevel();
  const contractorXp = gameState.getContractorXp();
  const contractorXpReq = gameState.getContractorXpRequired();
  const xpPercent = Math.min(100, Math.round((contractorXp / contractorXpReq) * 100));
  const nextUnlock = getNextFeatureUnlock(contractorLvl);
  const allMilestones = getAllFeatureMilestones();

  // Derive Contractor Title from Highest Stage
  let contractorTitle = 'Novice Contractor';
  if (mz.highestStageCleared >= 80) contractorTitle = 'Primordial Astral Champion';
  else if (mz.highestStageCleared >= 60) contractorTitle = 'Volcanic Hellfire Conqueror';
  else if (mz.highestStageCleared >= 40) contractorTitle = 'Abyssal Depths Explorer';
  else if (mz.highestStageCleared >= 20) contractorTitle = 'Dark Castle Sovereign';
  else if (mz.highestStageCleared >= 10) contractorTitle = 'Mystical Winterland Pilgrim';
  else if (mz.highestStageCleared >= 5) contractorTitle = 'Swamp Cleanser';

  const hallOfFameSpirits = gameState.getHallOfFameSpirits();

  container.innerHTML = `
    <div class="profile-container">
      
      <!-- Contractor Profile Card -->
      <div class="profile-hero-card">
        <div class="profile-hero-top">
          <div class="profile-avatar-frame">
            <span style="font-size: 38px;">🧙‍♂️</span>
          </div>

          <div class="profile-hero-details">
            <div class="profile-contractor-name">Contractor</div>
            <div class="profile-contractor-title">${contractorTitle}</div>
            <div class="profile-quick-meta">
              <span>Highest Floor: <strong>Floor ${mz.highestStageCleared}</strong></span>
              <span>•</span>
              <span>Power: <strong style="color: #2ed573;">⚡ ${totalPower.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        <div class="profile-compendium-pill">
          <span>📖 Spirit Compendium: <strong>${discoveredCount}/${allSpecies.length}</strong> (${compendiumPercent}%)</span>
        </div>
      </div>

      <!-- Contractor Level & EXP Progression Card -->
      <div class="profile-contractor-level-card">
        <div class="contractor-level-header">
          <div class="contractor-lvl-badge">
            <span class="lvl-crown">👑</span>
            <span class="lvl-number">Lv. ${contractorLvl}</span>
          </div>
          <div class="contractor-xp-stats">
            <div class="xp-label-row">
              <span class="xp-title">Contractor Ascension</span>
              <span class="xp-nums">${contractorXp.toLocaleString()} / ${contractorXpReq.toLocaleString()} EXP (${xpPercent}%)</span>
            </div>
            <div class="contractor-xp-bar-track">
              <div class="contractor-xp-bar-fill" style="width: ${xpPercent}%;"></div>
            </div>
          </div>
        </div>

        <!-- Next Upcoming Milestone Pill -->
        <div class="upcoming-milestone-pill">
          ${nextUnlock ? `
            <span class="milestone-icon">${nextUnlock.icon || '🔒'}</span>
            <div class="milestone-info">
              <span class="milestone-name">Next Unlock: <strong>${nextUnlock.name}</strong></span>
              <span class="milestone-req">Unlocks at Contractor Level ${nextUnlock.level}</span>
            </div>
          ` : `
            <span class="milestone-icon">🌟</span>
            <div class="milestone-info">
              <span class="milestone-name"><strong>All System Milestones Mastered!</strong></span>
              <span class="milestone-req">You have attained peak contractor authority.</span>
            </div>
          `}
        </div>

        <!-- Collapsible System Milestones Overview -->
        <details class="milestones-accordion">
          <summary class="milestones-accordion-summary">
            <span>📜 View Feature Unlock Roadmap (7)</span>
            <span class="summary-arrow">▼</span>
          </summary>
          <div class="milestones-timeline-list">
            ${allMilestones.map(m => {
              const isUnlocked = contractorLvl >= m.level;
              return `
                <div class="milestone-timeline-item ${isUnlocked ? 'unlocked' : 'locked'}">
                  <div class="milestone-status-badge">
                    ${isUnlocked ? '✓' : `Lv.${m.level}`}
                  </div>
                  <div class="milestone-timeline-details">
                    <div class="milestone-item-title">
                      <span>${m.icon} ${m.name}</span>
                      <span class="milestone-lock-tag">${isUnlocked ? 'Unlocked' : `Requires Lv. ${m.level}`}</span>
                    </div>
                    <div class="milestone-item-desc">${m.desc}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </details>
      </div>


      <!-- 5-Slot Hall of Fame Showcase -->
      <div class="hall-of-fame-section">
        <div class="hall-of-fame-header">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">🏛️</span>
            <span style="font-size: 14px; font-weight: 900; color: #ffd152;">Hall of Fame (5)</span>
          </div>
          <span style="font-size: 11px; color: var(--text-muted);">${hallOfFameSpirits.length} / 5 Showcased</span>
        </div>

        <div class="hall-of-fame-grid">
          ${Array.from({ length: 5 }).map((_, idx) => {
            const spirit = hallOfFameSpirits[idx];

            if (!spirit) {
              return `
                <div class="hall-pedestal empty-pedestal" data-action="pick-hall-spirit">
                  <div class="pedestal-empty-icon">+</div>
                  <span class="pedestal-empty-lbl">Assign Spirit</span>
                </div>
              `;
            }

            const species = SPIRIT_SPECIES[spirit.speciesId];
            const rarity = getRarityInfo(spirit.rarity || (species ? species.baseRarity : 'COMMON'));
            const elemKey = (spirit.element || (species ? species.element : 'EARTH')).toUpperCase();
            const elemObj = ELEMENTS[elemKey] || ELEMENTS.EARTH;
            const sheetKey = getSheetKeyForSpecies(species ? species.id : spirit.speciesId);

            return `
              <div class="hall-pedestal filled-pedestal rarity-${rarity.name.toLowerCase()}">
                <div class="pedestal-sprite-wrapper ambient-float">
                  <div class="animated-pixel-sprite sprite-${sheetKey}" style="--sprite-sheet: url('/assets/sprites/creatures/${sheetKey}.svg'); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                    <div class="sprite-frame-viewer"></div>
                    <span class="core-glyph-fallback" style="display: none;">${species ? species.avatarEmoji : '✨'}</span>
                  </div>
                </div>

                <div class="pedestal-info">
                  <span class="pedestal-spirit-name" title="${spirit.customName}">${spirit.customName}</span>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 3px; margin-top: 1px;">
                    <span class="pedestal-rarity-badge" style="color: ${rarity.color}; font-weight: 800; font-size: 8.5px;">${rarity.name.toUpperCase()}</span>
                    <span class="pedestal-element-symbol" style="color: ${elemObj.color}; font-size: 9px;" title="${elemObj.name}">${elemObj.symbol}</span>
                  </div>
                </div>

                <button class="btn-remove-hall" data-id="${spirit.id}" title="Remove from Hall of Fame">✕</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Account & Gameplay Statistics Card -->
      <div class="profile-stats-card">
        <div class="stats-section-title">📊 Contractor Lifetime Records</div>

        <div class="stat-row">
          <span class="stat-label">Total Spirits Contracted</span>
          <span class="stat-value">${stats.totalSpiritsContracted.toLocaleString()}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Total Evolutions Triggered</span>
          <span class="stat-value">${stats.totalEvolutions.toLocaleString()}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Corrupted Foes Slain</span>
          <span class="stat-value">${stats.totalEnemiesDefeated.toLocaleString()}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Total Shards Harvested</span>
          <span class="stat-value">💎 ${stats.shardsEarnedTotal.toLocaleString()}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Total Offline Time</span>
          <span class="stat-value">${formatOfflineTime(stats.totalOfflineTimeSec)}</span>
        </div>
      </div>

      <!-- System Controls & Save Data -->
      <div class="profile-actions-card">
        <div class="stats-section-title">💾 Save & Account Data</div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="btn-save-manual" class="btn-save-manual">
            💾 Save Progress
          </button>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button id="btn-export-save" class="zone-toggle-btn" style="min-height: 44px;">
              📤 Export Backup
            </button>
            <button id="btn-import-save" class="zone-toggle-btn" style="min-height: 44px;">
              📥 Import Backup
            </button>
          </div>

          <button id="btn-replay-tutorial" class="zone-toggle-btn" style="min-height: 42px; border-color: rgba(255, 209, 82, 0.4); color: #ffd152; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span>🐱</span>
            <span>Replay Guided Tutorial</span>
          </button>

          <button id="btn-reset-game" class="btn-reset-danger" style="margin-top: 6px;">
            ⚠️ Reset All Progress
          </button>
        </div>
      </div>

    </div>
  `;

  // Replay Tutorial
  const btnReplay = container.querySelector('#btn-replay-tutorial');
  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      gameState.restartTutorial();
    });
  }

  // Attach Hall of Fame empty slot picker
  container.querySelectorAll('[data-action="pick-hall-spirit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      showHallOfFamePickerModal((selectedSpiritId) => {
        gameState.toggleHallOfFame(selectedSpiritId);
        renderProfileView(container);
      });
    });
  });

  // Remove from Hall of Fame
  container.querySelectorAll('.btn-remove-hall').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      gameState.toggleHallOfFame(id);
      renderProfileView(container);
    });
  });

  // Manual Save
  const btnSave = container.querySelector('#btn-save-manual');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      gameState.save();
      const saveStatus = document.getElementById('save-status');
      if (saveStatus) {
        saveStatus.classList.add('pulse');
        setTimeout(() => saveStatus.classList.remove('pulse'), 1200);
      }
      alert('Game progress saved securely to local storage!');
    });
  }

  // Export Save
  const btnExport = container.querySelector('#btn-export-save');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const dataStr = JSON.stringify(gameState.state);
      navigator.clipboard.writeText(dataStr).then(() => {
        alert('Save data copied to clipboard! Keep this safe for account restoration.');
      }).catch(() => {
        prompt('Copy your save data JSON below:', dataStr);
      });
    });
  }

  // Import Save
  const btnImport = container.querySelector('#btn-import-save');
  if (btnImport) {
    btnImport.addEventListener('click', () => {
      const input = prompt('Paste your backup save data JSON string here:');
      if (input && input.trim()) {
        try {
          const parsed = JSON.parse(input.trim());
          if (parsed && parsed.spirits && Array.isArray(parsed.spirits)) {
            gameState.state = gameState.sanitizeLoadedState(parsed);
            gameState.save();
            alert('Save data imported successfully!');
            renderProfileView(container);
          } else {
            alert('Invalid save data format.');
          }
        } catch (e) {
          alert('Failed to parse save data JSON.');
        }
      }
    });
  }

  // Reset Progress
  const btnReset = container.querySelector('#btn-reset-game');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (confirm('CRITICAL WARNING: This will permanently wipe all spirits, stage progress, and shards! Are you completely sure?')) {
        if (confirm('Final confirmation: Reset everything back to Level 1 Cat Spirit starter state?')) {
          gameState.resetAllProgress();
          if (!authService.isGuest()) {
            try {
              await cloudSaveService.uploadSave(true);
            } catch (err) {
              console.warn('[ProfileView] Could not immediately upload reset cloud save:', err);
            }
          }
          window.location.reload();
        }
      }
    });
  }
}


function formatOfflineTime(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}
