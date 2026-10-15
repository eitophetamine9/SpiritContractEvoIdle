import { gameState } from '../../../state/gameState.js';
import { audioManager } from '../../../audio/audioManager.js';
import { ESSENCE_CHAMBERS, ESSENCE_DIFFICULTY_TIERS } from '../../../data/essenceDungeonData.js';
import { SPIRIT_SPECIES } from '../../../data/spiritsData.js';
import { createSpiritPlaceholderBox, createEnemyPlaceholderBox } from '../../components/pixelBox.js';
import { arenaRenderer } from '../../../render/arenaRenderer.js';
import { createAnimatedEnemyHtml, createAnimatedChestHtml, createAnimatedRelicHtml } from '../../../render/spriteAnimator.js';
import { triggerSpiritAttack, triggerEnemyFlinch, triggerEnemyAttack, triggerSpiritFlinch, triggerPartyStrikeExchange } from '../../../render/combatAnimator.js';

let isEssenceEventsBound = false;

export function renderDungeonSectionHtml(chamber, tier, canAfford, partyPower, selectedEssenceChamberId = "olympian_nexus", selectedEssenceTierNum = 1) {
  return `
    <div class="flex flex-col gap-3">
      
      <!-- Chamber Selection Cards -->
      <div class="essence-chambers-grid">
        ${ESSENCE_CHAMBERS.map(c => {
          const isSelected = c.id === selectedEssenceChamberId;
          return `
            <button class="essence-chamber-card ${isSelected ? 'active' : ''}" 
                    data-chamber-id="${c.id}"
                    style="--ch-color: ${c.color};">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 shadow-sm" style="background: ${c.color}22; border: 1px solid ${c.color};">
                ${c.icon}
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-white truncate">${c.name}</div>
                <div class="text-[10px] font-semibold truncate" style="color: ${c.accentColor};">${c.domain}</div>
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Active Selected Chamber Detail Stage -->
      <div class="essence-chamber-stage" style="border-color: ${chamber.color}66;">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-md shrink-0" style="background: ${chamber.color}25; border: 1.5px solid ${chamber.color};">
            ${chamber.icon}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <h3 class="text-sm font-extrabold text-white">${chamber.name}</h3>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider" style="background: ${chamber.color}33; color: ${chamber.accentColor}; border: 1px solid ${chamber.color}66;">
                ${chamber.domain}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-2">${chamber.desc}</p>
          </div>
        </div>

        <!-- Tier Selection Pills -->
        <div class="mb-3">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Sanctuary Difficulty:</div>
          <div class="essence-tier-grid">
            ${ESSENCE_DIFFICULTY_TIERS.map(t => {
              const isActive = t.tier === selectedEssenceTierNum;
              return `
                <button class="essence-tier-btn ${isActive ? 'active' : ''}" data-tier="${t.tier}">
                  <span class="text-[11px] font-extrabold text-white">Tier ${t.tier}</span>
                  <span class="text-[9px] font-bold text-amber-400 mt-0.5">⚡ ${t.energyCost}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Power & Launch Strip -->
        <div class="flex flex-col gap-2 pt-2.5 border-t border-slate-800">
          <div class="text-[11px] flex justify-between items-center text-slate-300">
            <span>Rec: <strong class="text-white">⚡ ${tier.recommendedPower.toLocaleString()}</strong></span>
            <span>Yield: <strong class="text-cyan-300">💠 ${tier.minGodEssences}–${tier.maxGodEssences}</strong></span>
          </div>

          <button id="btn-start-essence-trial" class="min-h-[44px] w-full py-2.5 px-4 rounded-xl font-extrabold text-xs text-slate-950 transition-all cursor-pointer shadow-md disabled:opacity-50" style="background: linear-gradient(135deg, ${chamber.color}, ${chamber.accentColor});" ${canAfford ? '' : 'disabled'}>
            ${canAfford ? `⚔️ Challenge 3-Wave Trial (⚡ ${tier.energyCost})` : `⚠️ Need ⚡ ${tier.energyCost} Energy`}
          </button>
        </div>
      </div>

    </div>
  `;
}


export function bindDungeonEvents(container, stateObj = {}, callbacks = {}) {
  container.querySelectorAll('.essence-chamber-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (callbacks.onSelectChamber) callbacks.onSelectChamber(e.currentTarget.getAttribute('data-chamber-id'));
      if (callbacks.onRefresh) callbacks.onRefresh();
    });
  });

  container.querySelectorAll('.essence-tier-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (callbacks.onSelectTier) callbacks.onSelectTier(parseInt(e.currentTarget.getAttribute('data-tier'), 10));
      if (callbacks.onRefresh) callbacks.onRefresh();
    });
  });

  container.querySelector('#btn-start-essence-trial')?.addEventListener('click', () => {
    try {
      gameState.startDungeonTrial('essence', stateObj.chamberId || 'olympian_nexus', stateObj.tierNum || 1);
      if (callbacks.onRefresh) callbacks.onRefresh();
    } catch (err) {
      alert(err.message);
    }
  });
}


export function renderEssenceBattleArena(container, battle, callbacks = {}) {
  const chamber = ESSENCE_CHAMBERS.find(c => c.id === battle.chamberId) || ESSENCE_CHAMBERS[0];
  const tierObj = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === battle.tier) || ESSENCE_DIFFICULTY_TIERS[0];
  const party = gameState.getPartySpirits();
  const partyPower = gameState.getTotalPartyPower();
  const swarm = battle.currentSwarm || [];
  const livingEnemies = swarm.filter(e => !e.isDefeated && e.hp > 0);

  container.innerHTML = `
    <div class="trial-battle-container flex flex-col gap-2.5 min-h-full text-white">
      
      <!-- Top Combat HUD Header -->
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 shadow-md backdrop-blur-md" style="border-color: ${chamber.color}66;">
        <div class="flex items-center gap-2">
          <span class="text-xl">${chamber.icon}</span>
          <div>
            <div class="text-[9px] font-black uppercase tracking-wider" style="color: ${chamber.accentColor};">${chamber.name}</div>
            <div class="text-xs font-black text-white">${tierObj.name} • Wave ${battle.currentWave}/3</div>
          </div>
        </div>

        <button id="btn-leave-essence-battle" class="min-h-[36px] px-3 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-[11px] font-bold transition-all cursor-pointer" title="Forfeit Battle">
          ✕ Forfeit
        </button>
      </div>

      <!-- Dynamic 2.5D Isometric Battlefield Area -->
      <div class="isometric-battlefield pantheon-battlefield relative overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-950 shadow-xl min-h-[280px] flex items-center justify-between p-3" style="border-color: ${chamber.color}44;">
        
        <!-- 2.5D Isometric Canvas Viewport Layer -->
        <div id="arena-viewport-25d" class="arena-viewport-25d absolute inset-0 pointer-events-none z-0 rounded-xl overflow-hidden"></div>

        <!-- Left Side: Seamless Allied Spirit Formation (Uncluttered) -->
        <div class="allied-formation-column seamless-allied-column relative z-10 flex flex-col gap-2">
          <div class="formation-header-label text-[10px] font-black uppercase tracking-widest text-cyan-400">Allied Lineup</div>
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
                <div class="seamless-battle-spirit ${isUltReady ? 'ult-ready' : ''} ${isFallen ? 'spirit-fallen' : ''}" id="essence-allied-slot-${idx}" style="--stagger-offset: ${idx % 2 === 1 ? '12px' : '0px'};">
                  <!-- Overhead Name & Level Only (Seamless) -->
                  <div class="seamless-overhead-tag">
                    <span class="seamless-spirit-name" title="${spirit.customName}">${spirit.customName}</span>
                    <span class="seamless-spirit-level">Lv.${spirit.level || 1}</span>
                  </div>

                  <!-- Animated Creature Sprite (No Box, No Border) -->
                  <div class="spirit-sprite-container seamless-sprite-container">
                    ${createAnimatedSpriteHtml(sheetKey, { glyph })}
                    ${isUltReady ? `<div class="ult-ready-tag" id="essence-ult-ready-${idx}">✨ ULT</div>` : ''}
                    ${isFallen ? '<div class="fallen-badge">KO</div>' : ''}
                    <div class="combat-ground-shadow"></div>
                  </div>

                  <!-- Slim Floating HP & MP Bars -->
                  <div class="spirit-hud-bars seamless-hud-bars">
                    <div class="hud-bar-hp">
                      <div class="hud-hp-fill" id="essence-spirit-hp-fill-${idx}" style="width: ${hpPct}%;"></div>
                      ${shieldPct > 0 ? `<div class="hud-shield-fill" id="essence-spirit-shield-fill-${idx}" style="width: ${shieldPct}%;"></div>` : ''}
                    </div>
                    <div class="hud-bar-mp">
                      <div class="hud-mp-fill" id="essence-spirit-mp-fill-${idx}" style="width: ${mpPct}%;"></div>
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
          <div class="formation-header-label text-[10px] font-black uppercase tracking-widest text-red-400">
            ${battle.currentWave === 3 ? '👑 BOSS AVATAR' : `GUARDIANS (${livingEnemies.length}/${swarm.length})`}
          </div>
          <div class="enemy-swarm-wrapper flex flex-col gap-3 items-end" id="essence-enemy-swarm-wrapper">
            ${swarm.map((em, sIdx) => {
              const isDead = em.isDefeated || em.hp <= 0;
              const maxHp = em.maxHp || 100;
              const curHp = typeof em.hp === 'number' ? Math.max(0, em.hp) : maxHp;
              const emHpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));

              return `
                <div class="seamless-enemy-slot ${em.isBoss ? 'boss-slot' : ''} ${isDead ? 'enemy-defeated' : ''}" id="essence-enemy-slot-${sIdx}" style="--stagger-offset: ${sIdx % 2 === 1 ? '-12px' : '0px'};">
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
                      <div id="essence-enemy-hp-fill-${sIdx}" class="seamless-enemy-hp-fill" style="width: ${emHpPct}%;"></div>
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

      <!-- Victory / Defeat Banners -->
      ${battle.status === 'victory' && battle.loot ? `
        <div class="rounded-xl border border-amber-400/60 bg-slate-900 p-3 shadow-xl flex items-center justify-between gap-3">
          <div class="flex flex-col text-left gap-1">
            <div class="text-xs font-black text-amber-300">🏆 SANCTUM TRIAL CLEARED!</div>
            <div class="text-[11px] text-slate-300">
              Earned: <strong class="text-cyan-300">+${battle.loot.godEssencesGained} Essences</strong>, 
              <strong class="text-emerald-300">+${battle.loot.shardsGained} Shards</strong>
            </div>
            <button id="btn-collect-essence-loot" class="min-h-[34px] px-4 py-1.5 rounded-lg font-bold text-xs text-slate-950 cursor-pointer shadow bg-gradient-to-r from-cyan-400 to-emerald-300 mt-1">
              Collect Spoils to Sanctum
            </button>
          </div>
          <div class="victory-animated-chest-wrap">
            ${createAnimatedChestHtml()}
          </div>
        </div>
      ` : ''}

      ${battle.status === 'defeat' ? `
        <div class="rounded-xl border border-red-500/40 bg-slate-900 p-3 flex flex-col items-center text-center gap-1.5">
          <div class="text-xs font-black text-red-400">☠️ TRIAL FAILED</div>
          <button id="btn-leave-essence-battle" class="min-h-[38px] w-full py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">
            Return to Sanctum
          </button>
        </div>
      ` : ''}

      <!-- Attack Strike Footer -->
      ${battle.status === 'active' ? `
        <div class="combat-action-footer">
          <button id="btn-essence-strike" class="btn-main-attack min-h-[44px] w-full py-2.5 rounded-xl font-extrabold text-xs text-slate-950 transition-all cursor-pointer shadow-lg bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 flex flex-col items-center justify-center">
            <span>⚔️ Divine Strike (Party Attack • Charges +10 MP)</span>
            <span class="text-[9px] font-bold opacity-80">Wave ${battle.currentWave}/3 • ⚡ ${partyPower.toLocaleString()} PWR</span>
          </button>
        </div>
      ` : ''}

    </div>
  `;

  // Initialize 2.5D Isometric Arena Viewport Engine
  const viewportEl = container.querySelector('#arena-viewport-25d');
  if (viewportEl) {
    arenaRenderer.init(viewportEl, { mode: 'sanctuary', element: 'WATER', chamberId: battle.chamberId });
  }

  // Event Listeners
  container.querySelector('#btn-essence-strike')?.addEventListener('click', () => {
    gameState.manualDungeonStrike();
    if (typeof arenaRenderer?.triggerClashImpact === 'function') {
      arenaRenderer.triggerClashImpact(null, null, true);
    }
    arenaRenderer.spawnDamagePopup(null, null, Math.round(partyPower * 0.45));
    if (callbacks.onRefresh) callbacks.onRefresh();;
    triggerPartyStrikeExchange(container);
  });

  // Hook essence sanctuary combat strike and flinch animations
  if (!isEssenceEventsBound) {
    isEssenceEventsBound = true;
    gameState.subscribe((eventType, payload) => {
      if (typeof document === 'undefined') return;
      const currentContainer = document.querySelector('#view-container');
      if (!currentContainer) return;
      const hasEssence = !!currentContainer.querySelector('#essence-enemy-swarm-wrapper');
      if (!hasEssence) return;

      if (eventType === 'combatStrike' && payload.zone === 'dungeon') {
        if (payload.attackerType === 'spirit') {
          const party = gameState.getPartySpirits();
          const spiritIdx = party.findIndex(s => s && s.id === payload.spirit?.id);
          const slot = (spiritIdx >= 0) ? currentContainer.querySelector(`#essence-allied-slot-${spiritIdx}`) : currentContainer.querySelector('.seamless-battle-spirit:not(.spirit-fallen)');
          if (slot) triggerSpiritAttack(slot);

          const leadEnemy = currentContainer.querySelector('.seamless-enemy-slot:not(.enemy-defeated)');
          if (leadEnemy) triggerEnemyFlinch(leadEnemy);
        } else if (payload.attackerType === 'enemy') {
          const enemySlot = currentContainer.querySelector('.seamless-enemy-slot:not(.enemy-defeated)');
          if (enemySlot) triggerEnemyAttack(enemySlot);

          if (payload.targetSpirit) {
            const party = gameState.getPartySpirits();
            const spiritIdx = party.findIndex(s => s && s.id === payload.targetSpirit.id);
            const spiritSlot = (spiritIdx >= 0) ? currentContainer.querySelector(`#essence-allied-slot-${spiritIdx}`) : currentContainer.querySelector('.seamless-battle-spirit:not(.spirit-fallen)');
            if (spiritSlot) triggerSpiritFlinch(spiritSlot);
          }
        }
      } else if (eventType === 'manualPartyStrike' && payload.zone === 'dungeon') {
        triggerPartyStrikeExchange(currentContainer);
      }
    });
  }

  container.querySelector('#btn-leave-essence-battle')?.addEventListener('click', () => {
    gameState.exitDungeonBattle();
    if (callbacks.onRefresh) callbacks.onRefresh();;
  });

  container.querySelector('#btn-collect-essence-loot')?.addEventListener('click', () => {
    gameState.exitDungeonBattle();
    if (callbacks.onRefresh) callbacks.onRefresh();;
  });
}

