import { gameState, ENERGY_ENTRY_COST } from '../../state/gameState.js';
import { getBiomeForStage } from '../../data/biomesData.js';
import { getRarityInfo, SPIRIT_SPECIES } from '../../data/spiritsData.js';
import { createEnemyPlaceholderBox, createSpiritPlaceholderBox } from '../components/pixelBox.js';
import { audioManager } from '../../audio/audioManager.js';
import { arenaRenderer } from '../../render/arenaRenderer.js';

let isPaused = false;
let battleSpeed = 1; // 1 or 2
let isEventsBound = false;

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

        <!-- Left Side: Staggered Allied Spirit Formation with HP/MP Bars -->
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
              const maxHp = spirit.maxHp || 100;
              const curHp = typeof spirit.currentHp === 'number' ? spirit.currentHp : maxHp;
              const hpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));
              const mpPct = Math.max(0, Math.min(100, Math.round(spirit.currentMp || 0)));
              const isUltReady = mpPct >= 100;
              const isFallen = spirit.isFallen || curHp <= 0;
              const shieldPct = spirit.shieldHp > 0 ? Math.min(100, Math.round((spirit.shieldHp / maxHp) * 100)) : 0;

              return `
                <div class="spirit-formation-slot slot-active ${isUltReady ? 'ult-ready' : ''} ${isFallen ? 'spirit-fallen' : ''}" id="allied-slot-${idx}" style="--stagger-offset: ${(idx % 2) * 12}px;">
                  
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
                    ${isUltReady ? '<div class="ult-ready-tag" id="ult-ready-tag-' + idx + '">✨ ULT READY</div>' : ''}
                    ${isFallen ? '<div class="fallen-badge">KO</div>' : ''}
                    <div class="combat-ground-shadow"></div>
                  </div>

                  <!-- Dual HP / MP Bars -->
                  <div class="spirit-hud-bars">
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
            }).join('')}
          </div>
        </div>

        <!-- Center Combat Clash Point (Animations / Particles) -->
        <div class="combat-clash-divider">
          <div class="clash-sparks-icon">⚔️</div>
        </div>

        <!-- Right Side: Corrupted Swarm Formation -->
        <div class="enemy-formation-column">
          <div class="formation-header-label" style="color: #ff6b81;">
            ${swarm.some(e => e.isBoss) ? '⚠️ OVERLORD SWARM' : `CORRUPTED SWARM (${livingEnemiesCount}/${swarm.length})`}
          </div>

          <div class="enemy-swarm-wrapper" id="enemy-swarm-wrapper">
            ${swarm.map((em, sIdx) => {
              const isDead = em.isDefeated || em.hp <= 0;
              const emHpPct = Math.max(0, Math.min(100, Math.round((em.hp / em.maxHp) * 100)));
              return `
                <div class="enemy-swarm-slot ${em.isBoss ? 'boss-slot' : ''} ${isDead ? 'enemy-defeated' : ''}" id="enemy-slot-${sIdx}" style="--swarm-stagger: ${(sIdx % 2) * 8}px;">
                  
                  <!-- Enemy Details & Health Bar -->
                  <div class="enemy-overhead-card">
                    <div class="enemy-name-row">
                      <span class="enemy-name-label">${em.name}</span>
                      ${em.isBoss ? '<span class="boss-crown-badge">👑 BOSS</span>' : ''}
                    </div>
                    <div class="enemy-pwr-label">⚡ ${em.power.toLocaleString()} PWR</div>

                    <div class="enemy-hp-track">
                      <div id="enemy-hp-fill-${sIdx}" class="enemy-hp-fill" style="width: ${emHpPct}%;"></div>
                      <div id="enemy-hp-text-${sIdx}" class="enemy-hp-text">
                        ${Math.ceil(em.hp).toLocaleString()} / ${em.maxHp.toLocaleString()} HP
                      </div>
                    </div>
                  </div>

                  <!-- Enemy Sprite Frame with Ground Shadow -->
                  <div class="enemy-sprite-container">
                    <div class="enemy-placeholder-frame">
                      ${createEnemyPlaceholderBox(em)}
                    </div>
                    <div class="combat-ground-shadow enemy-shadow"></div>
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
        showCombatBanner(currentContainer, `✨ ${payload.spirit.customName} casts ${payload.ult.name}!`, 'ult');
        arenaRenderer.triggerUltimatePulse('#ffd700');
        if (payload.totalDamageDealt > 0) {
          spawnCombatNumber(currentContainer, `${payload.totalDamageDealt} ULT!`, 'ult');
          arenaRenderer.spawnDamagePopup(null, null, payload.totalDamageDealt, true);
        }
        if (payload.totalHealingDone > 0) {
          spawnCombatNumber(currentContainer, `+${payload.totalHealingDone} HP`, 'heal');
        }
      } else if (eventType === 'enemyCounterAttack') {
        spawnCombatNumber(currentContainer, `-${payload.damage}`, 'enemy-hit');
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
 * Fast-update helper to update health/mana bars and swarm without tearing down DOM elements
 */
export function updateMadnessCombatTick(container) {
  const mz = gameState.state.madnessZone;
  const swarm = mz.currentSwarm || [];
  const partySpirits = gameState.getPartySpirits();

  // 1. Update Allied Spirits HP/MP/Shields
  partySpirits.forEach((spirit, idx) => {
    const hpFill = container.querySelector(`#spirit-hp-fill-${idx}`);
    const shieldFill = container.querySelector(`#spirit-shield-fill-${idx}`);
    const mpFill = container.querySelector(`#spirit-mp-fill-${idx}`);
    const slot = container.querySelector(`#allied-slot-${idx}`);

    if (slot && spirit) {
      const maxHp = spirit.maxHp || 100;
      const curHp = typeof spirit.currentHp === 'number' ? spirit.currentHp : maxHp;
      const hpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));
      const mpPct = Math.max(0, Math.min(100, Math.round(spirit.currentMp || 0)));
      const isUltReady = mpPct >= 100;
      const isFallen = spirit.isFallen || curHp <= 0;

      if (hpFill) hpFill.style.width = `${hpPct}%`;
      if (mpFill) mpFill.style.width = `${mpPct}%`;
      if (shieldFill) {
        const shieldPct = spirit.shieldHp > 0 ? Math.min(100, Math.round((spirit.shieldHp / maxHp) * 100)) : 0;
        shieldFill.style.width = `${shieldPct}%`;
      }

      if (isUltReady) {
        slot.classList.add('ult-ready');
      } else {
        slot.classList.remove('ult-ready');
      }

      if (isFallen) {
        slot.classList.add('spirit-fallen');
      } else {
        slot.classList.remove('spirit-fallen');
      }
    }
  });

  // 2. Update Swarm Enemies HP
  swarm.forEach((em, sIdx) => {
    const hpFill = container.querySelector(`#enemy-hp-fill-${sIdx}`);
    const hpText = container.querySelector(`#enemy-hp-text-${sIdx}`);
    const slot = container.querySelector(`#enemy-slot-${sIdx}`);

    if (slot && em) {
      const isDead = em.isDefeated || em.hp <= 0;
      const emHpPct = Math.max(0, Math.min(100, Math.round((em.hp / em.maxHp) * 100)));

      if (hpFill) hpFill.style.width = `${emHpPct}%`;
      if (hpText) hpText.textContent = `${Math.ceil(em.hp).toLocaleString()} / ${em.maxHp.toLocaleString()} HP`;

      if (isDead) {
        slot.classList.add('enemy-defeated');
      }
    }
  });
}
