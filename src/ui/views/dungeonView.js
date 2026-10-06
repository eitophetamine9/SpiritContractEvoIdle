/**
 * Artifact Dungeon: The Pantheon Trials View
 * Dedicated UI for farming Greek God Relics & Weapons
 * Enhanced with 2.5D Pixi.js / Canvas Arena Viewport & Tailwind Glassmorphic Design
 */

import { gameState } from '../../state/gameState.js';
import { audioManager } from '../../audio/audioManager.js';
import { PANTHEON_CHAMBERS, PANTHEON_DIFFICULTY_TIERS } from '../../data/artifactDungeonData.js';
import { GREEK_GOD_SETS, EQUIPMENT_RARITIES } from '../../data/equipmentData.js';
import { createSpiritPlaceholderBox, createEnemyPlaceholderBox } from '../components/pixelBox.js';
import { SPIRIT_SPECIES, getRarityInfo } from '../../data/spiritsData.js';
import { arenaRenderer } from '../../render/arenaRenderer.js';

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
    <div class="pantheon-container flex flex-col gap-4 p-2 sm:p-4 text-white">
      
      <!-- Top Dungeon Hero Banner with Tailwind Glassmorphism -->
      <div class="pantheon-hero-banner relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-950 border border-amber-500/30 p-4 shadow-[0_0_30px_rgba(245,158,11,0.15)] backdrop-blur-md" style="border-bottom: 2px solid ${selectedChamber.color};">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="pantheon-title-col">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
              ⚡ THE PANTHEON TRIALS
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200 mt-1">
              Divine Artifact Chambers
            </h2>
            <p class="text-xs text-slate-400 max-w-lg mt-0.5">
              Challenge Greek God Avatars to earn targeted 6-piece Relic Sets & Weapons across 4 trial difficulties.
            </p>
          </div>

          <div class="pantheon-energy-badge flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-amber-500/40 shadow-inner self-stretch sm:self-auto justify-end">
            <span class="energy-icon text-base">⚡</span>
            <span class="energy-numbers text-xs font-black text-amber-300">${res.energy} / ${res.maxEnergy} Energy</span>
          </div>
        </div>
      </div>

      <!-- Chamber Selection Carousel / Grid -->
      <div class="pantheon-chambers-grid grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        ${PANTHEON_CHAMBERS.map(c => {
          const isSelected = c.id === selectedChamberId;
          const gSet = GREEK_GOD_SETS[c.godId];
          return `
            <button class="chamber-card relative overflow-hidden rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-200 border cursor-pointer ${isSelected ? 'selected bg-slate-800/90 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}" data-chamber="${c.id}" style="--chamber-color: ${c.color};">
              <div class="chamber-sigil w-11 h-11 rounded-full flex items-center justify-center text-2xl mb-1.5 shadow-md" style="background: ${c.color}22; border: 1.5px solid ${c.color};">
                ${c.sigil}
              </div>
              <div class="chamber-info flex flex-col items-center">
                <span class="chamber-name text-xs font-black text-white leading-tight">${c.name}</span>
                <span class="chamber-god text-[10px] font-bold text-slate-400 mt-0.5" style="color: ${c.accentColor};">${gSet ? gSet.god : ''} Set</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Active Selected Chamber Detail Stage -->
      <div class="chamber-active-stage rounded-2xl border p-4 sm:p-5 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/95 shadow-xl" style="border: 2px solid ${selectedChamber.color}; background: linear-gradient(180deg, ${selectedChamber.color}15 0%, rgba(10, 15, 20, 0.95) 100%);">
        
        <div class="stage-header-row flex items-start gap-3.5 mb-4">
          <div class="stage-sigil-large w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0" style="background: ${selectedChamber.color}25; border: 2px solid ${selectedChamber.color};">
            ${selectedChamber.sigil}
          </div>
          <div class="stage-text-block flex-1">
            <h3 class="stage-name text-lg font-black" style="color: ${selectedChamber.accentColor};">${selectedChamber.name}</h3>
            <span class="stage-god-title text-xs font-bold text-slate-300">${selectedChamber.godTitle}</span>
            <p class="stage-lore text-xs text-slate-400 mt-1 leading-relaxed">${selectedChamber.lore}</p>
          </div>
        </div>

        <!-- Relic Set Bonus Preview Pill -->
        ${godSet ? `
          <div class="god-bonuses-preview-box grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div class="bonus-preview-pill flex flex-col gap-0.5">
              <span class="bonus-tag text-[10px] font-black uppercase text-amber-400">2-PC SET BONUS</span>
              <span class="bonus-desc text-xs text-slate-300"><strong>${godSet.bonus2pc.name}:</strong> ${godSet.bonus2pc.description}</span>
            </div>
            <div class="bonus-preview-pill flex flex-col gap-0.5">
              <span class="bonus-tag four-pc text-[10px] font-black uppercase text-orange-400">4-PC SET BONUS</span>
              <span class="bonus-desc text-xs text-slate-300"><strong>${godSet.bonus4pc.name}:</strong> ${godSet.bonus4pc.description}</span>
            </div>
          </div>
        ` : ''}

        <!-- Tier Selector Row -->
        <div class="pantheon-tier-selector mb-4">
          <div class="tier-label text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">TRIAL DIFFICULTY:</div>
          <div class="tier-buttons-row grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${PANTHEON_DIFFICULTY_TIERS.map(t => {
              const isTierActive = t.tier === selectedTierNum;
              return `
                <button class="btn-tier-select p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${isTierActive ? 'active bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]' : 'bg-slate-950/60 border-slate-800'}" data-tier="${t.tier}">
                  <span class="tier-btn-name text-xs font-black text-white">${t.name}</span>
                  <span class="tier-btn-cost text-xs font-bold text-amber-400 mt-1">${t.energyCost} ⚡</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Trial Action Strip -->
        <div class="trial-launch-strip flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div class="trial-power-info text-xs flex flex-col gap-0.5">
            <span class="rec-power-tag text-slate-400">Recommended Power: <strong class="text-white">⚡ ${selectedTier.recommendedPower.toLocaleString()}</strong></span>
            <span class="party-power-tag ${powerClass} text-slate-400">Party Power: <strong class="text-amber-300">⚡ ${partyPower.toLocaleString()} (${powerText})</strong></span>
          </div>

          <button id="btn-enter-trial" class="btn-enter-trial min-h-[46px] px-6 py-2.5 rounded-xl font-black text-sm text-slate-950 transition-all duration-200 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" ${canAfford ? '' : 'disabled'} style="background: linear-gradient(135deg, ${selectedChamber.color}, ${selectedChamber.accentColor});">
            <span>Challenge ${selectedChamber.sigil} ${selectedTier.name} (${selectedTier.energyCost} ⚡)</span>
          </button>
        </div>

      </div>

      <!-- Loot Preview & Guaranteed Drops Strip -->
      <div class="pantheon-loot-preview-strip rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span class="loot-preview-title text-[11px] font-black uppercase tracking-wider text-slate-400">GUARANTEED SPOILS:</span>
        <div class="loot-pills-list flex items-center gap-2 flex-wrap">
          <span class="loot-badge px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">🏆 ${selectedTier.relicCount}x Targeted ${godSet ? godSet.god : ''} Relics</span>
          <span class="loot-badge px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">⚔️ 45% Weapon Chance</span>
          <span class="loot-badge px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">💎 +${selectedTier.shardsReward} Shards</span>
          <span class="loot-badge px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">🔮 +${selectedTier.essenceReward} Soul Essence</span>
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
    <div class="pantheon-victory-modal max-w-lg w-full rounded-2xl bg-slate-900 border overflow-hidden shadow-2xl text-white" style="border: 2px solid ${loot.chamber.color};">
      
      <div class="victory-header p-4 flex items-center gap-3.5" style="background: linear-gradient(135deg, ${loot.chamber.color}33, #000);">
        <div class="victory-sigil text-4xl">${loot.chamber.sigil}</div>
        <div class="victory-title-col">
          <span class="victory-sub text-[10px] font-black uppercase tracking-widest text-amber-400">TRIAL VICTORIOUS</span>
          <h3 class="victory-name text-lg font-black text-white">${loot.chamber.name} Cleared!</h3>
          <span class="victory-tier-tag text-xs text-slate-300">${loot.tier.name}</span>
        </div>
      </div>

      <div class="victory-body p-4 flex flex-col gap-3">
        <div class="spoils-section-header text-[11px] font-black uppercase tracking-wider text-slate-400">RELICS & WEAPONS ACQUIRED:</div>

        <div class="awarded-items-grid grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto pr-1">
          ${loot.relics.map(r => {
            const rColor = r.color || '#9b59b6';
            const rarObj = EQUIPMENT_RARITIES[r.rarity] || EQUIPMENT_RARITIES.COMMON;
            return `
              <div class="awarded-item-card p-2.5 rounded-xl bg-slate-950/80 border flex flex-col gap-1" style="border-color: ${rarObj.border};">
                <div class="item-header-row flex items-center gap-2">
                  <span class="item-icon-frame text-xl">${r.icon}</span>
                  <div class="item-name-col">
                    <div class="item-name text-xs font-black" style="color: ${r.accentColor || '#fff'};">${r.name}</div>
                    <span class="item-rarity-pill text-[10px] font-bold" style="color: ${rarObj.color};">${rarObj.name}</span>
                  </div>
                </div>
                <div class="item-stat-row text-[11px] text-slate-300 flex justify-between">
                  <span class="stat-name">${r.mainStatName}:</span>
                  <span class="stat-val font-bold text-amber-300">+${r.mainStatValue}</span>
                </div>
                <div class="item-set-tag text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5" style="background: ${rColor}22; color: ${rColor};">
                  ${r.setName} (1/6)
                </div>
              </div>
            `;
          }).join('')}

          ${loot.weapons.map(w => {
            const rarObj = EQUIPMENT_RARITIES[w.rarity] || EQUIPMENT_RARITIES.COMMON;
            return `
              <div class="awarded-item-card weapon-card p-2.5 rounded-xl bg-slate-950/80 border flex flex-col gap-1" style="border-color: ${rarObj.border};">
                <div class="item-header-row flex items-center gap-2">
                  <span class="item-icon-frame text-xl">${w.icon}</span>
                  <div class="item-name-col">
                    <div class="item-name text-xs font-black text-amber-300">${w.name}</div>
                    <span class="item-rarity-pill text-[10px] font-bold" style="color: ${rarObj.color};">${rarObj.name} Weapon</span>
                  </div>
                </div>
                <div class="item-stat-row text-[11px] text-slate-300 flex justify-between">
                  <span class="stat-name">ATK Power:</span>
                  <span class="stat-val font-bold text-amber-300">+${w.atkPower} PWR</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="victory-resources-row flex items-center gap-2 pt-2 border-t border-slate-800">
          <span class="res-reward-pill px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">💎 +${loot.shardsGained} Shards</span>
          <span class="res-reward-pill px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">🔮 +${loot.essenceGained} Soul Essence</span>
        </div>

        <button id="btn-claim-victory-loot" class="btn-claim-dungeon-loot min-h-[46px] w-full py-2.5 rounded-xl font-black text-xs text-slate-950 transition-all cursor-pointer shadow-lg" style="background: linear-gradient(135deg, ${loot.chamber.color}, #f1c40f);">
          Claim Relics & Return
        </button>
      </div>

    </div>
  `;

  modalRoot.appendChild(modalEl);

  modalEl.querySelector('#btn-claim-victory-loot').addEventListener('click', () => {
    modalRoot.removeChild(modalEl);
    if (onClose) onClose();
  });
}

function renderPantheonBattleArena(container, battle) {
  const chamber = PANTHEON_CHAMBERS.find(c => c.id === battle.chamberId) || PANTHEON_CHAMBERS[0];
  const tier = PANTHEON_DIFFICULTY_TIERS.find(t => t.tier === battle.tier) || PANTHEON_DIFFICULTY_TIERS[0];
  const party = gameState.getPartySpirits();
  const partyPower = gameState.getTotalPartyPower();
  const swarm = battle.currentSwarm || [];
  const godName = GREEK_GOD_SETS[chamber.godId]?.god || 'Olympian';

  container.innerHTML = `
    <div class="trial-battle-container flex flex-col gap-3 min-h-full text-white">
      
      <!-- Top Tactical Combat HUD -->
      <div class="combat-top-hud flex items-center justify-between p-3 rounded-2xl bg-slate-950/90 border border-amber-500/30 shadow-lg backdrop-blur-md" style="border-bottom: 2px solid ${chamber.color};">
        <div class="combat-hud-left flex items-center gap-2">
          <button id="btn-trial-flee" class="hud-flee-btn px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-black transition-all cursor-pointer" title="Surrender and return to chambers">
            ◀ Leave
          </button>
        </div>

        <div class="combat-vs-banner flex items-center gap-2">
          <span class="vs-ally-tag text-xs font-bold text-amber-300">${chamber.sigil} ${chamber.name.toUpperCase()}</span>
          <span class="vs-center-tag text-[10px] text-slate-500">|</span>
          <span class="vs-enemy-tag text-xs font-black text-white">
            WAVE ${battle.currentWave}/3: ${battle.currentWave === 3 ? `AVATAR: ${godName}` : 'GUARDIANS'}
          </span>
        </div>

        <div class="combat-hud-right">
          <span class="hud-speed-btn px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400">⚡ ${tier.energyCost}</span>
        </div>
      </div>

      <!-- Dynamic 2.5D Isometric Battlefield Area -->
      <div class="isometric-battlefield pantheon-battlefield relative overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-950 shadow-2xl min-h-[300px] flex items-center justify-between p-3 sm:p-5" style="border-color: ${chamber.color}44;">
        
        <!-- 2.5D Isometric Canvas Viewport Layer (Pixi.js / Canvas Engine) -->
        <div id="arena-viewport-25d" class="arena-viewport-25d absolute inset-0 pointer-events-none z-0 rounded-2xl overflow-hidden"></div>

        <!-- Left Side: Staggered Allied Spirit Formation -->
        <div class="allied-formation-column relative z-10 flex flex-col gap-2">
          <div class="formation-header-label text-[10px] font-black uppercase tracking-widest text-amber-400">Allied Lineup</div>
          
          <div class="staggered-party-formation flex flex-col gap-2">
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
                <div class="spirit-formation-slot slot-active flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/75 border border-slate-800 ${isUltReady ? 'ult-ready border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : ''} ${isFallen ? 'spirit-fallen opacity-40' : ''}" id="trial-allied-slot-${idx}">
                  <div class="spirit-sprite-container w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    ${createSpiritPlaceholderBox(spirit, { boxClass: 'formation-spirit-box' })}
                  </div>

                  <div class="spirit-hud-bars flex flex-col gap-1 w-20">
                    <div class="text-[10px] font-black truncate text-white">${spirit.customName}</div>
                    <div class="hud-bar-hp w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div class="hud-hp-fill h-full bg-emerald-400 rounded-full" id="trial-spirit-hp-fill-${idx}" style="width: ${hpPct}%;"></div>
                      ${shieldPct > 0 ? `<div class="hud-shield-fill h-full bg-cyan-400" style="width: ${shieldPct}%;"></div>` : ''}
                    </div>
                    <div class="hud-bar-mp w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div class="hud-mp-fill h-full bg-amber-400 rounded-full" id="trial-spirit-mp-fill-${idx}" style="width: ${mpPct}%;"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Center Combat Clash Point -->
        <div class="combat-clash-divider relative z-10 text-2xl animate-pulse">
          <div class="clash-sparks-icon">⚔️</div>
        </div>

        <!-- Right Side: Wave Enemies -->
        <div class="enemy-formation-column relative z-10 flex flex-col gap-2 items-end">
          <div class="formation-header-label text-[10px] font-black uppercase tracking-widest text-red-400">
            ${battle.currentWave === 3 ? `👑 AVATAR: ${godName.toUpperCase()}` : `DIVINE ATTENDANTS (${swarm.filter(e => !e.isDefeated && e.hp > 0).length}/${swarm.length})`}
          </div>

          <div class="enemy-swarm-wrapper flex flex-col gap-2" id="trial-enemy-swarm-wrapper">
            ${swarm.map((em, sIdx) => {
              const isDead = em.isDefeated || em.hp <= 0;
              const maxHp = em.maxHp || 100;
              const curHp = typeof em.hp === 'number' ? Math.max(0, em.hp) : maxHp;
              const emHpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));

              return `
                <div class="enemy-swarm-slot flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/75 border border-slate-800 ${em.isBoss ? 'boss-slot border-amber-500' : ''} ${isDead ? 'enemy-defeated opacity-30' : ''}" id="trial-enemy-slot-${sIdx}">
                  <div class="enemy-overhead-card flex flex-col gap-1 w-20 items-end">
                    <div class="enemy-name-label text-[10px] font-black truncate text-white">${em.name}</div>
                    <div class="enemy-hp-track w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div id="trial-enemy-hp-fill-${sIdx}" class="enemy-hp-fill h-full bg-red-400 rounded-full" style="width: ${emHpPct}%;"></div>
                    </div>
                  </div>

                  <div class="enemy-sprite-container w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <div class="enemy-placeholder-frame">
                      ${createEnemyPlaceholderBox(em)}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- Action Strike Command Strip -->
      <div class="combat-action-footer">
        <button id="btn-trial-strike" class="btn-main-attack min-h-[48px] w-full py-3 rounded-2xl font-black text-sm text-slate-950 transition-all cursor-pointer shadow-xl flex flex-col items-center justify-center" style="background: linear-gradient(135deg, ${chamber.color}, ${chamber.accentColor});">
          <span>⚔️ Divine Strike (Party Attack • Charges +10 MP)</span>
          <span class="btn-subtext text-[10px] font-bold opacity-80">Clear Wave ${battle.currentWave}/3 to claim targeted ${godName} Relics</span>
        </button>
      </div>

    </div>
  `;

  // Initialize 2.5D Isometric Arena Viewport Engine
  const viewportEl = container.querySelector('#arena-viewport-25d');
  if (viewportEl) {
    arenaRenderer.init(viewportEl, { mode: 'pantheon', element: 'LIGHT', chamberId: battle.chamberId });
  }

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
      arenaRenderer.spawnDamagePopup(null, null, Math.round(partyPower * 0.45));
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
    <div class="pantheon-victory-modal max-w-md w-full rounded-2xl bg-slate-900 border border-red-500/50 p-5 shadow-2xl text-white flex flex-col items-center text-center gap-3">
      <div class="text-3xl">💀</div>
      <div>
        <h3 class="text-base font-black text-red-400">DIVINE TRIAL FAILED</h3>
        <p class="text-xs text-slate-400 mt-1">Party Wiped in Sanctum. Regroup and upgrade your spirits before challenging this god again.</p>
      </div>
      <button id="btn-trial-defeat-ok" class="btn-claim-dungeon-loot min-h-[44px] w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer">
        Return Safely
      </button>
    </div>
  `;

  modalRoot.appendChild(modalEl);
  modalEl.querySelector('#btn-trial-defeat-ok').addEventListener('click', () => {
    modalRoot.removeChild(modalEl);
    if (onClose) onClose();
  });
}
