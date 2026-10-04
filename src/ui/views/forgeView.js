/**
 * The Divine Forge View
 * Dedicated screen for farming 6 weapon archetypes (Blades, Bows, Staves, Claws, Daggers, Mallets)
 * across 4 difficulty tiers through 3-wave forge combat trials.
 */

import { gameState } from '../../state/gameState.js';
import { audioManager } from '../../audio/audioManager.js';
import { FORGE_CHAMBERS, FORGE_DIFFICULTY_TIERS } from '../../data/weaponDungeonData.js';
import { EQUIPMENT_RARITIES } from '../../data/equipmentData.js';
import { createSpiritPlaceholderBox, createEnemyPlaceholderBox } from '../components/pixelBox.js';
import { SPIRIT_SPECIES, getRarityInfo } from '../../data/spiritsData.js';

let selectedForgeChamberId = 'bladesmith_sanctum';
let selectedForgeTierNum = 1;

export function renderForgeView(container) {
  const battle = gameState.state.activeDungeonBattle;

  // If in active forge battle, render the combat arena
  if (battle && battle.dungeonType === 'forge') {
    renderForgeBattleArena(container, battle);
    return;
  }

  // Otherwise, render the Forge Chambers & Tier Selection stage
  renderForgeChambersStage(container);
}

function renderForgeChambersStage(container) {
  const state = gameState.state;
  const res = state.resources;
  const partyPower = gameState.getTotalPartyPower();
  const chamber = FORGE_CHAMBERS.find(c => c.id === selectedForgeChamberId) || FORGE_CHAMBERS[0];
  const tier = FORGE_DIFFICULTY_TIERS.find(t => t.tier === selectedForgeTierNum) || FORGE_DIFFICULTY_TIERS[0];

  const canAfford = res.energy >= tier.energyCost;
  const powerRatio = partyPower / Math.max(1, tier.minPartyPower);
  let powerClass = 'even';
  let powerText = '⚖️ Balanced Match';
  if (powerRatio >= 1.25) {
    powerClass = 'strong';
    powerText = '⚡ Overwhelming Mastery';
  } else if (powerRatio < 0.85) {
    powerClass = 'under';
    powerText = '⚠️ High Heat Danger';
  }

  container.innerHTML = `
    <div class="pantheon-container forge-container">
      
      <!-- Top Forge Hero Banner -->
      <div class="pantheon-hero-banner" style="border-bottom: 2px solid ${chamber.color};">
        <div class="pantheon-title-col">
          <div class="pantheon-header-tag" style="background: rgba(230, 126, 34, 0.2); color: #f39c12; border-color: #e67e22;">THE DIVINE FORGE</div>
          <h2 class="pantheon-title">Sacred Weapon Anvils</h2>
          <p class="pantheon-subtitle">Forge 6 legendary weapon archetypes by besting Vulcan automatons across 3 combat waves.</p>
        </div>

        <div class="pantheon-energy-badge">
          <span class="energy-icon">⚡</span>
          <span class="energy-numbers">${res.energy} / ${res.maxEnergy} Energy</span>
        </div>
      </div>

      <!-- Forge Chambers Selector Grid -->
      <div class="pantheon-chambers-grid forge-chambers-grid">
        ${FORGE_CHAMBERS.map(c => {
          const isSelected = c.id === selectedForgeChamberId;
          return `
            <button class="chamber-card ${isSelected ? 'selected' : ''}" data-forge-chamber="${c.id}" style="--chamber-color: ${c.color};">
              <div class="chamber-sigil" style="background: ${c.color}22; border-color: ${c.color};">
                ${c.icon}
              </div>
              <div class="chamber-info">
                <span class="chamber-name">${c.name}</span>
                <span class="chamber-god">${c.bossName}</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Active Selected Chamber Detail Stage -->
      <div class="chamber-active-stage" style="border: 2px solid ${chamber.color}; background: linear-gradient(180deg, ${chamber.color}15 0%, rgba(15, 12, 10, 0.95) 100%);">
        
        <div class="stage-header-row">
          <div class="stage-sigil-large" style="border-color: ${chamber.color}; text-shadow: 0 0 20px ${chamber.color};">
            ${chamber.icon}
          </div>
          <div class="stage-text-block">
            <h3 class="stage-name" style="color: ${chamber.accentColor};">${chamber.name}</h3>
            <span class="stage-god-title">${chamber.title}</span>
            <p class="stage-lore">${chamber.desc}</p>
          </div>
        </div>

        <!-- Tier Selector Row -->
        <div class="pantheon-tier-selector">
          <span class="tier-label">FORGE HEAT DIFFICULTY:</span>
          <div class="tier-buttons-row">
            ${FORGE_DIFFICULTY_TIERS.map(t => {
              const isTierActive = t.tier === selectedForgeTierNum;
              return `
                <button class="btn-tier-select ${isTierActive ? 'active' : ''}" data-forge-tier="${t.tier}">
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
            <span class="rec-power-tag">Required Power: ⚡ ${tier.minPartyPower.toLocaleString()}</span>
            <span class="party-power-tag ${powerClass}">Party Power: ⚡ ${partyPower.toLocaleString()} (${powerText})</span>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button id="btn-enter-forge-trial" class="btn-enter-trial" ${canAfford ? '' : 'disabled'} style="flex: 2; background: linear-gradient(135deg, ${chamber.color}, ${chamber.accentColor});">
              <span>⚔️ Enter 3-Wave Forge (${tier.energyCost} ⚡)</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Loot Preview & Guaranteed Drops Strip -->
      <div class="pantheon-loot-preview-strip">
        <span class="loot-preview-title">FORGE DROPS:</span>
        <div class="loot-pills-list">
          <span class="loot-badge">⚔️ ${tier.weaponDropCount}x Targeted ${chamber.name.split(' ')[0]} Weapons</span>
          <span class="loot-badge">💎 +${tier.shardsReward} Spirit Shards</span>
          <span class="loot-badge">🔮 +${tier.essenceReward} Soul Essence</span>
          <span class="loot-badge">🌊 3 Combat Waves (Boss: ${chamber.bossName})</span>
        </div>
      </div>

    </div>
  `;

  // Attach Chamber Card Selection listeners
  container.querySelectorAll('[data-forge-chamber]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedForgeChamberId = btn.getAttribute('data-forge-chamber');
      renderForgeView(container);
    });
  });

  // Attach Tier Selection listeners
  container.querySelectorAll('[data-forge-tier]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedForgeTierNum = parseInt(btn.getAttribute('data-forge-tier'), 10);
      renderForgeView(container);
    });
  });

  // Attach Enter 3-Wave Forge Trial listener
  const btnEnter = container.querySelector('#btn-enter-forge-trial');
  if (btnEnter) {
    btnEnter.addEventListener('click', () => {
      try {
        audioManager.playBgm('battle');
        gameState.startDungeonTrial('forge', selectedForgeChamberId, selectedForgeTierNum);
        renderForgeView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  }
}

function renderForgeBattleArena(container, battle) {
  const chamber = FORGE_CHAMBERS.find(c => c.id === battle.chamberId) || FORGE_CHAMBERS[0];
  const tier = FORGE_DIFFICULTY_TIERS.find(t => t.tier === battle.tier) || FORGE_DIFFICULTY_TIERS[0];
  const party = gameState.getPartySpirits();
  const swarm = battle.currentSwarm || [];

  container.innerHTML = `
    <div class="pantheon-container forge-battle-container">
      
      <!-- Top Trial Combat HUD Header -->
      <div class="combat-top-hud" style="border-bottom: 2px solid ${chamber.color};">
        <div class="combat-hud-left">
          <button id="btn-forge-flee" class="zone-btn-sm" style="background: rgba(231, 76, 60, 0.2); border-color: #e74c3c; color: #ff7675;">
            ◀ Flee
          </button>
        </div>

        <div class="combat-vs-banner">
          <span class="vs-ally-tag" style="background: ${chamber.color}; color: #000; font-weight: 800;">
            ${chamber.icon} ${chamber.name}
          </span>
          <span class="vs-center-tag" style="background: #e67e22; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 900;">
            WAVE ${battle.currentWave}/3
          </span>
          <span class="vs-enemy-tag">
            ${battle.currentWave === 3 ? `TITAN: ${chamber.bossName}` : 'FORGE GUARDIANS'}
          </span>
        </div>

        <div class="combat-hud-right">
          <span class="hud-speed-btn" style="background: rgba(0,0,0,0.5); font-size: 11px;">⚡ ${tier.energyCost}</span>
        </div>
      </div>

      <!-- Combat Banner & Floating Layer -->
      <div id="forge-combat-banner" class="combat-banner-layer"></div>
      <div id="damage-popup-layer" class="damage-popup-layer"></div>

      <!-- Dynamic Isometric Battlefield Area -->
      <div class="isometric-battlefield forge-battlefield">
        
        <!-- Left Side: Allied Spirit Formation -->
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
                <div class="spirit-formation-slot slot-active ${isUltReady ? 'ult-ready' : ''} ${isFallen ? 'spirit-fallen' : ''}" id="forge-allied-slot-${idx}" style="--stagger-offset: ${(idx % 2) * 12}px;">
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
                      <div class="hud-hp-fill" id="forge-spirit-hp-fill-${idx}" style="width: ${hpPct}%;"></div>
                      ${shieldPct > 0 ? `<div class="hud-shield-fill" style="width: ${shieldPct}%;"></div>` : ''}
                    </div>
                    <div class="hud-bar-mp" title="${mpPct}/100 MP">
                      <div class="hud-mp-fill" id="forge-spirit-mp-fill-${idx}" style="width: ${mpPct}%;"></div>
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
          <div class="formation-header-label" style="color: #ff9f43;">
            ${battle.currentWave === 3 ? `👑 ${chamber.bossName.toUpperCase()}` : `FORGE AUTOMATONS (${swarm.filter(e => !e.isDefeated && e.hp > 0).length}/${swarm.length})`}
          </div>

          <div class="enemy-swarm-wrapper" id="forge-enemy-swarm-wrapper">
            ${swarm.map((em, sIdx) => {
              const isDead = em.isDefeated || em.hp <= 0;
              const maxHp = em.maxHp || 100;
              const curHp = typeof em.hp === 'number' ? Math.max(0, em.hp) : maxHp;
              const emHpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));

              return `
                <div class="enemy-swarm-slot ${em.isBoss ? 'boss-slot' : ''} ${isDead ? 'enemy-defeated' : ''}" id="forge-enemy-slot-${sIdx}" style="--swarm-stagger: ${(sIdx % 2) * 8}px;">
                  <div class="enemy-overhead-card">
                    <div class="enemy-name-row">
                      <span class="enemy-name-label">${em.name}</span>
                      ${em.isBoss ? '<span class="boss-crown-badge">👑 FORGE TITAN</span>' : ''}
                    </div>
                    <div class="enemy-pwr-label">⚡ ${(em.power || 0).toLocaleString()} PWR</div>

                    <div class="enemy-hp-track">
                      <div id="forge-enemy-hp-fill-${sIdx}" class="enemy-hp-fill" style="width: ${emHpPct}%;"></div>
                      <div id="forge-enemy-hp-text-${sIdx}" class="enemy-hp-text">
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
        <button id="btn-forge-strike" class="btn-main-attack" style="background: linear-gradient(135deg, ${chamber.color}, #d35400);">
          <span>⚔️ Forge Strike (Party Attack • Charges +10 MP)</span>
          <span class="btn-subtext">Defeat Wave ${battle.currentWave}/3 to claim targeted ${chamber.name} Weapons</span>
        </button>
      </div>

    </div>
  `;

  // Attach Flee listener
  const btnFlee = container.querySelector('#btn-forge-flee');
  if (btnFlee) {
    btnFlee.addEventListener('click', () => {
      gameState.exitDungeonBattle();
      renderForgeView(container);
    });
  }

  // Attach Manual Strike listener
  const btnStrike = container.querySelector('#btn-forge-strike');
  if (btnStrike) {
    btnStrike.addEventListener('click', () => {
      gameState.manualDungeonStrike();
      renderForgeView(container);
    });
  }

  // Check if battle reached Victory or Defeat
  if (battle.status === 'victory' && battle.loot) {
    showForgeVictoryModal(battle.loot, () => {
      gameState.exitDungeonBattle();
      renderForgeView(container);
    });
  } else if (battle.status === 'defeat') {
    showForgeDefeatModal(() => {
      gameState.exitDungeonBattle();
      renderForgeView(container);
    });
  }
}

export function showForgeVictoryModal(loot, onClose) {
  const modalRoot = document.querySelector('#modal-root');
  if (!modalRoot) return;

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';

  modalEl.innerHTML = `
    <div class="pantheon-victory-modal" style="border: 2px solid #e67e22;">
      <div class="victory-header" style="background: linear-gradient(135deg, rgba(230, 126, 34, 0.4), #000);">
        <div class="victory-sigil">🔨</div>
        <div class="victory-title-col">
          <span class="victory-sub" style="color: #f39c12;">FORGE CONQUERED</span>
          <h3 class="victory-name">${loot.chamber.name} Cleared!</h3>
          <span class="victory-tier-tag">${loot.tier.name}</span>
        </div>
      </div>

      <div class="victory-body">
        <div class="spoils-section-header">TARGETED WEAPONS SMELTED:</div>

        <div class="awarded-items-grid">
          ${loot.weapons.map(w => {
            const rarObj = EQUIPMENT_RARITIES[w.rarity] || EQUIPMENT_RARITIES.COMMON;
            return `
              <div class="awarded-item-card" style="border: 1px solid ${rarObj.border}; background: rgba(20, 15, 12, 0.95);">
                <div class="item-header-row">
                  <span class="item-icon-frame">${w.icon}</span>
                  <div class="item-name-col">
                    <span class="item-name" style="color: ${rarObj.color};">${w.name}</span>
                    <span class="item-rarity-pill" style="color: ${rarObj.color};">${rarObj.name}</span>
                  </div>
                </div>
                <div class="item-stat-row">
                  <span class="stat-name">ATK Power:</span>
                  <span class="stat-val">+${w.atkPower}</span>
                </div>
                <div class="item-stat-row">
                  <span class="stat-name">Crit Rate:</span>
                  <span class="stat-val">+${w.critRate}%</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="victory-resources-row">
          <div class="res-reward-pill">
            <span class="res-icon">💎</span>
            <span class="res-amt">+${loot.shardsGained} Spirit Shards</span>
          </div>
          <div class="res-reward-pill">
            <span class="res-icon">🔮</span>
            <span class="res-amt">+${loot.essenceGained} Soul Essence</span>
          </div>
        </div>

        <button id="btn-claim-forge-loot" class="btn-claim-dungeon-loot" style="background: linear-gradient(135deg, #e67e22, #f39c12);">
          Claim Weapon Spoils & Return
        </button>
      </div>
    </div>
  `;

  modalRoot.appendChild(modalEl);

  modalEl.querySelector('#btn-claim-forge-loot').addEventListener('click', () => {
    modalRoot.removeChild(modalEl);
    if (onClose) onClose();
  });
}

function showForgeDefeatModal(onClose) {
  const modalRoot = document.querySelector('#modal-root');
  if (!modalRoot) return;

  const modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';

  modalEl.innerHTML = `
    <div class="pantheon-victory-modal" style="border: 2px solid #e74c3c;">
      <div class="victory-header" style="background: linear-gradient(135deg, rgba(231, 76, 60, 0.4), #000);">
        <div class="victory-sigil">💀</div>
        <div class="victory-title-col">
          <span class="victory-sub" style="color: #ff7675;">HEAT OVERLOAD</span>
          <h3 class="victory-name">Party Fallen in Forge</h3>
          <span class="victory-tier-tag">Regroup and upgrade equipment to endure the flames</span>
        </div>
      </div>

      <div class="victory-body">
        <button id="btn-forge-defeat-ok" class="btn-claim-dungeon-loot" style="background: #34495e;">
          Return Safely
        </button>
      </div>
    </div>
  `;

  modalRoot.appendChild(modalEl);
  modalEl.querySelector('#btn-forge-defeat-ok').addEventListener('click', () => {
    modalRoot.removeChild(modalEl);
    if (onClose) onClose();
  });
}
