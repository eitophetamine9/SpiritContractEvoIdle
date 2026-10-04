/**
 * The Divine Forge View
 * Dedicated screen for farming 6 weapon archetypes (Blades, Bows, Staves, Claws, Daggers, Mallets)
 * across 4 difficulty tiers through 3-wave forge combat trials.
 */

import { gameState } from '../../state/gameState.js';
import { audioManager } from '../../audio/audioManager.js';
import { FORGE_CHAMBERS, FORGE_DIFFICULTY_TIERS } from '../../data/weaponDungeonData.js';
import { EQUIPMENT_RARITIES } from '../../data/equipmentData.js';

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
      <div class="combat-hud-top" style="border-bottom: 2px solid ${chamber.color};">
        <button id="btn-forge-flee" class="zone-btn-sm" style="background: rgba(231, 76, 60, 0.2); border-color: #e74c3c; color: #ff7675;">
          ◀ Flee Forge
        </button>

        <div class="combat-vs-banner">
          <span class="vs-ally-tag" style="background: ${chamber.color}; color: #000; font-weight: 800;">
            ${chamber.name}
          </span>
          <span class="vs-center-tag" style="background: #f39c12; color: #000; padding: 3px 8px; border-radius: 4px; font-weight: 900;">
            WAVE ${battle.currentWave} / 3
          </span>
          <span class="vs-enemy-tag">
            ${battle.currentWave === 3 ? `BOSS: ${chamber.bossName}` : 'FORGE GUARDIANS'}
          </span>
        </div>

        <span class="loot-badge" style="background: rgba(0,0,0,0.5);">⚡ ${tier.energyCost} Spent</span>
      </div>

      <!-- Combat Banner & Floating Layer -->
      <div id="forge-combat-banner" class="combat-event-banner" style="display: none;"></div>
      <div id="damage-popup-layer" class="damage-popup-layer"></div>

      <!-- Dynamic Battlefield Area -->
      <div class="isometric-battleground">
        
        <!-- Left Wing: Active Party Formation -->
        <div class="battlefield-wing allies-wing">
          <div class="wing-formation-grid">
            ${party.map((spirit, idx) => {
              const hpPct = Math.round((spirit.currentHp / spirit.maxHp) * 100);
              const mpPct = Math.round(((spirit.currentMp || 0) / (spirit.maxMp || 100)) * 100);
              const isLead = idx === 0;

              return `
                <div class="spirit-formation-slot slot-active ${isLead ? 'slot-lead' : ''} ${spirit.isFallen ? 'slot-fallen' : ''}">
                  <div class="slot-avatar-container">
                    <span class="slot-spirit-sprite">${spirit.speciesId === 'cat_spirit' ? '🐱' : '🐾'}</span>
                    ${spirit.shieldHp > 0 ? `<div class="spirit-shield-aura">🛡️ +${spirit.shieldHp}</div>` : ''}
                  </div>

                  <div class="slot-combat-bars">
                    <div class="slot-hp-bar">
                      <div class="slot-hp-fill" style="width: ${hpPct}%;"></div>
                      <span class="slot-bar-text">${spirit.currentHp}/${spirit.maxHp}</span>
                    </div>

                    <div class="slot-mp-bar">
                      <div class="slot-mp-fill" style="width: ${mpPct}%;"></div>
                      <span class="slot-bar-text">${spirit.currentMp || 0}/100 MP</span>
                    </div>
                  </div>

                  <span class="slot-name-tag">${spirit.customName}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right Wing: Wave Enemies -->
        <div class="battlefield-wing enemies-wing">
          <div class="wing-formation-grid enemy-formation-grid">
            ${swarm.map((enemy, idx) => {
              const isDefeated = enemy.isDefeated || enemy.hp <= 0;
              const hpPct = Math.round((enemy.hp / enemy.maxHp) * 100);

              return `
                <div class="enemy-swarm-slot ${isDefeated ? 'enemy-defeated' : ''} ${enemy.isBoss ? 'enemy-boss-slot' : ''}">
                  <div class="slot-avatar-container">
                    <span class="slot-enemy-sprite">${enemy.icon}</span>
                    ${enemy.isBoss ? '<span class="boss-crown-badge">👑 FORGE TITAN</span>' : ''}
                  </div>

                  <div class="slot-combat-bars">
                    <div class="slot-hp-bar enemy-hp-bar">
                      <div class="slot-hp-fill enemy-hp-fill" style="width: ${hpPct}%;"></div>
                      <span class="slot-bar-text">${Math.round(enemy.hp)}/${enemy.maxHp} HP</span>
                    </div>
                  </div>

                  <span class="slot-name-tag enemy-name-tag">${enemy.name}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- Action Strike Command Strip -->
      <div class="combat-action-footer">
        <button id="btn-forge-strike" class="btn-main-attack" style="background: linear-gradient(135deg, #c0392b, #d35400);">
          <span>⚔️ Forge Strike (Party Attack • Charges +10 MP)</span>
          <span class="btn-subtext">Defeat Wave ${battle.currentWave}/3 to claim targeted weapons</span>
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
