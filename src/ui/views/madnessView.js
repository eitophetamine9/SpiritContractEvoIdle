import { gameState, ENERGY_ENTRY_COST } from '../../state/gameState.js';
import { createEnemyPlaceholderBox, createSpiritPlaceholderBox } from '../components/pixelBox.js';

export function renderMadnessView(container) {
  const state = gameState.state;
  const mz = state.madnessZone;
  const res = state.resources;
  const enemy = mz.currentEnemy;
  const partySpirits = gameState.getPartySpirits();
  const partyPower = gameState.getTotalPartyPower();
  const enemyPower = enemy ? enemy.power : 1;

  // Math comparison
  const powerRatio = partyPower / Math.max(1, enemyPower);
  let powerStatusClass = 'matched';
  let powerStatusText = '⚖️ EVEN MATCH';
  if (powerRatio >= 1.25) {
    powerStatusClass = 'crushing';
    powerStatusText = `⚡ DOMINATING (+${Math.round((powerRatio - 1) * 100)}% Advantage)`;
  } else if (powerRatio < 0.85) {
    powerStatusClass = 'underpowered';
    powerStatusText = `⚠️ UNDERPOWERED (-${Math.round((1 - powerRatio) * 100)}% Deficit)`;
  }

  const hpPercent = enemy ? Math.max(0, Math.min(100, Math.round((enemy.hp / enemy.maxHp) * 100))) : 0;

  const nextStageNum = mz.highestStageUnlocked + 1;
  const canAffordNext = res.energy >= ENERGY_ENTRY_COST;
  const isCurrentStageBossCleared = mz.highestStageCleared >= mz.stage;

  container.innerHTML = `
    <div class="madness-container">
      
      <!-- Energy & Floor Status Card -->
      <div class="energy-status-banner">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">⚡</span>
            <span style="font-size: 13px; font-weight: 800; color: #f1c40f;">Madness Energy:</span>
            <span style="font-family: var(--font-mono); font-size: 14px; font-weight: 800; color: #ffffff;" id="energy-counter">
              ${res.energy} / ${res.maxEnergy}
            </span>
          </div>

          <div style="font-size: 11px; color: var(--text-muted);">
            ${res.energy < res.maxEnergy ? `+1 in ${30 - (res.energySecondsAccumulator || 0)}s` : 'MAX'}
          </div>
        </div>

        <div class="energy-bar-track">
          <div class="energy-bar-fill" style="width: ${Math.round((res.energy / res.maxEnergy) * 100)}%;"></div>
        </div>
      </div>

      <!-- Stage & Progression Controls -->
      <div class="zone-header-card">
        <div class="zone-title-row">
          <div class="zone-title">
            <span>⚔️ Floor ${mz.stage}</span>
            <span style="font-size: 12px; color: var(--text-muted);">Wave ${mz.subStage}/5</span>
            <span style="font-size: 10px; background: rgba(46, 213, 115, 0.2); color: #2ecc71; border: 1px solid #2ecc71; padding: 1px 6px; border-radius: 4px;">
              FREE REPEAT
            </span>
          </div>

          <div class="zone-controls">
            <button id="btn-prev-stage" class="zone-btn-sm" ${mz.stage <= 1 ? 'disabled' : ''}>
              ◀ Prev
            </button>
            <button id="btn-next-stage" class="zone-btn-sm" ${mz.stage >= mz.highestStageUnlocked ? 'disabled' : ''}>
              Next ▶
            </button>
          </div>
        </div>

        <!-- Unlock Next Locked Floor with Energy Action -->
        ${isCurrentStageBossCleared ? `
          <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid #3b4e75; border-radius: 8px; padding: 8px 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 12px; font-weight: 800; color: #fff;">Floor ${nextStageNum} (Locked)</span>
              <span style="font-size: 10px; color: var(--text-muted);">Entry Cost: 10 ⚡ (Unlocks permanent 0-energy repeats)</span>
            </div>

            <button id="btn-unlock-next-floor" class="btn-unlock-stage" ${canAffordNext ? '' : 'disabled'}>
              Unlock Floor ${nextStageNum} (10 ⚡)
            </button>
          </div>
        ` : ''}

        <div style="display: flex; gap: 8px;">
          <button id="btn-toggle-advance" class="zone-toggle-btn ${mz.autoAdvance ? 'active' : ''}">
            Auto-Advance: ${mz.autoAdvance ? 'ON' : 'OFF'}
          </button>
          <button id="btn-toggle-farm" class="zone-toggle-btn ${mz.farmMode ? 'active' : ''}">
            Farm Mode: ${mz.farmMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <!-- Combat Arena -->
      <div class="arena-card">
        ${enemy && enemy.isBoss ? '<div class="boss-flare">⚠️ ZONE OVERLORD BOSS ⚠️</div>' : ''}

        <div class="enemy-placeholder-frame">
          ${enemy ? createEnemyPlaceholderBox(enemy) : '<div class="pixel-box">Searching...</div>'}
        </div>

        <div class="enemy-details">
          <div class="enemy-name">${enemy ? enemy.name : 'Unknown Corrupted'}</div>
          <div class="enemy-power-stat">Enemy Power: ${enemyPower.toLocaleString()} PWR</div>

          <div class="hp-bar-wrapper">
            <div class="hp-bar-track">
              <div id="enemy-hp-fill" class="hp-bar-fill" style="width: ${hpPercent}%;"></div>
              <div id="enemy-hp-text" class="hp-bar-text">
                ${enemy ? `${Math.ceil(enemy.hp)} / ${enemy.maxHp} HP (${hpPercent}%)` : '0/0'}
              </div>
            </div>
          </div>

          <!-- Click to fight enemy with combined party power -->
          <button id="btn-fight-enemy" class="btn-fight-action" style="width: 100%; min-height: 48px; margin-top: 10px; background: linear-gradient(135deg, #ff4757, #ff6b81); color: #ffffff; font-weight: 800; font-size: 14px; border-radius: 8px; box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);">
            ⚔️ Attack Enemy (Party Power: ⚡ ${partyPower.toLocaleString()})
          </button>
        </div>

        <!-- Math Comparison Power Gauge -->
        <div class="math-power-gauge">
          <div class="power-comparison-row">
            <span style="color: #70a1ff;">Party Total: ⚡ ${partyPower.toLocaleString()} PWR</span>
            <span style="color: #ff6b81;">Enemy: 👾 ${enemyPower.toLocaleString()} PWR</span>
          </div>

          <div class="power-status-pill ${powerStatusClass}">
            ${powerStatusText}
          </div>

          <div style="font-size: 11px; color: var(--text-muted); text-align: center;">
            Unlocked floors repeat indefinitely for 0 ⚡ Energy! Harvest Shards to summon more Spirits.
          </div>
        </div>

        <!-- Active Party 5-Spirit Battle Formation -->
        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">ACTIVE PARTY FORMATION (${partySpirits.length}/5)</span>
          <span style="font-size: 11px; font-family: var(--font-mono); color: #2ed573;">DPS: ${Math.round(partyPower * 0.4)} /s</span>
        </div>

        <div class="battle-party-line">
          ${Array.from({ length: 5 }).map((_, idx) => {
            const spirit = partySpirits[idx];
            if (spirit) {
              return `
                <div class="battle-spirit-mini elem-${spirit.element || 'FIRE'} attacking" id="battle-spirit-${idx}">
                  ${createSpiritPlaceholderBox(spirit, { boxClass: 'spirit-mini-box' })}
                </div>
              `;
            } else {
              return `
                <div class="battle-empty-slot" title="Empty Party Slot">
                  +
                </div>
              `;
            }
          }).join('')}
        </div>
      </div>

      <!-- Loot Ticker / Yields -->
      <div class="combat-stats-strip">
        <span style="color: var(--text-muted);">Yield on Defeat:</span>
        <span style="color: #70a1ff; font-weight: 800;">
          +${enemy ? enemy.shardReward : 0} 💎 Shards ${enemy && enemy.essenceReward > 0 ? `| +${enemy.essenceReward} 🔮 Essence` : ''}
        </span>
      </div>

    </div>
  `;

  // Attach button event listeners
  document.getElementById('btn-prev-stage')?.addEventListener('click', () => {
    try {
      gameState.setStage(gameState.state.madnessZone.stage - 1);
      renderMadnessView(container);
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('btn-next-stage')?.addEventListener('click', () => {
    try {
      gameState.setStage(gameState.state.madnessZone.stage + 1);
      renderMadnessView(container);
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('btn-unlock-next-floor')?.addEventListener('click', () => {
    try {
      gameState.unlockAndEnterStage(nextStageNum);
      renderMadnessView(container);
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('btn-toggle-advance')?.addEventListener('click', () => {
    gameState.toggleAutoAdvance();
    renderMadnessView(container);
  });

  document.getElementById('btn-toggle-farm')?.addEventListener('click', () => {
    gameState.toggleFarmMode();
    renderMadnessView(container);
  });

  document.getElementById('btn-fight-enemy')?.addEventListener('click', () => {
    const res = gameState.attackEnemyWithPartyPower();
    // Visual pulse on enemy and party members
    const enemyBox = container.querySelector('.enemy-placeholder-frame .pixel-box');
    if (enemyBox) {
      enemyBox.style.transform = 'scale(0.94)';
      enemyBox.style.filter = 'brightness(1.5)';
      setTimeout(() => {
        enemyBox.style.transform = '';
        enemyBox.style.filter = '';
      }, 120);
    }
    container.querySelectorAll('.battle-spirit-mini').forEach(sp => {
      sp.classList.remove('attacking');
      void sp.offsetWidth;
      sp.classList.add('attacking');
    });
    updateMadnessCombatTick(container);
    if (res.killed) {
      renderMadnessView(container);
    }
  });
}

/**
 * Fast-update helper to update health bar and power comparison without full re-render
 */
export function updateMadnessCombatTick(container) {
  const mz = gameState.state.madnessZone;
  const enemy = mz.currentEnemy;
  if (!enemy) return;

  const hpFill = document.getElementById('enemy-hp-fill');
  const hpText = document.getElementById('enemy-hp-text');
  if (hpFill && hpText) {
    const hpPercent = Math.max(0, Math.min(100, Math.round((enemy.hp / enemy.maxHp) * 100)));
    hpFill.style.width = `${hpPercent}%`;
    hpText.textContent = `${Math.ceil(enemy.hp)} / ${enemy.maxHp} HP (${hpPercent}%)`;
  }
}
