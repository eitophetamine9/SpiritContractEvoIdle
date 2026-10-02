import { gameState, ENERGY_ENTRY_COST } from '../../state/gameState.js';
import { getBiomeForStage } from '../../data/biomesData.js';
import { getRarityInfo, SPIRIT_SPECIES } from '../../data/spiritsData.js';
import { createEnemyPlaceholderBox, createSpiritPlaceholderBox } from '../components/pixelBox.js';

let isPaused = false;
let battleSpeed = 1; // 1 or 2

export function renderMadnessView(container) {
  const state = gameState.state;
  const mz = state.madnessZone;
  const res = state.resources;
  const enemy = mz.currentEnemy;
  const partySpirits = gameState.getPartySpirits();
  const partyPower = gameState.getTotalPartyPower();
  const enemyPower = enemy ? enemy.power : 1;

  // Current Biome Information
  const biome = getBiomeForStage(mz.stage);

  // Power comparison ratio
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
    <div class="madness-container ${biome.themeClass}">
      
      <!-- Top Tactical Combat HUD (Inspired by Reference Battle Sequence) -->
      <div class="combat-top-hud">
        <div class="combat-hud-left">
          <button id="btn-combat-pause" class="hud-icon-btn" title="Pause Combat">
            ${isPaused ? '▶️' : '⏸️'}
          </button>
          <button id="btn-combat-sound" class="hud-icon-btn" title="Sound Effects">
            🔊
          </button>
        </div>

        <div class="combat-vs-banner">
          <span class="vs-ally-tag">Contractor</span>
          <span class="vs-center-tag">VS</span>
          <span class="vs-enemy-tag">${enemy && enemy.isBoss ? 'OVERLORD' : 'CORRUPTED'}</span>
        </div>

        <div class="combat-hud-right">
          <button id="btn-combat-speed" class="hud-speed-btn ${battleSpeed === 2 ? 'speed-2x' : ''}" title="Battle Speed">
            ${battleSpeed}X
          </button>
        </div>
      </div>

      <!-- Biome & Floor Progression Strip -->
      <div class="biome-progression-strip" style="border-left: 4px solid ${biome.badgeColor};">
        <div class="biome-info-col">
          <div class="biome-name-row">
            <span class="biome-badge-pill" style="background: ${biome.badgeColor}; color: #000;">
              ${biome.name}
            </span>
            <span class="biome-floor-tag">Floor ${mz.stage} • Wave ${mz.subStage}/5</span>
          </div>
          <div class="biome-desc-text">${biome.description}</div>
        </div>

        <div class="zone-nav-buttons">
          <button id="btn-prev-stage" class="zone-btn-sm" ${mz.stage <= 1 ? 'disabled' : ''}>◀ Prev</button>
          <button id="btn-next-stage" class="zone-btn-sm" ${mz.stage >= mz.highestStageUnlocked ? 'disabled' : ''}>Next ▶</button>
        </div>
      </div>

      <!-- Unlock Next Floor Banner (If Boss Cleared) -->
      ${isCurrentStageBossCleared ? `
        <div class="floor-unlock-banner">
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 13px; font-weight: 800; color: #fff;">Floor ${nextStageNum} (Locked)</span>
            <span style="font-size: 10px; color: var(--text-muted);">Entry Cost: 10 ⚡ (Unlocks permanent free farming)</span>
          </div>

          <button id="btn-unlock-next-floor" class="btn-unlock-stage" ${canAffordNext ? '' : 'disabled'}>
            Unlock Floor ${nextStageNum} (10 ⚡)
          </button>
        </div>
      ` : ''}

      <!-- Dynamic Isometric Battlefield Area -->
      <div class="isometric-battlefield ${biome.themeClass} ${enemy && enemy.isBoss ? 'boss-battlefield' : ''}">
        
        <!-- Floating Bouncing Damage Overlay Layer -->
        <div id="damage-popup-layer" class="damage-popup-layer"></div>

        <!-- Left Side: Staggered Allied Spirit Formation -->
        <div class="allied-formation-column">
          <div class="formation-header-label">ALLIED SPIRIT LINEUP</div>
          
          <div class="staggered-party-formation">
            ${Array.from({ length: 5 }).map((_, idx) => {
              const spirit = partySpirits[idx];
              if (!spirit) {
                return `
                  <div class="spirit-formation-slot empty-slot" style="--stagger-offset: ${idx * 6}px;">
                    <div class="empty-slot-marker">+</div>
                  </div>
                `;
              }

              const species = SPIRIT_SPECIES[spirit.speciesId];
              const rarity = getRarityInfo(spirit.rarity || (species ? species.baseRarity : 'COMMON'));

              return `
                <div class="spirit-formation-slot slot-active" id="allied-slot-${idx}" style="--stagger-offset: ${(idx % 2) * 12}px;">
                  
                  <!-- Overhead Rarity & Level Floating Badge -->
                  <div class="overhead-status-bar">
                    <span class="overhead-rarity" style="color: ${rarity.color}; border-color: ${rarity.border}; background: ${rarity.bg};">
                      ${rarity.name.toUpperCase()}
                    </span>
                    <span class="overhead-level">Lv.${spirit.level}</span>
                  </div>

                  <!-- Spirit Sprite Box with Ground Shadow -->
                  <div class="spirit-sprite-container">
                    ${createSpiritPlaceholderBox(spirit, { boxClass: 'formation-spirit-box' })}
                    <div class="combat-ground-shadow"></div>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Center Combat Clash Point (Animations / Particles) -->
        <div class="combat-clash-divider">
          <div class="clash-sparks-icon">⚔️</div>
        </div>

        <!-- Right Side: Corrupted Enemy / Boss Vanguard -->
        <div class="enemy-formation-column">
          <div class="formation-header-label" style="color: #ff6b81;">
            ${enemy && enemy.isBoss ? '⚠️ OVERLORD BOSS' : 'CORRUPTED FOE'}
          </div>

          <div class="enemy-combatant-wrapper" id="enemy-combatant">
            
            <!-- Enemy Overhead Details & Health Bar -->
            <div class="enemy-overhead-card">
              <div class="enemy-name-label">${enemy ? enemy.name : 'Unknown Corrupted'}</div>
              <div class="enemy-pwr-label">⚡ ${enemyPower.toLocaleString()} PWR</div>

              <div class="enemy-hp-track">
                <div id="enemy-hp-fill" class="enemy-hp-fill" style="width: ${hpPercent}%;"></div>
                <div id="enemy-hp-text" class="enemy-hp-text">
                  ${enemy ? `${Math.ceil(enemy.hp).toLocaleString()} / ${enemy.maxHp.toLocaleString()} HP` : '0/0'}
                </div>
              </div>
            </div>

            <!-- Enemy Sprite Frame with Ground Shadow -->
            <div class="enemy-sprite-container">
              <div class="enemy-placeholder-frame">
                ${enemy ? createEnemyPlaceholderBox(enemy) : '<div class="pixel-box">Searching...</div>'}
              </div>
              <div class="combat-ground-shadow enemy-shadow"></div>
            </div>

          </div>
        </div>

      </div>

      <!-- Action Attack Command & DPS Strip -->
      <div class="combat-action-footer">
        
        <!-- Active Attack Button -->
        <button id="btn-fight-enemy" class="btn-main-attack">
          <span>⚔️ Attack Foe (Party Strike)</span>
          <span class="btn-subtext">Party Power: ⚡ ${partyPower.toLocaleString()} PWR • DPS: ${Math.round(partyPower * 0.45 * battleSpeed)}/s</span>
        </button>

        <!-- Power Assessment Badge -->
        <div class="power-status-pill ${powerStatusClass}">
          ${powerStatusText}
        </div>

        <!-- Automation Controls -->
        <div class="combat-toggle-row">
          <button id="btn-toggle-advance" class="zone-toggle-btn ${mz.autoAdvance ? 'active' : ''}">
            Auto-Advance: ${mz.autoAdvance ? 'ON' : 'OFF'}
          </button>
          <button id="btn-toggle-farm" class="zone-toggle-btn ${mz.farmMode ? 'active' : ''}">
            Farm Mode: ${mz.farmMode ? 'ON' : 'OFF'}
          </button>
        </div>

        <!-- Loot Yield Strip -->
        <div class="combat-yield-summary">
          <span style="color: var(--text-muted);">Victory Spoils:</span>
          <span style="color: #ffd152; font-weight: 800;">
            +${enemy ? enemy.shardReward : 0} 💎 Shards ${enemy && enemy.essenceReward > 0 ? `• +${enemy.essenceReward} 🔮 Essence` : ''}
          </span>
        </div>

      </div>

    </div>
  `;

  // Attach button event listeners
  const btnPrev = container.querySelector('#btn-prev-stage');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      try {
        gameState.setStage(gameState.state.madnessZone.stage - 1);
        renderMadnessView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const btnNext = container.querySelector('#btn-next-stage');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      try {
        gameState.setStage(gameState.state.madnessZone.stage + 1);
        renderMadnessView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const btnUnlockNext = container.querySelector('#btn-unlock-next-floor');
  if (btnUnlockNext) {
    btnUnlockNext.addEventListener('click', () => {
      try {
        gameState.unlockAndEnterStage(nextStageNum);
        renderMadnessView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const btnAuto = container.querySelector('#btn-toggle-advance');
  if (btnAuto) {
    btnAuto.addEventListener('click', () => {
      gameState.toggleAutoAdvance();
      renderMadnessView(container);
    });
  }

  const btnFarm = container.querySelector('#btn-toggle-farm');
  if (btnFarm) {
    btnFarm.addEventListener('click', () => {
      gameState.toggleFarmMode();
      renderMadnessView(container);
    });
  }

  // Battle Speed Toggle (1X / 2X)
  const btnSpeed = container.querySelector('#btn-combat-speed');
  if (btnSpeed) {
    btnSpeed.addEventListener('click', () => {
      battleSpeed = battleSpeed === 1 ? 2 : 1;
      renderMadnessView(container);
    });
  }

  // Combat Pause Toggle
  const btnPause = container.querySelector('#btn-combat-pause');
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      isPaused = !isPaused;
      renderMadnessView(container);
    });
  }

  // Manual Attack with Floating Damage animation
  const btnFight = container.querySelector('#btn-fight-enemy');
  if (btnFight) {
    btnFight.addEventListener('click', () => {
      const res = gameState.attackEnemyWithPartyPower();
      spawnDamageNumber(container, res.damage);

      // Visual attack animation for party members and enemy hit flash
      const enemyEl = container.querySelector('#enemy-combatant');
      if (enemyEl) {
        enemyEl.classList.remove('enemy-hit-flash');
        void enemyEl.offsetWidth;
        enemyEl.classList.add('enemy-hit-flash');
      }

      container.querySelectorAll('.spirit-formation-slot.slot-active').forEach(slot => {
        slot.classList.remove('lunge-attack');
        void slot.offsetWidth;
        slot.classList.add('lunge-attack');
      });

      updateMadnessCombatTick(container);

      if (res.killed) {
        setTimeout(() => renderMadnessView(container), 250);
      }
    });
  }
}

/**
 * Creates floating bouncing damage text directly on the battlefield (e.g. "217")
 */
function spawnDamageNumber(container, dmgAmount) {
  const layer = container.querySelector('#damage-popup-layer');
  if (!layer) return;

  const dmgEl = document.createElement('div');
  const isCrit = Math.random() < 0.25;
  dmgEl.className = `floating-dmg-popup ${isCrit ? 'crit' : ''}`;
  dmgEl.textContent = isCrit ? `CRIT ${Math.round(dmgAmount * 1.5)}!` : `${dmgAmount}`;

  // Random offset for organic scattering
  const offsetX = (Math.random() - 0.5) * 60;
  dmgEl.style.transform = `translate(${offsetX}px, 0)`;

  layer.appendChild(dmgEl);

  setTimeout(() => {
    if (dmgEl.parentNode) dmgEl.parentNode.removeChild(dmgEl);
  }, 850);
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
    hpText.textContent = `${Math.ceil(enemy.hp).toLocaleString()} / ${enemy.maxHp.toLocaleString()} HP`;
  }
}
