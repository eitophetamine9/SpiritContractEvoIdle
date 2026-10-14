/**
 * The Divine Forge View
 * Dedicated screen for farming 6 weapon archetypes (Blades, Bows, Staves, Claws, Daggers, Mallets)
 * across 4 difficulty tiers through 3-wave forge combat trials.
 * Enhanced with 2.5D Pixi.js / Canvas Arena Viewport & Tailwind Molten Glassmorphic Design
 */

import { gameState } from '../../state/gameState.js';
import { audioManager } from '../../audio/audioManager.js';
import { FORGE_CHAMBERS, FORGE_DIFFICULTY_TIERS } from '../../data/weaponDungeonData.js';
import { EQUIPMENT_RARITIES } from '../../data/equipmentData.js';
import { createSpiritPlaceholderBox, createEnemyPlaceholderBox } from '../components/pixelBox.js';
import { SPIRIT_SPECIES, getRarityInfo } from '../../data/spiritsData.js';
import { arenaRenderer } from '../../render/arenaRenderer.js';
import { createAnimatedSpriteHtml, createAnimatedEnemyHtml, getSheetKeyForSpecies, createAnimatedWeaponHtml, createAnimatedChestHtml } from '../../render/spriteAnimator.js';

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
    <div class="pantheon-container forge-container flex flex-col gap-3 p-2 text-white">
      
      <!-- Top Forge Hero Banner -->
      <div class="pantheon-hero-banner relative overflow-hidden rounded-xl bg-gradient-to-b from-orange-950/40 via-slate-900/90 to-slate-950 border border-orange-500/30 p-3 shadow-md backdrop-blur-md" style="border-bottom: 2px solid ${chamber.color};">
        <div class="flex items-center justify-between gap-2">
          <div class="pantheon-title-col">
            <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-orange-500/20 text-orange-300 border border-orange-400/30">
              🔥 THE DIVINE FORGE
            </div>
            <h2 class="text-sm sm:text-base font-extrabold text-white mt-0.5">
              Sacred Weapon Anvils
            </h2>
            <p class="text-[11px] text-slate-400 mt-0.5">
              Forge 6 legendary weapon archetypes by besting Vulcan automatons.
            </p>
          </div>

          <div class="pantheon-energy-badge flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-orange-500/40 text-[11px] shrink-0">
            <span class="text-amber-400 font-bold">⚡</span>
            <span class="font-extrabold text-amber-300">${res.energy} / ${res.maxEnergy}</span>
          </div>
        </div>
      </div>

      <!-- Forge Chambers Selector Grid -->
      <div class="pantheon-chambers-grid forge-chambers-grid grid grid-cols-2 gap-2">
        ${FORGE_CHAMBERS.map(c => {
          const isSelected = c.id === selectedForgeChamberId;
          return `
            <button class="chamber-card relative overflow-hidden rounded-xl p-2.5 flex items-center gap-2 text-left transition-all border cursor-pointer ${isSelected ? 'selected bg-slate-800/90 border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.25)]' : 'bg-slate-900/60 border-slate-800'}" data-forge-chamber="${c.id}" style="--chamber-color: ${c.color};">
              <div class="chamber-sigil w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm overflow-hidden" style="background: ${c.color}22; border: 1px solid ${c.color};">
                ${createAnimatedWeaponHtml(c.weaponTypeId || c.id, { extraClasses: 'chamber-sprite-icon' })}
              </div>
              <div class="chamber-info min-w-0 flex-1">
                <span class="chamber-name text-xs font-bold text-white truncate block">${c.name}</span>
                <span class="chamber-god text-[10px] font-semibold truncate block" style="color: ${c.accentColor};">${c.bossName}</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Active Selected Chamber Detail Stage -->
      <div class="chamber-active-stage rounded-2xl border p-4 sm:p-5 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/95 shadow-xl" style="border: 2px solid ${chamber.color}; background: linear-gradient(180deg, ${chamber.color}15 0%, rgba(15, 12, 10, 0.95) 100%);">
        
        <div class="stage-header-row flex items-start gap-3.5 mb-4">
          <div class="stage-sigil-large w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden" style="border-color: ${chamber.color}; text-shadow: 0 0 20px ${chamber.color}; background: ${chamber.color}25; border: 2px solid ${chamber.color};">
            ${createAnimatedWeaponHtml(chamber.weaponTypeId || chamber.id, { extraClasses: 'stage-sigil-sprite-large' })}
          </div>
          <div class="stage-text-block flex-1">
            <h3 class="stage-name text-lg font-black" style="color: ${chamber.accentColor};">${chamber.name}</h3>
            <span class="stage-god-title text-xs font-bold text-slate-300">${chamber.title}</span>
            <p class="stage-lore text-xs text-slate-400 mt-1 leading-relaxed">${chamber.desc}</p>
          </div>
        </div>

        <!-- Tier Selector Row -->
        <div class="pantheon-tier-selector mb-4">
          <div class="tier-label text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">FORGE HEAT DIFFICULTY:</div>
          <div class="tier-buttons-row grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${FORGE_DIFFICULTY_TIERS.map(t => {
              const isTierActive = t.tier === selectedForgeTierNum;
              return `
                <button class="btn-tier-select p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${isTierActive ? 'active bg-orange-500/20 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]' : 'bg-slate-950/60 border-slate-800'}" data-forge-tier="${t.tier}">
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
            <span class="rec-power-tag text-slate-400">Required Power: <strong class="text-white">⚡ ${tier.minPartyPower.toLocaleString()}</strong></span>
            <span class="party-power-tag ${powerClass} text-slate-400">Party Power: <strong class="text-orange-300">⚡ ${partyPower.toLocaleString()} (${powerText})</strong></span>
          </div>

          <div class="flex gap-2 flex-wrap">
            <button id="btn-enter-forge-trial" class="btn-enter-trial min-h-[46px] px-6 py-2.5 rounded-xl font-black text-sm text-slate-950 transition-all duration-200 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" ${canAfford ? '' : 'disabled'} style="background: linear-gradient(135deg, ${chamber.color}, ${chamber.accentColor});">
              <span>⚔️ Enter 3-Wave Forge (${tier.energyCost} ⚡)</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Loot Preview & Guaranteed Drops Strip -->
      <div class="pantheon-loot-preview-strip rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span class="loot-preview-title text-[11px] font-black uppercase tracking-wider text-slate-400">FORGE DROPS:</span>
        <div class="loot-pills-list flex items-center gap-2 flex-wrap">
          <span class="loot-badge px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 text-xs font-bold border border-orange-500/30">⚔️ ${tier.weaponDropCount}x Targeted ${chamber.name.split(' ')[0]} Weapons</span>
          <span class="loot-badge px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">💎 +${tier.shardsReward} Spirit Shards</span>
          <span class="loot-badge px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">🔮 +${tier.essenceReward} Soul Essence</span>
          <span class="loot-badge px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">🌊 3 Combat Waves (Boss: ${chamber.bossName})</span>
        </div>
      </div>

    </div>
  `;

  // Attach Forge Chamber selection listeners
  container.querySelectorAll('[data-forge-chamber]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedForgeChamberId = btn.dataset.forgeChamber;
      renderForgeView(container);
    });
  });

  // Attach Forge Tier selection listeners
  container.querySelectorAll('[data-forge-tier]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedForgeTierNum = parseInt(btn.dataset.forgeTier, 10);
      renderForgeView(container);
    });
  });

  // Attach Enter Trial Battle listener
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
  const partyPower = gameState.getTotalPartyPower();
  const swarm = battle.currentSwarm || [];

  container.innerHTML = `
    <div class="trial-battle-container forge-battle-container flex flex-col gap-3 min-h-full text-white">
      
      <!-- Top Tactical Combat HUD -->
      <div class="combat-top-hud flex items-center justify-between p-3 rounded-2xl bg-slate-950/90 border border-orange-500/30 shadow-lg backdrop-blur-md" style="border-bottom: 2px solid ${chamber.color};">
        <div class="combat-hud-left flex items-center gap-2">
          <button id="btn-forge-flee" class="hud-flee-btn px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-black transition-all cursor-pointer" title="Surrender and return to anvils">
            ◀ Leave
          </button>
        </div>

        <div class="combat-vs-banner flex items-center gap-2">
          <span class="vs-ally-tag text-xs font-bold text-orange-300">${chamber.icon} ${chamber.name.toUpperCase()}</span>
          <span class="vs-center-tag text-[10px] text-slate-500">|</span>
          <span class="vs-enemy-tag text-xs font-black text-white">
            WAVE ${battle.currentWave}/3: ${battle.currentWave === 3 ? `TITAN: ${chamber.bossName.toUpperCase()}` : 'AUTOMATONS'}
          </span>
        </div>

        <div class="combat-hud-right">
          <span class="hud-speed-btn px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400">⚡ ${tier.energyCost}</span>
        </div>
      </div>

      <!-- Dynamic 2.5D Isometric Battlefield Area -->
      <div class="isometric-battlefield forge-battlefield relative overflow-hidden rounded-2xl border border-orange-500/30 bg-slate-950 shadow-2xl min-h-[300px] flex items-center justify-between p-3 sm:p-5" style="border-color: ${chamber.color}44;">
        
        <!-- 2.5D Isometric Canvas Viewport Layer (Pixi.js / Canvas Engine) -->
        <div id="arena-viewport-25d" class="arena-viewport-25d absolute inset-0 pointer-events-none z-0 rounded-2xl overflow-hidden"></div>

        <!-- Left Side: Seamless Allied Spirit Formation (Uncluttered) -->
        <div class="allied-formation-column seamless-allied-column relative z-10 flex flex-col gap-2">
          <div class="formation-header-label text-[10px] font-black uppercase tracking-widest text-orange-400">Allied Lineup</div>
          
          <div class="staggered-party-formation flex flex-col gap-3">
            ${party.map((spirit, idx) => {
              const species = SPIRIT_SPECIES[spirit.speciesId];
              const maxHp = spirit.maxHp || 100;
              const curHp = typeof spirit.currentHp === 'number' ? Math.max(0, spirit.currentHp) : maxHp;
              const hpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));
              const mpPct = Math.max(0, Math.min(100, Math.round(spirit.currentMp || 0)));
              const isUltReady = mpPct >= 100;
              const isFallen = spirit.isFallen || curHp <= 0;
              const shieldPct = spirit.shieldHp > 0 ? Math.min(100, Math.round((spirit.shieldHp / maxHp) * 100)) : 0;
              const sheetKey = getSheetKeyForSpecies(species ? species.id : null);
              const glyph = species ? (species.avatarEmoji || '✨') : '✨';

              return `
                <div class="seamless-battle-spirit ${isUltReady ? 'ult-ready' : ''} ${isFallen ? 'spirit-fallen' : ''}" id="forge-allied-slot-${idx}" style="--stagger-offset: ${idx % 2 === 1 ? '12px' : '0px'};">
                  <!-- Overhead Name & Level Only (Seamless) -->
                  <div class="seamless-overhead-tag">
                    <span class="seamless-spirit-name" title="${spirit.customName}">${spirit.customName}</span>
                    <span class="seamless-spirit-level">Lv.${spirit.level || 1}</span>
                  </div>

                  <!-- Animated Creature Sprite (No Box, No Border) -->
                  <div class="spirit-sprite-container seamless-sprite-container">
                    ${createAnimatedSpriteHtml(sheetKey, { glyph })}
                    ${isUltReady ? `<div class="ult-ready-tag" id="forge-ult-ready-${idx}">✨ ULT</div>` : ''}
                    ${isFallen ? '<div class="fallen-badge">KO</div>' : ''}
                    <div class="combat-ground-shadow"></div>
                  </div>

                  <!-- Slim Floating HP & MP Bars -->
                  <div class="spirit-hud-bars seamless-hud-bars">
                    <div class="hud-bar-hp">
                      <div class="hud-hp-fill" id="forge-spirit-hp-fill-${idx}" style="width: ${hpPct}%;"></div>
                      ${shieldPct > 0 ? `<div class="hud-shield-fill" id="forge-spirit-shield-fill-${idx}" style="width: ${shieldPct}%;"></div>` : ''}
                    </div>
                    <div class="hud-bar-mp">
                      <div class="hud-mp-fill" id="forge-spirit-mp-fill-${idx}" style="width: ${mpPct}%;"></div>
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

        <!-- Right Side: Wave Enemies (Seamless, Uncluttered) -->
        <div class="enemy-formation-column seamless-enemy-column relative z-10 flex flex-col gap-2 items-end">
          <div class="formation-header-label text-[10px] font-black uppercase tracking-widest text-orange-400">
            ${battle.currentWave === 3 ? `👑 TITAN: ${chamber.bossName.toUpperCase()}` : `FORGE AUTOMATONS (${swarm.filter(e => !e.isDefeated && e.hp > 0).length}/${swarm.length})`}
          </div>

          <div class="enemy-swarm-wrapper flex flex-col gap-3 items-end" id="forge-enemy-swarm-wrapper">
            ${swarm.map((em, sIdx) => {
              const isDead = em.isDefeated || em.hp <= 0;
              const maxHp = em.maxHp || 100;
              const curHp = typeof em.hp === 'number' ? Math.max(0, em.hp) : maxHp;
              const emHpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));

              return `
                <div class="seamless-enemy-slot ${em.isBoss ? 'boss-slot' : ''} ${isDead ? 'enemy-defeated' : ''}" id="forge-enemy-slot-${sIdx}" style="--stagger-offset: ${sIdx % 2 === 1 ? '-12px' : '0px'};">
                  <!-- Enemy Details & Floating Health Bar (Overhead, Borderless) -->
                  <div class="seamless-enemy-overhead">
                    <div class="seamless-enemy-name">
                      ${em.isBoss ? '<span class="boss-crown-badge">👑</span>' : ''}
                      <span>${em.name}</span>
                    </div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <div class="seamless-enemy-pwr">⚡ ${em.power.toLocaleString()} PWR</div>
                      ${em.shieldHp > 0 ? '<span class="px-1 py-0.2 rounded text-[8px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">🛡️ BARRIER</span>' : ''}
                      ${em.isEnraged ? '<span class="px-1 py-0.2 rounded text-[8px] font-black bg-red-600/30 text-red-300 border border-red-500/50 animate-pulse">🔥 ENRAGED</span>' : ''}
                    </div>

                    <div class="seamless-enemy-hp-track">
                      <div id="forge-enemy-hp-fill-${sIdx}" class="seamless-enemy-hp-fill" style="width: ${emHpPct}%;"></div>
                      ${em.shieldHp > 0 ? `<div class="seamless-enemy-shield-fill" style="width: ${Math.min(100, Math.round((em.shieldHp / (em.divineBarrierMax || (em.maxHp * 0.25) || 1)) * 100))}%;"></div>` : ''}
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

      <!-- Action Strike Command Strip -->
      <div class="combat-action-footer">
        <button id="btn-forge-strike" class="btn-main-attack min-h-[48px] w-full py-3 rounded-2xl font-black text-sm text-slate-950 transition-all cursor-pointer shadow-xl flex flex-col items-center justify-center" style="background: linear-gradient(135deg, ${chamber.color}, #d35400);">
          <span>⚔️ Forge Strike (Party Attack • Charges +10 MP)</span>
          <span class="btn-subtext text-[10px] font-bold opacity-80">Defeat Wave ${battle.currentWave}/3 to claim targeted ${chamber.name} Weapons</span>
        </button>
      </div>

    </div>
  `;

  // Initialize 2.5D Isometric Arena Viewport Engine
  const viewportEl = container.querySelector('#arena-viewport-25d');
  if (viewportEl) {
    arenaRenderer.init(viewportEl, { mode: 'forge', element: 'FIRE', chamberId: battle.chamberId });
  }

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
      if (typeof arenaRenderer?.triggerClashImpact === 'function') {
        arenaRenderer.triggerClashImpact(null, null, true);
      }
      arenaRenderer.spawnDamagePopup(null, null, Math.round(partyPower * 0.45));
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
    <div class="pantheon-victory-modal max-w-lg w-full rounded-2xl bg-slate-900 border overflow-hidden shadow-2xl text-white" style="border: 2px solid #e67e22;">
      <div class="victory-header p-4 flex items-center justify-between gap-3.5" style="background: linear-gradient(135deg, rgba(230, 126, 34, 0.4), #000);">
        <div class="flex items-center gap-3.5">
          <div class="victory-sigil text-4xl">🔨</div>
          <div class="victory-title-col">
            <span class="victory-sub text-[10px] font-black uppercase tracking-widest text-orange-400">FORGE CONQUERED</span>
            <h3 class="victory-name text-lg font-black text-white">${loot.chamber.name} Cleared!</h3>
            <span class="victory-tier-tag text-xs text-slate-300">${loot.tier.name}</span>
          </div>
        </div>
        <div class="victory-animated-chest-wrap">
          ${createAnimatedChestHtml()}
        </div>
      </div>

      <div class="victory-body p-4 flex flex-col gap-3">
        <div class="spoils-section-header text-[11px] font-black uppercase tracking-wider text-slate-400">TARGETED WEAPONS SMELTED:</div>

        <div class="awarded-items-grid grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto pr-1">
          ${loot.weapons.map(w => {
            const rarObj = EQUIPMENT_RARITIES[w.rarity] || EQUIPMENT_RARITIES.COMMON;
            return `
              <div class="awarded-item-card p-2.5 rounded-xl bg-slate-950/80 border flex flex-col gap-1" style="border-color: ${rarObj.border};">
                <div class="item-header-row flex items-center gap-2">
                  <div class="item-icon-frame flex items-center justify-center">${createAnimatedWeaponHtml(w, { extraClasses: 'loot-sprite-icon' })}</div>
                  <div class="item-name-col">
                    <div class="item-name text-xs font-black" style="color: ${rarObj.color};">${w.name}</div>
                    <span class="item-rarity-pill text-[10px] font-bold" style="color: ${rarObj.color};">${rarObj.name}</span>
                  </div>
                </div>
                <div class="item-stat-row text-[11px] text-slate-300 flex justify-between">
                  <span class="stat-name">ATK Power:</span>
                  <span class="stat-val font-bold text-amber-300">+${w.atkPower}</span>
                </div>
                <div class="item-stat-row text-[11px] text-slate-300 flex justify-between">
                  <span class="stat-name">Crit Rate:</span>
                  <span class="stat-val font-bold text-orange-400">+${w.critRate}%</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="victory-resources-row flex items-center gap-2 pt-2 border-t border-slate-800">
          <span class="res-reward-pill px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">💎 +${loot.shardsGained} Spirit Shards</span>
          <span class="res-reward-pill px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">🔮 +${loot.essenceGained} Soul Essence</span>
        </div>

        <button id="btn-claim-forge-loot" class="btn-claim-dungeon-loot min-h-[46px] w-full py-2.5 rounded-xl font-black text-xs text-slate-950 transition-all cursor-pointer shadow-lg" style="background: linear-gradient(135deg, #e67e22, #f39c12);">
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
    <div class="pantheon-victory-modal max-w-md w-full rounded-2xl bg-slate-900 border border-red-500/50 p-5 shadow-2xl text-white flex flex-col items-center text-center gap-3">
      <div class="text-3xl">💀</div>
      <div>
        <h3 class="text-base font-black text-red-400">HEAT OVERLOAD</h3>
        <p class="text-xs text-slate-400 mt-1">Party Fallen in Forge. Regroup and upgrade equipment to endure the flames.</p>
      </div>
      <button id="btn-forge-defeat-ok" class="btn-claim-dungeon-loot min-h-[44px] w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer">
        Return Safely
      </button>
    </div>
  `;

  modalRoot.appendChild(modalEl);
  modalEl.querySelector('#btn-forge-defeat-ok').addEventListener('click', () => {
    modalRoot.removeChild(modalEl);
    if (onClose) onClose();
  });
}
