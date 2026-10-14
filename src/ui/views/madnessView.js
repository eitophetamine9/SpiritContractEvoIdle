import { gameState, ENERGY_ENTRY_COST } from '../../state/gameState.js';
import { getBiomeForStage } from '../../data/biomesData.js';
import { getRarityInfo, SPIRIT_SPECIES, getRoleInfo, FORMATION_SLOTS, FORMATION_COLUMNS } from '../../data/spiritsData.js';
import { createEnemyPlaceholderBox, createSpiritPlaceholderBox } from '../components/pixelBox.js';
import { audioManager, safePlaySfx } from '../../audio/audioManager.js';
import { arenaRenderer } from '../../render/arenaRenderer.js';
import { showSpiritModal } from '../components/modals.js';
import { getSheetKeyForSpecies, createAnimatedEnemyHtml, getSheetKeyForEnemy } from '../../render/spriteAnimator.js';

let isPaused = false;
let battleSpeed = 1; // 1 or 2
let isEventsBound = false;
let selectedMadnessSlot = null;

export function renderMadnessView(container) {
  const state = gameState.state;
  const mz = state.madnessZone;
  const res = state.resources;
  let swarm = (mz.currentSwarm && mz.currentSwarm.length > 0) ? mz.currentSwarm : (mz.currentEnemy ? [mz.currentEnemy] : []);
  if (!swarm || swarm.length === 0) {
    gameState.spawnMadnessEnemy();
    swarm = gameState.state.madnessZone.currentSwarm || [];
  }
  const enemy = swarm.find(e => !e.isDefeated && e.hp > 0) || swarm[0] || null;
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

  const nextStageNum = mz.highestStageUnlocked + 1;
  const canAffordNext = res.energy >= ENERGY_ENTRY_COST;
  const hasClearedHighestUnlocked = (mz.highestStageCleared || 0) >= mz.highestStageUnlocked;
  const isAtFrontierStage = mz.stage === mz.highestStageUnlocked;
  const showUnlockBanner = isAtFrontierStage && hasClearedHighestUnlocked;
  const livingEnemiesCount = swarm.filter(e => !e.isDefeated && e.hp > 0).length;
  const formationData = gameState.getPartyFormation();

  container.innerHTML = `
    <div class="madness-container ${biome.themeClass}">
      
      <!-- Top Tactical Combat HUD -->
      <div class="combat-top-hud">
        <div class="combat-hud-left">
          <button id="btn-combat-pause" class="hud-icon-btn" title="Pause Combat">
            ${isPaused ? '▶️' : '⏸️'}
          </button>
          <button id="btn-combat-sound" class="hud-icon-btn" title="Toggle Sound">
            ${audioManager.isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        <div class="combat-vs-banner">
          <span class="vs-ally-tag">Contractor</span>
          <span class="vs-center-tag">VS</span>
          <span class="vs-enemy-tag">${swarm.some(e => e.isBoss) ? 'OVERLORD SWARM' : 'CORRUPTED SWARM'}</span>
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
          ${mz.stage < mz.highestStageUnlocked ? `
            <button id="btn-next-stage" class="zone-btn-sm">Next ▶</button>
          ` : (hasClearedHighestUnlocked ? `
            <button id="btn-unlock-next-floor" class="zone-btn-sm" style="background: linear-gradient(135deg, #f1c40f, #e67e22); color: #000; font-weight: 900;" ${canAffordNext ? '' : 'disabled'}>
              Unlock F${nextStageNum} (10 ⚡)
            </button>
          ` : `
            <button id="btn-next-stage" class="zone-btn-sm" disabled title="Defeat Boss on Floor ${mz.stage} first">Next ▶</button>
          `)}
          <button id="btn-trials-shortcut" class="zone-btn-sm" style="background: rgba(241, 196, 15, 0.18); border-color: #f1c40f; color: #ffd32a; font-weight: 800;" title="Challenge Pantheon Trials to farm Greek God Relics">🏛️ Trials</button>
        </div>
      </div>

      <!-- Unlock Next Floor Banner (Only When Boss of Highest Unlocked Floor is Defeated) -->
      ${showUnlockBanner ? `
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
      <div class="isometric-battlefield ${biome.themeClass} ${swarm.some(e => e.isBoss) ? 'boss-battlefield' : ''}" style="position: relative; overflow: hidden;">
        
        <!-- 2.5D Isometric Canvas Viewport Background Layer -->
        <div id="arena-viewport-25d" class="arena-viewport-25d" style="position: absolute; inset: 0; pointer-events: none; z-index: 0; border-radius: 14px; overflow: hidden;"></div>

        <!-- Top Battlefield Announcement Banner Layer -->
        <div id="combat-banner-layer" class="combat-banner-layer"></div>

        <!-- Floating Bouncing Damage Overlay Layer -->
        <div id="damage-popup-layer" class="damage-popup-layer"></div>

        <!-- Left Side: Seamless 3x3 Allied Spirit Formation (No Boxes, No Empty Slots) -->
        <div class="allied-formation-column seamless-allied-column">
          
          <div class="formation-header-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span>ALLIED SQUAD</span>
            <button id="btn-madness-auto-align" class="btn-madness-quick-action" title="Auto-align squad into optimal role positions">⚡ Auto-Align</button>
          </div>

          <!-- Seamless 3x3 Battlefield Grid: Characters directly in environment -->
          <div class="madness-tactical-grid madness-seamless-grid">
            
            <!-- Column 1: Backline -->
            <div class="madness-grid-col col-back seamless-grid-col">
              ${['b1', 'b2', 'b3'].map(slotId => renderSeamlessMadnessSpirit(slotId, formationData.slots[slotId], partySpirits)).filter(Boolean).join('')}
            </div>

            <!-- Column 2: Midline -->
            <div class="madness-grid-col col-mid seamless-grid-col">
              ${['m1', 'm2', 'm3'].map(slotId => renderSeamlessMadnessSpirit(slotId, formationData.slots[slotId], partySpirits)).filter(Boolean).join('')}
            </div>

            <!-- Column 3: Frontline -->
            <div class="madness-grid-col col-front seamless-grid-col">
              ${['f1', 'f2', 'f3'].map(slotId => renderSeamlessMadnessSpirit(slotId, formationData.slots[slotId], partySpirits)).filter(Boolean).join('')}
            </div>

          </div>

        </div>

        <!-- Center Combat Clash Point (Animations / Particles) -->
        <div class="combat-clash-divider">
          <div class="clash-sparks-icon">⚔️</div>
        </div>

        <!-- Right Side: Corrupted Swarm Formation (Seamless, No Borders, Animated Sprites) -->
        <div class="enemy-formation-column seamless-enemy-column">
          <div class="formation-header-label" style="color: #ff6b81;">
            ${swarm.some(e => e.isBoss) ? '⚠️ OVERLORD SWARM' : `CORRUPTED SWARM (${livingEnemiesCount}/${swarm.length})`}
          </div>

          <div class="enemy-swarm-wrapper ${swarm.length >= 4 ? 'large-swarm' : ''}" id="enemy-swarm-wrapper" style="${swarm.length >= 4 ? 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 12px; align-items: center;' : 'display: flex; flex-direction: column; gap: 8px; align-items: flex-end;'}">
            ${swarm.map((em, sIdx) => {
              const isDead = em.isDefeated || em.hp <= 0;
              const emHpPct = Math.max(0, Math.min(100, Math.round((em.hp / em.maxHp) * 100)));
              return `
                <div class="seamless-enemy-slot ${em.isBoss ? 'boss-slot' : ''} ${isDead ? 'enemy-defeated' : ''}" id="enemy-slot-${sIdx}" style="--swarm-stagger: ${(sIdx % 2) * 8}px;">
                  
                  <!-- Enemy Details & Floating Health Bar (Overhead, Borderless) -->
                  <div class="seamless-enemy-overhead">
                    <div class="seamless-enemy-name">
                      ${em.isBoss ? '<span class="boss-crown-badge">👑</span>' : ''}
                      <span>${em.name}</span>
                    </div>
                    <div class="seamless-enemy-pwr">⚡ ${em.power.toLocaleString()} PWR</div>

                    <div class="seamless-enemy-hp-track">
                      <div id="enemy-hp-fill-${sIdx}" class="seamless-enemy-hp-fill" style="width: ${emHpPct}%;"></div>
                    </div>
                  </div>

                  <!-- Animated Enemy Sprite with Ground Shadow (No Box, No Border) -->
                  <div class="enemy-sprite-container seamless-sprite-container">
                    ${createAnimatedEnemyHtml(em, { extraClasses: 'flipped-sprite' })}
                    <div class="combat-ground-shadow ${em.isBoss ? 'enemy-shadow' : ''}"></div>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- Action Attack Command & Combat Control Strip -->
      <div class="combat-action-footer">
        
        <!-- Active Attack Button -->
        <button id="btn-fight-enemy" class="btn-main-attack">
          <span>⚔️ Attack Foe (Party Strike • Charges +10 MP)</span>
          <span class="btn-subtext">Party Power: ⚡ ${partyPower.toLocaleString()} PWR • DPS: ${Math.round(partyPower * 0.45 * battleSpeed)}/s</span>
        </button>

        <!-- Power Assessment Badge -->
        <div class="power-status-pill ${powerStatusClass}">
          ${powerStatusText}
        </div>

        <!-- Combat Engagement Control -->
        <div class="combat-toggle-row" style="grid-template-columns: 1fr;">
          <button id="btn-toggle-engage" class="zone-toggle-btn ${mz.isEngaged !== false ? 'active' : 'standby'}" title="Toggle between active combat and standby resting mode">
            ${mz.isEngaged !== false ? '⚔️ Combat: ENGAGED' : '⏸️ Combat: STANDBY'}
          </button>
        </div>

        <!-- Loot Yield Strip -->
        <div class="combat-yield-summary">
          <span style="color: var(--text-muted);">Victory Spoils:</span>
          <span style="color: #ffd152; font-weight: 800;">
            +${swarm.reduce((sum, e) => sum + (e.shardReward || 0), 0)} 💎 Shards ${swarm.some(e => e.essenceReward > 0) ? `• +${swarm.reduce((sum, e) => sum + (e.essenceReward || 0), 0)} 🔮 Essence` : ''}
          </span>
        </div>

      </div>

    </div>
  `;

  // Initialize 2.5D Isometric Arena Viewport
  const viewportEl = container.querySelector('#arena-viewport-25d');
  if (viewportEl) {
    arenaRenderer.init(viewportEl, { element: biome.element });
  }

  // Attach button event listeners
  const btnPrev = container.querySelector('#btn-prev-stage');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      try {
        if (gameState.state.madnessZone.stage > 1) {
          gameState.setStage(gameState.state.madnessZone.stage - 1);
          renderMadnessView(container);
        }
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const btnNext = container.querySelector('#btn-next-stage');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      try {
        if (gameState.state.madnessZone.stage < gameState.state.madnessZone.highestStageUnlocked) {
          gameState.setStage(gameState.state.madnessZone.stage + 1);
          renderMadnessView(container);
        }
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const btnTrials = container.querySelector('#btn-trials-shortcut');
  if (btnTrials) {
    btnTrials.addEventListener('click', () => {
      document.querySelector('[data-tab="trials"]')?.click();
    });
  }

  container.querySelectorAll('#btn-unlock-next-floor').forEach(btn => {
    btn.addEventListener('click', () => {
      try {
        gameState.unlockAndEnterStage(nextStageNum);
        renderMadnessView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  const btnEngage = container.querySelector('#btn-toggle-engage');
  if (btnEngage) {
    btnEngage.addEventListener('click', () => {
      gameState.toggleMadnessEngagement();
      renderMadnessView(container);
    });
  }

  const btnAuto = container.querySelector('#btn-toggle-advance');
  if (btnAuto) {
    btnAuto.addEventListener('click', () => {
      gameState.toggleAutoAdvance();
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

  // Combat Sound Toggle
  const btnCombatSound = container.querySelector('#btn-combat-sound');
  if (btnCombatSound) {
    btnCombatSound.textContent = audioManager.isMuted ? '🔇' : '🔊';
    btnCombatSound.addEventListener('click', () => {
      audioManager.toggleMute();
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
      spawnCombatNumber(container, res.damage, 'crit');

      // Visual attack animation for party members and enemy hit flash
      const leadEnemySlot = container.querySelector('.enemy-swarm-slot:not(.enemy-defeated)');
      if (leadEnemySlot) {
        leadEnemySlot.classList.remove('enemy-hit-flash');
        void leadEnemySlot.offsetWidth;
        leadEnemySlot.classList.add('enemy-hit-flash');
      }

      container.querySelectorAll('.spirit-formation-slot.slot-active').forEach(slot => {
        slot.classList.remove('lunge-attack');
        void slot.offsetWidth;
        slot.classList.add('lunge-attack');
      });

      updateMadnessCombatTick(container);

      if (res.killed) {
        setTimeout(() => {
          if (document.querySelector('.madness-container')) {
            renderMadnessView(container);
          }
        }, 250);
      }
    });
  }

  // Formation Auto-Align button
  const btnAutoAlign = container.querySelector('#btn-madness-auto-align');
  if (btnAutoAlign) {
    btnAutoAlign.addEventListener('click', (e) => {
      e.stopPropagation();
      gameState.autoFormatParty();
      selectedMadnessSlot = null;
      safePlaySfx('upgrade');
      showCombatBanner(container, '⚡ Squad auto-aligned to optimal formation!', 'victory');
      renderMadnessView(container);
    });
  }

  // Interactive 3x3 Tile Tap-to-Swap
  container.querySelectorAll('[data-formation-slot]').forEach(tile => {
    tile.addEventListener('click', (e) => {
      if (e.target.closest('.overhead-inspect-btn')) return;

      const slotId = tile.getAttribute('data-formation-slot');
      if (!slotId) return;

      if (!selectedMadnessSlot) {
        selectedMadnessSlot = slotId;
        safePlaySfx('click');
        renderMadnessView(container);
      } else if (selectedMadnessSlot === slotId) {
        selectedMadnessSlot = null;
        safePlaySfx('click');
        renderMadnessView(container);
      } else {
        try {
          gameState.swapFormationSlots(selectedMadnessSlot, slotId);
          selectedMadnessSlot = null;
          safePlaySfx('click');
          renderMadnessView(container);
        } catch (err) {
          showCombatBanner(container, `⚠️ ${err.message}`, 'wipe');
          selectedMadnessSlot = null;
          renderMadnessView(container);
        }
      }
    });
  });

  // Spirit Quick Inspect Modal
  container.querySelectorAll('.overhead-inspect-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const spiritId = btn.getAttribute('data-inspect-spirit');
      const spirit = gameState.state.spirits.find(s => s.id === spiritId);
      if (spirit) {
        showSpiritModal(spirit, () => renderMadnessView(container));
      }
    });
  });

  // Hook global combat listeners once with strict container guard
  if (!isEventsBound) {
    isEventsBound = true;
    gameState.subscribe((eventType, payload) => {
      if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return;
      const currentContainer = document.querySelector('#view-container');
      if (!currentContainer) return;
      // STRICT GUARD: Do not hijack screen if user navigated away from Madness Zone!
      const hasMadnessContainer = !!currentContainer.querySelector('.madness-container');
      if (!hasMadnessContainer) return;

      if (eventType === 'ultimateCast') {
        const role = payload.spirit?.role;
        const bannerType = role === 'TANK' ? 'wipe' : 'ult';
        const roleIcon = role === 'TANK' ? '🛡️' : (role === 'HEALER' ? '💚' : '✨');
        showCombatBanner(currentContainer, `${roleIcon} ${payload.spirit.customName} casts ${payload.ult.name}!`, bannerType);
        arenaRenderer.triggerUltimatePulse('#ffd700');
        if (payload.totalDamageDealt > 0) {
          const critText = payload.isCrit ? 'CRIT ' : '';
          spawnCombatNumber(currentContainer, `${critText}${payload.totalDamageDealt} ULT!`, 'ult');
          arenaRenderer.spawnDamagePopup(null, null, payload.totalDamageDealt, true);
        }
        if (payload.totalHealingDone > 0) {
          spawnCombatNumber(currentContainer, `+${payload.totalHealingDone} HP`, 'heal');
        }
        if (payload.tauntActivated) {
          spawnCombatNumber(currentContainer, `TAUNT LOCK (6s)!`, 'heal');
        }
      } else if (eventType === 'enemyCounterAttack') {
        if (payload.isTauntedTarget) {
          spawnCombatNumber(currentContainer, `TAUNTED! -${payload.damage}`, 'enemy-hit');
        } else if (payload.defMitigated > 0) {
          spawnCombatNumber(currentContainer, `-${payload.damage} (DEF -${payload.defMitigated})`, 'enemy-hit');
        } else {
          spawnCombatNumber(currentContainer, `-${payload.damage}`, 'enemy-hit');
        }
      } else if (eventType === 'spiritEvaded') {
        spawnCombatNumber(currentContainer, `DODGE!`, 'heal');
      } else if (eventType === 'partyWiped') {
        showCombatBanner(currentContainer, '💀 PARTY WIPED! Regrouping at Wave 1 with 100% HP restored...', 'wipe');
        setTimeout(() => {
          if (typeof document !== 'undefined' && document.querySelector && document.querySelector('.madness-container')) {
            renderMadnessView(currentContainer);
          }
        }, 800);
      } else if (eventType === 'floorCleared') {
        showCombatBanner(currentContainer, `🏆 FLOOR ${payload.stage} CLEARED! Party fully restored!`, 'victory');
        setTimeout(() => {
          if (typeof document !== 'undefined' && document.querySelector && document.querySelector('.madness-container')) {
            renderMadnessView(currentContainer);
          }
        }, 800);
      }
    });
  }
}

/**
 * Creates floating bouncing combat text (damage, crit, heal, ult, enemy damage)
 */
function spawnCombatNumber(container, text, type = 'dmg') {
  const layer = container.querySelector('#damage-popup-layer');
  if (!layer) return;

  const dmgEl = document.createElement('div');
  dmgEl.className = `floating-dmg-popup ${type}`;
  dmgEl.textContent = text;

  const offsetX = (Math.random() - 0.5) * 80;
  const offsetY = (Math.random() - 0.5) * 30;
  dmgEl.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

  layer.appendChild(dmgEl);

  setTimeout(() => {
    if (dmgEl.parentNode) dmgEl.parentNode.removeChild(dmgEl);
  }, 850);
}

/**
 * Shows temporary glowing alert banner at top of battlefield
 */
function showCombatBanner(container, text, type = 'ult') {
  const layer = container.querySelector('#combat-banner-layer');
  if (!layer) return;

  const banner = document.createElement('div');
  banner.className = `combat-alert-banner ${type}-banner`;
  banner.textContent = text;

  layer.appendChild(banner);

  setTimeout(() => {
    if (banner.parentNode) banner.parentNode.removeChild(banner);
  }, 2200);
}

/**
 * Fast-update helper to update health/mana bars and swarm without tearing down DOM elements.
 * Uses cached element handles and dirty-checking to prevent layout thrashing and allocation churn.
 */
export function updateMadnessCombatTick(container) {
  const mz = gameState.state.madnessZone;
  const swarm = mz.currentSwarm || [];
  const partySpirits = gameState.getPartySpirits();

  // 1. Update Allied Spirits HP/MP/Shields
  partySpirits.forEach((spirit, idx) => {
    if (!spirit) return;
    const slot = container.querySelector(`#allied-slot-${idx}`);
    if (!slot) return;

    const hpFill = slot.querySelector('.hud-hp-fill');
    const shieldFill = slot.querySelector('.hud-shield-fill');
    const mpFill = slot.querySelector('.hud-mp-fill');
    const tauntTag = slot.querySelector('.taunt-active-tag');

    const maxHp = spirit.maxHp || 100;
    const curHp = typeof spirit.currentHp === 'number' ? spirit.currentHp : maxHp;
    const hpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));
    const mpPct = Math.max(0, Math.min(100, Math.round(spirit.currentMp || 0)));
    const isUltReady = mpPct >= 100;
    const isFallen = spirit.isFallen || curHp <= 0;
    const isTaunting = (spirit.tauntTimer || 0) > 0;

    // Dirty-check style width changes to avoid triggering layout recalculations
    if (hpFill && slot._lastHpPct !== hpPct) {
      hpFill.style.width = `${hpPct}%`;
      slot._lastHpPct = hpPct;
    }
    if (mpFill && slot._lastMpPct !== mpPct) {
      mpFill.style.width = `${mpPct}%`;
      slot._lastMpPct = mpPct;
    }
    if (shieldFill) {
      const shieldPct = spirit.shieldHp > 0 ? Math.min(100, Math.round((spirit.shieldHp / maxHp) * 100)) : 0;
      if (slot._lastShieldPct !== shieldPct) {
        shieldFill.style.width = `${shieldPct}%`;
        slot._lastShieldPct = shieldPct;
      }
    }

    if (slot._lastUltReady !== isUltReady) {
      slot.classList.toggle('ult-ready', isUltReady);
      slot._lastUltReady = isUltReady;
    }

    if (slot._lastFallen !== isFallen) {
      slot.classList.toggle('spirit-fallen', isFallen);
      slot._lastFallen = isFallen;
    }

    if (slot._lastTaunting !== isTaunting) {
      slot.classList.toggle('taunt-active', isTaunting);
      if (tauntTag) {
        tauntTag.style.display = isTaunting ? 'block' : 'none';
      }
      slot._lastTaunting = isTaunting;
    }
  });

  // 2. Update Swarm Enemies HP
  swarm.forEach((em, sIdx) => {
    if (!em) return;
    const slot = container.querySelector(`#enemy-slot-${sIdx}`);
    if (!slot) return;

    const hpFill = slot.querySelector('.seamless-enemy-hp-fill');
    const isDead = em.isDefeated || em.hp <= 0;
    const emHpPct = Math.max(0, Math.min(100, Math.round((em.hp / em.maxHp) * 100)));

    if (hpFill && slot._lastEmHpPct !== emHpPct) {
      hpFill.style.width = `${emHpPct}%`;
      slot._lastEmHpPct = emHpPct;
    }

    if (isDead && !slot._isMarkedDead) {
      slot.classList.add('enemy-defeated');
      slot._isMarkedDead = true;
    }
  });
}

/**
 * Renders an individual seamless spirit on the Madness battlefield.
 * Only the animated asset, name, and level are shown. No card boxes, no borders, no empty slots.
 */
function renderSeamlessMadnessSpirit(slotId, slotData, partySpirits) {
  const spirit = slotData?.spirit;
  if (!spirit) return ''; // Empty slots are omitted completely!

  const idx = partySpirits.findIndex(s => s && s.id === spirit.id);
  const species = SPIRIT_SPECIES[spirit.speciesId];
  const maxHp = spirit.maxHp || 100;
  const curHp = typeof spirit.currentHp === 'number' ? spirit.currentHp : maxHp;
  const hpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));
  const mpPct = Math.max(0, Math.min(100, Math.round(spirit.currentMp || 0)));
  const isUltReady = mpPct >= 100;
  const isFallen = spirit.isFallen || curHp <= 0;
  const shieldPct = spirit.shieldHp > 0 ? Math.min(100, Math.round((spirit.shieldHp / maxHp) * 100)) : 0;
  const isTaunting = (spirit.tauntTimer || 0) > 0;
  const sheetKey = getSheetKeyForSpecies(species ? species.id : null);
  const glyph = species ? (species.avatarEmoji || '✨') : '✨';
  const isSelected = selectedMadnessSlot === slotId;

  return `
    <div class="spirit-formation-slot seamless-battle-spirit ${isUltReady ? 'ult-ready' : ''} ${isFallen ? 'spirit-fallen' : ''} ${isTaunting ? 'taunt-active' : ''} ${isSelected ? 'seamless-slot-selected' : ''}" 
         id="allied-slot-${idx >= 0 ? idx : slotId}" 
         data-formation-slot="${slotId}" 
         data-spirit-id="${spirit.id}" 
         style="grid-row: ${slotId[1] || '1'};"
         title="${spirit.customName} [${slotId.toUpperCase()}] • Lv.${spirit.level}">

      <!-- Name & Level Only (Seamless Overhead) -->
      <div class="seamless-overhead-tag">
        <span class="seamless-spirit-name" title="${spirit.customName}">${spirit.customName}</span>
        <span class="seamless-spirit-level">Lv.${spirit.level}</span>
      </div>

      <!-- Animated Creature Asset Only (No Card Box, No Border) -->
      <div class="spirit-sprite-container seamless-sprite-container">
        <div class="taunt-active-tag" style="display: ${isTaunting ? 'block' : 'none'};">🛡️ TAUNT</div>
        <div class="animated-pixel-sprite sprite-${sheetKey}" style="--sprite-sheet: url('/assets/sprites/creatures/${sheetKey}.svg');">
          <div class="sprite-frame-viewer"></div>
          <span class="core-glyph-fallback" style="display: none;">${glyph}</span>
        </div>
        ${isUltReady ? `<div class="ult-ready-tag" id="ult-ready-tag-${idx}">✨ ULT</div>` : ''}
        ${isFallen ? '<div class="fallen-badge">KO</div>' : ''}
        <div class="combat-ground-shadow"></div>
      </div>

      <!-- Slim Floating HP & MP Bars -->
      <div class="spirit-hud-bars seamless-hud-bars">
        <div class="hud-bar-hp" title="${curHp}/${maxHp} HP ${spirit.shieldHp > 0 ? `(+${spirit.shieldHp} Shield)` : ''}">
          <div class="hud-hp-fill" id="spirit-hp-fill-${idx}" style="width: ${hpPct}%;"></div>
          ${shieldPct > 0 ? `<div class="hud-shield-fill" id="spirit-shield-fill-${idx}" style="width: ${shieldPct}%;"></div>` : ''}
        </div>
        <div class="hud-bar-mp" title="${mpPct}/100 MP">
          <div class="hud-mp-fill" id="spirit-mp-fill-${idx}" style="width: ${mpPct}%;"></div>
        </div>
      </div>

    </div>
  `;
}
