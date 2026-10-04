/**
 * Artifact Dungeon: The Pantheon Trials View
 * Dedicated UI for farming Greek God Relics & Weapons
 */

import { gameState } from '../../state/gameState.js';
import { audioManager } from '../../audio/audioManager.js';
import { PANTHEON_CHAMBERS, PANTHEON_DIFFICULTY_TIERS } from '../../data/artifactDungeonData.js';
import { GREEK_GOD_SETS, EQUIPMENT_RARITIES } from '../../data/equipmentData.js';
import { createSpiritPlaceholderBox, createEnemyPlaceholderBox } from '../components/pixelBox.js';
import { SPIRIT_SPECIES, getRarityInfo } from '../../data/spiritsData.js';

let selectedChamberId = 'underworld_crypt';
let selectedTierNum = 1;

export function renderDungeonView(container) {
  const battle = gameState.state.activeDungeonBattle;
  if (battle && battle.dungeonType === 'pantheon') {
    renderPantheonBattleArena(container, battle);
    return;
  }

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
        audioManager.playBgm('battle');
        gameState.startDungeonTrial('pantheon', selectedChamberId, selectedTierNum);
        renderDungeonView(container);
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

function renderPantheonBattleArena(container, battle) {
  const chamber = PANTHEON_CHAMBERS.find(c => c.id === battle.chamberId) || PANTHEON_CHAMBERS[0];
  const tier = PANTHEON_DIFFICULTY_TIERS.find(t => t.tier === battle.tier) || PANTHEON_DIFFICULTY_TIERS[0];
  const party = gameState.getPartySpirits();
  const swarm = battle.currentSwarm || [];
  const godName = chamber.god || chamber.godTitle || (chamber.godId && GREEK_GOD_SETS[chamber.godId] ? GREEK_GOD_SETS[chamber.godId].god : null) || chamber.name;

  container.innerHTML = `
    <div class="pantheon-container trial-battle-container">
      
      <!-- Top Trial Combat HUD Header -->
      <div class="combat-top-hud" style="border-bottom: 2px solid ${chamber.color};">
        <div class="combat-hud-left">
          <button id="btn-trial-flee" class="zone-btn-sm" style="background: rgba(231, 76, 60, 0.2); border-color: #e74c3c; color: #ff7675;">
            ◀ Flee
          </button>
        </div>

        <div class="combat-vs-banner">
          <span class="vs-ally-tag" style="background: ${chamber.color}; color: #000; font-weight: 800;">
            ${chamber.sigil} ${chamber.name}
          </span>
          <span class="vs-center-tag" style="background: #f1c40f; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 900;">
            WAVE ${battle.currentWave}/3
          </span>
          <span class="vs-enemy-tag">
            ${battle.currentWave === 3 ? `AVATAR: ${godName}` : 'GUARDIANS'}
          </span>
        </div>

        <div class="combat-hud-right">
          <span class="hud-speed-btn" style="background: rgba(0,0,0,0.5); font-size: 11px;">⚡ ${tier.energyCost}</span>
        </div>
      </div>

      <!-- Combat Banner & Floating Layer -->
      <div id="trial-combat-banner" class="combat-banner-layer"></div>
      <div id="damage-popup-layer" class="damage-popup-layer"></div>

      <!-- Dynamic Isometric Battlefield Area -->
      <div class="isometric-battlefield pantheon-battlefield">
        
        <!-- Left Side: Staggered Allied Spirit Formation -->
        <div class="allied-formation-column">
          <div class="formation-header-label">ALLIED SPIRIT LINEUP</div>
          
          <div class="staggered-party-formation">
            ${party.map((spirit, idx) => {
              const species = SPIRIT_SPECIES[spirit.speciesId];
              const rarity = getRarityInfo(spirit.rarity || (species ? species.baseRarity : 'COMMON'));
              const maxHp = spirit.maxHp || 100;
              const curHp = typeof spirit.currentHp === 'number' ? Math.max(0, spirit.currentHp) : maxHp;
              const hpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));
              const mpPct = Math.max(0, Math.min(100, Math.round(spirit.currentMp || 0)));
              const isUltReady = mpPct >= 100;
              const isFallen = spirit.isFallen || curHp <= 0;
              const shieldPct = spirit.shieldHp > 0 ? Math.min(100, Math.round((spirit.shieldHp / maxHp) * 100)) : 0;

              return `
                <div class="spirit-formation-slot slot-active ${isUltReady ? 'ult-ready' : ''} ${isFallen ? 'spirit-fallen' : ''}" id="trial-allied-slot-${idx}" style="--stagger-offset: ${(idx % 2) * 12}px;">
                  <div class="overhead-status-bar">
                    <span class="overhead-rarity" style="color: ${rarity.color}; border-color: ${rarity.border}; background: ${rarity.bg};">
                      ${rarity.name.toUpperCase()}
                    </span>
                    <span class="overhead-level">Lv.${spirit.level}</span>
                  </div>

                  <div class="spirit-sprite-container">
                    ${createSpiritPlaceholderBox(spirit, { boxClass: 'formation-spirit-box' })}
                    ${isUltReady ? '<div class="ult-ready-tag">✨ ULT READY</div>' : ''}
                    ${isFallen ? '<div class="fallen-badge">KO</div>' : ''}
                    <div class="combat-ground-shadow"></div>
                  </div>

                  <div class="spirit-hud-bars">
                    <div class="hud-bar-hp" title="${curHp}/${maxHp} HP">
                      <div class="hud-hp-fill" id="trial-spirit-hp-fill-${idx}" style="width: ${hpPct}%;"></div>
                      ${shieldPct > 0 ? `<div class="hud-shield-fill" style="width: ${shieldPct}%;"></div>` : ''}
                    </div>
                    <div class="hud-bar-mp" title="${mpPct}/100 MP">
                      <div class="hud-mp-fill" id="trial-spirit-mp-fill-${idx}" style="width: ${mpPct}%;"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Center Combat Clash Point -->
        <div class="combat-clash-divider">
          <div class="clash-sparks-icon">⚔️</div>
        </div>

        <!-- Right Side: Wave Enemies -->
        <div class="enemy-formation-column">
          <div class="formation-header-label" style="color: #ff6b81;">
            ${battle.currentWave === 3 ? `👑 AVATAR OF ${godName.toUpperCase()}` : `DIVINE ATTENDANTS (${swarm.filter(e => !e.isDefeated && e.hp > 0).length}/${swarm.length})`}
          </div>

          <div class="enemy-swarm-wrapper" id="trial-enemy-swarm-wrapper">
            ${swarm.map((em, sIdx) => {
              const isDead = em.isDefeated || em.hp <= 0;
              const maxHp = em.maxHp || 100;
              const curHp = typeof em.hp === 'number' ? Math.max(0, em.hp) : maxHp;
              const emHpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));

              return `
                <div class="enemy-swarm-slot ${em.isBoss ? 'boss-slot' : ''} ${isDead ? 'enemy-defeated' : ''}" id="trial-enemy-slot-${sIdx}" style="--swarm-stagger: ${(sIdx % 2) * 8}px;">
                  <div class="enemy-overhead-card">
                    <div class="enemy-name-row">
                      <span class="enemy-name-label">${em.name}</span>
                      ${em.isBoss ? '<span class="boss-crown-badge">👑 GOD AVATAR</span>' : ''}
                    </div>
                    <div class="enemy-pwr-label">⚡ ${(em.power || 0).toLocaleString()} PWR</div>

                    <div class="enemy-hp-track">
                      <div id="trial-enemy-hp-fill-${sIdx}" class="enemy-hp-fill" style="width: ${emHpPct}%;"></div>
                      <div id="trial-enemy-hp-text-${sIdx}" class="enemy-hp-text">
                        ${Math.ceil(curHp).toLocaleString()} / ${maxHp.toLocaleString()} HP
                      </div>
                    </div>
                  </div>

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

      <!-- Action Strike Command Strip -->
      <div class="combat-action-footer">
        <button id="btn-trial-strike" class="btn-main-attack" style="background: linear-gradient(135deg, ${chamber.color}, ${chamber.accentColor});">
          <span>⚔️ Divine Strike (Party Attack • Charges +10 MP)</span>
          <span class="btn-subtext">Clear Wave ${battle.currentWave}/3 to claim targeted ${godName} Relics</span>
        </button>
      </div>

    </div>
  `;

  // Attach Flee listener
  const btnFlee = container.querySelector('#btn-trial-flee');
  if (btnFlee) {
    btnFlee.addEventListener('click', () => {
      gameState.exitDungeonBattle();
      renderDungeonView(container);
    });
  }

  // Attach Strike listener
  const btnStrike = container.querySelector('#btn-trial-strike');
  if (btnStrike) {
    btnStrike.addEventListener('click', () => {
      gameState.manualDungeonStrike();
      renderDungeonView(container);
    });
  }

  // Check victory / defeat modal triggers
  if (battle.status === 'victory' && battle.loot) {
    showDungeonVictoryModal(battle.loot, () => {
      gameState.exitDungeonBattle();
      renderDungeonView(container);
    });
  } else if (battle.status === 'defeat') {
    showPantheonDefeatModal(() => {
      gameState.exitDungeonBattle();
      renderDungeonView(container);
    });
  }
}

function showPantheonDefeatModal(onClose) {
  const modalRoot = document.querySelector('#modal-root');
  if (!modalRoot) return;

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';

  modalEl.innerHTML = `
    <div class="pantheon-victory-modal" style="border: 2px solid #e74c3c;">
      <div class="victory-header" style="background: linear-gradient(135deg, rgba(231, 76, 60, 0.4), #000);">
        <div class="victory-sigil">💀</div>
        <div class="victory-title-col">
          <span class="victory-sub" style="color: #ff7675;">DIVINE TRIAL FAILED</span>
          <h3 class="victory-name">Party Wiped in Sanctum</h3>
          <span class="victory-tier-tag">Regroup and upgrade your spirits before challenging this god again</span>
        </div>
      </div>

      <div class="victory-body">
        <button id="btn-trial-defeat-ok" class="btn-claim-dungeon-loot" style="background: #34495e;">
          Return Safely
        </button>
      </div>
    </div>
  `;

  modalRoot.appendChild(modalEl);
  modalEl.querySelector('#btn-trial-defeat-ok').addEventListener('click', () => {
    modalRoot.removeChild(modalEl);
    if (onClose) onClose();
  });
}
