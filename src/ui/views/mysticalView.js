/**
 * The Mystical Realm View
 * Dedicated Sanctum for:
 * 1) Sanctuary of the Gods (3-Wave Essence Dungeon farming)
 * 2) Energy Reservoir Expansion (Scales with 500 hard cap)
 * 3) Grand Astral EXP Potions (Direct spirit leveling)
 * 4) Primordial God Blessings (1-hour timed active buffs)
 * 5) Permanent Astral Resonance
 */

import { gameState } from '../../state/gameState.js';
import { audioManager } from '../../audio/audioManager.js';
import { ESSENCE_CHAMBERS, ESSENCE_DIFFICULTY_TIERS } from '../../data/essenceDungeonData.js';
import { createSpiritPlaceholderBox, createEnemyPlaceholderBox } from '../components/pixelBox.js';
import { SPIRIT_SPECIES } from '../../data/spiritsData.js';

let selectedEssenceChamberId = 'olympian_nexus';
let selectedEssenceTierNum = 1;
let activeRealmSection = 'dungeon'; // 'dungeon' | 'potions' | 'blessings' | 'energy'

export function renderMysticalView(container) {
  const battle = gameState.state.activeDungeonBattle;

  // If in active essence dungeon battle, render the combat arena
  if (battle && battle.dungeonType === 'essence') {
    renderEssenceBattleArena(container, battle);
    return;
  }

  renderMysticalSanctumScreen(container);
}

function renderMysticalSanctumScreen(container) {
  const state = gameState.state;
  const res = state.resources;
  const partyPower = gameState.getTotalPartyPower();
  const chamber = ESSENCE_CHAMBERS.find(c => c.id === selectedEssenceChamberId) || ESSENCE_CHAMBERS[0];
  const tier = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === selectedEssenceTierNum) || ESSENCE_DIFFICULTY_TIERS[0];

  const canAffordDungeon = res.energy >= tier.energyCost;
  const currentMaxEnergy = res.maxEnergy || 60;
  const energyIsCapped = currentMaxEnergy >= 500;
  const tierIndex = Math.floor((currentMaxEnergy - 60) / 20);
  const nextEnergyCostEssence = Math.round(15 * Math.pow(1.18, tierIndex));
  const nextEnergyCostSoul = tierIndex >= 5 ? Math.round(2 + tierIndex * 0.5) : 0;
  const canAffordEnergy = !energyIsCapped && (res.essencesOfTheGods || 0) >= nextEnergyCostEssence && (res.soulEssence || 0) >= nextEnergyCostSoul;

  const activeBlessings = gameState.getActiveBlessings();
  const partySpirits = gameState.getPartySpirits();

  container.innerHTML = `
    <div class="mystical-realm-container">
      
      <!-- Top Realm Hero Banner -->
      <div class="mystical-hero-banner">
        <div class="mystical-header-info">
          <div class="realm-badge-tag">SANCTUM OF THE DIVINE</div>
          <h2 class="realm-title">🌌 The Mystical Realm</h2>
          <p class="realm-subtitle">Channel Essences of the Gods, brew Grand Astral Elixirs, and invoke primordial blessings.</p>
        </div>

        <div class="realm-currency-strip">
          <div class="realm-cur-pill" title="Essences of the Gods">
            <span>💠 Gods:</span>
            <strong style="color: #00ffff;">${(res.essencesOfTheGods || 0).toLocaleString()}</strong>
          </div>
          <div class="realm-cur-pill" title="Soul Essence">
            <span>🔮 Soul:</span>
            <strong style="color: #9b59b6;">${(res.soulEssence || 0).toLocaleString()}</strong>
          </div>
          <div class="realm-cur-pill" title="Energy Capacity">
            <span>⚡ Energy:</span>
            <strong style="color: #ffd152;">${res.energy} / ${currentMaxEnergy}</strong>
          </div>
        </div>
      </div>

      <!-- Realm Navigation Section Tabs -->
      <div class="realm-nav-tabs">
        <button class="realm-tab-btn ${activeRealmSection === 'dungeon' ? 'active' : ''}" data-realm-tab="dungeon">
          🏛️ Sanctuary Trials
        </button>
        <button class="realm-tab-btn ${activeRealmSection === 'energy' ? 'active' : ''}" data-realm-tab="energy">
          ⚡ Energy Vault (${currentMaxEnergy}/500)
        </button>
        <button class="realm-tab-btn ${activeRealmSection === 'potions' ? 'active' : ''}" data-realm-tab="potions">
          🧪 Grand EXP Pots
        </button>
        <button class="realm-tab-btn ${activeRealmSection === 'blessings' ? 'active' : ''}" data-realm-tab="blessings">
          ✨ Timed Blessings
        </button>
      </div>

      <!-- Active Section Content -->
      <div class="realm-section-content">
        ${activeRealmSection === 'dungeon' ? renderDungeonSectionHtml(chamber, tier, canAffordDungeon, partyPower) : ''}
        ${activeRealmSection === 'energy' ? renderEnergySectionHtml(currentMaxEnergy, energyIsCapped, nextEnergyCostEssence, nextEnergyCostSoul, canAffordEnergy) : ''}
        ${activeRealmSection === 'potions' ? renderPotionsSectionHtml(res, partySpirits) : ''}
        ${activeRealmSection === 'blessings' ? renderBlessingsSectionHtml(res, activeBlessings) : ''}
      </div>

    </div>
  `;

  // Bind realm tab switching
  container.querySelectorAll('.realm-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeRealmSection = e.currentTarget.getAttribute('data-realm-tab');
      renderMysticalView(container);
    });
  });

  // Bind specific section listeners
  if (activeRealmSection === 'dungeon') {
    bindDungeonEvents(container);
  } else if (activeRealmSection === 'energy') {
    bindEnergyEvents(container);
  } else if (activeRealmSection === 'potions') {
    bindPotionEvents(container);
  } else if (activeRealmSection === 'blessings') {
    bindBlessingEvents(container);
  }
}

function renderDungeonSectionHtml(chamber, tier, canAfford, partyPower) {
  return `
    <div class="essence-dungeon-view">
      <div class="chamber-intro-box" style="border-left: 4px solid ${chamber.color};">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 24px;">${chamber.icon}</span>
          <div>
            <div style="font-size: 15px; font-weight: 900; color: #fff;">${chamber.name}</div>
            <div style="font-size: 11px; color: ${chamber.accentColor}; font-weight: 700;">${chamber.title} • ${chamber.domain}</div>
          </div>
        </div>
        <p style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">${chamber.desc}</p>
      </div>

      <!-- Chamber Selector Cards -->
      <div class="essence-chambers-grid">
        ${ESSENCE_CHAMBERS.map(c => `
          <button class="essence-chamber-card ${c.id === selectedEssenceChamberId ? 'active' : ''}" 
                  data-chamber-id="${c.id}"
                  style="--ch-color: ${c.color};">
            <span class="ch-icon">${c.icon}</span>
            <span class="ch-title">${c.name}</span>
            <span class="ch-domain">${c.domain}</span>
          </button>
        `).join('')}
      </div>

      <!-- Tier Selection -->
      <div class="essence-tiers-row">
        ${ESSENCE_DIFFICULTY_TIERS.map(t => `
          <button class="essence-tier-btn ${t.tier === selectedEssenceTierNum ? 'active' : ''}" data-tier="${t.tier}">
            <div class="t-name">Tier ${t.tier}</div>
            <div class="t-sub">${t.subtitle}</div>
            <div class="t-cost">⚡ ${t.energyCost}</div>
          </button>
        `).join('')}
      </div>

      <!-- Chamber Rewards & Launch -->
      <div class="essence-launch-panel">
        <div class="launch-rewards-meta">
          <div><strong>Expected Yield:</strong> <span style="color: #00ffff;">💠 ${tier.minGodEssences}–${tier.maxGodEssences} Essences</span> ${tier.soulEssenceReward > 0 ? `+ <span style="color: #9b59b6;">${tier.soulEssenceReward} Soul Essence</span>` : ''} + 💎 ${tier.shardsReward} Shards</div>
          <div><strong>Rec. Power:</strong> ⚡ ${tier.recommendedPower.toLocaleString()} (Your Party: ${partyPower.toLocaleString()})</div>
        </div>

        <button id="btn-start-essence-trial" class="btn-launch-trial" ${canAfford ? '' : 'disabled'}>
          ${canAfford ? `⚔️ Challenge 3-Wave Trial (⚡ ${tier.energyCost})` : `⚠️ Need ⚡ ${tier.energyCost} Energy`}
        </button>
      </div>
    </div>
  `;
}

function renderEnergySectionHtml(currentMax, isCapped, costEssence, costSoul, canAfford) {
  const percent = Math.min(100, Math.round(((currentMax - 60) / (500 - 60)) * 100));

  return `
    <div class="energy-expansion-panel">
      <div class="expansion-header">
        <span style="font-size: 32px;">⚡</span>
        <div>
          <h3 style="font-size: 16px; font-weight: 900; color: #ffd152;">Energy Reservoir Expansion</h3>
          <p style="font-size: 11px; color: var(--text-muted);">Permanently raises your maximum Energy ceiling up to the hard cap of 500 ⚡.</p>
        </div>
      </div>

      <div class="energy-meter-container">
        <div class="meter-labels">
          <span>Base: 60 ⚡</span>
          <span style="color: #ffd152; font-weight: 800;">Current: ${currentMax} ⚡</span>
          <span>Max Cap: 500 ⚡</span>
        </div>
        <div class="energy-meter-track">
          <div class="energy-meter-fill" style="width: ${percent}%;"></div>
        </div>
        <div style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 4px;">
          ${isCapped ? '🌟 Maximum Energy Reservoir Limit Reached (500/500)!' : `${500 - currentMax} ⚡ remaining to reach maximum capacity.`}
        </div>
      </div>

      ${!isCapped ? `
        <div class="expansion-upgrade-box">
          <div style="font-size: 12px; font-weight: 700; color: #fff;">
            Upgrade to <strong>${currentMax + 20} ⚡</strong> (+20 Max Energy)
          </div>
          <div style="font-size: 11px; color: var(--text-muted);">
            Cost: <span style="color: #00ffff;">${costEssence} Essences of the Gods</span> ${costSoul > 0 ? `+ <span style="color: #9b59b6;">${costSoul} Soul Essence</span>` : ''}
          </div>
          <button id="btn-upgrade-energy-cap" class="btn-action-upgrade-cap" ${canAfford ? '' : 'disabled'}>
            ${canAfford ? '⚡ Expand Reservoir (+20 Cap)' : '⚠️ Insufficient Essences'}
          </button>
        </div>
      ` : `
        <div class="cap-reached-banner">
          <span>🏆 Energy Reservoir is fully awakened at 500 ⚡!</span>
        </div>
      `}
    </div>
  `;
}

function renderPotionsSectionHtml(res, spirits) {
  const POTIONS = [
    { id: 'lesser_elixir', name: 'Lesser Astral Elixir', icon: '🧪', xp: 10000, shardCost: 50, essenceGodCost: 2, desc: 'Brewed elixir granting +10,000 Spirit XP.' },
    { id: 'grand_elixir', name: 'Grand Astral Elixir', icon: '⚗️', xp: 50000, shardCost: 200, essenceGodCost: 8, desc: 'Potent concentrated starlight granting +50,000 Spirit XP.' },
    { id: 'divine_ambrosia', name: 'Divine Ambrosia', icon: '🏺', xp: 250000, shardCost: 800, essenceGodCost: 25, soulCost: 2, desc: 'Nectar of the gods granting a colossal +250,000 Spirit XP.' }
  ];

  return `
    <div class="potions-catalog-panel">
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
        Feed astral potions to your spirits to rapidly level them up and advance towards evolution caps.
      </div>

      <div class="potions-grid">
        ${POTIONS.map(pot => {
          const canBuy = res.spiritShards >= pot.shardCost && 
            (res.essencesOfTheGods || 0) >= pot.essenceGodCost &&
            (!pot.soulCost || (res.soulEssence || 0) >= pot.soulCost);

          return `
            <div class="potion-item-card">
              <div class="potion-icon-box">${pot.icon}</div>
              <div class="potion-info-col">
                <div class="potion-name">${pot.name}</div>
                <div class="potion-xp-tag">+${pot.xp.toLocaleString()} XP</div>
                <div class="potion-desc">${pot.desc}</div>
                <div class="potion-cost-row">
                  <span>💎 ${pot.shardCost}</span>
                  <span style="color: #00ffff;">💠 ${pot.essenceGodCost}</span>
                  ${pot.soulCost ? `<span style="color: #9b59b6;">🔮 ${pot.soulCost}</span>` : ''}
                </div>
              </div>
              <button class="btn-use-potion" data-potion-id="${pot.id}" ${canBuy ? '' : 'disabled'}>
                Brew & Feed
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderBlessingsSectionHtml(res, activeBlessings) {
  const BLESSINGS = [
    { id: 'blessing_ares', name: 'Blessing of Ares', icon: '⚔️', cost: 15, desc: '+20% Party Damage & +10% Crit Rate for 1 hour.', color: '#ff4757' },
    { id: 'blessing_athena', name: 'Blessing of Athena', icon: '🛡️', cost: 15, desc: '+25% Max HP & +20% Shield Strength for 1 hour.', color: '#70a1ff' },
    { id: 'blessing_hermes', name: 'Blessing of Hermes', icon: '🪽', cost: 15, desc: '+30% Shards & Drops in Madness Zone for 1 hour.', color: '#2ed573' }
  ];

  return `
    <div class="blessings-panel">
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
        Invoke ancient divine invocations to empower your party with timed 1-hour combat blessings.
      </div>

      <div class="blessings-grid">
        ${BLESSINGS.map(b => {
          const active = activeBlessings[b.id];
          const canAfford = (res.essencesOfTheGods || 0) >= b.cost;
          const minsRemaining = active ? Math.ceil(active.remainingSec / 60) : 0;

          return `
            <div class="blessing-card ${active ? 'active-blessing' : ''}" style="--b-color: ${b.color};">
              <div class="blessing-top">
                <span style="font-size: 28px;">${b.icon}</span>
                <div>
                  <div style="font-size: 14px; font-weight: 800; color: #fff;">${b.name}</div>
                  <div style="font-size: 10px; color: ${b.color}; font-weight: 700;">1-HOUR TIMED BLESSING</div>
                </div>
              </div>

              <p style="font-size: 11px; color: var(--text-muted); margin: 8px 0;">${b.desc}</p>

              ${active ? `
                <div class="blessing-active-status">
                  <span class="pulse-dot">●</span> Active: ${minsRemaining}m remaining
                </div>
              ` : `
                <div class="blessing-cost-row">
                  <span>Cost: <strong style="color: #00ffff;">${b.cost} Essences</strong></span>
                  <button class="btn-invoke-blessing" data-blessing-id="${b.id}" ${canAfford ? '' : 'disabled'}>
                    Invoke Blessing
                  </button>
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function bindDungeonEvents(container) {
  container.querySelectorAll('.essence-chamber-card').forEach(card => {
    card.addEventListener('click', (e) => {
      selectedEssenceChamberId = e.currentTarget.getAttribute('data-chamber-id');
      renderMysticalView(container);
    });
  });

  container.querySelectorAll('.essence-tier-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectedEssenceTierNum = parseInt(e.currentTarget.getAttribute('data-tier'), 10);
      renderMysticalView(container);
    });
  });

  container.querySelector('#btn-start-essence-trial')?.addEventListener('click', () => {
    try {
      gameState.startDungeonTrial('essence', selectedEssenceChamberId, selectedEssenceTierNum);
      renderMysticalView(container);
    } catch (err) {
      alert(err.message);
    }
  });
}

function bindEnergyEvents(container) {
  container.querySelector('#btn-upgrade-energy-cap')?.addEventListener('click', () => {
    try {
      gameState.upgradeEnergyCapacity();
      renderMysticalView(container);
    } catch (err) {
      alert(err.message);
    }
  });
}

function bindPotionEvents(container) {
  container.querySelectorAll('.btn-use-potion').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const potionId = e.currentTarget.getAttribute('data-potion-id');
      openPotionSpiritSelector(potionId, container);
    });
  });
}

function bindBlessingEvents(container) {
  container.querySelectorAll('.btn-invoke-blessing').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const blessingId = e.currentTarget.getAttribute('data-blessing-id');
      try {
        gameState.applyTemporaryBlessing(blessingId);
        renderMysticalView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function openPotionSpiritSelector(potionId, container) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const partySpirits = gameState.getPartySpirits();

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <h3 class="modal-title">🧪 Select Spirit to Feed Potion</h3>
        <p style="font-size: 11px; color: var(--text-muted); text-align: center;">Choose an active party member to receive the XP surge:</p>
        
        <div style="display: flex; flex-direction: column; gap: 8px; margin: 12px 0; max-height: 50vh; overflow-y: auto;">
          ${partySpirits.map(s => `
            <div class="select-spirit-potion-row" data-spirit-id="${s.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 44px; height: 44px;">${createSpiritPlaceholderBox(s)}</div>
                <div>
                  <div style="font-weight: 800; font-size: 13px; color: #fff;">${s.customName}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">Lv. ${s.level} • ⚡ ${s.power} PWR</div>
                </div>
              </div>
              <button class="btn-feed-confirm" style="padding: 6px 12px; background: var(--color-primary); color: #000; border: none; border-radius: 6px; font-weight: 800; cursor: pointer;">
                Feed
              </button>
            </div>
          `).join('')}
        </div>

        <button id="btn-cancel-potion-modal" class="modal-btn-confirm" style="background: rgba(255,255,255,0.15);">Cancel</button>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll('.select-spirit-potion-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const spiritId = e.currentTarget.getAttribute('data-spirit-id');
      try {
        const result = gameState.buyExpPotion(potionId, spiritId);
        modalRoot.innerHTML = '';
        renderMysticalView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  document.getElementById('btn-cancel-potion-modal')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
  });
}

function renderEssenceBattleArena(container, battle) {
  const chamber = ESSENCE_CHAMBERS.find(c => c.id === battle.chamberId) || ESSENCE_CHAMBERS[0];
  const tierObj = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === battle.tier) || ESSENCE_DIFFICULTY_TIERS[0];
  const party = gameState.getPartySpirits();
  const enemies = (battle.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);

  container.innerHTML = `
    <div class="pantheon-battle-container">
      <div class="pantheon-battle-header" style="border-bottom: 2px solid ${chamber.color};">
        <div class="battle-header-info">
          <div class="trial-tag" style="color: ${chamber.accentColor};">${chamber.name.toUpperCase()}</div>
          <div class="trial-title">${tierObj.name} • Wave ${battle.currentWave}/3</div>
        </div>

        <button id="btn-leave-essence-battle" class="btn-leave-dungeon" title="Forfeit Battle">
          ✕ Forfeit
        </button>
      </div>

      <div class="pantheon-battlefield">
        <div class="dungeon-allies-lineup">
          ${party.map(spirit => `
            <div class="dungeon-ally-card ${spirit.isFallen ? 'ally-fallen' : ''}">
              <div class="ally-sprite-slot">${createSpiritPlaceholderBox(spirit)}</div>
              <div class="ally-name">${spirit.customName}</div>
              <div class="bar-track"><div class="bar-fill hp-fill" style="width: ${Math.round((spirit.currentHp / spirit.maxHp) * 100)}%;"></div></div>
              <div class="bar-track"><div class="bar-fill mp-fill" style="width: ${Math.round((spirit.currentMp / 100) * 100)}%;"></div></div>
            </div>
          `).join('')}
        </div>

        <div class="battlefield-clash-divider">⚡</div>

        <div class="dungeon-enemies-lineup">
          ${enemies.map(enemy => `
            <div class="dungeon-enemy-card">
              <div class="enemy-sprite-slot">${createEnemyPlaceholderBox(enemy)}</div>
              <div class="enemy-name" style="color: ${chamber.color};">${enemy.name}</div>
              <div class="bar-track"><div class="bar-fill hp-fill" style="width: ${Math.round((enemy.hp / enemy.maxHp) * 100)}%;"></div></div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Victory Modal if Battle Cleared -->
      ${battle.status === 'victory' && battle.loot ? `
        <div class="dungeon-victory-banner">
          <div style="font-size: 18px; font-weight: 900; color: #ffd152;">🏆 SANCTUM TRIAL CLEARED!</div>
          <div style="font-size: 13px; color: #fff; margin: 6px 0;">
            Earned: <strong style="color: #00ffff;">+${battle.loot.godEssencesGained} Essences of the Gods</strong>, 
            ${battle.loot.soulEssenceGained > 0 ? `<strong style="color: #9b59b6;">+${battle.loot.soulEssenceGained} Soul Essence</strong>, ` : ''}
            <strong style="color: #2ed573;">+${battle.loot.shardsGained} Shards</strong>
          </div>
          <button id="btn-collect-essence-loot" class="modal-btn-confirm" style="background: linear-gradient(135deg, #00ffff, #00b894); color: #000; font-weight: 900; margin-top: 8px;">
            Collect to Sanctum
          </button>
        </div>
      ` : ''}

      <!-- Defeat Modal -->
      ${battle.status === 'defeat' ? `
        <div class="dungeon-defeat-banner">
          <div style="font-size: 18px; font-weight: 900; color: #ff4757;">☠️ TRIAL FAILED</div>
          <p style="font-size: 12px; color: var(--text-muted); margin: 6px 0;">Your spirits succumbed to the primordial trial.</p>
          <button id="btn-leave-essence-battle" class="modal-btn-confirm" style="background: rgba(255,255,255,0.2);">
            Return to Sanctum
          </button>
        </div>
      ` : ''}

      ${battle.status === 'active' ? `
        <div class="dungeon-battle-footer">
          <button id="btn-essence-strike" class="btn-dungeon-manual-strike">
            ⚡ Tap Strike (+10 MP)
          </button>
        </div>
      ` : ''}
    </div>
  `;

  document.getElementById('btn-essence-strike')?.addEventListener('click', () => {
    gameState.manualDungeonStrike();
    renderMysticalView(container);
  });

  document.getElementById('btn-leave-essence-battle')?.addEventListener('click', () => {
    gameState.exitDungeonBattle();
    renderMysticalView(container);
  });

  document.getElementById('btn-collect-essence-loot')?.addEventListener('click', () => {
    gameState.exitDungeonBattle();
    renderMysticalView(container);
  });
}
